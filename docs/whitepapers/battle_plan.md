# Safety Intercept — Battle Plan
**Compiled:** 2026-04-11
**Sources:** `ssj1.pdf` (strategic positioning), `marketing.md` (first 100 users tactical), `competitive_intelligence.md` (landscape)

This is the single document to act from. Landscape → positioning → 30-day tactics → immediate next moves.

---

## Part I — The Core Thesis (from ssj1 + competitive_intelligence)

### You are not launching a Chrome extension. You are launching the first real-time scam interception layer.

Fraud companies fight over: *"Was this transaction fraudulent?"*
You answer: **"Should this transaction ever happen?"**

That is not a feature improvement. That is a different layer of reality in the stack. It determines your messaging, your channels, and your velocity.

### Why bundling doesn't kill you
- **Stripe / Sardine / Plaid can see:** transaction amount, user history, device signals
- **They cannot see:** the Gmail message that caused the payment, the psychological manipulation, the intent behind the memo

Traditional fraud systems operate at step 3 (evaluate risk after transaction initiated). You operate at step 0 — *before the user even hits Send*, with context from their inbox. You operate earlier in the timeline. That is the moat.

### The positioning (non-negotiable)
> **"We stop scams before the transaction even becomes fraud."**

Every pitch, every landing page, every Reddit post leads with this. Not "fraud protection extension." Not "scam checker." **Real-time scam interception layer.** Infrastructure, not a feature.

---

## Part II — The Competitive Reality (from competitive_intelligence)

**Only 5 things matter this week:**

1. **Nobody is doing exactly what you're doing.** Free Chrome extension that intercepts at the Send button on PayPal + Wells Fargo Zelle *and* reads Gmail *and* correlates in a 24h window — that combination is yours alone.

2. **Scamnetic is your closest direct competitor.** $16M raised, Tampa, launched IDeveryone Payment Protection Jan 2026. Same consumer→B2B playbook, 12 months ahead. *They are a mobile app, not a browser extension.* They do not have Gmail cross-layer correlation. That is your wedge.

3. **Google Chrome Gemini Nano is the existential long-term threat.** On-device LLM scam detection since May 2025. Today: tech support scams. Roadmap: "other types of scams." If they extend to payment-authorization fraud, the extension layer becomes a commodity. **Defense: the dataset and the cross-layer correlation — not the extension.**

4. **B2B fraud API incumbents are too well-funded to fight head-on.** Sardine $145M (a16z), Sift $200K–$1.9M ACV, Unit21 $92M, Alloy $1.55B, Hawk $56M, Socure $4.5B, Persona $2B. You don't out-capitalize them. You become the unique signal they can't reproduce.

5. **Plaid is the biggest upstream risk.** They have bank data, fintech distribution, Q1 2026 real-time Fraud Insights. They don't touch consumers directly — that's your window. Engage early as a partner before they build.

### The Alert Levels
- 🔴 **RED (existential):** Scamnetic, Google Chrome Gemini Nano
- 🟠 **ORANGE (partial overlap):** Norton Genie, Trend Micro ScamCheck, Plaid
- 🟡 **YELLOW (adjacent):** Scamy.io, Aura, Sardine
- 🟢 **GREEN (not direct):** Sift, Alloy, Unit21, Hawk, Socure, Persona, Abnormal, Material, Proofpoint, Stripe Radar

*Full matrix and deep-dives in [competitive_intelligence.md](competitive_intelligence.md).*

---

## Part III — Whitespace (What Nobody Else Has)

1. **The 24h cross-layer correlation window.** Scam email → payment attempt, same device, tight causal window. Nobody has this signal. Lead with it in every pitch.

2. **A clean, labeled, free-tier-produced scam corpus.** Every B2B fraud API is guessing at ground truth from customer-reported fraud (lagging, noisy). Every interception Safety Intercept makes is a labeled positive. Every completed payment is a labeled negative. This is the best training data for payment-authorization fraud that exists — *if you scale the extension.*

3. **The payment-surface interception layer for P2P.** Scamnetic verifies recipients inside the FI. Norton scans the inbox. Google blocks phishing sites. Nobody intercepts at the actual Send button inside PayPal/Zelle. That surface is unclaimed. Own it.

### SEO Whitespace (from ssj1)
Don't fight Sift/Alloy on enterprise fraud keywords. Attack the consumer scam-search universe, fragmented and underserved. Clusters:

1. **"Is this a scam?"** (highest ROI) — `"is this paypal email a scam"`, `"zelle scam email example"`. User is actively being scammed. Real-time intent.
2. **Payment Memo Behavior** (you OWN this) — `"paypal notes scam"`, `"payment memo fraud"`. No competitor targets this. You literally create the category.
3. **Platform-specific scam queries** — `"paypal friends and family scam"`, `"zelle fraud examples"`, `"gmail phishing examples"`. Hyper-specific, weak content quality from competitors.
4. **"What to do after scam"** — Aura dominates but has weak depth. Your angle: *"What actually works (and what doesn't) after a Zelle scam."*
5. **Scam Psychology** (untapped) — `"how scammers manipulate urgency"`, `"social engineering examples real"`. Authority moat.

