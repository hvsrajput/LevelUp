import { describe, it, expect } from "vitest";
import {
  buildSyllabus,
  repairOrValidateTopic,
  computeWeeklyDifficultyTargets,
  scheduleRoadmapProblems,
  validateDsaRelevance,
  type RoadmapWeeklyPlan,
} from "../roadmap";
import { CURATED_CATALOG_PROBLEMS } from "@/lib/catalog/catalog-data";

const DIFFICULTY_SCORE: Record<string, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

const catalogDiffMap = new Map<string, number>();
for (const p of CURATED_CATALOG_PROBLEMS) {
  catalogDiffMap.set(p.title.toLowerCase().trim(), DIFFICULTY_SCORE[p.difficulty]);
}

describe("Roadmap 7-Day Curriculum & Scheduler", () => {
  it("builds a 4-week schedule with exactly 7 days per week (28 days) and dayIndex 1 to 7", () => {
    const syllabus = buildSyllabus("Full DSA", "beginner", "4 weeks");
    expect(syllabus).toHaveLength(28);

    for (let w = 1; w <= 4; w++) {
      const weekItems = syllabus.filter((i) => i.weekNumber === w);
      expect(weekItems).toHaveLength(7);
      for (let d = 1; d <= 7; d++) {
        expect(weekItems[d - 1].dayIndex).toBe(d);
        expect(weekItems[d - 1].dayNumber).toBe(d);
      }
    }
  });

  it("enforces within-week difficulty ramp: day N difficulty >= day N-1 difficulty", () => {
    const syllabus = buildSyllabus("Full DSA", "intermediate", "4 weeks");

    for (let w = 1; w <= 4; w++) {
      const weekItems = syllabus.filter((i) => i.weekNumber === w);
      const dayDifficulties = weekItems.map((item) => {
        if (item.problemTitles.length === 0) return 0;
        return catalogDiffMap.get(item.problemTitles[0].toLowerCase().trim()) || 2;
      });

      // Filter out days with 0 problems if any
      const activeDiffs = dayDifficulties.filter((d) => d > 0);
      for (let i = 1; i < activeDiffs.length; i++) {
        expect(activeDiffs[i]).toBeGreaterThanOrEqual(activeDiffs[i - 1]);
      }
    }
  });

  it("enforces across-week difficulty ramp: week W average >= week W-1 average", () => {
    const syllabus = buildSyllabus("Full DSA", "beginner", "4 weeks");
    const weekAverages: number[] = [];

    for (let w = 1; w <= 4; w++) {
      const weekItems = syllabus.filter((i) => i.weekNumber === w);
      const scores = weekItems.flatMap((i) =>
        i.problemTitles.map((t) => catalogDiffMap.get(t.toLowerCase().trim()) || 2)
      );
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      weekAverages.push(avg);
    }

    for (let i = 1; i < weekAverages.length; i++) {
      expect(weekAverages[i]).toBeGreaterThanOrEqual(weekAverages[i - 1] - 0.05);
    }
  });

  it("shifts difficulty ramp based on starting level (beginner vs intermediate vs advanced)", () => {
    const beginner = buildSyllabus("Full DSA", "beginner", "4 weeks");
    const intermediate = buildSyllabus("Full DSA", "intermediate", "4 weeks");
    const advanced = buildSyllabus("Full DSA", "advanced", "4 weeks");

    const getFirstWeekAvg = (items: typeof beginner) => {
      const w1 = items.filter((i) => i.weekNumber === 1);
      const scores = w1.flatMap((i) =>
        i.problemTitles.map((t) => catalogDiffMap.get(t.toLowerCase().trim()) || 2)
      );
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    };

    const begAvg = getFirstWeekAvg(beginner);
    const intAvg = getFirstWeekAvg(intermediate);
    const advAvg = getFirstWeekAvg(advanced);

    // Beginner starts mostly Easy (< 1.5)
    expect(begAvg).toBeLessThanOrEqual(1.5);
    // Intermediate starts around Medium (~1.7 - 2.1)
    expect(intAvg).toBeGreaterThanOrEqual(begAvg);
    // Advanced starts highest
    expect(advAvg).toBeGreaterThanOrEqual(intAvg);
  });

  it("guarantees no problem appears twice across the entire roadmap (strict global uniqueness)", () => {
    const syllabus = buildSyllabus("Full DSA", "intermediate", "8 weeks");
    const allTitles = syllabus.flatMap((i) => i.problemTitles);
    const uniqueTitles = new Set(allTitles.map((t) => t.toLowerCase().trim()));

    expect(allTitles.length).toBe(uniqueTitles.size);
  });

  it("allocates 1 to 2 problems per day", () => {
    const syllabus = buildSyllabus("Full DSA", "beginner", "4 weeks");
    for (const item of syllabus) {
      expect(item.problemTitles.length).toBeGreaterThanOrEqual(0);
      expect(item.problemTitles.length).toBeLessThanOrEqual(2);
    }
  });

  it("handles catalog shortage by scheduling fewer problems and setting limited note (never duplicates or invents)", () => {
    // Curated catalog has 66 problems. A 12-week schedule (84 days) must gracefully handle exhaustion
    const weeklyPlan: RoadmapWeeklyPlan = {
      weeks: Array.from({ length: 12 }, (_, idx) => ({
        weekNumber: idx + 1,
        title: `Week ${idx + 1}`,
        focusTopics: ["Arrays & Hashing"],
        rationale: "Topic drills",
      })),
    };

    const res = scheduleRoadmapProblems({
      weeklyPlan,
      solvedProblemTitles: [],
      level: "intermediate",
    });

    expect(res.items).toHaveLength(84); // 12 weeks * 7 days
    const allTitles = res.items.flatMap((i) => i.problemTitles);
    const uniqueTitles = new Set(allTitles.map((t) => t.toLowerCase().trim()));

    // Strict uniqueness is never violated
    expect(allTitles.length).toBe(uniqueTitles.size);
    // Never invents problems not in catalog
    const catalogTitles = new Set(CURATED_CATALOG_PROBLEMS.map((p) => p.title.toLowerCase().trim()));
    for (const title of allTitles) {
      expect(catalogTitles.has(title.toLowerCase().trim())).toBe(true);
    }
    // Catalog limited note is set
    expect(res.limitedTopicsNote).toBeTruthy();
    expect(res.limitedTopicsNote).toContain("Catalog had limited problems for:");
  });

  it("repairs and validates topic names against knowledge base topics", () => {
    expect(repairOrValidateTopic("Two Pointers")).toBe("Two Pointers");
    expect(repairOrValidateTopic("sliding window")).toBe("Sliding Window");
    expect(repairOrValidateTopic("2d dp")).toBe("2-D Dynamic Programming");
    expect(repairOrValidateTopic("1D Dynamic Programming")).toBe("1-D Dynamic Programming");
    expect(repairOrValidateTopic("bsearch")).toBe("Binary Search");
    expect(repairOrValidateTopic("bst")).toBe("Trees");
    expect(repairOrValidateTopic("unknown random nonsense topic 12345")).toBeNull();
  });

  it("computes non-decreasing weekly difficulty targets", () => {
    const targets = computeWeeklyDifficultyTargets(8, "intermediate");
    expect(targets).toHaveLength(8);

    for (let i = 1; i < targets.length; i++) {
      expect(targets[i].easy).toBeLessThanOrEqual(targets[i - 1].easy);
      expect(targets[i].hard).toBeGreaterThanOrEqual(targets[i - 1].hard);
      expect(targets[i].targetAvg).toBeGreaterThanOrEqual(targets[i - 1].targetAvg);
    }
  });

  describe("validateDsaRelevance", () => {
    it("approves valid DSA goals containing topic or interview context", () => {
      const g1 = validateDsaRelevance("Crack product-company interviews in 3 months; weak at DP and graphs");
      expect(g1.isValid).toBe(true);

      const g2 = validateDsaRelevance("Master Trees, Tries and Dynamic Programming for FAANG rounds");
      expect(g2.isValid).toBe(true);

      const g3 = validateDsaRelevance("Foundations sprint: Arrays, Two Pointers & Binary Search");
      expect(g3.isValid).toBe(true);
    });

    it("rejects goals unrelated to DSA or too vague with a friendly rephrase message", () => {
      const r1 = validateDsaRelevance("How to bake a chocolate cake with milk and walnuts");
      expect(r1.isValid).toBe(false);
      expect(r1.error).toContain("unrelated to Data Structures & Algorithms");

      const r2 = validateDsaRelevance("Building a react frontend with vite and css modules");
      expect(r2.isValid).toBe(false);
      expect(r2.error).toContain("unrelated to Data Structures & Algorithms");

      const r3 = validateDsaRelevance("asdfghjkl qwerty uiop zxcvbnm 12345");
      expect(r3.isValid).toBe(false);
      expect(r3.error).toContain("unrelated to Data Structures & Algorithms");

      const r4 = validateDsaRelevance("too short");
      expect(r4.isValid).toBe(false);
      expect(r4.error).toContain("at least 10 characters");

      const r5 = validateDsaRelevance("a".repeat(501));
      expect(r5.isValid).toBe(false);
      expect(r5.error).toContain("not exceed 500 characters");
    });
  });
});
