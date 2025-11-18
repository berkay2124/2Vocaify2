export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  education: EducationLevel;
  skills: string[];
  currentRole: string;
  previousCompanies: string[];
  summary: string;
  highlights: string[];
  matchScore: number;
  whyMatched: string;
  uploadedAt: Date;
  cvUrl?: string;
}

export type EducationLevel =
  | "High School"
  | "Associate Degree"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "PhD"
  | "Other";

export interface SearchFilters {
  query: string;
  minExperience: number;
  maxExperience: number;
  skills: string[];
  education: EducationLevel | "";
  location: string;
}

export interface ParsedQuery {
  skills: string[];
  experience?: {
    min: number;
    max?: number;
  };
  location?: string;
  keywords: string[];
}

export type SortOption = "score" | "experience" | "date";

export interface SearchState {
  filters: SearchFilters;
  results: Candidate[];
  isSearching: boolean;
  sortBy: SortOption;
  currentPage: number;
  totalResults: number;
}
