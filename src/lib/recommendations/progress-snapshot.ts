// =============================================================================
// Progress Snapshot Service: Topic Progression, Prerequisite DAG & Caching
// =============================================================================

import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { KNOWN_KB_TOPICS, repairOrValidateTopic } from "./roadmap";

export const topicNameSchema = z.enum(KNOWN_KB_TOPICS);

export interface TopicItem {
  name: string;
  sourceLabel: "From roadmap" | "From your problems";
  reason: string;
}

export interface ProgressSnapshotData {
  solvedCount: number;
  totalCount: number;
  percentage: number;
  currentTopic: TopicItem | null;
  nextTopic: TopicItem | null;
  isEmpty: boolean;
}

/**
 * Canonical syllabus prerequisite DAG for DSA topics.
 * Each topic lists the prerequisite topics that should ideally be covered first.
 */
export const TOPIC_PREREQUISITES: Record<string, string[]> = {
  "Arrays & Hashing": [],
  "Two Pointers": ["Arrays & Hashing"],
  "Sliding Window": ["Arrays & Hashing", "Two Pointers"],
  "Stack": ["Arrays & Hashing"],
  "Monotonic Stack": ["Stack"],
  "Binary Search": ["Arrays & Hashing", "Two Pointers"],
  "Linked List": ["Arrays & Hashing"],
  "Trees": ["Linked List", "Stack"],
  "Tries": ["Trees"],
  "Heap / Priority Queue": ["Trees", "Arrays & Hashing"],
  "Backtracking": ["Trees", "Stack"],
  "Graphs": ["Trees"],
  "Advanced Graphs": ["Graphs", "Heap / Priority Queue"],
  "1-D Dynamic Programming": ["Backtracking", "Arrays & Hashing"],
  "2-D Dynamic Programming": ["1-D Dynamic Programming"],
  "Dynamic Programming": ["Backtracking", "Arrays & Hashing"],
  "Greedy": ["Arrays & Hashing"],
  "Intervals": ["Arrays & Hashing", "Two Pointers"],
  "Bit Manipulation": ["Math"],
  "Math": [],
};

// In-memory cache keyed by userId: { hash, snapshot }
const userSnapshotCache = new Map<
  string,
  { hash: string; snapshot: ProgressSnapshotData }
>();

export function clearSnapshotCache(): void {
  userSnapshotCache.clear();
}

/**
 * Computes the compact progress snapshot for a user.
 * Cached with an input hash: recomputed only when topic coverage or active roadmap changes.
 */
