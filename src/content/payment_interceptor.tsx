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
    name: 'Venmo',
    selectors: ['button[data-testid="payment-button"]', 'button.pay-button']
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
  'venmo.com': /Pay .* \$/i,
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
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 99px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      margin-bottom: 16px;
    }
    .badge-critical { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #F87171; }
    .badge-high { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); color: #FBBF24; }
    .badge-info { background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); color: #38BDF8; }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .title {
      font-size: 17px; font-weight: 700; color: #F1F5F9;
      letter-spacing: -0.4px; line-height: 1.3; margin-bottom: 8px;
    }
    .desc {
      font-size: 13px; color: #64748B; line-height: 1.6; margin-bottom: 22px;
    }
    .divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 20px; }
    .flags-label { font-size: 10px; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .flags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
    .flag {
      font-size: 11px; font-weight: 500; color: #94A3B8;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      padding: 3px 10px; border-radius: 99px;
    }
    .actions { display: flex; gap: 8px; }
    .btn {
      flex: 1; padding: 11px; border-radius: 10px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: none; transition: opacity 0.15s ease; letter-spacing: 0.01em;
    }
    .btn:hover { opacity: 0.85; }
    .btn-cancel {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: #94A3B8;
    }
    .btn-proceed {
      background: rgba(248,113,113,0.12);
      border: 1px solid rgba(248,113,113,0.25) !important;
      color: #F87171;
    }
    .btn-legitimate {
      width: 100%; margin-top: 10px; padding: 8px;
      background: none; border: none; cursor: pointer;
      font-size: 11px; color: #334155; text-decoration: underline;
      text-underline-offset: 2px; font-family: inherit;
    }
    .btn-legitimate:hover { color: #64748B; }
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
      background: rgba(248,113,113,0.06);
      border-color: rgba(248,113,113,0.3);
    }
    .q-checkbox {
      width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 1px;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.04);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .q-item.checked .q-checkbox {
      background: #F87171; border-color: #F87171;
    }
    .q-check-icon { display: none; }
    .q-item.checked .q-check-icon { display: block; }
    .q-text { font-size: 13px; color: #94A3B8; line-height: 1.5; }
    .q-item.checked .q-text { color: #F1F5F9; }
    .btn-continue {
      width: 100%; padding: 12px; border-radius: 10px; margin-top: 16px;
      background: linear-gradient(135deg, #1a3a60 0%, #0f2040 100%);
      border: 1px solid rgba(56,189,248,0.3) !important;
      color: #38BDF8; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: opacity 0.15s ease; letter-spacing: 0.02em;
    }
    .btn-continue:hover { opacity: 0.85; }
    .btn-skip {
      width: 100%; margin-top: 8px; padding: 8px;
      background: none; border: none; cursor: pointer;
      font-size: 11px; color: #334155; font-family: inherit;
    }
    .btn-skip:hover { color: #64748B; }
  `;
  shadow.appendChild(style);
};

// --- Component ---
const Interceptor = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [riskReport, setRiskReport] = React.useState<RiskAnalysis | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = React.useState(false);
  const [checks, setChecks] = React.useState({ contacted: false, firstTime: false, secretUrgent: false });

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
        if (domain === 'wellsfargo.com') return /Send/i.test(normalizedText);
        return true;
      }
      const textPattern = TEXT_FALLBACK_PATTERNS[domain];
      if (textPattern && btn && textPattern.test(normalizedText)) return true;
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

      const memoEl = document.querySelector('textarea, [contenteditable="true"], input[name*="note"], input[name*="memo"]');
      let message = '';
      if (memoEl instanceof HTMLTextAreaElement || memoEl instanceof HTMLInputElement) {
        message = memoEl.value ?? '';
      } else if (memoEl instanceof HTMLElement) {
        message = memoEl.textContent ?? '';
      }

      const amountEl = document.querySelector('input[type="number"], .amount-input, input[name*="amount"]');
      let rawAmount = amountEl instanceof HTMLInputElement ? amountEl.value : '';
      if (!rawAmount) {
        // On confirmation pages the amount is displayed as text — scan the DOM for a dollar value
        const match = document.body.innerText.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
        if (match) rawAmount = match[1].replace(/,/g, '');
      }
      const amount = parseFloat(rawAmount);
      const safeAmount = isFinite(amount) ? amount : 0;

      // Store data and show questionnaire first
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
                score: mergedReport.score, riskLevel: mergedReport.riskLevel, flags: mergedReport.flags
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
      let cachedRisk: RiskAnalysis | null = null;
      let lastUrl = window.location.href;

      const readPayPalMemo = (): string => {
        const el = document.querySelector('#noteField, textarea[name="note"], [data-testid="note-input"]');
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return el.value;
        if (el instanceof HTMLElement) return el.textContent ?? '';
        return cachedMemo; // field may have unmounted during SPA nav
      };

      const readPayPalAmount = (): number => {
        const el = document.querySelector('input[type="number"], .amount-input, input[name*="amount"], #amount');
        if (el instanceof HTMLInputElement) {
          const n = parseFloat(el.value);
          return isFinite(n) ? n : 0;
        }
        return 0;
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
                chrome.runtime.sendMessage({ type: 'LOG_EVENT', event: 'intercepted', platform: 'PayPal', score: report.score, riskLevel: report.riskLevel, flags: report.flags });
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
          // Pre-analyze 800ms after the user stops typing
          paypalMemoTimer = setTimeout(() => {
            if (cachedMemo.trim()) analyzePayPal();
          }, 800);
        });
      };

      bindMemoField();

      // Detect PayPal SPA navigation via URL polling (pushState is in the
      // page's JS world, not the content script's isolated world, so we poll).
      const CONFIRM_URLS = ['/transfer/homepage/buy/preview', '/transfer/homepage/send/preview', '/webapps/hermes'];
      let questionnaireShownForUrl = '';

      paypalNavPoll = setInterval(() => {
        const url = window.location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          cachedMemo = readPayPalMemo();

          // On confirm/preview page — always show questionnaire first (memo or not)
          const isConfirmPage = CONFIRM_URLS.some(u => url.includes(u));
          if (isConfirmPage && questionnaireShownForUrl !== url) {
            questionnaireShownForUrl = url;
            pendingDataRef.current = { message: cachedMemo.substring(0, 1000), amount: readPayPalAmount() };
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
          // Re-bind memo field in case SPA re-rendered it
          bindMemoField();
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
      // User clicked "No, send it" — let through without AI analysis
      pendingRef.current = false;
      const btn = interceptedButtonRef.current;
      interceptedButtonRef.current = null;
      if (btn && handleInterceptRef.current) {
        document.removeEventListener("click", handleInterceptRef.current, true);
        btn.click();
        document.addEventListener("click", handleInterceptRef.current, { capture: true });
      }
      return;
    }

    const socialFlags: string[] = [];
    if (checks.contacted) socialFlags.push('External Contact Initiated Payment');
    if (checks.firstTime) socialFlags.push('First Time Recipient');
    if (checks.secretUrgent) socialFlags.push('Urgency or Secrecy Requested');

    if (socialFlags.length > 0) {
      // Show risk modal immediately — no need to wait for AI
      pendingRef.current = false;
      const report: RiskAnalysis = {
        score: 90,
        riskLevel: 'critical',
        flags: socialFlags,
        recommendation: 'Stop. This payment shows signs of social engineering. Do not proceed.',
      };
      setRiskReport(report);
      setShowModal(true);
      const active = activeRef.current;
      if (active && chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          type: 'LOG_EVENT', event: 'intercepted',
          platform: active.config.name,
          score: report.score, riskLevel: report.riskLevel, flags: report.flags
        });
      }
    } else {
      // All clear on questionnaire — run AI analysis normally
      runAIAnalysisRef.current?.(data.message, data.amount, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks]);

  if (!showModal && !showQuestionnaire) return null;
  if (showQuestionnaire) {
    const anyChecked = checks.contacted || checks.firstTime || checks.secretUrgent;
    const toggle = (key: keyof typeof checks) =>
      setChecks(prev => ({ ...prev, [key]: !prev[key] }));

    const questions: { key: keyof typeof checks; text: string }[] = [
      { key: 'contacted', text: 'Someone contacted me (call, text, or DM) and asked me to send this payment' },
      { key: 'firstTime', text: "I'm sending to someone I've never paid before" },
      { key: 'secretUrgent', text: 'I was told to act quickly or keep this payment private' },
    ];

    return (
      <div className="overlay">
        <div className="card">
          <div className="badge badge-info">
            <span className="badge-dot" />
            Quick Check
          </div>
          <div className="title">Before you send</div>
          <div className="desc">Check anything that applies. Takes 5 seconds.</div>
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
              <span className="q-text">{q.text}</span>
            </div>
          ))}
          <button
            className="btn-continue"
            onClick={() => handleQuestionnaireSubmit(false)}
          >
            {anyChecked ? 'Analyze Payment →' : 'Looks fine, continue →'}
          </button>
          <button className="btn-skip" onClick={() => handleQuestionnaireSubmit(true)}>
            Skip and send now
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

  return (
    <div className="overlay">
      <div className="card">
        <div className={`badge ${isCritical ? 'badge-critical' : 'badge-high'}`}>
          <span className="badge-dot" />
          {isCritical ? 'High Risk Detected' : 'Suspicious Activity'}
        </div>
        <div className="title">
          {isCritical ? 'This payment looks like a scam' : `Unusual pattern on ${config?.name ?? 'this payment'}`}
        </div>
        <div className="desc">
          Our AI flagged this transaction before it was sent. Review the details below before proceeding.
        </div>
        <div className="divider" />
        {cleanFlags.length > 0 && (
          <>
            <div className="flags-label">Risk Signals</div>
            <div className="flags">
              {cleanFlags.map((f: string, i: number) => <span key={i} className="flag">{f}</span>)}
            </div>
          </>
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
          }}>
            Cancel Payment
          </button>
          <button
            className="btn btn-proceed"
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
            Proceed Anyway
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
          This was a legitimate payment
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
