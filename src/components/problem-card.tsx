// =============================================================================
// Problem Card — used in the problem list
// =============================================================================

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Calendar, MessageSquare, ChevronRight, Check } from "lucide-react";

interface ProblemCardProps {
  problem: {
    id: string;
    shortCode: string;
    title: string;
    difficulty: string;
    status: string;
    source: string;
    createdAt: string;
    timeComplexity?: string | null;
    topics: { topic: { name: string } }[];
    _count?: { submissions: number };
  };
}

export function ProblemCard({ problem }: ProblemCardProps) {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "bg-badge-easy-bg text-badge-easy-text border-transparent";
      case "MEDIUM":
        return "bg-badge-medium-bg text-badge-medium-text border-transparent";
      case "HARD":
        return "bg-badge-hard-bg text-badge-hard-text border-transparent";
      default:
        return "bg-tint text-text-secondary border-transparent";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SOLVED":
        return "bg-badge-solved-bg text-badge-solved-text border-transparent";
      case "REVISIT":
        return "bg-pill-streak-bg text-pill-streak-text border-transparent";
      default:
        return "bg-tint text-text-secondary border-transparent";
    }
  };

  return (
    <Link href={`/problems/${problem.id}`} className="block h-full group">
      <Card className="h-full rounded-[20px] bg-card p-5 shadow-soft border border-border/40 transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between">
        <div>
          <CardHeader className="p-0 pb-3.5">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {problem.title}
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0 ${getDifficultyBadge(
                  problem.difficulty
                )}`}
              >
                {problem.difficulty}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="secondary"
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${getStatusBadge(
                  problem.status
                )}`}
              >
                {problem.status === "SOLVED" && <Check className="h-3 w-3 stroke-[2.5]" />}
                {problem.status}
              </Badge>

              {problem.source === "LEETCODE" && (
                <Badge
                  variant="outline"
                  className="bg-tint/70 text-text-secondary border-0 text-[11px] px-2 py-0.5 rounded-full font-medium"
                >
                  LeetCode
                </Badge>
              )}

              {problem.timeComplexity && (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] bg-tint/60 text-text-secondary border-0 px-2 py-0.5 rounded-full"
                >
                  {problem.timeComplexity}
                </Badge>
              )}

              {problem.topics.slice(0, 3).map(({ topic }) => (
                <Badge
                  key={topic.name}
                  variant="outline"
                  className="bg-tint/60 text-text-secondary border-0 text-[11px] px-2 py-0.5 rounded-full font-medium"
                >
                  {topic.name}
                </Badge>
              ))}

              {problem.topics.length > 3 && (
                <Badge
                  variant="outline"
                  className="bg-tint/60 text-text-secondary border-0 text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                >
                  +{problem.topics.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </div>

        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(problem.createdAt)}
            </span>
            {problem._count && problem._count.submissions > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <MessageSquare className="h-3 w-3" />
                {problem._count.submissions}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </Link>
  );
}
