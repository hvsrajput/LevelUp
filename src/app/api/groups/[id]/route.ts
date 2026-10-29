// =============================================================================
// Group Detail API: GET (details + stats + feed), DELETE (owner only)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateUserStreak } from "@/lib/groups/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    // 1. Server-side security check: Only members can see group data
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this group." },
        { status: 403 }
      );
    }

    // 2. Fetch group with members
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const memberUserIds = group.members.map((m) => m.userId);
    const memberMap = new Map(group.members.map((m) => [m.userId, m]));

    // 3. Fetch solved problems for all members
    const solvedProblems = await prisma.problem.findMany({
      where: {
        userId: { in: memberUserIds },
        status: "SOLVED",
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        userId: true,
        solvedAt: true,
        updatedAt: true,
      },
      orderBy: {
        solvedAt: "desc",
      },
    });

    // 4. Fetch recent submissions for activity feed
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        userId: { in: memberUserIds },
      },
      select: {
        id: true,
        language: true,
        userId: true,
        createdAt: true,
        problem: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // 5. Calculate member stats: solved count, current streak, longest streak
    const memberStats = group.members.map((m) => {
      const userSolves = solvedProblems.filter((p) => p.userId === m.userId);
      const dates = userSolves.map((p) => p.solvedAt ?? p.updatedAt);
      const streaks = calculateUserStreak(dates);

      return {
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
        solvedCount: userSolves.length,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
      };
    });

    // Sort member list by solved count descending (leaderboard)
    memberStats.sort((a, b) => b.solvedCount - a.solvedCount);

    // 6. Synthesize activity feed
    const feedEvents: Array<{
      id: string;
      type: "PROBLEM_SOLVED" | "CODE_SUBMISSION" | "MEMBER_JOINED";
      userId: string;
      userName: string;
      userImage?: string | null;
      timestamp: Date;
      details: {
        problemId?: string;
        problemTitle?: string;
        difficulty?: string;
        language?: string;
        role?: string;
      };
    }> = [];

    // Problem solved events
    for (const p of solvedProblems.slice(0, 25)) {
      const member = memberMap.get(p.userId);
      if (!member) continue;
      feedEvents.push({
        id: `solve-${p.id}`,
        type: "PROBLEM_SOLVED",
        userId: p.userId,
        userName: member.user.name || "Member",
        userImage: member.user.image,
        timestamp: p.solvedAt ?? p.updatedAt,
        details: {
          problemId: p.id,
          problemTitle: p.title,
          difficulty: p.difficulty,
        },
      });
    }

    // Code submissions
    for (const s of recentSubmissions) {
      const member = memberMap.get(s.userId);
      if (!member) continue;
      feedEvents.push({
        id: `sub-${s.id}`,
        type: "CODE_SUBMISSION",
        userId: s.userId,
        userName: member.user.name || "Member",
        userImage: member.user.image,
        timestamp: s.createdAt,
        details: {
          problemId: s.problem.id,
          problemTitle: s.problem.title,
          language: s.language,
        },
      });
    }

    // Member join events
    for (const m of group.members) {
      feedEvents.push({
        id: `join-${m.id}`,
        type: "MEMBER_JOINED",
        userId: m.userId,
        userName: m.user.name || "Member",
        userImage: m.user.image,
        timestamp: m.joinedAt,
        details: {
          role: m.role,
        },
      });
    }

    // Sort all events descending by timestamp
    feedEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        joinCode: group.joinCode,
        ownerId: group.ownerId,
        isOwner: group.ownerId === session.user.id,
        currentUserRole: membership.role,
        createdAt: group.createdAt,
        memberCount: group.members.length,
      },
      members: memberStats,
      activityFeed: feedEvents.slice(0, 30),
    });
  } catch (error) {
    console.error("Failed to fetch group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group details" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
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

    // Server-side RBAC: Only owner can delete the group
    if (group.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the group owner can delete this group" },
        { status: 403 }
      );
    }

    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Failed to delete group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
