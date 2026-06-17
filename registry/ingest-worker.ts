/**
 * ingest-worker.ts — Registry ingestion pipeline (Cloudflare Worker)
 *
 * Two entry points:
 *   queue():     consumes detection events (extension relay + feed pollers),
 *                runs normalize.ts, writes D1 with idempotency + corroboration
 *   scheduled(): polls OpenPhish + URLhaus, publishes to the same queue —
 *                this is what gives entities their SECOND independent source,
 *                without which nothing ever passes the publish gate
 *
 * wrangler.toml additions:
 *   [[queues.producers]]  queue = "registry-events"   binding = "EVENTS"
 *   [[queues.consumers]]  queue = "registry-events"   max_batch_size = 50
 *   [[d1_databases]]      binding = "DB"  database_name = "registry"
 *   [triggers]            crons = ["0,30 * * * *"]   (every 30 min)
 */

import { normalizeEvent, type PublishableDetection } from './normalize';
import { enrichDomain, rdap } from './enrich';
import { clusterEntities, type EntityInfra } from './campaigns';

interface Env {
  DB: D1Database;
  EVENTS: Queue;
  FEED_TOKEN?: string;       // gates the licensable B2B feed API
  PREVIEW_TOKEN?: string;   // gates /preview/:domain staging route
}

type QueueMsg =
  | { kind: 'extension'; raw: Record<string, unknown> }
  | { kind: 'feed'; detection: PublishableDetection };

// ─── Queue consumer ──────────────────────────────────────────────────────────

export default {
  async queue(batch: MessageBatch<QueueMsg>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const detections =
          msg.body.kind === 'extension'
            ? await normalizeEvent(msg.body.raw)   // the ONLY path raw events take to D1
            : [msg.body.detection];

        for (const d of detections) await ingestOne(d, env);
        msg.ack();
      } catch (e) {
        console.error('ingest failure', e);
        msg.retry();
      }
    }
  },

  // ─── Feed pollers (cron) ───────────────────────────────────────────────────
  async scheduled(_ctrl: ScheduledController, env: Env): Promise<void> {
    await Promise.allSettled([pollOpenPhish(env), pollURLhaus(env), pollCT(env)]);
    // Sweeps run after pollers; each is capped per tick to stay polite to RDAP/DoH.
    await enrichSweep(env).catch(e => console.error('enrich sweep', e));
    await ageBackfillSweep(env).catch(e => console.error('age backfill', e));
    await lifecycleSweep(env).catch(e => console.error('lifecycle sweep', e));
    await reclusterSweep(env).catch(e => console.error('recluster sweep', e));
  },

  // ─── HTTP layer: STAGING page renderer + dispute intake + sitemap ──────────
  // Registry pages in shadow mode (Phase 3.3): rendered from publishable_entities
  // only, X-Robots-Tag: noindex until Phase 4 (LLC/ToS) clears. No 'scam' wording —
  // probabilistic verdict tiers only (legal §9).
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') return sitemap(env);

    // Public registry stats (aggregate counts only) — readable by the scheduled
    // age-fill check, which runs in the cloud and can't use local wrangler auth.
    if (url.pathname === '/stats') return registryStats(env);

    // Licensable B2B scam-domain feed (auth-gated). The product fintechs /
    // marketplaces / brand-protection firms pilot. Scam-side, PII-free; only
    // confirmed entities (score >= 70, not allowlisted, not shared-infra).
    if (url.pathname === '/feed') return scamFeed(request, env, url);

    const pageMatch = url.pathname.match(/^\/check\/([a-z0-9.-]{4,253})$/i);
    if (pageMatch && request.method === 'GET') return renderPage(pageMatch[1].toLowerCase(), env);

    // Auth-gated staging preview: render ANY known entity (pre-publish) to review
    // what pages look like with live enrichment + campaign data.
    const previewMatch = url.pathname.match(/^\/preview\/([a-z0-9.-]{4,253})$/i);
    if (previewMatch && request.method === 'GET') {
      const tok = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
        || url.searchParams.get('token') || '';
      if (!env.PREVIEW_TOKEN || tok !== env.PREVIEW_TOKEN) {
        return new Response('Unauthorized', { status: 401, headers: { 'X-Robots-Tag': 'noindex' } });
      }
      return renderPage(previewMatch[1].toLowerCase(), env, true);
    }

    if (url.pathname === '/dispute' && request.method === 'POST') return openDispute(request, env);

    if (url.pathname === '/') {
      return new Response('Safety Intercept Registry — staging (shadow mode)', {
        headers: { 'X-Robots-Tag': 'noindex' },
      });
    }
    return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  },
};

