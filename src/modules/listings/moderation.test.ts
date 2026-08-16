import { describe, it, expect } from "vitest";
import { flagsForListing } from "./moderation";

describe("flagsForListing", () => {
  const hash = "0f0f0f0f0f0f0f0f";

  it("returns no flags for a clean listing", () => {
    expect(flagsForListing([{ phash: hash }], [{ listingId: "x", phash: "f0f0f0f0f0f0f0f0" }], 1)).toEqual([]);
  });

  it("flags an image reused on another listing", () => {
    const flags = flagsForListing(
      [{ phash: hash }],
      [{ listingId: "other", phash: hash }],
      1,
    );
    expect(flags).toContain("Duplicate image");
  });

  it("flags a near-duplicate within the Hamming threshold", () => {
    const flags = flagsForListing(
      [{ phash: hash }],
      [{ listingId: "other", phash: "1f0f0f0f0f0f0f0f" }], // 1 bit off
      1,
    );
    expect(flags).toContain("Duplicate image");
  });

  it("does not flag distinct images", () => {
    const flags = flagsForListing(
      [{ phash: hash }],
      [{ listingId: "other", phash: "f0f0f0f0f0f0f0f0" }],
      1,
    );
    expect(flags).not.toContain("Duplicate image");
  });

  it("ignores null hashes on either side", () => {
    expect(flagsForListing([{ phash: null }], [{ listingId: "o", phash: hash }], 1)).toEqual([]);
    expect(flagsForListing([{ phash: hash }], [{ listingId: "o", phash: null }], 1)).toEqual([]);
  });

  it("flags one owner with many listings (≥5)", () => {
    const flags = flagsForListing([{ phash: hash }], [], 5);
    expect(flags).toContain("One phone → 5 listings");
  });

  it("does not flag an owner below the threshold", () => {
    expect(flagsForListing([{ phash: hash }], [], 4)).toEqual([]);
  });

  it("can raise both flags at once", () => {
    const flags = flagsForListing([{ phash: hash }], [{ listingId: "o", phash: hash }], 6);
    expect(flags).toEqual(["Duplicate image", "One phone → 6 listings"]);
  });
});
