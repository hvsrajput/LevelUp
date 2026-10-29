import { describe, it, expect } from "vitest";
import {
  createSubmissionSchema,
  SUPPORTED_LANGUAGES,
} from "../submission";

describe("createSubmissionSchema", () => {
  it("validates a standard code submission", () => {
    const input = {
      language: "python",
      code: "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]",
      runtime: "45ms",
      memory: "16.4MB",
      notes: "Optimal hash map solution O(n) time, O(n) space",
      markStatus: "SOLVED" as const,
    };

    const result = createSubmissionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe("python");
      expect(result.data.runtime).toBe("45ms");
      expect(result.data.markStatus).toBe("SOLVED");
    }
  });

  it("fails if code is empty", () => {
    const input = {
      language: "typescript",
      code: "",
    };

    const result = createSubmissionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails if language is missing", () => {
    const input = {
      code: "console.log('hello')",
    };

    const result = createSubmissionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("includes all major DSA programming languages", () => {
    expect(SUPPORTED_LANGUAGES).toContain("python");
    expect(SUPPORTED_LANGUAGES).toContain("typescript");
    expect(SUPPORTED_LANGUAGES).toContain("javascript");
    expect(SUPPORTED_LANGUAGES).toContain("cpp");
    expect(SUPPORTED_LANGUAGES).toContain("java");
    expect(SUPPORTED_LANGUAGES).toContain("go");
    expect(SUPPORTED_LANGUAGES).toContain("rust");
  });
});
