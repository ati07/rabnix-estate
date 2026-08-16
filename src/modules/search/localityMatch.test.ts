import { describe, it, expect } from "vitest";
import { levenshtein, matchLocalities, type LocalityLike } from "./localityMatch";

const LOCALITIES: LocalityLike[] = [
  { id: "wakad", name: "Wakad", aliases: ["Wakhad"] },
  { id: "baner", name: "Baner", aliases: ["Baaner", "Banner"] },
  { id: "hinjewadi", name: "Hinjewadi", aliases: ["Hinjawadi"] },
  { id: "kharadi", name: "Kharadi", aliases: [] },
];

describe("levenshtein", () => {
  it("is 0 for identical strings", () => expect(levenshtein("baner", "baner")).toBe(0));
  it("counts single edits", () => {
    expect(levenshtein("baner", "baner")).toBe(0);
    expect(levenshtein("banr", "baner")).toBe(1); // insertion
    expect(levenshtein("bamer", "baner")).toBe(1); // substitution
  });
  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });
});

describe("matchLocalities", () => {
  it("returns nothing for a blank query", () => {
    expect(matchLocalities(LOCALITIES, "   ")).toEqual([]);
  });

  it("prefix-matches case-insensitively", () => {
    const res = matchLocalities(LOCALITIES, "wak");
    expect(res[0].id).toBe("wakad");
  });

  it("matches on an alias", () => {
    const res = matchLocalities(LOCALITIES, "hinjawadi");
    expect(res.map((l) => l.id)).toContain("hinjewadi");
  });

  it("tolerates a typo (edit distance ≤2)", () => {
    // "banr" is one deletion from "baner"
    const res = matchLocalities(LOCALITIES, "banr");
    expect(res.map((l) => l.id)).toContain("baner");
  });

  it("drops clear non-matches", () => {
    expect(matchLocalities(LOCALITIES, "zzzz")).toEqual([]);
  });

  it("ranks prefix above fuzzy and respects the limit", () => {
    const res = matchLocalities(LOCALITIES, "bane", 2);
    expect(res.length).toBeLessThanOrEqual(2);
    expect(res[0].id).toBe("baner"); // exact prefix wins
  });
});
