// =============================================================================
// LeetCode Bulk Sync Status API: Polling endpoint for background sync jobs
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncJobManager } from "@/lib/leetcode/sync-job";

export async function GET(
  _req: Request,
  props: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await props.params;

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
  }

  const job = syncJobManager.getJob(jobId);

  if (!job || job.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Sync job not found or unauthorized access" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: job.id,
    username: job.username,
    status: job.status,
    total: job.total,
    processed: job.processed,
    imported: job.imported,
    skipped: job.skipped,
    error: job.error || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
