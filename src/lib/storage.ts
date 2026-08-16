import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Object storage — the single swap-point for media persistence.
//
// Dev/default implementation writes to `public/uploads/<key>` and serves the file statically
// from the app origin (`/uploads/<key>`). Production swaps this for an object store / CDN
// (S3, R2, Cloudinary) by re-implementing `putObject` — nothing else in the app changes, since
// callers only ever see the returned public URL.

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

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
  return `/uploads/${key}`;
}
