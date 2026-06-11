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
  },
};

// ─── Core ingest ─────────────────────────────────────────────────────────────

async function ingestOne(d: PublishableDetection, env: Env): Promise<void> {
  // 1. Upsert entity
  await env.DB.prepare(
    `INSERT INTO entities (entity_type, entity_value, first_seen, last_seen, max_score)
     VALUES (?1, ?2, ?3, ?3, ?4)
     ON CONFLICT (entity_type, entity_value) DO UPDATE SET
       last_seen = MAX(last_seen, excluded.last_seen),
       max_score = MAX(max_score, excluded.max_score)`,
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
