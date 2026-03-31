# PayPal Interceptor Implementation Plan

This plan outlines the steps to build a content script for the Chrome Extension that intercepts payment actions on PayPal, prevents the default behavior, and displays a safety modal.

## Proposed Changes

### Core Logic

#### [NEW] [paypal_interceptor.tsx](src/content/payment_interceptor.tsx)
- Create a new content script in `src/content/`.
- Use `document.querySelectorAll` to find PayPal's "Send" or "Complete Purchase" buttons using identified CSS selectors:
    - `[data-testid="submit-button"]`
    - `[data-testid="send-money-submit"]`
    - `button[name="payment-submit-btn"]`
    - `#payment-submit-btn`
- Add a `click` event listener to these buttons.
- Call `event.preventDefault()` and `event.stopPropagation()` to stop the payment.
- Inject a Shadow DOM host into the page.
- Render the `SafetyInterceptModal` component into the shadow root.
- Ensure Tailwind CSS styles are injected into the shadow root for proper styling.

### Extension Configuration

#### [MODIFY] [manifest.json](extension/manifest.json)
- Add a `content_scripts` section:
    ```json
    "content_scripts": [
      {
        "matches": ["*://*.paypal.com/*"],
        "js": ["content.js"],
        "run_at": "document_idle"
      }
    ]
    ```

#### [MODIFY] [vite.config.ts](vite.config.ts)
- Update Vite configuration to include a build entry for the content script.
- Ensure the output is named `content.js` and placed in the `extension/` or `dist/` folder as appropriate for the user's build flow.

## Verification Plan

### Automated Tests
- Since this is a browser-based UI interaction, I will use a manual verification script or a simple test case if possible.
- I'll check if the buttons are correctly identified and the interceptor is attached.

### Manual Verification
1.  **Build the extension**: Run `npm run build`.
2.  **Load the extension**: Load the `extension/` or `dist/` folder into Chrome.
3.  **Visit PayPal**: Navigate to a PayPal payment page (or a mock page with similar selectors).
4.  **Click "Send"**: Verify that the payment does NOT proceed and the `SafetyModal` appears.
5.  **Verify UI**: Ensure the modal is styled correctly (isolated by Shadow DOM).
