# SAFETY INTERCEPT: THE DEFINITIVE ENCYCLOPEDIC STRATEGIC PLAYBOOK

**Author:** Pollux, Strategic Synthesis Engine
**Date:** April 13, 2026
**Prepared Exclusively For:** Billy LeBlanc, Sole Founder

---

# VOLUME I: FOUNDATIONS

## I. The Executive Thesis

### The Intent Layer Category Claim
Safety Intercept operates natively at a completely new vector of cybersecurity: **The Intent Layer**. Traditional fraud systems operate at the Identity Layer (who is logging in) or the Transaction Layer (where the money is going). Safety Intercept is the only platform that answers the fundamental question: *“Should this transaction happen at all?”* 

By intercepting the consumer inside the browser DOM at the exact millisecond of payment authorization, Safety Intercept reads the psychological intent behind the transfer, interceding before the API calls even reach the bank.

### The "Fraud is a Decision Problem" Framework
Fraud is rarely an unauthorized technical hack. Over 90% of modern cyber threats originate from social engineering. Fraud is fundamentally a *decision problem caused by emotional manipulation*. Legacy models attempt to solve authorized push payment (APP) fraud using mathematical velocity metrics. Safety Intercept treats it as a cognitive issue—deploying a psychological circuit breaker to snap the victim out of the "scammer's trance."

### Structural Failure of Transaction-Layer Systems
Incumbents like Stripe Radar and Plaid Signal analyze the aerodynamics of an airplane after the engine has failed. They rely on lagging indicators: device biometrics, IP velocity, and historical transaction volume. Because they lack upstream visibility into the consumer's inbox (e.g., Gmail) and sit behind the API wall, they are mathematically locked out of capturing the emotional context that drove the transaction.

### Market Timing & Regulatory Shifts
The market is starved for this pre-transaction interception layer.
1.  **APP Fraud Statistics:** In 2025, Americans reported a record-breaking $15.9 billion in fraud losses. Imposter scams leveraging P2P platforms like Zelle and PayPal represent billions of these irrevocable transfers. 
2.  **Nacha 2026 Phase 2 Rules:** Effective June 19, 2026, the Nacha Operating Rules mandate that all ACH participants must establish risk-based fraud monitoring to identify transactions authorized under false pretenses (e.g., Business Email Compromise).
3.  **CFPB Paradigm:** Liability shifts are forcing networks (Zelle) to absorb scam losses, pivoting their financial incentives from passive processing to active fraud blockage.

---

## II. The Product Reality (Verified)

*All technical capabilities below are verified functioning within the `claude_knowledge_base.txt` and `POLLUX_CORE_LOAD`.*

### Live Surfaces

#### 1. PayPal Interception
The `payment_interceptor.tsx` content script actively observes the PayPal Single Page Application (SPA). Utilizing a `MutationObserver` mapped to `.send-btn`, the script deploys a click event listener configured with `{ capture: true }`. The moment the user clicks "Send", the extension calls `event.stopImmediatePropagation()`, halting the UI entirely. A proprietary modal falls into the viewport, forcing the user through a Trance-Breaker Questionnaire analyzed by Claude Haiku in real-time.

#### 2. Wells Fargo Zelle Interception
Fully hash-route aware. Because Zelle pathways inside Wells Fargo use dynamic React routing rather than hard page loads, the system monitors specific URL parameter shifts. Upon reaching the payment confirmation node, the identical cross-layer interception protocol is executed.

#### 3. Gmail Scam Detection
Operating asynchronously from the payment interceptor, the Gmail content script evaluates inbound emails. It injects high-contrast warning banners and visual "flag pills" directly into the DOM structure of suspicious emails. It weights locally processed heuristics against Claude API results (configurable to a 20/80 or 80/20 heuristic-to-LLM confidence blend). It records the semantic signature of the scam.

### The Intelligence Stack

