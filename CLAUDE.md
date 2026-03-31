# Chrome Shield Suite

A safety-first Chrome Extension built with a modern React and Tailwind CSS stack.

## Tech Stack
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## Features
### PayPal Interceptor
Newly added logic in `src/content/paypal_interceptor.tsx` that:
- Monitors for PayPal "Send" and "Complete Purchase" buttons.
- Intercepts clicks to prevent unwanted or unsafe transactions.
- Provides a **Safety Intercept Modal** (Shadow DOM isolated) to warn the user and require confirmation before proceeding.

## Development
To build the extension:
```bash
npm run build
```
The built files will be output to the `extension/` directory, which can then be loaded into Chrome as an unpacked extension.
