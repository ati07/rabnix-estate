# API Contract (Sketch) — Rabnix Estate

> **Version:** 1.0.0 · **Status:** Draft · **Last updated:** 2026-08-16 · **Owner:** Engineering

Illustrative REST surface for the MVP. Conventions: JSON, cursor pagination, ISO-8601 timestamps,
auth via bearer JWT (issued after phone-OTP). `POST` bodies show required fields only.

## Auth
```
POST /auth/otp/request        { phone }                       → 202 { request_id }
POST /auth/otp/verify         { request_id, code }            → 200 { token, user }
GET  /me                                                      → 200 { user }
```

## Localities & search (public)
```
GET  /localities/autocomplete?q=ban&city=<id>                → 200 [{ id, name, city }]
GET  /listings/search
        ?intent=rent&locality=<id>&type=apartment
        &price_min=&price_max=&bhk=2&sort=relevance
        &bbox=<minLng,minLat,maxLng,maxLat>&cursor=          → 200 { results[], next_cursor, facets }
GET  /listings/:id                                           → 200 { listing, media[], similar[] }
```
- `bbox` drives map-synced results; omit for locality/filter-only search.
- `sort`: `relevance` (default) | `price_asc` | `price_desc` | `newest`.

## Listings (auth: owner/agent)
```
POST  /listings              { intent, property_type, price, geo, locality_id, ... } → 201 { listing } (status=draft)
PATCH /listings/:id          { ...partial }                 → 200 { listing }   (autosave)
POST  /listings/:id/media    (multipart)                    → 201 { media }
POST  /listings/:id/submit                                  → 200 { listing }   (draft → pending)
POST  /listings/:id/renew                                   → 200 { listing }   (extends expires_at)
GET   /me/listings                                          → 200 { results[] }
```

## Contact & enquiries
```
POST /listings/:id/contact   { channel }                    → 200 { phone } | 401 (login/OTP required)
GET  /me/enquiries?role=buyer|lister                        → 200 { results[] }
POST /enquiries/:id/respond                                 → 200 { enquiry }  (sets lister_responded_at)
```

## Favorites & saved searches
```
PUT    /favorites/:listingId                                → 204
DELETE /favorites/:listingId                                → 204
GET    /me/favorites                                        → 200 { results[] }
POST   /saved-searches       { query_json, alert_frequency } → 201 { saved_search }
GET    /me/saved-searches                                   → 200 { results[] }
```

## Moderation (auth: admin)
```
GET  /admin/moderation/queue?status=pending                 → 200 { results[] }
POST /admin/listings/:id/approve                            → 200 { listing }  (→ live)
POST /admin/listings/:id/reject      { reason }             → 200 { listing }
POST /admin/listings/:id/verify      { tier }               → 200 { verification }
```

## Error shape
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "price": "required" } } }
```

## Changelog
- **1.0.0** (2026-08-16) — Initial API sketch.
