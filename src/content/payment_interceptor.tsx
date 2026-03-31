import React from "react";
import { createRoot } from "react-dom/client";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

/**
 * Unified Payment Interceptor: The "Shield" of Chrome Shield Suite.
 * Supports PayPal, Venmo, and Zelle.
 */

// --- Configuration & Selectors ---
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
      'button:contains("Pay")',
      'button:contains("Send")'
    ]
  },
  'zellepay.com': {
    name: 'Zelle',
    selectors: [
      '#send-money-zelle-button',
      '#sendmoney-button',
      'button:contains("Send Money")',
      'button[type="submit"]'
    ]
  }
};

const getActiveConfig = () => {
  const host = window.location.hostname;
  for (const domain in PORTAL_CONFIGS) {
    if (host.includes(domain)) return PORTAL_CONFIGS[domain];
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
  const [riskReport, setRiskReport] = React.useState<any>(null);
  const config = getActiveConfig();

  React.useEffect(() => {
    if (!config) return;

    const handleIntercept = async (e: Event) => {
      const target = e.target as HTMLElement;
      const isMatch = config.selectors.some(selector => 
        target.matches(selector) || target.closest(selector)
      );

      if (isMatch) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Security Audit: Ensure other scripts don't get the event

        // Context Extraction (Security Hardened)
        const message = (document.querySelector('textarea, [contenteditable="true"]') as HTMLTextAreaElement)?.value || '';
        const amount = parseFloat((document.querySelector('input[type="number"], .amount-input') as HTMLInputElement)?.value || '0');

        chrome.runtime.sendMessage({ 
          type: 'ANALYZE_RISK', 
          data: { 
            message: message.substring(0, 1000), // Limit size
            amount,
            platform: config.name 
          } 
        }, (report) => {
          if (report && (report.riskLevel === 'high' || report.riskLevel === 'critical')) {
            setRiskReport(report);
            setShowModal(true);
          } else {
            console.log(`[Shield] Safe transaction on ${config.name}`);
          }
        });
      }
    };

    // Use Capturing Phase for immediate interception
    document.addEventListener("click", handleIntercept, true);
    
    // MutationObserver for dynamic buttons (SPAs like Venmo)
    const observer = new MutationObserver(() => {
      // Re-scan or ensure listeners are active if buttons are re-rendered
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", handleIntercept, true);
      observer.disconnect();
    };
  }, [config]);

  if (!showModal) return null;

  return (
    <div className="fixed">
      <div className="bg-card text-center">
        <h2 className="font-bold">{riskReport?.riskLevel === 'critical' ? "CRITICAL THREAT DETECTED" : `Security Alert: ${config?.name}`}</h2>
        <p className="text-sm">{riskReport?.recommendation || "We've detected potential fraud patterns in this transaction."}</p>
        <div className="flex">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel Payment</button>
          <button className="btn btn-destructive" onClick={() => {
            setShowModal(false);
            console.warn("[Shield] User ignored high-risk warning.");
          }}>Proceed Anyway</button>
        </div>
      </div>
    </div>
  );
};

// --- Initialization ---
const init = () => {
  if (!getActiveConfig()) return;
  
  const host = document.createElement("div");
  host.id = "lovable-shield-host";
  document.body.appendChild(host);
  const shadowRoot = host.attachShadow({ mode: "open" });
  injectStyles(shadowRoot);
  
  const container = document.createElement("div");
  shadowRoot.appendChild(container);
  
  createRoot(container).render(<Interceptor />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
