/**
 * eval/harness.ts — Detection engine evaluation harness
 *
 * Purpose: every engine change runs against a fixed labeled set and reports
 * precision / recall / F1 overall and per-technique. No more "fixed it, vibes
 * say nothing broke." The cash@square.com class of false positive becomes a
 * permanent regression test.
 *
 * Usage:  npx tsx eval/harness.ts eval/groundtruth.jsonl
 * Plug in your engine via the EngineAdapter below.
 */

import { readFileSync } from 'fs';

// ---------- Ground truth format (one JSON object per line) ----------
export interface GroundTruthSample {
  id: string;
  channel: 'email' | 'payment' | 'sms' | 'social';
  // Email samples: sender + subject + body. Payment samples: memo/amount/context.
  input: Record<string, unknown>;
  label: 'scam' | 'legit';
  techniques: string[];      // canonical slugs from taxonomy.ts; empty for legit
  note?: string;             // e.g. "real Cash App OTP — regression for cash@square.com FP"
}

// ---------- Adapter: wire your engine here ----------
export interface EngineVerdict { score: number; techniques: string[] }
export interface EngineAdapter { score(sample: GroundTruthSample): Promise<EngineVerdict> }

import { makeAdapter } from './adapter';
const engine: EngineAdapter = makeAdapter();

// ---------- Metrics ----------
const SCAM_THRESHOLD = 60; // score >= threshold ⇒ predicted scam. Tune via PR curve below.

interface Counts { tp: number; fp: number; fn: number; tn: number }
const f1 = (p: number, r: number) => (p + r === 0 ? 0 : (2 * p * r) / (p + r));

async function run(path: string) {
  const samples: GroundTruthSample[] = readFileSync(path, 'utf8')
    .split('\n').filter(Boolean).map(l => JSON.parse(l));

  const overall: Counts = { tp: 0, fp: 0, fn: 0, tn: 0 };
  const perTechnique = new Map<string, { tp: number; fn: number }>();
  const falsePositives: Array<{ id: string; score: number; note?: string }> = [];
  const falseNegatives: Array<{ id: string; score: number; note?: string }> = [];
  const scoredPairs: Array<{ score: number; isScam: boolean }> = [];

  for (const s of samples) {
    const verdict = await engine.score(s);
    const predictedScam = verdict.score >= SCAM_THRESHOLD;
    const isScam = s.label === 'scam';
    scoredPairs.push({ score: verdict.score, isScam });

    if (predictedScam && isScam) overall.tp++;
    else if (predictedScam && !isScam) { overall.fp++; falsePositives.push({ id: s.id, score: verdict.score, note: s.note }); }
    else if (!predictedScam && isScam) { overall.fn++; falseNegatives.push({ id: s.id, score: verdict.score, note: s.note }); }
    else overall.tn++;

    // Per-technique recall: did the engine surface each labeled technique?
    for (const t of s.techniques) {
      const c = perTechnique.get(t) ?? { tp: 0, fn: 0 };
      verdict.techniques.includes(t) ? c.tp++ : c.fn++;
      perTechnique.set(t, c);
    }
  }

  const precision = overall.tp / Math.max(1, overall.tp + overall.fp);
  const recall = overall.tp / Math.max(1, overall.tp + overall.fn);

  console.log('=== Overall ===');
  console.log(`samples=${samples.length}  threshold=${SCAM_THRESHOLD}`);
  console.log(`precision=${precision.toFixed(3)}  recall=${recall.toFixed(3)}  F1=${f1(precision, recall).toFixed(3)}`);
  console.log(`TP=${overall.tp} FP=${overall.fp} FN=${overall.fn} TN=${overall.tn}`);

  console.log('\n=== Per-technique recall ===');
  for (const [slug, c] of [...perTechnique].sort()) {
    console.log(`${slug.padEnd(36)} ${(c.tp / Math.max(1, c.tp + c.fn)).toFixed(2)}  (${c.tp}/${c.tp + c.fn})`);
  }

  console.log('\n=== False positives (these block registry publishing) ===');
  for (const x of falsePositives) console.log(`  ${x.id}  score=${x.score}  ${x.note ?? ''}`);
  console.log('\n=== False negatives ===');
  for (const x of falseNegatives) console.log(`  ${x.id}  score=${x.score}  ${x.note ?? ''}`);

  // Precision/recall at alternative thresholds — pick the operating point deliberately
  console.log('\n=== Threshold sweep ===');
  for (const t of [40, 50, 60, 70, 80, 90]) {
    let tp = 0, fp = 0, fn = 0;
    for (const { score, isScam } of scoredPairs) {
      const pred = score >= t;
      if (pred && isScam) tp++; else if (pred && !isScam) fp++; else if (!pred && isScam) fn++;
    }
    const p = tp / Math.max(1, tp + fp), r = tp / Math.max(1, tp + fn);
    console.log(`t=${t}  precision=${p.toFixed(3)}  recall=${r.toFixed(3)}  F1=${f1(p, r).toFixed(3)}`);
  }

  // CI gate: fail the run if precision regresses below floor.
  // Registry publishing demands high precision; a published false positive is a legal problem.
  const PRECISION_FLOOR = 0.95;
  if (precision < PRECISION_FLOOR) {
    console.error(`\nFAIL: precision ${precision.toFixed(3)} < floor ${PRECISION_FLOOR}`);
    process.exit(1);
  }
}

run(process.argv[2] ?? 'eval/groundtruth.jsonl').catch(e => { console.error(e); process.exit(1); });
