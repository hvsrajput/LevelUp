import { describe, it, expect } from "vitest";
import { buildSyllabus } from "../roadmap";

describe("Roadmap Syllabus Builder", () => {
  it("builds a 4-week Full DSA syllabus for beginners", () => {
    const syllabus = buildSyllabus("Full DSA", "beginner", "4 weeks");
    expect(syllabus).toHaveLength(4);
    expect(syllabus[0].weekNumber).toBe(1);
    expect(syllabus[0].problemTitles).toContain("Two Sum");
  });

  it("builds an 8-week Full DSA syllabus for intermediate", () => {
    const syllabus = buildSyllabus("Full DSA", "intermediate", "8 weeks");
    expect(syllabus).toHaveLength(8);
    expect(syllabus.some((w) => w.topicName.includes("Dynamic Programming"))).toBe(true);
    expect(syllabus.some((w) => w.topicName.includes("Binary Trees"))).toBe(true);
  });

  it("builds a 12-week Full DSA syllabus for advanced", () => {
    const syllabus = buildSyllabus("Full DSA", "advanced", "12 weeks");
    expect(syllabus).toHaveLength(12);
    expect(syllabus[11].topicName).toContain("Revision");
  });

  it("builds a dedicated Dynamic Programming syllabus", () => {
    const syllabus = buildSyllabus("Dynamic Programming", "intermediate", "4 weeks");
    expect(syllabus).toHaveLength(4);
    expect(syllabus[0].topicName).toContain("1D DP");
    expect(syllabus[0].problemTitles).toContain("Climbing Stairs");
  });

  it("builds a dedicated Trees & Graphs syllabus", () => {
    const syllabus = buildSyllabus("Trees & Graphs", "beginner", "4 weeks");
    expect(syllabus).toHaveLength(4);
    expect(syllabus[0].problemTitles).toContain("Invert Binary Tree");
  });
});
