// =============================================================================
// LeetCode Client Types & Interfaces
// =============================================================================

export interface LeetCodeProblem {
  questionId: number;
  title: string;
  titleSlug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topicTags: string[];
  content: string; // Plaintext or markdown statement
  codeSnippets?: Array<{ lang: string; langSlug: string; code: string }>;
}

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  questionId: number;
  timestamp: number; // Unix seconds
  statusDisplay: string; // "Accepted"
  lang: string;
  code?: string;
}

export interface LeetCodeUserVerification {
  valid: boolean;
  username: string;
  realName?: string;
  ranking?: number;
  totalSolved?: number;
  error?: string;
}

export interface ILeetCodeClient {
  /**
   * Verify whether a LeetCode username exists and is publicly accessible.
   */
  verifyUsername(username: string): Promise<LeetCodeUserVerification>;

  /**
   * Fetch a single problem by its official question number (e.g. 1 -> Two Sum).
   */
  getProblemByNumber(questionNumber: number): Promise<LeetCodeProblem | null>;

  /**
   * Fetch a single problem by its URL titleSlug (e.g. "two-sum").
   */
  getProblemBySlug(titleSlug: string): Promise<LeetCodeProblem | null>;

  /**
   * Fetch recent accepted submissions for a user (most recent 20-50).
   */
  getRecentSubmissions(username: string): Promise<LeetCodeSubmission[]>;

  /**
   * Fetch all solved problems for a user.
   */
  getAllSolvedProblems(
    username: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<LeetCodeProblem[]>;
}
