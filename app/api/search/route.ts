import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const INDEX_NAME = "vocaify-cvs";

/**
 * Search filters
 */
interface SearchFilters {
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  location?: string;
}

/**
 * Search request body
 */
interface SearchRequest {
  query: string;
  userId: string;
  filters?: SearchFilters;
  topK?: number;
  rerank?: boolean;
}

/**
 * CV metadata from Pinecone
 */
interface CVMetadata {
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
 * Search result
 */
interface SearchResult {
  id: string;
  score: number;
  metadata: CVMetadata;
  rerankScore?: number;
  rerankReasoning?: string;
}

/**
 * Initialize Pinecone client
 */
function getPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable not set");
  }

  return new Pinecone({ apiKey });
}

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set");
  }

  return new OpenAI({ apiKey });
}

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

/**
 * Search Pinecone with filters
 */
async function searchPinecone(
  queryEmbedding: number[],
  userId: string,
  topK: number,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);

  // Build metadata filter
  const filter: Record<string, any> = {
    userId: { $eq: userId },
  };

  if (filters?.minExperience !== undefined || filters?.maxExperience !== undefined) {
    filter.yearsExperience = {};
    if (filters.minExperience !== undefined) {
      filter.yearsExperience.$gte = filters.minExperience;
    }
    if (filters.maxExperience !== undefined) {
      filter.yearsExperience.$lte = filters.maxExperience;
    }
  }

  if (filters?.location) {
    filter.location = { $eq: filters.location };
  }

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score || 0,
    metadata: match.metadata as unknown as CVMetadata,
  }));
}

/**
 * Apply post-search filters (for complex filters like skills array matching)
 */
function applyPostFilters(
  results: SearchResult[],
  filters?: SearchFilters
): SearchResult[] {
  if (!filters) return results;

  let filtered = results;

  // Skills filter (array contains)
  if (filters.skills && filters.skills.length > 0) {
    filtered = filtered.filter((result) => {
      const cvSkills = result.metadata.skills.map((s) => s.toLowerCase());
      return filters.skills!.some((filterSkill) =>
        cvSkills.some((cvSkill) => cvSkill.includes(filterSkill.toLowerCase()))
      );
    });
  }

  return filtered;
}

/**
 * Re-rank top results using GPT-4
 */
async function rerankWithGPT4(
  query: string,
  candidates: SearchResult[],
  topN: number = 10
): Promise<SearchResult[]> {
  if (candidates.length === 0) return [];

  const openai = getOpenAIClient();

  // Prepare candidate list for GPT-4
  const candidateList = candidates.map((c, idx) => ({
    index: idx,
    name: c.metadata.name,
    yearsExperience: c.metadata.yearsExperience,
    skills: c.metadata.skills.slice(0, 10).join(", "),
    vectorScore: c.score.toFixed(3),
  }));

  const prompt = `You are an expert recruiter. Rank these ${candidates.length} candidates for the following job requirement:

"${query}"

Candidates:
${candidateList.map((c, i) => `${i + 1}. ${c.name} - ${c.yearsExperience} years experience - Skills: ${c.skills} (Vector Score: ${c.vectorScore})`).join("\n")}

Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "rankings": [
    {
      "index": 0,
      "score": 95,
      "reasoning": "Brief explanation why this candidate is a good match"
    }
  ]
}

Rules:
- "index" is the 0-based index from the candidate list above
- "score" is 0-100 (100 = perfect match)
- Return top ${topN} candidates only
- Order by score descending
- Keep reasoning under 100 characters`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert recruiter that ranks candidates and returns ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from GPT-4");
    }

    const rankings = JSON.parse(content);

    // Map rankings back to candidates
    const reranked = rankings.rankings.map((r: any) => {
      const candidate = candidates[r.index];
      return {
        ...candidate,
        rerankScore: r.score,
        rerankReasoning: r.reasoning,
      };
    });

    console.log(`Re-ranked ${reranked.length} candidates using GPT-4`);

    return reranked;
  } catch (error: any) {
    console.error("Re-ranking error:", error.message);
    // Fall back to vector scores if re-ranking fails
    return candidates.slice(0, topN);
  }
}

/**
 * POST /api/search
 * Semantic search endpoint with optional re-ranking
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SearchRequest = await request.json();

    // Validate request
    if (!body.query || !body.userId) {
      return NextResponse.json(
        { error: "Missing required fields: query, userId" },
        { status: 400 }
      );
    }

    const { query, userId, filters, topK = 50, rerank = true } = body;

    console.log("Search request:", {
      query,
      userId,
      filters,
      topK,
      rerank,
    });

    // Step 1: Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    console.log("Query embedding generated:", {
      dimensions: queryEmbedding.length,
    });

    // Step 2: Search Pinecone
    const vectorResults = await searchPinecone(
      queryEmbedding,
      userId,
      topK,
      filters
    );

    console.log("Pinecone search completed:", {
      resultsCount: vectorResults.length,
    });

    // Step 3: Apply post-search filters
    const filteredResults = applyPostFilters(vectorResults, filters);

    console.log("Post-filtering completed:", {
      filteredCount: filteredResults.length,
    });

    // Step 4: Re-rank with GPT-4 (optional)
    let finalResults = filteredResults;

    if (rerank && filteredResults.length > 0) {
      const topCandidates = filteredResults.slice(0, 20); // Re-rank top 20
      finalResults = await rerankWithGPT4(query, topCandidates, 10);

      console.log("Re-ranking completed:", {
        rerankCount: finalResults.length,
      });
    } else {
      // Take top 10 without re-ranking
      finalResults = filteredResults.slice(0, 10);
    }

    const duration = Date.now() - startTime;

    console.log("Search completed:", {
      duration: `${duration}ms`,
      totalResults: filteredResults.length,
      returnedResults: finalResults.length,
    });

    return NextResponse.json({
      success: true,
      results: finalResults,
      totalResults: filteredResults.length,
      duration,
      reranked: rerank && filteredResults.length > 0,
    });
  } catch (error: any) {
    console.error("Search error:", error);

    return NextResponse.json(
      {
        error: "Search failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/health
 * Health check endpoint
 */
export async function GET() {
  try {
    const pinecone = getPineconeClient();
    const index = pinecone.index(INDEX_NAME);
    const stats = await index.describeIndexStats();

    return NextResponse.json({
      status: "healthy",
      index: INDEX_NAME,
      vectorCount: stats.totalRecordCount || 0,
      dimension: stats.dimension || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