// ─── Core ingest ─────────────────────────────────────────────────────────────

async function ingestOne(d: PublishableDetection, env: Env): Promise<void> {
  // 1. Upsert entity. first_detected_at is stamped on insert and never moved by
  //    ON CONFLICT — it's our earliest sighting, the freshness baseline (Step 4).
  await env.DB.prepare(
    `INSERT INTO entities (entity_type, entity_value, first_seen, last_seen, max_score, first_detected_at)
     VALUES (?1, ?2, ?3, ?3, ?4, ?3)
     ON CONFLICT (entity_type, entity_value) DO UPDATE SET
       last_seen = MAX(last_seen, excluded.last_seen),
       max_score = MAX(max_score, excluded.max_score),
       first_detected_at = COALESCE(entities.first_detected_at, excluded.first_detected_at)`,
  ).bind(d.entity_type, d.entity_value, d.occurred_hour, d.score).run();

  const { id: entityId } = (await env.DB.prepare(
    `SELECT id FROM entities WHERE entity_type = ?1 AND entity_value = ?2`,
  ).bind(d.entity_type, d.entity_value).first<{ id: number }>())!;

  // 2. Insert detection — event_key PK makes double-fired beacons a no-op
  const ins = await env.DB.prepare(
    `INSERT OR IGNORE INTO detections
       (event_key, entity_id, env, source, score, severity, techniques, platform_cat, occurred_hour)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
  ).bind(
    d.event_key, entityId, d.env, d.source, d.score, d.severity,
    JSON.stringify(d.techniques), d.platform_cat, d.occurred_hour,
  ).run();
  if (ins.meta.changes === 0) return; // duplicate — nothing else to update

  // 2b. Freshness (Step 4): when an entity first appears on a PUBLIC feed, stamp
  // public_feed_at and compute our lead time over it. Positive lead = we saw it
  // before OpenPhish/URLhaus — the premium-feed headline metric.
  if (d.source === 'openphish' || d.source === 'urlhaus') {
    await env.DB.prepare(
      `UPDATE entities SET
         public_feed_at = COALESCE(public_feed_at, ?2),
         lead_hours_feed = COALESCE(
           lead_hours_feed,
           ROUND((julianday(?2) - julianday(first_detected_at)) * 24.0, 2))
       WHERE id = ?1 AND public_feed_at IS NULL`,
    ).bind(entityId, d.occurred_hour).run();
  }

  // 3. Corroboration = count of DISTINCT prod sources (not raw event count)
  const wasPublishable = await isPublishable(entityId, env);
  await env.DB.prepare(
    `UPDATE entities SET corroborations =
       (SELECT COUNT(DISTINCT source) FROM detections WHERE entity_id = ?1 AND env = 'prod')
     WHERE id = ?1`,
  ).bind(entityId).run();

  // 4. Publish-gate transition → downstream work (enrichment, page build)
  if (!wasPublishable && (await isPublishable(entityId, env))) {
    // Phase 3.3 wires this to the enrichment queue + page builder.
    // Deliberately a log-only stub until LLC/legal gate (Phase 4) clears.
    console.log(JSON.stringify({ event: 'entity_publishable', entityId, entity: d.entity_value }));
  }
}

const isPublishable = async (entityId: number, env: Env): Promise<boolean> =>
  !!(await env.DB.prepare(`SELECT 1 FROM publishable_entities WHERE id = ?1`)
    .bind(entityId).first());

// ─── Feed pollers ────────────────────────────────────────────────────────────
// Feed detections are constructed directly (already scam-side, no victim data
// to strip). Day-bucketed event_key = one row per entity per feed per day.

async function pollOpenPhish(env: Env): Promise<void> {
  const res = await fetch('https://openphish.com/feed.txt');
  if (!res.ok) return;
  const urls = (await res.text()).split('\n').filter(Boolean).slice(0, 2000);
  await publishFeedDomains(env, urls, 'openphish', ['credential-phishing']);
}

// ─── Certificate Transparency cold-start (spec §4) ───────────────────────────
// High-value brands scammers impersonate. Each tick rotates through a few and
// queries crt.sh for freshly-issued certs whose domain embeds the brand but is
// NOT the brand's own domain — i.e. live typosquats, young by definition.
const CT_BRANDS = [
  'paypal', 'coinbase', 'binance', 'wellsfargo', 'chase', 'netflix', 'amazon',
  'apple', 'microsoft', 'usps', 'fedex', 'bankofamerica', 'citibank', 'zelle',
  'venmo', 'cashapp', 'metamask', 'kraken', 'geeksquad', 'irs', 'roblox', 'bet365',
];

async function pollCT(env: Env): Promise<void> {
  const n = CT_BRANDS.length;
  const start = Math.floor(Date.now() / 1_800_000) % n; // rotate 3 brands per 30-min tick
  const brands = [CT_BRANDS[start], CT_BRANDS[(start + 1) % n], CT_BRANDS[(start + 2) % n]];
  const day = new Date().toISOString().slice(0, 10);
  const cutoff = Date.now() - 3 * 86_400_000; // certs issued in the last 3 days
  const seen = new Set<string>();
  const batch: { body: QueueMsg }[] = [];

  for (const brand of brands) {
    try {
      const r = await fetch(`https://crt.sh/?q=%25${brand}%25&output=json&exclude=expired`,
        { signal: AbortSignal.timeout(9000), headers: { 'user-agent': 'safety-intercept-registry' } });
      if (!r.ok) continue;
      const rows = await r.json() as Array<{ name_value?: string; not_before?: string }>;
      for (const c of rows) {
        const nb = Date.parse(c.not_before ?? '');
        if (!nb || nb < cutoff) continue;
        for (let name of String(c.name_value ?? '').split('\n')) {
          name = name.trim().toLowerCase().replace(/^\*\./, '');
          if (!name || seen.has(name) || !name.includes(brand)) continue;
          // skip the brand's own domain / its subdomains; keep typosquats + brand-in-other-domain
          if (name === `${brand}.com` || name.endsWith(`.${brand}.com`)) continue;
          seen.add(name);
          batch.push({ body: { kind: 'feed', detection: {
            event_key: await sha256Hex(`ct|${name}|${day}`),
            entity_type: 'domain', entity_value: name, env: 'prod', source: 'ct_scan',
            score: 72, severity: 'high',
            techniques: ['lookalike-domain'], platform_cat: 'web',
            occurred_hour: `${day}T00:00:00.000Z`,
          } } });
        }
      }
    } catch { /* crt.sh slow/down — skip this brand */ }
  }
  for (let i = 0; i < batch.length; i += 100) await env.EVENTS.sendBatch(batch.slice(i, i + 100));
  console.log(JSON.stringify({ event: 'ct_scan', brands, candidates: batch.length }));
}

