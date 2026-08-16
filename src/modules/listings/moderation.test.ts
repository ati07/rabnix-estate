import { describe, it, expect } from "vitest";
import { flagsForListing, median, priceOutlierFlag, spamFlags, riskScore, riskLevel } from "./moderation";

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

  it("flags a price outlier via context", () => {
    const flags = flagsForListing([{ phash: hash }], [], 1, {
      price: 100,
      localityPrices: [1000, 1100, 900, 1050],
    });
    expect(flags.some((f) => f.startsWith("Price outlier"))).toBe(true);
  });

  it("flags spammy text via context", () => {
    const flags = flagsForListing([{ phash: hash }], [], 1, {
      description: "Genuine buyers only, no broker. Call 9876543210 now!",
    });
    expect(flags).toContain("Contact info in text");
    expect(flags).toContain("Spam keywords");
  });
});

describe("median", () => {
  it("handles odd and even lengths", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
  it("is NaN for an empty list", () => {
    expect(Number.isNaN(median([]))).toBe(true);
  });
});

describe("priceOutlierFlag", () => {
  const comps = [1000, 1100, 900, 1050]; // median 1025

  it("flags a suspiciously low price", () => {
    expect(priceOutlierFlag(300, comps)).toMatch(/Price outlier/);
  });
  it("flags a suspiciously high price", () => {
    expect(priceOutlierFlag(3000, comps)).toMatch(/Price outlier/);
  });
  it("does not flag a normal price", () => {
    expect(priceOutlierFlag(1000, comps)).toBeNull();
  });
  it("stays silent without enough comparables", () => {
    expect(priceOutlierFlag(1, [1000, 1000, 1000])).toBeNull();
  });
  it("stays silent when price is missing", () => {
    expect(priceOutlierFlag(undefined, comps)).toBeNull();
  });
});

describe("riskScore / riskLevel", () => {
  it("is 0 with no flags or reports", () => {
    expect(riskScore([], 0)).toBe(0);
    expect(riskLevel(0)).toBe("low");
  });
  it("weights a duplicate image heavily", () => {
    expect(riskScore(["Duplicate image"], 0)).toBe(30);
    expect(riskLevel(riskScore(["Duplicate image"], 0))).toBe("medium");
  });
  it("adds report pressure but caps its contribution", () => {
    expect(riskScore([], 3)).toBe(45);
    expect(riskScore([], 10)).toBe(45); // capped at 45
  });
  it("caps the total at 100", () => {
    const flags = ["Duplicate image", "Price outlier (3.0× locality median)", "One phone → 6 listings", "Contact info in text", "Spam keywords"];
    expect(riskScore(flags, 5)).toBe(100);
    expect(riskLevel(100)).toBe("high");
  });
});

describe("spamFlags", () => {
  it("flags a phone number in the text", () => {
    expect(spamFlags(null, "Reach me at 98765 43210")).toContain("Contact info in text");
  });
  it("flags an email or URL", () => {
    expect(spamFlags("Deal", "mail me@x.com")).toContain("Contact info in text");
    expect(spamFlags(null, "see www.example.com")).toContain("Contact info in text");
  });
  it("flags spam phrases case-insensitively", () => {
    expect(spamFlags("URGENT SALE", null)).toContain("Spam keywords");
  });
  it("returns nothing for clean text", () => {
    expect(spamFlags("Sunny 2 BHK", "Bright home near the park.")).toEqual([]);
  });
});
