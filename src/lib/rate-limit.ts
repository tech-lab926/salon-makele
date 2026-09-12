type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
const MAX_ENTRIES = 25_000;

function prune(now: number) {
  if (store.size <= MAX_ENTRIES) return;
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
    if (store.size <= MAX_ENTRIES / 2) break;
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  prune(now);

  const b = store.get(key);
  if (!b || now > b.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (b.count >= limit) {
    return { ok: false, retryAfterMs: Math.max(0, b.resetAt - now) };
  }

  b.count += 1;
  return { ok: true };
}

/**
 * Client IP for rate limiting. In production, set TRUST_PROXY=true only when
 * a reverse proxy strips/overwrites client-supplied X-Forwarded-For (e.g. nginx).
 * Development uses forwarded headers for local testing.
 */
export function clientIp(request: { headers: Headers; ip?: string }): string {
  if ("ip" in request && typeof request.ip === "string" && request.ip.trim()) {
    return request.ip.slice(0, 45);
  }
  const trustForwarded =
    process.env.TRUST_PROXY === "true" || process.env.NODE_ENV !== "production";
  if (trustForwarded) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first.slice(0, 45);
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.slice(0, 45);
  }
  return "unknown";
}
