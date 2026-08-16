# ADR-0001: Start with a modular monolith, not microservices

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** Engineering, Product

## Context
We are building a two-sided real-estate marketplace MVP with a small team (2–4 engineers). We must
reach marketplace liquidity in one city quickly. Architecture choices should optimize for speed of
iteration and low operational overhead, not hypothetical scale.

## Decision
Build a **modular monolith**: a single deployable application with strong internal module boundaries
(Listings, Search, Enquiry, Auth, Media, Moderation). Modules communicate in-process through clear
interfaces; no cross-module database access. Async work (image processing, indexing, alerts,
moderation scoring) runs on a queue with workers.

## Consequences
**Positive**
- Fastest path to a working product; one deploy, one repo, simple local dev.
- Low ops burden — no service mesh, no distributed tracing complexity, minimal infra.
- Clean module seams mean we can extract a service later *if and when* scale demands it.

**Negative / risks**
- Requires discipline to keep boundaries clean (no reaching across module internals).
- A single scaling unit — mitigated at MVP scale by managed hosting + horizontal replicas.

## Alternatives considered
- **Microservices from day one** — rejected: pure cost at MVP scale, slows iteration, needs platform
  work we can't justify pre-liquidity.
- **Serverless-function-per-endpoint** — rejected for the core API: cold starts and fragmented data
  access hurt the search-heavy workload; we still use async workers for background jobs.

## Revisit when
- Sustained traffic makes independent scaling of search or media economically worthwhile, or
- Team grows enough that module ownership boundaries would benefit from separate deploy cadences.
