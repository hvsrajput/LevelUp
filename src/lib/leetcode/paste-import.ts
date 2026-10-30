// =============================================================================
// Paste-Based LeetCode Import: Safe, Client-Side Export + Server Batch Ingestion
// =============================================================================

import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils";
import {
  leetCodePastedPayloadSchema,
  leetCodePastedItemSchema,
  type LeetCodePastedItem,
} from "@/lib/validators/leetcode";

const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB limit

export const CONSOLE_IMPORT_SCRIPT = `(async () => {
  console.log("⏳ Fetching your solved LeetCode problems...");
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: \`query userSolvedProblems {
        problemsetQuestionList: questionList(categorySlug: "", limit: 5000, filters: { status: AC }) {
          data {
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags { name }
          }
        }
      }\`,
    }),
  });

  const json = await res.json();
  const raw = json.data?.problemsetQuestionList?.data || [];
  const problems = raw.map((q) => ({
    id: parseInt(q.questionFrontendId, 10),
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty.toUpperCase(),
    topics: (q.topicTags || []).map((t) => t.name),
  }));

  const payload = JSON.stringify({ version: 1, problems }, null, 2);
  if (typeof copy === "function") {
    copy(payload);
    console.log("✅ Successfully copied " + problems.length + " problems to your clipboard! Paste into LevelUp.");
  } else {
    console.log("📋 Copy the JSON below and paste into LevelUp:\\n", payload);
  }
})();`;

export interface ParsedPayloadResult {
  validProblems: Array<LeetCodePastedItem & { url: string }>;
  invalidCount: number;
}

export interface PreviewImportResult {
  newCount: number;
  alreadyImportedCount: number;
  invalidCount: number;
  totalValid: number;
  sampleTitles: string[];
}

export interface ConfirmImportResult {
  success: boolean;
  importedCount: number;
  alreadyExistedCount: number;
  totalProcessed: number;
}

/**
 * Parses and validates the raw pasted JSON string.
 * Enforces:
 * - Max 1 MB payload size
 * - Valid JSON syntax
 * - Zod schema (version 1, max 5000 problems)
 * - Per-problem validation (id, slug, difficulty, topics)
 * - Derives URL strictly from slug (never trusts external URLs in payload)
 */
export function parseAndValidateLeetCodePayload(rawJson: string): ParsedPayloadResult {
  if (typeof rawJson !== "string") {
    throw new Error("Invalid payload: Payload must be a string.");
  }

  // Check 1 MB size limit
  const byteLength = Buffer.byteLength(rawJson, "utf8");
  if (byteLength > MAX_PAYLOAD_BYTES) {
    throw new Error("Invalid payload: Content exceeds the 1 MB maximum limit.");
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid payload: Malformed JSON.");
  }

  // Validate top-level structure
  const topLevel = leetCodePastedPayloadSchema.safeParse(parsed);
  if (!topLevel.success) {
    const errorMsg = topLevel.error.issues[0]?.message || "Invalid payload structure.";
    throw new Error(`Invalid payload: ${errorMsg}`);
  }

  const rawProblems = topLevel.data.problems;
  let invalidCount = 0;
  const validMap = new Map<number, LeetCodePastedItem & { url: string }>();

  for (const item of rawProblems) {
    const itemResult = leetCodePastedItemSchema.safeParse(item);
    if (!itemResult.success) {
      invalidCount++;
      continue;
    }

    const { id, title, slug, difficulty, topics } = itemResult.data;

    // Deduplicate within the payload itself (if duplicate id exists in pasted payload)
    if (validMap.has(id)) {
      invalidCount++;
      continue;
    }

    // Never use any URL from the payload; derive directly from slug
    const derivedUrl = `https://leetcode.com/problems/${slug}/`;

    validMap.set(id, {
      id,
      title,
      slug,
      difficulty,
      topics,
      url: derivedUrl,
    });
  }

  return {
    validProblems: Array.from(validMap.values()),
    invalidCount,
  };
}

/**
 * Preview import counts: new, already imported, invalid
 */
