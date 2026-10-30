// =============================================================================
// Roadmap Generator: Pedagogical Syllabus Builder, Daily Scheduler & Progress Tracker
// =============================================================================

import { prisma } from "@/lib/prisma";
import {
  CURATED_CATALOG_PROBLEMS,
  getLeetCodeProblemUrl,
} from "@/lib/catalog/catalog-data";
import {
  getTodayInTimezone,
  addDays,
  sanitizeTimezone,
  DEFAULT_TIMEZONE,
} from "@/lib/date";
import { computeStreak, type StreakResult } from "@/lib/streak";

export interface GenerateRoadmapOptions {
  userId: string;
  goal: string;
  level: "beginner" | "intermediate" | "advanced";
  timeline: "4 weeks" | "8 weeks" | "12 weeks";
}

export interface SyllabusItemDef {
  weekNumber: number;
  dayNumber: number;
  topicName: string;
  concept: string;
  problemTitles: string[];
}

export interface RoadmapProblemStatus {
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  isSolved: boolean;
  url: string;
  userProblemId?: string;
}

export interface RoadmapItemDetail {
  id: string;
  weekNumber: number;
  dayNumber: number;
  scheduledDate: string | null;
  topicName: string;
  concept: string;
  problemIds: string[];
  isCompleted: boolean;
  isOverdue: boolean;
  order: number;
  problems: RoadmapProblemStatus[];
}

export interface RoadmapWeekDetail {
  weekNumber: number;
  levelTitle: string;
  difficultyLabel: "Foundations" | "Intermediate" | "Advanced" | "Mastery";
  items: RoadmapItemDetail[];
  totalDays: number;
  completedDays: number;
  percentage: number;
  isWeekCompleted: boolean;
  isUnlocked: boolean;
}

export interface UserRoadmapData {
  roadmap: {
    id: string;
    title: string;
    goal: string;
    level: string;
    timeline: string;
    createdAt: Date;
    updatedAt: Date;
  };
  progress: {
    totalDays: number;
    completedDays: number;
    percentage: number;
  };
  currentWeekNumber: number;
  todayItems: RoadmapItemDetail[];
  overdueItems: RoadmapItemDetail[];
  weeks: RoadmapWeekDetail[];
  streaks: {
    overall: StreakResult;
    roadmap: StreakResult;
  };
}

// -----------------------------------------------------------------------------
// Catalog Title Lookup Helper
// -----------------------------------------------------------------------------
const catalogMap = new Map<string, { difficulty: "EASY" | "MEDIUM" | "HARD"; url: string }>();
for (const p of CURATED_CATALOG_PROBLEMS) {
  catalogMap.set(p.title.toLowerCase().trim(), {
    difficulty: p.difficulty,
    url: p.url || getLeetCodeProblemUrl(p.title),
  });
}

function getProblemInfo(title: string) {
  const hit = catalogMap.get(title.toLowerCase().trim());
  return {
    difficulty: hit?.difficulty || "MEDIUM",
    url: hit?.url || getLeetCodeProblemUrl(title),
  };
}

/**
 * Builds a 7-day-per-week syllabus with increasing difficulty across weeks.
 */
