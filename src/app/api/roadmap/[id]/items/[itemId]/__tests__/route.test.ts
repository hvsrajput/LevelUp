/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    roadmap: {
      findUnique: vi.fn(),
    },
    roadmapItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Roadmap Item Toggle API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null as any);
    const req = new Request("http://localhost:3000/api/roadmap/r1/items/i1", {
      method: "PATCH",
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "r1", itemId: "i1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user does not own roadmap", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-2" },
    } as any);

    (prismaMock.roadmap.findUnique as any).mockResolvedValueOnce({
      userId: "user-1",
    });

    const req = new Request("http://localhost:3000/api/roadmap/r1/items/i1", {
      method: "PATCH",
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "r1", itemId: "i1" }),
    });
    expect(res.status).toBe(403);
  });

  it("toggles completion status successfully", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as any);

    (prismaMock.roadmap.findUnique as any).mockResolvedValueOnce({
      userId: "user-1",
    });
    (prismaMock.roadmapItem.findUnique as any).mockResolvedValueOnce({
      id: "i1",
      roadmapId: "r1",
      isCompleted: false,
    });
    (prismaMock.roadmapItem.update as any).mockResolvedValueOnce({
      id: "i1",
      isCompleted: true,
    });

    const req = new Request("http://localhost:3000/api/roadmap/r1/items/i1", {
      method: "PATCH",
      body: JSON.stringify({ isCompleted: true }),
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "r1", itemId: "i1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.item.isCompleted).toBe(true);
  });
});
