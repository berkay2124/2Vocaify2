"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { ParsedQuery, SearchFilters } from "@/types/candidate";
import { parseQuery } from "@/lib/mockData";

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  initialQuery?: string;
  isLoading?: boolean;
}

export default function SearchBar({
  onSearch,
  initialQuery = "",
  isLoading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Parse query in real-time
  useEffect(() => {
    if (query.trim()) {
      const parsed = parseQuery(query);
      setParsedQuery(parsed);
    } else {
      setParsedQuery(null);
    }
  }, [query]);

  const handleSearch = () => {
    if (!query.trim()) return;

    // Save to recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    // Create filters from parsed query
    const filters: SearchFilters = {
      query,
      minExperience: parsedQuery?.experience?.min || 0,
      maxExperience: parsedQuery?.experience?.max || 20,
      skills: parsedQuery?.skills || [],
      education: "",
      location: "",
    };

    onSearch(query, filters);
    setShowRecent(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setQuery("");
      setParsedQuery(null);
    }
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    const parsed = parseQuery(search);
    const filters: SearchFilters = {
      query: search,
      minExperience: parsed?.experience?.min || 0,
      maxExperience: parsed?.experience?.max || 20,
      skills: parsed?.skills || [],
      education: "",
      location: "",
    };
    onSearch(search, filters);
    setShowRecent(false);
  };

  const clearAll = () => {
    setQuery("");
    setParsedQuery(null);
  };

  return (
    <div className="w-full">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* Search Icon */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
            <svg
              className={`w-6 h-6 transition-colors ${
                isLoading ? "text-primary-600 animate-pulse" : "text-gray-400"
              }`}
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

          {/* Input Field */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            placeholder="Senior React developer, 5+ years, TypeScript expert..."
            className="flex-1 pl-16 pr-32 py-6 text-lg border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
            disabled={isLoading}
            aria-label="Search for candidates"
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={clearAll}
              className="absolute right-32 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-primary hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            aria-label="Search"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Recent Searches Dropdown */}
        {showRecent && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                Recent Searches
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {search}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parsed Query Display */}
      {parsedQuery && (
        <div className="mt-4 flex items-center flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600">Searching for:</span>

          {parsedQuery.skills.length > 0 && (
            <>
              {parsedQuery.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  {skill} <span className="text-xs">(skill)</span>
                </span>
              ))}
            </>
          )}

          {parsedQuery.experience && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {parsedQuery.experience.min}+ years{" "}
              <span className="text-xs">(experience)</span>
            </span>
          )}

          {parsedQuery.keywords.length > 0 && (
            <>
              {parsedQuery.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </>
          )}

          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
            Enter
          </kbd>
          to search
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
            Esc
          </kbd>
          to clear
        </span>
      </div>
    </div>
  );
}
