import { useState } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "We read the email before you open your wallet.",
    desc: "If you've received a suspicious PayPal scam email or a Zelle fraud request, we flag it the moment it arrives — before you call back, before you click, before you send a cent.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "We stop you before you hit Send.",
    desc: "When you go to send money on PayPal or Zelle, we intercept the button — locally, in your browser, never touching your account. We score the memo and pause if something looks wrong.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "We connect what you didn't notice.",
    desc: "A Zelle scam doesn't start at the payment screen. It starts with an email. We link the two — if a suspicious message arrived in the last 24 hours and you're now sending money, we catch that pattern.",
  },
];

const STEPS = [
  {
    n: "01",
    label: "A scam email arrives.",
    detail: "We read it in your Gmail tab and drop a quiet banner. The flag is invisible to the scammer — and impossible to miss for you.",
  },
  {
    n: "02",
    label: "You go to pay someone.",
    detail: "You open PayPal or Zelle, enter the amount, write the memo. We are already there. Before anything sends, we step in.",
  },
  {
    n: "03",
    label: "We stop it.",
    detail: "The email, the memo, the timing — connected. We show you exactly what we found and let you decide. Your money stays in your account.",
  },
];

const PROOF = [
  { value: "$15.9B", label: "Lost to fraud in the US in 2025" },
  { value: "3", label: "Surfaces protected" },
  { value: "24h", label: "Correlation window — email to payment" },
  { value: "Free", label: "Always. No subscription." },
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
        <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "50%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,12,26,0.9)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20, color: "#2563EB" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9", letterSpacing: "-0.3px" }}>Safety<span style={{ color: "#2563EB" }}>Intercept</span></span>
          </div>
          <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer"
            style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "#2563EB", padding: "8px 18px", borderRadius: 8, textDecoration: "none", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Install Free
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "108px 24px 88px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 36, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          The Intent Layer
        </div>

        <h1 style={{ fontSize: "clamp(38px, 6vw, 66px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-2px", color: "#F8FAFC", marginBottom: 22 }}>
          Stop scams before<br />you send money.
        </h1>

        <p style={{ fontSize: 17, color: "#94A3B8", lineHeight: 1.75, maxWidth: 520, margin: "0 auto 14px", fontWeight: 400 }}>
          The world's first intent-layer agent that analyzes <em>why</em> you're sending money — not just where it's going.
        </p>

        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, maxWidth: 560, margin: "0 auto 44px" }}>
          Most fraud protection catches bad transactions. We catch bad decisions — before they happen. If you've received a PayPal scam email or a Zelle fraud request, we're already watching. On PayPal and Zelle, in your inbox, in the moment you're most vulnerable.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 14 }}>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 12, background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 0 28px rgba(37,99,235,0.3)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 40px rgba(37,99,235,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 28px rgba(37,99,235,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 17, height: 17 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Add to Chrome — Free
          </a>
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            See it intercept a scam →
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#1E3A5F", marginBottom: 36 }}>Chrome Web Store review in progress · Install the beta now</p>

        {/* Platform badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {["PayPal", "Wells Fargo + Zelle", "Gmail"].map(p => (
            <span key={p} style={{ fontSize: 12, fontWeight: 600, color: "#334155", padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>{p}</span>
          ))}
        </div>
      </section>

      {/* The scenario — no header, just the story */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "0 24px 96px", textAlign: "center" }}>
        <div style={{ padding: "32px 36px", borderRadius: 18, background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)" }}>
          <div style={{ fontSize: 13, color: "#334155", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>A real scenario</div>
          <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.8, marginBottom: 0 }}>
            Margaret receives an email: her Geek Squad subscription renewed for $899. She calls the number. The agent tells her to log into PayPal and send a "refund." She types the memo. She clicks Send.
            <br /><br />
            <span style={{ color: "#94A3B8" }}>We stop it.</span> The email arrived 14 minutes ago. The memo matches. The pattern is exact. Her money never moves.
          </p>
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 40 }}>How it works</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title}
              style={{ padding: "28px 28px 32px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(37,99,235,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0", marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three moments */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#E2E8F0", textAlign: "center", marginBottom: 56, letterSpacing: "-0.5px" }}>Three moments. One outcome.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 40 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: "flex", gap: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1E3A5F", letterSpacing: "0.08em", paddingTop: 3, flexShrink: 0, width: 28 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#CBD5E1", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof bar */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 40 }}>The problem is real</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, textAlign: "center" }}>
          {PROOF.map(p => (
            <div key={p.label}>
              <div style={{ fontSize: 34, fontWeight: 800, color: "#2563EB", letterSpacing: "-1px", marginBottom: 6 }}>{p.value}</div>
              <div style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{p.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#1E3A5F", marginTop: 32 }}>Built at UC Berkeley. Evaluated against real r/Scams cases.</p>
      </section>

      {/* Privacy */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "0 24px 96px", textAlign: "center" }}>
        <div style={{ padding: "28px 32px", borderRadius: 16, background: "rgba(52,211,153,0.03)", border: "1px solid rgba(52,211,153,0.1)", textAlign: "left" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, color: "#34D399", flexShrink: 0, marginTop: 2 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 6 }}>Your data never leaves your device.</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
                We never store payment details, account numbers, or browsing history. Memo text is analyzed in real time and discarded. No PII is ever saved to our servers. Telemetry is opt-in and off by default.{" "}
                <a href="/privacy" style={{ color: "#34D399", textDecoration: "none" }}>Read our privacy policy →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(37,99,235,0.1)", background: "rgba(37,99,235,0.02)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#2563EB", textTransform: "uppercase", marginBottom: 20 }}>For Fintechs & Banks</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.8px", marginBottom: 16, lineHeight: 1.15 }}>
            Built for consumers.<br />Designed for banks.
          </h2>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, maxWidth: 560, margin: "0 auto 16px" }}>
            Nacha's 2026 Phase 2 rules mandate active monitoring for social engineering and false-pretense transfers. Every interception through our consumer extension generates labeled intent signal — the training corpus for a decision-layer security API that no network-side vendor can replicate.
          </p>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
            Memo scoring · Social engineering classification · Cross-channel fraud correlation
          </p>
          {enterpriseSubmitted ? (
            <div style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", color: "#2563EB", fontSize: 14, fontWeight: 600 }}>
              We'll be in touch.
            </div>
          ) : (
            <form onSubmit={handleEnterpriseSubmit} style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto" }}>
              <input
                type="email"
                required
                value={enterpriseEmail}
                onChange={e => setEnterpriseEmail(e.target.value)}
                placeholder="your@company.com"
                style={{ flex: 1, padding: "13px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0", fontSize: 14, outline: "none" }}
              />
              <button type="submit" style={{ padding: "13px 22px", borderRadius: 10, background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                Get early access
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", padding: "24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#1E3A5F" }}>© 2026 Safety Intercept · Built at UC Berkeley · <a href="mailto:safetyintercept@gmail.com" style={{ color: "#1E3A5F", textDecoration: "underline" }}>safetyintercept@gmail.com</a> · <a href="/privacy" style={{ color: "#1E3A5F", textDecoration: "underline" }}>Privacy Policy</a></span>
      </footer>

      {/* Demo modal */}
      <SafetyInterceptModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
