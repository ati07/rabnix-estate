import { describe, it, expect } from "vitest";
import {
  BUDGET_BANDS,
  priceInBand,
  computeBrowseFacets,
  browseHref,
  type BrowseRow,
} from "./browse";

describe("priceInBand", () => {
  it("treats max as exclusive and min as inclusive", () => {
    const band = { key: "s2", label: "50L-1Cr", min: 5_000_000, max: 10_000_000 };
    expect(priceInBand(5_000_000, band)).toBe(true); // min inclusive
    expect(priceInBand(9_999_999, band)).toBe(true);
    expect(priceInBand(10_000_000, band)).toBe(false); // max exclusive
    expect(priceInBand(4_999_999, band)).toBe(false);
  });
  it("open-ended bands (no min / no max)", () => {
    expect(priceInBand(1, { key: "s1", label: "under", max: 5_000_000 })).toBe(true);
    expect(priceInBand(99_000_000, { key: "s4", label: "1.5Cr+", min: 15_000_000 })).toBe(true);
  });
});

describe("computeBrowseFacets", () => {
  const rows: BrowseRow[] = [
    { propertyType: "apartment", bedrooms: 2, price: 4_000_000, intent: "sale", localityId: "wakad" },
    { propertyType: "apartment", bedrooms: 3, price: 8_000_000, intent: "sale", localityId: "wakad" },
    { propertyType: "villa", bedrooms: 5, price: 20_000_000, intent: "sale", localityId: "baner" },
    { propertyType: "apartment", bedrooms: 2, price: 22_000, intent: "rent", localityId: "wakad" },
    { propertyType: "plot", bedrooms: null, price: 3_000_000, intent: "sale", localityId: null },
  ];

  it("counts property types and drops zero-count ones", () => {
    const f = computeBrowseFacets(rows);
    const map = Object.fromEntries(f.propertyTypes.map((p) => [p.value, p.count]));
    expect(map).toEqual({ apartment: 3, villa: 1, plot: 1 });
    expect(f.propertyTypes.find((p) => p.value === "commercial")).toBeUndefined();
  });

  it("buckets BHK with a 4+ bucket and ignores null bedrooms", () => {
    const f = computeBrowseFacets(rows);
    const map = Object.fromEntries(f.bhk.map((b) => [b.value, b.count]));
    expect(map).toEqual({ 2: 2, 3: 1, 4: 1 }); // the 5-BHK villa folds into "4+"
  });

  it("splits budgets by intent and only keeps non-empty bands", () => {
    const f = computeBrowseFacets(rows);
    const sale = Object.fromEntries(f.budgets.sale.map((b) => [b.value, b.count]));
    expect(sale.s1).toBe(2); // 40L + 30L under 50L
    expect(sale.s2).toBe(1); // 80L in 50L-1Cr
    expect(sale.s4).toBe(1); // 2Cr villa
    expect(sale.s3).toBeUndefined(); // nothing in 1-1.5Cr band, so it's dropped
    const rent = Object.fromEntries(f.budgets.rent.map((b) => [b.value, b.count]));
    expect(rent.r3).toBe(1); // 22k in 15-25k
  });

  it("ranks localities by count, most first", () => {
    const f = computeBrowseFacets(rows);
    expect(f.localities[0]).toEqual({ id: "wakad", count: 3 });
    expect(f.localities.map((l) => l.id)).toEqual(["wakad", "baner"]); // null localityId excluded
  });
});

describe("browseHref", () => {
  it("maps params onto the human /search shape", () => {
    expect(browseHref({ type: "apartment" })).toBe("/search?type=apartment");
    expect(browseHref({ bhk: 2 })).toBe("/search?bhk=2");
    expect(browseHref({ intent: "sale", priceMin: 5_000_000, priceMax: 10_000_000 })).toBe(
      "/search?intent=sale&priceMin=5000000&priceMax=10000000",
    );
    expect(browseHref({ locality: "Wakad" })).toBe("/search?locality=Wakad");
    expect(browseHref({})).toBe("/search");
  });

  it("omits an open-ended band's undefined bound", () => {
    const band = BUDGET_BANDS.sale[3]; // 1.5Cr+ (min only)
    expect(browseHref({ intent: "sale", priceMin: band.min, priceMax: band.max })).toBe(
      "/search?intent=sale&priceMin=15000000",
    );
  });
});
