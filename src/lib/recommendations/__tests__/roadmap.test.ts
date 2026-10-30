import { describe, it, expect } from "vitest";
import { buildSyllabus } from "../roadmap";

describe("Roadmap Syllabus Builder", () => {
  it("builds a 4-week daily schedule (28 days) with 7 days per week", () => {
    const syllabus = buildSyllabus("Full DSA", "beginner", "4 weeks");
    expect(syllabus).toHaveLength(28); // 4 weeks * 7 days
    expect(syllabus[0].weekNumber).toBe(1);
    expect(syllabus[0].dayNumber).toBe(1);
    expect(syllabus[6].dayNumber).toBe(7);
    expect(syllabus[7].weekNumber).toBe(2);
    expect(syllabus[0].problemTitles).toContain("Contains Duplicate");
    expect(syllabus.some((d) => d.problemTitles.includes("Two Sum"))).toBe(true);
  });

  it("builds an 8-week daily schedule (56 days) for intermediate with progressive difficulty", () => {
    const syllabus = buildSyllabus("Full DSA", "intermediate", "8 weeks");
    expect(syllabus).toHaveLength(56); // 8 weeks * 7 days
    // Early weeks focus on linear structures and foundations
    expect(syllabus.some((w) => w.weekNumber <= 3 && w.topicName.includes("Binary Search"))).toBe(true);
    // Mid to late weeks focus on trees, graphs, and dynamic programming
    expect(syllabus.some((w) => w.weekNumber >= 4 && w.topicName.includes("Tree"))).toBe(true);
    expect(syllabus.some((w) => w.weekNumber >= 6 && w.topicName.includes("Graph"))).toBe(true);
    expect(
      syllabus.some(
        (w) =>
          w.weekNumber >= 7 &&
          (w.topicName.includes("DP") || w.concept.includes("DP"))
      )
    ).toBe(true);
  });

  it("builds a 12-week comprehensive daily schedule (84 days) for advanced learners", () => {
    const syllabus = buildSyllabus("Full DSA", "advanced", "12 weeks");
    expect(syllabus).toHaveLength(84); // 12 weeks * 7 days
    expect(syllabus[83].weekNumber).toBe(12);
    expect(syllabus[83].dayNumber).toBe(7);
    expect(syllabus.some((d) => d.weekNumber === 12 && d.topicName.includes("Word Search II"))).toBe(true);
  });

  it("assigns valid day numbers 1 through 7 for every week", () => {
    const syllabus = buildSyllabus("Full DSA", "intermediate", "4 weeks");
    for (const item of syllabus) {
      expect(item.dayNumber).toBeGreaterThanOrEqual(1);
      expect(item.dayNumber).toBeLessThanOrEqual(7);
      expect(item.problemTitles.length).toBeGreaterThan(0);
    }
  });
});
