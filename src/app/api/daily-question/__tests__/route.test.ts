/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyQuestion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    problem: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "../route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Daily Question API Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns today's daily question with explainability", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as any);

    (prismaMock.dailyQuestion.findUnique as any).mockResolvedValueOnce({
      id: "daily-1",
      userId: "user-1",
      date: new Date(),
      reason: "Daily challenge calibrated for today.",
      catalogProblemId: "Contains Duplicate",
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.dailyQuestionId).toBe("daily-1");
    expect(json.problem.title).toBe("Contains Duplicate");
    expect(json.reason).toContain("Daily challenge");
  });
});
