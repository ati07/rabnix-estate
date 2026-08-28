# Documentation Changelog

All notable changes to the planning docs are recorded here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/). Each doc also carries its own semantic version in
its header — see [docs/README.md](./README.md) for the convention.

## [Unreleased]
- _Pending: target city, team size, and seeding channel decisions (PRD §7)._
- `frontend-port-v1.md` **1.2.0** — spec to port the `rabnix-estate-v1` Tailwind design onto the
  real Prisma/Postgres backend (adapter-centered, 6 phases: tooling → adapter → core UI → post →
  favorites → AI/Gemini). Approved; §8 decisions signed off. Phases 0–2 marked done.
- Frontend port **Phase 0** (tooling): added Tailwind v4 + PostCSS (theme + utilities, preflight
  excluded so it coexists with the legacy plain-CSS design system) plus `lucide-react`, `motion`,
  `clsx`, `tailwind-merge`, `class-variance-authority`, `@hookform/resolvers`. `@theme` brand tokens
  mirror the existing `:root` palette. Build + typecheck green.
- Frontend port **Phase 1** (adapter): `src/lib/property-adapter.ts` translates Prisma `Listing` ⇄ v1
  `Property` (intent+propertyType↔listingType enum split, bhk/areaSqft renames, derived
  priceFormatted/pricePerSqFt/isVerified, safe defaults). Ported UI helpers (`lib/types.ts`,
  `lib/formatters.ts`, `lib/utils.ts`). New persisted `Listing` fields `reraId` /
  `constructionStatus` / `isFeatured` (schema + `prisma db push` + `data-model.sql`). 13 adapter unit
  tests; full suite 85 green.
- Frontend port **Phase 2** (core listing UI, server-wired): 15 v1 components under
  `src/components/v2/`; server component `src/app/v2/page.tsx` fetches live listings and maps them
  through the adapter into the client shell `src/app/v2/HomeView.tsx` (runs alongside legacy `/`).
  `pickInitialCity()` derives the default city from real inventory (fixes a default-city/inventory
  mismatch that hid all listings). Static city/locality data ported into a trimmed `realEstateData.ts`
  (mock `INITIAL_PROPERTIES` dropped). Verified on local Postgres: `/v2` renders 22 live Pune listings
  with the v1 look; legacy `/` + `/search` still 200; typecheck + build green.
- Week 1 build (branch `feat/week1-auth-search`): JWT session cookie + `/api/me`, search results
  page, sample-listings seed. Local dev runs on plain Postgres (local or managed); Docker removed.
  See `build-plan-phase1.md` Week 1.
- Contact loop: dev-login (`/api/dev/login`, skips OTP) + `/api/listings/:id/contact` records an
  enquiry and reveals the lister phone; wired into listing detail. Verified end-to-end on local DB.
- Post-a-listing UI (`/post`): session-based create (`POST /api/listings`, no more ownerId in body)
  + publish (`/api/listings/:id/submit`, dev auto-live / prod pending). Location derived from
  locality. Verified: post → publish → appears in search.
- Lister dashboard (`/dashboard`): my listings (status + enquiry counts) and enquiries received;
  "Mark responded" (`POST /api/enquiries/:id/respond`) sets `listerRespondedAt` (response-rate
  guardrail). Ownership-enforced (non-owner → 403). Verified end-to-end on local DB.
- Email + password auth (`/login`, `POST /api/auth/register|login|logout`): bcrypt password hashes,
  same JWT session cookie. `User.phone` now optional; added `User.passwordHash`. Nav reflects
  signed-in state + log out. Contact/post/dashboard now link to `/login` instead of dev-login.
  OTP/SMS login stays deferred. Verified: register → session, login, logout, bad-password 401,
  duplicate-email 409.

## 2026-08-16 (later)
### Added
- `build-plan-phase1.md` **1.0.0** — week-by-week MVP build plan.
- Next.js + Prisma/Postgres app scaffold (modules: auth/listings/search; API routes; SSR pages).
  Typecheck and production build verified green. Launch city defaults to Pune (assumption, see
  `.env.example`).

## 2026-08-16
### Added
- `PRD.md` **1.0.0** — vision, users, scope by release, flows, metrics, risks.
- `system-design.md` **1.0.0** — modular-monolith architecture, data model, search, trust systems.
- `roadmap.md` **1.0.0** — phased supply→demand→monetization→moat strategy.
- `data-model.sql` **1.0.0** — reference Postgres + PostGIS schema.
- `api-contract.md` **1.0.0** — MVP REST surface sketch.
- `decisions/0001-architecture-modular-monolith.md` — ADR accepting modular monolith.
- `docs/README.md` — doc versioning convention & index.
