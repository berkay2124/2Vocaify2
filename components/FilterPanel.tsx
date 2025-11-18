"use client";

import { useState } from "react";
import { SearchFilters, EducationLevel } from "@/types/candidate";
import { getAllSkills } from "@/lib/mockData";

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isCollapsed?: boolean;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  isCollapsed: initialCollapsed = false,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  const allSkills = getAllSkills();
  const filteredSkills = allSkills.filter((skill) =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const educationLevels: (EducationLevel | "")[] = [
    "",
    "High School",
    "Associate Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Other",
  ];

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];

    onFiltersChange({
      ...filters,
      skills: newSkills,
    });
  };

  const handleRemoveSkill = (skill: string) => {
    onFiltersChange({
      ...filters,
      skills: filters.skills.filter((s) => s !== skill),
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: filters.query,
      minExperience: 0,
      maxExperience: 20,
      skills: [],
      education: "",
      location: "",
    });
  };

  const hasActiveFilters =
    filters.skills.length > 0 ||
    filters.education !== "" ||
    filters.location !== "" ||
    filters.minExperience > 0 ||
    filters.maxExperience < 20;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={!isCollapsed}
        aria-controls="filter-panel-content"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-semibold text-gray-900">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isCollapsed ? "" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div id="filter-panel-content" className="px-6 py-4 space-y-6 border-t border-gray-200">
          {/* Years of Experience Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Years of Experience
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.minExperience}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minExperience: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  aria-label="Minimum years of experience"
                />
                <span className="text-sm font-medium text-gray-700 w-16 text-right">
                  {filters.minExperience}+
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.maxExperience}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxExperience: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  aria-label="Maximum years of experience"
                />
                <span className="text-sm font-medium text-gray-700 w-16 text-right">
                  {filters.maxExperience === 20 ? "20+" : filters.maxExperience}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Range: {filters.minExperience} - {filters.maxExperience === 20 ? "20+" : filters.maxExperience} years
              </p>
            </div>
          </div>

          {/* Skills Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>

            {/* Selected Skills */}
            {filters.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-primary-900"
                      aria-label={`Remove ${skill}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Skills Dropdown */}
            <div className="relative">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                onFocus={() => setShowSkillsDropdown(true)}
                onBlur={() => setTimeout(() => setShowSkillsDropdown(false), 200)}
                placeholder="Search skills..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-sm"
                aria-label="Search skills"
              />

              {showSkillsDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          filters.skills.includes(skill) ? "bg-primary-50 text-primary-700" : ""
                        }`}
                      >
                        <span>{skill}</span>
                        {filters.skills.includes(skill) && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No skills found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Education Level */}
          <div>
            <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
              Education Level
            </label>
            <select
              id="education"
              value={filters.education}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  education: e.target.value as EducationLevel | "",
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-sm"
            >
              <option value="">All levels</option>
              {educationLevels.slice(1).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={filters.location}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  location: e.target.value,
                })
              }
              placeholder="e.g., San Francisco, Remote..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-sm"
            />
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
