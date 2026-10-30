// Progress Snapshot API: GET /api/progress-snapshot
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProgressSnapshot } from "@/lib/recommendations/progress-snapshot";
import { getStreakSummary } from "@/lib/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [snapshot, streakSummary] = await Promise.all([
      getProgressSnapshot(session.user.id),
      getStreakSummary(session.user.id),
    ]);

    return NextResponse.json({
      snapshot,
      streak: streakSummary.streak,
    });
  } catch (error) {
    console.error("Failed to load progress snapshot:", error);
    return NextResponse.json(
      { error: "Failed to load progress snapshot" },
      { status: 500 }
    );
  }
}
