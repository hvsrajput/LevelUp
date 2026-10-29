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
      goal: "Full DSA",
      level: "intermediate",
      timeline: "6 weeks",
    };
    const res = generateRoadmapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
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
