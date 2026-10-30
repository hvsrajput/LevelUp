"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  parseQuestionLine,
  parseRoadmapText,
  serializeDraft,
} from "@/lib/custom-roadmap/parser";
import type {
  RoadmapDraft,
  WeekDraft,
  DayDraft,
  QuestionEntry,
  ResolvedDraft,
  Issue,
} from "@/lib/custom-roadmap/types";
import type { UserRoadmapData } from "@/lib/recommendations/roadmap";

const EXAMPLE_PASTE_TEXT = `Week 1: Arrays & Hashing
Day 1
Two Sum
Contains Duplicate
Day 2
Valid Anagram
#49 Group Anagrams
Week 2
Day 1
https://leetcode.com/problems/valid-palindrome/`;

interface CustomRoadmapBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoadmapSaved: (roadmap: UserRoadmapData) => void;
  initialDraft?: RoadmapDraft | null;
  existingActiveRoadmap?: boolean;
}

export function CustomRoadmapBuilder(props: CustomRoadmapBuilderProps) {
  if (!props.open) return null;
  return (
    <CustomRoadmapBuilderModal
      key={props.initialDraft ? "edit" : "new"}
      {...props}
    />
  );
}

function CustomRoadmapBuilderModal({
  open,
  onOpenChange,
  onRoadmapSaved,
  initialDraft,
  existingActiveRoadmap = false,
}: CustomRoadmapBuilderProps) {
  const [mode, setMode] = useState<"form" | "paste">("form");
  const [title, setTitle] = useState(() => initialDraft?.title || "Custom Roadmap");
  const [weeks, setWeeks] = useState<WeekDraft[]>(() => {
    if (initialDraft?.weeks && initialDraft.weeks.length > 0) {
      return initialDraft.weeks;
    }
    return [
      {
        weekNumber: 1,
        title: "Arrays & Hashing",
        days: [
          {
            dayNumber: 1,
            questions: [
              { raw: "Two Sum", title: "Two Sum" },
              { raw: "Contains Duplicate", title: "Contains Duplicate" },
            ],
          },
          {
            dayNumber: 2,
            questions: [
              { raw: "Valid Anagram", title: "Valid Anagram" },
              { raw: "#49 Group Anagrams", title: "Group Anagrams", leetcodeId: 49 },
            ],
          },
        ],
      },
    ];
  });

  const [pasteText, setPasteText] = useState(() => {
    if (initialDraft?.weeks && initialDraft.weeks.length > 0) {
      return serializeDraft(initialDraft);
    }
    return EXAMPLE_PASTE_TEXT;
  });
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Resolution state
  const [resolvedDraft, setResolvedDraft] = useState<ResolvedDraft | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Current draft in memory
  const currentDraft: RoadmapDraft = useMemo(() => {
    if (mode === "form") {
      return { title, weeks };
    } else {
      const parsed = parseRoadmapText(pasteText, title);
      return parsed.draft;
    }
  }, [mode, title, weeks, pasteText]);

  // Current issues in memory
  const currentIssues: Issue[] = useMemo(() => {
    if (mode === "paste") {
      return parseRoadmapText(pasteText, title).issues;
    } else {
      // Validate form draft
      const issues: Issue[] = [];
      const seenProblems = new Set<string>();

      weeks.forEach((w) => {
        if (w.weekNumber < 1 || w.weekNumber > 26) {
          issues.push({
            type: "error",
            message: `Week ${w.weekNumber} is outside the allowed range of 1 to 26.`,
          });
        }

        const totalQ = w.days.reduce((acc, d) => acc + d.questions.length, 0);
        if (totalQ === 0) {
          issues.push({
            type: "warning",
            message: `Week ${w.weekNumber} has no questions.`,
          });
        }

        w.days.forEach((d) => {
          if (d.dayNumber < 1 || d.dayNumber > 7) {
            issues.push({
              type: "error",
              message: `Week ${w.weekNumber}, Day ${d.dayNumber} is outside 1..7.`,
            });
          }
          if (d.questions.length > 10) {
            issues.push({
              type: "warning",
              message: `Week ${w.weekNumber}, Day ${d.dayNumber} has ${d.questions.length} questions (maximum 10 recommended).`,
            });
          }

          d.questions.forEach((q) => {
            const parsed = parseQuestionLine(q.raw || q.title);
            issues.push(...parsed.issues);

            const key = parsed.entry.slug
              ? `slug:${parsed.entry.slug}`
              : parsed.entry.leetcodeId !== undefined
              ? `lc:${parsed.entry.leetcodeId}`
              : `title:${parsed.entry.title.toLowerCase().trim()}`;

            if (seenProblems.has(key)) {
              issues.push({
                type: "warning",
                message: `Duplicate problem "${q.title}" skipped in week ${w.weekNumber}.`,
              });
            } else {
              seenProblems.add(key);
            }
          });
        });
      });

      return issues;
    }
  }, [mode, title, weeks, pasteText]);

  const hasBlockingErrors = currentIssues.some((i) => i.type === "error");

  // Debounced live resolution API call
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      setIsResolving(true);
      try {
        const body = mode === "paste" ? { text: pasteText, title } : { draft: currentDraft };
        const res = await fetch("/api/roadmap/custom/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok && !ignore) {
          const json = await res.json();
          setResolvedDraft(json.resolved);
        }
      } catch {
        // ignore resolution error
      } finally {
        if (!ignore) setIsResolving(false);
      }
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [mode, currentDraft, pasteText, title]);

  // Mode switching
  const handleSwitchMode = (targetMode: "form" | "paste") => {
    setSwitchError(null);
    if (targetMode === mode) return;

    if (mode === "form" && targetMode === "paste") {
      // Serialize form draft to text
      const serialized = serializeDraft({ title, weeks });
      setPasteText(serialized);
      setMode("paste");
    } else if (mode === "paste" && targetMode === "form") {
      // Parse text; if blocking errors, stay in paste mode
      const { draft: parsedDraft, issues } = parseRoadmapText(pasteText, title);
      const blocking = issues.filter((i) => i.type === "error");
      if (blocking.length > 0) {
        setSwitchError(
          `Cannot switch to Form mode with ${blocking.length} blocking error(s). Please fix them first.`
        );
        return;
      }
      setWeeks(parsedDraft.weeks);
      setMode("form");
    }
  };

  // Form Mode: Week handlers
  const handleAddWeek = () => {
    if (weeks.length >= 26) return;
    const nextNum = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1;
    setWeeks([...weeks, { weekNumber: nextNum, days: [] }]);
  };

  const handleRemoveWeek = (weekNum: number) => {
    if (weeks.length <= 1) return;
    setWeeks(weeks.filter((w) => w.weekNumber !== weekNum));
  };

  const toggleWeekCollapse = (weekNum: number) => {
    setCollapsedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  const handleWeekTitleChange = (weekNum: number, newTitle: string) => {
    setWeeks(
      weeks.map((w) => (w.weekNumber === weekNum ? { ...w, title: newTitle } : w))
    );
  };

  // Form Mode: Day handlers
  const handleDayTitleChange = (weekNum: number, dayNum: number, dTitle: string) => {
    setWeeks(
      weeks.map((w) => {
        if (w.weekNumber !== weekNum) return w;
        const dayExists = w.days.some((d) => d.dayNumber === dayNum);
        const newDays = dayExists
          ? w.days.map((d) => (d.dayNumber === dayNum ? { ...d, title: dTitle } : d))
          : [...w.days, { dayNumber: dayNum, title: dTitle, questions: [] }];
        return { ...w, days: newDays.sort((a, b) => a.dayNumber - b.dayNumber) };
      })
    );
  };

  const handleDayTextChange = (weekNum: number, dayNum: number, rawText: string) => {
    const rawLines = rawText.split("\n");
    const parsedQuestions: QuestionEntry[] = [];

    rawLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const { entry } = parseQuestionLine(trimmed);
      parsedQuestions.push(entry);
    });

    setWeeks(
      weeks.map((w) => {
        if (w.weekNumber !== weekNum) return w;
        const dayExists = w.days.some((d) => d.dayNumber === dayNum);
        let updatedDays: DayDraft[];

        if (dayExists) {
          updatedDays = w.days.map((d) =>
            d.dayNumber === dayNum ? { ...d, questions: parsedQuestions } : d
          );
        } else {
          updatedDays = [
            ...w.days,
            { dayNumber: dayNum, questions: parsedQuestions },
          ];
        }

        // Filter out empty days without title
        updatedDays = updatedDays.filter(
          (d) => d.questions.length > 0 || (d.title && d.title.trim().length > 0)
        );

        return { ...w, days: updatedDays.sort((a, b) => a.dayNumber - b.dayNumber) };
      })
    );
  };

  // Suggestion accept handler: updates entry title with suggested problem
  const handleAcceptSuggestion = (
    weekNum: number,
    dayNum: number,
    oldRaw: string,
    suggestedTitle: string
  ) => {
    if (mode === "form") {
      setWeeks(
        weeks.map((w) => {
          if (w.weekNumber !== weekNum) return w;
          return {
            ...w,
            days: w.days.map((d) => {
              if (d.dayNumber !== dayNum) return d;
              return {
                ...d,
                questions: d.questions.map((q) =>
                  q.raw === oldRaw || q.title === oldRaw
                    ? { raw: suggestedTitle, title: suggestedTitle }
                    : q
                ),
              };
            }),
          };
        })
      );
    } else {
      // In paste mode, replace line in text
      const regex = new RegExp(`^${escapeRegex(oldRaw.trim())}$`, "m");
      setPasteText((prev) => prev.replace(regex, suggestedTitle));
    }
  };

  // Save handler
  const handleSave = async () => {
    setSaveError(null);
    if (hasBlockingErrors) {
      setSaveError("Please resolve all blocking errors before creating the roadmap.");
      return;
    }

    if (existingActiveRoadmap && !showConfirmArchive) {
      setShowConfirmArchive(true);
      return;
    }

    setIsSaving(true);
    try {
      const payload =
        mode === "paste"
          ? { text: pasteText, title }
          : { draft: { title, weeks } };

      const res = await fetch("/api/roadmap/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        onRoadmapSaved(json.roadmap);
        onOpenChange(false);
      } else {
        setSaveError(json.error || "Failed to save custom roadmap.");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
      setShowConfirmArchive(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border/60 bg-tint/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-green" />
                Custom Roadmap Builder
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted mt-0.5">
                Build your own weekly curriculum. Supports Form entry and structured Paste mode.
              </DialogDescription>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-tint border border-border/60 self-start sm:self-auto">
              <Button
                type="button"
                size="sm"
                variant={mode === "form" ? "default" : "ghost"}
                onClick={() => handleSwitchMode("form")}
                className="h-7 px-3 text-xs font-semibold gap-1.5 rounded-[9px]"
              >
                <FileText className="h-3.5 w-3.5" />
                Form Mode
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "paste" ? "default" : "ghost"}
                onClick={() => handleSwitchMode("paste")}
                className="h-7 px-3 text-xs font-semibold gap-1.5 rounded-[9px]"
              >
                <Code2 className="h-3.5 w-3.5" />
                Paste Text
              </Button>
            </div>
          </div>

          {/* Roadmap Name Input */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Roadmap Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 8-Week High-Yield Interview Prep"
                className="h-9 text-sm rounded-[10px] bg-background border-border/60"
                maxLength={200}
              />
            </div>
            {mode === "form" && (
              <div className="flex items-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWeek}
                  disabled={weeks.length >= 26}
                  className="h-9 gap-1.5 rounded-[10px] text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Week ({weeks.length}/26)
                </Button>
              </div>
            )}
          </div>

          {switchError && (
            <div className="mt-3 p-2.5 rounded-[10px] bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{switchError}</span>
            </div>
          )}
        </DialogHeader>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Confirmation Overlay if existing active roadmap needs archiving */}
          {showConfirmArchive && (
            <div className="rounded-[16px] border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    Replace Active Roadmap?
                  </h4>
                  <p className="text-xs text-text-muted">
                    You currently have an active roadmap. Saving this new custom roadmap will
                    set your existing roadmap to inactive (it will not be deleted). Do you want
                    to continue?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmArchive(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-7 text-xs font-semibold"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Confirm & Archive Previous
                </Button>
              </div>
            </div>
          )}

          {/* Mode A: Form Mode */}
          {mode === "form" && (
            <div className="space-y-4">
              {weeks.map((week) => {
                const isCollapsed = collapsedWeeks[week.weekNumber];
                return (
                  <div
                    key={week.weekNumber}
                    className="rounded-[16px] border border-border/80 bg-background shadow-soft overflow-hidden transition-all"
                  >
                    {/* Week Header Card */}
                    <div className="flex items-center justify-between p-4 bg-tint/30 border-b border-border/60">
                      <div className="flex items-center gap-3 flex-1 mr-4">
                        <span className="font-bold text-sm text-foreground shrink-0">
                          Week {week.weekNumber}
                        </span>
                        <Input
                          value={week.title || ""}
                          onChange={(e) =>
                            handleWeekTitleChange(week.weekNumber, e.target.value)
                          }
                          placeholder="Optional week focus (e.g. Arrays & Hashing)"
                          className="h-8 text-xs bg-background max-w-sm rounded-[8px]"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWeekCollapse(week.weekNumber)}
                          className="h-8 w-8 p-0 rounded-[8px]"
                          aria-label="Toggle week"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                        {weeks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWeek(week.weekNumber)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 rounded-[8px]"
                            aria-label="Remove week"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 7 Day Boxes */}
                    {!isCollapsed && (
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 bg-tint/10">
                        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                          const dayDraft = week.days.find((d) => d.dayNumber === dayNum);
                          const dayText =
                            dayDraft?.questions.map((q) => q.raw || q.title).join("\n") || "";

                          // Detect header-like warning inside day box
                          const headerWarnings = (dayDraft?.questions || []).filter((q) =>
                            /^(?:week|wk|day)\s*\d+/i.test(q.raw)
                          );

                          return (
                            <div
                              key={dayNum}
                              className="rounded-[12px] border border-border/60 bg-background p-2.5 flex flex-col gap-1.5 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-foreground">
                                  Day {dayNum}
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  {dayDraft?.questions.length || 0}/10
                                </span>
                              </div>

                              <Input
                                value={dayDraft?.title || ""}
                                onChange={(e) =>
                                  handleDayTitleChange(
                                    week.weekNumber,
                                    dayNum,
                                    e.target.value
                                  )
                                }
                                placeholder="Day topic (optional)"
                                className="h-6 text-[10px] px-2 rounded-[6px]"
                              />

                              <Textarea
                                value={dayText}
                                onChange={(e) =>
                                  handleDayTextChange(
                                    week.weekNumber,
                                    dayNum,
                                    e.target.value
                                  )
                                }
                                placeholder={"Two Sum\nContains Duplicate"}
                                rows={4}
                                className="text-xs resize-none rounded-[8px] p-2 leading-relaxed"
                              />

                              {headerWarnings.length > 0 && (
                                <p className="text-[9px] text-amber-600 leading-tight">
                                  Warning: Header-like line treated as question.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mode B: Paste Text Mode */}
          {mode === "paste" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Editor & Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-accent-green" />
                    Structured Text Input
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPasteText(EXAMPLE_PASTE_TEXT)}
                      className="h-7 text-xs font-semibold rounded-[8px]"
                    >
                      Load Example
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelp(!showHelp)}
                      className="h-7 text-xs gap-1 rounded-[8px]"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      Help
                    </Button>
                  </div>
                </div>

                {showHelp && (
                  <div className="rounded-[12px] border border-border/80 bg-tint/30 p-3 text-xs space-y-1.5 text-text-muted">
                    <p className="font-bold text-foreground">Grammar Rules:</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li><strong className="text-foreground">Week header:</strong> &quot;Week 1&quot;, &quot;Week 1: Arrays&quot;, &quot;Wk 2&quot; (1..26).</li>
                      <li><strong className="text-foreground">Day header:</strong> &quot;Day 1&quot;, &quot;Day 1: Intro&quot; (1..7).</li>
                      <li><strong className="text-foreground">LeetCode IDs:</strong> &quot;#49 Title&quot;, &quot;LC 49&quot;, &quot;LeetCode 49&quot;, or digits-only line.</li>
                      <li><strong className="text-foreground">LeetCode URLs:</strong> &quot;https://leetcode.com/problems/&lt;slug&gt;/&quot; (slug extracted).</li>
                      <li><strong className="text-foreground">Difficulty tag:</strong> (Easy), [Medium], - Hard.</li>
                      <li>Leading list markers (-, *, 1., 1)) are automatically stripped.</li>
                    </ul>
                  </div>
                )}

                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={18}
                  placeholder={EXAMPLE_PASTE_TEXT}
                  className="font-mono text-xs leading-relaxed p-3.5 rounded-[12px] bg-background border-border/80"
                />
              </div>

              {/* Right Column: Live Resolution Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Live Parsed Preview
                    {isResolving && <Loader2 className="h-3 w-3 animate-spin text-accent-green" />}
                  </h3>
                  {resolvedDraft && (
                    <span className="text-[11px] text-text-muted">
                      {resolvedDraft.totals.questions} problems in {resolvedDraft.totals.weeks} week(s)
                    </span>
                  )}
                </div>

                <div className="rounded-[12px] border border-border/80 bg-tint/10 p-3.5 max-h-[440px] overflow-y-auto space-y-3">
                  {renderPreviewTree(resolvedDraft, handleAcceptSuggestion)}
                </div>
              </div>
            </div>
          )}

          {/* Shared Live Totals & Issue List in Form Mode (below form) */}
          {mode === "form" && (
            <div className="border-t border-border/60 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Live Resolution & Issues
                {isResolving && <Loader2 className="h-3 w-3 animate-spin text-accent-green" />}
              </h3>
              <div className="rounded-[12px] border border-border/80 bg-tint/10 p-4 space-y-3">
                {renderPreviewTree(resolvedDraft, handleAcceptSuggestion)}
              </div>
            </div>
          )}

          {/* Issues List */}
          {currentIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground">Issues Log ({currentIssues.length})</h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {currentIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded-[8px] text-xs ${
                      issue.type === "error"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {issue.type === "error" ? (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>
                      {issue.line ? `Line ${issue.line}: ` : ""}
                      {issue.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-[12px] bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              {saveError}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/60 bg-tint/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {resolvedDraft ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {resolvedDraft.totals.matched} matched
                </span>
                <span>•</span>
                <span>{resolvedDraft.totals.custom} custom</span>
                {resolvedDraft.totals.suggested > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 font-semibold">
                      {resolvedDraft.totals.suggested} suggestions
                    </span>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-[10px] text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={hasBlockingErrors || isSaving || (resolvedDraft?.totals.questions || 0) === 0}
              className="h-9 px-5 rounded-[10px] text-xs font-semibold gap-1.5"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Roadmap
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renderPreviewTree(
  resolved: ResolvedDraft | null,
  onAcceptSuggestion: (wNum: number, dNum: number, oldRaw: string, newTitle: string) => void
) {
  if (!resolved || resolved.weeks.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-text-muted italic">
        No weeks or questions parsed yet. Enter questions in Form or Paste mode.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resolved.weeks.map((week) => (
        <div
          key={week.weekNumber}
          className="rounded-[10px] border border-border/60 bg-background/80 p-3 space-y-2"
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
            <span className="text-xs font-bold text-foreground">
              Week {week.weekNumber}
              {week.title ? `: ${week.title}` : ""}
            </span>
            <span className="text-[10px] text-text-muted">
              {week.days.reduce((acc, d) => acc + d.questions.length, 0)} questions
            </span>
          </div>

          <div className="space-y-2">
            {week.days.map((day) => (
              <div key={day.dayNumber} className="space-y-1">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Day {day.dayNumber}
                  {day.title ? ` — ${day.title}` : ""}
                </span>

                <div className="space-y-1">
                  {day.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 p-2 rounded-[8px] bg-tint/40 text-xs border border-border/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {q.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={
                              q.difficulty.toLowerCase() === "easy"
                                ? "easy"
                                : q.difficulty.toLowerCase() === "medium"
                                ? "medium"
                                : "hard"
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {q.difficulty}
                          </Badge>

                          {q.status === "matched" && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                q.matchSource === "user"
                                  ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/10"
                                  : "border-indigo-500/50 text-indigo-600 bg-indigo-500/10"
                              }`}
                            >
                              {q.matchSource === "user" ? "Your Problem" : "Catalog"}
                            </Badge>
                          )}

                          {q.status === "suggested" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 border-amber-500/50 text-amber-600 bg-amber-500/10"
                            >
                              Suggested
                            </Badge>
                          )}

                          {q.status === "custom" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 text-text-muted border-border/60"
                            >
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Clickable Suggestions if status === 'suggested' */}
                      {q.status === "suggested" && q.suggestions && q.suggestions.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/30">
                          <span className="text-[10px] text-text-muted">Did you mean:</span>
                          {q.suggestions.map((s, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() =>
                                onAcceptSuggestion(
                                  week.weekNumber,
                                  day.dayNumber,
                                  q.raw || q.title,
                                  s.title
                                )
                              }
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/30 transition-colors"
                            >
                              + {s.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
