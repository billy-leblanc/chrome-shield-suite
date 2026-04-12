# Competitive Intelligence Report — Safety Intercept
**Date:** 2026-04-11
**Prepared for:** Billy LeBlanc
**Scope:** Payment fraud, scam detection, consumer security, and fraud API landscape

---

## Executive Summary — The 5 Things You Must Know

1. **Nobody is doing the exact thing you're doing.** No company on this list ships a free consumer Chrome extension that intercepts at the Send button on PayPal + Wells Fargo Zelle *and* detects scam emails in Gmail *and* correlates them in a 24h window. The combination is your moat today. Individually, each piece exists somewhere. Together, only Safety Intercept.

2. **Your closest direct competitor is Scamnetic.** They raised $13M Series A in April 2025 ($16M total), launched IDeveryone Payment Protection in January 2026, and their stated ICP is financial institutions, fintechs, and payment providers — *exactly* the B2B buyers you plan to sell to. They are selling "identity-proof the recipient" — a different angle from your "score the memo + correlate cross-layer context," but they will end up in the same room as you in pitch meetings.

3. **The existential long-term threat is Google itself.** In May 2025, Chrome began shipping on-device Gemini Nano scam detection in Enhanced Protection mode. Today it only targets tech support scams. Google has publicly stated they plan to expand to "other types of scams, including package tracking and unpaid toll scams." If they extend to payment-authorization scams, the browser extension layer you depend on becomes a commodity Google feature. **Your defense is not the extension — it is the dataset and the cross-layer correlation.**

4. **The B2B fraud API market is consolidating around well-funded incumbents.** Sardine ($145M raised, a16z-led), Sift ($200K–$1.9M annual deals), Unit21 ($92M, agentic AI relaunch March 2026), Alloy ($1.55B valuation), Hawk ($56M Series C April 2025), Socure ($4.5B valuation, FedRAMP). You cannot out-fund them. You can out-differentiate them with data they cannot get: a labeled corpus of scam-email → payment-attempt pairs produced by real user interceptions.

5. **The consumer scam-protection market woke up in 2025 — the window is open but closing fast.** Norton Genie launched February 2025. Scamnetic IDeveryone launched January 2026. Google Chrome Gemini Nano rolled out May 2025. Trend Micro ScamCheck is live. Aura is adding scam protection to its identity bundle. The timing validation is there; the land grab has begun. **Speed matters more than polish right now.**

---

## The Competitive Matrix

| Company | Layer | Product Type | ICP | Funding (Latest) | Key Differentiator | Direct Threat? |
|---|---|---|---|---|---|---|
| **Scamnetic** | Consumer + B2B | Mobile app + FI API (IDeveryone) | FIs, fintechs, consumers | $16M total ($13M Series A, Apr 2025) | Patented recipient identity-proofing; insurance up to $25K | **YES — closest** |
| **Norton Genie** | Consumer | Bundled into Norton 360 / LifeLock | Mass consumer | Public co. (Gen Digital) | AI across SMS, calls, email, web; bundled free | **YES — consumer** |
| **Google Chrome (Gemini Nano)** | Consumer | Native browser feature | Every Chrome user | N/A (Google) | On-device LLM; free; default-on | **EXISTENTIAL** |
| **Trend Micro ScamCheck** | Consumer | Chrome extension + mobile | Mass consumer | Public co. | 99% phishing block claim; page ratings | **YES — browser layer** |
| **Scamy.io** | Consumer | Free Chrome extension | Mass consumer | Unclear / small | Real-time phishing scanning | Likely minor |
| **Aura** | Consumer | Subscription bundle ($12–15/mo) | Families, seniors | Private, scale co. | ID theft + ambient monitoring + $1M insurance | Partial — adjacent |
| **Sardine** | B2B API | Device+behavior biometrics | Fintechs, banks, crypto | $145M (a16z-led) | DIBB SDK; Nacha 2026 positioning | Future — B2B |
| **Sift** | B2B API | ML fraud decisioning | Mid-market/enterprise | Late-stage; $200K–$1.9M ACV | Network effects across merchants | Future — B2B |
| **Unit21** | B2B API | Agentic AI fraud+AML ops | Fintechs, BaaS, 200+ customers | $92M Series C | Agentic AI relaunch March 2026 | Future — B2B |
| **Alloy** | B2B API | Identity decisioning orchestration | Banks, credit unions, fintechs | $1.55B valuation (2022) | Decision orchestration layer | Future — B2B |
| **Hawk** | B2B API | AML + fraud for fintechs | Tier 1 banks, fintechs | $56M Series C (Apr 2025) | 80+ customers; analytics studio | Future — B2B |
| **Socure** | B2B API | Identity verification / RiskOS | FIs, government (FedRAMP) | $4.5B valuation | Scale, government angle | Not direct |
| **Persona** | B2B API | Identity orchestration | Fintechs, marketplaces | $2B valuation ($200M Series D Apr 2025) | "Verified identity for agentic AI" | Not direct |
| **Plaid** | B2B API | Financial data + Protect/Ti2 | Banks, fintechs | Private (valued >$13B historically) | Bank data moat; Ti2 trust index | Future — huge |
| **Stripe Radar** | B2B (embedded) | Built into Stripe payments | Stripe merchants | N/A (Stripe) | Only works inside Stripe | Not direct |
| **Abnormal Security** | B2B | Enterprise email AI | Enterprises | $5.1B valuation (Aug 2024) | Behavior baselines | Not direct (enterprise) |
| **Material Security** | B2B | Google Workspace / M365 | Enterprises | Late-stage | Gmail post-delivery redaction | Not direct (enterprise) |
| **Proofpoint** | B2B | Enterprise email security | Enterprises | Private (Thoma Bravo acq) | Legacy scale | Not direct |
| **LifeLock** | Consumer | ID theft subscription | Mass consumer | Gen Digital (public) | Distribution via Norton bundle | Partial — consumer |

