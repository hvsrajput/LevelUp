// =============================================================================
// Next Question Recommender Widget with Explainability
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolveButton } from "@/components/solve-button";
import { difficultyColor } from "@/lib/utils";
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
      <Card className="animate-pulse">
        <CardHeader className="h-16 bg-muted/40" />
        <CardContent className="h-28 bg-muted/20" />
      </Card>
    );
  }

  if (!data) return null;

  const type = data.retrievedContext.recommendationType;

  return (
    <Card className="shadow-xs hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Compass className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-bold">Recommended Next</CardTitle>
          </div>
          {type === "REVISIT" && (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]">
              <RotateCcw className="h-3 w-3" />
              Revisit Weak Pattern
            </Badge>
          )}
          {type === "ROADMAP_PROGRESSION" && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Map className="h-3 w-3 text-primary" />
              Week {data.retrievedContext.currentRoadmapWeek} Roadmap
            </Badge>
          )}
          {type === "WEAK_TOPIC" && (
            <Badge variant="outline" className="gap-1 text-[11px]">
              <Sparkles className="h-3 w-3 text-purple-500" />
              Topic Gap
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
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

        <p className="text-xs text-muted-foreground line-clamp-2">
          {data.problem.summary}
        </p>

        {/* Explainability Callout */}
        <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-semibold text-foreground text-[11px] mb-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            Why this problem?
          </div>
          <p className="leading-relaxed">{data.reason}</p>
        </div>

        <div className="pt-1">
          <SolveButton
            url={data.problem.url}
            label="Practice this problem"
            size="sm"
            variant="outline"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
