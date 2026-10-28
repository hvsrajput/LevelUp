// =============================================================================
// Problem detail page — view a single problem
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  difficultyColor,
  statusColor,
  formatDate,
} from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Loader2,
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
  hints: string[];
  approaches: { title: string; description: string }[];
  notes: string | null;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  topics: { topic: { id: string; name: string } }[];
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    explanation: string | null;
  }[];
  submissions: {
    id: string;
    language: string;
    code: string;
    createdAt: string;
  }[];
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await fetch(`/api/problems/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load problem");
        }
        const data = await res.json();
        setProblem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + actions */}
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/problems/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{problem.title}</h1>
          <Badge variant="outline" className={difficultyColor(problem.difficulty)}>
            {problem.difficulty}
          </Badge>
          <Badge variant="secondary" className={statusColor(problem.status)}>
            {problem.status}
          </Badge>
          {problem.source === "LEETCODE" && (
            <Badge variant="outline" className="text-orange-600">LeetCode</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Added {formatDate(problem.createdAt)}
          </span>
          {problem.solvedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Solved {formatDate(problem.solvedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Topics */}
        {problem.topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {problem.topics.map(({ topic }) => (
              <Badge key={topic.id} variant="outline">
                {topic.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
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
              <CardTitle>Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {problem.constraints}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Test Cases */}
        {problem.testCases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {problem.testCases.map((tc, i) => (
                <div key={tc.id} className="rounded-lg border p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Test Case {i + 1}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Input</p>
                      <pre className="mt-1 rounded bg-muted p-2 font-mono text-sm">
                        {tc.input}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Output</p>
                      <pre className="mt-1 rounded bg-muted p-2 font-mono text-sm">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                  {tc.explanation && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tc.explanation}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Hints */}
        {hints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hints</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {hints.map((hint, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-md border p-3 text-sm"
                  >
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span>{hint as string}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Approaches */}
        {approaches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approaches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {approaches.map((approach, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="my-4" />}
                  <h4 className="font-semibold">{(approach as { title: string }).title}</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {(approach as { description: string }).description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {problem.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{problem.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Submissions */}
        {problem.submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Submissions ({problem.submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {problem.submissions.map((sub) => (
                <div key={sub.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline">{sub.language}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>
                  <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-sm">
                    {sub.code}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
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
