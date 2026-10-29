/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    roadmap: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Roadmap API Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/roadmap", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null as any);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns user roadmap with progress when authenticated", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce({
        id: "road-1",
        title: "Full DSA Master Plan",
        goal: "Full DSA",
        level: "intermediate",
        timeline: "8 weeks",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "item-1",
            weekNumber: 1,
            topicName: "Arrays",
            concept: "Two Sum",
            problemIds: ["Two Sum"],
            isCompleted: true,
            order: 1,
          },
        ],
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.roadmap.progress.percentage).toBe(100);
      expect(json.roadmap.weeks).toHaveLength(1);
    });
  });

  describe("POST /api/roadmap", () => {
    it("validates input payload", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      const req = new Request("http://localhost:3000/api/roadmap", {
        method: "POST",
        body: JSON.stringify({ goal: "DP", level: "invalid", timeline: "4 weeks" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("generates and persists roadmap", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.roadmap.deleteMany as any).mockResolvedValueOnce({});
      (prismaMock.roadmap.create as any).mockResolvedValueOnce({
        id: "road-created",
        title: "DP Master Plan (4 weeks)",
        goal: "Dynamic Programming",
        level: "intermediate",
        timeline: "4 weeks",
        items: [],
      });
      (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce({
        id: "road-created",
        title: "DP Master Plan (4 weeks)",
        goal: "Dynamic Programming",
        level: "intermediate",
        timeline: "4 weeks",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });

      const req = new Request("http://localhost:3000/api/roadmap", {
        method: "POST",
        body: JSON.stringify({
          goal: "Dynamic Programming",
          level: "intermediate",
          timeline: "4 weeks",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.roadmap).toBeDefined();
    });
  });
});
