/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findMany: vi.fn(),
    },
    roadmap: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getNextRecommendedQuestion } from "../next-question";

const prismaMock = vi.mocked(prisma);

describe("Next-Question Recommender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prioritizes problems marked REVISIT", async () => {
    (prismaMock.problem.findMany as any).mockResolvedValueOnce([
      {
        id: "prob-1",
        title: "LRU Cache",
        difficulty: "MEDIUM",
        status: "REVISIT",
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
        topics: [{ topic: { name: "Linked List" } }],
      },
    ]);
    (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce(null);

    const result = await getNextRecommendedQuestion("user-1");
    expect(result.retrievedContext.recommendationType).toBe("REVISIT");
    expect(result.problem.title).toBe("LRU Cache");
    expect(result.problem.isRevisit).toBe(true);
    expect(result.reason).toContain("marked \"LRU Cache\" for Revisit");
  });

  it("advances active roadmap if no revisits are pending", async () => {
    (prismaMock.problem.findMany as any).mockResolvedValueOnce([
      {
        id: "prob-1",
        title: "Contains Duplicate",
        difficulty: "EASY",
        status: "SOLVED",
        description: "Contains duplicate array problem",
        topics: [{ topic: { name: "Array" } }],
      },
    ]);

    (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce({
      id: "road-1",
      items: [
        {
          id: "item-1",
          weekNumber: 1,
          topicName: "Arrays & Two Pointers",
          concept: "Linear scanning with hash maps",
          problemIds: ["Contains Duplicate", "Two Sum"],
          isCompleted: false,
        },
      ],
    });

    const result = await getNextRecommendedQuestion("user-1");
    expect(result.retrievedContext.recommendationType).toBe("ROADMAP_PROGRESSION");
    expect(result.problem.title).toBe("Two Sum");
    expect(result.reason).toContain("Week 1 of your roadmap");
  });

  it("recommends weak / untouched topics when no roadmap exists", async () => {
    (prismaMock.problem.findMany as any).mockResolvedValueOnce([
      {
        id: "prob-1",
        title: "Two Sum",
        difficulty: "EASY",
        status: "SOLVED",
        description: "Two sum problem",
        topics: [{ topic: { name: "Array" } }],
      },
    ]);
    (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce(null);

    const result = await getNextRecommendedQuestion("user-1");
    expect(result.retrievedContext.recommendationType).toBe("WEAK_TOPIC");
    expect(result.reason).toBeDefined();
    expect(result.problem.title).toBeDefined();
  });

  it("handles cold-start gracefully", async () => {
    (prismaMock.problem.findMany as any).mockResolvedValueOnce([]);
    (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce(null);

    const result = await getNextRecommendedQuestion("user-1");
    expect(result.retrievedContext.recommendationType).toBe("WEAK_TOPIC");
    expect(result.problem).toBeDefined();
  });
});
