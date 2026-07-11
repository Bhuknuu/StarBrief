-- ══════════════════════════════════════════════════════════
-- StarBrief  -  Initial Schema Migration
-- Database: Neon PostgreSQL (free tier)
-- Run: psql $DATABASE_URL -f db/migrations/001_initial.sql
-- ══════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Main Opportunity Table ──────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    organization    TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN (
                        'internship', 'hackathon', 'workshop',
                        'conference', 'open_source', 'research'
                    )),

    -- Temporal
    discovered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline        TIMESTAMPTZ,
    event_date      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,

    -- Location
    location        TEXT,
    geo_scope       TEXT CHECK (geo_scope IN ('local', 'pan_india', 'global')),
    is_remote       BOOLEAN DEFAULT FALSE,

    -- Requirements
    min_year        INTEGER,
    max_year        INTEGER,
    skills_required TEXT[],
    is_paid         BOOLEAN,
    stipend_range   TEXT,
    is_female_exclusive BOOLEAN DEFAULT FALSE,

    -- Links (MANDATORY)
    source_url      TEXT NOT NULL,
    apply_url       TEXT,
    source_name     TEXT NOT NULL,

    -- Content
    raw_description TEXT,
    summary         TEXT,
    content_hash    TEXT,

    -- Scoring
    base_relevance  FLOAT DEFAULT 0.0,

    -- Status
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN (
                        'active', 'deadline_approaching', 'expired',
                        'cancelled', 'updated', 'unverified'
                    )),
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    url_valid       BOOLEAN DEFAULT TRUE,

    -- Constraints
    UNIQUE(source_url)
);

-- ─── Change Log ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunity_changes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    field_name      TEXT NOT NULL,
    old_value       TEXT,
    new_value       TEXT
);

-- ─── Discovery Queue ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS discovery_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT NOT NULL UNIQUE,
    source_name     TEXT NOT NULL,
    discovered_at   TIMESTAMPTZ DEFAULT NOW(),
    context         TEXT,
    processed       BOOLEAN DEFAULT FALSE,
    processed_at    TIMESTAMPTZ
);

-- ─── Scraper Health Tracking ─────────────────────────────

CREATE TABLE IF NOT EXISTS scraper_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraper_name    TEXT NOT NULL,
    run_type        TEXT CHECK (run_type IN ('daily', 'weekly')),
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    items_found     INTEGER DEFAULT 0,
    items_new       INTEGER DEFAULT 0,
    items_updated   INTEGER DEFAULT 0,
    items_expired   INTEGER DEFAULT 0,
    errors          TEXT[],
    status          TEXT CHECK (status IN ('running', 'success', 'failed'))
);

-- ─── User Profiles ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT UNIQUE,
    year_of_study   INTEGER,
    graduation_year INTEGER,
    degree          TEXT,
    interests       JSONB NOT NULL DEFAULT '{}',
    filters         JSONB NOT NULL DEFAULT '{}',
    notification_prefs JSONB NOT NULL DEFAULT '{}',
    scoring_weights JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── User-Opportunity Scores ─────────────────────────────

CREATE TABLE IF NOT EXISTS user_opportunity_scores (
    user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    opportunity_id  UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    relevance_score FLOAT NOT NULL,
    priority        TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    is_dismissed    BOOLEAN DEFAULT FALSE,
    is_saved        BOOLEAN DEFAULT FALSE,
    computed_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, opportunity_id)
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_opps_status      ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opps_category    ON opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opps_deadline    ON opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opps_discovered  ON opportunities(discovered_at);
CREATE INDEX IF NOT EXISTS idx_opps_source      ON opportunities(source_name);
CREATE INDEX IF NOT EXISTS idx_scores_user      ON user_opportunity_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_priority  ON user_opportunity_scores(priority);
CREATE INDEX IF NOT EXISTS idx_queue_processed  ON discovery_queue(processed);

-- ─── Seed Default Profile (Developer) ──────────────────────

INSERT INTO user_profiles (name, email, year_of_study, graduation_year, degree, interests, filters, notification_prefs, scoring_weights)
VALUES (
    'Developer',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"primary":["AI","ML","NLP","LLM","Deep Learning","Data Science","ANN","CNN","Computer Vision","Generative AI","Reinforcement Learning","Natural Language Processing","Transformers"],"secondary":["Hackathons","Open Source","Research","Competitive Programming"],"negative":["Full Stack","Frontend Development","WordPress","Marketing","Sales","HR"]}',
    '{"locations":[],"paid_only":false,"female_exclusive":false,"min_stipend":null,"excluded_companies":["SSZONE Technologies"],"target_companies":[]}',
    '{"channels":["web_push"],"frequency":"daily_digest","digest_time":"08:00","quiet_hours":{"start":"22:00","end":"07:00"},"min_priority":"medium"}',
    '{"field_match":0.40,"deadline_urgency":0.25,"organization_prestige":0.20,"compensation":0.15}'
)
ON CONFLICT DO NOTHING;
