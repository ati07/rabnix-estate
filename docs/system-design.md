# System Design — Rabnix Estate

> **Version:** 1.0.0 · **Status:** Draft · **Last updated:** 2026-08-16 · **Owner:** Engineering

## 1. Architecture — start modular-monolith, not microservices

At MVP scale, microservices are pure cost. Keep clean module boundaries so services *can* be
extracted later, but deploy as one unit. See [ADR-0001](./decisions/0001-architecture-modular-monolith.md).

```
                    ┌────────────────────────────┐
                    │   Next.js (SSR/ISR) Web     │  ← SEO-critical
                    │   + PWA (mobile)            │
                    └──────────────┬─────────────┘
                                   │ REST / tRPC
                    ┌──────────────▼─────────────┐
                    │      Application API         │
                    │      (modular monolith)      │
                    │  ┌─────────────────────────┐ │
                    │  │ Listings │ Search │ Auth │ │
                    │  │ Enquiry  │ Media  │ Mod  │ │
                    │  └─────────────────────────┘ │
                    └───┬─────────┬─────────┬──────┘
                        │         │         │
              ┌─────────▼──┐ ┌────▼─────┐ ┌─▼──────────┐
              │ Postgres   │ │ Search   │ │ Object     │
              │ + PostGIS  │ │ engine   │ │ store +CDN │
              │ (source of │ │(Typesense│ │ (S3 /      │
              │  truth)    │ │ /Meili)  │ │ Cloudinary)│
              └────────────┘ └──────────┘ └────────────┘
                        │
              ┌─────────▼─────────────┐
              │ Async workers (queue) │  image processing, email/push,
              │ indexing, alerts,     │  alert digests, moderation scoring
              │ moderation scoring    │
              └───────────────────────┘
```

**Modules:** Listings · Search · Enquiry · Auth · Media · Moderation. Communicate in-process via
clear interfaces; no cross-module DB reads.

## 2. Core data model

Full DDL in [data-model.sql](./data-model.sql). Summary:

```
users             (id, phone[verified], email, role[buyer|owner|agent|admin], created_at)
listings          (id, owner_id, type[sale|rent], property_type, status,
                   price, area_sqft, bedrooms, bathrooms, furnishing, floor,
                   locality_id, geo POINT, description, amenities[], quality_score,
                   created_at, expires_at)
listing_media     (id, listing_id, url, width, height, ord, is_primary)
localities        (id, city_id, name, geo POLYGON, aliases[])   ← autocomplete + geo search
cities            (id, name, state, geo)
enquiries         (id, listing_id, buyer_id, channel, message, created_at, lister_responded_at)
saved_searches    (id, user_id, query_json, alert_frequency, last_notified_at)
favorites         (user_id, listing_id, created_at)
verifications     (id, listing_id, tier[phone|document|physical], status, verified_by, verified_at)
moderation_events (id, listing_id, action, moderator_id, reason, created_at)
```

**Design notes**
- **PostGIS is non-negotiable** — locality polygons + point geometry give "search within map bounds,"
  "within X km," and locality-boundary search. This is the technical heart of property search.
- `localities.aliases[]` powers fast, typo-tolerant autocomplete (Baner / Bāner / Banner).
- `listings.expires_at` forces freshness — listings auto-expire (30–45 days) and must be renewed.
  This fights staleness *structurally*, not by nagging.
- `listings.quality_score` (completeness + verification) denormalized for ranking.

## 3. Search design — the core competency
- **Source of truth:** Postgres. **Index:** Typesense/Meilisearch, synced by async workers on write.
- **Ranking blend:** relevance (locality/filter match) × freshness × completeness × verification tier
  × (later) lister responsiveness. **Never rank purely by recency** — that rewards spam re-posting.
- **Start simpler than you think:** Postgres full-text + PostGIS carries you to real traffic. Add the
  search engine when facet latency hurts.

## 4. Media pipeline
Upload → object store → async worker generates responsive sizes + WebP + blur placeholder → CDN.
- Strip EXIF (privacy). Optional agent watermark.
- **Perceptual-hash (pHash) duplicate detection** — reused images are a strong fraud signal.

## 5. Trust & anti-fraud — the actual moat
Layered defense:
1. **Phone OTP** on every lister + on contact-reveal.
2. **Automated scoring:** duplicate images (pHash), one phone across many listings, price outliers,
   keyword spam → route to moderation.
3. **Human moderation queue** — one-click approve/reject + reason.
4. **Verification tiers:** phone → document → physical visit, each a visible badge.
5. **Community signals:** buyer "report listing," lister response-rate tracking, auto-demote non-responders.

## 6. Non-functional requirements
- **SEO (primary acquisition channel):** SSR/ISR for all listing + locality pages, schema.org
  `RealEstateListing` structured data, sitemaps.
- **Performance:** LCP < 2.5s on 4G mobile; image lazy-load; map lazy-init.
- **Availability:** single-region managed services at MVP — don't over-engineer.
- **Privacy/compliance:** OTP consent, PII protection on phone reveal, India DPDP Act compliance.
- **Observability:** error tracking (Sentry) + product analytics (PostHog) from day one — see the funnel.

## 7. Recommended stack (boring = fast)
Next.js · Node/tRPC (or NestJS) · Postgres + PostGIS (managed: Supabase/Neon) · Typesense ·
Cloudinary or S3+CloudFront · Mapbox · managed auth + phone OTP (MSG91/Twilio) · Redis queue ·
Vercel/Railway/Fly hosting. Nothing here needs a platform team.

## 8. What we deliberately do NOT build (v1)
- No microservices before scale forces it.
- No multi-city until one city hits liquidity.
- No home-loans/interiors/CRM.
- No paid demand marketing before supply liquidity.

## Changelog
- **1.0.0** (2026-08-16) — Initial system design.
