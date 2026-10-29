// =============================================================================
// Daily Question API: GET /api/daily-question
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateDailyQuestion } from "@/lib/recommendations/daily-question";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const daily = await getOrCreateDailyQuestion(session.user.id);
    return NextResponse.json(daily);
  } catch (error) {
    console.error("Failed to fetch daily question:", error);
    return NextResponse.json(
      { error: "Failed to load daily question" },
      { status: 500 }
    );
  }
}
