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
    }
    .shield-pulse {
      animation: shield-glow 4s ease-in-out infinite;
    }
  `;

  if (view === 'settings') {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '24px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setView('main')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Settings</div>
        </div>

        <div style={{ p: 22, display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 22px' }}>
          {/* Telemetry */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>Improve Detection</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                Share anonymized threat data. Personal info is stripped locally.
              </div>
            </div>
            <button onClick={toggleTelemetry} style={{
              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: telemetryEnabled ? '#38BDF8' : 'rgba(255,255,255,0.1)',
              position: 'relative', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <span style={{ position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: telemetryEnabled ? 19 : 3 }} />
            </button>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

          {/* Feedback */}
          <div onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSed8ont66Fs8Mid9Ys09rl4-wYxhtzy0-nW7_-O2hBkhm4wfA/viewform', '_blank')} 
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Help & Feedback</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Tell us what's broken or missing</div>
            </div>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#334155" strokeWidth="2"><path d="M7 3l7 7-7 7"/></svg>
          </div>

          {/* Reset */}
          <div style={{ marginTop: 'auto', paddingTop: 40 }}>
            <button onClick={() => setShowResetConfirm(true)} style={{
              width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(248,113,113,0.2)',
              background: 'rgba(248,113,113,0.05)', color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}>
              Reset All History
            </button>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: '#1E293B', letterSpacing: '0.05em' }}>
              SAFETY INTERCEPT V1.0.0
            </div>
          </div>
        </div>

        {/* Reset Modal Overlay */}
        {showResetConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#0D1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, width: 300 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Clear all data?</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>This will permanently erase your protection stats and threat logs.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#94A3B8', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleReset} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#F87171', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reset</button>
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
      <div style={{ padding: '24px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="shield-pulse" style={{ 
            width: 36, height: 36, background: 'rgba(56,189,248,0.1)', borderRadius: 12, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' 
          }}>
            <ShieldIcon width="22" height="22" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#F8FAFC' }}>Safety Intercept</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 4, padding: '2px 8px', borderRadius: 99,
              background: interceptOn ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${interceptOn ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: interceptOn ? '#F59E0B' : '#334155', boxShadow: interceptOn ? '0 0 6px rgba(245,158,11,0.6)' : 'none' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: interceptOn ? '#F59E0B' : '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {interceptOn ? 'Protection Active' : 'Paused'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setView('settings')} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: 8 }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Unified Protection Card */}
        <div 
          onClick={toggleIntercept}
          style={{ 
            padding: '24px', borderRadius: 24, cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 24,
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Neutralized</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-1.5px', marginTop: 4 }}>{stats.blocked + stats.warnings}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Protected</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#38BDF8', letterSpacing: '-1.5px', marginTop: 4 }}>{stats.safe}</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Real-time scanning {interceptOn ? 'active' : 'paused'}</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: interceptOn ? '#3B82F6' : '#334155', boxShadow: interceptOn ? '0 0 10px rgba(59,130,246,0.7)' : 'none' }} />
          </div>
        </div>

        {/* Intelligence Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence Feed</div>
          <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
            {activities.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Environment Secure</div>
              </div>
            ) : (
              activities.map((a, i) => (
                <div key={i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'blocked' ? '#38BDF8' : '#64748B' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.4, fontWeight: 500 }}>{a.text}</div>
                    <div style={{ fontSize: 10, color: '#334155', marginTop: 4, textTransform: 'uppercase', fontWeight: 700 }}>{a.platform || 'System'} • {a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } }
        @keyframes scan { 0% { left: -100%; } 100% { left: 100%; } }
        button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        button:hover { opacity: 0.8 !important; transform: scale(1.02); }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
