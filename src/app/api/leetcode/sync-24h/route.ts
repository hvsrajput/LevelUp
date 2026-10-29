// =============================================================================
// LeetCode 24h Sync API: Fetch & sync accepted submissions from last 24 hours
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncRecentSubmissions } from "@/lib/leetcode/sync-service";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { leetcodeUsername: true },
    });

    if (!user?.leetcodeUsername) {
      return NextResponse.json(
        {
          error:
            "No LeetCode username linked. Please link your LeetCode username before syncing.",
        },
        { status: 400 }
      );
    }

    const result = await syncRecentSubmissions(
      session.user.id,
      user.leetcodeUsername
    );

    return NextResponse.json({
      success: true,
      username: user.leetcodeUsername,
      syncedCount: result.syncedCount,
      skippedCount: result.skippedCount,
      syncedProblems: result.syncedProblems,
      message:
        result.syncedCount > 0
          ? `Successfully synced ${result.syncedCount} problem${result.syncedCount === 1 ? "" : "s"} from the past 24 hours.`
          : "No new accepted submissions found in the past 24 hours.",
    });
  } catch (error: unknown) {
    console.error("Failed to sync 24h LeetCode submissions:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync recent submissions from LeetCode. Please try again later.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
