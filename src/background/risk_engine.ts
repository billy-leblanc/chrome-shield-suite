/**
 * Risk Engine: Chrome extension background worker.
 * Chrome-specific wiring only — detection logic lives in src/core/fraud_detector.ts.
 */

import {
  FraudDetector,
  callRelayAPI,
  blendScores,
  scoreToRiskLevel,
} from '../core/fraud_detector';

// Re-export so content scripts don't need import path changes.
export type { RiskAnalysis } from '../core/fraud_detector';

import { mapLegacyFlag, TAXONOMY_BY_SLUG } from '../shared/taxonomy';
import { isAllowlistedSender } from '../shared/sender_allowlist';

// Auth gate (Phase 1.2 — the cash@square.com fix): mail rendered in Gmail's UI
// from an allowlisted financial sender has passed DMARC (all listed domains
// enforce p=reject), so legitimacy evidence dominates content evidence and the
// score caps at 40 — below the alert threshold. Spoofed mail claiming these
// senders never reaches the Gmail inbox UI with this sender attribute set.
const AUTH_GATE_CAP = 40;

const RELAY_URL = 'https://shield-relay.bleblanc.workers.dev/analyze';
const EVENT_URL = 'https://shield-relay.bleblanc.workers.dev/event';
const TELEMETRY_URL = 'https://shield-relay.bleblanc.workers.dev/telemetry';
const GROUNDTRUTH_URL = 'https://shield-relay.bleblanc.workers.dev/groundtruth';
// Token-free by design: the relay's extension endpoints (/analyze, /event,
// /telemetry, /groundtruth) authenticate nobody — a secret baked into a public
// extension bundle is extractable and breaks every install on rotation. The
// relay protects itself with per-IP rate limiting instead. No secret ships here.

/**
 * Strips common PII patterns from memo text before sending to telemetry.
 * Phone numbers, emails, and URLs are replaced with tokens.
 * Names are intentionally kept — they are part of the scam script and
 * valuable training signal (e.g. "Professor Chen", "nurse Margaret").
 */
function stripPII(text: string): string {
  return text
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, '[EMAIL]')
    .replace(/https?:\/\/[^\s<>"]+/gi, '[URL]')
    .substring(0, 800);
}

/**
 * Sends an anonymized detection event to the telemetry endpoint.
 * Only fires if the user has explicitly opted in (telemetryEnabled = true in storage).
 * Fire-and-forget — never blocks the analysis result returned to the content script.
 */
function sendTelemetry(
  memo: string,
  platform: string | undefined,
  analysis: { score: number; riskLevel: string; flags: string[] }
): void {
  chrome.storage.local.get('telemetryEnabled', async ({ telemetryEnabled }) => {
    if (!telemetryEnabled) return;
    const installId = await getInstallId();
    fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installId,
        platform: platform ?? 'unknown',
        riskScore: analysis.score,
        riskLevel: analysis.riskLevel,
        flags: analysis.flags,
        // PII purge: never transmit message content, only its length.
        memoLength: memo.length,
        confirmed: null,
        version: chrome.runtime.getManifest().version,
        timestamp: Date.now(),
      }),
    }).catch(() => {}); // intentionally silent — never surface telemetry errors to the user
  });
}

/**
 * Reads the relay auth token from chrome.storage then calls callRelayAPI.
 * Returns null if no token is configured or if the call fails.
 */
async function analyzeMemoWithLLM(memo: string, amount?: number, platform?: string) {
  if (!memo || !memo.trim()) return null;
  return callRelayAPI(memo, '', RELAY_URL, 5000, amount, platform);
}

/**
 * Sends an analytics event to the Cloudflare relay.
 * Accepts arbitrary extra fields so platform-specific data (Gmail metadata, etc.) is forwarded.
 */
// --- Beacon hardening (Phase 0.5) ---
// Keep victim-side PII off the wire and out of KV: drop threadId + raw memo/body
// text, convert free-text flags to canonical taxonomy slugs, and stamp `env` so
// test-harness traffic stays filterable from real detections.
// 2026-06-11 PII audit: subject joins the strip list (victim-inbox content,
// can embed the user's name), and exact amounts bucket to ranges.
const RAW_TEXT_FIELDS = ['threadId', 'memo', 'message', 'body', 'bodyText', 'description', 'subject'];

