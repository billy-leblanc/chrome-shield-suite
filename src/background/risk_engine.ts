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
}

function recordGmailDetection(msg: Record<string, unknown>) {
  const entry: GmailDetection = {
    timestamp: Date.now(),
    senderEmail: String(msg.senderEmail ?? ''),
    senderDomain: String(msg.senderDomain ?? ''),
    subject: String(msg.subject ?? ''),
    score: typeof msg.score === 'number' ? msg.score : 0,
    threadId: String(msg.threadId ?? ''),
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
        const blendedScore = blendScores(heuristicAnalysis.score, llmResult.riskScore, heuristicWeight);
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
