// =============================================================================
// Next Question API: GET /api/recommendations/next
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNextRecommendedQuestion } from "@/lib/recommendations/next-question";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recommendation = await getNextRecommendedQuestion(session.user.id);
    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Failed to fetch next question recommendation:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
