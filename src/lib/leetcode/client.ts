// =============================================================================
// LeetCode Client: GraphQL Production Client & Deterministic Mock Client
// =============================================================================

import {
  ILeetCodeClient,
  LeetCodeProblem,
  LeetCodeSubmission,
  LeetCodeUserVerification,
} from "./types";
import { CURATED_CATALOG_PROBLEMS } from "@/lib/catalog/catalog-data";

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

// Helper to strip HTML tags for clean text problem statements
function stripHtml(html: string): string {
  return html
    .replace(/<pre>[\s\S]*?<\/pre>/gi, (match) => match.replace(/<[^>]+>/g, ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Production client connecting to LeetCode's public GraphQL API
 */
export class GraphQLLeetCodeClient implements ILeetCodeClient {
  private async graphqlQuery(
    query: string,
    variables: Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Record<string, any> | null> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429) {
      throw new Error("Rate limit exceeded by LeetCode. Please back off.");
    }

    if (!res.ok) {
      throw new Error(`LeetCode GraphQL error: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0]?.message || "GraphQL error occurred");
    }

    return json.data;
  }

  async verifyUsername(username: string): Promise<LeetCodeUserVerification> {
    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { username });
      if (!data?.matchedUser) {
        return {
          valid: false,
          username,
          error: "LeetCode user not found or profile is completely private.",
        };
      }

      const totalSolved =
        data.matchedUser.submitStatsGlobal?.acSubmissionNum?.find(
          (d: { difficulty: string; count: number }) => d.difficulty === "All"
        )?.count || 0;

      return {
        valid: true,
        username: data.matchedUser.username,
        realName: data.matchedUser.profile?.realName || undefined,
        totalSolved,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify LeetCode username.";
      return {
        valid: false,
        username,
        error: message,
      };
    }
  }

  async getProblemBySlug(titleSlug: string): Promise<LeetCodeProblem | null> {
    const query = `
      query questionContent($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
          content
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { titleSlug });
      const q = data?.question;
      if (!q) return null;

      return {
        questionId: parseInt(q.questionFrontendId, 10),
        title: q.title,
        titleSlug: q.titleSlug,
        difficulty: q.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        topicTags: q.topicTags?.map((t: { name: string }) => t.name) || [],
        content: q.content ? stripHtml(q.content) : "No description available.",
      };
    } catch {
      return null;
    }
  }

  async getProblemByNumber(questionNumber: number): Promise<LeetCodeProblem | null> {
    // 1. Try finding in curated catalog first for immediate response
    const catalogMatch = CURATED_CATALOG_PROBLEMS.find(
      (c) => c.leetcodeQuestionId === questionNumber
    );

    if (catalogMatch) {
      const slug = catalogMatch.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      const live = await this.getProblemBySlug(slug);
      if (live) return live;

      return {
        questionId: questionNumber,
        title: catalogMatch.title,
        titleSlug: slug,
        difficulty: catalogMatch.difficulty,
        topicTags: catalogMatch.topicTags,
        content: catalogMatch.summary,
      };
    }

    // 2. Query question by number through LeetCode's problemset
    const query = `
      query problemsetQuestionList($filters: QuestionListFilterInput) {
        problemsetQuestionList(
          categorySlug: ""
          filters: $filters
          limit: 1
        ) {
          questions: data {
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags {
              name
            }
          }
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, {
        filters: { searchKeywords: String(questionNumber) },
      });

      const question = data?.problemsetQuestionList?.questions?.find(
        (q: { questionFrontendId: string; titleSlug: string }) =>
          parseInt(q.questionFrontendId, 10) === questionNumber
      );

      if (question) {
        return this.getProblemBySlug(question.titleSlug);
      }
    } catch {
      // fallback
    }

    return null;
  }

  async getRecentSubmissions(username: string): Promise<LeetCodeSubmission[]> {
    const query = `
      query recentAcSubmissions($username: String!) {
        recentAcSubmissionList(username: $username, limit: 30) {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { username });
      const rawList = data?.recentAcSubmissionList || [];

      return rawList.map(
        (s: {
          id: string;
          title: string;
          titleSlug: string;
          timestamp: string;
          statusDisplay?: string;
          lang: string;
        }) => {
          const cat = CURATED_CATALOG_PROBLEMS.find(
            (c) => c.title.toLowerCase() === s.title.toLowerCase()
          );
          return {
            id: s.id,
            title: s.title,
            titleSlug: s.titleSlug,
            questionId: cat?.leetcodeQuestionId || parseInt(s.id, 10) || 1,
            timestamp: parseInt(s.timestamp, 10),
            statusDisplay: s.statusDisplay || "Accepted",
            lang: s.lang,
          };
        }
      );
    } catch (err) {
      console.error("Failed to fetch recent submissions:", err);
      return [];
    }
  }

  async getAllSolvedProblems(
    username: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<LeetCodeProblem[]> {
    // LeetCode's public API exposes recent accepted submissions.
    // For bulk imports, we process distinct solved problems with rate-limited delays.
    const recent = await this.getRecentSubmissions(username);
    const distinctSlugs = Array.from(new Set(recent.map((s) => s.titleSlug)));

    const results: LeetCodeProblem[] = [];
    const total = distinctSlugs.length;

    for (let i = 0; i < total; i++) {
      const slug = distinctSlugs[i];
      const prob = await this.getProblemBySlug(slug);
      if (prob) {
        results.push(prob);
      }
      if (onProgress) {
        onProgress(i + 1, total);
      }
      // Polite rate limit: wait 250ms between requests
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return results;
  }
}

/**
 * Deterministic Mock Client for Tests and Offline Environments
 */
export class MockLeetCodeClient implements ILeetCodeClient {
  async verifyUsername(username: string): Promise<LeetCodeUserVerification> {
    if (
      username.toLowerCase().includes("invalid") ||
      username.toLowerCase() === "invalid_user_404"
    ) {
      return {
        valid: false,
        username,
        error: "User not found on LeetCode.",
      };
    }
    return {
      valid: true,
      username,
      realName: "Mock Candidate",
      ranking: 45000,
      totalSolved: 120,
    };
  }

  async getProblemByNumber(questionNumber: number): Promise<LeetCodeProblem | null> {
    const match = CURATED_CATALOG_PROBLEMS.find(
      (c) => c.leetcodeQuestionId === questionNumber
    );

    if (!match) return null;

    return {
      questionId: questionNumber,
      title: match.title,
      titleSlug: match.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
      difficulty: match.difficulty,
      topicTags: match.topicTags,
      content: match.summary,
    };
  }

  async getProblemBySlug(titleSlug: string): Promise<LeetCodeProblem | null> {
    const match = CURATED_CATALOG_PROBLEMS.find((c) => {
      const slug = c.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return slug === titleSlug.toLowerCase();
    });

    if (!match) return null;

    return {
      questionId: match.leetcodeQuestionId || 1,
      title: match.title,
      titleSlug,
      difficulty: match.difficulty,
      topicTags: match.topicTags,
      content: match.summary,
    };
  }

  async getRecentSubmissions(_username: string): Promise<LeetCodeSubmission[]> {
    void _username;
    const nowSec = Math.floor(Date.now() / 1000);
    // Return 3 recent submissions within last 24 hours
    return [
      {
        id: "sub-101",
        title: "Two Sum",
        titleSlug: "two-sum",
        questionId: 1,
        timestamp: nowSec - 3600, // 1 hr ago
        statusDisplay: "Accepted",
        lang: "python3",
        code: "class Solution:\n    def twoSum(self, nums, target):\n        lookup = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in lookup:\n                return [lookup[diff], i]\n            lookup[n] = i",
      },
      {
        id: "sub-102",
        title: "Valid Anagram",
        titleSlug: "valid-anagram",
        questionId: 242,
        timestamp: nowSec - 7200, // 2 hrs ago
        statusDisplay: "Accepted",
        lang: "python3",
        code: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        return Counter(s) == Counter(t)",
      },
      {
        id: "sub-103",
        title: "Invert Binary Tree",
        titleSlug: "invert-binary-tree",
        questionId: 226,
        timestamp: nowSec - 14400, // 4 hrs ago
        statusDisplay: "Accepted",
        lang: "typescript",
        code: "function invertTree(root: TreeNode | null): TreeNode | null {\n  if (!root) return null;\n  const temp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(temp);\n  return root;\n}",
      },
    ];
  }

  async getAllSolvedProblems(
    _username: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<LeetCodeProblem[]> {
    const sample = CURATED_CATALOG_PROBLEMS.slice(0, 5);
    const results: LeetCodeProblem[] = [];

    for (let i = 0; i < sample.length; i++) {
      const p = sample[i];
      results.push({
        questionId: p.leetcodeQuestionId || i + 1,
        title: p.title,
        titleSlug: p.title.toLowerCase().replace(/\s+/g, "-"),
        difficulty: p.difficulty,
        topicTags: p.topicTags,
        content: p.summary,
      });
      if (onProgress) {
        onProgress(i + 1, sample.length);
      }
    }

    return results;
  }
}

/**
 * Returns the appropriate LeetCode client depending on environment
 */
export function getLeetCodeClient(): ILeetCodeClient {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST ||
    process.env.MOCK_LEETCODE === "true"
  ) {
    return new MockLeetCodeClient();
  }

  return new GraphQLLeetCodeClient();
}
