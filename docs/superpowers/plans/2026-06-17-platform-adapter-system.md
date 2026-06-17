# Platform Adapter System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make adding a payment/message/marketplace surface a small declarative adapter, refactor the existing PayPal/Zelle/Gmail logic onto it with zero regression, then add Venmo + Cash App.

**Architecture:** A typed `PlatformAdapter` (declarative per-platform config) + a registry that dispatches by hostname + two shared engines (intercept for payment surfaces, scan for message/marketplace surfaces). Existing content scripts are decomposed onto this. Engines reuse the existing scoring (`/analyze`, `FraudDetector`), correlation store, and warning UI.

**Tech Stack:** TypeScript, React 18, Vite (multi-config content builds), Vitest + jsdom + @testing-library, Chrome MV3 content scripts.

Design spec: `docs/superpowers/specs/2026-06-17-platform-adapter-design.md`.

---

## File structure

```
src/content/
  adapters/
    types.ts          # PlatformAdapter interface + surface types (NEW)
    registry.ts       # all adapters + getAdapterForHost() (NEW)
    paypal.ts         # payment adapter, lifted from payment_interceptor (NEW)
    wellsfargo.ts     # payment adapter incl. multi-step SPA quirk (NEW)
    venmo.ts          # payment adapter (NEW, v1)
    cashapp.ts        # payment adapter (NEW, v1)
    gmail.ts          # message adapter, lifted from gmail_scanner (NEW)
  engine/
    score.ts          # shared: ANALYZE_RISK round-trip + correlation (NEW, lifted)
    intercept-engine.ts  # payment-surface flow + checkpoint modal (NEW, lifted)
    scan-engine.ts    # passive scan + warning banner (NEW, lifted from gmail)
  entry-payment.ts    # content entry: dispatch payment adapters (NEW, replaces payment_interceptor entry)
  entry-message.ts    # content entry: dispatch message/marketplace adapters (NEW, replaces gmail entry)
src/content/payment_interceptor.tsx  # DELETED at end of refactor
src/content/gmail_scanner.tsx        # DELETED at end of refactor
src/content/__fixtures__/            # saved DOM HTML for adapter extraction tests (NEW)
```

Build config: `vite.content.config.ts` input switches to `entry-payment.ts`; `vite.gmail.config.ts` input switches to `entry-message.ts`. Manifest (`public/manifest.json`) gains `venmo.com` + `cash.app` matches/host_permissions.

---

## Task 1: Adapter types + registry skeleton

**Files:**
- Create: `src/content/adapters/types.ts`
- Create: `src/content/adapters/registry.ts`
- Test: `src/content/adapters/registry.test.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
// src/content/adapters/types.ts
export type SurfaceType = 'payment' | 'message' | 'marketplace';

export interface PaymentExtract {
  memo: string;
  amount: number;
  recipient: string;
}

export interface ScanItem {
  text: string;
  sender: string;
  threadKey: string;
}

export interface PaymentAdapter {
  id: string;
  matches: string[];          // hostnames this adapter owns, e.g. ['venmo.com']
  surface: 'payment';
  triggerSelectors: string[]; // send/pay buttons to intercept
  confirmText: RegExp;        // button text confirming it's the real send action
  extract(doc: Document): PaymentExtract;
  multiStep?: boolean;        // true = SPA where memo lives on an earlier step (Wells Fargo)
}

export interface ScanAdapter {
  id: string;
  matches: string[];
  surface: 'message' | 'marketplace';
  contentSelectors: string[]; // containers to observe + read
  read(el: Element): ScanItem | null;
}

export type PlatformAdapter = PaymentAdapter | ScanAdapter;
```

- [ ] **Step 2: Write the failing registry test**

```ts
// src/content/adapters/registry.test.ts
import { describe, it, expect } from 'vitest';
import { getAdapterForHost } from './registry';

describe('getAdapterForHost', () => {
  it('matches a host suffix to its adapter', () => {
    expect(getAdapterForHost('www.venmo.com')?.id).toBe('venmo');
    expect(getAdapterForHost('account.venmo.com')?.id).toBe('venmo');
  });
  it('returns null for an unknown host', () => {
    expect(getAdapterForHost('example.com')).toBeNull();
  });
});
```

