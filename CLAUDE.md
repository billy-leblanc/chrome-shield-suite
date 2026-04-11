# chrome-shield-suite: Safety Intercept

## Identity
At the start of every session, read `/Users/billyleblanc/.claude/memory/POLLUX_SOUL.md`. This is the soul of this partnership. It is not optional.

## What This Product Actually Is
A Chrome extension that intercepts payment fraud and detects social engineering scams. It is a **consumer product** with a **future B2B API play**. The consumer extension is the data flywheel.

## What We Actually Support (As Of April 2026)
- **PayPal** — payment interception at the Send button
- **Wells Fargo (Zelle)** — payment interception on the Zelle send flow (hash-based SPA routing: SENDMONEY_ENTER_DETAILS and SENDMONEY_VERIFY_DETAILS only)
- **Gmail** — scam email detection via content script

**That is it. Three surfaces. Do not add platforms unless Billy explicitly asks.**

## What We Do NOT Have (Do Not Hallucinate These)
- No Venmo support (removed)
- No HSBC, Barclays, or Revolut support (never shipped)
- No SMS / mobile phishing detection
- No crypto scam detection beyond heuristics
- No open source GitHub repo
- No Chrome Web Store listing yet (pending review since 2026-04-02)
- No eval suite results to cite as real interceptions (the eval scripts in /scripts ran against a synthetic corpus)

## Tech Stack
- **Framework:** React 18 + Vite
- **Manifest Version:** Chrome Extension Manifest V3
- **Build output:** `extension/` (NOT `dist/`)
- **Relay:** Cloudflare Workers at `shield-relay.bleblanc.workers.dev`
- **AI analysis:** Anthropic Claude Haiku (~500ms latency)

## Project Structure
- `src/content/payment_interceptor.tsx` — unified interceptor for PayPal + Wells Fargo Zelle
- `src/content/gmail_scanner.tsx` — Gmail scam detection content script
- `src/background/risk_engine.ts` — MV3 service worker, risk scoring, cross-layer correlation
- `src/core/fraud_detector.ts` — heuristic fraud detection logic
- `cloudflare/relay-worker.js` — Cloudflare Worker relay (auth, LLM proxy, telemetry, events)
- `src/pages/Index.tsx` — landing page
- `src/pages/Privacy.tsx` — privacy policy at /privacy
- `extension/` — built output, committed to git, served by Vercel

## Data & Telemetry (Accurate)
- Payment memos and flagged email content → Cloudflare relay → Anthropic API for analysis
- Detection events always logged to Cloudflare KV (SHIELD_LOGS): platform, risk score, flags, timestamp
- Telemetry opt-in only: anonymized memo text (PII stripped) → Cloudflare KV (TELEMETRY_LOGS)
- Local only (never leaves device): threat log, event log, stats, 24h Gmail correlation window

## Coding Standards
- **Interception:** Use `{ capture: true }` and `MutationObserver` for SPA robustness
- **Isolation:** Shadow DOM required for all injected UI elements
- **Risk assessment:** Content scripts MUST send to RiskEngine before showing any warning
- **Security:** `stopImmediatePropagation` on intercepted events, no raw innerHTML

## Current Priority (April 2026)
Getting real users. Chrome Web Store approval is the unlock. Do not build new features until there are users generating real telemetry. The next legitimate engineering tasks are:
1. Chrome Web Store approval (waiting, nothing to do)
2. Custom domain via GitHub Student Pack (approved, waiting on delivery)
3. HN Show HN post once CWS is live

## Verification & Commands
- **Dev server:** `npm run dev`
- **Build:** `npm run build` (outputs to `extension/`)
- **Load extension:** Chrome → Extensions → Load unpacked → select `extension/` folder
