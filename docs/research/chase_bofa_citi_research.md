# Research: Embedded Zelle — Chase, BofA, Citi

This document tracks the DOM selectors for Zelle embedded directly inside the web portals of Chase, Bank of America, and Citi.

## Chase

*   **Target portal:** `https://secure.chase.com/web/auth/dashboard#/dashboard/p2p/zelle/send-money/verify`
*   **Manifest match:** `*://*.chase.com/*`
*   **Zelle entry point:** Pay & Transfer → Send Money with Zelle

### Selector findings — Review / Confirm screen

| Priority | Selector | Source | Stability |
|----------|----------|--------|-----------|
| 1 | `button[data-testid="send-it-now"]` | `data-testid` attribute | High — Final payment submission |
| 2 | `button#send-it-now` | `id` attribute | High — Standard Chase ID |
| 3 | `button[data-testid="review-send-button"]` | `data-testid` attribute | High — Review step button |

---

## Bank of America (BofA)

*   **Target portal:** `https://online.bankofamerica.com/onlinebanking/home/zelle/send-money`
*   **Manifest match:** `*://*.bankofamerica.com/*`
*   **Zelle entry point:** Transfer/Send → Send Money with Zelle

### Selector findings — Review / Confirm screen

| Priority | Selector | Source | Stability |
|----------|----------|--------|-----------|
| 1 | `button[data-testid="confirm-transfer-button"]` | `data-testid` attribute | High — Final confirmation |
| 2 | `button#send-button` | `id` attribute | High — Legacy submission ID |
| 3 | `button[data-testid="send-money-button"]` | `data-testid` attribute | Medium — Initial send action |

> **Note:** BofA often embeds the Zelle experience within an iframe. The interceptor must ensure it scans all frames.

---

## Citi

*   **Target portal:** `https://online.citi.com/US/nga/zelle/p2ptransfer`
*   **Manifest match:** `*://*.citi.com/*`
*   **Zelle entry point:** Payments & Transfers → Send Money with Zelle

### Selector findings — Review / Confirm screen

| Priority | Selector | Source | Stability |
|----------|----------|--------|-----------|
| 1 | `button[data-testid="verify-button"]` | `data-testid` attribute | High — Primary verification button |
| 2 | `button[data-testid="confirm-button"]` | `data-testid` attribute | High — Secondary confirmation |
| 3 | `button[data-testid="send-money-button"]` | `data-testid` attribute | Medium — Workflow entry point |

---

### Implementation

Added to `PORTAL_CONFIGS` in `src/content/payment_interceptor.tsx`:

```typescript
  'chase.com': {
    name: 'Chase (Zelle)',
    selectors: [
      'button[data-testid="send-it-now"]',
      'button#send-it-now',
      'button[data-testid="review-send-button"]'
    ]
  },
  'bankofamerica.com': {
    name: 'Bank of America (Zelle)',
    selectors: [
      'button[data-testid="confirm-transfer-button"]',
      'button#send-button',
      'button[data-testid="send-money-button"]'
    ]
  },
  'citi.com': {
    name: 'Citi (Zelle)',
    selectors: [
      'button[data-testid="verify-button"]',
      'button[data-testid="confirm-button"]',
      'button[data-testid="send-money-button"]'
    ]
  }
```