async function pollURLhaus(env: Env): Promise<void> {
  // text_online = currently-live malicious URLs; lines starting with # are comments
  const res = await fetch('https://urlhaus.abuse.ch/downloads/text_online/');
  if (!res.ok) return;
  const urls = (await res.text()).split('\n')
    .filter(l => l && !l.startsWith('#')).slice(0, 2000);
  await publishFeedDomains(env, urls, 'urlhaus', ['smishing-fake-alert']);
}

async function publishFeedDomains(
  env: Env, urls: string[], source: 'openphish' | 'urlhaus', techniques: string[],
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const batch: { body: QueueMsg }[] = [];

  for (const u of urls) {
    const domain = hostnameOf(u);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);

    batch.push({
      body: {
        kind: 'feed',
        detection: {
          event_key: await sha256Hex(`${source}|${domain}|${day}`),
          entity_type: 'domain',
          entity_value: domain,
          env: 'prod',
          source,
          score: 80,            // confirmed-feed convention; extension corroboration lifts max_score
          severity: 'high',
          techniques,
          platform_cat: 'email',
          occurred_hour: `${day}T00:00:00.000Z`,
        },
      },
    });
  }
  // Queues sendBatch caps at 100 messages
  for (let i = 0; i < batch.length; i += 100) {
    await env.EVENTS.sendBatch(batch.slice(i, i + 100));
  }
}

