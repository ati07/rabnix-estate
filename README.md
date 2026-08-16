# Rabnix Estate

A focused, **trust-first real-estate marketplace** — the most trusted place to find a home,
competing on signal-to-noise (verified inventory, responsive listers) rather than raw listing volume.

> Working name: `rabnix-estate`. Easily renamed later.

## Why this exists
Incumbents (MagicBricks, 99acres, Housing) win on inventory volume but lose on trust — buyers
wade through stale, fake, and broker-spam listings. Our wedge is **verified inventory + fewer,
higher-quality listings**. We compete on signal, not size.

## Documentation
All product & engineering planning lives in [`/docs`](./docs). Start here:

| Doc | Purpose |
|-----|---------|
| [docs/PRD.md](./docs/PRD.md) | Product Requirements — vision, users, scope, metrics |
| [docs/system-design.md](./docs/system-design.md) | Architecture, data model, search, trust systems |
| [docs/roadmap.md](./docs/roadmap.md) | Long-term phased strategy & monetization |
| [docs/data-model.sql](./docs/data-model.sql) | Reference Postgres + PostGIS schema |
| [docs/api-contract.md](./docs/api-contract.md) | API surface sketch |
| [docs/decisions/](./docs/decisions) | Architecture Decision Records (ADRs) |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Doc version history |

## Doc versioning
Each planning doc carries a semantic version + status header. History is tracked in
[docs/CHANGELOG.md](./docs/CHANGELOG.md) and, of course, git. See
[docs/README.md](./docs/README.md) for the convention.

## App scaffold (MVP)
A runnable **Next.js (App Router, TypeScript) + Prisma/Postgres** skeleton implementing the module
boundaries and API surface from the docs. Modules live under `src/modules` (`auth`, `listings`,
`search`); route handlers under `src/app/api`.

### Quickstart
Point `DATABASE_URL` at a Postgres database — a **local install** or a free managed one
(Neon / Supabase). `db:push` creates the database if it doesn't exist.
```bash
npm install
copy .env.example .env         # set DATABASE_URL to your Postgres connection string
npm run db:generate            # prisma client
npm run db:push                # create database + tables
npm run db:seed                # launch city + localities + 4 sample listings
npm run dev                    # http://localhost:3000 (falls back to :3001 if in use)
```
PostGIS is only needed for later geo features (bbox/radius search); the current app runs on plain
Postgres. Without a database the UI still renders; API routes return a clear "database not
configured" error.

### Local testing — what to try
1. **Search UI:** open http://localhost:3000, type a locality — the box **autocompletes** (typo
   tolerant: `Wakhad`→Wakad, `Hinjawadi`→Hinjewadi). Results open at `/search` as a **synced
   map + list** (Leaflet/OSM price-bubble pins; hover a card to highlight its pin, click a pin to
   jump to the card) with a **filter/sort bar** (intent, type, BHK, price, sort) and **Load more**
   pagination. Pan/zoom the map and hit **Search this area** to re-query within the visible bounds
   (the map stays put). Click a card → SSR listing detail.
2. **Search API:** `GET http://localhost:3000/api/listings/search?intent=rent&bhk=2`
3. **Sign in / register:** open **/login** → "Create account" (email + password; pick buyer or
   owner) → you're signed in (nav shows your name + **Log out**). API equivalent:
   ```bash
   # register (or /api/auth/login with an existing account) → sets httpOnly session cookie
   curl -X POST localhost:3000/api/auth/register -H "content-type: application/json" -d "{\"email\":\"me@test.com\",\"password\":\"secret123\",\"role\":\"buyer\"}" -c cookies.txt
   curl localhost:3000/api/me -b cookies.txt
   ```
4. **Contact loop:** signed in, open a listing → **Contact lister** → records an enquiry and reveals
   the lister's phone (`POST /api/listings/:id/contact`). The detail page shows a **key-facts grid**,
  **amenities chips**, a **location mini-map** (Leaflet/OSM), and **similar homes** (same locality +
  intent, ±40% price band).
