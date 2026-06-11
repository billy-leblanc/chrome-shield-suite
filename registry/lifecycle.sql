-- Lifecycle tracker (Phase 2.3): periodic re-checks of known entities.
-- Accumulates the "detected X hours before takedown" metric — cannot be backfilled.
CREATE TABLE IF NOT EXISTS lifecycle_checks (
  entity_id   INTEGER NOT NULL REFERENCES entities(id),
  checked_at  TEXT NOT NULL DEFAULT (datetime('now')),
  dns_alive   INTEGER NOT NULL,            -- A record still resolves
  http_alive  INTEGER NOT NULL,            -- page still responds (2xx/3xx)
  PRIMARY KEY (entity_id, checked_at)
);
CREATE INDEX IF NOT EXISTS idx_lifecycle_entity ON lifecycle_checks(entity_id, checked_at);
