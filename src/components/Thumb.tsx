import Image from "next/image";

// Property thumbnail. Shows the real primary photo when a listing has one; otherwise falls back to
// a shared dummy photo (public/dummy-property.jpg) with the property-type icon overlaid, so cards
// without an uploaded image still look like listings instead of blank boxes.
export function Thumb({
  icon,
  badge,
  tall = false,
  imageUrl,
  blurDataUrl,
}: {
  seed: string; // kept for call-site compatibility (was the gradient seed)
  icon: string;
  badge?: string;
  tall?: boolean;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
}) {
  const hasPhoto = !!imageUrl;
  const src = imageUrl || "/dummy-property.jpg";
  return (
    <div className={`thumb${tall ? " thumb-tall" : ""}`}>
      <Image
        className="thumb-img"
        src={src}
        alt=""
        fill
        sizes="(max-width: 700px) 100vw, 320px"
        placeholder={blurDataUrl ? "blur" : "empty"}
        blurDataURL={blurDataUrl ?? undefined}
      />
      {badge && <span className="thumb-badge">{badge}</span>}
      {!hasPhoto && <span className="thumb-icon">{icon}</span>}
    </div>
  );
}
