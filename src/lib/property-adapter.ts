// Adapter layer — the keystone of the v1 frontend port (docs/frontend-port-v1.md §3).
//
// Translates between the Prisma `Listing` model (real backend) and the v1 design's `Property`
// UI type. ALL model⇄UI mismatch lives here: the listingType→intent+propertyType enum split,
// field renames (bhk↔bedrooms, carpetAreaSqFt↔areaSqft), derived fields (priceFormatted,
// pricePerSqFt, isVerified), and safe defaults for fields the schema doesn't store. No UI
// component imports Prisma; no API route imports the `Property` type.

import type {
  Listing,
  ListingMedia,
  Locality,
  City,
  User,
  Furnishing,
  PropertyType,
  ListingIntent,
  ConstructionStatus as PrismaConstructionStatus,
} from "@prisma/client";
import type {
  Property,
  ListingType,
  PropertyCategory,
  FurnishingStatus,
  ConstructionStatus,
  PostedByType,
  PostPropertyFormState,
} from "./types";
import { formatIndianCurrency } from "./formatters";

// A Prisma Listing with the relations the adapter reads. All relations are optional so the
// adapter works whether a query included them or not (search includes primary media + locality;
// detail includes all media + owner).
export type ListingWithRelations = Listing & {
  media?: ListingMedia[];
  locality?: (Locality & { city?: City | null }) | null;
  owner?: Pick<User, "fullName" | "phone" | "role"> | null;
};

// ─── Enum maps: Prisma → UI ────────────────────────────────────────────────
const FURNISHING_TO_UI: Record<Furnishing, FurnishingStatus> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-Furnished",
  furnished: "Furnished",
};

const TYPE_TO_CATEGORY: Record<PropertyType, PropertyCategory> = {
  apartment: "Apartment",
  independent_house: "Builder Floor",
  villa: "Villa",
  plot: "Residential Plot",
  commercial: "Commercial Office",
  pg: "PG / Co-Living",
};

const CONSTRUCTION_TO_UI: Record<PrismaConstructionStatus, ConstructionStatus> = {
  ready_to_move: "Ready to Move",
  under_construction: "Under Construction",
  new_launch: "New Launch",
};

// intent + propertyType collapse into v1's single listingType. propertyType wins for the
// non-residential kinds; otherwise intent decides buy vs rent.
export function toListingType(intent: ListingIntent, propertyType: PropertyType): ListingType {
  if (propertyType === "pg") return "pg";
  if (propertyType === "plot") return "plot";
  if (propertyType === "commercial") return "commercial";
  return intent === "rent" ? "rent" : "buy";
}

// ─── Enum maps: UI → Prisma (reverse, for posting) ─────────────────────────
const UI_TO_FURNISHING: Record<FurnishingStatus, Furnishing> = {
  Unfurnished: "unfurnished",
  "Semi-Furnished": "semi_furnished",
  Furnished: "furnished",
};

const CATEGORY_TO_TYPE: Record<PropertyCategory, PropertyType> = {
  Apartment: "apartment",
  Villa: "villa",
  "Builder Floor": "independent_house",
  Penthouse: "apartment",
  Studio: "apartment",
  "Commercial Office": "commercial",
  "Retail Shop": "commercial",
  "Residential Plot": "plot",
  "PG / Co-Living": "pg",
};

const UI_TO_CONSTRUCTION: Record<ConstructionStatus, PrismaConstructionStatus> = {
  "Ready to Move": "ready_to_move",
  "Under Construction": "under_construction",
  "New Launch": "new_launch",
};

export function toIntent(listingType: ListingType): ListingIntent {
  return listingType === "rent" || listingType === "pg" ? "rent" : "sale";
}

// listingType is authoritative for the non-residential kinds; otherwise the chosen category
// determines the stored propertyType.
export function toPropertyType(listingType: ListingType, category: PropertyCategory): PropertyType {
  if (listingType === "pg") return "pg";
  if (listingType === "plot") return "plot";
  if (listingType === "commercial") return "commercial";
  return CATEGORY_TO_TYPE[category] ?? "apartment";
}

