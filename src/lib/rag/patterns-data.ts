// =============================================================================
// Curated Knowledge Base: Canonical DSA Patterns
// =============================================================================

export interface RawPattern {
  topic: string;
  signals: string;
  description: string;
  approaches: Array<{
    title: string;
    description: string;
    timeComplexity: string;
    spaceComplexity: string;
  }>;
  hints: Array<{
    level: "nudge" | "moderate" | "strong";
    text: string;
  }>;
}

export const CURATED_DSA_PATTERNS: RawPattern[] = [
  {
    topic: "Two Pointers",
    signals:
      "sorted array, pair with target sum, reverse array, palindrome check, merge two sorted arrays, opposite ends inward",
    description:
      "Uses two pointer variables that traverse an array or list either towards each other from opposite ends or in the same direction at different speeds. Eliminates one degree of brute-force search by leveraging sorted order or symmetric properties.",
    approaches: [
      {
        title: "Two Pointers from Opposite Ends",
        description:
          "Initialize left pointer at 0 and right pointer at length - 1. In a while loop (left < right), evaluate the condition (e.g. sum = nums[left] + nums[right]). If sum == target, return indices. If sum < target, advance left. If sum > target, decrement right.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      {
        title: "Binary Search Alternative",
        description:
          "For each element at index i, binary search the remaining subarray for target - nums[i].",
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(1)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "Notice whether the input array is already sorted or if sorting it first would simplify finding pairs.",
      },
      {
        level: "moderate",
        text: "What happens if you place pointers at both ends? Can you decide which pointer to move based on the current comparison?",
      },
      {
        level: "strong",
        text: "If the sum is smaller than target, incrementing the left pointer guarantees an increase in sum. If too large, decrement the right pointer.",
      },
    ],
  },
  {
    topic: "Sliding Window",
    signals:
      "contiguous subarray, substring, fixed window size k, longest substring without repeating characters, minimum window containing target, maximum sum of size k",
    description:
      "Maintains a contiguous subset of elements between a left and right pointer. Expands the right pointer to include elements and contracts the left pointer when a condition is violated, avoiding redundant recalculations across sub-segments.",
    approaches: [
      {
        title: "Dynamic Sliding Window with Frequency Map",
        description:
          "Maintain a right pointer expanding the window while updating a hash map or counter. When the window becomes invalid (e.g., duplicate character or sum exceeds budget), increment the left pointer and decrement frequency until valid again. Track the optimal window length.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(min(n, alphabet_size))",
      },
      {
        title: "Fixed-Size Sliding Window",
        description:
          "Calculate the metric (e.g. sum) for the first k elements. Then slide the window from k to n - 1 by adding the incoming element nums[i] and subtracting the outgoing element nums[i - k].",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "The problem asks about a contiguous subarray or substring. Can you avoid recalculating overlapping regions from scratch?",
      },
      {
        level: "moderate",
        text: "Expand the right boundary to explore new elements, and contract the left boundary only when the window becomes invalid.",
      },
      {
        level: "strong",
        text: "Use a hash map or array to keep track of character counts inside the window [left, right]. Update max/min length when valid.",
      },
    ],
  },
  {
    topic: "Monotonic Stack",
    signals:
      "next greater element, previous greater element, next smaller element, daily temperatures, stock span, largest rectangle in histogram, trapping rain water",
    description:
      "A stack that maintains elements in strictly increasing or decreasing order. Whenever an incoming element violates the monotonic invariant, elements are popped and processed. Each element is pushed and popped at most once.",
    approaches: [
      {
        title: "Monotonic Decreasing Stack for Next Greater Element",
        description:
          "Iterate through the array. While the stack is not empty and nums[current] > nums[stack.top()], pop the top index and record nums[current] as its next greater element. Then push current index onto the stack.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "Are you repeatedly looking for the first element to the right or left that is greater or smaller?",
      },
      {
        level: "moderate",
        text: "Think about maintaining indices in a stack where the values are kept in sorted order. What happens when an incoming value breaks that order?",
      },
      {
        level: "strong",
        text: "Pop elements from the stack that are smaller than the current element; the current element is their next greater neighbor.",
      },
    ],
  },
  {
    topic: "Binary Search on Answer Space",
    signals:
      "minimum maximum, maximum minimum, capacity to ship packages, split array largest sum, koko eating bananas, monotonic feasibility check",
    description:
      "When the answer lies within a bounded numerical range [low, high] and a feasibility function f(x) is monotonic (true for all x >= answer, false otherwise), binary search can locate the exact optimal threshold in logarithmic steps.",
    approaches: [
      {
        title: "Binary Search with Feasibility Predicate",
        description:
          "Identify search range [low, high]. Define a helper function canAchieve(mid): returns boolean whether mid satisfies constraints. If canAchieve(mid) is true, try smaller in left half (high = mid); otherwise search right half (low = mid + 1).",
        timeComplexity: "O(n log(max_range))",
        spaceComplexity: "O(1)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "Instead of constructing the optimal solution directly, can you quickly verify if a proposed answer X is valid?",
      },
      {
        level: "moderate",
        text: "If a value X is feasible, is every value larger than X also feasible? That monotonicity means you can binary search the answer.",
      },
      {
        level: "strong",
        text: "Set low to the maximum single element and high to the sum of all elements. Test mid with a greedy feasibility checker.",
      },
    ],
  },
  {
    topic: "Dynamic Programming on Subsequences",
    signals:
      "0/1 knapsack, subset sum, partition equal subset sum, longest common subsequence, target sum, coin change, combinations with replacement",
    description:
      "Breaks decisions down item-by-item: at each item i with budget/capacity j, either include the item (dp[i-1][j - weight] + value) or exclude it (dp[i-1][j]). Can often be space-optimized to a 1D array.",
    approaches: [
      {
        title: "Bottom-Up 1D DP Array",
        description:
          "Initialize dp[0] = 0 (or base case) and iterate through each item. For each item, iterate backwards through capacities from target down to item.weight so values from the current step do not overwrite earlier states.",
        timeComplexity: "O(n * target)",
        spaceComplexity: "O(target)",
      },
      {
        title: "Top-Down Memoization",
        description:
          "Recursive helper(index, remaining_capacity) with a 2D memoization table storing subproblem results.",
        timeComplexity: "O(n * target)",
        spaceComplexity: "O(n * target)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "For each element, you have two choices: either include it in your subset or skip it.",
      },
      {
        level: "moderate",
        text: "Can the problem state be represented as dp(index, remainingTarget)? Does solving this have overlapping subproblems?",
      },
      {
        level: "strong",
        text: "dp[j] = dp[j] || dp[j - num]. Traverse backwards from target to num to optimize space to O(target).",
      },
    ],
  },
  {
    topic: "Prefix Sum & Hash Map",
    signals:
      "subarray sum equals k, contiguous subarray with sum divisible by k, equal number of 0s and 1s, count of subarrays satisfying property",
    description:
      "Computes running prefix sums sum[i]. Since any contiguous subarray sum from i to j equals sum[j] - sum[i - 1], looking for subarray sum == k translates to finding how many times (sum[j] - k) occurred in previously seen prefixes using a hash map.",
    approaches: [
      {
        title: "Prefix Sum with Running Frequency Map",
        description:
          "Maintain a running sum and a hash map { prefix_sum: count } initialized with { 0: 1 }. At each element, add to running_sum, check if running_sum - k exists in the map and add its frequency to total count, then increment map[running_sum].",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "Any subarray sum from index i to j can be expressed as prefixSum[j] - prefixSum[i-1].",
      },
      {
        level: "moderate",
        text: "If current prefix sum is S, you are looking for an earlier prefix sum that equals S - k.",
      },
      {
        level: "strong",
        text: "Store the count of seen prefix sums in a hash map. Don't forget to seed {0: 1} for subarrays that start at index 0.",
      },
    ],
  },
  {
    topic: "Graph BFS / Shortest Path",
    signals:
      "shortest path in unweighted graph, word ladder, minimum steps to reach target, flood fill, level order traversal, multi-source rotten oranges",
    description:
      "Explores all neighbor nodes at distance d before moving to distance d + 1 using a FIFO queue and a visited set. Guarantees finding the minimal step path in unweighted graphs or matrices.",
    approaches: [
      {
        title: "Queue-based BFS with Visited Set",
        description:
          "Enqueue initial node(s) with step count 0 and mark visited. While queue is not empty, pop the front, check if target is reached. Otherwise, iterate over all valid neighbors, mark visited, and push to queue with steps + 1.",
        timeComplexity: "O(V + E) or O(R * C)",
        spaceComplexity: "O(V) or O(R * C)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "The problem asks for the minimum operations, shortest path, or fewest steps between states.",
      },
      {
        level: "moderate",
        text: "Model each configuration as a node in a graph. Transitions between configurations are edges.",
      },
      {
        level: "strong",
        text: "Use Breadth-First Search with a queue and a visited set. Because edge weights are 1, the first time you reach the target is guaranteed optimal.",
      },
    ],
  },
  {
    topic: "Disjoint Set Union (Union-Find)",
    signals:
      "connected components, number of provinces, redundant connection, cycle in undirected graph, graph valid tree, Kruskal minimum spanning tree",
    description:
      "Maintains partitioned disjoint subsets of elements. Supports near O(1) amortized operations: find(x) to locate the canonical representative with path compression, and union(x, y) to merge sets by rank.",
    approaches: [
      {
        title: "Union-Find with Path Compression and Rank",
        description:
          "Initialize parent array where parent[i] = i and rank[i] = 0. find(x) recursively finds the root and flattens the tree. union(x, y) links the root of the smaller tree under the larger tree.",
        timeComplexity: "O(alpha(n)) approx O(1) per operation",
        spaceComplexity: "O(n)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "Does the problem involve dynamic connectivity, grouping items into clusters, or checking if two items belong to the same component?",
      },
      {
        level: "moderate",
        text: "When an edge connects two nodes that are already in the same connected component, a cycle is created.",
      },
      {
        level: "strong",
        text: "Implement a DSU class with find(x) using path compression and union(x, y) using rank. If find(u) == find(v), u and v are connected.",
      },
    ],
  },
  {
    topic: "Backtracking",
    signals:
      "generate all permutations, all subsets, combination sum, n-queens, sudoku solver, word search on grid, path finding with state reset",
    description:
      "Explores all possible candidate states incrementally. If a partial candidate cannot lead to a valid solution, it 'backtracks' by undoing the choice and trying the next branch in the recursion tree.",
    approaches: [
      {
        title: "Recursive Backtracking with Pruning",
        description:
          "Define backtrack(start_index, current_path, remaining_target). At each level: if base condition met, add copy of current_path to result. Loop through candidate choices: push choice, recurse, then pop choice (undo step).",
        timeComplexity: "O(2^n) or O(n!) depending on branching factor",
        spaceComplexity: "O(n) recursion call stack",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "The problem asks for ALL valid combinations or permutations rather than just a count or optimum.",
      },
      {
        level: "moderate",
        text: "Construct decisions step-by-step. Remember to undo your choice after returning from the recursive call.",
      },
      {
        level: "strong",
        text: "Sort candidates first to prune duplicates easily (if candidates[i] == candidates[i-1] and i > start, continue).",
      },
    ],
  },
  {
    topic: "Trie (Prefix Tree)",
    signals:
      "prefix matching, autocomplete, search words with wildcard, replace words with shortest root, maximum XOR of two numbers",
    description:
      "A tree data structure used for locating specific keys within a string set. Every node represents a character; shared prefixes share common ancestor paths from the root, allowing O(L) prefix queries where L is word length.",
    approaches: [
      {
        title: "Trie Node with Children Array / Map",
        description:
          "Create TrieNode containing children map/array and isEndOfWord boolean. Insert words character by character. To search prefix, traverse down matching children; if path breaks, prefix does not exist.",
        timeComplexity: "O(L) per insert / search, where L is string length",
        spaceComplexity: "O(total_characters * alphabet_size)",
      },
    ],
    hints: [
      {
        level: "nudge",
        text: "Are you performing repeated prefix queries, word dictionary lookups, or matching word prefixes?",
      },
      {
        level: "moderate",
        text: "A hash set allows O(L) exact matches but cannot quickly tell you if ANY word starts with a given prefix.",
      },
      {
        level: "strong",
        text: "Store words in a Trie. Each node holds children pointers and a boolean flag indicating word termination.",
      },
    ],
  },
];
