import {
  DifficultyTag,
  Issue,
  QuestionEntry,
  RoadmapDraft,
  WeekDraft,
} from "./types";

/**
 * Normalizes title by lowercasing, removing punctuation, and collapsing spaces.
 */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Strips control characters (except space, tab, newline) and normalizes smart quotes / non-breaking spaces.
 */
export function sanitizeInputText(raw: string): string {
  return raw
    .replace(/\u00A0/g, " ") // Non-breaking space to regular space
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Control characters
}

export interface ParsedQuestionResult {
  entry: QuestionEntry;
  issues: Issue[];
}

/**
 * Parses a single question line according to the specification:
 * - Strip leading list markers ("-", "*", bullet, "1.", "1)"). Leading "1." is list numbering, NOT a LeetCode number.
 * - LeetCode number recognized only as "#49 Title", "LC 49", "LeetCode 49", or digits-only line.
 * - leetcode.com/problems/<slug> parsed for slug only. Non-LeetCode URLs produce a blocking error issue.
 * - Optional trailing difficulty tag: "(Easy)", "[Medium]", "- Hard".
 * - Max title length: 200 chars.
 */
export function parseQuestionLine(rawLine: string, lineNum?: number): ParsedQuestionResult {
  const issues: Issue[] = [];
  const cleaned = sanitizeInputText(rawLine).trim();

  // Strip leading list markers: "-", "*", bullet (•), "1.", "1)"
  let working = cleaned
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();

  let difficultyTag: DifficultyTag | undefined;

  // Extract optional trailing difficulty tag: (Easy), [Medium], - Hard, etc.
  const diffMatch = working.match(
    /(?:[\s\-_–—]+|[(\[])\s*(easy|medium|hard)\s*[)\]]?\s*$/i
  );
  if (diffMatch) {
    const rawTag = diffMatch[1].toLowerCase();
    difficultyTag =
      rawTag === "easy" ? "Easy" : rawTag === "medium" ? "Medium" : "Hard";
    // Strip trailing tag from working string
    working = working.slice(0, diffMatch.index).trim();
  }

  let leetcodeId: number | undefined;
  let slug: string | undefined;

  // Check for URL
  const urlMatch = working.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    const urlStr = urlMatch[0];
    try {
      const parsedUrl = new URL(urlStr);
      const host = parsedUrl.hostname.toLowerCase();
      const isLeetCode = host === "leetcode.com" || host.endsWith(".leetcode.com");

      if (!isLeetCode) {
        issues.push({
          line: lineNum,
          type: "error",
          message: `Non-LeetCode URL "${urlStr}" is not allowed. Only leetcode.com URLs are supported.`,
        });
      } else {
        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        const problemsIndex = pathParts.indexOf("problems");
        if (problemsIndex !== -1 && pathParts[problemsIndex + 1]) {
          slug = pathParts[problemsIndex + 1].toLowerCase();
        }
      }
    } catch {
      issues.push({
        line: lineNum,
        type: "error",
        message: `Invalid URL format: "${urlStr}".`,
      });
    }

    // Remove URL from working string
    working = working.replace(urlMatch[0], "").trim();
  }

  // Check for LeetCode number patterns if no slug was found yet or in addition
  // Only recognized as: "#49 Title", "LC 49", "LeetCode 49", or digits-only line
  if (/^\d+$/.test(working)) {
    leetcodeId = parseInt(working, 10);
    working = "";
  } else {
    const hashMatch = working.match(/^#(\d+)(?:\s+(.*))?$/);
    if (hashMatch) {
      leetcodeId = parseInt(hashMatch[1], 10);
      working = (hashMatch[2] || "").trim();
    } else {
      const lcMatch = working.match(/^(?:lc|leetcode)\s*#?(\d+)(?:\s*[:\-–—]?\s*(.*))?$/i);
      if (lcMatch) {
        leetcodeId = parseInt(lcMatch[1], 10);
        working = (lcMatch[2] || "").trim();
      }
    }
  }

  // Determine final title
  let title = working;
  if (!title && slug) {
    title = slugToTitle(slug);
  } else if (!title && leetcodeId !== undefined) {
    title = `Problem ${leetcodeId}`;
  }

  if (title.length > 200) {
    issues.push({
      line: lineNum,
      type: "error",
      message: `Question title exceeds maximum limit of 200 characters (${title.length} chars).`,
    });
  }

  return {
    entry: {
      raw: rawLine,
      title: title || rawLine.trim(),
      ...(leetcodeId !== undefined ? { leetcodeId } : {}),
      ...(slug ? { slug } : {}),
      ...(difficultyTag ? { difficultyTag } : {}),
    },
    issues,
  };
}

/**
 * Parses full multi-week roadmap text according to grammar specifications.
 */
export function parseRoadmapText(
  text: string,
  defaultTitle = "Custom Roadmap"
): { draft: RoadmapDraft; issues: Issue[] } {
  const issues: Issue[] = [];

  // Limit: 1 MB
  if (text.length > 1024 * 1024) {
    issues.push({
      type: "error",
      message: "Input text exceeds maximum size of 1 MB.",
    });
    return { draft: { title: defaultTitle, weeks: [] }, issues };
  }

  const normalizedText = sanitizeInputText(text).replace(/\r\n|\r/g, "\n");
  const rawLines = normalizedText.split("\n");

  // Limit: 2000 lines
  if (rawLines.length > 2000) {
    issues.push({
      type: "error",
      message: "Input text exceeds maximum limit of 2000 lines.",
    });
  }

  const weeksMap = new Map<number, WeekDraft>();
  const seenWeekNumbers: number[] = [];
  const seenDaysInWeek = new Map<number, Set<number>>();
  const seenProblems = new Set<string>();

  let currentWeekNumber: number | null = null;
  let currentDayNumber: number | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const lineNum = i + 1;
    const line = rawLines[i].trim();
    if (!line) continue;

    // Check for combined week/day header, e.g. "week1/day1" or "Week 1 / Day 1"
    const combinedMatch = line.match(
      /^(?:week|wk)\s*(\d+)\s*\/\s*day\s*(\d+)(?:\s*[:\-–—]\s*|\s+)?(.*)$/i
    );
    if (combinedMatch) {
      const wNum = parseInt(combinedMatch[1], 10);
      const dNum = parseInt(combinedMatch[2], 10);
      const titleRest = (combinedMatch[3] || "").trim();

      if (wNum < 1 || wNum > 26) {
        issues.push({
          line: lineNum,
          type: "error",
          message: `Week ${wNum} is outside the allowed range of 1 to 26.`,
        });
      }
      if (dNum < 1 || dNum > 7) {
        issues.push({
          line: lineNum,
          type: "error",
          message: `Day ${dNum} is outside the allowed range of 1 to 7.`,
        });
      }

      currentWeekNumber = wNum;
      currentDayNumber = dNum;

      if (!weeksMap.has(wNum)) {
        weeksMap.set(wNum, {
          weekNumber: wNum,
          title: titleRest || undefined,
          days: [],
        });
        seenWeekNumbers.push(wNum);
        seenDaysInWeek.set(wNum, new Set());
      }

      const weekDraft = weeksMap.get(wNum)!;
      let dayDraft = weekDraft.days.find((d) => d.dayNumber === dNum);
      const seenDays = seenDaysInWeek.get(wNum)!;

      if (seenDays.has(dNum)) {
        issues.push({
          line: lineNum,
          type: "warning",
          message: `The same (Week ${wNum}, Day ${dNum}) appeared more than once; merging questions.`,
        });
      } else {
        seenDays.add(dNum);
      }

      if (!dayDraft) {
        dayDraft = {
          dayNumber: dNum,
          title: titleRest || undefined,
          questions: [],
        };
        weekDraft.days.push(dayDraft);
      }
      continue;
    }

    // Check for Week header: "Week 1", "week1", "WEEK 1:", "Wk 1", "Week 1 - Arrays & Hashing"
    const weekMatch = line.match(/^(?:week|wk)\s*(\d+)(?:\s*[:\-–—]\s*|\s+)?(.*)$/i);
    if (weekMatch) {
      const wNum = parseInt(weekMatch[1], 10);
      const wTitle = (weekMatch[2] || "").trim();

      if (wNum < 1 || wNum > 26) {
        issues.push({
          line: lineNum,
          type: "error",
          message: `Week ${wNum} is outside the allowed range of 1 to 26.`,
        });
      }

      currentWeekNumber = wNum;
      currentDayNumber = null; // reset day until day header found

      if (!weeksMap.has(wNum)) {
        weeksMap.set(wNum, {
          weekNumber: wNum,
          title: wTitle || undefined,
          days: [],
        });
        seenWeekNumbers.push(wNum);
        seenDaysInWeek.set(wNum, new Set());
      } else if (wTitle) {
        // Update week title if previously empty
        const existing = weeksMap.get(wNum)!;
        if (!existing.title) existing.title = wTitle;
      }
      continue;
    }

    // Check for Day header: "Day 1", "day1", "Day 1: warm-up"
    const dayMatch = line.match(/^day\s*(\d+)(?:\s*[:\-–—]\s*|\s+)?(.*)$/i);
    if (dayMatch) {
      const dNum = parseInt(dayMatch[1], 10);
      const dTitle = (dayMatch[2] || "").trim();

      if (currentWeekNumber === null) {
        issues.push({
          line: lineNum,
          type: "error",
          message: `Day ${dNum} appears before any Week header.`,
        });
        continue;
      }

      if (dNum < 1 || dNum > 7) {
        issues.push({
          line: lineNum,
          type: "error",
          message: `Day ${dNum} is outside the allowed range of 1 to 7.`,
        });
      }

      currentDayNumber = dNum;
      const weekDraft = weeksMap.get(currentWeekNumber)!;
      let dayDraft = weekDraft.days.find((d) => d.dayNumber === dNum);
      const seenDays = seenDaysInWeek.get(currentWeekNumber)!;

      if (seenDays.has(dNum)) {
        issues.push({
          line: lineNum,
          type: "warning",
          message: `The same (Week ${currentWeekNumber}, Day ${dNum}) appeared more than once; merging questions.`,
        });
      } else {
        seenDays.add(dNum);
      }

      if (!dayDraft) {
        dayDraft = {
          dayNumber: dNum,
          title: dTitle || undefined,
          questions: [],
        };
        weekDraft.days.push(dayDraft);
      } else if (dTitle && !dayDraft.title) {
        dayDraft.title = dTitle;
      }
      continue;
    }

    // Line is a question line
    if (currentWeekNumber === null || currentDayNumber === null) {
      issues.push({
        line: lineNum,
        type: "error",
        message: `Question "${line}" appears before any Week or Day header.`,
      });
      continue;
    }

    // Check for warning: misspelled header (e.g. "wek 2", "daay 1")
    if (/^(?:wek|weeek|wke|wekk|daay|dy)\s*\d+/i.test(line) || /^(?:week|wk|day)\s*$/i.test(line)) {
      issues.push({
        line: lineNum,
        type: "warning",
        message: `Line "${line}" looks like a misspelled header; treated as question text.`,
      });
    }

    const { entry, issues: lineIssues } = parseQuestionLine(line, lineNum);
    issues.push(...lineIssues);

    // Duplicate problem in roadmap check (keep first, warn on subsequent)
    const normalizedKey = entry.slug
      ? `slug:${entry.slug}`
      : entry.leetcodeId !== undefined
      ? `lc:${entry.leetcodeId}`
      : `title:${normalizeTitle(entry.title)}`;

    if (seenProblems.has(normalizedKey)) {
      issues.push({
        line: lineNum,
        type: "warning",
        message: `Duplicate problem "${entry.title}" skipped (already scheduled earlier in roadmap).`,
      });
      continue;
    }
    seenProblems.add(normalizedKey);

    const weekDraft = weeksMap.get(currentWeekNumber)!;
    const dayDraft = weekDraft.days.find((d) => d.dayNumber === currentDayNumber)!;
    dayDraft.questions.push(entry);
  }

  // Post-parsing validations and warnings
  // 1. Skipped week numbers warning
  const sortedWeekNums = Array.from(weeksMap.keys()).sort((a, b) => a - b);
  for (let idx = 1; idx < sortedWeekNums.length; idx++) {
    const prev = sortedWeekNums[idx - 1];
    const curr = sortedWeekNums[idx];
    if (curr > prev + 1) {
      issues.push({
        type: "warning",
        message: `Skipped week numbers detected: Week ${curr} follows Week ${prev}.`,
      });
    }
  }

  // 2. Empty days / empty weeks warning
  const weeks: WeekDraft[] = [];
  for (const wNum of sortedWeekNums) {
    const week = weeksMap.get(wNum)!;
    week.days.sort((a, b) => a.dayNumber - b.dayNumber);

    const totalQuestionsInWeek = week.days.reduce(
      (acc, d) => acc + d.questions.length,
      0
    );

    if (totalQuestionsInWeek === 0) {
      issues.push({
        type: "warning",
        message: `Week ${wNum} has no questions.`,
      });
    } else if (week.days.length < 7 || week.days.some((d) => d.questions.length === 0)) {
      issues.push({
        type: "warning",
        message: `Week ${wNum} contains days with no questions.`,
      });
    }

    weeks.push(week);
  }

  return {
    draft: {
      title: defaultTitle,
      weeks,
    },
    issues,
  };
}

/**
 * Pure function serializing RoadmapDraft to text format.
 * Guaranteed to satisfy parse(serialize(draft)).draft round trip.
 */
export function serializeDraft(draft: RoadmapDraft): string {
  const chunks: string[] = [];

  for (const week of draft.weeks) {
    const weekHeader = week.title
      ? `Week ${week.weekNumber}: ${week.title}`
      : `Week ${week.weekNumber}`;
    chunks.push(weekHeader);

    for (const day of week.days) {
      const dayHeader = day.title
        ? `Day ${day.dayNumber}: ${day.title}`
        : `Day ${day.dayNumber}`;
      chunks.push(dayHeader);

      for (const q of day.questions) {
        chunks.push(q.raw || q.title);
      }
    }

    chunks.push(""); // blank line separating weeks
  }

  return chunks.join("\n").trim();
}
