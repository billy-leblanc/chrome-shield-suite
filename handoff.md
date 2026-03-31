# Project Handoff: Chrome Shield Suite

## Current State
- **Developer Agency**: Anti-Gravity has completed Phase 2 (PayPal Interceptor).
- **Core Feature**: The `paypal_interceptor.tsx` content script is implemented and active on `*://*.paypal.com/*`.
- **Infrastructure**: Shadow DOM is used for UI isolation; `manifest.json` and `vite.config.ts` are updated.
- **Documentation**: `CLAUDE.md`, `.claude/rules/memory-decisions.md`, and `.claude/rules/memory-sessions.md` are initialized.

## Key Logic to Note
- **Interceptor**: Located at `src/content/paypal_interceptor.tsx`. It uses a `{ capture: true }` click listener to catch payment attempts.
- **UI Component**: Uses `src/components/SafetyInterceptModal.tsx` rendered into a shadow root.

## Next Steps for Claude Code
1. **Risk Engine Implementation**: Create `src/background/risk_engine.ts` to analyze transaction metadata.
2. **AI Integration**: Add logic to evaluate "Risk Scores" based on transaction memos.
3. **Build & Verify**: Run `npm run build` to ensure the bundling of the content script into `extension/content.js` is successful.

## Critical Paths
- `src/content/`: DOM interception logic.
- `extension/manifest.json`: Content script mappings.
- `vite.config.ts`: Multi-input build configuration.