---

## Deep Dives

### Tier 1 — B2B Fraud APIs (Your Future Competitors)

#### Sardine (sardine.ai)
- **Product**: Device Intelligence + Behavior Biometrics (DIBB) SDK for fintechs. Captures mouse movement, typing patterns, device signals. Positioning now broadened to "AI risk platform for fraud, credit, and compliance." Claims highest-ranked signals in their risk models are behavioral.
- **Pricing**: Not public. Enterprise contracts, custom.
- **Funding**: $145M total. Series C announced Feb 2025 for $70M. a16z led Series B with Angela Strange, Alex Immerman on growth round. Miami HQ. Founded 2020.
- **Strategy**: Positioning aggressively around Nacha's June 2026 ACH credit fraud monitoring requirement. Partnership with Experian announced for behavioral biometrics distribution.
- **Threat to you**: Low today. High in 12–24 months when you knock on FI doors and they say "we already buy Sardine." They do not have a consumer-facing product and cannot produce the kind of labeled scam corpus you can. That is your wedge.
- **Whitespace**: Sardine has device + behavior. They do not have intent — the *content* of what the user is about to pay for. That is your layer.

#### Sift (sift.com)
- **Product**: ML-based fraud decisioning across merchants. Network effect — every merchant contributes signal.
- **Pricing**: $500/mo starting. Average ACV ~$200K. Max $1.9M. Enterprise custom quotes.
- **Funding**: Late-stage, not recent major rounds. Private.
- **Strategy**: Owns commerce fraud; network effect across SKUs. Not a consumer play.
- **Threat**: Low. Sift is a merchant/e-commerce play, not a P2P scam play.

#### Unit21 (unit21.ai)
- **Product**: Fraud + AML ops platform. **March 2026**: relaunched as "AI Risk Infrastructure" with agentic AI. Tyler Allen (founding engineer, former Head of AI) named CEO; Trisha Kothari to Chairman.
- **Customers**: 200+ across 90 countries — Sallie Mae, Chime, Intuit, Green Dot.
- **Funding**: $92M total, Series C Jun 2023, Tiger Global / ICONIQ / Gradient Ventures.
- **Strategic signal**: A CEO transition + agentic-AI rebrand in the same window = they are resetting positioning to survive the LLM era. They are scared too.
- **Threat**: Low today; they sell ops software, not a model you embed at the payment layer.

#### Alloy (alloy.com)
- **Product**: Identity decisioning orchestration — sits between the FI and the data vendors (Socure, Persona, credit bureaus). Automates KYC/KYB/AML/fraud rules.
- **Funding**: $1.55B valuation (Sep 2022 — $52M extension on top of 2021 $100M Series C). Recognized on CNBC 2025 Top Fintechs list.
- **Threat**: They are an orchestration layer. You could one day be a signal *inside* Alloy. More partner than competitor.

