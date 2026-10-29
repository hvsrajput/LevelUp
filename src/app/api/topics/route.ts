// =============================================================================
// GET /api/topics — List all topics with problem counts
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all topics and count problems associated with the current user
  const topics = await prisma.topic.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          problems: {
            where: {
              problem: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const formatted = topics.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t._count.problems,
  }));

  return NextResponse.json(formatted);
}
