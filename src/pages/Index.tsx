import { useState, useEffect, useRef, useCallback } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

// ─── Easter Eggs ─────────────────────────────────────────────────────────────
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

const EGG_MESSAGES = [
  { title: "Pass not through life in silence like cattle.", body: "— Sallust, Bellum Catilinae, Ch. 1. You found a hidden thing. That's not nothing." },
  { title: "Those who had easily endured toil and danger —", body: "— to them leisure and wealth became a burden and a misery. Sallust's warning. Don't forget it when things go well." },
  { title: "All of my time is worth it if I can give one person that feeling.", body: "— Billy LeBlanc, April 5, 2026. That sentence is why this exists." },
  { title: "Life is mundane when you aren't lost.", body: "— Billy LeBlanc. You were curious enough to look for something hidden. You're not lost. Keep going." },
];

function EasterEggToast({ onClose }: { onClose: () => void }) {
  const msg = EGG_MESSAGES[Math.floor(Math.random() * EGG_MESSAGES.length)];
  useEffect(() => {
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, cursor: "pointer",
      background: "linear-gradient(135deg, #131B2E 0%, #0D1526 100%)",
      border: "1px solid rgba(245,158,11,0.35)",
      borderRadius: 16, padding: "18px 24px", maxWidth: 360, width: "calc(100vw - 48px)",
      boxShadow: "0 0 0 1px rgba(245,158,11,0.1), 0 24px 48px rgba(0,0,0,0.7)",
      animation: "eggIn 0.4s cubic-bezier(0.34,1.4,0.64,1)",
    }}>
      <style>{`@keyframes eggIn { from { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.95); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }`}</style>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.3px", marginBottom: 6 }}>{msg.title}</div>
      <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{msg.body}</div>
    </div>
  );
}

function useEasterEgg() {
  const [show, setShow] = useState(false);
  const seq = useRef<string[]>([]);
  const logoClicks = useRef(0);
  const logoTimer = useRef<ReturnType<typeof setTimeout>>();

  const fire = useCallback(() => setShow(true), []);
  const dismiss = useCallback(() => setShow(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.join(",") === KONAMI.join(",")) fire();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire]);

  const onLogoClick = useCallback(() => {
    logoClicks.current += 1;
    clearTimeout(logoTimer.current);
    if (logoClicks.current >= 5) { logoClicks.current = 0; fire(); }
    else { logoTimer.current = setTimeout(() => { logoClicks.current = 0; }, 1800); }
  }, [fire]);

  return { show, dismiss, onLogoClick };
}

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
type DemoPhase = "idle" | "clicking" | "questionnaire" | "intercepted" | "fading";

const DEMO_QUESTIONS = [
  { text: "Someone contacted me and asked me to send this", context: "Real companies and agencies never cold-call you to request a payment." },
  { text: "I've never paid this person or account before", context: "First-time recipients are involved in 80% of payment scams." },
  { text: "I was told to act fast or keep this private", context: "Urgency and secrecy are the #1 tools scammers use — legitimate requests don't need either." },
];

