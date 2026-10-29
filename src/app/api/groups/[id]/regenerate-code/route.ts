// =============================================================================
// Regenerate Join Code API: POST /api/groups/[id]/regenerate-code (Owner only)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/lib/groups/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // RBAC: Only owner can regenerate join code
    if (group.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the group owner can regenerate the join code" },
        { status: 403 }
      );
    }

    // Generate new unique join code
    let newJoinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.group.findUnique({
        where: { joinCode: newJoinCode },
        select: { id: true },
      });
      if (!existing) break;
      newJoinCode = generateJoinCode();
      attempts++;
    }

    const updated = await prisma.group.update({
      where: { id },
      data: { joinCode: newJoinCode },
      select: { joinCode: true },
    });

    return NextResponse.json({
      message: "Join code regenerated successfully",
      joinCode: updated.joinCode,
    });
  } catch (error) {
    console.error("Failed to regenerate join code:", error);
    return NextResponse.json(
      { error: "Failed to regenerate join code" },
      { status: 500 }
    );
  }
}
