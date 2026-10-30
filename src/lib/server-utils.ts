import { revalidatePath } from "next/cache";

/**
 * Safely revalidates a Next.js cache path, ignoring errors when called
 * outside of a live Next.js request context (e.g. during unit tests).
 * Placed in a server-only module to prevent client bundle bundling.
 */
export function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // No-op in test/non-request environments
  }
}
