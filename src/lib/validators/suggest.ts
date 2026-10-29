// =============================================================================
// Zod schemas for RAG Suggestion Endpoint
// =============================================================================

import { z } from "zod";

export const suggestInputSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title is too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters to analyze patterns")
    .max(10000, "Description is too long"),
  constraints: z.string().max(5000).optional().nullable(),
});

export type SuggestInput = z.infer<typeof suggestInputSchema>;

export const candidateApproachSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
});

export const progressiveHintSchema = z.object({
  level: z.enum(["nudge", "moderate", "strong"]),
  text: z.string().min(1),
});

export const citedPatternSchema = z.object({
  id: z.string(),
  topic: z.string(),
  signals: z.string(),
});

export const suggestResponseSchema = z.object({
  suggestedTopics: z.array(z.string()).min(1),
  candidateApproaches: z.array(candidateApproachSchema).min(1).max(3),
  progressiveHints: z.array(progressiveHintSchema).min(1),
  citedPatterns: z.array(citedPatternSchema).min(1),
});

export type SuggestResponse = z.infer<typeof suggestResponseSchema>;
