// =============================================================================
// Daily Question Widget with Explainability
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { difficultyColor } from "@/lib/utils";
import { Calendar, Flame, Sparkles, ArrowRight, RotateCcw } from "lucide-react";

interface DailyQuestionData {
  dailyQuestionId: string;
  date: string;
  problem: {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topicTags: string[];
    summary: string;
    source: "CATALOG" | "USER_PROBLEM";
  };
  reason: string;
  isSpacedRepetition: boolean;
}

export function DailyQuestionCard() {
  const [data, setData] = useState<DailyQuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/daily-question");
        if (res.ok && !ignore) {
          const json = await res.json();
          setData(json);
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
  }, []);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-16 bg-muted/40" />
        <CardContent className="h-28 bg-muted/20" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-card to-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-bold">Daily Challenge</CardTitle>
          </div>
          {data.isSpacedRepetition ? (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]">
              <RotateCcw className="h-3 w-3" />
              Spaced Repetition
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Flame className="h-3 w-3 text-orange-500" />
              Progressive Difficulty
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-lg font-bold hover:text-primary transition-colors">
              {data.problem.title}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge
                className={`text-[10px] px-1.5 py-0 ${difficultyColor(
                  data.problem.difficulty
                )}`}
              >
                {data.problem.difficulty}
              </Badge>
              {data.problem.topicTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {data.problem.summary}
        </p>

        {/* Explainability Box */}
        <div className="rounded-md border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-semibold text-foreground text-[11px] mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Why this question was picked:
          </div>
          <p className="leading-relaxed">{data.reason}</p>
        </div>

        <div className="pt-1">
          <Button asChild size="sm" className="w-full gap-2">
            <Link
              href={
                data.problem.source === "USER_PROBLEM"
                  ? `/problems/${data.problem.id}`
                  : `/problems/new?title=${encodeURIComponent(
                      data.problem.title
                    )}&difficulty=${data.problem.difficulty}&description=${encodeURIComponent(
                      data.problem.summary
                    )}`
              }
            >
              Start Solving
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
