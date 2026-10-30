// =============================================================================
// Streak Summary API: GET /api/streak
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStreakSummary } from "@/lib/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getStreakSummary(session.user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to load streak summary:", error);
    return NextResponse.json(
      { error: "Failed to load streak summary" },
      { status: 500 }
    );
  }
}
