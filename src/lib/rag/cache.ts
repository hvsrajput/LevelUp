// =============================================================================
// Rate-Limiting & In-Memory TTL Cache for RAG / LLM Calls
// =============================================================================

import crypto from "crypto";
import type { SuggestResponse } from "@/lib/validators/suggest";

// -----------------------------------------------------------------------------
// Suggestion Response Cache
// -----------------------------------------------------------------------------

interface CacheEntry {
  data: SuggestResponse;
  expiresAt: number;
}

class SuggestionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMinutes = 60, maxSize = 500) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.maxSize = maxSize;
  }

  generateKey(title: string, description: string, constraints?: string | null): string {
    const raw = `${title.trim().toLowerCase()}||${description.trim().toLowerCase()}||${(constraints || "").trim().toLowerCase()}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  get(key: string): SuggestResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: SuggestResponse): void {
    // Evict oldest item if max size reached
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const suggestionCache = new SuggestionCache();

// -----------------------------------------------------------------------------
// User Rate Limiter (Sliding Window)
// -----------------------------------------------------------------------------

interface RateLimitRecord {
  timestamps: number[];
}

class UserRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  check(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const record = this.records.get(userId) || { timestamps: [] };

    // Filter out timestamps outside the sliding window
    const validTimestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestValid = validTimestamps[0];
      const retryAfterSeconds = Math.ceil((oldestValid + this.windowMs - now) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }

    validTimestamps.push(now);
    this.records.set(userId, { timestamps: validTimestamps });

    return { allowed: true };
  }

  reset(userId?: string): void {
    if (userId) {
      this.records.delete(userId);
    } else {
      this.records.clear();
    }
  }
}

export const ragRateLimiter = new UserRateLimiter(10, 60);
