/**
 * taxonomy.ts — Canonical scam technique taxonomy v1
 * Single source of truth. The ENGINE emits these slugs directly (fixing the
 * free-text label mess); D1's `techniques` table seeds from this; registry
 * pages reuse `description` as the plain-English explainer.
 */

export type TechniqueCategory =
  | 'social-engineering' | 'phishing' | 'crypto' | 'employment'
  | 'extortion' | 'payment-fraud' | 'impersonation';

export interface Technique {
  slug: string;
  display: string;
  category: TechniqueCategory;
  description: string; // plain-English, victim-readable, reused on pages
}

export const TAXONOMY: Technique[] = [
  // ---- social engineering ----
  { slug: 'family-emergency-impersonation', display: 'Family Emergency Impersonation', category: 'social-engineering',
    description: 'A third party claims a relative is in urgent trouble (hospital, jail, accident) and unreachable, then asks for immediate money. Real emergencies allow verification; scams forbid it.' },
  { slug: 'urgency-pressure', display: 'Urgency / Time Pressure', category: 'social-engineering',
    description: 'Artificial deadlines ("tonight", "within 24 hours") designed to prevent the target from pausing, verifying, or consulting anyone.' },
  { slug: 'isolation-tactic', display: 'Isolation Tactic', category: 'social-engineering',
    description: 'Instructions to keep the request secret or avoid contacting other family members, banks, or authorities — cutting the target off from anyone who would recognize the scam.' },
  { slug: 'fabricated-pretext', display: 'Fabricated Pretext', category: 'social-engineering',
    description: 'An invented reason why normal channels cannot be used — "insurance delays," "her phone died," "he can\'t call you himself." The excuse exists to block the verification step that would expose the scam.' },
  { slug: 'romance-affinity', display: 'Romance / Affinity Scam', category: 'social-engineering',
    description: 'A cultivated online relationship is leveraged into financial requests, often with reasons why the person can never meet or video call.' },

  // ---- phishing ----
  { slug: 'credential-phishing', display: 'Credential Phishing', category: 'phishing',
    description: 'A fake login page or verification request designed to capture usernames, passwords, or one-time codes.' },
  { slug: 'lookalike-domain', display: 'Lookalike Domain', category: 'phishing',
    description: 'A domain visually mimicking a trusted brand (paypa1.com vs paypal.com) to make fraudulent messages appear legitimate.' },
  { slug: 'smishing-fake-alert', display: 'Fake Security Alert', category: 'phishing',
    description: 'A message impersonating a bank or service fraud alert, instructing the target to "verify" or "reverse" a transaction via a link or by sending money.' },
  { slug: 'payment-link-in-email', display: 'Payment Link in Email', category: 'phishing',
    description: 'An unsolicited email embedding a direct payment link — legitimate organizations route payments through their own platforms, not email links.' },

  // ---- crypto ----
  { slug: 'pig-butchering', display: 'Pig Butchering (Investment Grooming)', category: 'crypto',
    description: 'A long-con where trust is built over weeks before steering the target into a fake investment platform showing fabricated gains that can never be withdrawn.' },
  { slug: 'fake-withdrawal-fee', display: 'Fake Withdrawal / Gas Fee', category: 'crypto',
    description: 'A demand for an upfront "fee", "tax", or "gas payment" to release supposed winnings or investment profits. Each payment triggers a new fee.' },
  { slug: 'pump-and-dump', display: 'Pump-and-Dump Promotion', category: 'crypto',
    description: 'Coordinated hype ("guaranteed 10x", "insider signal") to inflate a token the promoters already hold and intend to dump.' },
  { slug: 'crypto-doubling', display: 'Crypto Doubling / Giveaway', category: 'crypto',
    description: 'A promise — often using an impersonated celebrity — that crypto sent to an address will be returned doubled. Blockchain transfers are irreversible; nothing comes back.' },

  // ---- employment ----
  { slug: 'task-employment-scam', display: 'Task / Employment Scam', category: 'employment',
    description: 'A fake job requiring upfront payment for equipment, training, or to "unlock" commissions and salary.' },
  { slug: 'advance-fee', display: 'Advance Fee Fraud', category: 'employment',
    description: 'An upfront payment demanded to release a larger promised sum (inheritance, loan, prize) that does not exist.' },

  // ---- extortion ----
  { slug: 'sextortion-panic', display: 'Sextortion / Panic Extortion', category: 'extortion',
    description: 'A threat to release compromising material (usually nonexistent) unless paid immediately, engineered to cause panic-compliance.' },
  { slug: 'authority-impersonation', display: 'Government / Authority Impersonation', category: 'impersonation',
    description: 'Impersonation of the IRS, police, courts, or immigration services demanding payment under threat of arrest or legal action. Agencies do not demand payment by gift card, wire, or crypto.' },

  // ---- payment fraud ----
  { slug: 'overpayment-refund', display: 'Overpayment / Refund Scam', category: 'payment-fraud',
    description: 'A claimed accidental overpayment with a request to "refund the difference" — the original payment is fake or will be reversed, leaving the target out the refunded amount.' },
  { slug: 'first-time-recipient', display: 'First-Time Recipient', category: 'payment-fraud',
    description: 'Payment directed to a recipient the sender has never paid before — a weak signal alone, meaningful in combination with pressure tactics.' },
  { slug: 'large-transfer', display: 'Unusually Large Transfer', category: 'payment-fraud',
    description: 'A transfer significantly above the account\'s normal pattern, requested under pressure.' },
  { slug: 'unusual-payment-method', display: 'Unusual Payment Method', category: 'payment-fraud',
    description: 'Demands for gift cards, wire transfers, or crypto — irreversible channels favored precisely because they cannot be clawed back.' },
  { slug: 'pretexting-bec', display: 'Pretexting / Business Email Compromise', category: 'impersonation',
    description: 'Impersonation of an executive, vendor, or attorney directing urgent payment, often with instructions to bypass normal approval ("don\'t alert finance").' },
  { slug: 'cross-layer-correlation', display: 'Coordinated Multi-Channel Attack', category: 'social-engineering',
    description: 'A scam message followed within minutes by a matching payment attempt — the strongest signal of an active, guided fraud in progress.' },
];

