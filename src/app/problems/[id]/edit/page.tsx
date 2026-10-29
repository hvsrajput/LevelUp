// =============================================================================
// Edit problem page — loads existing data into the shared form
// =============================================================================

"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProblemForm } from "@/components/problem-form";
import { ArrowLeft, Loader2 } from "lucide-react";

function EditProblemContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await fetch(`/api/problems/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load problem");
        }
        const problem = await res.json();

        // Transform API response into the shape the form expects
        setInitialData({
          id: problem.id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          status: problem.status,
          source: problem.source,
          constraints: problem.constraints,
          timeComplexity: problem.timeComplexity,
          spaceComplexity: problem.spaceComplexity,
          hints: Array.isArray(problem.hints) ? problem.hints : [],
          approaches: Array.isArray(problem.approaches) ? problem.approaches : [],
          notes: problem.notes,
          topicNames: problem.topics.map(
            (t: { topic: { name: string } }) => t.topic.name
          ),
          testCases: problem.testCases.map(
            (tc: {
              id: string;
              input: string;
              expectedOutput: string;
              explanation: string | null;
            }) => ({
              id: tc.id,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              explanation: tc.explanation ?? "",
            })
          ),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {error || "Problem not found"}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Problems
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Problem</h1>
        <p className="mt-1 text-muted-foreground">
          Update &ldquo;{initialData.title as string}&rdquo;
        </p>
      </div>
      <ProblemForm
        initialData={initialData as Parameters<typeof ProblemForm>[0]["initialData"]}
        isEdit
      />
    </div>
  );
}

export default function EditProblemPage({
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
      <EditProblemContent params={params} />
    </Suspense>
  );
}