const hostnameOf = (url: string): string | null => {
  try { return new URL(url.startsWith('http') ? url : `http://${url}`).hostname.toLowerCase(); }
  catch { return null; }
};

const sha256Hex = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
};

// ─── Enrichment sweep (Phase 2.1) ────────────────────────────────────────────
// Every cron tick: enrich up to 25 domain entities that lack an enrichments row.
// RDAP + DoH + brand matching — all free APIs, sequential to stay polite.

async function enrichSweep(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT e.id, e.entity_value FROM entities e
     LEFT JOIN enrichments x ON x.entity_id = e.id
     WHERE e.entity_type = 'domain' AND x.entity_id IS NULL
     ORDER BY e.last_seen DESC LIMIT 50`,
  ).all<{ id: number; entity_value: string }>();

  for (const row of results ?? []) {
    try {
      const en = await enrichDomain(row.entity_value);
      await env.DB.prepare(
        `INSERT OR REPLACE INTO enrichments
           (entity_id, registrar, registered_at, domain_age_days, nameservers,
            a_records, asn, tls_cert_sha256, impersonates, payment_rails,
            content_sha256, enriched_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`,
      ).bind(
        row.id, en.registrar ?? null, en.registered_at ?? null, en.domain_age_days ?? null,
        JSON.stringify(en.nameservers ?? []), JSON.stringify(en.a_records ?? []),
        en.asn ?? null, en.tls_cert_sha256 ?? null,
        en.impersonates ?? null, en.payment_rails ? JSON.stringify(en.payment_rails) : null,
        en.content_sha256 ?? null, en.enriched_at,
      ).run();
    } catch (e) {
      console.error('enrich failed', row.entity_value, e);
    }
  }
}

// ─── Paced RDAP age backfill ──────────────────────────────────────────────────
// Domain age + registrar are the strongest scam signals AND the compromised-
// legit-site safety filter for publishing. Bulk RDAP gets rate-limited, so this
// fills the backlog gently: 8 domains/tick, RDAP-only, sequential with a pause.
// ~8/tick * 48 ticks/day ≈ 384/day — the backlog drains in a few days.

async function ageBackfillSweep(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT e.id, e.entity_value FROM entities e
     JOIN enrichments en ON en.entity_id = e.id
     WHERE e.entity_type = 'domain' AND en.domain_age_days IS NULL
     ORDER BY e.last_seen DESC LIMIT 8`,
  ).all<{ id: number; entity_value: string }>();

  for (const row of results ?? []) {
    try {
      const r = await rdap(row.entity_value);
      if (r.domain_age_days != null || r.registrar) {
        await env.DB.prepare(
          `UPDATE enrichments SET domain_age_days = ?2, registrar = ?3, registered_at = ?4
           WHERE entity_id = ?1`,
        ).bind(row.id, r.domain_age_days ?? null, r.registrar ?? null, r.registered_at ?? null).run();
      }
    } catch (e) {
      console.error('age backfill failed', row.entity_value, e);
    }
    await new Promise((res) => setTimeout(res, 400)); // polite spacing
  }
}

// ─── Lifecycle tracker (Phase 2.3) ───────────────────────────────────────────
// Re-checks recently-seen entities (max 25/tick, once per ~24h each): does DNS
// still resolve, does the page still answer? Time-alive/takedown metrics accrue
// from these rows — this data cannot be backfilled.

