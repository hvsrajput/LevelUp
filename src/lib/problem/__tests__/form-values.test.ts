import { describe, it, expect } from "vitest";
import { toFormValues, filterInternalTopics } from "../form-values";

describe("toFormValues mapper", () => {
  it("converts a saved Problem with all fields and relations", () => {
    const savedProblem = {
      id: "prob-123",
      shortCode: "twosum1",
      title: "Two Sum",
      difficulty: "EASY",
      status: "SOLVED",
      description: "Given an array of integers nums and an integer target...",
      constraints: "2 <= nums.length <= 10^4",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      titleSlug: "two-sum",
      url: "https://leetcode.com/problems/two-sum/",
      catalogProblemId: "cat-1",
      notes: "Used hash table for complement lookup",
      hints: ["Try using a hash map", "Check complement in map"],
      approaches: [
        { title: "Brute Force", description: "O(n^2) nested loop" },
        { title: "One-pass Hash Table", description: "O(n) time and O(n) space" },
      ],
      topics: [
        { topic: { id: "t1", name: "Array", slug: "array" } },
        { topic: { id: "t2", name: "Hash Table", slug: "hash-table" } },
        { topic: { id: "t3", name: "#imported-from-leetcode", slug: "imported" } },
      ],
      testCases: [
        {
          id: "tc-1",
          input: "nums = [2,7,11,15], target = 9",
          expectedOutput: "[0, 1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
        },
      ],
      submissions: [
        {
          id: "sub-1",
          language: "typescript",
          code: "function twoSum(nums: number[], target: number) { return [0, 1]; }",
          createdAt: new Date(),
        },
      ],
    };

    const values = toFormValues(savedProblem);

    expect(values.id).toBe("prob-123");
    expect(values.title).toBe("Two Sum");
    expect(values.difficulty).toBe("EASY");
    expect(values.status).toBe("SOLVED");
    expect(values.description).toBe("Given an array of integers nums and an integer target...");
    expect(values.constraints).toBe("2 <= nums.length <= 10^4");
    expect(values.timeComplexity).toBe("O(n)");
    expect(values.spaceComplexity).toBe("O(n)");
    expect(values.titleSlug).toBe("two-sum");
    expect(values.url).toBe("https://leetcode.com/problems/two-sum/");
    expect(values.catalogProblemId).toBe("cat-1");
    expect(values.notes).toBe("Used hash table for complement lookup");
    expect(values.hints).toEqual(["Try using a hash map", "Check complement in map"]);
    expect(values.approaches).toEqual([
      { title: "Brute Force", description: "O(n^2) nested loop" },
      { title: "One-pass Hash Table", description: "O(n) time and O(n) space" },
    ]);
    expect(values.topics).toEqual(["Array", "Hash Table"]); // #imported-from-leetcode filtered out
    expect(values.testCases).toEqual([
      {
        id: "tc-1",
        input: "nums = [2,7,11,15], target = 9",
        expectedOutput: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ]);
    expect(values.code).toBe(
      "function twoSum(nums: number[], target: number) { return [0, 1]; }"
    );
    expect(values.language).toBe("typescript");
  });

  it("converts a CatalogProblem into prefilled form values", () => {
    const catalogItem = {
      id: "catalog-3sum",
      title: "3Sum",
      difficulty: "MEDIUM",
      summary: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
      topicTags: ["Array", "Two Pointers", "Sorting", "#interview-favorite"],
      patternTag: "two-pointers-two-sum",
      leetcodeQuestionId: 15,
      url: "https://leetcode.com/problems/3sum/",
    };

    const values = toFormValues(catalogItem);

    expect(values.title).toBe("3Sum");
    expect(values.difficulty).toBe("MEDIUM");
    expect(values.status).toBe("ATTEMPTED");
    expect(values.description).toBe(catalogItem.summary); // mapped from summary
    expect(values.catalogProblemId).toBe("catalog-3sum");
    expect(values.titleSlug).toBe("3sum");
    expect(values.url).toBe("https://leetcode.com/problems/3sum/");
    expect(values.topics).toEqual(["Array", "Two Pointers", "Sorting"]); // #interview-favorite filtered
    expect(values.constraints).toBe("");
    expect(values.timeComplexity).toBe("");
    expect(values.spaceComplexity).toBe("");
    expect(values.hints).toEqual([]);
    expect(values.approaches).toEqual([]);
    expect(values.testCases).toEqual([]);
    expect(values.code).toBe("");
    expect(values.language).toBe("typescript");
  });

  it("filters internal tags starting with # correctly", () => {
    const raw = ["Array", "#imported-from-leetcode", "Two Pointers", "#lc-tag", " "];
    const filtered = filterInternalTopics(raw);
    expect(filtered).toEqual(["Array", "Two Pointers"]);
  });

  it("handles null and empty optional fields safely", () => {
    const values = toFormValues(null);
    expect(values.title).toBe("");
    expect(values.difficulty).toBe("MEDIUM");
    expect(values.status).toBe("ATTEMPTED");
    expect(values.description).toBe("");
    expect(values.constraints).toBe("");
    expect(values.timeComplexity).toBe("");
    expect(values.spaceComplexity).toBe("");
    expect(values.topics).toEqual([]);
    expect(values.testCases).toEqual([]);
    expect(values.hints).toEqual([]);
    expect(values.approaches).toEqual([]);
    expect(values.notes).toBe("");
    expect(values.code).toBe("");
    expect(values.language).toBe("typescript");
    expect(values.titleSlug).toBe("");
    expect(values.url).toBe("");
    expect(values.catalogProblemId).toBeNull();
  });
});
