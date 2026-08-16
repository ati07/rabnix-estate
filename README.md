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
1. **Search UI:** open http://localhost:3000, search locality `Wakad`/`Baner`/`Hinjewadi`/`Kharadi`
   → results grid → click a card → SSR listing detail.
2. **Search API:** `GET http://localhost:3000/api/listings/search?intent=rent&bhk=2`
3. **Sign in / register:** open **/login** → "Create account" (email + password; pick buyer or
   owner) → you're signed in (nav shows your name + **Log out**). API equivalent:
   ```bash
   # register (or /api/auth/login with an existing account) → sets httpOnly session cookie
   curl -X POST localhost:3000/api/auth/register -H "content-type: application/json" -d "{\"email\":\"me@test.com\",\"password\":\"secret123\",\"role\":\"buyer\"}" -c cookies.txt
   curl localhost:3000/api/me -b cookies.txt
   ```
4. **Contact loop:** signed in, open a listing → **Contact lister** → records an enquiry and reveals
   the lister's phone (`POST /api/listings/:id/contact`).
5. **Post a property:** signed in as an owner, open **/post** → fill the form → **Publish** → you land
   on the new live listing, which now appears in search.
6. **Lister dashboard:** as the owner, open **/dashboard** → see your listings (status + enquiry
   counts) and enquiries received → **Mark responded** on an enquiry (sets `listerRespondedAt`, the
   response-rate guardrail).
7. **Phone-OTP (deferred, optional):** `POST /api/auth/otp/request` then `/verify` — the code prints
   to the `npm run dev` console (dev stub). Real SMS-OTP login lands later.

### Verified
- `npm run typecheck` ✅ · `npm run build` ✅ (7 routes compile: landing, listing detail, OTP
  request/verify, listings create, listings search).

### Implemented vs. TODO
- **Wired:** **email + password auth** (`/login` — register/login/logout, JWT session cookie +
  `/api/me`), phone-OTP request/verify (dev stub) + dev-login (both kept for later),
  **post-a-listing UI** (`/post` → draft → publish), listing search (filters + cursor
  pagination), search results page, listing detail (SSR), **contact → enquiry + phone reveal**,
  **lister dashboard** (`/dashboard` — my listings + enquiries received + respond),
  landing search UI, sample-data seed.
- **TODO (see build plan):** real SMS/OTP login, media upload + pHash, moderation queue, map+list
  synced results UI, buyer dashboard, saved searches. Marked with `TODO` in code.

## Status
🏗️ **Planning docs complete + MVP scaffold building.** See
[docs/build-plan-phase1.md](./docs/build-plan-phase1.md) for the week-by-week plan.
