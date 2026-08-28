# Frontend Port — v1 Design → rabnix-estate

> **Version:** 1.3.0 · **Status:** Approved · **Last updated:** 2026-08-28 · **Owner:** Engineering

Adopt the `rabnix-estate-v1` design (a Tailwind-based, modal-driven UI shell) as the production
frontend of `rabnix-estate`, wiring every screen to the **real** Prisma/Postgres backend and API
routes instead of v1's static mock data. Same product, same brand tokens — this is a re-skin +
data-wiring, not a rewrite.

## 1. Context & motivation

Two sibling projects exist in the workspace:

| | `rabnix-estate` (target) | `rabnix-estate-v1` (design source) |
|---|---|---|
| Role | The real app / backend | A polished UI prototype |
| Framework | Next.js 15, React 19 | Next.js 16, React 19 |
| Styling | Plain CSS design system (`globals.css` tokens + semantic classes) | **Tailwind CSS 4** (`@import "tailwindcss"`, `@theme`) |
| Icons / motion | none | `lucide-react`, `motion` |
| Data | Prisma + Postgres, real API routes, JWT auth | Static mock array (`INITIAL_PROPERTIES` in `lib/realEstateData.ts`), all client-side |
| Backend features | auth, listings, search, enquiries, favorites, saved-searches, admin/moderation, cron | none except one Gemini advisor route |
| UX shape | SSR pages (`/search`, `/listings/[id]`, `/post`, `/dashboard`, `/login`, `/admin`) | Single-page, modal/drawer-driven (PropertyDetail, PostProperty, EMI, AI valuation, AI Genie chat, Shortlist, CitySelector) |

**Decisive fact:** both projects already share the **same brand tokens** — navy `#0F2A43`, emerald
`#18A67D`, and the full slate palette. v1 is effectively a prettier redesign of the same product, so
the port is far lower-risk than a typical design graft.

**Goal (confirmed scope):** full port — port the UI *and* wire it to the real backend. Include all
feature areas: core listing UI, post-property flow, shortlist/favorites, and the AI features (Gemini).

## 2. Guiding decisions

- **D1 — Stay on Next.js 15 for the port.** v1 is Next 16, but its components are framework-version
  agnostic. Upgrading the framework mid-port would conflate two unrelated risks. A Next 15→16 upgrade
  is a **separate, later** work item.
- **D2 — Tailwind coexists with the existing plain CSS.** Add Tailwind 4 alongside `globals.css`;
  do not rip out the current design system in one shot. Ported components use Tailwind; legacy pages
  keep working until migrated. Both read the same CSS-variable tokens.
- **D3 — Adapter is the keystone.** A single `property-adapter.ts` translates between the Prisma
  `Listing` model and v1's `Property` UI type. No UI component talks to Prisma directly; no API route
  learns the v1 type. This isolates the model mismatch to one file.
- **D4 — Derive first, persist only when needed, hide when neither.** v1's `Property` has many fields
  the schema lacks. Prefer computing them; add Prisma columns only for fields worth storing; let the
  UI degrade gracefully (hide the badge/row) when a field is genuinely absent.
- **D5 — Keep v1's client-side filter/sort UX, seed it from server data.** The home/search experience
  stays interactive (instant client filtering) but is hydrated from real listings via the existing
  search API, not a hardcoded array.
- **D6 — No Docker, skip OTP, per-feature ship loop.** Existing project conventions are unchanged.
  Every phase ends `typecheck` → smoke-test on local Postgres → docs updated → commit → push.

## 3. Data model mapping (`Listing` ⇄ `Property`)

The crux of the whole port. Source types:
`rabnix-estate/prisma/schema.prisma` (`Listing`) ⇄ `rabnix-estate-v1/src/lib/types.ts` (`Property`).

