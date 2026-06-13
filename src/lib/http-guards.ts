import "server-only";

// Lightweight, dependency-free request guards.
// NOTE: state is per-runtime-instance (in-memory). On serverless this is a
// best-effort throttle, not a global guarantee — a shared store (Redis/Upstash)
// is the upgrade path once there are real users. It still meaningfully blunts
// the open-insert abuse vector flagged in the gap analysis.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function clientKey(request: Request, scope: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const device = request.headers.get("X-Custod-Device") ?? "";
  return `${scope}:${ip}:${device}`;
}

// --- Idempotency (dedupe extension/client retries) ---

type IdempotentEntry = { value: unknown; expiresAt: number };
const idempotent = new Map<string, IdempotentEntry>();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

export function getIdempotent<T>(key: string): T | null {
  const entry = idempotent.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    idempotent.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setIdempotent(key: string, value: unknown): void {
  idempotent.set(key, { value, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS });
  // Opportunistic cleanup so the map can't grow unbounded.
  if (idempotent.size > 5000) {
    const now = Date.now();
    for (const [k, v] of idempotent) if (v.expiresAt <= now) idempotent.delete(k);
  }
}
