// =============================================================================
// Problem Form Values & Mapper
// =============================================================================

import { getLeetCodeProblemUrl } from "@/lib/catalog/catalog-data";
import { getProblemLeetCodeUrl } from "@/lib/leetcode/url";

export interface TestCaseFormValue {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface ApproachFormValue {
  title: string;
  description: string;
}

export interface ProblemFormValues {
  id?: string;
  catalogProblemId?: string | null;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "ATTEMPTED" | "SOLVED" | "REVISIT";
  description: string;
  constraints: string;
  timeComplexity: string;
  spaceComplexity: string;
  topics: string[];
  testCases: TestCaseFormValue[];
  hints: string[];
  approaches: ApproachFormValue[];
  notes: string;
  code: string;
  language: string;
  titleSlug: string;
  url: string;
}

/**
 * Filter out internal tags (e.g. anything starting with "#" like #imported-from-leetcode)
 */
export function filterInternalTopics(topics: string[]): string[] {
  return topics
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length > 0 && !t.startsWith("#"));
}

/**
 * Converts a saved Problem OR a catalog item (or partial data) into ProblemFormValues.
 * Covers EVERY field: title, difficulty, status, description, constraints,
 * time/space complexity, topics, examples/test cases, hints, approaches,
 * notes, code, language, and LeetCode slug/URL.
 */
export function toFormValues(source?: unknown): ProblemFormValues {
  if (!source || typeof source !== "object") {
    return {
      title: "",
      difficulty: "MEDIUM",
      status: "ATTEMPTED",
      description: "",
      constraints: "",
      timeComplexity: "",
      spaceComplexity: "",
      topics: [],
      testCases: [],
      hints: [],
      approaches: [],
      notes: "",
      code: "",
      language: "typescript",
      titleSlug: "",
      url: "",
      catalogProblemId: null,
    };
  }

  const s = source as Record<string, unknown>;

  // 1. Title
  const title = typeof s.title === "string" ? s.title : "";

  // 2. Difficulty
  const difficultyRaw = String(s.difficulty ?? "").toUpperCase();
  const difficulty: "EASY" | "MEDIUM" | "HARD" =
    difficultyRaw === "EASY" || difficultyRaw === "HARD" ? difficultyRaw : "MEDIUM";

  // 3. Status
  const statusRaw = String(s.status ?? "").toUpperCase();
  const status: "ATTEMPTED" | "SOLVED" | "REVISIT" =
    statusRaw === "SOLVED" || statusRaw === "REVISIT" ? statusRaw : "ATTEMPTED";

  // 4. Description (fallback to summary for catalog items)
  const description =
    typeof s.description === "string" && s.description.trim()
      ? s.description
      : typeof s.summary === "string"
      ? s.summary
      : "";

  // 5. Constraints
  const constraints = typeof s.constraints === "string" ? s.constraints : "";

  // 6. Time & Space Complexity
  const timeComplexity =
    typeof s.timeComplexity === "string" ? s.timeComplexity : "";
  const spaceComplexity =
    typeof s.spaceComplexity === "string" ? s.spaceComplexity : "";

  // 7. Topics extraction & internal tag filtering
  let rawTopics: string[] = [];
  if (Array.isArray(s.topics)) {
    rawTopics = s.topics.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "topic" in item) {
        const tObj = (item as { topic?: { name?: string } }).topic;
        return tObj?.name ?? "";
      }
      return "";
    });
  } else if (Array.isArray(s.topicTags)) {
    rawTopics = s.topicTags.map((t) => (typeof t === "string" ? t : ""));
  } else if (Array.isArray(s.topicNames)) {
    rawTopics = s.topicNames.map((t) => (typeof t === "string" ? t : ""));
  }
  const topics = filterInternalTopics(rawTopics);

  // 8. Test Cases / Examples
  const testCases: TestCaseFormValue[] = [];
  if (Array.isArray(s.testCases)) {
    for (const tc of s.testCases) {
      if (tc && typeof tc === "object") {
        const tcObj = tc as Record<string, unknown>;
        testCases.push({
          id: typeof tcObj.id === "string" ? tcObj.id : undefined,
          input: typeof tcObj.input === "string" ? tcObj.input : "",
          expectedOutput:
            typeof tcObj.expectedOutput === "string" ? tcObj.expectedOutput : "",
          explanation:
            typeof tcObj.explanation === "string" ? tcObj.explanation : "",
        });
      }
    }
  }

  // 9. Hints
  const hints: string[] = [];
  if (Array.isArray(s.hints)) {
    for (const h of s.hints) {
      if (typeof h === "string" && h.trim()) {
        hints.push(h);
      }
    }
  }

  // 10. Approaches
  const approaches: ApproachFormValue[] = [];
  if (Array.isArray(s.approaches)) {
    for (const a of s.approaches) {
      if (a && typeof a === "object") {
        const aObj = a as Record<string, unknown>;
        const aTitle = typeof aObj.title === "string" ? aObj.title : "";
        const aDesc =
          typeof aObj.description === "string" ? aObj.description : "";
        if (aTitle || aDesc) {
          approaches.push({ title: aTitle, description: aDesc });
        }
      }
    }
  }

  // 11. Notes
  const notes = typeof s.notes === "string" ? s.notes : "";

  // 12. Code & Language (from latest submission or top-level code/language)
  let code = "";
  let language = "typescript";
  if (Array.isArray(s.submissions) && s.submissions.length > 0) {
    const sub = s.submissions[0] as Record<string, unknown>;
    if (typeof sub.code === "string") code = sub.code;
    if (typeof sub.language === "string") language = sub.language;
  } else {
    if (typeof s.code === "string") code = s.code;
    if (typeof s.language === "string") language = s.language;
  }

  // 13. LeetCode Slug & URL
  let titleSlug = typeof s.titleSlug === "string" ? s.titleSlug : "";
  let url = typeof s.url === "string" ? s.url : "";

  if (!titleSlug && url) {
    const match = url.match(/problems\/([^/]+)/);
    if (match?.[1]) {
      titleSlug = match[1];
    }
  }

  if (!url) {
    if (titleSlug) {
      url = `https://leetcode.com/problems/${titleSlug}/`;
    } else if (title) {
      // If catalog item has a known LeetCode mapping or derived url
      const safeDerived = getProblemLeetCodeUrl({ titleSlug: null, url: null });
      if (safeDerived) url = safeDerived;
      else if ("topicTags" in s) {
        // From catalog
        url = getLeetCodeProblemUrl(title);
      }
    }
  }

  // 14. Catalog ID
  let catalogProblemId: string | null = null;
  if (typeof s.catalogProblemId === "string" && s.catalogProblemId) {
    catalogProblemId = s.catalogProblemId;
  } else if ("topicTags" in s && typeof s.id === "string") {
    // If source is a CatalogProblem item
    catalogProblemId = s.id;
  }

  return {
    id: typeof s.id === "string" ? s.id : undefined,
    catalogProblemId,
    title,
    difficulty,
    status,
    description,
    constraints,
    timeComplexity,
    spaceComplexity,
    topics,
    testCases,
    hints,
    approaches,
    notes,
    code,
    language,
    titleSlug,
    url,
  };
}
