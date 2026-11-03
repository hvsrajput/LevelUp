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
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Groups
        </Link>
      </div>

      {/* Group Header Banner */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {group.name}
              </h1>
              {group.isOwner ? (
                <Badge variant="streak" className="gap-1 font-semibold text-xs rounded-md">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 font-semibold text-xs rounded-md">
                  <Shield className="h-3 w-3" />
                  Member
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 rounded-md bg-tint/60 border-border/70 text-secondary font-medium text-xs">
                <Users className="h-3 w-3" />
                {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
              </Badge>
            </div>
            <p className="text-xs font-mono tabular-nums text-secondary">
              Created on {new Date(group.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Join Code Widget & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-tint/60 border border-border/60 px-3 py-1.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                  Invite Code
                </span>
                <span className="font-mono text-sm font-bold tracking-widest text-foreground">
                  {group.joinCode}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 rounded-md gap-1 ml-1 text-secondary hover:text-foreground"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-badge-solved-text" />
                    <span className="text-xs text-badge-solved-text font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Copy</span>
                  </>
                )}
              </Button>
              {group.isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-md text-secondary hover:text-foreground"
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
                className="gap-1.5 rounded-lg h-8 text-xs font-semibold"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Group
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 rounded-lg h-8 text-xs font-semibold"
                onClick={() => setLeaveConfirmOpen(true)}
              >
                <LogOut className="h-3.5 w-3.5" />
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Leaderboard & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Leaderboard / Member Roster (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-5 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent-orange" />
                    Member Standings & Streaks
                  </CardTitle>
                  <CardDescription className="text-secondary text-xs mt-0.5">
                    Ranked by total solved problems and daily practice streaks.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {members.map((member, index) => {
                  const rankIcons = ["🥇", "🥈", "🥉"];
                  const rankDisplay = rankIcons[index] || `#${index + 1}`;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-tint/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center font-bold text-xs text-secondary font-mono tabular-nums">
                          {rankDisplay}
                        </span>
                        <Avatar className="h-8 w-8 rounded-lg border border-border/70">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback className="font-bold text-xs bg-tint text-foreground">
                            {member.user.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-foreground">
                              {member.user.name || "Anonymous User"}
                            </span>
                            {member.role === "OWNER" && (
                              <span title="Group Owner">
                                <Crown className="h-3 w-3 text-accent-orange" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-secondary">
                            Joined {new Date(member.joinedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Solved Count */}
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono tabular-nums flex items-center justify-end gap-1 text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-badge-solved-text" />
                            {member.solvedCount}
                          </div>
                          <div className="text-[10px] text-secondary">solved</div>
                        </div>

                        {/* Current Streak */}
                        <div className="text-right min-w-[65px]">
                          <div
                            className={`text-xs font-bold font-mono tabular-nums flex items-center justify-end gap-1 ${
                              member.currentStreak > 0
                                ? "text-accent-orange"
                                : "text-secondary"
                            }`}
                          >
                            <Flame
                              className={`h-3.5 w-3.5 ${
                                member.currentStreak > 0
                                  ? "fill-accent-orange text-accent-orange"
                                  : "text-secondary"
                              }`}
                            />
                            {member.currentStreak}d
                          </div>
                          <div className="text-[10px] font-mono tabular-nums text-secondary">
                            best: {member.longestStreak}d
                          </div>
                        </div>

                        {/* Owner Kick Action */}
                        {group.isOwner && member.role !== "OWNER" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-md text-secondary hover:text-[#B42318] hover:bg-[#FFDDD8]"
                            title="Remove member"
                            onClick={() => setRemoveMemberTarget(member)}
                          >
                            <UserX className="h-3.5 w-3.5" />
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
        <div className="space-y-4 lg:col-span-5">
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-5 border-b border-border/50">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent-orange" />
                Shared Activity Feed
              </CardTitle>
              <CardDescription className="text-secondary text-xs mt-0.5">
                Recent solutions, submissions, and member milestones.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {activityFeed.length === 0 ? (
                <div className="py-8 text-center text-xs text-secondary">
                  <Activity className="h-7 w-7 mx-auto mb-1.5 text-secondary" />
                  No group activity yet. When members solve problems or submit code, their progress will show up here.
                </div>
              ) : (
                <div className="relative space-y-3 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                  {activityFeed.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-2.5 pl-1.5">
                      <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-tint text-xs shadow-xs">
                        {event.type === "PROBLEM_SOLVED" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-badge-solved-text" />
                        )}
                        {event.type === "CODE_SUBMISSION" && (
                          <Code2 className="h-3.5 w-3.5 text-accent-orange" />
                        )}
                        {event.type === "MEMBER_JOINED" && (
                          <Users className="h-3.5 w-3.5 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5 pt-0.5">
                        <div className="text-xs text-foreground">
                          <span className="font-bold text-foreground">{event.userName}</span>{" "}
                          {event.type === "PROBLEM_SOLVED" && (
                            <>
                              solved{" "}
                              <span className="font-semibold text-foreground">
                                {event.details.problemTitle || "a problem"}
                              </span>
                              {event.details.difficulty && (
                                <Badge
                                  variant={
                                    event.details.difficulty.toLowerCase() === "easy"
                                      ? "easy"
                                      : event.details.difficulty.toLowerCase() === "medium"
                                      ? "medium"
                                      : "hard"
                                  }
                                  className="ml-1 text-[10px] px-1.5 py-0 font-semibold"
                                >
                                  {event.details.difficulty}
                                </Badge>
                              )}
                            </>
                          )}
                          {event.type === "CODE_SUBMISSION" && (
                            <>
                              submitted code for{" "}
                              <span className="font-semibold text-foreground">
                                {event.details.problemTitle || "a problem"}
                              </span>
                              {event.details.language && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 font-mono rounded-md bg-tint/60 border-border/70 text-secondary">
                                  {event.details.language}
                                </Badge>
                              )}
                            </>
                          )}
                          {event.type === "MEMBER_JOINED" && (
                            <span className="text-secondary font-medium">
                              joined the study group
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono tabular-nums text-secondary">
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
        <DialogContent size="sm" className="rounded-2xl border border-border/70">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Study Group?</DialogTitle>
          </DialogHeader>
          <DialogBody className="py-4 min-w-0">
            <DialogDescription className="text-secondary text-xs">
              This will permanently dissolve &quot;{group.name}&quot; and remove all members.
              This action cannot be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isPending}
              className="rounded-lg h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isPending}
              className="rounded-lg h-9 px-4 text-xs font-semibold"
            >
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Leave Group Dialog */}
      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent size="sm" className="rounded-2xl border border-border/70">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Leave Study Group?</DialogTitle>
          </DialogHeader>
          <DialogBody className="py-4 min-w-0">
            <DialogDescription className="text-secondary text-xs">
              Are you sure you want to leave &quot;{group.name}&quot;? You will need the invite code to rejoin.
            </DialogDescription>
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLeaveConfirmOpen(false)}
              disabled={isPending}
              className="rounded-lg h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={isPending}
              className="rounded-lg h-9 px-4 text-xs font-semibold"
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
        <DialogContent size="sm" className="rounded-2xl border border-border/70">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Remove Member?</DialogTitle>
          </DialogHeader>
          <DialogBody className="py-4 min-w-0">
            <DialogDescription className="text-secondary text-xs">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {removeMemberTarget?.user.name || "this member"}
              </span>{" "}
              from the group?
            </DialogDescription>
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRemoveMemberTarget(null)}
              disabled={isPending}
              className="rounded-lg h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isPending}
              className="rounded-lg h-9 px-4 text-xs font-semibold"
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
