"use client";

import { useState } from "react";
import Image from "next/image";
import { thumbGradient } from "@/modules/demo/dummy";

export type GalleryPhoto = { id: string; url: string; blurDataUrl?: string | null; width?: number | null; height?: number | null };

// 99acres-style gallery: a large primary image with a thumbnail strip below; clicking a thumb swaps
// the hero. When a listing has no photos we fall back to a deterministic gradient tile (same
// placeholder system as the landing page) so the layout never breaks.
export function Gallery({ photos, title, seed, icon }: { photos: GalleryPhoto[]; title: string; seed: string; icon: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="pdp-gallery">
        <div className="pdp-hero pdp-hero-empty" style={{ backgroundImage: thumbGradient(seed) }}>
          <span className="pdp-hero-icon">{icon}</span>
          <span className="thumb-badge">✓ Verified</span>
        </div>
      </div>
    );
  }

  const main = photos[Math.min(active, photos.length - 1)];

  return (
    <div className="pdp-gallery">
      <div className="pdp-hero">
        <Image
          key={main.id}
          src={main.url}
          alt={title}
          width={main.width ?? 1600}
          height={main.height ?? 1200}
          sizes="(max-width: 900px) 100vw, 640px"
          priority
          placeholder={main.blurDataUrl ? "blur" : "empty"}
          blurDataURL={main.blurDataUrl ?? undefined}
          className="pdp-hero-img"
        />
        <span className="thumb-badge">✓ Verified</span>
        <span className="pdp-hero-count">{active + 1} / {photos.length}</span>
      </div>
      {photos.length > 1 && (
        <div className="pdp-thumbs">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`pdp-thumb${i === active ? " is-active" : ""}`}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setActive(i)}
            >
              <Image
                src={p.url}
                alt=""
                width={p.width ?? 200}
                height={p.height ?? 150}
                sizes="120px"
                placeholder={p.blurDataUrl ? "blur" : "empty"}
                blurDataURL={p.blurDataUrl ?? undefined}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
