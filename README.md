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
cp .env.example .env          # set DATABASE_URL (Postgres + PostGIS), tweak the launch-city vars
npm run db:generate           # prisma client
npm run db:push               # create tables
npm run db:seed               # seed launch city + localities
npm run dev                   # http://localhost:3000
```
Without a database the UI still renders; API routes return a clear "database not configured" error.

### Verified
- `npm run typecheck` ✅ · `npm run build` ✅ (7 routes compile: landing, listing detail, OTP
  request/verify, listings create, listings search).

### Implemented vs. TODO
- **Wired:** phone-OTP request/verify (dev stub logs code to console), listing create (draft),
  listing search (filters + cursor pagination), listing detail (SSR), landing search UI.
- **TODO (see build plan):** JWT sessions, media upload + pHash, OTP-gated contact reveal,
  moderation queue, map+list results UI, saved searches. Marked with `TODO` in code.

## Status
🏗️ **Planning docs complete + MVP scaffold building.** See
[docs/build-plan-phase1.md](./docs/build-plan-phase1.md) for the week-by-week plan.
