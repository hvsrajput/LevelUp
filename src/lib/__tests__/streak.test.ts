import { describe, it, expect } from "vitest";
import { computeStreak } from "../streak";
import { addDays, diffDays, getTodayInTimezone, isValidIanaTimezone } from "../date";

describe("computeStreak pure logic", () => {
  const TODAY = "2026-10-30";

  it("handles empty input", () => {
    const result = computeStreak([], TODAY);
    expect(result).toEqual({
      current: 0,
      longest: 0,
      solvedToday: false,
      atRisk: false,
      lastSolveDay: null,
    });
  });

  it("handles solved only today", () => {
    const result = computeStreak(["2026-10-30"], TODAY);
    expect(result).toEqual({
      current: 1,
      longest: 1,
      solvedToday: true,
      atRisk: false,
      lastSolveDay: "2026-10-30",
    });
  });

  it("handles solved only yesterday (streak remains alive, atRisk=true)", () => {
    const result = computeStreak(["2026-10-29"], TODAY);
    expect(result).toEqual({
      current: 1,
      longest: 1,
      solvedToday: false,
      atRisk: true,
      lastSolveDay: "2026-10-29",
    });
  });

  it("handles gap of two days (broken streak)", () => {
    // Solved 2 days ago (2026-10-28), neither yesterday nor today
    const result = computeStreak(["2026-10-28"], TODAY);
    expect(result).toEqual({
      current: 0,
      longest: 1,
      solvedToday: false,
      atRisk: false,
      lastSolveDay: "2026-10-28",
    });
  });

  it("handles duplicates correctly without inflating streak", () => {
    const result = computeStreak(
      ["2026-10-30", "2026-10-30", "2026-10-29", "2026-10-29"],
      TODAY
    );
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
    expect(result.solvedToday).toBe(true);
    expect(result.atRisk).toBe(false);
  });

  it("handles longest vs current", () => {
    // 5-day historical run in early October, then 2-day current run
    const days = [
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-29",
      "2026-10-30",
    ];
    const result = computeStreak(days, TODAY);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(5);
    expect(result.solvedToday).toBe(true);
    expect(result.atRisk).toBe(false);
  });

  it("handles month boundaries correctly", () => {
    // February 28 to March 1 (leap year 2024 has Feb 29)
    // Non-leap year 2025: Feb 28 to March 1 is consecutive
    const result = computeStreak(["2025-02-28", "2025-03-01"], "2025-03-01");
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
    expect(result.solvedToday).toBe(true);
  });

  it("handles year boundaries correctly", () => {
    const result = computeStreak(["2025-12-31", "2026-01-01"], "2026-01-01");
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
    expect(result.solvedToday).toBe(true);
  });

  it("handles unsorted input", () => {
    const days = ["2026-10-30", "2026-10-27", "2026-10-29", "2026-10-28"];
    const result = computeStreak(days, TODAY);
    expect(result.current).toBe(4);
    expect(result.longest).toBe(4);
    expect(result.solvedToday).toBe(true);
    expect(result.atRisk).toBe(false);
    expect(result.lastSolveDay).toBe("2026-10-30");
  });
});

describe("date helper utilities", () => {
  it("validates real IANA timezones and rejects invalid ones", () => {
    expect(isValidIanaTimezone("Asia/Kolkata")).toBe(true);
    expect(isValidIanaTimezone("America/New_York")).toBe(true);
    expect(isValidIanaTimezone("Europe/London")).toBe(true);
    expect(isValidIanaTimezone("UTC")).toBe(true);
    expect(isValidIanaTimezone("Not/A_Real_Timezone")).toBe(false);
    expect(isValidIanaTimezone("")).toBe(false);
  });

  it("performs correct date addition and difference", () => {
    expect(addDays("2026-10-30", 1)).toBe("2026-10-31");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(diffDays("2026-10-01", "2026-10-05")).toBe(4);
  });

  it("computes formatted date in given timezone", () => {
    const fixedUtcDate = new Date("2026-10-30T19:00:00.000Z"); // 7pm UTC
    // In Asia/Kolkata (+5:30), this is 2026-10-31 00:30 AM
    const kolkataDay = getTodayInTimezone("Asia/Kolkata", fixedUtcDate);
    expect(kolkataDay).toBe("2026-10-31");

    // In America/New_York (-4:00 EDT), this is 2026-10-30 15:00
    const nyDay = getTodayInTimezone("America/New_York", fixedUtcDate);
    expect(nyDay).toBe("2026-10-30");
  });
});