#### Hawk (hawk.ai)
- **Product**: AML + fraud for banks. Founded in Munich. Recently launched Analytics Studio (Jan 2026).
- **Customers**: 80+ including Ecobank, Worldline, Synctera, Vodafone, VR Payment, VakifBank, Volt.
- **Funding**: $56M Series C Apr 2025, led by One Peak. Existing: Macquarie, Rabobank, BlackFin, Sands, DN Capital, Picus, Coalition.
- **Strategic direction**: Expanding into US market with Series C proceeds.
- **Threat**: They are coming to the US but B2B. Not a consumer overlap.

---

### Tier 2 — Infrastructure / Adjacent

#### Plaid (plaid.com) — **Watch closely**
- **Product (2025–2026)**: Plaid Protect with Ti2 (Trust Index v2). Catches 30% more fraud than v1. Uses bank transaction history + user graph. Flags money-mule patterns, unusual P2P transfers, rapid fund cycling. **Plaid Bank Intelligence** launched Oct 2025. **Q1 2026 real-time Fraud Insights** scheduled — targets account takeover detection for FIs.
- **Threat**: This is the biggest upstream risk. Plaid has (a) bank data 12,000+ FIs can't replicate, (b) distribution into every fintech, (c) real-time fraud signals launching now. **If Plaid decides to build what you're building, they have everything to do it except the browser layer and the labeled scam corpus.** That is what they would try to buy or replicate.
- **Why they haven't yet**: They are an infrastructure company. They do not touch consumers directly. Shipping a consumer-facing Chrome extension is culturally off-brand for them. That's your window.

#### Stripe Radar
- Built into Stripe payments. Free at base; 5¢/txn for Radar for Fraud Teams. Only works inside the Stripe ecosystem.
- **Threat**: Zero. Stripe Radar does not touch P2P consumer transfers. Different layer of the stack.

#### Socure (socure.com)
- $4.5B valuation (2021 Series E, Accel + T. Rowe Price + Tiger Global). $650M+ total raised. FedRAMP-authorized RiskOS for government. Acquired Qlarifi Nov 2025.
- **Threat**: They are identity verification — they tell you the person is who they say they are. They do not score *intent* or detect scam authoring. Orthogonal.

#### Persona (withpersona.com)
- $200M Series D at $2B valuation (Apr 2025). Co-led by Founders Fund + Ribbit Capital. Processed 300M+ verifications in 2024. Positioned as "verified identity layer for an agentic AI world."
- **Threat**: Adjacent. They verify identities. They do not intercept transactions.

---

### Tier 3 — Consumer-Facing (Closest Competition Today)

#### Scamnetic (scamnetic.com) — **YOUR CLOSEST COMPETITOR**
- **Product**: Two-part strategy.
  1. **KnowScam 2.0** (consumer): Mobile-first scam detection app. Scans emails, texts, social DMs, websites, messaging apps, QR codes, physical mail, images. Launched July 2025.
  2. **IDeveryone Payment Protection** (B2B, launched Jan 13, 2026): "The World's Only Patented Technology That Identity-Proofs Payment Recipients in Real Time." Covers push, digital, crypto, checks, wire, ACH. Sold to FIs, fintechs, payment providers. Includes optional insurance up to $25K per incident.
- **Funding**: $13M Series A Apr 2025 (Roo Capital lead; 1st and Main Growth Partners, SaaS Ventures, Riptide Ventures). $16M total.
- **Location**: Tampa, FL.
- **Strategic direction**: Clearly moving from consumer to B2B faster than Safety Intercept. They started with a consumer app and used it as distribution/credibility to land the financial institution relationships. **This is almost exactly your playbook — and they have a 12+ month head start and a patent.**
- **Critical differences from Safety Intercept**:
  - They are a *mobile app*, not a Chrome extension. They do not intercept at the Send button inside the payment surface. They scan content.
  - Their B2B pitch is "verify the identity of the recipient." Yours is "score the transaction memo + correlate the email context." Different angle — yours is cheaper and more automatable.
  - They do not have Gmail cross-layer correlation in a 24h window. That specific signal is yours alone on this list.
