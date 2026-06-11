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
import { isAllowlistedSender } from '../../src/shared/sender_allowlist';

export { blendScores, scoreToRiskLevel, clampScore, isAllowlistedSender };
export type { TransactionData, RiskAnalysis };

/**
 * Auth gate (Phase 1.2, the cash@square.com fix): an email that authenticates
 * (SPF pass + DKIM pass) from an allowlisted financial sender is capped at
 * AUTH_GATE_CAP regardless of content patterns — legitimacy evidence dominates
 * content evidence. Cap is 40: below the high/alert threshold (50), still
 * visible in logs as "elevated content, authenticated sender".
 */
export const AUTH_GATE_CAP = 40;

export interface AuthEvidence {
  spf?: string;
  dkim?: string;
  senderDomain?: string;
  senderEmail?: string;
}

export function authGateApplies(e: AuthEvidence): boolean {
  const domain = e.senderDomain
    ?? (e.senderEmail?.includes('@') ? e.senderEmail.split('@')[1] : undefined);
  if (!isAllowlistedSender(domain)) return false;
  return e.spf === 'pass' && e.dkim === 'pass';
}

export function applyAuthGate(e: AuthEvidence, score: number): { score: number; gated: boolean } {
  if (authGateApplies(e) && score > AUTH_GATE_CAP) {
    return { score: AUTH_GATE_CAP, gated: true };
  }
  return { score, gated: false };
}

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

/** The deterministic local scoring path. Auth gate applied last — it dominates. */
export function analyzeLocal(input: EngineInput): EngineVerdict {
  const det = FraudDetector.analyze(toTransactionData(input));
  const gate = applyAuthGate(input, det.score);
  return {
    score: gate.score,
    techniques: flagsToTechniques(det.flags),
    rawFlags: gate.gated ? [...det.flags, 'Auth Gate: authenticated allowlisted sender'] : det.flags,
  };
}
