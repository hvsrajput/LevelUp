// =============================================================================
// RAG Pattern Suggestions Review & Accept Panel
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SuggestResponse } from "@/lib/validators/suggest";
import { Check, Plus, X, ArrowRight } from "lucide-react";

interface PatternSuggestionsProps {
  suggestions: SuggestResponse;
  currentTopics: string[];
  currentHints: string[];
  onAcceptTopic: (topic: string) => void;
  onAcceptAllTopics: (topics: string[]) => void;
  onAcceptHint: (hintText: string) => void;
  onAcceptAllHints: (hintTexts: string[]) => void;
  onAcceptApproachAsNote: (approachText: string) => void;
  onDismiss: () => void;
}

export function PatternSuggestions({
  suggestions,
  currentTopics,
  currentHints,
  onAcceptTopic,
  onAcceptAllTopics,
  onAcceptHint,
  onAcceptAllHints,
  onAcceptApproachAsNote,
  onDismiss,
}: PatternSuggestionsProps) {
  const pendingTopics = suggestions.suggestedTopics.filter(
    (t) => !currentTopics.includes(t)
  );

  const pendingHints = suggestions.progressiveHints.filter(
    (h) => !currentHints.includes(h.text)
  );

  return (
    <Card className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
      <CardHeader className="flex flex-row items-center justify-between pb-3 p-0">
        <div>
          <CardTitle className="text-sm font-bold text-foreground">
            AI Pattern Suggestions (RAG Grounded)
          </CardTitle>
          <p className="text-xs text-secondary mt-0.5">
            Review and accept suggestions into your form. Nothing is saved until you confirm.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-7 w-7 p-0 rounded-md text-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3.5 p-0 pt-3">
        {/* Grounded Citation Banner */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-tint/60 border border-border/60 px-3 py-2 text-xs">
          <span className="font-semibold text-foreground">
            Cited Patterns:
          </span>
          {suggestions.citedPatterns.map((chunk) => (
            <Badge
              key={chunk.id}
              variant="outline"
              className="border-border/70 bg-card font-medium text-secondary text-xs rounded-md px-2 py-0.5"
            >
              {chunk.topic}
            </Badge>
          ))}
        </div>

        {/* 1. Suggested Topics */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">
              Suggested Topics ({suggestions.suggestedTopics.length})
            </h4>
            {pendingTopics.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAcceptAllTopics(pendingTopics)}
                className="h-6 text-xs text-primary hover:text-primary"
              >
                Accept All Topics ({pendingTopics.length})
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.suggestedTopics.map((topic) => {
              const isAccepted = currentTopics.includes(topic);
              return (
                <Button
                  key={topic}
                  type="button"
                  variant={isAccepted ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => !isAccepted && onAcceptTopic(topic)}
                  disabled={isAccepted}
                  className="h-7 text-xs rounded-md gap-1"
                >
                  {isAccepted ? (
                    <>
                      <Check className="h-3 w-3 text-[#2D6A1E]" />
                      {topic}
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      {topic}
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 2. Candidate Approaches */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-foreground">
            Candidate Approaches ({suggestions.candidateApproaches.length})
          </h4>
          <div className="space-y-2">
            {suggestions.candidateApproaches.map((approach, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/60 bg-tint/30 p-3 space-y-1.5 text-xs transition-colors hover:border-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {approach.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {approach.timeComplexity && (
                      <Badge variant="outline" className="font-mono tabular-nums text-xs rounded-md border-border/70 text-secondary bg-tint/60">
                        {approach.timeComplexity}
                      </Badge>
                    )}
                    {approach.spaceComplexity && (
                      <Badge variant="outline" className="font-mono tabular-nums text-xs rounded-md border-border/70 text-secondary bg-tint/60">
                        {approach.spaceComplexity}
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onAcceptApproachAsNote(
                          `Approach: ${approach.title}\n${approach.description}${approach.timeComplexity ? `\nTime: ${approach.timeComplexity}` : ""}${approach.spaceComplexity ? `\nSpace: ${approach.spaceComplexity}` : ""}`
                        )
                      }
                      className="h-6 px-2 text-xs rounded-md"
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Add to Notes
                    </Button>
                  </div>
                </div>
                <p className="text-secondary leading-relaxed">
                  {approach.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Progressive Hints */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">
              Progressive Hints ({suggestions.progressiveHints.length})
            </h4>
            {pendingHints.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAcceptAllHints(pendingHints.map((h) => h.text))}
                className="h-6 text-xs text-primary hover:text-primary"
              >
                Accept All Hints ({pendingHints.length})
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            {suggestions.progressiveHints.map((hint, idx) => {
              const isAccepted = currentHints.includes(hint.text);
              const badgeVariant =
                hint.level === "nudge"
                  ? "bg-tint text-secondary border border-border/70"
                  : hint.level === "moderate"
                  ? "bg-pill-streak-bg text-pill-streak-text border border-accent-orange/30"
                  : "bg-destructive/10 text-destructive border border-destructive/20";

              return (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-tint/20 p-2.5 text-xs"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase ${badgeVariant}`}
                    >
                      {hint.level}
                    </span>
                    <span className="leading-relaxed text-secondary">
                      {hint.text}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={isAccepted ? "secondary" : "outline"}
                    size="sm"
                    disabled={isAccepted}
                    onClick={() => onAcceptHint(hint.text)}
                    className="h-6 px-2 text-xs rounded-md shrink-0"
                  >
                    {isAccepted ? (
                      <>
                        <Check className="mr-1 h-3 w-3 text-[#2D6A1E]" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Hint
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
