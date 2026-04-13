import { useState, useEffect } from "react";
import SafetyInterceptModal from "@/components/SafetyInterceptModal";

const DOWNLOAD_URL = "https://shield-relay.bleblanc.workers.dev/download";

// ─── Luxury Shield Hero (Image Reference) ──────────────────────────────────────
const HERO_IMAGE = "/hero-shield.png";

export default function Index() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ 
      minHeight: "100vh", background: "#050A14", color: "#F8FAFC", 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflowX: "hidden", position: "relative"
    }}>
      
      {/* ── Nav (Minimalist) ── */}
      <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "40px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22, color: "#38BDF8" }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>Safety Intercept</span>
        </div>
        <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{
          fontSize: 14, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.05)",
          padding: "12px 24px", borderRadius: 99, textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)",
          transition: "all 0.4s ease"
        }}>
          Install
        </a>
      </nav>

      {/* ── Hero Segment ── */}
      <main style={{ 
        maxWidth: 1200, margin: "0 auto", padding: "180px 60px 100px", 
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" 
      }}>
        
        <div style={{ position: "relative", width: "100%", maxWidth: 640, aspectRatio: "1/1", marginBottom: -60, zIndex: 1 }}>
          <img 
            src={HERO_IMAGE} 
            alt="Safety Intercept Shield" 
            style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 0 80px rgba(56,189,248,0.15))" }} 
          />
        </div>

        <div style={{ zIndex: 10, position: "relative" }}>
          <h1 style={{ 
            fontSize: "clamp(60px, 10vw, 120px)", fontWeight: 900, letterSpacing: "-0.05em", 
            lineHeight: 0.9, marginBottom: 40, background: "linear-gradient(180deg, #F8FAFC 0%, #475569 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Invisible.
          </h1>

          <p style={{ 
            fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 400, color: "#64748B", 
            maxWidth: 600, margin: "0 auto 60px", lineHeight: 1.6, letterSpacing: "0.01em" 
          }}>
            The luxury of financial certainty. No alerts. No panic. Just an invisible guard patrolling every payment.
          </p>

          <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{
              padding: "20px 48px", borderRadius: 14, background: "#F8FAFC", color: "#050A14",
              fontWeight: 800, fontSize: 16, textDecoration: "none", transition: "all 0.4s ease",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}>
              Begin Protection
            </a>
            <button onClick={() => setModalOpen(true)} style={{
              padding: "20px 32px", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: "#64748B", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.4s ease"
            }}>
              The Intercept →
            </button>
          </div>
        </div>
      </main>

      {/* ── The Manifesto (Condensed) ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "120px 60px", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 80 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Patrol</div>
            <div style={{ fontSize: 15, color: "#64748B", lineHeight: 1.8 }}>
              Safety Intercept connects the signals in your Gmail to the payment context in PayPal. If the patterns match a known scam, the guard intercedes.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Pause</div>
            <div style={{ fontSize: 15, color: "#64748B", lineHeight: 1.8 }}>
              We enforce a 10-second pause on high-risk transfers. Not to stop you, but to break the scammer's momentum and return your focus.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Private</div>
            <div style={{ fontSize: 15, color: "#64748B", lineHeight: 1.8 }}>
              Built at UC Berkeley with privacy-first architecture. All analysis happens locally on your device. Your money remains your business.
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "80px 60px 40px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize: 12, color: "#1E293B", fontWeight: 700, letterSpacing: "0.05em" }}>
          © 2026 SAFETY INTERCEPT • BUILT AT UC BERKELEY • <a href="/privacy" style={{ color: "#1E293B", textDecoration: "none" }}>PRIVACY</a>
        </div>
      </footer>

      <SafetyInterceptModal open={modalOpen} onClose={() => setModalOpen(false)} />
      
      <style>{`
        body { margin: 0; padding: 0; background: #050A14; }
        * { box-sizing: border-box; }
        a:hover, button:hover { opacity: 0.7; transform: translateY(-2px); }
        a:active, button:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}
