# Privacy Policy for Safety Intercept

**Effective Date: April 2, 2026**

Safety Intercept is committed to protecting your privacy while providing real-time security during online payments. This policy explains how we handle your data.

### 1. Data Collection and Analysis
- **Payment Interception:** Our extension monitors payment pages (e.g., PayPal, Venmo, Zelle) solely to identify transaction details like the payment memo and amount for real-time fraud analysis.
- **AI Fraud Detection:** When a payment memo is detected, the text is encrypted and sent to our secure Cloudflare relay for processing by an AI engine. This analysis looks for social engineering patterns (e.g., urgency, impersonation) to calculate a risk score.

### 2. Data Storage and Security
- **No Personal Data Collection:** We do **NOT** store your payment details, credit card numbers, bank account numbers, or personally identifiable information (PII).
- **Local Storage:** Your transaction history, threat logs, and security stats are stored **locally** on your device using browser storage (`chrome.storage.local`). This data never leaves your machine.
- **Anonymized Analysis:** Data sent to our AI relay is used only for the immediate assessment and is not stored or used for profile building.

### 3. Data Sharing and Sale
- **No Third-Party Sharing:** We do **NOT** sell, trade, or share your data with any third parties.
- **Zero Tracking:** We do not track your browsing history or behavior outside of the specific payment platforms we protect.

### 4. Your Control
You can enable or disable the extension's intercept features at any time via the extension's popup menu.

---
For questions or support, please contact us via our GitHub repository.
