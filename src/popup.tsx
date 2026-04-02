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
  const [interceptOn, setInterceptOn] = useState(true);
  const [stats, setStats] = useState({ blocked: 0, warnings: 0, safe: 0 });
  const [activities, setActivities] = useState<Array<{ text: string; time: string; type: string; platform?: string }>>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['stats', 'threatLog', 'interceptEnabled'], (result) => {
      if (chrome.runtime.lastError) return;
      if (result.stats) setStats({
        blocked: result.stats.blocked ?? 0,
        warnings: result.stats.warnings ?? 0,
        safe: result.stats.safe ?? 0,
      });
      if (Array.isArray(result.threatLog)) setActivities(result.threatLog.slice(0, 4));
      if (typeof result.interceptEnabled === 'boolean') setInterceptOn(result.interceptEnabled);
    });
  }, []);

  const toggleIntercept = useCallback(() => {
    const next = !interceptOn;
    setInterceptOn(next);
    chrome.storage.local.set({ interceptEnabled: next });
  }, [interceptOn]);

  const handleReset = useCallback(() => {
    chrome.storage.local.remove(['stats', 'threatLog'], () => {
      setStats({ blocked: 0, warnings: 0, safe: 0 });
      setActivities([]);
      setShowResetConfirm(false);
    });
  }, []);

  return (
    <div style={{
      width: 380,
      minHeight: 520,
      background: 'linear-gradient(160deg, #0D1526 0%, #0B1120 60%)',
      color: '#F1F5F9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* Header */}
      <div style={{
        padding: '22px 22px 18px',
        background: 'linear-gradient(180deg, rgba(56,189,248,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Shield icon with scan line */}
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #1a3a60 0%, #0f2040 100%)',
            boxShadow: interceptOn ? '0 0 18px rgba(56,189,248,0.3), inset 0 1px 0 rgba(56,189,248,0.1)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'box-shadow 0.4s ease',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <ShieldIcon style={{ width: 24, height: 24, color: interceptOn ? '#38BDF8' : '#475569', position: 'relative', zIndex: 1 }} />
            {interceptOn && (
              <div style={{
                position: 'absolute', top: 0, left: '-100%',
                width: '60%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)',
                animation: 'scan 3s ease-in-out infinite',
              }} />
            )}
          </div>

          <div>
            <div style={{
              fontWeight: 800, fontSize: 15, color: '#F1F5F9',
              letterSpacing: '-0.5px', lineHeight: 1.2,
            }}>
              Safety Intercept
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2, letterSpacing: '0.02em' }}>
              AI-Powered Payment Protection
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 99,
          background: interceptOn ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${interceptOn ? 'rgba(34,197,94,0.25)' : 'rgba(248,113,113,0.25)'}`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: interceptOn ? '#22C55E' : '#F87171',
            animation: interceptOn ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: interceptOn ? '#22C55E' : '#F87171',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {interceptOn ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Toggle Row */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', letterSpacing: '-0.1px' }}>
              Real-time Protection
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              {interceptOn ? 'Scanning all payment activity' : 'Protection is paused'}
            </div>
          </div>
          <button onClick={toggleIntercept} style={{
            padding: '6px 14px', borderRadius: 99, cursor: 'pointer',
            background: interceptOn ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${interceptOn ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: interceptOn ? '#22C55E' : '#F87171',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            transition: 'all 0.2s ease',
          }}>
            {interceptOn ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px 22px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
          Protection Stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Blocked',  value: stats.blocked,  color: '#F87171', glow: 'rgba(248,113,113,0.12)', accent: 'rgba(248,113,113,0.4)',
              icon: <svg viewBox="0 0 16 16" fill="none" style={{width:14,height:14,marginBottom:4}}><path d="M8 1L2 4v4c0 3.5 2.5 6.7 6 7.4 3.5-.7 6-3.9 6-7.4V4L8 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M5.5 8.5l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0" /><path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            { label: 'Warnings', value: stats.warnings, color: '#FBBF24', glow: 'rgba(251,191,36,0.10)',  accent: 'rgba(251,191,36,0.4)',
              icon: <svg viewBox="0 0 16 16" fill="none" style={{width:14,height:14,marginBottom:4}}><path d="M8 2L1.5 13h13L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.6" fill="currentColor"/></svg> },
            { label: 'Safe',     value: stats.safe,     color: '#34D399', glow: 'rgba(52,211,153,0.10)',  accent: 'rgba(52,211,153,0.4)',
              icon: <svg viewBox="0 0 16 16" fill="none" style={{width:14,height:14,marginBottom:4}}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 8.5l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          ].map((s) => (
            <div key={s.label} style={{
              background: `linear-gradient(160deg, ${s.glow} 0%, rgba(15,23,42,0.8) 100%)`,
              borderRadius: 12, padding: '14px 10px',
              border: `1px solid ${s.accent}`,
              textAlign: 'center',
              boxShadow: `0 2px 16px ${s.glow}`,
            }}>
              <div style={{ color: s.color, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-1px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div style={{ padding: '20px 22px 0', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
          Recent Activity
        </div>
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {activities.length === 0 ? (
            <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 16 16" fill="none" style={{width:14,height:14,color:'#34D399'}}>
                  <path d="M8 1L2 4v4c0 3.5 2.5 6.7 6 7.4 3.5-.7 6-3.9 6-7.4V4L8 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M5.5 8.5l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>All clear</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>No threats detected in this session</div>
              </div>
            </div>
          ) : (
            activities.map((a, i) => {
              const pm = getPlatformMeta(a.platform);
              return (
                <div key={i} style={{
                  padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: a.type === 'blocked' ? '#F87171' : '#FBBF24',
                    boxShadow: a.type === 'blocked' ? '0 0 6px rgba(248,113,113,0.7)' : '0 0 6px rgba(251,191,36,0.7)',
                  }} />
                  <span style={{ fontSize: 12, color: '#94A3B8', flex: 1, lineHeight: 1.4 }}>{a.text}</span>
                  {pm && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      color: pm.color, background: pm.bg,
                      padding: '2px 7px', borderRadius: 99,
                      flexShrink: 0,
                    }}>
                      {pm.label}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>{a.time}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: 20,
      }}>
        <span style={{ fontSize: 10, color: '#1E293B', fontWeight: 500 }}>v1.0.0</span>
        <button onClick={() => setShowResetConfirm(true)} style={{
          fontSize: 10, color: '#475569', background: 'none', border: 'none',
          cursor: 'pointer', letterSpacing: '0.02em',
        }}>
          Reset Stats
        </button>
      </div>

      {/* Reset Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: 'linear-gradient(160deg, #131B2E 0%, #0D1526 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24, width: 300,
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#F1F5F9' }}>Reset all stats?</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently clear all blocked counts, warnings, and threat history.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowResetConfirm(false)} style={{
                flex: 1, padding: '9px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}>Cancel</button>
              <button onClick={handleReset} style={{
                flex: 1, padding: '9px', borderRadius: 8,
                background: '#F87171', border: 'none',
                color: '#0B1120', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes scan { 0% { left: -60%; } 100% { left: 160%; } }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
