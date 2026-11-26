/**
 * In-memory fixed-window rate limiter. Suitable for a single Node.js process
 * (Hostinger Node.js web app). Account lockout for logins is additionally
 * persisted in MySQL (User.failedLoginCount / lockedUntil).
 */
type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __mtRate?: Map<string, Bucket> };
const store = (g.__mtRate ??= new Map());

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  let b = store.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    store.set(key, b);
  }
  b.count++;
  if (store.size > 50_000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }
  return { allowed: b.count <= max, remaining: Math.max(0, max - b.count), resetAt: b.resetAt };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}
