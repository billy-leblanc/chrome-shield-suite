import { useState } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

const PLATFORMS = ["PayPal", "Wells Fargo + Zelle", "Gmail"];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "We read the email before you open your wallet.",
    desc: "Scams start in your inbox. We watch for the fake emergency, the impersonation, the pressure to act fast. When we see it, we flag it — before you ever think about sending money.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "We stop you before you hit Send.",
    desc: "When you go to pay someone on PayPal or Zelle, we're already there. We check the memo, score the risk, and if something looks wrong, we pause the payment and tell you why.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "We connect what you didn't notice.",
    desc: "You got an email two hours ago. Now you're sending money. We connect those two moments — because that sequence, email then payment, is the fingerprint of a coordinated scam.",
  },
];

const STEPS = [
  { n: "01", label: "A scam email arrives.", detail: "We read it in your Gmail tab and drop a quiet banner: 'Social Engineering Detected.' You see it. Most people don't — and that's when they get hurt." },
  { n: "02", label: "You go to pay someone.", detail: "You open PayPal, enter the amount, write the memo. We're already there. Before anything sends, we step in and ask three questions." },
  { n: "03", label: "We stop it.", detail: "The email, the memo, the timing — connected. We show you exactly what we found and let you decide. Your money stays in your account." },
];

const PROOF = [
  { value: "7", label: "Scam types detected" },
  { value: "3", label: "Surfaces protected" },
  { value: "$10B+", label: "Lost to scams in the US last year" },
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.18)", fontSize: 11, fontWeight: 700, color: "#38BDF8", marginBottom: 36, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Real-Time Scam Interception Layer
        </div>

        <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-2px", color: "#F8FAFC", marginBottom: 28 }}>
          Someone should be<br />on your side.
        </h1>

        <p style={{ fontSize: 18, color: "#94A3B8", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 16px", fontWeight: 400 }}>
          A free Chrome extension that reads your email, watches your payments, and steps in before it's too late. Built by a student who got tired of watching good people lose everything to scams.
        </p>

        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 44px" }}>
          Most fraud protection catches bad transactions. We catch bad decisions — before they happen. On PayPal and Zelle, in your inbox, in the moment you're most vulnerable.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 16 }}>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 12, background: "#38BDF8", color: "#0D1526", fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 0 24px rgba(56,189,248,0.25)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 36px rgba(56,189,248,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 24px rgba(56,189,248,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Download
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
        <p style={{ fontSize: 12, color: "#334155", marginBottom: 36 }}>Chrome Web Store review in progress — download the beta to try it now</p>

        {/* Platform badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {PLATFORMS.map(p => (
            <span key={p} style={{ fontSize: 12, fontWeight: 600, color: "#64748B", padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>{p}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 40 }}>How it works</p>
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
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#F1F5F9", textAlign: "center", marginBottom: 56, letterSpacing: "-0.5px" }}>Three moments. One outcome.</h2>
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
        <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 32 }}>The problem is real</p>
        <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 8 }}>Built at UC Berkeley. Evaluated against real r/Scams cases.</p>
      </section>

      {/* Enterprise section */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(56,189,248,0.12)", background: "rgba(56,189,248,0.03)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#38BDF8", textTransform: "uppercase", marginBottom: 20 }}>For Fintechs & Neobanks</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.8px", marginBottom: 16, lineHeight: 1.15 }}>
            Built for consumers.<br />Designed for banks.
          </h2>
          <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.75, marginBottom: 28, maxWidth: 560, margin: "0 auto 28px" }}>
            Every time we stop a scam, we learn something. That signal — memo patterns, email fingerprints, timing — is becoming an API for fintechs and banks that want to protect their users at the moment a decision is made.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 44, flexWrap: "wrap" }}>
            {[
              "Transaction memo scoring",
              "Social engineering classification",
              "Cross-channel fraud correlation",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#38BDF8", flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
          {enterpriseSubmitted ? (
            <div style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", color: "#38BDF8", fontSize: 14, fontWeight: 600 }}>
              We'll be in touch. Thank you.
            </div>
          ) : (
            <form onSubmit={handleEnterpriseSubmit} style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto" }}>
              <input
                type="email"
                required
                value={enterpriseEmail}
                onChange={e => setEnterpriseEmail(e.target.value)}
                placeholder="your@company.com"
                style={{ flex: 1, padding: "13px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#E2E8F0", fontSize: 14, outline: "none" }}
              />
              <button type="submit" style={{ padding: "13px 22px", borderRadius: 10, background: "#38BDF8", border: "none", color: "#0D1526", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                Get early access
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#334155" }}>© 2026 Safety Intercept · Built at UC Berkeley · safetyintercept@gmail.com · <a href="/privacy" style={{ color: "#334155", textDecoration: "underline" }}>Privacy Policy</a></span>
      </footer>

      {/* Demo modal */}
      <SafetyInterceptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
