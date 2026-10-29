// =============================================================================
// Roadmap Item Toggle API: PATCH /api/roadmap/[id]/items/[itemId]
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: roadmapId, itemId } = await context.params;

  try {
    // 1. Verify roadmap ownership
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: { userId: true },
    });

    if (!roadmap) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    if (roadmap.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this roadmap" },
        { status: 403 }
      );
    }

    // 2. Fetch target item
    const item = await prisma.roadmapItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.roadmapId !== roadmapId) {
      return NextResponse.json(
        { error: "Roadmap item not found" },
        { status: 404 }
      );
    }

    // 3. Optional request body or default toggle
    let isCompleted = !item.isCompleted;
    try {
      const body = await req.json();
      if (typeof body.isCompleted === "boolean") {
        isCompleted = body.isCompleted;
      }
    } catch {
      // no body passed, toggle isCompleted
    }

    const updated = await prisma.roadmapItem.update({
      where: { id: itemId },
      data: { isCompleted },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Failed to update roadmap item:", error);
    return NextResponse.json(
      { error: "Failed to update roadmap item" },
      { status: 500 }
    );
  }
}
