// =============================================================================
// Catalog API: GET /api/catalog (Query and Filter Seeded Problems)
// =============================================================================

import { NextResponse } from "next/server";
import { getCatalogProblems } from "@/lib/catalog/service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const topic = searchParams.get("topic") || undefined;
  const difficulty = (searchParams.get("difficulty") || undefined) as
    | "EASY"
    | "MEDIUM"
    | "HARD"
    | undefined;
  const search = searchParams.get("search") || undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  try {
    const result = await getCatalogProblems({
      topic,
      difficulty,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to query catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog problems" },
      { status: 500 }
    );
  }
}
