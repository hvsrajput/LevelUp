// =============================================================================
// Roadmap Dashboard: Interactive Daily Syllabus, Streaks, Overdue Catch-Up & Progress
// =============================================================================

"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SolveButton } from "@/components/solve-button";
import {
  Map,
  CheckCircle2,
  Circle,
  Calendar,
  RefreshCw,
  Plus,
  Loader2,
  Flame,
  AlertTriangle,
  Compass,
  Trophy,
  ArrowRight,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/date";
import type { UserRoadmapData } from "@/lib/recommendations/roadmap";

export default function RoadmapPage() {
  const [data, setData] = useState<UserRoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Generator form states
  const [goal, setGoal] = useState("Full DSA");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [timeline, setTimeline] = useState<"4 weeks" | "8 weeks" | "12 weeks">("8 weeks");

  useEffect(() => {
    let ignore = false;
    async function loadRoadmap() {
      try {
        const res = await fetch("/api/roadmap");
        if (res.ok && !ignore) {
          const json = await res.json();
          setData(json.roadmap);
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadRoadmap();
    return () => {
      ignore = true;
    };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, level, timeline }),
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.roadmap);
          setDialogOpen(false);
        }
      } catch (err) {
        console.error("Failed to generate roadmap", err);
      }
    });
  };

  const handleReschedule = async () => {
    if (!data?.roadmap.id) return;
    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/roadmap/${data.roadmap.id}/reschedule`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.roadmap);
      }
    } catch (err) {
      console.error("Failed to reschedule roadmap items", err);
    } finally {
      setIsRescheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">DSA Learning Roadmap</h1>
            <Badge variant="secondary" className="gap-1">
              <Map className="h-3 w-3" />
              Syllabus
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            A structured daily curriculum with increasing difficulty, day-completion tracking, and streak progression.
          </p>
        </div>

        {/* Generate / Regenerate Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              {data ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Roadmap
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create My Roadmap
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleGenerate}>
              <DialogHeader>
                <DialogTitle>
                  {data ? "Regenerate Learning Roadmap" : "Create Learning Roadmap"}
                </DialogTitle>
                <DialogDescription>
                  Configure your learning target and timeline. A personalized daily syllabus with progressive difficulty will be constructed.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goal">Study Goal</Label>
                  <Select
                    value={goal}
                    onValueChange={(val) => {
                      if (val) setGoal(val);
                    }}
                  >
                    <SelectTrigger id="goal">
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full DSA">Full DSA (Comprehensive)</SelectItem>
                      <SelectItem value="Dynamic Programming">Dynamic Programming Deep-Dive</SelectItem>
                      <SelectItem value="Trees & Graphs">Trees, BSTs & Graphs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Starting Level</Label>
                  <Select
                    value={level}
                    onValueChange={(v) =>
                      setLevel(v as "beginner" | "intermediate" | "advanced")
                    }
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (Foundations & Easy problems)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (Standard interview patterns)</SelectItem>
                      <SelectItem value="advanced">Advanced (Hard & complex state transitions)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select
                    value={timeline}
                    onValueChange={(v) =>
                      setTimeline(v as "4 weeks" | "8 weeks" | "12 weeks")
                    }
                  >
                    <SelectTrigger id="timeline">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4 weeks">4 weeks (Sprint)</SelectItem>
                      <SelectItem value="8 weeks">8 weeks (Standard)</SelectItem>
                      <SelectItem value="12 weeks">12 weeks (Comprehensive Mastery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Generating..." : "Generate Roadmap"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Roadmap Content */}
      {!data ? (
        <Card className="border-dashed py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Map className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">No active roadmap</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Generate an ordered curriculum with questions scheduled for every day of every week to guide your preparation.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate My Roadmap
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Progress & Dual Streaks Banner */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Overall Syllabus Progress */}
            <Card className="border shadow-xs p-5 md:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Syllabus Progress</h3>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-primary">
                      {data.progress.percentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({data.progress.completedDays} / {data.progress.totalDays} days)
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${data.progress.percentage}%` }}
                />
              </div>
            </Card>

            {/* Overall Practice Streak */}
            <Card className="border shadow-xs p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-muted-foreground">Overall Practice Streak</h3>
                    {data.streaks.overall.atRisk && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] px-1.5 py-0">
                        At Risk
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                      {data.streaks.overall.current}d
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (best: {data.streaks.overall.longest}d)
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-orange-500/15 p-2.5 text-orange-600 dark:text-orange-400">
                  <Flame className="h-5 w-5 fill-current" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {data.streaks.overall.solvedToday
                  ? "✓ Solved a problem today"
                  : data.streaks.overall.atRisk
                  ? "Solve any problem today to keep alive!"
                  : "Solve problems daily to grow your streak"}
              </p>
            </Card>

            {/* Roadmap Streak */}
            <Card className="border shadow-xs p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-muted-foreground">Roadmap Streak</h3>
                    {data.streaks.roadmap.atRisk && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] px-1.5 py-0">
                        At Risk
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                      {data.streaks.roadmap.current}d
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (best: {data.streaks.roadmap.longest}d)
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-blue-500/15 p-2.5 text-blue-600 dark:text-blue-400">
                  <Compass className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {data.streaks.roadmap.solvedToday
                  ? "✓ Completed today's roadmap goals"
                  : data.streaks.roadmap.atRisk
                  ? "Complete today's roadmap questions to keep alive!"
                  : "Complete scheduled daily roadmap questions"}
              </p>
            </Card>
          </div>

          {/* 1. Today's Questions (Top Section) */}
          <Card className="border-primary/30 shadow-xs bg-card overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      Today&apos;s Roadmap Questions
                      {data.todayItems.length > 0 && data.todayItems.every((i) => i.isCompleted) && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          Day Completed!
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {data.todayItems[0]?.scheduledDate
                        ? formatDateDisplay(data.todayItems[0].scheduledDate)
                        : "Today&apos;s focus"} • Keep your roadmap streak going by completing these questions.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {data.todayItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground space-y-2">
                  <p className="text-sm">No specific questions scheduled for today.</p>
                  <p className="text-xs">
                    You can work ahead on upcoming weeks below or catch up on overdue problems.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.todayItems.map((dayItem) => (
                    <div
                      key={dayItem.id}
                      className={`rounded-xl border p-4 transition-all ${
                        dayItem.isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                          : "bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {dayItem.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <h4 className="font-bold text-base">{dayItem.topicName}</h4>
                            <Badge variant="outline" className="text-xs">
                              Week {dayItem.weekNumber} • Day {dayItem.dayNumber}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground pl-7">
                            {dayItem.concept}
                          </p>
                        </div>
                      </div>

                      {/* Problems in this day item */}
                      <div className="mt-4 pt-3 border-t space-y-2 pl-7">
                        {dayItem.problems.map((prob) => (
                          <div
                            key={prob.title}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-background/60 p-3"
                          >
                            <div className="flex items-center gap-2.5">
                              {prob.isSolved ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Solved
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[11px]">
                                  Unsolved
                                </Badge>
                              )}
                              <span className="font-semibold text-sm">{prob.title}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  prob.difficulty === "EASY"
                                    ? "text-emerald-600 border-emerald-500/30"
                                    : prob.difficulty === "HARD"
                                    ? "text-red-600 border-red-500/30"
                                    : "text-amber-600 border-amber-500/30"
                                }`}
                              >
                                {prob.difficulty}
                              </Badge>
                            </div>

                            <div className="w-full sm:w-auto">
                              <SolveButton
                                url={prob.url}
                                label="Solve Problem"
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Overdue / Catch-Up Section (Shown when overdue problems exist) */}
          {data.overdueItems.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 shadow-xs">
              <CardHeader className="pb-3 border-b border-amber-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        Catch Up: {data.overdueItems.length} Overdue Day{data.overdueItems.length > 1 ? "s" : ""}
                      </CardTitle>
                      <CardDescription className="text-amber-700/80 dark:text-amber-300/80">
                        These problems were scheduled for previous days but remain unsolved. You can catch up now or redistribute them across upcoming days.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    onClick={handleReschedule}
                    disabled={isRescheduling}
                    variant="outline"
                    className="border-amber-500/40 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 gap-2 shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRescheduling ? "animate-spin" : ""}`} />
                    {isRescheduling ? "Rescheduling..." : "Reschedule Remaining"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {data.overdueItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-amber-500/20 bg-background/80 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                          Overdue
                        </Badge>
                        <span className="font-semibold text-sm">{item.topicName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({item.scheduledDate ? formatDateDisplay(item.scheduledDate) : `Week ${item.weekNumber}`})
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.concept}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.problems.map((prob) => (
                        <div
                          key={prob.title}
                          className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1 text-xs"
                        >
                          <span className="font-medium">{prob.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {prob.difficulty}
                          </Badge>
                          <SolveButton
                            url={prob.url}
                            label="Solve"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 3. Week-by-Week View with Level Progression */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Curriculum Schedule</h2>
                <p className="text-xs text-muted-foreground">
                  Days with all problems solved earn checkmarks. Complete every day in a week to clear that level and unlock the next badge.
                </p>
              </div>
            </div>

            {data.weeks.map((week) => (
              <Card
                key={week.weekNumber}
                className={`transition-all overflow-hidden ${
                  week.isWeekCompleted
                    ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-xs"
                    : week.weekNumber === data.currentWeekNumber
                    ? "border-primary/40 shadow-xs"
                    : "border-border/60"
                }`}
              >
                <CardHeader className="pb-3 border-b bg-card/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm ${
                          week.isWeekCompleted
                            ? "bg-emerald-500 text-white shadow-xs"
                            : week.weekNumber === data.currentWeekNumber
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        W{week.weekNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold">
                            {week.levelTitle}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px]">
                            {week.difficultyLabel}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-0.5">
                          {week.completedDays} of {week.totalDays} days completed ({week.percentage}%)
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {week.isWeekCompleted ? (
                        <Badge className="bg-emerald-500 text-white gap-1.5 py-1 px-2.5 font-semibold text-xs shadow-xs">
                          <Sparkles className="h-3.5 w-3.5" />
                          Week Cleared!
                        </Badge>
                      ) : week.weekNumber === data.currentWeekNumber ? (
                        <Badge variant="default" className="gap-1 py-1 px-2.5 text-xs">
                          <ArrowRight className="h-3.5 w-3.5" />
                          Current Level
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {week.isUnlocked ? "Available" : "Upcoming"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Per-Week Progress Bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        week.isWeekCompleted ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${week.percentage}%` }}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-4">
                  {week.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        item.isCompleted
                          ? "border-emerald-500/25 bg-background/60"
                          : item.isOverdue
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            {item.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <h4
                              className={`text-base font-bold ${
                                item.isCompleted
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              Day {item.dayNumber}: {item.topicName}
                            </h4>

                            {item.scheduledDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateDisplay(item.scheduledDate)}
                              </span>
                            )}

                            {item.isOverdue && (
                              <Badge variant="destructive" className="text-[10px] uppercase">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground pl-7">
                            {item.concept}
                          </p>

                          {/* Problem list for this day */}
                          <div className="pl-7 pt-2 space-y-2">
                            {item.problems.map((prob) => (
                              <div
                                key={prob.title}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  {prob.isSolved ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                                      <CheckCircle2 className="h-2.5 w-2.5" />
                                      Solved
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px]">
                                      To solve
                                    </Badge>
                                  )}
                                  <span className="font-semibold">{prob.title}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${
                                      prob.difficulty === "EASY"
                                        ? "text-emerald-600 border-emerald-500/30"
                                        : prob.difficulty === "HARD"
                                        ? "text-red-600 border-red-500/30"
                                        : "text-amber-600 border-amber-500/30"
                                    }`}
                                  >
                                    {prob.difficulty}
                                  </Badge>
                                </div>

                                <div className="w-full sm:w-auto">
                                  <SolveButton
                                    url={prob.url}
                                    label="Solve"
                                    size="sm"
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
