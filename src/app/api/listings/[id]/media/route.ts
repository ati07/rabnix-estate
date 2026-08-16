import { randomUUID } from "node:crypto";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { putObject } from "@/lib/storage";
import {
  processImage,
  isAllowedMime,
  isDuplicate,
  MEDIA_MAX_BYTES,
  MAX_IMAGES_PER_LISTING,
} from "@/modules/listings/media";

// POST /api/listings/:id/media  (multipart/form-data, field `files`) → 201 { media }
// Owner-only. Processes each image (EXIF strip → WebP → blur + pHash), stores it, and appends
// a ListingMedia row. Rejects images that duplicate one already on the listing (pHash).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to upload photos", 401);

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { media: { orderBy: { ord: "asc" } } },
  });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.ownerId !== user.id) return fail("FORBIDDEN", "Not your listing", 403);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Expected multipart/form-data", 400);
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return fail("VALIDATION_ERROR", "No files provided", 400);

  if (listing.media.length + files.length > MAX_IMAGES_PER_LISTING) {
    return fail(
      "TOO_MANY_IMAGES",
      `A listing can have at most ${MAX_IMAGES_PER_LISTING} photos`,
      400,
    );
  }

  // Existing hashes + hashes accepted within this same request, to dedupe across the batch too.
  const seenHashes: (string | null)[] = listing.media.map((m) => m.phash);
  let ord = listing.media.length;
  const created = [];

  for (const file of files) {
    if (!isAllowedMime(file.type)) {
      return fail("UNSUPPORTED_TYPE", `Unsupported image type: ${file.type || "unknown"}`, 400);
    }
    if (file.size > MEDIA_MAX_BYTES) {
      return fail("FILE_TOO_LARGE", `Each image must be under ${MEDIA_MAX_BYTES / 1024 / 1024} MB`, 400);
    }

    const input = Buffer.from(await file.arrayBuffer());

    let img;
    try {
      img = await processImage(input);
    } catch {
      return fail("INVALID_IMAGE", "Could not process one of the images", 400);
    }

    if (isDuplicate(img.phash, seenHashes)) {
      return fail("DUPLICATE_IMAGE", "That photo is already on this listing", 409);
    }
    seenHashes.push(img.phash);

    const url = await putObject(`listings/${id}/${randomUUID()}.webp`, img.webp, "image/webp");

    const media = await prisma.listingMedia.create({
      data: {
        listingId: id,
        url,
        phash: img.phash,
        blurDataUrl: img.blurDataUrl,
        width: img.width,
        height: img.height,
        ord,
        isPrimary: ord === 0,
      },
    });
    created.push(media);
    ord += 1;
  }

  return ok({ media: created }, 201);
}
