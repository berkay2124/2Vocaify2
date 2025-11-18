import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as functions from "firebase-functions";

/**
 * Extract text from a PDF buffer
 * @param buffer - PDF file buffer
 * @returns Extracted text content
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    functions.logger.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

/**
 * Extract text from a DOCX buffer
 * @param buffer - DOCX file buffer
 * @returns Extracted text content
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    functions.logger.error("DOCX extraction error:", error);
    throw new Error(`Failed to extract text from DOCX: ${error}`);
  }
}

/**
 * Extract text from CV file based on content type
 * @param buffer - File buffer
 * @param contentType - MIME type of the file
 * @returns Extracted text content
 */
export async function extractTextFromCV(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  functions.logger.info(`Extracting text from file type: ${contentType}`);

  let text = "";

  switch (contentType) {
    case "application/pdf":
      text = await extractPdfText(buffer);
      break;

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      text = await extractDocxText(buffer);
      break;

    case "application/msword":
      // DOC files (older Word format)
      text = await extractDocxText(buffer);
      break;

    default:
      throw new Error(`Unsupported file type: ${contentType}`);
  }

  // Clean up extracted text
  text = text
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
    .trim();

  if (!text || text.length < 50) {
    throw new Error("Extracted text is too short or empty");
  }

  functions.logger.info(
    `Text extraction successful. Length: ${text.length} characters`
  );

  return text;
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum allowed size in MB
 * @returns true if valid, throws error otherwise
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (size > maxSizeBytes) {
    throw new Error(
      `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${maxSizeMB}MB`
    );
  }

  return true;
}
