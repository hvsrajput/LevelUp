/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyQuestion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    problem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getOrCreateDailyQuestion, getUtcMidnight } from "../daily-question";

const prismaMock = vi.mocked(prisma);

describe("Daily Question Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing daily question if already assigned today", async () => {
    const today = getUtcMidnight();
    (prismaMock.dailyQuestion.findUnique as any).mockResolvedValueOnce({
      id: "daily-1",
      userId: "user-1",
      date: today,
      reason: "Daily Kickstart challenge.",
      catalogProblemId: "Two Sum",
    });

    const result = await getOrCreateDailyQuestion("user-1");
    expect(result.dailyQuestionId).toBe("daily-1");
    expect(result.problem.title).toBe("Two Sum");
    expect(result.isSpacedRepetition).toBe(false);
  });

  it("selects spaced repetition problem when solved 7 days ago", async () => {
    (prismaMock.dailyQuestion.findUnique as any).mockResolvedValueOnce(null);
    (prismaMock.dailyQuestion.findMany as any).mockResolvedValueOnce([]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    (prismaMock.problem.findMany as any).mockResolvedValueOnce([
      {
        id: "prob-1",
        title: "Valid Anagram",
        difficulty: "EASY",
        solvedAt: sevenDaysAgo,
        description: "Anagram problem",
        topics: [{ topic: { name: "String" } }],
      },
    ]);

    (prismaMock.dailyQuestion.create as any).mockResolvedValueOnce({
      id: "daily-spaced",
      reason: "Spaced repetition challenge: You solved \"Valid Anagram\" 7 days ago.",
      problemId: "prob-1",
    });

    const result = await getOrCreateDailyQuestion("user-1");
    expect(result.isSpacedRepetition).toBe(true);
    expect(result.problem.title).toBe("Valid Anagram");
    expect(result.problem.source).toBe("USER_PROBLEM");
    expect(result.reason).toContain("Spaced repetition");
  });

  it("generates progressive difficulty challenge when no spaced repetition applies", async () => {
    (prismaMock.dailyQuestion.findUnique as any).mockResolvedValueOnce(null);
    (prismaMock.dailyQuestion.findMany as any).mockResolvedValueOnce([]);
    (prismaMock.problem.findMany as any).mockResolvedValueOnce([]); // no solves

    (prismaMock.dailyQuestion.create as any).mockImplementationOnce((args: any) =>
      Promise.resolve({
        id: "daily-new",
        ...args.data,
      })
    );

    const result = await getOrCreateDailyQuestion("user-1");
    expect(result.dailyQuestionId).toBe("daily-new");
    expect(result.problem.title).toBeDefined();
    expect(result.reason).toBeDefined();
  });
});
