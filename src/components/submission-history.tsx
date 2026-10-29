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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Code2 className="mb-2 h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground">
            No code submissions recorded yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Use the Code Workspace to submit and track your solutions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Submission History ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.map((sub, index) => {
          const isExpanded = expandedIds[sub.id] ?? false;
          return (
            <div
              key={sub.id}
              className="rounded-lg border bg-card transition-colors hover:border-primary/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs uppercase">
                    {sub.language}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Latest
                    </Badge>
                  )}
                  {sub.runtime && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {sub.runtime}
                    </span>
                  )}
                  {sub.memory && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      {sub.memory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(sub.createdAt)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(sub.id)}
                    title={isExpanded ? "Collapse" : "Expand"}
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
                <div className="border-t p-2">
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