export async function getProgressSnapshot(
  userId: string
): Promise<ProgressSnapshotData> {
  // 1. Single groupBy query for problem status counts (Total = all added/imported problems)
  const statusGroups = prisma.problem?.groupBy
    ? await prisma.problem.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      })
    : [];

  let solvedCount = 0;
  let totalCount = 0;

  for (const group of statusGroups) {
    const count = group._count._all;
    totalCount += count;
    if (group.status === "SOLVED") {
      solvedCount += count;
    }
  }

  const percentage =
    totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // 2. Fetch user's active roadmap (if any)
  const activeRoadmap = prisma.roadmap?.findFirst
    ? await prisma.roadmap.findFirst({
        where: { userId, isActive: true },
        include: {
          items: {
            orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : null;

  // 3. Fetch user's problems with topic associations for coverage analysis
  const userProblems = prisma.problem?.findMany
    ? await prisma.problem.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          topics: {
            select: {
              topic: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  // 4. Compute input hash to check cache
  // Hash inputs: active roadmap id + items completed state, topic coverage summary, counts
  let activeRoadmapWeekKey = "no-roadmap";
  let firstIncompleteWeekNum: number | null = null;
  interface MinimalRoadmapItem {
    id: string;
    weekNumber: number;
    topicName: string;
    isCompleted: boolean;
  }
  const roadmapWeeksMap = new Map<number, MinimalRoadmapItem[]>();

  if (activeRoadmap && activeRoadmap.items.length > 0) {
    for (const item of activeRoadmap.items) {
      if (!roadmapWeeksMap.has(item.weekNumber)) {
        roadmapWeeksMap.set(item.weekNumber, []);
      }
      roadmapWeeksMap.get(item.weekNumber)!.push({
        id: item.id,
        weekNumber: item.weekNumber,
        topicName: item.topicName,
        isCompleted: item.isCompleted,
      });
    }

    const sortedWeeks = Array.from(roadmapWeeksMap.keys()).sort((a, b) => a - b);
    for (const wNum of sortedWeeks) {
      const items = roadmapWeeksMap.get(wNum)!;
      const isWeekComplete =
        items.length > 0 && items.every((i) => i.isCompleted);
      if (!isWeekComplete && firstIncompleteWeekNum === null) {
        firstIncompleteWeekNum = wNum;
        break;
      }
    }

    activeRoadmapWeekKey = `${activeRoadmap.id}:week${firstIncompleteWeekNum ?? "all-complete"}`;
  }

  // Topic coverage map: topicName -> { total, solved, unsolved, lastActivity }
  interface TopicCoverage {
    total: number;
    solved: number;
    unsolved: number;
    lastActivity: number;
  }
  const coverageMap = new Map<string, TopicCoverage>();

  for (const p of userProblems) {
    const pDate = new Date(p.updatedAt).getTime();
    for (const pt of p.topics) {
      const rawName = pt.topic.name;
      const canonical = repairOrValidateTopic(rawName) || rawName;
      const existing = coverageMap.get(canonical) || {
        total: 0,
        solved: 0,
        unsolved: 0,
        lastActivity: 0,
      };

      existing.total += 1;
      if (p.status === "SOLVED") {
        existing.solved += 1;
      } else {
        existing.unsolved += 1;
      }
      if (pDate > existing.lastActivity) {
        existing.lastActivity = pDate;
      }
      coverageMap.set(canonical, existing);
    }
  }

  const sortedCoverageKey = Array.from(coverageMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.solved}/${v.total}:${v.lastActivity}`)
    .join("|");

  const inputKey = `${userId}|${totalCount}:${solvedCount}|${activeRoadmapWeekKey}|${sortedCoverageKey}`;
  const inputHash = crypto.createHash("sha256").update(inputKey).digest("hex");

  // Check cache
  const cached = userSnapshotCache.get(userId);
  if (cached && cached.hash === inputHash) {
    return cached.snapshot;
  }

  // 5. Evaluate Topic Logic
  let currentTopic: TopicItem | null = null;
  let nextTopic: TopicItem | null = null;
  let isEmpty = false;

  // Case A: Active Roadmap Exists
  if (activeRoadmap && activeRoadmap.items.length > 0) {
    const sortedWeekNumbers = Array.from(roadmapWeeksMap.keys()).sort((a, b) => a - b);
    const lastWeekNum = sortedWeekNumbers[sortedWeekNumbers.length - 1];

    if (firstIncompleteWeekNum !== null) {
      const currentWeekItems = roadmapWeeksMap.get(firstIncompleteWeekNum)!;
      const focusTopic = currentWeekItems[0]?.topicName || `Week ${firstIncompleteWeekNum}`;

      currentTopic = {
        name: focusTopic,
        sourceLabel: "From roadmap",
        reason: `Focus topic for Week ${firstIncompleteWeekNum} of your active roadmap.`,
      };

      if (firstIncompleteWeekNum === lastWeekNum) {
        // On the last week
        nextTopic = {
          name: "Roadmap complete",
          sourceLabel: "From roadmap",
          reason: "You are on the final week of your roadmap. Complete remaining days to finish!",
        };
      } else {
        // Following week's focus
        const nextWeekNum = firstIncompleteWeekNum + 1;
        const nextWeekItems = roadmapWeeksMap.get(nextWeekNum);
        const nextFocus = nextWeekItems?.[0]?.topicName || `Week ${nextWeekNum}`;

        nextTopic = {
          name: nextFocus,
          sourceLabel: "From roadmap",
          reason: `Scheduled for Week ${nextWeekNum} once you finish Week ${firstIncompleteWeekNum}.`,
        };
      }
    } else {
      // All weeks in roadmap are complete
      const finalWeekItems = roadmapWeeksMap.get(lastWeekNum)!;
      currentTopic = {
        name: finalWeekItems[0]?.topicName || "Curriculum Completed",
        sourceLabel: "From roadmap",
        reason: "All scheduled roadmap weeks have been completed!",
      };
      nextTopic = {
        name: "Roadmap complete",
        sourceLabel: "From roadmap",
        reason: "You have finished all weeks in your active roadmap.",
      };
    }
  } else if (totalCount > 0) {
    // Case B: No roadmap, but problems exist
    // Current = topic with unsolved problems and the most recent activity
    const topicsWithUnsolved = Array.from(coverageMap.entries())
      .filter(([, v]) => v.unsolved > 0)
      .sort(([, a], [, b]) => b.lastActivity - a.lastActivity);

    if (topicsWithUnsolved.length > 0) {
      const [topName, topData] = topicsWithUnsolved[0];
      currentTopic = {
        name: topName,
        sourceLabel: "From your problems",
        reason: `${topData.unsolved} unsolved problem${topData.unsolved > 1 ? "s" : ""}, most recently practiced.`,
      };
    } else {
      // All problems solved: pick topic with most recent activity
      const allPracticed = Array.from(coverageMap.entries()).sort(
        ([, a], [, b]) => b.lastActivity - a.lastActivity
      );
      if (allPracticed.length > 0) {
        const [recentName, recentData] = allPracticed[0];
        currentTopic = {
          name: recentName,
          sourceLabel: "From your problems",
          reason: `All ${recentData.total} problems solved in this topic. Review or move to next topic.`,
        };
      }
    }

    // Next = first uncovered topic whose prerequisites are covered
    // Covered topics = topics user has practiced
    const coveredTopicNames = new Set(Array.from(coverageMap.keys()));

    // Find first topic in KNOWN_KB_TOPICS that is not in coveredTopicNames and whose prereqs are met
    let pickedNextTopic: string | null = null;
    let pickedPrereqs: string[] = [];

    for (const candidate of KNOWN_KB_TOPICS) {
      if (!coveredTopicNames.has(candidate)) {
        const prereqs = TOPIC_PREREQUISITES[candidate] || [];
        const prereqsMet = prereqs.every((p) => coveredTopicNames.has(p));
        if (prereqsMet) {
          pickedNextTopic = candidate;
          pickedPrereqs = prereqs;
          break;
        }
      }
    }

    // Fallback if all topics were covered or none met prerequisites
    if (!pickedNextTopic) {
      for (const candidate of KNOWN_KB_TOPICS) {
        if (!coveredTopicNames.has(candidate)) {
          pickedNextTopic = candidate;
          break;
        }
      }
    }

    if (pickedNextTopic) {
      // Validate with Zod
      const parseResult = topicNameSchema.safeParse(pickedNextTopic);
      const validatedTopic = parseResult.success ? parseResult.data : KNOWN_KB_TOPICS[0];

      nextTopic = {
        name: validatedTopic,
        sourceLabel: "From your problems",
        reason:
          pickedPrereqs.length > 0
            ? `Prerequisites covered (${pickedPrereqs.join(", ")}). Next recommended topic in curriculum.`
            : "Foundational curriculum topic with prerequisites covered.",
      };
    }
  } else {
    // Case C: No roadmap and no problems
    isEmpty = true;
  }

  const snapshot: ProgressSnapshotData = {
    solvedCount,
    totalCount,
    percentage,
    currentTopic,
    nextTopic,
    isEmpty,
  };

  // Cache result
  userSnapshotCache.set(userId, {
    hash: inputHash,
    snapshot,
  });

  return snapshot;
}
