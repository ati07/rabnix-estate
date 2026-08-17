"use client";

import { useState } from "react";
import { LocalitySearch } from "./search/LocalitySearch";

// Hero search card — matches the DOMUS landing reference: a Buy/Rent/Commercial/New-Projects
// tab strip above a Location / Property Type / Budget / Bedrooms field row. It's a plain GET
// <form action="/search"> so it works without JS; the tabs and budget just drive hidden inputs
// (LocalitySearch still submits its `locality` field via requestSubmit()).
const TABS = [
  { key: "buy", label: "Buy", intent: "sale" },
  { key: "rent", label: "Rent", intent: "rent" },
  { key: "commercial", label: "Commercial" },
  { key: "projects", label: "New Projects" },
] as const;

const PROPERTY_TYPES = [
  ["apartment", "Apartment"],
  ["independent_house", "Independent house"],
  ["villa", "Villa"],
  ["plot", "Plot"],
  ["commercial", "Commercial"],
  ["pg", "PG"],
] as const;

// Budget bands encoded as "min-max" (rupees); either side may be empty for open-ended.
const BUDGETS = [
  ["", "Any Budget"],
  ["0-2500000", "Under ₹25 L"],
  ["2500000-5000000", "₹25 L – ₹50 L"],
  ["5000000-10000000", "₹50 L – ₹1 Cr"],
  ["10000000-20000000", "₹1 Cr – ₹2 Cr"],
  ["20000000-", "₹2 Cr+"],
] as const;

export function HeroSearch({ city }: { city: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("buy");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  function selectTab(key: (typeof TABS)[number]["key"]) {
    setTab(key);
    // The Commercial tab is just a shortcut for the commercial property type.
    if (key === "commercial") setType("commercial");
    else if (type === "commercial") setType("");
  }

  const active = TABS.find((t) => t.key === tab)!;
  const activeIntent = "intent" in active ? active.intent : null;
  const [budgetMin, budgetMax] = budget.split("-");

  return (
    <form className="hero-search" action="/search" method="get">
      <div className="hero-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hidden filters driven by the active tab. */}
      {activeIntent && <input type="hidden" name="intent" value={activeIntent} />}
      {tab === "projects" && <input type="hidden" name="sort" value="newest" />}
      {budgetMin && <input type="hidden" name="priceMin" value={budgetMin} />}
      {budgetMax && <input type="hidden" name="priceMax" value={budgetMax} />}

      <div className="hero-fields">
        <label className="hero-field hero-field-loc">
          <span className="hero-field-label">Location</span>
          <LocalitySearch placeholder={`Enter location — e.g. Wakad, Baner (${city})`} />
        </label>

        <label className="hero-field">
          <span className="hero-field-label">Property Type</span>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Type</option>
            {PROPERTY_TYPES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="hero-field">
          <span className="hero-field-label">Budget</span>
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            {BUDGETS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="hero-field">
          <span className="hero-field-label">Bedrooms</span>
          <select name="bhk" defaultValue="">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} BHK
              </option>
            ))}
          </select>
        </label>

        <button className="btn hero-search-btn" type="submit">
          <span aria-hidden="true">🔍</span> Search
        </button>
      </div>
    </form>
  );
}
