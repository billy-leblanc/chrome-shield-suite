/**
 * Curated legitimate-sender domains — payment processors, banks, brokerages,
 * government. Mirrors the registry D1 `allowlist` payment-sender seed
 * (registry/seed-allowlist.sql); keep the two in sync.
 *
 * Used by the auth gate (Phase 1.2): authenticated mail from these domains is
 * score-capped — legitimacy evidence dominates content evidence. This is the
 * engine-side cash@square.com false-positive fix; the registry-side fix is the
 * D1 allowlist table blocking publication structurally.
 */
export const SENDER_ALLOWLIST: ReadonlySet<string> = new Set([
  // payment processors
  'square.com', 'cash.app', 'paypal.com', 'venmo.com', 'zellepay.com',
  'stripe.com', 'plaid.com', 'wise.com',
  // banks
  'chase.com', 'wellsfargo.com', 'bankofamerica.com', 'citi.com', 'citibank.com',
  'capitalone.com', 'usbank.com', 'pnc.com', 'tdbank.com', 'truist.com',
  'ally.com', 'discover.com', 'americanexpress.com', 'aexp.com', 'synchrony.com',
  // brokerages / crypto exchanges
  'schwab.com', 'fidelity.com', 'vanguard.com', 'robinhood.com',
  'coinbase.com', 'kraken.com',
  // financial services / credit bureaus / government / shipping
  'intuit.com', 'experian.com', 'equifax.com', 'transunion.com',
  'irs.gov', 'ssa.gov', 'usps.com',
]);

export function isAllowlistedSender(senderDomain: string | undefined): boolean {
  if (!senderDomain) return false;
  const d = senderDomain.toLowerCase().trim();
  if (SENDER_ALLOWLIST.has(d)) return true;
  // subdomain match: mail.chase.com → chase.com
  for (const base of SENDER_ALLOWLIST) {
    if (d.endsWith('.' + base)) return true;
  }
  return false;
}
