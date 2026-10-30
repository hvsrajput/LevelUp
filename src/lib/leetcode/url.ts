// =============================================================================
// LeetCode URL Resolution and Security Validation
// =============================================================================

/**
 * Validates that a URL is a secure, valid LeetCode problem URL:
 * - Must be parseable by `new URL()`
 * - Protocol must be strictly `https:` (rejecting http, javascript:, etc.)
 * - Host must be `leetcode.com` or a subdomain of `leetcode.com` (e.g. `www.leetcode.com`, `cn.leetcode.com`)
 */
export function safeLeetCodeUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    return hostname === "leetcode.com" || hostname.endsWith(".leetcode.com");
  } catch {
    return false;
  }
}

/**
 * Determines whether a problem is on LeetCode and returns its canonical URL.
 * - If titleSlug is provided: derives `https://leetcode.com/problems/<slug>/`
 * - If stored url is provided: validates with `safeLeetCodeUrl`
 * - If neither is valid: returns null (render nothing, no placeholder)
 */
export function getProblemLeetCodeUrl(problem?: {
  titleSlug?: string | null;
  url?: string | null;
} | null): string | null {
  if (!problem) return null;

  if (problem.titleSlug && typeof problem.titleSlug === "string") {
    const slug = problem.titleSlug.trim().toLowerCase();
    if (slug) {
      const derived = `https://leetcode.com/problems/${slug}/`;
      if (safeLeetCodeUrl(derived)) {
        return derived;
      }
    }
  }

  if (problem.url && typeof problem.url === "string") {
    const trimmed = problem.url.trim();
    if (safeLeetCodeUrl(trimmed)) {
      return trimmed;
    }
  }

  return null;
}
