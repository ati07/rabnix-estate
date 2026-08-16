import { hammingDistance } from "./media";

// Automated moderation flags (docs/system-design.md §5): cheap signals that route a listing to
// human review. Computed on the fly from data the queue already loads — no stored flag table yet.
// Price-outlier and keyword-spam scoring are TODO.

const DUP_HAMMING_THRESHOLD = 5; // dHash distance below which two photos are "the same"
const MANY_LISTINGS_THRESHOLD = 5; // one owner/phone with >= this many listings looks broker-ish

export type FlaggedMedia = { phash: string | null };

/** A photo on some *other* listing, used to detect cross-listing image reuse. */
export type OtherMedia = { listingId: string; phash: string | null };

/**
 * Human-readable auto-flags for one listing. Pure — callers pass in the data:
 *  - `listingMedia`: this listing's photos
 *  - `otherMedia`: photos belonging to other listings
 *  - `ownerListingCount`: how many listings this owner has
 */
export function flagsForListing(
  listingMedia: readonly FlaggedMedia[],
  otherMedia: readonly OtherMedia[],
  ownerListingCount: number,
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

  return flags;
}
