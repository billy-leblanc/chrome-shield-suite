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

const RELAY_URL = 'https://shield-relay.bleblanc.workers.dev/analyze';
const EVENT_URL = 'https://shield-relay.bleblanc.workers.dev/event';
const RELAY_AUTH_TOKEN = import.meta.env.VITE_RELAY_AUTH_TOKEN as string;

/**
 * Reads the relay auth token from chrome.storage then calls callRelayAPI.
 * Returns null if no token is configured or if the call fails.
 */
async function analyzeMemoWithLLM(memo: string, amount?: number, platform?: string) {
  if (!memo || !memo.trim()) return null;
  return callRelayAPI(memo, RELAY_AUTH_TOKEN, RELAY_URL, 5000, amount, platform);
}

/**
 * Sends an analytics event to the Cloudflare relay.
 * Accepts arbitrary extra fields so platform-specific data (Gmail metadata, etc.) is forwarded.
 */
async function shipEventToRelay(eventData: Record<string, unknown>) {
  try {
    await fetch(EVENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...eventData, auth_token: RELAY_AUTH_TOKEN })
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    interceptEnabled: true,
    threatLog: [],
    eventLog: [],
    stats: { blocked: 0, warnings: 0, safe: 0 },
  });
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

      sendResponse(analysis);
    }).catch(() => {
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
