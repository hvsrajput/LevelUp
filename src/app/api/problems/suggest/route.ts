// =============================================================================
// POST /api/problems/suggest — Grounded RAG Suggestions for Topics & Hints
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { suggestInputSchema } from "@/lib/validators/suggest";
import { generateSuggestions } from "@/lib/rag/service";
import { suggestionCache, ragRateLimiter } from "@/lib/rag/cache";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting check per user
  const rateLimit = ragRateLimiter.check(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting more suggestions.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = suggestInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { title, description, constraints } = parsed.data;

  // Check Cache
  const cacheKey = suggestionCache.generateKey(title, description, constraints);
  const cached = suggestionCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    // Generate grounded suggestions from knowledge base
    const suggestions = await generateSuggestions(parsed.data);

    // Save to Cache
    suggestionCache.set(cacheKey, suggestions);

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("Error generating pattern suggestions:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions. Please try again." },
      { status: 500 }
    );
  }
}
