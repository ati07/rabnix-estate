import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { dHash, hammingDistance, isDuplicate, isAllowedMime, processImage } from "./media";

// Build a deterministic grayscale gradient as a PNG buffer.
// "h" = brightness increases left→right; "v" = increases top→bottom.
async function gradient(direction: "h" | "v", size = 64): Promise<Buffer> {
  const px = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = direction === "h" ? x / (size - 1) : y / (size - 1);
      const v = Math.round(t * 255);
      const i = (y * size + x) * 3;
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }
  }
  return sharp(px, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
}

describe("hammingDistance", () => {
  it("is 0 for identical hashes", () => {
    expect(hammingDistance("ffffffffffffffff", "ffffffffffffffff")).toBe(0);
  });

  it("counts differing bits per hex nibble", () => {
    // 0x0 ^ 0xf = 0xf → 4 set bits; rest identical.
    expect(hammingDistance("0000000000000000", "f000000000000000")).toBe(4);
    // 0x1 ^ 0x0 = 1 bit, in two positions → 2.
    expect(hammingDistance("0000000000000000", "1000000000000001")).toBe(2);
  });

  it("is Infinity when lengths differ", () => {
    expect(hammingDistance("ff", "ffff")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("isDuplicate", () => {
  const base = "0f0f0f0f0f0f0f0f";
  it("matches an identical hash", () => {
    expect(isDuplicate(base, [base])).toBe(true);
  });
  it("matches within the Hamming ≤5 threshold", () => {
    // one nibble flips 0x0→0x1 (1 bit): distance 1.
    expect(isDuplicate(base, ["1f0f0f0f0f0f0f0f"])).toBe(true);
  });
  it("rejects beyond the threshold", () => {
    expect(isDuplicate(base, ["f0f0f0f0f0f0f0f0"])).toBe(false);
  });
  it("ignores null hashes", () => {
    expect(isDuplicate(base, [null, null])).toBe(false);
  });
});

describe("isAllowedMime", () => {
  it("accepts jpeg/png/webp and rejects others", () => {
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/webp")).toBe(true);
    expect(isAllowedMime("image/gif")).toBe(false);
    expect(isAllowedMime("application/pdf")).toBe(false);
  });
});

describe("dHash", () => {
  it("returns 16 hex chars", async () => {
    const hash = await dHash(await gradient("h"));
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic for the same image", async () => {
    const img = await gradient("h");
    expect(await dHash(img)).toBe(await dHash(img));
  });

  it("survives re-encoding: a WebP copy stays a duplicate", async () => {
    const original = await gradient("h");
    const recompressed = await sharp(original).webp({ quality: 60 }).toBuffer();
    const a = await dHash(original);
    const b = await dHash(recompressed);
    expect(isDuplicate(a, [b])).toBe(true);
  });

  it("distinguishes visually different images", async () => {
    const a = await dHash(await gradient("h"));
    const b = await dHash(await gradient("v"));
    expect(isDuplicate(a, [b])).toBe(false);
  });
});

describe("processImage", () => {
  it("produces a WebP plus derived metadata", async () => {
    const result = await processImage(await gradient("h", 128));
    expect(result.webp.length).toBeGreaterThan(0);
    expect(result.width).toBe(128);
    expect(result.height).toBe(128);
    expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(result.phash).toMatch(/^[0-9a-f]{16}$/);
  });
});
