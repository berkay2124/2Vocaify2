/**
 * Custom hook for CV search with debouncing and caching
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { searchCandidates, logSearchAnalytics } from "@/lib/api";
import {
  VectorSearchOptions,
  VectorSearchResponse,
  VectorSearchResult,
  VectorSearchFilters,
} from "@/lib/vectorSearch";

interface UseSearchOptions {
  userId: string;
  debounceMs?: number;
  enableCache?: boolean;
  enableAnalytics?: boolean;
}

interface UseSearchReturn {
  results: VectorSearchResult[];
  totalResults: number;
  isSearching: boolean;
  error: string | null;
  duration: number;
  reranked: boolean;
  search: (query: string, filters?: VectorSearchFilters) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

// Simple in-memory cache
const searchCache = new Map<
  string,
  { data: VectorSearchResponse; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key
 */
function getCacheKey(query: string, filters?: VectorSearchFilters): string {
  return JSON.stringify({ query, filters });
}

/**
 * Get from cache
 */
function getFromCache(key: string): VectorSearchResponse | null {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Save to cache
 */
function saveToCache(key: string, data: VectorSearchResponse): void {
  searchCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Custom hook for CV search
 */
export function useSearch(options: UseSearchOptions): UseSearchReturn {
  const { userId, debounceMs = 300, enableCache = true, enableAnalytics = true } = options;

  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [reranked, setReranked] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform search
   */
  const search = useCallback(
    async (query: string, filters?: VectorSearchFilters) => {
      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce search
      debounceTimerRef.current = setTimeout(async () => {
        if (!query.trim()) {
          setResults([]);
          setTotalResults(0);
          setError(null);
          return;
        }

        // Check cache
        if (enableCache) {
          const cacheKey = getCacheKey(query, filters);
          const cached = getFromCache(cacheKey);

          if (cached) {
            console.log("Using cached results for:", query);
            setResults(cached.results);
            setTotalResults(cached.totalResults);
            setDuration(cached.duration);
            setReranked(cached.reranked);
            setError(null);
            return;
          }
        }

        // Abort previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        setIsSearching(true);
        setError(null);

        try {
          const searchOptions: VectorSearchOptions = {
            query,
            userId,
            filters,
            topK: 50,
            rerank: true,
          };

          const response = await searchCandidates(searchOptions);

          setResults(response.results);
          setTotalResults(response.totalResults);
          setDuration(response.duration);
          setReranked(response.reranked);
          setError(null);

          // Save to cache
          if (enableCache) {
            const cacheKey = getCacheKey(query, filters);
            saveToCache(cacheKey, response);
          }

          // Log analytics
          if (enableAnalytics) {
            logSearchAnalytics(
              userId,
              query,
              filters || {},
              response.totalResults,
              response.duration
            );
          }
        } catch (err: any) {
          console.error("Search error:", err);
          setError(err.message || "Search failed");
          setResults([]);
          setTotalResults(0);
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);
    },
    [userId, debounceMs, enableCache, enableAnalytics]
  );

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setError(null);
    setDuration(0);
    setReranked(false);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    totalResults,
    isSearching,
    error,
    duration,
    reranked,
    search,
    clearResults,
    clearError,
  };
}
