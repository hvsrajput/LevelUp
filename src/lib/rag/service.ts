// =============================================================================
// RAG Service: Pattern Retrieval + Grounded Suggestion Generator
// =============================================================================

import { prisma } from "@/lib/prisma";
import { CURATED_DSA_PATTERNS } from "./patterns-data";
import {
  type SuggestInput,
  type SuggestResponse,
  suggestResponseSchema,
} from "@/lib/validators/suggest";

export interface PatternChunk {
  id: string;
  topic: string;
  signals: string;
  description: string;
  approaches: Array<{
    title: string;
    description: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  }>;
  hints: Array<{
    level: "nudge" | "moderate" | "strong";
    text: string;
  }>;
}

/**
 * Tokenizes text into lowercase alphanumeric keywords
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Calculates a BM25-style keyword relevance score between query and a pattern chunk
 */
function calculateRelevanceScore(queryTokens: string[], pattern: PatternChunk): number {
  const signalTokens = new Set(tokenize(pattern.signals));
  const topicTokens = new Set(tokenize(pattern.topic));
  const descTokens = new Set(tokenize(pattern.description));

  let score = 0;
  for (const token of queryTokens) {
    // Topic matches carry highest weight
    if (topicTokens.has(token)) score += 5;
    // Explicit signals carry strong weight
    if (signalTokens.has(token)) score += 3;
    // General description matches carry baseline weight
    if (descTokens.has(token)) score += 1;
  }

  return score;
}

/**
 * Retrieves the nearest pattern chunks from the knowledge base
 */
export async function retrieveNearestPatterns(
  query: string,
  topK = 3
): Promise<PatternChunk[]> {
  let dbPatterns: PatternChunk[] = [];

  try {
    const raw = await prisma.dsaPattern.findMany();
    if (raw.length > 0) {
      dbPatterns = raw.map((p) => ({
        id: p.id,
        topic: p.topic,
        signals: p.signals,
        description: p.description,
        approaches: p.approaches as PatternChunk["approaches"],
        hints: p.hints as PatternChunk["hints"],
      }));
    }
  } catch (err) {
    // Fall back to in-memory curated patterns if database is unseeded or during early migration
    console.warn("Could not query DsaPattern table, using in-memory dataset:", err);
  }

  if (dbPatterns.length === 0) {
    dbPatterns = CURATED_DSA_PATTERNS.map((p, idx) => ({
      id: `pattern-${idx + 1}`,
      ...p,
    }));
  }

  const queryTokens = tokenize(query);

  const scored = dbPatterns.map((pattern) => ({
    pattern,
    score: calculateRelevanceScore(queryTokens, pattern),
  }));

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Take top K patterns (at least 1, default 2-3)
  const topMatches = scored.slice(0, Math.max(1, topK));

  // If no scores matched (e.g. obscure query), default to top patterns
  return topMatches.map((m) => m.pattern);
}

/**
 * Calls external LLM (Gemini / OpenAI) if API keys are set, grounded strictly on chunks
 */
async function callLLMGrounded(
  input: SuggestInput,
  retrievedPatterns: PatternChunk[]
): Promise<SuggestResponse | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!geminiApiKey && !openAiApiKey) {
    return null; // Fall back to deterministic grounded synthesis
  }

  const prompt = `You are an expert DSA mentor assisting a software engineer.
You must ground your response ONLY on the provided DSA Pattern Chunks below. Do not invent patterns outside these chunks.

### User Problem Statement:
Title: ${input.title}
Description: ${input.description}
Constraints: ${input.constraints || "None specified"}

### Retrieved DSA Knowledge Base Chunks:
${retrievedPatterns
  .map(
    (p, i) => `[Chunk ${i + 1}] Pattern: ${p.topic}
Signals: ${p.signals}
Description: ${p.description}
Approaches: ${JSON.stringify(p.approaches)}
Hints: ${JSON.stringify(p.hints)}`
  )
  .join("\n\n")}

### Instructions:
1. Identify 1 to 3 relevant topics present in the chunks.
2. Provide 1 to 3 candidate approaches adapted to this problem, derived from the chunks.
3. Provide progressive hints (nudge -> moderate -> strong) grounded in the chunk hints.
4. Return a strictly valid JSON object matching this schema:
{
  "suggestedTopics": ["Topic1", "Topic2"],
  "candidateApproaches": [
    {
      "title": "Approach Title",
      "description": "Step by step description for this problem",
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)"
    }
  ],
  "progressiveHints": [
    { "level": "nudge", "text": "..." },
    { "level": "moderate", "text": "..." },
    { "level": "strong", "text": "..." }
  ],
  "citedPatterns": [
    { "id": "${retrievedPatterns[0]?.id || "p1"}", "topic": "${retrievedPatterns[0]?.topic}", "signals": "${retrievedPatterns[0]?.signals}" }
  ]
}`;

  try {
    if (geminiApiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const valid = suggestResponseSchema.safeParse(parsed);
          if (valid.success) return valid.data;
        }
      }
    } else if (openAiApiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const valid = suggestResponseSchema.safeParse(parsed);
          if (valid.success) return valid.data;
        }
      }
    }
  } catch (err) {
    console.warn("LLM API call failed, falling back to deterministic synthesis:", err);
  }

  return null;
}

/**
 * Deterministic Grounded Synthesis: Builds high-quality suggestions directly
 * from the retrieved knowledge base chunks when external LLM is not configured.
 */
function synthesizeFromChunks(
  _input: SuggestInput,
  retrievedPatterns: PatternChunk[]
): SuggestResponse {
  const topics = Array.from(new Set(retrievedPatterns.map((p) => p.topic)));

  const candidateApproaches: SuggestResponse["candidateApproaches"] = [];
  for (const pattern of retrievedPatterns) {
    for (const app of pattern.approaches) {
      if (candidateApproaches.length < 3) {
        candidateApproaches.push({
          title: `${pattern.topic}: ${app.title}`,
          description: app.description,
          timeComplexity: app.timeComplexity,
          spaceComplexity: app.spaceComplexity,
        });
      }
    }
  }

  // Progressive hints: collect nudge, moderate, and strong from top pattern
  const topPattern = retrievedPatterns[0];
  const progressiveHints: SuggestResponse["progressiveHints"] = topPattern.hints.map((h) => ({
    level: h.level,
    text: h.text,
  }));

  const citedPatterns: SuggestResponse["citedPatterns"] = retrievedPatterns.map((p) => ({
    id: p.id,
    topic: p.topic,
    signals: p.signals,
  }));

  return {
    suggestedTopics: topics,
    candidateApproaches,
    progressiveHints,
    citedPatterns,
  };
}

/**
 * Main Service Function: Retrieves relevant patterns and generates grounded suggestions
 */
export async function generateSuggestions(
  input: SuggestInput
): Promise<SuggestResponse> {
  const queryText = `${input.title}\n\n${input.description}\n\n${input.constraints || ""}`;
  const retrievedPatterns = await retrieveNearestPatterns(queryText, 2);

  // Try LLM grounded generation first if keys are configured
  const llmResult = await callLLMGrounded(input, retrievedPatterns);
  if (llmResult) {
    return llmResult;
  }

  // Otherwise, use deterministic grounded synthesis from retrieved chunks
  return synthesizeFromChunks(input, retrievedPatterns);
}
