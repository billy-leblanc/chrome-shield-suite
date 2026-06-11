/**
 * normalize.ts — Telemetry → Registry sanitization layer
 *
 * Contract: NOTHING reaches D1's `detections` table except through normalizeEvent().
 * Victim-side data (threadId, memo text, exact amounts, exact timestamps) is
 * stripped HERE, so no downstream bug can publish it.
 *
 * Maps the real KV shapes observed in the Jun 2026 audit:
 *   gmail_scam_detected | cross_layer_correlation | intercepted/cancelled/proceeded
 *   gmail_warning_dismissed | end_to_end_health_check | log:/check:/download: families
 */

// ---------- Raw shapes (as they actually exist in KV — inconsistencies and all) ----------

interface RawEvent {
  event?: string;
  platform?: string;
  // Gotcha #1: score lives under three different names
  score?: number;
  riskScore?: number;
  paymentScore?: number;
  riskLevel?: string;
  flags?: string[];
  paymentFlags?: string[];          // Gotcha #2: often duplicates flags
  senderEmail?: string;
  senderDomain?: string;
  subject?: string;                  // victim-context — never persisted raw
  threadId?: string;                 // FINDING 3: dropped entirely
  amount?: number;                   // FINDING 5: bucketed
  timestamp?: string;                // Gotcha #5: ms or second precision
  correlationId?: string;
  event_outcome?: string;
  gmailDetections?: Array<{          // Gotcha #3: nested one-to-many
    senderEmail?: string;
    subject?: string;
    score?: number;
    detectedAt?: string;
  }>;
}

// ---------- Output shape (matches detections table exactly) ----------

export interface PublishableDetection {
  event_key: string;          // dedup: Gotcha #6
  entity_type: 'domain' | 'email';
  entity_value: string;
  env: 'prod' | 'test';
  source: 'extension';
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  techniques: string[];       // normalized taxonomy slugs, memo text stripped
  platform_cat: string;       // generic category, never the user's specific bank
  occurred_hour: string;      // ISO truncated to hour
}

// ---------- FINDING 6: test-traffic quarantine ----------
// Until the extension ships an explicit env field, these senders/domains are
// known self-test fixtures and are forced to env='test'. The publish gate
// (publishable_entities view) requires env='prod', so none of this can page.
const TEST_FIXTURES = new Set([
  'safetyintercept@gmail.com',
  'legal-aid-services.com',
  'attorney.michaelross@legal-aid-services.com',
]);

// Diagnostic noise — never ingested at all
const DROP_EVENTS = new Set(['end_to_end_health_check', 'download']);

// Events with no scam-side entity (user actions on victim side) — useful for
// product analytics, but they carry no registry-publishable subject.
const VICTIM_SIDE_EVENTS = new Set(['gmail_warning_dismissed', 'intercepted', 'cancelled', 'proceeded',
  // user said 'Not a scam' — a labeled LEGIT sample; its sender must never become a registry entity
  'gmail_false_positive']);

// ---------- Helpers ----------

const coalesceScore = (e: RawEvent): number =>
  e.score ?? e.riskScore ?? e.paymentScore ?? 0;                    // Gotcha #1

const truncateToHour = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date();
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();                                           // Finding 5 + Gotcha #5
};

// Generic platform category — the registry never records WHICH bank a victim uses
const platformCategory = (platform?: string): string => {
  const p = (platform ?? '').toLowerCase();
  if (/zelle|venmo|cashapp|paypal/.test(p)) return 'p2p_payment';
  if (/wells|chase|bofa|bank/.test(p)) return 'bank_transfer';
  if (/gmail|email/.test(p)) return 'email';
  if (/reddit|discord|twitter|telegram/.test(p)) return 'social';
  return 'other';
};

