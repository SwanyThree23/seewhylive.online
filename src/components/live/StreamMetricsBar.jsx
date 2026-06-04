import React, { useState, useEffect } from 'react';

export default function StreamMetricsBar({ startTime, memberCount = 0, tipTotal = 0, peakViewers = 0 }) {
  const [elapsed, setElapsed] = useState(0);
  const [peak, setPeak] = useState(peakViewers);

  useEffect(() => {
    const t0 = startTime || Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  useEffect(() => {
    if (memberCount > peak) setPeak(memberCount);
  }, [memberCount, peak]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const F = { fontFamily: 'Barlow Condensed, sans-serif' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '4px 12px', background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>

      {/* Live timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.08)', marginRight: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1564', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.04em', color: '#FF1564', ...F, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(elapsed)}
        </span>
      </div>

      {/* Viewers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.08)', marginRight: 10 }}>
        <span style={{ fontSize: 10 }}>👁</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.8)', ...F }}>{memberCount}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', ...F }}>live</span>
        {peak > memberCount && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', ...F }}>· {peak} peak</span>
        )}
      </div>

      {/* Tips */}
      {tipTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.08)', marginRight: 10 }}>
          <span style={{ fontSize: 10 }}>💰</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#D4AF37', ...F }}>${tipTotal.toFixed(2)}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', ...F }}>earned</span>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Signal bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {[4, 6, 8, 10].map((h, i) => (
          <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < 3 ? '#6DBF7E' : 'rgba(255,255,255,0.15)' }} />
        ))}
        <span style={{ fontSize: 11, color: '#6DBF7E', marginLeft: 3, ...F }}>HD</span>
      </div>
    </div>
  );
}
