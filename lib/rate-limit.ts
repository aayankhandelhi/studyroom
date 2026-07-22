import 'server-only';

/**
 * Lightweight fixed-window rate limiter (charter §Reliability: rate-limit auth,
 * search, forms, expensive endpoints, webhooks).
 *
 * Default is an in-memory store — correct for a single instance and good enough
 * to develop against. For serverless/multi-instance (Vercel), back it with
 * Upstash Redis by implementing the same interface (swap `hit`).
 */
interface Bucket { count: number; resetAt: number }
const store = new Map<string, Bucket>();

export interface RateLimitResult { success: boolean; remaining: number; resetAt: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }
  existing.count += 1;
  const success = existing.count <= limit;
  return { success, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

/** Derive a client key from headers (best-effort IP) for anonymous limits. */
export function clientKey(headers: Headers, scope: string): string {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown';
  return `${scope}:${ip}`;
}
