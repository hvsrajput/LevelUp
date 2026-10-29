/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findMany: vi.fn(),
    },
    roadmap: {
      findFirst: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "../next/route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Next Recommendation API Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns next recommended problem with explainability", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as any);

    (prismaMock.problem.findMany as any).mockResolvedValueOnce([]);
    (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.problem).toBeDefined();
    expect(json.reason).toBeDefined();
    expect(json.retrievedContext).toBeDefined();
  });
});
