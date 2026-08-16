import sharp from "sharp";

// Image pipeline for listing media (docs/build-plan-phase1.md, Week 2):
// EXIF strip + auto-rotate → WebP (size-capped) → blur placeholder → perceptual hash (dHash).
// pHash feeds duplicate/fraud detection (the Week-4 moderation auto-flag).

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per image
export const MAX_IMAGES_PER_LISTING = 12;
const MAX_WIDTH = 1600; // responsive delivery beyond this is handled by next/image
const DUP_HAMMING_THRESHOLD = 5; // dHash distance below which two images are "the same"

export type ProcessedImage = {
  webp: Buffer;
  width: number;
  height: number;
  blurDataUrl: string;
  phash: string; // 16-hex-char (64-bit) dHash
};

export function isAllowedMime(mime: string): mime is (typeof ALLOWED_MIME)[number] {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/**
 * Normalize an uploaded image to a web-ready WebP plus derived metadata.
 * `.rotate()` bakes EXIF orientation into pixels; re-encoding then drops all metadata
 * (EXIF/GPS stripped) since we don't call `.withMetadata()`.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const base = sharp(input).rotate();

  const { data, info } = await base
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const blur = await sharp(data).resize({ width: 20 }).webp({ quality: 40 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blur.toString("base64")}`;

  const phash = await dHash(input);

  return { webp: data, width: info.width, height: info.height, blurDataUrl, phash };
}

/**
 * Difference hash (dHash): compare adjacent pixel brightness on a 9×8 grayscale downscale,
 * yielding 64 bits returned as 16 hex chars. Robust to resize/recompression, so near-identical
 * photos collide even after our own WebP pass.
 */
export async function dHash(input: Buffer): Promise<string> {
  const w = 9;
  const h = 8;
  const { data } = await sharp(input)
    .rotate()
    .grayscale()
    .resize(w, h, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w - 1; col++) {
      const left = data[row * w + col];
      const right = data[row * w + col + 1];
      bits += left < right ? "1" : "0";
    }
  }

  // 64 bits → 16 hex chars
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/** Number of differing bits between two equal-length hex hashes (∞ if lengths differ). */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

/** True if `phash` is within the duplicate threshold of any hash in `existing`. */
export function isDuplicate(phash: string, existing: readonly (string | null)[]): boolean {
  return existing.some((h) => h != null && hammingDistance(phash, h) <= DUP_HAMMING_THRESHOLD);
}
