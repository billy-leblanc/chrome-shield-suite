import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const { Shield, AlertTriangle, CheckCircle, XCircle } = {
  Shield: (p: any) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  AlertTriangle: (p: any) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: (p: any) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: (p: any) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

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
    <div style={{ width: 380, minHeight: 500, background: '#0B1120', color: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: 20, height: 20, color: '#22D3EE' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9', letterSpacing: '-0.3px' }}>Safety Intercept</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>AI-Powered Payment Protection</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99,
          background: interceptOn ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${interceptOn ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: interceptOn ? '#22C55E' : '#F87171', animation: interceptOn ? 'pulse 2s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: interceptOn ? '#22C55E' : '#F87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {interceptOn ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <div style={{ padding: '12px 20px 0' }}>
        <button onClick={toggleIntercept} style={{
          width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${interceptOn ? '#1E3A5F' : 'rgba(248,113,113,0.3)'}`,
          background: interceptOn ? '#0F172A' : 'rgba(248,113,113,0.08)', color: interceptOn ? '#22D3EE' : '#F87171',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {interceptOn ? 'Disable Shield' : '⚠ Enable Shield'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Protection Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Blocked', value: stats.blocked, color: '#F87171', border: '#7F1D1D' },
            { label: 'Warnings', value: stats.warnings, color: '#FBBF24', border: '#78350F' },
            { label: 'Safe', value: stats.safe, color: '#34D399', border: '#064E3B' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#0F172A', borderRadius: 10, padding: '12px 10px', borderLeft: `3px solid ${s.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div style={{ padding: '16px 20px 0', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Recent Activity</div>
        <div style={{ background: '#0F172A', borderRadius: 10, overflow: 'hidden' }}>
          {activities.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#475569' }}>No activity yet</div>
          ) : (
            activities.map((a, i) => (
              <div key={i} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < activities.length - 1 ? '1px solid #1E293B' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'blocked' ? '#F87171' : '#FBBF24', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#94A3B8', flex: 1 }}>{a.text}</span>
                <span style={{ fontSize: 10, color: '#475569' }}>{a.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1E293B', marginTop: 16 }}>
        <span style={{ fontSize: 10, color: '#334155' }}>Safety Intercept v1.0.0</span>
        <button onClick={() => setShowResetConfirm(true)} style={{ fontSize: 10, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Reset Stats
        </button>
      </div>

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#131B2E', border: '1px solid #1E293B', borderRadius: 16, padding: 24, width: 300 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Reset all stats?</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>This will permanently clear all blocked counts, warnings, and threat history.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#1E293B', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleReset} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#F87171', border: 'none', color: '#0B1120', cursor: 'pointer', fontWeight: 700 }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