// FINDING 4: technique tags pass through a strip-and-normalize step.
// "memo: bail money for grandson urgent" → dropped (raw user content)
// "large transfer: $3000"                → 'large-transfer' (amount stripped)
// "Family Emergency Impersonation — …"  → 'family-emergency-impersonation'
const normalizeTechniques = (flags: string[] = [], paymentFlags: string[] = []): string[] => {
  const merged = [...new Set([...flags, ...paymentFlags])];          // Gotcha #2: union, store once
  const out = new Set<string>();
  for (const f of merged) {
    const lower = f.toLowerCase();
    if (lower.startsWith('memo:') || lower.startsWith('recipient:')) continue;   // raw user content: drop
    if (lower.startsWith('correlation:')) { out.add('cross-layer-correlation'); continue; }
    if (lower.startsWith('large transfer')) { out.add('large-transfer'); continue; }
    // generic slugification of the descriptive tags; em-dash explanations truncated at the dash
    const slug = lower.split('—')[0].trim()
      .replace(/[^a-z0-9\s/-]/g, '')
      .replace(/[\s/]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug) out.add(slug);
  }
  return [...out];
};

const sha256Hex = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
};

const severityFromScore = (score: number): PublishableDetection['severity'] =>
  score >= 85 ? 'critical' : score >= 60 ? 'high' : score >= 25 ? 'medium' : 'low';

// ---------- Main entry ----------

/**
 * Returns zero or more publishable detections from one raw KV event.
 * Zero is common and correct: health checks, victim-side actions, and
 * entity-less records produce nothing for the registry.
 */
export async function normalizeEvent(raw: RawEvent): Promise<PublishableDetection[]> {
  if (!raw.event || DROP_EVENTS.has(raw.event)) return [];
  if (VICTIM_SIDE_EVENTS.has(raw.event)) return [];

  const out: PublishableDetection[] = [];
  const hour = truncateToHour(raw.timestamp);

  // Collect scam-side entities from this event:
  // top-level sender, plus every nested gmailDetection (Gotcha #3: fan out, don't nest)
  const candidates: Array<{ email?: string; domain?: string; score: number }> = [];
  if (raw.senderEmail || raw.senderDomain) {
    candidates.push({ email: raw.senderEmail, domain: raw.senderDomain, score: coalesceScore(raw) });
  }
  for (const g of raw.gmailDetections ?? []) {
    if (g.senderEmail) candidates.push({ email: g.senderEmail, score: g.score ?? coalesceScore(raw) });
  }
  if (candidates.length === 0) return [];

  const techniques = normalizeTechniques(raw.flags, raw.paymentFlags);
  const platform_cat = platformCategory(raw.platform);

  for (const c of candidates) {
    const email = c.email?.toLowerCase().trim();
    const domain = (c.domain ?? email?.split('@')[1])?.toLowerCase().trim();
    if (!domain && !email) continue;

    const entity_type: 'domain' | 'email' = email ? 'email' : 'domain';
    const entity_value = email ?? domain!;

    const env: 'prod' | 'test' =
      TEST_FIXTURES.has(entity_value) || TEST_FIXTURES.has(domain ?? '') ? 'test' : 'prod';

    const score = c.score;

    out.push({
      // Gotcha #6: deterministic key — identical double-fired beacons collapse to one row
      event_key: await sha256Hex(`extension|${entity_value}|${techniques.join(',')}|${hour}`),
      entity_type,
      entity_value,
      env,
      source: 'extension',
      score,
      severity: severityFromScore(score),
      techniques,
      platform_cat,
      occurred_hour: hour,
    });
  }
  return out;
}

/*
 * Explicitly NOT in the output, by design — do not "fix" this:
 *   threadId        (Finding 3: inbox pointer)
 *   subject         (victim-context text; technique tags carry the signal)
 *   amount          (Finding 5; if needed later, bucket: <100 / 100-1k / 1k-10k / 10k+)
 *   memo content    (Finding 4)
 *   correlationId   (per-incident victim-side ID; registry corroboration is computed
 *                    from independent SOURCES in D1, not from this)
 *   precise timestamps (truncated to hour above)
 */