- **What to watch**: Are they raising another round? Are they filing more patents? If yes, accelerate the Chrome Web Store launch and publish a distinct technical differentiator story.

#### Norton Genie (LifeLock / Gen Digital)
- **Product**: AI scam protection across SMS, calls, email, web. Launched Feb 2025 across the Norton 360 / LifeLock product line. Safe Call, Safe Email, Scam Support and Reimbursement.
- **Pricing**: Bundled free into Norton 360 / LifeLock subscriptions.
- **Distribution**: 🔥 This is the scary part. Gen Digital has tens of millions of existing Norton users. They stated "90% of all cyberthreats now originate from scams and social engineering — nearly triple 2021." They are the distribution moat you cannot out-spend.
- **What Norton cannot do**: They do not sit inside Gmail and inside PayPal at the same time intercepting the send action. Their AI sits at the email layer. If a scam succeeds past the email, they do not intercept the payment. **Safety Intercept's payment-layer interception is the gap in Norton's coverage.**

#### Trend Micro Check / ScamCheck / ID Protection
- **Product**: Chrome extension. Page ratings in search results (green/red). Blocks known phishing sites. ScamCheck tool analyzes images, text, URLs, phone numbers. Claims 99% phishing site detection.
- **Distribution**: Trend Micro Chrome Web Store listing is live and has a large installed base.
- **Threat**: They are the closest browser-layer competitor *that is already live*. But their product is reputation-based (URL blocklists, page classification), not behavioral-interception-based. They do not stop you at the PayPal Send button after you've chosen to pay a fraudster.

#### Aura (aura.com)
- **Product**: ID theft protection subscription. $12–15/mo individual, $11–14.50/person family. 3-bureau credit monitoring, dark web monitoring, $1M insurance per adult.
- **Threat**: Adjacent. Aura is playing the "ambient protection bundle" game, not the "intercept at the moment of loss" game. Potential acquirer / partner more than competitor.

#### LifeLock (Norton/Gen Digital)
- Same parent as Norton Genie. Legacy brand, mass distribution. Now integrating Genie AI features. Treat as one entity: Gen Digital = the consumer distribution leader in this space.

---

### Tier 4 — Email Security (Enterprise — Not Direct)

#### Abnormal Security (abnormal.ai)
- **Product**: Enterprise cloud email security. AI baselines user behavior and flags deviation. Positioned as Microsoft 365 / Google Workspace defense layer.
- **Funding**: $250M Series D Aug 2024 (Wellington / CrowdStrike Falcon Fund / Greylock). Later round at **$5.1B valuation** (Nov 2025, WestCap led). $546M total.
- **Employees**: 500+.
- **Threat**: Zero direct. They sell to enterprise security teams. They would never build a consumer Chrome extension.

#### Material Security (material.security)
- **Product**: Post-delivery email protection for Google Workspace / M365. Detects phishing, redacts sensitive email content, forces out-of-band MFA to read it. Deploys in 30 minutes.
- **Threat**: Zero direct. Enterprise.

#### Proofpoint
- **Pricing**: $2–$15/user/month (SMB), $25–$70/user/year (enterprise bundles).
- **Ownership**: Acquired by Thoma Bravo, taken private.
- **Threat**: Zero direct. Legacy enterprise email. Not pivoting to consumer.

---

## The Social Web — Who Is Connected To Who

Think of this as the "if I go into the room, who's already in it" map.

### The a16z / YC / Early-stage Fraud Cluster
- **a16z → Sardine** (Angela Strange led Series A; Alex Immerman led Series B)
- **a16z portfolio**: 1,076+ companies, deep fintech bench — if you pitch a16z for Safety Intercept, they will introduce Sardine as a "reference point." Prepare for it.
- **Sardine ↔ Experian**: Behavioral biometrics distribution partnership. Sardine is getting into the credit bureau stack.

### The Late-Stage Fraud-API Cluster
- **Alloy + Socure + Persona** — all three are orchestration / verification layers. They are competitive with each other, but they all plug into the same customer base: neobanks, credit unions, fintechs. They are the "identity data exchange" crowd. Safety Intercept would be a *signal vendor* into this exchange, not a replacement for it.
- **Unit21 + Chime + Intuit + Sallie Mae + Green Dot** — Unit21's customer list is a who's who of US fintech you might one day want to sell into. A reference from Unit21 via friendly channel = opening at any of these.
- **Hawk + Macquarie + Rabobank + One Peak** — European-leaning capital. Moving into US. If Hawk calls, they are gathering US market intelligence, not buying.

