import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, ShieldAlert, ShieldCheck, Activity, AlertTriangle, CheckCircle, Info, Settings, Trash2, Key, ExternalLink, Zap, Lock, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/* ─── Premium Components ─── */

function StatusPill({ active }: { active: boolean }) {
  return (
    <div className={`
      relative flex items-center gap-2 px-3 py-1.5 rounded-full border
      ${active 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
        : "bg-destructive/10 border-destructive/20 text-destructive"}
      transition-all duration-500 animate-in fade-in zoom-in-95
    `}>
      <div className={`w-2 h-2 rounded-full ${active ? "bg-emerald-400 animate-pulse glow-accent" : "bg-destructive"} `} />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {active ? "Protected" : "Disabled"}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant }: { label: string; value: number; icon: any; variant: 'danger' | 'warning' | 'success' | 'info' }) {
  const styles = {
    danger: "text-destructive bg-destructive/5 hover:bg-destructive/10 border-destructive/10 hover:border-destructive/20 transition-all",
    warning: "text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 hover:border-amber-500/20 transition-all",
    success: "text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/20 transition-all",
    info: "text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/10 hover:border-cyan-500/20 transition-all",
  };

  return (
    <Card className={`relative overflow-hidden bg-card border shadow-sm ${styles[variant]}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
          <span className="text-xl font-black tracking-tighter">{value}</span>
        </div>
        <Icon className="w-5 h-5 opacity-40" />
      </CardContent>
    </Card>
  );
}

function Modal({ open, onClose, onConfirm, title, message, confirmLabel }: { open: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, confirmLabel: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="mx-4 w-full max-w-[320px] shadow-2xl border-border/50 animate-in zoom-in-95 duration-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription className="text-xs leading-relaxed">{message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 p-6 pt-2">
          <Button variant="destructive" className="w-full font-bold" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
          <Button variant="secondary" className="w-full font-semibold" onClick={onClose}>Cancel</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ─── Main Popup App ─── */
function PopupApp() {
  const [interceptOn, setInterceptOn] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [view, setView] = useState<"personal" | "business">("personal");
  const [relayToken, setRelayToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);

  const [stats, setStats] = useState({ blocked: 0, warnings: 0, safe: 0 });
  const [activities, setActivities] = useState<Array<{ text: string; time: string; type: string }>>([]);

  useEffect(() => {
    chrome.storage.local.get(["stats", "threatLog", "interceptEnabled", "relay_auth_token"], (result) => {
      if (chrome.runtime.lastError) return;
      if (result.stats) setStats(result.stats);
      if (Array.isArray(result.threatLog)) setActivities(result.threatLog.slice(0, 5));
      if (result.interceptEnabled !== undefined) setInterceptOn(result.interceptEnabled);
      if (result.relay_auth_token) setRelayToken(result.relay_auth_token);
    });
  }, []);

  const toggleIntercept = useCallback(() => {
    if (interceptOn) {
      setModalOpen(true);
    } else {
      chrome.storage.local.set({ interceptEnabled: true }, () => setInterceptOn(true));
    }
  }, [interceptOn]);

  const handleSaveToken = () => {
    setIsSavingToken(true);
    chrome.storage.local.set({ relay_auth_token: relayToken }, () => {
      setTimeout(() => setIsSavingToken(false), 800);
    });
  };

  const handleResetConfirm = useCallback(() => {
    chrome.storage.local.set({ stats: { blocked: 0, warnings: 0, safe: 0 }, threatLog: [] }, () => {
      setStats({ blocked: 0, warnings: 0, safe: 0 });
      setActivities([]);
    });
  }, []);

  return (
    <div className="w-[380px] min-h-[580px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden">
      {/* Header Area */}
      <header className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border/40 bg-card/10 backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`absolute -inset-1.5 rounded-xl blur-lg transition-all duration-1000 ${interceptOn ? "bg-primary/20 opacity-100" : "bg-destructive/10 opacity-0"}`} />
            <div className="relative w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary stroke-[2.5px]" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-[0.2em] -mb-0.5">Safety Intercept</h1>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">AI-Powered Payment Protection</span>
          </div>
        </div>
        <StatusPill active={interceptOn} />
      </header>

      {/* Hero Activation Card */}
      <div className="px-6 py-6">
        <Card className="relative overflow-hidden border-none shadow-none bg-secondary/50 group h-[120px] flex items-center justify-center">
          <div className={`absolute inset-0 transition-all duration-700 ${interceptOn ? "bg-gradient-to-br from-primary/10 via-background to-transparent" : "bg-gradient-to-br from-destructive/5 to-transparent"}`} />
          <Button 
            variant="ghost" 
            className="relative z-10 w-full h-full p-8 flex flex-col gap-3 hover:bg-transparent active:scale-[0.98] transition-transform"
            onClick={toggleIntercept}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${interceptOn ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 scale-90"}`}>
              {interceptOn ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">{interceptOn ? "Shield is Monitoring" : "Protection Disabled"}</span>
              <span className="text-[9px] font-medium opacity-60 uppercase tracking-widest">{interceptOn ? "Tap to Deactivate" : "Tap to Arm Enclave"}</span>
            </div>
          </Button>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="px-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-6">
        {/* Analytics Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Security Statistics
            </h2>
            <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-[140px]">
              <TabsList className="grid w-full grid-cols-2 h-7 p-0.5 bg-secondary border">
                <TabsTrigger value="personal" className="text-[9px] font-bold uppercase tracking-tight data-[state=active]:bg-card data-[state=active]:shadow-none">Personal</TabsTrigger>
                <TabsTrigger value="business" className="text-[9px] font-bold uppercase tracking-tight data-[state=active]:bg-card data-[state=active]:shadow-none">Business</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className={`grid ${view === "business" ? "grid-cols-2 gap-3" : "grid-cols-3 gap-2.5"}`}>
            <StatCard label="Blocked" value={stats.blocked} icon={ShieldAlert} variant="danger" />
            <StatCard label="Warnings" value={stats.warnings} icon={AlertTriangle} variant="warning" />
            <StatCard label="Safe" value={stats.safe} icon={CheckCircle} variant="success" />
            {view === "business" && <StatCard label="Total" value={stats.blocked + stats.warnings + stats.safe} icon={Activity} variant="info" />}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="flex-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-4 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Threat Timeline
          </h2>
          <Card className="bg-card/30 border border-border/60">
            <CardContent className="p-0 divide-y divide-border/20">
              {activities.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <ShieldCheck className="w-10 h-10 text-muted-foreground/10 mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-20 italic">Clean Session Protocol Active</p>
                </div>
              ) : (
                activities.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between group hover:bg-primary/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-6 rounded-full ${item.type === 'blocked' ? 'bg-destructive/40' : 'bg-amber-500/40'}`} />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold tracking-tight">{item.text}</span>
                        <span className="text-[9px] font-medium text-muted-foreground opacity-60 uppercase">{item.time}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* AI Analysis Enclave */}
        <section className="mt-2">
          <Card className="bg-card border-dashed border-border shadow-none">
            <CardHeader className="p-4 py-3 flex flex-row items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest tracking-[0.1em]">AI Analysis</span>
                <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${relayToken ? "bg-cyan-400 glow-cyan animate-pulse" : "bg-muted"}`} />
                  {relayToken ? "Enclave Secure" : "Awaiting Credentials"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="password"
                  placeholder="Secret Key"
                  value={relayToken}
                  onChange={(e) => setRelayToken(e.target.value)}
                  className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-1.5 text-[9px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 w-[100px] transition-all"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={`w-7 h-7 rounded-lg ${isSavingToken ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary-foreground/60"}`}
                  onClick={handleSaveToken}
                >
                  <Key className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </div>

      {/* Footer / Branding Area */}
      <footer className="px-6 py-5 border-t border-border/40 bg-card/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-foreground/5 border flex items-center justify-center">
            <Lock className="w-3 h-3 opacity-30" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-20">v1.0.0 Enclave</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setResetModalOpen(true)}
            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-destructive/50 transition-colors"
          >
            Purge History
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/80 border text-[8px] font-black uppercase tracking-tighter text-emerald-500 border-emerald-500/20">
            <CheckCircle className="w-2.5 h-2.5" />
            Secure Node
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onConfirm={() => chrome.storage.local.set({ interceptEnabled: false }, () => setInterceptOn(false))}
        title="Dismantle Shield?"
        message="Deactivating the security enclave stops all real-time fraud analysis. Your payment routes will be unmonitored."
        confirmLabel="Deactivate"
      />

      <Modal 
        open={resetModalOpen} 
        onClose={() => setResetModalOpen(false)} 
        onConfirm={handleResetConfirm}
        title="Purge Archives"
        message="This will permanently delete all session threat data and reset node statistics. This action is irreversible."
        confirmLabel="Purge Everything"
      />
    </div>
  );
}

// Global initialization
const init = () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<TooltipProvider><PopupApp /></TooltipProvider>);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
