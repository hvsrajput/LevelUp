import { prisma } from "@/lib/prisma";
import {
  CURATED_CATALOG_PROBLEMS,
  getLeetCodeProblemUrl,
  type CatalogProblemItem,
} from "@/lib/catalog/catalog-data";
import { normalizeTitle, titleToSlug } from "./parser";
import type {
  RoadmapDraft,
  ResolvedDraft,
  ResolvedWeek,
  ResolvedDay,
  ResolvedQuestionEntry,
  ProblemSuggestion,
  MatchSource,
  Issue,
} from "./types";

interface UserProblemCandidate {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  leetcodeQuestionId?: number | null;
  titleSlug?: string | null;
  status: "ATTEMPTED" | "SOLVED" | "REVISIT";
}

let cachedCatalogProblems: CatalogProblemItem[] | null = null;

export async function getCachedCatalog(): Promise<CatalogProblemItem[]> {
  if (cachedCatalogProblems && cachedCatalogProblems.length > 0) {
    return cachedCatalogProblems;
  }

  // Load from DB if possible, or fallback to in-memory curated list
  if (prisma.catalogProblem?.findMany) {
    try {
      const dbCatalog = await prisma.catalogProblem.findMany({
        select: {
          id: true,
          title: true,
          difficulty: true,
        },
      });

      if (dbCatalog && dbCatalog.length > 0) {
        // Merge with curated items to retain leetcodeQuestionId and url
        const curatedMap = new Map(
          CURATED_CATALOG_PROBLEMS.map((c) => [normalizeTitle(c.title), c])
        );

        cachedCatalogProblems = dbCatalog.map((item) => {
          const curated = curatedMap.get(normalizeTitle(item.title));
          return {
            id: item.id,
            title: item.title,
            difficulty: item.difficulty,
            topicTags: curated?.topicTags || [],
            patternTag: curated?.patternTag || "",
            summary: curated?.summary || "",
            leetcodeQuestionId: curated?.leetcodeQuestionId,
            url: curated?.url || getLeetCodeProblemUrl(item.title),
          };
        });
        return cachedCatalogProblems;
      }
    } catch {
      // Fallback to in-memory
    }
  }

  cachedCatalogProblems = CURATED_CATALOG_PROBLEMS;
  return cachedCatalogProblems;
}

export function clearCatalogCache(): void {
  cachedCatalogProblems = null;
}

/**
 * Computes word-level token overlap similarity (Jaccard) between two titles.
 */
export function computeTokenOverlap(a: string, b: string): number {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);

  if (normA === normB && normA.length > 0) return 1.0;

  const setA = new Set(normA.split(" ").filter((w) => w.length > 1));
  const setB = new Set(normB.split(" ").filter((w) => w.length > 1));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Batched resolution of roadmap draft entries against user's problems and catalog.
 * Executes exactly ONE query for user's problems and ONE query for catalog (cached in memory).
 */
