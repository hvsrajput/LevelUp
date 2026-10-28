// =============================================================================
// Problem Form — shared between create and edit
// =============================================================================
// This is a client component because it manages form state.
// It's used by both /problems/new and /problems/[id]/edit.
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";
import type { CreateProblemInput } from "@/lib/validators/problem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProblemFormProps {
  /** If provided, the form is in edit mode */
  initialData?: Partial<CreateProblemInput> & { id?: string };
  /** Whether this is an edit form */
  isEdit?: boolean;
}

type TestCaseInput = {
  input: string;
  expectedOutput: string;
  explanation?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProblemForm({ initialData, isEdit = false }: ProblemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [difficulty, setDifficulty] = useState(
    initialData?.difficulty ?? "MEDIUM"
  );
  const [status, setStatus] = useState(initialData?.status ?? "ATTEMPTED");
  const [constraints, setConstraints] = useState(
    initialData?.constraints ?? ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Topics as a tag input
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>(
    initialData?.topicNames ?? []
  );

  // Test cases
  const [testCases, setTestCases] = useState<TestCaseInput[]>(
    initialData?.testCases ?? []
  );

  // Hints
  const [hints, setHints] = useState<string[]>(
    (initialData?.hints as string[]) ?? []
  );
  const [hintInput, setHintInput] = useState("");

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function addTopic() {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setTopicInput("");
    }
  }

  function removeTopic(topic: string) {
    setTopics(topics.filter((t) => t !== topic));
  }

  function addHint() {
    const trimmed = hintInput.trim();
    if (trimmed) {
      setHints([...hints, trimmed]);
      setHintInput("");
    }
  }

  function removeHint(index: number) {
    setHints(hints.filter((_, i) => i !== index));
  }

  function addTestCase() {
    setTestCases([...testCases, { input: "", expectedOutput: "" }]);
  }

  function updateTestCase(
    index: number,
    field: keyof TestCaseInput,
    value: string
  ) {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  }

  function removeTestCase(index: number) {
    setTestCases(testCases.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: CreateProblemInput = {
      title,
      description,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      status: status as "ATTEMPTED" | "SOLVED" | "REVISIT",
      source: "MANUAL",
      constraints: constraints || null,
      notes: notes || null,
      hints,
      approaches: [],
      topicNames: topics,
      testCases: testCases.filter((tc) => tc.input && tc.expectedOutput),
    };

    try {
      const url = isEdit
        ? `/api/problems/${initialData?.id}`
        : "/api/problems";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      const problem = await response.json();
      router.push(`/problems/${problem.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title & Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Two Sum"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={difficulty}
                onValueChange={(val) => {
                  if (val) setDifficulty(val as "EASY" | "MEDIUM" | "HARD");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => {
                  if (val) setStatus(val as "ATTEMPTED" | "SOLVED" | "REVISIT");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATTEMPTED">Attempted</SelectItem>
                  <SelectItem value="SOLVED">Solved</SelectItem>
                  <SelectItem value="REVISIT">Revisit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Given an array of integers nums and an integer target..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="2 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Add topic (e.g., Array, Hash Table)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTopic();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTopic}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => removeTopic(topic)}
                >
                  {topic}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Test Cases</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
            <Plus className="mr-1 h-4 w-4" /> Add Test Case
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {testCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No test cases yet. Click &ldquo;Add Test Case&rdquo; to add one.
            </p>
          ) : (
            testCases.map((tc, index) => (
              <div
                key={index}
                className="relative space-y-3 rounded-lg border p-4"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => removeTestCase(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="space-y-2">
                  <Label>Input</Label>
                  <Textarea
                    value={tc.input}
                    onChange={(e) =>
                      updateTestCase(index, "input", e.target.value)
                    }
                    placeholder="nums = [2,7,11,15], target = 9"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Output</Label>
                  <Textarea
                    value={tc.expectedOutput}
                    onChange={(e) =>
                      updateTestCase(index, "expectedOutput", e.target.value)
                    }
                    placeholder="[0, 1]"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Explanation (optional)</Label>
                  <Input
                    value={tc.explanation ?? ""}
                    onChange={(e) =>
                      updateTestCase(index, "explanation", e.target.value)
                    }
                    placeholder="Because nums[0] + nums[1] == 9"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Hints */}
      <Card>
        <CardHeader>
          <CardTitle>Hints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
              placeholder="Add a hint..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHint();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addHint}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {hints.length > 0 && (
            <ol className="space-y-2">
              {hints.map((hint, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded-md border p-3 text-sm"
                >
                  <span className="shrink-0 font-mono text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="flex-1">{hint}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHint(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal notes, observations, learnings..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Problem"
          )}
        </Button>
      </div>
    </form>
  );
}
