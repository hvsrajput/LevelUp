import { describe, it, expect } from "vitest";
import {
  suggestInputSchema,
  suggestResponseSchema,
} from "../suggest";

describe("suggestInputSchema", () => {
  it("validates valid suggestion input", () => {
    const input = {
      title: "Minimum Window Substring",
      description: "Given two strings s and t, return the shortest substring of s that contains all characters of t.",
      constraints: "1 <= s.length, t.length <= 10^5",
    };

    const result = suggestInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Minimum Window Substring");
    }
  });

  it("fails if title or description is too short", () => {
    const input = {
      title: "A",
      description: "short",
    };

    const result = suggestInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("suggestResponseSchema", () => {
  it("validates grounded suggestion response structure", () => {
    const response = {
      suggestedTopics: ["Sliding Window", "Hash Table"],
      candidateApproaches: [
        {
          title: "Dynamic Sliding Window with Frequency Map",
          description: "Expand right, shrink left when valid.",
          timeComplexity: "O(n)",
          spaceComplexity: "O(k)",
        },
      ],
      progressiveHints: [
        { level: "nudge" as const, text: "Look at contiguous substring." },
        { level: "moderate" as const, text: "Maintain a frequency counter." },
        { level: "strong" as const, text: "Contract left when condition is satisfied." },
      ],
      citedPatterns: [
        {
          id: "p-sliding-window",
          topic: "Sliding Window",
          signals: "contiguous subarray, substring",
        },
      ],
    };

    const result = suggestResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
