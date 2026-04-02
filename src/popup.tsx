import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Key, 
  Settings, 
  History, 
  Zap, 
  Check, 
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

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
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 glow-emerald/20" 
        : "bg-rose-500/10 border-rose-500/20 text-rose-400"}
      transition-all duration-500 ease-in-out shadow-sm
    `}>
      <div className={`w-2 h-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-rose-400"} `} />
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">
        {active ? "Protected" : "Disabled"}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant }: { label: string; value: number; icon: any; variant: 'danger' | 'warning' | 'success' | 'info' }) {
  const styles = {
    danger: "text-rose-500 bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30",
    warning: "text-amber-500 bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30",
    success: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30",
    info: "text-sky-500 bg-sky-500/5 border-sky-500/10 hover:border-sky-500/30",
  };

  return (
    <Card className={`group relative overflow-hidden bg-card/40 border backdrop-blur-sm transition-all duration-300 ${styles[variant]}`}>
      <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
        <div className="flex items-center justify-between w-full">
          <Icon className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-50">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black tracking-tighter tabular-nums">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ text, time, type }: { text: string; time: string; type: string }) {
  const isBlocked = type === 'blocked';
  return (
    <div className="relative flex items-center justify-between px-4 py-3 group hover:bg-muted/30 transition-colors border-l-2 border-transparent hover:border-primary/30">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBlocked ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {isBlocked ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-bold text-foreground/90 truncate">{text}</span>
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{time}</span>
        </div>
      </div>
      <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:translate-x-0.5 transition-transform" />
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
  const [showToken, setShowToken] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);

  const [stats, setStats] = useState({ blocked: 0, warnings: 0, safe: 0 });
  const [activities, setActivities] = useState<Array<{ text: string; time: string; type: string }>>([]);

  // Mock data loader — logic preserved
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
    <div className="w-[380px] min-h-[580px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden antialiased">
      {/* Premium Header */}
      <header className="px-6 pt-7 pb-5 flex items-center justify-between bg-card/20 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className={`absolute -inset-2 rounded-2xl blur-lg transition-all duration-1000 ${interceptOn ? "bg-emerald-500/20 opacity-100" : "bg-rose-500/10 opacity-0"}`} />
            <div className={`relative w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-500 ${interceptOn ? "bg-primary/10 border-primary/20 text-primary glow-primary" : "bg-muted border-border text-muted-foreground"}`}>
              <Shield className="w-6 h-6 stroke-[2.5px]" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[15px] font-black uppercase tracking-[0.18em] leading-tight">Safety Intercept</h1>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-60">AI-Powered Payment Protection</span>
          </div>
        </div>
        <StatusPill active={interceptOn} />
      </header>

      {/* Hero Protection Card */}
      <div className="px-6 pt-6">
        <Card className="relative overflow-hidden group border-none shadow-none bg-accent/5">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${interceptOn ? "bg-gradient-to-br from-primary/15 via-background to-background" : "bg-gradient-to-br from-rose-500/5 to-background"}`} />
          <CardContent className="relative z-10 p-0 flex flex-col items-center justify-center h-[140px]">
            <Button 
              variant="ghost" 
              className="w-full h-full p-8 flex flex-col gap-4 hover:bg-transparent transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={toggleIntercept}
            >
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-700 ${interceptOn ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-4 ring-primary/10" : "bg-destructive text-destructive-foreground shadow-xl shadow-rose-500/20 scale-90 ring-4 ring-rose-500/5"}`}>
                <Zap className={`w-7 h-7 ${interceptOn ? "fill-current" : ""}`} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-black uppercase tracking-[0.15em]">{interceptOn ? "Dismantle Shield" : "Enable Protection"}</span>
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{interceptOn ? "Real-time analysis active" : "Tap to activate security node"}</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <div className="px-6 pt-6 flex-1 flex flex-col gap-7 overflow-y-auto pb-4 custom-scrollbar">
        {/* Statistics Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-70 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Security Metrics
            </h2>
            <Tabs value={view} onValueChange={(v: any) => setView(v)} className="h-7 w-[150px]">
              <TabsList className="grid w-full grid-cols-2 p-0.5 h-full bg-muted/50 border">
                <TabsTrigger value="personal" className="text-[9px] font-bold uppercase data-[state=active]:bg-card data-[state=active]:shadow-none tracking-tighter">Account</TabsTrigger>
                <TabsTrigger value="business" className="text-[9px] font-bold uppercase data-[state=active]:bg-card data-[state=active]:shadow-none tracking-tighter">Business</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className={`grid ${view === "business" ? "grid-cols-2 gap-3" : "grid-cols-3 gap-3"}`}>
            <StatCard label="Blocked" value={stats.blocked} icon={ShieldAlert} variant="danger" />
            <StatCard label="Alerts" value={stats.warnings} icon={AlertTriangle} variant="warning" />
            <StatCard label="Secure" value={stats.safe} icon={ShieldCheck} variant="success" />
            {view === "business" && (
              <StatCard label="Analyzed" value={stats.blocked + stats.warnings + stats.safe} icon={Activity} variant="info" />
            )}
          </div>
        </section>

        {/* Audit Log / Timeline */}
        <section className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-70 flex items-center gap-2">
              <History className="w-3 h-3" />
              Threat Timeline
            </h2>
          </div>
          <Card className="bg-card/20 border-border/60 overflow-hidden">
            <div className="divide-y divide-border/20">
              {activities.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-muted-foreground/20" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/30">Protocol Secure • No Threats</p>
                </div>
              ) : (
                activities.map((item, i) => (
                  <ActivityItem key={i} {...item} />
                ))
              )}
            </div>
          </Card>
        </section>

        {/* AI Enclave Status */}
        <section className="mt-2">
          <Card className="bg-muted/30 border-dashed border-border/80">
            <div className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">AI Analysis</span>
                </div>
                <div className="flex items-center gap-1.5 leading-none">
                  <div className={`w-1.5 h-1.5 rounded-full ${relayToken ? "bg-sky-400 glow-sky" : "bg-muted-foreground/30"}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${relayToken ? "text-sky-400/80" : "text-muted-foreground/50"}`}>
                    {relayToken ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <input 
                    type={showToken ? "text" : "password"}
                    placeholder="Enclave Secret"
                    value={relayToken}
                    onChange={(e) => setRelayToken(e.target.value)}
                    className="bg-background/80 border border-border/50 rounded-lg px-3 py-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 w-[120px] transition-all group-hover:border-border"
                  />
                  <button onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
                    {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${isSavingToken ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-background hover:bg-muted'}`}
                  onClick={handleSaveToken}
                >
                  <Zap className={`w-3.5 h-3.5 ${isSavingToken ? 'fill-emerald-400' : ''}`} />
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* Footer Branding */}
      <footer className="px-6 py-5 border-t border-border/40 bg-card/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-muted/40 flex items-center justify-center border border-border/20">
            <Lock className="w-3 h-3 text-muted-foreground/40" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/50 italic">v1.0.0 Enclave</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setResetModalOpen(true)}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-rose-500/50 transition-colors"
          >
            Purge History
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-500 shadow-sm shadow-emerald-500/5">
            <CheckCircle className="w-3 h-3" />
            Secure Node
          </div>
        </div>
      </footer>

      {/* Confirmation Overlays */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="mx-4 w-full max-w-[310px] shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <CardTitle className="text-lg font-black tracking-tight">Dismantle Shield?</CardTitle>
              <CardDescription className="text-[11px] leading-relaxed font-medium">Deactivating the security enclave will stop all real-time fraud analysis. Your payments will be unmonitored.</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 p-6 pt-0">
              <Button variant="destructive" className="w-full font-black uppercase tracking-widest text-[11px] h-10 shadow-lg shadow-rose-500/20" onClick={() => { chrome.storage.local.set({ interceptEnabled: false }, () => setInterceptOn(false)); setModalOpen(false); }}>Deactivate</Button>
              <Button variant="secondary" className="w-full font-bold uppercase tracking-widest text-[11px] h-10" onClick={() => setModalOpen(false)}>Maintain Protection</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {resetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="mx-4 w-full max-w-[310px] shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <CardTitle className="text-lg font-black tracking-tight tracking-[-0.02em]">Purge node history?</CardTitle>
              <CardDescription className="text-[11px] leading-relaxed font-medium">This will permanently delete all session threat data and reset node statistics. This action is irreversible.</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 p-6 pt-0">
              <Button variant="destructive" className="w-full font-black uppercase tracking-widest text-[11px] h-10 shadow-lg shadow-rose-500/20" onClick={() => { handleResetConfirm(); setResetModalOpen(false); }}>Purge Archives</Button>
              <Button variant="secondary" className="w-full font-bold uppercase tracking-widest text-[11px] h-10" onClick={() => setResetModalOpen(false)}>Cancel</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Global initialization
const init = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<TooltipProvider><PopupApp /></TooltipProvider>);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
