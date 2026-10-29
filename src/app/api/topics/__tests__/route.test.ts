/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    topic: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "../route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Topics API: /api/topics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns topics with user problem counts", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as any);

    (prismaMock.topic.findMany as any).mockResolvedValueOnce([
      {
        id: "top-1",
        name: "Array",
        slug: "array",
        _count: { problems: 2 },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].name).toBe("Array");
    expect(json[0].count).toBe(2);
  });
});
