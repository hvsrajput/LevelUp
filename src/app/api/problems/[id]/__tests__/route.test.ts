/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    problem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((cb: any) => cb(mock)),
  };
  return { prismaMock: mock };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { auth } from "@/lib/auth";
import { GET, DELETE } from "../route";

const authMock = vi.mocked(auth);

describe("Problem Detail API: /api/problems/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/problems/[id]", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null as any);
      const req = new Request("http://localhost:3000/api/problems/prob-1");
      const res = await GET(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 404 when problem not found", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/problems/prob-1");
      const res = await GET(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(404);
    });

    it("returns problem details when owned", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce({
        id: "prob-1",
        title: "Two Sum",
        difficulty: "EASY",
        userId: "user-1",
        topics: [],
        testCases: [],
        submissions: [],
      });

      const req = new Request("http://localhost:3000/api/problems/prob-1");
      const res = await GET(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.title).toBe("Two Sum");
    });
  });

  describe("DELETE /api/problems/[id]", () => {
    it("returns 404 if problem does not exist", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findUnique.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/problems/prob-1", {
        method: "DELETE",
      });
      const res = await DELETE(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(404);
    });

    it("deletes problem successfully", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findUnique.mockResolvedValueOnce({
        id: "prob-1",
        userId: "user-1",
      });
      prismaMock.problem.delete.mockResolvedValueOnce({});

      const req = new Request("http://localhost:3000/api/problems/prob-1", {
        method: "DELETE",
      });
      const res = await DELETE(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(200);
    });
  });
});
