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
  DialogBody,
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
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CalendarDays,
  FileEdit,
  Check,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/date";
import type { UserRoadmapData } from "@/lib/recommendations/roadmap";
import type { RoadmapDraft } from "@/lib/custom-roadmap/types";
import { CustomRoadmapBuilder } from "@/components/custom-roadmap-builder";

export default function RoadmapPage() {
  const [data, setData] = useState<UserRoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customBuilderOpen, setCustomBuilderOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Generator form states
  const [goal, setGoal] = useState("Crack product-company interviews in 3 months; weak at DP and graphs");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [timeline, setTimeline] = useState<"4 weeks" | "8 weeks" | "12 weeks">("8 weeks");
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, level, timeline }),
        });
        const json = await res.json();
        if (res.ok) {
          setData(json.roadmap);
          setDialogOpen(false);
        } else {
          setFormError(json.error || "Failed to generate roadmap. Please check your inputs.");
        }
      } catch (err) {
        console.error("Failed to generate roadmap", err);
        setFormError("Network error. Please try again.");
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
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">DSA Learning Roadmap</h1>
            <Badge variant="secondary" className="gap-1 font-semibold text-xs">
              <Map className="h-3 w-3 text-secondary" />
              Syllabus
            </Badge>
          </div>
          <p className="mt-1 text-xs text-secondary">
            A structured daily curriculum with increasing difficulty, day-completion tracking, and streak progression.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {data?.roadmap.source === "CUSTOM" ? (
            <Button
              variant="outline"
              onClick={() => setCustomBuilderOpen(true)}
              className="gap-2 rounded-lg h-9 text-xs font-semibold shadow-xs"
            >
              <FileEdit className="h-3.5 w-3.5" />
              Edit Roadmap
            </Button>
          ) : (
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (open) setFormError(null);
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-lg h-9 text-xs font-semibold shadow-xs">
                  {data ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate Roadmap
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </DialogTrigger>
          <DialogContent size="md" className="rounded-2xl border border-border/70">
            <form onSubmit={handleGenerate} className="flex flex-col flex-1 min-h-0">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  {data ? "Regenerate Learning Roadmap" : "Create Learning Roadmap"}
                </DialogTitle>
                <DialogDescription className="text-secondary text-xs">
                  Describe your study goals, interview target, and timeline. A personalized daily syllabus with progressive difficulty will be constructed.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 py-4 min-w-0">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg bg-[#FFDAD6] p-2.5 text-xs font-semibold text-[#93000A]">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="goal" className="text-xs font-semibold text-secondary">
                      Study Goal / Target
                    </Label>
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        goal.trim().length < 10 || goal.length > 500
                          ? "text-[#93000A] font-bold"
                          : "text-secondary"
                      }`}
                    >
                      {goal.length}/500 chars (min 10)
                    </span>
                  </div>

                  <Textarea
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Crack product-company interviews in 3 months; weak at DP and graphs"
                    maxLength={500}
                    rows={4}
                    className="bg-tint/60 border border-border/70 rounded-lg text-xs resize-none p-3 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 min-h-24 md:min-h-36"
                  />

                  {/* Preset examples */}
                  <div className="space-y-1 pt-1 min-w-0">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                      Example Goals:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Crack product-company interviews in 3 months; weak at DP and graphs",
                        "Master Trees, Tries and Dynamic Programming for FAANG rounds",
                        "Foundations sprint: Arrays, Two Pointers & Binary Search",
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setGoal(example)}
                          className="rounded-md bg-tint/60 hover:bg-tint px-2 py-0.5 text-xs text-secondary text-left transition-colors font-medium border border-border/50"
                        >
                          {example.length > 44 ? example.slice(0, 44) + "..." : example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <Label htmlFor="level" className="text-xs font-semibold text-secondary">Starting Level</Label>
                  <Select
                    value={level}
                    onValueChange={(v) =>
                      setLevel(v as "beginner" | "intermediate" | "advanced")
                    }
                  >
                    <SelectTrigger id="level" className="h-9 bg-tint/60 border border-border/70 rounded-lg text-xs">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (Foundations & Easy problems)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (Standard interview patterns)</SelectItem>
                      <SelectItem value="advanced">Advanced (Hard & complex state transitions)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 min-w-0">
                  <Label htmlFor="timeline" className="text-xs font-semibold text-secondary">Timeline</Label>
                  <Select
                    value={timeline}
                    onValueChange={(v) =>
                      setTimeline(v as "4 weeks" | "8 weeks" | "12 weeks")
                    }
                  >
                    <SelectTrigger id="timeline" className="h-9 bg-tint/60 border border-border/70 rounded-lg text-xs">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4 weeks">4 weeks (Sprint)</SelectItem>
                      <SelectItem value="8 weeks">8 weeks (Standard)</SelectItem>
                      <SelectItem value="12 weeks">12 weeks (Comprehensive Mastery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isPending || goal.trim().length < 10 || goal.trim().length > 500}
                  className="rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  {isPending ? "Generating..." : "Generate Roadmap"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

          {/* Create your own roadmap */}
          <Button
            variant={data?.roadmap.source === "CUSTOM" ? "default" : "outline"}
            onClick={() => setCustomBuilderOpen(true)}
            className="gap-2 rounded-lg h-9 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create your own roadmap
          </Button>
        </div>
      </div>

      {/* Main Roadmap Content */}
      {!data ? (
        <Card className="rounded-xl border border-dashed border-border/80 bg-card/60 p-6 sm:p-8 text-left">
          <CardContent className="flex flex-col items-start space-y-3.5 p-0">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">No active roadmap</h3>
              <p className="text-xs text-secondary max-w-lg leading-relaxed">
                Generate an ordered curriculum with questions scheduled for every day of every week to guide your preparation, or design your own custom multi-week syllabus.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-lg h-9 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Generate with AI
              </Button>
              <Button
                variant="outline"
                onClick={() => setCustomBuilderOpen(true)}
                className="gap-2 rounded-lg h-9 text-xs font-semibold bg-card border-border/70 hover:bg-tint"
              >
                <Plus className="h-3.5 w-3.5" />
                Create your own roadmap
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Catalog Limited Topics Warning Banner */}
          {data.roadmap.limitedTopicsNote && (
            <div className="flex items-center gap-2.5 rounded-lg border border-accent-orange/40 bg-pill-streak-bg/30 p-3 text-xs font-medium text-secondary">
              <AlertTriangle className="h-4 w-4 text-accent-orange shrink-0" />
              <span>{data.roadmap.limitedTopicsNote}</span>
            </div>
          )}

          {/* Progress & Dual Streaks Banner */}
          <div className="grid gap-3.5 md:grid-cols-3">
            {/* Overall Syllabus Progress */}
            <Card className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 md:col-span-1 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    Syllabus Progress
                  </h3>
                  {data.roadmap.source === "CUSTOM" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-border/70 text-secondary bg-tint/60 font-semibold rounded-md"
                    >
                      Custom
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tabular-nums">
                    {data.progress.percentage}%
                  </span>
                  <span className="text-xs font-mono tabular-nums text-secondary">
                    ({data.progress.completedDays}/{data.progress.totalDays} days)
                  </span>
                </div>
              </div>
              <div className="mt-3.5 h-1.5 w-full rounded-full bg-muted-tint overflow-hidden">
                <div
                  className="h-full bg-accent-orange transition-all duration-500 rounded-full"
                  style={{ width: `${data.progress.percentage}%` }}
                />
              </div>
            </Card>

            {/* Overall Practice Streak */}
            <Card className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Practice Streak</h3>
                  {data.streaks.overall.atRisk && (
                    <Badge variant="streak" className="text-xs px-2 py-0 font-semibold">
                      At Risk
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tabular-nums">
                    {data.streaks.overall.current}d
                  </span>
                  <span className="text-xs font-mono tabular-nums text-secondary">
                    (best: {data.streaks.overall.longest}d)
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-secondary flex items-center gap-1">
                {data.streaks.overall.solvedToday && (
                  <Check className="h-3.5 w-3.5 text-[#2D6A1E]" />
                )}
                <span>
                  {data.streaks.overall.solvedToday
                    ? "Solved a problem today"
                    : data.streaks.overall.atRisk
                    ? "Solve any problem today to keep alive!"
                    : "Solve problems daily to grow your streak"}
                </span>
              </p>
            </Card>

            {/* Roadmap Streak */}
            <Card className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Roadmap Streak</h3>
                  {data.streaks.roadmap.atRisk && (
                    <Badge variant="streak" className="text-xs px-2 py-0 font-semibold">
                      At Risk
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tabular-nums">
                    {data.streaks.roadmap.current}d
                  </span>
                  <span className="text-xs font-mono tabular-nums text-secondary">
                    (best: {data.streaks.roadmap.longest}d)
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-secondary flex items-center gap-1">
                {data.streaks.roadmap.solvedToday && (
                  <Check className="h-3.5 w-3.5 text-[#2D6A1E]" />
                )}
                <span>
                  {data.streaks.roadmap.solvedToday
                    ? "Completed today's roadmap goals"
                    : data.streaks.roadmap.atRisk
                    ? "Complete today's roadmap questions to keep alive!"
                    : "Complete scheduled daily roadmap questions"}
                </span>
              </p>
            </Card>
          </div>

          {/* 1. Today's Questions (Top Section) */}
          <Card className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
            <CardHeader className="bg-tint/40 p-4 sm:p-5 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    Today&apos;s Roadmap Questions
                    {data.todayItems.length > 0 && data.todayItems.every((i) => i.isCompleted) && (
                      <Badge variant="solved" className="gap-1 text-xs font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                          Day Completed!
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-secondary mt-0.5">
                      {data.todayItems[0]?.scheduledDate
                        ? formatDateDisplay(data.todayItems[0].scheduledDate)
                        : "Today's focus"} • Keep your roadmap streak going by completing these questions.
                    </CardDescription>
                  </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {data.todayItems.length === 0 ? (
                <div className="text-center py-6 text-secondary space-y-1.5">
                  <p className="text-xs font-semibold">No specific questions scheduled for today.</p>
                  <p className="text-xs text-muted-foreground">
                    You can work ahead on upcoming weeks below or catch up on overdue problems.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.todayItems.map((dayItem) => (
                    <div
                      key={dayItem.id}
                      className={`rounded-lg border p-3.5 sm:p-4 transition-all ${
                        dayItem.isCompleted
                          ? "border-[#2D6A1E]/30 bg-[#D6EEC6]/15"
                          : "border-border/70 bg-card hover:border-accent-orange/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {dayItem.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-[#2D6A1E] shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-secondary shrink-0" />
                            )}
                            <h4 className="font-bold text-sm text-foreground">{dayItem.topicName}</h4>
                            <Badge variant="outline" className="text-xs rounded-md bg-tint/60 border-border/70 text-secondary">
                              Week {dayItem.weekNumber} • Day {dayItem.dayNumber}
                            </Badge>
                          </div>
                          <p className="text-xs text-secondary pl-6 leading-relaxed">
                            {dayItem.concept}
                          </p>
                        </div>
                      </div>

                      {/* Problems in this day item */}
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2 pl-0 sm:pl-6">
                        {dayItem.problems.map((prob) => (
                          <div
                            key={prob.title}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg bg-tint/60 border border-border/50 p-2.5"
                          >
                            <div className="flex items-center gap-2">
                              {prob.isSolved ? (
                                <Badge variant="solved" className="text-xs font-semibold gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Solved
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs font-medium bg-card">
                                  Unsolved
                                </Badge>
                              )}
                              <span className="font-semibold text-xs text-foreground">{prob.title}</span>
                              <Badge
                                variant={
                                  prob.difficulty.toLowerCase() === "easy"
                                    ? "easy"
                                    : prob.difficulty.toLowerCase() === "medium"
                                    ? "medium"
                                    : "hard"
                                }
                                className="text-xs px-1.5 py-0 font-semibold"
                              >
                                {prob.difficulty}
                              </Badge>
                            </div>

                            <div className="w-full sm:w-auto">
                              <SolveButton
                                url={prob.url}
                                label="Solve Problem"
                                size="sm"
                                variant={prob.isSolved ? "secondary" : "dark"}
                                className="h-8 text-xs rounded-lg"
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
            <Card className="rounded-xl border border-[#E8871E]/30 bg-[#FFE5C4]/20 shadow-xs">
              <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-5 border-b border-[#E8871E]/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#FFE5C4]/60 p-2 text-accent-orange">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-[#8F4A0B] dark:text-[#FFE5C4] flex items-center gap-2">
                        Catch Up: {data.overdueItems.length} Overdue Day{data.overdueItems.length > 1 ? "s" : ""}
                      </CardTitle>
                      <CardDescription className="text-secondary text-xs">
                        These problems were scheduled for previous days but remain unsolved. You can catch up now or redistribute them across upcoming days.
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    onClick={handleReschedule}
                    disabled={isRescheduling}
                    variant="outline"
                    className="rounded-lg h-8 px-3 bg-card border-border/70 hover:bg-tint text-foreground font-semibold gap-2 shrink-0 text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRescheduling ? "animate-spin" : ""}`} />
                    {isRescheduling ? "Rescheduling..." : "Reschedule Remaining"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-2.5">
                {data.overdueItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/70 bg-card p-3 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs uppercase font-semibold rounded-md">
                          Overdue
                        </Badge>
                        <span className="font-semibold text-xs text-foreground">{item.topicName}</span>
                        <span className="text-xs font-mono tabular-nums text-secondary">
                          ({item.scheduledDate ? formatDateDisplay(item.scheduledDate) : `Week ${item.weekNumber}`})
                        </span>
                      </div>
                      <span className="text-xs text-secondary font-medium">{item.concept}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.problems.map((prob) => (
                        <div
                          key={prob.title}
                          className="flex items-center gap-2 rounded-md bg-tint/60 border border-border/50 px-2.5 py-1 text-xs"
                        >
                          <span className="font-medium text-foreground">{prob.title}</span>
                          <Badge
                            variant={
                              prob.difficulty.toLowerCase() === "easy"
                                ? "easy"
                                : prob.difficulty.toLowerCase() === "medium"
                                ? "medium"
                                : "hard"
                            }
                            className="text-xs px-1.5 py-0 font-semibold"
                          >
                            {prob.difficulty}
                          </Badge>
                          <SolveButton
                            url={prob.url}
                            label="Solve"
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-xs rounded-md"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Curriculum Schedule</h2>
                <p className="text-xs text-secondary">
                  Days with all problems solved earn checkmarks. Complete every day in a week to clear that level and unlock the next badge.
                </p>
              </div>
            </div>

            {data.weeks.map((week) => (
              <Card
                key={week.weekNumber}
                className={`rounded-xl transition-all overflow-hidden shadow-xs ${
                  week.isWeekCompleted
                    ? "border-l-4 border-l-[#2D6A1E] border-border/70 bg-card"
                    : week.weekNumber === data.currentWeekNumber
                    ? "border-l-4 border-l-accent-orange border-border/70 bg-card"
                    : "border-border/70 bg-card"
                }`}
              >
                <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-5 border-b border-border/50 bg-tint/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-xs ${
                          week.isWeekCompleted
                            ? "bg-[#D6EEC6] text-[#2D6A1E]"
                            : week.weekNumber === data.currentWeekNumber
                            ? "bg-[#1E2B1D] text-white"
                            : "bg-tint text-secondary"
                        }`}
                      >
                        W{week.weekNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-foreground">
                            {week.levelTitle}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs rounded-md bg-card border-border/70 text-secondary">
                            {week.difficultyLabel}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-secondary mt-0.5">
                          {week.completedDays} of {week.totalDays} days completed ({week.percentage}%)
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {week.isWeekCompleted ? (
                        <Badge variant="solved" className="gap-1.5 py-0.5 px-2.5 font-semibold text-xs">
                          <Sparkles className="h-3.5 w-3.5" />
                          Week Cleared!
                        </Badge>
                      ) : week.weekNumber === data.currentWeekNumber ? (
                        <Badge variant="default" className="gap-1 py-0.5 px-2.5 text-xs font-semibold">
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
                  <div className="mt-3.5 h-1.5 w-full rounded-full bg-muted-tint overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        week.isWeekCompleted ? "bg-[#2D6A1E]" : "bg-accent-orange"
                      }`}
                      style={{ width: `${week.percentage}%` }}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 p-4 sm:p-5">
                  {/* 7-Day Strip for new format roadmaps with dayIndex */}
                  {week.items.some((i) => i.dayIndex != null) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {week.items.map((item) => {
                        const isToday = data.todayItems.some((ti) => ti.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`flex flex-col justify-between rounded-lg border p-3 transition-colors text-xs ${
                              item.isCompleted
                                ? "border-[#2D6A1E]/30 bg-[#D6EEC6]/15"
                                : isToday
                                ? "border-accent-orange ring-1 ring-accent-orange/40 bg-card shadow-xs"
                                : item.isOverdue
                                ? "border-accent-orange/30 bg-pill-streak-bg/20"
                                : "border-border/60 bg-tint/40 hover:bg-tint/70"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-bold text-foreground text-xs">
                                  Day {item.dayIndex || item.dayNumber}
                                </span>
                                {item.isCompleted ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2D6A1E] shrink-0" />
                                ) : isToday ? (
                                  <Badge variant="default" className="text-[10px] px-1 py-0 font-bold uppercase rounded">
                                    Today
                                  </Badge>
                                ) : item.isOverdue ? (
                                  <Badge variant="destructive" className="text-[10px] px-1 py-0 font-bold uppercase rounded">
                                    Overdue
                                  </Badge>
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                              </div>

                              {item.scheduledDate && (
                                <div className="text-[10px] font-mono tabular-nums text-secondary font-medium flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDateDisplay(item.scheduledDate)}
                                </div>
                              )}

                              <div className="font-semibold text-foreground text-xs leading-tight line-clamp-1" title={item.topicName}>
                                {item.topicName}
                              </div>

                              <p className="text-[11px] text-secondary leading-snug line-clamp-2" title={item.concept}>
                                {item.concept}
                              </p>
                            </div>

                            {/* Problem list for this day */}
                            <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1.5">
                              {item.problems.length > 0 ? (
                                item.problems.map((prob) => (
                                  <div key={prob.title} className="space-y-1 rounded-md bg-card/80 p-1.5 border border-border/50">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-medium text-foreground text-[11px] truncate" title={prob.title}>
                                        {prob.title}
                                      </span>
                                      <Badge
                                        variant={
                                          prob.difficulty.toLowerCase() === "easy"
                                            ? "easy"
                                            : prob.difficulty.toLowerCase() === "medium"
                                            ? "medium"
                                            : "hard"
                                        }
                                        className="text-[10px] px-1 py-0 font-semibold shrink-0"
                                      >
                                        {prob.difficulty}
                                      </Badge>
                                    </div>
                                    <SolveButton
                                      url={prob.url}
                                      label="Solve"
                                      size="sm"
                                      variant={prob.isSolved ? "secondary" : isToday ? "default" : "dark"}
                                      className="h-6 w-full text-[10px] rounded-md"
                                    />
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-muted-foreground italic py-1 text-center">
                                  No problem scheduled
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Legacy format for existing roadmaps without dayIndex */
                    week.items.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-3 sm:p-3.5 transition-colors ${
                          item.isCompleted
                            ? "border-[#2D6A1E]/30 bg-[#D6EEC6]/15"
                            : item.isOverdue
                            ? "border-[#E8871E]/30 bg-[#FFE5C4]/20"
                            : "border-border/60 bg-tint/40 hover:bg-tint/70"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              {item.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-[#2D6A1E] shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-secondary shrink-0" />
                              )}
                              <h4
                                className={`text-sm font-bold ${
                                  item.isCompleted
                                    ? "line-through text-secondary"
                                    : "text-foreground"
                                }`}
                              >
                                Day {item.dayNumber}: {item.topicName}
                              </h4>

                              {item.scheduledDate && (
                                <span className="text-xs font-mono tabular-nums text-secondary flex items-center gap-1 ml-1 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  {formatDateDisplay(item.scheduledDate)}
                                </span>
                              )}

                              {item.isOverdue && (
                                <Badge variant="destructive" className="text-xs uppercase font-semibold rounded-md">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-secondary pl-6 leading-relaxed">
                              {item.concept}
                            </p>

                            {/* Problem list for this day */}
                            <div className="pl-0 sm:pl-6 pt-2 space-y-1.5">
                              {item.problems.map((prob) => (
                                <div
                                  key={prob.title}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-card border border-border/70 p-2.5 text-xs shadow-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    {prob.isSolved ? (
                                      <Badge variant="solved" className="text-xs font-semibold gap-1">
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                        Solved
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        To solve
                                      </Badge>
                                    )}
                                    <span className="font-semibold text-foreground text-xs">{prob.title}</span>
                                    <Badge
                                      variant={
                                        prob.difficulty.toLowerCase() === "easy"
                                          ? "easy"
                                          : prob.difficulty.toLowerCase() === "medium"
                                          ? "medium"
                                          : "hard"
                                      }
                                      className="text-xs px-1.5 py-0 font-semibold"
                                    >
                                      {prob.difficulty}
                                    </Badge>
                                  </div>

                                  <div className="w-full sm:w-auto">
                                    <SolveButton
                                      url={prob.url}
                                      label="Solve"
                                      size="sm"
                                      variant={prob.isSolved ? "secondary" : "dark"}
                                      className="h-7 text-xs rounded-md"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Roadmap Builder Modal */}
      <CustomRoadmapBuilder
        open={customBuilderOpen}
        onOpenChange={setCustomBuilderOpen}
        onRoadmapSaved={(newRoadmap) => {
          setData(newRoadmap);
        }}
        initialDraft={
          data?.roadmap.source === "CUSTOM"
            ? (data.roadmap.customDraft as RoadmapDraft)
            : null
        }
        existingActiveRoadmap={Boolean(data?.roadmap.id)}
      />
    </div>
  );
}
