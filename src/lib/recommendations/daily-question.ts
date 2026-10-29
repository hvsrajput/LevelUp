// =============================================================================
// Daily Question Service with Spaced Repetition & Difficulty Progression
// =============================================================================

import { prisma } from "@/lib/prisma";
import { CURATED_CATALOG_PROBLEMS } from "@/lib/catalog/catalog-data";

export interface DailyQuestionResult {
  dailyQuestionId: string;
  date: string;
  problem: {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topicTags: string[];
    summary: string;
    source: "CATALOG" | "USER_PROBLEM";
  };
  reason: string;
  isSpacedRepetition: boolean;
}

/**
 * Normalizes a date to UTC midnight for unique daily indexing
 */
export function getUtcMidnight(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getOrCreateDailyQuestion(
  userId: string
): Promise<DailyQuestionResult> {
  const today = getUtcMidnight();
  const dateStr = today.toISOString().split("T")[0];

  // 1. Check if today's daily question already exists for user
  const existingDaily = await prisma.dailyQuestion.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existingDaily) {
    // If it points to a catalog problem
    if (existingDaily.catalogProblemId) {
      const cat =
        CURATED_CATALOG_PROBLEMS.find(
          (c) => c.title.toLowerCase() === existingDaily.catalogProblemId?.toLowerCase()
        ) || CURATED_CATALOG_PROBLEMS[0];

      return {
        dailyQuestionId: existingDaily.id,
        date: dateStr,
        problem: {
          id: existingDaily.catalogProblemId,
          title: cat.title,
          difficulty: cat.difficulty,
          topicTags: cat.topicTags,
          summary: cat.summary,
          source: "CATALOG",
        },
        reason: existingDaily.reason,
        isSpacedRepetition: existingDaily.reason.includes("Spaced repetition"),
      };
    }

    // If it points to a user problem
    if (existingDaily.problemId) {
      const userProb = await prisma.problem.findUnique({
        where: { id: existingDaily.problemId },
        include: { topics: { include: { topic: true } } },
      });

      if (userProb) {
        return {
          dailyQuestionId: existingDaily.id,
          date: dateStr,
          problem: {
            id: userProb.id,
            title: userProb.title,
            difficulty: userProb.difficulty,
            topicTags: userProb.topics.map((t) => t.topic.name),
            summary: userProb.description.slice(0, 200) + "...",
            source: "USER_PROBLEM",
          },
          reason: existingDaily.reason,
          isSpacedRepetition: existingDaily.reason.includes("Spaced repetition"),
        };
      }
    }
  }

  // 2. Fetch past daily questions in the last 30 days to avoid repeats
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const pastDailies = await prisma.dailyQuestion.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    select: { catalogProblemId: true, problemId: true },
  });

  const recentAssignedTitles = new Set<string>();
  for (const pd of pastDailies) {
    if (pd.catalogProblemId) recentAssignedTitles.add(pd.catalogProblemId.toLowerCase());
  }

  // 3. Fetch user's solved problems
  const solvedProblems = await prisma.problem.findMany({
    where: { userId, status: "SOLVED" },
    include: { topics: { include: { topic: true } } },
    orderBy: { solvedAt: "desc" },
  });

  const solvedTitles = new Set(
    solvedProblems.map((p) => p.title.toLowerCase().trim())
  );

  // 4. Check for Spaced Repetition candidate:
  // Problems solved between 5 and 25 days ago
  const nowMs = today.getTime();
  const spacedCandidate = solvedProblems.find((p) => {
    if (!p.solvedAt) return false;
    const diffDays = Math.round(
      (nowMs - new Date(p.solvedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    // 7-day or 14-day or 21-day window
    return (
      (diffDays >= 6 && diffDays <= 8) ||
      (diffDays >= 13 && diffDays <= 15) ||
      (diffDays >= 20 && diffDays <= 22)
    );
  });

  if (spacedCandidate) {
    const daysSince = Math.round(
      (nowMs - new Date(spacedCandidate.solvedAt!).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const reason = `Spaced repetition challenge: You solved "${spacedCandidate.title}" ${daysSince} days ago. Revisiting at this spaced interval promotes long-term retention and prevents pattern fading.`;

    const saved = await prisma.dailyQuestion.create({
      data: {
        userId,
        date: today,
        reason,
        problemId: spacedCandidate.id,
      },
    });

    return {
      dailyQuestionId: saved.id,
      date: dateStr,
      problem: {
        id: spacedCandidate.id,
        title: spacedCandidate.title,
        difficulty: spacedCandidate.difficulty,
        topicTags: spacedCandidate.topics.map((t) => t.topic.name),
        summary: spacedCandidate.description.slice(0, 200) + "...",
        source: "USER_PROBLEM",
      },
      reason,
      isSpacedRepetition: true,
    };
  }

  // 5. Studied Topics & Difficulty Progression
  const studiedTopicNames = new Set<string>();
  for (const sp of solvedProblems) {
    for (const t of sp.topics) {
      studiedTopicNames.add(t.topic.name);
    }
  }

  // Compute average difficulty (EASY=1, MEDIUM=2, HARD=3)
  let targetDifficulty: "EASY" | "MEDIUM" | "HARD" = "EASY";
  if (solvedProblems.length > 0) {
    const diffScores = solvedProblems.map((p) =>
      p.difficulty === "HARD" ? 3 : p.difficulty === "MEDIUM" ? 2 : 1
    );
    const avgScore =
      diffScores.reduce((a, b) => a + b, 0) / diffScores.length;

    // Slightly higher difficulty than recent average
    if (avgScore < 1.6) {
      targetDifficulty = "MEDIUM";
    } else if (avgScore < 2.5) {
      targetDifficulty = "MEDIUM";
    } else {
      targetDifficulty = "HARD";
    }
  }

  // Find candidate problem from studied topics or core catalog
  let candidate = CURATED_CATALOG_PROBLEMS.find(
    (c) =>
      c.difficulty === targetDifficulty &&
      !solvedTitles.has(c.title.toLowerCase()) &&
      !recentAssignedTitles.has(c.title.toLowerCase()) &&
      (studiedTopicNames.size === 0 ||
        c.topicTags.some((t) => studiedTopicNames.has(t)))
  );

  // Fallback to any unsolved problem
  if (!candidate) {
    candidate = CURATED_CATALOG_PROBLEMS.find(
      (c) =>
        !solvedTitles.has(c.title.toLowerCase()) &&
        !recentAssignedTitles.has(c.title.toLowerCase())
    );
  }

  // Final fallback
  if (!candidate) {
    candidate = CURATED_CATALOG_PROBLEMS[0];
  }

  const studiedTopicsList = Array.from(studiedTopicNames);
  const reason =
    studiedTopicsList.length > 0
      ? `Calibrated for today: Based on topics you've studied (${studiedTopicsList.slice(0, 3).join(", ")}), this ${candidate.difficulty} challenge tests your depth at a progressive difficulty level.`
      : `Daily Kickstart: Build your problem-solving consistency with "${candidate.title}", an essential ${candidate.difficulty} challenge covering ${candidate.topicTags.join(", ")}.`;

  const saved = await prisma.dailyQuestion.create({
    data: {
      userId,
      date: today,
      reason,
      catalogProblemId: candidate.title,
    },
  });

  return {
    dailyQuestionId: saved.id,
    date: dateStr,
    problem: {
      id: `catalog-${candidate.title.replace(/\s+/g, "-").toLowerCase()}`,
      title: candidate.title,
      difficulty: candidate.difficulty,
      topicTags: candidate.topicTags,
      summary: candidate.summary,
      source: "CATALOG",
    },
    reason,
    isSpacedRepetition: false,
  };
}
