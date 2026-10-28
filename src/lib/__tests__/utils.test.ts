import { describe, it, expect } from "vitest";
import {
  generateShortCode,
  difficultyColor,
  statusColor,
  formatDate,
} from "../utils";

describe("generateShortCode", () => {
  it("generates an 8-character string", () => {
    const code = generateShortCode();
    expect(code).toBeTypeOf("string");
    expect(code).toHaveLength(8);
  });

  it("generates unique codes", () => {
    const code1 = generateShortCode();
    const code2 = generateShortCode();
    expect(code1).not.toBe(code2);
  });
});

describe("difficultyColor", () => {
  it("returns green styling for EASY", () => {
    expect(difficultyColor("EASY")).toContain("green");
  });

  it("returns yellow styling for MEDIUM", () => {
    expect(difficultyColor("MEDIUM")).toContain("yellow");
  });

  it("returns red styling for HARD", () => {
    expect(difficultyColor("HARD")).toContain("red");
  });
});

describe("statusColor", () => {
  it("returns appropriate color tokens for statuses", () => {
    expect(statusColor("SOLVED")).toContain("green");
    expect(statusColor("ATTEMPTED")).toContain("blue");
    expect(statusColor("REVISIT")).toContain("orange");
  });
});

describe("formatDate", () => {
  it("formats ISO string date nicely", () => {
    const dateStr = "2026-01-15T00:00:00.000Z";
    const formatted = formatDate(dateStr);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Jan");
  });
});
