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

/**
 * Reads the relay auth token from chrome.storage then calls callRelayAPI.
 * Returns null if no token is configured or if the call fails.
 */
async function analyzeMemoWithLLM(memo: string, amount?: number, platform?: string) {
  if (!memo || !memo.trim()) return null;

  let relayAuthToken: string | undefined;
  try {
    const stored = await chrome.storage.local.get('relay_auth_token');
    relayAuthToken = stored.relay_auth_token as string | undefined;
  } catch {
    return null;
  }

  if (!relayAuthToken) return null;

  return callRelayAPI(memo, relayAuthToken, RELAY_URL, 5000, amount, platform);
}

/**
 * Sends an analytics event to the Cloudflare relay.
 */
async function shipEventToRelay(eventData: { event: string; platform: string; timestamp: string }) {
  try {
    const stored = await chrome.storage.local.get('relay_auth_token');
    if (!stored.relay_auth_token) return;

    await fetch(EVENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventData,
        auth_token: stored.relay_auth_token
      })
    });
  } catch (err) {
    console.error('[Shield] Event sync failed', err);
  }
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
    const { event, platform } = message;
    const timestamp = new Date().toISOString();
    const entry = { event, platform, timestamp };

    // 1. Local Storage (Limit 1000)
    chrome.storage.local.get('eventLog', (data) => {
      const log = Array.isArray(data.eventLog) ? data.eventLog : [];
      const newLog = [entry, ...log].slice(0, 1000);
      chrome.storage.local.set({ eventLog: newLog });
    });

    // 2. Cloudflare Relay Sync
    shipEventToRelay(entry);
    return false; // Sync-and-forget
  }

  if (message.type === 'ANALYZE_RISK') {
    const data = message.data && typeof message.data === 'object' ? message.data : {};
    const heuristicAnalysis = FraudDetector.analyze(data);
    const memo = typeof data.message === 'string' ? data.message.trim() : '';
    const amount = typeof data.amount === 'number' ? data.amount : undefined;
    const platform = typeof data.platform === 'string' ? data.platform : undefined;

    analyzeMemoWithLLM(memo, amount, platform).then((llmResult) => {
      let analysis = heuristicAnalysis;

      if (llmResult) {
        const blendedScore = blendScores(heuristicAnalysis.score, llmResult.riskScore);
        const mergedFlags = Array.from(new Set([...heuristicAnalysis.flags, ...llmResult.flags]));
        const riskLevel = scoreToRiskLevel(blendedScore);

        analysis = {
          score: blendedScore,
          riskLevel,
          flags: mergedFlags,
          recommendation: FraudDetector.getRecommendation(riskLevel),
        };
      }

      if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
        chrome.storage.local.get(["threatLog", "stats"], (storageData) => {
          if (chrome.runtime.lastError) return;
          const existingLog = Array.isArray(storageData.threatLog) ? storageData.threatLog as Array<{text: string; time: string; type: string}> : [];
          const newLog = [{
            text: `Intercepted ${analysis.flags.join(', ')}`,
            time: new Date().toLocaleTimeString(),
            type: 'blocked'
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
