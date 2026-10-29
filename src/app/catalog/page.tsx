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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { difficultyColor } from "@/lib/utils";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Curated Problem Catalog</h1>
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              Foundations
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            A battle-tested set of canonical interview problems categorized by algorithmic pattern and topic.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search catalog problems, summaries, or pattern tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
              <SelectTrigger>
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
              <SelectTrigger>
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
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Showing {problems.length} of {total} curated problems</span>
      </div>

      {/* Problems Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/30" />
              <CardContent className="h-28 bg-muted/20" />
            </Card>
          ))}
        </div>
      ) : problems.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <Filter className="h-8 w-8 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold">No problems match your filter</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Try adjusting your search terms, topic selection, or difficulty level.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, idx) => (
            <Card key={p.id || idx} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold leading-snug">
                    {p.title}
                  </CardTitle>
                  <Badge
                    className={`shrink-0 text-[11px] px-2 py-0.5 ${difficultyColor(
                      p.difficulty
                    )}`}
                  >
                    {p.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {p.topicTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground"
                  >
                    #{p.patternTag}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {p.summary}
                </p>
              </CardContent>

              <CardFooter className="pt-2 border-t bg-muted/20">
                <Button asChild size="sm" className="w-full gap-2">
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
              </CardFooter>
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
