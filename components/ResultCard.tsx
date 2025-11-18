"use client";

import { Candidate } from "@/types/candidate";
import { useState } from "react";

interface ResultCardProps {
  candidate: Candidate;
  onViewCV: (candidate: Candidate) => void;
  onShortlist: (candidate: Candidate) => void;
  onReject: (candidate: Candidate) => void;
}

export default function ResultCard({
  candidate,
  onViewCV,
  onShortlist,
  onReject,
}: ResultCardProps) {
  const [showFullSummary, setShowFullSummary] = useState(false);

  // Get match score color
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-blue-600 bg-blue-100";
    return "text-yellow-600 bg-yellow-100";
  };

  // Get score ring color
  const getScoreRingColor = (score: number) => {
    if (score >= 85) return "stroke-green-600";
    if (score >= 70) return "stroke-blue-600";
    return "stroke-yellow-600";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{candidate.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{candidate.currentRole}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {candidate.location}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {candidate.yearsOfExperience} years
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
              {candidate.education}
            </span>
          </div>
        </div>

        {/* Match Score */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            {/* Background Circle */}
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
              {/* Progress Circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - candidate.matchScore / 100)}`}
                className={`${getScoreRingColor(candidate.matchScore)} transition-all duration-1000`}
                strokeLinecap="round"
              />
            </svg>
            {/* Score Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{candidate.matchScore}</span>
            </div>
          </div>
          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(
              candidate.matchScore
            )}`}
          >
            {candidate.matchScore >= 85 ? "Excellent" : candidate.matchScore >= 70 ? "Good" : "Fair"}
          </span>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Highlights</h4>
        <ul className="space-y-1">
          {candidate.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <svg
                className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.slice(0, 6).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 6 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
              +{candidate.skills.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Why Matched */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Why matched</h4>
            <p className="text-sm text-blue-800">{candidate.whyMatched}</p>
          </div>
        </div>
      </div>

      {/* Previous Companies */}
      <div className="mb-4 text-sm text-gray-600">
        <span className="font-medium">Previously at:</span>{" "}
        {candidate.previousCompanies.join(", ")}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => onViewCV(candidate)}
          className="flex-1 px-4 py-2 bg-primary hover:bg-primary-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          onClick={() => onShortlist(candidate)}
          className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border border-green-200"
          title="Shortlist candidate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Shortlist
        </button>
        <button
          onClick={() => onReject(candidate)}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border border-red-200"
          title="Reject candidate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
}
