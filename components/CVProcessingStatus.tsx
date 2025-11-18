"use client";

import { useCVStatus } from "@/hooks/useCVStatus";

interface CVProcessingStatusProps {
  userId: string;
}

/**
 * Display CV processing status with real-time updates
 */
export default function CVProcessingStatus({ userId }: CVProcessingStatusProps) {
  const { status, progressPercentage, statusMessage, isLoading } = useCVStatus(userId);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  if (status.total === 0) {
    return null; // Don't show if no CVs
  }

  const isProcessing = status.pending > 0 || status.processing > 0;
  const hasErrors = status.error > 0;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isProcessing
          ? "bg-blue-50 border-blue-200"
          : hasErrors
          ? "bg-yellow-50 border-yellow-200"
          : "bg-green-50 border-green-200"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Status Icon */}
          {isProcessing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          ) : hasErrors ? (
            <svg
              className="w-4 h-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}

          <span
            className={`text-sm font-medium ${
              isProcessing
                ? "text-blue-900"
                : hasErrors
                ? "text-yellow-900"
                : "text-green-900"
            }`}
          >
            {statusMessage}
          </span>
        </div>

        <span
          className={`text-sm font-semibold ${
            isProcessing
              ? "text-blue-700"
              : hasErrors
              ? "text-yellow-700"
              : "text-green-700"
          }`}
        >
          {progressPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}

      {/* Error Details */}
      {hasErrors && (
        <div className="mt-2 text-xs text-yellow-700">
          {status.error} CV{status.error > 1 ? "s" : ""} failed to process
        </div>
      )}

      {/* Stats */}
      <div className="mt-2 flex gap-4 text-xs">
        <span className="text-gray-600">
          Indexed: <span className="font-semibold text-gray-900">{status.indexed}</span>
        </span>
        {status.processing > 0 && (
          <span className="text-gray-600">
            Processing:{" "}
            <span className="font-semibold text-gray-900">{status.processing}</span>
          </span>
        )}
        {status.pending > 0 && (
          <span className="text-gray-600">
            Pending: <span className="font-semibold text-gray-900">{status.pending}</span>
          </span>
        )}
      </div>
    </div>
  );
}
