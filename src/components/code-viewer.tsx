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
    <div className="overflow-hidden rounded-[16px] border border-[#223528] bg-[#14221A] text-[#E8F0DF] shadow-soft">
      {/* Header bar with language label and copy button */}
      <div className="flex items-center justify-between border-b border-[#223528] bg-[#0E1912] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-transparent bg-[#1E2B1D] font-mono text-[11px] font-bold uppercase tracking-wider text-accent-orange rounded-full px-2.5 py-0.5"
          >
            {language}
          </Badge>
          {runtime && (
            <span className="font-mono text-[11px] text-[#8A977E]">
              Runtime: {runtime}
            </span>
          )}
          {memory && (
            <span className="font-mono text-[11px] text-[#8A977E]">
              Memory: {memory}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2.5 rounded-[10px] text-xs text-[#A5B79C] hover:bg-[#1E2B1D] hover:text-[#FFFFFF]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#65C237]" />
              <span className="text-[#65C237]">Copied</span>
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
              <tr key={idx} className="hover:bg-[#1C2C20]/40">
                <td className="w-8 select-none pr-4 text-right font-mono text-[11px] text-[#5B6B58]">
                  {idx + 1}
                </td>
                <td className="whitespace-pre break-all font-mono text-[#E8F0DF]">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional Solution Notes */}
      {notes && (
        <div className="border-t border-[#223528] bg-[#0E1912]/80 px-4 py-2.5 text-xs text-[#8A977E]">
          <span className="font-bold text-[#E8F0DF]">Notes: </span>
          {notes}
        </div>
      )}
    </div>
  );
}
