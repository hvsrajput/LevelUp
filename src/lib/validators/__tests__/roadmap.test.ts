import { describe, it, expect } from "vitest";
import { generateRoadmapSchema } from "../roadmap";

describe("Roadmap Validator Schema", () => {
  it("accepts valid roadmap inputs", () => {
    const valid = {
      goal: "Full DSA Mastery",
      level: "intermediate",
      timeline: "8 weeks",
    };
    const res = generateRoadmapSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects invalid timeline", () => {
    const invalid = {
      goal: "Full DSA Mastery",
      level: "intermediate",
      timeline: "6 weeks",
    };
    const res = generateRoadmapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects goal shorter than 10 characters", () => {
    const invalid = {
      goal: "DSA DP",
      level: "intermediate",
      timeline: "4 weeks",
    };
    const res = generateRoadmapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("at least 10 characters");
    }
  });

  it("rejects goal longer than 500 characters", () => {
    const invalid = {
      goal: "a".repeat(501),
      level: "intermediate",
      timeline: "4 weeks",
    };
    const res = generateRoadmapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("not exceed 500 characters");
    }
  });

  it("rejects invalid level", () => {
    const invalid = {
      goal: "Dynamic Programming",
      level: "master",
      timeline: "4 weeks",
    };
    const res = generateRoadmapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects empty goal", () => {
    const invalid = {
      goal: " ",
      level: "beginner",
      timeline: "4 weeks",
    };
    const res = generateRoadmapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
