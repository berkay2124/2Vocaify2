"use client";

/**
 * Loading skeleton for search results
 */
export default function SearchLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {/* Name */}
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              {/* Role + Details */}
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              {/* Experience + Education */}
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            {/* Match Score Circle */}
            <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
          </div>

          {/* Highlights */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-6 bg-gray-200 rounded w-20"></div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
