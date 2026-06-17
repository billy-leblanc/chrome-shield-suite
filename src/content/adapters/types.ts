export type SurfaceType = 'payment' | 'message' | 'marketplace';

export interface PaymentExtract {
  memo: string;
  amount: number;
  recipient: string;
}

export interface ScanItem {
  text: string;
  sender: string;
  threadKey: string;
}

export interface PaymentAdapter {
  id: string;
  matches: string[];          // hostnames this adapter owns, e.g. ['venmo.com']
  surface: 'payment';
  triggerSelectors: string[]; // send/pay buttons to intercept
  confirmText: RegExp;        // button text confirming it's the real send action
  extract(doc: Document): PaymentExtract;
  multiStep?: boolean;        // true = SPA where memo lives on an earlier step (Wells Fargo)
}

export interface ScanAdapter {
  id: string;
  matches: string[];
  surface: 'message' | 'marketplace';
  contentSelectors: string[]; // containers to observe + read
  read(el: Element): ScanItem | null;
}

export type PlatformAdapter = PaymentAdapter | ScanAdapter;
