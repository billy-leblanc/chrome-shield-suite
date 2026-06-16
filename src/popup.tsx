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
  const [view, setView] = useState<'main' | 'settings' | 'feedback'>('main');
  const [fbMessage, setFbMessage] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbStatus, setFbStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const sendFeedback = useCallback(() => {
    if (fbMessage.trim().length < 2) return;
    setFbStatus('sending');
    chrome.storage.local.get('installId', ({ installId }) => {
      fetch('https://shield-relay.bleblanc.workers.dev/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fbMessage, email: fbEmail || undefined,
          installId, version: chrome.runtime.getManifest().version,
        }),
      }).then(() => { setFbStatus('sent'); setFbMessage(''); setFbEmail(''); })
        .catch(() => setFbStatus('idle'));
    });
  }, [fbMessage, fbEmail]);
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

  const [statsHovered, setStatsHovered] = useState(false);

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
    @keyframes scan-line {
      0%   { left: -100%; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { left: 100%; opacity: 0; }
    }
    @keyframes feed-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dot-pop {
      0%   { transform: scale(0); }
      60%  { transform: scale(1.4); }
      100% { transform: scale(1); }
    }
    @keyframes amber-breathe {
      0%, 100% { box-shadow: 0 0 6px rgba(245,158,11,0.5); }
      50%      { box-shadow: 0 0 12px rgba(245,158,11,0.9), 0 0 20px rgba(245,158,11,0.3); }
    }
  `;

  if (view === 'feedback') {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '24px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { setView('settings'); setFbStatus('idle'); }} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Talk to the maker</div>
        </div>
        <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fbStatus === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🙏</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#F1F5F9' }}>Thank you — this genuinely helps.</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 8, lineHeight: 1.5 }}>You're one of the first people using this. If you left your email, I'll likely reach out personally.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.6 }}>
                This is built by one person, and you're one of the very first users. What's useful? What's annoying? What were you actually worried about? I read every one of these.
              </div>
              <textarea value={fbMessage} onChange={e => setFbMessage(e.target.value)}
                placeholder="Tell me anything — the more honest the better…" rows={5}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#F1F5F9', fontSize: 13, padding: '12px 14px', fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
              <input value={fbEmail} onChange={e => setFbEmail(e.target.value)}
                placeholder="Email (optional — only if you'd like a reply)" type="email"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#F1F5F9', fontSize: 13, padding: '12px 14px', fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={sendFeedback} disabled={fbStatus === 'sending' || fbMessage.trim().length < 2}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: fbMessage.trim().length < 2 ? 'rgba(56,189,248,0.2)' : '#38BDF8', color: fbMessage.trim().length < 2 ? '#64748B' : '#0B1120', fontSize: 13, fontWeight: 700, cursor: fbMessage.trim().length < 2 ? 'default' : 'pointer' }}>
                {fbStatus === 'sending' ? 'Sending…' : 'Send'}
              </button>
              <div style={{ fontSize: 10.5, color: '#475569', textAlign: 'center', lineHeight: 1.5 }}>
                Your email is optional and only stored if you choose to share it.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

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
              <span style={{ position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.35s cubic-bezier(0.34,1.56,0.64,1)', left: telemetryEnabled ? 19 : 3 }} />
            </button>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

          {/* Feedback */}
          <div onClick={() => setView('feedback')}
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Talk to the maker</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Tell us what's useful, annoying, or missing</div>
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
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: '#334155', letterSpacing: '0.05em' }}>
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
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: interceptOn ? '#F59E0B' : '#334155', animation: interceptOn ? 'amber-breathe 2.5s ease-in-out infinite' : 'none' }} />
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
          onMouseEnter={() => setStatsHovered(true)}
          onMouseLeave={() => setStatsHovered(false)}
          style={{
            padding: '24px', borderRadius: 24, cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 24,
            transition: 'all 0.3s ease',
            transform: statsHovered ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: statsHovered ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
            position: 'relative', overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Real-time scanning {interceptOn ? 'active' : 'paused'}</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: interceptOn ? '#3B82F6' : '#334155' }} />
            {interceptOn && <div style={{ position: 'absolute', top: 0, left: '-100%', height: '100%', width: '40%', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)', animation: 'scan-line 3s ease-in-out infinite' }} />}
          </div>
        </div>

        {/* Intelligence Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence Feed</div>
          <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
            {activities.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>All clear so far.</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>We're watching PayPal, Zelle, and Gmail.</div>
              </div>
            ) : (
              activities.map((a, i) => (
                <div key={i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none', animation: `feed-in 0.4s ease-out ${i * 80}ms both` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'blocked' ? '#38BDF8' : '#64748B', animation: `dot-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 80 + 50}ms both` }} />
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
