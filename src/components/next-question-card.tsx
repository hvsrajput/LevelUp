// =============================================================================
// Next Question Recommender Widget with Explainability
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolveButton } from "@/components/solve-button";
import { Compass, Sparkles, RotateCcw, Map } from "lucide-react";

interface NextQuestionData {
  problem: {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topicTags: string[];
    summary: string;
    source: "CATALOG" | "USER_PROBLEM";
    url?: string | null;
    isRevisit?: boolean;
  };
  reason: string;
  retrievedContext: {
    recommendationType:
      | "REVISIT"
      | "ROADMAP_PROGRESSION"
      | "WEAK_TOPIC"
      | "COLD_START";
    topicsCovered: string[];
    userSolvedCount: number;
    currentRoadmapWeek?: number;
  };
}

export function NextQuestionCard() {
  const [data, setData] = useState<NextQuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/recommendations/next");
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
      <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft p-6 animate-pulse">
        <div className="h-10 w-1/3 rounded-[12px] bg-tint mb-4" />
        <div className="h-24 w-full rounded-[16px] bg-tint" />
      </Card>
    );
  }

  if (!data) return null;

  const type = data.retrievedContext.recommendationType;

  return (
    <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-tint text-foreground font-bold">
              <Compass className="h-4 w-4 text-accent-orange" />
            </span>
            <CardTitle className="text-base font-bold text-foreground">Recommended Next</CardTitle>
          </div>
          {type === "REVISIT" && (
            <Badge variant="streak" className="gap-1 text-[11px] font-semibold">
              <RotateCcw className="h-3 w-3" />
              Revisit Weak Pattern
            </Badge>
          )}
          {type === "ROADMAP_PROGRESSION" && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
              <Map className="h-3 w-3 text-secondary" />
              Week {data.retrievedContext.currentRoadmapWeek} Roadmap
            </Badge>
          )}
          {type === "WEAK_TOPIC" && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3 text-accent-orange" />
              Topic Gap
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-6 px-6">
        <div>
          <h4 className="text-lg font-bold text-foreground hover:text-accent-orange transition-colors">
            {data.problem.title}
          </h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant={
                data.problem.difficulty.toLowerCase() === "easy"
                  ? "easy"
                  : data.problem.difficulty.toLowerCase() === "medium"
                  ? "medium"
                  : "hard"
              }
              className="text-[11px] px-2 py-0.5 font-semibold"
            >
              {data.problem.difficulty}
            </Badge>
            {data.problem.topicTags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-2 py-0.5 font-normal rounded-full border-border/70 bg-tint/50 text-secondary"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
          {data.problem.summary}
        </p>

        {/* Explainability Callout */}
        <div className="rounded-[16px] bg-tint p-3.5 text-xs text-secondary">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px] mb-1">
            <Sparkles className="h-3.5 w-3.5 text-accent-orange" />
            Why this problem?
          </div>
          <p className="leading-relaxed">{data.reason}</p>
        </div>

        <div className="pt-1">
          <SolveButton
            url={data.problem.url}
            label="Practice this problem"
            size="sm"
            variant="secondary"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
