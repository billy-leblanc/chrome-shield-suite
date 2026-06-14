/**
 * campaigns.ts — Campaign attribution (the feed-value multiplier)
 *
 * Clusters scam entities that share infrastructure into a single campaign,
 * turning "50 loose domains" into "1 actor running 50 domains" — which is
 * what moves a feed from $5k to $50k. Pure scam-side: operates only on
 * enrichment fields (ASN, nameservers, cert hash, kit fingerprint, wallet
 * addresses). No user data touches this.
 *
 * Clustering = union-find over entities sharing any strong infrastructure
 * signal. Signals are weighted; a link forms only at/above a confidence floor
 * so unrelated domains on Cloudflare (AS13335) don't collapse into one mega-
 * cluster. That shared-host false-merge is the main failure mode, so hosting
 * alone is deliberately weak.
 */

export interface EntityInfra {
  entityId: number;
  asn?: string;
  nameservers?: string[];
  cert_sha256?: string;
  content_sha256?: string;       // phishing-kit skeleton
  wallets?: string[];            // btc+eth+handles, scam-side payment rails
}

// Signal weights → link confidence. A shared wallet or kit fingerprint is
// near-proof of one actor; a shared ASN is near-meaningless alone.
const WEIGHTS = {
  wallet: 1.0,          // reused payment address = same operator, effectively always
  content_sha256: 0.9,  // identical kit skeleton = same builder/operator
  cert_sha256: 0.7,     // shared cert = shared deployment
  nameserver: 0.4,      // shared NS = correlated but commodity providers dilute
  asn: 0.15,            // shared host = weak; Cloudflare/Namecheap host millions
} as const;

const LINK_FLOOR = 0.7;   // a single 0.7+ signal, OR stacked weaker ones, forms a link

// Commodity infra that must NEVER form a link on its own (anti-false-merge).
const COMMODITY_ASNS = new Set(['AS13335', 'AS16509', 'AS15169', 'AS14061', 'AS20473']); // CF, AWS, GCP, DO, Vultr
const COMMODITY_NS = [/cloudflare/i, /namecheap/i, /godaddy/i, /googledomains/i, /amazonaws/i];

const isCommodityNs = (ns: string) => COMMODITY_NS.some(re => re.test(ns));

/** Pairwise link confidence between two entities from shared infra signals. */
export function linkConfidence(a: EntityInfra, b: EntityInfra): number {
  let conf = 0;

  // Wallet reuse — strongest signal
  if (a.wallets?.length && b.wallets?.length) {
    if (a.wallets.some(w => b.wallets!.includes(w))) conf = Math.max(conf, WEIGHTS.wallet);
  }
  // Identical kit fingerprint
  if (a.content_sha256 && a.content_sha256 === b.content_sha256) conf = Math.max(conf, WEIGHTS.content_sha256);
  // Shared TLS cert
  if (a.cert_sha256 && a.cert_sha256 === b.cert_sha256) conf = Math.max(conf, WEIGHTS.cert_sha256);
  // Shared NON-commodity nameserver
  if (a.nameservers?.length && b.nameservers?.length) {
    const shared = a.nameservers.filter(ns => b.nameservers!.includes(ns) && !isCommodityNs(ns));
    if (shared.length) conf = Math.max(conf, WEIGHTS.nameserver);
  }
  // Shared NON-commodity ASN
  if (a.asn && a.asn === b.asn && !COMMODITY_ASNS.has(a.asn)) conf = Math.max(conf, WEIGHTS.asn);

  // Stacking: NS + ASN together (both non-commodity) corroborate past the floor.
  // Two independent signals pointing at the same niche infra is a real link,
  // so their combination is boosted above either alone rather than summed flat.
  if (a.asn && a.asn === b.asn && !COMMODITY_ASNS.has(a.asn)
      && a.nameservers?.some(ns => b.nameservers?.includes(ns) && !isCommodityNs(ns))) {
    conf = Math.max(conf, LINK_FLOOR);   // corroborated weak signals = exactly at floor (links)
  }
  return conf;
}

// ── Union-Find ────────────────────────────────────────────────────────────────
class UnionFind {
  private parent = new Map<number, number>();
  find(x: number): number {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root)!;
    this.parent.set(x, root);
    return root;
  }
  union(a: number, b: number) { this.parent.set(this.find(a), this.find(b)); }
}

export interface Cluster { entityIds: number[]; signals: string[]; size: number }

/** Cluster a set of entities. O(n²) pairwise — fine for batch sizes; for the
 *  full table, block by candidate key (ASN/cert) first, then pair within blocks. */
export function clusterEntities(entities: EntityInfra[]): Cluster[] {
  const uf = new UnionFind();
  const linkSignals = new Map<number, Set<string>>();

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const conf = linkConfidence(entities[i], entities[j]);
      if (conf >= LINK_FLOOR) {
        uf.union(entities[i].entityId, entities[j].entityId);
        const root = uf.find(entities[i].entityId);
        if (!linkSignals.has(root)) linkSignals.set(root, new Set());
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (const e of entities) {
    const root = uf.find(e.entityId);
    let g = groups.get(root);
    if (!g) { g = []; groups.set(root, g); }
    g.push(e.entityId);
  }

  // Only multi-entity groups are "campaigns"; singletons stay unclustered.
  return [...groups.values()]
    .filter(ids => ids.length > 1)
    .map(ids => ({ entityIds: ids, signals: [], size: ids.length }));
}

/* D1 additions (append to schema.sql):
CREATE TABLE campaigns (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT,                       -- human/auto label, e.g. 'paypal-phish-cluster-AS-reuse'
  size        INTEGER NOT NULL DEFAULT 0,
  first_seen  TEXT NOT NULL,
  last_seen   TEXT NOT NULL,
  top_brand   TEXT,                        -- most common impersonated brand in cluster
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE entities ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id);
CREATE INDEX idx_entities_campaign ON entities(campaign_id);

-- Candidate-key blocking indexes so the recluster job doesn't scan O(n²) globally:
CREATE INDEX idx_enrich_asn  ON enrichments(asn);
CREATE INDEX idx_enrich_cert ON enrichments(cert_sha256);
*/
