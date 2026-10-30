// =============================================================================
// Code Editor & Submission Component
// =============================================================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORTED_LANGUAGES, type CreateSubmissionInput } from "@/lib/validators/submission";
import { Loader2, Send, CheckCircle2, RotateCcw } from "lucide-react";

const STARTER_CODE: Record<string, string> = {
  python: `class Solution:
    def solve(self, nums: list[int]) -> int:
        # Write your solution here
        pass
`,
  typescript: `function solve(nums: number[]): number {
    // Write your solution here
    return 0;
}
`,
  javascript: `function solve(nums) {
    // Write your solution here
    return 0;
}
`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};
`,
  java: `class Solution {
    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }
}
`,
  go: `package main

func solve(nums []int) int {
    // Write your solution here
    return 0
}
`,
  rust: `impl Solution {
    pub fn solve(nums: Vec<i32>) -> i32 {
        // Write your solution here
        0
    }
}
`,
  csharp: `public class Solution {
    public int Solve(int[] nums) {
        // Write your solution here
        return 0;
    }
}
`,
};

interface CodeEditorProps {
  problemId: string;
  onSubmissionCreated?: () => void;
}

export function CodeEditor({ problemId, onSubmissionCreated }: CodeEditorProps) {
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(STARTER_CODE.python);
  const [runtime, setRuntime] = useState<string>("");
  const [memory, setMemory] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [markStatus, setMarkStatus] = useState<"ATTEMPTED" | "SOLVED" | "REVISIT">("SOLVED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleLanguageChange(newLang: string | null) {
    if (!newLang) return;
    setLanguage(newLang);
    // If the code is currently blank or matching another starter template, replace with the new template
    const isDefaultTemplate = Object.values(STARTER_CODE).some(
      (starter) => starter.trim() === code.trim()
    );
    if (!code.trim() || isDefaultTemplate) {
      setCode(STARTER_CODE[newLang] || "");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enable tab indentation inside the code editor
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const updated = code.substring(0, start) + "    " + code.substring(end);
      setCode(updated);

      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Code cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload: CreateSubmissionInput = {
      language,
      code,
      runtime: runtime.trim() || undefined,
      memory: memory.trim() || undefined,
      notes: notes.trim() || undefined,
      markStatus,
    };

    try {
      const res = await fetch(`/api/problems/${problemId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit code");
      }

      setSuccessMsg("Submission recorded successfully!");
      setRuntime("");
      setMemory("");
      setNotes("");
      if (onSubmissionCreated) {
        onSubmissionCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
        <CardTitle className="text-base font-bold text-foreground">Record Solution</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px] text-xs h-9 bg-tint border-transparent rounded-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCode(STARTER_CODE[language] || "")}
            title="Reset to starter template"
            className="rounded-[10px] text-secondary hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-6 px-6">
        {error && (
          <div className="rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-[14px] bg-[#D6EEC6] p-3 text-xs font-semibold text-[#2D6A1E]">
            <CheckCircle2 className="h-4 w-4" />
            {successMsg}
          </div>
        )}

        {/* Code Editor */}
        <div className="relative rounded-[16px] border border-[#223528] bg-[#14221A] overflow-hidden focus-within:ring-2 focus-within:ring-accent-orange/40">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={14}
            className="border-0 bg-transparent font-mono text-xs text-[#E8F0DF] placeholder:text-[#5B6B58] leading-relaxed focus-visible:ring-0 resize-y p-4"
            placeholder="Write your solution here..."
            spellCheck={false}
          />
        </div>

        {/* Submission Metadata */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="runtime" className="text-xs font-semibold text-secondary">
              Runtime (optional)
            </Label>
            <Input
              id="runtime"
              placeholder="e.g. 48ms"
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              className="text-xs h-10 bg-tint border-transparent rounded-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memory" className="text-xs font-semibold text-secondary">
              Memory (optional)
            </Label>
            <Input
              id="memory"
              placeholder="e.g. 17.2MB"
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              className="text-xs h-10 bg-tint border-transparent rounded-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold text-secondary">
              Update Status
            </Label>
            <Select
              value={markStatus}
              onValueChange={(v) => {
                if (v) setMarkStatus(v as "ATTEMPTED" | "SOLVED" | "REVISIT");
              }}
            >
              <SelectTrigger className="text-xs h-10 bg-tint border-transparent rounded-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLVED">Mark as Solved</SelectItem>
                <SelectItem value="ATTEMPTED">Mark as Attempted</SelectItem>
                <SelectItem value="REVISIT">Mark for Revisit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sub-notes" className="text-xs font-semibold text-secondary">
            Submission Notes
          </Label>
          <Input
            id="sub-notes"
            placeholder="Key insights, time/space complexity O(n), edge cases..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs h-10 bg-tint border-transparent rounded-[14px]"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
            className="rounded-[14px] font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-3.5 w-3.5" />
                Record Submission
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
