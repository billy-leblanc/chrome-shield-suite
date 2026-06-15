# Chrome Web Store — Safety Intercept 1.0.3 listing (paste-ready)

Item ID: bpafnjhfjimdoamnjepkfljpegpmmeom

---

## STORE LISTING tab

**Product name**
Safety Intercept

**Summary** (max 132 chars)
Catches payment scams and phishing emails in real time on PayPal, Zelle & Gmail — and pauses you before you send.

**Category**
Productivity  (or "Communication" — Productivity is the safer fit)

**Language**
English

**Detailed description**
```
Safety Intercept steps in at the one moment that matters — the half-second before you send money to a scammer.

It reads payment memos and emails in real time and uses AI to spot the patterns behind real fraud: fake refunds, family-emergency cons, "your account is locked" phishing, overpayment tricks, and crypto scams. When something looks wrong, it pauses you with a plain-English warning that explains what's off and why — no jargon, no dashboards.

WHERE IT WORKS
• PayPal — payment memos
• Wells Fargo Zelle — transfers
• Gmail — phishing and scam emails

WHAT MAKES IT DIFFERENT
• Real-time interception — it acts before you send, not after you've lost the money
• Plain-English warnings anyone can understand, built for protecting yourself and the people you worry about
• Connects the dots — links a scam email to the payment it's trying to trigger
• Free

BUILT PRIVATE BY DESIGN
• Your messages and emails are analyzed in transit and never stored
• No raw IP address, no precise location — country only
• No exact payment amounts, no email subjects or bodies kept
• We never sell your data or build advertising profiles
Full policy: https://safetyintercept.com/privacy

Scams cost people billions every year, and they work by creating urgency so you act before you think. Safety Intercept gives you back that moment to think.
```

---

## PRIVACY tab

**Single purpose description**
```
Detect and intercept payment fraud and social-engineering scams at the moment of payment, by analyzing payment context and incoming email for scam patterns and warning the user before they act.
```

**storage justification**
```
Stores locally on the user's device: protection stats, threat log, intercept enable/disable preference, telemetry opt-in flag, recent Gmail scam detections (24h cache for email-to-payment correlation), and a random install identifier used to count distinct installations.
```

**alarms justification**
```
Used to keep the Manifest V3 service worker alive via a periodic keep-alive alarm so the background risk engine remains responsive when the user initiates a payment.
```

**Host permission justification**
```
*://*.paypal.com/* — Inject content script on PayPal Send Money to intercept the Send button and analyze the payment memo before submission.

*://*.wellsfargo.com/* — Inject content script on Wells Fargo Zelle to intercept payment submission and analyze the memo for scam patterns.

*://mail.google.com/* — Scan opened messages for social-engineering scam patterns (fake emergencies, impersonation, urgency tactics) so the user can be warned before acting on a scam email.

https://*.workers.dev/* — Send payment memo and email content to our Cloudflare Worker relay for AI-based risk analysis. The relay forwards to Anthropic's API; the API key is server-side and never shipped in the extension.
```

**Are you using remote code?** → No, I am not using Remote code

**What user data do you collect?** (check)
- [x] Personally identifiable information  (email content analyzed may contain it — disclose to be safe)
- [x] Financial and payment information  (payment memos analyzed)
- [x] Personal communications  (emails analyzed)
- [x] Location  (country only, derived at the edge)
- [x] Website content  (page text read for analysis)
- [ ] Health information
- [ ] Authentication information
- [ ] Web history
- [ ] User activity

**Certify all three** (true because the sellable feed is scam-side, PII-purged data — NOT user data):
- [x] I do not sell or transfer user data to third parties, outside of approved use cases
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**
```
https://safetyintercept.com/privacy
```

---

## STILL TO DO before submit
- Upload package: ~/Downloads/safety-intercept-1.0.3-cws.zip (version 1.0.3)
- Store listing → Homepage URL: change to https://safetyintercept.com (was the dead vercelapp.com)
- Replace blank placeholder screenshots (the interception card from the landing page is the strongest slot-1 image)
