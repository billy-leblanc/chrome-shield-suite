import React from 'react';
import { createRoot } from 'react-dom/client';
import type { RiskAnalysis } from '../core/fraud_detector';

// --- Types & Config ---
interface PaymentPortalConfig {
  name: string;
  selectors: string[];
}

const PORTAL_CONFIGS: Record<string, PaymentPortalConfig> = {
  'paypal.com': {
    name: 'PayPal',
    selectors: [
      'button[data-testid="submit-button-confirm"]',
      'button[data-testid="submit-button"]',
      'button#payment-submit-btn',
      '#confirmButtonTop',
      'button.checkout-button',
    ]
  },
  'venmo.com': {
    // Buttons are MUI with no stable id/testid — matched by TEXT_FALLBACK below
    // so "Pay"/"Confirm" intercept but "Request" (asking for money) does not.
    name: 'Venmo',
    selectors: []
  },
  'cash.app': {
    // Send button has only Emotion classes — matched by text "Pay $N".
    name: 'Cash App',
    selectors: []
  },
  'wellsfargo.com': {
    name: 'Wells Fargo',
    selectors: [
      'button.Button__primary___tsDHA',
      'button:has([data-localized="hub.button.send-money"])',
    ]
  },
  'chase.com': {
    name: 'Chase',
    selectors: ['button.confirm-button', 'button#intercept-me'] 
  },
  'bankofamerica.com': {
    name: 'Bank of America',
    selectors: ['button[name="send-payment"]', 'button#confirm-pay']
  },
  'citi.com': {
    name: 'Citi',
    selectors: ['button.pay-cta', 'button#verify-and-send']
  }
};

const TEXT_FALLBACK_PATTERNS: Record<string, RegExp> = {
  'paypal.com': /Send Now|Complete|Pay Now|Send Money Now|Complete Purchase/i,
  'venmo.com': /^(Pay|Confirm|Pay without confirming)$/i,
  'cash.app': /^Pay\s*\$[\d,.]+$/i,
  'wellsfargo.com': /^Send$/i,
  'chase.com': /Send Money/i,
  'bankofamerica.com': /Make Payment/i,
  'citi.com': /Confirm Payment/i
};

const getActiveConfig = () => {
  const host = window.location.hostname;
  const domain = Object.keys(PORTAL_CONFIGS).find(d => host.endsWith(d));
  return domain ? { config: PORTAL_CONFIGS[domain], domain } : null;
};

