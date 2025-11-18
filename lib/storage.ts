import { storage } from "./firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
  deleteObject,
} from "firebase/storage";

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  status: "uploading" | "paused" | "success" | "error" | "canceled";
  error?: string;
}

/**
 * Upload a CV file to Firebase Storage with multi-tenant support
 * @param file - The file to upload
 * @param userId - The authenticated user's ID
 * @param organizationId - The user's organization ID
 * @param onProgress - Callback for upload progress updates
 * @returns Promise resolving to the storage path and download URL
 */
export async function uploadCV(
  file: File,
  userId: string,
  organizationId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ storagePath: string; downloadURL: string }> {
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${timestamp}_${sanitizedFilename}`;

  // Multi-tenant path structure: /cvs/{orgId}/{userId}/{filename}
  const storagePath = `cvs/${organizationId}/${userId}/${filename}`;

  // Create storage reference
  const storageRef = ref(storage, storagePath);

  // Create upload task with metadata (required by storage rules)
  const metadata = {
    contentType: file.type,
    customMetadata: {
      organizationId, // Required by storage rules
      uploadedBy: userId, // Required by storage rules
      uploadedAt: new Date().toISOString(),
      originalFilename: file.name,
      fileSize: file.size.toString(),
    },
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Progress callback
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        if (onProgress) {
          onProgress({
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            status: "uploading",
          });
        }
      },
      (error) => {
        // Error callback
        console.error("Upload error:", error);

        if (onProgress) {
          onProgress({
            progress: 0,
            bytesTransferred: 0,
            totalBytes: file.size,
            status: "error",
            error: error.message,
          });
        }

        reject(error);
      },
      async () => {
        // Success callback
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          if (onProgress) {
            onProgress({
              progress: 100,
              bytesTransferred: file.size,
              totalBytes: file.size,
              status: "success",
            });
          }

          resolve({ storagePath, downloadURL });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Delete a CV file from Firebase Storage
 * @param storagePath - The path to the file in storage
 */
export async function deleteCV(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
}

/**
 * Validate file type (PDF or DOCX only)
 * @param file - The file to validate
 * @returns true if valid, false otherwise
 */
export function validateFileType(file: File): boolean {
  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  // Also check file extension as fallback
  const validExtensions = [".pdf", ".docx", ".doc"];
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  return validTypes.includes(file.type) || hasValidExtension;
}

/**
 * Validate file size (max 10MB)
 * @param file - The file to validate
 * @returns true if valid, false otherwise
 */
export function validateFileSize(file: File): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  return file.size <= maxSize;
}

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
