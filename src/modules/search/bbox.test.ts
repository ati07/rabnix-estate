import { describe, it, expect } from "vitest";
import { parseBbox } from "./bbox";

describe("parseBbox", () => {
  it("parses a valid west,south,east,north box", () => {
    expect(parseBbox("73.7,18.5,73.9,18.6")).toEqual({
      minLng: 73.7,
      minLat: 18.5,
      maxLng: 73.9,
      maxLat: 18.6,
    });
  });

  it("returns null for undefined / wrong arity", () => {
    expect(parseBbox(undefined)).toBeNull();
    expect(parseBbox("1,2,3")).toBeNull();
    expect(parseBbox("1,2,3,4,5")).toBeNull();
  });

  it("returns null for non-numeric parts", () => {
    expect(parseBbox("a,2,3,4")).toBeNull();
  });

  it("rejects inverted boxes", () => {
    expect(parseBbox("74,18.6,73,18.5")).toBeNull(); // min > max
  });

  it("rejects out-of-range coordinates", () => {
    expect(parseBbox("73,18,73.9,200")).toBeNull(); // lat > 90
    expect(parseBbox("-200,18,73.9,19")).toBeNull(); // lng < -180
  });
});
