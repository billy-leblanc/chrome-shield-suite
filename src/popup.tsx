import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const h = React.createElement;

/* ─── Premium Components ─── */

function ShieldIcon({ className = "w-6 h-6", glow = false }) {
  return h("div", { className: `relative ${glow ? "glow-primary" : ""}` },
    h("svg", { 
      className: `${className} text-primary`, 
      fill: "none", 
      viewBox: "0 0 24 24", 
      stroke: "currentColor", 
      strokeWidth: 2 
    },
      h("path", { 
        strokeLinecap: "round", 
        strokeLinejoin: "round", 
        d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" 
      })
    )
  );
}

function SafetyInterceptModal({ open, onClose, onConfirm, title, message, confirmLabel = "Proceed Anyway", confirmClass = "" }) {
  if (!open) return null;
  return h("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300",
    onClick: onClose,
  },
    h("div", {
      className: "bg-card border border-border rounded-2xl p-6 mx-4 w-full max-w-[340px] shadow-2xl animate-in zoom-in-95 duration-200",
      onClick: (e) => e.stopPropagation(),
    },
      h("div", { className: "flex flex-col items-center text-center mb-6" },
        h("div", { className: "w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4" },
          h("svg", { className: "w-6 h-6 text-destructive", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
            h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" })
          )
        ),
        h("h2", { className: "text-lg font-bold tracking-tight text-foreground" }, title),
        h("p", { className: "text-sm text-muted-foreground mt-2 leading-relaxed" }, message)
      ),
      h("div", { className: "flex flex-col gap-2" },
        h("button", {
          onClick: () => { onConfirm?.(); onClose(); },
          className: `w-full py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all ${confirmClass}`
        }, confirmLabel),
        h("button", {
          onClick: onClose,
          className: "w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
        }, "Cancel")
      )
    )
  );
}

function StatCard({ label, value, variant }) {
  const variants = {
    danger: "text-destructive bg-destructive/10 border-destructive/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    success: "text-accent bg-accent/10 border-accent/20",
    info: "text-primary bg-primary/10 border-primary/20",
  };
  
  return h("div", { className: `flex flex-col items-center justify-center p-3 rounded-2xl border ${variants[variant || 'info']} transition-all hover:scale-[1.02]` },
    h("span", { className: "text-xs font-medium opacity-70 mb-1" }, label),
    h("span", { className: "text-xl font-black tracking-tighter" }, value)
  );
}

function ViewToggle({ view, onChange }) {
  return h("div", { className: "p-1 bg-secondary rounded-xl flex gap-1" },
    h("button", {
      onClick: () => onChange("personal"),
      className: `flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${
        view === "personal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`
    }, "Personal"),
    h("button", {
      onClick: () => onChange("business"),
      className: `flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${
        view === "business" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`
    }, "Business")
  );
}

function ApiKeySection() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    chrome.storage.local.get("relay_auth_token", (res) => {
      if (res.relay_auth_token) setToken(res.relay_auth_token);
    });
  }, []);

  const handleSave = () => {
    setSaveStatus("saving");
    chrome.storage.local.set({ relay_auth_token: token }, () => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    });
  };

  return h("div", { className: "px-5 mt-auto border-t border-border pt-5 pb-2" },
    h("div", { className: "flex items-center justify-between mb-3" },
      h("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground" }, "AI Relay Enclave"),
      saveStatus === "saved" && h("span", { className: "text-[10px] font-bold text-accent animate-in fade-in slide-in-from-right-1" }, "Synced")
    ),
    h("div", { className: "relative mb-4" },
      h("input", {
        type: showToken ? "text" : "password",
        value: token,
        onChange: (e) => setToken(e.target.value),
        placeholder: "Enter secret auth token...",
        className: "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
      }),
      h("button", {
        onClick: () => setShowToken(!showToken),
        className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      }, 
        showToken 
          ? h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, h("path", { d: "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" }))
          : h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, h("path", { d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" }), h("circle", { cx: "12", cy: "12", r: "3" }))
      )
    ),
    h("button", {
      onClick: handleSave,
      disabled: saveStatus === "saving",
      className: "w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-tight hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
    }, saveStatus === "saving" ? "Syncing..." : "Update Enclave")
  );
}

function ActivityItem({ text, time, type }) {
  const icon = type === 'blocked' 
    ? h("div", { className: "w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(255,113,113,0.5)]" })
    : h("div", { className: "w-2 h-2 rounded-full bg-secondary" });

  return h("div", { className: "flex items-center justify-between py-3 group" },
    h("div", { className: "flex items-center gap-3" },
      icon,
      h("span", { className: "text-xs font-semibold text-foreground group-hover:text-primary transition-colors" }, text)
    ),
    h("span", { className: "text-[10px] font-medium text-muted-foreground" }, time)
  );
}

