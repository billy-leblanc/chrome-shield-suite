import React from "react";
import { createRoot } from "react-dom/client";
import type { RiskAnalysis } from "@/background/risk_engine";

/**
 * Unified Payment Interceptor: The "Shield" of Chrome Shield Suite.
 * Supports PayPal, Venmo, and Zelle.
 */

// --- Configuration & Selectors ---
// NOTE: CSS :contains() is not a valid native selector. Venmo/Zelle button
// matching uses querySelectorAll with text-content fallback in the handler.
const PORTAL_CONFIGS: Record<string, { selectors: string[], name: string }> = {
  'paypal.com': {
    name: 'PayPal',
    selectors: [
      '[data-testid="submit-button"]',
      '[data-testid="send-money-submit"]',
      'button[name="payment-submit-btn"]',
      '#payment-submit-btn',
      'button.send-money-submit',
      '#sendMoneyButton',
      '.paypal-button'
    ]
  },
  'venmo.com': {
    name: 'Venmo',
    selectors: [
      'button[data-testid="pay-button"]',
      'button[aria-label="Pay"]',
    ]
  },
  'zellepay.com': {
    name: 'Zelle',
    selectors: [
      '#send-money-zelle-button',
      '#sendmoney-button',
      'button[type="submit"]'
    ]
  },
  'hsbc.co.uk': {
    name: 'HSBC',
    selectors: [
      'button[aria-label="Confirm payment"]',
      '.hsbcButtonContinue',
      'button#submit',
      '#submit'
    ]
  },
  'barclays.co.uk': {
    name: 'Barclays',
    selectors: [
      '[data-automation="confirm-payment-button"]',
      '#payment-submit',
      '.btn-primary.confirm'
    ]
  },
  'revolut.com': {
    name: 'Revolut',
    selectors: [
      '[data-testid="transfer-button"]',
      '[data-testid="confirm-button"]',
      '[data-testid="send-money"]'
    ]
  },
  'wellsfargo.com': {
    name: 'Wells Fargo (Zelle)',
    selectors: [
      '[data-testid="submitButton"][data-tracking-ref="WFFormSubmitButton-button-"]',
    ] // Only matches the submit button on payment screens, not nav buttons
  }
};

// Text-content fallback patterns for platforms that render buttons dynamically.
// textContent is normalized (trimmed + collapsed whitespace) before matching.
const TEXT_FALLBACK_PATTERNS: Record<string, RegExp> = {
  'venmo.com': /^(Pay|Pay Now|Send|Send Money)$/i,
  'zellepay.com': /^Send Money$/i,
};

// Module-level debounce timer for MutationObserver re-scan.
let mutationRescanTimer: ReturnType<typeof setTimeout> | null = null;

const getActiveConfig = () => {
  const host = window.location.hostname;
  for (const domain in PORTAL_CONFIGS) {
    if (host.includes(domain)) return { config: PORTAL_CONFIGS[domain], domain };
  }
  return null;
};

// --- Styles Injection ---
const injectStyles = (shadowRoot: ShadowRoot) => {
  const style = document.createElement("style");
  style.textContent = `
    :host {
      --background: 222 47% 7%;
      --foreground: 210 40% 96%;
      --card: 222 40% 10%;
      --card-foreground: 210 40% 96%;
      --primary: 187 92% 69%;
      --secondary: 222 30% 16%;
      --destructive: 0 86% 71%;
      --destructive-foreground: 222 47% 7%;
      --border: 217 30% 15%;
    }
    .fixed { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); }
    .bg-card { background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: 1.5rem; padding: 2rem; width: 90%; max-width: 400px; box-shadow: 0 0 40px rgba(187, 92, 69, 0.2); }
    .text-center { text-align: center; }
    .font-bold { font-weight: 800; color: #F1F5F9; }
    .text-sm { font-size: 0.875rem; line-height: 1.6; color: #94A3B8; margin: 1.5rem 0; }
    .flex { display: flex; gap: 1rem; }
    .btn { flex: 1; padding: 0.75rem; border-radius: 1rem; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; }
    .btn-secondary { background: #1E293B; color: #94A3B8; }
    .btn-destructive { background: #F87171; color: #0B1120; }
    .btn:hover { opacity: 0.9; transform: scale(1.02); }
  `;
  shadowRoot.appendChild(style);
};

