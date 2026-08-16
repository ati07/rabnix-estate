import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { matchLocalities } from "@/modules/search/localityMatch";

// GET /api/localities/search?q=wak → { localities: [{ id, name }] }
// Powers the typo-tolerant locality autocomplete. Loads the (small) locality set and ranks in JS.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 1) return ok({ localities: [] });

  try {
    const all = await prisma.locality.findMany({ select: { id: true, name: true, aliases: true } });
    const localities = matchLocalities(all, q).map(({ id, name }) => ({ id, name }));
    return ok({ localities });
  } catch {
    return fail("DB_UNAVAILABLE", "Locality lookup unavailable", 503);
  }
}
