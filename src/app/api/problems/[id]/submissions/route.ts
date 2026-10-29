// =============================================================================
// GET  /api/problems/[id]/submissions — List submissions for a problem
// POST /api/problems/[id]/submissions — Record a new code submission
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubmissionSchema } from "@/lib/validators/submission";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const problem = await prisma.problem.findFirst({
    where: {
      OR: [{ id }, { shortCode: id }],
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const submissions = await prisma.submission.findMany({
    where: {
      problemId: problem.id,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const problem = await prisma.problem.findFirst({
    where: {
      OR: [{ id }, { shortCode: id }],
      userId: session.user.id,
    },
  });

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSubmissionSchema.safeParse(body);
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

  const { language, code, runtime, memory, notes, markStatus } = parsed.data;

  // Transaction: Create submission & conditionally update problem status
  const submission = await prisma.$transaction(async (tx) => {
    const sub = await tx.submission.create({
      data: {
        language,
        code,
        runtime: runtime || null,
        memory: memory || null,
        notes: notes || null,
        problemId: problem.id,
        userId: session.user.id,
      },
    });

    if (markStatus) {
      await tx.problem.update({
        where: { id: problem.id },
        data: {
          status: markStatus,
          solvedAt:
            markStatus === "SOLVED"
              ? problem.solvedAt || new Date()
              : problem.solvedAt,
        },
      });
    }

    return sub;
  });

  return NextResponse.json(submission, { status: 201 });
}
