// =============================================================================
// Dashboard Progress Snapshot Card (Replaces Heatmap)
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Trophy,
  AlertCircle,
  Sparkles,
  Target,
  ArrowRight,
  Plus,
  Compass,
  CheckCircle2,
  Map,
} from "lucide-react";
import type { ProgressSnapshotData, TopicItem } from "@/lib/recommendations/progress-snapshot";
import type { StreakResult } from "@/lib/streak";

interface ProgressSnapshotResponse {
  snapshot: ProgressSnapshotData;
  streak: StreakResult;
}

export function ProgressSnapshotCard() {
  const [data, setData] = useState<ProgressSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch("/api/progress-snapshot")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: ProgressSnapshotResponse | null) => {
        if (!ignore && json) {
          setData(json);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="p-5 rounded-xl border border-border/70 bg-card">
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-tint" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/4 rounded bg-tint" />
            <div className="h-3 w-1/2 rounded bg-tint" />
          </div>
        </div>
      </Card>
    );
  }

  const streak = data?.streak || {
    current: 0,
    longest: 0,
    solvedToday: false,
    atRisk: false,
    lastSolveDay: null,
  };

  const snapshot = data?.snapshot;

  // Empty state: no problems and no roadmap
  if (!snapshot || snapshot.isEmpty) {
    return (
      <Card className="rounded-xl border border-dashed border-border/80 bg-card p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-muted-foreground shrink-0">
              <Compass className="h-5 w-5 text-accent-orange" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Progress Snapshot
              </CardTitle>
              <p className="text-xs text-secondary mt-0.5 font-medium">
                No problems or active roadmap yet. Start your journey by adding a problem or generating a roadmap.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-xs font-semibold">
              <Link href="/problems/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Problem
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-lg h-8 text-xs font-semibold">
              <Link href="/roadmap">
                <Map className="mr-1.5 h-3.5 w-3.5" />
                Create Roadmap
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-border/70 bg-card overflow-hidden">
      {/* Header with Streak indicator */}
      <CardHeader className="p-4 sm:p-5 pb-3.5 border-b border-border/50 bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors shrink-0 ${
                streak.current > 0
                  ? "bg-[#FFE5C4]/70 text-accent-orange dark:bg-orange-500/20"
                  : "bg-tint text-muted-foreground"
              }`}
            >
              <Flame
                className={`h-5 w-5 ${
                  streak.current > 0 ? "fill-accent-orange text-accent-orange" : ""
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Progress Snapshot
                </CardTitle>
                {streak.current > 0 && (
                  <Badge
                    variant="streak"
                    className="gap-1 text-xs font-semibold"
                  >
                    <Flame className="h-3 w-3 fill-accent-orange text-accent-orange" />
                    <span className="tabular-nums">{streak.current}d</span> Streak
                  </Badge>
                )}
                {streak.current > 0 && streak.solvedToday && (
                  <Badge variant="solved" className="gap-1 text-xs font-semibold hidden sm:inline-flex">
                    <Sparkles className="h-3 w-3" />
                    Extended Today
                  </Badge>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5 font-medium">
                Current topic coverage and recommended curriculum progression.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-xs font-semibold text-foreground border border-border/50">
              <Trophy className="h-3.5 w-3.5 text-accent-orange" />
              <span className="text-secondary font-medium">Best:</span>
              <span className="font-bold text-foreground tabular-nums">{streak.longest}d</span>
            </div>
          </div>
        </div>

        {/* At-risk Warning Alert */}
        {streak.atRisk && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent-orange/30 bg-[#FFE5C4]/40 dark:bg-orange-950/30 px-3.5 py-2 text-xs font-medium text-[#8F4A0B] dark:text-[#FFE5C4]">
            <AlertCircle className="h-4 w-4 shrink-0 text-accent-orange" />
            <span>
              Streak at risk! Solve a problem before midnight to keep your {streak.current}-day streak alive!
            </span>
          </div>
        )}
      </CardHeader>

      {/* 3 Main Items Grid */}
      <CardContent className="p-4 sm:p-5 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4">
          {/* Item 1: Solved / Total Added with Progress Bar */}
          <div className="rounded-lg border border-border/60 bg-tint/30 p-3.5 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
                Problem Completion
              </span>
              <span className="text-xs font-bold text-foreground tabular-nums">
                {snapshot.percentage}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                  {snapshot.solvedCount}
                  <span className="text-xs font-medium text-text-muted"> / {snapshot.totalCount}</span>
                </span>
                <span className="text-xs font-medium text-secondary">
                  total added
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted-tint">
                <div
                  className="h-full rounded-full bg-accent-green transition-all duration-500"
                  style={{ width: `${snapshot.percentage}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-text-muted">
              Includes all catalog, manual, and LeetCode imported problems.
            </p>
          </div>

          {/* Item 2: Current Topic */}
          <div className="rounded-lg border border-border/60 bg-tint/30 p-3.5 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-accent-orange" />
                Current Topic
              </span>
              {snapshot.currentTopic && (
                <SourceBadge source={snapshot.currentTopic.sourceLabel} />
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                {snapshot.currentTopic?.name || "None in progress"}
              </h4>
              <p className="text-xs text-secondary leading-snug">
                {snapshot.currentTopic?.reason || "No active topic detected."}
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/problems"
                className="text-xs font-semibold text-accent-orange hover:underline inline-flex items-center gap-1"
              >
                Practice problems
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Item 3: Next Topic */}
          <div className="rounded-lg border border-border/60 bg-tint/30 p-3.5 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-indigo-500" />
                Next Topic
              </span>
              {snapshot.nextTopic && (
                <SourceBadge source={snapshot.nextTopic.sourceLabel} />
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                {snapshot.nextTopic?.name || "Curriculum completed"}
              </h4>
              <p className="text-xs text-secondary leading-snug">
                {snapshot.nextTopic?.reason || "You have covered all curriculum topics!"}
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/roadmap"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                View roadmap
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ source }: { source: TopicItem["sourceLabel"] }) {
  if (source === "From roadmap") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 border-indigo-500/40 text-indigo-600 bg-indigo-500/10 font-bold"
      >
        From roadmap
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 border-accent-orange/40 text-accent-orange bg-pill-streak-bg/30 font-bold"
    >
      From your problems
    </Badge>
  );
}
