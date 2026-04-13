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

  const reasons = [
    "Someone you've never met is speaking on your family's behalf.",
    "You were asked to keep this secret from the people closest to you.",
    "A medical emergency was created to make you act before you could think.",
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
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
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: "28px 28px 24px",
          boxShadow: "0 0 0 1px rgba(239,68,68,0.12), 0 40px 80px rgba(0,0,0,0.7)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Quiet red dot — no label, no caps */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#EF4444",
            boxShadow: "0 0 8px rgba(239,68,68,0.6)",
          }} />
          <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600, letterSpacing: "0.01em" }}>
            We stopped this payment.
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 21, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 12 }}>
          Don't send this.
        </div>

        {/* Memo */}
        <div style={{
          padding: "12px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 13, color: "#64748B", fontStyle: "italic", lineHeight: 1.6,
          marginBottom: 22,
        }}>
          "for Daniel's hospital stay — nurse Margaret said it's urgent, please don't tell family yet"
        </div>

        {/* Human reasons — no label, no pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {reasons.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", background: "#EF4444",
                marginTop: 6, flexShrink: 0, opacity: 0.7,
              }} />
              <span style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Human closing line */}
        <div style={{
          fontSize: 13, color: "#475569", lineHeight: 1.6,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 16, marginBottom: 22,
        }}>
          This is how these scams work. The urgency is manufactured. The secrecy is a trap.{" "}
          <span style={{ color: "#64748B" }}>Even people who know better fall for them.</span>
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
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444", fontWeight: 600, fontSize: 13, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.13)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
          >
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyInterceptModal;
