/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, redirectMock, notFoundMock } = vi.hoisted(() => {
  const mockPrisma: any = {
    problem: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    catalogProblem: {
      findFirst: vi.fn(),
    },
  };
  const mockRedirect = vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as any).digest = `NEXT_REDIRECT:${url}`;
    throw error;
  });
  const mockNotFound = vi.fn(() => {
    const error = new Error("NEXT_NOT_FOUND");
    (error as any).digest = "NEXT_NOT_FOUND";
    throw error;
  });
  return {
    prismaMock: mockPrisma,
    redirectMock: mockRedirect,
    notFoundMock: mockNotFound,
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/catalog/service", () => ({
  getCatalogProblemById: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { getCatalogProblemById } from "@/lib/catalog/service";
import EditProblemPage from "../[id]/edit/page";
import NewProblemPage from "../new/page";

const authMock = vi.mocked(auth);
const getCatalogProblemByIdMock = vi.mocked(getCatalogProblemById);

describe("Problem Pages Server Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("EditProblemPage", () => {
    it("renders existing problem values when owned by the user", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce({
        id: "prob-1",
        shortCode: "twosum",
        title: "Two Sum",
        difficulty: "EASY",
        status: "SOLVED",
        description: "Find two numbers...",
        constraints: "O(n)",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        notes: "My notes",
        hints: ["Hint 1"],
        approaches: [{ title: "Hash", description: "Use map" }],
        userId: "user-123",
        topics: [{ topic: { name: "Array" } }],
        testCases: [],
        submissions: [
          { code: "function test() {}", language: "typescript" },
        ],
      });

      const element = await EditProblemPage({
        params: Promise.resolve({ id: "prob-1" }),
        searchParams: Promise.resolve({}),
      });

      expect(element).toBeDefined();
      expect(prismaMock.problem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-123",
          }),
        })
      );
    });

    it("triggers notFound when problem is not found or not owned by user", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      prismaMock.problem.findFirst.mockResolvedValueOnce(null);

      await expect(
        EditProblemPage({
          params: Promise.resolve({ id: "foreign-problem" }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toThrow("NEXT_NOT_FOUND");

      expect(notFoundMock).toHaveBeenCalled();
    });
  });

  describe("NewProblemPage Catalog Tracking", () => {
    it("prefills form with catalog data when tracking a new catalog problem", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      getCatalogProblemByIdMock.mockResolvedValueOnce({
        id: "catalog-3sum",
        title: "3Sum",
        difficulty: "MEDIUM",
        summary: "Given an array nums, find all unique triplets...",
        topicTags: ["Array", "Two Pointers"],
        patternTag: "two-pointers",
        leetcodeQuestionId: 15,
        url: "https://leetcode.com/problems/3sum/",
      });

      // User does NOT have this problem yet
      prismaMock.problem.findFirst.mockResolvedValueOnce(null);

      const element = await NewProblemPage({
        searchParams: Promise.resolve({ catalogId: "catalog-3sum" }),
      });

      expect(element).toBeDefined();
      expect(getCatalogProblemByIdMock).toHaveBeenCalledWith("catalog-3sum");
      expect(prismaMock.problem.findFirst).toHaveBeenCalled();
    });

    it("redirects to edit page with notice if the user already tracks this catalog problem", async () => {
      authMock.mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      getCatalogProblemByIdMock.mockResolvedValueOnce({
        id: "catalog-3sum",
        title: "3Sum",
        difficulty: "MEDIUM",
        summary: "Given an array nums, find all unique triplets...",
        topicTags: ["Array", "Two Pointers"],
        patternTag: "two-pointers",
        leetcodeQuestionId: 15,
      });

      // User ALREADY tracks this problem
      prismaMock.problem.findFirst.mockResolvedValueOnce({
        id: "existing-prob-id",
        shortCode: "3sum-code",
      });

      await expect(
        NewProblemPage({
          searchParams: Promise.resolve({ catalogId: "catalog-3sum" }),
        })
      ).rejects.toThrow("NEXT_REDIRECT:/problems/3sum-code/edit?notice=Already%20in%20your%20problems");

      expect(redirectMock).toHaveBeenCalledWith(
        "/problems/3sum-code/edit?notice=Already%20in%20your%20problems"
      );
    });
  });
});
