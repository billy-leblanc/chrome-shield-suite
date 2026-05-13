export default function Privacy() {
  return (
    <div style={{ minHeight: "100vh", background: "#060C1A", color: "#E2E8F0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 96px" }}>

        {/* Back */}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 48 }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.8px", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "#334155", marginBottom: 56 }}>Last updated: May 9, 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          <section>
            <h2 style={h2}>Overview</h2>
            <p style={p}>
              Safety Intercept is a Chrome extension that protects you from payment fraud and social engineering scams. To do that, it reads payment memos and email content in your browser and analyzes them for fraud signals. This policy explains exactly what data leaves your device, what stays local, and who sees what.
            </p>
            <p style={p}>
              We do not sell your data. We do not build advertising profiles. The only reason any data leaves your device is to run the AI fraud analysis that makes the extension work.
            </p>
            <p style={{ ...p, marginTop: 16, padding: "14px 18px", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10 }}>
              <strong style={{ color: "#F59E0B" }}>Scope:</strong> Safety Intercept currently covers three surfaces — PayPal, Wells Fargo Zelle, and Gmail. Payments made through other platforms (Chase, Venmo, Coinbase, Cash App, or any mobile banking app) are not monitored or protected by this extension.
            </p>
          </section>

          <section>
            <h2 style={h2}>What we process</h2>

            <h3 style={h3}>Payment memo text</h3>
            <p style={p}>
              When you initiate a payment on PayPal or Wells Fargo Zelle, the memo text you've entered is sent to our Cloudflare relay and then to Anthropic's API (Claude) for fraud analysis. The memo may contain names, amounts, or other context you've typed. This is necessary for the extension to work — without it, we cannot score the transaction.
            </p>

            <h3 style={h3}>Gmail email content</h3>
            <p style={p}>
              When you open an email in Gmail, Safety Intercept reads the subject line and a portion of the body and sends it to our Cloudflare relay and Anthropic for analysis. This happens for every email you open — the analysis is what determines whether it's suspicious. If the score is low, no banner appears and nothing is stored. If the score is high, a warning banner is shown and a detection event is logged (see below).
            </p>

            <h3 style={h3}>Detection events</h3>
            <p style={p}>
              When a fraud risk is detected, we log an anonymized event to our Cloudflare infrastructure. For payment events this includes: platform, risk level, fraud flags triggered, and a timestamp — no memo text. For Gmail events this also includes the sender's email address and subject line (truncated to 200 characters), which are necessary to power the 24-hour cross-layer correlation between email and payment threats.
            </p>

            <h3 style={h3}>Anonymized telemetry (opt-in only)</h3>
            <p style={p}>
              We are deliberately building a labeled fraud signal dataset. This dataset is the foundation of a fraud detection API we are developing for financial platforms and fintechs. If you opt in to telemetry, your anonymized interception data contributes to that dataset — and directly to making the detection model better for everyone.
            </p>
            <p style={{ ...p, marginTop: 12 }}>
              We're being explicit about this because you deserve to know. You are not just improving your own protection — you are contributing to a commercial product. We think that's a fair trade only if you actively choose it, which is why telemetry is off by default and requires you to turn it on.
            </p>
            <p style={{ ...p, marginTop: 12 }}>
              What is stored when you opt in: platform, risk score, risk level, detected fraud flags, and the memo text with personal information removed. Before storage, we automatically strip phone numbers, email addresses, and URLs. Names are retained because they are part of the fraud script (e.g. "nurse Margaret") and are meaningful training signal.
            </p>
          </section>

          <section>
            <h2 style={h2}>What stays on your device</h2>
            <p style={p}>The following data is stored locally in your browser using Chrome's storage API and never leaves your device:</p>
            <ul style={ul}>
              <li style={li}>Your threat log and event history</li>
              <li style={li}>Your blocked/warned/safe payment counts</li>
              <li style={li}>Recent scam email detections used for 24-hour cross-correlation</li>
              <li style={li}>Your extension settings (interception on/off, telemetry preference)</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Third parties</h2>

            <h3 style={h3}>Anthropic</h3>
            <p style={p}>
              Memo text and email content sent for analysis is processed by Anthropic's Claude API. Anthropic's data handling is governed by their <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer" style={{ color: "#38BDF8", textDecoration: "none" }}>privacy policy</a>. We do not share any identifying information about you with Anthropic — only the text content to be analyzed.
            </p>

            <h3 style={h3}>Cloudflare</h3>
            <p style={p}>
              Our relay and data storage run on Cloudflare Workers and Cloudflare KV. Detection events and (if opted in) anonymized telemetry are stored in Cloudflare's infrastructure. Cloudflare's data handling is governed by their <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" style={{ color: "#38BDF8", textDecoration: "none" }}>privacy policy</a>.
            </p>
          </section>

          <section>
            <h2 style={h2}>What we do not collect</h2>
            <ul style={ul}>
              <li style={li}>Your name, email address, or any account information</li>
              <li style={li}>Your browser history</li>
              <li style={li}>Full email bodies stored permanently</li>
              <li style={li}>Payment account numbers or credentials</li>
              <li style={li}>Any data from websites other than PayPal, Wells Fargo, and Gmail</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Data retention</h2>
            <p style={p}>
              Detection events in our Cloudflare logs are retained for operational and fraud-detection improvement purposes. Anonymized telemetry (opt-in) is retained indefinitely as training data for our fraud model. Local device storage is retained until you uninstall the extension or clear it manually from the popup.
            </p>
          </section>

          <section>
            <h2 style={h2}>Your choices</h2>
            <ul style={ul}>
              <li style={li}><strong style={{ color: "#CBD5E1" }}>Disable interception:</strong> Turn off payment and email scanning entirely from the extension popup.</li>
              <li style={li}><strong style={{ color: "#CBD5E1" }}>Opt out of telemetry:</strong> Telemetry is off by default. If you've enabled it, you can turn it off at any time from the popup.</li>
              <li style={li}><strong style={{ color: "#CBD5E1" }}>Uninstall:</strong> Removing the extension from Chrome deletes all local data immediately.</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Contact</h2>
            <p style={p}>
              Questions about this policy or your data: <a href="mailto:safetyintercept@gmail.com" style={{ color: "#38BDF8", textDecoration: "none" }}>safetyintercept@gmail.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#F1F5F9",
  marginBottom: 16,
  letterSpacing: "-0.3px",
};

const h3: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#94A3B8",
  marginBottom: 8,
  marginTop: 24,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const p: React.CSSProperties = {
  fontSize: 15,
  color: "#64748B",
  lineHeight: 1.75,
  marginBottom: 0,
};

const ul: React.CSSProperties = {
  paddingLeft: 0,
  margin: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const li: React.CSSProperties = {
  fontSize: 15,
  color: "#64748B",
  lineHeight: 1.65,
  paddingLeft: 16,
  position: "relative",
};
