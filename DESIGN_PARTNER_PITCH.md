# Safety Intercept — Fraud intelligence for the agentic-finance era

**The trust & safety layer that detects scams, explains them, and stops the payment before money moves.**

*A one-page brief for fintechs, marketplaces, banks/credit unions, and brand-protection teams.*

---

## The problem (in your customers' own words)

Per Plaid's *State of Intelligent Finance* (Harris Poll, Feb 2026, n=2,002):

- **57%** are *more likely to trust a fintech app* if it uses AI to detect fraud and prevent scams.
- **41%** name fraud protection the **#1 reason** they'll share data — above cashback, above better rates.
- **44%** will let an AI agent move money — but demand a **confirmation step, an undo, human approval, and dollar limits.** *"Security must scale with the risk level of the action."*
- **80%** expect companies to make AI-driven mistakes right; **60%** trust more when they understand the **"why."**

As AI agents start moving money on people's behalf, the missing piece isn't intelligence — it's a **trustworthy guardrail at the moment of action.** That's what we are.

## What we provide

1. **Real-time scam-domain feed (API).** Confirmed scam domains with scam-side enrichment — registrar, domain age, hosting ASN, impersonated brand, TLS-cert + phishing-kit fingerprints — and **campaign attribution** (one actor mapped across many domains). PII-free by construction.
2. **Explainable detections.** Not a black-box score — plain-language reasons (urgency, impersonation, isolation pressure) you can surface to your users. The "why" the data says converts trust into action.
3. **The interception pattern.** Our consumer extension already intercepts on PayPal, Venmo, Cash App, Zelle, and Gmail — the confirm-before-you-send checkpoint, productized.

## Why it's defensible as a data asset

- **Scam-side only, no user PII** — passes an acquirer's security review as an asset, not an inherited breach.
- **Self-feeding** — extension detections + CT logs + abuse feeds → registry → feed → more detections.
- **Freshness** — campaign + lifecycle data designed to flag domains *before* public feeds list them.

## Try it today (live API)

```
GET https://registry-ingest.bleblanc.workers.dev/feed
Authorization: Bearer <pilot-token>
?since=2026-06-15   ?limit=500
```
Returns JSON: `domain`, `score`, `severity`, `techniques[]`, `sources[]`, `campaign_id`, `enrichment{…}`.

## The pilot

A 30-day read-only feed pilot at **$500–$1,000/mo**, scoped to your use case:
- **Fintech / bank:** block or step-up payments to flagged merchant domains.
- **Marketplace:** vet seller/listing domains; catch off-platform payment lures.
- **Brand protection:** find clones/typosquats of your brand (we already cluster impersonations).

Decision gate after 30 days: hit rate on your traffic, freshness vs. your current source, integration effort.

**Contact:** Billy LeBlanc · bleblanc@berkeley.edu

*Indicators are evidence-based risk signals, not legal determinations; every entity carries a dispute process.*
