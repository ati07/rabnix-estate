import { describe, it, expect } from "vitest";
import { RateLimiter } from "./rateLimit";

describe("RateLimiter", () => {
  it("allows up to the limit, then blocks", () => {
    let now = 1000;
    const rl = new RateLimiter(3, 1000, () => now);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(true);
    const blocked = rl.check("a");
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports remaining allowance", () => {
    let now = 0;
    const rl = new RateLimiter(2, 1000, () => now);
    expect(rl.check("a").remaining).toBe(1);
    expect(rl.check("a").remaining).toBe(0);
  });

  it("frees up after the window slides past old hits", () => {
    let now = 0;
    const rl = new RateLimiter(1, 1000, () => now);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(false);
    now = 1001; // window has passed
    expect(rl.check("a").ok).toBe(true);
  });

  it("tracks keys independently", () => {
    let now = 0;
    const rl = new RateLimiter(1, 1000, () => now);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("b").ok).toBe(true);
    expect(rl.check("a").ok).toBe(false);
  });

  it("sweep drops fully-expired buckets", () => {
    let now = 0;
    const rl = new RateLimiter(1, 1000, () => now);
    rl.check("a");
    now = 2000;
    rl.sweep();
    // After sweeping, the key is gone so a fresh attempt is allowed.
    expect(rl.check("a").ok).toBe(true);
  });
});