export async function previewLeetCodeImport(
  userId: string,
  rawJson: string
): Promise<PreviewImportResult> {
  const { validProblems, invalidCount } = parseAndValidateLeetCodePayload(rawJson);

  if (validProblems.length === 0) {
    return {
      newCount: 0,
      alreadyImportedCount: 0,
      invalidCount,
      totalValid: 0,
      sampleTitles: [],
    };
  }

  const questionIds = validProblems.map((p) => p.id);

  // Check which problems already exist for this user in PostgreSQL
  const existing = await prisma.problem.findMany({
    where: {
      userId,
      leetcodeQuestionId: { in: questionIds },
    },
    select: { leetcodeQuestionId: true },
  });

  const existingSet = new Set(existing.map((e) => e.leetcodeQuestionId));

  let alreadyImportedCount = 0;
  let newCount = 0;
  const sampleNewTitles: string[] = [];

  for (const p of validProblems) {
    if (existingSet.has(p.id)) {
      alreadyImportedCount++;
    } else {
      newCount++;
      if (sampleNewTitles.length < 5) {
        sampleNewTitles.push(p.title);
      }
    }
  }

  return {
    newCount,
    alreadyImportedCount,
    invalidCount,
    totalValid: validProblems.length,
    sampleTitles: sampleNewTitles,
  };
}

/**
 * Confirm batch import:
 * - Uses `createMany` with `skipDuplicates: true` and @@unique([userId, leetcodeQuestionId])
 * - Status: SOLVED, source: LEETCODE, solvedAt: null
 * - Upserts topics with `createMany` + `findMany` outside any transaction
 */
export async function confirmLeetCodeImport(
  userId: string,
  rawJson: string
): Promise<ConfirmImportResult> {
  const { validProblems } = parseAndValidateLeetCodePayload(rawJson);

  if (validProblems.length === 0) {
    return {
      success: true,
      importedCount: 0,
      alreadyExistedCount: 0,
      totalProcessed: 0,
    };
  }

  // 1. Prepare batch problem rows
  const problemsToInsert = validProblems.map((p) => ({
    userId,
    shortCode: generateShortCode(),
    title: p.title,
    description: `LeetCode Problem #${p.id}: ${p.title}`,
    difficulty: p.difficulty,
    source: "LEETCODE" as const,
    status: "SOLVED" as const,
    solvedAt: null,
    solvedDay: null,
    leetcodeQuestionId: p.id,
    titleSlug: p.slug,
  }));

  // 2. Batch insert problems using createMany skipDuplicates
  const batchResult = await prisma.problem.createMany({
    data: problemsToInsert,
    skipDuplicates: true,
  });

  // 3. Upsert topics outside any transaction using createMany + findMany
  const allTopicNames = Array.from(
    new Set(validProblems.flatMap((p) => p.topics).filter(Boolean))
  );

  if (allTopicNames.length > 0) {
    const topicData = allTopicNames.map((name) => ({
      name,
      slug: name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
    }));

    await prisma.topic.createMany({
      data: topicData,
      skipDuplicates: true,
    });

    const dbTopics = await prisma.topic.findMany({
      where: { name: { in: allTopicNames } },
      select: { id: true, name: true },
    });

    const topicMap = new Map(dbTopics.map((t) => [t.name.toLowerCase(), t.id]));

    // Query back the problems for this user to get their database IDs
    const userProblems = await prisma.problem.findMany({
      where: {
        userId,
        leetcodeQuestionId: { in: validProblems.map((p) => p.id) },
      },
      select: { id: true, leetcodeQuestionId: true },
    });

    const problemMap = new Map(
      userProblems.map((p) => [p.leetcodeQuestionId, p.id])
    );

    const topicLinks: { problemId: string; topicId: string }[] = [];
    for (const p of validProblems) {
      const problemId = problemMap.get(p.id);
      if (!problemId) continue;

      for (const topicName of p.topics) {
        const topicId = topicMap.get(topicName.toLowerCase());
        if (topicId) {
          topicLinks.push({ problemId, topicId });
        }
      }
    }

    if (topicLinks.length > 0) {
      await prisma.topicOnProblem.createMany({
        data: topicLinks,
        skipDuplicates: true,
      });
    }
  }

  // 4. Optionally register in CatalogProblem so discoverable globally
  const catalogRows = validProblems.map((p) => ({
    title: p.title,
    difficulty: p.difficulty,
    topicTags: p.topics,
    patternTag: "imported-from-leetcode",
    summary: `LeetCode Problem #${p.id}: ${p.title}`,
  }));

  if (catalogRows.length > 0) {
    try {
      await prisma.catalogProblem.createMany({
        data: catalogRows,
        skipDuplicates: true,
      });
    } catch {
      // ignore
    }
  }

  const importedCount = batchResult.count;
  const alreadyExistedCount = validProblems.length - importedCount;

  return {
    success: true,
    importedCount,
    alreadyExistedCount,
    totalProcessed: validProblems.length,
  };
}