async function lifecycleSweep(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT e.id, e.entity_value FROM entities e
     WHERE e.entity_type = 'domain'
       AND e.last_seen >= datetime('now', '-30 days')
       AND NOT EXISTS (
         SELECT 1 FROM lifecycle_checks lc
         WHERE lc.entity_id = e.id AND lc.checked_at >= datetime('now', '-1 day'))
     ORDER BY e.last_seen DESC LIMIT 25`,
  ).all<{ id: number; entity_value: string }>();

  for (const row of results ?? []) {
    let dns = 0, http = 0;
    try {
      const r = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${row.entity_value}&type=A`,
        { headers: { accept: 'application/dns-json' } },
      );
      const j: any = r.ok ? await r.json() : {};
      dns = (j.Answer ?? []).length > 0 ? 1 : 0;
    } catch { /* dns stays 0 */ }
    if (dns) {
      try {
        const r = await fetch(`http://${row.entity_value}/`, {
          method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000),
        });
        http = r.status < 400 ? 1 : 0;
      } catch { /* http stays 0 */ }
    }
    await env.DB.prepare(
      `INSERT OR IGNORE INTO lifecycle_checks (entity_id, dns_alive, http_alive) VALUES (?1, ?2, ?3)`,
    ).bind(row.id, dns, http).run();

    // Freshness (Step 4): first time an entity goes fully dark (no DNS, no HTTP),
    // stamp takedown + how many hours it stayed alive from first detection.
    if (!dns && !http) {
      await env.DB.prepare(
        `UPDATE entities SET
           taken_down_at = COALESCE(taken_down_at, datetime('now')),
           alive_hours = COALESCE(
             alive_hours,
             ROUND((julianday('now') - julianday(first_detected_at)) * 24.0, 2))
         WHERE id = ?1 AND taken_down_at IS NULL`,
      ).bind(row.id).run();
    }
  }
}

// ─── Campaign attribution (Step 3) ───────────────────────────────────────────
// Cluster entities sharing non-commodity infrastructure into campaigns. Only
// entities carrying a clusterable signal are loaded, keeping the pairwise pass
// bounded (commodity-only-ASN entities can never link, per campaigns.ts).

