// =============================================================================
// LeetCode Account Link API: GET (link status) and POST (link/unlink username)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeetCodeClient } from "@/lib/leetcode/client";
import { linkLeetCodeSchema } from "@/lib/validators/leetcode";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { leetcodeUsername: true },
    });

    return NextResponse.json({
      username: user?.leetcodeUsername || null,
      isLinked: Boolean(user?.leetcodeUsername),
    });
  } catch (error) {
    console.error("Failed to check LeetCode link status:", error);
    return NextResponse.json(
      { error: "Failed to check LeetCode link status" },
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
    const json = await req.json().catch(() => ({}));

    // Handle Unlink request
    if (json.action === "unlink" || json.username === null || json.username === "") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { leetcodeUsername: null },
      });

      return NextResponse.json({
        success: true,
        isLinked: false,
        username: null,
        message: "LeetCode account successfully unlinked.",
      });
    }

    // Validate link input
    const parsed = linkLeetCodeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    // Check if another user has already linked this username
    const existing = await prisma.user.findFirst({
      where: {
        leetcodeUsername: username,
        NOT: { id: session.user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This LeetCode username is already linked to another account." },
        { status: 409 }
      );
    }

    // Verify username with LeetCode client
    const client = getLeetCodeClient();
    const verification = await client.verifyUsername(username);

    if (!verification.valid) {
      return NextResponse.json(
        {
          error:
            "LeetCode username does not exist or profile is not publicly accessible.",
        },
        { status: 400 }
      );
    }

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: { leetcodeUsername: username },
    });

    return NextResponse.json({
      success: true,
      isLinked: true,
      username,
      totalSolved: verification.totalSolved,
      ranking: verification.ranking,
      message: `Successfully linked LeetCode profile for ${username}.`,
    });
  } catch (error) {
    console.error("Failed to link LeetCode profile:", error);
    return NextResponse.json(
      { error: "Failed to link LeetCode profile" },
      { status: 500 }
    );
  }
}
