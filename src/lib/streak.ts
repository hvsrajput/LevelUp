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
  getLastNDays,
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

export interface DayHeatmapItem {
  date: string;
  count: number;
  titles: string[];
}

export interface StreakSummary {
  streak: StreakResult;
  heatmap: DayHeatmapItem[];
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
 * Server function: loads distinct solve days for a user, computes their streaks
 * in their configured timezone, and builds the last 84 days (12 weeks) heatmap.
 */
export async function getStreakSummary(userId: string): Promise<StreakSummary> {
  // 1. Fetch user's timezone
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  const timezone = sanitizeTimezone(user?.timezone || DEFAULT_TIMEZONE);
  const today = getTodayInTimezone(timezone);

  // 2. Fetch all solved problems with a non-null solvedDay for this user
  // (LeetCode paste imports have solvedDay = null, so they are automatically excluded)
  const problems = await prisma.problem.findMany({
    where: {
      userId,
      status: "SOLVED",
      solvedDay: { not: null },
    },
    select: {
      solvedDay: true,
      title: true,
    },
    orderBy: {
      solvedDay: "asc",
    },
  });

  // Group problems by solvedDay
  const dayMap = new Map<string, { count: number; titles: string[] }>();
  for (const p of problems) {
    if (!p.solvedDay) continue;
    const existing = dayMap.get(p.solvedDay) || { count: 0, titles: [] };
    existing.count += 1;
    existing.titles.push(p.title);
    dayMap.set(p.solvedDay, existing);
  }

  const distinctDays = Array.from(dayMap.keys());
  const streak = computeStreak(distinctDays, today);

  // 3. Build last 84 days (12 weeks × 7 days) heatmap
  const last84Days = getLastNDays(today, 84);
  const heatmap: DayHeatmapItem[] = last84Days.map((date) => {
    const data = dayMap.get(date);
    return {
      date,
      count: data ? data.count : 0,
      titles: data ? data.titles : [],
    };
  });

  return {
    streak,
    heatmap,
    timezone,
    today,
  };
}
