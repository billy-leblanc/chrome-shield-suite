import type { RiskAnalysis } from '../../core/fraud_detector';

export interface ScoreInput {
  message: string;
  amount: number;
  platform: string;
  senderEmail?: string;
  senderDomain?: string;
}

// Round-trips ANALYZE_RISK to the background risk engine (which owns scoring,
// blending, and cross-layer correlation). Resolves null if the worker is gone.
export function scoreContent(input: ScoreInput): Promise<RiskAnalysis | null> {
  return new Promise((resolve) => {
    if (!chrome.runtime?.id) return resolve(null);
    try {
      chrome.runtime.sendMessage({ type: 'ANALYZE_RISK', data: input }, (report?: RiskAnalysis) => {
        if (chrome.runtime.lastError || !report) return resolve(null);
        resolve(report);
      });
    } catch { resolve(null); }
  });
}