function postedByType(role: User["role"] | undefined): PostedByType {
  if (role === "agent") return "Verified Agent";
  return "Owner";
}

/**
 * Prisma `Listing` (+relations) → v1 `Property`. Fields the schema doesn't store are derived
 * where possible (priceFormatted, pricePerSqFt, isVerified, reraApproved, isExclusiveOwner) and
 * defaulted/omitted otherwise (subLocality, nearbyLandmarks, floorPlanImage, maintenance, …).
 */
export function listingToProperty(listing: ListingWithRelations): Property {
  const price = Number(listing.price);
  const areaSqft = listing.areaSqft ?? undefined;
  const intent = listing.intent;
  const listingType = toListingType(intent, listing.propertyType);
  const isRentLike = intent === "rent";

  const media = (listing.media ?? [])
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.ord - b.ord);
  const images = media.map((m) => m.url);

  const priceFormatted = isRentLike
    ? `${formatIndianCurrency(price)} / mo`
    : formatIndianCurrency(price);

  return {
    id: listing.id,
    title: listing.title ?? "Property listing",
    listingType,
    category: TYPE_TO_CATEGORY[listing.propertyType],
    city: listing.locality?.city?.name ?? "",
    locality: listing.locality?.name ?? "",
    price,
    priceFormatted,
    pricePerSqFt: areaSqft ? Math.round(price / areaSqft) : undefined,
    bhk: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? 0,
    carpetAreaSqFt: areaSqft ?? 0,
    furnishing: listing.furnishing ? FURNISHING_TO_UI[listing.furnishing] : "Unfurnished",
    floor: listing.floor ?? undefined,
    constructionStatus: listing.constructionStatus
      ? CONSTRUCTION_TO_UI[listing.constructionStatus]
      : "Ready to Move",
    reraId: listing.reraId ?? undefined,
    reraApproved: !!listing.reraId,
    // "Verified on site" = an admin approved it and it's live. qualityScore is a secondary signal.
    isVerified: listing.status === "live" && listing.moderatedAt != null,
    isFeatured: listing.isFeatured,
    isExclusiveOwner: listing.owner?.role === "owner",
    images,
    description: listing.description ?? "",
    amenities: listing.amenities ?? [],
    postedBy: {
      name: listing.owner?.fullName ?? "Owner",
      type: postedByType(listing.owner?.role),
      phone: listing.owner?.phone ?? "",
    },
    coordinates: { lat: listing.lat, lng: listing.lng },
    createdAt: listing.createdAt.toISOString(),
  };
}

// The subset of `Listing` create fields derivable from the v1 post form. Location (localityId,
// lat, lng) and ownership are resolved by the POST /api/listings route from form.city/locality
// + session, so they're intentionally absent here. See docs/frontend-port-v1.md §5 Phase 3.
export interface ListingCreateInput {
  intent: ListingIntent;
  propertyType: PropertyType;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  furnishing?: Furnishing;
  floor?: number;
  title?: string;
  description?: string;
  amenities: string[];
  reraId?: string;
  constructionStatus?: PrismaConstructionStatus;
}

/** v1 post-property form → Prisma `Listing` create fields (enum split + renames reversed). */
export function formToListingInput(form: PostPropertyFormState): ListingCreateInput {
  return {
    intent: toIntent(form.listingType),
    propertyType: toPropertyType(form.listingType, form.category),
    price: form.price,
    bedrooms: form.bhk || undefined,
    bathrooms: form.bathrooms || undefined,
    areaSqft: form.carpetAreaSqFt || undefined,
    furnishing: form.furnishing ? UI_TO_FURNISHING[form.furnishing] : undefined,
    floor: form.floor || undefined,
    title: form.title || undefined,
    description: form.description || undefined,
    amenities: form.amenities ?? [],
    reraId: form.reraId?.trim() || undefined,
    constructionStatus: form.constructionStatus
      ? UI_TO_CONSTRUCTION[form.constructionStatus]
      : undefined,
  };
}
