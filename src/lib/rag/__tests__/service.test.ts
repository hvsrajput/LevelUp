import { describe, it, expect, beforeEach } from "vitest";
import {
  retrieveNearestPatterns,
  generateSuggestions,
} from "../service";
import { suggestionCache, ragRateLimiter } from "../cache";

describe("RAG Pattern Retrieval", () => {
  it("retrieves Sliding Window for substring problems", async () => {
    const query = "Find the longest contiguous substring without repeating characters in string s.";
    const patterns = await retrieveNearestPatterns(query, 2);

    expect(patterns.length).toBeGreaterThan(0);
    const topics = patterns.map((p) => p.topic);
    expect(topics).toContain("Sliding Window");
  });

  it("retrieves Two Pointers for sorted array pair sum", async () => {
    const query = "Given a 1-indexed array of integers numbers that is already sorted, find two numbers such that they add up to target.";
    const patterns = await retrieveNearestPatterns(query, 2);

    expect(patterns.length).toBeGreaterThan(0);
    const topics = patterns.map((p) => p.topic);
    expect(topics).toContain("Two Pointers");
  });

  it("retrieves Monotonic Stack for next greater element", async () => {
    const query = "Given an array of temperatures, return an array such that answer[i] is the number of days until a warmer temperature or next greater element.";
    const patterns = await retrieveNearestPatterns(query, 2);

    expect(patterns.length).toBeGreaterThan(0);
    const topics = patterns.map((p) => p.topic);
    expect(topics).toContain("Monotonic Stack");
  });
});

describe("generateSuggestions (Grounded RAG)", () => {
  it("returns grounded topics, approaches, hints, and citations", async () => {
    const input = {
      title: "Subarray Sum Equals K",
      description: "Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k.",
    };

    const suggestions = await generateSuggestions(input);

    expect(suggestions.suggestedTopics.length).toBeGreaterThan(0);
    expect(suggestions.candidateApproaches.length).toBeGreaterThan(0);
    expect(suggestions.progressiveHints.length).toBeGreaterThan(0);
    expect(suggestions.citedPatterns.length).toBeGreaterThan(0);

    // Citations must match returned topics
    const citedTopicNames = suggestions.citedPatterns.map((c) => c.topic);
    expect(citedTopicNames).toContain("Prefix Sum & Hash Map");
  });
});

describe("suggestionCache", () => {
  beforeEach(() => {
    suggestionCache.clear();
  });

  it("caches suggestions and retrieves on matching key", () => {
    const key = suggestionCache.generateKey("Two Sum", "Find two numbers in array");
    const mockData = {
      suggestedTopics: ["Two Pointers"],
      candidateApproaches: [
        { title: "Two Pointers", description: "Use left and right pointers." },
      ],
      progressiveHints: [
        { level: "nudge" as const, text: "Try pointers at ends." },
      ],
      citedPatterns: [
        { id: "1", topic: "Two Pointers", signals: "sorted array" },
      ],
    };

    expect(suggestionCache.get(key)).toBeNull();
    suggestionCache.set(key, mockData);

    const retrieved = suggestionCache.get(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.suggestedTopics).toEqual(["Two Pointers"]);
  });
});

describe("ragRateLimiter", () => {
  beforeEach(() => {
    ragRateLimiter.reset();
  });

  it("allows up to max requests and blocks excess requests", () => {
    const userId = "user-test-123";

    // 10 requests allowed
    for (let i = 0; i < 10; i++) {
      const res = ragRateLimiter.check(userId);
      expect(res.allowed).toBe(true);
    }

    // 11th request rejected
    const blocked = ragRateLimiter.check(userId);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
