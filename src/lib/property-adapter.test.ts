import { describe, it, expect } from "vitest";
import {
  listingToProperty,
  formToListingInput,
  toListingType,
  toIntent,
  toPropertyType,
  type ListingWithRelations,
} from "./property-adapter";
import type { PostPropertyFormState } from "./types";

// Minimal Listing factory — only the fields the adapter reads. Built untyped and cast once
// (price/qualityScore are Decimal at runtime; Number() handles the plain-number stand-ins).
function makeListing(over: Record<string, unknown> = {}): ListingWithRelations {
  return {
    id: "l1",
    ownerId: "u1",
    intent: "sale",
    propertyType: "apartment",
    status: "live",
    title: "2 BHK in Kothrud",
    description: "Bright east-facing flat",
    price: 9500000,
    areaSqft: 950,
    bedrooms: 2,
    bathrooms: 2,
    floor: 4,
    furnishing: "semi_furnished",
    amenities: ["Lift", "Parking"],
    reraId: null,
    constructionStatus: null,
    isFeatured: false,
    localityId: "loc1",
    lat: 18.5,
    lng: 73.8,
    qualityScore: 70,
    moderationReason: null,
    moderatedAt: new Date("2026-08-20T00:00:00Z"),
    moderatedById: "admin1",
    createdAt: new Date("2026-08-18T00:00:00Z"),
    updatedAt: new Date("2026-08-18T00:00:00Z"),
    expiresAt: new Date("2026-10-02T00:00:00Z"),
    media: [
      { url: "https://cdn/x/2.jpg", ord: 1, isPrimary: false },
      { url: "https://cdn/x/1.jpg", ord: 0, isPrimary: true },
    ],
    locality: { id: "loc1", name: "Kothrud", city: { name: "Pune" } },
    owner: { fullName: "Asha", phone: "+919999999999", role: "owner" },
    ...over,
  } as unknown as ListingWithRelations;
}

describe("toListingType (intent + propertyType → v1 listingType)", () => {
  it("maps residential sale/rent by intent", () => {
    expect(toListingType("sale", "apartment")).toBe("buy");
    expect(toListingType("rent", "villa")).toBe("rent");
  });
  it("lets non-residential propertyType win over intent", () => {
    expect(toListingType("rent", "pg")).toBe("pg");
    expect(toListingType("sale", "plot")).toBe("plot");
    expect(toListingType("sale", "commercial")).toBe("commercial");
  });
});

describe("listingToProperty", () => {
  it("renames + derives core fields", () => {
    const p = listingToProperty(makeListing());
    expect(p.bhk).toBe(2); // bedrooms → bhk
    expect(p.carpetAreaSqFt).toBe(950); // areaSqft → carpetAreaSqFt
    expect(p.pricePerSqFt).toBe(10000); // 9,500,000 / 950
    expect(p.priceFormatted).toBe("₹95 Lac");
    expect(p.category).toBe("Apartment");
    expect(p.listingType).toBe("buy");
    expect(p.furnishing).toBe("Semi-Furnished");
    expect(p.city).toBe("Pune");
    expect(p.locality).toBe("Kothrud");
  });

  it("orders images primary-first then by ord", () => {
    const p = listingToProperty(makeListing());
    expect(p.images).toEqual(["https://cdn/x/1.jpg", "https://cdn/x/2.jpg"]);
  });

  it("formats rent as a monthly figure", () => {
    const p = listingToProperty(makeListing({ intent: "rent", price: 45000 }));
    expect(p.priceFormatted).toBe("₹45,000 / mo");
    expect(p.listingType).toBe("rent");
  });

  it("derives reraApproved / isExclusiveOwner / isVerified", () => {
    const p = listingToProperty(makeListing({ reraId: "PRM/KA/RERA/1/1", owner: { fullName: "B", phone: "1", role: "agent" } }));
    expect(p.reraApproved).toBe(true);
    expect(p.isExclusiveOwner).toBe(false); // agent, not owner
    expect(p.postedBy.type).toBe("Verified Agent");
    expect(p.isVerified).toBe(true); // live + moderatedAt
  });

  it("is not verified when unmoderated or not live", () => {
    expect(listingToProperty(makeListing({ moderatedAt: null })).isVerified).toBe(false);
    expect(listingToProperty(makeListing({ status: "pending" })).isVerified).toBe(false);
  });

  it("falls back safely when relations/fields are absent", () => {
    const p = listingToProperty(
      makeListing({ media: undefined, locality: null, owner: null, title: null, bedrooms: null, areaSqft: null, furnishing: null }),
    );
    expect(p.images).toEqual([]);
    expect(p.city).toBe("");
    expect(p.carpetAreaSqFt).toBe(0);
    expect(p.pricePerSqFt).toBeUndefined();
    expect(p.furnishing).toBe("Unfurnished");
    expect(p.postedBy.name).toBe("Owner");
    expect(p.constructionStatus).toBe("Ready to Move");
  });

  it("maps constructionStatus enum when present", () => {
    const p = listingToProperty(makeListing({ constructionStatus: "under_construction" }));
    expect(p.constructionStatus).toBe("Under Construction");
  });
});

describe("formToListingInput (reverse enum split + renames)", () => {
  const baseForm: PostPropertyFormState = {
    listingType: "buy",
    category: "Villa",
    city: "Pune",
    locality: "Baner",
    title: "Lake-view villa",
    bhk: 4,
    bathrooms: 4,
    carpetAreaSqFt: 3200,
    superBuiltUpAreaSqFt: 4000,
    price: 42000000,
    maintenance: 8000,
    furnishing: "Furnished",
    floor: 0,
    totalFloors: 3,
    facing: "East",
    constructionStatus: "Ready to Move",
    possessionDate: "",
    reraId: "  PRM/KA/RERA/2/2 ",
    amenities: ["Pool"],
    description: "Spacious",
    ownerName: "C",
    ownerPhone: "1",
    ownerEmail: "c@x.com",
    imageUrls: [],
  };

  it("splits listingType/category into intent + propertyType and renames fields", () => {
    const input = formToListingInput(baseForm);
    expect(input.intent).toBe("sale");
    expect(input.propertyType).toBe("villa");
    expect(input.bedrooms).toBe(4); // bhk → bedrooms
    expect(input.areaSqft).toBe(3200); // carpetAreaSqFt → areaSqft
    expect(input.furnishing).toBe("furnished");
    expect(input.constructionStatus).toBe("ready_to_move");
    expect(input.reraId).toBe("PRM/KA/RERA/2/2"); // trimmed
    expect(input.amenities).toEqual(["Pool"]);
  });

  it("non-residential listingType overrides category for propertyType", () => {
    expect(formToListingInput({ ...baseForm, listingType: "pg", category: "Apartment" }).propertyType).toBe("pg");
    expect(formToListingInput({ ...baseForm, listingType: "commercial", category: "Apartment" }).propertyType).toBe("commercial");
    expect(toPropertyType("plot", "Apartment")).toBe("plot");
  });

  it("maps intent by listingType", () => {
    expect(toIntent("rent")).toBe("rent");
    expect(toIntent("pg")).toBe("rent");
    expect(toIntent("buy")).toBe("sale");
  });

  it("drops empty optionals rather than sending blanks", () => {
    const input = formToListingInput({ ...baseForm, floor: 0, reraId: "   ", bhk: 0 });
    expect(input.floor).toBeUndefined();
    expect(input.reraId).toBeUndefined();
    expect(input.bedrooms).toBeUndefined();
  });
});
