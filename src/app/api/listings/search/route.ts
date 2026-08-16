import { ok, fail } from "@/lib/http";
import { SearchParams, searchListings } from "@/modules/search/searchListings";

// GET /api/listings/search?intent=rent&localityId=...&bhk=2&sort=relevance&cursor=
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = SearchParams.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid search params", 400);
  }

  try {
    const data = await searchListings(parsed.data);
    return ok(data);
  } catch {
    // Most commonly a missing/unreachable DATABASE_URL during initial setup.
    return fail("SEARCH_UNAVAILABLE", "Search backend unavailable (is the database configured?)", 503);
  }
}
