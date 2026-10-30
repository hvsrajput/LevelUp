import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { auth } from "@/lib/auth";
import { getProgressSnapshot } from "@/lib/recommendations/progress-snapshot";
import { getStreakSummary } from "@/lib/streak";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/recommendations/progress-snapshot", () => ({
  getProgressSnapshot: vi.fn(),
}));

vi.mock("@/lib/streak", () => ({
  getStreakSummary: vi.fn(),
}));

describe("GET /api/progress-snapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns progress snapshot and streak summary", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getProgressSnapshot).mockResolvedValueOnce({
      solvedCount: 10,
      totalCount: 20,
      percentage: 50,
      currentTopic: {
        name: "Arrays & Hashing",
        sourceLabel: "From roadmap",
        reason: "Focus for Week 1",
      },
      nextTopic: {
        name: "Two Pointers",
        sourceLabel: "From roadmap",
        reason: "Scheduled for Week 2",
      },
      isEmpty: false,
    });
    vi.mocked(getStreakSummary).mockResolvedValueOnce({
      streak: {
        current: 3,
        longest: 5,
        solvedToday: true,
        atRisk: false,
        lastSolveDay: "2026-10-30",
      },
      timezone: "UTC",
      today: "2026-10-30",
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.snapshot.percentage).toBe(50);
    expect(data.snapshot.currentTopic.name).toBe("Arrays & Hashing");
    expect(data.streak.current).toBe(3);
  });
});
