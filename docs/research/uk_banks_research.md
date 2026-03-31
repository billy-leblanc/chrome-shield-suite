# Research: UK Banking Payment Interception

This document outlines the payment button selectors and URL patterns for major UK financial institutions (HSBC, Barclays, Revolut) to enable proactive fraud prevention.

## 1. HSBC UK
*   **Target Portal:** `https://www.services.online-banking.hsbc.co.uk/`
*   **Matches:** `*://*.hsbc.co.uk/*`
*   **Key Selectors:**
    - `button[aria-label="Confirm payment"]` (Primary accessibility-based selector)
    - `.hsbcButtonContinue` (Used across multiple transfer steps)
    - `button#submit` / `#submit` (Common for final transaction confirmation)
*   **UX Pattern:** Multi-step wizard (Continue -> Review -> Confirm).

## 2. Barclays UK
*   **Target Portal:** `https://bank.barclays.co.uk/`
*   **Matches:** `*://*.barclays.co.uk/*`
*   **Key Selectors:**
    - `[data-automation="confirm-payment-button"]` (Standard testing identifier)
    - `#payment-submit` (Legacy ID for P2P/Bill pay submissions)
    - `.btn-primary.confirm` (Final confirmation button)
*   **UX Pattern:** Single-page payment forms with "Review" modals.

## 3. Revolut
*   **Target Portal:** `https://app.revolut.com/`
*   **Matches:** `*://*.revolut.com/*`
*   **Key Selectors:**
    - `[data-testid="transfer-button"]` (Entry action for moving funds)
    - `[data-testid="confirm-button"]` (Final transaction commitment)
    - `[data-testid="send-money"]` (P2P entry point)
*   **UX Pattern:** Highly dynamic SPA using React. Uses consistent `data-testid` attributes.

---

### Implementation Strategy
For the unified `payment_interceptor.tsx`, we will add these selectors to the platform detection logic:

```typescript
const UK_SELECTORS = [
  'button[aria-label="Confirm payment"]',
  '[data-automation="confirm-payment-button"]',
  '[data-testid="confirm-button"]',
  '.hsbcButtonContinue'
];
```

Navigation and framing for Barclays and HSBC may require `all_frames: true` in the manifest due to their use of legacy banking frames.
