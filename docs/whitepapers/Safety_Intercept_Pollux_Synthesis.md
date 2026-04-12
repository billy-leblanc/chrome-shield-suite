# Safety Intercept: The Pollux Strategic Synthesis

## PHASE 1: VISIBLE AUDIT TRAIL <audit_log>

**1. Data Inventory:**
1. [Source: `CLAUDE.md`] The Chrome extension is restricted strictly to three verifiable surfaces: PayPal, Wells Fargo Zelle, and Gmail. 
2. [Source: `FOUNDERS_BUILD_LOG.md`] The Cloudflare relay routes requests to Anthropic's Claude Haiku, returning a semantic score in ~500ms with an 80% AI / 20% Heuristic blend weight for Gmail context.
3. [Source: `FOUNDERS_BUILD_LOG.md`] The latency of cross-channel visibility is a 24-hour window, relying on `chrome.storage.local` to tether an incoming Gmail threat to a PayPal payment button press.

**2. Critical Gap:** 
The single most important question the files DO NOT answer is: *How does Safety Intercept intend to survive aggressive DOM-class obfuscation and CWS Review policies if PayPal and Wells Fargo interpret payment button event-hijacking (via `stopImmediatePropagation`) as a malicious overlay?*

**3. UX Stress Test:** 
A user clicks "Send" to a scammer on PayPal. Safety Intercept's `{ capture: true }` event listener fires first. The native payment sequence is severed instantly via `stopImmediatePropagation` [Source: `FOUNDERS_BUILD_LOG.md`]. The user has zero milliseconds to bypass it because the site-native scripts never receive the click event. The user is forced into a cognitive-friction questionnaire while the 500ms Claude Haiku call evaluates the intent. 

**4. Hallucination Risk Assessment:** 
I am most likely to hallucinate the specific go-to-market mechanics of selling the B2B API to Neobanks (Section 3). The files state a target of $50k-$500k/yr, but lack documentation of any active pilots. 
*Mitigation:* I will bracket all B2B revenue and adoption assertions as `[ASSUMPTION: Unvalidated in Files]`.

**5. AI Integration Sanity Check:** 
`[AI NEED: Documented]` 
The heuristic engine missed the "Margaret" grandparent semantic scam entirely (0% heuristic score), while the LLM accurately identified multiple psychological threat vectors to score it a 92/Critical [Source: `FOUNDERS_BUILD_LOG.md`]. 

---

## PHASE 2: WHITE PAPER SCHEMA

### SECTION 1: THE PRODUCT FLOOR

Safety Intercept is a live, real-time Chrome Extension serving as an agentic psychological circuit breaker. It is executing on Manifest V3. 

**What is Verifiably Built:**
- A unified content script intercepting the specific payment transaction buttons on PayPal and Wells Fargo Zelle [Source: `FOUNDERS_BUILD_LOG.md`].
- A Gmail content script that scans incoming emails upon SPA navigation, drawing a high-visibility semantic banner.
- A background worker (`risk_engine.ts`) correlating intra-day email threats to immediate DOM-layer payment clicks.
- A `/score_memo` Cloudflare Relay that anonymizes payloads and returns fraud logic via Claude Haiku within an acceptable 500ms latency ceiling [Source: `CLAUDE.md`].

**Can we stop a transaction today?** `Yes.` [Source: `FOUNDERS_BUILD_LOG.md` (Attack chain demo verified)]. 

### SECTION 2: THE VULNERABLE USER FLOW

The extension replaces the user's panicked haste with cognitive friction. Upon initiating the transfer, the native flow halts, and the user is confronted with a questionnaire ("Someone told you to send this?") leading into a dynamic modal block ("You received a scam email from safetyintercept@gmail.com 26 minutes ago") [Source: `FOUNDERS_BUILD_LOG.md`].

`[ASSUMPTION: User attention compliance not validated in files.]` There is no telemetry data proving the user will accept the modal rather than immediately disabling the extension in frustration. The assumption that the user will view the friction as a "guardian angel" rather than a broken webpage relies on flawless interface messaging, which is not verified.

