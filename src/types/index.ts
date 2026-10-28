// =============================================================================
// Shared types for the Problem domain
// =============================================================================

import type { Problem, Topic, TestCase, Submission } from "@prisma/client";

/**
 * Problem with its relations loaded — the shape returned by list/detail APIs.
 */
export type ProblemWithRelations = Problem & {
  topics: { topic: Topic }[];
  testCases: TestCase[];
  submissions: Submission[];
};

/**
 * Consistent API error shape used across all route handlers.
 * Client code can always rely on this structure.
 */
export type ApiError = {
  error: string;
  details?: Array<{ path: string; message: string }>;
};

/**
 * Paginated response wrapper.
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
