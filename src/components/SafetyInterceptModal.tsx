import { useState, useEffect } from "react";

interface SafetyInterceptModalProps {
  open: boolean;
  onClose: () => void;
}

const SafetyInterceptModal = ({ open, onClose }: SafetyInterceptModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) setTimeout(() => setVisible(true), 10);
    else setVisible(false);
  }, [open]);

  if (!open) return null;

  const flags = ["Third-Party Impersonation", "Isolation Tactic", "Medical Urgency"];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: "#0D1526",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "28px 28px 24px",
          boxShadow: "0 0 0 1px rgba(239,68,68,0.15), 0 32px 64px rgba(0,0,0,0.6)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Risk badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 12px", borderRadius: 999,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          marginBottom: 18,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            High Risk Detected
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.5px", marginBottom: 10, lineHeight: 1.2 }}>
          This payment looks like a scam.
        </div>

        {/* Memo */}
        <div style={{
          padding: "12px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          fontSize: 13, color: "#64748B", fontStyle: "italic", lineHeight: 1.55,
          marginBottom: 18,
        }}>
          "for Daniel's hospital stay — nurse Margaret said it's urgent, please don't tell family yet"
        </div>

        {/* Flags */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
          Risk signals
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {flags.map(f => (
            <span key={f} style={{
              fontSize: 12, fontWeight: 600, color: "#CBD5E1",
              padding: "5px 11px", borderRadius: 8,
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
            }}>{f}</span>
          ))}
        </div>

        {/* Score */}
        <div style={{
          padding: "12px 14px", borderRadius: 10,
          background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)",
          fontSize: 13, color: "#94A3B8", lineHeight: 1.55,
          marginBottom: 24,
        }}>
          Risk score: <strong style={{ color: "#EF4444" }}>94 / 100</strong>
          <span style={{ color: "#475569" }}> · Even experts fall for these. Take a breath.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 12,
              background: "transparent", border: "1px solid rgba(56,189,248,0.25)",
              color: "#38BDF8", fontWeight: 700, fontSize: 14, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(56,189,248,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Go back — stay safe
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 12,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#EF4444", fontWeight: 600, fontSize: 13, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
          >
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyInterceptModal;
