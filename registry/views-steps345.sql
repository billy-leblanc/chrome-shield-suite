CREATE VIEW freshness_summary AS
SELECT
  COUNT(*)                                        AS entities_with_lead,
  ROUND(AVG(lead_hours_feed), 1)                  AS avg_lead_hours,
  ROUND(MEDIAN_LEAD.median, 1)                    AS median_lead_hours,
  SUM(CASE WHEN lead_hours_feed > 0 THEN 1 ELSE 0 END) AS beat_public_feed,
  ROUND(AVG(alive_hours), 1)                      AS avg_alive_hours
FROM entities
CROSS JOIN (
  -- SQLite has no MEDIAN(); approximate via the middle ordered row
  SELECT AVG(lead_hours_feed) AS median FROM (
    SELECT lead_hours_feed FROM entities
    WHERE lead_hours_feed IS NOT NULL
    ORDER BY lead_hours_feed
    LIMIT 2 - (SELECT COUNT(*) FROM entities WHERE lead_hours_feed IS NOT NULL) % 2
    OFFSET (SELECT (COUNT(*) - 1) / 2 FROM entities WHERE lead_hours_feed IS NOT NULL)
  )
) AS MEDIAN_LEAD
WHERE entities.lead_hours_feed IS NOT NULL;

-- ─── STEP 5: CONSENT-SAFE AGGREGATES ─────────────────────────────────────────
-- Sellable INSIGHTS, never individual rows. The k-anonymity floor (HAVING
-- COUNT >= 5) ensures no bucket is small enough to re-identify anyone.

-- Technique prevalence — "what scams are trending" (sellable trend product)
CREATE VIEW agg_technique_prevalence AS
SELECT
  json_each.value           AS technique,
  COUNT(*)                  AS detections,
  COUNT(DISTINCT entity_id) AS distinct_entities,
  strftime('%Y-%W', occurred_hour) AS iso_week
FROM detections, json_each(detections.techniques)
WHERE env = 'prod'
GROUP BY technique, iso_week
HAVING COUNT(*) >= 5;            -- k-anonymity floor

-- Impersonated-brand distribution — the brand-protection buyer's core query
CREATE VIEW agg_brand_targets AS
SELECT
  e.impersonates            AS brand,
  COUNT(*)                  AS entity_count,
  strftime('%Y-%W', en.enriched_at) AS iso_week
FROM entities e
JOIN enrichments en ON en.entity_id = e.id
WHERE e.impersonates IS NOT NULL
GROUP BY brand, iso_week
HAVING COUNT(*) >= 5;

-- Platform distribution of scam delivery — "where fraud shows up"
CREATE VIEW agg_platform_distribution AS
SELECT
  platform_cat,
  COUNT(*)                  AS detections,
  strftime('%Y-%W', occurred_hour) AS iso_week
FROM detections
WHERE env = 'prod'
GROUP BY platform_cat, iso_week
HAVING COUNT(*) >= 5;

-- Campaign scale summary — proof the attribution is producing real clusters
CREATE VIEW agg_campaign_scale AS
SELECT
  COUNT(*)                       AS total_campaigns,
  ROUND(AVG(size), 1)            AS avg_entities_per_campaign,
  MAX(size)                      AS largest_campaign,
  top_brand,
  COUNT(*)                       AS campaigns_for_brand
FROM campaigns
GROUP BY top_brand
HAVING COUNT(*) >= 1;

