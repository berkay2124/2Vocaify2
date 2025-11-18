import { Pinecone } from "@pinecone-database/pinecone";
import * as functions from "firebase-functions";

const INDEX_NAME = "vocaify-cvs";

/**
 * CV metadata stored in Pinecone
 */
export interface CVMetadata {
  userId: string;
  name: string;
  yearsExperience: number;
  skills: string[];
  location: string;
  firestoreDocId: string;
  email?: string;
  phone?: string;
}

/**
 * Search filters for Pinecone queries
 */
export interface SearchFilters {
  userId?: string;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  location?: string;
}

/**
 * Search result from Pinecone
 */
export interface SearchResult {
  id: string;
  score: number;
  metadata: CVMetadata;
}

/**
 * Initialize Pinecone client
 * @returns Pinecone client instance
 */
function getPineconeClient(): Pinecone {
  const apiKey = functions.config().pinecone?.key;

  if (!apiKey) {
    throw new Error(
      "Pinecone API key not configured. Run: firebase functions:config:set pinecone.key=YOUR_KEY"
    );
  }

  return new Pinecone({
    apiKey: apiKey,
  });
}

/**
 * Upsert CV embedding to Pinecone
 * @param cvId - Unique CV identifier
 * @param embedding - 1536-dimension vector
 * @param metadata - CV metadata
 */
export async function upsertCVEmbedding(
  cvId: string,
  embedding: number[],
  metadata: CVMetadata
): Promise<void> {
  const pinecone = getPineconeClient();

  functions.logger.info("Upserting CV to Pinecone", {
    cvId,
    dimensions: embedding.length,
    metadata: {
      name: metadata.name,
      yearsExperience: metadata.yearsExperience,
      skillsCount: metadata.skills.length,
    },
  });

  try {
    const index = pinecone.index(INDEX_NAME);

    await index.upsert([
      {
        id: cvId,
        values: embedding,
        metadata: {
          userId: metadata.userId,
          name: metadata.name,
          yearsExperience: metadata.yearsExperience,
          skills: metadata.skills,
          location: metadata.location,
          firestoreDocId: metadata.firestoreDocId,
          email: metadata.email || "",
          phone: metadata.phone || "",
        },
      },
    ]);

    functions.logger.info("Successfully upserted CV to Pinecone", { cvId });
  } catch (error: any) {
    functions.logger.error("Pinecone upsert error:", {
      cvId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to upsert to Pinecone: ${error.message}`);
  }
}

/**
 * Search CVs by embedding vector
 * @param queryEmbedding - Query embedding vector
 * @param topK - Number of results to return
 * @param filters - Optional metadata filters
 * @returns Array of search results
 */
export async function searchCVs(
  queryEmbedding: number[],
  topK: number = 50,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  const pinecone = getPineconeClient();

  functions.logger.info("Searching Pinecone", {
    dimensions: queryEmbedding.length,
    topK,
    filters,
  });

  try {
    const index = pinecone.index(INDEX_NAME);

    // Build metadata filter
    const filter: Record<string, any> = {};

    if (filters?.userId) {
      filter.userId = { $eq: filters.userId };
    }

    if (filters?.minExperience !== undefined || filters?.maxExperience !== undefined) {
      filter.yearsExperience = {};
      if (filters.minExperience !== undefined) {
        filter.yearsExperience.$gte = filters.minExperience;
      }
      if (filters.maxExperience !== undefined) {
        filter.yearsExperience.$lte = filters.maxExperience;
      }
    }

    if (filters?.location) {
      filter.location = { $eq: filters.location };
    }

    const queryOptions: any = {
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    };

    // Only add filter if it has properties
    if (Object.keys(filter).length > 0) {
      queryOptions.filter = filter;
    }

    const results = await index.query(queryOptions);

    functions.logger.info("Pinecone search completed", {
      resultsCount: results.matches?.length || 0,
    });

    return (results.matches || []).map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as unknown as CVMetadata,
    }));
  } catch (error: any) {
    functions.logger.error("Pinecone search error:", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Pinecone search failed: ${error.message}`);
  }
}

/**
 * Delete CV from Pinecone
 * @param cvId - CV identifier to delete
 */
export async function deleteCVEmbedding(cvId: string): Promise<void> {
  const pinecone = getPineconeClient();

  functions.logger.info("Deleting CV from Pinecone", { cvId });

  try {
    const index = pinecone.index(INDEX_NAME);

    await index.deleteOne(cvId);

    functions.logger.info("Successfully deleted CV from Pinecone", { cvId });
  } catch (error: any) {
    functions.logger.error("Pinecone delete error:", {
      cvId,
      error: error.message,
    });
    throw new Error(`Failed to delete from Pinecone: ${error.message}`);
  }
}

/**
 * Delete all CVs for a user from Pinecone
 * @param userId - User ID
 */
export async function deleteUserCVs(userId: string): Promise<void> {
  const pinecone = getPineconeClient();

  functions.logger.info("Deleting all CVs for user from Pinecone", { userId });

  try {
    const index = pinecone.index(INDEX_NAME);

    await index.deleteMany({
      userId: { $eq: userId },
    });

    functions.logger.info("Successfully deleted user CVs from Pinecone", {
      userId,
    });
  } catch (error: any) {
    functions.logger.error("Pinecone delete user CVs error:", {
      userId,
      error: error.message,
    });
    throw new Error(`Failed to delete user CVs from Pinecone: ${error.message}`);
  }
}

/**
 * Get index statistics
 * @returns Index stats including total vector count
 */
export async function getIndexStats(): Promise<any> {
  const pinecone = getPineconeClient();

  try {
    const index = pinecone.index(INDEX_NAME);
    const stats = await index.describeIndexStats();

    functions.logger.info("Pinecone index stats", stats);

    return stats;
  } catch (error: any) {
    functions.logger.error("Failed to get index stats:", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Apply post-search filters to results
 * Skills filter is applied here as Pinecone doesn't support array contains
 * @param results - Search results from Pinecone
 * @param filters - Filter criteria
 * @returns Filtered results
 */
export function applyPostSearchFilters(
  results: SearchResult[],
  filters?: SearchFilters
): SearchResult[] {
  if (!filters) return results;

  let filtered = results;

  // Skills filter (array contains)
  if (filters.skills && filters.skills.length > 0) {
    filtered = filtered.filter((result) => {
      const cvSkills = result.metadata.skills.map((s) => s.toLowerCase());
      return filters.skills!.some((filterSkill) =>
        cvSkills.some((cvSkill) => cvSkill.includes(filterSkill.toLowerCase()))
      );
    });
  }

  return filtered;
}
