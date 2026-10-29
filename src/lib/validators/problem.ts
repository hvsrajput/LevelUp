// =============================================================================
// Zod schemas for Problem validation
// =============================================================================
// Used at EVERY API boundary: route handlers parse incoming JSON through these
// schemas before touching the database. This ensures type safety at runtime,
// not just compile time.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums (mirroring Prisma enums for Zod validation)
// ---------------------------------------------------------------------------

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);
export const ProblemSourceEnum = z.enum(["MANUAL", "LEETCODE"]);
export const ProblemStatusEnum = z.enum(["ATTEMPTED", "SOLVED", "REVISIT"]);

// ---------------------------------------------------------------------------
// Nested object schemas
// ---------------------------------------------------------------------------

export const approachSchema = z.object({
  title: z.string().min(1, "Approach title is required"),
  description: z.string().min(1, "Approach description is required"),
});

export const testCaseSchema = z.object({
  id: z.string().optional(), // present when editing existing
  input: z.string().min(1, "Test case input is required"),
  expectedOutput: z.string().min(1, "Expected output is required"),
  explanation: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Create Problem schema
// ---------------------------------------------------------------------------

export const createProblemSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(10000, "Description must be 10,000 characters or fewer"),
  difficulty: DifficultyEnum,
  source: ProblemSourceEnum.default("MANUAL"),
  status: ProblemStatusEnum.default("ATTEMPTED"),

  // LeetCode fields (optional, only when source=LEETCODE)
  leetcodeQuestionId: z.number().int().positive().nullable().optional(),
  titleSlug: z.string().nullable().optional(),

  constraints: z.string().max(5000).nullable().optional(),
  hints: z.array(z.string()).default([]),
  approaches: z.array(approachSchema).default([]),
  notes: z.string().max(10000).nullable().optional(),
  solvedAt: z.string().datetime().nullable().optional(),

  // Related entities
  topicNames: z.array(z.string().min(1)).default([]),
  testCases: z.array(testCaseSchema).default([]),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

// ---------------------------------------------------------------------------
// Update Problem schema (all fields optional)
// ---------------------------------------------------------------------------

export const updateProblemSchema = createProblemSchema.partial();

export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;

// ---------------------------------------------------------------------------
// Query params schema for listing/filtering
// ---------------------------------------------------------------------------

export const problemQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  difficulty: DifficultyEnum.optional(),
  status: ProblemStatusEnum.optional(),
  topic: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "difficulty", "solvedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProblemQuery = z.infer<typeof problemQuerySchema>;
