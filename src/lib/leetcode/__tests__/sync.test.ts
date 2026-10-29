/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    problem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    topic: {
      upsert: vi.fn(),
    },
    topicOnProblem: {
      create: vi.fn(),
    },
    submission: {
      create: vi.fn(),
    },
    catalogProblem: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { syncRecentSubmissions, importProblemByNumber } from "../sync-service";

describe("LeetCode Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncRecentSubmissions deduplication", () => {
    it("updates existing problem idempotently and does NOT create duplicate", async () => {
      // Mock existing problem found for all questions
      prismaMock.problem.findFirst.mockResolvedValue({
        id: "prob-existing-1",
        title: "Two Sum",
        difficulty: "EASY",
        status: "ATTEMPTED",
        solvedAt: null,
      });

      prismaMock.problem.update.mockResolvedValue({
        id: "prob-existing-1",
        status: "SOLVED",
      });

      prismaMock.submission.create.mockResolvedValue({} as any);

      const result = await syncRecentSubmissions("user-1", "tourist");

      // Verify findFirst was called with questionId #1
      expect(prismaMock.problem.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          leetcodeQuestionId: 1,
        },
      });

      // Verify problem was updated to SOLVED
      expect(prismaMock.problem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prob-existing-1" },
          data: expect.objectContaining({ status: "SOLVED" }),
        })
      );

      // Verify problem.create was NOT called
      expect(prismaMock.problem.create).not.toHaveBeenCalled();

      expect(result.syncedCount).toBeGreaterThanOrEqual(1);
      expect(result.syncedProblems[0].isNew).toBe(false);
    });

    it("creates new problem when problem is not yet in tracker", async () => {
      // No existing problem
      prismaMock.problem.findFirst.mockResolvedValue(null);

      prismaMock.problem.create.mockResolvedValue({
        id: "prob-new-1",
        title: "Two Sum",
        difficulty: "EASY",
        status: "SOLVED",
      });

      prismaMock.topic.upsert.mockResolvedValue({ id: "topic-1" } as any);
      prismaMock.topicOnProblem.create.mockResolvedValue({} as any);
      prismaMock.submission.create.mockResolvedValue({} as any);
      prismaMock.catalogProblem.findFirst.mockResolvedValue(null);
      prismaMock.catalogProblem.create.mockResolvedValue({} as any);

      const result = await syncRecentSubmissions("user-1", "tourist");

      expect(prismaMock.problem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            source: "LEETCODE",
            status: "SOLVED",
            leetcodeQuestionId: 1,
          }),
        })
      );

      expect(result.syncedProblems[0].isNew).toBe(true);
    });
  });

  describe("importProblemByNumber", () => {
    it("returns existing problem if user already has it", async () => {
      prismaMock.problem.findFirst.mockResolvedValueOnce({
        id: "prob-existing-2",
        title: "Two Sum",
        leetcodeQuestionId: 1,
      });

      const res = await importProblemByNumber("user-1", 1);
      expect(res.alreadyExisted).toBe(true);
      expect(res.problem.id).toBe("prob-existing-2");
      expect(prismaMock.problem.create).not.toHaveBeenCalled();
    });

    it("imports and creates problem if not yet in tracker", async () => {
      prismaMock.problem.findFirst.mockResolvedValueOnce(null);
      prismaMock.problem.create.mockResolvedValueOnce({
        id: "prob-imported-1",
        title: "Two Sum",
        difficulty: "EASY",
        source: "LEETCODE",
        status: "ATTEMPTED",
      });
      prismaMock.topic.upsert.mockResolvedValue({ id: "t-1" } as any);
      prismaMock.topicOnProblem.create.mockResolvedValue({} as any);
      prismaMock.catalogProblem.findFirst.mockResolvedValue({ id: "c-1" } as any);

      const res = await importProblemByNumber("user-1", 1);
      expect(res.alreadyExisted).toBe(false);
      expect(res.problem.id).toBe("prob-imported-1");
      expect(prismaMock.problem.create).toHaveBeenCalled();
    });

    it("throws error when question number is not found", async () => {
      prismaMock.problem.findFirst.mockResolvedValueOnce(null);

      await expect(importProblemByNumber("user-1", 99999)).rejects.toThrow(
        "could not be found"
      );
    });
  });
});
