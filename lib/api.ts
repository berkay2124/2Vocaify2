/**
 * API Integration Layer
 * Type-safe API calls for CV search and management
 */

import { db, storage } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
  QuerySnapshot
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import {
  VectorSearchOptions,
  VectorSearchResponse,
  VectorSearchResult
} from "./vectorSearch";

/**
 * CV Document from Firestore
 */
export interface CVDocument {
  id: string;
  userId: string;
  storagePath: string;
  filename: string;
  uploadedAt: Date;
  status: "pending" | "processing" | "indexed" | "error";
  fileSize: number;
  fileType: string;
  downloadURL?: string;
  extractedData?: {
    name: string;
    email: string;
    phone: string;
    yearsExperience: number;
    skills: string[];
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    workHistory: Array<{
      title: string;
      company: string;
      years: string;
      description: string;
    }>;
    summary: string;
  };
  extractedText?: string;
  embeddingGenerated?: boolean;
  processedAt?: Date;
  errorMessage?: string;
}

/**
 * Shortlist entry
 */
export interface ShortlistEntry {
  id?: string;
  userId: string;
  cvId: string;
  candidateName: string;
  shortlistedAt: Date;
  notes?: string;
}

/**
 * Search analytics entry
 */
export interface SearchAnalytics {
  userId: string;
  query: string;
  filters: any;
  resultsCount: number;
  searchedAt: Date;
  duration: number;
}

/**
 * Search candidates using vector search API
 */
