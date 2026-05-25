import React, { useState, useEffect } from 'react';

export default function AnalyticsTab({ roomId, gifts, viewerCount }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics?roomId=' + roomId)
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomId]);

  const totalGiftCents = gifts.reduce((sum, g) => {
    return sum + (g.value_cents || g.valueCents || 0);
  }, 0);
  const totalGiftDollars = (totalGiftCents / 100).toFixed(2);
  const creatorGiftCents = gifts.reduce((sum, g) => {
    return sum + (g.creator_cents || g.creatorCents || 0);
  }, 0);

  const CREATOR = 0.90;

  function StatCard({ label, value, sub }) {
    return (
      <div className="stat-card glass-card">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    );
  }

  return (
    <div className="tab-panel">
      <h2 className="panel-title" style={{marginBottom:'1rem'}}>📊 SESSION ANALYTICS</h2>

      <div className="stats-grid">
        <StatCard label="LIVE VIEWERS" value={viewerCount} sub="Real-time" />
        <StatCard label="GIFTS THIS SESSION" value={gifts.length} sub={gifts.length + ' total'} />
        <StatCard
          label="GIFT REVENUE"
          value={'$' + totalGiftDollars}
          sub={'Creator: $' + (creatorGiftCents / 100).toFixed(2)}
        />
        {metrics && metrics.peakViewers && (
          <StatCard label="PEAK VIEWERS" value={metrics.peakViewers} sub="This session" />
        )}
        {metrics && metrics.totalMessages && (
          <StatCard label="CHAT MESSAGES" value={metrics.totalMessages} sub="This session" />
        )}
        {metrics && typeof metrics.totalRevenueCents === 'number' && (
          <StatCard
            label="TOTAL REVENUE"
            value={'$' + (metrics.totalRevenueCents / 100).toFixed(2)}
            sub={'Creator: $' + (Math.floor(metrics.totalRevenueCents * CREATOR) / 100).toFixed(2)}
          />
        )}
      </div>

      {loading && <div className="muted-text" style={{marginTop:'1rem'}}>Loading session data...</div>}

      <div className="glass-card" style={{marginTop:'1rem'}}>
        <h3 className="panel-title">GIFT BREAKDOWN</h3>
        {gifts.length === 0 && <p className="muted-text">No gifts yet this session</p>}
        <div className="gift-table">
          {gifts.slice(-20).reverse().map((g, i) => (
            <div key={i} className="gift-table-row">
              <span className="gift-emoji">{g.emoji || '🎁'}</span>
              <span className="gift-from">{g.from_user || g.fromUser || 'anon'}</span>
              <span className="gift-name">{g.name || 'Gift'}</span>
              <span className="gift-amount" style={{color:'#C9A84C'}}>
                ${((g.value_cents || g.valueCents || 0) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{marginTop:'1rem'}}>
        <h3 className="panel-title">REVENUE SPLIT</h3>
        <p className="panel-sub">All calculations use Math.floor() — IMMUTABLE 90/10 split</p>
        <div className="split-visual">
          <div className="split-bar" style={{background:'linear-gradient(90deg, #C9A84C 90%, #800020 10%)'}}>
            <span className="split-label-creator">CREATOR 90%</span>
            <span className="split-label-platform">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
