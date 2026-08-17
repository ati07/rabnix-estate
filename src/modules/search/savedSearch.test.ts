import { describe, it, expect } from "vitest";
import { SavedQuery, savedSearchLabel, savedSearchHref } from "./savedSearch";

describe("SavedQuery", () => {
  it("keeps known keys and strips unknown ones", () => {
    const q = SavedQuery.parse({ intent: "rent", bhk: "2", cursor: "x", limit: "12", localityId: "abc" });
    expect(q).toEqual({ intent: "rent", bhk: "2" });
  });
  it("rejects an invalid intent", () => {
    expect(SavedQuery.safeParse({ intent: "lease" }).success).toBe(false);
  });
});

describe("savedSearchLabel", () => {
  it("summarizes a full query", () => {
    expect(savedSearchLabel({ bhk: "2", type: "apartment", intent: "rent", locality: "Wakad" })).toBe(
      "2 BHK apartment for rent in Wakad",
    );
  });
  it("falls back to a generic label", () => {
    expect(savedSearchLabel({})).toBe("homes");
  });
  it("appends a price range", () => {
    expect(savedSearchLabel({ intent: "sale", priceMin: "50", priceMax: "100" })).toBe("for sale (50–100)");
  });
});

describe("savedSearchHref", () => {
  it("rebuilds a /search link, skipping empties", () => {
    expect(savedSearchHref({ intent: "rent", bhk: "2", locality: "" })).toBe("/search?intent=rent&bhk=2");
  });
  it("is bare /search with no params", () => {
    expect(savedSearchHref({})).toBe("/search");
  });
});