function amountToRange(amount: unknown): string {
  const a = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return a > 500 ? 'high' : a > 100 ? 'medium' : a > 0 ? 'low' : 'unknown';
}

// Fail-closed taxonomy governance: a flag either maps to a canonical slug or
// buckets as 'uncategorized' — invented labels never enter the pipeline. The
// unmapped engine-generated label is preserved separately for taxonomy review
// (it's engine output, not user content, so transmitting it is PII-safe).
function flagsToSlugs(flags: unknown): { slugs: string[]; uncategorized: string[] } {
  if (!Array.isArray(flags)) return { slugs: [], uncategorized: [] };
  const slugs = new Set<string>();
  const uncategorized = new Set<string>();
  for (const f of flags) {
    const s = String(f);
    const lower = s.toLowerCase();
    // Raw user content that leaks into flag/paymentFlag arrays — never transmit.
    if (lower.startsWith('memo:') || lower.startsWith('recipient:')) continue;
    const direct = TAXONOMY_BY_SLUG.has(lower.trim()) ? lower.trim() : null;
    const slug = direct ?? mapLegacyFlag(s);
    if (slug) {
      slugs.add(slug);
    } else {
      slugs.add('uncategorized');
      uncategorized.add(s.split('—')[0].trim().slice(0, 80));
    }
  }
  return { slugs: [...slugs], uncategorized: [...uncategorized] };
}

function sanitizeEvent(eventData: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...eventData };
  for (const k of RAW_TEXT_FIELDS) delete clean[k];
  const review = new Set<string>();
  if (Array.isArray(clean.flags)) {
    const r = flagsToSlugs(clean.flags);
    clean.flags = r.slugs;
    r.uncategorized.forEach((u) => review.add(u));
  }
  if (Array.isArray(clean.paymentFlags)) {
    const r = flagsToSlugs(clean.paymentFlags);
    clean.paymentFlags = r.slugs;
    r.uncategorized.forEach((u) => review.add(u));
  }
  if (review.size) clean.uncategorizedFlags = [...review]; // weekly taxonomy-review feed
  // Exact amounts are user-side: transmit the bucket only.
  if ('amount' in clean) {
    clean.amountRange = amountToRange(clean.amount);
    delete clean.amount;
  }
  // Nested correlation detections: keep sender + score, never the subject line.
  if (Array.isArray(clean.gmailDetections)) {
    clean.gmailDetections = (clean.gmailDetections as Array<Record<string, unknown>>).map((d) => ({
      senderEmail: d.senderEmail, score: d.score, detectedAt: d.detectedAt,
    }));
  }
  if (!('env' in clean)) clean.env = 'prod';
  return clean;
}

// Persistent per-install id (random UUID, not PII) cached for the worker's life.
// Attached to every event so distinct users can finally be counted/deduped —
// the gap that made "how many users do I have" unanswerable. Generated once,
// stored in chrome.storage, survives restarts.
let installIdPromise: Promise<string> | null = null;
function getInstallId(): Promise<string> {
  if (!installIdPromise) {
    installIdPromise = new Promise((resolve) => {
      try {
        chrome.storage.local.get('installId', ({ installId }) => {
          if (installId) return resolve(installId as string);
          const id = crypto.randomUUID();
          chrome.storage.local.set({ installId: id });
          resolve(id);
        });
      } catch { resolve(''); }
    });
  }
  return installIdPromise;
}

