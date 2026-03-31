# Project Memory: Strategic Decisions

## Core Architecture
- **Decision:** Use a Shadow DOM for all injected UI components.
- **Rationale:** Prevents CSS leakage from the target website (e.g., PayPal) from breaking the extension's UI and ensures the extension's Tailwind v4 styles do not interfere with the host page.
- **Status:** Implemented in `src/content/paypal_interceptor.tsx`.

## Targeting Strategy
- **Decision:** Target PayPal (`https://www.paypal.com`) as the primary platform for fraud prevention.
- **Rationale:** PayPal is a high-volume platform for consumer transactions and a frequent target for AI-generated social engineering and phishing scams.
- **Status:** Content script active on `*://*.paypal.com/*`.

## Event Interception
- **Decision:** Use `{ capture: true }` on event listeners for payment buttons.
- **Rationale:** Capturing events early in the propagation chain allows the extension to `preventDefault()` before site-native scripts can process the transaction.
- **Status:** Implemented in the `Interceptor` component.

## Unified Multi-Platform Interceptor
- **Decision:** Consolidate platform-specific interceptors into a single `payment_interceptor.tsx`.
- **Rationale:** Reduces code duplication and allows for a shared "Shield" UI and Risk Engine integration. Platform detection is handled via `window.location.hostname`.
- **Status:** Implemented for PayPal, Venmo, and Zelle.

## Security Audit & Hardening
- **Decision:** Implement `MutationObserver` and `stopImmediatePropagation`.
- **Rationale:** SPAs (Venmo/PayPal) often re-render buttons; `MutationObserver` ensures we re-bind. `stopImmediatePropagation` prevents malicious or competing scripts from observing the intercepted event.
- **Status:** Integrated into `payment_interceptor.tsx`.
