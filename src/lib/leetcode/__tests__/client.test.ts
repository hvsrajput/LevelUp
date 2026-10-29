import { describe, it, expect } from "vitest";
import { MockLeetCodeClient, getLeetCodeClient } from "../client";

describe("LeetCode Client (Deterministic Mock)", () => {
  const client = new MockLeetCodeClient();

  it("verifies valid username correctly", async () => {
    const res = await client.verifyUsername("tourist");
    expect(res.valid).toBe(true);
    expect(res.username).toBe("tourist");
    expect(res.totalSolved).toBeGreaterThan(0);
    expect(res.ranking).toBeGreaterThan(0);
  });

  it("fails verification for invalid username", async () => {
    const res = await client.verifyUsername("invalid_user_9999");
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("fetches problem by official question number", async () => {
    const prob = await client.getProblemByNumber(1);
    expect(prob).not.toBeNull();
    expect(prob?.questionId).toBe(1);
    expect(prob?.title).toBe("Two Sum");
    expect(prob?.difficulty).toBe("EASY");
    expect(prob?.topicTags).toContain("Array");
  });

  it("returns null for non-existent question number", async () => {
    const prob = await client.getProblemByNumber(99999);
    expect(prob).toBeNull();
  });

  it("fetches problem by titleSlug", async () => {
    const prob = await client.getProblemBySlug("two-sum");
    expect(prob).not.toBeNull();
    expect(prob?.title).toBe("Two Sum");
  });

  it("fetches deterministic recent submissions", async () => {
    const subs = await client.getRecentSubmissions("coder123");
    expect(subs.length).toBeGreaterThan(0);
    expect(subs[0].statusDisplay).toBe("Accepted");
    expect(subs[0].questionId).toBe(1);
    expect(subs[0].timestamp).toBeGreaterThan(0);
  });

  it("fetches all solved problems with progress reporting", async () => {
    let progressCalls = 0;
    const problems = await client.getAllSolvedProblems("coder123", (curr, total) => {
      progressCalls++;
      expect(curr).toBeLessThanOrEqual(total);
    });

    expect(problems.length).toBeGreaterThan(0);
    expect(progressCalls).toBe(problems.length);
  });

  it("getLeetCodeClient returns MockLeetCodeClient during tests", () => {
    const activeClient = getLeetCodeClient();
    expect(activeClient).toBeInstanceOf(MockLeetCodeClient);
  });
});
