import { describe, it, expect } from "vitest";
import {
  createProblemSchema,
  updateProblemSchema,
  problemQuerySchema,
} from "../problem";

describe("createProblemSchema", () => {
  it("validates a minimal valid problem input", () => {
    const input = {
      title: "Valid Anagram",
      description: "Given two strings s and t, return true if t is an anagram of s.",
      difficulty: "EASY" as const,
    };

    const result = createProblemSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Valid Anagram");
      expect(result.data.source).toBe("MANUAL");
      expect(result.data.status).toBe("ATTEMPTED");
      expect(result.data.hints).toEqual([]);
      expect(result.data.topicNames).toEqual([]);
      expect(result.data.testCases).toEqual([]);
    }
  });

  it("fails if required fields are missing", () => {
    const input = {
      title: "",
      difficulty: "EASY",
    };

    const result = createProblemSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails if difficulty is invalid", () => {
    const input = {
      title: "Two Sum",
      description: "Find two numbers...",
      difficulty: "SUPER_HARD",
    };

    const result = createProblemSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates problem with topics, complexity, and examples", () => {
    const input = {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target...",
      difficulty: "EASY" as const,
      status: "SOLVED" as const,
      constraints: "2 <= nums.length <= 10^4",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      topicNames: ["Array", "Hash Table"],
      testCases: [
        {
          input: "nums = [2,7,11,15], target = 9",
          expectedOutput: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9",
        },
      ],
      hints: ["Try using a hash map for O(n) lookup"],
    };

    const result = createProblemSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topicNames).toHaveLength(2);
      expect(result.data.testCases).toHaveLength(1);
      expect(result.data.hints).toHaveLength(1);
      expect(result.data.timeComplexity).toBe("O(n)");
      expect(result.data.spaceComplexity).toBe("O(n)");
    }
  });
});

describe("updateProblemSchema", () => {
  it("allows partial updates", () => {
    const partial = {
      status: "SOLVED" as const,
      notes: "Solved using two pointers approach in O(n) time.",
    };

    const result = updateProblemSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });
});

describe("problemQuerySchema", () => {
  it("applies defaults for pagination and sorting", () => {
    const result = problemQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("createdAt");
      expect(result.data.sortOrder).toBe("desc");
    }
  });

  it("parses filter parameters including topic, date range and sort options", () => {
    const result = problemQuerySchema.safeParse({
      page: "2",
      limit: "50",
      difficulty: "MEDIUM",
      status: "SOLVED",
      topic: "dynamic-programming",
      search: "binary search",
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T23:59:59.000Z",
      sortBy: "solvedAt",
      sortOrder: "asc",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
      expect(result.data.difficulty).toBe("MEDIUM");
      expect(result.data.status).toBe("SOLVED");
      expect(result.data.topic).toBe("dynamic-programming");
      expect(result.data.search).toBe("binary search");
      expect(result.data.from).toBe("2026-01-01T00:00:00.000Z");
      expect(result.data.sortBy).toBe("solvedAt");
      expect(result.data.sortOrder).toBe("asc");
    }
  });
});
