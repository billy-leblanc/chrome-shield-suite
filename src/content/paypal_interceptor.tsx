import React from "react";
import { createRoot } from "react-dom/client";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

// Function to inject styles into the Shadow DOM
const injectStyles = (shadowRoot: ShadowRoot) => {
  const style = document.createElement("style");
  // Basic Tailwind-like styles and CSS variables needed for the modal
  style.textContent = `
    :host {
      --background: 222 47% 7%;
      --foreground: 210 40% 96%;
      --card: 222 40% 10%;
      --card-foreground: 210 40% 96%;
      --popover: 222 40% 10%;
      --popover-foreground: 210 40% 96%;
      --primary: 187 92% 69%;
      --primary-foreground: 222 47% 7%;
      --secondary: 222 30% 16%;
      --secondary-foreground: 210 40% 96%;
      --muted: 222 30% 16%;
      --muted-foreground: 215 20% 65%;
      --accent: 160 64% 64%;
      --accent-foreground: 222 47% 7%;
      --destructive: 0 86% 71%;
      --destructive-foreground: 222 47% 7%;
      --border: 217 30% 15%;
      --input: 217 30% 15%;
      --ring: 187 92% 69%;
      --radius: 0.75rem;
    }

    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-50 { z-index: 50; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .bg-black\\/60 { background-color: rgba(0, 0, 0, 0.6); }
    .backdrop-blur-sm { backdrop-filter: blur(4px); }
    .bg-card { background-color: hsl(var(--card)); }
    .border { border-width: 1px; }
    .border-border { border-color: hsl(var(--border)); }
    .rounded-2xl { border-radius: 1rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .p-6 { padding: 1.5rem; }
    .mx-4 { margin-left: 1rem; margin-right: 1rem; }
    .w-full { width: 100%; }
    .max-w-sm { max-width: 24rem; }
    .gap-3 { gap: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .text-lg { font-size: 1.125rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .text-foreground { color: hsl(var(--foreground)); }
    .text-muted-foreground { color: hsl(var(--muted-foreground)); }
    .text-sm { font-size: 0.875rem; }
    .leading-relaxed { line-height: 1.625; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
    .bg-secondary { background-color: hsl(var(--secondary)); }
    .bg-destructive { background-color: hsl(var(--destructive)); }
    .text-destructive { color: hsl(var(--destructive)); }
    .text-destructive-foreground { color: hsl(var(--destructive-foreground)); }
    .bg-destructive\\/15 { background-color: hsla(0, 86%, 71%, 0.15); }
    .transition-colors { transition-property: background-color, border-color, color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .cursor-pointer { cursor: pointer; }
    .animate-in { animation-duration: 200ms; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    .fade-in { animation-name: fade-in; }
    .zoom-in-95 { animation-name: zoom-in; transform: scale(0.95); }
    
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoom-in { from { transform: scale(0.95); } to { transform: scale(1); } }
    
    .glow-primary { box-shadow: 0 0 30px hsla(187, 92%, 69%, 0.2); }
  `;
  shadowRoot.appendChild(style);
};

const Interceptor = () => {
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    const handleIntercept = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const paypalSelectors = [
        '[data-testid="submit-button"]',
        '[data-testid="send-money-submit"]',
        'button[name="payment-submit-btn"]',
        '#payment-submit-btn',
        'button.send-money-submit',
        '#sendMoneyButton',
        'button[type="submit"]',
        '.paypal-button'
      ];

      const isPaypalButton = paypalSelectors.some(selector => 
        target.matches(selector) || target.closest(selector)
      );

      if (isPaypalButton) {
        e.preventDefault();
        e.stopPropagation();
        setShowModal(true);
      }
    };

    document.addEventListener("click", handleIntercept, true);
    return () => document.removeEventListener("click", handleIntercept, true);
  }, []);

  return (
    <SafetyInterceptModal
      open={showModal}
      onClose={() => setShowModal(false)}
      title="PayPal Payment Intercepted"
      message="We've paused this payment for your safety. Are you sure you want to proceed with this transaction on PayPal?"
      onConfirm={() => {
        console.log("User chose to proceed anyway");
        // In a real scenario, we might want to temporarily disable the interceptor and re-click
      }}
    />
  );
};

// Initialize the Shadow DOM and render the interceptor
const init = () => {
  const host = document.createElement("div");
  host.id = "lovable-paypal-interceptor-host";
  document.body.appendChild(host);
  
  const shadowRoot = host.attachShadow({ mode: "open" });
  injectStyles(shadowRoot);
  
  const rootContainer = document.createElement("div");
  shadowRoot.appendChild(rootContainer);
  
  const root = createRoot(rootContainer);
  root.render(<Interceptor />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
