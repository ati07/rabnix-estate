# Phase-1 Build Plan (MVP) — Rabnix Estate

> **Version:** 1.0.0 · **Status:** Draft · **Last updated:** 2026-08-16 · **Owner:** Engineering

Goal of Phase 1: ship the **transactable core** (PRD §3 MVP) and reach listing liquidity in a few
localities of one city. Assumes a 2–4 person full-stack team. Sequenced so each week ends with
something demoable.

## Milestone: "First real enquiry"
Definition of done for Phase 1 = a real buyer contacts a real, phone-verified lister through the
product, and the enquiry appears in both dashboards.

## Week-by-week

### Week 1 — Foundations
- [x] Scaffold Next.js (App Router, TS) + API modules + Postgres/PostGIS + Prisma/SQL
- [x] Auth: email + password register/login/logout → JWT session cookie (`/api/auth/*`, `/api/me`).
      Phone-OTP stub also wired (`/auth/otp/*`); real SMS-OTP login is deferred (Week 4).
- [x] Seed `cities` + `localities` for the launch city (+ sample listings; boundaries TODO)
- [x] Local dev: plain Postgres (local install or managed Neon/Supabase) — no Docker needed
- [x] CI: lint + typecheck + test (GitHub Actions `.github/workflows/ci.yml`; vitest unit tests for
      pHash/moderation logic). Sentry + PostHog wiring TODO.

### Week 2 — Listing creation (supply)
- [x] Listing data model + migrations (see `data-model.sql`)
- [x] Post flow: `/post` form → draft → publish; location from locality (map pin, photos, autosave TODO)
- [x] Media pipeline: upload → WebP + blur placeholder; EXIF strip; pHash (dHash) + dup-reject.
      Local FS storage behind a swappable interface; responsive delivery via next/image; real CDN TODO.
- [x] `expires_at` set on create; auto-expiry job (`/api/cron/expire-listings`) flips `live`→`expired`
      past `expires_at` (CRON_SECRET-guarded; search also hides stale listings defensively)

### Week 3 — Search & detail (demand)
- [~] Search API: locality + filters + `bbox` done ("search this area" filters live listings by the
      map viewport, plain Postgres lat/lng range). Postgres FTS + **PostGIS radius deliberately
      deferred** — they need the `postgis`/`pg_trgm` DB extensions (superuser to enable, not on
      managed free tiers by default); the bbox range query is accurate enough at current scale, so
      enabling extensions is a scale-driven upgrade, not Phase-1 blocking.
- [x] Results UI: synced map + list (Leaflet + OSM, price-bubble pins, hover/click sync,
      load-more pagination) + a filter/sort bar (intent, type, BHK, price, sort)
- [x] Locality autocomplete (typo-tolerant, `/api/localities/search`). In-memory ranking
      (prefix > substring > edit-distance ≤2) over the small locality set — O(localities) per
      keystroke, fine for one city. `pg_trgm` is the deferred upgrade once the locality set is large
      enough to warrant an index (same extension-availability caveat as PostGIS above).
- [x] Listing detail: gallery, key-facts grid, amenities chips, single-marker Leaflet mini-map,
      similar homes (same locality + intent, ±40% price band)

### Week 4 — Contact loop + moderation
- [x] Contact reveal + enquiry create (`call`/`form`/`whatsapp`) — dev-login stands in for OTP
- [ ] Swap dev-login for real OTP gating on contact reveal
- [x] Dashboard (`/dashboard`): lister side (my listings + enquiries received, respond → sets
      `lister_responded_at`) **and** buyer side (saved homes via the Favorite model + enquiries I've sent)
- [x] Internal moderation queue (`/admin/moderation`, admin-only): submit → pending → approve/reject
      + reason; auto-flags computed on the fly — dup pHash, one phone→many, **price-outlier**
      (vs locality+intent median) and **spam text** (off-platform contact info + spam phrases).
- [x] SEO baseline: SSR listing pages + per-listing `generateMetadata` (title/description/OG) +
      schema.org JSON-LD; `sitemap.xml` (listings + per-locality search) + `robots.txt`

### Weeks 5–6 — Harden & seed
- [ ] Anti-fraud scoring pass; rate limits; abuse reporting
- [ ] Manual + agent-partnership **supply seeding** in ONE dense locality (ops, not code)
- [ ] Analytics funnel dashboards vs. North Star (qualified enquiries/wk) + response-rate guardrail
- [~] Perf pass: LCP image `priority`; non-LCP images lazy (next/image default) + WebP + blur
      placeholders; map lazy-init (`next/dynamic ssr:false`). 4G LCP <2.5s target still needs a
      prod-build Lighthouse run to confirm.
- [ ] Private beta → invite first buyers only after supply liquidity exists

## Cut lines (do NOT build in Phase 1)
Saved-search alerts, verified badge, agent paid plans, multi-city, analytics-for-listers — all
Phase 2+. Guard scope ruthlessly.

## Sequencing rule
**Supply before demand.** Weeks 1–2 stand up posting; do not run buyer acquisition until the seed
locality has real inventory (end of Weeks 5–6).

## Changelog
- **1.0.0** (2026-08-16) — Initial Phase-1 build plan.
