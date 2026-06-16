/**
 * eval-adapter.ts — EngineAdapter for Safety Intercept's HYBRID engine
 *
 * SI scoring = local heuristics (src/core/fraud_detector.ts +
 * src/background/risk_engine.ts) + LLM pass (Haiku via relay /analyze).
 * This adapter evaluates them separately AND combined:
 *
 *   MODE=local   → heuristics only. Free, deterministic, runs in CI on every commit.
 *   MODE=llm     → /analyze only. Measures what the LLM layer adds.
 *   MODE=hybrid  → both, combined the same way production combines them.
 *
 * LLM responses are cached to disk keyed on (sample content + system prompt hash),
 * so a 400-sample hybrid run costs <$1 the first time and $0 on re-runs until
 * the prompt or sample changes. Cache also makes runs repeatable.
 *
 * Usage:
 *   MODE=local  npx tsx eval-harness.ts groundtruth.jsonl
 *   MODE=hybrid RELAY_URL=https://shield-relay.bleblanc.workers.dev \
 *               RELAY_TOKEN=$VITE_RELAY_AUTH_TOKEN npx tsx eval-harness.ts groundtruth.jsonl
 *
 * Wire-up: in eval-harness.ts, replace the stub with:
 *   import { makeAdapter } from './eval-adapter';
 *   const engine = makeAdapter();
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { EngineAdapter, EngineVerdict, GroundTruthSample } from './harness';
import { analyzeLocal } from '../packages/engine';

// ── 1. LOCAL PATH ────────────────────────────────────────────────────────────
// Point these at your actual modules. Both files are plain TS in the repo;
// if risk_engine.ts has chrome.* references, extract the pure scoring function
// into packages/engine so the extension, relay, and harness all share it —
// that extraction is on the Phase 1 critical path anyway (taxonomy adoption).
//
// import { detectFraud } from '../src/core/fraud_detector';
// import { scoreRisk } from '../src/background/risk_engine';

async function scoreLocal(sample: GroundTruthSample): Promise<EngineVerdict> {
  const v = analyzeLocal(sample.input as Record<string, unknown>);
  return { score: v.score, techniques: v.techniques };
}

// ── 2. LLM PATH (relay /analyze, disk-cached) ───────────────────────────────
const CACHE_DIR = join(process.cwd(), '.eval-cache');
const RELAY_URL = process.env.RELAY_URL ?? '';
const RELAY_TOKEN = process.env.RELAY_TOKEN ?? '';

// Bump when SYSTEM_PROMPT in relay-worker.js changes — invalidates the cache.
// v2 = taxonomy-enum prompt (worker c46c46ef, 2026-06-11).
const PROMPT_VERSION = 'v2';

/**
 * Replicates EXACTLY what production sends to /analyze, per channel.
 *
 * Gmail path (gmail_scanner.tsx extractAndAnalyze → risk_engine ANALYZE_RISK →
 * callRelayAPI): memo = [paymentLinkSignal + subject, bodyText].join('\n\n')
 * .substring(0, 3000), platform 'Gmail', amount 0. The payment-link signal is
 * prepended when the body contains a paypal.me/cash.app/venmo.com/link.cash URL
 * (prod matches against bodyHtml; ground truth stores plain text — same URLs match).
 *
 * Payment path (payment_interceptor → ANALYZE_RISK): memo = memo text,
 * platform + amount passed through.
 */
function toAnalyzePayload(sample: GroundTruthSample): { memo: string; platform: string; amount: number; env: string } {
  const i = sample.input as Record<string, any>;
  // env:'test' tags eval traffic in the relay's KV log so it never pollutes the dashboard.
  if (sample.channel === 'email') {
    const bodyText = String(i.body ?? '').trim().substring(0, 3000);
    const subject = String(i.subject ?? '').trim();
    const paymentLinkMatch = String(i.body ?? '').match(/https?:\/\/(paypal\.me|cash\.app|venmo\.com|link\.cash)[^\s"'<>]*/i);
    const paymentLinkSignal = paymentLinkMatch ? `[PAYMENT LINK DETECTED: ${paymentLinkMatch[0]}]\n\n` : '';
    const analysisText = [paymentLinkSignal + subject, bodyText].filter(Boolean).join('\n\n');
    return { memo: analysisText.substring(0, 3000).trim(), platform: 'Gmail', amount: 0, env: 'test' };
  }
  // payment / sms / social: memo-style content
  const memo = String(i.memo ?? i.body ?? '').trim();
  const amount = typeof i.amount === 'number' && isFinite(i.amount) ? i.amount : 0;
  return { memo, platform: String(i.platform ?? 'unknown'), amount, env: 'test' };
}

async function scoreLLM(sample: GroundTruthSample): Promise<EngineVerdict> {
  if (!RELAY_URL || !RELAY_TOKEN) throw new Error('MODE=llm/hybrid needs RELAY_URL and RELAY_TOKEN env vars');

  const payload = toAnalyzePayload(sample);
  const key = createHash('sha256')
    .update(PROMPT_VERSION + JSON.stringify(payload))
    .digest('hex');
  const cachePath = join(CACHE_DIR, `${key}.json`);

  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));

  const res = await fetch(`${RELAY_URL}/analyze`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${RELAY_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`/analyze ${res.status} for sample ${sample.id}`);
  const j: any = await res.json();

  // Adjust to /analyze's actual response shape:
  const verdict: EngineVerdict = {
    score: j.score ?? j.riskScore ?? 0,
    techniques: j.techniques ?? j.flags ?? [],
  };

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(verdict));
  return verdict;
}

// ── 3. COMBINER ──────────────────────────────────────────────────────────────
// MUST mirror production. If prod logic differs (e.g. LLM only runs when local
// score is in an uncertainty band, or correlation boosts apply), copy that here
// verbatim — otherwise eval numbers won't describe the shipped product.
function combine(local: EngineVerdict, llm: EngineVerdict): EngineVerdict {
  return {
    score: Math.max(local.score, llm.score),
    techniques: [...new Set([...local.techniques, ...llm.techniques])],
  };
}

// ── 4. ADAPTER FACTORY ───────────────────────────────────────────────────────
export function makeAdapter(): EngineAdapter {
  const mode = (process.env.MODE ?? 'local') as 'local' | 'llm' | 'hybrid';
  console.log(`engine mode: ${mode}${mode !== 'local' ? `  relay: ${RELAY_URL}  cache: ${CACHE_DIR}` : ''}`);

  return {
    async score(sample) {
      if (mode === 'local') return scoreLocal(sample);
      if (mode === 'llm') return scoreLLM(sample);
      const [l, m] = await Promise.all([scoreLocal(sample), scoreLLM(sample)]);
      return combine(l, m);
    },
  };
}

/*
 * Recommended Phase 1 workflow:
 *   1. MODE=local baseline → fast inner loop while fixing heuristics
 *      (the auth-gate fix for cash@square.com is local-path work)
 *   2. MODE=llm once → does Haiku ALSO flag legit OTP emails? If yes, the
 *      SYSTEM_PROMPT in relay-worker.js needs the same authenticated-sender rule
 *   3. MODE=hybrid → the number that gates registry publishing (precision ≥ 0.95)
 *   4. CI: local on every commit; hybrid before deploys (cache keeps it ~free)
 */
