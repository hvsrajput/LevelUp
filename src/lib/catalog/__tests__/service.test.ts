import { describe, it, expect } from "vitest";
import { getCatalogProblems, getCatalogProblemById } from "../service";

describe("Catalog Service", () => {
  it("retrieves catalog problems with pagination", async () => {
    const res = await getCatalogProblems({ limit: 10, offset: 0 });
    expect(res.problems.length).toBeLessThanOrEqual(10);
    expect(res.total).toBeGreaterThanOrEqual(50);
  });

  it("filters catalog problems by topic", async () => {
    const res = await getCatalogProblems({ topic: "Dynamic Programming" });
    expect(res.problems.length).toBeGreaterThan(0);
    for (const p of res.problems) {
      expect(
        p.topicTags.some((t) => t.toLowerCase().includes("dynamic programming"))
      ).toBe(true);
    }
  });

  it("filters catalog problems by difficulty", async () => {
    const res = await getCatalogProblems({ difficulty: "EASY" });
    expect(res.problems.length).toBeGreaterThan(0);
    for (const p of res.problems) {
      expect(p.difficulty).toBe("EASY");
    }
  });

  it("searches catalog problems by keyword", async () => {
    const res = await getCatalogProblems({ search: "Two Sum" });
    expect(res.problems.length).toBeGreaterThan(0);
    expect(res.problems[0].title).toContain("Two Sum");
  });

  it("retrieves a single problem by title", async () => {
    const problem = await getCatalogProblemById("Invert Binary Tree");
    expect(problem).not.toBeNull();
    expect(problem?.title).toBe("Invert Binary Tree");
    expect(problem?.difficulty).toBe("EASY");
  });
});