export function buildSyllabus(
  _goal: string,
  _level: "beginner" | "intermediate" | "advanced",
  timeline: "4 weeks" | "8 weeks" | "12 weeks"
): SyllabusItemDef[] {
  const numWeeks = parseInt(timeline, 10) || 8;

  // Weekly blueprints with daily items (7 days per week)
  const allWeeks: Array<{
    weekNumber: number;
    days: Array<{
      dayNumber: number;
      topicName: string;
      concept: string;
      problemTitles: string[];
    }>;
  }> = [
    // Week 1: Foundations (Easy)
    {
      weekNumber: 1,
      days: [
        {
          dayNumber: 1,
          topicName: "Array Traversal & Lookups",
          concept: "Direct indexing, frequency checks, and in-place iterations",
          problemTitles: ["Contains Duplicate"],
        },
        {
          dayNumber: 2,
          topicName: "Hash Map Complements",
          concept: "Storing seen elements for O(1) difference lookups",
          problemTitles: ["Two Sum"],
        },
        {
          dayNumber: 3,
          topicName: "String Anagrams & Counts",
          concept: "Character frequency hashing and array bucket counting",
          problemTitles: ["Valid Anagram"],
        },
        {
          dayNumber: 4,
          topicName: "Converging Two Pointers",
          concept: "Pointers moving inward from both ends to test palindromes",
          problemTitles: ["Valid Palindrome"],
        },
        {
          dayNumber: 5,
          topicName: "Two Pointers on Sorted Arrays",
          concept: "Leveraging monotonic sorted order to shrink search bounds",
          problemTitles: ["Two Sum II - Input Array Is Sorted"],
        },
        {
          dayNumber: 6,
          topicName: "Stack Matching Basics",
          concept: "LIFO matching of opening and closing delimiters",
          problemTitles: ["Valid Parentheses"],
        },
        {
          dayNumber: 7,
          topicName: "Week 1 Checkpoint: Linear Scan",
          concept: "Single-pass greediness tracking min price and max profit",
          problemTitles: ["Best Time to Buy and Sell Stock"],
        },
      ],
    },

    // Week 2: Sliding Window & Linked List Basics (Easy-Medium)
    {
      weekNumber: 2,
      days: [
        {
          dayNumber: 1,
          topicName: "Dynamic Sliding Window",
          concept: "Expanding and contracting window boundaries with set lookups",
          problemTitles: ["Longest Substring Without Repeating Characters"],
        },
        {
          dayNumber: 3,
          topicName: "Pointer Reversal in Linked Lists",
          concept: "Three-pointer in-place link reversal (prev, curr, next)",
          problemTitles: ["Reverse Linked List"],
        },
        {
          dayNumber: 2,
          topicName: "Character Replacement Window",
          concept: "Tracking majority character frequency inside variable windows",
          problemTitles: ["Longest Repeating Character Replacement"],
        },
        {
          dayNumber: 4,
          topicName: "Merging Sorted Linked Lists",
          concept: "Dummy head nodes and splicing pointer references",
          problemTitles: ["Merge Two Sorted Lists"],
        },
        {
          dayNumber: 5,
          topicName: "Fast & Slow Pointers (Floyd's Cycle)",
          concept: "Cycle detection and node gap measurement",
          problemTitles: ["Linked List Cycle"],
        },
        {
          dayNumber: 6,
          topicName: "Nth Node Removal",
          concept: "Maintaining a fixed gap between leader and follower pointers",
          problemTitles: ["Remove Nth Node From End of List"],
        },
        {
          dayNumber: 7,
          topicName: "Week 2 Checkpoint: Three Sum",
          concept: "Sorting plus converging two pointers with deduplication",
          problemTitles: ["3Sum"],
        },
      ],
    },

    // Week 3: Binary Search & Monotonic Stacks (Medium)
    {
      weekNumber: 3,
      days: [
        {
          dayNumber: 1,
          topicName: "Binary Search Foundations",
          concept: "Clean mid-point calculation avoiding overflow, half elimination",
          problemTitles: ["Binary Search"],
        },
        {
          dayNumber: 2,
          topicName: "Binary Search on 2D Matrix",
          concept: "Flattening matrix coordinates `row = mid / cols`, `col = mid % cols`",
          problemTitles: ["Search a 2D Matrix"],
        },
        {
          dayNumber: 3,
          topicName: "Binary Search on Answer Space",
          concept: "Minimizing maximum search intervals (eating speed)",
          problemTitles: ["Koko Eating Bananas"],
        },
        {
          dayNumber: 4,
          topicName: "Search in Rotated Sorted Array",
          concept: "Determining which half of the array is normally ordered",
          problemTitles: ["Search in Rotated Sorted Array"],
        },
        {
          dayNumber: 5,
          topicName: "Monotonic Decreasing Stack",
          concept: "Finding the next warmer temperature / next greater element",
          problemTitles: ["Daily Temperatures"],
        },
        {
          dayNumber: 6,
          topicName: "Reverse Polish Notation",
          concept: "Evaluating postfix expressions via stack operands",
          problemTitles: ["Evaluate Reverse Polish Notation"],
        },
        {
          dayNumber: 7,
          topicName: "Week 3 Checkpoint: List Reordering",
          concept: "Splitting, reversing the second half, and alternating interleaving",
          problemTitles: ["Reorder List"],
        },
      ],
    },

    // Week 4: Binary Trees & Tree Traversals (Medium)
    {
      weekNumber: 4,
      days: [
        {
          dayNumber: 1,
          topicName: "Tree Inversion & Symmetry",
          concept: "Recursive post-order subtree swapping",
          problemTitles: ["Invert Binary Tree"],
        },
        {
          dayNumber: 2,
          topicName: "Maximum Depth & Tree Height",
          concept: "Bottom-up DFS calculating height of left and right subtrees",
          problemTitles: ["Maximum Depth of Binary Tree"],
        },
        {
          dayNumber: 3,
          topicName: "Tree Equivalence & Subtrees",
          concept: "Simultaneous dual-tree recursive structural comparison",
          problemTitles: ["Same Tree"],
        },
        {
          dayNumber: 4,
          topicName: "Subtree of Another Tree",
          concept: "Tree traversal combined with recursive equality check",
          problemTitles: ["Subtree of Another Tree"],
        },
        {
          dayNumber: 5,
          topicName: "Tree Diameter & Longest Paths",
          concept: "Updating global diameter while returning subtree heights",
          problemTitles: ["Diameter of Binary Tree"],
        },
        {
          dayNumber: 6,
          topicName: "Lowest Common Ancestor in BST",
          concept: "Navigating left or right based on BST value invariants",
          problemTitles: ["Lowest Common Ancestor of a Binary Search Tree"],
        },
        {
          dayNumber: 7,
          topicName: "Week 4 Checkpoint: Level Order BFS",
          concept: "Queue-based breadth-first level chunking",
          problemTitles: ["Binary Tree Level Order Traversal"],
        },
      ],
    },

    // Week 5: BST Invariants & Backtracking (Medium)
    {
      weekNumber: 5,
      days: [
        {
          dayNumber: 1,
          topicName: "BST Invariant Validation",
          concept: "Passing valid range bounds (low, high) down recursive calls",
          problemTitles: ["Validate Binary Search Tree"],
        },
        {
          dayNumber: 2,
          topicName: "Kth Smallest Element in BST",
          concept: "In-order traversal yields non-decreasing sorted sequence",
          problemTitles: ["Kth Smallest Element in a BST"],
        },
        {
          dayNumber: 3,
          topicName: "Tree Construction from Traversals",
          concept: "Partitioning in-order arrays using pre-order root elements",
          problemTitles: ["Construct Binary Tree from Preorder and Inorder Traversal"],
        },
        {
          dayNumber: 4,
          topicName: "Power Set (Subsets)",
          concept: "Decision tree branching: include or exclude current element",
          problemTitles: ["Subsets"],
        },
        {
          dayNumber: 5,
          topicName: "Target Sum Combinations",
          concept: "Backtracking with reuse and pruned branch exploration",
          problemTitles: ["Combination Sum"],
        },
        {
          dayNumber: 6,
          topicName: "Subsets with Duplicates",
          concept: "Sorting and skipping sibling identical choices in recursion",
          problemTitles: ["Subsets II"],
        },
        {
          dayNumber: 7,
          topicName: "Week 5 Checkpoint: Grid Word Search",
          concept: "2D matrix backtracking with temporary in-place character masking",
          problemTitles: ["Word Search"],
        },
      ],
    },

    // Week 6: Graphs & Connected Components (Medium)
    {
      weekNumber: 6,
      days: [
        {
          dayNumber: 1,
          topicName: "Matrix Flood Fill & Islands",
          concept: "4-directional recursive DFS with visited in-place modification",
          problemTitles: ["Number of Islands"],
        },
        {
          dayNumber: 2,
          topicName: "Deep Graph Cloning",
          concept: "Graph DFS accompanied by a hash map mapping old nodes to clones",
          problemTitles: ["Clone Graph"],
        },
        {
          dayNumber: 3,
          topicName: "Max Island Area",
          concept: "Aggregating cell counts across continuous connected components",
          problemTitles: ["Max Area of Island"],
        },
        {
          dayNumber: 4,
          topicName: "Rotting Oranges Multi-Source BFS",
          concept: "Queue initialization with all simultaneous infection sources",
          problemTitles: ["Rotting Oranges"],
        },
        {
          dayNumber: 5,
          topicName: "Surrounded Regions & Borders",
          concept: "Reverse traversal from matrix boundaries to protect safe regions",
          problemTitles: ["Surrounded Regions"],
        },
        {
          dayNumber: 6,
          topicName: "Pacific Atlantic Water Flow",
          concept: "Dual multi-source reachability grids intersecting at peaks",
          problemTitles: ["Pacific Atlantic Water Flow"],
        },
        {
          dayNumber: 7,
          topicName: "Week 6 Checkpoint: Cycle Detection (DAG)",
          concept: "Topological sort / Kahn's algorithm or 3-color cycle DFS",
          problemTitles: ["Course Schedule"],
        },
      ],
    },

    // Week 7: Dynamic Programming 1D (Medium)
    {
      weekNumber: 7,
      days: [
        {
          dayNumber: 1,
          topicName: "Linear Recurrences & Fibonacci",
          concept: "Memoization and 2-variable state rotation",
          problemTitles: ["Climbing Stairs"],
        },
        {
          dayNumber: 2,
          topicName: "Min Cost Path Decisions",
          concept: "Tracking optimal substructure `dp[i] = cost[i] + min(dp[i+1], dp[i+2])`",
          problemTitles: ["Min Cost Climbing Stairs"],
        },
        {
          dayNumber: 3,
          topicName: "Linear House Robbery",
          concept: "Non-adjacent choice tracking: rob current or take previous best",
          problemTitles: ["House Robber"],
        },
        {
          dayNumber: 4,
          topicName: "Circular Array DP",
          concept: "Decomposing circular constraints into two linear problems (first vs last)",
          problemTitles: ["House Robber II"],
        },
        {
          dayNumber: 5,
          topicName: "Coin Change (Fewest Coins)",
          concept: "Unbounded knapsack: minimizing combinations to reach amount",
          problemTitles: ["Coin Change"],
        },
        {
          dayNumber: 6,
          topicName: "Maximum Product Subarray",
          concept: "Maintaining both running minimum and running maximum due to negative signs",
          problemTitles: ["Maximum Product Subarray"],
        },
        {
          dayNumber: 7,
          topicName: "Week 7 Checkpoint: Longest Increasing Subsequence",
          concept: "Subproblem optimal lengths with patience sorting / binary search",
          problemTitles: ["Longest Increasing Subsequence"],
        },
      ],
    },

    // Week 8: 2D Dynamic Programming & Intervals (Medium to Hard)
    {
      weekNumber: 8,
      days: [
        {
          dayNumber: 1,
          topicName: "Grid Path Enumeration",
          concept: "2D coordinate transitions: `dp[r][c] = dp[r-1][c] + dp[r][c-1]`",
          problemTitles: ["Unique Paths"],
        },
        {
          dayNumber: 2,
          topicName: "Longest Common Subsequence",
          concept: "Character match diagonal step vs mismatched maximum step",
          problemTitles: ["Longest Common Subsequence"],
        },
        {
          dayNumber: 3,
          topicName: "Stock Trading with Cooldown",
          concept: "Finite state machine with Buy, Sell, and Rest states",
          problemTitles: ["Best Time to Buy and Sell Stock with Cooldown"],
        },
        {
          dayNumber: 4,
          topicName: "Interval Overlap Insertion",
          concept: "Merging new interval with overlapping existing sorted intervals",
          problemTitles: ["Insert Interval"],
        },
        {
          dayNumber: 5,
          topicName: "Interval Merging",
          concept: "Sorting by start time and extending running interval boundaries",
          problemTitles: ["Merge Intervals"],
        },
        {
          dayNumber: 6,
          topicName: "Non-Overlapping Greedy Scheduling",
          concept: "Selecting intervals with earliest end times to maximize capacity",
          problemTitles: ["Non-overlapping Intervals"],
        },
        {
          dayNumber: 7,
          topicName: "Week 8 Checkpoint: Complex String Decomposition",
          concept: "Prefix checking with dictionary word sets",
          problemTitles: ["Word Break"],
        },
      ],
    },

    // Week 9: Advanced Graphs & Min Spanning Trees (Hard)
    {
      weekNumber: 9,
      days: [
        {
          dayNumber: 1,
          topicName: "Topological Sort Order",
          concept: "Kahn's in-degree queue building full valid course sequences",
          problemTitles: ["Course Schedule II"],
        },
        {
          dayNumber: 2,
          topicName: "Connected Components in Undirected Graph",
          concept: "Union-Find with path compression and rank optimization",
          problemTitles: ["Number of Connected Components in an Undirected Graph"],
        },
        {
          dayNumber: 3,
          topicName: "Graph Valid Tree",
          concept: "Verifying exact N-1 edges without any cycles",
          problemTitles: ["Graph Valid Tree"],
        },
        {
          dayNumber: 4,
          topicName: "Trie (Prefix Tree) Foundations",
          concept: "26-ary tree node structure with word end markers",
          problemTitles: ["Implement Trie (Prefix Tree)"],
        },
        {
          dayNumber: 5,
          topicName: "Wildcard Search in Word Dictionary",
          concept: "Trie traversal combined with backtracking over '.' dots",
          problemTitles: ["Design Add and Search Words Data Structure"],
        },
        {
          dayNumber: 6,
          topicName: "K Closest Points to Origin",
          concept: "Max-heap of size K or QuickSelect partitioning",
          problemTitles: ["K Closest Points to Origin"],
        },
        {
          dayNumber: 7,
          topicName: "Week 9 Checkpoint: Kth Largest Element",
          concept: "Min-heap maintenance keeping top K largest seen values",
          problemTitles: ["Kth Largest Element in an Array"],
        },
      ],
    },

    // Week 10: Advanced Heaps & Two Heaps (Hard)
    {
      weekNumber: 10,
      days: [
        {
          dayNumber: 1,
          topicName: "Last Stone Weight",
          concept: "Max-heap continually popping top two heaviest stones",
          problemTitles: ["Last Stone Weight"],
        },
        {
          dayNumber: 2,
          topicName: "LRU Cache Architecture",
          concept: "Hash map combined with doubly linked list for O(1) evictions",
          problemTitles: ["LRU Cache"],
        },
        {
          dayNumber: 3,
          topicName: "Two-Heap Median Streaming",
          concept: "Balancing max-heap (lower half) and min-heap (upper half)",
          problemTitles: ["Find Median from Data Stream"],
        },
        {
          dayNumber: 4,
          topicName: "Palindromic Substrings Counting",
          concept: "Expanding around center for both odd and even radii",
          problemTitles: ["Palindromic Substrings"],
        },
        {
          dayNumber: 5,
          topicName: "Longest Palindromic Substring",
          concept: "Center expansion keeping track of max start and end indices",
          problemTitles: ["Longest Palindromic Substring"],
        },
        {
          dayNumber: 6,
          topicName: "Decode Ways",
          concept: "1D DP with valid single-digit (1-9) and double-digit (10-26) transitions",
          problemTitles: ["Decode Ways"],
        },
        {
          dayNumber: 7,
          topicName: "Week 10 Checkpoint: Largest Histogram Rectangle",
          concept: "Monotonic increasing stack tracking left and right boundaries",
          problemTitles: ["Largest Rectangle in Histogram"],
        },
      ],
    },

    // Week 11: Complex Window & Matrix Traversal (Hard)
    {
      weekNumber: 11,
      days: [
        {
          dayNumber: 1,
          topicName: "Minimum Window Substring",
          concept: "Two-pointer sliding window with count map matching target string",
          problemTitles: ["Minimum Window Substring"],
        },
        {
          dayNumber: 2,
          topicName: "Sliding Window Maximum",
          concept: "Monotonic decreasing deque holding indices in current window",
          problemTitles: ["Sliding Window Maximum"],
        },
        {
          dayNumber: 3,
          topicName: "Group Anagrams",
          concept: "Categorizing strings using sorted tuple keys or frequency buckets",
          problemTitles: ["Group Anagrams"],
        },
        {
          dayNumber: 4,
          topicName: "Top K Frequent Elements",
          concept: "Bucket sort by frequency count or min-heap of size K",
          problemTitles: ["Top K Frequent Elements"],
        },
        {
          dayNumber: 5,
          topicName: "Product of Array Except Self",
          concept: "Prefix products left pass and suffix products right pass",
          problemTitles: ["Product of Array Except Self"],
        },
        {
          dayNumber: 6,
          topicName: "Longest Consecutive Sequence",
          concept: "HashSet lookups identifying sequence starts where `!set.has(x-1)`",
          problemTitles: ["Longest Consecutive Sequence"],
        },
        {
          dayNumber: 7,
          topicName: "Week 11 Checkpoint: Trapping Rain Water",
          concept: "Two pointers with running leftMax and rightMax bounds",
          problemTitles: ["Trapping Rain Water"],
        },
      ],
    },

    // Week 12: Capstone & Interview Synthesis (Comprehensive Mastery)
    {
      weekNumber: 12,
      days: [
        {
          dayNumber: 1,
          topicName: "Partition Equal Subset Sum",
          concept: "0/1 Knapsack variation finding subset with sum equal to total/2",
          problemTitles: ["Partition Equal Subset Sum"],
        },
        {
          dayNumber: 2,
          topicName: "Coin Change II (Combinations)",
          concept: "Unbounded knapsack counting distinct combinations to make change",
          problemTitles: ["Coin Change II"],
        },
        {
          dayNumber: 3,
          topicName: "Meeting Rooms Schedule Check",
          concept: "Sorting intervals and verifying pairwise non-overlap",
          problemTitles: ["Meeting Rooms"],
        },
        {
          dayNumber: 4,
          topicName: "Meeting Rooms II (Min Rooms)",
          concept: "Min-heap for active meeting end times or two pointer event sweeps",
          problemTitles: ["Meeting Rooms II"],
        },
        {
          dayNumber: 5,
          topicName: "Merge K Sorted Lists",
          concept: "Min-heap of K node pointers or divide-and-conquer pairwise merge",
          problemTitles: ["Merge k Sorted Lists"],
        },
        {
          dayNumber: 6,
          topicName: "Tree Maximum Path Sum",
          concept: "Post-order DFS updating global sum while returning max single branch",
          problemTitles: ["Binary Tree Maximum Path Sum"],
        },
        {
          dayNumber: 7,
          topicName: "Grand Finale: Word Search II (Trie + DFS)",
          concept: "Matrix backtracking guided by Trie prefix pruning",
          problemTitles: ["Word Search II"],
        },
      ],
    },
  ];

  // Tailor based on selected timeline
  const selectedWeeks = allWeeks.slice(0, numWeeks);

  const flatSyllabus: SyllabusItemDef[] = [];
  for (const w of selectedWeeks) {
    for (const d of w.days) {
      flatSyllabus.push({
        weekNumber: w.weekNumber,
        dayNumber: d.dayNumber,
        topicName: d.topicName,
        concept: d.concept,
        problemTitles: d.problemTitles,
      });
    }
  }

  return flatSyllabus;
}

