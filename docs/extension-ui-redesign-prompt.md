# Prompt for Claude Design — Safety Intercept extension UI redesign

Redesign the three UI surfaces of Safety Intercept, a Chrome extension that catches payment scams and phishing in real time. The current UI is dark and clinical. Make it **warm, human, and reassuring** — the feeling of a calm friend who just put a hand on your shoulder, not a security alarm. The voice is the most important part of this brief.

## Who we protect
Everyday people at the exact moment they're about to lose money to a scammer — and especially older adults and the family members helping them. They may be scared, embarrassed, rushed, or mid-conversation with a scammer right now. Meet them there.

## What the data says we must do (Plaid, *State of Intelligent Finance*, 2026)
- **Explainability is the conversion engine** — 60% trust the product more when they understand the *why* behind a decision. Never show a bare score. Always show plain-English reasons.
- **People want control, not a verdict** — 74% always want to review important decisions; the product is a co-pilot, never the captain. Every warning is a *heads-up, not a block.*
- **Fraud detection is the #1 trust driver** — lead with protection and reassurance, not fear.
- **The "shame tax" is real** — people avoid asking "is this a scam?" out of embarrassment. So: zero judgment. Scammers are professionals; victims are human.
- **Honesty over alarm** — "a privacy policy doesn't build trust; a product that behaves predictably and honestly does." The UI itself must feel calm, predictable, and honest.

## The voice (this is the core of the redesign)
- **Calm, not alarming.** Pause people; don't panic them. Lead with "let's take a breath."
- **Human, not clinical.** "This looks like a setup we've seen before" — not "THREAT DETECTED · RISK 92."
- **Plain, not technical.** Translate every fraud signal into a sentence a worried grandparent understands.
- **Empowering, not controlling.** "You decide what happens next." "This is a heads-up, not a block."
- **Kind, not judgmental.** "There's no rush, and no shame in checking."

### Microcopy examples in the target voice (use this tone, adapt freely)
- Headline on a flagged payment: **"Let's take a breath before you send this."**
- Reassurance: *"There's no rush. Scammers create urgency on purpose — pausing is exactly the right move."*
- A reason (plain language): *"Someone you can't reach is asking for money urgently. Real emergencies let you verify first; scams don't."*
- A reason: *"You've never sent money to this person before."*
- Buttons: **"Go back — stay safe"** (primary) and **"I've checked, send anyway"** (quiet secondary).
- Footer line: *"We flag what looks risky and explain why. The decision is always yours."*
- Email banner: **"This email has signs of a scam. Here's why →"**

## The three surfaces to design
1. **Payment interception modal** (the most important moment). Appears full-screen-ish over PayPal/Venmo/Cash App/Zelle the instant someone is about to send money to a likely scam. Should: open with a calm "take a breath" headline, show 2–4 plain-language reasons it looks risky, reassure (no shame, no rush), and offer two clear choices — go back (safe, primary) or send anyway (quiet). Optionally a short "why I think this" expandable. This is the confirm-before-money-moves guardrail.
   - **KEEP AND CENTER THE COOLING-OFF TIMER (this is the signature feature — do not drop it).** On high/critical risk, the "send anyway" / "proceed" button is **disabled for 12 seconds** and the *literal "take a breath" line lives ON that button/bar as it counts down* — it's the forced pause made real. Design this as the emotional center of the modal: a calm progress bar (filling over ~12s, in the orange/amber accent — NOT a red alarm) sitting under the reasons, with the proceed button greyed and labeled **"Take a breath…"** while the bar fills, then unlocking to **"I've checked — send anyway"** when it completes. The "go back — stay safe" button is always available; only the *proceed* path is gated by the timer. The bar should feel like a calming breath/exhale, not a loading spinner or a punishment.
2. **Gmail warning banner** (lighter touch). A slim, non-blocking banner at the top of a flagged email: a calm one-line verdict + "here's why" + a gentle dismiss and a "this isn't a scam" option. Never blocks reading.
3. **Toolbar popup** (the home base). Warm status ("You're protected"), simple stats (how many scams paused), a list of recent catches in plain language, settings, and a "Talk to the maker" feedback note (this is a solo-founder product — lean into that human, personal feeling).

## Design system (keep cohesive with the website)
- **Palette:** warm off-white `#F8F6F3`, white cards `#FFF`, warm panel `#F1ECE5`, ink text `#16181D`, secondary `#565C6B`, muted `#8B909C`, hairline `#E5E0D8`. **Accent (brand): orange `#E8552B`.** Caution amber `#F0A93B`. Safe green `#1E7A4D`. Danger (use sparingly) `#C42B2B`.
- **Font:** Inter.
- **Feel:** soft radii (14–30px), gentle shadows, generous whitespace, rounded "pill" buttons. Warm and human — like the welcome screen, not a dashboard.
- The interception modal may use a calm warm or soft-dark treatment, but **lead with warmth and the amber "caution," not red alarm.** Red is for the rare critical case only.

## Avoid
- Fear-mongering, sirens, big red "DANGER."
- Jargon, technical risk scores, "AI confidence intervals."
- Anything that makes the user feel foolish.
- Cold "cyber-security" aesthetics (dark matrix, padlocks, neon).

## Deliverable
Self-contained HTML/CSS mockups for each of the three surfaces (popup ~380px wide; banner full-width slim; modal ~360–400px card), in the palette and voice above, that I can adapt into the extension. Show the *interception modal* first — it's the moment that matters most.
