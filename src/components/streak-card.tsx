// =============================================================================
// Dashboard Streak Card & 12-Week Heatmap Calendar
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, AlertCircle, Calendar, Sparkles } from "lucide-react";
import { formatDateDisplay } from "@/lib/date";
import type { StreakSummary, DayHeatmapItem } from "@/lib/streak";

interface StreakCardProps {
  initialSummary?: StreakSummary | null;
}

export function StreakCard({ initialSummary }: StreakCardProps) {
  const [data, setData] = useState<StreakSummary | null>(initialSummary || null);
  const [isLoading, setIsLoading] = useState(!initialSummary);
  const [hoveredDay, setHoveredDay] = useState<DayHeatmapItem | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/streak")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: StreakSummary | null) => {
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
      <Card className="p-6">
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
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

  const heatmap = data?.heatmap || [];

  // Group the 84 days into 12 columns of 7 days (weeks)
  const weeks: DayHeatmapItem[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b bg-card/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                streak.current > 0
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-xs"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Flame
                className={`h-6 w-6 ${
                  streak.current > 0 ? "fill-orange-500 text-orange-500" : ""
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {streak.current} Day Streak
                </CardTitle>
                {streak.current > 0 && streak.solvedToday && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1 text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    Extended Today
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {streak.lastSolveDay
                  ? `Last problem solved on ${formatDateDisplay(streak.lastSolveDay)}`
                  : "Start solving problems today to build your practice streak."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Longest streak badge */}
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">Longest:</span>
              <span className="font-bold text-foreground">{streak.longest}d</span>
            </div>
          </div>
        </div>

        {/* At-risk Warning Alert */}
        {streak.atRisk && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Streak at risk! You haven&apos;t solved a problem yet today. Solve one before midnight to keep your {streak.current}-day streak alive!
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        {/* Heatmap Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              12-Week Practice Heatmap ({data?.timezone || "UTC"})
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-xs bg-muted" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-800" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-700 dark:bg-emerald-400" aria-hidden="true" />
              <span>More</span>
            </div>
          </div>

          {/* Accessible Heatmap Grid */}
          <div
            className="overflow-x-auto pb-1"
            role="region"
            aria-label="12-week problem solving activity calendar"
          >
            <div className="flex gap-1 min-w-[340px] justify-between">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const isToday = day.date === data?.today;
                    const count = day.count;

                    // Accessible color coding + title
                    let colorClass = "bg-muted/70 hover:border-foreground/40";
                    if (count === 1) {
                      colorClass = "bg-emerald-400/70 dark:bg-emerald-700 hover:ring-2 hover:ring-emerald-400";
                    } else if (count === 2) {
                      colorClass = "bg-emerald-500 dark:bg-emerald-500 hover:ring-2 hover:ring-emerald-500";
                    } else if (count >= 3) {
                      colorClass = "bg-emerald-600 dark:bg-emerald-400 hover:ring-2 hover:ring-emerald-300";
                    }

                    const label = `${formatDateDisplay(day.date)}: ${
                      count === 0
                        ? "No problems solved"
                        : `${count} problem${count > 1 ? "s" : ""} solved (${day.titles.join(", ")})`
                    }${isToday ? " (Today)" : ""}`;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        aria-label={label}
                        onMouseEnter={() => setHoveredDay(day)}
                        onFocus={() => setHoveredDay(day)}
                        className={`h-3.5 w-3.5 rounded-xs border transition-all cursor-pointer relative ${colorClass} ${
                          isToday ? "ring-1.5 ring-primary ring-offset-1" : "border-border/40"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip / Details Row */}
          <div className="min-h-[22px] text-xs text-muted-foreground flex items-center justify-between border-t pt-2 mt-1">
            {hoveredDay ? (
              <span className="text-foreground">
                <span className="font-semibold">{formatDateDisplay(hoveredDay.date)}:</span>{" "}
                {hoveredDay.count === 0
                  ? "No problems solved"
                  : `${hoveredDay.count} solved — ${hoveredDay.titles.slice(0, 3).join(", ")}${
                      hoveredDay.titles.length > 3 ? ` +${hoveredDay.titles.length - 3} more` : ""
                    }`}
              </span>
            ) : (
              <span>Hover or focus on any day cell to inspect solved problems.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
