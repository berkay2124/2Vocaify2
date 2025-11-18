import OpenAI from "openai";
import * as functions from "firebase-functions";

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface WorkHistory {
  title: string;
  company: string;
  years: string;
  description: string;
}

export interface ExtractedCVData {
  name: string;
  email: string;
  phone: string;
  yearsExperience: number;
  skills: string[];
  education: Education[];
  workHistory: WorkHistory[];
  summary: string;
}

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
 * Extract structured data from CV text using OpenAI
 * @param cvText - Extracted text from CV
 * @param filename - Original filename for context
 * @returns Structured CV data
 */
export async function extractCVDataWithAI(
  cvText: string,
  filename: string
): Promise<ExtractedCVData> {
  const openai = getOpenAIClient();

  functions.logger.info(`Processing CV with OpenAI: ${filename}`);

  const prompt = `You are an expert CV/resume parser. Extract structured data from the following CV text.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations, no additional text.

Required JSON structure:
{
  "name": "Full name of the candidate",
  "email": "Email address or empty string if not found",
  "phone": "Phone number or empty string if not found",
  "yearsExperience": "Total years of professional experience as a number",
  "skills": ["Array of technical and professional skills"],
  "education": [
    {
      "degree": "Degree name",
      "institution": "Institution name",
      "year": "Year or year range"
    }
  ],
  "workHistory": [
    {
      "title": "Job title",
      "company": "Company name",
      "years": "Employment period",
      "description": "Brief description of responsibilities"
    }
  ],
  "summary": "A 2-3 sentence professional summary highlighting key qualifications and experience"
}

Guidelines:
- Extract ALL skills mentioned (technical, soft skills, tools, languages, frameworks)
- Calculate yearsExperience by analyzing work history dates
- If a field is not found, use empty string or empty array
- Keep descriptions concise but informative
- Ensure all JSON is properly escaped
- Do not include any text outside the JSON object

CV Text:
${cvText.substring(0, 12000)}`;

  try {
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional CV parser that extracts structured data and returns ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const duration = Date.now() - startTime;
    const usage = completion.usage;

    functions.logger.info("OpenAI API call completed", {
      duration: `${duration}ms`,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    // Parse JSON response
    let extractedData: ExtractedCVData;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      functions.logger.error("Failed to parse OpenAI response:", content);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError}`);
    }

    // Validate required fields
    if (!extractedData.name || extractedData.name.length < 2) {
      throw new Error("Failed to extract candidate name");
    }

    // Ensure arrays exist
    extractedData.skills = extractedData.skills || [];
    extractedData.education = extractedData.education || [];
    extractedData.workHistory = extractedData.workHistory || [];

    // Ensure yearsExperience is a number
    if (typeof extractedData.yearsExperience !== "number") {
      extractedData.yearsExperience = 0;
    }

    functions.logger.info("CV data extraction successful", {
      name: extractedData.name,
      skillsCount: extractedData.skills.length,
      educationCount: extractedData.education.length,
      workHistoryCount: extractedData.workHistory.length,
      yearsExperience: extractedData.yearsExperience,
    });

    return extractedData;
  } catch (error: any) {
    functions.logger.error("OpenAI API error:", {
      error: error.message,
      type: error.type,
      code: error.code,
    });

    // Handle rate limiting
    if (error.code === "rate_limit_exceeded") {
      throw new Error("OpenAI rate limit exceeded. Please try again later.");
    }

    // Handle authentication errors
    if (error.code === "invalid_api_key") {
      throw new Error("Invalid OpenAI API key. Please check configuration.");
    }

    throw new Error(`OpenAI processing failed: ${error.message}`);
  }
}

/**
 * Calculate estimated cost for OpenAI API call
 * @param promptTokens - Number of tokens in prompt
 * @param completionTokens - Number of tokens in completion
 * @returns Estimated cost in USD
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number
): number {
  // GPT-4o-mini pricing (as of Nov 2024)
  // Input: $0.150 per 1M tokens
  // Output: $0.600 per 1M tokens
  const inputCost = (promptTokens / 1_000_000) * 0.15;
  const outputCost = (completionTokens / 1_000_000) * 0.6;
  return inputCost + outputCost;
}
