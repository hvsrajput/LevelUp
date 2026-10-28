// =============================================================================
// Problem list page — shows all user's problems with filtering
// =============================================================================
// This is a CLIENT component because it manages filter state and fetches
// data dynamically. In Phase 2 we'll add more sophisticated filtering UI.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProblemCard } from "@/components/problem-card";
import { Plus, Search, Loader2 } from "lucide-react";

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
  topics: { topic: { name: string } }[];
  _count?: { submissions: number };
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
// Component
// ---------------------------------------------------------------------------

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
        });
        if (search) params.set("search", search);
        if (difficulty !== "all") params.set("difficulty", difficulty);
        if (status !== "all") params.set("status", status);

        const res = await fetch(`/api/problems?${params}`);
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
  }, [pagination.page, pagination.limit, search, difficulty, status]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setIsLoading(true);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Problems</h1>
          <p className="mt-1 text-muted-foreground">
            {pagination.total} problem{pagination.total !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Button asChild>
          <Link href="/problems/new">
            <Plus className="mr-2 h-4 w-4" /> Add Problem
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search problems..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={difficulty}
          onValueChange={(v) => {
            if (v) {
              setDifficulty(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            if (v) {
              setStatus(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ATTEMPTED">Attempted</SelectItem>
            <SelectItem value="SOLVED">Solved</SelectItem>
            <SelectItem value="REVISIT">Revisit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Problem List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <p className="mb-4 text-lg text-muted-foreground">
            {search || difficulty !== "all" || status !== "all"
              ? "No problems match your filters."
              : "No problems yet. Start tracking your DSA practice!"}
          </p>
          <Button asChild>
            <Link href="/problems/new">
              <Plus className="mr-2 h-4 w-4" /> Add Your First Problem
            </Link>
          </Button>
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
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
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
