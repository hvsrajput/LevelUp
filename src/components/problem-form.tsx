// =============================================================================
// Problem Form — shared between create and edit
// =============================================================================
// This is a client component because it manages form state.
// It's used by both /problems/new and /problems/[id]/edit.
// =============================================================================

"use client";

import { useState, useEffect } from "react";
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
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { PatternSuggestions } from "@/components/pattern-suggestions";
import type { CreateProblemInput } from "@/lib/validators/problem";
import type { SuggestResponse } from "@/lib/validators/suggest";

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

const COMMON_TOPICS = [
  "Array",
  "String",
  "Hash Table",
  "Dynamic Programming",
  "Two Pointers",
  "Binary Search",
  "Tree",
  "Graph",
  "Stack",
  "Sliding Window",
  "Greedy",
  "Backtracking",
  "Heap",
  "Linked List",
  "Bit Manipulation",
];

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
  const [timeComplexity, setTimeComplexity] = useState(
    initialData?.timeComplexity ?? ""
  );
  const [spaceComplexity, setSpaceComplexity] = useState(
    initialData?.spaceComplexity ?? ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // AI Suggestions State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Topics
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>(
    initialData?.topicNames ?? []
  );
  const [availableTopics, setAvailableTopics] = useState<string[]>(COMMON_TOPICS);

  useEffect(() => {
    let ignore = false;
    fetch("/api/topics")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { name: string }[]) => {
        if (!ignore && Array.isArray(data)) {
          const names = data.map((t) => t.name);
          const combined = Array.from(new Set([...names, ...COMMON_TOPICS]));
          setAvailableTopics(combined);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

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

  function addTopic(topicToAdd?: string) {
    const target = (topicToAdd || topicInput).trim();
    if (target && !topics.includes(target)) {
      setTopics([...topics, target]);
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

  async function handleFetchSuggestions() {
    if (!title.trim() || !description.trim()) {
      setSuggestError("Please enter a title and description first to analyze patterns.");
      return;
    }

    setIsSuggesting(true);
    setSuggestError(null);

    try {
      const res = await fetch("/api/problems/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          constraints: constraints.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate suggestions");
      }

      const data: SuggestResponse = await res.json();
      setSuggestions(data);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleAcceptTopic(topic: string) {
    if (!topics.includes(topic)) {
      setTopics([...topics, topic]);
    }
  }

  function handleAcceptAllTopics(newTopics: string[]) {
    const merged = Array.from(new Set([...topics, ...newTopics]));
    setTopics(merged);
  }

  function handleAcceptHint(hintText: string) {
    if (!hints.includes(hintText)) {
      setHints([...hints, hintText]);
    }
  }

  function handleAcceptAllHints(newHints: string[]) {
    const merged = Array.from(new Set([...hints, ...newHints]));
    setHints(merged);
  }

  function handleAcceptApproachAsNote(approachText: string) {
    setNotes((prev) => (prev ? `${prev}\n\n${approachText}` : approachText));
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
      timeComplexity: timeComplexity || null,
      spaceComplexity: spaceComplexity || null,
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
        <div className="rounded-[14px] bg-[#FFDDD8] p-4 text-xs font-semibold text-[#B42318]">
          {error}
        </div>
      )}

      {/* Title & Difficulty */}
      <Card className="rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 shadow-soft">
        <CardHeader className="p-0 pb-5 border-b border-border/50">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">Problem Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-secondary">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Two Sum"
              className="bg-tint border-transparent rounded-[14px] h-10 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="difficulty" className="text-xs font-semibold text-secondary">Difficulty *</Label>
              <Select
                value={difficulty}
                onValueChange={(val) => {
                  if (val) setDifficulty(val as "EASY" | "MEDIUM" | "HARD");
                }}
              >
                <SelectTrigger className="bg-tint border-transparent rounded-[14px] h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-secondary">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => {
                  if (val) setStatus(val as "ATTEMPTED" | "SOLVED" | "REVISIT");
                }}
              >
                <SelectTrigger className="bg-tint border-transparent rounded-[14px] h-10 text-xs">
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

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-secondary">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Given an array of integers nums and an integer target..."
              rows={6}
              className="bg-tint border-transparent rounded-[14px] text-sm leading-relaxed p-3.5"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="constraints" className="text-xs font-semibold text-secondary">Constraints</Label>
            <Textarea
              id="constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="2 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
              rows={3}
              className="bg-tint border-transparent rounded-[14px] font-mono text-xs leading-relaxed p-3.5"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="timeComplexity" className="text-xs font-semibold text-secondary">Time Complexity (optional)</Label>
              <Input
                id="timeComplexity"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                placeholder="e.g. O(n) or O(log n)"
                className="bg-tint border-transparent rounded-[14px] h-10 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spaceComplexity" className="text-xs font-semibold text-secondary">Space Complexity (optional)</Label>
              <Input
                id="spaceComplexity"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                placeholder="e.g. O(1) or O(n)"
                className="bg-tint border-transparent rounded-[14px] h-10 font-mono text-xs"
              />
            </div>
          </div>

          {/* RAG Suggestion Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-tint p-4">
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent-orange" />
                RAG Pattern Intelligence
              </p>
              <p className="text-[11px] font-medium text-secondary mt-0.5">
                Retrieve matching canonical patterns to suggest topics, approaches, and graded hints.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleFetchSuggestions}
              disabled={isSuggesting || !title.trim() || !description.trim()}
              className="text-xs gap-1.5 rounded-[12px] font-semibold"
            >
              {isSuggesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing Knowledge Base...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggest Topics &amp; Hints
                </>
              )}
            </Button>
          </div>
          {suggestError && (
            <p className="text-xs text-[#B42318] font-semibold">{suggestError}</p>
          )}
        </CardContent>
      </Card>

      {/* RAG Suggestions Interactive Review Panel */}
      {suggestions && (
        <PatternSuggestions
          suggestions={suggestions}
          currentTopics={topics}
          currentHints={hints}
          onAcceptTopic={handleAcceptTopic}
          onAcceptAllTopics={handleAcceptAllTopics}
          onAcceptHint={handleAcceptHint}
          onAcceptAllHints={handleAcceptAllHints}
          onAcceptApproachAsNote={handleAcceptApproachAsNote}
          onDismiss={() => setSuggestions(null)}
        />
      )}

      {/* Topics */}
      <Card className="rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 shadow-soft">
        <CardHeader className="p-0 pb-5 border-b border-border/50">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-5">
          <div className="relative">
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Type to search or add topic (e.g., Array, Two Pointers)"
                className="bg-tint border-transparent rounded-[14px] h-10 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTopic();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addTopic()} className="rounded-[14px] h-10 w-10 p-0 border-border/70 bg-card hover:bg-tint">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Topic Suggestions dropdown */}
            {topicInput.trim() && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-[16px] border border-border/70 bg-card p-1.5 shadow-soft">
                {availableTopics
                  .filter(
                    (t) =>
                      t.toLowerCase().includes(topicInput.toLowerCase()) &&
                      !topics.includes(t)
                  )
                  .slice(0, 6)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="w-full text-left rounded-[10px] px-3 py-2 text-xs font-medium text-foreground hover:bg-tint cursor-pointer"
                      onClick={() => addTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                {!topics.includes(topicInput.trim()) &&
                  !availableTopics.some(
                    (t) => t.toLowerCase() === topicInput.toLowerCase()
                  ) && (
                    <button
                      type="button"
                      className="w-full text-left rounded-[10px] px-3 py-2 text-xs font-bold text-accent-orange hover:bg-tint cursor-pointer"
                      onClick={() => addTopic(topicInput.trim())}
                    >
                      Create &ldquo;{topicInput.trim()}&rdquo;
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Selected Topics */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="cursor-pointer gap-1.5 rounded-full py-1 px-3 text-xs font-semibold"
                  onClick={() => removeTopic(topic)}
                >
                  {topic}
                  <X className="h-3 w-3 text-secondary hover:text-foreground" />
                </Badge>
              ))}
            </div>
          )}

          {/* Popular topics quick-add pills */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <span className="text-[11px] font-semibold text-secondary">
              Popular topics (click to add):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TOPICS.filter((t) => !topics.includes(t))
                .slice(0, 8)
                .map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="cursor-pointer text-xs rounded-full bg-tint/60 border-border/70 text-secondary hover:bg-tint hover:text-foreground font-medium px-2.5 py-0.5"
                    onClick={() => addTopic(t)}
                  >
                    + {t}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples & edge cases */}
      <Card className="rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-5 border-b border-border/50">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">Examples &amp; edge cases</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addTestCase} className="rounded-[14px] bg-card border-border/70 hover:bg-tint font-semibold text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Example / Edge Case
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-5">
          {testCases.length === 0 ? (
            <p className="text-sm font-medium text-secondary">
              No examples or edge cases yet. Click &ldquo;Add Example / Edge Case&rdquo; to add one.
            </p>
          ) : (
            testCases.map((tc, index) => (
              <div
                key={index}
                className="relative space-y-3 rounded-[16px] border border-border/70 bg-tint/30 p-4"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 rounded-[10px] h-7 w-7 p-0 text-secondary hover:text-foreground"
                  onClick={() => removeTestCase(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-secondary">Input</Label>
                  <Textarea
                    value={tc.input}
                    onChange={(e) =>
                      updateTestCase(index, "input", e.target.value)
                    }
                    placeholder="nums = [2,7,11,15], target = 9"
                    rows={2}
                    className="bg-card border-border/60 rounded-[12px] font-mono text-xs leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-secondary">Expected Output</Label>
                  <Textarea
                    value={tc.expectedOutput}
                    onChange={(e) =>
                      updateTestCase(index, "expectedOutput", e.target.value)
                    }
                    placeholder="[0, 1]"
                    rows={2}
                    className="bg-card border-border/60 rounded-[12px] font-mono text-xs leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-secondary">Note (optional)</Label>
                  <Input
                    value={tc.explanation ?? ""}
                    onChange={(e) =>
                      updateTestCase(index, "explanation", e.target.value)
                    }
                    placeholder="e.g. Handles negative numbers or empty collection"
                    className="bg-card border-border/60 rounded-[12px] text-xs h-9"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Hints */}
      <Card className="rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 shadow-soft">
        <CardHeader className="p-0 pb-5 border-b border-border/50">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">Hints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-5">
          <div className="flex gap-2">
            <Input
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
              placeholder="Add a hint..."
              className="bg-tint border-transparent rounded-[14px] h-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHint();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addHint} className="rounded-[14px] h-10 w-10 p-0 border-border/70 bg-card hover:bg-tint">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {hints.length > 0 && (
            <ol className="space-y-2">
              {hints.map((hint, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 rounded-[14px] bg-tint p-3 text-sm"
                >
                  <span className="shrink-0 font-mono text-xs font-bold text-accent-orange">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-foreground leading-relaxed">{hint}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-[8px] h-6 w-6 p-0 text-secondary hover:text-foreground"
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
      <Card className="rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 shadow-soft">
        <CardHeader className="p-0 pb-5 border-b border-border/50">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-5">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal notes, observations, learnings..."
            rows={4}
            className="bg-tint border-transparent rounded-[14px] text-sm leading-relaxed p-3.5"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="rounded-[14px] bg-card border-border/70 hover:bg-tint font-semibold"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-[14px] font-semibold shadow-sm">
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
