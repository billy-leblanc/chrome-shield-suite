# Safety Intercept — Fraud Detection API
**Version:** 1.0  
**Base URL:** `https://api.safetyintercept.com/v1`  
**Auth:** Bearer token (issued per organization)

---

## Overview

Safety Intercept provides real-time AI-powered fraud scoring for payment transactions. Each analysis request returns a risk score, classification, and the specific fraud signals detected — enabling your platform to gate, flag, or block payments before money moves.

The API is stateless and adds under 300ms of latency to the payment confirmation path. It is designed to be dropped into existing payment flows as a pre-confirmation check.

---

## POST /v1/analyze

Analyzes a payment transaction for fraud and social engineering indicators.

### Request

```http
POST /v1/analyze
Authorization: Bearer <api_key>
Content-Type: application/json
```

```json
{
  "memo":     "Send $500 now or your account will be suspended",
  "amount":   500.00,
  "platform": "zelle",
  "api_key":  "sk_live_..."
}
```

| Field      | Type    | Required | Description                                                                 |
|------------|---------|----------|-----------------------------------------------------------------------------|
| `memo`     | string  | Yes      | The payment note or memo entered by the sender. Max 1,000 characters.       |
| `amount`   | number  | No       | Transaction amount in USD. Used to weight high-value transaction risk.      |
| `platform` | string  | No       | Payment platform identifier (e.g. `zelle`, `venmo`, `paypal`, `ach`).      |
| `api_key`  | string  | Yes      | Your organization's API key. Also accepted as a Bearer token in the header. |

### Response

```json
{
  "riskScore": 87,
  "riskLevel": "critical",
  "flags":     ["urgency/pressure tactics", "account closure threat", "impersonation"],
  "reasoning": "Memo uses artificial urgency and threat of account closure — classic social engineering pattern used in payment fraud."
}
```

| Field       | Type            | Description                                                                                          |
|-------------|-----------------|------------------------------------------------------------------------------------------------------|
| `riskScore` | integer (0–100) | Composite fraud score. 0 = no threat. 100 = certain fraud.                                           |
| `riskLevel` | string          | Classification: `low` (0–19), `medium` (20–49), `high` (50–79), `critical` (80–100).               |
| `flags`     | string[]        | Detected fraud signal categories. Empty array if no signals found.                                   |
| `reasoning` | string          | One-sentence human-readable explanation of the primary risk driver.                                  |

### Risk Levels

| Level      | Score   | Recommended Action                                              |
|------------|---------|-----------------------------------------------------------------|
| `low`      | 0–19    | Allow. No intervention required.                               |
| `medium`   | 20–49   | Soft warning. Prompt user to verify recipient.                  |
| `high`     | 50–79   | Intercept. Require secondary confirmation before proceeding.    |
| `critical` | 80–100  | Block. Present a hard stop with fraud explanation.              |

### Detected Signal Categories

The `flags` array will contain zero or more of the following:

- `urgency/pressure tactics` — language demanding immediate action
- `impersonation` — claims to be a bank, government agency, or known contact
- `account closure threat` — threatens consequences (suspension, arrest, loss of funds)
- `family emergency scam` — grandparent / bail / accident patterns
- `lottery/prize fraud` — winnings, inheritance, unclaimed funds
- `advance fee fraud` — pay a fee to receive a larger sum
- `romance scam indicators` — emotional manipulation patterns
- `phishing language` — credential or verification requests
- `high amount transaction` — transaction exceeds $500 threshold

---

## Error Responses

| Status | Code                  | Description                                          |
|--------|-----------------------|------------------------------------------------------|
| `400`  | `invalid_request`     | Missing required field or malformed JSON.            |
| `401`  | `unauthorized`        | Missing or invalid API key.                          |
| `422`  | `memo_too_long`       | Memo exceeds 1,000 character limit.                  |
| `429`  | `rate_limit_exceeded` | Request rate limit reached. Contact us to increase.  |
| `500`  | `internal_error`      | Analysis unavailable. Safe to allow transaction.     |

All errors return:
```json
{ "error": "<code>", "message": "<human-readable description>" }
```

---

## Detection Model

Safety Intercept uses a blended scoring model:

- **Heuristic layer (60%)** — pattern matching against a continuously updated library of known fraud signals, including polymorphic variants (character substitution, Unicode obfuscation)
- **LLM layer (40%)** — Claude (Anthropic) performs semantic analysis of the memo for novel social engineering patterns not covered by known signatures

The two scores are weighted and merged into a single `riskScore`. If the LLM layer is unavailable, the heuristic layer runs independently with no degradation to availability.

---

## Integration Example

```javascript
// Pre-confirmation check — call before executing payment
async function checkPayment(memo, amount, platform) {
  const res = await fetch('https://api.safetyintercept.com/v1/analyze', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_YOUR_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ memo, amount, platform }),
  });
  const { riskLevel, flags, reasoning } = await res.json();
  if (riskLevel === 'critical' || riskLevel === 'high') {
    showFraudWarning(reasoning, flags); // your UI
    return false; // block
  }
  return true; // allow
}
```

---

## SLA & Performance

| Metric         | Target       |
|----------------|--------------|
| p50 latency    | < 180ms      |
| p99 latency    | < 500ms      |
| Availability   | 99.9% uptime |
| Timeout policy | 5s hard cap — on timeout, `riskScore` returns 0 (fail open) |

---

## Pricing

| Tier           | Requests/mo   | Price             |
|----------------|---------------|-------------------|
| Sandbox        | 1,000         | Free              |
| Growth         | 100,000       | $299/mo           |
| Scale          | 1,000,000     | $1,999/mo         |
| Enterprise     | Unlimited     | Custom contract   |

Volume discounts and white-label options available for enterprise customers.  
Contact: **billy@safetyintercept.com**

---

*Safety Intercept is built on Anthropic's Claude and deployed on Cloudflare's global edge network. SOC 2 Type II audit in progress.*
