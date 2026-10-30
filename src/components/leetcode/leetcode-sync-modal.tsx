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
          className="rounded-[14px] bg-card border-border/70 hover:bg-tint font-semibold text-xs text-foreground h-10"
        >
          <DownloadCloud className="mr-2 h-4 w-4 text-accent-orange" /> LeetCode Sync
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-tint text-accent-orange font-bold text-sm">
              LC
            </span>
            <DialogTitle className="text-xl font-bold text-foreground">LeetCode Integration</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-secondary mt-1">
            Import problems and sync your accepted submissions directly into LevelUp.
          </DialogDescription>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex border-b border-border/50 text-xs font-semibold gap-1 pb-1">
          <button
            type="button"
            onClick={() => setTab("link")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              tab === "link"
                ? "bg-secondary text-primary font-bold"
                : "text-secondary hover:text-foreground hover:bg-tint"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" /> Account
          </button>
          <button
            type="button"
            onClick={() => setTab("sync24h")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              tab === "sync24h"
                ? "bg-secondary text-primary font-bold"
                : "text-secondary hover:text-foreground hover:bg-tint"
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> 24h Sync
          </button>
          <button
            type="button"
            onClick={() => setTab("paste")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              tab === "paste"
                ? "bg-secondary text-primary font-bold"
                : "text-secondary hover:text-foreground hover:bg-tint"
            }`}
          >
            <FileCode className="h-3.5 w-3.5" /> Paste Import
          </button>
          <button
            type="button"
            onClick={() => setTab("importNumber")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              tab === "importNumber"
                ? "bg-secondary text-primary font-bold"
                : "text-secondary hover:text-foreground hover:bg-tint"
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
                <div className="rounded-[16px] bg-tint p-3.5 border border-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Status</span>
                    {linkedUsername ? (
                      <Badge variant="solved" className="font-semibold text-xs">
                        Linked: {linkedUsername}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-secondary rounded-full bg-card">
                        Not linked
                      </Badge>
                    )}
                  </div>
                  {linkedUsername && (
                    <div className="mt-2.5 flex items-center justify-between">
                      <a
                        href={`https://leetcode.com/u/${linkedUsername}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-secondary hover:text-foreground flex items-center gap-1 underline underline-offset-2 font-medium"
                      >
                        View LeetCode Profile <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUnlink}
                        disabled={isUnlinking}
                        className="h-7 text-xs rounded-[8px] text-[#B42318] hover:bg-[#FFDDD8]"
                      >
                        {isUnlinking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Unlink"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lc-username" className="text-xs font-bold uppercase tracking-wider text-secondary">
                    LeetCode Username
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="lc-username"
                      placeholder="e.g. neetcode"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      disabled={isLinking}
                      className="bg-tint border-transparent rounded-[14px] h-10 text-sm"
                    />
                    <Button
                      onClick={handleLink}
                      disabled={isLinking || !usernameInput.trim()}
                      className="shrink-0 rounded-[14px] font-semibold text-xs shadow-sm"
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
                  className="w-full rounded-[14px] font-semibold text-xs shadow-sm h-10"
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
                  <div className="flex items-center gap-2 rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{sync24hError}</span>
                  </div>
                )}

                {sync24hResult && (
                  <div className="rounded-[16px] bg-tint p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span>Sync Results:</span>
                      <Badge variant="solved" className="text-xs font-semibold">
                        {sync24hResult.syncedCount} synced
                      </Badge>
                    </div>

                    {sync24hResult.syncedProblems.length > 0 ? (
                      <ul className="space-y-1 max-h-36 overflow-y-auto">
                        {sync24hResult.syncedProblems.map((prob) => (
                          <li
                            key={prob.questionId}
                            className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                          >
                            <span className="truncate pr-2 font-medium text-foreground">
                              #{prob.questionId} {prob.title}
                            </span>
                            <span className="text-secondary text-[10px] font-medium">
                              {prob.isNew ? "New" : "Updated"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-secondary py-2 text-center font-medium">
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

              <div className="rounded-[14px] border border-[#223528] bg-[#14221A] text-[#E8F0DF] p-3 font-mono text-[10px] overflow-x-auto max-h-20">
                <pre className="whitespace-pre">{CONSOLE_IMPORT_SCRIPT}</pre>
              </div>

              <div className="flex items-start gap-2 rounded-[14px] bg-tint p-2.5 text-[11px] text-secondary leading-relaxed">
                <Info className="h-4 w-4 shrink-0 text-accent-orange mt-0.5" />
                <span>
                  It runs in your own browser on <strong>leetcode.com</strong> and sends nothing to this app until you paste the result.
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-paste-area" className="text-xs font-bold text-secondary">
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
                className="font-mono text-xs bg-tint border-transparent rounded-[14px] p-3"
              />
            </div>

            {previewError && (
              <div className="flex items-center gap-2 rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{previewError}</span>
              </div>
            )}

            {preview && (
              <div className="rounded-[16px] bg-tint p-3 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[10px] bg-card border border-border/70 p-2 shadow-soft-sm">
                    <div className="font-bold text-[#2D6A1E] text-sm">{preview.newCount}</div>
                    <div className="text-[10px] text-secondary font-medium">New</div>
                  </div>
                  <div className="rounded-[10px] bg-card border border-border/70 p-2 shadow-soft-sm">
                    <div className="font-bold text-foreground text-sm">{preview.alreadyImportedCount}</div>
                    <div className="text-[10px] text-secondary font-medium">Tracked</div>
                  </div>
                  <div className="rounded-[10px] bg-card border border-border/70 p-2 shadow-soft-sm">
                    <div className="font-bold text-[#8F4A0B] text-sm">{preview.invalidCount}</div>
                    <div className="text-[10px] text-secondary font-medium">Invalid</div>
                  </div>
                </div>
              </div>
            )}

            {confirmError && (
              <div className="flex items-center gap-2 rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            {confirmSuccess && (
              <div className="flex items-center gap-2 rounded-[14px] bg-[#D6EEC6] p-3 text-xs font-semibold text-[#2D6A1E]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{confirmSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewPaste}
                disabled={isPreviewing || !pastedJson.trim()}
                className="rounded-[14px] font-semibold text-xs"
              >
                {isPreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Preview"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPaste}
                className="rounded-[14px] font-semibold text-xs shadow-sm"
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
              <p className="text-sm font-bold text-foreground">
                Import any official LeetCode problem directly by its question number.
              </p>
              <p className="text-xs text-secondary">
                Fetches description, difficulty, topic tags, and creates the problem tracker entry.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="question-num" className="text-xs font-bold uppercase tracking-wider text-secondary">
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
                  className="bg-tint border-transparent rounded-[14px] h-10 text-sm"
                />
                <Button
                  onClick={handleImportByNumber}
                  disabled={isImportingNumber || !questionNumberInput.trim()}
                  className="shrink-0 rounded-[14px] font-semibold text-xs shadow-sm"
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
              <div className="flex items-center gap-2 rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importNumberError}</span>
              </div>
            )}

            {importNumberSuccess && (
              <div className="rounded-[16px] bg-[#D6EEC6]/50 border border-[#2D6A1E]/30 p-4 space-y-1.5 text-xs text-[#2D6A1E]">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#2D6A1E]" />
                  <span>
                    {importNumberSuccess.alreadyExisted ? "Already Tracked" : "Successfully Imported"}
                  </span>
                </div>
                <p className="text-foreground">
                  &ldquo;{importNumberSuccess.title}&rdquo; is now in your problem list.
                </p>
                <div className="pt-1">
                  <a
                    href={`/problems/${importNumberSuccess.shortCode}`}
                    className="underline font-bold text-[#2D6A1E] hover:text-[#1E4D13]"
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
