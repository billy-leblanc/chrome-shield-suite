# VOLUME IV: APPENDICES

## Appendix A: Code Architecture Reference

The Safety Intercept architecture is fully dependent on Chrome Extensions Manifest V3 (MV3) acting in tandem with edge compute services to bypass the heavy requirements of local LLMs. 

### Core File Structure
Based on `claude_knowledge_base.txt`:

*   `manifest.json`: Defines the MV3 permissions. Declares broad host permissions (`"*://*.paypal.com/*"`, `"*://*.mail.google.com/*"`) required for DOM injection. Enforces `chrome.storage` for the correlation variables.
*   `content_scripts/payment_interceptor.tsx`: The primary execution node. Uses `MutationObvserver` to query the DOM asynchronously as React hydrates the page. Binds a `{ capture: true }` click listener to the `Send` or `Pay` button. 
*   `content_scripts/gmail_analyzer.tsx`: Executes asynchronously on `mail.google.com`. Parses email bodies for coercive semantics. Triggers warning banners using standard `document.createElement`, dropping visual warning pills at the top of the viewport.
*   `background/background.ts`: The MV3 Service Worker. Acts strictly as an ephemeral message router to circumvent the 30-second execution kill limit. Brokers the fetch requests between the content scripts and the Cloudflare worker.
*   `cloudflare/relay-worker.js`: The backend proxy hosted at `shield-relay.bleblanc.workers.dev`. Hardcodes the Anthropic API key (`ANTHROPIC_API_KEY`) and authenticates inbound extension traffic via a shared secret (`VITE_RELAY_AUTH_TOKEN`). Exposes `/analyze_intent` endpoint communicating exclusively with `claude-3-haiku-20240307`.
*   `risk_engine.ts`: Contains the mathematical thresholds. Evaluates heuristics, invokes the LLM API call via the background script, factors in the 24-hour Cross-Layer Correlation score boost using `await chrome.storage.local.get(['threat_token'])`, and computes the final 0-100 `riskScore`.

### The End-to-End Data Flow
1. **Context Acquisition:** `gmail_analyzer.tsx` identifies a threat → sets `chrome.storage.local.set({ threat_token: timestamp })`.
2. **Execution Halt:** User attempts P2P transfer → `payment_interceptor.tsx` captures the click, strips PII, and halts propagation.
3. **Transmission:** Content script emits `chrome.runtime.sendMessage()` to the Service Worker.
4. **Relay:** Service Worker authenticates against the Cloudflare Worker.
5. **Inference:** Cloudflare Worker queries Anthropic Claude Haiku with standard prompt engineering ("You are an expert fraud analyst... return JSON.").
6. **Result Assembly:** Cloudflare returns JSON payload to Service Worker.
7. **Score Calculation:** Service Worker feeds payload to `risk_engine.ts`. The storage token adds +30 correlation. 
8. **Intervention:** Final score routed back to `payment_interceptor.tsx` → UI state updates to Drop Vault Door if specific thresholds are breached. 

---

## Appendix B: Glossary of Terms

*   **Agentic AI Fraud Analyst:** Safety Intercept's operational identity. An LLM agent configured to autonomously interdict threats actively operating in the consumer's web environment.
*   **Authorized Push Payment (APP) Fraud:** A scam wherein a consumer is socially engineered into willingly transferring funds directly to a fraudulent counterparty using an instant payment network.
*   **Cross-Layer Correlation:** The proprietary mechanism of associating a hostile semantic flag in an inbox (e.g., Gmail) with a subsequent payment transfer at a discrete endpoint (e.g., PayPal), temporally linked within 24 hours.
*   **Decision-Layer Security:** The fundamental cybersecurity paradigm where the protective measure addresses the *user's decision* to execute the action, as opposed to the *network transmission* of the action.
*   **Intent Layer:** The cognitive environment bridging the consumer's psychological reason for initiating a transaction and their physical input. 
*   **Margaret Scenario:** The archetype case study representing the core vulnerable demographic (aging seniors targeted by tech-support/refund scams).
*   **Psychological Circuit Breaker:** The user interface specifically designed to force a cognitive break, stopping the "automatic" behavior driven by scammer urgency.
*   **Trance-Breaker Questionnaire:** The real-time interactive modal dropped over a halted transaction that forces the victim to articulate *why* they are sending the money, thereby breaking the social engineering momentum.

---

## Appendix C: Research Citations & Gap Log

### Core Document Citations
1. `grand_marketing.md` / `grand_marketing.tex` — Strategy and SEO frameworks.
2. `seo_master_playbook.md` — The execution marketing schedule.
3. `POLLUX_CORE_LOAD_White_Paper.tex` — Complete product functionality log.
4. `Safety_Intercept_Pollux_Synthesis.md` — The initial threat matrix model.
5. `battle_plan.md` — 30-day tactical projections.
6. `competitive_intelligence.md` — Base structural intelligence on the 18 competitors.
7. `Safety_Intercept_Grand_White_Paper.tex` — B2B API integrations.
8. `marketing.md` — Immediate viral acquisition.
9. `claude_knowledge_base.txt` — Concrete code truth logic.
10. `CLAUDE.md` — Supported surfaces.

### 2026 Web Research Citations (April 2026 ground truths)
1.  **FTC 2026 Fraud Report:** Record-breaking $15.9 billion in fraud losses. (Consumer Financial Protection Bureau Litigation Notes).
2.  **Nacha Phase 2 Rules:** June 19, 2026 ACH fraud monitoring requirements targeting false-pretense schemes and Business Email Compromise. [NACHA Operating Rules Updates].
3.  **Google Gemini Nano 2026 Roadmap:** On-device Chrome Enhanced Protection targeting tech support scams and expanding to package tracking scams via ephemeral edge models. 
4.  **Chrome Web Store Extensibility Policies:** Explicit disallowance of standard hidden traffic blocking. Interceptors require clear upfront disclosure preventing man-in-the-browser classification.
5.  **Scamnetic IDeveryone USPTO Clarification:** Scamnetic "recipient identity-proofing" patent clarified via formal Jan 2026 public notice as "patent-pending," not fully issued.

### Gap Log for Future Primary Research
*   **Bank Pricing API Willingness:** What is the specific price-ceiling a mid-tier Neobank (e.g., Varo) will pay per call for intent analytics prior to developing it in-house? *Action: Execute Week 4 cold outreach pilot.*
*   **Sardine DIBB Efficacy vs Intent Analysis:** How effectively does Sardine detect remote-desktop protocol (RDP) takeovers compared to our manual semantic intent check? *Action: Review public case studies.*
*   **Google Gemini Payment Roadmap:** Is Google actively testing payment-surface blocking in Chrome Canary builds? *Action: Monitor Chromium Git logs for `payment-intent` observer flags.*

---
*End of Encyclopedia.*
