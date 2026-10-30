// =============================================================================
// Streak Calculation & Summary Service
// =============================================================================
// Derives streaks strictly on-the-fly from stored solve days.
// Pure arithmetic using UTC date strings without any local Date quirks.
// =============================================================================

import { prisma } from "@/lib/prisma";
import {
  addDays,
  diffDays,
  getTodayInTimezone,
  sanitizeTimezone,
  DEFAULT_TIMEZONE,
} from "@/lib/date";

export interface StreakResult {
  current: number;
  longest: number;
  solvedToday: boolean;
  atRisk: boolean;
  lastSolveDay: string | null;
}

export interface StreakSummary {
  streak: StreakResult;
  timezone: string;
  today: string;
}

/**
 * Pure function: calculates streak stats from an array of solve days and a reference today.
 *
 * Rules:
 * - Current streak = consecutive solve days ending today, or ending yesterday if
 *   today has no solve yet (the streak stays alive until the day ends).
 * - Longest streak = the longest consecutive run of solve days ever.
 * - atRisk = current > 0 and no solve yet today.
 * - Duplicates are deduplicated; unsorted inputs are sorted.
 */
export function computeStreak(days: string[], today: string): StreakResult {
  if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error(`Invalid today date string: ${today}. Expected YYYY-MM-DD.`);
  }

  // Filter valid YYYY-MM-DD strings, deduplicate, and sort ascending
  const validDays = Array.from(
    new Set(days.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)))
  ).sort();

  if (validDays.length === 0) {
    return {
      current: 0,
      longest: 0,
      solvedToday: false,
      atRisk: false,
      lastSolveDay: null,
    };
  }

  const daySet = new Set(validDays);
  const lastSolveDay = validDays[validDays.length - 1];

  // 1. Calculate longest consecutive run across all history
  let longest = 0;
  let currentRun = 0;
  let prevDay = "";

  for (const day of validDays) {
    if (!prevDay) {
      currentRun = 1;
    } else {
      const diff = diffDays(prevDay, day);
      if (diff === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longest) {
      longest = currentRun;
    }
    prevDay = day;
  }

  // 2. Calculate current streak relative to today
  const solvedToday = daySet.has(today);
  const yesterday = addDays(today, -1);
  const solvedYesterday = daySet.has(yesterday);

  let current = 0;
  if (solvedToday || solvedYesterday) {
    // Start scanning backward from today (if solved) or yesterday (if solved)
    let cursor = solvedToday ? today : yesterday;
    while (daySet.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  // atRisk is true when current streak is positive, but today hasn't been solved yet
  const atRisk = current > 0 && !solvedToday;

  return {
    current,
    longest,
    solvedToday,
    atRisk,
    lastSolveDay,
  };
}

/**
 * Server function: loads distinct solve days for a user and computes their streaks
 * in their configured timezone.
 */
export async function getStreakSummary(userId: string): Promise<StreakSummary> {
  // 1. Fetch user's timezone
  const user = prisma.user?.findUnique
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      })
    : null;

  const timezone = sanitizeTimezone(user?.timezone || DEFAULT_TIMEZONE);
  const today = getTodayInTimezone(timezone);

  // 2. Fetch distinct solved days (single query)
  const rawProblems = prisma.problem?.findMany
    ? await prisma.problem.findMany({
        where: {
          userId,
          status: "SOLVED",
          solvedDay: { not: null },
        },
        select: {
          solvedDay: true,
        },
        distinct: ["solvedDay"],
      })
    : [];

  const distinctDays = Array.isArray(rawProblems)
    ? rawProblems
        .map((p) => p.solvedDay)
        .filter((d): d is string => Boolean(d))
    : [];

  const streak = computeStreak(distinctDays, today);

  return {
    streak,
    timezone,
    today,
  };
}
