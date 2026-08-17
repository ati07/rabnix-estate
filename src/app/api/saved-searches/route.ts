import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SavedQuery, savedSearchLabel } from "@/modules/search/savedSearch";
import { trackEvent } from "@/lib/observability";

// POST /api/saved-searches { query, label? } → 200 { id } | 401 | 400
// Stores the current /search filters so the buyer can re-run them and get new-match counts.
const Body = z.object({
  query: SavedQuery,
  label: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to save a search", 401);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid search to save", 400);

  const { query } = parsed.data;
  const label = parsed.data.label?.trim() || savedSearchLabel(query);

  const saved = await prisma.savedSearch.create({
    data: { userId: user.id, label, query },
    select: { id: true },
  });

  trackEvent("saved_search_created", { userId: user.id, savedSearchId: saved.id });
  return ok({ id: saved.id });
}