async function shipEventToRelay(eventData: Record<string, unknown>) {
  try {
    const installId = await getInstallId();
    const payload = sanitizeEvent(eventData);
    if (installId && !('installId' in payload)) payload.installId = installId;
    await fetch(EVENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('[Shield] Event sync failed', err);
  }
}

// --- Cross-Layer Correlation ---
// Persisted to chrome.storage.local so correlations survive service worker restarts.
// MV3 service workers die after ~30s of inactivity — in-memory state would be wiped.
const CORRELATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'gmailDetections';

interface GmailDetection {
  timestamp: number;
  senderEmail: string;
  senderDomain: string;
  subject: string;
  score: number;
  threadId: string;
  keywords: string[]; // Key phrases from email body for memo correlation
}

/**
 * Extracts key phrases from email subject + flags for memo correlation.
 * E.g. "mom's fall", "hospital", "$200", "Margaret" — so if the payment memo
 * mentions any of these, we can flag it.
 */
function extractKeywords(subject: string, flags: string[]): string[] {
  const text = [subject, ...flags].join(' ').toLowerCase();
  // Pull out meaningful noun phrases and amounts
  const keywords: string[] = [];
  // Named entities and key nouns from subject
  const subjectWords = subject.toLowerCase()
    .replace(/[^a-z0-9\s$]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['from', 'about', 'your', 'this', 'that', 'with', 'have', 'been', 'were', 'they', 'them', 'will', 'would', 'could', 'should', 'here', 'there', 'their', 'email', 'just', 'some', 'more', 'very', 'also', 'than', 'then'].includes(w));
  keywords.push(...subjectWords);
  // Scam-relevant terms from the full text
  const scamTerms = text.match(/\b(hospital|fall|accident|emergency|insurance|bail|surgery|medical|mom|dad|mother|father|grandm\w*|grandp\w*|church|friend|neighbor|margaret|payment|send|money|\$\d+)\b/g);
  if (scamTerms) keywords.push(...scamTerms);
  return Array.from(new Set(keywords)).slice(0, 20);
}

function recordGmailDetection(msg: Record<string, unknown>) {
  const subject = String(msg.subject ?? '');
  const flags = Array.isArray(msg.flags) ? msg.flags.map(String) : [];
  const entry: GmailDetection = {
    timestamp: Date.now(),
    senderEmail: String(msg.senderEmail ?? ''),
    senderDomain: String(msg.senderDomain ?? ''),
    subject,
    score: typeof msg.score === 'number' ? msg.score : 0,
    threadId: String(msg.threadId ?? ''),
    keywords: extractKeywords(subject, flags),
  };

  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const existing: GmailDetection[] = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    // Prune expired entries and cap at 100
    const now = Date.now();
    const pruned = existing.filter(d => now - d.timestamp < CORRELATION_WINDOW_MS);
    chrome.storage.local.set({ [STORAGE_KEY]: [...pruned, entry].slice(-100) });
  });
}

function findGmailCorrelation(): Promise<{ correlationId: string; gmailEvents: GmailDetection[] } | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const detections: GmailDetection[] = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      const now = Date.now();
      // Time-window correlation: any Gmail scam detected in the last 24 hours
      const recent = detections.filter(d => now - d.timestamp < CORRELATION_WINDOW_MS);
      if (recent.length === 0) return resolve(null);

      resolve({
        correlationId: `gmail-pay-${now}`,
        gmailEvents: recent,
      });
    });
  });
}

