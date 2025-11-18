/**
 * Vector Search Utilities
 * Client-side utilities for semantic CV search using Pinecone
 */

/**
 * Search filters
 */
export interface VectorSearchFilters {
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  location?: string;
}

/**
 * CV metadata from search results
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
 * Search result from vector search
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: CVMetadata;
  rerankScore?: number;
  rerankReasoning?: string;
}

/**
 * Search response from API
 */
export interface VectorSearchResponse {
  success: boolean;
  results: VectorSearchResult[];
  totalResults: number;
  duration: number;
  reranked: boolean;
  error?: string;
  message?: string;
}

/**
 * Search options
 */
export interface VectorSearchOptions {
  query: string;
  userId: string;
  filters?: VectorSearchFilters;
  topK?: number;
  rerank?: boolean;
}

/**
 * Perform semantic CV search using vector embeddings
 * @param options - Search options
 * @returns Search response with ranked candidates
 */
export async function performVectorSearch(
  options: VectorSearchOptions
): Promise<VectorSearchResponse> {
  const { query, userId, filters, topK = 50, rerank = true } = options;

  if (!query || query.trim().length === 0) {
    throw new Error("Search query cannot be empty");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        userId,
        filters,
        topK,
        rerank,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Search failed with status ${response.status}`);
    }

    const data: VectorSearchResponse = await response.json();

    return data;
  } catch (error: any) {
    console.error("Vector search error:", error);
    throw new Error(`Vector search failed: ${error.message}`);
  }
}

/**
 * Check search service health
 * @returns Health status and index statistics
 */
export async function checkSearchHealth(): Promise<{
  status: string;
  index: string;
  vectorCount: number;
  dimension: number;
}> {
  try {
    const response = await fetch("/api/search", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Health check error:", error);
    throw new Error(`Health check failed: ${error.message}`);
  }
}

/**
 * Parse natural language query to extract filters
 * @param query - Natural language query
 * @returns Extracted filters
 */
export function parseQueryForFilters(query: string): VectorSearchFilters {
  const filters: VectorSearchFilters = {};

  // Extract years of experience
  const yearsMatch = query.match(/(\d+)\+?\s*years?/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    filters.minExperience = years;
  }

  // Extract experience range
  const rangeMatch = query.match(/(\d+)-(\d+)\s*years?/i);
  if (rangeMatch) {
    filters.minExperience = parseInt(rangeMatch[1]);
    filters.maxExperience = parseInt(rangeMatch[2]);
  }

  // Extract common skills (basic implementation)
  const skillKeywords = [
    "React", "Angular", "Vue", "JavaScript", "TypeScript",
    "Python", "Java", "C++", "Go", "Rust",
    "Node.js", "Express", "Django", "Flask",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes",
    "SQL", "MongoDB", "PostgreSQL", "Redis",
    "Machine Learning", "AI", "Data Science",
    "DevOps", "CI/CD", "Git",
  ];

  const foundSkills = skillKeywords.filter((skill) =>
    query.toLowerCase().includes(skill.toLowerCase())
  );

  if (foundSkills.length > 0) {
    filters.skills = foundSkills;
  }

  return filters;
}

/**
 * Combine multiple filter sources
 * @param queryFilters - Filters from query parsing
 * @param explicitFilters - User-selected filters
 * @returns Combined filters
 */
export function combineFilters(
  queryFilters: VectorSearchFilters,
  explicitFilters: VectorSearchFilters
): VectorSearchFilters {
  return {
    minExperience: explicitFilters.minExperience ?? queryFilters.minExperience,
    maxExperience: explicitFilters.maxExperience ?? queryFilters.maxExperience,
    skills: [
      ...(queryFilters.skills || []),
      ...(explicitFilters.skills || []),
    ],
    location: explicitFilters.location ?? queryFilters.location,
  };
}

/**
 * Format search result for display
 * @param result - Search result
 * @returns Formatted result with highlights
 */
export function formatSearchResult(result: VectorSearchResult): {
  name: string;
  matchScore: number;
  yearsExperience: number;
  skills: string[];
  location: string;
  highlights: string[];
  whyMatched: string;
} {
  const matchScore = result.rerankScore
    ? Math.round(result.rerankScore)
    : Math.round(result.score * 100);

  const highlights = [
    `${result.metadata.yearsExperience} years of experience`,
    `${result.metadata.skills.length} skills`,
    result.metadata.location || "Location not specified",
  ];

  const whyMatched = result.rerankReasoning ||
    `Strong match based on skills and experience (${(result.score * 100).toFixed(1)}% similarity)`;

  return {
    name: result.metadata.name,
    matchScore,
    yearsExperience: result.metadata.yearsExperience,
    skills: result.metadata.skills,
    location: result.metadata.location,
    highlights,
    whyMatched,
  };
}

/**
 * Cache key for search results
 * @param query - Search query
 * @param filters - Search filters
 * @returns Cache key
 */
export function getSearchCacheKey(
  query: string,
  filters?: VectorSearchFilters
): string {
  const filterString = filters
    ? JSON.stringify(filters)
    : "";
  return `search:${query}:${filterString}`;
}

/**
 * Simple in-memory cache for search results
 */
class SearchCache {
  private cache: Map<string, { data: VectorSearchResponse; timestamp: number }>;
  private maxAge: number;

  constructor(maxAgeMs: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAgeMs;
  }

  get(key: string): VectorSearchResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: VectorSearchResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Export singleton cache instance
export const searchCache = new SearchCache();
