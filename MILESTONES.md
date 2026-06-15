# Safety Intercept — Scaling Milestones

*Last updated 2026-06-15. This is the running record of the 5-phase plan: what's
done, why it mattered, and what's left.*

---

## The business in one paragraph

Safety Intercept is a fraud-interception Chrome extension (flags scam payments &
phishing emails in real time). The **scaling vehicle** is a public **scam
registry** built on top of it — a "Have I Been Pwned for fraud." Every scam the
engine detects becomes a public, evidence-backed, search-indexed page. People
Google *"is [site] legit"* millions of times a month, so the registry markets
itself through search: **detection → indexed page → search visitor → install →
more detection.**

**Three revenue layers:**
1. **Affiliate/display** on registry search traffic — funds the machine (~$15–30k/mo at scale)
2. **Consumer Pro** subscriptions — alerts, elder-protection (~$500k ARR range)
3. **B2B feed/API licensing** — the threat-intel feed sold to banks, fintechs, marketplaces, brand-protection firms ($2–8M ARR territory — where the real money is)

**Honest staircase:** ~$300–800k year 1, $2–4M year 2, $10M only if the
enterprise licensing layer lands (~year 3).

---

## The 5-phase plan

### ✅ Phase 0 — Security hardening · DONE
**Why:** the relay leaked its auth token and the whole pipeline assumed a trusted
relay. Everything downstream is worthless if the enclave is compromised.

- Rotated the leaked `RELAY_AUTH_TOKEN`; killed the old one
- Header (Bearer) auth on admin endpoints; URL-param tokens rejected
- Per-endpoint CORS lockdown
- **Token-free extension + per-IP rate limiting** — the baked-in secret was
  extractable from every install *and* rotation broke every user; replaced with
  rate limits on the relay (protects the Anthropic budget too)
- Fixed stale KV namespace, pinned account ID

### ✅ Phase 1 — Engine fixes (false positives + labeling) · DONE
**Why:** a published false positive about a real business is a lawsuit. Precision
is the thing that makes the registry survivable.

- Extracted pure scoring into `packages/engine` (shared by extension/eval/registry)
- **Auth gate** — authenticated allowlisted senders cap at 40 (the cash@square.com
  fix); verified spoofs & lookalikes are NOT capped
- **Taxonomy governance** — engine + Haiku constrained to 23 canonical technique
  slugs + an `other` escape hatch; unknown labels fail closed to `uncategorized`
- **Eval harness** (local/llm/hybrid modes) with a 0.95 precision gate in CI
- Baseline: local P=1.0/R=0.4, **llm P=1.0/R=1.0** on the seed set
- cash@square decision closed: heuristics-only (Haiku scores legit OTPs **0**)
- "Not a scam" button → signal-only correction + **opt-in** content sharing
- **Per-install `installId`** on every event — distinct users are now countable
  (`/users` admin endpoint)

### ✅ Phase 2 — Data collection / enrichment · DONE (one known gap)
**Why:** deep scam-side enrichment is what makes the feed *licensable* instead of
a commodity list. This is the difference between a $5k and a $50k feed.

- **PII purge** (the sellability gate): geo → country-only, no raw IP, no
  threadId/subject/memo, amounts → ranges; 90-day TTLs; 189 existing rows
  scrubbed → **0 PII fields remaining**. This is what makes the dataset an asset
  in a buyer's diligence instead of an inherited breach.
- Enrichment per entity: registrar, **domain age**, hosting **ASN**, IPs,
  nameservers, **TLS cert hash** (CT logs), impersonated brand, payment rails
  (crypto wallets/handles), content/kit fingerprint
- ⚠️ **Known gap:** RDAP (domain age/registrar) is rate-limited during bulk
  enrichment — only ~24/733 candidates got age. Needs a paced/retrying backfill
  worker. Domain age is both a top sell-signal and the compromised-site safety
  filter, so this is the next real engineering task.

### ✅ Phase 3 — Registry pipeline · DONE (shadow mode)
**Why:** this is the actual product — the indexed pages that create the search
flywheel.

- D1 schema, queue, ingestion via `normalize.ts`, dedup, corroboration gate
- Feed pollers (OpenPhish + URLhaus) every 30 min
- Lifecycle tracker + **freshness** (lead-time over public feeds, takedown timing)
- **Campaign attribution** — clusters entities by shared infra into actors;
  8 live campaigns (e.g. one operator across `roblox.et`/`roblox.com.ml`/`robiox.com.ua`)
- Consent-safe **aggregate views** (k≥5 floor) — the anonymized insight product
- Staging page renderer + auth-gated `/preview` + disputes (72h SLA) + sitemap
- **Shared-infrastructure suppression** — `vercel.app`, `github.io`, `ipfs.io`,
  etc. can never publish (scammers rent them; the platforms aren't scams). This
  caught the one "publishable" entity being `ipfs.io` — a legit service — before
  it could go live.

### ✅ Phase 4 — LLC + legal · LLC DONE
**Why:** publishing scam verdicts is defamation-exposed. The LLC turns the
registry from personal liability into a company asset; the dispute process +
"indicators not facts" language make it survivable.

- ✅ **LLC formed**
- ⏳ ToS + dispute policy page should be live + linked before pages go indexable
- The dispute intake endpoint (72h SLA) is built; needs a published policy page

---

## What's live right now

| Resource | Detail |
|----------|--------|
| Workers | `shield-relay`, `registry-ingest` |
| D1 | `registry` — 1,737 entities · 3,284 detections · 1,737 enriched · 8 campaigns |
| KV | `shield-logs`, `TELEMETRY_LOGS`, `GROUNDTRUTH` |
| Allowlist | 10,012 patterns (Tranco 10k + payment senders) + 44 shared-infra suffixes |
| Website | safetyintercept.com (new landing live) |
| Extension | 1.0.3 built (token-free, installId, consent flow) — **not yet published to CWS** |

---

## What's left — the honest critical path

**The product is ~90% built and 0% earning.** The remaining blockers are mostly
not code:

1. **Publish 1.0.3 to the Chrome Web Store** *(zip ready: `~/Downloads/safety-intercept-1.0.3-cws.zip`)*.
   Nothing reaches users until this ships, and the registry can't get its second
   corroboration source (extension detections) without users on 1.0.3. **This is
   the unlock.**
2. **ToS + dispute policy page live** — last legal step before pages go public.
3. **Fix RDAP age backfill** — paced worker so enrichment (and the young-domain
   safety filter) actually populates. Without it, almost nothing is safely publishable.
4. **Ground truth → 400 samples** — fills organically via the opt-in flow once
   users exist (downstream of #1).
5. **The money step nobody's done yet:** package the feed as a product and put it
   in front of a first design partner (a credit union, brand-protection firm,
   marketplace). The build was the easy part; this sales motion is layer 3, the
   $2–8M layer.

**One line:** ship the extension, stand up the ToS page, then go sell the feed.
