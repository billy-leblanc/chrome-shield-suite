# chrome-shield-suite: AI-Powered Fraud Prevention

## Project Overview
A Chrome extension designed to protect consumers from online scams, specifically AI-generated fraud. The extension uses real-time interception and an AI "Risk Engine" to block high-risk payments on platforms like PayPal.

## Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Manifest Version:** Chrome Extension Manifest V3
- **Primary Targeting:** PayPal Checkout (`://paypal.com*`)

## Project Structure
- `src/content/`: Contains `paypal_interceptor.tsx` for DOM-level payment interception.
- `src/components/`: Shared UI components, including the `SafetyInterceptModal`.
- `src/background/`: (Planned) Brain/Risk Engine for social engineering analysis.
- `extension/manifest.json`: Extension configuration and permissions.

## Coding Standards & Conventions
- **Naming:** Use kebab-case for component filenames (e.g., `safety-intercept-modal.tsx`).
- **State Management:** Use `chrome.storage.local` for persistent fraud pattern data.
- **UI:** Ensure all warning modals are injected via Shadow DOM to avoid styling conflicts with target websites.
- **Interception:** Always use `{ capture: true }` and `event.preventDefault()` to stop transactions before they hit site-native scripts.

## Current Progress & Critical Decisions
- **Completed:** Phase 1 (UI Scaffolding via Lovable) and Phase 2 (PayPal Interception via Anti-Gravity).
- **Next Task:** Implement `src/background/risk_engine.ts` to analyze transaction memos for social engineering patterns.
- **Decision:** Target PayPal first due to high reported scam volumes.

## Verification & Commands
- **Run Development:** `npm run dev`
- **Build Extension:** `npm run build`
- **Test:** Load the `dist` or `build` folder as an "unpacked extension" in Chrome.