export async function searchCandidates(
  options: VectorSearchOptions
): Promise<VectorSearchResponse> {
  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Search failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Search API error:", error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Get CV document details from Firestore
 */
export async function getCVDetails(cvId: string): Promise<CVDocument | null> {
  try {
    const cvDoc = await getDoc(doc(db, "cvs", cvId));

    if (!cvDoc.exists()) {
      return null;
    }

    const data = cvDoc.data();

    return {
      id: cvDoc.id,
      userId: data.userId,
      storagePath: data.storagePath,
      filename: data.filename,
      uploadedAt: data.uploadedAt?.toDate() || new Date(),
      status: data.status,
      fileSize: data.fileSize,
      fileType: data.fileType,
      downloadURL: data.downloadURL,
      extractedData: data.extractedData,
      extractedText: data.extractedText,
      embeddingGenerated: data.embeddingGenerated,
      processedAt: data.processedAt?.toDate(),
      errorMessage: data.errorMessage,
    };
  } catch (error: any) {
    console.error("Get CV details error:", error);
    throw new Error(`Failed to get CV details: ${error.message}`);
  }
}

/**
 * Get signed download URL for CV
 */
export async function getCVDownloadURL(storagePath: string): Promise<string> {
  try {
    const fileRef = ref(storage, storagePath);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error: any) {
    console.error("Get download URL error:", error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
}

/**
 * Download CV file
 */
export async function downloadCV(cvId: string): Promise<void> {
  try {
    const cvDetails = await getCVDetails(cvId);

    if (!cvDetails) {
      throw new Error("CV not found");
    }

    const url = await getCVDownloadURL(cvDetails.storagePath);

    // Open in new tab
    window.open(url, "_blank");
  } catch (error: any) {
    console.error("Download CV error:", error);
    throw error;
  }
}

/**
 * Add candidate to shortlist
 */
export async function addToShortlist(
  userId: string,
  cvId: string,
  candidateName: string,
  notes?: string
): Promise<string> {
  try {
    // Check if already shortlisted
    const shortlistQuery = query(
      collection(db, "shortlisted"),
      where("userId", "==", userId),
      where("cvId", "==", cvId)
    );

    const existingDocs = await getDocs(shortlistQuery);

    if (!existingDocs.empty) {
      // Already shortlisted, update notes if provided
      if (notes) {
        const docId = existingDocs.docs[0].id;
        await updateDoc(doc(db, "shortlisted", docId), { notes });
        return docId;
      }
      return existingDocs.docs[0].id;
    }

    // Add new shortlist entry
    const docRef = await addDoc(collection(db, "shortlisted"), {
      userId,
      cvId,
      candidateName,
      shortlistedAt: Timestamp.now(),
      notes: notes || "",
    });

    return docRef.id;
  } catch (error: any) {
    console.error("Add to shortlist error:", error);
    throw new Error(`Failed to shortlist candidate: ${error.message}`);
  }
}

/**
 * Remove candidate from shortlist
 */
export async function removeFromShortlist(
  userId: string,
  cvId: string
): Promise<void> {
  try {
    const shortlistQuery = query(
      collection(db, "shortlisted"),
      where("userId", "==", userId),
      where("cvId", "==", cvId)
    );

    const docs = await getDocs(shortlistQuery);

    const deletePromises = docs.docs.map((doc) =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
  } catch (error: any) {
    console.error("Remove from shortlist error:", error);
    throw new Error(`Failed to remove from shortlist: ${error.message}`);
  }
}

/**
 * Get user's shortlisted candidates
 */
export async function getShortlistedCandidates(
  userId: string
): Promise<ShortlistEntry[]> {
  try {
    const shortlistQuery = query(
      collection(db, "shortlisted"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(shortlistQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        cvId: data.cvId,
        candidateName: data.candidateName,
        shortlistedAt: data.shortlistedAt?.toDate() || new Date(),
        notes: data.notes,
      };
    });
  } catch (error: any) {
    console.error("Get shortlisted error:", error);
    throw new Error(`Failed to get shortlisted candidates: ${error.message}`);
  }
}

/**
 * Check if candidate is shortlisted
 */
export async function isShortlisted(
  userId: string,
  cvId: string
): Promise<boolean> {
  try {
    const shortlistQuery = query(
      collection(db, "shortlisted"),
      where("userId", "==", userId),
      where("cvId", "==", cvId)
    );

    const snapshot = await getDocs(shortlistQuery);

    return !snapshot.empty;
  } catch (error: any) {
    console.error("Check shortlisted error:", error);
    return false;
  }
}

/**
 * Mark candidate as rejected
 */
export async function rejectCandidate(
  userId: string,
  cvId: string,
  reason?: string
): Promise<void> {
  try {
    await addDoc(collection(db, "rejected"), {
      userId,
      cvId,
      rejectedAt: Timestamp.now(),
      reason: reason || "",
    });
  } catch (error: any) {
    console.error("Reject candidate error:", error);
    throw new Error(`Failed to reject candidate: ${error.message}`);
  }
}

/**
 * Log search analytics
 */
export async function logSearchAnalytics(
  userId: string,
  query: string,
  filters: any,
  resultsCount: number,
  duration: number
): Promise<void> {
  try {
    await addDoc(collection(db, "searchAnalytics"), {
      userId,
      query,
      filters,
      resultsCount,
      duration,
      searchedAt: Timestamp.now(),
    });
  } catch (error: any) {
    // Don't throw error for analytics - just log
    console.error("Log search analytics error:", error);
  }
}

/**
 * Get CV processing status for user
 */
export async function getCVProcessingStatus(userId: string): Promise<{
  total: number;
  pending: number;
  processing: number;
  indexed: number;
  error: number;
}> {
  try {
    const cvsQuery = query(
      collection(db, "cvs"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(cvsQuery);

    const stats = {
      total: snapshot.size,
      pending: 0,
      processing: 0,
      indexed: 0,
      error: 0,
    };

    snapshot.docs.forEach((doc) => {
      const status = doc.data().status;
      if (status === "pending") stats.pending++;
      else if (status === "processing") stats.processing++;
      else if (status === "indexed") stats.indexed++;
      else if (status === "error") stats.error++;
    });

    return stats;
  } catch (error: any) {
    console.error("Get CV status error:", error);
    return { total: 0, pending: 0, processing: 0, indexed: 0, error: 0 };
  }
}

/**
 * Subscribe to CV processing status updates
 */
export function subscribeToCVStatus(
  userId: string,
  callback: (status: {
    total: number;
    pending: number;
    processing: number;
    indexed: number;
    error: number;
  }) => void
): () => void {
  const cvsQuery = query(
    collection(db, "cvs"),
    where("userId", "==", userId)
  );

  const unsubscribe = onSnapshot(cvsQuery, (snapshot: QuerySnapshot) => {
    const stats = {
      total: snapshot.size,
      pending: 0,
      processing: 0,
      indexed: 0,
      error: 0,
    };

    snapshot.docs.forEach((doc) => {
      const status = doc.data().status;
      if (status === "pending") stats.pending++;
      else if (status === "processing") stats.processing++;
      else if (status === "indexed") stats.indexed++;
      else if (status === "error") stats.error++;
    });

    callback(stats);
  });

  return unsubscribe;
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save search to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined") return;

  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 10);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  } catch (error) {
    console.error("Save recent search error:", error);
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("recentSearches");
  } catch (error) {
    console.error("Clear recent searches error:", error);
  }
}
