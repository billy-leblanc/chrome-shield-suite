import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runScanEngine } from './scan-engine';
import type { ScanAdapter } from '../adapters/types';

const adapter: ScanAdapter = {
  id: 'mockmail', matches: ['mock.test'], surface: 'message',
  contentSelectors: ['.msg'],
  read: (el) => ({ text: el.textContent || '', sender: 'a@b.com', threadKey: 't1' }),
};

beforeEach(() => {
  document.body.innerHTML = '<div class="msg">grandson in jail send gift cards now tonight</div>';
  (globalThis as any).chrome = { runtime: { id: 'x', lastError: undefined, sendMessage: vi.fn((_m, cb) => cb({ score: 90, riskLevel: 'critical', flags: [], recommendation: '' })) } };
});

describe('runScanEngine', () => {
  it('reads matched content on load and scores it, firing the handler on high risk', async () => {
    const handler = vi.fn();
    await runScanEngine(adapter, handler);
    await new Promise(r => setTimeout(r, 10));
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ riskLevel: 'critical' }), expect.objectContaining({ threadKey: 't1' }));
  });

  it('dedups repeat content by threadKey', async () => {
    document.body.innerHTML = '<div class="msg">grandson in jail send gift cards now tonight</div><div class="msg">grandson in jail send gift cards now tonight</div>';
    await runScanEngine(adapter, vi.fn());
    await new Promise(r => setTimeout(r, 10));
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });
});
