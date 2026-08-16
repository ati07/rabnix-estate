-- Rabnix Estate — Reference Data Model
-- Version: 1.0.0 · Status: Draft · Last updated: 2026-08-16
-- Target: PostgreSQL 15+ with PostGIS. Illustrative reference, not a final migration.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- typo-tolerant locality autocomplete

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
CREATE TYPE user_role        AS ENUM ('buyer', 'owner', 'agent', 'admin');
CREATE TYPE listing_intent   AS ENUM ('sale', 'rent');
CREATE TYPE property_type     AS ENUM ('apartment', 'independent_house', 'villa', 'plot', 'commercial', 'pg');
CREATE TYPE listing_status    AS ENUM ('draft', 'pending', 'live', 'expired', 'rejected');
CREATE TYPE furnishing_type   AS ENUM ('unfurnished', 'semi_furnished', 'furnished');
CREATE TYPE enquiry_channel   AS ENUM ('call', 'form', 'whatsapp');
CREATE TYPE verification_tier AS ENUM ('phone', 'document', 'physical');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed');

-- ─────────────────────────────────────────────────────────────
-- Geography
-- ─────────────────────────────────────────────────────────────
CREATE TABLE cities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    state       TEXT,
    geo         GEOGRAPHY(POINT, 4326),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE localities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id     UUID NOT NULL REFERENCES cities(id),
    name        TEXT NOT NULL,
    aliases     TEXT[] NOT NULL DEFAULT '{}',           -- Baner / Baaner / Banner
    boundary    GEOGRAPHY(POLYGON, 4326),               -- locality-boundary search
    centroid    GEOGRAPHY(POINT, 4326),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_localities_boundary  ON localities USING GIST (boundary);
CREATE INDEX idx_localities_name_trgm ON localities USING GIN (name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone          TEXT UNIQUE NOT NULL,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    email          TEXT UNIQUE,
    full_name      TEXT,
    role           user_role NOT NULL DEFAULT 'buyer',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- Listings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE listings (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id      UUID NOT NULL REFERENCES users(id),
    intent        listing_intent NOT NULL,
    property_type property_type NOT NULL,
    status        listing_status NOT NULL DEFAULT 'draft',
    title         TEXT,
    description   TEXT,
    price         NUMERIC(14,2) NOT NULL,                -- sale price or monthly rent
    area_sqft     INTEGER,
    bedrooms      SMALLINT,                              -- BHK
    bathrooms     SMALLINT,
    floor         SMALLINT,
    furnishing    furnishing_type,
    amenities     TEXT[] NOT NULL DEFAULT '{}',
    locality_id   UUID REFERENCES localities(id),
    geo           GEOGRAPHY(POINT, 4326) NOT NULL,       -- map-bounds & radius search
    quality_score NUMERIC(4,2) NOT NULL DEFAULT 0,       -- completeness + verification (ranking)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '45 days'  -- structural freshness
);
CREATE INDEX idx_listings_geo        ON listings USING GIST (geo);
CREATE INDEX idx_listings_search     ON listings (status, intent, property_type, price, bedrooms);
CREATE INDEX idx_listings_locality   ON listings (locality_id) WHERE status = 'live';
CREATE INDEX idx_listings_expiry     ON listings (expires_at) WHERE status = 'live';

CREATE TABLE listing_media (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    phash       TEXT,                                   -- perceptual hash for dup detection
    width       INTEGER,
    height      INTEGER,
    ord         SMALLINT NOT NULL DEFAULT 0,
    is_primary  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_listing ON listing_media (listing_id);
CREATE INDEX idx_media_phash   ON listing_media (phash);

-- ─────────────────────────────────────────────────────────────
-- Demand-side engagement
-- ─────────────────────────────────────────────────────────────
CREATE TABLE enquiries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id          UUID NOT NULL REFERENCES listings(id),
    buyer_id            UUID NOT NULL REFERENCES users(id),
    channel             enquiry_channel NOT NULL,
    message             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    lister_responded_at TIMESTAMPTZ                     -- powers response-rate guardrail
);
CREATE INDEX idx_enquiries_listing ON enquiries (listing_id);
CREATE INDEX idx_enquiries_buyer   ON enquiries (buyer_id);

CREATE TABLE favorites (
    user_id     UUID NOT NULL REFERENCES users(id),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE saved_searches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    query_json      JSONB NOT NULL,                     -- serialized filter state
    alert_frequency TEXT NOT NULL DEFAULT 'daily',      -- instant | daily | weekly | off
    last_notified_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_searches_user ON saved_searches (user_id);

-- ─────────────────────────────────────────────────────────────
-- Trust & moderation
-- ─────────────────────────────────────────────────────────────
CREATE TABLE verifications (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tier         verification_tier NOT NULL,
    status       verification_status NOT NULL DEFAULT 'pending',
    verified_by  UUID REFERENCES users(id),             -- moderator/admin
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_verifications_listing ON verifications (listing_id);

CREATE TABLE moderation_events (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    action        TEXT NOT NULL,                        -- approve | reject | flag | demote
    moderator_id  UUID REFERENCES users(id),
    reason        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_moderation_listing ON moderation_events (listing_id);

-- Changelog
-- 1.0.0 (2026-08-16) — Initial reference schema.