- [ ] **Step 3: Run it — expect FAIL**

Run: `npx vitest run src/content/adapters/registry.test.ts`
Expected: FAIL (`getAdapterForHost` / `./registry` not found).

- [ ] **Step 4: Write `registry.ts` with only the Venmo stub adapter**

```ts
// src/content/adapters/registry.ts
import type { PlatformAdapter } from './types';
import { venmoAdapter } from './venmo';

const ADAPTERS: PlatformAdapter[] = [venmoAdapter];

export function getAdapterForHost(host: string): PlatformAdapter | null {
  const h = host.toLowerCase();
  return ADAPTERS.find(a => a.matches.some(m => h === m || h.endsWith('.' + m))) ?? null;
}

export { ADAPTERS };
```

- [ ] **Step 5: Create a minimal `venmo.ts` stub so the import resolves**

```ts
// src/content/adapters/venmo.ts
import type { PaymentAdapter } from './types';
export const venmoAdapter: PaymentAdapter = {
  id: 'venmo', matches: ['venmo.com'], surface: 'payment',
  triggerSelectors: [], confirmText: /Pay/i,
  extract: () => ({ memo: '', amount: 0, recipient: '' }),
};
```

- [ ] **Step 6: Run test — expect PASS**

Run: `npx vitest run src/content/adapters/registry.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/content/adapters/types.ts src/content/adapters/registry.ts src/content/adapters/registry.test.ts src/content/adapters/venmo.ts
git commit -m "feat(adapters): adapter types + hostname registry"
```

---

## Task 2: Shared scoring service (`engine/score.ts`)

Lift the `ANALYZE_RISK` round-trip + correlation read out of the content scripts into one function both engines call. The background `risk_engine.ts` already owns the scoring; the content side just messages it.

**Files:**
- Create: `src/content/engine/score.ts`
- Test: `src/content/engine/score.test.ts`

- [ ] **Step 1: Write the failing test (mocks chrome.runtime.sendMessage)**

```ts
// src/content/engine/score.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scoreContent } from './score';

beforeEach(() => {
  (globalThis as any).chrome = {
    runtime: { id: 'x', sendMessage: vi.fn((_m, cb) => cb({ score: 92, riskLevel: 'critical', flags: ['x'] })) },
  };
});

describe('scoreContent', () => {
  it('round-trips ANALYZE_RISK and returns the report', async () => {
    const r = await scoreContent({ message: 'bail money for grandson', amount: 500, platform: 'Venmo' });
    expect(r?.score).toBe(92);
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ANALYZE_RISK' }), expect.any(Function),
    );
  });
  it('resolves null when the worker is unavailable', async () => {
    (globalThis as any).chrome.runtime.id = undefined;
    expect(await scoreContent({ message: 'x', amount: 0, platform: 'Venmo' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/content/engine/score.test.ts`

- [ ] **Step 3: Implement `score.ts`**

```ts
// src/content/engine/score.ts
import type { RiskAnalysis } from '../../core/fraud_detector';

export interface ScoreInput { message: string; amount: number; platform: string; senderEmail?: string; senderDomain?: string; }

export function scoreContent(input: ScoreInput): Promise<RiskAnalysis | null> {
  return new Promise((resolve) => {
    if (!chrome.runtime?.id) return resolve(null);
    try {
      chrome.runtime.sendMessage({ type: 'ANALYZE_RISK', data: input }, (report?: RiskAnalysis) => {
        if (chrome.runtime.lastError || !report) return resolve(null);
        resolve(report);
      });
    } catch { resolve(null); }
  });
}
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/content/engine/score.ts src/content/engine/score.test.ts
git commit -m "feat(engine): shared scoreContent service"
```

---

## Task 3: Intercept engine (payment checkpoint)

Generalize the payment-interception flow: given a `PaymentAdapter`, watch for the trigger button, on click extract → score → if high-risk show the checkpoint modal and block, else allow. Lift the existing modal mount + click-interception logic from `payment_interceptor.tsx` (the `getActiveConfig`/click-capture/`SafetyInterceptModal` mount path).