export async function resolveDraft(
  draft: RoadmapDraft,
  userId: string,
  extraIssues: Issue[] = []
): Promise<ResolvedDraft> {
  // 1. Single batched query for user's problems
  const rawUserProblems = prisma.problem?.findMany
    ? await prisma.problem.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          difficulty: true,
          leetcodeQuestionId: true,
          titleSlug: true,
          status: true,
        },
      })
    : [];

  const userProblems: UserProblemCandidate[] = Array.isArray(rawUserProblems)
    ? rawUserProblems
    : [];

  // 2. Single batched query / load of catalog (cached in memory)
  const catalog = await getCachedCatalog();

  // Index user problems for O(1) lookup
  const userByLcId = new Map<number, UserProblemCandidate>();
  const userBySlug = new Map<string, UserProblemCandidate>();
  const userByTitle = new Map<string, UserProblemCandidate>();

  for (const p of userProblems) {
    if (p.leetcodeQuestionId != null) userByLcId.set(p.leetcodeQuestionId, p);
    if (p.titleSlug) userBySlug.set(p.titleSlug.toLowerCase(), p);
    userByTitle.set(normalizeTitle(p.title), p);
  }

  // Index catalog problems for O(1) lookup
  const catalogByLcId = new Map<number, CatalogProblemItem>();
  const catalogBySlug = new Map<string, CatalogProblemItem>();
  const catalogByTitle = new Map<string, CatalogProblemItem>();

  for (const c of catalog) {
    if (c.leetcodeQuestionId != null) catalogByLcId.set(c.leetcodeQuestionId, c);
    catalogBySlug.set(titleToSlug(c.title), c);
    catalogByTitle.set(normalizeTitle(c.title), c);
  }

  let totalQuestions = 0;
  let totalMatched = 0;
  let totalCustom = 0;
  let totalSuggested = 0;
  let totalDays = 0;

  const resolvedWeeks: ResolvedWeek[] = [];

  for (const week of draft.weeks) {
    const resolvedDays: ResolvedDay[] = [];

    for (const day of week.days) {
      totalDays++;
      const resolvedQuestions: ResolvedQuestionEntry[] = [];

      for (const entry of day.questions) {
        totalQuestions++;

        // Matching Order:
        // 1. LeetCode number or slug
        let matchedUser: UserProblemCandidate | undefined;
        let matchedCatalog: CatalogProblemItem | undefined;
        let matchSource: MatchSource | undefined;

        if (entry.leetcodeId !== undefined) {
          matchedUser = userByLcId.get(entry.leetcodeId);
          if (!matchedUser) {
            matchedCatalog = catalogByLcId.get(entry.leetcodeId);
          }
        }

        if (!matchedUser && !matchedCatalog && entry.slug) {
          const normSlug = entry.slug.toLowerCase();
          matchedUser = userBySlug.get(normSlug);
          if (!matchedUser) {
            matchedCatalog = catalogBySlug.get(normSlug);
          }
        }

        // 2. Exact normalized title match against user's own problems
        const normTitle = normalizeTitle(entry.title);
        if (!matchedUser && !matchedCatalog && normTitle) {
          matchedUser = userByTitle.get(normTitle);
        }

        // 3. Exact normalized title match against catalog
        if (!matchedUser && !matchedCatalog && normTitle) {
          matchedCatalog = catalogByTitle.get(normTitle);
        }

        if (matchedUser) {
          matchSource = "user";
          totalMatched++;
          const url = matchedUser.titleSlug
            ? `https://leetcode.com/problems/${matchedUser.titleSlug}/`
            : matchedUser.leetcodeQuestionId
            ? `https://leetcode.com/problems/${titleToSlug(matchedUser.title)}/`
            : null;

          resolvedQuestions.push({
            ...entry,
            status: "matched",
            matchSource,
            matchedId: matchedUser.id,
            matchedTitle: matchedUser.title,
            difficulty: matchedUser.difficulty,
            url,
            isSolved: matchedUser.status === "SOLVED",
          });
          continue;
        }

        if (matchedCatalog) {
          matchSource = "catalog";
          totalMatched++;
          // Look up if user has solved a problem with this title
          const solvedUserProblem = userByTitle.get(normalizeTitle(matchedCatalog.title));
          const isSolved = solvedUserProblem?.status === "SOLVED";

          resolvedQuestions.push({
            ...entry,
            status: "matched",
            matchSource,
            matchedId: matchedCatalog.id,
            matchedTitle: matchedCatalog.title,
            difficulty: matchedCatalog.difficulty,
            url: matchedCatalog.url || getLeetCodeProblemUrl(matchedCatalog.title),
            isSolved,
          });
          continue;
        }

        // 4. No exact match: compute up to 3 "Did you mean" suggestions in memory
        // Token-overlap similarity. NEVER auto-accept.
        const candidatesWithScores: Array<{
          title: string;
          difficulty: "EASY" | "MEDIUM" | "HARD";
          url?: string | null;
          source: MatchSource;
          id?: string;
          score: number;
        }> = [];

        // Check user candidates
        for (const up of userProblems) {
          const score = computeTokenOverlap(entry.title, up.title);
          if (score >= 0.25) {
            candidatesWithScores.push({
              id: up.id,
              title: up.title,
              difficulty: up.difficulty,
              url: up.titleSlug ? `https://leetcode.com/problems/${up.titleSlug}/` : null,
              source: "user",
              score,
            });
          }
        }

        // Check catalog candidates
        for (const cp of catalog) {
          const score = computeTokenOverlap(entry.title, cp.title);
          if (score >= 0.25) {
            candidatesWithScores.push({
              id: cp.id,
              title: cp.title,
              difficulty: cp.difficulty,
              url: cp.url || getLeetCodeProblemUrl(cp.title),
              source: "catalog",
              score,
            });
          }
        }

        // Deduplicate suggestions by title
        const uniqueSuggestionsMap = new Map<string, ProblemSuggestion & { score: number }>();
        for (const c of candidatesWithScores) {
          const key = normalizeTitle(c.title);
          if (!uniqueSuggestionsMap.has(key) || uniqueSuggestionsMap.get(key)!.score < c.score) {
            uniqueSuggestionsMap.set(key, {
              id: c.id,
              title: c.title,
              difficulty: c.difficulty,
              url: c.url,
              source: c.source,
              score: c.score,
            });
          }
        }

        const topSuggestions = Array.from(uniqueSuggestionsMap.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((s) => ({
            id: s.id,
            title: s.title,
            difficulty: s.difficulty,
            url: s.url,
            source: s.source,
          }));

        const difficulty: "EASY" | "MEDIUM" | "HARD" = entry.difficultyTag
          ? (entry.difficultyTag.toUpperCase() as "EASY" | "MEDIUM" | "HARD")
          : "MEDIUM";

        if (topSuggestions.length > 0) {
          totalSuggested++;
          resolvedQuestions.push({
            ...entry,
            status: "suggested",
            difficulty,
            url: null, // Unmatched entries have no URL
            isSolved: false,
            suggestions: topSuggestions,
          });
        } else {
          // 5. Unmatched lines saved as custom entries with typed title (no URL)
          totalCustom++;
          resolvedQuestions.push({
            ...entry,
            status: "custom",
            difficulty,
            url: null, // Typed title has no URL
            isSolved: false,
          });
        }
      }

      resolvedDays.push({
        dayNumber: day.dayNumber,
        title: day.title,
        questions: resolvedQuestions,
      });
    }

    resolvedWeeks.push({
      weekNumber: week.weekNumber,
      title: week.title,
      days: resolvedDays,
    });
  }

  return {
    title: draft.title,
    weeks: resolvedWeeks,
    issues: extraIssues,
    totals: {
      weeks: draft.weeks.length,
      days: totalDays,
      questions: totalQuestions,
      matched: totalMatched,
      custom: totalCustom,
      suggested: totalSuggested,
    },
  };
}
