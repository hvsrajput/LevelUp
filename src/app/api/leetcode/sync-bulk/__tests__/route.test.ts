import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, prismaMock, syncJobManagerMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
  },
  syncJobManagerMock: {
    createJob: vi.fn(),
    getJob: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/leetcode/sync-job", () => ({
  syncJobManager: syncJobManagerMock,
}));

import { POST } from "../route";
import { GET as GET_JOB } from "../[jobId]/route";

describe("Bulk Sync Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/leetcode/sync-bulk", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await POST();
      expect(res.status).toBe(401);
    });

    it("returns 400 when username is not linked", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.findUnique.mockResolvedValueOnce({ leetcodeUsername: null });

      const res = await POST();
      expect(res.status).toBe(400);
    });

    it("creates bulk job and returns jobId", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        leetcodeUsername: "tourist",
      });
      syncJobManagerMock.createJob.mockReturnValueOnce("job_12345");

      const res = await POST();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.jobId).toBe("job_12345");
      expect(syncJobManagerMock.createJob).toHaveBeenCalledWith(
        "user-1",
        "tourist"
      );
    });
  });

  describe("GET /api/leetcode/sync-bulk/[jobId]", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await GET_JOB(new Request("http://localhost"), {
        params: Promise.resolve({ jobId: "job_12345" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 404 when job not found or belongs to another user", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      syncJobManagerMock.getJob.mockReturnValueOnce({
        id: "job_12345",
        userId: "user-different",
      });

      const res = await GET_JOB(new Request("http://localhost"), {
        params: Promise.resolve({ jobId: "job_12345" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns job details when authenticated and matching user", async () => {
      authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
      syncJobManagerMock.getJob.mockReturnValueOnce({
        id: "job_12345",
        userId: "user-1",
        username: "tourist",
        status: "RUNNING",
        total: 50,
        processed: 25,
        imported: 20,
        skipped: 5,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await GET_JOB(new Request("http://localhost"), {
        params: Promise.resolve({ jobId: "job_12345" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("job_12345");
      expect(data.status).toBe("RUNNING");
      expect(data.processed).toBe(25);
      expect(data.total).toBe(50);
    });
  });
});
