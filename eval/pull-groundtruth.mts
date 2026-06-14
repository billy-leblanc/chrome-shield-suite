/**
 * pull-groundtruth.mts — export consented ground-truth samples → eval JSONL.
 *
 * Pulls the GROUNDTRUTH KV namespace (opt-in user contributions: legit emails
 * that tripped the detector) and appends them to the eval set in the harness's
 * GroundTruthSample shape. Run after users contribute via the "Not a scam"
 * → "Share" flow.
 *
 *   npx wrangler kv key list --namespace-id <GT_ID> --remote   (ids in wrangler.toml)
 * then this script formats each into eval/groundtruth.seed.jsonl style.
 *
 * Usage: npx tsx eval/pull-groundtruth.mts <path-to-exported-kv.json>
 * where the json is an array of {key, value} KV dumps.
 */
import { readFileSync, appendFileSync } from 'fs';

const inPath = process.argv[2];
if (!inPath) { console.error('usage: pull-groundtruth.mts <kv-dump.json>'); process.exit(1); }

const rows = JSON.parse(readFileSync(inPath, 'utf8')) as Array<{ key: string; value: any }>;
let added = 0;
for (const r of rows) {
  const v = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
  if (!v?.consent) continue;                       // belt-and-suspenders: consented only
  const sample = {
    id: `gt-${r.key.replace(/[^a-z0-9]/gi, '').slice(-12)}`,
    channel: 'email' as const,
    input: {
      senderDomain: v.senderDomain ?? '',
      subject: v.subject ?? '',
      body: v.body ?? '',
    },
    label: v.label === 'scam' ? 'scam' : 'legit',
    techniques: [] as string[],                    // legit FP corrections carry no techniques
    note: `user-contributed via not-a-scam (engine misfired: ${(v.engineFlags ?? []).join(', ')} @ ${v.engineScore})`,
  };
  appendFileSync('eval/groundtruth.contributed.jsonl', JSON.stringify(sample) + '\n');
  added++;
}
console.log(`appended ${added} consented samples → eval/groundtruth.contributed.jsonl`);
