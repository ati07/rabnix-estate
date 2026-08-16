# Rabnix Estate — Documentation

This folder holds the living product & engineering plans. Treat these as **versioned artifacts**,
not throwaway notes.

## Versioning convention
Every planning doc starts with a header block:

```
> **Version:** 1.0.0 · **Status:** Draft · **Last updated:** 2026-08-16 · **Owner:** Product
```

- **Version** — semantic:
  - **MAJOR** — direction/strategy change (e.g., pivot in positioning or scope).
  - **MINOR** — new section, feature, or meaningful addition.
  - **PATCH** — clarifications, typos, small edits.
- **Status** — `Draft` → `In Review` → `Approved` → `Superseded`.
- Bump the version in the doc header **and** add a line to [CHANGELOG.md](./CHANGELOG.md) on every change.

## Index
| Doc | Version | Purpose |
|-----|---------|---------|
| [PRD.md](./PRD.md) | 1.0.0 | Product requirements |
| [system-design.md](./system-design.md) | 1.0.0 | Technical architecture |
| [roadmap.md](./roadmap.md) | 1.0.0 | Long-term strategy |
| [data-model.sql](./data-model.sql) | 1.0.0 | Reference schema |
| [api-contract.md](./api-contract.md) | 1.0.0 | API surface |
| [build-plan-phase1.md](./build-plan-phase1.md) | 1.0.0 | Week-by-week MVP plan |

## Architecture Decision Records
Significant, hard-to-reverse decisions get an ADR in [`decisions/`](./decisions). One decision per
file, numbered sequentially, immutable once `Accepted` (supersede rather than edit).
