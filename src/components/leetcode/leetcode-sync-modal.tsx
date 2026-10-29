"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Link as LinkIcon,
  DownloadCloud,
  Hash,
  Clock,
  Layers,
} from "lucide-react";

interface LeetCodeSyncModalProps {
  onSyncComplete?: () => void;
}

interface BulkJobState {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  error?: string | null;
}

export function LeetCodeSyncModal({ onSyncComplete }: LeetCodeSyncModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"link" | "sync24h" | "bulk" | "importNumber">("link");

  // Account link state
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // 24h sync state
  const [isSyncing24h, setIsSyncing24h] = useState(false);
  const [sync24hResult, setSync24hResult] = useState<{
    syncedCount: number;
    skippedCount: number;
    syncedProblems: Array<{
      title: string;
      questionId: number;
      difficulty: string;
      isNew: boolean;
    }>;
  } | null>(null);
  const [sync24hError, setSync24hError] = useState<string | null>(null);

  // Bulk sync state
  const [bulkJob, setBulkJob] = useState<BulkJobState | null>(null);
  const [isStartingBulk, setIsStartingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Import by number state
  const [questionNumberInput, setQuestionNumberInput] = useState("");
  const [isImportingNumber, setIsImportingNumber] = useState(false);
  const [importNumberSuccess, setImportNumberSuccess] = useState<{
    title: string;
    shortCode: string;
    alreadyExisted: boolean;
  } | null>(null);
  const [importNumberError, setImportNumberError] = useState<string | null>(null);

  async function loadLinkStatus() {
    setIsLoadingAccount(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/leetcode/link");
      if (res.ok) {
        const data = await res.json();
        setLinkedUsername(data.username);
        if (data.username) {
          setUsernameInput(data.username);
        }
      }
    } catch (err) {
      console.error("Failed to load LeetCode link status:", err);
    } finally {
      setIsLoadingAccount(false);
    }
  }

  // Load link status when opened and cleanup timers on unmount
  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (newOpen) {
      loadLinkStatus();
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    }
  }

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  async function handleLink() {
    if (!usernameInput.trim()) {
      setLinkError("Please enter a LeetCode username.");
      return;
    }

    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const res = await fetch("/api/leetcode/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to link LeetCode profile.");
      }

      setLinkedUsername(data.username);
      setLinkSuccess(
        `Successfully linked ${data.username}! ${
          data.totalSolved !== undefined ? `(${data.totalSolved} solved)` : ""
        }`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setLinkError(message);
    } finally {
      setIsLinking(false);
    }
  }

  async function handleUnlink() {
    setIsUnlinking(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const res = await fetch("/api/leetcode/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unlink account.");
      }

      setLinkedUsername(null);
      setUsernameInput("");
      setLinkSuccess("LeetCode account unlinked.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setLinkError(message);
    } finally {
      setIsUnlinking(false);
    }
  }

  async function handleSync24h() {
    setIsSyncing24h(true);
    setSync24hError(null);
    setSync24hResult(null);

    try {
      const res = await fetch("/api/leetcode/sync-24h", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync recent submissions.");
      }

      setSync24hResult({
        syncedCount: data.syncedCount,
        skippedCount: data.skippedCount,
        syncedProblems: data.syncedProblems || [],
      });

      if (onSyncComplete && data.syncedCount > 0) {
        onSyncComplete();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setSync24hError(message);
    } finally {
      setIsSyncing24h(false);
    }
  }

  async function handleStartBulkSync() {
    setIsStartingBulk(true);
    setBulkError(null);

    try {
      const res = await fetch("/api/leetcode/sync-bulk", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start bulk import.");
      }

      const jobId = data.jobId;
      setBulkJob({
        id: jobId,
        status: "RUNNING",
        total: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
      });

      // Start polling status
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/leetcode/sync-bulk/${jobId}`);
          if (pollRes.ok) {
            const jobData: BulkJobState = await pollRes.json();
            setBulkJob(jobData);

            if (jobData.status === "COMPLETED" || jobData.status === "FAILED") {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              if (jobData.status === "COMPLETED" && onSyncComplete) {
                onSyncComplete();
              }
            }
          }
        } catch (e) {
          console.error("Error polling bulk job status:", e);
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setBulkError(message);
    } finally {
      setIsStartingBulk(false);
    }
  }

  async function handleImportByNumber() {
    const num = parseInt(questionNumberInput, 10);
    if (isNaN(num) || num <= 0) {
      setImportNumberError("Please enter a valid positive question number.");
      return;
    }

    setIsImportingNumber(true);
    setImportNumberError(null);
    setImportNumberSuccess(null);

    try {
      const res = await fetch("/api/leetcode/import-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionNumber: num }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import problem.");
      }

      setImportNumberSuccess({
        title: data.problem.title,
        shortCode: data.problem.shortCode,
        alreadyExisted: data.alreadyExisted,
      });

      setQuestionNumberInput("");
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to import problem.";
      setImportNumberError(message);
    } finally {
      setIsImportingNumber(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400">
          <DownloadCloud className="mr-2 h-4 w-4" /> LeetCode Sync
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 font-bold text-sm">
              LC
            </span>
            <DialogTitle>LeetCode Integration</DialogTitle>
          </div>
          <DialogDescription>
            Import problems and sync your accepted submissions directly into LevelUp.
          </DialogDescription>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex border-b text-sm font-medium">
          <button
            type="button"
            onClick={() => setTab("link")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              tab === "link"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" /> Account
          </button>
          <button
            type="button"
            onClick={() => setTab("sync24h")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              tab === "sync24h"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> 24h Sync
          </button>
          <button
            type="button"
            onClick={() => setTab("bulk")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              tab === "bulk"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Bulk Import
          </button>
          <button
            type="button"
            onClick={() => setTab("importNumber")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              tab === "importNumber"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hash className="h-3.5 w-3.5" /> Import by #
          </button>
        </div>

        {/* Tab 1: Account Link */}
        {tab === "link" && (
          <div className="space-y-4 py-2">
            {isLoadingAccount ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking account status...
              </div>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    {linkedUsername ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
                        Linked: {linkedUsername}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not linked
                      </Badge>
                    )}
                  </div>
                  {linkedUsername && (
                    <div className="mt-2 flex items-center justify-between">
                      <a
                        href={`https://leetcode.com/u/${linkedUsername}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-2"
                      >
                        View LeetCode Profile <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUnlink}
                        disabled={isUnlinking}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      >
                        {isUnlinking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Unlink"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lc-username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    LeetCode Username
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="lc-username"
                      placeholder="e.g. neetcode"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      disabled={isLinking}
                    />
                    <Button
                      onClick={handleLink}
                      disabled={isLinking || !usernameInput.trim()}
                      className="shrink-0"
                    >
                      {isLinking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                        </>
                      ) : (
                        "Link Profile"
                      )}
                    </Button>
                  </div>
                </div>

                {linkError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}

                {linkSuccess && (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{linkSuccess}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Your LeetCode profile must be public so LevelUp can verify and sync your solved problems.
                </p>
              </>
            )}
          </div>
        )}

        {/* Tab 2: 24h Sync */}
        {tab === "sync24h" && (
          <div className="space-y-4 py-2">
            {!linkedUsername ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm font-medium">LeetCode Account Not Linked</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Link your LeetCode username in the Account tab first.
                </p>
                <Button size="sm" onClick={() => setTab("link")}>
                  Go to Account Tab
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm">
                    Sync any problems accepted on LeetCode within the last 24 hours.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deduplicated automatically. Existing problems are marked as solved.
                  </p>
                </div>

                <Button
                  onClick={handleSync24h}
                  disabled={isSyncing24h}
                  className="w-full"
                >
                  {isSyncing24h ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing Past 24h...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Sync Past 24 Hours
                    </>
                  )}
                </Button>

                {sync24hError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{sync24hError}</span>
                  </div>
                )}

                {sync24hResult && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span>Sync Results:</span>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
                        {sync24hResult.syncedCount} synced
                      </Badge>
                    </div>

                    {sync24hResult.syncedProblems.length > 0 ? (
                      <ul className="space-y-1 max-h-36 overflow-y-auto">
                        {sync24hResult.syncedProblems.map((prob) => (
                          <li
                            key={prob.questionId}
                            className="flex items-center justify-between py-1 border-b border-muted/50 last:border-0"
                          >
                            <span className="truncate pr-2">
                              #{prob.questionId} {prob.title}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              {prob.isNew ? "New" : "Updated"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground py-2 text-center">
                        No accepted submissions found in the last 24 hours.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 3: Bulk Import */}
        {tab === "bulk" && (
          <div className="space-y-4 py-2">
            {!linkedUsername ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm font-medium">LeetCode Account Not Linked</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Link your LeetCode username in the Account tab first.
                </p>
                <Button size="sm" onClick={() => setTab("link")}>
                  Go to Account Tab
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm">
                    Import all accepted problems from your public profile in the background.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Includes rate limiting with exponential backoff to respect LeetCode&apos;s API.
                  </p>
                </div>

                {!bulkJob || bulkJob.status === "COMPLETED" || bulkJob.status === "FAILED" ? (
                  <Button
                    onClick={handleStartBulkSync}
                    disabled={isStartingBulk}
                    className="w-full"
                  >
                    {isStartingBulk ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="mr-2 h-4 w-4" /> Start Bulk Import
                      </>
                    )}
                  </Button>
                ) : null}

                {bulkError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkJob && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Job Status</span>
                      <Badge
                        variant="outline"
                        className={
                          bulkJob.status === "COMPLETED"
                            ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                            : bulkJob.status === "FAILED"
                            ? "border-destructive/40 text-destructive bg-destructive/10"
                            : "border-amber-500/40 text-amber-600 bg-amber-500/10 animate-pulse"
                        }
                      >
                        {bulkJob.status}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>
                          {bulkJob.status === "RUNNING"
                            ? `Importing... (${bulkJob.processed} / ${bulkJob.total || "?"})`
                            : bulkJob.status === "COMPLETED"
                            ? "Complete"
                            : "Failed"}
                        </span>
                        <span>
                          {bulkJob.total > 0
                            ? `${Math.round((bulkJob.processed / bulkJob.total) * 100)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{
                            width: `${
                              bulkJob.total > 0
                                ? Math.min(100, Math.round((bulkJob.processed / bulkJob.total) * 100))
                                : 5
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                      <div>
                        Imported: <span className="font-semibold text-foreground">{bulkJob.imported}</span>
                      </div>
                      <div>
                        Skipped/Cached: <span className="font-semibold text-foreground">{bulkJob.skipped}</span>
                      </div>
                    </div>

                    {bulkJob.error && (
                      <p className="text-destructive font-medium text-[11px]">{bulkJob.error}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 4: Import by Number */}
        {tab === "importNumber" && (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <p className="text-sm">
                Import any official LeetCode problem directly by its question number.
              </p>
              <p className="text-xs text-muted-foreground">
                Fetches description, difficulty, topic tags, and creates the problem tracker entry.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="question-num" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Problem Number
              </label>
              <div className="flex gap-2">
                <Input
                  id="question-num"
                  type="number"
                  min="1"
                  placeholder="e.g. 1 (Two Sum), 200 (Number of Islands)"
                  value={questionNumberInput}
                  onChange={(e) => setQuestionNumberInput(e.target.value)}
                  disabled={isImportingNumber}
                />
                <Button
                  onClick={handleImportByNumber}
                  disabled={isImportingNumber || !questionNumberInput.trim()}
                  className="shrink-0"
                >
                  {isImportingNumber ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
            </div>

            {importNumberError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importNumberError}</span>
              </div>
            )}

            {importNumberSuccess && (
              <div className="rounded-lg border bg-emerald-500/10 border-emerald-500/20 p-3 space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {importNumberSuccess.alreadyExisted ? "Already Tracked" : "Successfully Imported"}
                  </span>
                </div>
                <p>
                  &ldquo;{importNumberSuccess.title}&rdquo; is now in your problem list.
                </p>
                <div className="pt-1">
                  <a
                    href={`/problems/${importNumberSuccess.shortCode}`}
                    className="underline font-semibold hover:text-emerald-900 dark:hover:text-emerald-100"
                  >
                    View Problem Details &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