#### 1. Heuristics
The system utilizes 18 distinct regex baseline patterns to catch zero-day and low-level fraud instantly. This circumvents API latency and provides immediate scoring for well-known vectors (e.g., "bail money", "IRS penalty", "$500 refund overcharge").

#### 2. Claude Haiku Integration
If heuristics fall below a confidence threshold, the payload is parsed and routed via a Cloudflare Worker relay (`shield-relay.bleblanc.workers.dev`). The worker protects API keys (`VITE_RELAY_AUTH_TOKEN`) and proxies the semantic payload to Anthropic's Claude 3 Haiku model. With an average round-trip latency of ~500ms, Haiku evaluates the psychological pressure of the message and returns a standardized risk object.

#### 3. Cross-Layer Correlation (The Moat)
This is the single most defensible technical asset within Safety Intercept.
*   **Mechanism:** When the Gmail scanner flags a high-risk email, it serializes a non-PII token representing the threat signature and stores it in `chrome.storage.local` with a timestamp.
*   **Activation:** The correlation engine checks this local storage payload when a user hits a 'Send' button on PayPal or Zelle.
*   **The Math:** If a payment attempt occurs within a 24-hour window of a flagged email, the system appends a `correlationNote` to the payload and injects an automatic, unmitigable **+30 points** to the transaction's overall risk score. 

