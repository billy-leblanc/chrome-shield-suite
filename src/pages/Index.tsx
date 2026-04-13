import { useState, useEffect, useRef, useCallback } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Margaret Animated Demo ───────────────────────────────────────────────────
type DemoPhase = "idle" | "clicking" | "intercepted" | "fading";

function MargaretDemo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [btnScale, setBtnScale] = useState(1);

  useEffect(() => {
    const schedule = [
      { delay: 2200,  fn: () => { setPhase("clicking"); setBtnScale(0.95); } },
      { delay: 2600,  fn: () => { setPhase("intercepted"); setBtnScale(1); } },
      { delay: 6800,  fn: () => setPhase("fading") },
      { delay: 7600,  fn: () => setPhase("idle") },
    ];
    const timers = schedule.map(({ delay, fn }) => setTimeout(fn, delay));
    return () => timers.forEach(clearTimeout);
  }, [phase === "idle" ? "idle" : null]);

  // Restart loop when idle resets
  useEffect(() => {
    if (phase !== "idle") return;
    const t = setTimeout(() => setPhase("idle"), 100);
    return () => clearTimeout(t);
  }, [phase]);

  const intercepted = phase === "intercepted" || phase === "fading";
  const modalVisible = phase === "intercepted";

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#0A1628", border: "1px solid rgba(255,255,255,0.06)", padding: "32px 28px 28px" }}>
      {/* PayPal-like UI shell */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Send Money · PayPal</div>
        {/* Amount */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 42, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-2px" }}>$899</span>
        </div>
        {/* Memo */}
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#475569", fontStyle: "italic", marginBottom: 20, lineHeight: 1.5 }}>
          "geek squad refund — please process reversal"
        </div>
        {/* Recipient */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#334155" }}>?</div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B" }}>To: GeekSquad-Refunds@gmail.com</div>
            <div style={{ fontSize: 10, color: "#1E3A5F" }}>First time sending to this recipient</div>
          </div>
        </div>
        {/* Send button */}
        <button
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10,
            background: intercepted ? "rgba(37,99,235,0.15)" : "#2563EB",
            border: intercepted ? "1px solid rgba(37,99,235,0.2)" : "none",
            color: intercepted ? "#2563EB" : "#fff",
            fontWeight: 700, fontSize: 14, cursor: "default",
            transform: `scale(${btnScale})`,
            transition: "transform 0.1s ease, background 0.3s ease, color 0.3s ease",
            boxShadow: intercepted ? "none" : "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px rgba(37,99,235,0.35)",
          }}
        >
          {intercepted ? "Payment paused" : "Send Money"}
        </button>
      </div>

      {/* Vault-door intercept modal */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: "rgba(6,12,26,0.88)",
        backdropFilter: modalVisible ? "blur(8px)" : "blur(0px)",
        WebkitBackdropFilter: modalVisible ? "blur(8px)" : "blur(0px)",
        opacity: modalVisible ? 1 : 0,
        transition: "opacity 0.45s ease, backdrop-filter 0.45s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, pointerEvents: modalVisible ? "auto" : "none",
      }}>
        <div style={{
          width: "100%", background: "#0D1526",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "24px 22px",
          boxShadow: "0 0 0 1px rgba(239,68,68,0.1), 0 32px 64px rgba(0,0,0,0.8)",
          transform: modalVisible ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.96)",
          transition: "transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)",
        }}>
          {/* Red dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }} />
            <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>We stopped this payment.</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.4px", marginBottom: 10, lineHeight: 1.25 }}>Don't send this.</div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, marginBottom: 14 }}>
            You received a suspicious email 14 minutes ago. Your payment memo matches it exactly. This is the pattern of a coordinated scam.
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
            A "Geek Squad refund" scam email arrived in Gmail at 2:14 PM · You are now on a call with the sender.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Glass Button shared style helper ────────────────────────────────────────
const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "15px 34px", borderRadius: 12,
  background: "#2563EB", color: "#fff",
  fontWeight: 700, fontSize: 15,
  textDecoration: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(37,99,235,0.28)",
  transition: "all 0.3s ease",
  border: "none", cursor: "pointer",
  letterSpacing: "-0.01em",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "We read the email before you open your wallet.",
    desc: "If you've received a suspicious PayPal scam email or a Zelle fraud request, we flag it the moment it arrives — before you call back, before you click, before you send a cent.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "We stop you before you hit Send.",
    desc: "When you go to send money on PayPal or Zelle, we intercept the button — locally, in your browser, never touching your account. We score the memo and pause if something looks wrong.",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "We connect what you didn't notice.",
    desc: "A Zelle scam doesn't start at the payment screen. It starts with an email. We link the two — if a suspicious message arrived in the last 24 hours and you're now sending money, we catch that pattern.",
  },
];

const STEPS = [
  { n: "01", label: "A scam email arrives.", detail: "We read it in your Gmail tab and drop a quiet banner. The flag is invisible to the scammer — and impossible to miss for you." },
  { n: "02", label: "You go to pay someone.", detail: "You open PayPal or Zelle, enter the amount, write the memo. We are already there. Before anything sends, we step in." },
  { n: "03", label: "We stop it.", detail: "The email, the memo, the timing — connected. We show you exactly what we found and let you decide. Your money stays in your account." },
];

const PROOF = [
  { value: "$15.9B", label: "Lost to fraud in the US in 2025" },
  { value: "3",      label: "Surfaces protected" },
  { value: "24h",    label: "Correlation window — email to payment" },
  { value: "Free",   label: "Always. No subscription." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [modalOpen, setModalOpen] = useState(false);
  const [enterpriseEmail, setEnterpriseEmail] = useState("");
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);
  const [primaryHover, setPrimaryHover] = useState(false);

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enterpriseEmail.trim()) {
      window.location.href = `mailto:safetyintercept@gmail.com?subject=Enterprise%20Inquiry&body=Email%3A%20${encodeURIComponent(enterpriseEmail)}`;
      setEnterpriseSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060C1A", color: "#E2E8F0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', overflowX: "hidden" }}>

      {/* Ambient background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "55%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 68%)" }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,12,26,0.92)", backdropFilter: "blur(14px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 19, height: 19, color: "#2563EB" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9", letterSpacing: "-0.3px" }}>
              Safety<span style={{ color: "#2563EB" }}>Intercept</span>
            </span>
          </div>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 13, fontWeight: 600, color: "#fff",
              background: "#2563EB", padding: "8px 18px", borderRadius: 8,
              textDecoration: "none",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 18px rgba(37,99,235,0.45)"; e.currentTarget.style.opacity = "0.92"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15)"; e.currentTarget.style.opacity = "1"; }}
          >
            Install Free
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "112px 24px 96px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)", fontSize: 10, fontWeight: 700, color: "#2563EB", marginBottom: 40, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          The Intent Layer
        </div>

        <h1 style={{ fontSize: "clamp(40px, 6.5vw, 72px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-2.5px", color: "#F8FAFC", marginBottom: 24 }}>
          Stop scams before<br />you send money.
        </h1>

        <p style={{ fontSize: 18, fontWeight: 400, color: "#64748B", lineHeight: 1.85, maxWidth: 500, margin: "0 auto 14px", letterSpacing: "0.01em" }}>
          The world's first intent-layer agent that analyzes <em style={{ color: "#94A3B8" }}>why</em> you're sending money — not just where it's going.
        </p>

        <p style={{ fontSize: 14, fontWeight: 400, color: "#334155", lineHeight: 1.9, maxWidth: 540, margin: "0 auto 48px", letterSpacing: "0.01em" }}>
          Most fraud protection catches bad transactions. We catch bad decisions — before they happen. If you've received a PayPal scam email or a Zelle fraud request, we're already watching.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 16 }}>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              ...primaryBtn,
              boxShadow: primaryHover
                ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 36px rgba(37,99,235,0.55)"
                : "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(37,99,235,0.28)",
              transform: primaryHover ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Add to Chrome — Free
          </a>
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B", fontWeight: 500, fontSize: 14, cursor: "pointer", transition: "all 0.3s ease", letterSpacing: "0.01em" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#94A3B8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#64748B"; }}
          >
            See it intercept a scam →
          </button>
        </div>
        <p style={{ fontSize: 11, fontWeight: 400, color: "#1E3A5F", letterSpacing: "0.04em", marginBottom: 44 }}>
          Chrome Web Store review in progress · Install the beta now
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {["PayPal", "Wells Fargo + Zelle", "Gmail"].map(p => (
            <span key={p} style={{ fontSize: 11, fontWeight: 600, color: "#1E3A5F", padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)", letterSpacing: "0.04em" }}>{p}</span>
          ))}
        </div>
      </section>

      {/* ── Margaret Demo ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px 104px" }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
            {/* Left: story */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>A real scenario</div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.6px", lineHeight: 1.25, marginBottom: 20 }}>
                Margaret clicks Send.<br />We stop her.
              </h2>
              <p style={{ fontSize: 14, fontWeight: 400, color: "#475569", lineHeight: 1.9, marginBottom: 14 }}>
                She received an email: her Geek Squad subscription renewed for $899. She called the number. The agent told her to log into PayPal and send a "refund."
              </p>
              <p style={{ fontSize: 14, fontWeight: 400, color: "#334155", lineHeight: 1.9 }}>
                The email arrived 14 minutes ago. Her payment memo matched it. The pattern was exact.
                <span style={{ color: "#94A3B8" }}> Her money never moved.</span>
              </p>
            </div>
            {/* Right: animated demo */}
            <div style={{ maxWidth: 340 }}>
              <MargaretDemo />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Features ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 104px" }}>
        <Reveal>
          <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 48 }}>How it works</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div
                style={{ height: "100%", padding: "30px 28px 34px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "border-color 0.3s ease, box-shadow 0.3s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.22)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 32px rgba(37,99,235,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", marginBottom: 22 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#CBD5E1", marginBottom: 12, lineHeight: 1.35, letterSpacing: "-0.2px" }}>{f.title}</h3>
                <p style={{ fontSize: 13, fontWeight: 400, color: "#334155", lineHeight: 1.85 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Three moments ── */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 24px" }}>
          <Reveal>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#E2E8F0", textAlign: "center", marginBottom: 64, letterSpacing: "-0.8px" }}>Three moments. One outcome.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 48 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#1E3A5F", letterSpacing: "0.1em", paddingTop: 4, flexShrink: 0, width: 28 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8", marginBottom: 10, letterSpacing: "-0.1px" }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 400, color: "#334155", lineHeight: 1.85 }}>{s.detail}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof bar ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <Reveal>
          <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 48 }}>The problem is real</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, textAlign: "center" }}>
            {PROOF.map(p => (
              <div key={p.label}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#2563EB", letterSpacing: "-1.5px", marginBottom: 8 }}>{p.value}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#1E3A5F", letterSpacing: "0.04em" }}>{p.label}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 11, fontWeight: 400, color: "#1E3A5F", marginTop: 40, letterSpacing: "0.04em" }}>
            Built at UC Berkeley · Evaluated against real r/Scams cases
          </p>
        </Reveal>
      </section>

      {/* ── Privacy ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "0 24px 104px" }}>
        <Reveal>
          <div style={{ padding: "28px 32px", borderRadius: 16, background: "rgba(52,211,153,0.025)", border: "1px solid rgba(52,211,153,0.1)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 17, height: 17, color: "#34D399", flexShrink: 0, marginTop: 3 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 8, letterSpacing: "-0.1px" }}>Your data never leaves your device.</div>
                <div style={{ fontSize: 13, fontWeight: 400, color: "#1E3A5F", lineHeight: 1.9 }}>
                  We never store payment details, account numbers, or browsing history. Memo text is analyzed in real time and discarded. No PII is ever saved to our servers. Telemetry is opt-in and off by default.{" "}
                  <a href="/privacy" style={{ color: "#34D399", textDecoration: "none" }}>Read our privacy policy →</a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Enterprise ── */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(37,99,235,0.08)", background: "rgba(37,99,235,0.015)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "104px 24px", textAlign: "center" }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "#2563EB", textTransform: "uppercase", marginBottom: 22 }}>For Fintechs & Banks</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-1px", marginBottom: 18, lineHeight: 1.12 }}>
              Built for consumers.<br />Designed for banks.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#334155", lineHeight: 1.9, maxWidth: 540, margin: "0 auto 14px" }}>
              Nacha's 2026 Phase 2 rules mandate active monitoring for social engineering and false-pretense transfers. Every interception through our consumer extension generates labeled intent signal — the training corpus for a decision-layer security API that no network-side vendor can replicate.
            </p>
            <p style={{ fontSize: 12, fontWeight: 400, color: "#1E3A5F", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 44px", letterSpacing: "0.04em" }}>
              Memo scoring · Social engineering classification · Cross-channel fraud correlation
            </p>
            {enterpriseSubmitted ? (
              <div style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)", color: "#2563EB", fontSize: 14, fontWeight: 600 }}>
                We'll be in touch.
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto" }}>
                <input
                  type="email"
                  required
                  value={enterpriseEmail}
                  onChange={e => setEnterpriseEmail(e.target.value)}
                  placeholder="your@company.com"
                  style={{ flex: 1, padding: "13px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "13px 22px", borderRadius: 10,
                    background: "#2563EB", border: "none", color: "#fff",
                    fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px rgba(37,99,235,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15)"; }}
                >
                  Get early access
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", padding: "28px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 400, color: "#1E3A5F", letterSpacing: "0.04em" }}>
          © 2026 Safety Intercept · Built at UC Berkeley ·{" "}
          <a href="mailto:safetyintercept@gmail.com" style={{ color: "#1E3A5F", textDecoration: "underline" }}>safetyintercept@gmail.com</a>
          {" "}·{" "}
          <a href="/privacy" style={{ color: "#1E3A5F", textDecoration: "underline" }}>Privacy Policy</a>
        </span>
      </footer>

      {/* Demo modal */}
      <SafetyInterceptModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
