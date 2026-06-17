import { scoreContent } from './score';
import type { PaymentAdapter, PaymentExtract } from '../adapters/types';
import type { RiskAnalysis } from '../../core/fraud_detector';

export type InterceptHandler = (report: RiskAnalysis, extract: PaymentExtract, event: Event) => void;

// Watches a payment surface for the adapter's send action. A click is the real
// "send money" only if it both matches a triggerSelector AND the button's text
// matches confirmText (needed where selectors are unstable, e.g. Venmo's MUI
// buttons share a class — text tells "Pay" apart from "Request"). On a high/
// critical score it blocks the click and hands off to the checkpoint handler.
export function runInterceptEngine(adapter: PaymentAdapter, onIntercept?: InterceptHandler): void {
  document.addEventListener('click', async (e) => {
    const el = e.target as Element | null;
    if (!el) return;
    let btn: HTMLElement | null = null;
    for (const sel of adapter.triggerSelectors) {
      try { btn = el.closest(sel) as HTMLElement | null; } catch { btn = null; }
      if (btn) break;
    }
    if (!btn) return;
    const text = (btn.innerText || btn.textContent || '').trim();
    if (!adapter.confirmText.test(text)) return;

    const extract = adapter.extract(document);
    const report = await scoreContent({ message: extract.memo, amount: extract.amount, platform: adapter.id });
    if (report && (report.riskLevel === 'high' || report.riskLevel === 'critical')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      onIntercept?.(report, extract, e);
    }
  }, true);
}
