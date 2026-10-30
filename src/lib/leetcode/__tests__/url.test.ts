import { describe, it, expect } from "vitest";
import { safeLeetCodeUrl, getProblemLeetCodeUrl } from "../url";

describe("safeLeetCodeUrl", () => {
  it("accepts valid https leetcode.com URLs", () => {
    expect(safeLeetCodeUrl("https://leetcode.com/problems/two-sum/")).toBe(true);
    expect(safeLeetCodeUrl("https://www.leetcode.com/problems/contains-duplicate/")).toBe(true);
    expect(safeLeetCodeUrl("https://cn.leetcode.com/problems/merge-two-sorted-lists/")).toBe(true);
  });

  it("rejects http URLs", () => {
    expect(safeLeetCodeUrl("http://leetcode.com/problems/two-sum/")).toBe(false);
    expect(safeLeetCodeUrl("http://www.leetcode.com/problems/two-sum/")).toBe(false);
  });

  it("rejects non-LeetCode domains", () => {
    expect(safeLeetCodeUrl("https://hackerrank.com/challenges/two-sum")).toBe(false);
    expect(safeLeetCodeUrl("https://codeforces.com/problemset/problem/1/A")).toBe(false);
    expect(safeLeetCodeUrl("https://notleetcode.com/problems/two-sum/")).toBe(false);
    expect(safeLeetCodeUrl("https://leetcode.com.attacker.com/problems/two-sum/")).toBe(false);
  });

  it("rejects javascript: and dangerous schemas", () => {
    expect(safeLeetCodeUrl("javascript:alert(1)")).toBe(false);
    expect(safeLeetCodeUrl("javascript:void(0)")).toBe(false);
    expect(safeLeetCodeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects null, undefined, empty string", () => {
    expect(safeLeetCodeUrl(null)).toBe(false);
    expect(safeLeetCodeUrl(undefined)).toBe(false);
    expect(safeLeetCodeUrl("")).toBe(false);
    expect(safeLeetCodeUrl("   ")).toBe(false);
  });
});

describe("getProblemLeetCodeUrl", () => {
  it("derives URL from titleSlug", () => {
    const url = getProblemLeetCodeUrl({ titleSlug: "two-sum" });
    expect(url).toBe("https://leetcode.com/problems/two-sum/");
  });

  it("validates stored url when titleSlug is missing", () => {
    const url = getProblemLeetCodeUrl({
      url: "https://leetcode.com/problems/valid-anagram/",
    });
    expect(url).toBe("https://leetcode.com/problems/valid-anagram/");
  });

  it("prioritizes titleSlug over stored url if both provided", () => {
    const url = getProblemLeetCodeUrl({
      titleSlug: "group-anagrams",
      url: "https://leetcode.com/problems/old-slug/",
    });
    expect(url).toBe("https://leetcode.com/problems/group-anagrams/");
  });

  it("returns null when problem is not on LeetCode", () => {
    expect(getProblemLeetCodeUrl(null)).toBeNull();
    expect(getProblemLeetCodeUrl({})).toBeNull();
    expect(getProblemLeetCodeUrl({ titleSlug: null, url: null })).toBeNull();
    expect(
      getProblemLeetCodeUrl({
        url: "https://hackerrank.com/challenges/solve-me-first",
      })
    ).toBeNull();
  });
});