// --- Styles ---
const injectStyles = (shadow: ShadowRoot) => {
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .overlay {
      position: fixed; inset: 0; z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: linear-gradient(160deg, #131B2E 0%, #0D1526 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 28px 24px 24px;
      width: 360px;
      box-shadow: 0 32px 64px rgba(0,0,0,0.6);
      animation: cardIn 0.32s cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 99px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      margin-bottom: 16px;
    }
    .badge-critical { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #F0A93B; }
    .badge-high { background: rgba(232,85,43,0.1); border: 1px solid rgba(232,85,43,0.3); color: #E8552B; }
    .badge-info { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94A3B8; }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .title {
      font-size: 17px; font-weight: 700; color: #F1F5F9;
      letter-spacing: -0.4px; line-height: 1.3; margin-bottom: 12px;
    }
    .desc {
      font-size: 13px; color: #64748B; line-height: 1.7; margin-bottom: 24px;
    }
    .divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 24px; }
    .actions { display: flex; gap: 8px; }
    .btn {
      flex: 1; padding: 13px; border-radius: 12px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: none; transition: all 0.2s ease; letter-spacing: 0.01em;
    }
    .btn:hover { opacity: 0.8; }
    .btn:active, .btn-continue:active {
      transform: scale(0.97);
      transition: transform 0.08s ease;
    }
    .btn-cancel {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08) !important;
      color: #94A3B8;
    }
    .btn-proceed {
      position: relative; overflow: hidden;
      background: rgba(245,158,11,0.05);
      border: 1px solid rgba(245,158,11,0.2) !important;
      color: #F0A93B;
    }
    .btn-fill {
      position: absolute; inset: 0; right: 100%;
      background: rgba(245,158,11,0.15);
      transition: right 1s linear;
    }
    .btn-proceed:disabled {
      opacity: 0.8; cursor: not-allowed;
    }
    .btn-legitimate {
      width: 100%; margin-top: 14px; padding: 10px;
      background: none; border: none; cursor: pointer;
      font-size: 11px; color: #334155; text-decoration: underline;
      text-underline-offset: 3px; font-family: inherit; font-weight: 500;
    }
    .btn-legitimate:hover { color: #475569; }
    
    /* Jobsian UI Polish: Rebrand red survey markers to Blue */
    .q-item input[type="checkbox"] {
      accent-color: #E8552B;
    }
    .badge-critical { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #F0A93B; }

    .q-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 14px; border-radius: 10px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 8px; cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .q-item:hover { background: rgba(255,255,255,0.04); }
    .q-item.checked {
      background: rgba(245,158,11,0.05);
      border-color: rgba(245,158,11,0.25);
    }
    .q-checkbox {
      width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 1px;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.04);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .q-item.checked .q-checkbox {
      background: #F0A93B; border-color: #F0A93B;
      animation: check-bounce 0.28s cubic-bezier(0.34,1.56,0.64,1);
    }
    .q-check-icon { display: none; }
    .q-item.checked .q-check-icon { display: block; }
    .q-text { font-size: 13px; color: #94A3B8; line-height: 1.5; }
    .q-item.checked .q-text { color: #F1F5F9; }
    .q-context {
      font-size: 11px; color: #F0A93B; line-height: 1.5;
      margin-top: 4px; padding-left: 0;
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transition: opacity 0.2s ease 0.1s, max-height 0.2s ease 0.05s;
    }
    .q-item.checked .q-context {
      opacity: 1;
      max-height: 60px;
    }
    .correlation-callout {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.25);
      border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;
      animation: callout-pulse 1.4s ease-out 0.35s 1;
    }
    .correlation-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .correlation-text { font-size: 12px; color: #F0A93B; line-height: 1.5; }
    .btn-continue {
      width: 100%; padding: 12px; border-radius: 10px; margin-top: 16px;
      background: linear-gradient(135deg, #1a3a60 0%, #0f2040 100%);
      border: 1px solid rgba(232,85,43,0.3) !important;
      color: #E8552B; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: opacity 0.15s ease; letter-spacing: 0.02em;
    }
    .btn-continue:hover { opacity: 0.85; }
    .btn-skip {
      width: 100%; margin-top: 8px; padding: 8px;
      background: none; border: none; cursor: pointer;
      font-size: 11px; color: #334155; font-family: inherit;
    }
    .btn-skip:hover { color: #64748B; }
    .share-screen {
      text-align: center; padding: 8px 0 4px;
    }
    .share-saved {
      font-size: 28px; font-weight: 800; color: #34D399;
      letter-spacing: -1px; margin-bottom: 6px; line-height: 1.1;
    }
    .share-sub {
      font-size: 13px; color: #64748B; line-height: 1.6; margin-bottom: 24px;
    }
    .share-label {
      font-size: 10px; font-weight: 700; color: #334155;
      text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;
    }
    .share-btns { display: flex; gap: 8px; margin-bottom: 16px; }
    .share-btn {
      flex: 1; padding: 10px 8px; border-radius: 10px; border: none;
      font-size: 12px; font-weight: 700; cursor: pointer;
      transition: opacity 0.15s; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .share-btn:hover { opacity: 0.85; }
    .share-btn-wa { background: rgba(37,211,102,0.12); border: 1px solid rgba(37,211,102,0.3) !important; color: #25D366; }
    .share-btn-sms { background: rgba(232,85,43,0.1); border: 1px solid rgba(56,189,248,0.25) !important; color: #E8552B; }
    .share-btn-copy { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1) !important; color: #94A3B8; }
    .share-dismiss {
      width: 100%; background: none; border: none; cursor: pointer;
      font-size: 11px; color: #334155; font-family: inherit; padding: 6px;
    }
    .share-dismiss:hover { color: #64748B; }
    @keyframes cardIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes check-bounce { 0% { transform: scale(1); } 35% { transform: scale(0.8); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
    @keyframes callout-pulse { 0% { box-shadow: 0 0 0 0 rgba(251,191,36,0.35); } 60% { box-shadow: 0 0 0 7px rgba(251,191,36,0); } 100% { box-shadow: none; } }
  `;
  shadow.appendChild(style);
};

// --- Component ---
const Interceptor = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [riskReport, setRiskReport] = React.useState<RiskAnalysis | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = React.useState(false);
  const [checks, setChecks] = React.useState({ contacted: false, firstTime: false, secretUrgent: false });
  const [cooldown, setCooldown] = React.useState(0);
  const [showShareScreen, setShowShareScreen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const SHARE_URL = 'https://chromewebstore.google.com/detail/safety-intercept/bpafnjhfjimdoamnjepkfljpegpmmeom';

  const getShareText = (amount: number, platform: string) => {
    const amountStr = amount > 0 ? `$${amount.toLocaleString()}` : 'a payment';
    return `Safety Intercept just blocked ${amountStr} in potential fraud on ${platform}. Free Chrome extension that stops scams before you send:`;
  };

  const activeRef = React.useRef(getActiveConfig());
  const pendingRef = React.useRef(false);
  const interceptedButtonRef = React.useRef<HTMLElement | null>(null);
  const handleInterceptRef = React.useRef<((e: Event) => void) | null>(null);
  const pendingDataRef = React.useRef<{ message: string; amount: number } | null>(null);
  const runAIAnalysisRef = React.useRef<((message: string, amount: number, socialFlags: string[]) => void) | null>(null);

  React.useEffect(() => {
    const active = activeRef.current;
    if (!active) return;
    const { config, domain } = active;

    const isButtonMatch = (target: HTMLElement): boolean => {
      const btn = target.tagName === 'BUTTON' ? target : target.closest('button');
      const normalizedText = (btn?.textContent ?? '').trim().replace(/\s+/g, ' ');

      if (config.selectors.some(sel => { try { return target.matches(sel) || !!target.closest(sel); } catch { return false; } })) {
        // Wells Fargo Zelle is a multi-step SPA:
        //   landing → ENTER_DETAILS (amount/memo/send) → VERIFY_DETAILS (final send)
        // Only intercept on ENTER_DETAILS (questionnaire) and VERIFY_DETAILS (final block)
        if (domain === 'wellsfargo.com') {
          const hash = window.location.hash;
          const isSendPage = /SENDMONEY_ENTER_DETAILS|SENDMONEY_VERIFY_DETAILS/.test(hash);
          return /^Send$/i.test(normalizedText) && isSendPage;
        }
        return true;
      }
      const textPattern = TEXT_FALLBACK_PATTERNS[domain];
      if (textPattern && btn && textPattern.test(normalizedText)) {
        if (domain === 'wellsfargo.com') {
          const hash = window.location.hash;
          return /SENDMONEY_ENTER_DETAILS|SENDMONEY_VERIFY_DETAILS/.test(hash);
        }
        return true;
      }
      return false;
    };

    const handleIntercept = (e: Event) => {
      handleInterceptRef.current = handleIntercept;
      const target = e.target as HTMLElement;
      if (!isButtonMatch(target)) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (pendingRef.current) return;
      pendingRef.current = true;

      const resolvedBtn = target instanceof HTMLElement ? (target.closest('button') ?? target) : target;
      interceptedButtonRef.current = resolvedBtn instanceof HTMLButtonElement ? resolvedBtn : (resolvedBtn.closest('button') as HTMLButtonElement | null) ?? null;

      // Verified per-platform memo fields (Venmo/Cash App) take priority over the
      // generic fallback so we read the right field, not the first textarea.
      const memoSelector = domain === 'venmo.com'
        ? '#payment-note, [data-testid="payment-note-input"]'
        : domain === 'cash.app'
          ? '#note, input[name="note"]'
          : 'textarea#memo, textarea[name="memo"], textarea, [contenteditable="true"], input[name*="note"], input[name*="memo"]';
      const memoEl = document.querySelector(memoSelector);
      let message = '';
      if (memoEl instanceof HTMLTextAreaElement || memoEl instanceof HTMLInputElement) {
        message = memoEl.value ?? '';
      } else if (memoEl instanceof HTMLElement) {
        message = memoEl.textContent ?? '';
      }
      // Wells Fargo VERIFY_DETAILS page: memo is a static .pmask span, textarea is gone
      if (!message && domain === 'wellsfargo.com') {
        const pmaskEls = document.querySelectorAll('span.pmask');
        // The memo is typically the last .pmask span (after recipient name, amount, etc.)
        for (const el of Array.from(pmaskEls)) {
          const text = (el.textContent ?? '').trim();
          // Skip amounts, phone numbers, dates — keep text that looks like a memo
          if (text && !/^\$|^\(?\d{3}\)?[\s-]?\d{3}|^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) {
            message = text;
          }
        }
      }

      const amountEl = document.querySelector('input[type="number"], .amount-input, input[name*="amount"], input[aria-label="Amount"]');
      let rawAmount = amountEl instanceof HTMLInputElement ? amountEl.value : '';
      if (!rawAmount) {
        // On confirmation pages the amount is displayed as text — scan the DOM for a dollar value
        const match = document.body.innerText.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
        if (match) rawAmount = match[1].replace(/,/g, '');
      }
      // Strip currency symbols/commas (Cash App's value is like "$100").
      const amount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
      const safeAmount = isFinite(amount) ? amount : 0;

      // Always show questionnaire first — it's the trance-breaker
      pendingDataRef.current = { message: message.substring(0, 1000), amount: safeAmount };
      setChecks({ contacted: false, firstTime: false, secretUrgent: false });
      setShowQuestionnaire(true);
    };

    const runAIAnalysis = (message: string, amount: number, socialFlags: string[]) => {
      const active = activeRef.current;
      if (!active || !chrome.runtime?.id) {
        pendingRef.current = false;
        return;
      }
      const { config } = active;

      chrome.runtime.sendMessage(
        { type: 'ANALYZE_RISK', data: { message, amount, platform: config.name } },
        (report: RiskAnalysis | undefined) => {
          pendingRef.current = false;
          if (report && typeof report === 'object' && typeof report.riskLevel === 'string') {
            // Merge any social engineering flags from the questionnaire
            const mergedReport: RiskAnalysis = socialFlags.length > 0 ? {
              ...report,
              flags: Array.from(new Set([...socialFlags, ...report.flags])),
              riskLevel: 'critical',
              score: Math.max(report.score, 85),
            } : report;

            if (mergedReport.riskLevel === 'high' || mergedReport.riskLevel === 'critical') {
              setRiskReport(mergedReport);
              setShowModal(true);
              chrome.runtime.sendMessage({
                type: 'LOG_EVENT', event: 'intercepted',
                platform: config.name,
                score: mergedReport.score, riskLevel: mergedReport.riskLevel, flags: mergedReport.flags,
                amount: pendingDataRef.current?.amount ?? 0,
              });
            } else {
              const btn = interceptedButtonRef.current;
              interceptedButtonRef.current = null;
              if (btn && handleInterceptRef.current) {
                document.removeEventListener("click", handleInterceptRef.current, true);
                btn.click();
                document.addEventListener("click", handleInterceptRef.current, { capture: true });
              }
            }
          } else {
            const btn = interceptedButtonRef.current;
            interceptedButtonRef.current = null;
            if (btn && handleInterceptRef.current) {
              document.removeEventListener("click", handleInterceptRef.current, true);
              btn.click();
              document.addEventListener("click", handleInterceptRef.current, { capture: true });
            }
          }
        }
      );
    };

    runAIAnalysisRef.current = runAIAnalysis;

    document.addEventListener("click", handleIntercept, { capture: true });

    // For same-origin iframes (PayPal confirmation modal), attach listener inside the iframe too
    const attachToIframe = (iframe: HTMLIFrameElement) => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.addEventListener("click", handleIntercept, { capture: true });
      } catch (_) { /* cross-origin — skip */ }
    };

    // Attach to any iframes already on the page
    document.querySelectorAll('iframe').forEach(f => attachToIframe(f as HTMLIFrameElement));

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLIFrameElement) {
            // Wait for iframe to load then attach
            node.addEventListener('load', () => attachToIframe(node), { once: true });
            attachToIframe(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // --- PayPal proactive interception ---
    // PayPal renders the send/confirm button inside a cross-origin sandboxed
    // iframe that content scripts cannot access. We work around this by:
    //   1. Pre-analyzing the memo field on the OUTER page as the user types
    //   2. Detecting SPA navigation to the confirmation/review step
    //   3. Showing our overlay proactively — it covers the entire viewport
    //      including the iframe, physically blocking the send button
    let paypalNavPoll: ReturnType<typeof setInterval> | null = null;
    let paypalMemoTimer: ReturnType<typeof setTimeout> | null = null;

    if (domain === 'paypal.com') {
      let cachedMemo = '';
      let cachedAmount = 0;
      let cachedRisk: RiskAnalysis | null = null;
      let lastUrl = window.location.href;

      const readPayPalMemo = (): string => {
        const el = document.querySelector('#noteField, textarea[name="note"], [data-testid="note-input"]');
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return el.value;
        if (el instanceof HTMLElement) return el.textContent ?? '';
        return cachedMemo; // field may have unmounted during SPA nav
      };

      const readPayPalAmount = (): number => {
        // Try input fields first
        const el = document.querySelector('input[type="number"], .amount-input, input[name*="amount"], #amount');
        let raw = el instanceof HTMLInputElement ? el.value : '';
        if (!raw) {
          // Try PayPal review page specific selectors
          const amountEl = document.querySelector('[data-testid*="amount"], [class*="amount"], [class*="Amount"]');
          if (amountEl) raw = (amountEl as HTMLElement).innerText.replace(/[^0-9.]/g, '');
        }
        if (!raw) {
          // Scan visible text for dollar amounts or plain numbers like "5.00"
          const text = document.body.innerText;
          const dollarMatch = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
          if (dollarMatch) {
            raw = dollarMatch[1].replace(/,/g, '');
          } else {
            // Last resort: find a standalone number that looks like an amount
            const numMatch = text.match(/\b(\d+\.\d{2})\b/);
            if (numMatch) raw = numMatch[1];
          }
        }
        const n = parseFloat(raw);
        return isFinite(n) && n > 0 ? n : 0;
      };

      const analyzePayPal = () => {
        const memo = readPayPalMemo();
        const amount = readPayPalAmount();
        cachedMemo = memo;
        if (!memo.trim() && amount === 0) return;
        if (!chrome.runtime?.id) return;

        chrome.runtime.sendMessage(
          { type: 'ANALYZE_RISK', data: { message: memo.substring(0, 1000), amount, platform: 'PayPal' } },
          (report: RiskAnalysis | undefined) => {
            if (report && typeof report.riskLevel === 'string') {
              cachedRisk = report;
              if (report.riskLevel === 'high' || report.riskLevel === 'critical') {
                setRiskReport(report);
                setShowModal(true);
                chrome.runtime.sendMessage({ type: 'LOG_EVENT', event: 'intercepted', platform: 'PayPal', score: report.score, riskLevel: report.riskLevel, flags: report.flags, amount: cachedMemo ? parseFloat(cachedMemo) || 0 : 0 });
              }
            }
          }
        );
      };

      // Bind input listener to memo field (idempotent via marker property)
      const bindMemoField = () => {
        const el = document.querySelector('#noteField, textarea[name="note"], [data-testid="note-input"]');
        if (!el || (el as any).__shieldBound) return;
        (el as any).__shieldBound = true;
        el.addEventListener('input', () => {
          cachedMemo = readPayPalMemo();
          if (paypalMemoTimer) clearTimeout(paypalMemoTimer);
          paypalMemoTimer = setTimeout(() => {
            if (cachedMemo.trim()) analyzePayPal();
          }, 800);
        });
      };

      // Bind to amount field — cache value as user types so it survives SPA nav to preview page
      const bindAmountField = () => {
        const el = document.querySelector('input[type="number"], input[name*="amount"], #amount, [data-testid*="amount"] input');
        if (!el || (el as any).__shieldAmountBound) return;
        (el as any).__shieldAmountBound = true;
        el.addEventListener('input', () => {
          const n = parseFloat((el as HTMLInputElement).value);
          if (isFinite(n) && n > 0) cachedAmount = n;
        });
      };

      bindMemoField();
      bindAmountField();

      // Detect PayPal SPA navigation via URL polling (pushState is in the
      // page's JS world, not the content script's isolated world, so we poll).
      const CONFIRM_URLS = ['/transfer/homepage/buy/preview', '/transfer/homepage/send/preview', '/webapps/hermes'];
      let questionnaireShownForUrl = '';

      paypalNavPoll = setInterval(() => {
        const url = window.location.href;
        // Always refresh cached amount on each tick — catches pre-filled links and user edits
        const latestAmount = readPayPalAmount();
        if (latestAmount > 0) cachedAmount = latestAmount;

        if (url !== lastUrl) {
          lastUrl = url;
          cachedMemo = readPayPalMemo();

          // On confirm/preview page — always show questionnaire first (memo or not)
          const isConfirmPage = CONFIRM_URLS.some(u => url.includes(u));
          if (isConfirmPage && questionnaireShownForUrl !== url) {
            questionnaireShownForUrl = url;
            const paypalAmount = cachedAmount || readPayPalAmount();
            pendingDataRef.current = { message: cachedMemo.substring(0, 1000), amount: paypalAmount };

            // Always show questionnaire first — trance-breaker before any warning
            setChecks({ contacted: false, firstTime: false, secretUrgent: false });
            setShowQuestionnaire(true);
          } else if (cachedMemo.trim()) {
            // Non-confirm page with memo — pre-analyze silently
            if (cachedRisk && (cachedRisk.riskLevel === 'high' || cachedRisk.riskLevel === 'critical')) {
              setRiskReport(cachedRisk);
              setShowModal(true);
            } else {
              analyzePayPal();
            }
          }
          // Re-bind fields in case SPA re-rendered them
          bindMemoField();
          bindAmountField();
        }
      }, 500);
    }


    return () => {
      document.removeEventListener("click", handleIntercept, true);
      observer.disconnect();
      if (paypalNavPoll) clearInterval(paypalNavPoll);
      if (paypalMemoTimer) clearTimeout(paypalMemoTimer);
    };
  }, []);

  const handleQuestionnaireSubmit = React.useCallback((skipToPayment: boolean) => {
    setShowQuestionnaire(false);
    const data = pendingDataRef.current;
    if (!data) { pendingRef.current = false; return; }

    if (skipToPayment) {
      // User clicked "Skip and send now" — but still check memo against scam email keywords
      const memo = (data.message ?? '').toLowerCase();
      if (memo.length > 0) {
        chrome.storage.local.get('gmailDetections', (storageData) => {
          const detections = Array.isArray(storageData.gmailDetections) ? storageData.gmailDetections : [];
          const now = Date.now();
          const recent = detections.filter((d: { timestamp: number }) => now - d.timestamp < 24 * 60 * 60 * 1000);

          // Check if memo contains keywords from any recent scam email
          const matchedDetection = recent.find((d: { keywords?: string[] }) => {
            const keywords: string[] = Array.isArray(d.keywords) ? d.keywords : [];
            return keywords.some(kw => memo.includes(kw.toLowerCase()));
          });

          if (matchedDetection) {
            const det = matchedDetection as { timestamp: number; senderEmail: string; subject: string; keywords?: string[] };
            const matchedWords = (det.keywords ?? []).filter((kw: string) => memo.includes(kw.toLowerCase()));
            const minutesAgo = Math.round((now - det.timestamp) / 60000);
            const timeAgo = minutesAgo < 60 ? `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
              : `${Math.round(minutesAgo / 60)} hour${Math.round(minutesAgo / 60) !== 1 ? 's' : ''} ago`;

            pendingRef.current = false;
            setRiskReport({
              score: 98,
              riskLevel: 'critical',
              flags: ['Email and payment are connected', 'Coordinated scam pattern'],
              recommendation: 'We connected this payment to a suspicious email you received. The memo matches words from that email — this is the pattern of a coordinated scam. You don\'t have to send this.',
              correlationNote: `You received a suspicious email from ${det.senderEmail} ${timeAgo}. Your payment memo contains words from that email: "${matchedWords.join('", "')}". We\'ve seen this exact pattern before — please take a moment before proceeding.`,
            });
            setShowModal(true);
            return;
          }

          // No keyword match — let through
          pendingRef.current = false;
          const btn = interceptedButtonRef.current;
          interceptedButtonRef.current = null;
          if (btn && handleInterceptRef.current) {
            document.removeEventListener("click", handleInterceptRef.current, true);
            btn.click();
            document.addEventListener("click", handleInterceptRef.current, { capture: true });
          }
        });
      } else {
        pendingRef.current = false;
        const btn = interceptedButtonRef.current;
        interceptedButtonRef.current = null;
        if (btn && handleInterceptRef.current) {
          document.removeEventListener("click", handleInterceptRef.current, true);
          btn.click();
          document.addEventListener("click", handleInterceptRef.current, { capture: true });
        }
      }
      return;
    }

    const socialFlags: string[] = [];
    if (checks.contacted) socialFlags.push('Unsolicited contact requested payment');
    if (checks.firstTime) socialFlags.push('First-time recipient');
    if (checks.secretUrgent) socialFlags.push('Urgency or secrecy pressure');

    if (socialFlags.length > 0) {
      // Show risk modal immediately — no need to wait for AI
      pendingRef.current = false;

      // Check for recent Gmail scam detections to build correlation note
      const buildReport = (correlationNote?: string): RiskAnalysis => ({
        score: 90,
        riskLevel: 'critical',
        flags: socialFlags,
        recommendation: 'This payment has the hallmarks of a sophisticated scam. There is no shame in pausing — that instinct could save you thousands.',
        correlationNote,
      });

      const showWithCorrelation = () => {
        chrome.storage.local.get('gmailDetections', (data) => {
          const detections = Array.isArray(data.gmailDetections) ? data.gmailDetections : [];
          const now = Date.now();
          const recent = detections.filter((d: { timestamp: number }) => now - d.timestamp < 24 * 60 * 60 * 1000);
          let correlationNote: string | undefined;
          if (recent.length > 0) {
            const latest = recent.reduce((a: { timestamp: number; senderEmail: string }, b: { timestamp: number; senderEmail: string }) => a.timestamp > b.timestamp ? a : b);
            const minutesAgo = Math.round((now - latest.timestamp) / 60000);
            const timeAgo = minutesAgo < 60 ? `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
              : `${Math.round(minutesAgo / 60)} hour${Math.round(minutesAgo / 60) !== 1 ? 's' : ''} ago`;
            correlationNote = `You received a scam email from ${latest.senderEmail} ${timeAgo}. That email and this payment are connected. This is how coordinated scams work.`;
          }
          setRiskReport(buildReport(correlationNote));
          setShowModal(true);
        });
      };

      showWithCorrelation();
      const active = activeRef.current;
      if (active && chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          type: 'LOG_EVENT', event: 'intercepted',
          platform: active.config.name,
          score: 90, riskLevel: 'critical', flags: socialFlags,
          amount: pendingDataRef.current?.amount ?? 0,
        });
      }
    } else {
      // All clear on questionnaire — check Gmail keyword correlation before AI analysis
      const memo = (data.message ?? '').toLowerCase();
      if (memo.length > 0) {
        chrome.storage.local.get('gmailDetections', (storageData) => {
          const detections = Array.isArray(storageData.gmailDetections) ? storageData.gmailDetections : [];
          const now = Date.now();
          const recent = detections.filter((d: { timestamp: number }) => now - d.timestamp < 24 * 60 * 60 * 1000);

          const matchedDetection = recent.find((d: { keywords?: string[] }) => {
            const keywords: string[] = Array.isArray(d.keywords) ? d.keywords : [];
            return keywords.some(kw => memo.includes(kw.toLowerCase()));
          });

          if (matchedDetection) {
            const det = matchedDetection as { timestamp: number; senderEmail: string; subject: string; keywords?: string[] };
            const matchedWords = (det.keywords ?? []).filter((kw: string) => memo.includes(kw.toLowerCase()));
            const minutesAgo = Math.round((now - det.timestamp) / 60000);
            const timeAgo = minutesAgo < 60 ? `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
              : `${Math.round(minutesAgo / 60)} hour${Math.round(minutesAgo / 60) !== 1 ? 's' : ''} ago`;

            pendingRef.current = false;
            setRiskReport({
              score: 98,
              riskLevel: 'critical',
              flags: ['Email and payment are connected', 'Coordinated scam pattern'],
              recommendation: 'We connected this payment to a suspicious email you received. The memo matches words from that email — this is the pattern of a coordinated scam. You don\'t have to send this.',
              correlationNote: `You received a suspicious email from ${det.senderEmail} ${timeAgo}. Your payment memo contains words from that email: "${matchedWords.join('", "')}". We\'ve seen this exact pattern before — please take a moment before proceeding.`,
            });
            setShowModal(true);

            const active = activeRef.current;
            if (active && chrome.runtime?.id) {
              chrome.runtime.sendMessage({
                type: 'LOG_EVENT', event: 'intercepted',
                platform: active.config.name,
                score: 98, riskLevel: 'critical',
                flags: ['Memo Matches Scam Email', 'Cross-Layer: Keyword Correlation'],
                amount: data.amount,
              });
            }
            return;
          }

          // No keyword match — fall through to AI analysis
          runAIAnalysisRef.current?.(data.message, data.amount, []);
        });
      } else {
        runAIAnalysisRef.current?.(data.message, data.amount, []);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks]);

  // Friction timer: force a 12-second cooldown on critical risk
  React.useEffect(() => {
    if (!showModal || !riskReport || riskReport.riskLevel !== 'critical') return;
    setCooldown(12);
    const iv = setInterval(() => setCooldown(prev => {
      if (prev <= 1) { clearInterval(iv); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [showModal, riskReport]);

  if (!showModal && !showQuestionnaire && !showShareScreen) return null;

  if (showShareScreen) {
    const amount = pendingDataRef.current?.amount ?? 0;
    const platform = activeRef.current?.config.name ?? 'PayPal';
    const shareText = getShareText(amount, platform);
    const fullShareText = `${shareText} ${SHARE_URL}`;

    return (
      <div className="overlay">
        <div className="card">
          <div className="share-screen">
            <div className="share-saved">
              {amount > 0 ? `$${amount.toLocaleString()} protected` : 'Payment blocked'}
            </div>
            <div className="share-sub">
              Safety Intercept stopped this before it cleared.<br />
              Know someone who uses Zelle or PayPal?
            </div>
            <div className="share-label">Share with someone who needs this</div>
            <div className="share-btns">
              <button
                className="share-btn share-btn-wa"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank')}
              >
                WhatsApp
              </button>
              <button
                className="share-btn share-btn-sms"
                onClick={() => window.open(`sms:?body=${encodeURIComponent(fullShareText)}`, '_blank')}
              >
                SMS
              </button>
              <button
                className="share-btn share-btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(fullShareText).then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  });
                }}
              >
                {copiedLink ? '✓ Copied' : 'Copy link'}
              </button>
            </div>
            <button className="share-dismiss" onClick={() => setShowShareScreen(false)}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (showQuestionnaire) {
    const anyChecked = checks.contacted || checks.firstTime || checks.secretUrgent;
    const toggle = (key: keyof typeof checks) =>
      setChecks(prev => ({ ...prev, [key]: !prev[key] }));

    const questions: { key: keyof typeof checks; text: string; context: string }[] = [
      { key: 'contacted', text: 'Someone contacted me and asked me to send this', context: 'Real companies and agencies never cold-call you to request a payment.' },
      { key: 'firstTime', text: "I've never paid this person or account before", context: 'First-time recipients are involved in 80% of payment scams.' },
      { key: 'secretUrgent', text: 'I was told to act fast or keep this private', context: "Urgency and secrecy are the #1 tools scammers use — legitimate requests don't need either." },
    ];

    return (
      <div className="overlay">
        <div className="card">
          <div className="badge badge-info">
            <span className="badge-dot" />
            Quick Check
          </div>
          <div className="title">Before you send.</div>
          <div className="desc">Scammers are incredibly convincing — this isn't about being careful enough. Check anything that applies.</div>
          <div className="divider" />
          {questions.map(q => (
            <div
              key={q.key}
              className={`q-item${checks[q.key] ? ' checked' : ''}`}
              onClick={() => toggle(q.key)}
            >
              <div className="q-checkbox">
                <svg className="q-check-icon" width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="q-text">{q.text}</span>
                {checks[q.key] && <div className="q-context">{q.context}</div>}
              </div>
            </div>
          ))}
          <button
            className="btn-continue"
            onClick={() => handleQuestionnaireSubmit(false)}
          >
            {anyChecked ? 'Analyze Payment →' : 'Looks fine, continue →'}
          </button>
          <button className="btn-skip" onClick={() => handleQuestionnaireSubmit(true)}>
            Send anyway
          </button>
        </div>
      </div>
    );
  }

  if (!showModal || !riskReport) return null;

  const config = activeRef.current?.config;

  const isCritical = riskReport.riskLevel === 'critical';
  const cleanFlags = Array.from(new Set(
    (riskReport.flags ?? []).map((f: string) =>
      f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
    )
  )).filter((f, i, arr) =>
    !arr.some((other, j) => j !== i && other.startsWith(f) && other !== f)
  ).slice(0, 3);

  const narrative = (() => {
    if (cleanFlags.length === 0) return riskReport.recommendation;
    
    const storyMap: Record<string, string> = {
      'First Time Recipient': "someone you’ve never paid before",
      'Urgency Or Secrecy Pressure': "an artificial sense of urgency",
      'Unsolicited Contact Requested Payment': "an unexpected request",
      'Highly Suspect Domain': "a suspicious website",
      'Social Engineering Pattern': "patterns of a known scam",
    };

    const stories = cleanFlags.map(f => storyMap[f] || f.toLowerCase()).filter(Boolean);
    
    let base = "This payment involve";
    if (stories.length === 1) {
      base = `This request involves ${stories[0]}.`;
    } else {
      const last = stories.pop();
      base = `This request involves ${stories.join(', ')} and ${last}.`;
    }

    return `${base} This is how most people lose money to scams. ${riskReport.recommendation}`;
  })();

  return (
    <div className="overlay">
      <div className="card">
        <div className={`badge ${isCritical ? 'badge-critical' : 'badge-high'}`}>
          <span className="badge-dot" />
          {isCritical ? 'Caution' : 'Heads Up'}
        </div>
        <div className="title">
          {isCritical ? 'This matches how sophisticated scams work' : `Something looks off with this payment`}
        </div>
        <div className="desc">
          {narrative}
        </div>
        <div className="divider" />
        {riskReport.correlationNote && (
          <div className="correlation-callout">
            <span className="correlation-icon">⚠️</span>
            <span className="correlation-text">{riskReport.correlationNote}</span>
          </div>
        )}
        <div className="actions">
          <button className="btn btn-cancel" onClick={() => {
            if (activeRef.current) {
              chrome.runtime.sendMessage({
                type: 'LOG_EVENT', event: 'cancelled',
                platform: activeRef.current.config.name,
                score: riskReport.score, riskLevel: riskReport.riskLevel, flags: riskReport.flags
              });
            }
            setShowModal(false);
            setShowShareScreen(true);
          }}>
            Go back — stay safe
          </button>
          <button
            className="btn btn-proceed"
            disabled={cooldown > 0}
            onClick={() => {
              if (activeRef.current) {
                chrome.runtime.sendMessage({
                  type: 'LOG_EVENT', event: 'proceeded',
                  platform: activeRef.current.config.name,
                  score: riskReport.score, riskLevel: riskReport.riskLevel, flags: riskReport.flags
                });
              }
              setShowModal(false);
              const btn = interceptedButtonRef.current;
              interceptedButtonRef.current = null;
              if (btn && handleInterceptRef.current) {
                document.removeEventListener("click", handleInterceptRef.current, true);
                btn.click();
                document.addEventListener("click", handleInterceptRef.current, { capture: true });
              }
            }}
          >
            {cooldown > 0 && <div className="btn-fill" style={{ right: `${(cooldown / 12) * 100}%` }} />}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {cooldown > 0 ? 'Take a breath' : 'I understand — proceed'}
            </span>
          </button>
        </div>
        <button className="btn-legitimate" onClick={() => {
          if (activeRef.current) {
            chrome.runtime.sendMessage({
              type: 'LOG_EVENT', event: 'false_positive',
              platform: activeRef.current.config.name,
              score: riskReport.score, riskLevel: riskReport.riskLevel, flags: riskReport.flags
            });
          }
          setShowModal(false);
          const btn = interceptedButtonRef.current;
          interceptedButtonRef.current = null;
          if (btn && handleInterceptRef.current) {
            document.removeEventListener("click", handleInterceptRef.current, true);
            btn.click();
            document.addEventListener("click", handleInterceptRef.current, { capture: true });
          }
        }}>
          I know this person — this is legitimate
        </button>
      </div>
    </div>
  );

};

// --- Initialization ---
const init = () => {
  if (!getActiveConfig()) return;
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
