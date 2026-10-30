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
          className="rounded-[14px] bg-card border-border/70 hover:bg-tint font-semibold text-xs text-foreground h-10"
        >
          <Upload className="mr-2 h-4 w-4 text-accent-orange" /> Import from LeetCode
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px] p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-tint text-accent-orange font-bold text-sm">
              LC
            </span>
            <DialogTitle className="text-xl font-bold text-foreground">Import from LeetCode</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-secondary mt-1">
            Import your solved problems by copying and pasting a client-side JSON export directly from your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1: Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-accent-orange" />
                1. Copy &amp; Run Console Script on leetcode.com
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="h-7 text-xs gap-1.5 rounded-[10px] bg-card border-border/70"
              >
                {hasCopiedScript ? (
                  <>
                    <Check className="h-3 w-3 text-[#2D6A1E]" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Script
                  </>
                )}
              </Button>
            </div>

            <div className="relative rounded-[14px] border border-[#223528] bg-[#14221A] text-[#E8F0DF] p-3 font-mono text-[11px] overflow-x-auto max-h-24">
              <pre className="whitespace-pre">{CONSOLE_IMPORT_SCRIPT}</pre>
            </div>

            <div className="flex items-start gap-2 rounded-[14px] bg-tint p-3 text-[11px] text-secondary leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-accent-orange mt-0.5" />
              <span>
                It runs in your own browser on <strong>leetcode.com</strong> (press F12 &rarr; Console) and sends nothing to this app until you paste the result below.
              </span>
            </div>
          </div>

          {/* Step 2: Paste Area */}
          <div className="space-y-2">
            <label
              htmlFor="pasted-leetcode-json"
              className="text-xs font-bold uppercase tracking-wider text-secondary"
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
              className="font-mono text-xs bg-tint border-transparent rounded-[14px] p-3.5"
            />
          </div>

          {previewError && (
            <div className="flex items-center gap-2 rounded-[14px] bg-[#FFDDD8] p-3 text-xs font-semibold text-[#B42318]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="rounded-[16px] bg-tint p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Preview Validation Summary:</span>
                <span className="text-secondary text-[11px] font-medium">
                  {preview.totalValid} valid problem{preview.totalValid === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-[12px] bg-card border border-border/70 p-2.5 text-center shadow-soft-sm">
                  <div className="text-base font-bold text-[#2D6A1E]">
                    {preview.newCount}
                  </div>
                  <div className="text-[10px] text-secondary font-medium">
                    New to Import
                  </div>
                </div>

                <div className="rounded-[12px] bg-card border border-border/70 p-2.5 text-center shadow-soft-sm">
                  <div className="text-base font-bold text-foreground">
                    {preview.alreadyImportedCount}
                  </div>
                  <div className="text-[10px] text-secondary font-medium">
                    Already Tracked
                  </div>
                </div>

                <div className="rounded-[12px] bg-card border border-border/70 p-2.5 text-center shadow-soft-sm">
                  <div className="text-base font-bold text-[#8F4A0B]">
                    {preview.invalidCount}
                  </div>
                  <div className="text-[10px] text-secondary font-medium">
                    Invalid / Duplicate
                  </div>
                </div>
              </div>

              {preview.sampleTitles.length > 0 && (
                <div className="text-[11px] text-secondary">
                  <span className="font-bold text-foreground">Sample new items: </span>
                  {preview.sampleTitles.join(", ")}
                  {preview.newCount > 5 ? ` and ${preview.newCount - 5} more...` : ""}
                </div>
              )}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isPreviewing || !pastedJson.trim()}
              className="rounded-[14px] font-semibold text-xs"
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
              className="rounded-[14px] font-semibold text-xs shadow-sm"
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
