# Platform Adapter System — Design Spec

*2026-06-17. Status: design approved (scope + architecture). Awaiting spec review → implementation plan.*

## Goal

Make adding a new surface to Safety Intercept a **small declarative config**, not a from-scratch content script. Architected to cover all three surface types — payment rails, messaging apps, and marketplaces — so the product can be the "trust & safety guardrail at the moment money moves" across the surfaces where agentic + Gen Z money actually moves.

## Why now (strategic frame)

Per the Plaid "State of Intelligent Finance" report (see `POSITIONING.md`): fraud detection is the #1 trust driver, and as AI agents move money, consumers demand a confirm/undo guardrail at the moment of action. Safety Intercept lives at that moment. Current coverage (PayPal, Wells Fargo Zelle, Gmail) skews old; the durable position requires the Gen Z / agentic surfaces — but the *framework* matters more than raw platform count while the user base is small.

## Current state (what we're formalizing, not greenfield)

- `src/content/payment_interceptor.tsx` (~1,000 lines) already has a `PLATFORM_CONFIG` keyed by hostname (`paypal.com`, `venmo.com`, `wellsfargo.com`…) with `{ name, selectors }` + per-platform send-button regexes. But: only PayPal + Wells Fargo are enabled in the manifest; Venmo config exists but is dormant; Wells Fargo multi-step SPA logic is special-cased inline.
- `src/content/gmail_scanner.tsx` (~400 lines) is a separate passive scanner.
- Shared, reused as-is: `/analyze` relay call (`callRelayAPI`), `FraudDetector` scoring, cross-layer correlation store (`chrome.storage.local`), warning UI (`SafetyInterceptModal`, the Gmail banner).

## Architecture

**Registry → two engines → per-platform adapters.**

### Adapter (declarative, one file per platform)

```ts
interface PlatformAdapter {
  id: string;                       // 'venmo', 'paypal', 'gmail'
  matches: string[];                // host match patterns (drives manifest + dispatch)
  surface: 'payment' | 'message' | 'marketplace';

  // PAYMENT surfaces — active interception:
  action?: {
    triggerSelectors: string[];     // the send/pay button(s) to intercept
    confirmText?: RegExp;           // button text confirming it's the real send
    extractMemo: () => string;      // memo/note text the user typed
    extractAmount?: () => number;
    extractRecipient?: () => string;
  };

  // MESSAGE / MARKETPLACE surfaces — passive scan:
  scan?: {
    contentSelectors: string[];     // message/listing containers to observe
    extractContent: (el: Element) => { text: string; sender?: string };
    threadKey?: (el: Element) => string;  // dedup key
  };

  quirks?: Record<string, unknown>; // e.g. Wells Fargo multi-step SPA handling
}
```

### Two engines (shared, platform-agnostic)

- **Interception engine** (`surface: 'payment'`): listens for the trigger action, extracts memo/amount/recipient via the adapter, scores via `/analyze` + heuristics + correlation, and on high risk shows the **confirm-before-you-send checkpoint** (the existing `SafetyInterceptModal`) with cancel / send-anyway. This is the generalized "money-moves guardrail" — the same checkpoint any payment adapter triggers, which is exactly the agentic-finance positioning.
- **Scan engine** (`surface: 'message' | 'marketplace'`): MutationObserver over the adapter's `contentSelectors`, extracts content, scores, and shows the **non-blocking warning banner** (Gmail's current behavior). Feeds the cross-layer correlation store so a scam message can elevate a later payment.

### Dispatch

Single content-script entry: match `location.hostname` against the adapter registry → load the matching adapter → hand it to the engine its `surface` selects. One built content bundle injected on all matched hosts (manifest `matches` generated from the adapters).

### File layout

```
src/content/
  engine/
    intercept-engine.ts     # payment checkpoint flow
    scan-engine.ts          # passive scan + banner
    shared.ts               # scoring, correlation, UI glue
  adapters/
    paypal.ts  wellsfargo.ts  gmail.ts   # refactored from existing
    venmo.ts   cashapp.ts                # NEW in v1
    registry.ts             # all adapters + hostname dispatch
  entry.ts                  # content-script entry: dispatch
```

## v1 scope (approved)

- Build the framework (designed for all 3 surface types).
- **Refactor** PayPal, Wells Fargo Zelle, Gmail onto adapters (no behavior regression — this is the safety net and shrinks `payment_interceptor.tsx`).
- **Add Venmo + Cash App** (payment rails — Gen Z money surfaces, same shape as existing payment flow, lowest build + CWS risk).

## Explicitly out of scope for v1 (→ v2)

- **Messaging surfaces** (WhatsApp/Messenger/Telegram) and **marketplaces** (FB Marketplace/Craigslist). Deferred mainly for **CWS survival**: asking a payment-reading extension to also read private chats is a deep-review / possible-rejection permission jump. Ship the framework + payment rails first, establish store trust, then add scan-surface adapters (the framework already supports them — they become config + a separate review).

## Risks & mitigations

- **Selector fragility** (Venmo/Cash App are React apps with churning class names): selectors live in the adapter config (easy hotfix, no engine change); prefer stable attributes (`data-testid`, ARIA, button text regex) over class names; add a text-pattern fallback for the send button.
- **CWS review** on new host permissions: v1 adds only `venmo.com` + Cash App's web domain (two payment domains) — a modest, defensible expansion vs. messaging.
- **Regression on existing 3**: the refactor must preserve current behavior exactly; cover each adapter's extraction with DOM-fixture tests before swapping the live path.

## Testing

- Each adapter: given a saved DOM fixture, asserts correct memo/amount/recipient (payment) or content/sender (scan) extraction — independently testable, no engine needed.
- Each engine: tested against a mock adapter (does the checkpoint fire at the right score? does the banner render? does correlation elevate?).
- The eval harness already covers scoring; adapters are about *extraction*, engines about *flow*.

## Success criteria

1. Adding a platform is one adapter file + one registry line + one manifest match.
2. PayPal/Zelle/Gmail behave identically post-refactor (no regression).
3. Venmo + Cash App intercept a risky payment with the confirm checkpoint, end-to-end.
4. `payment_interceptor.tsx` is decomposed; no single file owns multiple platforms' logic.
