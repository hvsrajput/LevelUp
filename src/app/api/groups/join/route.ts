// =============================================================================
// Join Group API: POST /api/groups/join
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinGroupSchema } from "@/lib/validators/group";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = joinGroupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid join code format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { joinCode } = parsed.data;

    // Look up group by join code
    const group = await prisma.group.findUnique({
      where: { joinCode },
      select: { id: true, name: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Invalid join code. No group found." },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          message: "You are already a member of this group",
          groupId: group.id,
          groupName: group.name,
        },
        { status: 200 }
      );
    }

    // Add user as MEMBER
    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json(
      {
        message: `Successfully joined ${group.name}!`,
        groupId: group.id,
        groupName: group.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to join group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
