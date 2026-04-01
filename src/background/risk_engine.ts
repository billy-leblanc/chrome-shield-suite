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

/**
 * Reads the relay auth token from chrome.storage then calls callRelayAPI.
 * Returns null if no token is configured or if the call fails.
 */
async function analyzeMemoWithLLM(memo: string) {
  // Skip LLM call entirely for empty or whitespace-only memos.
  if (!memo || !memo.trim()) return null;

  let relayAuthToken: string | undefined;
  try {
    const stored = await chrome.storage.local.get('relay_auth_token');
    relayAuthToken = stored.relay_auth_token as string | undefined;
  } catch {
    return null;
  }

  // No relay token configured — fall back to heuristics only.
  if (!relayAuthToken) return null;

  return callRelayAPI(memo, relayAuthToken, RELAY_URL);
}

// Background Listener for Risk Analysis and Extension Management
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    interceptEnabled: true,
    threatLog: [],
    stats: { blocked: 0, warnings: 0, safe: 0 },
  });
  console.log("Chrome Shield Suite: Initialized");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only accept messages from content scripts in extension tabs — reject external senders.
  if (!sender.id || sender.id !== chrome.runtime.id) return false;

  if (message.type === 'ANALYZE_RISK') {
    // Validate payload shape before processing.
    const data = message.data && typeof message.data === 'object' ? message.data : {};

    const heuristicAnalysis = FraudDetector.analyze(data);

    // Run LLM analysis; fall back to heuristics only on failure/timeout.
    // Empty/whitespace memo skips LLM call inside analyzeMemoWithLLM.
    const memo = typeof data.message === 'string' ? data.message.trim() : '';
    analyzeMemoWithLLM(memo).then((llmResult) => {
      let analysis = heuristicAnalysis;

      if (llmResult) {
        // Blend: heuristics 60%, LLM 40%.
        // If LLM returns 0 but heuristics are high, heuristic score still dominates (60%).
        // Both scores are pre-clamped 0–100, so blended result is always 0–100.
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

      // Log threat if risk is high or critical
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
      // If the entire async chain throws unexpectedly, respond with heuristic result.
      sendResponse(heuristicAnalysis);
    });

    return true; // Keep the message channel open for the async response
  }

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
