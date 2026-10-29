// =============================================================================
// Next-Question Recommender with Explainability
// =============================================================================

import { prisma } from "@/lib/prisma";
import { CURATED_CATALOG_PROBLEMS } from "@/lib/catalog/catalog-data";

export interface NextQuestionResult {
  problem: {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topicTags: string[];
    summary: string;
    source: "CATALOG" | "USER_PROBLEM";
    isRevisit?: boolean;
  };
  reason: string;
  retrievedContext: {
    recommendationType:
      | "REVISIT"
      | "ROADMAP_PROGRESSION"
      | "WEAK_TOPIC"
      | "COLD_START";
    topicsCovered: string[];
    userSolvedCount: number;
    currentRoadmapWeek?: number;
  };
}

export async function getNextRecommendedQuestion(
  userId: string
): Promise<NextQuestionResult> {
  // 1. Fetch user's problems
  const userProblems = await prisma.problem.findMany({
    where: { userId },
    include: {
      topics: {
        include: { topic: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const solvedProblems = userProblems.filter((p) => p.status === "SOLVED");
  const revisitProblems = userProblems.filter((p) => p.status === "REVISIT");

  const solvedTitles = new Set(
    solvedProblems.map((p) => p.title.toLowerCase().trim())
  );

  // 2. Fetch user's active roadmap
  const activeRoadmap = await prisma.roadmap.findFirst({
    where: { userId },
    include: {
      items: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Priority 1: High-yield Revisit
  if (revisitProblems.length > 0) {
    const target = revisitProblems[0];
    const topicNames = target.topics.map((t) => t.topic.name);
    return {
      problem: {
        id: target.id,
        title: target.title,
        difficulty: target.difficulty,
        topicTags: topicNames,
        summary: target.description.slice(0, 200) + "...",
        source: "USER_PROBLEM",
        isRevisit: true,
      },
      reason: `You marked "${target.title}" for Revisit. Revisiting challenging problems after a short interval reinforces algorithmic intuition and cements optimal approaches.`,
      retrievedContext: {
        recommendationType: "REVISIT",
        topicsCovered: topicNames,
        userSolvedCount: solvedProblems.length,
      },
    };
  }

  // Priority 2: Active Roadmap Next Problem
  if (activeRoadmap) {
    const nextIncompleteItem = activeRoadmap.items.find((i) => !i.isCompleted);
    if (nextIncompleteItem) {
      const problemTitles = Array.isArray(nextIncompleteItem.problemIds)
        ? (nextIncompleteItem.problemIds as string[])
        : [];

      // Find first unsolved problem in this roadmap item
      const unsolvedTitle = problemTitles.find(
        (t) => !solvedTitles.has(t.toLowerCase().trim())
      );

      if (unsolvedTitle) {
        const catalogMatch = CURATED_CATALOG_PROBLEMS.find(
          (c) => c.title.toLowerCase() === unsolvedTitle.toLowerCase()
        );

        if (catalogMatch) {
          return {
            problem: {
              id: `catalog-${catalogMatch.title.replace(/\s+/g, "-").toLowerCase()}`,
              title: catalogMatch.title,
              difficulty: catalogMatch.difficulty,
              topicTags: catalogMatch.topicTags,
              summary: catalogMatch.summary,
              source: "CATALOG",
            },
            reason: `Matches Week ${nextIncompleteItem.weekNumber} of your roadmap ("${nextIncompleteItem.topicName}"). Working on "${catalogMatch.title}" develops your mastery of ${nextIncompleteItem.concept}.`,
            retrievedContext: {
              recommendationType: "ROADMAP_PROGRESSION",
              topicsCovered: catalogMatch.topicTags,
              userSolvedCount: solvedProblems.length,
              currentRoadmapWeek: nextIncompleteItem.weekNumber,
            },
          };
        }
      }
    }
  }

  // Priority 3: Weak Topics or Topic Expansion
  // Count solved problems per topic
  const topicCounts: Record<string, number> = {};
  for (const sp of solvedProblems) {
    for (const t of sp.topics) {
      topicCounts[t.topic.name] = (topicCounts[t.topic.name] || 0) + 1;
    }
  }

  const allTopics = [
    "Array",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Tree",
    "Graph",
    "Dynamic Programming",
  ];

  // Identify topics with lowest coverage
  allTopics.sort((a, b) => (topicCounts[a] || 0) - (topicCounts[b] || 0));

  for (const topic of allTopics) {
    const candidate = CURATED_CATALOG_PROBLEMS.find(
      (c) =>
        c.topicTags.some((t) => t.toLowerCase() === topic.toLowerCase()) &&
        !solvedTitles.has(c.title.toLowerCase())
    );

    if (candidate) {
      const currentCount = topicCounts[topic] || 0;
      return {
        problem: {
          id: `catalog-${candidate.title.replace(/\s+/g, "-").toLowerCase()}`,
          title: candidate.title,
          difficulty: candidate.difficulty,
          topicTags: candidate.topicTags,
          summary: candidate.summary,
          source: "CATALOG",
        },
        reason:
          currentCount === 0
            ? `You haven't solved any problems in ${topic} yet. "${candidate.title}" is a canonical starting problem for this pattern.`
            : `You have solved ${currentCount} problem(s) in ${topic}. Practicing "${candidate.title}" increases your pattern breadth and consistency.`,
        retrievedContext: {
          recommendationType: "WEAK_TOPIC",
          topicsCovered: candidate.topicTags,
          userSolvedCount: solvedProblems.length,
        },
      };
    }
  }

  // Priority 4: Cold Start (Default foundational problem)
  const fallback = CURATED_CATALOG_PROBLEMS[0];
  return {
    problem: {
      id: "catalog-contains-duplicate",
      title: fallback.title,
      difficulty: fallback.difficulty,
      topicTags: fallback.topicTags,
      summary: fallback.summary,
      source: "CATALOG",
    },
    reason: `A foundational problem to practice frequency counting and Hash Set state lookups in linear time.`,
    retrievedContext: {
      recommendationType: "COLD_START",
      topicsCovered: fallback.topicTags,
      userSolvedCount: 0,
    },
  };
}
