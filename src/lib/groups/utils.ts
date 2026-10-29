// =============================================================================
// Group Utilities: Join Code Generation and Streak Calculation
// =============================================================================

import { customAlphabet } from "nanoid";

// 32-character unambiguous uppercase alphabet (excluding 0, O, 1, I, l)
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const joinCodeGenerator = customAlphabet(ALPHABET, 8);

/**
 * Generate a unique, hard-to-guess 8-character join code.
 * Example output: "9XY4M7KR"
 */
export function generateJoinCode(): string {
  return joinCodeGenerator();
}

/**
 * Normalizes a date or date string to a UTC "YYYY-MM-DD" string.
 */
export function toUtcDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Computes a user's current daily streak and longest streak from an array of solved dates.
 * A streak is active if the user solved a problem either today or yesterday.
 */
export function calculateUserStreak(
  dates: (Date | string | null | undefined)[],
  referenceDate: Date = new Date()
): { currentStreak: number; longestStreak: number } {
  // Filter valid dates and extract unique sorted YYYY-MM-DD strings
  const uniqueDateSet = new Set<string>();
  for (const date of dates) {
    if (!date) continue;
    const str = toUtcDateString(date);
    if (str) uniqueDateSet.add(str);
  }

  if (uniqueDateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedDates = Array.from(uniqueDateSet).sort();

  // Calculate longest streak across all history
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr + "T00:00:00.000Z");
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = currentDate;
  }

  // Calculate current active streak relative to referenceDate
  const refDateStr = toUtcDateString(referenceDate);
  const refMidnight = new Date(refDateStr + "T00:00:00.000Z");

  // Yesterday string
  const yesterday = new Date(refMidnight);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = toUtcDateString(yesterday);

  // Check if solved today or yesterday
  const hasSolvedToday = uniqueDateSet.has(refDateStr);
  const hasSolvedYesterday = uniqueDateSet.has(yesterdayStr);

  if (!hasSolvedToday && !hasSolvedYesterday) {
    return { currentStreak: 0, longestStreak };
  }

  // Start walking backward from today (if solved) or yesterday (if solved)
  let currentStreak = 0;
  const cursor = new Date(hasSolvedToday ? refMidnight : yesterday);

  while (true) {
    const cursorStr = toUtcDateString(cursor);
    if (uniqueDateSet.has(cursorStr)) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}