/**
 * Generate and persist a personalized roadmap for a user.
 * Assigns scheduled calendar dates to each day starting today in user's timezone.
 */
export async function generateAndPersistRoadmap(options: GenerateRoadmapOptions) {
  const { userId, goal, level, timeline } = options;

  // 1. Fetch user timezone to compute starting schedule dates
  const user = prisma.user?.findUnique
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      })
    : null;
  const userTimezone = sanitizeTimezone(user?.timezone || DEFAULT_TIMEZONE);
  const startDate = getTodayInTimezone(userTimezone);

  const syllabus = buildSyllabus(goal, level, timeline);

  // 2. Delete previous active roadmap
  await prisma.roadmap.deleteMany({
    where: { userId },
  });

  // 3. Create new roadmap with scheduled items for each day
  const created = await prisma.roadmap.create({
    data: {
      userId,
      title: `${goal} Master Plan (${timeline})`,
      goal,
      level,
      timeline,
      items: {
        create: syllabus.map((item) => {
          const dayOffset = (item.weekNumber - 1) * 7 + (item.dayNumber - 1);
          const scheduledDate = addDays(startDate, dayOffset);

          return {
            weekNumber: item.weekNumber,
            dayNumber: item.dayNumber,
            scheduledDate,
            topicName: item.topicName,
            concept: item.concept,
            problemIds: item.problemTitles,
            order: item.dayNumber,
            isCompleted: false,
          };
        }),
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
 * Get active roadmap with computed day completion, streaks, overdue handling,
 * and level progression.
 */
export async function getUserRoadmapWithProgress(userId: string): Promise<UserRoadmapData | null> {
  const user = prisma.user?.findUnique
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      })
    : null;
  const timezone = sanitizeTimezone(user?.timezone || DEFAULT_TIMEZONE);
  const today = getTodayInTimezone(timezone);

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

  // 1. Fetch user's solved problems to evaluate day completion via the single code path
  const rawSolved = prisma.problem?.findMany
    ? await prisma.problem.findMany({
        where: {
          userId,
          status: "SOLVED",
        },
        select: {
          id: true,
          title: true,
          solvedDay: true,
          difficulty: true,
        },
      })
    : [];
  const solvedProblems = Array.isArray(rawSolved) ? rawSolved : [];

  const solvedMap = new Map<string, string>(); // lowercase title -> problem ID
  const distinctUserSolveDays: string[] = [];
  for (const p of solvedProblems) {
    solvedMap.set(p.title.toLowerCase().trim(), p.id);
    if (p.solvedDay) {
      distinctUserSolveDays.push(p.solvedDay);
    }
  }

  // 2. Process roadmap items
  const completedRoadmapDays: string[] = [];
  const itemsToUpdateCompleted: string[] = [];
  const itemsToUpdateIncomplete: string[] = [];

  const processedItems: RoadmapItemDetail[] = roadmap.items.map((item) => {
    const problemTitles = Array.isArray(item.problemIds)
      ? (item.problemIds as string[])
      : [];

    const problems: RoadmapProblemStatus[] = problemTitles.map((title) => {
      const lower = title.toLowerCase().trim();
      const isSolved = solvedMap.has(lower);
      const info = getProblemInfo(title);

      return {
        title,
        difficulty: info.difficulty,
        isSolved,
        url: info.url,
        userProblemId: solvedMap.get(lower),
      };
    });

    const isDayCompleted =
      problems.length > 0 && problems.every((p) => p.isSolved);

    if (isDayCompleted !== item.isCompleted) {
      if (isDayCompleted) {
        itemsToUpdateCompleted.push(item.id);
      } else {
        itemsToUpdateIncomplete.push(item.id);
      }
    }

    if (isDayCompleted && item.scheduledDate) {
      completedRoadmapDays.push(item.scheduledDate);
    }

    const isOverdue = Boolean(
      item.scheduledDate &&
      item.scheduledDate < today &&
      !isDayCompleted
    );

    return {
      id: item.id,
      weekNumber: item.weekNumber,
      dayNumber: item.dayNumber,
      scheduledDate: item.scheduledDate,
      topicName: item.topicName,
      concept: item.concept,
      problemIds: problemTitles,
      isCompleted: isDayCompleted,
      isOverdue,
      order: item.order,
      problems,
    };
  });

  // Sync isCompleted flags asynchronously if any mismatch is detected
  if (itemsToUpdateCompleted.length > 0 && prisma.roadmapItem?.updateMany) {
    await prisma.roadmapItem.updateMany({
      where: { id: { in: itemsToUpdateCompleted } },
      data: { isCompleted: true },
    }).catch(() => {});
  }
  if (itemsToUpdateIncomplete.length > 0 && prisma.roadmapItem?.updateMany) {
    await prisma.roadmapItem.updateMany({
      where: { id: { in: itemsToUpdateIncomplete } },
      data: { isCompleted: false },
    }).catch(() => {});
  }

  // 3. Compute streaks
  const overallStreak = computeStreak(distinctUserSolveDays, today);
  const roadmapStreak = computeStreak(completedRoadmapDays, today);

  // 4. Group by week
  const weekMap = new Map<number, RoadmapItemDetail[]>();
  for (const item of processedItems) {
    const list = weekMap.get(item.weekNumber) || [];
    list.push(item);
    weekMap.set(item.weekNumber, list);
  }

  const sortedWeeks = Array.from(weekMap.entries()).sort(
    ([a], [b]) => a - b
  );

  let currentWeekNumber = 1;
  let foundIncompleteWeek = false;

  const weeks: RoadmapWeekDetail[] = sortedWeeks.map(([weekNumber, weekItems], index) => {
    const totalDays = weekItems.length;
    const completedDays = weekItems.filter((i) => i.isCompleted).length;
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const isWeekCompleted = totalDays > 0 && completedDays === totalDays;

    if (!isWeekCompleted && !foundIncompleteWeek) {
      currentWeekNumber = weekNumber;
      foundIncompleteWeek = true;
    }

    let difficultyLabel: "Foundations" | "Intermediate" | "Advanced" | "Mastery" = "Foundations";
    if (weekNumber >= 9) difficultyLabel = "Mastery";
    else if (weekNumber >= 6) difficultyLabel = "Advanced";
    else if (weekNumber >= 3) difficultyLabel = "Intermediate";

    // Unlocked: Week 1 is always unlocked. Later weeks are unlocked if prior week complete,
    // but users can still freely work ahead on any week.
    const isUnlocked = index === 0 || sortedWeeks[index - 1][1].every((i) => i.isCompleted);

    return {
      weekNumber,
      levelTitle: `Level ${weekNumber}: ${weekItems[0]?.topicName || "Topic Overview"}`,
      difficultyLabel,
      items: weekItems,
      totalDays,
      completedDays,
      percentage,
      isWeekCompleted,
      isUnlocked,
    };
  });

  // Filter today's questions and overdue catch-up questions
  const todayItems = processedItems.filter((i) => i.scheduledDate === today);
  const overdueItems = processedItems.filter((i) => i.isOverdue);

  const totalDays = processedItems.length;
  const completedDays = processedItems.filter((i) => i.isCompleted).length;
  const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

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
      totalDays,
      completedDays,
      percentage: progressPercentage,
    },
    currentWeekNumber,
    todayItems,
    overdueItems,
    weeks,
    streaks: {
      overall: overallStreak,
      roadmap: roadmapStreak,
    },
  };
}

