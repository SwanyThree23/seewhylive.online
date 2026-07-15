import React, { useState, useEffect } from 'react';

const F = { fontFamily: 'Barlow Condensed, sans-serif' };

// Derive bar color from quality string
function qualityToColor(quality) {
  if (quality === 'excellent') return '#22c55e';
  if (quality === 'good')      return '#6DBF7E';
  if (quality === 'fair')      return '#F59E0B';
  if (quality === 'poor')      return '#EF4444';
  if (quality === 'offline')   return '#6B7280';
  return '#6DBF7E'; // default good
}

function qualityToLabel(quality) {
  if (quality === 'excellent') return 'Excellent';
  if (quality === 'good')      return 'HD';
  if (quality === 'fair')      return 'SD';
  if (quality === 'poor')      return 'Poor';
  if (quality === 'offline')   return 'Offline';
  return 'HD';
}

function qualityToBars(quality) {
  if (quality === 'excellent') return 4;
  if (quality === 'good')      return 3;
  if (quality === 'fair')      return 2;
  if (quality === 'poor')      return 1;
  if (quality === 'offline')   return 0;
  return 3;
}

/**
 * StreamMetricsBar — live stream status strip.
 *
 * Props:
 *   startTime    number|null   — Date.now() when stream started
 *   memberCount  number        — current viewer/participant count
 *   tipTotal     number        — accumulated tips in dollars
 *   peakViewers  number        — peak concurrent viewers
 *   netQuality   string|null   — 'excellent'|'good'|'fair'|'poor'|'offline'
 *   netRtt       number|null   — RTT in ms (shown as tooltip)
 */
export default function StreamMetricsBar({
  startTime,
  memberCount = 0,
  tipTotal = 0,
  peakViewers = 0,
  netQuality = null,
  netRtt = null,
}) {
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

  function fmt(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const barColor = qualityToColor(netQuality);
  const barCount = qualityToBars(netQuality);
  const barLabel = qualityToLabel(netQuality);
  const rttTitle = netRtt != null ? `${Math.round(netRtt)}ms RTT · ${netQuality || ''}` : netQuality || undefined;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '4px 12px',
      background: 'rgba(0,0,0,0.35)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      overflowX: 'auto',
    }}>
      {/* Live timer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.08)', marginRight: 10,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C0392B', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.04em', color: '#C0392B', ...F, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(elapsed)}
        </span>
      </div>

      {/* Viewers */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.08)', marginRight: 10,
      }}>
        <span style={{ fontSize: 10 }}>👁</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.8)', ...F }}>{memberCount}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', ...F }}>live</span>
        {peak > memberCount && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', ...F }}>· {peak} peak</span>
        )}
      </div>

      {/* Tips */}
      {tipTotal > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.08)', marginRight: 10,
        }}>
          <span style={{ fontSize: 10 }}>💰</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#D4AF37', ...F }}>${tipTotal.toFixed(2)}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', ...F }}>earned</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Network quality indicator */}
      <div
        style={{ display: 'flex', alignItems: 'flex-end', gap: 2, cursor: rttTitle ? 'default' : undefined }}
        title={rttTitle}
      >
        {[4, 6, 8, 10].map((h, i) => (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 1,
            background: i < barCount ? barColor : 'rgba(255,255,255,0.15)',
            transition: 'background 0.4s ease',
          }} />
        ))}
        <span style={{ fontSize: 11, marginLeft: 3, ...F, color: barColor, transition: 'color 0.4s ease' }}>
          {barLabel}
        </span>
      </div>
    </div>
  );
}