### 3.1 Direct / trivial mappings
| v1 `Property` | Prisma `Listing` | Note |
|---|---|---|
| `title`, `description`, `price`, `bathrooms`, `floor`, `amenities`, `createdAt` | same | `price` is `Decimal` → number |
| `bhk` | `bedrooms` | |
| `carpetAreaSqFt` | `areaSqft` | |
| `images[]` | `media[].url` (ordered, `isPrimary` first) | |
| `coordinates.{lat,lng}` | `lat` / `lng` | |
| `locality`, `city` | `locality.name`, `locality.city.name` | join |
| `furnishing` | `furnishing` | enum rename: `unfurnished`→`Unfurnished`, `semi_furnished`→`Semi-Furnished`, `furnished`→`Furnished` |
| `postedBy.{name,phone}` | `owner.fullName`, `owner.phone` | |

### 3.2 Enum split (needs translation both ways)
v1's single `listingType` (`buy | rent | pg | plot | commercial`) collapses two Prisma dimensions —
`intent` (`sale | rent`) **and** `propertyType` (`apartment | independent_house | villa | plot |
commercial | pg`). v1's `category` (Apartment, Villa, Builder Floor, …) also folds into `propertyType`.

Mapping rules:
- `buy` → `intent=sale`; `rent` → `intent=rent`.
- `pg` → `intent=rent`, `propertyType=pg`. `plot` → `intent=sale`, `propertyType=plot`.
  `commercial` → `propertyType=commercial`.
- Otherwise `propertyType` comes from `category` (Apartment→apartment, Villa→villa,
  Builder Floor→independent_house, Studio/Penthouse→apartment, Commercial Office/Retail Shop→commercial,
  Residential Plot→plot, PG/Co-Living→pg).
- Reverse (`Listing`→`Property`): compute `listingType` from `intent`+`propertyType`
  (pg/plot/commercial win; else buy/rent from intent), and `category` from `propertyType`.

### 3.3 Derivable (compute in adapter, no schema change)
- `priceFormatted` — INR formatter (`₹1.45 Cr` / `₹45,000 / mo`); logic exists in v1 `lib/formatters.ts`.
- `pricePerSqFt` — `price / areaSqft`.
- `isVerified` — from `qualityScore` threshold and/or moderation state (`status=live` + `moderatedAt`).
- `subLocality`, `superBuiltUpAreaSqFt`, `balconies`, `totalFloors` — omit / default when absent.
- `postedBy.type` — derive from `owner.role` (owner/agent/builder).

### 3.4 Not in schema — decision needed in Phase 1 (persist vs. hide)
`tagline`, `reraId` / `reraApproved`, `isFeatured`, `isExclusiveOwner`, `priceDrop`,
`maintenance`, `facing`, `constructionStatus`, `possessionDate`, `ageOfProperty`,
`nearbyLandmarks[]`, `floorPlanImage`, `postedBy.{companyName,responseTime,rating,avatar}`.

Recommendation (to confirm): add Prisma columns for the high-value, filterable/badge fields
— **`reraId`, `constructionStatus`, `isFeatured`** (and treat `isExclusiveOwner` as derived from
`owner.role=owner`). Hide the rest (`nearbyLandmarks`, `floorPlanImage`, agent rating, etc.) until a
later phase. Any schema change ships as a Prisma migration + `data-model.sql` update.

## 4. Component inventory (v1 → target)

Copy from `rabnix-estate-v1/src/components/` into `rabnix-estate/src/components/`:

| Component | Wires to | Phase |
|---|---|---|
| `Navbar`, `Footer`, `HeroSearch` | auth state (`/api/me`), search params | 2 |
| `PropertyCard`, `PropertyDetailModal` | adapter over search / listing detail APIs | 2 |
| `ExploreCategoriesSection`, `CuratedCollectionsSection`, `TopBuildersSection`, `LocalityTrendsSection` | mostly presentational; feed real localities where available | 2 |
| `CitySelectorModal` | cities/localities data | 2 |
| `PostPropertyModal` | `POST /api/listings` + `/submit` + auth (`/post` logic) | 3 |
| `ShortlistDrawer` | `/api/listings/[id]/favorite` (`Favorite` model) | 4 |
| `AiGenieChatDrawer`, `AiValuationModal`, `EmiCalculatorModal` | ported `/api/gemini/advisor` route | 5 |

