// =============================================================================
// Roadmap Dashboard: Interactive Syllabus, Progress Tracker, and Generator
// =============================================================================

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
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
import {
  Map,
  CheckCircle2,
  Circle,
  BookOpen,
  Calendar,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";

interface RoadmapItem {
  id: string;
  weekNumber: number;
  topicName: string;
  concept: string;
  problemIds: string[];
  isCompleted: boolean;
  order: number;
}

interface WeekGroup {
  weekNumber: number;
  items: RoadmapItem[];
  isWeekCompleted: boolean;
}

interface RoadmapData {
  roadmap: {
    id: string;
    title: string;
    goal: string;
    level: string;
    timeline: string;
    createdAt: string;
    updatedAt: string;
  };
  progress: {
    totalItems: number;
    completedItems: number;
    percentage: number;
  };
  weeks: WeekGroup[];
}

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Generator form states
  const [goal, setGoal] = useState("Full DSA");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [timeline, setTimeline] = useState<"4 weeks" | "8 weeks" | "12 weeks">("8 weeks");

  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
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
    load();
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

  const handleToggleItem = async (itemId: string, currentState: boolean) => {
    if (!data?.roadmap.id) return;
    setTogglingItemId(itemId);

    try {
      const res = await fetch(
        `/api/roadmap/${data.roadmap.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted: !currentState }),
        }
      );

      if (res.ok) {
        // Optimistic update
        setData((prev) => {
          if (!prev) return null;
          const updatedWeeks = prev.weeks.map((w) => {
            const updatedItems = w.items.map((i) =>
              i.id === itemId ? { ...i, isCompleted: !currentState } : i
            );
            return {
              ...w,
              items: updatedItems,
              isWeekCompleted: updatedItems.every((i) => i.isCompleted),
            };
          });

          const flatItems = updatedWeeks.flatMap((w) => w.items);
          const completed = flatItems.filter((i) => i.isCompleted).length;
          const percentage = Math.round((completed / flatItems.length) * 100);

          return {
            ...prev,
            progress: {
              ...prev.progress,
              completedItems: completed,
              percentage,
            },
            weeks: updatedWeeks,
          };
        });
      }
    } catch (err) {
      console.error("Failed to toggle item", err);
    } finally {
      setTogglingItemId(null);
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
            A structured, week-by-week curriculum tailored to your goal, timeline, and difficulty level.
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
                  Configure your learning target and timeline. A personalized syllabus will be constructed.
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
                  <Label htmlFor="level">Experience Level</Label>
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
                Generate an ordered curriculum to guide your preparation week by week with recommended problems.
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
          {/* Progress Header Card */}
          <Card className="border-primary/20 bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{data.roadmap.title}</h2>
                  <Badge variant="outline" className="capitalize">
                    {data.roadmap.level}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {data.roadmap.timeline}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.progress.completedItems} of {data.progress.totalItems} concepts completed
                </p>
              </div>

              {/* Circular / Large Percentage Badge */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-primary">
                    {data.progress.percentage}%
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">Syllabus Progress</p>
                </div>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="mt-4 h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${data.progress.percentage}%` }}
              />
            </div>
          </Card>

          {/* Week-by-Week Accordion / Cards */}
          <div className="space-y-6">
            {data.weeks.map((week) => (
              <Card
                key={week.weekNumber}
                className={`transition-all ${
                  week.isWeekCompleted
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                    : "shadow-xs"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
                          week.isWeekCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        W{week.weekNumber}
                      </span>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Week {week.weekNumber}
                        </CardTitle>
                        <CardDescription>
                          {week.items.length} focus concepts
                        </CardDescription>
                      </div>
                    </div>
                    {week.isWeekCompleted && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Week Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  {week.items.map((item) => {
                    const isToggling = togglingItemId === item.id;
                    const problemList = Array.isArray(item.problemIds)
                      ? (item.problemIds as string[])
                      : [];

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 transition-colors ${
                          item.isCompleted
                            ? "border-emerald-500/20 bg-background/80"
                            : "bg-card hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleItem(item.id, item.isCompleted)}
                                className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                              >
                                {item.isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </button>
                              <h4
                                className={`text-base font-bold ${
                                  item.isCompleted
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {item.topicName}
                              </h4>
                            </div>
                            <p className="text-xs text-muted-foreground pl-7">
                              {item.concept}
                            </p>

                            {/* Recommended problems list */}
                            {problemList.length > 0 && (
                              <div className="pl-7 pt-2 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                                  Problems:
                                </span>
                                {problemList.map((title) => (
                                  <Link
                                    key={title}
                                    href={`/catalog?search=${encodeURIComponent(title)}`}
                                    className="inline-flex items-center gap-1 rounded-md border bg-muted/60 px-2 py-0.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    {title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
