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
- [ ] CI: lint + typecheck + test; Sentry + PostHog wired

### Week 2 — Listing creation (supply)
- [x] Listing data model + migrations (see `data-model.sql`)
- [x] Post flow: `/post` form → draft → publish; location from locality (map pin, photos, autosave TODO)
- [x] Media pipeline: upload → WebP + blur placeholder; EXIF strip; pHash (dHash) + dup-reject.
      Local FS storage behind a swappable interface; responsive delivery via next/image; real CDN TODO.
- [x] `expires_at` set on create (auto-expiry job TODO)

### Week 3 — Search & detail (demand)
- [ ] Search API: locality + filters + `bbox`, Postgres FTS + PostGIS (no search engine yet)
- [ ] Results UI: synced map + list, bottom-sheet filters (mobile-first)
- [ ] Locality autocomplete (pg_trgm, typo-tolerant, "near me")
- [ ] Listing detail: gallery, key facts, amenities, map, similar

### Week 4 — Contact loop + moderation
- [x] Contact reveal + enquiry create (`call`/`form`/`whatsapp`) — dev-login stands in for OTP
- [ ] Swap dev-login for real OTP gating on contact reveal
- [x] Lister dashboard (`/dashboard`): my listings + enquiries received, respond → sets `lister_responded_at` (buyer dashboard TODO)
- [x] Internal moderation queue (`/admin/moderation`, admin-only): submit → pending → approve/reject
      + reason; auto-flags (dup pHash, one phone→many) computed on the fly. Price-outlier/keyword-spam TODO.
- [ ] SEO baseline: SSR listing/locality pages, schema.org, sitemap

### Weeks 5–6 — Harden & seed
- [ ] Anti-fraud scoring pass; rate limits; abuse reporting
- [ ] Manual + agent-partnership **supply seeding** in ONE dense locality (ops, not code)
- [ ] Analytics funnel dashboards vs. North Star (qualified enquiries/wk) + response-rate guardrail
- [ ] Perf pass: LCP < 2.5s on 4G; image lazy-load; map lazy-init
- [ ] Private beta → invite first buyers only after supply liquidity exists

## Cut lines (do NOT build in Phase 1)
Saved-search alerts, verified badge, agent paid plans, multi-city, analytics-for-listers — all
Phase 2+. Guard scope ruthlessly.

## Sequencing rule
**Supply before demand.** Weeks 1–2 stand up posting; do not run buyer acquisition until the seed
locality has real inventory (end of Weeks 5–6).

## Changelog
- **1.0.0** (2026-08-16) — Initial Phase-1 build plan.
