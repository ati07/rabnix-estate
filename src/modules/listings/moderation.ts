import { hammingDistance } from "./media";

// Automated moderation flags (docs/system-design.md §5): cheap signals that route a listing to
// human review. Computed on the fly from data the queue already loads — no stored flag table yet.
// All functions are pure — callers pass the data in, so this stays unit-testable without a DB.

const DUP_HAMMING_THRESHOLD = 5; // dHash distance below which two photos are "the same"
const MANY_LISTINGS_THRESHOLD = 5; // one owner/phone with >= this many listings looks broker-ish

// Price-outlier tuning. Need a few comparables before the median is meaningful; then flag prices
// that sit far below (likely bait) or far above (likely typo/fraud) the locality median.
const PRICE_MIN_SAMPLES = 4;
const PRICE_LOW_RATIO = 0.4; // <= 40% of median
const PRICE_HIGH_RATIO = 2.5; // >= 250% of median

// Spam signals in free text (title + description).
const SPAM_PHRASES = [
  "no broker",
  "no brokerage",
  "direct owner",
  "genuine buyer",
  "genuine buyers only",
  "urgent sale",
  "urgent requirement",
  "call now",
  "call immediately",
  "limited offer",
  "best deal",
  "100% genuine",
  "no commission",
];
// Contact details in the body = an attempt to take the deal off-platform.
const PHONE_RE = /(?:\+?\d[\s-]?){10,}/; // 10+ digits, optionally spaced/dashed
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i;

export type FlaggedMedia = { phash: string | null };

/** A photo on some *other* listing, used to detect cross-listing image reuse. */
export type OtherMedia = { listingId: string; phash: string | null };

/** Extra signals for price/spam flags; all optional so old call sites keep working. */
export type ModerationContext = {
  price?: number;
  /** Prices of comparable *live* listings (same locality + intent), excluding this one. */
  localityPrices?: readonly number[];
  title?: string | null;
  description?: string | null;
};

/** Median of a numeric list; NaN for an empty list. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Price-outlier flag vs the locality median, or null if there aren't enough comparables. */
export function priceOutlierFlag(
  price: number | undefined,
  localityPrices: readonly number[] | undefined,
): string | null {
  if (price == null || !localityPrices || localityPrices.length < PRICE_MIN_SAMPLES) return null;
  const med = median(localityPrices);
  if (!(med > 0)) return null;
  const ratio = price / med;
  if (ratio <= PRICE_LOW_RATIO || ratio >= PRICE_HIGH_RATIO) {
    return `Price outlier (${ratio.toFixed(1)}× locality median)`;
  }
  return null;
}

/** Spam/off-platform-contact flags found in the listing's free text. */
export function spamFlags(title?: string | null, description?: string | null): string[] {
  const text = `${title ?? ""} ${description ?? ""}`;
  const flags: string[] = [];
  if (PHONE_RE.test(text) || EMAIL_RE.test(text) || URL_RE.test(text)) {
    flags.push("Contact info in text");
  }
  const lower = text.toLowerCase();
  if (SPAM_PHRASES.some((p) => lower.includes(p))) flags.push("Spam keywords");
  return flags;
}

// Risk score (0–100) blending auto-flags and buyer reports into one triage number for the queue.
// Weights are deliberately simple/tunable; higher = review sooner.
function flagWeight(flag: string): number {
  if (flag.startsWith("Duplicate image")) return 30;
  if (flag.startsWith("Price outlier")) return 25;
  if (flag.startsWith("One phone")) return 20;
  if (flag.startsWith("Contact info")) return 20;
  if (flag.startsWith("Spam keywords")) return 15;
  return 10;
}

export function riskScore(flags: readonly string[], reportCount: number): number {
  const fromFlags = flags.reduce((sum, f) => sum + flagWeight(f), 0);
  const fromReports = Math.min(reportCount * 15, 45); // reports matter but shouldn't dominate alone
  return Math.min(100, fromFlags + fromReports);
}

export function riskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/**
 * Human-readable auto-flags for one listing. Pure — callers pass in the data:
 *  - `listingMedia`: this listing's photos
 *  - `otherMedia`: photos belonging to other listings
 *  - `ownerListingCount`: how many listings this owner has
 *  - `context`: optional price/text signals (price-outlier + spam flags)
 */
export function flagsForListing(
  listingMedia: readonly FlaggedMedia[],
  otherMedia: readonly OtherMedia[],
  ownerListingCount: number,
  context: ModerationContext = {},
): string[] {
  const flags: string[] = [];

  const dup = listingMedia.some(
    (m) =>
      m.phash != null &&
      otherMedia.some((o) => o.phash != null && hammingDistance(m.phash!, o.phash) <= DUP_HAMMING_THRESHOLD),
  );
  if (dup) flags.push("Duplicate image");

  if (ownerListingCount >= MANY_LISTINGS_THRESHOLD) {
    flags.push(`One phone → ${ownerListingCount} listings`);
  }

  const price = priceOutlierFlag(context.price, context.localityPrices);
  if (price) flags.push(price);

  flags.push(...spamFlags(context.title, context.description));

  return flags;
}
