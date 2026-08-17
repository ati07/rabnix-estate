import Link from "next/link";
import { Thumb } from "./Thumb";

// Rich, MagicBricks-style property card: gradient thumb + badge, bold price, spec line, locality,
// and a CTA footer. Used inside carousels for both real listings and demo project cards.
export function PropertyCard({
  href,
  price,
  priceSuffix,
  title,
  specs,
  locality,
  badge,
  seed,
  icon,
  imageUrl,
  blurDataUrl,
  cta = "View details",
}: {
  href: string;
  price: string;
  priceSuffix?: string;
  title: string;
  specs: string;
  locality: string;
  badge?: string;
  seed: string;
  icon: string;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
  cta?: string;
}) {
  return (
    <Link className="pcard" href={href}>
      <Thumb seed={seed} icon={icon} badge={badge} imageUrl={imageUrl} blurDataUrl={blurDataUrl} />
      <div className="pcard-body">
        <div className="pcard-price">
          {price}
          {priceSuffix && <span className="pcard-price-suffix"> {priceSuffix}</span>}
        </div>
        <div className="pcard-title" title={title}>{title}</div>
        <div className="pcard-specs">{specs}</div>
        <div className="pcard-loc">📍 {locality}</div>
        <div className="pcard-foot">
          <span className="pcard-cta">{cta} →</span>
        </div>
      </div>
    </Link>
  );
}
