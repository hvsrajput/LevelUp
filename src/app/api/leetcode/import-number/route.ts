// =============================================================================
// LeetCode Import by Question Number API
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importProblemByNumber } from "@/lib/leetcode/sync-service";
import { importNumberSchema } from "@/lib/validators/leetcode";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = importNumberSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { questionNumber } = parsed.data;
    const result = await importProblemByNumber(session.user.id, questionNumber);

    return NextResponse.json({
      success: true,
      problem: result.problem,
      alreadyExisted: result.alreadyExisted,
      message: result.alreadyExisted
        ? `Problem #${questionNumber} is already in your tracker.`
        : `Successfully imported "${result.problem.title}" (#${questionNumber}).`,
    });
  } catch (error: unknown) {
    console.error("Failed to import LeetCode problem by number:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import LeetCode problem";
    const status = message.includes("could not be found") ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
