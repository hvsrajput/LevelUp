import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, syncServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  syncServiceMock: {
    importProblemByNumber: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/leetcode/sync-service", () => ({
  importProblemByNumber: syncServiceMock.importProblemByNumber,
}));

import { POST } from "../route";

describe("POST /api/leetcode/import-number", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/leetcode/import-number", {
      method: "POST",
      body: JSON.stringify({ questionNumber: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when question number is invalid or negative", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    const req = new Request("http://localhost/api/leetcode/import-number", {
      method: "POST",
      body: JSON.stringify({ questionNumber: -5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("successfully imports problem by number", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    syncServiceMock.importProblemByNumber.mockResolvedValueOnce({
      problem: { id: "prob-1", title: "Two Sum", shortCode: "twosum88" },
      alreadyExisted: false,
    });

    const req = new Request("http://localhost/api/leetcode/import-number", {
      method: "POST",
      body: JSON.stringify({ questionNumber: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.alreadyExisted).toBe(false);
    expect(data.problem.title).toBe("Two Sum");
  });

  it("returns 404 when question is not found on LeetCode", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    syncServiceMock.importProblemByNumber.mockRejectedValueOnce(
      new Error("LeetCode problem #99999 could not be found.")
    );

    const req = new Request("http://localhost/api/leetcode/import-number", {
      method: "POST",
      body: JSON.stringify({ questionNumber: 99999 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
