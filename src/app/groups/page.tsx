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
  DialogBody,
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
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Study Groups</h1>
            <Badge variant="secondary" className="gap-1 font-semibold text-xs">
              <Users className="h-3 w-3 text-secondary" />
              Private Circles
            </Badge>
          </div>
          <p className="mt-1 text-xs text-secondary">
            Form private groups with peers to track solved problems, compare streaks, and share activity feeds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Join Group Dialog */}
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-lg bg-card border-border/70 hover:bg-tint font-semibold text-xs h-9">
                <KeyRound className="h-3.5 w-3.5 text-secondary" />
                Join with Code
              </Button>
            </DialogTrigger>
            <DialogContent size="md" className="rounded-2xl border border-border/70">
              <form onSubmit={handleJoinGroup} className="flex flex-col flex-1 min-h-0">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground">Join a Study Group</DialogTitle>
                  <DialogDescription className="text-secondary text-xs">
                    Enter the 8-character invite code shared by the group owner.
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 py-4 min-w-0">
                  {formError && (
                    <div className="rounded-lg bg-[#FFDDD8] p-2.5 text-xs font-semibold text-[#B42318]">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <Label htmlFor="joinCode" className="text-xs font-semibold text-secondary">Join Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="e.g. 9XY4M7KR"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase text-center tracking-widest text-base h-10 bg-tint/60 border border-border/70 rounded-lg"
                      maxLength={12}
                      required
                    />
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" disabled={isPending || !joinCode.trim()} className="rounded-lg h-9 px-4 text-xs font-semibold">
                    {isPending ? "Joining..." : "Join Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Group Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-lg font-semibold text-xs h-9 shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent size="md" className="rounded-2xl border border-border/70">
              <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 min-h-0">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground">Create Study Group</DialogTitle>
                  <DialogDescription className="text-secondary text-xs">
                    Give your circle a name. You will be assigned as the Owner and receive a unique invite code.
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 py-4 min-w-0">
                  {formError && (
                    <div className="rounded-lg bg-[#FFDDD8] p-2.5 text-xs font-semibold text-[#B42318]">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <Label htmlFor="groupName" className="text-xs font-semibold text-secondary">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g. FAANG Grind Squad"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                      className="h-9 bg-tint/60 border border-border/70 rounded-lg text-xs"
                      required
                    />
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button type="submit" disabled={isPending || !groupName.trim()} className="rounded-lg h-9 px-4 text-xs font-semibold">
                    {isPending ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs animate-pulse">
                <div className="h-6 w-1/2 rounded-md bg-tint mb-3" />
                <div className="h-20 w-full rounded-lg bg-tint" />
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="rounded-xl border border-dashed border-border/80 bg-card/60 p-6 sm:p-8 text-left">
            <CardContent className="flex flex-col items-start space-y-3.5 p-0">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">No study groups yet</h3>
                <p className="text-xs text-secondary max-w-sm">
                  Collaborate with friends to keep each other accountable, compare problem streaks, and celebrate solves.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-lg h-9 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" />
                  Create a Group
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJoinOpen(true)}
                  className="gap-2 rounded-lg h-9 text-xs bg-card border-border/70 hover:bg-tint font-semibold"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Join with Code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold truncate text-foreground">
                      {group.name}
                    </h3>
                    {group.isOwner ? (
                      <Badge variant="streak" className="gap-1 shrink-0 font-semibold text-xs rounded-md">
                        <Crown className="h-3 w-3" />
                        Owner
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 shrink-0 font-semibold text-xs rounded-md">
                        <Shield className="h-3 w-3" />
                        Member
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono tabular-nums text-secondary mt-0.5">
                    Created {new Date(group.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="space-y-3 my-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary font-medium flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Members
                    </span>
                    <span className="font-bold font-mono tabular-nums text-foreground">{group.memberCount}</span>
                  </div>

                  {/* Join Code Box */}
                  <div className="rounded-lg bg-tint/60 border border-border/60 p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                        Invite Code
                      </div>
                      <div className="font-mono text-xs font-bold tracking-widest text-foreground mt-0.5">
                        {group.joinCode}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 rounded-md gap-1 text-secondary hover:text-foreground"
                      onClick={() => handleCopyCode(group.id, group.joinCode)}
                    >
                      {copiedId === group.id ? (
                        <>
                          <Check className="h-3 w-3 text-badge-solved-text" />
                          <span className="text-xs text-badge-solved-text font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-xs font-semibold">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Button asChild className="w-full h-8 gap-1.5 rounded-lg bg-card border border-border/70 hover:bg-tint text-foreground font-semibold text-xs" variant="outline">
                    <Link href={`/groups/${group.id}`}>
                      Open Dashboard
                      <ArrowRight className="h-3.5 w-3.5 text-accent-orange" />
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
