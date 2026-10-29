import { z } from "zod";

export const linkLeetCodeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: "LeetCode username is required." })
    .max(64, { message: "LeetCode username cannot exceed 64 characters." })
    .regex(/^[a-zA-Z0-9_\-]+$/, {
      message: "Username can only contain alphanumeric characters, underscores, and hyphens.",
    }),
});

export type LinkLeetCodeInput = z.infer<typeof linkLeetCodeSchema>;

export const importNumberSchema = z.object({
  questionNumber: z.coerce
    .number({ message: "Question number must be a valid number." })
    .int({ message: "Question number must be an integer." })
    .positive({ message: "Question number must be a positive integer." }),
});

export type ImportNumberInput = z.infer<typeof importNumberSchema>;

export const sync24hSchema = z.object({
  username: z.string().trim().optional(),
});

export type Sync24hInput = z.infer<typeof sync24hSchema>;

// =============================================================================
// Paste-Based LeetCode Import Validators (Zod v1 specification)
// =============================================================================

export const leetCodePastedItemSchema = z.object({
  id: z
    .number({ message: "Problem ID must be a number." })
    .int({ message: "Problem ID must be an integer." })
    .positive({ message: "Problem ID must be a positive integer." }),
  title: z
    .string({ message: "Problem title is required." })
    .trim()
    .min(1, { message: "Problem title cannot be empty." })
    .max(255, { message: "Problem title is too long." }),
  slug: z
    .string({ message: "Problem slug is required." })
    .trim()
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase alphanumeric characters and hyphens.",
    }),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"], {
    message: "Difficulty must be EASY, MEDIUM, or HARD.",
  }),
  topics: z
    .array(
      z
        .string()
        .trim()
        .max(64, { message: "Topic name must be at most 64 characters." })
    )
    .max(30, { message: "Too many topics for a single problem." })
    .default([]),
});

export type LeetCodePastedItem = z.infer<typeof leetCodePastedItemSchema>;

export const leetCodePastedPayloadSchema = z.object({
  version: z.literal(1, {
    message: "Invalid payload version. Only version 1 is supported.",
  }),
  problems: z
    .array(z.unknown(), {
      message: "Payload must include an array of problems.",
    })
    .max(5000, {
      message: "Payload exceeds maximum limit of 5000 problems.",
    }),
});

export type LeetCodePastedPayload = z.infer<typeof leetCodePastedPayloadSchema>;
