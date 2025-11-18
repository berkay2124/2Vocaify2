"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import SearchLoading from "@/components/SearchLoading";
import SearchError from "@/components/SearchError";
import CVProcessingStatus from "@/components/CVProcessingStatus";
import { useSearch } from "@/hooks/useSearch";
import { VectorSearchFilters } from "@/lib/vectorSearch";
import { SearchFilters } from "@/types/candidate";
import toast from "react-hot-toast";
import {
  downloadCV,
  addToShortlist,
  removeFromShortlist,
  rejectCandidate,
  saveRecentSearch,
} from "@/lib/api";

const RESULTS_PER_PAGE = 10;

// Convert SearchFilters to VectorSearchFilters
function toVectorSearchFilters(filters: SearchFilters): VectorSearchFilters {
  return {
    minExperience: filters.minExperience,
    maxExperience: filters.maxExperience,
    skills: filters.skills,
    location: filters.location,
  };
}

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State - use old SearchFilters for compatibility with existing components
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    minExperience: 0,
    maxExperience: 20,
    skills: [],
    education: "",
    location: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Use search hook
  const {
    results,
    totalResults,
    isSearching,
    error,
    duration,
    reranked,
    search,
    clearError,
  } = useSearch({
    userId: user?.uid || "",
    debounceMs: 300,
    enableCache: true,
    enableAnalytics: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Handle search
  const handleSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    setQuery(searchQuery);
    setFilters(searchFilters);
    setCurrentPage(1);

    if (searchQuery.trim()) {
      // Convert to VectorSearchFilters for API call
      const vectorFilters = toVectorSearchFilters(searchFilters);
      await search(searchQuery, vectorFilters);
      saveRecentSearch(searchQuery);
    }
  };

  // Filter out rejected candidates
  const filteredResults = results.filter(
    (result) => !rejectedIds.has(result.id)
  );

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Action handlers
  const handleViewCV = async (candidateId: string, candidateName: string) => {
    try {
      toast.loading(`Opening CV for ${candidateName}...`, { id: "view-cv" });
      await downloadCV(candidateId);
      toast.success(`Opened CV for ${candidateName}`, { id: "view-cv" });
    } catch (error: any) {
      toast.error(error.message || "Failed to open CV", { id: "view-cv" });
    }
  };

  const handleShortlist = async (candidateId: string, candidateName: string) => {
    if (!user) return;

    const wasShortlisted = shortlistedIds.has(candidateId);

    // Optimistic update
    setShortlistedIds((prev) => {
      const newSet = new Set(prev);
      if (wasShortlisted) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });

    try {
      if (wasShortlisted) {
        await removeFromShortlist(user.uid, candidateId);
        toast.success(`${candidateName} removed from shortlist`);
      } else {
        await addToShortlist(user.uid, candidateId, candidateName);
        toast.success(`${candidateName} added to shortlist`, {
          icon: "⭐",
        });
      }
    } catch (error: any) {
      // Revert optimistic update
      setShortlistedIds((prev) => {
        const newSet = new Set(prev);
        if (wasShortlisted) {
          newSet.add(candidateId);
        } else {
          newSet.delete(candidateId);
        }
        return newSet;
      });

      toast.error(error.message || "Failed to update shortlist");
    }
  };

  const handleReject = async (candidateId: string, candidateName: string) => {
    if (!user) return;

    // Optimistic update
    setRejectedIds((prev) => new Set(prev).add(candidateId));

    try {
      await rejectCandidate(user.uid, candidateId);
      toast.success(`${candidateName} rejected`, { icon: "❌" });
    } catch (error: any) {
      // Revert optimistic update
      setRejectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });

      toast.error(error.message || "Failed to reject candidate");
    }
  };

  if (!user) return null;

  const hasSearched = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
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
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Upload
                </Link>
                <Link
                  href="/dashboard/search"
                  className="text-sm font-semibold text-primary-600"
                >
                  Search
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {shortlistedIds.size > 0 && (
                <div className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {shortlistedIds.size} shortlisted
                </div>
              )}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search CVs</h1>
          <p className="text-gray-600">
            Use natural language to find the perfect candidate
          </p>
        </div>

        {/* Processing Status */}
        {user && (
          <div className="mb-6">
            <CVProcessingStatus userId={user.uid} />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={(q, f) => handleSearch(q, f)}
            isLoading={isSearching}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <SearchError
              error={error}
              onRetry={() => {
                if (query) {
                  const vectorFilters = toVectorSearchFilters(filters);
                  search(query, vectorFilters);
                }
              }}
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Filters and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                if (query) {
                  const vectorFilters = toVectorSearchFilters(newFilters);
                  search(query, vectorFilters);
                }
              }}
            />
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {/* Sort and Results Count */}
            {hasSearched && !isSearching && filteredResults.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <div className="text-gray-700">
                  <span className="font-semibold">{filteredResults.length}</span>{" "}
                  candidate{filteredResults.length !== 1 ? "s" : ""} found
                  {reranked && (
                    <span className="ml-2 text-sm text-indigo-600">
                      (AI re-ranked)
                    </span>
                  )}
                  <span className="ml-2 text-sm text-gray-500">
                    in {duration}ms
                  </span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isSearching && <SearchLoading />}

            {/* Empty State - No Search */}
            {!hasSearched && !isSearching && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-primary-100">
                  <svg
                    className="w-10 h-10 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Start your search
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try searching for &quot;Senior React developer with 5+ years
                  experience&quot; or use the filters to narrow down your results.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      const exampleQuery = "Senior React developer 5 years";
                      handleSearch(exampleQuery, filters);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    Try: &quot;Senior React developer&quot;
                  </button>
                  <button
                    onClick={() => {
                      const exampleQuery = "Python ML engineer";
                      handleSearch(exampleQuery, filters);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    Try: &quot;Python ML engineer&quot;
                  </button>
                </div>
              </div>
            )}

            {/* Empty State - No Results */}
            {hasSearched && !isSearching && filteredResults.length === 0 && !error && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gray-100">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No candidates found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try adjusting your search query or filters to find more results.
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p>💡 Tips for better results:</p>
                  <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>Use broader skill keywords</li>
                    <li>Reduce experience requirements</li>
                    <li>Clear some filters to expand your search</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setFilters({
                      query: "",
                      minExperience: 0,
                      maxExperience: 20,
                      skills: [],
                      education: "",
                      location: "",
                    });
                    setQuery("");
                  }}
                  className="px-6 py-3 bg-primary hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Results List */}
            {!isSearching && paginatedResults.length > 0 && (
              <div className="space-y-4">
                {paginatedResults.map((result) => {
                  const candidate = result.metadata;
                  const matchScore = result.rerankScore
                    ? Math.round(result.rerankScore)
                    : Math.round(result.score * 100);

                  return (
                    <div
                      key={result.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {candidate.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <span>{candidate.yearsExperience} years exp</span>
                            <span>•</span>
                            <span>{candidate.location || "Location not specified"}</span>
                          </div>
                        </div>

                        {/* Match Score */}
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg className="transform -rotate-90 w-20 h-20">
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              className="text-gray-200"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 34}`}
                              strokeDashoffset={`${
                                2 * Math.PI * 34 * (1 - matchScore / 100)
                              }`}
                              className={
                                matchScore >= 85
                                  ? "text-green-500"
                                  : matchScore >= 70
                                  ? "text-blue-500"
                                  : "text-yellow-500"
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{matchScore}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {candidate.skills.slice(0, 8).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 8 && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full font-medium">
                            +{candidate.skills.length - 8} more
                          </span>
                        )}
                      </div>

                      {/* Why Matched (AI Reasoning) */}
                      {result.rerankReasoning && (
                        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Why matched:
                          </p>
                          <p className="text-sm text-blue-800">{result.rerankReasoning}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewCV(result.id, candidate.name)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View CV
                        </button>

                        <button
                          onClick={() => handleShortlist(result.id, candidate.name)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            shortlistedIds.has(result.id)
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill={shortlistedIds.has(result.id) ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          {shortlistedIds.has(result.id) ? "Shortlisted" : "Shortlist"}
                        </button>

                        <button
                          onClick={() => handleReject(result.id, candidate.name)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
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
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isSearching && filteredResults.length > RESULTS_PER_PAGE && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              page === currentPage
                                ? "bg-primary text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
