"use client";

import { useState, useCallback, useRef } from "react";
import { validateFileType, validateFileSize, formatFileSize } from "@/lib/storage";
import toast from "react-hot-toast";

export interface FileWithStatus {
  file: File;
  id: string;
  status: "pending" | "uploading" | "paused" | "success" | "error" | "canceled";
  progress: number;
  error?: string;
}

interface CVUploadProps {
  onFilesSelected: (files: FileWithStatus[]) => void;
  selectedFiles: FileWithStatus[];
  isUploading: boolean;
}

export default function CVUpload({
  onFilesSelected,
  selectedFiles,
  isUploading,
}: CVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Check file type
      if (!validateFileType(file)) {
        errors.push(`${file.name}: Invalid file type. Only PDF and DOCX are allowed.`);
        continue;
      }

      // Check file size
      if (!validateFileSize(file)) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      // Check for duplicates in current selection
      const isDuplicate = selectedFiles.some((f) => f.file.name === file.name);
      if (isDuplicate) {
        errors.push(`${file.name}: File already selected.`);
        continue;
      }

      validFiles.push(file);
    }

    // Show errors as toast notifications
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error, { duration: 5000 }));
    }

    return validFiles;
  }, [selectedFiles]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = validateFiles(fileArray);

      if (validFiles.length === 0) return;

      // Convert to FileWithStatus
      const filesWithStatus: FileWithStatus[] = validFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        status: "pending" as const,
        progress: 0,
      }));

      onFilesSelected([...selectedFiles, ...filesWithStatus]);

      toast.success(`${validFiles.length} file(s) added successfully`);
    },
    [validateFiles, selectedFiles, onFilesSelected]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handleFiles]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileId: string) => {
    if (isUploading) {
      toast.error("Cannot remove files while upload is in progress");
      return;
    }

    const updatedFiles = selectedFiles.filter((f) => f.id !== fileId);
    onFilesSelected(updatedFiles);
    toast.success("File removed");
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
          ${
            isDragging
              ? "border-primary-500 bg-primary-50 scale-[1.02]"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
          }
          ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={!isUploading ? handleBrowseClick : undefined}
        role="button"
        aria-label="Upload CV files"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
          aria-label="File input"
        />

        <div className="flex flex-col items-center gap-4">
          {/* Upload Icon */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isDragging ? "bg-primary-100" : "bg-gray-100"
            }`}
          >
            <svg
              className={`w-10 h-10 transition-colors ${
                isDragging ? "text-primary-600" : "text-gray-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {isDragging ? "Drop files here" : "Drag & drop your CVs here"}
            </p>
            <p className="text-sm text-gray-500">
              or{" "}
              <span className="text-primary-600 font-medium hover:text-primary-700">
                browse files
              </span>
            </p>
          </div>

          {/* File Requirements */}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>✓ Supported formats: PDF, DOCX, DOC</p>
            <p>✓ Maximum file size: 10MB per file</p>
            <p>✓ Upload up to 1000 CVs at once</p>
          </div>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {selectedFiles.map((fileWithStatus) => (
              <div
                key={fileWithStatus.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* File Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileWithStatus.file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(fileWithStatus.file.size)}
                      </p>

                      {/* Progress Bar */}
                      {fileWithStatus.status === "uploading" && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Uploading...</span>
                            <span>{Math.round(fileWithStatus.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${fileWithStatus.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {fileWithStatus.status === "error" && (
                        <p className="text-xs text-red-600 mt-1">
                          {fileWithStatus.error || "Upload failed"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Remove Button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status Icon */}
                    {fileWithStatus.status === "success" && (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600"
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
                    )}

                    {fileWithStatus.status === "error" && (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Remove Button */}
                    {fileWithStatus.status !== "uploading" && (
                      <button
                        onClick={() => removeFile(fileWithStatus.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Remove file"
                        disabled={isUploading}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
