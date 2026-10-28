// =============================================================================
// Problem Card — used in the problem list
// =============================================================================

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { difficultyColor, statusColor, formatDate } from "@/lib/utils";
import { Calendar, MessageSquare } from "lucide-react";

interface ProblemCardProps {
  problem: {
    id: string;
    shortCode: string;
    title: string;
    difficulty: string;
    status: string;
    source: string;
    createdAt: string;
    topics: { topic: { name: string } }[];
    _count?: { submissions: number };
  };
}

export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link href={`/problems/${problem.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">
              {problem.title}
            </CardTitle>
            <Badge
              variant="outline"
              className={difficultyColor(problem.difficulty)}
            >
              {problem.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={statusColor(problem.status)}>
              {problem.status}
            </Badge>
            {problem.source === "LEETCODE" && (
              <Badge variant="outline" className="text-orange-600">
                LeetCode
              </Badge>
            )}
            {problem.topics.slice(0, 3).map(({ topic }) => (
              <Badge key={topic.name} variant="outline">
                {topic.name}
              </Badge>
            ))}
            {problem.topics.length > 3 && (
              <Badge variant="outline">+{problem.topics.length - 3}</Badge>
            )}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(problem.createdAt)}
            </span>
            {problem._count && problem._count.submissions > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {problem._count.submissions} submission
                {problem._count.submissions !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
