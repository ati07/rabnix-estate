// Typo-tolerant locality matching for autocomplete. Pure + in-memory: the locality set for one
// city is tiny (dozens), so we rank in JS rather than reaching for pg_trgm. Swap in a pg_trgm
// similarity query (docs/build-plan-phase1.md Week 3) if the set ever grows large.

export type LocalityLike = { id: string; name: string; aliases: string[] };

/** Classic Levenshtein edit distance (fine for short locality names). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Rank localities against a query, name or alias. Lower score = better:
 *  0  prefix match · 1  substring · 2–3  fuzzy (edit distance ≤2 on the leading chars).
 * Non-matches are dropped. Ties break alphabetically. Returns at most `limit`.
 */
export function matchLocalities<T extends LocalityLike>(
  localities: readonly T[],
  query: string,
  limit = 8,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { loc: T; score: number }[] = [];
  for (const loc of localities) {
    let best = Infinity;
    for (const name of [loc.name, ...loc.aliases]) {
      const n = name.toLowerCase();
      if (n.startsWith(q)) best = Math.min(best, 0);
      else if (n.includes(q)) best = Math.min(best, 1);
      else {
        const d = levenshtein(n.slice(0, q.length), q);
        if (d <= 2) best = Math.min(best, 1 + d);
      }
    }
    if (best !== Infinity) scored.push({ loc, score: best });
  }

  scored.sort((a, b) => a.score - b.score || a.loc.name.localeCompare(b.loc.name));
  return scored.slice(0, limit).map((s) => s.loc);
}
