import { useState, useEffect, useRef } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function useReveal(threshold = 0.1) {
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
      transition: `opacity 0.75s ease-out ${delay}ms, transform 0.75s ease-out ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Animated Intercept Demo ──────────────────────────────────────────────────
type DemoPhase = "idle" | "clicking" | "intercepted" | "fading";

function InterceptDemo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [cooldown, setCooldown] = useState(10);
  const [btnScale, setBtnScale] = useState(1);

  useEffect(() => {
    if (phase !== "idle") return;
    const timers = [
      setTimeout(() => { setBtnScale(0.95); setPhase("clicking"); }, 2400),
      setTimeout(() => { setBtnScale(1); setPhase("intercepted"); setCooldown(10); }, 2900),
      setTimeout(() => setPhase("fading"), 7200),
      setTimeout(() => { setPhase("idle"); setCooldown(10); }, 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "intercepted") return;
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, cooldown]);

  const intercepted = phase === "intercepted" || phase === "fading";
  const modalVisible = phase === "intercepted";

  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "#080F1E", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Payment form */}
      <div style={{ padding: "28px 24px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>PayPal · Send Money</div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-2px" }}>$899</span>
        </div>
        <div style={{ padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#334155", fontStyle: "italic", marginBottom: 20, lineHeight: 1.5 }}>
          "geek squad refund — process reversal"
        </div>
        <button style={{
          width: "100%", padding: "13px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
          background: intercepted ? "rgba(59,130,246,0.1)" : "#2563EB",
          border: intercepted ? "1px solid rgba(59,130,246,0.2)" : "none",
          color: intercepted ? "#3B82F6" : "#fff",
          transform: `scale(${btnScale})`,
          transition: "transform 0.1s ease, background 0.3s ease, color 0.3s ease",
          boxShadow: intercepted ? "none" : "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px rgba(37,99,235,0.3)",
          cursor: "default",
        }}>
          {intercepted ? "Payment paused" : "Send Money"}
        </button>
      </div>

      {/* Vault-door overlay */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 18,
        background: "rgba(5,10,20,0.9)",
        backdropFilter: modalVisible ? "blur(10px)" : "blur(0px)",
        WebkitBackdropFilter: modalVisible ? "blur(10px)" : "blur(0px)",
        opacity: modalVisible ? 1 : 0,
        transition: "opacity 0.5s ease, backdrop-filter 0.5s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, pointerEvents: modalVisible ? "auto" : "none",
      }}>
        <div style={{
          width: "100%", background: "linear-gradient(160deg, #131B2E 0%, #0D1526 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "22px 20px",
          boxShadow: "0 0 0 1px rgba(245,158,11,0.1), 0 32px 64px rgba(0,0,0,0.8)",
          transform: modalVisible ? "translateY(0) scale(1)" : "translateY(-16px) scale(0.97)",
          transition: "transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)",
        }}>
          {/* Amber caution pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", marginBottom: 14 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 6px rgba(245,158,11,0.5)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", textTransform: "uppercase" }}>Caution · Review Required</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.3px", marginBottom: 8, lineHeight: 1.25 }}>Take a breath.</div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, marginBottom: 14 }}>
            You received a suspicious email 14 minutes ago. Your payment memo matches it. We've seen this pattern before.
          </div>
          {cooldown > 0 && (
            <div style={{ fontSize: 11, color: "#334155", marginBottom: 14 }}>
              Proceed available in <span style={{ color: "#F59E0B", fontWeight: 700 }}>{cooldown}s</span>
            </div>
          )}
          <button style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg, #1a3a60 0%, #0f2040 100%)", border: "1px solid rgba(59,130,246,0.3)", color: "#3B82F6", fontWeight: 700, fontSize: 13, cursor: "default" }}>
            Go back — stay safe
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "65%", height: "55%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(37,99,235,0.055) 0%, transparent 68%)" }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,12,26,0.94)", backdropFilter: "blur(14px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 19, height: 19, color: "#3B82F6" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9", letterSpacing: "-0.3px" }}>Safety<span style={{ color: "#3B82F6" }}>Intercept</span></span>
          </div>
          <a
            href={DOWNLOAD_URL} target="_blank" rel="noreferrer"
            style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "#2563EB", padding: "8px 18px", borderRadius: 8, textDecoration: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)", transition: "all 0.3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 18px rgba(37,99,235,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15)"; }}
          >
            Install Free
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "140px 24px 120px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 13px", borderRadius: 999, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 10, fontWeight: 700, color: "#F59E0B", marginBottom: 36, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 6px rgba(245,158,11,0.5)" }} />
          Free · PayPal · Zelle · Gmail
        </div>

        <h1 style={{ fontSize: "clamp(42px, 6.5vw, 74px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-2.5px", color: "#F8FAFC", marginBottom: 28 }}>
          Stop scams before<br />you send money.
        </h1>

        <p style={{ fontSize: 18, fontWeight: 400, color: "#64748B", lineHeight: 1.85, maxWidth: 460, margin: "0 auto 52px", letterSpacing: "0.005em" }}>
          Real-time fraud protection for PayPal and Zelle. Intercepts at the Send button — before your money moves.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <a
            href={DOWNLOAD_URL} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 34px", borderRadius: 12, background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(37,99,235,0.28)", transition: "all 0.3s ease", letterSpacing: "-0.01em" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 40px rgba(37,99,235,0.55)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(37,99,235,0.28)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Add to Chrome — Free
          </a>
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569", fontWeight: 500, fontSize: 14, cursor: "pointer", transition: "all 0.3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94A3B8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#475569"; }}
          >
            See it in action →
          </button>
        </div>
      </section>

      {/* ── The Narrative ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "0 24px 140px" }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 24 }}>The threat pattern</div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.7px", lineHeight: 1.22, marginBottom: 24 }}>
                Scams don't look like scams.<br />They look like emergencies.
              </h2>
              <p style={{ fontSize: 14, fontWeight: 400, color: "#475569", lineHeight: 1.95 }}>
                A Geek Squad charge. A family member in trouble. An IRS penalty due today. Scammers manufacture urgency because urgency bypasses instinct. By the time you realize what's happening, the money is gone.
              </p>
            </div>
            <div style={{ maxWidth: 320 }}>
              <InterceptDemo />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Take a Breath ── */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "88px 24px" }}>
          <Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 24 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", textTransform: "uppercase" }}>The Cooldown Protocol</span>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.7px", lineHeight: 1.22, marginBottom: 20 }}>
                  "Take a breath."<br />We mean it.
                </h2>
                <p style={{ fontSize: 14, fontWeight: 400, color: "#475569", lineHeight: 1.95, marginBottom: 16 }}>
                  When we flag a payment as high-risk, we don't just warn you. We introduce a deliberate 10-second cooldown before you can proceed. Not to stop you — to break the scammer's trance.
                </p>
                <p style={{ fontSize: 14, fontWeight: 400, color: "#334155", lineHeight: 1.95 }}>
                  Scams operate on momentum. If you have to wait 10 seconds, you think. If you think, you don't send. That pause has saved more money than any alert ever written.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { color: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", label: "Caution", text: "A risk pattern was detected. Review the details before proceeding." },
                  { color: "#3B82F6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)", label: "System Active", text: "Cross-layer correlation is running. Email and payment contexts are being linked." },
                  { color: "#34D399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.2)", label: "Clear", text: "No scam signals detected. Your payment guard is patrolling silently." },
                ].map(s => (
                  <div key={s.label} style={{ padding: "16px 18px", borderRadius: 12, background: s.bg, border: `1px solid ${s.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: "#475569", lineHeight: 1.7 }}>{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Cross-Layer ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "96px 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>The moat</div>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.8px", lineHeight: 1.2, maxWidth: 560, margin: "0 auto 20px" }}>
              We connect the email to the payment. Nobody else does.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#475569", lineHeight: 1.9, maxWidth: 520, margin: "0 auto" }}>
              Scams don't start at the payment screen. They start in your inbox. Our anti-phishing AI reads Gmail for social engineering signals, records the threat, then correlates it when you open PayPal 14 minutes later. That connection is the fingerprint. It's the proof. And it's ours alone.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { step: "01", title: "Email arrives.", desc: "Our anti-phishing AI reads the scam signal in Gmail. A quiet amber banner drops. The threat signature is stored locally." },
              { step: "02", title: "You go to pay.", desc: "You open PayPal or Zelle. You write the memo. We are already comparing it against the email you received." },
              { step: "03", title: "We interdict.", desc: "The patterns match. The vault door closes. You see why. You decide. Your money doesn't move until you do." },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 100}>
                <div style={{ padding: "26px 24px 30px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "border-color 0.3s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#334155", letterSpacing: "0.1em", marginBottom: 16 }}>{s.step}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#CBD5E1", marginBottom: 10, letterSpacing: "-0.2px" }}>{s.title}</div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: "#334155", lineHeight: 1.85 }}>{s.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Proof ── */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
        <Reveal>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, textAlign: "center" }}>
              {[
                { value: "$15.9B", label: "Lost to fraud in the US in 2025" },
                { value: "3",      label: "Surfaces patrolled" },
                { value: "24h",    label: "Correlation window" },
                { value: "Free",   label: "Always. No subscription." },
              ].map(p => (
                <div key={p.label}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#3B82F6", letterSpacing: "-1.5px", marginBottom: 8 }}>{p.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#334155", letterSpacing: "0.04em" }}>{p.label}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: 400, color: "#334155", marginTop: 40, letterSpacing: "0.04em" }}>
              Built at UC Berkeley · Evaluated against real r/Scams cases
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Privacy ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "80px 24px" }}>
        <Reveal>
          <div style={{ padding: "30px 32px", borderRadius: 16, background: "rgba(52,211,153,0.025)", border: "1px solid rgba(52,211,153,0.1)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 17, height: 17, color: "#34D399", flexShrink: 0, marginTop: 3 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>No payment details stored. Ever.</div>
                <div style={{ fontSize: 13, fontWeight: 400, color: "#1E3A5F", lineHeight: 1.9 }}>
                  To run AI fraud analysis, memo text is sent through our Cloudflare relay to Anthropic and discarded immediately — never stored. No account numbers, no browsing history, no PII saved. Telemetry is opt-in and off by default.{" "}
                  <a href="/privacy" style={{ color: "#34D399", textDecoration: "none" }}>Full details in our privacy policy →</a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Enterprise ── */}
      <section style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(59,130,246,0.08)", background: "rgba(37,99,235,0.015)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "104px 24px", textAlign: "center" }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "#3B82F6", textTransform: "uppercase", marginBottom: 24 }}>For Fintechs & Banks</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-1px", marginBottom: 18, lineHeight: 1.12 }}>
              Infrastructure first.<br />Consumer second.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#475569", lineHeight: 1.95, maxWidth: 520, margin: "0 auto 48px" }}>
              Every consumer interception generates labeled intent signal — the exact linguistic coercion in the seconds before an abandoned fraudulent payment. That corpus is what no network-side vendor can replicate.
            </p>
            {enterpriseSubmitted ? (
              <div style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", color: "#3B82F6", fontSize: 14, fontWeight: 600 }}>
                We'll be in touch.
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto" }}>
                <input
                  type="email" required value={enterpriseEmail}
                  onChange={e => setEnterpriseEmail(e.target.value)}
                  placeholder="your@company.com"
                  style={{ flex: 1, padding: "13px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                />
                <button type="submit" style={{ padding: "13px 22px", borderRadius: 10, background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)", transition: "all 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px rgba(37,99,235,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15)"; }}>
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

      <SafetyInterceptModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
