#!/usr/bin/env node
// Seeds a clean attack-chain case into the Cloudflare KV via the relay /event endpoint.
// Usage:
//   RELAY_AUTH_TOKEN=xxxx node scripts/seed-demo-attack-chain.mjs
//   RELAY_AUTH_TOKEN=xxxx node scripts/seed-demo-attack-chain.mjs --scenario=grandparent
//
// Produces three KV writes that the dashboard renders as one Attack Chain Case:
//   1. event:* with event=gmail_scam_detected
//   2. event:* with event=cross_layer_correlation (linked via senderEmail + timestamp window)
// Plus a couple of standalone individual detections so the "Individual Detections" grid is populated.

const RELAY_URL = process.env.RELAY_URL || 'https://shield-relay.bleblanc.workers.dev';
const AUTH = process.env.RELAY_AUTH_TOKEN;

if (!AUTH) {
  console.error('Missing RELAY_AUTH_TOKEN env var.');
  process.exit(1);
}

const scenarioArg = (process.argv.find(a => a.startsWith('--scenario=')) || '').split('=')[1] || 'grandparent';

const SCENARIOS = {
  grandparent: {
    gmail: {
      senderEmail: 'attorney.michaelross@legal-aid-services.com',
      subject: 'URGENT: Your grandson needs bail money tonight',
      score: 92,
      riskLevel: 'critical',
      flags: [
        'family emergency: grandson in jail',
        'urgency: act tonight',
        'isolation: do not tell family',
        'unusual payment: zelle to attorney',
      ],
    },
    payment: {
      platform: 'Wells Fargo Zelle',
      amount: 3000,
      paymentScore: 96,
      riskLevel: 'critical',
      paymentFlags: [
        'memo: bail money for grandson urgent',
        'large transfer: $3000',
        'recipient: first-time',
        'correlation: matches gmail scam from attorney.michaelross',
      ],
    },
    elapsedMinutes: 4,
  },
  romance: {
    gmail: {
      senderEmail: 'sarah.k.hammond@gmail.com',
      subject: 'I need your help, my love — customs is holding my package',
      score: 84,
      riskLevel: 'critical',
      flags: [
        'romance: never met in person',
        'pretexting: customs fee',
        'urgency: package will be destroyed',
      ],
    },
    payment: {
      platform: 'PayPal',
      amount: 1850,
      paymentScore: 88,
      riskLevel: 'critical',
      paymentFlags: [
        'memo: customs fee for sarah package',
        'recipient: international',
        'correlation: matches gmail romance scam',
      ],
    },
    elapsedMinutes: 12,
  },
};

const scenario = SCENARIOS[scenarioArg];
if (!scenario) {
  console.error(`Unknown scenario: ${scenarioArg}. Options: ${Object.keys(SCENARIOS).join(', ')}`);
  process.exit(1);
}

const correlationId = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const now = Date.now();
const gmailTs = new Date(now - scenario.elapsedMinutes * 60_000).toISOString();
const paymentTs = new Date(now).toISOString();

async function postEvent(payload) {
  const res = await fetch(`${RELAY_URL}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_token: AUTH, ...payload }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`POST /event failed (${res.status}): ${txt}`);
  }
  return res.json();
}

async function main() {
  console.log(`Seeding scenario "${scenarioArg}"…`);

  // 1. Gmail scam detection
  await postEvent({
    event: 'gmail_scam_detected',
    timestamp: gmailTs,
    senderEmail: scenario.gmail.senderEmail,
    subject: scenario.gmail.subject,
    score: scenario.gmail.score,
    riskScore: scenario.gmail.score,
    riskLevel: scenario.gmail.riskLevel,
    flags: scenario.gmail.flags,
    platform: 'Gmail',
  });
  console.log('  ✓ gmail_scam_detected written');

  // 2. Cross-layer correlation (the case binder)
  await postEvent({
    event: 'cross_layer_correlation',
    correlationId,
    timestamp: paymentTs,
    platform: scenario.payment.platform,
    amount: scenario.payment.amount,
    paymentScore: scenario.payment.paymentScore,
    score: scenario.payment.paymentScore,
    riskLevel: scenario.payment.riskLevel,
    paymentFlags: scenario.payment.paymentFlags,
    flags: scenario.payment.paymentFlags,
    gmailDetections: [
      {
        senderEmail: scenario.gmail.senderEmail,
        subject: scenario.gmail.subject,
        score: scenario.gmail.score,
        detectedAt: gmailTs,
      },
    ],
    event_outcome: 'intercepted',
  });
  console.log('  ✓ cross_layer_correlation written');

  // 3. A couple of standalone individual detections so the second section isn't empty
  await postEvent({
    event: 'intercepted',
    timestamp: new Date(now - 90 * 60_000).toISOString(),
    platform: 'PayPal',
    amount: 450,
    riskScore: 72,
    score: 72,
    riskLevel: 'high',
    flags: ['memo: refund overpayment', 'overpayment scam pattern'],
  });
  await postEvent({
    event: 'gmail_scam_detected',
    timestamp: new Date(now - 6 * 60 * 60_000).toISOString(),
    platform: 'Gmail',
    senderEmail: 'support@paypa1-security.com',
    subject: 'Your account has been locked — verify now',
    score: 81,
    riskScore: 81,
    riskLevel: 'critical',
    flags: ['smishing: account locked', 'lookalike domain'],
  });
  console.log('  ✓ 2 standalone detections written');

  console.log(`\nDone. Open dashboard.html and refresh.`);
  console.log(`Correlation ID: ${correlationId}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
