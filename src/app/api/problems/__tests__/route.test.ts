/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    topic: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prismaMock)),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Problems API: /api/problems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/problems", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null as any);
      const req = new Request("http://localhost:3000/api/problems");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns paginated problems for user", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.problem.findMany as any).mockResolvedValueOnce([
        {
          id: "prob-1",
          shortCode: "two-sum-1234",
          title: "Two Sum",
          difficulty: "EASY",
          status: "SOLVED",
          source: "MANUAL",
          topics: [{ topic: { id: "top-1", name: "Array" } }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      (prismaMock.problem.count as any).mockResolvedValueOnce(1);

      const req = new Request("http://localhost:3000/api/problems?page=1&limit=10");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.pagination.total).toBe(1);
      expect(json.data[0].title).toBe("Two Sum");
    });
  });

  describe("POST /api/problems", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null as any);
      const req = new Request("http://localhost:3000/api/problems", {
        method: "POST",
        body: JSON.stringify({ title: "Valid Title", difficulty: "EASY", description: "Desc" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid input", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      const req = new Request("http://localhost:3000/api/problems", {
        method: "POST",
        body: JSON.stringify({ title: "", difficulty: "INVALID" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("creates problem with valid input", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.$transaction as any).mockImplementationOnce(async () => {
        return {
          id: "prob-created",
          shortCode: "valid-slug",
          title: "Valid Title",
          difficulty: "MEDIUM",
          description: "Problem description here",
          userId: "user-1",
          topics: [],
          testCases: [],
        };
      });

      const req = new Request("http://localhost:3000/api/problems", {
        method: "POST",
        body: JSON.stringify({
          title: "Valid Title",
          difficulty: "MEDIUM",
          description: "Problem description here",
          topics: ["Array"],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.title).toBe("Valid Title");
    });
  });
});