### SECTION 3: THE LIABILITY GAP

Incumbent B2B platforms (e.g., Sardine, Plaid) evaluate the geometry of fraud (device location, velocity, behavior) after the user intention has crystallized. Safety Intercept interrupts the semantic formation of that intent.

By capturing labeled data on the actual conversational prompts that precede an authorized push payment, the consumer extension creates a dataset uniquely tailored to shift liability.
`[Industry Context]` With regulatory shifts trending closer to holding receiving institutions or originators liable for APP fraud, capturing the precise text elements that coerced the user is a massive B2B signal that enterprise SEGs cannot access because they don't touch the funds, and payment processors cannot access because they don't see the Gmail tab.

### SECTION 4: COMPETITIVE COLLAPSE TIMELINE

- **Estimate A (Optimistic Pattern-Match):** 18-24 Months. Plaid cannot pivot away from its neutral B2B roots to deploy consumer spyware that reads private Gmail inboxes. Existing fraud vendors are structurally misaligned from the DOM layer.
- **Estimate B (Pessimistic Reality):** 6 Months. Google owns the DOM and controls Chrome distribution. If Gemini Nano shifts from tech-support warning banners natively in Chrome, right into payment-authorization heuristics on the exact domains Safety Intercept protects, the standalone extension becomes obsolete.

`[DEFENSIBILITY HALF-LIFE RANGE: 6 - 24 Months]`
*Claude / Anthropic Advantage Consideration:* The cloud-based API introduces latency that Gemini Nano (on-device) sidesteps. However, until Gemini natively intercepts external SPA routing hashes on Wells Fargo, the cloud-AI semantic pipeline remains the only viable real-time bridge.

### SECTION 5: PARALLEL ROADMAPS

**5A: NON-TECHNICAL FOUNDER ROADMAP**
- **Month 1:** Deploy the specific "DOM Visibility Gap" visual mapping. Leverage the CWS approval event to execute the Reddit and Campus Blitz targeting student discords and `r/personalfinance` [Source: `Safety_Intercept_Grand_White_Paper.tex`].
- **Month 2:** Analyze the first 1,000 anonymized opted-in memos `[Source: CLAUDE.md telemetry structure]`. Build the B2B dataset pitch deck outlining exactly what is visible in-browser vs invisible to APIs.
- **Month 3:** Utilize Strawberry Creek Ventures network (UC Berkeley) to secure 3 unpaid risk-team API pilots [Source: `Safety_Intercept_Grand_White_Paper.tex`].

**5B: TECHNICAL FOUNDER ROADMAP**
- **Month 1: Harden the DOM Hook:** The shadow DOM injection and `stopImmediatePropagation` strategies are extremely fragile to A/B testing by PayPal/Wells Fargo [Source: `Safety_Intercept_Grand_White_Paper.tex`]. Develop self-healing regex/selectors and abstract the interception logic so that when the selectors break, they can be updated via the background worker without requiring a new CWS submission.
- **Month 2: The Semantic Edge (Claude Haiku Tuning):** Further optimize the Cloudflare Relay proxy for lowest latency. `[Source: FOUNDERS_BUILD_LOG.md]` demonstrates Claude Haiku operates well inside the 500ms bounds.
- **Month 3: Privacy-Preserving Data Flywheel:** Stand up the mock `POST /score_memo` B2B API endpoint that accepts anonymized third-party data to showcase the proprietary dataset's value to prospective fintech buyers.

### SECTION 6: THE UNCOMFORTABLE SYNTHESIS

Safety Intercept possesses a verifiably engineered DOM-layer circuit breaker that catches semantic manipulation APIs natively miss. However, the exact technical mechanisms enabling this—aggressive event hijacking and Shadow DOM injection on major financial domains—sit in direct crosshairs of both banks’ anti-bot sweeps and Chrome Web Store policies. The window to build a defensible B2B dataset of correlated intent before Google integrates Gemini Nano natively into payment flows is brutally short, requiring flawless distribution over the next six months to convert a vulnerable consumer tool into an enterprise data moat.
