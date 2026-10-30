// =============================================================================
// GET    /api/problems/[id] — Get a single problem
// PUT    /api/problems/[id] — Update a problem
// DELETE /api/problems/[id] — Delete a problem
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProblemSchema } from "@/lib/validators/problem";
import { safeRevalidatePath } from "@/lib/server-utils";
import { getTodayInTimezone, sanitizeTimezone } from "@/lib/date";

// Next.js 16: RouteContext is globally available after `next typegen`
type Ctx = RouteContext<"/api/problems/[id]">;

// ---------------------------------------------------------------------------
// Helper: fetch problem with ownership check
// ---------------------------------------------------------------------------

async function getProblemForUser(id: string, userId: string) {
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      topics: { include: { topic: true } },
      testCases: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!problem) return { error: "Problem not found", status: 404 as const };
  if (problem.userId !== userId)
    return { error: "Forbidden", status: 403 as const };

  return { problem };
}

// ---------------------------------------------------------------------------
// GET — Get a single problem by ID or shortCode
// ---------------------------------------------------------------------------

export async function GET(_request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Support lookup by either id or shortCode
  const problem = await prisma.problem.findFirst({
    where: {
      OR: [{ id }, { shortCode: id }],
      userId: session.user.id,
    },
    include: {
      topics: { include: { topic: true } },
      testCases: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  return NextResponse.json(problem);
}

// ---------------------------------------------------------------------------
// PUT — Update a problem
// ---------------------------------------------------------------------------

export async function PUT(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await getProblemForUser(id, session.user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateProblemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { topicNames, testCases, ...updateData } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    // Update topics if provided
    if (topicNames !== undefined) {
      // Remove existing topic links
      await tx.topicOnProblem.deleteMany({ where: { problemId: id } });

      // Upsert new topics and link them
      const topicRecords = await Promise.all(
        topicNames.map((name) =>
          tx.topic.upsert({
            where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
            update: {},
            create: {
              name,
              slug: name.toLowerCase().replace(/\s+/g, "-"),
            },
          })
        )
      );

      await tx.topicOnProblem.createMany({
        data: topicRecords.map((t) => ({
          problemId: id,
          topicId: t.id,
        })),
      });
    }

    // Update test cases if provided
    if (testCases !== undefined) {
      // Simple strategy: delete all existing, recreate
      // For Phase 2, we can do smarter diffing
      await tx.testCase.deleteMany({ where: { problemId: id } });

      if (testCases.length > 0) {
        await tx.testCase.createMany({
          data: testCases.map((tc) => ({
            problemId: id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation || null,
          })),
        });
      }
    }

    // Fetch user's timezone to compute solvedDay accurately (defensive check for test mocks)
    const user = tx.user?.findUnique
      ? await tx.user.findUnique({
          where: { id: session.user.id },
          select: { timezone: true },
        })
      : null;
    const userTimezone = sanitizeTimezone(user?.timezone);

    // Compute solvedAt and solvedDay status transitions:
    // When a problem becomes SOLVED: set solvedAt = now and solvedDay.
    // When it leaves SOLVED: clear both. Never allow solvedAt in the future.
    let solvedAtToSet: Date | null | undefined = undefined;
    let solvedDayToSet: string | null | undefined = undefined;

    const newStatus = updateData.status ?? result.problem.status;
    const isBecomingOrRemainingSolved = newStatus === "SOLVED";

    if (updateData.status !== undefined && updateData.status !== "SOLVED") {
      // Left SOLVED: clear both
      solvedAtToSet = null;
      solvedDayToSet = null;
    } else if (isBecomingOrRemainingSolved) {
      if (updateData.solvedAt !== undefined) {
        if (updateData.solvedAt) {
          const target = new Date(updateData.solvedAt);
          if (target.getTime() > Date.now() + 60_000) {
            throw new Error("solvedAt cannot be in the future");
          }
          solvedAtToSet = target;
          solvedDayToSet = getTodayInTimezone(userTimezone, target);
        } else {
          solvedAtToSet = null;
          solvedDayToSet = null;
        }
      } else if (result.problem.status !== "SOLVED") {
        // Newly marked SOLVED
        const now = new Date();
        solvedAtToSet = now;
        solvedDayToSet = getTodayInTimezone(userTimezone, now);
      }
    }

    // Update the problem itself
    return tx.problem.update({
      where: { id },
      data: {
        ...updateData,
        ...(solvedAtToSet !== undefined ? { solvedAt: solvedAtToSet } : {}),
        ...(solvedDayToSet !== undefined ? { solvedDay: solvedDayToSet } : {}),
      },
      include: {
        topics: { include: { topic: true } },
        testCases: true,
      },
    });
  });

  safeRevalidatePath("/problems");
  safeRevalidatePath("/roadmap");

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// DELETE — Delete a problem
// ---------------------------------------------------------------------------

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await getProblemForUser(id, session.user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Cascade deletes handle test cases, submissions, topic links
  await prisma.problem.delete({ where: { id } });

  safeRevalidatePath("/problems");
  safeRevalidatePath("/roadmap");

  return NextResponse.json({ success: true });
}
