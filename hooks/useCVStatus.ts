/**
 * Custom hook for real-time CV processing status
 */

import { useState, useEffect } from "react";
import { subscribeToCVStatus, getCVProcessingStatus } from "@/lib/api";

export interface CVProcessingStatus {
  total: number;
  pending: number;
  processing: number;
  indexed: number;
  error: number;
}

interface UseCVStatusReturn {
  status: CVProcessingStatus;
  isLoading: boolean;
  progressPercentage: number;
  statusMessage: string;
}

/**
 * Custom hook for CV processing status with real-time updates
 */
export function useCVStatus(userId: string | undefined): UseCVStatusReturn {
  const [status, setStatus] = useState<CVProcessingStatus>({
    total: 0,
    pending: 0,
    processing: 0,
    indexed: 0,
    error: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    getCVProcessingStatus(userId)
      .then((initialStatus) => {
        setStatus(initialStatus);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get CV status:", error);
        setIsLoading(false);
      });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToCVStatus(userId, (updatedStatus) => {
      setStatus(updatedStatus);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Calculate progress percentage
  const progressPercentage =
    status.total > 0
      ? Math.round((status.indexed / status.total) * 100)
      : 0;

  // Generate status message
  let statusMessage = "";
  if (status.total === 0) {
    statusMessage = "No CVs uploaded yet";
  } else if (status.processing > 0 || status.pending > 0) {
    const remaining = status.pending + status.processing;
    statusMessage = `Processing ${status.indexed}/${status.total} CVs... ${remaining} remaining`;
  } else if (status.error > 0) {
    statusMessage = `${status.indexed} CVs indexed, ${status.error} failed`;
  } else {
    statusMessage = `All ${status.indexed} CVs indexed`;
  }

  return {
    status,
    isLoading,
    progressPercentage,
    statusMessage,
  };
}
