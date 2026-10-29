// =============================================================================
// Read-Only Code Viewer Component with Language Label & Copy Button
// =============================================================================

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CodeViewerProps {
  code: string;
  language: string;
  runtime?: string | null;
  memory?: string | null;
  notes?: string | null;
}

export function CodeViewer({
  code,
  language,
  runtime,
  memory,
  notes,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Split lines for clean line numbering
  const lines = code.split("\n");

  return (
    <div className="overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 shadow-xs">
      {/* Header bar with language label and copy button */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-zinc-700 bg-zinc-800 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-200"
          >
            {language}
          </Badge>
          {runtime && (
            <span className="font-mono text-[11px] text-zinc-400">
              Runtime: {runtime}
            </span>
          )}
          {memory && (
            <span className="font-mono text-[11px] text-zinc-400">
              Memory: {memory}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1 px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy code</span>
            </>
          )}
        </Button>
      </div>

      {/* Read-only Code Body with Line Numbers */}
      <div className="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-zinc-900/50">
                <td className="w-8 select-none pr-4 text-right font-mono text-[11px] text-zinc-600">
                  {idx + 1}
                </td>
                <td className="whitespace-pre break-all font-mono text-zinc-100">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional Solution Notes */}
      {notes && (
        <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Notes: </span>
          {notes}
        </div>
      )}
    </div>
  );
}
