export type DifficultyTag = "Easy" | "Medium" | "Hard";
export type MatchStatus = "matched" | "suggested" | "custom";
export type MatchSource = "user" | "catalog";

export interface QuestionEntry {
  raw: string;
  title: string;
  leetcodeId?: number;
  slug?: string;
  difficultyTag?: DifficultyTag;
}

export interface DayDraft {
  dayNumber: number; // 1..7
  title?: string;
  questions: QuestionEntry[];
}

export interface WeekDraft {
  weekNumber: number; // 1..26
  title?: string;
  days: DayDraft[];
}

export interface RoadmapDraft {
  title: string;
  weeks: WeekDraft[];
}

export interface Issue {
  line?: number;
  type: "error" | "warning";
  message: string;
}

export interface ProblemSuggestion {
  id?: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  url?: string | null;
  source: MatchSource;
}

export interface ResolvedQuestionEntry extends QuestionEntry {
  status: MatchStatus;
  matchSource?: MatchSource;
  matchedId?: string;
  matchedTitle?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  url?: string | null;
  isSolved: boolean;
  suggestions?: ProblemSuggestion[];
}

export interface ResolvedDay {
  dayNumber: number;
  title?: string;
  questions: ResolvedQuestionEntry[];
}

export interface ResolvedWeek {
  weekNumber: number;
  title?: string;
  days: ResolvedDay[];
}

export interface DraftTotals {
  weeks: number;
  days: number;
  questions: number;
  matched: number;
  custom: number;
  suggested: number;
}

export interface ResolvedDraft {
  title: string;
  weeks: ResolvedWeek[];
  issues: Issue[];
  totals: DraftTotals;
}
