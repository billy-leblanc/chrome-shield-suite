# ACH Fraud Intelligence & Strategic Positioning

**Source Material:** Stripe's "ACH Fraud 101" (https://stripe.com/resources/more/ach-fraud-101-how-these-scams-work-and-how-to-prevent-them)

## The Core Finding
Stripe and other major payment processors classify several types of ACH fraud, but their detection mechanisms are almost entirely post-transaction or mathematically based (e.g., velocity, unusual IP, high-risk geographic location). They lack visibility into the **cognitive/psychological layer** of the transaction.

## Key Vulnerabilities Highlighted by Stripe
1. **Fake Payments & Business Email Compromise (BEC):** Trickery where authorized users are convinced via email to send money to fraudulent accounts.
2. **Data Theft & Phishing:** Stealing credentials to log in.
3. **Account Takeover:** Using stolen credentials to initiate transfers.

**Stripe's Official Advice for Detection:**
> "Urgent requests (e.g., emails or calls demanding immediate action) pressuring businesses to expedite payments or send money to unfamiliar accounts."
> "Verification procedures... Employees should be able to recognize phishing and to be skeptical of changes."

## The Safety Intercept Niche (The Whitespace)
**Processors cannot read the email.** Stripe knows that urgency and pressure in emails are the primary signs of BEC and Authorized Push Payment (APP) fraud. However, they only see the transaction data *after* the user clicks "Send." They rely on humans to recognize the phishing attempt.

**Safety Intercept's Advantage:**
Safety Intercept lives in the DOM. By scanning Gmail and intercepting the DOM payload *before* the bank processes it, Safety Intercept acts as the missing link between the psychological manipulation (the email) and the financial execution (the payment screen). 

1. **Semantic Intent Scoring:** Instead of looking at device telemetry, you look at the unstructured narrative meaning behind the transaction (e.g. "for bail money", "urgent vendor invoice update").
2. **Agentic Automation:** You remove the human error that Stripe relies on. The Cloudflare relay AI acts as an Agentic Fraud Analyst that halts the transfer if social engineering is detected.
3. **Liability Shift Avoidance:** For BEC, liability usually falls on the business whose employee pushed the button. Safety Intercept stops the button from being pushed.

## Conclusion
The gap between **Enterprise Email Security** (which catches phishing but doesn't touch funds) and **Enterprise Payment Processors** (which touch funds but don't see the email) is massive. Safety Intercept bridges this exact gap by correlating cross-layer UI data.
