"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Validates whether a given URL is a valid LeetCode problem URL:
 * - Must be a valid URL string parsable by `new URL()`
 * - Protocol must be `https:`
 * - Host must be `leetcode.com` or a subdomain of `leetcode.com` (e.g. `www.leetcode.com`, `cn.leetcode.com`)
 */
export function isValidLeetCodeUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    return hostname === "leetcode.com" || hostname.endsWith(".leetcode.com");
  } catch {
    return false;
  }
}

export interface SolveButtonProps {
  url?: string | null;
  label: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "dark";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SolveButton({
  url,
  label,
  className,
  variant = "default",
  size = "default",
}: SolveButtonProps) {
  const isValid = isValidLeetCodeUrl(url);

  if (!isValid) {
    return (
      <div className="w-full space-y-1">
        <div
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[14px] bg-tint px-4 py-2 text-sm font-medium text-text-muted select-none cursor-not-allowed border border-border/40",
            size === "sm" && "h-8 px-3 text-xs rounded-[12px]",
            size === "lg" && "h-11 px-6 rounded-[14px]",
            className
          )}
          aria-disabled="true"
        >
          <Ban className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>{label} unavailable</span>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          No LeetCode link is saved for this problem.
        </p>
      </div>
    );
  }

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
    >
      <a
        href={url!}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
        <ExternalLink className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </a>
    </Button>
  );
}
