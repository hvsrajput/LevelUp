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
        className="flex h-7 items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-xs animate-pulse"
        aria-label="Loading practice streak"
      >
        <div className="h-3 w-3 rounded-full bg-tint-muted" />
        <div className="h-2.5 w-12 rounded bg-tint-muted" />
      </div>
    );
  }

  const current = streak?.current ?? 0;
  const atRisk = streak?.atRisk ?? false;

  return (
    <Link
      href="/problems"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-95 ${
        current > 0
          ? atRisk
            ? "bg-amber-100 text-amber-900 border border-amber-300"
            : "bg-pill-streak-bg text-pill-streak-text shadow-2xs"
          : "bg-tint text-text-muted hover:text-foreground"
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
          current > 0 ? "fill-current text-current" : "text-text-muted"
        }`}
      />
      <span>{current} DAY STREAK</span>
    </Link>
  );
}