async function reclusterSweep(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT e.id, en.asn, en.nameservers, en.tls_cert_sha256 AS cert_sha256,
            en.content_sha256, en.payment_rails, en.impersonates
     FROM entities e JOIN enrichments en ON en.entity_id = e.id
     WHERE en.content_sha256 IS NOT NULL OR en.tls_cert_sha256 IS NOT NULL
        OR en.payment_rails IS NOT NULL OR en.asn IS NOT NULL`,
  ).all<any>();

  const brandOf = new Map<number, string | null>();
  const infra: EntityInfra[] = (results ?? []).map((r: any) => {
    brandOf.set(r.id, r.impersonates ?? null);
    let wallets: string[] = [];
    try {
      const pr = r.payment_rails ? JSON.parse(r.payment_rails) : null;
      if (pr) wallets = [...(pr.btc ?? []), ...(pr.eth ?? []), ...(pr.handles ?? [])];
    } catch { /* malformed rails */ }
    let nameservers: string[] = [];
    try { nameservers = r.nameservers ? JSON.parse(r.nameservers) : []; } catch { /* */ }
    return {
      entityId: r.id,
      asn: r.asn ?? undefined,
      nameservers,
      cert_sha256: r.cert_sha256 ?? undefined,
      content_sha256: r.content_sha256 ?? undefined,
      wallets,
    };
  });

  const clusters = clusterEntities(infra);
  const nowIso = new Date().toISOString();

  for (const c of clusters) {
    // top_brand = most common impersonated brand across cluster members
    const counts = new Map<string, number>();
    for (const id of c.entityIds) {
      const b = brandOf.get(id);
      if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    const topBrand = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const ph = c.entityIds.map(() => '?').join(',');

    // Stable identity: reuse a campaign_id already stamped on any member.
    const existing = await env.DB.prepare(
      `SELECT campaign_id FROM entities WHERE id IN (${ph}) AND campaign_id IS NOT NULL LIMIT 1`,
    ).bind(...c.entityIds).first<{ campaign_id: number }>();

    let campaignId: number;
    if (existing?.campaign_id) {
      campaignId = existing.campaign_id;
      await env.DB.prepare(
        `UPDATE campaigns SET size = ?2, last_seen = ?3, top_brand = ?4 WHERE id = ?1`,
      ).bind(campaignId, c.size, nowIso, topBrand).run();
    } else {
      const ins = await env.DB.prepare(
        `INSERT INTO campaigns (label, size, first_seen, last_seen, top_brand)
         VALUES (?1, ?2, ?3, ?3, ?4)`,
      ).bind(topBrand ? `${topBrand}-cluster` : 'infra-cluster', c.size, nowIso, topBrand).run();
      campaignId = ins.meta.last_row_id as number;
    }

    await env.DB.prepare(
      `UPDATE entities SET campaign_id = ?1 WHERE id IN (${ph})`,
    ).bind(campaignId, ...c.entityIds).run();
  }
  console.log(JSON.stringify({ event: 'recluster', clusters: clusters.length, clustered_entities: infra.length }));
}

// ─── Page renderer (Phase 3.3, staging) ──────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  'high-risk-indicators': 'High-risk indicators reported',
  'suspicious-indicators': 'Suspicious indicators reported',
  'under-review': 'Under review',
};

function tierFor(maxScore: number): string {
  return maxScore >= 85 ? 'high-risk-indicators'
    : maxScore >= 70 ? 'suspicious-indicators' : 'under-review';
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

async function renderPage(domain: string, env: Env, preview = false): Promise<Response> {
  // Live pages render ONLY from the publishable gate (prod-corroborated, not
  // allowlisted, score floor). Preview mode (auth-gated) renders any known
  // entity so we can see pages before they cross the gate — clearly watermarked.
  const ent = preview
    ? await env.DB.prepare(
        `SELECT * FROM entities WHERE entity_type = 'domain' AND entity_value = ?1`,
      ).bind(domain).first<any>()
    : await env.DB.prepare(
        `SELECT * FROM publishable_entities WHERE entity_type = 'domain' AND entity_value = ?1`,
      ).bind(domain).first<any>();
  if (!ent) return new Response('No entry', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });

  const en = await env.DB.prepare(
    `SELECT * FROM enrichments WHERE entity_id = ?1`).bind(ent.id).first<any>();
  const det = await env.DB.prepare(
    `SELECT techniques FROM detections WHERE entity_id = ?1 AND env = 'prod'`).bind(ent.id).all<any>();
  const dispute = await env.DB.prepare(
    `SELECT 1 FROM disputes WHERE entity_id = ?1 AND status = 'open' LIMIT 1`).bind(ent.id).first();

  // Campaign context: how many sibling domains share this actor's infrastructure.
  const campaign = ent.campaign_id
    ? await env.DB.prepare(
        `SELECT c.size, c.top_brand,
                (SELECT GROUP_CONCAT(entity_value, ', ') FROM
                  (SELECT entity_value FROM entities WHERE campaign_id = c.id AND id != ?2 LIMIT 6)) AS siblings
         FROM campaigns c WHERE c.id = ?1`,
      ).bind(ent.campaign_id, ent.id).first<any>()
    : null;

  const slugs = [...new Set((det.results ?? []).flatMap((d: any) => JSON.parse(d.techniques)))];
  const tech = slugs.length
    ? (await env.DB.prepare(
        `SELECT slug, display_name, description FROM techniques
         WHERE slug IN (${slugs.map(() => '?').join(',')})`,
      ).bind(...slugs).all<any>()).results ?? []
    : [];

  const tier = tierFor(ent.max_score);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(domain)} — Safety Intercept Registry</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:16px/1.5 system-ui;max-width:680px;margin:2rem auto;padding:0 1rem;color:#1a1a2e}
.tier{padding:.75rem 1rem;border-radius:8px;font-weight:600;background:${tier === 'high-risk-indicators' ? '#fee2e2;color:#991b1b' : '#fef3c7;color:#92400e'}}
.fact{color:#555}.tech{margin:.75rem 0;padding:.75rem;background:#f5f5f7;border-radius:8px}
.dispute{margin-top:2rem;font-size:.9rem;color:#666}.banner{background:#dbeafe;color:#1e40af;padding:.5rem 1rem;border-radius:8px;margin-bottom:1rem}
.preview{background:#1a1a2e;color:#fbbf24;padding:.4rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.85rem}
.campaign{margin:.75rem 0;padding:.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px}</style>
</head><body>
${preview ? '<div class="preview">🔒 STAGING PREVIEW — not crossing the publish gate yet; not publicly visible.</div>' : ''}
${dispute ? '<div class="banner">⚖️ This listing is currently disputed and under review.</div>' : ''}
<h1>${esc(domain)}</h1>
<div class="tier">${TIER_LABEL[tier]}</div>
<p class="fact">Reported by ${ent.corroborations} independent source${ent.corroborations === 1 ? '' : 's'}.
First observed ${esc(String(ent.first_seen).slice(0, 10))} · last ${esc(String(ent.last_seen).slice(0, 10))}.</p>
${en ? `<p class="fact">${en.domain_age_days != null ? `Domain registered ${en.domain_age_days} days before first report. ` : ''}${en.registrar ? `Registrar: ${esc(en.registrar)}. ` : ''}${en.asn ? `Hosted on ${esc(en.asn)}. ` : ''}${en.impersonates ? `Appears to imitate <strong>${esc(en.impersonates)}</strong>. ` : ''}</p>` : ''}
${campaign && campaign.size > 1 ? `<div class="campaign">🕸️ <strong>Part of a ${campaign.size}-domain campaign</strong>${campaign.top_brand ? ` targeting ${esc(campaign.top_brand)}` : ''}.${campaign.siblings ? ` Related domains: ${esc(campaign.siblings)}.` : ''}</div>` : ''}
${tech.length ? '<h2>Reported techniques</h2>' + tech.map((t: any) =>
  `<div class="tech"><strong>${esc(t.display_name)}</strong><br>${esc(t.description)}</div>`).join('') : ''}
<div class="dispute">Indicators are reports, not legal findings. Own this domain?
<a href="/dispute?entity=${encodeURIComponent(domain)}">Submit a dispute</a> — reviewed within 72 hours.</div>
</body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex',  // STAGING: remove only when Phase 4 (LLC/ToS) clears
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ─── Dispute intake (Phase 3.4) ──────────────────────────────────────────────

async function openDispute(request: Request, env: Env): Promise<Response> {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
  const { entity, contact_email, claim_text } = body ?? {};
  if (typeof entity !== 'string' || typeof contact_email !== 'string' || typeof claim_text !== 'string'
      || !contact_email.includes('@') || claim_text.length < 10 || claim_text.length > 5000) {
    return json({ error: 'entity, contact_email, claim_text (10–5000 chars) required' }, 400);
  }
  const ent = await env.DB.prepare(
    `SELECT id FROM entities WHERE entity_type = 'domain' AND entity_value = ?1`,
  ).bind(entity.toLowerCase()).first<{ id: number }>();
  if (!ent) return json({ error: 'no such entity' }, 404);

  await env.DB.prepare(
    `INSERT INTO disputes (entity_id, contact_email, claim_text, sla_due)
     VALUES (?1, ?2, ?3, datetime('now', '+72 hours'))`,
  ).bind(ent.id, contact_email.slice(0, 200), claim_text).run();
  console.log(JSON.stringify({ event: 'dispute_opened', entity })); // tail-visible; email hookup later
  return json({ ok: true, sla: '72h' });
}

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex' },
});

// ─── B2B scam-domain feed (licensable, auth-gated) ───────────────────────────
// Returns confirmed scam domains with scam-side enrichment + campaign linkage.
// Filters mirror the publish-safety rules: score >= 70, prod detection, not
// allowlisted, not shared-infra. Supports ?since=<ISO> (incremental) & ?limit=.

async function scamFeed(request: Request, env: Env, url: URL): Promise<Response> {
  const tok = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!env.FEED_TOKEN || tok !== env.FEED_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized — provide a feed API token' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  const since = url.searchParams.get('since');
  let limit = parseInt(url.searchParams.get('limit') || '500', 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 500;
  if (limit > 2000) limit = 2000;

  const params: unknown[] = [];
  let sinceClause = '';
  if (since && /^\d{4}-\d{2}-\d{2}/.test(since)) { sinceClause = 'AND e.last_seen >= ?'; params.push(since); }

  const { results } = await env.DB.prepare(
    `SELECT e.entity_value AS domain, e.first_seen, e.last_seen, e.max_score, e.campaign_id,
            en.registrar, en.domain_age_days, en.asn, en.impersonates, en.tls_cert_sha256, en.content_sha256,
            (SELECT GROUP_CONCAT(DISTINCT d.source) FROM detections d WHERE d.entity_id = e.id AND d.env='prod') AS sources,
            (SELECT GROUP_CONCAT(DISTINCT je.value) FROM detections d, json_each(d.techniques) je WHERE d.entity_id = e.id AND d.env='prod') AS techniques
     FROM entities e
     LEFT JOIN enrichments en ON en.entity_id = e.id
     WHERE e.entity_type = 'domain' AND e.max_score >= 70
       AND e.entity_value NOT GLOB '[0-9]*.[0-9]*.[0-9]*.[0-9]*'  -- exclude raw IPs
       AND EXISTS (SELECT 1 FROM detections d WHERE d.entity_id = e.id AND d.env = 'prod')
       AND NOT EXISTS (SELECT 1 FROM allowlist a WHERE a.pattern = e.entity_value)
       AND NOT EXISTS (SELECT 1 FROM shared_infra s WHERE e.entity_value = s.suffix OR e.entity_value LIKE '%.' || s.suffix)
       ${sinceClause}
     ORDER BY e.last_seen DESC LIMIT ${limit}`,
  ).bind(...params).all<any>();

  const domains = (results ?? []).map((r) => ({
    domain: r.domain,
    first_seen: r.first_seen,
    last_seen: r.last_seen,
    score: r.max_score,
    severity: r.max_score >= 85 ? 'critical' : 'high',
    techniques: r.techniques ? String(r.techniques).split(',') : [],
    sources: r.sources ? String(r.sources).split(',') : [],
    campaign_id: r.campaign_id ?? null,
    enrichment: {
      registrar: r.registrar ?? null,
      domain_age_days: r.domain_age_days ?? null,
      hosting_asn: r.asn ?? null,
      impersonates: r.impersonates ?? null,
      tls_cert_sha256: r.tls_cert_sha256 ?? null,
      kit_fingerprint: r.content_sha256 ?? null,
    },
  }));

  return new Response(JSON.stringify({
    feed: 'safety-intercept-scam-domains',
    generated_at: new Date().toISOString(),
    count: domains.length,
    domains,
  }, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

// ─── Registry stats (aggregate, public) ─────────────────────────────────────

async function registryStats(env: Env): Promise<Response> {
  const one = async (sql: string) =>
    ((await env.DB.prepare(sql).first<{ c: number }>())?.c) ?? 0;
  const [total, ageCoverage, publishableYoung, publishable] = await Promise.all([
    one(`SELECT COUNT(*) c FROM entities`),
    one(`SELECT COUNT(*) c FROM enrichments WHERE domain_age_days IS NOT NULL`),
    one(`SELECT COUNT(DISTINCT e.id) c FROM entities e
         JOIN detections d ON d.entity_id = e.id
         JOIN enrichments en ON en.entity_id = e.id
         WHERE d.source IN ('urlhaus','ct_scan','extension') AND e.max_score >= 70
           AND en.domain_age_days IS NOT NULL AND en.domain_age_days <= 60
           AND NOT EXISTS (SELECT 1 FROM allowlist a WHERE a.pattern = e.entity_value)
           AND NOT EXISTS (SELECT 1 FROM shared_infra s WHERE e.entity_value = s.suffix OR e.entity_value LIKE '%.' || s.suffix)`),
    one(`SELECT COUNT(*) c FROM publishable_entities`),
  ]);
  return new Response(JSON.stringify({
    total_entities: total,
    age_coverage: ageCoverage,
    publishable_young: publishableYoung,
    currently_publishable: publishable,
  }), { headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex', 'Access-Control-Allow-Origin': '*' } });
}

// ─── Sitemap (Phase 3.5, staging) ────────────────────────────────────────────

async function sitemap(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT entity_value, last_seen FROM publishable_entities
     WHERE entity_type = 'domain' ORDER BY last_seen DESC LIMIT 5000`,
  ).all<any>();
  const base = 'https://registry-ingest.bleblanc.workers.dev';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(results ?? []).map((r: any) =>
  `<url><loc>${base}/check/${r.entity_value}</loc><lastmod>${String(r.last_seen).slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'X-Robots-Tag': 'noindex' },
  });
}