---

## Part IV — 30-Day Tactical Plan (from marketing.md)

**Goal:** 100 real installs in 30 days. No budget. Just Billy. One action every day for 30 days.

### Week 1: The Bait
- Post Loom demo to r/Scams (do this first), r/personalfinance, r/chrome_extensions, r/InternetSecurity, r/privacy, r/PayPal, r/wellsfargo, r/Gmail
- Don't just post — find the 10 most recent "I almost fell for this" posts in r/Scams and help them first, then mention your tool
- Title: *"I built a free Chrome extension that catches scam emails and stops you from sending money to scammers"*

### Week 1–2: The Campus Blitz
- Print 50 flyers. *"Scammers are using AI. So am I."* + QR code. Dorm laundry rooms, dining halls, library bathrooms
- Email 3 Berkeley professors teaching cybersecurity / consumer protection / econ — 5-min demo in class
- Post in every Berkeley Discord, GroupMe, class Slack. r/berkeley + r/UCBerkeley

### Week 2: The Family Angle (highest conversion, nobody does it)
- Text 10 friends: *"Can you send this to your parents?"*
- Family group chat: aunts, uncles, cousins
- Mom's Facebook groups: "Protect Our Seniors" / local community groups

### Week 2–3: Cold Outreach
- **Pleasant Green:** pleasantgreentips@gmail.com — "psychological circuit breaker" pitch (full email in [marketing.md](marketing.md))
- **Kitboga, Scamfish, Jim Browning** — same angle, value prop is exclusive content of watching their extension block a scam live
- **Local news:** *"UC Berkeley student builds AI to protect seniors from scams"* — 3 stations
- **The Daily Cal** (Berkeley student paper)

### Week 3: Senior Centers + Libraries
- Call 5 senior centers near Berkeley. Offer to come in 15 min and install it for people. Those users will never uninstall.
- Local libraries: give librarians the flyer + download link. They'll hand it out.

### Week 3–4: Credibility Multiplier
- **Show HN:** *"Chrome extension that intercepts scam payments using cross-layer AI correlation"* — weekday 9–11am EST
- **LinkedIn:** personal story post. *"I'm 20 years old and I built this because nobody else was."*
- **Product Hunt:** save until you're on the Chrome Web Store

### Realistic projection
| Channel | Installs |
|---|---|
| Reddit (r/Scams + others) | 15–30 |
| Berkeley campus | 20–40 |
| Friends → parents | 10–20 |
| Family chat + mom's FB | 5–15 |
| Senior centers + libraries | 10–20 |
| Hacker News | 10–50 |
| LinkedIn | 5–15 |
| **One YouTuber or news hit** | **100–1000** |

**Floor: 75–150 in a month. Ceiling with one lucky break: 500+.**

---

## Part V — Content Strategy (SEO Wedge from ssj1)

### Publish 15 articles in 2 weeks. Focus ONLY on PayPal, Zelle, Gmail scams.

Engineered-to-rank titles:
- "This PayPal Email Is a Scam (Real Example Breakdown)"
- "Zelle Scam: What Actually Happens After You Send Money"
- "I Got a Payment Request — Is It Legit?"
- "Why the Payment Memo Is the Most Dangerous Part of a Scam"
- "Scammers Count on This One Thing Before You Hit Send"
- "How to Stop PayPal Scams Before You Send Money"
- "The Only Way to Catch a Scam Before You Pay"

### The unique angle
Instead of *"Here are 5 signs of a scam"* → **"This PayPal email is a scam — here's exactly why (real example)."** Specificity wins SEO now.

### Distribution
Medium, LinkedIn, Reddit (r/Scams, r/ChromeExtensions). Every post ends with: *"Install Safety Intercept — it reads the memo before you send it."*

---

## Part VI — Chrome Web Store Optimization (from ssj1)

When CWS approves (pending since 2026-04-02), ship this listing:

| Element | Copy |
|---|---|
| **Title** | *"Safety Intercept: Scam Blocker for Zelle, PayPal & Gmail"* (keywords front-loaded) |
| **Short Description** | *"Intercepts scam payments before you lose money. Reads Gmail + blocks fake Zelle/PayPal memos."* |
| **Icon** | Shield + intercept symbol (red stop sign + green check). High contrast. |
| **Screenshots (5)** | (1) Gmail scam alert popup (2) Zelle payment intercept (3) PayPal warning (4) Settings panel (5) "You just avoided a scam" success |
| **Demo video** | 15 seconds: scam email → PayPal → extension blocks. Show the *interception*, not the interface. |
| **Permissions** | **Minimal.** Gmail + PayPal/Zelle domains only. State explicitly: *"We only request permissions we need. No browsing history. No passwords. Just scam protection."* |

