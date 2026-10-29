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
import { Textarea } from "@/components/ui/textarea";
import {
  CONSOLE_IMPORT_SCRIPT,
  type PreviewImportResult,
} from "@/lib/leetcode/paste-import";
import {
  previewLeetCodeImportAction,
  confirmLeetCodeImportAction,
} from "@/actions/leetcode-import";
import {
  Copy,
  Check,
  FileCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Info,
} from "lucide-react";

interface LeetCodeImportDialogProps {
  onImportComplete?: () => void;
}

export function LeetCodeImportDialog({
  onImportComplete,
}: LeetCodeImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [hasCopiedScript, setHasCopiedScript] = useState(false);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewImportResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  async function handleCopyScript() {
    try {
      await navigator.clipboard.writeText(CONSOLE_IMPORT_SCRIPT);
      setHasCopiedScript(true);
      setTimeout(() => setHasCopiedScript(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handlePreview() {
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
      const msg = err instanceof Error ? err.message : "Failed to parse and preview payload.";
      setPreviewError(msg);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleConfirm() {
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
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm import.";
      setConfirmError(msg);
    } finally {
      setIsConfirming(false);
    }
  }

  function handleReset() {
    setPastedJson("");
    setPreview(null);
    setPreviewError(null);
    setConfirmSuccess(null);
    setConfirmError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) handleReset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400"
        >
          <Upload className="mr-2 h-4 w-4" /> Import from LeetCode
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 font-bold text-sm">
              LC
            </span>
            <DialogTitle>Import from LeetCode</DialogTitle>
          </div>
          <DialogDescription>
            Import your solved problems by copying and pasting a client-side JSON export directly from your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1: Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-primary" />
                1. Copy & Run Console Script on leetcode.com
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="h-7 text-xs gap-1.5"
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

            <div className="relative rounded-md border bg-muted/60 p-2.5 font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-24">
              <pre className="whitespace-pre">{CONSOLE_IMPORT_SCRIPT}</pre>
            </div>

            <div className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
              <span>
                It runs in your own browser on <strong>leetcode.com</strong> (press F12 &rarr; Console) and sends nothing to this app until you paste the result below.
              </span>
            </div>
          </div>

          {/* Step 2: Paste Area */}
          <div className="space-y-2">
            <label
              htmlFor="pasted-leetcode-json"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              2. Paste Exported JSON
            </label>
            <Textarea
              id="pasted-leetcode-json"
              placeholder={`{\n  "version": 1,\n  "problems": [\n    {\n      "id": 1,\n      "title": "Two Sum",\n      "slug": "two-sum",\n      "difficulty": "EASY",\n      "topics": ["Array", "Hash Table"]\n    }\n  ]\n}`}
              rows={6}
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
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span>Preview Validation Summary:</span>
                <span className="text-muted-foreground text-[11px]">
                  {preview.totalValid} valid problem{preview.totalValid === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border bg-emerald-500/10 border-emerald-500/20 p-2 text-center">
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {preview.newCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    New to Import
                  </div>
                </div>

                <div className="rounded-md border bg-muted/50 p-2 text-center">
                  <div className="text-base font-bold text-foreground">
                    {preview.alreadyImportedCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Already Tracked
                  </div>
                </div>

                <div className="rounded-md border bg-amber-500/10 border-amber-500/20 p-2 text-center">
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                    {preview.invalidCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Invalid / Duplicate
                  </div>
                </div>
              </div>

              {preview.sampleTitles.length > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Sample new items: </span>
                  {preview.sampleTitles.join(", ")}
                  {preview.newCount > 5 ? ` and ${preview.newCount - 5} more...` : ""}
                </div>
              )}
            </div>
          )}

          {confirmError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{confirmError}</span>
            </div>
          )}

          {confirmSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{confirmSuccess}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isPreviewing || !pastedJson.trim()}
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Validating...
                </>
              ) : (
                "Preview"
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={
                isConfirming ||
                !preview ||
                preview.newCount === 0 ||
                confirmSuccess !== null
              }
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Importing...
                </>
              ) : (
                `Confirm Import (${preview ? preview.newCount : 0})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
