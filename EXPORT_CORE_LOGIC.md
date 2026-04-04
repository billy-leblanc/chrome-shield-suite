# Safety Intercept | Core Logic Export (Technical Blueprint)

This document contains a consolidated technical breakdown of the core fraud detection and payment interception logic developed for the Safety Intercept Chrome Extension.

---

## 1. Aggressive Portal Interception (The Wells Fargo "Cold Boot" Fix)
**Problem:** Banking Single-Page Applications (SPAs) like Wells Fargo dynamically inject payment buttons after the initial page load, often using localized or obfuscated attributes.

**Solution:**
- **Wildcard Attribute Matching:** Instead of static selectors, we use `[data-localized*="send-money"]` and `[data-localized*="transfer"]` to match buttons regardless of language or sub-portal.
- **Interactive Scrutiny:** The listener monitors non-semantic interactive elements like `[role="button"]`, `a.btn`, and `input[type="submit"]` to catch non-standard banking UI.
- **Case-Insensitive Domain-Discovery:** Normalizes `window.location.hostname` to ensure matching on subdomains like `connect.secure.wellsfargo.com`.

```typescript
// --- Core Selection Logic ---
const isButtonMatch = (target: HTMLElement): boolean => {
  const btn = target.tagName === 'BUTTON' ? target : target.closest('button, [role="button"], a.btn, input[type="submit"]');
  const normalizedText = (btn?.textContent ?? '').trim().replace(/\s+/g, ' ');

  // Domain-specific aggressive matching
  if (domain === 'wellsfargo.com') {
    const isLocalized = target.matches('[data-localized*="send-money"]') || target.closest('[data-localized*="send-money"]');
    return isLocalized || /Send|Submit|Continue/i.test(normalizedText);
  }
  return false;
};
```

---

## 2. PayPal Iframe Interception (The "Same-Origin Sniffer")
**Problem:** PayPal renders its final confirmation button ("Send Now") inside sandboxed or cross-origin iframes, which standard content scripts cannot see.

**Solution:**
- **Recursive Mutation-Observer:** On script entry, an observer watches for `IFRAME` nodes being added.
- **Same-Origin Injection:** If the iframe is on a matching domain (e.g., `paypal.com`), the script programmatically attaches its click listeners directly to the `iframe.contentDocument`.
- **Manifest-Level Injection:** Uses `"all_frames": true` and `"match_about_blank": true` with `*://*.paypalobjects.com/*` permissions to handle frames that load assets from secondary CDNs.

```typescript
// --- Frame-Sniffing MutationObserver ---
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement && node.tagName === 'IFRAME') {
        try {
          const iframe = node as HTMLIFrameElement;
          iframe.addEventListener('load', () => {
            if (iframe.contentDocument) {
              iframe.contentDocument.addEventListener('click', handleIntercept, { capture: true });
            }
          });
        } catch (e) {
          // Cross-origin boundaries — handled by manifest "all_frames" injection
        }
      }
    });
  });
});
```

---

## 3. High-Fidelity Risk Engine (Heuristic + LLM Blending)
**Strategy:** Combine immediate locally-executed regex heuristics with asynchronous LLM analysis for deep fraud signal detection.

- **Heuristic Layer:** Instant check for urgency keywords ("ASAP", "Immediate", "Hurry"), social engineering triggers ("Account Locked", "Support Request"), and large amount thresholds.
- **Relay Relay:** A Cloudflare-hosted relay that proxies requests to Claude/GPT-4 to ensure API keys are never exposed in the extension's code.

```typescript
// --- Blended Score Calculation ---
function blendScores(heuristicScore: number, llmScore: number): number {
  // We prioritize LLM signals for behavioral flags, but heuristics for financial limits.
  // 0-100 scale: >70 is High Risk.
  return Math.max(heuristicScore, llmScore);
}
```

---

## 4. Cloudflare Fraud Relay (relay-worker.js)
**Logic:** A serverless worker that coordinates LLM calls, auth verification, and event logging without exposing the extension’s internal state or user credentials.

```javascript
/* --- Cloudflare Worker Logic --- */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Verify auth token
  const token = request.headers.get('Authorization');
  if (token !== AUTH_TOKEN) return new Response('Unauthorized', { status: 401 });

  const { memo, amount, platform } = await request.json();
  
  // Call Anthropic/OpenAI for semantic analysis
  const llmResult = await analyzeWithAI(memo, amount, platform);

  return new Response(JSON.stringify(llmResult), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 5. Metadata & Bank Selectors (Portal Configs)
Standardized mapping for major banking platforms currently supported:

| Platform | Core Detectors |
| :--- | :--- |
| **Wells Fargo** | `button:has([data-localized*="send-money"])`, `[data-localized*="send-money"]` |
| **PayPal** | `button[data-testid="submit-button"]`, `button:has([data-label*="Send Now"])` |
| **Chase** | `button.confirm-button`, `button[data-pt-id*="confirm"]` |
| **Zelle** | `button.pay-cta`, `button#verify-and-send` (within portal) |

---

## 6. UX Design Principles (popup.tsx)
- **Glassmorphism:** Uses `backdrop-filter: blur()` and layered dark modes to give a premium, futuristic cybersecurity feel.
- **Micro-Animations:** Pulsing badge indicators and slide-in transitions for high-risk warnings ensure the user actually reads the content before proceeding.
- **Friction-as-a-Feature:** Intentional separation of "Cancel" (Primary) vs. "Proceed anyway" (Secondary) buttons to minimize accidental scam completions.

---

*Compiled by Antigravity (Advanced Agentic Assistant)*
