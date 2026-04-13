import { useState, useEffect } from "react";

interface SafetyInterceptModalProps {
  open: boolean;
  onClose: () => void;
}

const SafetyInterceptModal = ({ open, onClose }: SafetyInterceptModalProps) => {
  const [visible, setVisible] = useState(false);
  const [cooldown, setCooldown] = useState(12);

  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10);
      setCooldown(12);
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, cooldown]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <style>{`@keyframes callout-pulse { 0% { box-shadow: 0 0 0 0 rgba(251,191,36,0.35); } 60% { box-shadow: 0 0 0 7px rgba(251,191,36,0); } 100% { box-shadow: none; } }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360,
          background: "linear-gradient(160deg, #131B2E 0%, #0D1526 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "28px 24px 24px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Amber caution badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 99,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          marginBottom: 16,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 6px rgba(245,158,11,0.6)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#FBBF24", letterSpacing: "0.1em", textTransform: "uppercase" }}>Caution</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.4px", lineHeight: 1.3, marginBottom: 12 }}>
          This matches how sophisticated scams work
        </div>

        {/* Narrative */}
        <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 20 }}>
          This request involves an unexpected contact, a first-time recipient and an artificial sense of urgency. This is how most people lose money to scams. There is no shame in pausing — that instinct could save you thousands.
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

        {/* Cross-layer correlation callout */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 20,
          animation: "callout-pulse 1.4s ease-out 0.45s 1",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <span style={{ fontSize: 12, color: "#FBBF24", lineHeight: 1.5 }}>
            You received a suspicious email from billing@geeksquad-renewal.com 26 minutes ago. That email and this payment are connected. This is how coordinated scams work.
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 12,
              background: "linear-gradient(135deg, #1a3a60 0%, #0f2040 100%)",
              border: "1px solid rgba(56,189,248,0.3)",
              color: "#38BDF8", fontWeight: 700, fontSize: 13, cursor: "pointer",
              letterSpacing: "0.01em", transition: "opacity 0.15s, transform 0.08s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            Go back — stay safe
          </button>
          <button
            onClick={cooldown > 0 ? undefined : onClose}
            disabled={cooldown > 0}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 12,
              position: "relative", overflow: "hidden",
              background: "rgba(245,158,11,0.04)",
              border: `1px solid rgba(245,158,11,${cooldown > 0 ? 0.15 : 0.4})`,
              color: cooldown > 0 ? "#64748B" : "#FBBF24",
              fontWeight: 600, fontSize: 13,
              cursor: cooldown > 0 ? "not-allowed" : "pointer",
              transition: "color 0.3s, border-color 0.3s, transform 0.08s ease",
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            {/* Fill sweep */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${((12 - cooldown) / 12) * 100}%`,
              background: "linear-gradient(90deg, rgba(245,158,11,0.14), rgba(251,191,36,0.08))",
              transition: "width 1s linear",
              borderRadius: "inherit",
            }} />
            <span style={{ position: "relative", zIndex: 1 }}>
              {cooldown > 0 ? "Take a breath." : "I understand — proceed"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyInterceptModal;
