"use client";

import { useState } from "react";
import Link from "next/link";

// Serializable shapes built on the server (BrowseSections) and handed to this client tab switcher.
export type BrowseChip = { key: string; label: string; count: number; href: string };
export type BrowseGroup = { label?: string; chips: BrowseChip[] };
export type BrowseTab = { id: string; label: string; groups: BrowseGroup[] };

// MagicBricks-style "Explore" sub-menu: a vertical tab rail (Property type / BHK / Budget /
// Localities) with the selected tab's chips shown alongside. Collapses to a horizontal tab strip on
// mobile. All the facet/href computation lives on the server; this only flips the visible panel.
export function BrowseTabs({ heading, tabs }: { heading: string; tabs: BrowseTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  return (
    <section className="browse-tabs">
      <h2 className="section-title">{heading}</h2>
      <div className="browse-tabs-body">
        <div className="browse-tabs-nav" role="tablist" aria-label={heading}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === current.id}
              className={`browse-tab${t.id === current.id ? " is-active" : ""}`}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="browse-tabs-panel" role="tabpanel">
          {current.groups.map((g, i) => (
            <div key={g.label ?? i} className="browse-group">
              {g.label && <span className="browse-group-label">{g.label}</span>}
              <div className="chip-links">
                {g.chips.map((c) => (
                  <Link key={c.key} className="chip-link" href={c.href}>
                    {c.label}
                    <span className="chip-count">{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
