import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";

// Minimal create-listing handler (draft). Auth (owner) + media upload + moderation
// submit are TODO — see docs/build-plan-phase1.md Week 2.
const Body = z.object({
  ownerId: z.string().uuid(),
  intent: z.enum(["sale", "rent"]),
  propertyType: z.enum(["apartment", "independent_house", "villa", "plot", "commercial", "pg"]),
  price: z.number().positive(),
  lat: z.number(),
  lng: z.number(),
  localityId: z.string().min(1).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  areaSqft: z.number().int().positive().optional(),
  title: z.string().max(140).optional(),
  description: z.string().max(5000).optional(),
});

// POST /api/listings → 201 { listing } (status=draft)
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid listing", 400);

  const d = parsed.data;
  const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // structural freshness

  try {
    const listing = await prisma.listing.create({
      data: { ...d, status: "draft", expiresAt },
    });
    return ok({ listing }, 201);
  } catch {
    return fail("CREATE_FAILED", "Could not create listing (is the database configured?)", 503);
  }
}