export const TAXONOMY_BY_SLUG = new Map(TAXONOMY.map(t => [t.slug, t]));

/** Legacy free-text flag → canonical slug. Covers every label family observed in the Jun 2026 KV audit. */
export const LEGACY_FLAG_MAP: Array<[RegExp, string]> = [
  [/family emergency|grandson|bail demand/i, 'family-emergency-impersonation'],
  [/urgency|time pressure|deadline|artificial scarcity/i, 'urgency-pressure'],
  [/isolation|secrecy/i, 'isolation-tactic'],
  [/romance|affinity/i, 'romance-affinity'],
  [/credential|sign.?in code|verification link|harvest/i, 'credential-phishing'],
  [/lookalike|domain spoof|fake url/i, 'lookalike-domain'],
  [/smishing|fake (bank |security )?alert|fake notification/i, 'smishing-fake-alert'],
  [/payment link in email/i, 'payment-link-in-email'],
  [/pig butchering/i, 'pig-butchering'],
  [/gas fee|withdrawal fee|unfreez/i, 'fake-withdrawal-fee'],
  [/pump.and.dump|moonshot|10x/i, 'pump-and-dump'],
  [/doubling|giveaway|celebrity/i, 'crypto-doubling'],
  [/employment|task scam|equipment fee/i, 'task-employment-scam'],
  [/advance fee|advance payment/i, 'advance-fee'],
  [/sextortion|panic|blackmail/i, 'sextortion-panic'],
  [/irs|government|dmv|immigration|authority/i, 'authority-impersonation'],
  [/overpayment|refund scam|reversal/i, 'overpayment-refund'],
  [/first.time recipient/i, 'first-time-recipient'],
  [/large transfer/i, 'large-transfer'],
  [/gift card|unusual payment/i, 'unusual-payment-method'],
  [/pretexting|bec|business email/i, 'pretexting-bec'],
  [/correlation|cross.layer/i, 'cross-layer-correlation'],
  // Labels observed in the Jun 2026 KV audit that lacked a mapping (fell through
  // to non-canonical generic slugs): orcaspins / gdfplay / cash@square detections.
  [/social engineering.*family|family emergency/i, 'family-emergency-impersonation'],
  [/suspicious payment|payment method/i, 'unusual-payment-method'],
  [/phishing/i, 'credential-phishing'],
  // Jun 2026 dispositions (Fable): third-party-impersonation is a component of the
  // family-emergency pattern; temporary-payment-hook is payment-link-in-email by
  // another phrasing; excuse-pattern earned its own canonical slug.
  [/third.party impersonation/i, 'family-emergency-impersonation'],
  [/temporary payment hook/i, 'payment-link-in-email'],
  [/excuse pattern|fabricated pretext|insurance delay/i, 'fabricated-pretext'],
];

export function mapLegacyFlag(flag: string): string | null {
  for (const [re, slug] of LEGACY_FLAG_MAP) if (re.test(flag)) return slug;
  return null;
}