function InterceptDemo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [btnScale, setBtnScale] = useState(1);
  const [cursorX, setCursorX] = useState(68);
  const [cursorY, setCursorY] = useState(16);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [checked, setChecked] = useState([false, false, false]);
  const [fillPct, setFillPct] = useState(100);

  useEffect(() => {
    let dead = false;
    function click(delay: number) {
      setTimeout(() => { if (!dead) setCursorClicking(true); }, delay);
      setTimeout(() => { if (!dead) setCursorClicking(false); }, delay + 180);
    }
    function move(x: number, y: number, delay: number) {
      setTimeout(() => { if (!dead) { setCursorX(x); setCursorY(y); } }, delay);
    }

    function loop() {
      if (dead) return;
      setCursorX(68); setCursorY(16); setPhase("idle");
      setChecked([false, false, false]); setFillPct(100);

      // glide to Send button
      move(50, 88, 700);

      // click Send button
      setTimeout(() => {
        if (dead) return;
        setCursorClicking(true); setBtnScale(0.95); setPhase("clicking");

        setTimeout(() => {
          if (dead) return;
          setCursorClicking(false); setBtnScale(1);
          setPhase("questionnaire");

          // cursor glides to first checkbox (top-left of card, ~12% x, 33% y)
          move(12, 33, 350);
          // click checkbox
          click(850);
          setTimeout(() => { if (!dead) setChecked([true, false, false]); }, 950);

          // cursor glides to continue button (center, ~77% y)
          move(50, 77, 1400);
          // click continue
          click(2000);

          // → warning modal
          setTimeout(() => {
            if (dead) return;
            setPhase("intercepted");

            let fc = 100;
            const iv = setInterval(() => {
              fc = Math.max(0, fc - 100 / 12);
              if (!dead) setFillPct(fc);
              if (fc <= 0) clearInterval(iv);
            }, 1000);

            setTimeout(() => {
              if (dead) return;
              clearInterval(iv);
              setPhase("fading");
              setTimeout(() => { if (!dead) loop(); }, 900);
            }, 4200);
          }, 2700);
        }, 320);
      }, 1700);
    }
    loop();
    return () => { dead = true; };
  }, []);

  const paused = phase !== "idle";
  const overlayVisible = phase === "questionnaire" || phase === "intercepted";
  const showWarning = phase === "intercepted" || phase === "fading";
  const anyChecked = checked.some(Boolean);

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <style>{`@keyframes si-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Browser chrome */}
      <div style={{ background: "#1C1C1E", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FEBC2E" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} />
        <div style={{ flex: 1, marginLeft: 6, padding: "3px 10px", borderRadius: 5, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 5 }}>
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 9, height: 9, opacity: 0.5 }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM2 8a6 6 0 116 6A6 6 0 012 8z" fill="#94A3B8"/></svg>
          <span style={{ fontSize: 10, color: "#64748B" }}>paypal.com/myaccount/transfer/send</span>
        </div>
      </div>

      {/* PayPal page */}
      <div style={{ background: "#F5F7FA", padding: "22px 20px 20px" }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Send Money</div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>paypal.com</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 12px", background: "#fff", borderRadius: 8, border: "1px solid #E5E7EB" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6B7280", flexShrink: 0 }}>G</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Geek Squad Support</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>geeksquad-billing@gmail.com</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#111827", letterSpacing: "-1.5px" }}>$899<span style={{ fontSize: 18, fontWeight: 500 }}>.00</span></div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>USD</div>
        </div>
        <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fff", border: "1px solid #E5E7EB", fontSize: 11, color: "#6B7280", fontStyle: "italic", marginBottom: 14, lineHeight: 1.5 }}>
          geek squad refund — process reversal
        </div>
        <button style={{
          width: "100%", padding: "12px 0", borderRadius: 25, fontWeight: 700, fontSize: 14,
          background: paused ? "rgba(0,112,186,0.1)" : "#0070BA",
          border: paused ? "2px solid rgba(0,112,186,0.25)" : "2px solid transparent",
          color: paused ? "#0070BA" : "#fff",
          transform: `scale(${btnScale})`,
          transition: "transform 0.12s ease, background 0.3s ease, color 0.3s ease",
          cursor: "default",
        }}>
          {paused ? "⏸ Payment paused" : "Send $899.00"}
        </button>
      </div>

      {/* Fake cursor */}
      <div style={{
        position: "absolute", left: `${cursorX}%`, top: `${cursorY}%`,
        transform: `translate(-4px,-4px) scale(${cursorClicking ? 0.75 : 1})`,
        transition: "left 1s cubic-bezier(0.4,0,0.2,1), top 1s cubic-bezier(0.4,0,0.2,1), transform 0.1s ease",
        pointerEvents: "none", zIndex: 60,
        filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
      }}>
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
          <path d="M1 1L1 15.5L4.5 12L7 18L9 17L6.5 11L11 11Z" fill="white" stroke="#1a1a1a" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        opacity: overlayVisible ? 1 : 0,
        transition: "opacity 0.4s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 50,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}>

        {/* Questionnaire */}
        <div style={{
          position: "absolute", left: 14, right: 14,
          top: "46%", transform: phase === "questionnaire" ? "translateY(-50%) scale(1)" : "translateY(calc(-50% + 10px)) scale(0.97)",
          background: "linear-gradient(160deg, #131B2E 0%, #0D1526 100%)",
          borderRadius: 16,
          padding: "14px 14px 10px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          opacity: phase === "questionnaire" ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.34,1.4,0.64,1)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Quick Check</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.4px", lineHeight: 1.3, marginBottom: 8 }}>Before you send.</div>
          {DEMO_QUESTIONS.map((q, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "7px 10px", borderRadius: 10, marginBottom: 5,
              background: checked[i] ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${checked[i] ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`,
              transition: "background 0.15s, border-color 0.15s",
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: checked[i] ? "1.5px solid #F59E0B" : "1.5px solid rgba(255,255,255,0.15)",
                background: checked[i] ? "#F59E0B" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {checked[i] && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div style={{ fontSize: 11, color: checked[i] ? "#F1F5F9" : "#94A3B8", lineHeight: 1.5 }}>{q.text}</div>
            </div>
          ))}
          <button style={{
            width: "100%", padding: "9px", borderRadius: 10, marginTop: 6,
            background: "linear-gradient(135deg, #1a3a60 0%, #0f2040 100%)",
            border: "1px solid rgba(56,189,248,0.3)",
            color: "#38BDF8", fontSize: 12, fontWeight: 700, cursor: "default",
            letterSpacing: "0.02em",
          }}>
            {anyChecked ? "Analyze Payment →" : "Looks fine, continue →"}
          </button>
          <div style={{ textAlign: "center", marginTop: 5 }}>
            <span style={{ fontSize: 10, color: "#334155" }}>Send anyway</span>
          </div>
        </div>

        {/* Warning modal */}
        <div style={{
          position: "absolute", left: 14, right: 14,
          top: "50%", transform: showWarning ? "translateY(-50%) scale(1)" : "translateY(calc(-50% + 10px)) scale(0.97)",
          background: "linear-gradient(160deg, #131B2E 0%, #0D1526 100%)",
          borderRadius: 16,
          padding: "12px 14px 10px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          opacity: showWarning ? 1 : 0,
          transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.4,0.64,1)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FBBF24" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#FBBF24", letterSpacing: "0.1em", textTransform: "uppercase" }}>Caution</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.4px", lineHeight: 1.3, marginBottom: 7 }}>This matches how sophisticated scams work</div>
          <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6, marginBottom: 8 }}>
            Unexpected contact, first-time recipient, artificial urgency. This is how most people lose money to scams. There is no shame in pausing.
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 8 }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "8px 10px", marginBottom: 8 }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 10, color: "#FBBF24", lineHeight: 1.55 }}>You received a scam email from billing@geeksquad-renewal.com 26 min ago. That email and this payment are connected.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              flex: 1, padding: "10px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#94A3B8", fontSize: 11, fontWeight: 600, cursor: "default",
            }}>Go back — stay safe</button>
            <button style={{
              flex: 1, padding: "10px", borderRadius: 12,
              position: "relative", overflow: "hidden",
              background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
              color: "#FBBF24", fontSize: 11, fontWeight: 600, cursor: "default",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: `${fillPct}%`, background: "rgba(245,158,11,0.15)", transition: "right 1s linear" }} />
              <span style={{ position: "relative", zIndex: 1 }}>Take a breath.</span>
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "#334155", textDecoration: "underline", textUnderlineOffset: 3 }}>I know this person — this is legitimate</span>
          </div>
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
  const { show: eggShow, dismiss: eggDismiss, onLogoClick } = useEasterEgg();

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
          <div onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "default", userSelect: "none" }}>
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
              <p style={{ fontSize: 14, fontWeight: 400, color: "#475569", lineHeight: 1.95, marginBottom: 16 }}>
                A Geek Squad charge. A family member in trouble. An IRS penalty due today. Scammers manufacture urgency because urgency bypasses instinct. By the time you realize what's happening, the money is gone.
              </p>
              <p style={{ fontSize: 14, fontWeight: 400, color: "#334155", lineHeight: 1.95 }}>
                We analyze every payment memo for scam patterns — and if a suspicious email arrived first, we connect them. That combination is what the best scams rely on. It's what we're built to catch.
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
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", textTransform: "uppercase" }}>The Pause</span>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.7px", lineHeight: 1.22, marginBottom: 20 }}>
                  "Take a breath."<br />We mean it.
                </h2>
                <p style={{ fontSize: 14, fontWeight: 400, color: "#475569", lineHeight: 1.95, marginBottom: 16 }}>
                  When we flag a payment as high-risk, we don't just warn you. We introduce a deliberate 12-second cooldown before you can proceed. Not to stop you — to break the scammer's trance.
                </p>
                <p style={{ fontSize: 14, fontWeight: 400, color: "#334155", lineHeight: 1.95 }}>
                  Scams operate on momentum. If you have to wait 10 seconds, you think. If you think, you don't send. That pause has saved more money than any alert ever written.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { color: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", label: "Caution", text: "A risk pattern was detected. Review the details before proceeding." },
                  { color: "#3B82F6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)", label: "On Guard", text: "Watching your inbox and your wallet at the same time." },
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
            <h2 style={{ fontSize: 30, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.8px", lineHeight: 1.2, maxWidth: 560, margin: "0 auto 20px" }}>
              We connect the email to the payment. Nobody else does.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#475569", lineHeight: 1.9, maxWidth: 520, margin: "0 auto" }}>
              Scams don't start at the payment screen. They start in your inbox. We read your Gmail for warning signs — fake emergencies, impersonation, pressure to pay fast. If you try to send money shortly after, we connect the dots. That link between the email and the payment is what catches the scam.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { step: "01", title: "Email arrives.", desc: "We read it for scam patterns — fake emergencies, impersonation, pressure to pay. A quiet amber banner drops. We remember it." },
              { step: "02", title: "You go to pay.", desc: "You open PayPal or Zelle. You write the memo. We are already comparing it against the email you received." },
              { step: "03", title: "We step in.", desc: "The patterns match. The payment pauses. You see exactly why. You decide. Your money doesn't move until you do." },
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
                { value: "3",      label: "Platforms covered" },
                { value: "24h",    label: "Memory window" },
                { value: "Free",   label: "Always. No subscription." },
              ].map(p => (
                <div key={p.label}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#3B82F6", letterSpacing: "-1.5px", marginBottom: 8 }}>{p.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#334155", letterSpacing: "0.04em" }}>{p.label}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: 400, color: "#334155", marginTop: 40, letterSpacing: "0.04em" }}>
              <a href="https://www.linkedin.com/in/billy-leblanc/" target="_blank" rel="noreferrer" style={{ color: "#334155", textDecoration: "underline" }}>Built at UC Berkeley</a> · Tested against r/Scams corpus
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
              The fraud detection layer<br />banks can't build themselves.
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#475569", lineHeight: 1.95, maxWidth: 500, margin: "0 auto 48px" }}>
              We call this the <strong style={{ color: "#3B82F6" }}>Intent Layer</strong> — fraud protection that lives at the moment of decision, not after the money moves. Every interception captures the exact language scammers use to manipulate someone into sending. That data is what no bank or network-side vendor can get on their own.
            </p>
            {enterpriseSubmitted ? (
              <div style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", color: "#3B82F6", fontSize: 14, fontWeight: 600 }}>
                We'll be in touch.
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360, margin: "0 auto", alignItems: "center" }}>
                <input
                  type="email" required value={enterpriseEmail}
                  onChange={e => setEnterpriseEmail(e.target.value)}
                  placeholder="work@company.com"
                  style={{ width: "100%", padding: "13px 18px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "inherit", textAlign: "center", letterSpacing: "0.01em" }}
                />
                <button type="submit" style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: "#2563EB", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(37,99,235,0.2)", transition: "all 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 32px rgba(37,99,235,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 24px rgba(37,99,235,0.2)"; }}>
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
          © 2026 Safety Intercept · <a href="https://www.linkedin.com/in/billy-leblanc/" target="_blank" rel="noreferrer" style={{ color: "#1E3A5F", textDecoration: "underline" }}>Built at UC Berkeley</a> ·{" "}
          <a href="mailto:safetyintercept@gmail.com" style={{ color: "#1E3A5F", textDecoration: "underline" }}>safetyintercept@gmail.com</a>
          {" "}·{" "}
          <a href="/privacy" style={{ color: "#1E3A5F", textDecoration: "underline" }}>Privacy Policy</a>
        </span>
      </footer>

      <SafetyInterceptModal open={modalOpen} onClose={() => setModalOpen(false)} />
      {eggShow && <EasterEggToast onClose={eggDismiss} />}
    </div>
  );
}
