// =============================================================================
// RAG Pattern Suggestions Review & Accept Panel
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SuggestResponse } from "@/lib/validators/suggest";
import { Sparkles, Check, Plus, X, BookOpen, Lightbulb, Compass, ArrowRight } from "lucide-react";

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
    <Card className="rounded-[24px] border border-border/70 bg-card shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-tint text-accent-orange">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              AI Pattern Suggestions (RAG Grounded)
            </CardTitle>
            <p className="text-[11px] text-secondary font-medium mt-0.5">
              Review and accept suggestions into your form. Nothing is saved until you confirm.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-8 w-8 p-0 rounded-[10px] text-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pb-6 px-6">
        {/* Grounded Citation Banner */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-[16px] bg-tint px-3.5 py-2.5 text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-accent-orange" />
            Cited Patterns:
          </span>
          {suggestions.citedPatterns.map((chunk) => (
            <Badge
              key={chunk.id}
              variant="outline"
              className="border-border/70 bg-card font-medium text-secondary text-[11px] rounded-full px-2.5"
            >
              {chunk.topic}
            </Badge>
          ))}
        </div>

        {/* 1. Suggested Topics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Suggested Topics ({suggestions.suggestedTopics.length})
            </h4>
            {pendingTopics.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAcceptAllTopics(pendingTopics)}
                className="h-6 text-[11px] text-primary hover:text-primary"
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
                  className="h-7 text-xs gap-1"
                >
                  {isAccepted ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
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
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" />
            Candidate Approaches ({suggestions.candidateApproaches.length})
          </h4>
          <div className="space-y-2">
            {suggestions.candidateApproaches.map((approach, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-card p-3 space-y-1.5 text-xs transition-colors hover:border-primary/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {approach.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {approach.timeComplexity && (
                      <Badge variant="outline" className="font-mono text-[10px] text-blue-700">
                        {approach.timeComplexity}
                      </Badge>
                    )}
                    {approach.spaceComplexity && (
                      <Badge variant="outline" className="font-mono text-[10px] text-purple-700">
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
                      className="h-6 px-2 text-[11px]"
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Add to Notes
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {approach.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Progressive Hints */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              Progressive Hints ({suggestions.progressiveHints.length})
            </h4>
            {pendingHints.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAcceptAllHints(pendingHints.map((h) => h.text))}
                className="h-6 text-[11px] text-primary hover:text-primary"
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
                  ? "bg-blue-100 text-blue-800"
                  : hint.level === "moderate"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-purple-100 text-purple-800";

              return (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 rounded-md border p-2.5 text-xs"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeVariant}`}
                    >
                      {hint.level}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">
                      {hint.text}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={isAccepted ? "secondary" : "outline"}
                    size="sm"
                    disabled={isAccepted}
                    onClick={() => onAcceptHint(hint.text)}
                    className="h-6 px-2 text-[11px] shrink-0"
                  >
                    {isAccepted ? (
                      <>
                        <Check className="mr-1 h-3 w-3 text-green-600" />
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
