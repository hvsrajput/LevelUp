"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CONSOLE_IMPORT_SCRIPT,
  type PreviewImportResult,
} from "@/lib/leetcode/paste-import";
import {
  previewLeetCodeImportAction,
  confirmLeetCodeImportAction,
} from "@/actions/leetcode-import";
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
  FileCode,
  Copy,
  Check,
  Info,
} from "lucide-react";

interface LeetCodeSyncModalProps {
  onSyncComplete?: () => void;
}

export function LeetCodeSyncModal({ onSyncComplete }: LeetCodeSyncModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"link" | "sync24h" | "paste" | "importNumber">("link");

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

  // Paste import state
  const [pastedJson, setPastedJson] = useState("");
  const [hasCopiedScript, setHasCopiedScript] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewImportResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

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

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (newOpen) {
      loadLinkStatus();
    }
  }

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

  async function handleCopyScript() {
    try {
      await navigator.clipboard.writeText(CONSOLE_IMPORT_SCRIPT);
      setHasCopiedScript(true);
      setTimeout(() => setHasCopiedScript(false), 2000);
    } catch {
      // ignore
    }
  }

  async function handlePreviewPaste() {
    if (!pastedJson.trim()) {
      setPreviewError("Please paste the JSON export before previewing.");
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);
    setPreview(null);
    setConfirmSuccess(null);
    setConfirmError(null);

    try {
      const res = await previewLeetCodeImportAction(pastedJson.trim());
      setPreview(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse payload.";
      setPreviewError(msg);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleConfirmPaste() {
    if (!pastedJson.trim()) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      const res = await confirmLeetCodeImportAction(pastedJson.trim());
      setConfirmSuccess(
        `Successfully imported ${res.importedCount} problem${
          res.importedCount === 1 ? "" : "s"
        }!`
      );
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm import.";
      setConfirmError(msg);
    } finally {
      setIsConfirming(false);
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
        <Button
          variant="outline"
          className="border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400"
        >
          <DownloadCloud className="mr-2 h-4 w-4" /> LeetCode Sync
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            onClick={() => setTab("paste")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              tab === "paste"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode className="h-3.5 w-3.5" /> Paste Import
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

        {/* Tab 3: Paste-Based Import */}
        {tab === "paste" && (
          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Export and Paste Solved Problems</p>
              <p className="text-xs text-muted-foreground">
                Run this lightweight script in your DevTools console while logged into leetcode.com.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <FileCode className="h-3.5 w-3.5 text-primary" /> Console Script
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScript}
                  className="h-6 text-[11px] gap-1"
                >
                  {hasCopiedScript ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Script
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-md border bg-muted/60 p-2 font-mono text-[10px] text-muted-foreground overflow-x-auto max-h-20">
                <pre className="whitespace-pre">{CONSOLE_IMPORT_SCRIPT}</pre>
              </div>

              <div className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  It runs in your own browser on <strong>leetcode.com</strong> and sends nothing to this app until you paste the result.
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-paste-area" className="text-xs font-semibold text-muted-foreground">
                Paste JSON Output
              </label>
              <Textarea
                id="modal-paste-area"
                placeholder={`{\n  "version": 1,\n  "problems": [...] \n}`}
                rows={4}
                value={pastedJson}
                onChange={(e) => {
                  setPastedJson(e.target.value);
                  setPreview(null);
                  setPreviewError(null);
                  setConfirmSuccess(null);
                }}
                className="font-mono text-xs"
              />
            </div>

            {previewError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{previewError}</span>
              </div>
            )}

            {preview && (
              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border bg-emerald-500/10 p-1.5">
                    <div className="font-bold text-emerald-600">{preview.newCount}</div>
                    <div className="text-[10px] text-muted-foreground">New</div>
                  </div>
                  <div className="rounded border bg-muted/50 p-1.5">
                    <div className="font-bold text-foreground">{preview.alreadyImportedCount}</div>
                    <div className="text-[10px] text-muted-foreground">Tracked</div>
                  </div>
                  <div className="rounded border bg-amber-500/10 p-1.5">
                    <div className="font-bold text-amber-600">{preview.invalidCount}</div>
                    <div className="text-[10px] text-muted-foreground">Invalid</div>
                  </div>
                </div>
              </div>
            )}

            {confirmError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            {confirmSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{confirmSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewPaste}
                disabled={isPreviewing || !pastedJson.trim()}
              >
                {isPreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Preview"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPaste}
                disabled={isConfirming || !preview || preview.newCount === 0 || confirmSuccess !== null}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Importing...
                  </>
                ) : (
                  `Confirm (${preview ? preview.newCount : 0})`
                )}
              </Button>
            </div>
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
