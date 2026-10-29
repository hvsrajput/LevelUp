// =============================================================================
// Background Sync Job Manager for Bulk Imports (Rate Limiting + Retries)
// =============================================================================

import { prisma } from "@/lib/prisma";
import { getLeetCodeClient } from "./client";
import { LeetCodeProblem } from "./types";
import { generateShortCode } from "@/lib/utils";

export interface SyncJobState {
  id: string;
  userId: string;
  username: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory singleton job store
class SyncJobManager {
  private jobs = new Map<string, SyncJobState>();

  createJob(userId: string, username: string): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: SyncJobState = {
      id,
      userId,
      username,
      status: "PENDING",
      total: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);

    // Kick off background execution asynchronously
    this.runJob(id);

    return id;
  }

  getJob(id: string): SyncJobState | null {
    return this.jobs.get(id) || null;
  }

  private updateJob(id: string, patch: Partial<SyncJobState>) {
    const job = this.jobs.get(id);
    if (!job) return;
    Object.assign(job, patch, { updatedAt: new Date() });
  }

  private async runJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) return;

    this.updateJob(id, { status: "RUNNING" });

    try {
      const client = getLeetCodeClient();
      const problems = await client.getAllSolvedProblems(
        job.username,
        (current, total) => {
          this.updateJob(id, { processed: current, total });
        }
      );

      this.updateJob(id, { total: problems.length });

      let imported = 0;
      let skipped = 0;

      for (const prob of problems) {
        // Retry loop with exponential backoff
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!success && attempts < maxAttempts) {
          try {
            await this.upsertImportedProblem(job.userId, prob);
            imported++;
            success = true;
          } catch (err) {
            attempts++;
            if (attempts >= maxAttempts) {
              skipped++;
              console.warn(
                `Failed to import LeetCode #${prob.questionId} after ${maxAttempts} attempts:`,
                err
              );
            } else {
              // Exponential backoff: 200ms, 400ms...
              await new Promise((res) => setTimeout(res, 200 * Math.pow(2, attempts)));
            }
          }
        }
      }

      this.updateJob(id, {
        status: "COMPLETED",
        imported,
        skipped,
        processed: job.total,
      });
    } catch (err: unknown) {
      console.error("Bulk sync job error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Bulk import job encountered an unexpected error.";
      this.updateJob(id, {
        status: "FAILED",
        error: message,
      });
    }
  }

  /**
   * Idempotent problem upsert logic
   */
  async upsertImportedProblem(userId: string, p: LeetCodeProblem) {
    // 1. Check if user already has a problem with this LeetCode Question ID
    const existing = await prisma.problem.findFirst({
      where: {
        userId,
        leetcodeQuestionId: p.questionId,
      },
    });

    if (existing) {
      // Idempotently mark as SOLVED
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          status: "SOLVED",
          solvedAt: existing.solvedAt || new Date(),
        },
      });
      return existing;
    }

    // 2. Create new problem
    const shortCode = generateShortCode();
    const created = await prisma.problem.create({
      data: {
        userId,
        title: p.title,
        difficulty: p.difficulty,
        description: p.content,
        source: "LEETCODE",
        status: "SOLVED",
        solvedAt: new Date(),
        shortCode,
        leetcodeQuestionId: p.questionId,
        titleSlug: p.titleSlug,
      },
    });

    // 3. Upsert topic connections
    for (const topicName of p.topicTags) {
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

    // 4. Ensure problem is also in CatalogProblem so all users can discover it
    const catalogMatch = await prisma.catalogProblem.findFirst({
      where: { title: p.title },
    });

    if (!catalogMatch) {
      await prisma.catalogProblem.create({
        data: {
          title: p.title,
          difficulty: p.difficulty,
          topicTags: p.topicTags,
          patternTag: "imported-from-leetcode",
          summary: p.content.slice(0, 300),
        },
      }).catch(() => {});
    }

    return created;
  }
}

export const syncJobManager = new SyncJobManager();
