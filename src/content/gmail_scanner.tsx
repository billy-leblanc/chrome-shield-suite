import React from 'react';
import { createRoot } from 'react-dom/client';
import type { RiskAnalysis } from '../core/fraud_detector';

// --- Gmail DOM Selectors (fallback chains for resilience) ---
const GMAIL_SELECTORS = {
  emailBody: ['div.a3s.aiL', 'div.ii.gt', 'div[data-message-id] div[dir="ltr"]'],
  sender: ['span.gD[email]', 'span[email]'],
  subject: ['h2[data-thread-perm-id]', 'h2.hP'],
};

function queryWithFallback(selectors: string[], root: Element | Document = document): Element | null {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// --- Styles ---
const injectStyles = (shadow: ShadowRoot) => {
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      animation: slideDown 0.3s ease-out;
    }
    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .banner-critical {
      background: linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%);
      border-bottom: 1px solid rgba(248,113,113,0.3);
    }
    .banner-high {
      background: linear-gradient(135deg, #1a0808 0%, #2d1010 100%);
      border-bottom: 1px solid rgba(248,113,113,0.2);
    }
    .icon {
      width: 20px; height: 20px; flex-shrink: 0;
    }
    .icon-critical { color: #F87171; }
    .icon-high { color: #F87171; }
    .text-group { flex: 1; min-width: 0; }
    .title {
      font-size: 13px; font-weight: 700; letter-spacing: -0.2px;
    }
    .title-critical { color: #F87171; }
    .title-high { color: #FCA5A5; }
    .desc {
      font-size: 12px; color: #94A3B8; line-height: 1.4; margin-top: 2px;
    }
    .flags { display: flex; flex-wrap: nowrap; gap: 6px; flex-shrink: 0; overflow: hidden; }
    .flag {
      font-size: 10px; font-weight: 500; color: #94A3B8;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      padding: 2px 8px; border-radius: 99px; white-space: nowrap;
      max-width: 160px; overflow: hidden; text-overflow: ellipsis;
    }
    .btn-dismiss {
      flex-shrink: 0; padding: 6px 14px; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94A3B8; font-family: inherit;
      transition: opacity 0.15s ease;
    }
    .btn-dismiss:hover { opacity: 0.7; }
  `;
  shadow.appendChild(style);
};

// --- Component ---
const GmailScanner = () => {
  const [analysis, setAnalysis] = React.useState<RiskAnalysis | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [sender, setSender] = React.useState('');
  const analyzedRef = React.useRef<Set<string>>(new Set());
  const inFlightRef = React.useRef<Set<string>>(new Set());
  const flaggedRef = React.useRef<Map<string, { report: RiskAnalysis; senderEmail: string }>>(new Map());

  React.useEffect(() => {
    if (!window.location.hostname.endsWith('mail.google.com')) return;

    let lastHash = location.hash;

    const extractThreadId = (hash: string): string | null => {
      const match = hash.match(/^#[^/]+\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    };

    const extractAndAnalyze = (bodyEl: Element, threadId: string) => {
      const bodyText = (bodyEl as HTMLElement).innerText.trim().substring(0, 3000);
      if (bodyText.length < 20) return;

      const senderEl = queryWithFallback(GMAIL_SELECTORS.sender);
      const senderEmail = senderEl?.getAttribute('email') ?? '';
      const senderDomain = senderEmail.includes('@') ? senderEmail.split('@')[1] : '';

      const subjectEl = queryWithFallback(GMAIL_SELECTORS.subject);
      const subject = subjectEl?.textContent?.trim() ?? '';

      // Detect links and attachments in email body
      const bodyHtml = (bodyEl as HTMLElement).innerHTML;
      const linkCount = (bodyHtml.match(/<a\s/gi) || []).length;
      const hasExternalLinks = /<a\s[^>]*href=["']https?:\/\//i.test(bodyHtml);

      // Extract payment links from the email body — prepend as signal for the risk engine
      const paymentLinkMatch = bodyHtml.match(/https?:\/\/(paypal\.me|cash\.app|venmo\.com|link\.cash)[^\s"'<>]*/i);
      const paymentLinkSignal = paymentLinkMatch ? `[PAYMENT LINK DETECTED: ${paymentLinkMatch[0]}]\n\n` : '';
      const analysisText = [paymentLinkSignal + subject, bodyText].filter(Boolean).join('\n\n');

      if (!chrome.runtime?.id) return;

      const sendAnalysis = (retriesLeft: number) => {
        chrome.runtime.sendMessage(
          { type: 'ANALYZE_RISK', data: { message: analysisText.substring(0, 3000), amount: 0, platform: 'Gmail' } },
          (report: RiskAnalysis | undefined) => {
            if (chrome.runtime.lastError) {
              // Service worker was dead — retry after a short delay to let it wake
              if (retriesLeft > 0) setTimeout(() => sendAnalysis(retriesLeft - 1), 1000);
              return;
            }
          analyzedRef.current.add(threadId);
          inFlightRef.current.delete(threadId);
          if (report && typeof report === 'object' && typeof report.riskLevel === 'string') {
            if (report.riskLevel === 'high' || report.riskLevel === 'critical') {
              flaggedRef.current.set(threadId, { report, senderEmail });
              setAnalysis(report);
              setSender(senderEmail);
              setVisible(true);
              chrome.runtime.sendMessage({
                type: 'LOG_EVENT', event: 'gmail_scam_detected',
                platform: 'Gmail',
                score: report.score,
                riskLevel: report.riskLevel,
                flags: report.flags,
                senderEmail,
                senderDomain,
                subject: subject.substring(0, 200),
                bodyLength: bodyText.length,
                linkCount,
                hasExternalLinks,
                threadId,
              });
            }
          }
        }
        );
      };
      sendAnalysis(2);
    };

    const waitForEmailBody = (threadId: string) => {
      let debounceTimer: ReturnType<typeof setTimeout>;
      let settled = false;
      let observer: MutationObserver;

      const tryExtract = () => {
        const allBodies = document.querySelectorAll(GMAIL_SELECTORS.emailBody.join(', '));
        const bodyEl = allBodies.length > 0 ? allBodies[allBodies.length - 1] : null;
        if (bodyEl && (bodyEl as HTMLElement).innerText.trim().length > 20) {
          settled = true;
          observer?.disconnect();
          inFlightRef.current.add(threadId);
          extractAndAnalyze(bodyEl, threadId);
          return true;
        }
        return false;
      };

      // Check immediately
      if (tryExtract()) return;

      // Gmail SPA adds the email body element first (div.a3s), then adds the
      // `aiL` class via an attribute mutation once content is loaded. The original
      // observer only watched childList, so it missed the class addition entirely
      // and only succeeded on the safety timeout. Watch attributes too.
      observer = new MutationObserver(() => {
        if (settled) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => tryExtract(), 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });

      // Polling fallback — catches edge cases where mutations don't fire
      const pollInterval = setInterval(() => {
        if (settled) { clearInterval(pollInterval); return; }
        if (tryExtract()) { clearInterval(pollInterval); observer.disconnect(); }
      }, 500);

      // Safety timeout
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!settled) {
          observer.disconnect();
          tryExtract();
        }
      }, 10000);
    };

    const checkForEmailView = () => {
      const threadId = extractThreadId(location.hash);
      if (!threadId) {
        // Navigated away from email view — hide banner
        setVisible(false);
        return;
      }
      if (inFlightRef.current.has(threadId)) return; // Still waiting on relay
      if (analyzedRef.current.has(threadId)) {
        // Already analyzed — re-show banner if it was flagged
        const cached = flaggedRef.current.get(threadId);
        if (cached) {
          setAnalysis(cached.report);
          setSender(cached.senderEmail);
          setVisible(true);
        }
        return;
      }
      waitForEmailBody(threadId);
    };

    // Three-pronged detection: hashchange + polling + tab visibility
    window.addEventListener('hashchange', () => {
      lastHash = location.hash;
      checkForEmailView();
    });

    // Re-check when user switches back to this tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const currentHash = location.hash;
        const threadId = extractThreadId(currentHash);
        if (threadId && !analyzedRef.current.has(threadId) && !inFlightRef.current.has(threadId)) {
          lastHash = currentHash;
          checkForEmailView();
        }
      }
    });

    const poll = setInterval(() => {
      if (location.hash !== lastHash) {
        lastHash = location.hash;
        checkForEmailView();
      }
    }, 500);

    // Check on initial load
    checkForEmailView();

    return () => {
      window.removeEventListener('hashchange', checkForEmailView);
      clearInterval(poll);
    };
  }, []);

  if (!visible || !analysis) return null;

  const isCritical = analysis.riskLevel === 'critical';
  // LLM flags are full sentences — extract the first clause (before : or ,) as a short label
  const cleanFlags = Array.from(new Set(
    (analysis.flags ?? []).map((f: string) => {
      const short = f.split(/[:|,]/)[0].replace(/_/g, ' ').trim();
      return short.replace(/\b\w/g, c => c.toUpperCase());
    })
  )).slice(0, 3);

  return (
    <div className={`banner ${isCritical ? 'banner-critical' : 'banner-high'}`}>
      <svg className={`icon ${isCritical ? 'icon-critical' : 'icon-high'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <div className="text-group">
        <div className={`title ${isCritical ? 'title-critical' : 'title-high'}`}>
          {isCritical ? 'Scam Email Detected' : 'Suspicious Email'}
        </div>
        <div className="desc">
          {sender ? `From: ${sender} — ` : ''}Safety Intercept flagged this email as potentially fraudulent.
        </div>
      </div>
      {cleanFlags.length > 0 && (
        <div className="flags">
          {cleanFlags.map((f: string, i: number) => <span key={i} className="flag">{f}</span>)}
        </div>
      )}
      <button className="btn-dismiss" onClick={() => {
        setVisible(false);
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({
            type: 'LOG_EVENT', event: 'gmail_warning_dismissed',
            platform: 'Gmail',
            score: analysis.score,
            riskLevel: analysis.riskLevel,
            senderEmail: sender,
          });
        }
      }}>
        Dismiss
      </button>
    </div>
  );
};

// --- Initialization ---
const init = () => {
  if (!window.location.hostname.endsWith('mail.google.com')) return;
  if (document.getElementById('shield-gmail-host')) return;

  const host = document.createElement('div');
  host.id = 'shield-gmail-host';
  document.body.appendChild(host);
  const shadowRoot = host.attachShadow({ mode: 'closed' });
  injectStyles(shadowRoot);

  const container = document.createElement('div');
  shadowRoot.appendChild(container);

  createRoot(container).render(<GmailScanner />);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
