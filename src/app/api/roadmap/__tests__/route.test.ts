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
    roadmapItem: {
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    problem: {
      findMany: vi.fn(),
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
            dayNumber: 1,
            scheduledDate: "2026-10-30",
            topicName: "Arrays",
            concept: "Two Sum",
            problemIds: ["Two Sum"],
            isCompleted: true,
            order: 1,
          },
        ],
      });
      (prismaMock.problem.findMany as any).mockResolvedValueOnce([
        {
          id: "p1",
          title: "Two Sum",
          difficulty: "EASY",
          status: "SOLVED",
          solvedDay: "2026-10-30",
        },
      ]);

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

    it("rejects goals unrelated to DSA or too vague to plan", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-unrelated" },
      } as any);

      const req = new Request("http://localhost:3000/api/roadmap", {
        method: "POST",
        body: JSON.stringify({
          goal: "How to bake a chocolate cake with milk and sugar",
          level: "intermediate",
          timeline: "4 weeks",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("unrelated to Data Structures & Algorithms");
    });

    it("enforces rate limiting on repeated requests from the same user", async () => {
      const userId = "user-ratelimit-test";
      for (let i = 0; i < 3; i++) {
        authMock.mockResolvedValueOnce({
          user: { id: userId },
        } as any);
        (prismaMock.roadmap.deleteMany as any).mockResolvedValueOnce({});
        (prismaMock.roadmap.create as any).mockResolvedValueOnce({
          id: `road-${i}`,
          title: "Goal",
          goal: "Dynamic Programming",
          level: "intermediate",
          timeline: "4 weeks",
        });
        (prismaMock.roadmap.findFirst as any).mockResolvedValueOnce({
          id: `road-${i}`,
          title: "Goal",
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
      }

      // 4th request within 1 minute should be rate limited
      authMock.mockResolvedValueOnce({
        user: { id: userId },
      } as any);
      const req = new Request("http://localhost:3000/api/roadmap", {
        method: "POST",
        body: JSON.stringify({
          goal: "Dynamic Programming",
          level: "intermediate",
          timeline: "4 weeks",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toContain("Rate limit");
    });
  });
});