// --- Component ---
const Interceptor = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [riskReport, setRiskReport] = React.useState<RiskAnalysis | null>(null);
  const activeRef = React.useRef(getActiveConfig());
  // Guard: prevent overlapping in-flight risk analysis requests.
  const pendingRef = React.useRef(false);
  // Store the intercepted button so we can re-fire the click on "Proceed Anyway".
  const interceptedButtonRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const active = activeRef.current;
    if (!active) return;
    const { config, domain } = active;

    const isButtonMatch = (target: HTMLElement): boolean => {
      const btn = target.tagName === 'BUTTON' ? target : target.closest('button');
      const normalizedText = (btn?.textContent ?? '').trim().replace(/\s+/g, ' ');

      // 1. Try CSS selectors. For wellsfargo, also require button text to be "Send"
      //    to distinguish the final confirmation button from intermediate "Next" buttons.
      if (config.selectors.some(sel => target.matches(sel) || target.closest(sel))) {
        if (domain === 'wellsfargo.com') {
          return /^Send$/i.test(normalizedText);
        }
        return true;
      }
      // 2. Text-content fallback for platforms using dynamic button text.
      const textPattern = TEXT_FALLBACK_PATTERNS[domain];
      if (textPattern) {
        if (btn && textPattern.test(normalizedText)) {
          return true;
        }
      }
      return false;
    };

    const handleIntercept = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!isButtonMatch(target)) return;

      e.preventDefault();
      e.stopImmediatePropagation(); // Prevent competing scripts from observing the event.

      // Deduplicate: skip if a risk analysis is already in flight.
      if (pendingRef.current) return;
      pendingRef.current = true;

      // Store the button so we can re-fire it if user chooses "Proceed Anyway".
      interceptedButtonRef.current = target instanceof HTMLElement ? target.closest('button') ?? target : target;

      // Context Extraction — read from host document (intentional: we need the page's data).
      // Use textContent for contenteditable; fall back to .value for textarea/input.
      const memoEl = document.querySelector('textarea, [contenteditable="true"], input[name*="note"], input[name*="memo"]');
      let message = '';
      if (memoEl instanceof HTMLTextAreaElement || memoEl instanceof HTMLInputElement) {
        message = memoEl.value ?? '';
      } else if (memoEl instanceof HTMLElement) {
        // contenteditable: use textContent, NOT innerHTML (XSS prevention).
        message = memoEl.textContent ?? '';
      }

      const amountEl = document.querySelector('input[type="number"], .amount-input, input[name*="amount"]');
      const rawAmount = amountEl instanceof HTMLInputElement ? amountEl.value : '';
      const amount = parseFloat(rawAmount);
      const safeAmount = isFinite(amount) ? amount : 0;

      // Guard: do not send if extension context is invalidated.
      if (!chrome.runtime?.id) {
        pendingRef.current = false;
        return;
      }

      chrome.runtime.sendMessage(
        {
          type: 'ANALYZE_RISK',
          data: {
            message: message.substring(0, 1000), // Limit payload size.
            amount: safeAmount,
            platform: config.name
          }
        },
        (report: RiskAnalysis | undefined) => {
          pendingRef.current = false;
          // Validate response shape before acting on it.
          if (
            report &&
            typeof report === 'object' &&
            typeof report.riskLevel === 'string' &&
            typeof report.score === 'number'
          ) {
            if (report.riskLevel === 'high' || report.riskLevel === 'critical') {
              setRiskReport(report);
              setShowModal(true);
            }
          }
        }
      );
    };

    // Use Capturing Phase for immediate interception before site scripts.
    document.addEventListener("click", handleIntercept, { capture: true });

    // MutationObserver: re-scan for payment buttons when the SPA re-renders the DOM.
    // The document-level click listener in handleIntercept covers all clicks, but after a
    // route change the buttons may have entirely new DOM nodes. The observer debounces a
    // re-scan so isButtonMatch stays aligned with the live DOM without thrashing.
    const rescanButtons = () => {
      // Walk every button in the document and verify at least one matches our selectors.
      // This is intentionally a read-only scan — the capturing click listener on `document`
      // already handles the actual interception; we do not re-attach per-element listeners.
      const buttons = document.querySelectorAll('button, [role="button"]');
      let found = false;
      buttons.forEach((el) => {
        if (!found && isButtonMatch(el as HTMLElement)) {
          found = true;
        }
      });
      // Log only in development builds to avoid noise in production.
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Shield] MutationObserver re-scan: payment button ${found ? 'present' : 'not found'}`);
      }
    };

    const observer = new MutationObserver((_mutations) => {
      // Debounce: cancel any pending re-scan and schedule a new one 200 ms out.
      if (mutationRescanTimer !== null) {
        clearTimeout(mutationRescanTimer);
      }
      mutationRescanTimer = setTimeout(() => {
        mutationRescanTimer = null;
        rescanButtons();
      }, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", handleIntercept, true);
      observer.disconnect();
    };
  }, []); // Empty deps: config is stable for the lifetime of this page.

  if (!showModal || !riskReport) return null;

  const config = activeRef.current?.config;

  return (
    <div className="fixed">
      <div className="bg-card text-center">
        <h2 className="font-bold">
          {riskReport.riskLevel === 'critical'
            ? "CRITICAL THREAT DETECTED"
            : `Security Alert: ${config?.name ?? 'Payment'}`}
        </h2>
        <p className="text-sm">
          {riskReport.recommendation || "We've detected potential fraud patterns in this transaction."}
        </p>
        <div className="flex">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Cancel Payment
          </button>
          <button
            className="btn btn-destructive"
            onClick={() => {
              setShowModal(false);
              // Re-fire the original button click without our listener active.
              const btn = interceptedButtonRef.current;
              interceptedButtonRef.current = null;
              if (btn) {
                document.removeEventListener("click", handleIntercept, true);
                btn.click();
                document.addEventListener("click", handleIntercept, { capture: true });
              }
            }}
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Initialization ---
const init = () => {
  if (!getActiveConfig()) return;

  // Prevent double-initialization (e.g., if script is injected multiple times).
  if (document.getElementById("shield-host")) return;

  const host = document.createElement("div");
  host.id = "shield-host";
  document.body.appendChild(host);
  const shadowRoot = host.attachShadow({ mode: "closed" });
  injectStyles(shadowRoot);

  const container = document.createElement("div");
  shadowRoot.appendChild(container);

  createRoot(container).render(<Interceptor />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