### The Consumer Distribution Incumbents
- **Gen Digital (Norton + LifeLock + Avast + Avira + AVG + CCleaner)** — owns the entire consumer-security shelf. If Safety Intercept scales, Gen Digital is either the acquirer or the replicator. They have the brand, you have the surface.
- **Trend Micro** — Japanese public company. Global consumer brand, extension already live. Less likely to acquire, more likely to replicate.
- **Aura** — mid-sized, subscription economy, private equity backed. The most plausible *friendly* acquirer for Safety Intercept in the 18–36 month horizon.

### Berkeley / Academic
- **Strawberry Creek Ventures** — UC Berkeley alumni fund. Co-invests with a16z, Sequoia, Khosla, Accel. This is your warmest possible capital door given your student status. Not fraud-specialized but well-networked. Same with **SkyDeck** and **CITRIS** on campus (per your mentor outreach plan).

### Who Is Connected To Nobody Yet (Opportunity)
- **You.** That is the asymmetric card. Scamnetic already has FI channel relationships. Sardine has a16z. Norton has the shelf. What you have is: no incumbent commitments, no fundraising constraints, no legal exposure from a bigger parent, and speed. That is a real advantage. Use it while it's still true.

---

## Direct Competition Alert

Ranked by how tightly they compete with Safety Intercept's *specific* positioning. The "specific positioning" is: free consumer Chrome extension → intercepts at the Send button on P2P payment surfaces → detects scam context in Gmail → cross-layer correlation in 24h window → feeds a future B2B API.

### Red Alerts (direct overlap on core thesis)

1. **Scamnetic** — Closest. Same consumer-product-to-B2B-API playbook, same target FI buyers, ~12 months ahead on the B2B side, has a patent on recipient identity-proofing. They are a *mobile app* not a *browser extension*, which is the one dimension of differentiation you own. They do not have Gmail correlation as a signal. **Action: read their patent filing the moment it's public. Study IDeveryone's technical architecture. Do not copy. Differentiate on the browser + cross-layer angle.**

2. **Google Chrome Gemini Nano** — Existential long-term. They ship native, on-device, free, default-on. Today: only tech-support scams. Roadmap: "other types of scams, including package tracking and unpaid toll scams." If they extend to payment-authorization fraud, your extension becomes an undifferentiated feature on top of a Google default. **Action: build the moat on what Google cannot ship — the labeled dataset, the cross-layer correlation, and the B2B API. Treat Google native scam detection as inevitable and build around it.**

### Orange Alerts (partial overlap)

3. **Norton Genie / LifeLock** — Owns the mass-consumer shelf. Covers email + SMS + calls. Does *not* intercept at the payment surface. Their coverage ends where yours begins. **Action: do not compete on consumer brand distribution. Compete on surface depth — you are the one inside the payment page.**

4. **Trend Micro ScamCheck** — Already live as a Chrome extension. URL/reputation-based, not behavioral-interception-based. **Action: watch Trend Micro's product updates for any pivot toward payment-surface interception. That would be a red alert.**

