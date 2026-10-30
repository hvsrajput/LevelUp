// =============================================================================
// Roadmap Reschedule Remaining API: POST /api/roadmap/[id]/reschedule
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeRevalidatePath } from "@/lib/server-utils";
import { rescheduleRemainingRoadmapItems } from "@/lib/recommendations/roadmap";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: roadmapId } = await context.params;

  try {
    const updated = await rescheduleRemainingRoadmapItems(
      session.user.id,
      roadmapId
    );

    safeRevalidatePath("/roadmap");
    return NextResponse.json({ roadmap: updated });
  } catch (error) {
    console.error("Failed to reschedule roadmap:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reschedule roadmap",
      },
      { status: 500 }
    );
  }
}
