-- Step 3: campaign attribution
CREATE TABLE IF NOT EXISTS campaigns (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT,
  size        INTEGER NOT NULL DEFAULT 0,
  first_seen  TEXT NOT NULL,
  last_seen   TEXT NOT NULL,
  top_brand   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE entities ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id);
CREATE INDEX IF NOT EXISTS idx_entities_campaign ON entities(campaign_id);
-- blocking indexes (real column name is tls_cert_sha256, not cert_sha256)
CREATE INDEX IF NOT EXISTS idx_enrich_cert ON enrichments(tls_cert_sha256);

-- Step 4: freshness columns
ALTER TABLE entities ADD COLUMN first_detected_at TEXT;
ALTER TABLE entities ADD COLUMN public_feed_at    TEXT;
ALTER TABLE entities ADD COLUMN taken_down_at     TEXT;
ALTER TABLE entities ADD COLUMN lead_hours_feed   REAL;
ALTER TABLE entities ADD COLUMN alive_hours       REAL;
