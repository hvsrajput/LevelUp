"use server";

import { auth } from "@/lib/auth";
import {
  previewLeetCodeImport,
  confirmLeetCodeImport,
  type PreviewImportResult,
  type ConfirmImportResult,
} from "@/lib/leetcode/paste-import";

/**
 * Server action to preview a pasted LeetCode JSON export
 */
export async function previewLeetCodeImportAction(
  rawJson: string
): Promise<PreviewImportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to import problems.");
  }

  return previewLeetCodeImport(session.user.id, rawJson);
}

/**
 * Server action to batch insert confirmed LeetCode problems
 */
export async function confirmLeetCodeImportAction(
  rawJson: string
): Promise<ConfirmImportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to import problems.");
  }

  return confirmLeetCodeImport(session.user.id, rawJson);
}
