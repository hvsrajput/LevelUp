// =============================================================================
// LeetCode Sync Service: 24h Sync Deduplication and Import by Number
// =============================================================================

import { prisma } from "@/lib/prisma";
import { getLeetCodeClient } from "./client";
import { generateShortCode } from "@/lib/utils";

export interface Sync24hResult {
  syncedCount: number;
  skippedCount: number;
  syncedProblems: Array<{
    title: string;
    questionId: number;
    difficulty: string;
    isNew: boolean;
  }>;
}

/**
 * Fetch and sync all accepted submissions from the last 24 hours.
 * Deduplicates strictly by leetcodeQuestionId to guarantee no duplicate problems.
 */
export async function syncRecentSubmissions(
  userId: string,
  username: string
): Promise<Sync24hResult> {
  const client = getLeetCodeClient();
  const recentSubmissions = await client.getRecentSubmissions(username);

  const nowSec = Math.floor(Date.now() / 1000);
  const oneDayAgoSec = nowSec - 86400; // last 24 hours

  // Filter for submissions within last 24 hours and with status "Accepted"
  const pastDaySubmissions = recentSubmissions.filter(
    (s) => s.timestamp >= oneDayAgoSec && s.statusDisplay.toLowerCase() === "accepted"
  );

  let syncedCount = 0;
  let skippedCount = 0;
  const syncedProblems: Sync24hResult["syncedProblems"] = [];

  // Group by questionId so we don't process multiple submissions for the same question twice
  const uniqueByQuestionId = new Map<number, (typeof pastDaySubmissions)[0]>();
  for (const sub of pastDaySubmissions) {
    if (!uniqueByQuestionId.has(sub.questionId)) {
      uniqueByQuestionId.set(sub.questionId, sub);
    }
  }

  for (const [questionId, sub] of uniqueByQuestionId.entries()) {
    // 1. Check if user already has a Problem with this leetcodeQuestionId
    const existing = await prisma.problem.findFirst({
      where: {
        userId,
        leetcodeQuestionId: questionId,
      },
    });

    const solvedDate = new Date(sub.timestamp * 1000);

    if (existing) {
      // Idempotently update status to SOLVED with latest solve date
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          status: "SOLVED",
          solvedAt: existing.solvedAt || solvedDate,
        },
      });

      // Add a submission record if provided
      if (sub.code) {
        await prisma.submission.create({
          data: {
            problemId: existing.id,
            userId,
            language: sub.lang,
            code: sub.code,
            notes: "Imported from LeetCode sync",
          },
        }).catch(() => {});
      }

      syncedProblems.push({
        title: existing.title,
        questionId,
        difficulty: existing.difficulty,
        isNew: false,
      });
      syncedCount++;
    } else {
      // 2. Resolve problem details from LeetCode
      let details = await client.getProblemBySlug(sub.titleSlug);
      if (!details) {
        details = await client.getProblemByNumber(questionId);
      }

      const title = details?.title || sub.title;
      const difficulty = details?.difficulty || "MEDIUM";
      const description = details?.content || `LeetCode Problem #${questionId}: ${title}`;
      const topicTags = details?.topicTags || [];
      const shortCode = generateShortCode();

      const created = await prisma.problem.create({
        data: {
          userId,
          title,
          difficulty,
          description,
          source: "LEETCODE",
          status: "SOLVED",
          solvedAt: solvedDate,
          shortCode,
          leetcodeQuestionId: questionId,
          titleSlug: sub.titleSlug,
        },
      });

      if (created) {
        // Upsert topic links
        for (const topicName of topicTags) {
          const slug = topicName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          const topic = await prisma.topic.upsert({
            where: { name: topicName },
            update: {},
            create: { name: topicName, slug },
          });

          await prisma.topicOnProblem.create({
            data: {
              problemId: created.id,
              topicId: topic.id,
            },
          }).catch(() => {});
        }

        // Add submission record if solution code exists
        if (sub.code) {
          await prisma.submission.create({
            data: {
              problemId: created.id,
              userId,
              language: sub.lang,
              code: sub.code,
              notes: "Imported from LeetCode sync",
            },
          }).catch(() => {});
        }

        // Ensure problem is in CatalogProblem
        const catalogMatch = await prisma.catalogProblem.findFirst({
          where: { title },
        });
        if (!catalogMatch) {
          await prisma.catalogProblem.create({
            data: {
              title,
              difficulty,
              topicTags,
              patternTag: "imported-from-leetcode",
              summary: description.slice(0, 300),
            },
          }).catch(() => {});
        }

        syncedProblems.push({
          title,
          questionId,
          difficulty,
          isNew: true,
        });
        syncedCount++;
      }
    }
  }

  skippedCount = pastDaySubmissions.length - uniqueByQuestionId.size;

  return {
    syncedCount,
    skippedCount,
    syncedProblems,
  };
}

/**
 * Import a problem by its official question number
 */
export async function importProblemByNumber(
  userId: string,
  questionNumber: number
) {
  // Check if user already has this question
  const existing = await prisma.problem.findFirst({
    where: {
      userId,
      leetcodeQuestionId: questionNumber,
    },
  });

  if (existing) {
    return {
      problem: existing,
      alreadyExisted: true,
    };
  }

  const client = getLeetCodeClient();
  const details = await client.getProblemByNumber(questionNumber);

  if (!details) {
    throw new Error(`LeetCode problem #${questionNumber} could not be found.`);
  }

  const shortCode = generateShortCode();

  const created = await prisma.problem.create({
    data: {
      userId,
      title: details.title,
      difficulty: details.difficulty,
      description: details.content,
      source: "LEETCODE",
      status: "ATTEMPTED",
      shortCode,
      leetcodeQuestionId: details.questionId,
      titleSlug: details.titleSlug,
    },
  });

  // Attach topics
  for (const topicName of details.topicTags) {
    const slug = topicName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    const topic = await prisma.topic.upsert({
      where: { name: topicName },
      update: {},
      create: { name: topicName, slug },
    });

    await prisma.topicOnProblem.create({
      data: {
        problemId: created.id,
        topicId: topic.id,
      },
    }).catch(() => {});
  }

  // Ensure catalog has it
  const inCatalog = await prisma.catalogProblem.findFirst({
    where: { title: details.title },
  });
  if (!inCatalog) {
    await prisma.catalogProblem.create({
      data: {
        title: details.title,
        difficulty: details.difficulty,
        topicTags: details.topicTags,
        patternTag: "imported-from-leetcode",
        summary: details.content.slice(0, 300),
      },
    }).catch(() => {});
  }

  return {
    problem: created,
    alreadyExisted: false,
  };
}
