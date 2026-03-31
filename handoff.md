# Morning Briefing — 2026-03-30

## What Was Done

- **`src/background/risk_engine.ts`** — Full production hardening pass:
  - Added `clampScore()` utility (line ~22) applied to every numeric path
  - Added `scoreToRiskLevel()` helper to deduplicate risk-level logic (used in both heuristic and blend paths)
  - `RiskEngine.analyze()` wrapped in top-level try/catch with `safeDefault()` fallback (line ~128–133)
  - Null/undefined `data` guard at top of `analyze()` before any property access
  - `rawMessage` type guard: only processes `data.message` if it is actually a `string`
  - `amount` guard: only uses `data.amount` if it is a finite `number`
  - `analyzeMemoWithLLM()`: early return on empty/whitespace memo (line ~40–41)
  - `analyzeMemoWithLLM()`: inner `JSON.parse` wrapped in its own try/catch (was previously relying on the outer catch, but the outer catch also cleared the timeout — now both are handled correctly)
  - LLM `flags` array sanitized: filters out non-string elements before returning
  - Blended score now uses `clampScore(blendedValue, heuristicScore)` so NaN result falls back to heuristic (line ~185)
  - `chrome.runtime.lastError` checked in all three `chrome.storage` callbacks
  - `stats` object spread now uses a safe default `{ blocked: 0, warnings: 0, safe: 0 }` if storage returns undefined
  - Message sender validation: `sender.id !== chrome.runtime.id` rejects non-extension senders
  - Entire async `.then()` chain has a `.catch()` that sends the heuristic fallback result

- **`src/content/payment_interceptor.tsx`** — Full security and correctness pass:
  - Removed unused `SafetyInterceptModal` import
  - `riskReport` state changed from `any` to `RiskAnalysis | null` with proper type import
  - Removed invalid `button:contains("Pay")` and `button:contains("Send")` CSS selectors (not valid native CSS; would silently break Venmo/Zelle matching)
  - Added `TEXT_FALLBACK_PATTERNS` map with regex patterns for Venmo (`/^(Pay|Send)$/i`) and Zelle (`/^Send Money$/i`) using `textContent` matching
  - `isButtonMatch()` helper encapsulates selector + text-content matching logic
  - `contenteditable` memo extraction uses `textContent` (not `innerHTML`) — XSS prevention
  - Added `instanceof` guards for `HTMLTextAreaElement`, `HTMLInputElement`, and `HTMLElement` in memo extraction
  - Added `input[name*="note"]` and `input[name*="memo"]` to memo element query for broader coverage
  - `amount` from `parseFloat` now validated with `isFinite()` before use; defaults to `0`
  - `pendingRef` added: prevents concurrent in-flight `ANALYZE_RISK` requests (double-click race condition)
  - `chrome.runtime?.id` guard before `sendMessage` — prevents "Extension context invalidated" crash
  - `sendMessage` callback validates `report` shape before calling `setRiskReport`
  - Shadow DOM changed to `mode: "closed"` — prevents host page from accessing extension DOM via `element.shadowRoot`
  - Double-initialization guard: checks for existing `#shield-host` element before calling `createRoot`
  - Host element ID changed from `"lovable-shield-host"` to `"shield-host"` (consistent naming)
  - `DOMContentLoaded` listener uses `{ once: true }` to auto-remove after firing
  - `useEffect` deps changed to `[]` with `activeRef` ref pattern — config is stable per-page, avoids stale closure issues

## Security Issues Found & Fixed

| Severity | Location | Issue | Fix |
|---|---|---|---|
| HIGH | `payment_interceptor.tsx:28–31` | `button:contains("Pay/Send")` is jQuery syntax, not valid CSS. `element.matches()` throws `SyntaxError`, silently disabling Venmo/Zelle interception | Replaced with `TEXT_FALLBACK_PATTERNS` + `textContent` regex matching |
| HIGH | `payment_interceptor.tsx:101` | `contenteditable` element read via `.value` (always `undefined`); code falls back to `''` but silently drops memo context | Fixed with `instanceof` dispatch: `textContent` for contenteditable, `.value` for form fields |
| HIGH | `risk_engine.ts:173` | No sender validation in `onMessage` listener — any script could spoof `ANALYZE_RISK` messages to the background | Added `sender.id !== chrome.runtime.id` guard |
| MEDIUM | `payment_interceptor.tsx:84` | `riskReport` state typed as `any` — unsafe property access in JSX | Changed to `RiskAnalysis | null` with imported interface |
| MEDIUM | `risk_engine.ts:178` | Empty/whitespace memo sent to LLM API — wastes quota and leaks timing metadata | Added `!memo.trim()` early return in `analyzeMemoWithLLM()` |
| MEDIUM | `payment_interceptor.tsx:111` | No in-flight guard — rapid double-clicks send multiple `ANALYZE_RISK` messages before first resolves | Added `pendingRef` boolean guard |
| MEDIUM | `risk_engine.ts:183` | Blended score had no NaN fallback — if inputs produced NaN, `riskLevel` would be `'low'` incorrectly | `clampScore()` with heuristic fallback |
| MEDIUM | `payment_interceptor.tsx:160` | `init()` could be called twice in SPA contexts with `all_frames: true` | Double-init guard via `getElementById("shield-host")` |
| MEDIUM | `payment_interceptor.tsx:163` | Shadow DOM `mode: "open"` allows host page JS to access `element.shadowRoot` | Changed to `mode: "closed"` |
| LOW | `risk_engine.ts:201,215` | `chrome.storage` callbacks missing `chrome.runtime.lastError` checks | Added `lastError` guards in all three branches |
| LOW | `risk_engine.ts:208` | `data.stats` spread could fail if storage returned `undefined` stats | Added safe default `{ blocked: 0, warnings: 0, safe: 0 }` |
| LOW | `payment_interceptor.tsx:104` | `chrome.runtime.sendMessage` called without guarding against invalidated extension context | Added `chrome.runtime?.id` check before call |
| LOW | `payment_interceptor.tsx:111` | `sendMessage` callback consumed `report` without validating shape | Added `typeof` guards on `riskLevel` and `score` before acting |
| LOW | `risk_engine.ts:101` | `RiskEngine.analyze()` had no try/catch — malformed input could throw | Wrapped in try/catch with `safeDefault()` |

