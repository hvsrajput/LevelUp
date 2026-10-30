// =============================================================================
// Navbar Streak Badge: Compact header indicator with loading & empty states
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

interface StreakData {
  current: number;
  atRisk: boolean;
  solvedToday: boolean;
}

export function NavbarStreakBadge() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch("/api/streak")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.streak) {
          setStreak({
            current: data.streak.current,
            atRisk: data.streak.atRisk,
            solvedToday: data.streak.solvedToday,
          });
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
      <div
        className="flex h-8 items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs animate-pulse"
        aria-label="Loading practice streak"
      >
        <div className="h-3.5 w-3.5 rounded-full bg-muted" />
        <div className="h-3 w-4 rounded bg-muted" />
      </div>
    );
  }

  const current = streak?.current ?? 0;
  const atRisk = streak?.atRisk ?? false;

  return (
    <Link
      href="/problems"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:scale-105 ${
        current > 0
          ? atRisk
            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
      }`}
      title={
        current > 0
          ? `${current} day practice streak${atRisk ? " (Solve today to keep alive!)" : ""}`
          : "0 day streak — solve a problem today to start your streak!"
      }
      aria-label={`Current practice streak: ${current} days`}
    >
      <Flame
        className={`h-3.5 w-3.5 ${
          current > 0 ? "fill-current text-current" : "text-muted-foreground"
        }`}
      />
      <span>{current}</span>
    </Link>
  );
}
