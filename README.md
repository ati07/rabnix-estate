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
```bash
npm install
copy .env.example .env         # DATABASE_URL default matches docker-compose below
docker compose up -d           # local Postgres + PostGIS on :5432
npm run db:generate            # prisma client
npm run db:push                # create tables
npm run db:seed                # launch city + localities + 4 sample listings
npm run dev                    # http://localhost:3000
```
Without a database the UI still renders; API routes return a clear "database not configured" error.

### Local testing — what to try
1. **Search UI:** open http://localhost:3000, search locality `Wakad`/`Baner`/`Hinjewadi`/`Kharadi`
   → results grid → click a card → SSR listing detail.
2. **Search API:** `GET http://localhost:3000/api/listings/search?intent=rent&bhk=2`
3. **OTP + session (curl / REST client):**
   ```bash
   # 1) request code — printed to the `npm run dev` server console (dev stub)
   curl -X POST localhost:3000/api/auth/otp/request -H "content-type: application/json" -d "{\"phone\":\"+919990001234\"}"
   # 2) verify with the code from the console → sets httpOnly session cookie
   curl -X POST localhost:3000/api/auth/otp/verify  -H "content-type: application/json" -d "{\"request_id\":\"<id>\",\"code\":\"<code>\"}" -c cookies.txt
   # 3) who am I — uses the cookie
   curl localhost:3000/api/me -b cookies.txt
   ```
4. **Create a listing (draft):** `POST /api/listings` with `ownerId` (from step 3), `intent`,
   `propertyType`, `price`, `lat`, `lng`.

No Docker? Point `DATABASE_URL` at a free Neon/Supabase Postgres (enable the `postgis` extension) and
skip the `docker compose` step.

### Verified
- `npm run typecheck` ✅ · `npm run build` ✅ (7 routes compile: landing, listing detail, OTP
  request/verify, listings create, listings search).

### Implemented vs. TODO
- **Wired:** phone-OTP request/verify (dev stub), **JWT session cookie + `/api/me`**, listing
  create (draft), listing search (filters + cursor pagination), **search results page**, listing
  detail (SSR), landing search UI, **sample-data seed**, **docker-compose Postgres+PostGIS**.
- **TODO (see build plan):** real SMS provider, media upload + pHash, OTP-gated contact reveal,
  moderation queue, map+list synced results UI, saved searches. Marked with `TODO` in code.

## Status
🏗️ **Planning docs complete + MVP scaffold building.** See
[docs/build-plan-phase1.md](./docs/build-plan-phase1.md) for the week-by-week plan.