**Files:**
- Create: `src/content/engine/intercept-engine.ts`
- Test: `src/content/engine/intercept-engine.test.ts`

- [ ] **Step 1: Failing test — a mock adapter + a fake send button; clicking it triggers extraction + scoring**

```ts
// src/content/engine/intercept-engine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInterceptEngine } from './intercept-engine';
import type { PaymentAdapter } from '../adapters/types';

const adapter: PaymentAdapter = {
  id: 'mock', matches: ['mock.test'], surface: 'payment',
  triggerSelectors: ['#send'], confirmText: /Pay/i,
  extract: () => ({ memo: 'bail money', amount: 500, recipient: 'new-person' }),
};

beforeEach(() => {
  document.body.innerHTML = '<button id="send">Pay $500</button>';
  (globalThis as any).chrome = { runtime: { id: 'x', sendMessage: vi.fn((_m, cb) => cb({ score: 95, riskLevel: 'critical', flags: ['family-emergency-impersonation'], recommendation: '' })) } };
});

describe('runInterceptEngine', () => {
  it('intercepts the trigger click and scores the extracted payment', async () => {
    runInterceptEngine(adapter);
    document.querySelector<HTMLButtonElement>('#send')!.click();
    await new Promise(r => setTimeout(r, 0));
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/content/engine/intercept-engine.test.ts`

- [ ] **Step 3: Implement `intercept-engine.ts`** — capture-phase click listener on document; if `target.closest(triggerSelector)` matches, `preventDefault`/`stopPropagation`, call `adapter.extract(document)`, `scoreContent(...)`, and on `riskLevel` high/critical render the checkpoint (reuse `SafetyInterceptModal` from `src/components/SafetyInterceptModal`). Port the existing mount + "proceed/cancel" wiring from `payment_interceptor.tsx` verbatim (it already emits the `intercepted`/`cancelled`/`proceeded` LOG_EVENTs — keep those).

```ts
// src/content/engine/intercept-engine.ts (shape — port modal mount from payment_interceptor.tsx)
import { scoreContent } from './score';
import type { PaymentAdapter } from '../adapters/types';

export function runInterceptEngine(adapter: PaymentAdapter): void {
  document.addEventListener('click', async (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    const hit = adapter.triggerSelectors.some(sel => { try { return target.matches(sel) || !!target.closest(sel); } catch { return false; } });
    if (!hit) return;
    const { memo, amount, recipient } = adapter.extract(document);
    const report = await scoreContent({ message: memo, amount, platform: adapter.id, ...(recipient ? {} : {}) });
    if (report && (report.riskLevel === 'high' || report.riskLevel === 'critical')) {
      e.preventDefault(); e.stopImmediatePropagation();
      // mountCheckpoint(report, adapter, () => proceed()) — ported from payment_interceptor.tsx
    }
  }, true);
}
```

- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(engine): generalized payment intercept engine"`

---

## Task 4: Scan engine (passive warning)

Generalize Gmail's flow: given a `ScanAdapter`, MutationObserver over `contentSelectors`, `adapter.read(el)` → score → on high-risk render the non-blocking banner + record the detection for correlation. Lift the observer + banner mount from `gmail_scanner.tsx`.

**Files:**
- Create: `src/content/engine/scan-engine.ts`
- Test: `src/content/engine/scan-engine.test.ts`

- [ ] **Step 1: Failing test** — inject a content element, run engine, assert `read` + scoring fire.

```ts
// src/content/engine/scan-engine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runScanEngine } from './scan-engine';
import type { ScanAdapter } from '../adapters/types';

const adapter: ScanAdapter = {
  id: 'mockmail', matches: ['mock.test'], surface: 'message',
  contentSelectors: ['.msg'],
  read: (el) => ({ text: el.textContent || '', sender: 'a@b.com', threadKey: 't1' }),
};
beforeEach(() => {
  document.body.innerHTML = '<div class="msg">grandson in jail send gift cards now</div>';
  (globalThis as any).chrome = { runtime: { id: 'x', sendMessage: vi.fn((_m, cb) => cb({ score: 90, riskLevel: 'critical', flags: [], recommendation: '' })) } };
});
describe('runScanEngine', () => {
  it('reads matched content and scores it', async () => {
    await runScanEngine(adapter);
    await new Promise(r => setTimeout(r, 10));
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `scan-engine.ts`** — scan existing matches on load + MutationObserver for new ones; dedup by `threadKey`; `scoreContent`; on high-risk mount the banner (port `gmail_scanner.tsx`'s shadow-root banner) and send the `gmail_scam_detected`-style LOG_EVENT (rename generic: `scam_detected` with `platform: adapter.id`).
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(engine): generalized passive scan engine"`

