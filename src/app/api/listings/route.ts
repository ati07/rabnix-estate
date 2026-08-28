import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/listings → 201 { listing } (status=draft). Auth: any logged-in user (owner/agent).
// Location comes from an explicit `localityId` (the /post select) OR free-text `city` + `locality`
// names (the v1 post-property modal), which are find-or-created and resolved to a centroid until
// the map picker lands (Week 3). See docs/frontend-port-v1.md §5 Phase 3.
const Body = z.object({
  intent: z.enum(["sale", "rent"]),
  propertyType: z.enum(["apartment", "independent_house", "villa", "plot", "commercial", "pg"]),
  price: z.coerce.number().positive(),
  localityId: z.string().min(1).optional(),
  city: z.string().min(1).max(80).optional(),
  locality: z.string().min(1).max(120).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(20).optional(),
  areaSqft: z.coerce.number().int().positive().optional(),
  floor: z.coerce.number().int().min(-5).max(200).optional(),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
  amenities: z.array(z.string().max(120)).max(40).optional(),
  reraId: z.string().max(80).optional(),
  constructionStatus: z.enum(["ready_to_move", "under_construction", "new_launch"]).optional(),
  title: z.string().max(140).optional(),
  description: z.string().max(5000).optional(),
});

// Fallback centroid (Pune) for listings whose city/locality has no coordinates yet — lat/lng are
// NOT NULL on Listing. Replaced by the real map picker (Week 3).
const DEFAULT_LAT = 18.5204;
const DEFAULT_LNG = 73.8567;

// Find-or-create a Locality (and its City) from free-text names typed in the v1 modal, so the
// design's open locality field maps onto the real geo tables without a fixed dropdown.
async function resolveLocalityByName(cityName: string, localityName: string) {
  let city = await prisma.city.findFirst({
    where: { name: { equals: cityName, mode: "insensitive" } },
  });
  city ??= await prisma.city.create({ data: { name: cityName } });

  let locality = await prisma.locality.findFirst({
    where: { cityId: city.id, name: { equals: localityName, mode: "insensitive" } },
  });
  locality ??= await prisma.locality.create({
    data: { cityId: city.id, name: localityName, lat: city.lat, lng: city.lng },
  });

  return {
    localityId: locality.id,
    lat: locality.lat ?? city.lat ?? undefined,
    lng: locality.lng ?? city.lng ?? undefined,
  };
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to post a listing", 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid listing", 400);
  const d = parsed.data;

  try {
    let { lat, lng } = d;
    let localityId = d.localityId;

    if (localityId) {
      const loc = await prisma.locality.findUnique({ where: { id: localityId } });
      lat = lat ?? loc?.lat ?? undefined;
      lng = lng ?? loc?.lng ?? undefined;
    } else if (d.city && d.locality) {
      const resolved = await resolveLocalityByName(d.city, d.locality);
      localityId = resolved.localityId;
      lat = lat ?? resolved.lat;
      lng = lng ?? resolved.lng;
    }

    if (!localityId) {
      return fail("VALIDATION_ERROR", "Location required — pick a locality", 400, {
        localityId: "required",
      });
    }
    // A fresh city/locality may still lack coordinates — fall back to the city centroid so the
    // NOT-NULL lat/lng constraint holds until the map picker lands.
    lat ??= DEFAULT_LAT;
    lng ??= DEFAULT_LNG;

    const listing = await prisma.listing.create({
      data: {
        ownerId: user.id,
        intent: d.intent,
        propertyType: d.propertyType,
        price: d.price,
        localityId,
        lat,
        lng,
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        areaSqft: d.areaSqft,
        floor: d.floor,
        furnishing: d.furnishing,
        amenities: d.amenities ?? [],
        reraId: d.reraId,
        constructionStatus: d.constructionStatus,
        title: d.title,
        description: d.description,
        status: "draft",
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    });
    return ok({ listing }, 201);
  } catch {
    return fail("CREATE_FAILED", "Could not create listing (is the database configured?)", 503);
  }
}
