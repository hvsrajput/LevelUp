import { describe, it, expect } from "vitest";
import { isValidLeetCodeUrl } from "../solve-button";

describe("SolveButton URL Validation (isValidLeetCodeUrl)", () => {
  it("validates valid leetcode.com problem URLs", () => {
    expect(isValidLeetCodeUrl("https://leetcode.com/problems/two-sum/")).toBe(true);
    expect(
      isValidLeetCodeUrl("https://www.leetcode.com/problems/contains-duplicate/")
    ).toBe(true);
    expect(
      isValidLeetCodeUrl("https://cn.leetcode.com/problems/merge-two-sorted-lists/")
    ).toBe(true);
  });

  it("rejects null, undefined, and empty string inputs", () => {
    expect(isValidLeetCodeUrl(null)).toBe(false);
    expect(isValidLeetCodeUrl(undefined)).toBe(false);
    expect(isValidLeetCodeUrl("")).toBe(false);
    expect(isValidLeetCodeUrl("   ")).toBe(false);
  });

  it("rejects insecure http URLs", () => {
    expect(isValidLeetCodeUrl("http://leetcode.com/problems/two-sum/")).toBe(false);
    expect(isValidLeetCodeUrl("http://www.leetcode.com/problems/two-sum/")).toBe(false);
  });

  it("rejects wrong hosts and domain spoofing attempts", () => {
    expect(isValidLeetCodeUrl("https://hackerrank.com/challenges/two-sum")).toBe(false);
    expect(isValidLeetCodeUrl("https://codeforces.com/problemset/problem/1/A")).toBe(false);
    expect(isValidLeetCodeUrl("https://notleetcode.com/problems/two-sum/")).toBe(false);
    expect(
      isValidLeetCodeUrl("https://leetcode.com.attacker.com/problems/two-sum/")
    ).toBe(false);
    expect(
      isValidLeetCodeUrl("https://fake-leetcode.com/problems/two-sum/")
    ).toBe(false);
  });

  it("rejects dangerous javascript: URLs", () => {
    expect(isValidLeetCodeUrl("javascript:alert(1)")).toBe(false);
    expect(isValidLeetCodeUrl("javascript:void(0)")).toBe(false);
    expect(isValidLeetCodeUrl("javascript:window.location='evil.com'")).toBe(false);
  });

  it("rejects malformed and non-URL strings", () => {
    expect(isValidLeetCodeUrl("not-a-url")).toBe(false);
    expect(isValidLeetCodeUrl("leetcode.com/problems/two-sum")).toBe(false); // missing protocol
    expect(isValidLeetCodeUrl("ftp://leetcode.com/problems/two-sum")).toBe(false);
  });
});