---

## Task 5: PayPal adapter (first refactor — proves the framework)

**Files:**
- Create: `src/content/adapters/paypal.ts`
- Create: `src/content/__fixtures__/paypal-checkout.html` (capture from a real PayPal send page DOM)
- Test: `src/content/adapters/paypal.test.ts`

- [ ] **Step 1: Capture fixture.** From a live PayPal send/checkout page, copy the relevant DOM subtree (button + memo + amount) into `paypal-checkout.html`. This is real-DOM capture, not invented markup.
- [ ] **Step 2: Failing test** — load fixture into `document.body.innerHTML`, assert `paypalAdapter.extract(document)` returns the right memo/amount.
- [ ] **Step 3: Implement `paypal.ts`** using the existing PayPal selectors + memo extraction from `payment_interceptor.tsx` (lines defining `PORTAL_CONFIGS['paypal.com']`, `TEXT_FALLBACK_PATTERNS['paypal.com']`, and the `textarea#memo, textarea[name="memo"], …` memo query). `confirmText: /Send Now|Complete|Pay Now|Send Money Now|Complete Purchase/i`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Add `paypalAdapter` to `registry.ts` ADAPTERS.**
- [ ] **Step 6: Commit** `git commit -am "feat(adapters): PayPal adapter (refactored from payment_interceptor)"`

---

## Task 6: Wells Fargo Zelle adapter (multi-step quirk)

**Files:**
- Create: `src/content/adapters/wellsfargo.ts`
- Create: `src/content/__fixtures__/wf-zelle.html`
- Test: `src/content/adapters/wellsfargo.test.ts`

- [ ] **Step 1: Capture fixture** from the Wells Fargo Zelle confirm step (includes the `span.pmask` memo fallback).
- [ ] **Step 2: Failing test** — assert extraction handles the `span.pmask` memo path and the `^Send$` button.
- [ ] **Step 3: Implement `wellsfargo.ts`** with `multiStep: true`; port the `domain === 'wellsfargo.com'` special-casing from `payment_interceptor.tsx` (the multi-step memo capture + `span.pmask` fallback) into the adapter's `extract`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Add to registry. Commit** `git commit -am "feat(adapters): Wells Fargo Zelle adapter w/ multi-step quirk"`

---

## Task 7: Gmail message adapter

**Files:**
- Create: `src/content/adapters/gmail.ts`
- Create: `src/content/__fixtures__/gmail-thread.html`
- Test: `src/content/adapters/gmail.test.ts`

- [ ] **Step 1: Capture fixture** of an opened Gmail thread (sender + subject + body containers).
- [ ] **Step 2: Failing test** — assert `gmailAdapter.read(el)` returns `{ text, sender, threadKey }`, porting `GMAIL_SELECTORS` + `extractThreadId` + the `[paymentLinkSignal + subject, bodyText]` assembly from `gmail_scanner.tsx`.
- [ ] **Step 3: Implement `gmail.ts`** (`surface: 'message'`, `matches: ['mail.google.com']`).
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Add to registry. Commit** `git commit -am "feat(adapters): Gmail message adapter"`

---

## Task 8: Wire entries + swap build inputs + delete old scripts

**Files:**
- Create: `src/content/entry-payment.ts`, `src/content/entry-message.ts`
- Modify: `vite.content.config.ts`, `vite.gmail.config.ts`
- Delete: `src/content/payment_interceptor.tsx`, `src/content/gmail_scanner.tsx`

- [ ] **Step 1: Write `entry-payment.ts`**

```ts
// src/content/entry-payment.ts
import { getAdapterForHost } from './adapters/registry';
import { runInterceptEngine } from './engine/intercept-engine';
const a = getAdapterForHost(location.hostname);
if (a && a.surface === 'payment') runInterceptEngine(a);
```