/**
 * Reschedule remaining / overdue unfinished items over upcoming days,
 * preserving their original difficulty order.
 */
export async function rescheduleRemainingRoadmapItems(
  userId: string,
  roadmapId: string
) {
  const user = prisma.user?.findUnique
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      })
    : null;
  const timezone = sanitizeTimezone(user?.timezone || DEFAULT_TIMEZONE);
  const today = getTodayInTimezone(timezone);

  // 1. Verify roadmap ownership
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: {
      items: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
      },
    },
  });

  if (!roadmap || roadmap.userId !== userId) {
    throw new Error("Roadmap not found or access denied");
  }

  // 2. Identify unfinished items that need rescheduling:
  // Items that are overdue (scheduledDate < today and not completed)
  // or all unfinished items starting from today.
  const unfinishedItems = roadmap.items.filter((i) => !i.isCompleted);
  if (unfinishedItems.length === 0) {
    return getUserRoadmapWithProgress(userId);
  }

  // 3. Redistribute sequentially starting from today
  // Batch update inside a transaction
  await prisma.$transaction(
    unfinishedItems.map((item, idx) => {
      const newScheduledDate = addDays(today, idx);
      return prisma.roadmapItem.update({
        where: { id: item.id },
        data: { scheduledDate: newScheduledDate },
      });
    })
  );

  return getUserRoadmapWithProgress(userId);
}
