// =============================================================================
// Catalog Service: Retrieval and Querying for Seeded Problems
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CURATED_CATALOG_PROBLEMS,
  type CatalogProblemItem,
} from "./catalog-data";

export interface CatalogQueryFilters {
  topic?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "all";
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CatalogQueryResult {
  problems: CatalogProblemItem[];
  total: number;
}

/**
 * Normalizes an in-memory problem item to have a deterministic ID
 */
function toNormalizedItem(p: CatalogProblemItem, index: number): CatalogProblemItem {
  return {
    ...p,
    id: p.id || `catalog-${index + 1}`,
  };
}

/**
 * Retrieve catalog problems with filtering, pagination, and offline fallback
 */
export async function getCatalogProblems(
  filters: CatalogQueryFilters = {}
): Promise<CatalogQueryResult> {
  const { topic, difficulty, search, limit = 50, offset = 0 } = filters;

  // Use in-memory catalog directly in test mode for performance and determinism
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return filterInMemoryCatalog(filters);
  }

  try {
    const where: Prisma.CatalogProblemWhereInput = {};

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { summary: { contains: search.trim(), mode: "insensitive" } },
        { patternTag: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [rawProblems, total] = await Promise.all([
      prisma.catalogProblem.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.catalogProblem.count({ where }),
    ]);

    if (rawProblems.length > 0) {
      let filtered = rawProblems.map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty as "EASY" | "MEDIUM" | "HARD",
        topicTags: Array.isArray(p.topicTags)
          ? (p.topicTags as string[])
          : [],
        patternTag: p.patternTag || "general",
        summary: p.summary,
      }));

      // Filter by topic in topicTags if requested
      if (topic && topic !== "all") {
        filtered = filtered.filter((p) =>
          p.topicTags.some((t) => t.toLowerCase() === topic.toLowerCase())
        );
      }

      return {
        problems: filtered,
        total: topic && topic !== "all" ? filtered.length : total,
      };
    }
  } catch (err) {
    console.warn("Could not query CatalogProblem table, falling back to in-memory:", err);
  }

  // Fallback to in-memory curated catalog
  return filterInMemoryCatalog(filters);
}

/**
 * Filter the in-memory curated catalog
 */
function filterInMemoryCatalog(filters: CatalogQueryFilters): CatalogQueryResult {
  const { topic, difficulty, search, limit = 50, offset = 0 } = filters;
  let items = CURATED_CATALOG_PROBLEMS.map(toNormalizedItem);

  if (difficulty && difficulty !== "all") {
    items = items.filter((p) => p.difficulty === difficulty);
  }

  if (topic && topic !== "all") {
    items = items.filter((p) =>
      p.topicTags.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
    );
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.summary.toLowerCase().includes(term) ||
        p.patternTag.toLowerCase().includes(term)
    );
  }

  const total = items.length;
  const paginated = items.slice(offset, offset + limit);

  return { problems: paginated, total };
}

/**
 * Retrieve a single catalog problem by ID or title
 */
export async function getCatalogProblemById(
  idOrTitle: string
): Promise<CatalogProblemItem | null> {
  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    try {
      const found = await prisma.catalogProblem.findFirst({
        where: {
          OR: [{ id: idOrTitle }, { title: idOrTitle }],
        },
      });

      if (found) {
        return {
          id: found.id,
          title: found.title,
          difficulty: found.difficulty as "EASY" | "MEDIUM" | "HARD",
          topicTags: Array.isArray(found.topicTags)
            ? (found.topicTags as string[])
            : [],
          patternTag: found.patternTag || "general",
          summary: found.summary,
        };
      }
    } catch {
      // fallback
    }
  }

  // Fallback in-memory
  const normalized = CURATED_CATALOG_PROBLEMS.map(toNormalizedItem);
  return (
    normalized.find(
      (p) =>
        p.id === idOrTitle ||
        p.title.toLowerCase() === idOrTitle.toLowerCase()
    ) || null
  );
}
