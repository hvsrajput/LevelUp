// =============================================================================
// Group Detail Page: Leaderboard, Member Stats, Activity Feed, and Admin Controls
// =============================================================================

"use client";

import { useEffect, useState, use, Suspense, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { difficultyColor } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  RefreshCw,
  Crown,
  Shield,
  Flame,
  CheckCircle2,
  Trash2,
  LogOut,
  UserX,
  Code2,
  Activity,
  Trophy,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface MemberStat {
  id: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  solvedCount: number;
  currentStreak: number;
  longestStreak: number;
}

interface ActivityEvent {
  id: string;
  type: "PROBLEM_SOLVED" | "CODE_SUBMISSION" | "MEMBER_JOINED";
  userId: string;
  userName: string;
  userImage?: string | null;
  timestamp: string;
  details: {
    problemId?: string;
    problemTitle?: string;
    difficulty?: string;
    language?: string;
    role?: string;
  };
}

interface GroupDetailData {
  group: {
    id: string;
    name: string;
    joinCode: string;
    ownerId: string;
    isOwner: boolean;
    currentUserRole: "OWNER" | "MEMBER";
    createdAt: string;
    memberCount: number;
  };
  members: MemberStat[];
  activityFeed: ActivityEvent[];
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function GroupDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<GroupDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Transitions & modal state
  const [isPending, startTransition] = useTransition();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<MemberStat | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/groups/${id}`);
        if (!res.ok) {
          if (!ignore) {
            if (res.status === 403) {
              setError("You do not have permission to view this group.");
            } else if (res.status === 404) {
              setError("Group not found.");
            } else {
              setError("Failed to load group details.");
            }
          }
          return;
        }
        const json = await res.json();
        if (!ignore) {
          setData(json);
        }
      } catch {
        if (!ignore) {
          setError("An error occurred while fetching group data.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, refreshKey]);

  const handleCopyCode = () => {
    if (!data?.group.joinCode) return;
    navigator.clipboard.writeText(data.group.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/groups/${id}/regenerate-code`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                group: { ...prev.group, joinCode: json.joinCode },
              }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to regenerate code", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteGroup = async () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/groups/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.push("/groups");
        }
      } catch (err) {
        console.error("Failed to delete group", err);
      }
    });
  };

  const handleLeaveGroup = async () => {
    if (!data) return;
    startTransition(async () => {
      try {
        // Current user leaves
        const currentMember = data.members.find((m) => m.role === data.group.currentUserRole);
        if (!currentMember) return;
        const res = await fetch(`/api/groups/${id}/members/${currentMember.userId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.push("/groups");
        }
      } catch (err) {
        console.error("Failed to leave group", err);
      }
    });
  };

  const handleRemoveMember = async () => {
    if (!removeMemberTarget) return;
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/groups/${id}/members/${removeMemberTarget.userId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setRemoveMemberTarget(null);
          setRefreshKey((k) => k + 1);
        }
      } catch (err) {
        console.error("Failed to remove member", err);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{error || "Group Unavailable"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You may need to join with an invite code or verify that the group still exists.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/groups" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
      </div>
    );
  }

  const { group, members, activityFeed } = data;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>
      </div>

      {/* Group Header Banner */}
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {group.name}
              </h1>
              {group.isOwner ? (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Member
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Created on {new Date(group.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Join Code Widget & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Invite Code
                </span>
                <span className="font-mono text-base font-bold tracking-wider">
                  {group.joinCode}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1 ml-1"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
              {group.isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  title="Regenerate invite code"
                  disabled={isRegenerating}
                  onClick={handleRegenerateCode}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>

            {/* Leave / Delete group */}
            {group.isOwner ? (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => setLeaveConfirmOpen(true)}
              >
                <LogOut className="h-4 w-4" />
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Leaderboard & Activity Feed */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Leaderboard / Member Roster (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Member Standings & Streaks
                  </CardTitle>
                  <CardDescription>
                    Ranked by total solved problems and daily practice streaks.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {members.map((member, index) => {
                  const rankIcons = ["🥇", "🥈", "🥉"];
                  const rankDisplay = rankIcons[index] || `#${index + 1}`;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-sm text-muted-foreground">
                          {rankDisplay}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback className="font-semibold text-xs">
                            {member.user.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {member.user.name || "Anonymous User"}
                            </span>
                            {member.role === "OWNER" && (
                              <span title="Group Owner">
                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Joined {new Date(member.joinedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Solved Count */}
                        <div className="text-right">
                          <div className="text-sm font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            {member.solvedCount}
                          </div>
                          <div className="text-[11px] text-muted-foreground">solved</div>
                        </div>

                        {/* Current Streak */}
                        <div className="text-right min-w-[70px]">
                          <div
                            className={`text-sm font-bold flex items-center justify-end gap-1 ${
                              member.currentStreak > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Flame
                              className={`h-3.5 w-3.5 ${
                                member.currentStreak > 0
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            {member.currentStreak}d
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            best: {member.longestStreak}d
                          </div>
                        </div>

                        {/* Owner Kick Action */}
                        {group.isOwner && member.role !== "OWNER" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Remove member"
                            onClick={() => setRemoveMemberTarget(member)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Shared Activity Feed (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Shared Activity Feed
              </CardTitle>
              <CardDescription>
                Recent solutions, submissions, and member milestones.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {activityFeed.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  No group activity yet. When members solve problems or submit code, their progress will show up here.
                </div>
              ) : (
                <div className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {activityFeed.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-3 pl-2">
                      <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-xs shadow-xs">
                        {event.type === "PROBLEM_SOLVED" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        {event.type === "CODE_SUBMISSION" && (
                          <Code2 className="h-4 w-4 text-primary" />
                        )}
                        {event.type === "MEMBER_JOINED" && (
                          <Users className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5 pt-0.5">
                        <div className="text-xs text-foreground">
                          <span className="font-semibold">{event.userName}</span>{" "}
                          {event.type === "PROBLEM_SOLVED" && (
                            <>
                              solved{" "}
                              <span className="font-medium text-foreground">
                                {event.details.problemTitle || "a problem"}
                              </span>
                              {event.details.difficulty && (
                                <Badge
                                  className={`ml-1.5 text-[10px] px-1.5 py-0 ${difficultyColor(
                                    event.details.difficulty
                                  )}`}
                                >
                                  {event.details.difficulty}
                                </Badge>
                              )}
                            </>
                          )}
                          {event.type === "CODE_SUBMISSION" && (
                            <>
                              submitted code for{" "}
                              <span className="font-medium text-foreground">
                                {event.details.problemTitle || "a problem"}
                              </span>
                              {event.details.language && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 font-mono">
                                  {event.details.language}
                                </Badge>
                              )}
                            </>
                          )}
                          {event.type === "MEMBER_JOINED" && (
                            <span className="text-muted-foreground">
                              joined the study group
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {timeAgo(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Delete Group Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Study Group?</DialogTitle>
            <DialogDescription>
              This will permanently dissolve &quot;{group.name}&quot; and remove all members.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Leave Group Dialog */}
      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Study Group?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave &quot;{group.name}&quot;? You will need the invite code to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLeaveConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={isPending}
            >
              {isPending ? "Leaving..." : "Leave Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Member Dialog */}
      <Dialog
        open={!!removeMemberTarget}
        onOpenChange={(open) => !open && setRemoveMemberTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {removeMemberTarget?.user.name || "this member"}
              </span>{" "}
              from the group?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRemoveMemberTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GroupDetailContent params={params} />
    </Suspense>
  );
}
