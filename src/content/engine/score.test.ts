import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scoreContent } from './score';

beforeEach(() => {
  (globalThis as any).chrome = {
    runtime: { id: 'x', lastError: undefined, sendMessage: vi.fn((_m, cb) => cb({ score: 92, riskLevel: 'critical', flags: ['x'] })) },
  };
});

describe('scoreContent', () => {
  it('round-trips ANALYZE_RISK and returns the report', async () => {
    const r = await scoreContent({ message: 'bail money for grandson', amount: 500, platform: 'Venmo' });
    expect(r?.score).toBe(92);
    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ANALYZE_RISK' }), expect.any(Function),
    );
  });
  it('resolves null when the worker is unavailable', async () => {
    (globalThis as any).chrome.runtime.id = undefined;
    expect(await scoreContent({ message: 'x', amount: 0, platform: 'Venmo' })).toBeNull();
  });
});
