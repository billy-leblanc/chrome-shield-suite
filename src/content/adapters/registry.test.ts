import { describe, it, expect } from 'vitest';
import { getAdapterForHost } from './registry';

describe('getAdapterForHost', () => {
  it('matches a host suffix to its adapter', () => {
    expect(getAdapterForHost('www.venmo.com')?.id).toBe('venmo');
    expect(getAdapterForHost('account.venmo.com')?.id).toBe('venmo');
  });
  it('returns null for an unknown host', () => {
    expect(getAdapterForHost('example.com')).toBeNull();
  });
});
