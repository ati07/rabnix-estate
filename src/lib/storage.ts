import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Object storage — the single swap-point for media persistence.
//
// Dev/default implementation writes to `public/uploads/<key>` and serves the file statically
// from the app origin (`/uploads/<key>`). Two production paths, no caller changes:
//   1. CDN-in-front-of-origin (cheapest): keep local/volume writes but set `MEDIA_CDN_BASE_URL`
//      to a CDN (CloudFront/Cloudflare) that fronts `/uploads/*`. Served URLs become absolute
//      CDN URLs — see `publicUrl`.
//   2. Object store: re-implement `putObject` for S3/R2/Cloudinary. Callers only ever see the
//      returned public URL, so nothing else in the app changes.

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

// Optional CDN origin that fronts the uploads path. Trailing slashes trimmed so we control joins.
const CDN_BASE = (process.env.MEDIA_CDN_BASE_URL ?? "").replace(/\/+$/, "");

/** Public URL for a stored key — absolute (CDN) when configured, else an origin-relative path. */
export function publicUrl(key: string): string {
  return CDN_BASE ? `${CDN_BASE}/uploads/${key}` : `/uploads/${key}`;
}

/**
 * Persist `body` under `key` and return its public URL.
 * `key` is a POSIX-style path, e.g. `listings/<listingId>/<uuid>.webp`.
 */
export async function putObject(
  key: string,
  body: Buffer,
  _contentType: string,
): Promise<string> {
  const dest = path.join(UPLOAD_ROOT, ...key.split("/"));
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, body);
  return publicUrl(key);
}
