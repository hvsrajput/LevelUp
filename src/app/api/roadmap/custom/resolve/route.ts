// Custom Roadmap Resolution API: POST (preview match status)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseRoadmapText } from "@/lib/custom-roadmap/parser";
import { resolveDraft } from "@/lib/custom-roadmap/resolve";
import type { RoadmapDraft, Issue } from "@/lib/custom-roadmap/types";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let draft: RoadmapDraft;
    let issues: Issue[] = [];

    if (body.text && typeof body.text === "string") {
      const parsed = parseRoadmapText(body.text, body.title || "Custom Roadmap");
      draft = parsed.draft;
      issues = parsed.issues;
    } else if (body.draft && Array.isArray(body.draft.weeks)) {
      draft = body.draft;
      issues = body.issues || [];
    } else {
      return NextResponse.json(
        { error: "Invalid request payload. Expected draft or text." },
        { status: 400 }
      );
    }

    const resolved = await resolveDraft(draft, session.user.id, issues);
    return NextResponse.json({ resolved });
  } catch (error) {
    console.error("Failed to resolve roadmap draft:", error);
    return NextResponse.json(
      { error: "Failed to resolve roadmap draft" },
      { status: 500 }
    );
  }
}
