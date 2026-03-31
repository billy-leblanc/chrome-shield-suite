# chrome-shield-suite: AI-Powered Fraud Prevention

## Project Overview
A Chrome extension designed to protect consumers from online scams, specifically AI-generated fraud. The extension uses real-time interception and an AI "Risk Engine" to block high-risk payments on platforms like PayPal.

## Tech Stack
- **Framework:** React 18 (with React 19 patterns) + Vite
- **Styling:** Tailwind CSS v4 (Custom Layers)
- **Manifest Version:** Chrome Extension Manifest V3
- **Primary Targeting:** PayPal, Venmo, Zelle, HSBC, Barclays, and Revolut

## Project Structure
- `src/content/`: Contains `payment_interceptor.tsx` (Unified shield for all platforms).
- `src/background/`: `risk_engine.ts` (The Brain - AI-powered heuristic analysis).
- `src/components/`: Shared UI components, including `SafetyInterceptModal`.
- `extension/`: Built extension files (Service Worker, Assets, Popup).

## Coding Standards & Conventions
- **Interception:** Use `{ capture: true }` and `MutationObserver` for robust detection.
- **Isolation:** Mandatory Shadow DOM for all injected UI elements.
- **Risk Assessment:** Content scripts MUST consult the `RiskEngine` before showing warnings.

## Current Progress & Critical Decisions
- **Completed:** Phase 3 (Risk Engine), Phase 4 (Multi-Portal), and Phase 10 (UK Bank Expansion).
- **Security:** Recursive audit completed; added `stopImmediatePropagation` and input sanitization.
- **Next Task:** Secure API Relay Enclave (Phase 9) and Global SMS Shield.

## Verification & Commands
- **Run Development:** `npm run dev`
- **Build Extension:** `npm run build`
- **Test:** Load the `dist` or `build` folder as an "unpacked extension" in Chrome.
