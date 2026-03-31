import React from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom@19/client";

const { useState, useEffect, useCallback } = React;
const h = React.createElement;

/* ─── Safety Intercept Modal ─── */
function SafetyInterceptModal({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return h("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
    onClick: onClose,
  },
    h("div", {
      className: "bg-surface-raised border border-border-subtle rounded-2xl p-6 mx-4 w-full max-w-sm glow-cyan",
      onClick: (e) => e.stopPropagation(),
    },
      h("div", { className: "flex items-center gap-3 mb-4" },
        h("div", { className: "w-10 h-10 rounded-xl bg-accent-red/15 flex items-center justify-center" },
          h("svg", { className: "w-5 h-5 text-accent-red", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
            h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" })
          )
        ),
        h("h3", { className: "text-lg font-bold text-text-primary" }, title || "Safety Intercept")
      ),
      h("p", { className: "text-text-secondary text-sm leading-relaxed mb-6" }, message || "This action may pose a security risk. Do you want to proceed?"),
      h("div", { className: "flex gap-3" },
        h("button", {
          onClick: onClose,
          className: "flex-1 px-4 py-2.5 rounded-xl bg-surface-overlay text-text-secondary text-sm font-semibold hover:bg-border-subtle transition-colors cursor-pointer"
        }, "Cancel"),
        h("button", {
          onClick: () => { onConfirm?.(); onClose(); },
          className: "flex-1 px-4 py-2.5 rounded-xl bg-accent-red text-surface text-sm font-bold hover:bg-accent-red/80 transition-colors cursor-pointer"
        }, "Proceed Anyway")
      )
    )
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, color, icon }) {
  const colors = {
    cyan: "text-accent-cyan bg-accent-cyan/10",
    green: "text-accent-green bg-accent-green/10",
    amber: "text-accent-amber bg-accent-amber/10",
    red: "text-accent-red bg-accent-red/10",
  };
  return h("div", { className: "bg-surface-raised border border-border-subtle rounded-xl p-4 flex flex-col gap-2" },
    h("div", { className: `w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center text-xs font-bold` }, icon),
    h("span", { className: "text-2xl font-extrabold tracking-tight" }, value),
    h("span", { className: "text-xs text-text-secondary font-medium uppercase tracking-wider" }, label)
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ text, time, type }) {
  const dotColor = type === "blocked" ? "bg-accent-red" : type === "warning" ? "bg-accent-amber" : "bg-accent-green";
  return h("div", { className: "flex items-center gap-3 py-2.5" },
    h("div", { className: `w-2 h-2 rounded-full ${dotColor} pulse-dot` }),
    h("span", { className: "text-sm text-text-secondary flex-1 truncate" }, text),
    h("span", { className: "text-xs text-text-secondary/60 shrink-0" }, time)
  );
}

/* ─── Relay Token Section ─── */
function ApiKeySection() {
  const [tokenValue, setTokenValue] = useState("");
  const [tokenStatus, setTokenStatus] = useState("loading"); // "loading" | "saved" | "none"
  const [showToken, setShowToken] = useState(false);
  const [inputError, setInputError] = useState("");
  const [saveConfirm, setSaveConfirm] = useState(false);

  // Load token status on mount
  useEffect(() => {
    chrome.storage.local.get("relay_auth_token", (result) => {
      if (result.relay_auth_token) {
        setTokenStatus("saved");
      } else {
        setTokenStatus("none");
      }
    });
  }, []);

  const handleSave = useCallback(() => {
    setInputError("");
    const trimmed = tokenValue.trim();
    if (!trimmed) {
      setInputError("Please enter a relay token.");
      return;
    }
    if (trimmed.length < 16) {
      setInputError("Token must be at least 16 characters.");
      return;
    }
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

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") handleSave();
  }, [handleSave]);

  const statusBadge = () => {
    if (tokenStatus === "loading") return null;
    if (tokenStatus === "saved") {
      return h("span", {
        className: "inline-flex items-center gap-1 text-xs font-semibold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full"
      }, "Token saved \u2713");
    }
    return h("span", {
      className: "inline-flex items-center gap-1 text-xs font-semibold text-text-secondary bg-surface-overlay px-2 py-0.5 rounded-full"
    }, "No token set");
  };

  return h("div", { className: "px-5 mb-4" },
    /* Section Header */
    h("div", { className: "flex items-center justify-between mb-2" },
      h("h2", { className: "text-xs font-semibold uppercase tracking-wider text-text-secondary" }, "AI Analysis"),
      statusBadge()
    ),

    /* Card */
    h("div", { className: "bg-surface-raised border border-border-subtle rounded-xl p-4 flex flex-col gap-3" },
      /* Label */
      h("p", { className: "text-xs text-text-secondary leading-relaxed" },
        "Shield Relay token \u2014 connects to your secure AI relay"
      ),

      /* Input row */
      h("div", { className: "flex gap-2" },
        h("div", { className: "relative flex-1" },
          h("input", {
            type: showToken ? "text" : "password",
            value: tokenValue,
            onInput: (e) => { setTokenValue(e.target.value); setInputError(""); },
            onKeyDown: handleKeyDown,
            placeholder: "Paste your relay token...",
            className: "w-full bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-cyan/50 transition-colors pr-9",
            spellCheck: false,
            autoComplete: "off",
          }),
          /* Show/hide toggle */
          h("button", {
            type: "button",
            onClick: () => setShowToken((v) => !v),
            className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text-secondary transition-colors cursor-pointer",
            title: showToken ? "Hide token" : "Show token",
          },
            showToken
              ? h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                  h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" })
                )
              : h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                  h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" }),
                  h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
                )
          )
        ),
      ),

      /* Error message */
      inputError && h("p", { className: "text-xs text-accent-red -mt-1" }, inputError),

      /* Save confirmation */
      saveConfirm && h("p", { className: "text-xs text-accent-green -mt-1 font-semibold" }, "Saved!"),

      /* Action buttons */
      h("div", { className: "flex gap-2" },
        h("button", {
          onClick: handleSave,
          className: "flex-1 py-2 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-xs font-bold hover:bg-accent-cyan/25 transition-colors cursor-pointer"
        }, "Save"),
        h("button", {
          onClick: handleClear,
          className: "flex-1 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-colors cursor-pointer"
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
    if (interceptOn) {
      setModalOpen(true);
    } else {
      setInterceptOn(true);
    }
  }, [interceptOn]);

  return h("div", { className: "min-h-screen bg-surface flex flex-col" },
    /* Header */
    h("header", { className: "px-5 pt-5 pb-4 flex items-center justify-between" },
      h("div", { className: "flex items-center gap-3" },
        h("div", { className: "w-9 h-9 rounded-xl bg-accent-cyan/15 flex items-center justify-center" },
          h("svg", { className: "w-5 h-5 text-accent-cyan", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
            h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" })
          )
        ),
        h("div", null,
          h("h1", { className: "text-base font-bold tracking-tight" }, "Safety Intercept"),
          h("p", { className: "text-xs text-text-secondary" }, "Protection active")
        )
      ),
      h("div", { className: `w-3 h-3 rounded-full ${interceptOn ? "bg-accent-green" : "bg-accent-red"} pulse-dot` })
    ),

    /* Toggle */
    h("div", { className: "px-5 mb-4" },
      h("button", {
        onClick: toggleIntercept,
        className: `w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          interceptOn
            ? "bg-surface-raised border border-accent-cyan/30 text-accent-cyan glow-cyan hover:bg-surface-overlay"
            : "bg-accent-red/15 border border-accent-red/30 text-accent-red hover:bg-accent-red/25"
        }`
      }, interceptOn ? "🛡️ Shield Active" : "⚠️ Shield Disabled — Click to Enable")
    ),

    /* Stats Grid */
    h("div", { className: "px-5 grid grid-cols-3 gap-3 mb-4" },
      h(StatCard, { label: "Blocked", value: stats.blocked, color: "red", icon: "✕" }),
      h(StatCard, { label: "Warnings", value: stats.warnings, color: "amber", icon: "!" }),
      h(StatCard, { label: "Safe", value: stats.safe, color: "green", icon: "✓" })
    ),

    /* Activity */
    h("div", { className: "px-5 flex-1 mb-4" },
      h("h2", { className: "text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2" }, "Recent Activity"),
      h("div", { className: "bg-surface-raised border border-border-subtle rounded-xl px-4 divide-y divide-border-subtle" },
        activities.map((a, i) => h(ActivityItem, { key: i, ...a }))
      )
    ),

    /* API Key Section */
    h(ApiKeySection),

    /* Footer */
    h("div", { className: "px-5 py-4 text-center" },
      h("span", { className: "text-[10px] text-text-secondary/50 font-medium" }, "Safety Intercept v1.0.0")
    ),

    /* Modal */
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
