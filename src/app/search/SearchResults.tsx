"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "../listings/[id]/FavoriteButton";

export type SearchResult = {
  id: string;
  title: string | null;
  price: string;
  intent: "sale" | "rent";
  bedrooms: number | null;
  areaSqft: number | null;
  lat: number;
  lng: number;
  localityName: string | null;
  mediaUrl: string | null;
  blurDataUrl: string | null;
};

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Map is client-only (Leaflet touches window); load it lazily so it never runs during SSR.
const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => <div className="results-map-loading">Loading map…</div>,
});

type ApiListing = {
  id: string;
  title: string | null;
  price: string;
  intent: "sale" | "rent";
  bedrooms: number | null;
  areaSqft: number | null;
  lat: number;
  lng: number;
  locality?: { name: string | null } | null;
  media?: { url: string; blurDataUrl: string | null }[];
};

function fromApi(l: ApiListing): SearchResult {
  return {
    id: l.id,
    title: l.title,
    price: String(l.price),
    intent: l.intent,
    bedrooms: l.bedrooms,
    areaSqft: l.areaSqft,
    lat: l.lat,
    lng: l.lng,
    localityName: l.locality?.name ?? null,
    mediaUrl: l.media?.[0]?.url ?? null,
    blurDataUrl: l.media?.[0]?.blurDataUrl ?? null,
  };
}

export function SearchResults({
  initialResults,
  initialCursor,
  apiQuery,
  savedIds,
  isAuthed,
  fallbackCenter,
}: {
  initialResults: SearchResult[];
  initialCursor: string | null;
  apiQuery: Record<string, string>;
  savedIds: string[];
  isAuthed: boolean;
  fallbackCenter: [number, number];
}) {
  const [results, setResults] = useState(initialResults);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const saved = useRef(new Set(savedIds));
  const cardRefs = useRef(new Map<string, HTMLLIElement>());

  const onSelectFromMap = useCallback((id: string) => {
    setActiveId(id);
    cardRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  // "Search this area" — re-query within the current map bounds, replacing the list. The map stays
  // put (FitBounds only fires once), so pins refresh under a fixed viewport.
  const onSearchArea = useCallback(
    async (bbox: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ...apiQuery, bbox });
        const res = await fetch(`/api/listings/search?${params.toString()}`);
        if (res.ok) {
          const body = await res.json();
          setResults((body.results as ApiListing[]).map(fromApi));
          setCursor(body.nextCursor ?? null);
        }
      } finally {
        setLoading(false);
      }
    },
    [apiQuery],
  );

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...apiQuery, cursor });
      const res = await fetch(`/api/listings/search?${params.toString()}`);
      if (res.ok) {
        const body = await res.json();
        setResults((prev) => [...prev, ...(body.results as ApiListing[]).map(fromApi)]);
        setCursor(body.nextCursor ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="results-layout">
      <ul className="results-list">
        {results.map((r) => (
          <li
            key={r.id}
            ref={(el) => {
              if (el) cardRefs.current.set(r.id, el);
              else cardRefs.current.delete(r.id);
            }}
            className={`card result-card${r.id === activeId ? " active" : ""}`}
            onMouseEnter={() => setActiveId(r.id)}
          >
            <Link href={`/listings/${r.id}`} className="result-link">
              <Image
                className="card-thumb"
                src={r.mediaUrl || "/dummy-property.jpg"}
                alt={r.title ?? "Listing photo"}
                width={400}
                height={300}
                sizes="(max-width: 700px) 100vw, 350px"
                placeholder={r.blurDataUrl ? "blur" : "empty"}
                blurDataURL={r.blurDataUrl ?? undefined}
              />
              <h3>{r.title ?? `${r.bedrooms ?? ""} BHK`}</h3>
              <div className="price">
                {currency} {r.price}
                {r.intent === "rent" ? " / mo" : ""}
              </div>
              <div className="meta">
                {r.localityName ?? "—"} · {r.areaSqft ?? "—"} sqft · {r.bedrooms ?? "—"} BHK
              </div>
            </Link>
            <div className="result-actions">
              <FavoriteButton listingId={r.id} initialSaved={saved.current.has(r.id)} isAuthed={isAuthed} />
            </div>
          </li>
        ))}

        {cursor && (
          <li className="results-more">
            <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </button>
          </li>
        )}
      </ul>

      <div className="results-map">
        <ResultsMap
          results={results}
          activeId={activeId}
          onSelect={onSelectFromMap}
          onSearchArea={onSearchArea}
          fallbackCenter={fallbackCenter}
        />
      </div>
    </div>
  );
}
