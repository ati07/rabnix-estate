"use client";

import { useRef } from "react";
import Link from "next/link";

// Horizontal scroll "rail" with a header (title + optional See-all) and prev/next buttons —
// the carousel idiom every portal uses. Cards are passed in as children (server-rendered);
// only the scroll behaviour needs the client.
export function Rail({
  title,
  subtitle,
  seeAllHref,
  children,
}: {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  return (
    <section className="rail">
      <div className="rail-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub">{subtitle}</p>}
        </div>
        <div className="rail-controls">
          {seeAllHref && (
            <Link className="rail-seeall" href={seeAllHref}>
              See all →
            </Link>
          )}
          <button type="button" className="rail-btn" aria-label="Scroll left" onClick={() => scrollBy(-1)}>
            ‹
          </button>
          <button type="button" className="rail-btn" aria-label="Scroll right" onClick={() => scrollBy(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="rail-track" ref={ref}>
        {children}
      </div>
    </section>
  );
}
