// Custom Roadmap API: POST (save custom roadmap)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseRoadmapText } from "@/lib/custom-roadmap/parser";
import { saveCustomRoadmap } from "@/lib/recommendations/roadmap";
import { safeRevalidatePath } from "@/lib/server-utils";
import type { RoadmapDraft } from "@/lib/custom-roadmap/types";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let draft: RoadmapDraft;

    if (body.text && typeof body.text === "string") {
      const { draft: parsedDraft, issues } = parseRoadmapText(
        body.text,
        body.title || "Custom Roadmap"
      );
      const blockingErrors = issues.filter((i) => i.type === "error");
      if (blockingErrors.length > 0) {
        return NextResponse.json(
          {
            error: "Cannot save roadmap with blocking errors.",
            issues: blockingErrors,
          },
          { status: 400 }
        );
      }
      draft = parsedDraft;
    } else if (body.draft && Array.isArray(body.draft.weeks)) {
      draft = body.draft;
    } else {
      return NextResponse.json(
        { error: "Invalid request payload. Expected draft or text." },
        { status: 400 }
      );
    }

    if (draft.weeks.length === 0) {
      return NextResponse.json(
        { error: "Roadmap must have at least one week." },
        { status: 400 }
      );
    }

    const refreshed = await saveCustomRoadmap({
      userId: session.user.id,
      draft,
    });

    safeRevalidatePath("/roadmap");
    return NextResponse.json({ roadmap: refreshed }, { status: 201 });
  } catch (error) {
    console.error("Failed to save custom roadmap:", error);
    return NextResponse.json(
      { error: "Failed to save custom roadmap" },
      { status: 500 }
    );
  }
}
