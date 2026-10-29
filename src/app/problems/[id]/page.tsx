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
import { difficultyColor, statusColor, formatDate } from "@/lib/utils";
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
        <Button asChild variant="ghost" size="sm">
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
            <SelectTrigger className="w-[140px] text-xs">
              <span className="text-muted-foreground mr-1">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ATTEMPTED">Attempted</SelectItem>
              <SelectItem value="SOLVED">Solved</SelectItem>
              <SelectItem value="REVISIT">Revisit</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild variant="outline" size="sm">
            <Link href={`/problems/${id}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Problem</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &ldquo;{problem.title}&rdquo;?
                  This will also remove all test cases and submissions. This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
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
      <div className="mb-6 rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {problem.title}
          </h1>
          <Badge
            variant="outline"
            className={difficultyColor(problem.difficulty)}
          >
            {problem.difficulty}
          </Badge>
          <Badge variant="secondary" className={statusColor(problem.status)}>
            {problem.status}
          </Badge>
          {problem.source === "LEETCODE" && (
            <Badge variant="outline" className="text-orange-600">
              LeetCode
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Added {formatDate(problem.createdAt)}
          </span>
          {problem.solvedAt && (
            <span className="flex items-center gap-1 font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solved {formatDate(problem.solvedAt)}
            </span>
          )}
          <span className="font-mono text-[11px] text-muted-foreground/80">
            ID: {problem.shortCode}
          </span>
        </div>

        {/* Complexity Pills */}
        {(problem.timeComplexity || problem.spaceComplexity) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {problem.timeComplexity && (
              <Badge
                variant="outline"
                className="font-mono text-xs border-blue-200 bg-blue-50/70 text-blue-800"
              >
                Time: {problem.timeComplexity}
              </Badge>
            )}
            {problem.spaceComplexity && (
              <Badge
                variant="outline"
                className="font-mono text-xs border-purple-200 bg-purple-50/70 text-purple-800"
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
              <Badge key={topic.id} variant="outline" className="text-xs">
                {topic.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="mb-6 flex gap-2 border-b pb-3">
        <Button
          type="button"
          variant={activeTab === "workspace" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("workspace")}
          className="gap-1.5 text-xs"
        >
          <Code2 className="h-4 w-4" />
          Solutions &amp; Code ({problem.submissions.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
          className="gap-1.5 text-xs"
        >
          <BookOpen className="h-4 w-4" />
          Description &amp; Examples ({problem.testCases.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "hints" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("hints")}
          className="gap-1.5 text-xs"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {problem.description}
                </div>
              </CardContent>
            </Card>

            {/* Constraints */}
            {problem.constraints && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                    {problem.constraints}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Target Complexity */}
            {(problem.timeComplexity || problem.spaceComplexity) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Target Complexity</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {problem.timeComplexity && (
                    <div className="rounded-md border p-3">
                      <span className="text-xs font-medium text-muted-foreground">Time Complexity</span>
                      <p className="mt-1 font-mono text-sm font-semibold text-blue-700">{problem.timeComplexity}</p>
                    </div>
                  )}
                  {problem.spaceComplexity && (
                    <div className="rounded-md border p-3">
                      <span className="text-xs font-medium text-muted-foreground">Space Complexity</span>
                      <p className="mt-1 font-mono text-sm font-semibold text-purple-700">{problem.spaceComplexity}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {problem.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Personal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Hints ({hints.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hints.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hints recorded yet.
                </p>
              ) : (
                <ol className="space-y-2">
                  {hints.map((hint, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-sm"
                    >
                      <span className="shrink-0 font-mono text-xs font-semibold text-primary">
                        Hint {i + 1}
                      </span>
                      <span className="leading-relaxed">{hint as string}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Approaches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Approaches ({approaches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {approaches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No approaches recorded yet.
                </p>
              ) : (
                approaches.map((approach, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="my-4" />}
                    <h4 className="font-semibold text-sm">
                      {(approach as { title: string }).title}
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
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
