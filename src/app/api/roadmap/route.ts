// =============================================================================
// Roadmap API: GET (user's active roadmap with progress), POST (generate roadmap)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateAndPersistRoadmap,
  getUserRoadmapWithProgress,
} from "@/lib/recommendations/roadmap";
import { generateRoadmapSchema } from "@/lib/validators/roadmap";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getUserRoadmapWithProgress(session.user.id);
    return NextResponse.json({ roadmap: data });
  } catch (error) {
    console.error("Failed to fetch roadmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap" },
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
    const parsed = generateRoadmapSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { goal, level, timeline } = parsed.data;

    await generateAndPersistRoadmap({
      userId: session.user.id,
      goal,
      level,
      timeline,
    });

    const refreshed = await getUserRoadmapWithProgress(session.user.id);
    return NextResponse.json({ roadmap: refreshed }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate roadmap:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
