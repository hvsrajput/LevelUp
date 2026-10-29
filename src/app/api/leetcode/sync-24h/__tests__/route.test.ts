import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, prismaMock, syncServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
  },
  syncServiceMock: {
    syncRecentSubmissions: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/leetcode/sync-service", () => ({
  syncRecentSubmissions: syncServiceMock.syncRecentSubmissions,
}));

import { POST } from "../route";

describe("POST /api/leetcode/sync-24h", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 400 when user has not linked LeetCode username", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({ leetcodeUsername: null });

    const res = await POST();
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No LeetCode username linked");
  });

  it("successfully syncs recent submissions when username is linked", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      leetcodeUsername: "tourist",
    });

    syncServiceMock.syncRecentSubmissions.mockResolvedValueOnce({
      syncedCount: 2,
      skippedCount: 1,
      syncedProblems: [
        { title: "Two Sum", questionId: 1, difficulty: "EASY", isNew: true },
        { title: "LRU Cache", questionId: 146, difficulty: "MEDIUM", isNew: false },
      ],
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.syncedCount).toBe(2);
    expect(data.username).toBe("tourist");
    expect(data.syncedProblems).toHaveLength(2);
  });
});