// Background Listener
// Keep service worker alive — MV3 kills it after ~30s of inactivity.
// An active alarm prevents the worker from sleeping as long as we have tabs on supported sites.
chrome.alarms.create('keepalive', { periodInMinutes: 0.33 }); // fires every ~20 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepalive') {
    // Lightweight ping — just enough to reset the 30s inactivity timer
    chrome.storage.local.get('interceptEnabled', () => {});
  }
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  chrome.storage.local.set({
    interceptEnabled: true,
    threatLog: [],
    eventLog: [],
    stats: { blocked: 0, warnings: 0, safe: 0 },
  });
  if (reason === 'install') {
    const installId = crypto.randomUUID();
    chrome.storage.local.set({ installId });
    shipEventToRelay({
      type: 'install',
      installId,
      version: chrome.runtime.getManifest().version,
      timestamp: Date.now(),
    });
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  } else if (reason === 'update') {
    // Sweep up pre-existing installs that never sent an install beacon.
    // Deduped server-side by installId, so this counts each existing user once.
    chrome.storage.local.get('installId', ({ installId }) => {
      const id = installId || crypto.randomUUID();
      if (!installId) chrome.storage.local.set({ installId: id });
      shipEventToRelay({
        type: 'install',
        installId: id,
        version: chrome.runtime.getManifest().version,
        timestamp: Date.now(),
        backfill: true,
      });
    });
  }
  console.log("Chrome Shield Suite: Initialized");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.id || sender.id !== chrome.runtime.id) return false;

  // New Case: Analytics Logging
  if (message.type === 'LOG_EVENT') {
    const { type: _type, ...fields } = message;
    const timestamp = new Date().toISOString();
    const entry = { ...fields, timestamp };

    // 1. Local Storage (Limit 1000)
    chrome.storage.local.get('eventLog', (data) => {
      const log = Array.isArray(data.eventLog) ? data.eventLog : [];
      const newLog = [entry, ...log].slice(0, 1000);
      chrome.storage.local.set({ eventLog: newLog });
    });

    // 2. Record Gmail detections for cross-layer correlation
    if (fields.platform === 'Gmail' && fields.event === 'gmail_scam_detected') {
      recordGmailDetection(fields);
    }

    // 3. Cross-layer correlation for intercepted payment events (questionnaire path bypasses ANALYZE_RISK)
    if (fields.event === 'intercepted' && fields.platform !== 'Gmail') {
      findGmailCorrelation().then(correlation => {
        if (correlation) {
          shipEventToRelay({
            event: 'cross_layer_correlation',
            platform: fields.platform,
            correlationId: correlation.correlationId,
            gmailDetections: correlation.gmailEvents.map(d => ({
              senderEmail: d.senderEmail,
              subject: d.subject,
              score: d.score,
              detectedAt: new Date(d.timestamp).toISOString(),
            })),
            paymentScore: typeof fields.score === 'number' ? fields.score : 0,
            paymentFlags: Array.isArray(fields.flags) ? fields.flags : [],
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    // 4. Cloudflare Relay Sync
    shipEventToRelay(entry);
    return false; // Sync-and-forget
  }

  // Consented ground-truth sharing: the ONLY path email content leaves the
  // browser, and only because the user tapped "Share" on a false-positive
  // correction. Posts subject+body to the dedicated /groundtruth store.
  if (message.type === 'SHARE_GROUNDTRUTH') {
    const { subject, body, senderDomain, flags, score, label } = message;
    getInstallId().then((installId) => {
      fetch(GROUNDTRUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installId, subject, body, senderDomain, flags, score, label, consent: true }),
      }).catch(() => {}); // never surface errors for a best-effort contribution
    });
    return false;
  }

  if (message.type === 'ANALYZE_RISK') {
    const data = message.data && typeof message.data === 'object' ? message.data : {};
    const heuristicAnalysis = FraudDetector.analyze(data);
    const memo = typeof data.message === 'string' ? data.message.trim() : '';
    const amount = typeof data.amount === 'number' ? data.amount : undefined;
    const platform = typeof data.platform === 'string' ? data.platform : undefined;

    analyzeMemoWithLLM(memo, amount, platform).then(async (llmResult) => {
      let analysis = heuristicAnalysis;

      if (llmResult) {
        // Gmail heuristics are keyword-based and miss social engineering emails.
        // Give the LLM 80% weight for Gmail so a crafted scam email isn't diluted to "medium".
        const heuristicWeight = platform === 'Gmail' ? 0.2 : 0.6;
        let blendedScore = blendScores(heuristicAnalysis.score, llmResult.riskScore, heuristicWeight);
        // Never let the LLM drag a strong heuristic signal below its level
        blendedScore = Math.max(blendedScore, heuristicAnalysis.score);
        const mergedFlags = Array.from(new Set([...heuristicAnalysis.flags, ...llmResult.flags]));
        const riskLevel = scoreToRiskLevel(blendedScore);

        analysis = {
          score: blendedScore,
          riskLevel,
          flags: mergedFlags,
          recommendation: FraudDetector.getRecommendation(riskLevel),
        };
      }

      // Cross-layer correlation: any Gmail scam in the last 24h elevates payment risk
      if (platform !== 'Gmail') {
        const correlation = await findGmailCorrelation();
        if (correlation) {
          // Boost score — recent scam email + payment attempt = elevated suspicion
          analysis.score = Math.min(100, analysis.score + 30);
          analysis.riskLevel = scoreToRiskLevel(analysis.score);
          analysis.flags = Array.from(new Set([...analysis.flags, 'Cross-Layer: Recent Gmail Scam']));
          analysis.recommendation = FraudDetector.getRecommendation(analysis.riskLevel);

          // Build human-readable correlation note for the modal
          const mostRecent = correlation.gmailEvents.reduce((a, b) => a.timestamp > b.timestamp ? a : b);
          const minutesAgo = Math.round((Date.now() - mostRecent.timestamp) / 60000);
          const timeAgo = minutesAgo < 60 ? `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
            : `${Math.round(minutesAgo / 60)} hour${Math.round(minutesAgo / 60) !== 1 ? 's' : ''} ago`;
          analysis.correlationNote = `You received a scam email from ${mostRecent.senderEmail} ${timeAgo}. Combined with this payment, fraud risk is elevated.`;

          // Log the correlated event with all linked Gmail detections
          shipEventToRelay({
            event: 'cross_layer_correlation',
            platform: platform ?? 'unknown',
            correlationId: correlation.correlationId,
            gmailDetections: correlation.gmailEvents.map(d => ({
              senderEmail: d.senderEmail,
              subject: d.subject,
              score: d.score,
              detectedAt: new Date(d.timestamp).toISOString(),
            })),
            paymentScore: analysis.score,
            paymentFlags: analysis.flags,
            amount,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Auth gate — applied LAST so it dominates blending and correlation boosts.
      const senderDomain = typeof data.senderDomain === 'string' ? data.senderDomain
        : (typeof data.senderEmail === 'string' && data.senderEmail.includes('@') ? data.senderEmail.split('@')[1] : undefined);
      if (platform === 'Gmail' && isAllowlistedSender(senderDomain) && analysis.score > AUTH_GATE_CAP) {
        analysis.score = AUTH_GATE_CAP;
        analysis.riskLevel = scoreToRiskLevel(AUTH_GATE_CAP);
        analysis.recommendation = FraudDetector.getRecommendation(analysis.riskLevel);
        analysis.flags = Array.from(new Set([...analysis.flags, 'Auth Gate: authenticated allowlisted sender']));
      }

      if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
        chrome.storage.local.get(["threatLog", "stats"], (storageData) => {
          if (chrome.runtime.lastError) return;
          const existingLog = Array.isArray(storageData.threatLog) ? storageData.threatLog as Array<{text: string; time: string; type: string; platform?: string}> : [];
          const newLog = [{
            text: `Intercepted: ${Array.from(new Set(analysis.flags)).slice(0, 3).map(f => f.split(/[:|,]/)[0].replace(/_/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase())).join(' · ')}`,
            time: new Date().toLocaleTimeString(),
            type: analysis.riskLevel === 'critical' ? 'blocked' : 'warning',
            platform: platform ?? 'unknown',
          }, ...existingLog].slice(0, 50);

          const existingStats = (storageData.stats as { blocked: number; warnings: number; safe: number } | undefined) || { blocked: 0, warnings: 0, safe: 0 };
          const newStats = { ...existingStats };
          if (analysis.riskLevel === 'critical') newStats.blocked = (newStats.blocked || 0) + 1;
          else newStats.warnings = (newStats.warnings || 0) + 1;

          chrome.storage.local.set({ threatLog: newLog, stats: newStats });
        });
      } else {
        chrome.storage.local.get("stats", (storageData) => {
          if (chrome.runtime.lastError) return;
          const currentStats = (storageData.stats as { blocked: number; warnings: number; safe: number } | undefined) || { blocked: 0, warnings: 0, safe: 0 };
          const newStats = { ...currentStats, safe: (currentStats.safe || 0) + 1 };
          chrome.storage.local.set({ stats: newStats });
        });
      }

      sendTelemetry(memo, platform, analysis);
      sendResponse(analysis);
    }).catch(() => {
      sendTelemetry(memo, platform, heuristicAnalysis);
      sendResponse(heuristicAnalysis);
    });

    return true; 
  }

  // Other handlers (GET_STATS, TOGGLE_INTERCEPT) omitted for brevity as they are stable
  if (message.type === "GET_STATS") {
    chrome.storage.local.get(["stats", "threatLog", "interceptEnabled"], (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({});
        return;
      }
      sendResponse(data);
    });
    return true;
  }

  if (message.type === "TOGGLE_INTERCEPT") {
    chrome.storage.local.get("interceptEnabled", (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({ interceptEnabled: true });
        return;
      }
      const next = !data.interceptEnabled;
      chrome.storage.local.set({ interceptEnabled: next }, () => {
        sendResponse({ interceptEnabled: next });
      });
    });
    return true;
  }
});
