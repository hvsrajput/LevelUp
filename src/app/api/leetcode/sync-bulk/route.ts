// =============================================================================
// LeetCode Bulk Sync API: Initiate background import of all solved problems
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncJobManager } from "@/lib/leetcode/sync-job";

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
            "No LeetCode username linked. Please link your LeetCode username before starting a bulk import.",
        },
        { status: 400 }
      );
    }

    const jobId = syncJobManager.createJob(
      session.user.id,
      user.leetcodeUsername
    );

    return NextResponse.json({
      success: true,
      jobId,
      username: user.leetcodeUsername,
      message: `Bulk import started for ${user.leetcodeUsername}.`,
    });
  } catch (error: unknown) {
    console.error("Failed to start bulk LeetCode sync job:", error);
    const message =
      error instanceof Error ? error.message : "Failed to start bulk sync job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
