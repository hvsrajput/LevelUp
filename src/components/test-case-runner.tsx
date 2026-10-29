// =============================================================================
// Test Case Runner & Playground Component
// =============================================================================

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Check, Copy, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export interface TestCaseItem {
  id: string;
  input: string;
  expectedOutput: string;
  explanation: string | null;
}

interface TestCaseRunnerProps {
  testCases: TestCaseItem[];
}

export function TestCaseRunner({ testCases }: TestCaseRunnerProps) {
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mockRunning, setMockRunning] = useState(false);
  const [testResults, setTestResults] = useState<Record<number, { passed: boolean; output: string } | null>>({});

  async function handleCopy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleRunTests() {
    setMockRunning(true);
    // Simulate test execution against expected test cases
    setTimeout(() => {
      const results: Record<number, { passed: boolean; output: string }> = {};
      testCases.forEach((tc, idx) => {
        // By default, simulate passing output matching the test case
        results[idx] = {
          passed: true,
          output: tc.expectedOutput,
        };
      });
      setTestResults(results);
      setMockRunning(false);
    }, 600);
  }

  function handleReset() {
    setTestResults({});
  }

  if (testCases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No test cases specified for this problem.
          </p>
          <p className="text-xs text-muted-foreground">
            Edit the problem to add sample inputs and outputs.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeTc = testCases[activeTestCaseIdx] || testCases[0];
  const activeResult = testResults[activeTestCaseIdx];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          Test Cases ({testCases.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          {Object.keys(testResults).length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Reset
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleRunTests}
            disabled={mockRunning}
            className="text-xs"
          >
            <Play className="mr-1.5 h-3 w-3 fill-current" />
            {mockRunning ? "Evaluating..." : "Run Test Cases"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Case Selection Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-3">
          {testCases.map((tc, idx) => {
            const res = testResults[idx];
            return (
              <Button
                key={tc.id || idx}
                type="button"
                variant={activeTestCaseIdx === idx ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTestCaseIdx(idx)}
                className="text-xs gap-1.5"
              >
                {res && (
                  res.passed ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )
                )}
                Case {idx + 1}
              </Button>
            );
          })}
        </div>

        {/* Selected Test Case Details */}
        <div className="space-y-3">
          {/* Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Input</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`input-${activeTestCaseIdx}`, activeTc.input)}
                className="h-6 px-1.5 text-[11px]"
              >
                {copiedKey === `input-${activeTestCaseIdx}` ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted/70 p-2.5 font-mono text-xs">
              {activeTc.input}
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
                onClick={() => handleCopy(`output-${activeTestCaseIdx}`, activeTc.expectedOutput)}
                className="h-6 px-1.5 text-[11px]"
              >
                {copiedKey === `output-${activeTestCaseIdx}` ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted/70 p-2.5 font-mono text-xs">
              {activeTc.expectedOutput}
            </pre>
          </div>

          {/* Explanation if available */}
          {activeTc.explanation && (
            <div className="rounded-md border bg-muted/20 p-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Explanation: </span>
              {activeTc.explanation}
            </div>
          )}

          {/* Simulation Output Result */}
          {activeResult && (
            <div className="space-y-1 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Actual Result</span>
                <Badge
                  variant={activeResult.passed ? "secondary" : "destructive"}
                  className={activeResult.passed ? "text-green-700 bg-green-100" : ""}
                >
                  {activeResult.passed ? "Accepted" : "Wrong Answer"}
                </Badge>
              </div>
              <pre className="overflow-x-auto rounded-md border border-green-200 bg-green-50/50 p-2.5 font-mono text-xs text-green-900">
                {activeResult.output}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
