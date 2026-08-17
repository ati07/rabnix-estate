import { SearchParams, searchListings } from "@/modules/search/searchListings";
import { formatPriceShort } from "@/modules/search/format";
import { PROPERTY_TYPE_ICON } from "@/modules/demo/dummy";
import { Rail } from "./Rail";
import { PropertyCard } from "./PropertyCard";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

function humanize(v: string): string {
  return v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// A carousel of REAL live listings (rendered as rich PropertyCards). Hidden when nothing matches.
export async function ListingRail({
  title,
  subtitle,
  sort,
  badge,
}: {
  title: string;
  subtitle?: string;
  sort: "newest" | "relevance";
  badge?: string;
}) {
  let results: Awaited<ReturnType<typeof searchListings>>["results"] = [];
  try {
    const page = await searchListings({ ...SearchParams.parse({}), sort, limit: 10 });
    results = page.results;
  } catch {
    return null;
  }
  if (results.length === 0) return null;

  return (
    <Rail title={title} subtitle={subtitle} seeAllHref="/search">
      {results.map((l) => {
        const bhk = l.bedrooms != null ? `${l.bedrooms} BHK` : humanize(l.propertyType);
        const specs = [
          l.bedrooms != null ? `${l.bedrooms} BHK` : null,
          humanize(l.propertyType),
          l.areaSqft != null ? `${l.areaSqft} sqft` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <PropertyCard
            key={l.id}
            href={`/listings/${l.id}`}
            price={`${CURRENCY} ${formatPriceShort(Number(l.price))}`}
            priceSuffix={l.intent === "rent" ? "/mo" : undefined}
            title={l.title ?? `${bhk} ${humanize(l.propertyType)}`}
            specs={specs}
            locality={l.locality?.name ?? "—"}
            badge={badge}
            seed={l.id}
            icon={PROPERTY_TYPE_ICON[l.propertyType] ?? "🏠"}
          />
        );
      })}
    </Rail>
  );
}
