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
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Curated Problem Catalog</h1>
            <Badge variant="secondary" className="gap-1 font-semibold text-xs">
              <BookOpen className="h-3 w-3 text-secondary" />
              Foundations
            </Badge>
          </div>
          <p className="mt-1 text-xs text-secondary">
            A battle-tested set of canonical interview problems categorized by algorithmic pattern and topic.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary" />
          <Input
            placeholder="Search catalog problems, summaries, or pattern tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-tint/60 border border-border/70 rounded-lg h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-[150px]">
            <Select
              value={topic}
              onValueChange={(val) => {
                if (val) setTopic(val);
              }}
            >
              <SelectTrigger className="h-9 bg-tint/60 border border-border/70 rounded-lg text-xs">
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

          <div className="w-[130px]">
            <Select
              value={difficulty}
              onValueChange={(val) => {
                if (val) setDifficulty(val);
              }}
            >
              <SelectTrigger className="h-9 bg-tint/60 border border-border/70 rounded-lg text-xs">
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
      <div className="flex items-center justify-between text-xs font-mono tabular-nums text-secondary px-1">
        <span>Showing {problems.length} of {total} curated problems</span>
      </div>

      {/* Problems Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs animate-pulse">
              <div className="h-5 w-2/3 rounded-md bg-tint mb-3" />
              <div className="h-16 w-full rounded-lg bg-tint" />
            </Card>
          ))}
        </div>
      ) : problems.length === 0 ? (
        <Card className="rounded-xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-2.5 p-0">
            <Filter className="h-7 w-7 text-secondary" />
            <h3 className="text-base font-bold text-foreground">No problems match your filter</h3>
            <p className="text-xs text-secondary max-w-sm">
              Try adjusting your search terms, topic selection, or difficulty level.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, idx) => (
            <Card key={p.id || idx} className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold leading-snug text-foreground">
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
                    className="shrink-0 text-xs px-2 py-0.5 font-semibold rounded-md"
                  >
                    {p.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.topicTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs px-2 py-0.5 rounded-md bg-tint/60 border-border/70 text-secondary font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5 font-mono text-secondary rounded-md bg-tint/40 border-border/70"
                  >
                    #{p.patternTag}
                  </Badge>
                </div>
                <p className="text-xs text-secondary line-clamp-3 leading-relaxed pt-0.5">
                  {p.summary}
                </p>
              </div>

              <div className="pt-3.5 border-t border-border/40 mt-3.5">
                <Button asChild size="sm" className="w-full h-8 gap-1.5 rounded-lg font-semibold text-xs shadow-xs">
                  <Link href={`/problems/new?catalogId=${encodeURIComponent(p.id || p.title)}`}>
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
