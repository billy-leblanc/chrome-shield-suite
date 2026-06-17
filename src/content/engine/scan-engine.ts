import { scoreContent } from './score';
import type { ScanAdapter, ScanItem } from '../adapters/types';
import type { RiskAnalysis } from '../../core/fraud_detector';

export type ScanHandler = (report: RiskAnalysis, item: ScanItem) => void;

// Passively scans a message/marketplace surface: reads matched content on load
// and as the DOM mutates (SPA), dedups by threadKey, scores it, and on high
// risk hands the detection to the banner handler (non-blocking, unlike payment).
export async function runScanEngine(adapter: ScanAdapter, onDetect?: ScanHandler): Promise<void> {
  const seen = new Set<string>();

  async function process(el: Element): Promise<void> {
    const item = adapter.read(el);
    if (!item || !item.text || item.text.trim().length < 20) return;
    if (seen.has(item.threadKey)) return;
    seen.add(item.threadKey);
    const report = await scoreContent({ message: item.text, amount: 0, platform: adapter.id, senderEmail: item.sender });
    if (report && (report.riskLevel === 'high' || report.riskLevel === 'critical')) onDetect?.(report, item);
  }

  for (const sel of adapter.contentSelectors) document.querySelectorAll(sel).forEach((el) => void process(el));

  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (!(n instanceof Element)) continue;
        for (const sel of adapter.contentSelectors) {
          try { if (n.matches(sel)) void process(n); } catch { /* */ }
          n.querySelectorAll(sel).forEach((el) => void process(el));
        }
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
