# Research: Embedded Zelle — Wells Fargo

Zelle is embedded directly inside Wells Fargo's online banking portal. The
extension must cover `*.wellsfargo.com` in addition to `zellepay.com` to
intercept these flows.

## Wells Fargo

* **Target portal:** `https://connect.secure.wellsfargo.com/`
* **Manifest match:** `*://*.wellsfargo.com/*`
* **Zelle entry point:** Transfer & Pay → Send Money with Zelle
  (`id=TRANSFER_PAY_7P` in the top nav)

### Selector findings — Review / Confirm screen

Selectors were extracted live from the **Review** step of the Zelle Send Money
workflow (`SendMoneyWorkflowFusion` chunk) using DevTools on 2026-03-31.

| Priority | Selector | Source | Stability |
|----------|----------|--------|-----------|
| 1 | `#submitButtonRef` | `id` attribute on `<button type="submit">` | High — hardcoded ref name |
| 2 | `[data-testid="submitButton"]` | `data-testid` attribute | High — used by WF's own test suite |
| 3 | `[data-tracking-ref="WFFormSubmitButton-button-"]` | analytics tracking attr | Medium — could change if analytics config changes |

Raw DevTools output for the primary button:
```
id=submitButtonRef type=submit
class=Button__button___Jo8E3 Button__modern___cqCp7 Button__responsive___Xx9EJ Button__primary___tsDHA
data-tracking-ref=WFFormSubmitButton-button-
data-testid=submitButton
```

> **Note:** CSS module class names (e.g. `Button__primary___tsDHA`) are hashed
> at build time and will change on every WF deployment. Do **not** use them as
> selectors.

### Supporting context

* The page also renders a secondary/cancel button with `id=AXCIXKHN`
  (no `data-testid`) — this is the "Back" / "Cancel" action; excluded.
* `VerifyDetails__editlink` class is the "Edit" link on the review summary;
  excluded.
* The authenticated flow runs under `connect.secure.wellsfargo.com` but the
  content script match `*://*.wellsfargo.com/*` covers all subdomains.

### Implementation

Added to `PORTAL_CONFIGS` in `src/content/payment_interceptor.tsx`:
```typescript
'wellsfargo.com': {
  name: 'Wells Fargo (Zelle)',
  selectors: [
    '#submitButtonRef',
    '[data-testid="submitButton"]',
    '[data-tracking-ref="WFFormSubmitButton-button-"]',
  ]
},
```

No text-content fallback required — the stable `id` and `data-testid`
attributes are sufficient.