## Current State of the Code

### `src/background/risk_engine.ts`
The background service worker runs in two modes:

1. **Heuristic-only** (when no API key is set, or memo is empty): `RiskEngine.analyze()` performs synchronous regex pattern matching across 6 fraud categories plus a polymorphic (char-substitution) pass. Score is accumulated, clamped 0–100, and mapped to a risk level.

2. **Blended** (when API key is set and memo is non-empty): Heuristic analysis runs first, then `analyzeMemoWithLLM()` fires with a 5-second `AbortController` timeout. On success, scores are blended 60% heuristic / 40% LLM, clamped to 0–100. On failure/timeout, heuristic result is used.

The message listener handles three message types: `ANALYZE_RISK`, `GET_STATS`, `TOGGLE_INTERCEPT`. All are guarded for sender authenticity and storage errors.

### `src/content/payment_interceptor.tsx`
A React component injected into payment portals via a closed Shadow DOM. On every click in capture phase, `isButtonMatch()` checks if the target matches platform-specific CSS selectors or a text-content regex pattern. On match, the event is stopped and a risk analysis is requested from the background. If the response indicates `high` or `critical` risk, a modal is shown. A `pendingRef` prevents concurrent requests.

## Blended Scoring Logic

```
finalScore = clamp(round(heuristicScore * 0.6 + llmScore * 0.4), fallback=heuristicScore)
```

**Rationale for 60/40 split:**
- Heuristics are deterministic, fast, and fully auditable — they should dominate
- LLM adds semantic reasoning about novel phishing language not covered by regex
- If LLM returns 0 (no risk) but heuristics flag high risk, the final score is `heuristicScore * 0.6`, which still yields a `high`/`critical` result for heuristic scores above ~84 and ~134 respectively — the clamp handles overflow
- The 60% heuristic floor ensures the extension degrades gracefully when the LLM is unavailable

**Edge cases handled:**
- LLM returns 0: `score = heuristic * 0.6` (heuristic risk preserved at 60%)
- LLM returns null/undefined: blend is skipped, pure heuristic used
- LLM JSON parse fails: caught, returns null, pure heuristic used
- Memo is empty/whitespace: LLM skipped entirely
- Heuristic produces NaN: `clampScore()` returns 0 (safe default)
- Blended result is NaN: `clampScore(NaN, heuristicScore)` returns `heuristicScore`
- Score > 100: clamped to 100

## Known Limitations / Next Steps

1. **`MutationObserver` callback is empty** — the observer is connected but its callback is a no-op. For true SPA resilience on Venmo, the observer should re-validate that the click listener is still active or re-bind per-button listeners. The document-level capture listener covers this in practice, but a future improvement would debounce DOM changes and re-scan selectors.

2. **Venmo text-content matching is fragile** — Venmo may render buttons with additional whitespace or nested spans that affect `textContent`. The current `/^(Pay|Send)$/i` pattern requires an exact match on trimmed text. This should be tested against the live Venmo DOM.

3. **Zelle portal URL** — The manifest targets `*://*.zellepay.com/*` but Zelle is often embedded inside bank portals (Chase, BofA, etc.) rather than zellepay.com directly. The interceptor will not fire on embedded Zelle iframes from other domains.

4. **LLM prompt injection** — The memo content is inserted directly into the LLM prompt: `"Payment memo: ${memo}"`. A sophisticated attacker could craft a memo that attempts to override the system prompt. The 1000-character limit in the interceptor helps, but prompt injection hardening (e.g., wrapping memo in XML tags, adding explicit injection detection to the system prompt) would be more robust.

5. **API key stored in `chrome.storage.local`** — This is readable by any extension with `storage` permission and by page scripts if `externally_connectable` is misconfigured. Consider migrating to a secure enclave or OAuth-based token flow.

6. **No automated regression tests** for DOM selectors — PayPal/Venmo frequently change `data-testid` attributes. A Playwright test suite that runs against staging snapshots would catch selector breakage before it reaches production.

## Review Instructions

1. **Load the unpacked extension** from the `extension/` folder in `chrome://extensions`. Enable Developer Mode.
2. **Test PayPal:** Navigate to `paypal.com/send`. Enter a memo containing "urgent" or "lottery". Verify the modal appears on submit-button click. Verify safe memos do not trigger.
3. **Test Venmo:** Navigate to `venmo.com`. Try paying someone. Verify the Pay button is intercepted (text-content fallback).
4. **Test empty memo:** Submit a payment with no memo text. Confirm in the background service worker logs (chrome://extensions > background service worker > inspect) that `analyzeMemoWithLLM` is NOT called (no fetch to api.anthropic.com).
5. **Test double-click:** Click the submit button twice rapidly. Confirm only one `ANALYZE_RISK` message is sent (visible in service worker logs).
6. **Test extension reload:** With a PayPal tab open, reload the extension. Click a payment button. Confirm no "Extension context invalidated" error in the page console.
7. **Verify closed Shadow DOM:** In the browser console on a PayPal page, run `document.getElementById('shield-host').shadowRoot`. Confirm it returns `null`.
8. **Verify stats integrity:** After several transactions, open the popup and confirm blocked/warnings/safe counters increment correctly and never show NaN.
