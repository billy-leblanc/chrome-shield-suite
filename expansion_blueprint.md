# Expansion Blueprint: Zelle & Venmo Interception

## Overview
This plan outlines the technical requirements for expanding the Chrome Shield Suite beyond PayPal to support Zelle (via bank portals) and Venmo.

## Proposed Architecture: Unified Shield
We will use the **Unified Shield** approach (recently implemented in `payment_interceptor.tsx`) rather than separate files to maintain a centralized security logic and reduce extension footprint.

### [Component] Venmo Interceptor
Venmo is a React SPA with dynamic classes. Detection relies on stable data attributes for high reliability.
#### [MODIFY] [payment_interceptor.tsx](src/content/payment_interceptor.tsx)
- **Target Selectors**:
    - `button[data-testid="pay-button"]` (Payment trigger)
    - `textarea[name="note"]` (Context extraction for Risk Engine)
- **Strategy**: Use `MutationObserver` to ensure the interceptor stays active during client-side navigation.

---

### [Component] Zelle Interceptor
Zelle is typically embedded in bank portals via iframes.
#### [MODIFY] [payment_interceptor.tsx](src/content/payment_interceptor.tsx)
- **Target Selectors**:
    - `button#send-money-zelle-button` (Chase/BofA specific)
    - `button[type="submit"]` (Internal Zelle iframe)
- **Strategy**: Leverage `all_frames: true` in `manifest.json` to inject the interceptor directly into the Zelle iframe.

## Risk Engine Compatibility
The current `RiskEngine.analyze()` API is fully compatible:
- **Input**: `{ message, amount, platform }`
- **Output**: `RiskAnalysis` (Score, Level, Flags)
- **Detection**: Already includes platform hooks for "Zelle" and "Venmo" within the social engineering heuristics.

## Verification Plan
1. **Manual Testing**: Validate interception on Venmo.com and simulated bank portals.
2. **Security Audit**: Ensure `stopImmediatePropagation()` correctly prevents site-native "Pay" events on both platforms.
