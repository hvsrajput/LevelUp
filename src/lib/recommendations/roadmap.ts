// =============================================================================
// Roadmap Generator: Pedagogical Syllabus Builder & Progress Tracker
// =============================================================================

import { prisma } from "@/lib/prisma";
import { CURATED_CATALOG_PROBLEMS } from "@/lib/catalog/catalog-data";

export interface GenerateRoadmapOptions {
  userId: string;
  goal: string;
  level: "beginner" | "intermediate" | "advanced";
  timeline: "4 weeks" | "8 weeks" | "12 weeks";
}

export interface SyllabusItemDef {
  weekNumber: number;
  topicName: string;
  concept: string;
  problemTitles: string[];
}

/**
 * Curriculum definitions based on goal, level, and timeline
 */
export function buildSyllabus(
  goal: string,
  level: "beginner" | "intermediate" | "advanced",
  timeline: "4 weeks" | "8 weeks" | "12 weeks"
): SyllabusItemDef[] {
  const isBeginner = level === "beginner";
  const isAdvanced = level === "advanced";
  const numWeeks = parseInt(timeline, 10) || 8;

  // 1. Dynamic Programming Focused
  if (goal.toLowerCase().includes("dynamic programming") || goal.toLowerCase() === "dp") {
    const syllabus: SyllabusItemDef[] = [
      {
        weekNumber: 1,
        topicName: "1D DP & Linear Transitions",
        concept: "Memoization, recurrence relations, and base cases (Fibonacci patterns)",
        problemTitles: isBeginner
          ? ["Climbing Stairs", "Min Cost Climbing Stairs"]
          : ["Climbing Stairs", "Min Cost Climbing Stairs", "House Robber"],
      },
      {
        weekNumber: 2,
        topicName: "Subsequences & Decision Trees",
        concept: "Include/exclude decisions and state tracking across iterations",
        problemTitles: isAdvanced
          ? ["House Robber", "House Robber II", "Coin Change", "Maximum Product Subarray"]
          : ["House Robber", "House Robber II", "Coin Change"],
      },
      {
        weekNumber: 3,
        topicName: "Subsequence Lengths & Patience Sorting",
        concept: "Binary search with DP, tracking longest increasing sequences",
        problemTitles: ["Longest Increasing Subsequence", "Unique Paths"],
      },
      {
        weekNumber: 4,
        topicName: "2D DP & String Matching",
        concept: "Grid states, coordinate compression, and longest common subsequence",
        problemTitles: ["Unique Paths", "Longest Common Subsequence"],
      },
    ];

    return syllabus.slice(0, numWeeks);
  }

  // 2. Trees & Graphs Focused
  if (goal.toLowerCase().includes("tree") || goal.toLowerCase().includes("graph")) {
    const syllabus: SyllabusItemDef[] = [
      {
        weekNumber: 1,
        topicName: "Binary Tree Depth & Properties",
        concept: "Recursive DFS, post-order bottom-up aggregation",
        problemTitles: isBeginner
          ? ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Same Tree"]
          : ["Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Balanced Binary Tree"],
      },
      {
        weekNumber: 2,
        topicName: "BST & Level-Order BFS",
        concept: "Binary Search Tree properties and queue-based BFS traversal",
        problemTitles: isAdvanced
          ? ["Lowest Common Ancestor of a Binary Search Tree", "Binary Tree Level Order Traversal", "Validate Binary Search Tree", "Kth Smallest Element in a BST"]
          : ["Lowest Common Ancestor of a Binary Search Tree", "Binary Tree Level Order Traversal", "Validate Binary Search Tree"],
      },
      {
        weekNumber: 3,
        topicName: "Grid DFS & Connected Components",
        concept: "Matrix traversal, visited sets, and boundary conditions",
        problemTitles: ["Number of Islands", "Clone Graph", "Pacific Atlantic Water Flow"],
      },
      {
        weekNumber: 4,
        topicName: "Topological Sort & Cycles",
        concept: "Directed acyclic graphs (DAG), in-degrees, and Kahn's algorithm",
        problemTitles: ["Course Schedule", "Number of Connected Components in an Undirected Graph"],
      },
    ];

    return syllabus.slice(0, numWeeks);
  }

  // 3. Full DSA Roadmap (Default)
  const fullSyllabus: SyllabusItemDef[] = [
    {
      weekNumber: 1,
      topicName: "Arrays, Hashing & Two Pointers",
      concept: "Hash maps for constant time lookup, converging two pointers on sorted data",
      problemTitles: isBeginner
        ? ["Contains Duplicate", "Valid Anagram", "Two Sum", "Valid Palindrome"]
        : isAdvanced
        ? ["Group Anagrams", "Top K Frequent Elements", "3Sum", "Trapping Rain Water"]
        : ["Contains Duplicate", "Two Sum", "Two Sum II - Input Array Is Sorted", "3Sum"],
    },
    {
      weekNumber: 2,
      topicName: "Sliding Window & Stacks",
      concept: "Dynamic window boundaries, monotonic stacks for next greater elements",
      problemTitles: isBeginner
        ? ["Best Time to Buy and Sell Stock", "Valid Parentheses"]
        : isAdvanced
        ? ["Longest Repeating Character Replacement", "Minimum Window Substring", "Largest Rectangle in Histogram"]
        : ["Best Time to Buy and Sell Stock", "Longest Substring Without Repeating Characters", "Valid Parentheses", "Daily Temperatures"],
    },
    {
      weekNumber: 3,
      topicName: "Binary Search & Linked Lists",
      concept: "Logarithmic search on answers, in-place pointer reversal and fast/slow runners",
      problemTitles: isBeginner
        ? ["Binary Search", "Reverse Linked List", "Merge Two Sorted Lists"]
        : isAdvanced
        ? ["Koko Eating Bananas", "Search in Rotated Sorted Array", "Reorder List", "LRU Cache"]
        : ["Binary Search", "Search a 2D Matrix", "Reverse Linked List", "Remove Nth Node From End of List"],
    },
    {
      weekNumber: 4,
      topicName: "Binary Trees & BSTs",
      concept: "Subtree traversals, BST invariant validation, and level-order queues",
      problemTitles: isBeginner
        ? ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Same Tree"]
        : ["Diameter of Binary Tree", "Lowest Common Ancestor of a Binary Search Tree", "Binary Tree Level Order Traversal", "Validate Binary Search Tree"],
    },
    {
      weekNumber: 5,
      topicName: "Heaps & Backtracking",
      concept: "Min/Max heaps for top-K elements, state restoration in decision trees",
      problemTitles: isBeginner
        ? ["Last Stone Weight", "Subsets"]
        : isAdvanced
        ? ["Find Median from Data Stream", "Combination Sum", "Word Search"]
        : ["K Closest Points to Origin", "Kth Largest Element in an Array", "Subsets", "Combination Sum"],
    },
    {
      weekNumber: 6,
      topicName: "Graph Traversals & DFS/BFS",
      concept: "Grid graphs, multi-source traversals, and deep cloning with visited caches",
      problemTitles: ["Number of Islands", "Clone Graph", "Pacific Atlantic Water Flow"],
    },
    {
      weekNumber: 7,
      topicName: "1D Dynamic Programming",
      concept: "Tabulation vs memoization, optimal substructure, and bounded decisions",
      problemTitles: isBeginner
        ? ["Climbing Stairs", "Min Cost Climbing Stairs", "House Robber"]
        : ["House Robber", "House Robber II", "Coin Change", "Longest Increasing Subsequence"],
    },
    {
      weekNumber: 8,
      topicName: "2D Dynamic Programming & Intervals",
      concept: "Grid coordinate DP, interval merging and greedy scheduling",
      problemTitles: isBeginner
        ? ["Unique Paths", "Merge Intervals"]
        : ["Unique Paths", "Longest Common Subsequence", "Insert Interval", "Merge Intervals", "Non-overlapping Intervals"],
    },
  ];

  if (numWeeks <= 4) {
    // Compress to 4 weeks
    return [
      fullSyllabus[0],
      fullSyllabus[1],
      fullSyllabus[3],
      fullSyllabus[6],
    ].map((item, index) => ({ ...item, weekNumber: index + 1 }));
  }

  if (numWeeks >= 12) {
    // Expand to 12 weeks with revision and advanced topics
    const extended = [...fullSyllabus];
    extended.push(
      {
        weekNumber: 9,
        topicName: "Advanced Graphs & Topological Sort",
        concept: "Directed graph cycles and course dependency ordering",
        problemTitles: ["Course Schedule", "Number of Connected Components in an Undirected Graph"],
      },
      {
        weekNumber: 10,
        topicName: "Advanced Heaps & Monotonic Stacks",
        concept: "Two-heap median streaming and histogram boundaries",
        problemTitles: ["Find Median from Data Stream", "Largest Rectangle in Histogram"],
      },
      {
        weekNumber: 11,
        topicName: "Complex String & Window Matching",
        concept: "Character frequency maps with variable window constraints",
        problemTitles: ["Longest Repeating Character Replacement", "Minimum Window Substring"],
      },
      {
        weekNumber: 12,
        topicName: "Comprehensive Revision & Mock Interviews",
        concept: "Mixed topic problem-solving under interview time constraints",
        problemTitles: ["Trapping Rain Water", "LRU Cache", "Word Search", "Coin Change"],
      }
    );
    return extended;
  }

  return fullSyllabus;
}

