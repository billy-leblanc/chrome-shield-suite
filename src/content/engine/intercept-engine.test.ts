import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInterceptEngine } from './intercept-engine';
import type { PaymentAdapter } from '../adapters/types';

const adapter: PaymentAdapter = {
  id: 'mock', matches: ['mock.test'], surface: 'payment',
  triggerSelectors: ['#send'], confirmText: /Pay/i,
  extract: () => ({ memo: 'bail money', amount: 500, recipient: 'new-person' }),
};

beforeEach(() => {
  document.body.innerHTML = '<button id="send">Pay $500</button>';
  (globalThis as any).chrome = { runtime: { id: 'x', lastError: undefined, sendMessage: vi.fn((_m, cb) => cb({ score: 95, riskLevel: 'critical', flags: ['family-emergency-impersonation'], recommendation: '' })) } };
});

describe('runInterceptEngine', () => {
  it('intercepts a matching send click and scores the payment, calling the handler on high risk', async () => {
    const handler = vi.fn();
    runInterceptEngine(adapter, handler);
    document.querySelector<HTMLButtonElement>('#send')!.click();
    await new Promise(r => setTimeout(r, 0));
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ riskLevel: 'critical' }), expect.objectContaining({ memo: 'bail money' }), expect.anything());
  });

  it('ignores a click whose text does not match confirmText (e.g. "Request")', async () => {
    document.body.innerHTML = '<button id="send">Request</button>';
    runInterceptEngine(adapter, vi.fn());
    document.querySelector<HTMLButtonElement>('#send')!.click();
    await new Promise(r => setTimeout(r, 0));
    expect((globalThis as any).chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
