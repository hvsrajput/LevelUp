// =============================================================================
// Roadmap API: GET (user's active roadmap with progress), POST (generate roadmap)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateAndPersistRoadmap,
  getUserRoadmapWithProgress,
  validateDsaRelevance,
} from "@/lib/recommendations/roadmap";
import { generateRoadmapSchema } from "@/lib/validators/roadmap";

export const maxDuration = 60;

// In-memory sliding window rate limiter: userId -> timestamp[]
const userGenerationTimestamps = new Map<string, number[]>();

export function checkRoadmapRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1-minute sliding window
  const maxPerWindow = 3; // at most 3 generations per minute

  const timestamps = userGenerationTimestamps.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxPerWindow) {
    const oldest = recent[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  userGenerationTimestamps.set(userId, recent);
  return { allowed: true };
}

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

  // Rate limit generation per user
  const rateLimit = checkRoadmapRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Please wait ${rateLimit.retryAfter || 15} seconds before generating another roadmap.`,
      },
      { status: 429 }
    );
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

    // Check DSA relevance & vagueness
    const relevance = validateDsaRelevance(goal);
    if (!relevance.isValid) {
      return NextResponse.json(
        { error: relevance.error },
        { status: 400 }
      );
    }

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
