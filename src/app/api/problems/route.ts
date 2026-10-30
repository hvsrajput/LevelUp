// =============================================================================
// GET /api/problems — List problems with filtering, search, and pagination
// POST /api/problems — Create a new problem
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createProblemSchema,
  problemQuerySchema,
} from "@/lib/validators/problem";
import { generateShortCode } from "@/lib/utils";
import { safeRevalidatePath } from "@/lib/server-utils";
import { getTodayInTimezone, sanitizeTimezone } from "@/lib/date";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// GET — List problems
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query parameters through Zod
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const parsed = problemQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const {
    page,
    limit,
    difficulty,
    status,
    topic,
    search,
    from,
    to,
    sortBy,
    sortOrder,
  } = parsed.data;

  // Build the where clause incrementally
  const where: Prisma.ProblemWhereInput = {
    userId: session.user.id,
  };

  if (difficulty) where.difficulty = difficulty;
  if (status) where.status = status;

  if (topic) {
    where.topics = {
      some: {
        topic: { slug: topic },
      },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        where.createdAt.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        where.createdAt.lte = toDate;
      }
    }
  }

  // Execute count + paginated query in parallel
  const [total, problems] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      include: {
        topics: { include: { topic: true } },
        testCases: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: problems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ---------------------------------------------------------------------------
// POST — Create a new problem
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate with Zod
  const parsed = createProblemSchema.safeParse(body);
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

  const { topicNames, testCases, ...problemData } = parsed.data;

  // Fetch user's timezone to compute solvedDay accurately (defensive check for test mocks)
  const user = prisma.user?.findUnique
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
      })
    : null;
  const userTimezone = sanitizeTimezone(user?.timezone);

  // Compute solvedAt and solvedDay
  let solvedAt: Date | null = null;
  let solvedDay: string | null = null;

  if (problemData.status === "SOLVED" && problemData.source !== "LEETCODE") {
    const now = new Date();
    const targetDate = problemData.solvedAt ? new Date(problemData.solvedAt) : now;
    if (targetDate.getTime() > now.getTime() + 60_000) {
      return NextResponse.json(
        { error: "solvedAt cannot be in the future" },
        { status: 400 }
      );
    }
    solvedAt = targetDate;
    solvedDay = getTodayInTimezone(userTimezone, targetDate);
  }

  // Use a transaction to ensure atomicity: problem + topics + test cases
  const problem = await prisma.$transaction(async (tx) => {
    // 1. Upsert topics (create if they don't exist)
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

    // 2. Create the problem
    const created = await tx.problem.create({
      data: {
        ...problemData,
        shortCode: generateShortCode(),
        solvedAt,
        solvedDay,
        userId: session.user.id,

        // 3. Connect topics via the join table
        topics: {
          create: topicRecords.map((t) => ({
            topicId: t.id,
          })),
        },

        // 4. Create test cases
        testCases: {
          create: testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation || null,
          })),
        },
      },
      include: {
        topics: { include: { topic: true } },
        testCases: true,
      },
    });

    return created;
  });

  safeRevalidatePath("/problems");
  safeRevalidatePath("/roadmap");

  return NextResponse.json(problem, { status: 201 });
}
