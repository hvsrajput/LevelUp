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
      <Card className="p-6 rounded-[24px] border border-border/70 bg-card shadow-soft">
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-12 w-12 rounded-[16px] bg-tint" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/4 rounded-[8px] bg-tint" />
            <div className="h-3 w-1/2 rounded-[8px] bg-tint" />
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
    <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/50 bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-[16px] transition-all ${
                streak.current > 0
                  ? "bg-[#FFE5C4]/70 text-accent-orange dark:bg-orange-500/20"
                  : "bg-tint text-muted-foreground"
              }`}
            >
              <Flame
                className={`h-6 w-6 ${
                  streak.current > 0 ? "fill-accent-orange text-accent-orange" : ""
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {streak.current} Day Streak
                </CardTitle>
                {streak.current > 0 && streak.solvedToday && (
                  <Badge variant="solved" className="gap-1 text-[11px] font-semibold">
                    <Sparkles className="h-3 w-3" />
                    Extended Today
                  </Badge>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5 font-medium">
                {streak.lastSolveDay
                  ? `Last problem solved on ${formatDateDisplay(streak.lastSolveDay)}`
                  : "Start solving problems today to build your practice streak."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Longest streak badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-tint px-3.5 py-1.5 text-xs font-semibold text-foreground">
              <Trophy className="h-4 w-4 text-accent-orange" />
              <span className="text-secondary font-medium">Longest:</span>
              <span className="font-bold text-foreground">{streak.longest}d</span>
            </div>
          </div>
        </div>

        {/* At-risk Warning Alert */}
        {streak.atRisk && (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-[16px] border border-accent-orange/30 bg-[#FFE5C4]/40 dark:bg-orange-950/30 px-4 py-2.5 text-xs font-medium text-[#8F4A0B] dark:text-[#FFE5C4]">
            <AlertCircle className="h-4 w-4 shrink-0 text-accent-orange" />
            <span>
              Streak at risk! You haven&apos;t solved a problem yet today. Solve one before midnight to keep your {streak.current}-day streak alive!
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-4 pb-5">
        {/* Heatmap Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-secondary" />
              12-Week Practice Heatmap ({data?.timezone || "UTC"})
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-secondary">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-[3px] bg-muted-tint" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#BEE59C] dark:bg-emerald-900" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#65C237] dark:bg-emerald-600" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#2D6A1E] dark:bg-emerald-400" aria-hidden="true" />
              <span>More</span>
            </div>
          </div>

          {/* Accessible Heatmap Grid */}
          <div
            className="overflow-x-auto pb-1"
            role="region"
            aria-label="12-week problem solving activity calendar"
          >
            <div className="flex gap-1.5 min-w-[340px] justify-between">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day) => {
                    const isToday = day.date === data?.today;
                    const count = day.count;

                    // Accessible color coding + title
                    let colorClass = "bg-muted-tint hover:ring-2 hover:ring-foreground/20";
                    if (count === 1) {
                      colorClass = "bg-[#BEE59C] dark:bg-emerald-800 hover:ring-2 hover:ring-[#8AC85A]";
                    } else if (count === 2) {
                      colorClass = "bg-[#65C237] dark:bg-emerald-600 hover:ring-2 hover:ring-[#4CA222]";
                    } else if (count >= 3) {
                      colorClass = "bg-[#2D6A1E] dark:bg-emerald-400 hover:ring-2 hover:ring-[#1E4D13]";
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
                        className={`h-3.5 w-3.5 rounded-[3px] transition-all cursor-pointer relative ${colorClass} ${
                          isToday ? "ring-2 ring-accent-orange ring-offset-1" : ""
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip / Details Row */}
          <div className="min-h-[28px] rounded-[12px] bg-tint px-3 py-1.5 text-xs text-secondary flex items-center justify-between">
            {hoveredDay ? (
              <span className="text-foreground">
                <span className="font-bold">{formatDateDisplay(hoveredDay.date)}:</span>{" "}
                {hoveredDay.count === 0
                  ? "No problems solved"
                  : `${hoveredDay.count} solved — ${hoveredDay.titles.slice(0, 3).join(", ")}${
                      hoveredDay.titles.length > 3 ? ` +${hoveredDay.titles.length - 3} more` : ""
                    }`}
              </span>
            ) : (
              <span className="text-muted-foreground">Hover or focus on any day cell to inspect solved problems.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