5. **Plaid** — The biggest upstream risk if they choose to build. They already have the bank data, the fintech distribution, and in Q1 2026 are shipping real-time Fraud Insights to FIs. **Action: engage early. Plaid is more plausible as a partner (you supply a unique signal they can't reproduce) than as a competitor.**

### Yellow Alerts (adjacent)

6. **Scamy.io** — Small free Chrome extension. Worth tracking but no evidence of scale or funding.
7. **Aura** — Consumer ID theft subscription. Bundle play, not interception. Plausible acquirer.
8. **Sardine** — B2B only, but they will eventually want a browser-layer signal. You could be that for them.

### Green (not direct competition)
Sift, Alloy, Unit21, Hawk, Socure, Persona, Abnormal, Material, Proofpoint, Stripe Radar. All B2B, all enterprise, all at a different layer. They don't compete with you today — but several will be in the room when you pitch FIs in 2027+.

---

## Whitespace & Strategic Opportunity

### What Nobody Else Has

1. **The cross-layer 24-hour correlation window (scam email → payment attempt).** No company on this list has this signal. Norton sees the email. Sardine sees the device. Scamnetic sees the recipient. You see the bridge between "scam arrived in inbox" and "user authorized a payment 17 minutes later" — and you see it in real time, on the same device, with a tight causal window. This is the single most defensible signal on the entire battlefield. **Make sure every pitch leads with it.**

2. **A clean, labeled, free-tier-produced scam corpus.** Every B2B fraud API is guessing at ground truth. They rely on customer-reported fraud (lagging, noisy, adversarial to consumer privacy). You have a consumer extension that, at the moment of interception, *knows* that a payment attempt was stopped. Every interception is a labeled positive. Every non-intercepted completed payment is a labeled negative. **This is the best training data for payment-authorization fraud that exists, if you can get to scale.** The extension is a flywheel for data, not an end product. Say that out loud in every investor meeting.

3. **The payment-surface interception layer for P2P.** Scamnetic verifies recipients inside the FI. Norton scans the inbox. Google blocks phishing sites. Nobody intercepts at *the actual Send button inside PayPal*. That surface is unclaimed. **Own it. Defend it. Expand it. Do not dilute it by trying to own SMS, WhatsApp, iOS messaging, etc. yet.**

### What You Should Explicitly Not Build
- **B2B fraud decisioning platform.** Sardine, Sift, Unit21 already exist. You cannot out-capitalize them. Your play is to be a high-value *signal* feeding into these platforms, or to go direct to the FIs with a dataset story.
- **Identity verification.** Persona ($2B), Socure ($4.5B), Alloy ($1.55B) own this. Don't touch it.
- **Enterprise email security.** Abnormal ($5.1B), Material, Proofpoint. Not your customer, not your pond.
- **Consumer subscription bundles.** Aura and Norton already own that shelf. Your go-to-market is free consumer + B2B data/API monetization.

### What You Should Build Next (In Priority Order)
1. **Proof of the flywheel.** Prove — with real numbers, not synthetic — that interception events produce a labeled corpus no one else has. Even 50 real interceptions is a story.
2. **The cross-layer correlation UI + telemetry.** Make the Gmail→PayPal bridge visible in the product and in the dashboard. It's the feature only you can ship.
3. **A dataset access page for researchers and fraud teams.** Public, rate-limited, sanitized. Attracts fraud analysts, gets on the radar of FI fraud teams organically.
4. **Stay away from** — WhatsApp, iOS imessage, Telegram, Discord, Android, SMS. Not yet. Every hour spent on those is an hour Scamnetic is using to file another patent or land another FI deal.

---

## Recommendations — Top 3 Moves

### 1. Get the Chrome Web Store approval over the finish line and announce like a military operation
Scamnetic has a 12-month head start and a patent. Norton shipped Genie in February 2025. Google Chrome native scam detection is live since May 2025. **Every week you are not on the Chrome Web Store, your moat narrows.** The moment CWS approves, run:
- Show HN: "I built a Chrome extension that intercepts payment fraud at the Send button"
- Reddit r/Scams, r/PersonalFinance, r/PayPal (you already have the copy from marketing.md)
- One targeted YouTube outreach (safety-focused channels)
- DM the fraud analysts at three credit unions to schedule a 20-min call

The goal of launch week is not installs. It is **to establish public record that Safety Intercept exists and was first to this specific surface**. If Scamnetic, Norton, or Google catches up later, you want timestamped evidence that you were there first. This matters for defensibility, for press, and for the eventual fundraising conversation.

### 2. Reframe the entire Safety Intercept story around the dataset, not the extension
Right now the story is "Chrome extension that protects consumers from scams." Everyone on this list tells a version of that story. The story nobody else can tell is: **"We are building the cleanest labeled dataset of AI-generated payment fraud on earth. The extension is how we collect it. The B2B API is how we monetize it. Consumers get protection for free because their interceptions train the model that protects everyone else."**

This reframing:
- Explains why you give the extension away free (data flywheel, not charity)
- Gives you a B2B pitch no competitor can copy
- Makes Google Chrome Gemini Nano a tailwind, not a threat — the more people Google warns, the more proof your training set is on the right shape of problem
- Positions you as infrastructure, not a feature
- Justifies a Series A conversation when the time comes

Write this into a one-page narrative and put it on the landing page. Put it in the Reddit post. Put it in the Show HN. Put it in every pitch. The narrative is the moat.

### 3. Get in a room with one real fraud team this month — before Scamnetic does
You do not need to close a deal. You need to know:
- What do FI fraud teams actually trust as a signal?
- What price do they pay Sardine / Alloy / Unit21 today?
- What is the buying process and the budget cycle?
- Would they pay for a cross-layer email-correlation signal if Safety Intercept produced it?
- What did they think when they saw Scamnetic's IDeveryone launch in January?

Targets in order of warmth:
- A UC Berkeley alum working fraud at a credit union (Strawberry Creek can intro)
- A Chime / Green Dot / Intuit contact (Unit21's customer list → LinkedIn → warm intro)
- A SkyDeck mentor who has FI connections
- Cold outreach to fraud ops at 5 regional credit unions (they answer email, unlike Tier 1 banks)

The goal: one call per week for the next four weeks. Four conversations will tell you more about your B2B thesis than six months of building. And if any of them say "we would pilot this for $X/month," you have a real fundraising story.

---

## What I Could Not Find / Honesty Section

- **Sardine's exact current customer list.** They list partnerships (Experian) but not a full FI customer list publicly.
- **Scamnetic's patent number and technical claims.** Press release says "patented" but I did not locate the USPTO filing. Worth a targeted search once you have a breather.
- **Plaid's Fraud Insights launch details for Q1 2026.** Announced but product details not fully public yet. Worth re-checking in a month.
- **Any YC company directly in this space.** I did not find a YC-backed company running the exact consumer-extension + B2B-API playbook. This is either genuine whitespace or a search gap. If you want me to run a targeted YC company directory search, I can.
- **Norton Genie's actual interception rate in the wild.** Press-release numbers only; no independent benchmarks found.

If any of these gaps would change a decision, tell me which one and I'll run it down.

---

## Sources

### Tier 1 — Fraud APIs
- [Sardine — AI risk platform](https://www.sardine.ai/)
- [Sardine Series C announcement](https://www.sardine.ai/blog/series-c-announcement)
- [Sardine raises $70M — Crunchbase](https://news.crunchbase.com/cybersecurity/fraud-detection-startup-sardine-ai-fundraise/)
- [Sardine behavioral biometrics + Experian — ID Tech](https://idtechwire.com/behavioral-biometrics-startup-sardine-partners-with-experian/)
- [Sift — pricing overview](https://pricingnow.com/question/sift-pricing/)
- [Sift Vendr pricing](https://www.vendr.com/buyer-guides/sift-science)
- [Unit21 — Crunchbase](https://www.crunchbase.com/organization/unit21)
- [Unit21 relaunches as AI Risk Infrastructure (Mar 2026)](https://www.businesswire.com/news/home/20260310768649/en/Unit21-Relaunches-as-the-Leader-in-AI-Risk-Infrastructure)
- [Unit21 + Helix partnership](https://www.businesswire.com/news/home/20260323835434/en/Unit21-Announces-Partnership-to-Power-AI-Driven-AML-Workflows-and-Sponsor-Bank-Oversight-for-BaaS-Programs)
- [Alloy — Wikipedia](https://en.wikipedia.org/wiki/Alloy_(company))
- [Alloy $52M Series C extension — Finovate](https://finovate.com/identity-decisioning-platform-alloy-locks-in-52-million-to-help-companies-fight-fraud/)
- [Hawk raises $56M Series C — Hawk](https://hawk.ai/news-press/hawk-raises-56m-tier-1-banks-adopt-its-ai-combat-financial-crime)
- [Hawk Series C — FinTech Futures](https://www.fintechfutures.com/venture-capital-funding/german-aml-fintech-hawk-raises-56m-series-c-led-by-one-peak)
- [Hawk Analytics Studio Jan 2026](https://www.amlintelligence.com/2026/01/news-hawk-launches-analytics-studio-for-banks-and-payment-firms/)

### Tier 2 — Infrastructure
- [Plaid Protect](https://plaid.com/products/protect/)
- [Plaid Fall 2025 release](https://plaid.com/blog/fall-release-25/)
- [Plaid Ti2 Trust Index](https://plaid.com/blog/plaid-protect-trust-index/)
- [Plaid Bank Intelligence (Oct 2025)](https://plaid.com/blog/introducing-bank-intelligence/)
- [Stripe Radar](https://stripe.com/radar)
- [Stripe Radar pricing](https://stripe.com/radar/pricing)
- [Socure $450M Series E @ $4.5B](https://techcrunch.com/2021/11/09/identity-verification-startup-socure-raises-450m-at-4-5b-valuation-adding-tiger-global-as-new-investor/)
- [Socure RiskOS FedRAMP](https://www.executivebiz.com/articles/socure-riskos-fraud-prevention-identity-verification)
- [Persona $200M Series D @ $2B (Apr 2025)](https://withpersona.com/blog/series-d)
- [Persona — FinTech Global](https://fintech.global/2025/04/30/identity-verification-firm-persona-hits-2bn-valuation-following-200m-funding-round/)

### Tier 3 — Consumer
- [Scamnetic homepage](https://scamnetic.com/)
- [Scamnetic $13M Series A](https://www.businesswire.com/news/home/20250423328444/en/Scamnetic-Receives-$13-Million-series-A-Funding)
- [Scamnetic IDeveryone Payment Protection (Jan 2026)](https://www.businesswire.com/news/home/20260113557121/en/Scamnetic-Unveils-IDeveryone-Payment-Protectionthe-Worlds-Only-Patented-Technology-That-IdentityProofs-Payment-Recipients-in-Real-Time)
- [Scamnetic IDeveryone — Help Net Security](https://www.helpnetsecurity.com/2026/01/14/scamnetic-ideveryone-payment-protection/)
- [Scamnetic KnowScam 2.0 launch](https://www.helpnetsecurity.com/2025/07/02/scamnetic-knowscam-2-0/)
- [Norton AI scam protection launch (Feb 2025)](https://newsroom.gendigital.com/2025-02-19-Norton-Launches-Enhanced-AI-Powered-Scam-Protection-Across-Cyber-Safety-Lineup)
- [Norton Genie features — Help Net Security](https://www.helpnetsecurity.com/2025/02/20/norton-scam-protection/)
- [Trend Micro Check / ID Protection — Chrome Web Store](https://chromewebstore.google.com/detail/trend-micro-id-protection/imhhfjfjfhjjjgaedcanngoffjmcblgi?hl=en)
- [Trend Micro ScamCheck](https://www.trendmicro.com/en_us/forHome/products/trend-micro-scam-check.html)
- [Aura pricing](https://www.aura.com/pricing)
- [Aura 2026 review — Security.org](https://www.security.org/identity-theft/aura/)
- [Scamy.io free extension](https://scamy.io/extension)

### Tier 4 — Email Security
- [Abnormal Security $250M at $5.1B (Nov 2025)](https://news.crunchbase.com/cybersecurity/startup-ai-abnormal-security-funding-wellington/)
- [Abnormal Security — CNBC Disruptor 50 (2025)](https://www.cnbc.com/2025/06/10/abnormal-ai-cnbc-disruptor-50.html)
- [Material Security homepage](https://material.security/)
- [Material Security Gmail guide](https://material.security/workspace-resources/a-pragmatic-guide-to-gmail-security)
- [Proofpoint pricing 2026 — CostBench](https://costbench.com/software/email-security/proofpoint/)

### Strategic Context
- [Google Chrome Gemini Nano on-device scam detection (May 2025) — TechCrunch](https://techcrunch.com/2025/05/08/google-rolls-out-ai-tools-to-protect-chrome-users-against-scams/)
- [Google Chrome Gemini Nano — The Hacker News](https://thehackernews.com/2025/05/google-rolls-out-on-device-ai.html)
- [Deloitte — APP fraud projected to $15B by 2028](https://www.deloitte.com/us/en/insights/industry/financial-services/authorized-push-payment-fraud.html)
- [Sift — APP fraud consumer protections](https://sift.com/blog/understanding-authorized-push-payment-app-fraud-and-the-new-consumer-protections/)
- [Unit21 — Neobank challenges 2026](https://www.unit21.ai/blog/neobank-challenges-in-2026-fraud-compliance-and-the-infrastructure-shift)
- [Strawberry Creek Ventures — Berkeley alumni fund](https://www.av.vc/funds/strawberrycreek)

---

*End of report. If you want a deeper dive on any single company, or want me to turn the "dataset flywheel" narrative into a one-pager for the landing page, say the word.*
