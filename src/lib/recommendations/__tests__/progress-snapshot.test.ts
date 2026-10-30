import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProgressSnapshot,
  clearSnapshotCache,
  topicNameSchema,
} from "../progress-snapshot";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    roadmap: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Progress Snapshot Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSnapshotCache();
  });

  it("validates topic names against KNOWN_KB_TOPICS with Zod", () => {
    expect(topicNameSchema.safeParse("Arrays & Hashing").success).toBe(true);
    expect(topicNameSchema.safeParse("Two Pointers").success).toBe(true);
    expect(topicNameSchema.safeParse("Dynamic Programming").success).toBe(true);
    expect(topicNameSchema.safeParse("Nonexistent Topic XYZ").success).toBe(false);
  });

  it("handles empty state when user has no roadmap and no problems", async () => {
    vi.mocked(prisma.problem.groupBy).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.roadmap.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);

    const snapshot = await getProgressSnapshot("user-empty");

    expect(snapshot.isEmpty).toBe(true);
    expect(snapshot.totalCount).toBe(0);
    expect(snapshot.solvedCount).toBe(0);
    expect(snapshot.currentTopic).toBeNull();
    expect(snapshot.nextTopic).toBeNull();
  });

  it("derives current and next topics from active roadmap", async () => {
    vi.mocked(prisma.problem.groupBy).mockResolvedValueOnce([
      { status: "SOLVED", _count: { _all: 5 } },
      { status: "ATTEMPTED", _count: { _all: 5 } },
    ] as never);

    // Active roadmap with 3 weeks, week 1 complete, week 2 incomplete
    vi.mocked(prisma.roadmap.findFirst).mockResolvedValueOnce({
      id: "rm-1",
      title: "My Roadmap",
      items: [
        { weekNumber: 1, topicName: "Arrays & Hashing", isCompleted: true },
        { weekNumber: 2, topicName: "Two Pointers", isCompleted: false },
        { weekNumber: 3, topicName: "Sliding Window", isCompleted: false },
      ],
    } as never);
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);

    const snapshot = await getProgressSnapshot("user-roadmap");

    expect(snapshot.isEmpty).toBe(false);
    expect(snapshot.totalCount).toBe(10);
    expect(snapshot.solvedCount).toBe(5);
    expect(snapshot.percentage).toBe(50);

    expect(snapshot.currentTopic?.name).toBe("Two Pointers");
    expect(snapshot.currentTopic?.sourceLabel).toBe("From roadmap");
    expect(snapshot.currentTopic?.reason).toContain("Week 2");

    expect(snapshot.nextTopic?.name).toBe("Sliding Window");
    expect(snapshot.nextTopic?.sourceLabel).toBe("From roadmap");
    expect(snapshot.nextTopic?.reason).toContain("Week 3");
  });

  it("shows 'Roadmap complete' when active roadmap is on its last week", async () => {
    vi.mocked(prisma.problem.groupBy).mockResolvedValueOnce([
      { status: "SOLVED", _count: { _all: 8 } },
    ] as never);

    vi.mocked(prisma.roadmap.findFirst).mockResolvedValueOnce({
      id: "rm-last",
      title: "My Roadmap",
      items: [
        { weekNumber: 1, topicName: "Arrays & Hashing", isCompleted: true },
        { weekNumber: 2, topicName: "Trees", isCompleted: false },
      ],
    } as never);
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);

    const snapshot = await getProgressSnapshot("user-last-week");

    expect(snapshot.currentTopic?.name).toBe("Trees");
    expect(snapshot.nextTopic?.name).toBe("Roadmap complete");
    expect(snapshot.nextTopic?.sourceLabel).toBe("From roadmap");
  });

  it("derives topics from problems when no roadmap exists using prerequisite DAG", async () => {
    vi.mocked(prisma.problem.groupBy).mockResolvedValueOnce([
      { status: "SOLVED", _count: { _all: 3 } },
      { status: "ATTEMPTED", _count: { _all: 1 } },
    ] as never);
    vi.mocked(prisma.roadmap.findFirst).mockResolvedValueOnce(null as never);

    // User practiced Arrays & Hashing (solved 2, unsolved 1, active recently)
    const now = new Date("2026-10-30T10:00:00Z");
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([
      {
        id: "p1",
        status: "ATTEMPTED",
        updatedAt: now,
        topics: [{ topic: { name: "Arrays & Hashing" } }],
      },
      {
        id: "p2",
        status: "SOLVED",
        updatedAt: new Date("2026-10-29T10:00:00Z"),
        topics: [{ topic: { name: "Arrays & Hashing" } }],
      },
    ] as never);

    const snapshot = await getProgressSnapshot("user-problems-only");

    expect(snapshot.isEmpty).toBe(false);
    expect(snapshot.currentTopic?.name).toBe("Arrays & Hashing");
    expect(snapshot.currentTopic?.sourceLabel).toBe("From your problems");
    expect(snapshot.currentTopic?.reason).toContain("1 unsolved problem");

    // Arrays & Hashing is covered -> Two Pointers has prerequisite [Arrays & Hashing], so it is unlocked!
    expect(snapshot.nextTopic?.name).toBe("Two Pointers");
    expect(snapshot.nextTopic?.sourceLabel).toBe("From your problems");
    expect(snapshot.nextTopic?.reason).toContain("Prerequisites covered");
  });

  it("caches snapshot result by input hash and skips recomputing on cache hit", async () => {
    vi.mocked(prisma.problem.groupBy).mockResolvedValueOnce([
      { status: "SOLVED", _count: { _all: 4 } },
    ] as never);
    vi.mocked(prisma.roadmap.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);

    const snapshot1 = await getProgressSnapshot("user-cached");

    // Subsequent call with same data
    vi.mocked(prisma.problem.groupBy).mockResolvedValueOnce([
      { status: "SOLVED", _count: { _all: 4 } },
    ] as never);
    vi.mocked(prisma.roadmap.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.problem.findMany).mockResolvedValueOnce([] as never);

    const snapshot2 = await getProgressSnapshot("user-cached");

    expect(snapshot1).toBe(snapshot2); // exact same cached object reference
  });
});
