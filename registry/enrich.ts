/**
 * enrich.ts — Scam-side enrichment (Workers-compatible, zero paid APIs)
 *
 * This is the "collect more data" layer — pointed at SCAMS, not users.
 * Adds the fields that make the feed licensable:
 *   registration age + registrar (RDAP), nameservers + hosting (DoH),
 *   impersonation target (brand matching), payment rails (wallets/handles),
 *   content fingerprint (kit/clone matching).
 */

export interface Enrichment {
  domain: string;
  registrar?: string;
  registered_at?: string;          // ISO; age is the single strongest scam signal
  domain_age_days?: number;
  nameservers?: string[];
  a_records?: string[];            // hosting IPs → campaign clustering key
  asn?: string;                    // hosting ASN, e.g. 'AS13335' — campaign clustering key
  tls_cert_sha256?: string;        // leaf cert hash from CT logs — campaign clustering key
  impersonates?: string;           // brand slug, e.g. 'paypal' — unlocks brand-protection buyers
  payment_rails?: { btc: string[]; eth: string[]; handles: string[] };
  content_sha256?: string;         // page-structure fingerprint for clone matching
  enriched_at: string;
}

// ---------- RDAP: registration data, free, no key ----------
export async function rdap(domain: string): Promise<Partial<Enrichment>> {
  try {
    const r = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { accept: 'application/rdap+json' },
    });
    if (!r.ok) return {};
    const j: any = await r.json();
    const registration = (j.events ?? []).find((e: any) => e.eventAction === 'registration');
    const registrar = (j.entities ?? []).find((e: any) => (e.roles ?? []).includes('registrar'));
    const registered_at: string | undefined = registration?.eventDate;
    return {
      registered_at,
      domain_age_days: registered_at
        ? Math.floor((Date.now() - Date.parse(registered_at)) / 86_400_000)
        : undefined,
      registrar: registrar?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3],
    };
  } catch { return {}; }
}

// ---------- DNS over HTTPS: infrastructure, free ----------
async function doh(domain: string, type: 'NS' | 'A'): Promise<string[]> {
  try {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`,
      { headers: { accept: 'application/dns-json' } },
    );
    if (!r.ok) return [];
    const j: any = await r.json();
    return (j.Answer ?? []).map((a: any) => String(a.data).replace(/\.$/, ''));
  } catch { return []; }
}

// ---------- Impersonation target ----------
// Normalizes leetspeak/homoglyph substitutions then substring/edit-distance
// matches against high-value brands. paypa1-security.com → 'paypal'.
const BRANDS = [
  'paypal', 'venmo', 'zelle', 'cashapp', 'wellsfargo', 'chase', 'bankofamerica',
  'citibank', 'coinbase', 'binance', 'amazon', 'apple', 'microsoft', 'google',
  'netflix', 'usps', 'fedex', 'ups', 'irs', 'dmv', 'square',
];
const DELEET: Record<string, string> = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b' };

function detectImpersonation(domain: string): string | undefined {
  const label = domain.split('.')[0].toLowerCase()
    .replace(/[0134578]/g, c => DELEET[c] ?? c)
    .replace(/[^a-z]/g, '');
  for (const brand of BRANDS) {
    if (label === brand) continue;                 // exact match of the label alone isn't proof — real brand domains are allowlisted upstream anyway
    if (label.includes(brand)) return brand;       // 'paypalsecurity' → paypal
    if (Math.abs(label.length - brand.length) <= 1 && editDistance(label, brand) === 1) return brand; // 'paypall'
  }
  return undefined;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// ---------- Payment rails: extract from scam page/message content ----------
export function extractPaymentRails(text: string) {
  return {
    btc: [...new Set(text.match(/\b(?:bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g) ?? [])],
    eth: [...new Set(text.match(/\b0x[a-fA-F0-9]{40}\b/g) ?? [])],
    handles: [...new Set(text.match(/\$[A-Za-z][A-Za-z0-9_]{2,20}\b/g) ?? [])], // CashApp $cashtags
  };
}

// ---------- Content fingerprint: structure-only hash for clone matching ----------
// Strips text content, keeps tag skeleton — cloned phishing kits share skeletons
// even when brand names/text differ.
export async function contentFingerprint(html: string): Promise<string> {
  const skeleton = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>([^<]*)</g, '><')           // drop all text nodes
    .replace(/\s(class|id|style)="[^"]*"/g, '')
    .replace(/\s+/g, '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(skeleton));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Hosting ASN: Team Cymru origin DNS, free, no key ----------
async function asnFor(ip: string | undefined): Promise<string | undefined> {
  if (!ip || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return undefined;
  try {
    const rev = ip.split('.').reverse().join('.');
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${rev}.origin.asn.cymru.com&type=TXT`,
      { headers: { accept: 'application/dns-json' } },
    );
    if (!r.ok) return undefined;
    const j: any = await r.json();
    const txt: string = j.Answer?.[0]?.data ?? '';
    const m = txt.match(/"?\s*(\d+)\s*\|/);   // '"13335 | 104.16.0.0/13 | US | arin |"'
    return m ? `AS${m[1]}` : undefined;
  } catch { return undefined; }
}

