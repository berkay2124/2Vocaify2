import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { extractTextFromCV, validateFileSize } from "./extractText";
import { extractCVDataWithAI } from "./openai";

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 * @param fn - Async function to execute
 * @param retries - Number of retries remaining
 * @returns Result of function execution
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      functions.logger.warn(
        `Operation failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
        { error }
      );
      await sleep(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Process a single CV file
 * @param object - Storage object metadata
 */
export async function processSingleCV(
  object: functions.storage.ObjectMetadata
): Promise<void> {
  const filePath = object.name;
  const contentType = object.contentType;
  const size = parseInt(object.size || "0");

  if (!filePath || !contentType) {
    functions.logger.error("Invalid file metadata", { filePath, contentType });
    return;
  }

  functions.logger.info("Processing CV file", {
    filePath,
    contentType,
    size: `${(size / 1024 / 1024).toFixed(2)}MB`,
  });

  // Extract userId and filename from path: cvs/{userId}/{filename}
  const pathParts = filePath.split("/");
  if (pathParts.length !== 3 || pathParts[0] !== "cvs") {
    functions.logger.error("Invalid file path format", { filePath });
    return;
  }

  const userId = pathParts[1];
  const filename = pathParts[2];

  // Find the Firestore document for this CV
  const db = admin.firestore();
  const cvQuery = await db
    .collection("cvs")
    .where("userId", "==", userId)
    .where("storagePath", "==", filePath)
    .limit(1)
    .get();

  if (cvQuery.empty) {
    functions.logger.error("No Firestore document found for CV", { filePath });
    return;
  }

  const cvDoc = cvQuery.docs[0];
  const cvDocRef = cvDoc.ref;

  try {
    // Validate file size
    validateFileSize(size, 10);

    // Update status to processing
    await cvDocRef.update({
      status: "processing",
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Download file from Storage
    functions.logger.info("Downloading file from Storage", { filePath });
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [buffer] = await file.download();

    functions.logger.info("File downloaded", {
      bufferSize: `${(buffer.length / 1024).toFixed(2)}KB`,
    });

    // Extract text with retry
    const extractedText = await withRetry(async () => {
      return extractTextFromCV(buffer, contentType);
    });

    functions.logger.info("Text extraction completed", {
      textLength: extractedText.length,
    });

    // Process with OpenAI with retry
    const extractedData = await withRetry(async () => {
      return extractCVDataWithAI(extractedText, filename);
    });

    functions.logger.info("OpenAI processing completed", {
      candidateName: extractedData.name,
    });

    // Update Firestore document with extracted data
    await cvDocRef.update({
      status: "indexed",
      extractedData: extractedData,
      extractedText: extractedText.substring(0, 5000), // Store first 5000 chars
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      embedding: null, // Will be populated in Phase 6
      errorMessage: admin.firestore.FieldValue.delete(),
    });

    functions.logger.info("CV processing completed successfully", {
      userId,
      filename,
      candidateName: extractedData.name,
    });
  } catch (error: any) {
    functions.logger.error("CV processing failed", {
      userId,
      filename,
      error: error.message,
      stack: error.stack,
    });

    // Update Firestore document with error
    await cvDocRef.update({
      status: "error",
      errorMessage: error.message || "Unknown error occurred",
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Re-throw error for monitoring
    throw error;
  }
}

/**
 * Batch process multiple CVs with concurrency control
 * @param cvPaths - Array of CV file paths to process
 * @param concurrency - Number of concurrent operations
 */
export async function batchProcessCVs(
  cvPaths: string[],
  concurrency: number = 10
): Promise<void> {
  functions.logger.info("Starting batch CV processing", {
    totalCVs: cvPaths.length,
    concurrency,
  });

  const results: Array<{ path: string; success: boolean; error?: string }> = [];

  // Process in batches
  for (let i = 0; i < cvPaths.length; i += concurrency) {
    const batch = cvPaths.slice(i, i + concurrency);

    functions.logger.info(`Processing batch ${i / concurrency + 1}`, {
      batchSize: batch.length,
    });

    const batchResults = await Promise.allSettled(
      batch.map(async (path) => {
        const bucket = admin.storage().bucket();
        const file = bucket.file(path);
        const [metadata] = await file.getMetadata();

        return processSingleCV(metadata as functions.storage.ObjectMetadata);
      })
    );

    // Collect results
    batchResults.forEach((result, index) => {
      const path = batch[index];
      if (result.status === "fulfilled") {
        results.push({ path, success: true });
      } else {
        results.push({
          path,
          success: false,
          error: result.reason?.message || "Unknown error",
        });
      }
    });
  }

  // Log summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  functions.logger.info("Batch processing completed", {
    total: cvPaths.length,
    successful,
    failed,
    successRate: `${((successful / cvPaths.length) * 100).toFixed(1)}%`,
  });

  if (failed > 0) {
    functions.logger.warn("Some CVs failed to process", {
      failedCVs: results.filter((r) => !r.success),
    });
  }
}
