// =============================================================================
// Catalog Page: Curated Problem Library & Direct Problem Importer
// =============================================================================

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Plus,
  Loader2,
  Filter,
} from "lucide-react";

interface CatalogItem {
  id?: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topicTags: string[];
  patternTag: string;
  summary: string;
  leetcodeQuestionId?: number;
  url?: string | null;
}

const TOPICS = [
  "All",
  "Array",
  "Hash Table",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Tree",
  "Graph",
  "Dynamic Programming",
];

function CatalogContent() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [topic, setTopic] = useState(searchParams.get("topic") || "All");
  const [difficulty, setDifficulty] = useState(
    searchParams.get("difficulty") || "all"
  );

  const [problems, setProblems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const query = new URLSearchParams();
        if (search.trim()) query.set("search", search.trim());
        if (topic !== "All") query.set("topic", topic);
        if (difficulty !== "all") query.set("difficulty", difficulty);
        query.set("limit", "100");

        const res = await fetch(`/api/catalog?${query.toString()}`);
        if (res.ok && !ignore) {
          const json = await res.json();
          setProblems(json.problems || []);
          setTotal(json.total || 0);
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [search, topic, difficulty]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Curated Problem Catalog</h1>
            <Badge variant="secondary" className="gap-1 font-semibold text-xs">
              <BookOpen className="h-3 w-3 text-secondary" />
              Foundations
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-secondary">
            A battle-tested set of canonical interview problems categorized by algorithmic pattern and topic.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 sm:p-5 rounded-[20px] border border-border/70 shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <Input
            placeholder="Search catalog problems, summaries, or pattern tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm bg-tint border-transparent rounded-[14px] h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[160px]">
            <Select
              value={topic}
              onValueChange={(val) => {
                if (val) setTopic(val);
              }}
            >
              <SelectTrigger className="h-10 bg-tint border-transparent rounded-[14px] text-xs">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "All" ? "All Topics" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select
              value={difficulty}
              onValueChange={(val) => {
                if (val) setDifficulty(val);
              }}
            >
              <SelectTrigger className="h-10 bg-tint border-transparent rounded-[14px] text-xs">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-semibold text-secondary px-1">
        <span>Showing {problems.length} of {total} curated problems</span>
      </div>

      {/* Problems Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-[24px] border border-border/70 bg-card p-6 shadow-soft animate-pulse">
              <div className="h-10 w-2/3 rounded-[12px] bg-tint mb-4" />
              <div className="h-20 w-full rounded-[14px] bg-tint" />
            </Card>
          ))}
        </div>
      ) : problems.length === 0 ? (
        <Card className="rounded-[24px] border border-dashed border-border/80 bg-card/60 p-16 text-center shadow-soft">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <Filter className="h-8 w-8 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">No problems match your filter</h3>
            <p className="text-xs text-secondary max-w-sm">
              Try adjusting your search terms, topic selection, or difficulty level.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, idx) => (
            <Card key={p.id || idx} className="rounded-[24px] border border-border/70 bg-card p-6 shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold leading-snug text-foreground">
                    {p.title}
                  </h3>
                  <Badge
                    variant={
                      p.difficulty.toLowerCase() === "easy"
                        ? "easy"
                        : p.difficulty.toLowerCase() === "medium"
                        ? "medium"
                        : "hard"
                    }
                    className="shrink-0 text-[11px] px-2 py-0.5 font-semibold"
                  >
                    {p.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.topicTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-tint/60 border-border/70 text-secondary font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 font-mono text-secondary rounded-full bg-tint/40 border-border/70"
                  >
                    #{p.patternTag}
                  </Badge>
                </div>
                <p className="text-xs text-secondary line-clamp-3 leading-relaxed pt-1">
                  {p.summary}
                </p>
              </div>

              <div className="pt-5 border-t border-border/40 mt-4">
                <Button asChild size="sm" className="w-full gap-2 rounded-[14px] font-semibold text-xs shadow-sm">
                  <Link
                    href={`/problems/new?title=${encodeURIComponent(
                      p.title
                    )}&difficulty=${p.difficulty}&description=${encodeURIComponent(
                      p.summary
                    )}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Track in My Problems
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
