/**
 * packages/engine — the pure, shared scoring engine.
 *
 * One scoring implementation, three consumers:
 *   - extension background worker (src/background/risk_engine.ts)
 *   - eval harness local path (eval/adapter.ts)
 *   - (eventually) the registry's scanner
 *
 * No Chrome APIs, no DOM, no network. The LLM pass and production blending
 * live elsewhere; this module is the deterministic local layer.
 */

import {
  FraudDetector,
  blendScores,
  scoreToRiskLevel,
  clampScore,
  type TransactionData,
  type RiskAnalysis,
} from '../../src/core/fraud_detector';
import { mapLegacyFlag, TAXONOMY_BY_SLUG } from '../../src/shared/taxonomy';

export { blendScores, scoreToRiskLevel, clampScore };
export type { TransactionData, RiskAnalysis };

export interface EngineInput {
  // email channel
  senderEmail?: string;
  senderDomain?: string;
  subject?: string;
  body?: string;
  spf?: string;
  dkim?: string;
  dmarc?: string;
  // payment channel
  memo?: string;
  amount?: number;
  platform?: string;
  context?: string;
  recipientHistory?: string;
}

export interface EngineVerdict {
  score: number;
  techniques: string[]; // canonical taxonomy slugs; unknowns bucket as 'uncategorized'
  rawFlags: string[];   // engine-native labels, for debugging/review
}

/** Free-text engine flags → canonical slugs (fail-closed: unknown → 'uncategorized'). */
export function flagsToTechniques(flags: string[]): string[] {
  const out = new Set<string>();
  for (const f of flags) {
    const lower = f.toLowerCase().trim();
    if (TAXONOMY_BY_SLUG.has(lower)) { out.add(lower); continue; }
    const slug = mapLegacyFlag(f);
    out.add(slug ?? 'uncategorized');
  }
  return [...out];
}

/**
 * Normalize any channel's input into the TransactionData shape the detector
 * scans. Mirrors production: Gmail scanner feeds subject+body as the message;
 * payment interceptor feeds the memo.
 */
export function toTransactionData(input: EngineInput): TransactionData {
  const message = [input.subject, input.body, input.memo, input.context]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .join('\n');
  const platform = input.platform ?? (input.senderEmail !== undefined ? 'Gmail' : undefined);
  return { message, amount: input.amount, platform };
}

/** The deterministic local scoring path. */
export function analyzeLocal(input: EngineInput): EngineVerdict {
  const det = FraudDetector.analyze(toTransactionData(input));
  return {
    score: det.score,
    techniques: flagsToTechniques(det.flags),
    rawFlags: det.flags,
  };
}
