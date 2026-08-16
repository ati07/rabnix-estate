# Product Requirements Document — Rabnix Estate

> **Version:** 1.0.0 · **Status:** Draft · **Last updated:** 2026-08-16 · **Owner:** Product

## 1. Vision & positioning

**Vision:** The most *trusted* place to find a home in [target city] — where every listing is real
and every enquiry reaches a responsive human.

**Positioning bet:** Incumbents win on inventory volume but lose on trust. Buyers wade through stale,
fake, and broker-spam listings. Our wedge is **verified inventory + fewer, higher-quality
listings** — we compete on signal-to-noise, not size.

**Non-goals (v1):** Not building home loans, legal services, interior design, or a full CRM. We are a
discovery + connection layer. Resist the super-app temptation until the core compounds.

## 2. Users & jobs-to-be-done

| Persona | Job-to-be-done | Success looks like |
|---------|----------------|--------------------|
| **Buyer / Tenant** | Find a home in budget & area without wasting weekends on dead listings | Contacts 3 real owners/agents in one session |
| **Owner (FSBO)** | Sell/rent without paying a broker | Gets qualified enquiries within days |
| **Agent / Builder** | Reach serious buyers efficiently | Pays for reach because leads convert |
| **Ops / Moderator (internal)** | Keep the marketplace clean | Clears review queue in minutes |

This is a **two-sided marketplace** (demand: buyers; supply: owners + agents). Every roadmap
decision must ask: *which side does this serve, and is that side currently the bottleneck?*

## 3. Scope by release

### MVP (v1) — the transactable core
- Listing creation: photos, price, location, property attributes
- **Phone-OTP verification of every lister** (trust foundation)
- Search: city → locality, buy/rent toggle, budget, BHK, property type
- Map + list results; sort by relevance / price / date
- Listing detail: gallery, key facts, amenities, map, similar listings
- Contact: reveal phone / enquiry form / WhatsApp deep-link (OTP-gated)
- Auth + dashboards (my listings, my enquiries)
- Internal moderation queue

### v1.1 — retention & trust
- Saved searches + email/push alerts ("3 new 2BHKs in Wakad under ₹80L")
- Shortlist / favorites
- "Verified" badge (document/physical verification tier)
- SEO landing pages (city / locality / property-type templates)

### v2 — monetization & supply tooling
- Agent accounts, paid listing plans, featured/boosted listings
- Lead-management inbox for agents
- Analytics for listers (views, enquiries, funnel)

### v3 — moat & expansion
- Price trends & locality insights (data product)
- Multi-city expansion playbook
- Partnerships: home loans, legal verification (referral revenue)

## 4. Key user flows (design)

### Buyer search flow — the money path
```
Landing → City/Locality autocomplete → Results (map+list)
   → Filter/refine → Listing detail → Contact (OTP-gated reveal)
   → Enquiry saved to both dashboards → WhatsApp handoff
```
**Design principles**
- **Mobile-first, thumb-reachable filters** — 70%+ of search is mobile. Filters live in a bottom sheet.
- **Map + list are one synced view** — panning re-queries; tapping a pin highlights the card.
- **Contact is one tap but gated** — reveal requires login (OTP): cuts spam, captures demand data.
- **Locality autocomplete is make-or-break** — fast, typo-tolerant, supports "near me."

### Lister posting flow — completable in <3 min on mobile
```
Post → Phone OTP → Property type → Location (map pin + locality)
   → Attributes (BHK, area, price, furnishing) → Photos → Review → Live (pending moderation)
```
**Design principles**
- **Progressive disclosure + autosave** — never lose a half-filled form.
- **Completeness meter** — more complete listings get better placement (aligns incentives).

## 5. Success metrics

**North Star:** *Qualified enquiries per week* (buyer contacts a real, verified lister). Captures both
sides being healthy.

| Layer | Metrics |
|-------|---------|
| Acquisition | Listings created/wk, buyers/wk, SEO sessions |
| Activation | % listers completing a listing, % buyers who search→contact |
| Engagement | Searches/session, saved searches, return rate D7/D30 |
| Marketplace health | Verification rate, % stale listings, avg time-to-first-enquiry |
| Trust | Spam-report rate, fake-listing catch rate, enquiry response rate |
| Revenue (v2+) | Paying agents, ARPU, featured-listing take rate |

**Guardrail metric:** *enquiry response rate.* If listers stop answering, buyers churn and no amount
of growth spend saves you.

## 6. Risks & assumptions
- **Cold start (biggest risk):** empty marketplace = no value. → Seed supply first (agents + manual +
  FSBO) in ONE dense locality before opening demand marketing.
- **Trust erosion:** fake/spam listings kill credibility. → OTP + moderation + verification tiers from day one.
- **Two-sided chicken-egg:** → go hyper-local (one city, few localities) to reach liquidity fast.

## 7. Open questions
- Target city/country? (drives OTP + maps provider, language, currency, compliance)
- Team size & runway? (drives phase pacing)
- Initial supply-seeding channel: agent partnerships vs. manual entry vs. FSBO campaign?

## Changelog
- **1.0.0** (2026-08-16) — Initial PRD.