- [ ] **Step 2: Write `entry-message.ts`** (same shape, `surface !== 'payment'` → `runScanEngine`).
- [ ] **Step 3: Point `vite.content.config.ts` input → `src/content/entry-payment.ts`; `vite.gmail.config.ts` input → `src/content/entry-message.ts`.**
- [ ] **Step 4: Delete the two old `.tsx` files.**
- [ ] **Step 5: Build + manual smoke** — `npm run build`; load unpacked; confirm PayPal/Zelle intercept and Gmail banner still work (no regression — this is the gate).
- [ ] **Step 6: Commit** `git commit -am "refactor(content): dispatch via adapter registry; remove monolith scripts"`

---

## Task 9: Venmo adapter (NEW)

**Files:**
- Replace stub: `src/content/adapters/venmo.ts`
- Create: `src/content/__fixtures__/venmo-pay.html`
- Test: `src/content/adapters/venmo.test.ts`

- [ ] **Step 1: DOM capture (manual, required).** On `account.venmo.com` at the pay-confirm step, capture the real send button + note field + amount into `venmo-pay.html`. The existing guessed selectors (`button[data-testid="payment-button"]`) are unverified — record the *actual* `data-testid`/ARIA/text. Prefer stable attributes over CSS classes.
- [ ] **Step 2: Failing test** against the fixture.
- [ ] **Step 3: Implement the real `venmoAdapter.extract` + `triggerSelectors` + `confirmText: /Pay .*\$/i`.**
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(adapters): Venmo payment adapter"`

---

## Task 10: Cash App adapter (NEW)

**Files:**
- Create: `src/content/adapters/cashapp.ts`, `src/content/__fixtures__/cashapp-pay.html`
- Test: `src/content/adapters/cashapp.test.ts`

- [ ] **Step 1: DOM capture (manual)** from Cash App web pay flow → fixture.
- [ ] **Step 2: Failing test** against fixture.
- [ ] **Step 3: Implement `cashapp.ts`** (`matches: ['cash.app']`).
- [ ] **Step 4: Run — expect PASS. Add to registry.**
- [ ] **Step 5: Commit** `git commit -am "feat(adapters): Cash App payment adapter"`

---

## Task 11: Manifest + permissions + ship

**Files:**
- Modify: `public/manifest.json` (and `manifest.json` if separate)
- Test: `src/tests/selector-regression.spec.ts` (extend) — assert every adapter's `matches` appears in the manifest content_scripts + host_permissions.

- [ ] **Step 1: Add `venmo.com` + `cash.app`** to `content_scripts[].matches` (payment bundle) and `host_permissions`. Bump version to 1.1.0.
- [ ] **Step 2: Failing test** — manifest↔registry consistency (every payment adapter host is matched + permissioned).
- [ ] **Step 3: Make it pass** (fix any missing manifest entry).
- [ ] **Step 4: Full build + `npx vitest run`** — all green.
- [ ] **Step 5: Manual end-to-end** — Venmo + Cash App intercept a risky payment with the checkpoint; PayPal/Zelle/Gmail unchanged.
- [ ] **Step 6: Commit** `git commit -am "feat: enable Venmo + Cash App; manifest↔registry consistency test; v1.1.0"`

---

## Notes for the executor

- **No regression is the prime directive.** Tasks 5–8 must leave PayPal/Zelle/Gmail behaving identically; the fixtures + the manual smoke in Task 8 are the gate before deleting the old scripts.
- **Selector discovery (Tasks 9–10) is genuine manual reverse-engineering** — you cannot unit-test a selector you haven't observed on the live site. Capture real DOM into the `__fixtures__` files; the tests assert extraction *against those fixtures*.
- **CWS:** v1.1.0 adds only two payment domains — a defensible permission bump. Messaging/marketplace surfaces are intentionally out of scope (separate review). The framework already supports them via `ScanAdapter`.
- **Reuse, don't rewrite** the checkpoint modal (`SafetyInterceptModal`), the Gmail banner, the LOG_EVENT emissions, and `risk_engine.ts` scoring — the engines are thin wrappers around existing, working code.
