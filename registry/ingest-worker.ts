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
import { enrichDomain } from './enrich';
import { clusterEntities, type EntityInfra } from './campaigns';

interface Env {
  DB: D1Database;
  EVENTS: Queue;
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
    await Promise.allSettled([pollOpenPhish(env), pollURLhaus(env)]);
    // Sweeps run after pollers; each is capped per tick to stay polite to RDAP/DoH.
    await enrichSweep(env).catch(e => console.error('enrich sweep', e));
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

    const pageMatch = url.pathname.match(/^\/check\/([a-z0-9.-]{4,253})$/i);
    if (pageMatch && request.method === 'GET') return renderPage(pageMatch[1].toLowerCase(), env);

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

async function renderPage(domain: string, env: Env): Promise<Response> {
  // publishable_entities view = the gate: prod-corroborated, not allowlisted, score floor.
  const ent = await env.DB.prepare(
    `SELECT * FROM publishable_entities WHERE entity_type = 'domain' AND entity_value = ?1`,
  ).bind(domain).first<any>();
  if (!ent) return new Response('No entry', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });

  const en = await env.DB.prepare(
    `SELECT * FROM enrichments WHERE entity_id = ?1`).bind(ent.id).first<any>();
  const det = await env.DB.prepare(
    `SELECT techniques FROM detections WHERE entity_id = ?1 AND env = 'prod'`).bind(ent.id).all<any>();
  const dispute = await env.DB.prepare(
    `SELECT 1 FROM disputes WHERE entity_id = ?1 AND status = 'open' LIMIT 1`).bind(ent.id).first();

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
.dispute{margin-top:2rem;font-size:.9rem;color:#666}.banner{background:#dbeafe;color:#1e40af;padding:.5rem 1rem;border-radius:8px;margin-bottom:1rem}</style>
</head><body>
${dispute ? '<div class="banner">⚖️ This listing is currently disputed and under review.</div>' : ''}
<h1>${esc(domain)}</h1>
<div class="tier">${TIER_LABEL[tier]}</div>
<p class="fact">Reported by ${ent.corroborations} independent sources.
First observed ${esc(String(ent.first_seen).slice(0, 10))} · last ${esc(String(ent.last_seen).slice(0, 10))}.</p>
${en ? `<p class="fact">${en.domain_age_days != null ? `Domain registered ${en.domain_age_days} days before first report.` : ''}
${en.registrar ? ` Registrar: ${esc(en.registrar)}.` : ''}
${en.impersonates ? ` Appears to imitate <strong>${esc(en.impersonates)}</strong>.` : ''}</p>` : ''}
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
