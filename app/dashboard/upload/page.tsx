"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CVUpload, { FileWithStatus } from "@/components/CVUpload";
import { uploadCV, UploadProgress } from "@/lib/storage";
import { createCVDocument } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  const updateFileProgress = useCallback(
    (fileId: string, progress: UploadProgress) => {
      setSelectedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: progress.status,
                progress: progress.progress,
                error: progress.error,
              }
            : f
        )
      );
    },
    []
  );

  const uploadSingleFile = async (fileWithStatus: FileWithStatus): Promise<boolean> => {
    if (!user) return false;

    try {
      // Upload to Storage
      const { storagePath, downloadURL } = await uploadCV(
        fileWithStatus.file,
        user.uid,
        (progress) => updateFileProgress(fileWithStatus.id, progress)
      );

      // Create Firestore document
      await createCVDocument({
        userId: user.uid,
        storagePath,
        filename: fileWithStatus.file.name,
        uploadedAt: Timestamp.now(),
        status: "pending",
        fileSize: fileWithStatus.file.size,
        fileType: fileWithStatus.file.type,
        downloadURL,
      });

      return true;
    } catch (error: any) {
      updateFileProgress(fileWithStatus.id, {
        progress: 0,
        bytesTransferred: 0,
        totalBytes: fileWithStatus.file.size,
        status: "error",
        error: error.message || "Upload failed",
      });
      return false;
    }
  };

  const uploadBatch = async (batch: FileWithStatus[]): Promise<void> => {
    const results = await Promise.allSettled(
      batch.map((file) => uploadSingleFile(file))
    );

    const completed = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value === false)
    ).length;

    setUploadStats((prev) => ({
      ...prev,
      completed: prev.completed + completed,
      failed: prev.failed + failed,
    }));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadStats({
      total: selectedFiles.length,
      completed: 0,
      failed: 0,
    });

    try {
      // Process files in batches of 10
      const batchSize = 10;
      const batches: FileWithStatus[][] = [];

      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        batches.push(selectedFiles.slice(i, i + batchSize));
      }

      // Upload batches sequentially
      for (const batch of batches) {
        await uploadBatch(batch);
      }

      const successCount = uploadStats.completed + selectedFiles.length - uploadStats.failed;
      const failedCount = uploadStats.failed;

      if (failedCount === 0) {
        toast.success(`Successfully uploaded ${successCount} CV(s)!`, {
          duration: 5000,
        });
      } else {
        toast.success(
          `Uploaded ${successCount} CV(s). ${failedCount} failed.`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = () => {
    if (isUploading) {
      toast.error("Cannot clear files while upload is in progress");
      return;
    }

    setSelectedFiles([]);
    setUploadStats({ total: 0, completed: 0, failed: 0 });
    toast.success("All files cleared");
  };

  const handleStartOver = () => {
    setSelectedFiles([]);
    setUploadStats({ total: 0, completed: 0, failed: 0 });
  };

  const pendingFiles = selectedFiles.filter((f) => f.status === "pending");
  const uploadedFiles = selectedFiles.filter((f) => f.status === "success");
  const failedFiles = selectedFiles.filter((f) => f.status === "error");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">
                  Vocaify
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/upload"
                  className="text-sm font-semibold text-primary-600"
                >
                  Upload
                </Link>
                <Link
                  href="/dashboard/search"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Search
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload CVs</h1>
          <p className="text-gray-600">
            Upload your CV database to start searching with AI-powered natural language
            queries.
          </p>
        </div>

        {/* Upload Component */}
        <CVUpload
          onFilesSelected={setSelectedFiles}
          selectedFiles={selectedFiles}
          isUploading={isUploading}
        />

        {/* Upload Stats */}
        {isUploading && uploadStats.total > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Progress</h3>
              <span className="text-sm text-gray-600">
                {uploadStats.completed + uploadStats.failed} / {uploadStats.total}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((uploadStats.completed + uploadStats.failed) / uploadStats.total) * 100
                  }%`,
                }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{uploadStats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{uploadStats.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">
                  {uploadStats.total - uploadStats.completed - uploadStats.failed}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {selectedFiles.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpload}
              disabled={isUploading || pendingFiles.length === 0}
              className="flex-1 px-8 py-4 bg-primary hover:bg-primary-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isUploading
                ? "Uploading..."
                : `Upload ${selectedFiles.filter((f) => f.status === "pending").length} CV(s)`}
            </button>

            {!isUploading && (
              <button
                onClick={handleClearAll}
                className="px-8 py-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Upload Complete Summary */}
        {!isUploading &&
          uploadStats.total > 0 &&
          uploadStats.completed + uploadStats.failed === uploadStats.total && (
            <div className="mt-8 bg-white rounded-xl border-2 border-primary-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary-100">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h3>
              <p className="text-gray-600 mb-6">
                Successfully uploaded {uploadStats.completed} CV(s)
                {uploadStats.failed > 0 && `. ${uploadStats.failed} failed.`}
              </p>

              <div className="flex gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-primary hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-all"
                >
                  Upload More
                </button>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
