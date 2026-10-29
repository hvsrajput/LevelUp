// =============================================================================
// Member Management API: DELETE /api/groups/[id]/members/[userId]
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

export async function DELETE(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, userId: targetUserId } = await context.params;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Owner cannot be removed/leave without deleting the group
    if (targetUserId === group.ownerId) {
      return NextResponse.json(
        {
          error:
            "The group owner cannot leave or be removed. Delete the group instead.",
        },
        { status: 400 }
      );
    }

    // Check authorization: must be either the group owner (kicking a member)
    // or the member themselves (voluntarily leaving)
    const isOwner = group.ownerId === session.user.id;
    const isSelf = targetUserId === session.user.id;

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only the group owner can remove members, or members can leave voluntarily.",
        },
        { status: 403 }
      );
    }

    // Check if membership exists
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found in this group" },
        { status: 404 }
      );
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    return NextResponse.json({
      message: isSelf
        ? "You have left the group."
        : "Member removed from the group.",
    });
  } catch (error) {
    console.error("Failed to remove group member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
