"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import ResultCard from "@/components/ResultCard";
import { Candidate } from "@/types/candidate";
import { searchCandidates, mockCandidates } from "@/lib/mockData";
import { SearchFilters, SortOption } from "@/types/candidate";
import toast from "react-hot-toast";

const RESULTS_PER_PAGE = 10;

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    minExperience: 0,
    maxExperience: 20,
    skills: [],
    education: "",
    location: "",
  });
  const [results, setResults] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [currentPage, setCurrentPage] = useState(1);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Perform search
  const handleSearch = useCallback((searchQuery: string, searchFilters: SearchFilters) => {
    setIsSearching(true);
    setHasSearched(true);

    // Simulate API delay
    setTimeout(() => {
      const searchResults = searchCandidates(searchQuery, searchFilters);
      setResults(searchResults);
      setCurrentPage(1);
      setIsSearching(false);
    }, 800);
  }, []);

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return b.matchScore - a.matchScore;
      case "experience":
        return b.yearsOfExperience - a.yearsOfExperience;
      case "date":
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      default:
        return 0;
    }
  });

  // Filter out rejected candidates
  const filteredResults = sortedResults.filter(
    (candidate) => !rejectedIds.has(candidate.id)
  );

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Action handlers
  const handleViewCV = (candidate: Candidate) => {
    toast.success(`Opening CV for ${candidate.name}`, {
      icon: "📄",
      duration: 3000,
    });
    // In real app: window.open(candidate.cvUrl, '_blank')
  };

  const handleShortlist = (candidate: Candidate) => {
    setShortlistedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(candidate.id)) {
        newSet.delete(candidate.id);
        toast.success(`${candidate.name} removed from shortlist`);
      } else {
        newSet.add(candidate.id);
        toast.success(`${candidate.name} added to shortlist`, {
          icon: "⭐",
          duration: 3000,
        });
      }
      return newSet;
    });
  };

  const handleReject = (candidate: Candidate) => {
    setRejectedIds((prev) => new Set(prev).add(candidate.id));
    toast.success(`${candidate.name} rejected`, {
      icon: "❌",
      duration: 3000,
    });
  };

  if (!user) return null;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search CVs</h1>
          <p className="text-gray-600">
            Use natural language to find the perfect candidate
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={(q, f) => {
              setQuery(q);
              setFilters(f);
              handleSearch(q, f);
            }}
            isLoading={isSearching}
          />
        </div>

        {/* Filters and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                handleSearch(query, newFilters);
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
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="score">Match Score</option>
                    <option value="experience">Experience</option>
                    <option value="date">Upload Date</option>
                  </select>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                      </div>
                      <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                      handleSearch(exampleQuery, {
                        ...filters,
                        query: exampleQuery,
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    Try: &quot;Senior React developer&quot;
                  </button>
                  <button
                    onClick={() => {
                      const exampleQuery = "Python ML engineer";
                      handleSearch(exampleQuery, {
                        ...filters,
                        query: exampleQuery,
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    Try: &quot;Python ML engineer&quot;
                  </button>
                </div>
              </div>
            )}

            {/* Empty State - No Results */}
            {hasSearched && !isSearching && filteredResults.length === 0 && (
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
                    <li>Use broader skill keywords (e.g., &quot;JavaScript&quot; instead of &quot;Next.js&quot;)</li>
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
                    setHasSearched(false);
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
                {paginatedResults.map((candidate) => (
                  <ResultCard
                    key={candidate.id}
                    candidate={candidate}
                    onViewCV={handleViewCV}
                    onShortlist={handleShortlist}
                    onReject={handleReject}
                  />
                ))}
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