// ---------- TLS cert hash: CertSpotter CT-log API, free tier, no key ----------
async function tlsCertSha(domain: string): Promise<string | undefined> {
  try {
    const r = await fetch(
      `https://api.certspotter.com/v1/issuances?domain=${domain}&include_subdomains=false&expand=cert`,
      { headers: { accept: 'application/json' } },
    );
    if (!r.ok) return undefined;
    const j: any = await r.json();
    return j?.[0]?.cert?.sha256 ?? undefined;
  } catch { return undefined; }
}

// ---------- Scam-page fetch: rails + fingerprint source, capped + timeboxed ----------
async function fetchScamPage(domain: string): Promise<string | undefined> {
  for (const scheme of ['https', 'http']) {
    try {
      const r = await fetch(`${scheme}://${domain}/`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
        headers: { 'user-agent': 'Mozilla/5.0 (registry-enrichment; abuse contact: see safetyintercept.com)' },
      });
      if (!r.ok) continue;
      const text = await r.text();
      return text.slice(0, 200_000); // cap: kits fingerprint fine within 200KB
    } catch { /* try next scheme */ }
  }
  return undefined;
}

// ---------- Main ----------
export async function enrichDomain(domain: string, pageHtml?: string): Promise<Enrichment> {
  const [rdapData, nameservers, a_records, cert] = await Promise.all([
    rdap(domain), doh(domain, 'NS'), doh(domain, 'A'), tlsCertSha(domain),
  ]);
  const [asn, html] = await Promise.all([
    asnFor(a_records[0]),
    pageHtml !== undefined ? Promise.resolve(pageHtml) : fetchScamPage(domain),
  ]);
  return {
    domain,
    ...rdapData,
    nameservers,
    a_records,
    asn,
    tls_cert_sha256: cert,
    impersonates: detectImpersonation(domain),
    payment_rails: html ? extractPaymentRails(html) : undefined,
    content_sha256: html ? await contentFingerprint(html) : undefined,
    enriched_at: new Date().toISOString(),
  };
}

/* D1 addition (append to schema.sql):
CREATE TABLE enrichments (
  entity_id      INTEGER PRIMARY KEY REFERENCES entities(id),
  registrar      TEXT,
  registered_at  TEXT,
  domain_age_days INTEGER,
  nameservers    TEXT,   -- JSON array
  a_records      TEXT,   -- JSON array; index for campaign clustering
  impersonates   TEXT,   -- brand slug; index for brand-protection queries
  payment_rails  TEXT,   -- JSON
  content_sha256 TEXT,   -- index for clone matching
  enriched_at    TEXT NOT NULL
);
CREATE INDEX idx_enrich_brand ON enrichments(impersonates);
CREATE INDEX idx_enrich_fingerprint ON enrichments(content_sha256);
*/
