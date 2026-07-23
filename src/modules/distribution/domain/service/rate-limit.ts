type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 60;

/** In-memory rate limit for public distribution endpoints (per IP). */
export function checkPublicRateLimit(key: string): {
  ok: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= MAX_HITS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  bucket.count += 1;
  return { ok: true };
}

export function _resetPublicRateLimitForTests() {
  buckets.clear();
}
