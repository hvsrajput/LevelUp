/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    problem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    topicOnProblem: {
      deleteMany: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({}),
    },
    topic: {
      upsert: vi.fn((args: any) =>
        Promise.resolve({ id: "t-1", name: args.create?.name || "Topic" })
      ),
    },
    testCase: {
      deleteMany: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({}),
    },
    submission: {
      create: vi.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: vi.fn(),
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
import { GET, PUT, DELETE } from "../route";

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

  describe("PUT /api/problems/[id]", () => {
    it("updates problem fields while leaving hidden fields unchanged and saving empty optional strings as null", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      // Existing saved problem with hidden/internal fields
      prismaMock.problem.findUnique.mockResolvedValueOnce({
        id: "prob-1",
        shortCode: "twosum1",
        source: "LEETCODE",
        leetcodeQuestionId: 1,
        titleSlug: "two-sum",
        catalogProblemId: "cat-1",
        status: "ATTEMPTED",
        solvedAt: null,
        solvedDay: null,
        userId: "user-1",
      });

      prismaMock.problem.update.mockImplementationOnce(({ data }: any) => {
        return Promise.resolve({
          id: "prob-1",
          ...data,
        });
      });

      const body = {
        title: "Two Sum (Updated)",
        difficulty: "MEDIUM",
        description: "Updated description text here...",
        constraints: "   ", // empty string with spaces -> should become null
        timeComplexity: "", // empty string -> should become null
        spaceComplexity: "O(1)",
        notes: "", // empty string -> should become null
        hints: ["New hint"],
        approaches: [{ title: "Optimal", description: "Use hash table" }],
        topicNames: ["Array"],
        testCases: [],
      };

      const req = new Request("http://localhost:3000/api/problems/prob-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const res = await PUT(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(200);

      // Verify update call arguments
      expect(prismaMock.problem.update).toHaveBeenCalled();
      const updateArgs = prismaMock.problem.update.mock.calls[0][0];

      expect(updateArgs.where).toEqual({ id: "prob-1" });

      // Updated fields
      expect(updateArgs.data.title).toBe("Two Sum (Updated)");
      expect(updateArgs.data.difficulty).toBe("MEDIUM");
      expect(updateArgs.data.description).toBe("Updated description text here...");
      expect(updateArgs.data.spaceComplexity).toBe("O(1)");
      expect(updateArgs.data.hints).toEqual(["New hint"]);

      // Optional empty fields converted to null
      expect(updateArgs.data.constraints).toBeNull();
      expect(updateArgs.data.timeComplexity).toBeNull();
      expect(updateArgs.data.notes).toBeNull();

      // Hidden fields NOT wiped or overwritten
      expect(updateArgs.data.shortCode).toBeUndefined();
      expect(updateArgs.data.source).toBeUndefined();
      expect(updateArgs.data.leetcodeQuestionId).toBeUndefined();
      expect(updateArgs.data.catalogProblemId).toBeUndefined();
    });
  });
});
