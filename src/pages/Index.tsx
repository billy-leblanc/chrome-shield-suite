import { useState } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

const PLATFORMS = ["PayPal", "Zelle", "Wells Fargo", "Gmail"];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Gmail Scam Detection",
    desc: "Reads your inbox in real time. Flags social engineering emails — family emergencies, fake nurses, romance setups — before you ever open PayPal.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Payment Interception",
    desc: "Watches the send button on PayPal, Venmo, Zelle, and Wells Fargo. If the memo looks like manipulation, it stops the payment and asks you three questions first.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Cross-Layer Correlation",
    desc: "If you received a scam email and then go to make a payment within 24 hours, risk score is automatically elevated. It connects the dots you might not.",
  },
];

const STEPS = [
  { n: "01", label: "Scam email arrives", detail: "Safety Intercept reads it in your Gmail tab. A red banner drops: 'Social Engineering Detected — Family Emergency.'" },
  { n: "02", label: "You go to send money", detail: "You open PayPal, enter an amount, type the memo. The send button gets intercepted before anything clears." },
  { n: "03", label: "Payment blocked", detail: "A questionnaire asks: did someone you don't know ask you to send this? Cross-layer correlation elevates risk. Money stays in your account." },
];

const PROOF = [
  { value: "29/29", label: "Crypto threats detected" },
  { value: "23/24", label: "SMS phishing detected" },
  { value: "5", label: "Platforms protected" },
  { value: "<200ms", label: "Analysis latency" },
];

export default function Index() {
  const [modalOpen, setModalOpen] = useState(false);
  const [enterpriseEmail, setEnterpriseEmail] = useState("");
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enterpriseEmail.trim()) {
      window.location.href = `mailto:safetyintercept@gmail.com?subject=Enterprise%20Inquiry&body=Email%3A%20${encodeURIComponent(enterpriseEmail)}`;
      setEnterpriseSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060C1A", color: "#E2E8F0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', overflowX: "hidden" }}>

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "50%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(56,189,248,0.07) 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,12,26,0.85)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22, color: "#38BDF8" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#F1F5F9", letterSpacing: "-0.3px" }}>Safety<span style={{ color: "#38BDF8" }}>Intercept</span></span>
          </div>
          <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#0D1526", background: "#38BDF8", padding: "8px 18px", borderRadius: 8, textDecoration: "none", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Try Early Beta
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, fontWeight: 600, color: "#FBBF24", marginBottom: 36, letterSpacing: "0.04em" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FBBF24", display: "inline-block" }} />
          Chrome Web Store review in progress
        </div>

        <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#F8FAFC", marginBottom: 24 }}>
          Stop scams<br />
          <span style={{ color: "#38BDF8" }}>before they cost you.</span>
        </h1>

        <p style={{ fontSize: 18, color: "#94A3B8", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 44px", fontWeight: 400 }}>
          Safety Intercept watches your Gmail inbox and payment apps in real time. When it detects social engineering, it stops the payment and explains why.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 52 }}>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, background: "#38BDF8", color: "#0D1526", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 0 24px rgba(56,189,248,0.25)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 36px rgba(56,189,248,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 24px rgba(56,189,248,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Get Early Access
          </a>
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            See it in action →
          </button>
        </div>

        {/* Platform badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {PLATFORMS.map(p => (
            <span key={p} style={{ fontSize: 12, fontWeight: 600, color: "#64748B", padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>{p}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding: "28px 28px 32px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(56,189,248,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(56,189,248,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#F1F5F9", textAlign: "center", marginBottom: 56, letterSpacing: "-0.5px" }}>How a grandparent scam gets stopped</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: "flex", gap: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1E3A5F", letterSpacing: "0.08em", paddingTop: 3, flexShrink: 0, width: 28 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#CBD5E1", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.65 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof bar */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, textAlign: "center", marginBottom: 24 }}>
          {PROOF.map(p => (
            <div key={p.label}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#38BDF8", letterSpacing: "-1px", marginBottom: 6 }}>{p.value}</div>
              <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{p.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 8 }}>Evaluated against real r/Scams corpus. Built at UC Berkeley.</p>
      </section>

      {/* Enterprise section */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#334155", textTransform: "uppercase", marginBottom: 20 }}>For platforms & fintechs</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#94A3B8", letterSpacing: "-0.5px", marginBottom: 16 }}>Protecting a product, not just yourself?</h2>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, marginBottom: 36 }}>
            We're building a fraud detection API backed by real consumer interception data. If you're a neobank, credit union, or platform looking to protect your users at the transaction layer, reach out.
          </p>
          {enterpriseSubmitted ? (
            <div style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", color: "#38BDF8", fontSize: 14, fontWeight: 600 }}>
              We'll be in touch. Thank you.
            </div>
          ) : (
            <form onSubmit={handleEnterpriseSubmit} style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto" }}>
              <input
                type="email"
                required
                value={enterpriseEmail}
                onChange={e => setEnterpriseEmail(e.target.value)}
                placeholder="your@company.com"
                style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0", fontSize: 14, outline: "none" }}
              />
              <button type="submit" style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", color: "#38BDF8", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                Get in touch
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#334155" }}>© 2026 Safety Intercept · Built at UC Berkeley · safetyintercept@gmail.com</span>
      </footer>

      {/* Demo modal */}
      <SafetyInterceptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Payment Intercepted"
        message="Memo: 'for Daniel's hospital stay — nurse Margaret said it's urgent, please don't tell family yet.' Safety Intercept detected: Third-Party Impersonation · Isolation Tactic · Medical Payment Urgency. Risk score: 94/100."
      />
    </div>
  );
}