5. **Post a property (with photos):** signed in as an owner, open **/post** → fill the form → attach
   a few images → **Publish**. Photos are processed server-side (EXIF stripped, converted to WebP,
   blur placeholder + perceptual hash) and shown as a gallery on the listing and as thumbnails in
   search. Re-uploading the same photo to a listing is rejected as a duplicate. Files land under
   `public/uploads/` in dev (gitignored); production swaps in an object store/CDN via
   `src/lib/storage.ts`.
6. **Dashboard:** open **/dashboard**. As an owner you see your listings (status + enquiry counts)
   and enquiries received → **Mark responded** (sets `listerRespondedAt`, the response-rate
   guardrail). As a buyer you see **Saved homes** (tap **♡ Save** on any listing) and the enquiries
   you've sent (with the lister's phone + whether they responded).
7. **Moderation queue:** posting now submits a listing as `pending` (awaits review, not yet public).
   Dev-login as an **admin** (`POST /api/dev/login {"role":"admin"}`) → the nav shows **Moderation**
   → open **/admin/moderation** to see pending listings with photos, key facts, and auto-flags
   (duplicate image via pHash, one-phone-many, price-outlier vs the locality median, spam text with
   off-platform contact info). **Approve** → the listing goes `live` and appears in
   search; **Reject** with a reason → owner sees the reason on their dashboard.
8. **Auto-expiry:** listings carry an `expiresAt` (~45 days). `POST /api/cron/expire-listings` flips
   any `live` listing past its expiry to `expired` (returns `{ expired: n }`); search also hides
   stale listings defensively. Point a daily scheduler at it (Vercel Cron, a GitHub Actions cron, or
   OS cron/curl) and set `CRON_SECRET` in production (`Authorization: Bearer <CRON_SECRET>`).
9. **Phone-OTP (deferred, optional):** `POST /api/auth/otp/request` then `/verify` — the code prints
   to the `npm run dev` console (dev stub). Real SMS-OTP login lands later.

### Tests & CI
`npm test` runs the [vitest](https://vitest.dev) unit suite (pure pHash + moderation logic —
`hammingDistance`, `isDuplicate`, `dHash`, `flagsForListing`; no DB needed). `npm run test:watch`
for TDD. GitHub Actions ([.github/workflows/ci.yml](./.github/workflows/ci.yml)) runs
**lint + typecheck + test** on every push to `main` and every PR.

### Verified
- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ (48 tests) · `npm run build` ✅.

### Implemented vs. TODO
- **Wired:** **email + password auth** (`/login` — register/login/logout, JWT session cookie +
  `/api/me`), phone-OTP request/verify (dev stub) + dev-login (both kept for later),
  **post-a-listing UI** (`/post` → draft → submit for review), **media pipeline** (upload → EXIF
  strip → WebP + blur placeholder → pHash/dup-reject; gallery + search thumbnails), **moderation
  queue** (`/admin/moderation` — submit → pending → approve/reject + reason, auto-flags),
  **search UX** (locality autocomplete + synced Leaflet map/list + filter-sort bar + load-more
  pagination + "search this area"), **listing detail** (SSR — gallery, key facts, amenities,
  mini-map, similar homes), **SEO baseline** (per-listing metadata +
  schema.org JSON-LD, `sitemap.xml`, `robots.txt`), **contact → enquiry + phone reveal**, **dashboard** (`/dashboard` — lister: my listings +
  enquiries received + respond; buyer: **saved homes** + enquiries I've sent), **auto-expiry job**
  (`/api/cron/expire-listings`), landing search UI, sample-data seed.
- **TODO (see build plan):** real SMS/OTP login, real CDN for media, PostGIS bbox/radius search +
  pg_trgm autocomplete, saved-search alerts, anti-fraud scoring + rate limits. Marked with `TODO`
  in code.

## Status
🏗️ **Planning docs complete + MVP scaffold building.** See
[docs/build-plan-phase1.md](./docs/build-plan-phase1.md) for the week-by-week plan.
