import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const ShieldIcon = (p: any) => (
  <svg {...p} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
  </svg>
);

function PopupApp() {
  const [interceptOn, setInterceptOn] = useState(true);
  const [stats, setStats] = useState({ blocked: 0, warnings: 0, safe: 0 });
  const [activities, setActivities] = useState<Array<{ text: string; time: string; type: string }>>([]);
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
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)',
            boxShadow: interceptOn ? '0 0 16px rgba(56,189,248,0.25)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'box-shadow 0.4s ease',
          }}>
            <ShieldIcon style={{ width: 22, height: 22, color: interceptOn ? '#38BDF8' : '#475569' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9', letterSpacing: '-0.3px' }}>
              Safety Intercept
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>
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
            fontSize: 10, fontWeight: 600,
            color: interceptOn ? '#22C55E' : '#F87171',
            letterSpacing: '0.06em',
          }}>
            {interceptOn ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <div style={{ padding: '16px 22px 0' }}>
        <button onClick={toggleIntercept} style={{
          width: '100%', padding: '11px 16px', borderRadius: 10,
          border: `1px solid ${interceptOn ? 'rgba(56,189,248,0.15)' : 'rgba(248,113,113,0.25)'}`,
          background: interceptOn
            ? 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(56,189,248,0.02) 100%)'
            : 'rgba(248,113,113,0.06)',
          color: interceptOn ? '#38BDF8' : '#F87171',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.01em',
        }}>
          {interceptOn ? 'Disable Shield' : 'Enable Shield'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px 22px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Protection Stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Blocked', value: stats.blocked, color: '#F87171', glow: 'rgba(248,113,113,0.12)', accent: 'rgba(248,113,113,0.5)' },
            { label: 'Warnings', value: stats.warnings, color: '#FBBF24', glow: 'rgba(251,191,36,0.1)', accent: 'rgba(251,191,36,0.5)' },
            { label: 'Safe', value: stats.safe, color: '#34D399', glow: 'rgba(52,211,153,0.1)', accent: 'rgba(52,211,153,0.5)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: `linear-gradient(160deg, ${s.glow} 0%, rgba(15,23,42,0.8) 100%)`,
              borderRadius: 12, padding: '14px 10px',
              border: `1px solid ${s.accent}`,
              textAlign: 'center',
              boxShadow: `0 2px 12px ${s.glow}`,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.5px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 5, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div style={{ padding: '20px 22px 0', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Recent Activity
        </div>
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {activities.length === 0 ? (
            <div style={{ padding: '18px', textAlign: 'center', fontSize: 12, color: '#334155' }}>
              No threats detected
            </div>
          ) : (
            activities.map((a, i) => (
              <div key={i} style={{
                padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: a.type === 'blocked' ? '#F87171' : '#FBBF24',
                  boxShadow: a.type === 'blocked' ? '0 0 6px rgba(248,113,113,0.6)' : '0 0 6px rgba(251,191,36,0.6)',
                }} />
                <span style={{ fontSize: 12, color: '#94A3B8', flex: 1, lineHeight: 1.4 }}>{a.text}</span>
                <span style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>{a.time}</span>
              </div>
            ))
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
          fontSize: 10, color: '#334155', background: 'none', border: 'none',
          cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2,
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
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
