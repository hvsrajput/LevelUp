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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <ListTree className="mb-2 h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground">
            No examples or edge cases recorded yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Edit the problem to add sample inputs, expected outputs, and notes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeItem = testCases[activeIdx] || testCases[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Examples &amp; edge cases ({testCases.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Example Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-3">
          {testCases.map((tc, idx) => (
            <Button
              key={tc.id || idx}
              type="button"
              variant={activeIdx === idx ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveIdx(idx)}
              className="text-xs"
            >
              Example {idx + 1}
            </Button>
          ))}
        </div>

        {/* Selected Example Details */}
        <div className="space-y-3">
          {/* Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Input</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`input-${activeIdx}`, activeItem.input)}
                className="h-6 px-1.5 text-[11px]"
              >
                {copiedKey === `input-${activeIdx}` ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted/70 p-2.5 font-mono text-xs">
              {activeItem.input}
            </pre>
          </div>

          {/* Expected Output */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Expected Output</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`output-${activeIdx}`, activeItem.expectedOutput)}
                className="h-6 px-1.5 text-[11px]"
              >
                {copiedKey === `output-${activeIdx}` ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted/70 p-2.5 font-mono text-xs">
              {activeItem.expectedOutput}
            </pre>
          </div>

          {/* Optional Note */}
          {activeItem.explanation && (
            <div className="rounded-md border bg-muted/20 p-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Note: </span>
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
