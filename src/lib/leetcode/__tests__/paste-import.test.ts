/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    problem: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    topic: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    topicOnProblem: {
      createMany: vi.fn(),
    },
    catalogProblem: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  parseAndValidateLeetCodePayload,
  previewLeetCodeImport,
  confirmLeetCodeImport,
} from "../paste-import";

describe("Paste-Based LeetCode Import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseAndValidateLeetCodePayload Validation Edge Cases", () => {
    it("parses and validates a clean valid payload and derives URLs strictly from slugs", () => {
      const payload = JSON.stringify({
        version: 1,
        problems: [
          {
            id: 1,
            title: "Two Sum",
            slug: "two-sum",
            difficulty: "EASY",
            topics: ["Array", "Hash Table"],
            injectedUrl: "https://evil.com/hacked", // should be ignored!
          },
          {
            id: 200,
            title: "Number of Islands",
            slug: "number-of-islands",
            difficulty: "MEDIUM",
            topics: ["Array", "DFS", "BFS"],
          },
        ],
      });

      const result = parseAndValidateLeetCodePayload(payload);
      expect(result.invalidCount).toBe(0);
      expect(result.validProblems).toHaveLength(2);

      // Verify URL is derived strictly from slug and ignores injected URLs
      expect(result.validProblems[0].url).toBe("https://leetcode.com/problems/two-sum/");
      expect((result.validProblems[0] as any).injectedUrl).toBeUndefined();
      expect(result.validProblems[1].url).toBe(
        "https://leetcode.com/problems/number-of-islands/"
      );
    });

    it("rejects huge payloads exceeding 1 MB limit", () => {
      // Create a payload larger than 1 MB
      const largeTitle = "A".repeat(1024 * 1024 + 10);
      const hugePayload = JSON.stringify({
        version: 1,
        problems: [{ id: 1, title: largeTitle, slug: "huge", difficulty: "EASY" }],
      });

      expect(() => parseAndValidateLeetCodePayload(hugePayload)).toThrow(
        "exceeds the 1 MB maximum limit"
      );
    });

    it("rejects malformed JSON", () => {
      expect(() => parseAndValidateLeetCodePayload("{ invalid json : true")).toThrow(
        "Malformed JSON"
      );
    });

    it("rejects wrong payload version or missing version", () => {
      const wrongVersion = JSON.stringify({ version: 2, problems: [] });
      expect(() => parseAndValidateLeetCodePayload(wrongVersion)).toThrow(
        "Only version 1 is supported"
      );

      const noVersion = JSON.stringify({ problems: [] });
      expect(() => parseAndValidateLeetCodePayload(noVersion)).toThrow(
        "Invalid payload"
      );
    });

    it("rejects payloads exceeding the 5000 problem limit", () => {
      const items = Array.from({ length: 5001 }, (_, i) => ({
        id: i + 1,
        title: `Problem ${i + 1}`,
        slug: `problem-${i + 1}`,
        difficulty: "EASY",
      }));

      const payload = JSON.stringify({ version: 1, problems: items });
      expect(() => parseAndValidateLeetCodePayload(payload)).toThrow(
        "exceeds maximum limit of 5000 problems"
      );
    });

    it("flags bad slugs as invalid (uppercase, spaces, special symbols)", () => {
      const payload = JSON.stringify({
        version: 1,
        problems: [
          { id: 1, title: "Valid", slug: "valid-slug", difficulty: "EASY" },
          { id: 2, title: "Uppercase", slug: "Two-Sum", difficulty: "EASY" },
          { id: 3, title: "Spaces", slug: "two sum", difficulty: "EASY" },
          { id: 4, title: "Symbols", slug: "slug@name!", difficulty: "EASY" },
        ],
      });

      const result = parseAndValidateLeetCodePayload(payload);
      expect(result.validProblems).toHaveLength(1);
      expect(result.validProblems[0].slug).toBe("valid-slug");
      expect(result.invalidCount).toBe(3);
    });

    it("rejects javascript: in slug field as invalid", () => {
      const payload = JSON.stringify({
        version: 1,
        problems: [
          {
            id: 1,
            title: "XSS Attempt",
            slug: "javascript:alert(1)",
            difficulty: "HARD",
          },
        ],
      });

      const result = parseAndValidateLeetCodePayload(payload);
      expect(result.validProblems).toHaveLength(0);
      expect(result.invalidCount).toBe(1);
    });

    it("flags duplicate problem IDs within the payload as invalid", () => {
      const payload = JSON.stringify({
        version: 1,
        problems: [
          { id: 1, title: "Two Sum", slug: "two-sum", difficulty: "EASY" },
          { id: 1, title: "Two Sum Duplicate", slug: "two-sum", difficulty: "EASY" },
          { id: 2, title: "Add Two Numbers", slug: "add-two-numbers", difficulty: "MEDIUM" },
        ],
      });

      const result = parseAndValidateLeetCodePayload(payload);
      expect(result.validProblems).toHaveLength(2);
      expect(result.invalidCount).toBe(1); // duplicate is marked invalid
    });

    it("flags invalid difficulty or non-positive id as invalid", () => {
      const payload = JSON.stringify({
        version: 1,
        problems: [
          { id: -1, title: "Negative ID", slug: "neg-id", difficulty: "EASY" },
          { id: 0, title: "Zero ID", slug: "zero-id", difficulty: "EASY" },
          { id: 5, title: "Bad Difficulty", slug: "bad-diff", difficulty: "EXTREME" },
        ],
      });

      const result = parseAndValidateLeetCodePayload(payload);
      expect(result.validProblems).toHaveLength(0);
      expect(result.invalidCount).toBe(3);
    });
  });

  describe("previewLeetCodeImport", () => {
    it("returns accurate counts for new, already imported, and invalid problems", async () => {
      const payload = JSON.stringify({
        version: 1,
        problems: [
          { id: 1, title: "Two Sum", slug: "two-sum", difficulty: "EASY" },
          { id: 2, title: "Add Two Numbers", slug: "add-two-numbers", difficulty: "MEDIUM" },
          { id: 3, title: "Invalid Problem", slug: "INVALID SLUG", difficulty: "HARD" },
        ],
      });

      // User already has problem #1
      (prismaMock.problem.findMany as any).mockResolvedValueOnce([
        { leetcodeQuestionId: 1 },
      ]);

      const preview = await previewLeetCodeImport("user-1", payload);

      expect(preview.newCount).toBe(1); // #2 is new
      expect(preview.alreadyImportedCount).toBe(1); // #1 is already tracked
      expect(preview.invalidCount).toBe(1); // #3 had bad slug
      expect(preview.totalValid).toBe(2);
      expect(preview.sampleTitles).toEqual(["Add Two Numbers"]);
    });
  });

  describe("confirmLeetCodeImport & Idempotent Re-Import", () => {
    const validPayload = JSON.stringify({
      version: 1,
      problems: [
        {
          id: 1,
          title: "Two Sum",
          slug: "two-sum",
          difficulty: "EASY",
          topics: ["Array", "Hash Table"],
        },
        {
          id: 200,
          title: "Number of Islands",
          slug: "number-of-islands",
          difficulty: "MEDIUM",
          topics: ["Array", "Graph"],
        },
      ],
    });

    it("performs batch insert with createMany skipDuplicates, status SOLVED, solvedAt null, and upserts topics outside transaction", async () => {
      (prismaMock.problem.createMany as any).mockResolvedValueOnce({ count: 2 });
      (prismaMock.topic.createMany as any).mockResolvedValueOnce({ count: 3 });
      (prismaMock.topic.findMany as any).mockResolvedValueOnce([
        { id: "top-1", name: "Array" },
        { id: "top-2", name: "Hash Table" },
        { id: "top-3", name: "Graph" },
      ]);
      (prismaMock.problem.findMany as any).mockResolvedValueOnce([
        { id: "prob-1", leetcodeQuestionId: 1 },
        { id: "prob-2", leetcodeQuestionId: 200 },
      ]);
      (prismaMock.topicOnProblem.createMany as any).mockResolvedValueOnce({ count: 4 });
      (prismaMock.catalogProblem.createMany as any).mockResolvedValueOnce({ count: 2 });

      const res = await confirmLeetCodeImport("user-1", validPayload);

      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(2);
      expect(res.alreadyExistedCount).toBe(0);

      // Verify createMany was called with skipDuplicates and correct defaults
      expect(prismaMock.problem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: "user-1",
            title: "Two Sum",
            difficulty: "EASY",
            source: "LEETCODE",
            status: "SOLVED",
            solvedAt: null,
            leetcodeQuestionId: 1,
            titleSlug: "two-sum",
          }),
        ]),
        skipDuplicates: true,
      });

      // Verify topics upsert was called with skipDuplicates outside transaction
      expect(prismaMock.topic.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: "Array" }),
          expect.objectContaining({ name: "Hash Table" }),
          expect.objectContaining({ name: "Graph" }),
        ]),
        skipDuplicates: true,
      });
    });

    it("is completely idempotent on re-importing the same payload", async () => {
      // Second run: createMany inserts 0 rows because skipDuplicates catches all existing @@unique([userId, leetcodeQuestionId])
      (prismaMock.problem.createMany as any).mockResolvedValueOnce({ count: 0 });
      (prismaMock.topic.createMany as any).mockResolvedValueOnce({ count: 0 });
      (prismaMock.topic.findMany as any).mockResolvedValueOnce([]);
      (prismaMock.problem.findMany as any).mockResolvedValueOnce([]);

      const res = await confirmLeetCodeImport("user-1", validPayload);

      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(0);
      expect(res.alreadyExistedCount).toBe(2);
      expect(res.totalProcessed).toBe(2);
    });
  });
});
