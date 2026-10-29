/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    groupMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    group: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    problem: {
      findMany: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prismaMock)),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET as getGroups, POST as createGroup } from "../route";
import { POST as joinGroup } from "../join/route";
import { GET as getGroupDetail, DELETE as deleteGroup } from "../[id]/route";
import { POST as regenerateCode } from "../[id]/regenerate-code/route";
import { DELETE as removeMember } from "../[id]/members/[userId]/route";

const authMock = vi.mocked(auth);
const prismaMock = vi.mocked(prisma);

describe("Groups API Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/groups", () => {
    it("returns 401 when not authenticated", async () => {
      authMock.mockResolvedValueOnce(null as any);
      const res = await getGroups();
      expect(res.status).toBe(401);
    });

    it("returns user's groups when authenticated", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1", name: "Alice" },
      } as any);

      (prismaMock.groupMember.findMany as any).mockResolvedValueOnce([
        {
          id: "member-1",
          role: "OWNER",
          joinedAt: new Date("2026-10-29"),
          group: {
            id: "group-1",
            name: "LeetCode Grind",
            joinCode: "9XY4M7KR",
            ownerId: "user-1",
            createdAt: new Date("2026-10-29"),
            _count: { members: 3 },
          },
        },
      ]);

      const res = await getGroups();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.groups).toHaveLength(1);
      expect(data.groups[0].name).toBe("LeetCode Grind");
      expect(data.groups[0].isOwner).toBe(true);
      expect(data.groups[0].memberCount).toBe(3);
    });
  });

  describe("POST /api/groups", () => {
    it("returns 400 on invalid group name", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      const req = new Request("http://localhost:3000/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: " " }),
      });

      const res = await createGroup(req);
      expect(res.status).toBe(400);
    });

    it("creates a group and adds creator as OWNER", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValue(null);
      (prismaMock.$transaction as any).mockImplementationOnce(async (cb: any) => {
        return cb({
          group: {
            create: vi.fn().mockResolvedValue({
              id: "group-created",
              name: "Algo Aces",
              joinCode: "ABCD1234",
              ownerId: "user-1",
              createdAt: new Date(),
              members: [{ userId: "user-1", role: "OWNER" }],
            }),
          },
        });
      });

      const req = new Request("http://localhost:3000/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: "Algo Aces" }),
      });

      const res = await createGroup(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.group.name).toBe("Algo Aces");
      expect(data.group.isOwner).toBe(true);
    });
  });

  describe("POST /api/groups/join", () => {
    it("returns 404 for nonexistent join code", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-2" },
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ joinCode: "INVALID1" }),
      });

      const res = await joinGroup(req);
      expect(res.status).toBe(404);
    });

    it("joins group as MEMBER if not already a member", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-2" },
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        id: "group-1",
        name: "Algo Aces",
      });
      (prismaMock.groupMember.findUnique as any).mockResolvedValueOnce(null);
      (prismaMock.groupMember.create as any).mockResolvedValueOnce({
        id: "member-2",
        userId: "user-2",
        groupId: "group-1",
        role: "MEMBER",
      });

      const req = new Request("http://localhost:3000/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ joinCode: "ABCD1234" }),
      });

      const res = await joinGroup(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.groupId).toBe("group-1");
    });
  });

  describe("GET /api/groups/[id] (Authorization & Member Protection)", () => {
    it("returns 403 Forbidden when user is NOT a member", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "intruder" },
      } as any);

      (prismaMock.groupMember.findUnique as any).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/groups/group-1");
      const res = await getGroupDetail(req, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Access denied");
    });

    it("returns group detail and computes member streaks when user IS a member", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.groupMember.findUnique as any).mockResolvedValueOnce({
        id: "mem-1",
        userId: "user-1",
        groupId: "group-1",
        role: "OWNER",
      });

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        id: "group-1",
        name: "Algo Squad",
        joinCode: "9XY4M7KR",
        ownerId: "user-1",
        createdAt: new Date(),
        members: [
          {
            id: "mem-1",
            userId: "user-1",
            role: "OWNER",
            joinedAt: new Date(),
            user: { id: "user-1", name: "Alice", email: "alice@test.com", image: null },
          },
        ],
      });

      (prismaMock.problem.findMany as any).mockResolvedValueOnce([
        {
          id: "prob-1",
          title: "Two Sum",
          difficulty: "EASY",
          userId: "user-1",
          solvedAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      (prismaMock.submission.findMany as any).mockResolvedValueOnce([]);

      const req = new Request("http://localhost:3000/api/groups/group-1");
      const res = await getGroupDetail(req, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.group.name).toBe("Algo Squad");
      expect(data.members[0].solvedCount).toBe(1);
      expect(data.members[0].currentStreak).toBe(1);
      expect(data.activityFeed).toHaveLength(2); // 1 solve + 1 join
    });
  });

  describe("DELETE /api/groups/[id]", () => {
    it("returns 403 when non-owner tries to delete group", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-2" }, // not owner
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        id: "group-1",
        ownerId: "user-1", // owner is user-1
      });

      const req = new Request("http://localhost:3000/api/groups/group-1", {
        method: "DELETE",
      });
      const res = await deleteGroup(req, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(res.status).toBe(403);
    });

    it("allows owner to delete group", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        id: "group-1",
        ownerId: "user-1",
      });
      (prismaMock.group.delete as any).mockResolvedValueOnce({});

      const req = new Request("http://localhost:3000/api/groups/group-1", {
        method: "DELETE",
      });
      const res = await deleteGroup(req, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(res.status).toBe(200);
      expect(prismaMock.group.delete).toHaveBeenCalledWith({
        where: { id: "group-1" },
      });
    });
  });

  describe("POST /api/groups/[id]/regenerate-code", () => {
    it("allows only owner to regenerate join code", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-2" }, // not owner
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        id: "group-1",
        ownerId: "user-1",
      });

      const req = new Request("http://localhost:3000/api/groups/group-1/regenerate-code", {
        method: "POST",
      });
      const res = await regenerateCode(req, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(res.status).toBe(403);
    });

    it("regenerates code when called by owner", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.group.findUnique as any)
        .mockResolvedValueOnce({ id: "group-1", ownerId: "user-1" }) // group check
        .mockResolvedValueOnce(null); // uniqueness check

      (prismaMock.group.update as any).mockResolvedValueOnce({
        joinCode: "NEWCODE1",
      });

      const req = new Request("http://localhost:3000/api/groups/group-1/regenerate-code", {
        method: "POST",
      });
      const res = await regenerateCode(req, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.joinCode).toBe("NEWCODE1");
    });
  });

  describe("DELETE /api/groups/[id]/members/[userId]", () => {
    it("prevents owner from leaving/removing themselves", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" },
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        ownerId: "user-1",
      });

      const req = new Request("http://localhost:3000/api/groups/group-1/members/user-1", {
        method: "DELETE",
      });
      const res = await removeMember(req, {
        params: Promise.resolve({ id: "group-1", userId: "user-1" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("owner cannot leave");
    });

    it("allows owner to remove another member", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-1" }, // owner
      } as any);

      (prismaMock.group.findUnique as any).mockResolvedValueOnce({
        ownerId: "user-1",
      });
      (prismaMock.groupMember.findUnique as any).mockResolvedValueOnce({
        id: "mem-2",
        userId: "user-2",
        groupId: "group-1",
      });
      (prismaMock.groupMember.delete as any).mockResolvedValueOnce({});

      const req = new Request("http://localhost:3000/api/groups/group-1/members/user-2", {
        method: "DELETE",
      });
      const res = await removeMember(req, {
        params: Promise.resolve({ id: "group-1", userId: "user-2" }),
      });

      expect(res.status).toBe(200);
      expect(prismaMock.groupMember.delete).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: "user-2",
            groupId: "group-1",
          },
        },
      });
    });
  });
});
