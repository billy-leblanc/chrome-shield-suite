-- Safety Intercept Registry — D1 Schema v0.1
-- Design rules baked in from the telemetry audit (Jun 2026):
--   1. env flag on every event; only env='prod' can ever feed a page
--   2. Pages key off ENTITIES (scam-side), never off victim-side data
--   3. Publication requires corroboration_count >= threshold AND allowlist check
--   4. Idempotency via deterministic event_key (dedupes the 177613 problem)

-- The scam-side subject of a page: a domain, email address, or phone number
CREATE TABLE entities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('domain','email','phone')),
  entity_value  TEXT NOT NULL,              -- normalized: lowercase, punycode-decoded, E.164 for phones
  first_seen    TEXT NOT NULL,              -- ISO 8601, rounded to hour (privacy)
  last_seen     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'unreviewed'
                CHECK (status IN ('unreviewed','published','disputed','delisted','allowlisted')),
  max_score     INTEGER NOT NULL DEFAULT 0,
  corroborations INTEGER NOT NULL DEFAULT 0, -- count of INDEPENDENT sources, not raw events
  UNIQUE (entity_type, entity_value)
);

-- Legit-domain firewall. Seeded from Tranco top-10k + payment/bank senders.
-- An entity matching this table can NEVER reach status='published'.
-- (This is the cash@square.com false-positive fix, made structural.)
CREATE TABLE allowlist (
  pattern       TEXT PRIMARY KEY,            -- exact domain or email; no wildcards in v0
  reason        TEXT,
  added_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per detection event, post-sanitization. NO victim-side fields exist here.
CREATE TABLE detections (
  event_key     TEXT PRIMARY KEY,            -- sha256(source + entity + technique_set + hour_bucket): idempotent
  entity_id     INTEGER NOT NULL REFERENCES entities(id),
  env           TEXT NOT NULL CHECK (env IN ('prod','test')),
  source        TEXT NOT NULL CHECK (source IN ('extension','ct_scan','openphish','urlhaus','submission','manual')),
  score         INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  severity      TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  techniques    TEXT NOT NULL,               -- JSON array of taxonomy slugs
  platform_cat  TEXT,                        -- generic category ('p2p_payment','email','marketplace') — never user's specific bank
  occurred_hour TEXT NOT NULL,               -- ISO 8601 truncated to hour; precise timestamps stay client-side
  evidence_key  TEXT,                        -- R2 key for scam-side snapshot (screenshot/HTML of the SCAM page only)
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_detections_entity ON detections(entity_id, env);

-- Controlled technique taxonomy (the dashboard's free-text tags normalize into this)
CREATE TABLE techniques (
  slug          TEXT PRIMARY KEY,            -- 'family-emergency-impersonation'
  display_name  TEXT NOT NULL,
  category      TEXT NOT NULL,               -- 'social-engineering','phishing','crypto','employment','extortion'
  description   TEXT NOT NULL                -- plain-English explainer reused across pages
);

-- Published pages. A page row may exist ONLY if its entity passes the publish gate.
CREATE TABLE pages (
  entity_id     INTEGER PRIMARY KEY REFERENCES entities(id),
  slug          TEXT NOT NULL UNIQUE,        -- 'check/orcaspins.com'
  verdict_tier  TEXT NOT NULL CHECK (verdict_tier IN ('high-risk-indicators','suspicious-indicators','under-review')),
  -- NOTE: tiers use probabilistic language by design. There is no 'scam' tier. (Legal §9.)
  published_at  TEXT NOT NULL,
  last_built    TEXT NOT NULL,
  dispute_open  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE disputes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id     INTEGER NOT NULL REFERENCES entities(id),
  contact_email TEXT NOT NULL,
  claim_text    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','upheld','rejected')),
  opened_at     TEXT NOT NULL DEFAULT (datetime('now')),
  sla_due       TEXT NOT NULL                -- opened_at + 72h; page shows 'disputed' banner while open
);

-- Publish gate, as a view the page builder reads. Encodes every audit finding:
--   prod-only, allowlist-blocked, corroboration >= 2, score floor, no open delisting
CREATE VIEW publishable_entities AS
SELECT e.*
FROM entities e
WHERE e.status NOT IN ('delisted','allowlisted')
  AND e.corroborations >= 2
  AND e.max_score >= 70
  AND NOT EXISTS (SELECT 1 FROM allowlist a WHERE a.pattern = e.entity_value)
  AND NOT EXISTS (SELECT 1 FROM shared_infra s
                  WHERE e.entity_value = s.suffix OR e.entity_value LIKE '%.' || s.suffix)
  AND EXISTS (SELECT 1 FROM detections d WHERE d.entity_id = e.id AND d.env = 'prod');
