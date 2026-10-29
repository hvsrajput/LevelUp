/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    problem: {
      findFirst: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
      create: vi.fn(),
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
import { GET, POST } from "../route";

const authMock = vi.mocked(auth);

describe("Submissions API: /api/problems/[id]/submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/problems/[id]/submissions", () => {
    it("returns 401 when unauthorized", async () => {
      authMock.mockResolvedValueOnce(null as any);
      const req = new Request("http://localhost:3000/api/problems/prob-1/submissions");
      const res = await GET(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns submissions when authorized", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce({ id: "prob-1" });
      prismaMock.submission.findMany.mockResolvedValueOnce([
        {
          id: "sub-1",
          language: "python",
          code: "def twoSum(): pass",
          createdAt: new Date(),
        },
      ]);

      const req = new Request("http://localhost:3000/api/problems/prob-1/submissions");
      const res = await GET(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveLength(1);
    });
  });

  describe("POST /api/problems/[id]/submissions", () => {
    it("validates submission payload", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce({ id: "prob-1" });

      const req = new Request("http://localhost:3000/api/problems/prob-1/submissions", {
        method: "POST",
        body: JSON.stringify({ language: "", code: "" }),
      });
      const res = await POST(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(400);
    });

    it("creates submission successfully", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce({ id: "prob-1" });
      prismaMock.submission.create.mockResolvedValueOnce({
        id: "sub-created",
        language: "typescript",
        code: "const x = 1;",
        problemId: "prob-1",
        userId: "user-1",
      });

      const req = new Request("http://localhost:3000/api/problems/prob-1/submissions", {
        method: "POST",
        body: JSON.stringify({
          language: "typescript",
          code: "const x = 1;",
        }),
      });
      const res = await POST(req as any, { params: Promise.resolve({ id: "prob-1" }) });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.language).toBe("typescript");
    });
  });
});