**First 10 reviews are everything.** Recruit friends + Berkeley community week 1.

### Directory submission blitz (SEO foundation, $0, ~2 hrs)
Product Hunt, BetaList, Uneed, AlternativeTo, Crx4Chrome, Extpose, Chromefyi, AngelList, StartupBuffer, BetaPage. 50+ directories. This builds domain authority for when a neobank CTO searches *"fraud detection API"* later.

---

## Part VII — The Viral Loop (product-level, highest leverage)

Add a post-intercept share screen:
> *"Safety Intercept just saved you from losing $[amount]. Share this with a friend who uses Zelle →"*

Share buttons: WhatsApp, SMS, Messenger, X/Twitter.

People who almost got scammed are *highly motivated* to warn others. The extension markets itself. **This is the single highest-leverage product change.**

---

## Part VIII — B2B Data Flywheel (The Real Monetization)

### The flywheel
1. Free extension → users install
2. Scam attempts → extension collects labeled memo data (scam vs. not scam)
3. Proprietary dataset → *"The largest labeled scam-memo database"*
4. B2B API pitch → *"Our model has seen 500,000 scam memos. Plaid's has only seen payment volumes."*

### The B2B outreach email (when you hit 5,000+ users)
**Subject:** 500,000 scam memos your model hasn't seen

> Hi [Name],
> We built a Chrome extension that intercepts Zelle/PayPal scams by scoring payment memos in real-time. In [X] months, we've collected [Y] labeled scam memos — a dataset no one else has.
> We're building an API that scores memos for fraud risk. Would you be open to a 15-min call to see if this fills a gap in your current fraud stack?
> Built by UC Berkeley. Free for consumers. API for fintechs.

### Targets
Chime, Varo, Current, SoFi, local credit unions. Plus warm intros via Strawberry Creek Ventures (Berkeley alumni fund) → one call per week for 4 weeks.

### The API concept
`POST /score_memo` — takes a payment memo string, returns scam probability. Stripe does not offer this as a standalone service. You would own this category.

---

## Part IX — Defensibility (Top 3 Strategic Moves from ssj1)

### 1. Defend the "Extension" moat aggressively
- Plaid *cannot* build a Chrome extension (ruins their B2B neutrality)
- Aura *cannot* build technical interception (they are a marketing company)
- **Launch immediately to capture the "Edge" layer before Cloudflare or Norton copies the UX**

### 2. Provisional patent: Contextual Correlation
File for **"Systems and Methods for Correlating Email Threat Vectors with Peer-to-Peer Payment Memos."** This blocks Stripe or Sardine from simply "adding" this feature later. Not optional.

### 3. Build the "Scam Memo" Lexicon for B2B
Use the free consumer tool to collect thousands of Zelle/PayPal memo texts labeled fraud/not-fraud. When you pitch neobanks, you don't sell an API — you sell *"Our model has seen 500,000 scam memos. Plaid's has only seen payment volumes."*

---

## Part X — The 7-Day Execution Sprint

The concrete plan. ~16 hours total across 7 days.

| Day | Action | Time |
|---|---|---|
| 1 | Write 5 blog posts targeting scam-search keywords | 3h |
| 2 | Finalize Chrome Web Store listing (title, description, screenshots, video) | 4h |
| 3 | Submit to 50+ directories | 2h |
| 4 | Record 5 YouTube Shorts / TikToks | 3h |
| 5 | Draft Product Hunt page + write influencer outreach scripts | 2h |
| 6 | Build welcome email sequence | 1h |
| 7 | Post in r/Scams and r/ChromeExtensions (value-first, no spam) | 1h |

**What will kill you:** asking for too many permissions. Users are terrified of browser extensions after cases like ShieldGuard. State clearly in the listing: *"Gmail + PayPal/Zelle only. No browsing history. No passwords."* Trust is your product.

**Do not pay for ads.** Unit economics don't work yet. Organic only.

---

## The Bottom Line

You are sitting on a perfect wedge:

| Layer | Owned by |
|---|---|
| Enterprise fraud | Sift |
| Identity | Socure |
| Post-scam | Aura |
| **Real-time scam interception** | **NOBODY** |

You are not competing inside an existing category. You are **inserting yourself before the category even activates.** Change when the decision happens, not how it happens.

Most founders try to build a better product and compete inside an existing category. That is a losing game here. The correct move is to define the category — "intent-based fraud detection" — and own the terminology before Stripe does.

**If you understand this correctly, your entire strategy changes: you don't compete on accuracy, you don't compete on pricing, you don't integrate like them. You change when the decision happens.**

---

*End of battle plan. Next: pick a move and execute.*
