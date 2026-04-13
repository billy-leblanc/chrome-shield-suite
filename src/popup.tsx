import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  paypal:    { label: 'PayPal',    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  venmo:     { label: 'Venmo',     color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  zelle:     { label: 'Zelle',     color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  wellsfargo:{ label: 'Wells Fargo',color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  hsbc:      { label: 'HSBC',      color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  barclays:  { label: 'Barclays',  color: '#38BDF8', bg: 'rgba(56,189,248,0.12)'  },
  revolut:   { label: 'Revolut',   color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
};

function getPlatformMeta(platform?: string) {
  if (!platform) return null;
  const key = platform.toLowerCase().replace(/[^a-z]/g, '');
  return PLATFORM_META[key] ?? null;
}

const ShieldIcon = (p: any) => (
  <svg {...p} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L4 5.5V11c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5.5L12 2z"
      fill="currentColor" opacity="0.15"
    />
    <path
      d="M12 2L4 5.5V11c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5.5L12 2z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

function PopupApp() {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [interceptOn, setInterceptOn] = useState(true);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [stats, setStats] = useState({ blocked: 0, warnings: 0, safe: 0 });
  const [activities, setActivities] = useState<Array<{ text: string; time: string; type: string; platform?: string }>>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['stats', 'threatLog', 'interceptEnabled', 'telemetryEnabled'], (result) => {
      if (chrome.runtime.lastError) return;
      if (result.stats) setStats({
        blocked: result.stats.blocked ?? 0,
        warnings: result.stats.warnings ?? 0,
        safe: result.stats.safe ?? 0,
      });
      if (Array.isArray(result.threatLog)) setActivities(result.threatLog.slice(0, 4));
      if (typeof result.interceptEnabled === 'boolean') setInterceptOn(result.interceptEnabled);
      if (typeof result.telemetryEnabled === 'boolean') setTelemetryEnabled(result.telemetryEnabled);
    });
  }, []);

  const toggleIntercept = useCallback(() => {
    const next = !interceptOn;
    setInterceptOn(next);
    chrome.storage.local.set({ interceptEnabled: next });
  }, [interceptOn]);

  const toggleTelemetry = useCallback(() => {
    const next = !telemetryEnabled;
    setTelemetryEnabled(next);
    chrome.storage.local.set({ telemetryEnabled: next });
  }, [telemetryEnabled]);

  const handleReset = useCallback(() => {
    chrome.storage.local.remove(['stats', 'threatLog'], () => {
      setStats({ blocked: 0, warnings: 0, safe: 0 });
      setActivities([]);
      setShowResetConfirm(false);
      setView('main');
    });
  }, []);

  const containerStyle: React.CSSProperties = {
    width: 380,
    minHeight: 520,
    background: 'linear-gradient(160deg, #0D1526 0%, #0B1120 100%)',
    color: '#F1F5F9',
    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    WebkitFontSmoothing: 'antialiased',
    position: 'relative',
    overflow: 'hidden',
  };

  const pulseStyle = `
    @keyframes shield-glow {
      0% { filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.4)); transform: scale(1); }
      50% { filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6)); transform: scale(1.02); }
      100% { filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.4)); transform: scale(1); }
      0% { filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.3)); transform: scale(1); }
      50% { filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.5)); transform: scale(1.03); }
      100% { filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.3)); transform: scale(1); }
    }
    .shield-pulse {
      animation: shield-glow 6s ease-in-out infinite;
    }
  `;

  if (view === 'settings') {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setView('main')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: '#F1F5F9' }}>Settings</div>
        </div>

        <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Telemetry */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>Improve Detection</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6, lineHeight: 1.6 }}>Share anonymized threat data. Personal info is stripped locally.</div>
            </div>
            <button onClick={toggleTelemetry} style={{
              width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: telemetryEnabled ? '#38BDF8' : 'rgba(255,255,255,0.08)',
              position: 'relative', flexShrink: 0, transition: 'all 0.3s ease'
            }}>
              <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', left: telemetryEnabled ? 19 : 3 }} />
            </button>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.03)' }} />

          {/* Feedback */}
          <div onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSed8ont66Fs8Mid9Ys09rl4-wYxhtzy0-nW7_-O2hBkhm4wfA/viewform', '_blank')} 
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>Help & Feedback</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Report a bug or suggest a feature</div>
            </div>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1E293B" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          {/* Reset */}
          <div style={{ marginTop: 'auto', paddingBottom: 40 }}>
            <button onClick={() => setShowResetConfirm(true)} style={{
              width: '100%', padding: '16px', borderRadius: 14, border: '1px solid rgba(248,113,113,0.15)',
              background: 'rgba(248,113,113,0.04)', color: '#F87171', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>
              Reset All History
            </button>
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: '#1E293B', letterSpacing: '0.1em', fontWeight: 700 }}>SAFETY INTERCEPT V1.0.0</div>
          </div>
        </div>

        {showResetConfirm && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#0B1120', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 32, width: 320 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#F1F5F9', marginBottom: 10, letterSpacing: '-0.5px' }}>Clear all data?</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>Your protection stats and threat logs will be permanently erased.</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleReset} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#F87171', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{pulseStyle}</style>
      
      {/* Header */}
      <div style={{ padding: '32px 28px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="shield-pulse" style={{ 
            width: 40, height: 40, background: 'rgba(56,189,248,0.08)', borderRadius: 14, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' 
          }}>
            <ShieldIcon width="24" height="24" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#F8FAFC' }}>Safety Intercept</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              {interceptOn ? 'Active' : 'Paused'}
            </div>
          </div>
        </div>
        <button onClick={() => setView('settings')} style={{ background: 'none', border: 'none', color: '#1E293B', cursor: 'pointer', padding: 8 }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, padding: '12px 28px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Impact Card (Borders Purged) */}
        <div 
          onClick={toggleIntercept}
          style={{ 
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Neutralized</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-2px', marginTop: 8 }}>{stats.blocked + stats.warnings}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cleared</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#38BDF8', letterSpacing: '-2px', marginTop: 8 }}>{stats.safe}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <div style={{ width: 10, height: 10, borderRadius: '50%', background: interceptOn ? '#38BDF8' : '#1E293B', boxShadow: interceptOn ? '0 0 14px #38BDF8' : 'none', transition: 'all 0.4s ease' }} />
             <div style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Patrolling {Object.keys(PLATFORM_META).length} platforms</div>
          </div>
        </div>

        {/* Feed (Label Purged) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 10 }}>
          {activities.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', letterSpacing: '0.02em' }}>Environment Secure</div>
            </div>
          ) : (
            activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'blocked' ? '#38BDF8' : '#1E293B', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5, fontWeight: 500 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: '#334155', marginTop: 4, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>{a.platform || 'System'} · {a.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } }
        button { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        button:hover { opacity: 0.7; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
