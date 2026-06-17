export default function Privacy() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F3", color: "#16181D", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 96px" }}>

        {/* Back */}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#8B909C", textDecoration: "none", marginBottom: 48 }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#16181D", letterSpacing: "-0.8px", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "#8B909C", marginBottom: 56 }}>Last updated: June 15, 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          <section>
            <h2 style={h2}>Overview</h2>
            <p style={p}>
              Safety Intercept is a Chrome extension that protects you from payment fraud and phishing. To do that, it reads payment memos and email content in your browser and analyzes them for fraud signals. This policy explains exactly what data leaves your device, what stays local, and who sees what.
            </p>
            <p style={p}>
              We do not sell your data. We do not build advertising profiles. We do not store the content of your messages or emails. The only reason any data leaves your device is to run the AI fraud analysis that makes the extension work — and once that analysis runs, the content is discarded.
            </p>
            <p style={{ ...p, marginTop: 16, padding: "14px 18px", background: "#FBE9E0", border: "1px solid rgba(232,85,43,0.25)", borderRadius: 10 }}>
              <strong style={{ color: "#C8431D" }}>Scope:</strong> Safety Intercept currently covers PayPal, Venmo, Cash App, Wells Fargo Zelle, and Gmail. Payments through other platforms (Chase, Bank of America, Coinbase, or other banking apps) are not monitored or protected by this extension.
            </p>
          </section>

          <section>
            <h2 style={h2}>What we process — and what we keep</h2>

            <h3 style={h3}>Payment memo text</h3>
            <p style={p}>
              When you initiate a payment on PayPal, Venmo, Cash App, or Wells Fargo Zelle, the memo/note text is sent to our Cloudflare relay and then to Anthropic's API (Claude) for fraud analysis. It is analyzed in transit and <strong style={{ color: "#16181D" }}>not stored</strong>. We keep only the result of the analysis — a risk score, the fraud techniques detected, the platform, and an amount <em>range</em> (e.g. "medium") — never the memo text and never the exact amount.
            </p>

            <h3 style={h3}>Gmail email content</h3>
            <p style={p}>
              When you open an email in Gmail, Safety Intercept reads the subject and a portion of the body and sends it to our relay and Anthropic for analysis. This content is analyzed in transit and <strong style={{ color: "#16181D" }}>not stored</strong>. If the score is low, nothing happens. If the score is high, a warning is shown and a detection event is logged — see below.
            </p>

            <h3 style={h3}>Detection events</h3>
            <p style={p}>
              When a fraud risk is detected, we log an event to our Cloudflare infrastructure. It contains: the platform, risk level, the fraud-technique tags triggered, an amount range, a timestamp, a random install identifier (see below), and — for email — the <em>sender's</em> domain and address. It does <strong style={{ color: "#16181D" }}>not</strong> contain your message text, the email subject or body, the message ID, your exact payment amount, or your IP address.
            </p>

            <h3 style={h3}>Approximate location</h3>
            <p style={p}>
              We derive only your <strong style={{ color: "#16181D" }}>country</strong> from your network connection, at the Cloudflare edge, for basic analytics. Your raw IP address is never stored, and we do not collect city, region, or precise location.
            </p>

            <h3 style={h3}>Random install identifier</h3>
            <p style={p}>
              Each installation generates a random identifier (a UUID) so we can count how many distinct installations are active. It is not derived from and is not linked to your identity, name, email, or account — it is just a random string created on your device.
            </p>

            <h3 style={h3}>Optional contribution when you correct us ("Not a scam")</h3>
            <p style={p}>
              If the extension flags something you know is safe, you can tap <strong style={{ color: "#16181D" }}>"Not a scam."</strong> By default that sends only the sender and which signals misfired — no content. We then ask whether you'd like to <strong style={{ color: "#16181D" }}>share that email's subject and text</strong> to help us stop flagging messages like it. The content is sent only if you explicitly tap "Share," only for that one message, and is stored separately for the sole purpose of improving detection. Nothing is shared unless you choose it.
            </p>
          </section>

          <section>
            <h2 style={h2}>What stays on your device</h2>
            <p style={p}>The following is stored locally in your browser using Chrome's storage API and never leaves your device:</p>
            <ul style={ul}>
              <li style={li}>Your threat log and event history</li>
              <li style={li}>Your blocked / warned / safe payment counts</li>
              <li style={li}>Recent scam-email detections used for 24-hour email-to-payment correlation</li>
              <li style={li}>Your extension settings and your install identifier</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Third parties</h2>

            <h3 style={h3}>Anthropic</h3>
            <p style={p}>
              Memo text and email content sent for analysis is processed by Anthropic's Claude API and is governed by their <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer" style={{ color: "#E8552B", textDecoration: "none" }}>privacy policy</a>. We do not send Anthropic any identifying information about you — only the text to be analyzed.
            </p>

            <h3 style={h3}>Cloudflare</h3>
            <p style={p}>
              Our relay and storage run on Cloudflare Workers and Cloudflare KV. Detection events and (if you choose to share them) correction contributions are stored in Cloudflare's infrastructure, governed by their <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" style={{ color: "#E8552B", textDecoration: "none" }}>privacy policy</a>.
            </p>
          </section>

          <section>
            <h2 style={h2}>What we do not collect</h2>
            <ul style={ul}>
              <li style={li}>The text of your messages, payment memos, or emails (analyzed in transit, never stored)</li>
              <li style={li}>Email subjects, bodies, or message IDs</li>
              <li style={li}>Your raw IP address or precise location</li>
              <li style={li}>Your exact payment amounts (stored only as ranges)</li>
              <li style={li}>Your name, email address, account information, or credentials</li>
              <li style={li}>Your browsing history, or any data from sites other than PayPal, Venmo, Cash App, Wells Fargo, and Gmail</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Data retention</h2>
            <p style={p}>
              Detection events and analytics are automatically deleted after <strong style={{ color: "#16181D" }}>90 days</strong>. The anonymized analysis results we keep as fraud-intelligence data contain no personal information — no message content, no IP, no identity — and describe only the scam side of a detection. Data stored locally on your device remains until you uninstall the extension or clear it from the popup.
            </p>
          </section>

          <section>
            <h2 style={h2}>Your choices</h2>
            <ul style={ul}>
              <li style={li}><strong style={{ color: "#16181D" }}>Disable interception:</strong> Turn off payment and email scanning entirely from the extension popup.</li>
              <li style={li}><strong style={{ color: "#16181D" }}>Decline sharing:</strong> Content is shared only when you actively tap "Share" on a correction. You never have to.</li>
              <li style={li}><strong style={{ color: "#16181D" }}>Uninstall:</strong> Removing the extension from Chrome deletes all local data immediately.</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Contact</h2>
            <p style={p}>
              Questions about this policy or your data: <a href="mailto:safetyintercept@gmail.com" style={{ color: "#E8552B", textDecoration: "none" }}>safetyintercept@gmail.com</a>
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
  color: "#16181D",
  marginBottom: 16,
  letterSpacing: "-0.3px",
};

const h3: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#565C6B",
  marginBottom: 8,
  marginTop: 24,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const p: React.CSSProperties = {
  fontSize: 15,
  color: "#565C6B",
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
  color: "#565C6B",
  lineHeight: 1.65,
  paddingLeft: 16,
  position: "relative",
};
