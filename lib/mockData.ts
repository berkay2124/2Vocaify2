import { Candidate, EducationLevel } from "@/types/candidate";

const firstNames = [
  "Sarah", "Michael", "Emily", "David", "Jessica", "James", "Amanda", "Robert",
  "Jennifer", "William", "Lisa", "Christopher", "Karen", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Sandra", "Mark"
];

const lastNames = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
  "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Thompson"
];

const skills = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "Go",
  "SQL", "MongoDB", "PostgreSQL", "AWS", "Azure", "Docker", "Kubernetes",
  "GraphQL", "REST API", "Git", "Agile", "Scrum", "Team Leadership",
  "Project Management", "UI/UX Design", "Testing", "CI/CD", "DevOps",
  "Machine Learning", "Data Analysis", "HTML", "CSS", "Vue.js", "Angular",
  "Express.js", "Django", "Spring Boot", "Microservices", "Redis", "Elasticsearch"
];

const companies = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber",
  "Airbnb", "Stripe", "Shopify", "Twitter", "LinkedIn", "Salesforce",
  "Adobe", "Oracle", "IBM", "Intel", "Cisco", "VMware", "Dropbox"
];

const roles = [
  "Senior Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Engineering Manager",
  "Tech Lead",
  "Principal Engineer",
  "Software Architect",
  "Product Engineer",
  "Platform Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer"
];

const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Austin, TX",
  "Boston, MA",
  "Los Angeles, CA",
  "Chicago, IL",
  "Denver, CO",
  "Portland, OR",
  "Remote"
];

const educationLevels: EducationLevel[] = [
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree"
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateCandidate(index: number): Candidate {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const yearsOfExperience = Math.floor(Math.random() * 18) + 2; // 2-20 years
  const candidateSkills = getRandomItems(skills, Math.floor(Math.random() * 8) + 5); // 5-12 skills
  const education = getRandomItem(educationLevels);
  const currentRole = getRandomItem(roles);
  const previousCompanies = getRandomItems(companies, Math.floor(Math.random() * 3) + 2);
  const location = getRandomItem(locations);

  // Generate match score (60-95%)
  const matchScore = Math.floor(Math.random() * 36) + 60;

  // Generate highlights based on skills and experience
  const highlights = [
    `${yearsOfExperience}+ years of experience in software development`,
    `Expert in ${candidateSkills.slice(0, 3).join(", ")}`,
    `Led teams at ${previousCompanies[0]}`
  ];

  // Generate why matched text
  const whyMatched = `Strong match due to ${candidateSkills.slice(0, 2).join(" and ")} expertise, ${yearsOfExperience} years of experience, and proven track record at ${previousCompanies[0]}.`;

  const summary = `Experienced ${currentRole.toLowerCase()} with ${yearsOfExperience} years in the industry. Specialized in ${candidateSkills.slice(0, 3).join(", ")}. Previously worked at ${previousCompanies.join(", ")}.`;

  return {
    id: `candidate-${index + 1}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    location,
    yearsOfExperience,
    education,
    skills: candidateSkills,
    currentRole,
    previousCompanies,
    summary,
    highlights,
    matchScore,
    whyMatched,
    uploadedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
    cvUrl: `/cvs/${firstName.toLowerCase()}-${lastName.toLowerCase()}-cv.pdf`
  };
}

// Generate 20 mock candidates
export const mockCandidates: Candidate[] = Array.from({ length: 20 }, (_, i) =>
  generateCandidate(i)
);

// Helper function to search candidates (mock implementation)
export function searchCandidates(
  query: string,
  filters: {
    minExperience: number;
    maxExperience: number;
    skills: string[];
    education: string;
    location: string;
  }
): Candidate[] {
  let results = [...mockCandidates];

  // Filter by experience
  results = results.filter(
    (c) =>
      c.yearsOfExperience >= filters.minExperience &&
      c.yearsOfExperience <= filters.maxExperience
  );

  // Filter by skills (if any selected)
  if (filters.skills.length > 0) {
    results = results.filter((c) =>
      filters.skills.some((skill) =>
        c.skills.some((cs) => cs.toLowerCase().includes(skill.toLowerCase()))
      )
    );
  }

  // Filter by education
  if (filters.education) {
    results = results.filter((c) => c.education === filters.education);
  }

  // Filter by location
  if (filters.location) {
    results = results.filter((c) =>
      c.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }

  // Simple text search in name, role, summary, and skills
  if (query.trim()) {
    const searchTerms = query.toLowerCase().split(" ");
    results = results.filter((c) => {
      const searchableText = `${c.name} ${c.currentRole} ${c.summary} ${c.skills.join(" ")}`.toLowerCase();
      return searchTerms.some((term) => searchableText.includes(term));
    });
  }

  // Adjust match scores based on query relevance (mock scoring)
  if (query.trim()) {
    results = results.map((c) => ({
      ...c,
      matchScore: Math.min(95, c.matchScore + Math.floor(Math.random() * 10))
    }));
  }

  // Sort by match score (descending)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// Helper to get all unique skills from candidates
export function getAllSkills(): string[] {
  const allSkills = new Set<string>();
  mockCandidates.forEach((c) => c.skills.forEach((s) => allSkills.add(s)));
  return Array.from(allSkills).sort();
}

// Parse natural language query (basic implementation)
export function parseQuery(query: string): {
  skills: string[];
  experience?: { min: number; max?: number };
  keywords: string[];
} {
  const lowerQuery = query.toLowerCase();
  const allSkills = getAllSkills();

  // Find skills mentioned in query
  const foundSkills = allSkills.filter((skill) =>
    lowerQuery.includes(skill.toLowerCase())
  );

  // Find years of experience patterns
  let experience;
  const expMatch = lowerQuery.match(/(\d+)\+?\s*years?/);
  if (expMatch) {
    experience = { min: parseInt(expMatch[1]) };
  }

  // Extract keywords (remove common words)
  const commonWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as"];
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word));

  return {
    skills: foundSkills,
    experience,
    keywords
  };
}
