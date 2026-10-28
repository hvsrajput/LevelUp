// =============================================================================
// Utility functions
// =============================================================================

// Re-export cn from the "cn" package (used by shadcn/ui components)
export { cn } from "cn";

import { nanoid } from "nanoid";

/**
 * Generate a short, URL-friendly code for human-readable problem URLs.
 * 8 characters gives ~2.8 trillion combinations — plenty for a personal tracker.
 */
export function generateShortCode(): string {
  return nanoid(8);
}

/**
 * Format a date for display.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Difficulty color mapping for consistent UI.
 */
export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "EASY":
      return "text-green-600 bg-green-50 border-green-200";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "HARD":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

/**
 * Status color mapping.
 */
export function statusColor(status: string): string {
  switch (status) {
    case "SOLVED":
      return "text-green-700 bg-green-100";
    case "ATTEMPTED":
      return "text-blue-700 bg-blue-100";
    case "REVISIT":
      return "text-orange-700 bg-orange-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
}
