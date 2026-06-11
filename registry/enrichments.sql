CREATE TABLE enrichments (
  entity_id      INTEGER PRIMARY KEY REFERENCES entities(id),
  registrar      TEXT,
  registered_at  TEXT,
  domain_age_days INTEGER,
  nameservers    TEXT,   -- JSON array
  a_records      TEXT,   -- JSON array; index for campaign clustering
  impersonates   TEXT,   -- brand slug; index for brand-protection queries
  payment_rails  TEXT,   -- JSON
  content_sha256 TEXT,   -- index for clone matching
  enriched_at    TEXT NOT NULL
);
CREATE INDEX idx_enrich_brand ON enrichments(impersonates);
CREATE INDEX idx_enrich_fingerprint ON enrichments(content_sha256);