/* ─── Main Popup App ─── */
function PopupApp() {
  const [interceptOn, setInterceptOn] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [view, setView] = useState<"personal" | "business">("personal");

  const [stats, setStats] = useState({ blocked: 0, warnings: 0, safe: 0 });
  const [activities, setActivities] = useState<Array<{ text: string; time: string; type: string }>>([]);

  useEffect(() => {
    chrome.storage.local.get(["stats", "threatLog", "interceptEnabled"], (result) => {
      if (chrome.runtime.lastError) return;
      if (result.stats) setStats(result.stats);
      if (Array.isArray(result.threatLog)) setActivities(result.threatLog.slice(0, 4));
      if (result.interceptEnabled !== undefined) setInterceptOn(result.interceptEnabled);
    });
  }, []);

  const toggleIntercept = useCallback(() => {
    if (interceptOn) {
      setModalOpen(true);
    } else {
      chrome.storage.local.set({ interceptEnabled: true }, () => setInterceptOn(true));
    }
  }, [interceptOn]);

  const handleResetConfirm = useCallback(() => {
    chrome.storage.local.set({ stats: { blocked: 0, warnings: 0, safe: 0 }, threatLog: [] }, () => {
      setStats({ blocked: 0, warnings: 0, safe: 0 });
      setActivities([]);
    });
  }, []);

  const statCards = view === "personal"
    ? [
        { label: "Blocked", value: stats.blocked, variant: "danger" },
        { label: "Warnings", value: stats.warnings, variant: "warning" },
        { label: "Safe", value: stats.safe, variant: "success" },
      ]
    : [
        { label: "Blocked", value: stats.blocked, variant: "danger" },
        { label: "Flagged", value: stats.warnings, variant: "warning" },
        { label: "Verified", value: stats.safe, variant: "success" },
        { label: "Total", value: stats.blocked + stats.warnings + stats.safe, variant: "info" },
      ];

  return h("div", { className: "w-[360px] min-h-[540px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden" },
    /* Header */
    h("header", { className: "px-5 pt-6 pb-4 flex items-center justify-between" },
      h("div", { className: "flex items-center gap-3" },
        h(ShieldIcon, { glow: interceptOn }),
        h("div", null,
          h("h1", { className: "text-sm font-black uppercase tracking-widest" }, "Shield Suite"),
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: `w-1.5 h-1.5 rounded-full ${interceptOn ? "bg-accent animate-pulse" : "bg-destructive"}` }),
            h("span", { className: "text-[10px] font-bold text-muted-foreground" }, interceptOn ? "SYSTEM SECURE" : "UNPROTECTED")
          )
        )
      ),
      h("button", {
        onClick: () => setResetModalOpen(true),
        className: "p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground/50 hover:text-destructive/50"
      }, h("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, h("path", { d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })))
    ),

    /* Main Toggle Hub */
    h("div", { className: "px-5 mb-6" },
      h("div", { className: "relative group" },
        h("div", { className: `absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 ${interceptOn ? "bg-primary" : "bg-destructive"}` }),
        h("button", {
          onClick: toggleIntercept,
          className: "relative w-full py-5 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
        },
          h("span", { className: `text-xl mb-1` }, interceptOn ? "🛡️" : "⚠️"),
          h("span", { className: "text-xs font-black uppercase tracking-widest" }, interceptOn ? "Deactivate Shield" : "Activate Protection"),
          h("span", { className: "text-[9px] font-medium text-muted-foreground" }, interceptOn ? "Real-time analysis running" : "Extension is currently dormant")
        )
      )
    ),

    /* Control Panel */
    h("div", { className: "px-5 flex flex-col gap-5 flex-1" },
      h("section", null,
        h("div", { className: "flex items-center justify-between mb-3" },
          h("h2", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground" }, "Protection Analytics"),
          h("div", { className: "w-24" }, h(ViewToggle, { view, onChange: setView }))
        ),
        h("div", { className: `grid ${view === "business" ? "grid-cols-4" : "grid-cols-3"} gap-2` },
          ...statCards.map((card, i) => h(StatCard, { key: i, ...card as any }))
        )
      ),

      h("section", { className: "flex-1" },
        h("h2", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3" }, "Threat Timeline"),
        h("div", { className: "bg-card border border-border rounded-2xl px-4 divide-y divide-border" },
          activities.length === 0
            ? h("div", { className: "py-6 text-xs text-muted-foreground/40 text-center italic" }, "No threats detected in this session")
            : activities.map((a, i) => h(ActivityItem, { key: i, ...a }))
        )
      )
    ),

    /* Config */
    h(ApiKeySection),

    /* Modals */
    h(SafetyInterceptModal, {
      open: modalOpen,
      onClose: () => setModalOpen(false),
      onConfirm: () => chrome.storage.local.set({ interceptEnabled: false }, () => setInterceptOn(false)),
      title: "Disable Protection?",
      message: "Safety Intercept will stop monitoring payments. This leaves you vulnerable to social engineering scams.",
      confirmLabel: "Disable Anyway",
    }),

    h(SafetyInterceptModal, {
      open: resetModalOpen,
      onClose: () => setResetModalOpen(false),
      onConfirm: handleResetConfirm,
      title: "Clear History",
      message: "This will permanently delete all threat logs and reset counters to zero. This action cannot be undone.",
      confirmLabel: "Clear All",
    })
  );
}

createRoot(document.getElementById("root")).render(h(PopupApp));
