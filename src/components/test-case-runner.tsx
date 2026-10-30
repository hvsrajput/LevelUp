// =============================================================================
// Examples & Edge Cases Viewer Component (Read-Only)
// =============================================================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, ListTree } from "lucide-react";

export interface TestCaseItem {
  id: string;
  input: string;
  expectedOutput: string;
  explanation: string | null;
}

interface ExamplesViewerProps {
  testCases: TestCaseItem[];
}

export function ExamplesViewer({ testCases }: ExamplesViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleCopy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (testCases.length === 0) {
    return (
      <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <ListTree className="mb-2 h-8 w-8 text-secondary" />
          <p className="text-sm font-semibold text-secondary">
            No examples or edge cases recorded yet.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edit the problem to add sample inputs, expected outputs, and notes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeItem = testCases[activeIdx] || testCases[0];

  return (
    <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
      <CardHeader className="pb-3 pt-6 px-6">
        <CardTitle className="text-base font-bold text-foreground">
          Examples &amp; edge cases ({testCases.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6 px-6">
        {/* Example Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border/50 pb-3">
          {testCases.map((tc, idx) => (
            <Button
              key={tc.id || idx}
              type="button"
              variant={activeIdx === idx ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveIdx(idx)}
              className="text-xs rounded-full font-semibold"
            >
              Example {idx + 1}
            </Button>
          ))}
        </div>

        {/* Selected Example Details */}
        <div className="space-y-3.5">
          {/* Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Input</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`input-${activeIdx}`, activeItem.input)}
                className="h-6 px-2 rounded-[8px] text-[11px] text-secondary hover:text-foreground"
              >
                {copiedKey === `input-${activeIdx}` ? (
                  <Check className="h-3 w-3 text-[#2D6A1E]" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-[14px] bg-tint p-3 font-mono text-xs text-foreground leading-relaxed">
              {activeItem.input}
            </pre>
          </div>

          {/* Expected Output */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">Expected Output</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`output-${activeIdx}`, activeItem.expectedOutput)}
                className="h-6 px-2 rounded-[8px] text-[11px] text-secondary hover:text-foreground"
              >
                {copiedKey === `output-${activeIdx}` ? (
                  <Check className="h-3 w-3 text-[#2D6A1E]" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-[14px] bg-tint p-3 font-mono text-xs text-foreground leading-relaxed">
              {activeItem.expectedOutput}
            </pre>
          </div>

          {/* Optional Note */}
          {activeItem.explanation && (
            <div className="rounded-[14px] bg-tint p-3 text-xs text-secondary leading-relaxed">
              <span className="font-bold text-foreground">Note: </span>
              {activeItem.explanation}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Backward-compatibility alias
export const TestCaseRunner = ExamplesViewer;