### The "Margaret" Scenario
1.  **The Hook:** Margaret, a 68-year-old widow, receives an urgent email claiming an $899 Geek Squad recurring membership has been charged to her account.
2.  **The Flag:** The Gmail interceptor scans the psychological urgency, flags the email with an injected yellow banner, and writes the semantic timestamp to local storage.
3.  **The Manipulation:** Margaret calls the phone number in the email. The "agent" tells her to log into PayPal and send the $899 so they can process a "reversal".
4.  **The Interception:** Margaret types $899 into PayPal and clicks "Send". The DOM listener fires `{ capture: true }` and halts the thread.
5.  **The Calculation:**
    *   Payment Heuristic: 0 (The memo "refund" isn't intrinsically malicious).
    *   Claude Haiku Score: 92 (High urgency detected in the memo intent).
    *   Cross-Layer Correlation Boost: 30 (Geek Squad email detected 14 minutes ago).
    *   **Calculation:** (0 + 92) * 0.8 + 30 = 103 (Capped at 100).
6.  **The Block:** The risk score exceeds the "high" threshold. The vault-door UI drops. A custom, authoritative message states: *"We paused this transaction because it matches the exact pattern of a Geek Squad refund scam. Break communication with the person on the phone."* **Margaret's money never moves.**

### Known Failure Points

| Failure Mode | Description | Priority |
| :--- | :--- | :--- |
| **Relay Downtime** | If Anthropic APIs or Cloudflare Workers go offline, the extension fails to parse complex intent. *Fallback:* Degrades to standard heuristic checks. | High |
| **MV3 Service Worker Kill** | Chrome Manifest V3 aggressively suspends background workers after 30 seconds of idle time. The correlation engine must re-hydrate state on wake. | High |
| **DOM Fragility** | If PayPal or Wells Fargo obfuscates their CSS class names (e.g., `.send-btn` becomes `.x9b-qw`), the `MutationObserver` goes blind. | Critical |
| **Mobile Blind Spot** | The extension operates natively in desktop Chrome. As over 70% of consumer banking transactions are mobile, the physical volume is constrained. | Moderate (B2B API solves this) |

### Withdrawn/Unconfirmed Surfaces
*   **Venmo:** Unconfirmed capability due to heavy mobile restrictions.
*   **Chase Bank:** Withdrawn from active verifications pending production selector tests.
*   **Bank of America:** Withdrawn from active verifications pending production selector tests.

---

## III. The Competitive Landscape — Complete Threat Encyclopedia

### 1. Scamnetic (IDeveryone)
*   **Profile:** Series A | $16M Funding | Tampa, FL | Founded 2023.
*   **Product:** KnowScam 2.0 (Mobile App) and IDeveryone (FIs/Fintech API). Verifies the identity of the payment recipient before execution. Offers up to $25k insurance.
*   **Pricing:** Enterprise contracts / B2B SaaS.
*   **ICP:** Financial institutions, Fintechs, P2P Networks.
*   **Strategic Moves:** Relaunched IDeveryone heavily in January 2026. Corrected previous marketing to declare their recipient identity-proofing as *patent-pending*.
*   **Safety Intercept Gap:** Scamnetic evaluates *who* is receiving the money using a mobile interface or API. They do not intercept physically at the browser layer, and they are utterly blind to the Cross-Layer Correlation (Gmail-to-Send) signal.
*   **Threat Level:** 🔴 **RED**. Scamnetic is targeting the exact B2B budget Safety Intercept seeks, with a 12-month head start.

### 2. Google Chrome (Gemini Nano)
*   **Profile:** Public Corp (Alphabet) | Infinite Funding | Mountain View, CA.
*   **Product:** Native, on-device Gemini Nano embedded into Chrome Enhanced Protection. Ephemeral scanning of phishing domains and tech support scams.
*   **Pricing:** Free / Bundled.
*   **ICP:** Every global internet user.
*   **Strategic Moves:** Rolled out heavily in 2025/2026 for Android calls and Chrome web. Publicly announced roadmap extensions into package tracking and toll scams.
*   **Safety Intercept Gap:** Google’s model catches the entry vector (the fake website or phone call). However, due to extreme antitrust and privacy constraints, Google cannot and will not physically inject Javascript to hard-stop a PayPal.com authenticated transaction. Safety Intercept operates the "last mile" interception.
*   **Threat Level:** 🔴 **RED**. Existential infrastructure threat. If they extend to payment-layer authorization, extension viability collapses.

### 3. Norton Genie (LifeLock / Gen Digital)
*   **Profile:** Public Corp | $24B Market Cap | Tempe, AZ.
*   **Product:** AI scam protection across SMS, email, and web. 
*   **Pricing:** Free bundled with Norton 360 / LifeLock subscriptions.
*   **ICP:** Mass consumer base, seniors, families.
*   **Strategic Moves:** Launched February 2025. Mass distribution via existing Norton installs.
*   **Safety Intercept Gap:** Gen Digital operates top-of-funnel defense (the email/text). If the victim believes the scammer anyway and proceeds to PayPal, Norton has no mechanism inside the payment DOM to halt the transfer.
*   **Threat Level:** 🟠 **ORANGE**. Formidable distribution advantage, but fundamentally misses the payment execution layer.

### 4. Trend Micro ScamCheck
*   **Profile:** Public Corp | Tokyo, Japan.
*   **Product:** Chrome extension and mobile app. Flags phishing pages, SMS, and URLs.
*   **Pricing:** Freemium/Bundled consumer subs.
*   **ICP:** Mass consumer base.
*   **Strategic Moves:** Aggressive marketing of 99% accuracy on phishing reputation blocklists.
*   **Safety Intercept Gap:** Trend Micro uses reputation blocks (bad URLs). Safety Intercept uses behavioral blocking (bad intent). Trend Micro doesn't read the semantic intent of a Zelle memo.
*   **Threat Level:** 🟠 **ORANGE**. Immediate browser layer competitor, though technologically outmoded.

### 5. Aura
*   **Profile:** Private | High Eight-Figure Funding | Burlington, MA.
*   **Product:** Subscriptions providing ambient identity theft protection, credit locks, dark web monitoring. 
*   **Pricing:** $12-15/month subscriptions.
*   **ICP:** Families and aging parents.
*   **Strategic Moves:** Aggressive acquisition of consumer market share via bundled insurance ($1M).
*   **Safety Intercept Gap:** Aura is post-event remediation and credit protection, not realtime transaction interception. (Potential future acquirer).
*   **Threat Level:** 🟡 **YELLOW**. 

### 6. Scamy.io
*   **Profile:** Private | Unknown/Bootstrap.
*   **Product:** Free Chrome extension scanning for phishing.
*   **Safety Intercept Gap:** Trivial functionality. No AI correlation or DOM halting.
*   **Threat Level:** 🟢 **GREEN**.

### 7. Sardine
*   **Profile:** Series C | $145M Funding (a16z) | Miami, FL | Founded 2020.
*   **Product:** Device Intelligence & Behavior Biometrics (DIBB). Evaluates mouse jitter, typing speed, and IP behavior.
*   **Pricing:** Enterprise contracts / Pay-per-API.
*   **ICP:** Neobanks, Crypto exchanges, high-risk merchants.
*   **Strategic Moves:** Leaning aggressively into Nacha 2026 regulations. Partnering with credit bureaus.
*   **Safety Intercept Gap:** Sardine analyzes the biology of the user (how they type). Safety Intercept analyzes the psychology (why they are typing). Sardine has zero capability to execute a consumer-side browser extension.
*   **Threat Level:** 🟡 **YELLOW**. Enterprise API competitor in 24 months, potential B2B partner today.

### 8. Sift
*   **Profile:** Late Stage Private | Massive Valuations | San Francisco, CA.
*   **Product:** ML fraud decisioning driven by cross-merchant network effects.
*   **Pricing:** $200k-$1.9M Annual Contract Values (ACV).
*   **ICP:** Enterprise e-commerce, large marketplaces.
*   **Safety Intercept Gap:** E-commerce fraud (stolen credit cards) is a fundamentally different discipline than Authorized Push Payment (APP) fraud (consensual transfer to a scammer).
*   **Threat Level:** 🟢 **GREEN**.

### 9. Unit21
*   **Profile:** Series C | $92M Funding | San Francisco, CA.
*   **Product:** AML and Fraud Operations dashboard software. 
*   **Pricing:** Enterprise.
*   **ICP:** Fintechs and Sponsor Banks (Chime, Intuit, Green Dot).
*   **Strategic Moves:** Transitioned CEO in March 2026; aggressively rebranding as "Agentic AI Risk Infrastructure".
*   **Safety Intercept Gap:** Unit21 is the dashboard where fraud teams work. Safety Intercept is the sensor that feeds data into dashboards. 
*   **Threat Level:** 🟢 **GREEN**.

### 10. Alloy
*   **Profile:** Private | $1.55B Valuation | New York, NY.
*   **Product:** Identity decisioning orchestration layer. Routes API calls between FIs and data vendors.
*   **Safety Intercept Gap:** Orchestrator, not a signal generator.
*   **Threat Level:** 🟢 **GREEN**.

### 11. Hawk (Hawk.ai)
*   **Profile:** Series C | $56M Funding | Munich, Germany.
*   **Product:** AML + Fraud compliance for Tier-1 Banks.
*   **Strategic Moves:** Funding round dedicated to US expansion strategy.
*   **Safety Intercept Gap:** European-focused B2B infrastructure with no consumer footprint.
*   **Threat Level:** 🟢 **GREEN**.

### 12. Socure
*   **Profile:** Private | $4.5B Valuation | Incline Village, NV.
*   **Product:** RiskOS identity verification (KYC/AML). FedRAMP authorized.
*   **Safety Intercept Gap:** Determines "Is this John Doe?". Cannot determine "Is John Doe being coerced into sending $500 to a fake Geek Squad tech?".
*   **Threat Level:** 🟢 **GREEN**.

### 13. Persona
*   **Profile:** Series D | $200M raised | $2B Valuation.
*   **Product:** Verified identity layer.
*   **Safety Intercept Gap:** Orthogonal to payment intent.
*   **Threat Level:** 🟢 **GREEN**.

### 14. Plaid (Signal & Trust Index 2)
*   **Profile:** Private | >$13B Historical Valuation | San Francisco, CA.
*   **Product:** Plaid Protect, Trust Index 2 (Ti2), and Fraud Insights. Uses bank graph data to spot mule nodes.
*   **ICP:** Every major US fintech and 12,000 FIs.
*   **Strategic Moves:** Aggressively pushing real-time Fraud Insights in Q1 2026.
*   **Safety Intercept Gap:** Plaid sits strictly on the network. They are invisible to the browser DOM. The massive upstream risk is that Plaid chooses to acquire and bundle intent data.
*   **Threat Level:** 🟠 **ORANGE**. The ultimate B2B titan. Capable of replicating Safety Intercept if they deem the browser layer critical, though culturally hesitant to enter consumer software.

### 15. Stripe Radar
*   **Profile:** Private | Stripe.
*   **Product:** Embedded algorithmic fraud mitigation for Stripe checkout flows.
*   **Safety Intercept Gap:** Exclusively inside the Stripe merchant perimeter. Zero P2P visibility.
*   **Threat Level:** 🟢 **GREEN**.

### 16. Abnormal Security
*   **Profile:** Late Stage | $5.1B Valuation.
*   **Product:** Enterprise Cloud Email Defense.
*   **Safety Intercept Gap:** Protects corporate network inboxes. Does not protect Yahoo/Gmail consumer seniors.
*   **Threat Level:** 🟢 **GREEN**.

### 17. Material Security
*   **Profile:** Late Stage Enterprise.
*   **Product:** Post-delivery internal email redaction.
*   **Safety Intercept Gap:** Enterprise focus only.
*   **Threat Level:** 🟢 **GREEN**.

### 18. Proofpoint
*   **Profile:** Private (Thoma Bravo).
*   **Product:** Legacy enterprise anti-phishing gateways.
*   **Threat Level:** 🟢 **GREEN**.


### Competitive Matrix Table

| Company | Layer | Funding | ICP | Key Differentiator | Safety Intercept Advantage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scamnetic** | Mobile/B2B | $16M | Fintech/FIs | Patent-pending ID-proofing | Cross-layer browser correlation, intercept at Send |
| **Gemini Nano** | OS/Browser | Alphabet | Consumers | On-device, Ephemeral speed | DOM Interception, Payment UI specific halting |
| **Norton Genie** | Consumer App | Public | Consumers | Ambient bundle shelf access | P2P explicit interception, Intent Scoring |
| **Aura** | Consumer | $100M+ | Families | $1M Insurance remediation | Pre-authorization transaction stoppage |
| **Sardine** | B2B API | $145M | FIs/Crypto | Device mouse/typing biometrics | Intent analysis (the "why" not the "how") |
| **Plaid** | Network | ~$13B | FIs | Network node/Mule graphs | Zero-second psychological intent data |
| **Alloy / Socure** | Orchestration | ~$4B+ | FIs | Identity & KYC validation | Social engineering coercion detection |


### The Whitespace Moat
Traditional players verify Identity (Socure). E-commerce giants analyze Velocity (Sift). Scale vendors analyze Hardware (Sardine). No competitor simultaneously measures **Intent** (the contextual reason for the transfer) and **Correlated History** (has this precise user engaged with malicious inbound text within the last 24 hours on the same device). 

This is the uncharted whitespace: The point-of-sale behavioral circuit breaker.

### Collapse Timeline
*   **6-Month Window:** The initial wedge. Safety Intercept must acquire 500-1,000 early consumer users to prove the baseline dataset model before Gen Digital acquires Scamnetic or launches a clone intent-scorer extension. 
*   **12-Month Window:** Google Chrome extends Gemini Nano APIs directly to third-party developers, commoditizing the underlying inference. If Safety Intercept has not cemented a labeled P2P fraud dataset by this point, defensibility collapses into a feature wrapper.
*   **18-Month Window:** P2P platform architecture (Zelle/PayPal) aggressively pivots away from standard web-DOMs into compiled shadow roots hostile to `MutationObservers` due to regulatory pressure. Safety Intercept must have crossed the B2B API threshold by this cliff.
