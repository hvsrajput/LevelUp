// =============================================================================
// Timezone and Date-String Utilities
// =============================================================================
// All date handling across LevelUp goes through this module.
// Strictly uses UTC-based date-string arithmetic to avoid local Date / DST quirks.
// =============================================================================

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Validates whether a given string is a valid IANA timezone identifier.
 */
export function isValidIanaTimezone(timeZone: string): boolean {
  if (!timeZone || typeof timeZone !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes and falls back to a valid IANA timezone.
 */
export function sanitizeTimezone(timeZone?: string | null): string {
  if (timeZone && isValidIanaTimezone(timeZone)) {
    return timeZone;
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Returns the calendar day "YYYY-MM-DD" for a given moment in the user's timezone.
 */
export function getTodayInTimezone(
  timeZone: string = DEFAULT_TIMEZONE,
  date: Date = new Date()
): string {
  const tz = sanitizeTimezone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) {
    // Fallback to UTC slice
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

/**
 * Pure UTC-based date-string arithmetic: add or subtract days from a "YYYY-MM-DD" string.
 */
export function addDays(dateStr: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date string format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Get yesterday's date string relative to a given "YYYY-MM-DD" string.
 */
export function getYesterday(todayStr: string): string {
  return addDays(todayStr, -1);
}

/**
 * Get tomorrow's date string relative to a given "YYYY-MM-DD" string.
 */
export function getTomorrow(todayStr: string): string {
  return addDays(todayStr, 1);
}

/**
 * Difference in full calendar days between two "YYYY-MM-DD" strings (b - a).
 * If b > a, result is positive.
 */
export function diffDays(dateStrA: string, dateStrB: string): number {
  const msA = Date.parse(`${dateStrA}T00:00:00.000Z`);
  const msB = Date.parse(`${dateStrB}T00:00:00.000Z`);
  return Math.round((msB - msA) / 86_400_000);
}

/**
 * Returns an array of the last N calendar days (in ascending order) ending on `todayStr`.
 * E.g., for an 84-day (12 weeks) heatmap calendar.
 */
export function getLastNDays(todayStr: string, n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(todayStr, -i));
  }
  return days;
}

/**
 * Accessible human-readable formatted date string (e.g. "Oct 30, 2026").
 */
export function formatDateDisplay(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
