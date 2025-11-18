import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { processSingleCV } from "./processCv";
import {
  processInvitation,
  cleanupExpiredInvitations,
  acceptInvitation,
} from "./inviteUser";

// Initialize Firebase Admin
admin.initializeApp();

// ============================================================================
// TEAM INVITATION FUNCTIONS (MULTI-TENANT RBAC)
// ============================================================================

/**
 * Process new team invitations
 * Triggered when invitation document is created
 */
export const onInvitationCreated = processInvitation;

/**
 * Clean up expired invitations
 * Runs daily via Cloud Scheduler
 */
export const dailyInvitationCleanup = cleanupExpiredInvitations;

/**
 * Accept team invitation
 * Called via HTTP from client
 */
export const acceptTeamInvitation = acceptInvitation;

// ============================================================================
// CV PROCESSING FUNCTIONS
// ============================================================================

/**
 * Cloud Function triggered when a CV is uploaded to Firebase Storage
 * Triggers on: gs://YOUR_BUCKET/cvs/{userId}/{filename}
 */
export const onCVUpload = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max is 540s for gen1 functions)
    memory: "1GB",
  })
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name;

    // Only process files in the cvs folder
    if (!filePath || !filePath.startsWith("cvs/")) {
      functions.logger.info("Skipping non-CV file", { filePath });
      return null;
    }

    // Avoid infinite loops - skip if file was already processed
    if (object.metadata?.processed === "true") {
      functions.logger.info("File already processed, skipping", { filePath });
      return null;
    }

    functions.logger.info("CV upload detected, starting processing", {
      filePath,
      contentType: object.contentType,
      size: object.size,
      timeCreated: object.timeCreated,
    });

    try {
      await processSingleCV(object);
      return null;
    } catch (error: any) {
      functions.logger.error("CV processing pipeline failed", {
        filePath,
        error: error.message,
        stack: error.stack,
      });

      // Don't throw - we've already logged to Firestore
      return null;
    }
  });

/**
 * Manual trigger to reprocess a failed CV
 * Call with: firebase functions:call reprocessCV --data '{"cvId":"DOCUMENT_ID"}'
 */
export const reprocessCV = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const cvId = data.cvId;
  if (!cvId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "cvId is required"
    );
  }

  const db = admin.firestore();
  const cvDoc = await db.collection("cvs").doc(cvId).get();

  if (!cvDoc.exists) {
    throw new functions.https.HttpsError("not-found", "CV document not found");
  }

  const cvData = cvDoc.data();

  // Verify user owns this CV
  if (cvData?.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User does not own this CV"
    );
  }

  const storagePath = cvData?.storagePath;
  if (!storagePath) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "CV has no storage path"
    );
  }

  functions.logger.info("Manual reprocess triggered", {
    cvId,
    userId: context.auth.uid,
    storagePath,
  });

  try {
    // Get file metadata
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [metadata] = await file.getMetadata();

    await processSingleCV(metadata as functions.storage.ObjectMetadata);

    return {
      success: true,
      message: "CV reprocessing completed successfully",
    };
  } catch (error: any) {
    functions.logger.error("Manual reprocess failed", {
      cvId,
      error: error.message,
    });

    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Scheduled function to process any stuck CVs
 * Runs every hour to catch any CVs that failed processing
 */
export const processStuckCVs = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (context) => {
    functions.logger.info("Starting stuck CV processing job");

    const db = admin.firestore();

    // Find CVs that have been in "processing" state for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const stuckCVs = await db
      .collection("cvs")
      .where("status", "==", "processing")
      .where("processingStartedAt", "<", thirtyMinutesAgo)
      .limit(50)
      .get();

    if (stuckCVs.empty) {
      functions.logger.info("No stuck CVs found");
      return null;
    }

    functions.logger.info(`Found ${stuckCVs.size} stuck CVs, reprocessing...`);

    let processed = 0;
    let failed = 0;

    for (const doc of stuckCVs.docs) {
      const cvData = doc.data();
      const storagePath = cvData.storagePath;

      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);
        const [metadata] = await file.getMetadata();

        await processSingleCV(metadata as functions.storage.ObjectMetadata);
        processed++;
      } catch (error: any) {
        functions.logger.error("Failed to reprocess stuck CV", {
          cvId: doc.id,
          error: error.message,
        });
        failed++;
      }
    }

    functions.logger.info("Stuck CV processing job completed", {
      total: stuckCVs.size,
      processed,
      failed,
    });

    return null;
  });

/**
 * HTTP endpoint to get processing statistics
 * GET /api/stats
 */
export const getProcessingStats = functions.https.onRequest(
  async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const db = admin.firestore();

      // Get counts for each status
      const [pending, processing, indexed, failed] = await Promise.all([
        db.collection("cvs").where("status", "==", "pending").count().get(),
        db.collection("cvs").where("status", "==", "processing").count().get(),
        db.collection("cvs").where("status", "==", "indexed").count().get(),
        db.collection("cvs").where("status", "==", "error").count().get(),
      ]);

      const stats = {
        pending: pending.data().count,
        processing: processing.data().count,
        indexed: indexed.data().count,
        failed: failed.data().count,
        total:
          pending.data().count +
          processing.data().count +
          indexed.data().count +
          failed.data().count,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(stats);
    } catch (error: any) {
      functions.logger.error("Failed to get stats", { error: error.message });
      res.status(500).json({ error: "Failed to retrieve statistics" });
    }
  }
);
