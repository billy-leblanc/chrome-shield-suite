# Research: Payment Portal Selectors & DOM Patterns

## Venmo (venmo.com)
Venmo is a Modern React Single Page Application.
- **Button Characterisitcs**: Uses `data-testid` and `aria-label` which are highly stable vs CSS classes.
- **Primary Selector**: `button[data-testid="pay-button"]`
- **Secondary Selectors**:
    - `button[aria-label="Pay"]`
    - `button:contains("Pay")` (via XPath or text-based targeting)
- **Context Extraction**:
    - Amount: `input[data-testid="amount-input"]`
    - Message/Note: `textarea[name="note"]`

---

## Zelle (Banking Interoperability)
Zelle is typically embedded via an **iframe** from `zellepay.com`.
- **Button Characterisitcs**: Fixed IDs are common in bank integrations.
- **Primary Selector (Standard)**: `button#send-money-zelle-button`
- **Primary Selector (Internal)**: `button[type="submit"]` (specifically when targeted within the Zelle iframe context).
- **Secondary Selectors**:
    - `button:contains("Send Money With Zelle")`
    - `a[href*='zelle']` (Initial navigation intercept)
- **Architectural Note**: Must use `all_frames: true` in `manifest.json` to reach inside bank-hosted iframes.

---

## Risk Engine Alignment
- **Detection**: Heuristics are already updated to catch "Zelle" and "Venmo" in the message context.
- **API**: The current JSON payload `{ message, amount, platform }` is consistent across all three US payment leaders (PayPal, Venmo, Zelle).
