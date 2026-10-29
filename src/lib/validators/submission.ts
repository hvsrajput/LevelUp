// =============================================================================
// Zod schemas for Code Submissions
// =============================================================================

import { z } from "zod";
import { ProblemStatusEnum } from "./problem";

export const SUPPORTED_LANGUAGES = [
  "python",
  "typescript",
  "javascript",
  "cpp",
  "java",
  "go",
  "rust",
  "csharp",
] as const;

export const createSubmissionSchema = z.object({
  language: z.string().min(1, "Language is required"),
  code: z
    .string()
    .min(1, "Code cannot be empty")
    .max(50000, "Code exceeds maximum length of 50,000 characters"),
  runtime: z.string().max(50).optional(),
  memory: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  markStatus: ProblemStatusEnum.optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
