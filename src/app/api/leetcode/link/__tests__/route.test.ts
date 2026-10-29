import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { GET, POST } from "../route";

describe("/api/leetcode/link Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/leetcode/link", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns linked status when authenticated", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        leetcodeUsername: "tourist",
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isLinked).toBe(true);
      expect(data.username).toBe("tourist");
    });

    it("returns not linked when username is null", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        leetcodeUsername: null,
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isLinked).toBe(false);
      expect(data.username).toBeNull();
    });
  });

  describe("POST /api/leetcode/link", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null);
      const req = new Request("http://localhost/api/leetcode/link", {
        method: "POST",
        body: JSON.stringify({ username: "tourist" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("unlinks account when action is unlink", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.update.mockResolvedValueOnce({
        id: "user-1",
        leetcodeUsername: null,
      });

      const req = new Request("http://localhost/api/leetcode/link", {
        method: "POST",
        body: JSON.stringify({ action: "unlink" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isLinked).toBe(false);
      expect(data.username).toBeNull();
    });

    it("returns 400 for invalid username syntax", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

      const req = new Request("http://localhost/api/leetcode/link", {
        method: "POST",
        body: JSON.stringify({ username: "invalid spaces user!" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 409 when username is already linked by another user", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: "user-other" });

      const req = new Request("http://localhost/api/leetcode/link", {
        method: "POST",
        body: JSON.stringify({ username: "tourist" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(409);
    });

    it("successfully links valid username", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      prismaMock.user.update.mockResolvedValueOnce({
        id: "user-1",
        leetcodeUsername: "tourist",
      });

      const req = new Request("http://localhost/api/leetcode/link", {
        method: "POST",
        body: JSON.stringify({ username: "tourist" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isLinked).toBe(true);
      expect(data.username).toBe("tourist");
    });
  });
});
