// =============================================================================
// Problem detail page — view problem, submit code, run test cases
// =============================================================================

"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CodeEditor } from "@/components/code-editor";
import { CodeViewer } from "@/components/code-viewer";
import { SubmissionHistory, type SubmissionItem } from "@/components/submission-history";
import { ExamplesViewer, type TestCaseItem } from "@/components/test-case-runner";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Loader2,
  Code2,
  BookOpen,
  Lightbulb,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Problem {
  id: string;
  shortCode: string;
  title: string;
  description: string;
  difficulty: string;
  source: string;
  status: string;
  constraints: string | null;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  hints: string[];
  approaches: { title: string; description: string }[];
  notes: string | null;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  topics: { topic: { id: string; name: string } }[];
  testCases: TestCaseItem[];
  submissions: SubmissionItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ProblemDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"workspace" | "overview" | "hints">("workspace");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/problems/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load problem");
        }
        const data = await res.json();
        if (!ignore) {
          setProblem(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function reloadProblem() {
    try {
      const res = await fetch(`/api/problems/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProblem(data);
      }
    } catch (err) {
      console.error("Failed to reload problem:", err);
    }
  }

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus || !problem) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProblem((prev) => (prev ? { ...prev, status: updated.status, solvedAt: updated.solvedAt } : null));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/problems/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/problems");
      router.refresh();
    } catch {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">{error || "Problem not found"}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Problems
          </Link>
        </Button>
      </div>
    );
  }

  const hints = Array.isArray(problem.hints) ? problem.hints : [];
  const approaches = Array.isArray(problem.approaches) ? problem.approaches : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button and actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="rounded-[14px] text-secondary hover:text-foreground">
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Problems
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {/* Status Quick Select */}
          <Select
            value={problem.status}
            onValueChange={handleStatusChange}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="w-[140px] text-xs h-9 bg-tint border-transparent rounded-[14px]">
              <span className="text-secondary mr-1">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ATTEMPTED">Attempted</SelectItem>
              <SelectItem value="SOLVED">Solved</SelectItem>
              <SelectItem value="REVISIT">Revisit</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild variant="outline" size="sm" className="rounded-[14px] bg-card border-border/70">
            <Link href={`/problems/${id}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-[14px]"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[24px] p-6">
              <DialogHeader>
                <DialogTitle>Delete Problem</DialogTitle>
                <DialogDescription className="text-secondary">
                  Are you sure you want to delete &ldquo;{problem.title}&rdquo;?
                  This will also remove all test cases and submissions. This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" disabled={isDeleting} className="rounded-[14px]">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-[14px]"
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Header Info */}
      <div className="mb-6 rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 shadow-soft">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {problem.title}
          </h1>
          <Badge
            variant={
              problem.difficulty.toLowerCase() === "easy"
                ? "easy"
                : problem.difficulty.toLowerCase() === "medium"
                ? "medium"
                : "hard"
            }
            className="text-xs px-2.5 py-0.5 font-semibold"
          >
            {problem.difficulty}
          </Badge>
          <Badge
            variant={problem.status === "SOLVED" ? "solved" : "secondary"}
            className="text-xs px-2.5 py-0.5 font-semibold"
          >
            {problem.status}
          </Badge>
          {problem.source === "LEETCODE" && (
            <Badge variant="streak" className="text-xs px-2.5 py-0.5 font-semibold">
              LeetCode
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-secondary">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-secondary" />
            Added {formatDate(problem.createdAt)}
          </span>
          {problem.solvedAt && (
            <span className="flex items-center gap-1.5 font-semibold text-[#2D6A1E]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solved {formatDate(problem.solvedAt)}
            </span>
          )}
          <span className="font-mono text-[11px] text-secondary">
            ID: {problem.shortCode}
          </span>
        </div>

        {/* Complexity Pills */}
        {(problem.timeComplexity || problem.spaceComplexity) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {problem.timeComplexity && (
              <Badge
                variant="secondary"
                className="font-mono text-xs px-3 py-1 font-medium"
              >
                Time: {problem.timeComplexity}
              </Badge>
            )}
            {problem.spaceComplexity && (
              <Badge
                variant="secondary"
                className="font-mono text-xs px-3 py-1 font-medium"
              >
                Space: {problem.spaceComplexity}
              </Badge>
            )}
          </div>
        )}

        {/* Topics */}
        {problem.topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {problem.topics.map(({ topic }) => (
              <Badge
                key={topic.id}
                variant="outline"
                className="text-xs rounded-full bg-tint/60 border-border/70 text-secondary font-medium px-3 py-0.5"
              >
                {topic.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border/50 pb-3">
        <Button
          type="button"
          variant={activeTab === "workspace" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("workspace")}
          className="gap-2 text-xs rounded-full font-semibold px-4 py-2"
        >
          <Code2 className="h-4 w-4" />
          Solutions &amp; Code ({problem.submissions.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "overview" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
          className="gap-2 text-xs rounded-full font-semibold px-4 py-2"
        >
          <BookOpen className="h-4 w-4" />
          Description &amp; Examples ({problem.testCases.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "hints" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("hints")}
          className="gap-2 text-xs rounded-full font-semibold px-4 py-2"
        >
          <Lightbulb className="h-4 w-4" />
          Hints &amp; Approaches ({hints.length + approaches.length})
        </Button>
      </div>

      {/* Tab 1: Solutions & Code */}
      {activeTab === "workspace" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Solution Recording Form */}
          <div className="space-y-6">
            <CodeEditor
              problemId={problem.id}
              onSubmissionCreated={reloadProblem}
            />
          </div>

          {/* Right Column: Read-Only Solution Viewer & History */}
          <div className="space-y-6">
            {problem.submissions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Latest Solution Code</h3>
                <CodeViewer
                  code={problem.submissions[0].code}
                  language={problem.submissions[0].language}
                  runtime={problem.submissions[0].runtime}
                  memory={problem.submissions[0].memory}
                  notes={problem.submissions[0].notes}
                />
              </div>
            )}
            <SubmissionHistory submissions={problem.submissions} />
          </div>
        </div>
      )}

      {/* Tab 2: Description & Examples */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
              <CardHeader className="pb-3 pt-6 px-6">
                <CardTitle className="text-base font-bold text-foreground">Description</CardTitle>
              </CardHeader>
              <CardContent className="pb-6 px-6">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {problem.description}
                </div>
              </CardContent>
            </Card>

            {/* Constraints */}
            {problem.constraints && (
              <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
                <CardHeader className="pb-3 pt-6 px-6">
                  <CardTitle className="text-base font-bold text-foreground">Constraints</CardTitle>
                </CardHeader>
                <CardContent className="pb-6 px-6">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-secondary bg-tint rounded-[14px] p-3.5">
                    {problem.constraints}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Target Complexity */}
            {(problem.timeComplexity || problem.spaceComplexity) && (
              <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
                <CardHeader className="pb-3 pt-6 px-6">
                  <CardTitle className="text-base font-bold text-foreground">Target Complexity</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6 px-6">
                  {problem.timeComplexity && (
                    <div className="rounded-[16px] bg-tint p-4 border border-transparent">
                      <span className="text-xs font-semibold text-secondary">Time Complexity</span>
                      <p className="mt-1 font-mono text-sm font-bold text-foreground">{problem.timeComplexity}</p>
                    </div>
                  )}
                  {problem.spaceComplexity && (
                    <div className="rounded-[16px] bg-tint p-4 border border-transparent">
                      <span className="text-xs font-semibold text-secondary">Space Complexity</span>
                      <p className="mt-1 font-mono text-sm font-bold text-foreground">{problem.spaceComplexity}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {problem.notes && (
              <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
                <CardHeader className="pb-3 pt-6 px-6">
                  <CardTitle className="text-base font-bold text-foreground">Personal Notes</CardTitle>
                </CardHeader>
                <CardContent className="pb-6 px-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {problem.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Examples & Edge Cases */}
          <div>
            <ExamplesViewer testCases={problem.testCases} />
          </div>
        </div>
      )}

      {/* Tab 3: Hints & Approaches */}
      {activeTab === "hints" && (
        <div className="space-y-6">
          {/* Hints */}
          <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
            <CardHeader className="pb-3 pt-6 px-6">
              <CardTitle className="text-base font-bold text-foreground">
                Hints ({hints.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 px-6">
              {hints.length === 0 ? (
                <p className="text-sm text-secondary">
                  No hints recorded yet.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {hints.map((hint, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-[16px] bg-tint p-3.5 text-sm"
                    >
                      <span className="shrink-0 font-mono text-xs font-bold text-accent-orange">
                        Hint {i + 1}
                      </span>
                      <span className="leading-relaxed text-foreground">{hint as string}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Approaches */}
          <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
            <CardHeader className="pb-3 pt-6 px-6">
              <CardTitle className="text-base font-bold text-foreground">
                Approaches ({approaches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6 px-6">
              {approaches.length === 0 ? (
                <p className="text-sm text-secondary">
                  No approaches recorded yet.
                </p>
              ) : (
                approaches.map((approach, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="my-4 border-border/60" />}
                    <h4 className="font-bold text-sm text-foreground">
                      {(approach as { title: string }).title}
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-secondary leading-relaxed">
                      {(approach as { description: string }).description}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProblemDetailContent params={params} />
    </Suspense>
  );
}
