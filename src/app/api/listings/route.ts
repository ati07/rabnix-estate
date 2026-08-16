import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/listings → 201 { listing } (status=draft). Auth: any logged-in user (owner/agent).
// Location comes from the chosen locality's centroid until the map picker lands (Week 3).
const Body = z.object({
  intent: z.enum(["sale", "rent"]),
  propertyType: z.enum(["apartment", "independent_house", "villa", "plot", "commercial", "pg"]),
  price: z.coerce.number().positive(),
  localityId: z.string().min(1).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(20).optional(),
  areaSqft: z.coerce.number().int().positive().optional(),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
  title: z.string().max(140).optional(),
  description: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to post a listing", 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid listing", 400);
  const d = parsed.data;

  try {
    let { lat, lng } = d;
    if ((lat == null || lng == null) && d.localityId) {
      const loc = await prisma.locality.findUnique({ where: { id: d.localityId } });
      lat = lat ?? loc?.lat ?? undefined;
      lng = lng ?? loc?.lng ?? undefined;
    }
    if (lat == null || lng == null) {
      return fail("VALIDATION_ERROR", "Location required — pick a locality", 400, {
        localityId: "required",
      });
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: user.id,
        intent: d.intent,
        propertyType: d.propertyType,
        price: d.price,
        localityId: d.localityId,
        lat,
        lng,
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        areaSqft: d.areaSqft,
        furnishing: d.furnishing,
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
