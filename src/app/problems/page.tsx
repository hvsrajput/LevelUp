// =============================================================================
// Problem list page — shows user's problems with comprehensive search & filtering
// =============================================================================

"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProblemCard } from "@/components/problem-card";
import { DailyQuestionCard } from "@/components/daily-question-card";
import { NextQuestionCard } from "@/components/next-question-card";
import { StreakCard } from "@/components/streak-card";
import { LeetCodeSyncModal } from "@/components/leetcode/leetcode-sync-modal";
import { LeetCodeImportDialog } from "@/components/leetcode/leetcode-import-dialog";
import {
  Plus,
  Search,
  Loader2,
  X,
  FilterX,
  SlidersHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Problem {
  id: string;
  shortCode: string;
  title: string;
  difficulty: string;
  status: string;
  source: string;
  createdAt: string;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  topics: { topic: { name: string } }[];
  _count?: { submissions: number };
}

interface TopicOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface PaginatedResponse {
  data: Problem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Main Content Component
// ---------------------------------------------------------------------------

function ProblemsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Initialize filters from URL search params
  const initialSearch = searchParams.get("search") || "";
  const initialDifficulty = searchParams.get("difficulty") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialTopic = searchParams.get("topic") || "all";
  const initialTimeframe = searchParams.get("timeframe") || "all";
  const initialSortBy = searchParams.get("sortBy") || "createdAt_desc";
  const initialPage = Number(searchParams.get("page")) || 1;

  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [difficulty, setDifficulty] = useState<string>(initialDifficulty);
  const [status, setStatus] = useState<string>(initialStatus);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [timeframe, setTimeframe] = useState<string>(initialTimeframe);
  const [sortOption, setSortOption] = useState<string>(initialSortBy);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch topics list once
  useEffect(() => {
    let ignore = false;
    fetch("/api/topics")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: TopicOption[]) => {
        if (!ignore && Array.isArray(data)) {
          setTopics(data);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  // Sync state to URL and fetch problems
  useEffect(() => {
    let ignore = false;

    // Calculate 'from' date based on timeframe
    let fromDate: string | undefined;
    if (timeframe === "7d") {
      fromDate = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (timeframe === "30d") {
      fromDate = new Date(Date.now() - 30 * 86400000).toISOString();
    } else if (timeframe === "90d") {
      fromDate = new Date(Date.now() - 90 * 86400000).toISOString();
    }

    const [sortBy, sortOrder] = sortOption.split("_");

    const query = new URLSearchParams();
    query.set("page", String(pagination.page));
    query.set("limit", String(pagination.limit));
    if (search) query.set("search", search);
    if (difficulty !== "all") query.set("difficulty", difficulty);
    if (status !== "all") query.set("status", status);
    if (topic !== "all") query.set("topic", topic);
    if (timeframe !== "all") query.set("timeframe", timeframe);
    if (fromDate) query.set("from", fromDate);
    if (sortBy) query.set("sortBy", sortBy);
    if (sortOrder) query.set("sortOrder", sortOrder);

    // Update browser URL query string without reloading
    startTransition(() => {
      const urlQuery = new URLSearchParams(query);
      if (timeframe !== "all") urlQuery.set("timeframe", timeframe);
      urlQuery.delete("from"); // internal API param
      router.replace(`/problems?${urlQuery.toString()}`, { scroll: false });
    });

    async function load() {
      try {
        const res = await fetch(`/api/problems?${query.toString()}`);
        if (res.ok && !ignore) {
          const data: PaginatedResponse = await res.json();
          setProblems(data.data);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch problems:", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [
    pagination.page,
    pagination.limit,
    search,
    difficulty,
    status,
    topic,
    timeframe,
    sortOption,
    refreshKey,
    router,
  ]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setIsLoading(true);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasActiveFilters =
    search !== "" ||
    difficulty !== "all" ||
    status !== "all" ||
    topic !== "all" ||
    timeframe !== "all" ||
    sortOption !== "createdAt_desc";

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setDifficulty("all");
    setStatus("all");
    setTopic("all");
    setTimeframe("all");
    setSortOption("createdAt_desc");
    setIsLoading(true);
    setPagination((p) => ({ ...p, page: 1 }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Problems</h1>
          <p className="mt-1 text-sm font-medium text-secondary">
            {pagination.total} problem{pagination.total !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <LeetCodeImportDialog onImportComplete={() => setRefreshKey((k) => k + 1)} />
          <LeetCodeSyncModal onSyncComplete={() => setRefreshKey((k) => k + 1)} />
          <Button asChild className="rounded-[14px] shadow-sm">
            <Link href="/problems/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add Problem
            </Link>
          </Button>
        </div>
      </div>

      {/* Daily Streak Card & 12-Week Practice Heatmap */}
      <div className="mb-6">
        <StreakCard />
      </div>

      {/* RAG-Powered Learning Widgets: Daily Challenge & Recommended Next */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <DailyQuestionCard />
        <NextQuestionCard />
      </div>

      {/* Filter Bar */}
      <div className="mb-6 space-y-3.5 rounded-[20px] border border-border/70 bg-card p-4 sm:p-5 shadow-soft">
        {/* Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <Input
              className="pl-10 pr-9 text-sm bg-tint border-transparent rounded-[14px] h-10"
              placeholder="Search title, description, notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <Select
              value={sortOption}
              onValueChange={(v) => {
                if (v) {
                  setIsLoading(true);
                  setSortOption(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }
              }}
            >
              <SelectTrigger className="w-[170px] text-xs h-10 bg-tint border-transparent rounded-[14px]">
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-secondary" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt_desc">Newest Added</SelectItem>
                <SelectItem value="createdAt_asc">Oldest Added</SelectItem>
                <SelectItem value="solvedAt_desc">Recently Solved</SelectItem>
                <SelectItem value="difficulty_asc">Difficulty</SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-secondary hover:text-foreground rounded-[14px] h-10"
              >
                <FilterX className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills / Dropdowns Row */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Difficulty */}
          <Select
            value={difficulty}
            onValueChange={(v) => {
              if (v) {
                setIsLoading(true);
                setDifficulty(v);
                setPagination((p) => ({ ...p, page: 1 }));
              }
            }}
          >
            <SelectTrigger className="text-xs h-10 bg-tint border-transparent rounded-[14px]">
              <span className="text-secondary mr-1">Diff:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={status}
            onValueChange={(v) => {
              if (v) {
                setIsLoading(true);
                setStatus(v);
                setPagination((p) => ({ ...p, page: 1 }));
              }
            }}
          >
            <SelectTrigger className="text-xs h-10 bg-tint border-transparent rounded-[14px]">
              <span className="text-secondary mr-1">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ATTEMPTED">Attempted</SelectItem>
              <SelectItem value="SOLVED">Solved</SelectItem>
              <SelectItem value="REVISIT">Revisit</SelectItem>
            </SelectContent>
          </Select>

          {/* Topic */}
          <Select
            value={topic}
            onValueChange={(v) => {
              if (v) {
                setIsLoading(true);
                setTopic(v);
                setPagination((p) => ({ ...p, page: 1 }));
              }
            }}
          >
            <SelectTrigger className="text-xs h-10 bg-tint border-transparent rounded-[14px]">
              <span className="text-secondary mr-1">Topic:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.slug}>
                  {t.name} ({t.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Timeframe */}
          <Select
            value={timeframe}
            onValueChange={(v) => {
              if (v) {
                setIsLoading(true);
                setTimeframe(v);
                setPagination((p) => ({ ...p, page: 1 }));
              }
            }}
          >
            <SelectTrigger className="text-xs h-10 bg-tint border-transparent rounded-[14px]">
              <span className="text-secondary mr-1">Date:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Past 7 Days</SelectItem>
              <SelectItem value="30d">Past 30 Days</SelectItem>
              <SelectItem value="90d">Past 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 mt-3">
            <span className="text-[11px] font-semibold text-secondary">Active:</span>
            {search && (
              <Badge variant="secondary" className="gap-1 text-[11px] rounded-full py-1 px-3">
                Search: &ldquo;{search}&rdquo;
                <X
                  className="h-3 w-3 cursor-pointer text-secondary hover:text-foreground"
                  onClick={() => setSearchInput("")}
                />
              </Badge>
            )}
            {difficulty !== "all" && (
              <Badge variant="secondary" className="gap-1 text-[11px] rounded-full py-1 px-3">
                {difficulty}
                <X
                  className="h-3 w-3 cursor-pointer text-secondary hover:text-foreground"
                  onClick={() => setDifficulty("all")}
                />
              </Badge>
            )}
            {status !== "all" && (
              <Badge variant="secondary" className="gap-1 text-[11px] rounded-full py-1 px-3">
                {status}
                <X
                  className="h-3 w-3 cursor-pointer text-secondary hover:text-foreground"
                  onClick={() => setStatus("all")}
                />
              </Badge>
            )}
            {topic !== "all" && (
              <Badge variant="secondary" className="gap-1 text-[11px] rounded-full py-1 px-3">
                Topic: {topics.find((t) => t.slug === topic)?.name || topic}
                <X
                  className="h-3 w-3 cursor-pointer text-secondary hover:text-foreground"
                  onClick={() => setTopic("all")}
                />
              </Badge>
            )}
            {timeframe !== "all" && (
              <Badge variant="secondary" className="gap-1 text-[11px] rounded-full py-1 px-3">
                Time: {timeframe}
                <X
                  className="h-3 w-3 cursor-pointer text-secondary hover:text-foreground"
                  onClick={() => setTimeframe("all")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Problem List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border/80 bg-card/60 p-12 text-center shadow-soft">
          <p className="mb-4 text-base font-medium text-secondary">
            {hasActiveFilters
              ? "No problems match your search criteria."
              : "No problems yet. Start tracking your DSA practice!"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-[14px]">
              Clear All Filters
            </Button>
          ) : (
            <Button asChild className="rounded-[14px]">
              <Link href="/problems/new">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Problem
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-[14px] bg-card border-border/70"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-secondary px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-[14px] bg-card border-border/70"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProblemsPageContent />
    </Suspense>
  );
}
