import OpenAI from "openai";
import * as functions from "firebase-functions";

/**
 * Initialize OpenAI client
 * @returns OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  const apiKey = functions.config().openai?.key;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Run: firebase functions:config:set openai.key=YOUR_KEY"
    );
  }

  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * Generate searchable text from CV data
 * Combines key fields for embedding generation
 * @param cvData - Extracted CV data
 * @returns Combined text for embedding
 */
export function generateSearchableText(cvData: {
  name: string;
  skills: string[];
  yearsExperience: number;
  summary: string;
  workHistory?: Array<{ title: string; company: string; description: string }>;
  education?: Array<{ degree: string; institution: string }>;
}): string {
  const parts: string[] = [];

  // Name
  parts.push(`Candidate: ${cvData.name}`);

  // Years of experience
  parts.push(`${cvData.yearsExperience} years of professional experience`);

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    parts.push(`Skills: ${cvData.skills.join(", ")}`);
  }

  // Summary
  if (cvData.summary) {
    parts.push(cvData.summary);
  }

  // Work history
  if (cvData.workHistory && cvData.workHistory.length > 0) {
    const workText = cvData.workHistory
      .slice(0, 3) // Top 3 positions
      .map((work) => `${work.title} at ${work.company}. ${work.description}`)
      .join(". ");
    parts.push(workText);
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    const eduText = cvData.education
      .map((edu) => `${edu.degree} from ${edu.institution}`)
      .join(". ");
    parts.push(eduText);
  }

  return parts.join(". ");
}

/**
 * Generate embedding vector for CV using OpenAI
 * @param text - Text to embed
 * @returns Embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  functions.logger.info("Generating embedding", {
    textLength: text.length,
  });

  try {
    const startTime = Date.now();

    // Truncate text to ~8000 tokens (roughly 32000 characters)
    const truncatedText = text.substring(0, 32000);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncatedText,
      encoding_format: "float",
    });

    const duration = Date.now() - startTime;
    const embedding = response.data[0].embedding;

    functions.logger.info("Embedding generation successful", {
      duration: `${duration}ms`,
      dimensions: embedding.length,
      totalTokens: response.usage.total_tokens,
      estimatedCost: `$${(response.usage.total_tokens / 1_000_000 * 0.02).toFixed(6)}`,
    });

    return embedding;
  } catch (error: any) {
    functions.logger.error("Embedding generation error:", {
      error: error.message,
      type: error.type,
      code: error.code,
    });

    // Handle rate limiting
    if (error.code === "rate_limit_exceeded") {
      throw new Error("OpenAI rate limit exceeded. Please try again later.");
    }

    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embedding for search query
 * @param query - Search query text
 * @returns Embedding vector
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  functions.logger.info("Generating query embedding", { query });

  return generateEmbedding(query);
}

/**
 * Batch generate embeddings for multiple texts
 * @param texts - Array of texts to embed
 * @param batchSize - Number of texts per batch (max 2048 for OpenAI)
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const openai = getOpenAIClient();
  const embeddings: number[][] = [];

  functions.logger.info("Starting batch embedding generation", {
    totalTexts: texts.length,
    batchSize,
  });

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((text) =>
      text.substring(0, 32000)
    );

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
        encoding_format: "float",
      });

      const batchEmbeddings = response.data.map((item) => item.embedding);
      embeddings.push(...batchEmbeddings);

      functions.logger.info(`Batch ${Math.floor(i / batchSize) + 1} completed`, {
        processed: Math.min(i + batchSize, texts.length),
        total: texts.length,
        tokens: response.usage.total_tokens,
      });
    } catch (error: any) {
      functions.logger.error("Batch embedding error:", {
        batch: Math.floor(i / batchSize) + 1,
        error: error.message,
      });
      throw error;
    }
  }

  return embeddings;
}
