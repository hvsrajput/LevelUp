import { describe, it, expect } from "vitest";
import { generateJoinCode, calculateUserStreak, toUtcDateString } from "../utils";

describe("Group Utilities", () => {
  describe("generateJoinCode", () => {
    it("generates an 8-character uppercase alphanumeric code", () => {
      const code = generateJoinCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    it("generates distinct codes across calls", () => {
      const codes = new Set(Array.from({ length: 50 }, () => generateJoinCode()));
      expect(codes.size).toBe(50);
    });
  });

  describe("toUtcDateString", () => {
    it("converts Date object to YYYY-MM-DD", () => {
      const d = new Date("2026-10-29T15:30:00.000Z");
      expect(toUtcDateString(d)).toBe("2026-10-29");
    });

    it("handles invalid dates gracefully", () => {
      expect(toUtcDateString(new Date("invalid"))).toBe("");
    });
  });

  describe("calculateUserStreak", () => {
    const refDate = new Date("2026-10-29T12:00:00.000Z");

    it("returns 0 for empty solves", () => {
      const result = calculateUserStreak([], refDate);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it("calculates active streak if solved today", () => {
      const dates = [
        new Date("2026-10-27T08:00:00.000Z"),
        new Date("2026-10-28T09:00:00.000Z"),
        new Date("2026-10-29T10:00:00.000Z"), // today
      ];
      const result = calculateUserStreak(dates, refDate);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it("calculates active streak if solved yesterday but not yet today", () => {
      const dates = [
        new Date("2026-10-27T08:00:00.000Z"),
        new Date("2026-10-28T09:00:00.000Z"), // yesterday
      ];
      const result = calculateUserStreak(dates, refDate);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it("resets current streak to 0 if last solve was 2 days ago", () => {
      const dates = [
        new Date("2026-10-25T08:00:00.000Z"),
        new Date("2026-10-26T08:00:00.000Z"),
        new Date("2026-10-27T08:00:00.000Z"), // 2 days ago
      ];
      const result = calculateUserStreak(dates, refDate);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(3);
    });

    it("handles multiple solves on the same day without inflating streak", () => {
      const dates = [
        new Date("2026-10-28T08:00:00.000Z"),
        new Date("2026-10-28T14:00:00.000Z"),
        new Date("2026-10-29T02:00:00.000Z"),
        new Date("2026-10-29T20:00:00.000Z"),
      ];
      const result = calculateUserStreak(dates, refDate);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });
  });
});
