// In-memory sliding-window rate limiter. Good enough for a single app instance (dev + small
// deployments); swap the store for Redis/Upstash when you run more than one node — the
// `check`/`RateLimiter` shape stays the same. Pure and clock-injectable so it's unit-testable.

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Epoch ms when the window frees up enough to allow another request. */
  resetAt: number;
};

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Record an attempt for `key`; returns whether it's allowed under the window. */
  check(key: string): RateLimitResult {
    const t = this.now();
    const cutoff = t - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return { ok: false, remaining: 0, resetAt: recent[0] + this.windowMs };
    }
    recent.push(t);
    this.hits.set(key, recent);
    return { ok: true, remaining: this.limit - recent.length, resetAt: t + this.windowMs };
  }

  /** Drop expired buckets so the Map doesn't grow unbounded. Call opportunistically. */
  sweep(): void {
    const cutoff = this.now() - this.windowMs;
    for (const [key, arr] of this.hits) {
      const recent = arr.filter((ts) => ts > cutoff);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }
}

// Shared limiters for API routes. Module-level so they persist across requests in one instance.
export const authLimiter = new RateLimiter(10, 60_000); // 10 login/register attempts / min / IP
export const contactLimiter = new RateLimiter(20, 60_000); // 20 contact/report actions / min / IP

/** Best-effort client IP from proxy headers; falls back to a shared bucket. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
