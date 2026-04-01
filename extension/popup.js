import React from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom@19/client";

const { useState, useEffect, useCallback } = React;
const h = React.createElement;

/* ─── Safety Intercept Modal ─── */
function SafetyInterceptModal({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return h("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center modal-backdrop",
    onClick: onClose,
  },
    h("div", {
      className: "modal-card bg-surface-raised border border-border-subtle rounded-2xl p-6 mx-4 w-full max-w-sm",
      onClick: (e) => e.stopPropagation(),
    },
      /* Icon + Title */
      h("div", { className: "flex items-center gap-3 mb-4" },
        h("div", { className: "w-10 h-10 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center" },
          h("svg", { className: "w-5 h-5 text-accent-red", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
            h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" })
          )
        ),
        h("h3", { className: "text-base font-semibold text-text-primary tracking-tight" }, title || "Safety Intercept")
      ),
      h("p", { className: "text-text-secondary text-sm leading-relaxed mb-6" }, message || "This action may pose a security risk."),
      h("div", { className: "flex gap-3" },
        h("button", {
          onClick: onClose,
          className: "flex-1 px-4 py-2.5 rounded-xl bg-surface-overlay text-text-secondary text-sm font-medium hover:bg-border-subtle transition-smooth cursor-pointer"
        }, "Cancel"),
        h("button", {
          onClick: () => { onConfirm?.(); onClose(); },
          className: "flex-1 px-4 py-2.5 rounded-xl bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/85 transition-smooth cursor-pointer"
        }, "Proceed Anyway")
      )
    )
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, color, icon }) {
  const styles = {
    cyan: { text: "text-accent-cyan", bg: "bg-accent-cyan/8", border: "border-accent-cyan/15" },
    green: { text: "text-accent-green", bg: "bg-accent-green/8", border: "border-accent-green/15" },
    amber: { text: "text-accent-amber", bg: "bg-accent-amber/8", border: "border-accent-amber/15" },
    red: { text: "text-accent-red", bg: "bg-accent-red/8", border: "border-accent-red/15" },
  };
  const s = styles[color];
  return h("div", { className: `card-elevated bg-surface-raised border ${s.border} rounded-xl p-3.5 flex flex-col gap-1.5` },
    h("div", { className: `w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center ${s.text} text-xs font-bold` }, icon),
    h("span", { className: "text-xl font-bold tracking-tight text-text-primary tabular-nums" }, value),
    h("span", { className: "text-[10px] text-text-secondary font-medium uppercase tracking-widest" }, label)
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ text, time, type }) {
  const dotColor = type === "blocked" ? "bg-accent-red" : type === "warning" ? "bg-accent-amber" : "bg-accent-green";
  return h("div", { className: "flex items-center gap-3 py-3" },
    h("div", { className: `w-1.5 h-1.5 rounded-full ${dotColor} pulse-dot shrink-0` }),
    h("span", { className: "text-[13px] text-text-secondary flex-1 truncate leading-snug" }, text),
    h("span", { className: "text-[11px] text-text-secondary/50 shrink-0 font-medium" }, time)
  );
}

/* ─── Relay Token Section ─── */
function ApiKeySection() {
  const [tokenValue, setTokenValue] = useState("");
  const [tokenStatus, setTokenStatus] = useState("loading");
  const [showToken, setShowToken] = useState(false);
  const [inputError, setInputError] = useState("");
  const [saveConfirm, setSaveConfirm] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("relay_auth_token", (result) => {
      setTokenStatus(result.relay_auth_token ? "saved" : "none");
    });
  }, []);

  const handleSave = useCallback(() => {
    setInputError("");
    const trimmed = tokenValue.trim();
    if (!trimmed) { setInputError("Please enter a relay token."); return; }
    if (trimmed.length < 16) { setInputError("Token must be at least 16 characters."); return; }
    chrome.storage.local.set({ relay_auth_token: trimmed }, () => {
      setTokenStatus("saved");
      setTokenValue("");
      setShowToken(false);
      setSaveConfirm(true);
      setTimeout(() => setSaveConfirm(false), 2500);
    });
  }, [tokenValue]);

  const handleClear = useCallback(() => {
    chrome.storage.local.remove("relay_auth_token", () => {
      setTokenStatus("none");
      setTokenValue("");
      setInputError("");
      setSaveConfirm(false);
    });
  }, []);

  const statusBadge = () => {
    if (tokenStatus === "loading") return null;
    if (tokenStatus === "saved") {
      return h("span", {
        className: "inline-flex items-center gap-1.5 text-[10px] font-semibold text-accent-green bg-accent-green/8 px-2 py-0.5 rounded-full border border-accent-green/15"
      },
        h("span", { className: "w-1.5 h-1.5 rounded-full bg-accent-green" }),
        "Connected"
      );
    }
    return h("span", {
      className: "inline-flex items-center gap-1.5 text-[10px] font-medium text-text-secondary bg-surface-overlay px-2 py-0.5 rounded-full"
    }, "Not configured");
  };

  return h("div", { className: "px-5 mb-4" },
    h("div", { className: "flex items-center justify-between mb-2.5" },
      h("h2", { className: "text-[11px] font-semibold uppercase tracking-wider text-text-secondary" }, "AI Analysis"),
      statusBadge()
    ),
    h("div", { className: "card-elevated bg-surface-raised border border-border-subtle rounded-xl p-4 flex flex-col gap-3" },
      h("p", { className: "text-xs text-text-secondary leading-relaxed" },
        "Connect your Shield Relay for real-time AI threat analysis."
      ),
      /* Input */
      h("div", { className: "relative" },
        h("input", {
          type: showToken ? "text" : "password",
          value: tokenValue,
          onInput: (e) => { setTokenValue(e.target.value); setInputError(""); },
          onKeyDown: (e) => { if (e.key === "Enter") handleSave(); },
          placeholder: "Paste your relay token…",
          className: "w-full bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/40 outline-none focus:border-border-focus/50 focus:ring-1 focus:ring-border-focus/20 transition-smooth pr-9",
          spellCheck: false,
          autoComplete: "off",
        }),
        h("button", {
          type: "button",
          onClick: () => setShowToken((v) => !v),
          className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-secondary transition-smooth cursor-pointer",
          title: showToken ? "Hide" : "Show",
        },
          h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
            showToken
              ? h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" })
              : [
                  h("path", { key: "1", strokeLinecap: "round", strokeLinejoin: "round", d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" }),
                  h("path", { key: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
                ]
          )
        )
      ),
      inputError && h("p", { className: "text-xs text-accent-red -mt-1" }, inputError),
      saveConfirm && h("p", { className: "text-xs text-accent-green -mt-1 font-medium" }, "✓ Token saved successfully"),
      h("div", { className: "flex gap-2" },
        h("button", {
          onClick: handleSave,
          className: "flex-1 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/18 transition-smooth cursor-pointer"
        }, "Save Token"),
        h("button", {
          onClick: handleClear,
          className: "flex-1 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-text-secondary text-xs font-medium hover:bg-border-subtle transition-smooth cursor-pointer"
        }, "Clear")
      )
    )
  );
}

/* ─── Main Popup App ─── */
function PopupApp() {
  const [interceptOn, setInterceptOn] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats] = useState({ blocked: 12, warnings: 5, safe: 847 });

  const activities = [
    { text: "Blocked suspicious redirect", time: "2m ago", type: "blocked" },
    { text: "Flagged mixed content on page", time: "15m ago", type: "warning" },
    { text: "HTTPS verified", time: "1h ago", type: "safe" },
    { text: "Blocked tracking script", time: "3h ago", type: "blocked" },
  ];

  const toggleIntercept = useCallback(() => {
    if (interceptOn) setModalOpen(true);
    else setInterceptOn(true);
  }, [interceptOn]);

  return h("div", { className: "min-h-screen bg-surface flex flex-col" },

    /* ── Header ── */
    h("header", { className: "px-5 pt-5 pb-3 flex items-center justify-between" },
      h("div", { className: "flex items-center gap-3" },
        h("div", { className: "w-10 h-10 rounded-xl bg-accent-cyan/8 border border-accent-cyan/15 flex items-center justify-center shield-breathe" },
          h("svg", { className: "w-5 h-5 text-accent-cyan", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 },
            h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" })
          )
        ),
        h("div", null,
          h("h1", { className: "text-[15px] font-bold tracking-tight text-text-primary" }, "Safety Intercept"),
          h("p", { className: "text-[11px] text-text-secondary font-medium mt-0.5" },
            interceptOn ? "All protections active" : "Protection disabled"
          )
        )
      ),
      /* Status indicator */
      h("div", { className: "flex items-center gap-2" },
        h("div", { className: `w-2 h-2 rounded-full ${interceptOn ? "bg-accent-green" : "bg-accent-red"} pulse-dot` }),
        h("span", { className: `text-[10px] font-semibold uppercase tracking-wider ${interceptOn ? "text-accent-green" : "text-accent-red"}` },
          interceptOn ? "On" : "Off"
        )
      )
    ),

    /* ── Shield Status Banner ── */
    h("div", { className: "px-5 mb-4" },
      h("button", {
        onClick: toggleIntercept,
        className: `w-full py-3.5 rounded-xl text-sm font-semibold transition-smooth cursor-pointer flex items-center justify-center gap-2 ${
          interceptOn
            ? "bg-accent-cyan/6 border border-accent-cyan/20 text-accent-cyan shield-active hover:bg-accent-cyan/10"
            : "bg-accent-red/8 border border-accent-red/25 text-accent-red shield-disabled hover:bg-accent-red/14"
        }`
      },
        h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
          interceptOn
            ? h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" })
            : h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zM12 15.75h.007v.008H12v-.008z" })
        ),
        interceptOn ? "Shield Active" : "Shield Disabled — Tap to Enable"
      )
    ),

    /* ── Stats Grid ── */
    h("div", { className: "px-5 grid grid-cols-3 gap-2.5 mb-4" },
      h(StatCard, { label: "Blocked", value: stats.blocked, color: "red", icon: "✕" }),
      h(StatCard, { label: "Warnings", value: stats.warnings, color: "amber", icon: "!" }),
      h(StatCard, { label: "Safe", value: stats.safe, color: "green", icon: "✓" })
    ),

    /* ── Recent Activity ── */
    h("div", { className: "px-5 flex-1 mb-4" },
      h("h2", { className: "text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-2.5" }, "Recent Activity"),
      h("div", { className: "card-elevated bg-surface-raised border border-border-subtle rounded-xl px-4" },
        activities.map((a, i) =>
          h(React.Fragment, { key: i },
            h(ActivityItem, a),
            i < activities.length - 1 && h("div", { className: "divider" })
          )
        )
      )
    ),

    /* ── AI Analysis Section ── */
    h(ApiKeySection),

    /* ── Footer ── */
    h("div", { className: "px-5 py-4 text-center border-t border-border-subtle/50" },
      h("span", { className: "text-[10px] text-text-secondary/40 font-medium tracking-wide" }, "Safety Intercept v1.0.0")
    ),

    /* ── Disable Confirmation Modal ── */
    h(SafetyInterceptModal, {
      open: modalOpen,
      onClose: () => setModalOpen(false),
      onConfirm: () => setInterceptOn(false),
      title: "Disable Protection?",
      message: "Turning off Safety Intercept will leave your browsing session unprotected. Malicious scripts and unsafe redirects will not be blocked."
    })
  );
}

createRoot(document.getElementById("root")).render(h(PopupApp));
