// =============================================================================
// Submission History Component
// =============================================================================

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeViewer } from "@/components/code-viewer";
import { formatDate } from "@/lib/utils";
import { ChevronDown, ChevronUp, Code2, Clock, Cpu } from "lucide-react";

export interface SubmissionItem {
  id: string;
  language: string;
  code: string;
  runtime: string | null;
  memory: string | null;
  notes: string | null;
  createdAt: string;
}

interface SubmissionHistoryProps {
  submissions: SubmissionItem[];
}

export function SubmissionHistory({ submissions }: SubmissionHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    // Expand the most recent submission by default if any exist
    ...(submissions.length > 0 ? { [submissions[0].id]: true } : {}),
  });

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (submissions.length === 0) {
    return (
      <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Code2 className="mb-2 h-8 w-8 text-secondary" />
          <p className="text-sm font-semibold text-secondary">
            No code submissions recorded yet.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use the Code Workspace to submit and track your solutions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
      <CardHeader className="pb-3 pt-6 px-6">
        <CardTitle className="text-base font-bold text-foreground">
          Submission History ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-6 px-6">
        {submissions.map((sub, index) => {
          const isExpanded = expandedIds[sub.id] ?? false;
          return (
            <div
              key={sub.id}
              className="rounded-[16px] border border-border/60 bg-tint/40 transition-colors hover:bg-tint/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-3.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs uppercase rounded-full bg-card border-border/70">
                    {sub.language}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="solved" className="text-[10px] font-semibold">
                      Latest
                    </Badge>
                  )}
                  {sub.runtime && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-secondary font-medium">
                      <Clock className="h-3 w-3" />
                      {sub.runtime}
                    </span>
                  )}
                  {sub.memory && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-secondary font-medium">
                      <Cpu className="h-3 w-3" />
                      {sub.memory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-secondary">
                    {formatDate(sub.createdAt)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(sub.id)}
                    title={isExpanded ? "Collapse" : "Expand"}
                    className="rounded-[10px] h-7 w-7 p-0 text-secondary hover:text-foreground"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/50 p-2 sm:p-3">
                  <CodeViewer
                    code={sub.code}
                    language={sub.language}
                    runtime={sub.runtime}
                    memory={sub.memory}
                    notes={sub.notes}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