/**
 * Generate and persist a personalized roadmap for a user
 */
export async function generateAndPersistRoadmap(
  options: GenerateRoadmapOptions
) {
  const { userId, goal, level, timeline } = options;
  const syllabus = buildSyllabus(goal, level, timeline);

  // Map problem titles to catalog items to get catalog problem IDs
  const titleToCatalog = new Map<string, string>();
  for (const cat of CURATED_CATALOG_PROBLEMS) {
    titleToCatalog.set(cat.title.toLowerCase(), cat.title);
  }

  // Delete previous active roadmap for user if regenerating
  await prisma.roadmap.deleteMany({
    where: { userId },
  });

  // Create new Roadmap with nested items
  const created = await prisma.roadmap.create({
    data: {
      userId,
      title: `${goal} Master Plan (${timeline})`,
      goal,
      level,
      timeline,
      items: {
        create: syllabus.map((item, idx) => ({
          weekNumber: item.weekNumber,
          topicName: item.topicName,
          concept: item.concept,
          problemIds: item.problemTitles,
          order: idx + 1,
          isCompleted: false,
        })),
      },
    },
    include: {
      items: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
      },
    },
  });

  return created;
}

/**
 * Get active roadmap with computed progress percentage
 */
export async function getUserRoadmapWithProgress(userId: string) {
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId },
    include: {
      items: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!roadmap) return null;

  const totalItems = roadmap.items.length;
  const completedItems = roadmap.items.filter((i) => i.isCompleted).length;
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by weekNumber
  const weeksMap = new Map<number, typeof roadmap.items>();
  for (const item of roadmap.items) {
    const list = weeksMap.get(item.weekNumber) || [];
    list.push(item);
    weeksMap.set(item.weekNumber, list);
  }

  const weeks = Array.from(weeksMap.entries()).map(([weekNumber, items]) => ({
    weekNumber,
    items,
    isWeekCompleted: items.every((i) => i.isCompleted),
  }));

  return {
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      goal: roadmap.goal,
      level: roadmap.level,
      timeline: roadmap.timeline,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
    },
    progress: {
      totalItems,
      completedItems,
      percentage: progressPercentage,
    },
    weeks,
  };
}
