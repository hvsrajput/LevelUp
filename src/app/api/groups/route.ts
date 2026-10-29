// =============================================================================
// Groups API: GET (list user's groups), POST (create group)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validators/group";
import { generateJoinCode } from "@/lib/groups/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all memberships for the current user
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      joinCode: m.group.joinCode,
      ownerId: m.group.ownerId,
      isOwner: m.group.ownerId === session.user.id,
      role: m.role,
      memberCount: m.group._count.members,
      joinedAt: m.joinedAt,
      createdAt: m.group.createdAt,
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createGroupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Retry loop to guarantee join code uniqueness in rare collision case
    let joinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.group.findUnique({
        where: { joinCode },
        select: { id: true },
      });
      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    // Create group and add owner as member in a transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name,
          joinCode,
          ownerId: session.user.id,
          members: {
            create: {
              userId: session.user.id,
              role: "OWNER",
            },
          },
        },
        include: {
          members: true,
        },
      });
      return created;
    });

    return NextResponse.json(
      {
        group: {
          id: newGroup.id,
          name: newGroup.name,
          joinCode: newGroup.joinCode,
          ownerId: newGroup.ownerId,
          isOwner: true,
          role: "OWNER",
          memberCount: 1,
          createdAt: newGroup.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
