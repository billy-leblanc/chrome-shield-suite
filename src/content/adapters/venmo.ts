import type { PaymentAdapter } from './types';

// Selectors verified 2026-06-17 on account.venmo.com pay-confirm screen.
// Note field + amount are stable; send buttons (MUI, no testid) match by text.
export const venmoAdapter: PaymentAdapter = {
  id: 'venmo',
  matches: ['venmo.com'],
  surface: 'payment',
  triggerSelectors: ['.MuiButton-root', 'button'],
  confirmText: /^(Pay|Confirm|Pay without confirming)$/i, // excludes "Request"
  extract: (doc) => {
    const memo = (doc.querySelector('#payment-note, [data-testid="payment-note-input"]') as HTMLTextAreaElement | null)?.value ?? '';
    const amtRaw = (doc.querySelector('input[aria-label="Amount"]') as HTMLInputElement | null)?.value ?? '0';
    return { memo, amount: parseFloat(amtRaw.replace(/[^0-9.]/g, '')) || 0, recipient: '' };
  },
};
