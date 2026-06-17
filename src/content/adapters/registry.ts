import type { PlatformAdapter } from './types';
import { venmoAdapter } from './venmo';

const ADAPTERS: PlatformAdapter[] = [venmoAdapter];

export function getAdapterForHost(host: string): PlatformAdapter | null {
  const h = host.toLowerCase();
  return ADAPTERS.find(a => a.matches.some(m => h === m || h.endsWith('.' + m))) ?? null;
}

export { ADAPTERS };
