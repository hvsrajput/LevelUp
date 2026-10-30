import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveDraft, clearCatalogCache } from "../resolve";
import { prisma } from "@/lib/prisma";
import type { RoadmapDraft } from "../types";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findMany: vi.fn(),
    },
    catalogProblem: {
      findMany: vi.fn(),
    },
  },
}));

describe("resolveDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCatalogCache();
  });

  it("matches user problem by exact title, slug, and leetcodeId", async () => {
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([
      {
        id: "p1",
        title: "Two Sum",
        difficulty: "EASY",
        leetcodeQuestionId: 1,
        titleSlug: "two-sum",
        status: "SOLVED",
      },
      {
        id: "p2",
        title: "Group Anagrams",
        difficulty: "MEDIUM",
        leetcodeQuestionId: 49,
        titleSlug: "group-anagrams",
        status: "ATTEMPTED",
      },
    ] as never);
    vi.mocked(prisma.catalogProblem.findMany).mockResolvedValueOnce([] as never);

    const draft: RoadmapDraft = {
      title: "My Roadmap",
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              questions: [
                { raw: "Two Sum", title: "Two Sum" }, // exact title match
                {
                  raw: "https://leetcode.com/problems/group-anagrams/",
                  title: "Group Anagrams",
                  slug: "group-anagrams",
                }, // slug match
              ],
            },
          ],
        },
      ],
    };

    const res = await resolveDraft(draft, "user-1");

    expect(res.totals.matched).toBe(2);
    expect(res.totals.custom).toBe(0);

    const q1 = res.weeks[0].days[0].questions[0];
    expect(q1.status).toBe("matched");
    expect(q1.matchSource).toBe("user");
    expect(q1.matchedTitle).toBe("Two Sum");
    expect(q1.isSolved).toBe(true);

    const q2 = res.weeks[0].days[0].questions[1];
    expect(q2.status).toBe("matched");
    expect(q2.matchSource).toBe("user");
    expect(q2.matchedTitle).toBe("Group Anagrams");
    expect(q2.isSolved).toBe(false);
  });

  it("matches catalog problem by title when not in user problems", async () => {
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.catalogProblem.findMany).mockResolvedValueOnce([
      {
        id: "cat-1",
        title: "Contains Duplicate",
        difficulty: "EASY",
      },
    ] as never);

    const draft: RoadmapDraft = {
      title: "My Roadmap",
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              questions: [{ raw: "Contains Duplicate", title: "Contains Duplicate" }],
            },
          ],
        },
      ],
    };

    const res = await resolveDraft(draft, "user-1");
    expect(res.totals.matched).toBe(1);
    const q = res.weeks[0].days[0].questions[0];
    expect(q.status).toBe("matched");
    expect(q.matchSource).toBe("catalog");
    expect(q.matchedTitle).toBe("Contains Duplicate");
  });

  it("does NOT auto-accept fuzzy match: returns suggestions with status='suggested'", async () => {
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.catalogProblem.findMany).mockResolvedValueOnce([
      {
        id: "cat-1",
        title: "Binary Tree Inorder Traversal",
        difficulty: "EASY",
      },
      {
        id: "cat-2",
        title: "Binary Tree Postorder Traversal",
        difficulty: "EASY",
      },
    ] as never);

    const draft: RoadmapDraft = {
      title: "My Roadmap",
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              questions: [{ raw: "Binary Tree Traversal", title: "Binary Tree Traversal" }],
            },
          ],
        },
      ],
    };

    const res = await resolveDraft(draft, "user-1");
    const q = res.weeks[0].days[0].questions[0];

    // Crucial rule: NEVER auto-accept fuzzy matches
    expect(q.status).toBe("suggested");
    expect(q.suggestions).toBeDefined();
    expect(q.suggestions!.length).toBeGreaterThan(0);
    expect(q.suggestions!.length).toBeLessThanOrEqual(3);
    expect(q.suggestions![0].title).toContain("Binary Tree");
    expect(res.totals.suggested).toBe(1);
    expect(res.totals.matched).toBe(0);
  });

  it("falls back to custom entry with typed title and no URL when completely unmatched", async () => {
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.catalogProblem.findMany).mockResolvedValueOnce([] as never);

    const draft: RoadmapDraft = {
      title: "My Roadmap",
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              questions: [
                {
                  raw: "Custom Super Rare Problem",
                  title: "Custom Super Rare Problem",
                  difficultyTag: "Hard",
                },
              ],
            },
          ],
        },
      ],
    };

    const res = await resolveDraft(draft, "user-1");
    const q = res.weeks[0].days[0].questions[0];

    expect(q.status).toBe("custom");
    expect(q.url).toBeNull();
    expect(q.difficulty).toBe("HARD");
    expect(res.totals.custom).toBe(1);
    expect(res.totals.matched).toBe(0);
  });

  it("executes a fixed number of DB queries regardless of line count", async () => {
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.catalogProblem.findMany).mockResolvedValueOnce([] as never);

    // 50 questions across 5 weeks
    const weeks = [];
    for (let w = 1; w <= 5; w++) {
      const days = [];
      for (let d = 1; d <= 2; d++) {
        days.push({
          dayNumber: d,
          questions: [
            { raw: `Problem ${w}-${d}-1`, title: `Problem ${w}-${d}-1` },
            { raw: `Problem ${w}-${d}-2`, title: `Problem ${w}-${d}-2` },
            { raw: `Problem ${w}-${d}-3`, title: `Problem ${w}-${d}-3` },
            { raw: `Problem ${w}-${d}-4`, title: `Problem ${w}-${d}-4` },
            { raw: `Problem ${w}-${d}-5`, title: `Problem ${w}-${d}-5` },
          ],
        });
      }
      weeks.push({ weekNumber: w, days });
    }

    const draft: RoadmapDraft = {
      title: "Big Roadmap",
      weeks,
    };

    const res = await resolveDraft(draft, "user-1");
    expect(res.totals.questions).toBe(50);

    // Exactly 1 query for user problems and 1 query for catalog problems
    expect(prisma.problem.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.catalogProblem.findMany).toHaveBeenCalledTimes(1);
  });
});
