"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  Crown,
  Shield,
  ArrowRight,
} from "lucide-react";

interface GroupSummary {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  isOwner: boolean;
  role: "OWNER" | "MEMBER";
  memberCount: number;
  joinedAt: string;
  createdAt: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/groups");
        if (res.ok && !ignore) {
          const data = await res.json();
          setGroups(data.groups || []);
        }
      } catch (err) {
        console.error("Failed to load groups", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setFormError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to create group");
          return;
        }

        setGroupName("");
        setCreateOpen(false);
        router.push(`/groups/${data.group.id}`);
      } catch {
        setFormError("Network error. Please try again.");
      }
    });
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setFormError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ joinCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to join group");
          return;
        }

        setJoinCode("");
        setJoinOpen(false);
        router.push(`/groups/${data.groupId}`);
      } catch {
        setFormError("Network error. Please try again.");
      }
    });
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Study Groups</h1>
            <Badge variant="secondary" className="gap-1 font-semibold text-xs">
              <Users className="h-3 w-3 text-secondary" />
              Private Circles
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-secondary">
            Form private groups with peers to track solved problems, compare streaks, and share activity feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Join Group Dialog */}
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-[14px] bg-card border-border/70 hover:bg-tint font-semibold text-xs h-10">
                <KeyRound className="h-4 w-4 text-secondary" />
                Join with Code
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[24px] p-6">
              <form onSubmit={handleJoinGroup}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-foreground">Join a Study Group</DialogTitle>
                  <DialogDescription className="text-secondary text-xs">
                    Enter the 8-character invite code shared by the group owner.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {formError && (
                    <div className="rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="joinCode" className="text-xs font-semibold text-secondary">Join Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="e.g. 9XY4M7KR"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase text-center tracking-widest text-lg h-11 bg-tint border-transparent rounded-[14px]"
                      maxLength={12}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending || !joinCode.trim()} className="rounded-[14px] font-semibold">
                    {isPending ? "Joining..." : "Join Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Group Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-[14px] font-semibold text-xs h-10 shadow-sm">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[24px] p-6">
              <form onSubmit={handleCreateGroup}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-foreground">Create Study Group</DialogTitle>
                  <DialogDescription className="text-secondary text-xs">
                    Give your circle a name. You will be assigned as the Owner and receive a unique invite code.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {formError && (
                    <div className="rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="groupName" className="text-xs font-semibold text-secondary">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g. FAANG Grind Squad"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                      className="h-11 bg-tint border-transparent rounded-[14px] text-sm"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending || !groupName.trim()} className="rounded-[14px] font-semibold">
                    {isPending ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-[24px] border border-border/70 bg-card p-6 shadow-soft animate-pulse">
                <div className="h-10 w-1/2 rounded-[12px] bg-tint mb-4" />
                <div className="h-24 w-full rounded-[14px] bg-tint" />
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="rounded-[24px] border border-dashed border-border/80 bg-card/60 p-16 text-center shadow-soft">
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-[20px] bg-tint p-4">
                <Users className="h-10 w-10 text-accent-orange" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">No study groups yet</h3>
                <p className="text-sm font-medium text-secondary max-w-sm mx-auto">
                  Collaborate with friends to keep each other accountable, compare problem streaks, and celebrate solves.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-[14px] font-semibold">
                  <Plus className="h-4 w-4" />
                  Create a Group
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJoinOpen(true)}
                  className="gap-2 rounded-[14px] bg-card border-border/70 hover:bg-tint font-semibold"
                >
                  <KeyRound className="h-4 w-4" />
                  Join with Code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="rounded-[24px] border border-border/70 bg-card p-6 shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-bold truncate text-foreground">
                      {group.name}
                    </h3>
                    {group.isOwner ? (
                      <Badge variant="streak" className="gap-1 shrink-0 font-semibold text-[11px]">
                        <Crown className="h-3 w-3" />
                        Owner
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 shrink-0 font-semibold text-[11px]">
                        <Shield className="h-3 w-3" />
                        Member
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium text-secondary mt-1">
                    Created {new Date(group.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="space-y-4 my-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary font-medium flex items-center gap-1.5 text-xs">
                      <Users className="h-4 w-4" />
                      Members
                    </span>
                    <span className="font-bold text-foreground">{group.memberCount}</span>
                  </div>

                  {/* Join Code Box */}
                  <div className="rounded-[14px] bg-tint p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        Invite Code
                      </div>
                      <div className="font-mono text-sm font-bold tracking-widest text-foreground mt-0.5">
                        {group.joinCode}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 rounded-[10px] gap-1 text-secondary hover:text-foreground"
                      onClick={() => handleCopyCode(group.id, group.joinCode)}
                    >
                      {copiedId === group.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#2D6A1E]" />
                          <span className="text-xs text-[#2D6A1E] font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Button asChild className="w-full gap-2 rounded-[14px] bg-card border border-border/70 hover:bg-tint text-foreground font-semibold text-xs" variant="outline">
                    <Link href={`/groups/${group.id}`}>
                      Open Dashboard
                      <ArrowRight className="h-4 w-4 text-accent-orange" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
