import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";

export type CVStatus = "pending" | "processing" | "indexed" | "error";

export interface CVDocument {
  id?: string;
  organizationId: string; // Multi-tenant support
  userId: string;
  storagePath: string;
  filename: string;
  uploadedAt: Timestamp;
  status: CVStatus;
  fileSize: number;
  fileType: string;
  downloadURL?: string;
  errorMessage?: string;
  assignedRecruiters?: string[]; // For RBAC - recruiters assigned to this CV
}

/**
 * Create a new CV document in Firestore
 * @param cvData - The CV document data
 * @returns The created document ID
 */
export async function createCVDocument(
  cvData: Omit<CVDocument, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "cvs"), cvData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating CV document:", error);
    throw error;
  }
}

/**
 * Update a CV document status
 * @param docId - The document ID
 * @param status - The new status
 * @param errorMessage - Optional error message if status is "error"
 */
export async function updateCVStatus(
  docId: string,
  status: CVStatus,
  errorMessage?: string
): Promise<void> {
  try {
    const docRef = doc(db, "cvs", docId);
    const updateData: Partial<CVDocument> = { status };

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating CV status:", error);
    throw error;
  }
}

/**
 * Delete a CV document from Firestore
 * @param docId - The document ID
 */
export async function deleteCVDocument(docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "cvs", docId));
  } catch (error) {
    console.error("Error deleting CV document:", error);
    throw error;
  }
}

/**
 * Get all CVs for an organization
 * @param organizationId - The organization's ID
 * @param statusFilter - Optional status filter
 * @returns Array of CV documents
 */
export async function getOrganizationCVs(
  organizationId: string,
  statusFilter?: CVStatus
): Promise<CVDocument[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("organizationId", "==", organizationId),
      orderBy("uploadedAt", "desc"),
    ];

    if (statusFilter) {
      constraints.push(where("status", "==", statusFilter));
    }

    const q = query(collection(db, "cvs"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CVDocument[];
  } catch (error) {
    console.error("Error getting organization CVs:", error);
    throw error;
  }
}

/**
 * Get all CVs for a user (legacy - use getOrganizationCVs for multi-tenant)
 * @param userId - The user's ID
 * @param statusFilter - Optional status filter
 * @returns Array of CV documents
 */
export async function getUserCVs(
  userId: string,
  statusFilter?: CVStatus
): Promise<CVDocument[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("uploadedAt", "desc"),
    ];

    if (statusFilter) {
      constraints.push(where("status", "==", statusFilter));
    }

    const q = query(collection(db, "cvs"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CVDocument[];
  } catch (error) {
    console.error("Error getting user CVs:", error);
    throw error;
  }
}

/**
 * Get CV count for an organization
 * @param organizationId - The organization's ID
 * @returns The count of CVs
 */
export async function getOrganizationCVCount(organizationId: string): Promise<number> {
  try {
    const q = query(collection(db, "cvs"), where("organizationId", "==", organizationId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting organization CV count:", error);
    return 0;
  }
}

/**
 * Get CV count for a user (legacy)
 * @param userId - The user's ID
 * @returns The count of CVs
 */
export async function getUserCVCount(userId: string): Promise<number> {
  try {
    const q = query(collection(db, "cvs"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting CV count:", error);
    return 0;
  }
}

/**
 * Get a single CV document
 * @param docId - The document ID
 * @returns The CV document or null if not found
 */
export async function getCVDocument(docId: string): Promise<CVDocument | null> {
  try {
    const docRef = doc(db, "cvs", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as CVDocument;
    }

    return null;
  } catch (error) {
    console.error("Error getting CV document:", error);
    throw error;
  }
}

/**
 * Check if a file with the same name already exists for a user
 * @param userId - The user's ID
 * @param filename - The filename to check
 * @returns true if exists, false otherwise
 */
export async function checkDuplicateFilename(
  userId: string,
  filename: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, "cvs"),
      where("userId", "==", userId),
      where("filename", "==", filename),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking duplicate filename:", error);
    return false;
  }
}

/**
 * Batch create CV documents
 * @param cvDataArray - Array of CV document data
 * @returns Array of created document IDs
 */
export async function batchCreateCVDocuments(
  cvDataArray: Omit<CVDocument, "id">[]
): Promise<string[]> {
  try {
    const promises = cvDataArray.map((cvData) => createCVDocument(cvData));
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error batch creating CV documents:", error);
    throw error;
  }
}