Supporting files to port/merge: `lib/formatters.ts`, `lib/utils.ts`, `lib/types.ts` (as the UI type),
`hooks/use-mobile.ts`. `lib/realEstateData.ts` is **replaced** by real data (kept only for any static
copy such as city metadata / curated-collection labels).

## 5. Phased plan

Each phase is independently demoable and closes with the standard ship loop.

### Phase 0 — Tooling foundation
- Add deps: `tailwindcss@4`, `@tailwindcss/postcss`, `postcss`, `autoprefixer`, `lucide-react`,
  `motion`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@hookform/resolvers`.
- Add `postcss.config.mjs`; add `@import "tailwindcss"` + v1's `@theme` token block into `globals.css`
  (tokens already match — low risk). Verify existing pages still render.
- **DoD:** `npm run typecheck` + `npm run build` green; a throwaway Tailwind-classed element renders
  with correct brand colors alongside legacy CSS.

### Phase 1 — Adapter layer (keystone)
- Create `src/lib/property-adapter.ts`: `listingToProperty(listing)` and `formToListingInput(form)`,
  centralizing §3's enum split, derived fields, and safe defaults.
- Decide §3.4 persist-vs-hide; if persisting, add a Prisma migration + update `data-model.sql`.
- Unit tests (vitest, matching existing test style) for both mapping directions incl. enum edge cases.
- **DoD:** adapter round-trips sample listings; tests green; typecheck green.

### Phase 2 — Core listing UI (server-wired) — ✅ Done (2026-08-28)
- Port core components; replace `INITIAL_PROPERTIES` with real data from `/api/listings/search`
  through the adapter (D5: server-seeded, client-filtered).
- Decide integration point: new home `page.tsx` using v1's layout, or progressive replacement of the
  current landing/search. Keep `/search`, `/listings/[id]` server routes functioning.
- **DoD:** home + detail render real listings with the v1 look; filters/sort work; smoke-tested on
  local Postgres.
- **Delivered:** 15 v1 components under `src/components/v2/`; client shell `src/app/v2/HomeView.tsx`;
  **server component** `src/app/v2/page.tsx` fetches live listings (`status=live`, unexpired, ordered
  featured→quality→recent, take 24) via Prisma `include` and maps through `listingToProperty`, then
  hands them to `HomeView` (D2: runs alongside legacy `/`). `pickInitialCity()` derives the default
  city from real inventory so the client filter doesn't hide everything (fixed a Bangalore-default
  vs Pune-inventory mismatch). Static city/locality figures ported into a trimmed `realEstateData.ts`
  (mock `INITIAL_PROPERTIES` intentionally dropped). Verified on local Postgres: `/v2` → 200 renders
  22 live Pune listings (Baner/Kharadi/Hinjewadi/Wakad, BHK/Apartment content, no empty state);
  legacy `/` and `/search` still 200. Typecheck + prod build green (`/v2` ≈ 32.9 kB).

### Phase 3 — Post-property flow — ✅ Done (2026-08-28)
- Wire `PostPropertyModal` to `POST /api/listings` + `/api/listings/[id]/submit` with auth gating
  (reuse `/post` logic). `formToListingInput` maps the modal's form state to the create payload.
- **DoD:** post → publish → appears in search, end-to-end on local DB; non-authed users routed to `/login`.
- **Delivered:** `PostPropertyModal.handleSubmit` now assembles a `PostPropertyFormState`, calls
  `formToListingInput`, and `POST`s `{...input, city, locality}` to `/api/listings`, then
  `/api/listings/[id]/submit`. `POST /api/listings` extended to accept free-text `city` + `locality`
  (find-or-creates the `City`/`Locality`, resolves the centroid, falls back to the Pune centroid when
  a fresh locality has no coords) and to persist `floor` / `amenities` / `reraId` / `constructionStatus`.
  `submit` **auto-approves to `live` in non-production** (dev convenience mirroring `/api/dev/login`);
  stays `pending` under `NODE_ENV=production` so the moderation queue is still exercised. Auth-gated:
  a 401 surfaces an inline "Sign in to continue" link to `/login?redirect=/v2`; the button shows a
  busy state. Verified end-to-end on local DB (`npm run dev`): unauth POST → 401; register → create
  (201, all enums/renames mapped) → submit → `live`; the new listing renders on `/v2` and returns from
  the search API. Test data cleaned up; suite 85 green.
- **Known gap (deferred):** the modal's single external photo URL is not persisted — the media route
  ingests uploaded files (EXIF-strip → WebP → pHash), not remote URLs — so modal-posted listings use
  the fallback image until a file-upload step (or URL-ingest) is added.

### Phase 4 — Shortlist / favorites
- Wire `ShortlistDrawer` + card heart toggles to `/api/listings/[id]/favorite` (`Favorite` model),
  replacing v1's local `shortlistedIds` state with real per-user favorites; hydrate initial set for
  signed-in users.
- **DoD:** favorite/unfavorite persists across reload for a logged-in user; verified via Prisma.

### Phase 5 — AI features (Gemini)
- Port `/api/gemini/advisor` route + `@google/genai`; add `GEMINI_API_KEY` to `.env` /`.env.example`
  (gitignored real key, per conventions). Wire `AiGenieChatDrawer`, `AiValuationModal`,
  `EmiCalculatorModal`.
- **Open item:** the route references model `gemini-3.7-flash`; confirm/adjust to a valid current
  model ID before shipping. Feature must degrade gracefully when the key is absent (disabled state).
- **DoD:** valuation returns structured JSON; Genie chat replies; graceful disable without a key.

## 6. Risks & mitigations
- **Model-field gaps (§3.4)** → adapter defaults + explicit persist/hide decision in Phase 1; never
  block the UI on a missing field.
- **Tailwind ↔ legacy CSS conflicts** → scope carefully, migrate page-by-page, keep both reading the
  same tokens; watch global selector collisions.
- **Next 15 vs 16 API drift** in ported components → address per-component during Phase 2; framework
  upgrade stays out of scope (D1).
- **Gemini key / model availability** → env-gated, graceful degradation (D-phase 5).
- **Client-heavy home page vs. SSR/SEO** → keep SSR listing/detail routes; the interactive home is
  hydrated from server data, preserving existing SEO baseline.

## 7. Out of scope (this port)
- Next.js 15 → 16 framework upgrade.
- Removing/rewriting the legacy plain-CSS pages beyond what each phase migrates.
- New backend capabilities not already present (e.g., real nearby-landmark data, agent ratings).
- Multi-city expansion, paid plans (still Phase 2+ per `roadmap.md`).

## 8. Resolved decisions (signed off 2026-08-28)
1. **§3.4 persist vs. hide** — persist `reraId`, `constructionStatus`, `isFeatured`; derive
   `isExclusiveOwner` from `owner.role=owner`; hide the rest (nearby landmarks, floor-plan image,
   agent rating/response-time, tagline, maintenance, facing, possession/age) until a later phase.
2. **Phase 2 landing** — run the v1 home **alongside** the legacy landing during migration (behind a
   route/flag), then cut over once verified. Avoids a big-bang replacement of a working page.
3. **Phase 5 Gemini** — ship AI features **disabled-by-default** (env-gated on `GEMINI_API_KEY`);
   they light up when a key is present. No key assumed available yet.

### Phase 0 implementation note — Tailwind without preflight
To honor D2 (coexist with legacy plain CSS, migrate page-by-page), Phase 0 imports Tailwind v4 as
layered **theme + utilities only, excluding preflight** (the CSS reset), so ported v1 components get
Tailwind utilities while the existing design-system pages are untouched. Full preflight can be
enabled once legacy pages are fully migrated. Reversible, low blast radius.

## Changelog
- **1.1.0** (2026-08-28) — Approved; resolved §8 (persist `reraId`/`constructionStatus`/`isFeatured`;
  v1 home alongside legacy; Gemini disabled-by-default). Added Phase 0 no-preflight Tailwind note.
- **1.0.0** (2026-08-28) — Initial frontend-port spec (v1 design → rabnix-estate, all feature areas).
