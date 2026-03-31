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
    h("div", { className: "px-5 flex-1" },
      h("h2", { className: "text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2" }, "Recent Activity"),
      h("div", { className: "bg-surface-raised border border-border-subtle rounded-xl px-4 divide-y divide-border-subtle" },
        activities.map((a, i) => h(ActivityItem, { key: i, ...a }))
      )
    ),

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
