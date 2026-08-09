import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

function _authHeaders(extra) {
  var tok = localStorage.getItem('sw_token') || '';
  var h = tok ? { 'Authorization': 'Bearer ' + tok } : {};
  return Object.assign(h, extra || {});
}

var BG   = '#0E0C09';
var SURF = '#1A1510';
var CARD = '#1E1810';
var GOLD = '#C9A84C';
var RED  = '#FF1A3C';
var MUTED = '#8A7A62';
var TEXT  = '#F0E8D4';

function fmtUsd(cents) {
  return '$' + (Math.floor(cents) / 100).toFixed(2);
}
function fmtAgo(ts) {
  var d = Math.floor((Date.now() - ts * 1000) / 1000);
  if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}
function typeLabel(type) {
  if (type === 'gift') return '🎁 Gift';
  if (type === 'superchat') return '💬 SuperChat';
  if (type === 'ppv') return '🔒 PPV';
  return type;
}
function typeColor(type) {
  if (type === 'gift') return '#C9A84C';
  if (type === 'superchat') return '#FF1A3C';
  return '#8A7A62';
}

export default function AdminDashboard({ addToast }) {
  var [data, setData]         = useState(null);
  var [loading, setLoading]   = useState(true);
  var [error, setError]       = useState(null);
  var [tab, setTab]           = useState('overview');
  var timerRef = useRef(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/financial-summary', { headers: _authHeaders() })
      .then(function(r) {
        if (r.status === 401) throw new Error('Admin access required');
        if (r.status === 403) throw new Error('Admin access required');
        if (!r.ok) throw new Error('Server error (' + r.status + ')');
        return r.json();
      })
      .then(function(d) {
        setData(d);
        setLoading(false);
        setError(null);
      })
      .catch(function(e) {
        setError(e.message);
        setLoading(false);
      });
  }

  useEffect(function() {
    load();
    timerRef.current = setInterval(load, 30000);
    return function() { clearInterval(timerRef.current); };
  }, []);

  var summary = (data && data.summary) || {};
  var txns    = (data && data.recentTransactions) || [];
  var creators = (data && data.topCreators) || [];

  var totalVolumeCents = (summary.totalCreatorCents || 0) + (summary.totalPlatformCents || 0);
  var platformPct = totalVolumeCents > 0 ? Math.floor((summary.totalPlatformCents / totalVolumeCents) * 100) : 0;
  var creatorPct  = totalVolumeCents > 0 ? Math.floor((summary.totalCreatorCents  / totalVolumeCents) * 100) : 0;

  var tabBtn = function(id, label) {
    var active = tab === id;
    return (
      <button
        onClick={function() { setTab(id); }}
        style={{ padding: '7px 16px', background: active ? 'rgba(201,168,76,.18)' : 'transparent', border: 'none', borderBottom: active ? '2px solid ' + GOLD : '2px solid transparent', color: active ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ background: BG, minHeight: '100%', padding: 16, fontFamily: "'Barlow Condensed',sans-serif", color: TEXT, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 3, lineHeight: 1 }}>ADMIN DASHBOARD</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 2, letterSpacing: 1 }}>Financial Health · Creator Balances · Transactions</div>
        </div>
        <button
          onClick={load}
          style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '6px 12px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
          ↻ REFRESH
        </button>
      </div>

      {loading && !data && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020', letterSpacing: 2 }}>LOADING...</div>
      )}
      {error && (
        <div style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 8, padding: 12, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#FF6B81', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.18),rgba(14,12,9,.9))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>TOTAL CREATOR EARNINGS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: GOLD, lineHeight: 1 }}>{fmtUsd(summary.totalCreatorCents || 0)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 3 }}>{creatorPct}% of volume</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.22),rgba(14,12,9,.9))', border: '1px solid rgba(128,0,32,.35)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>PLATFORM REVENUE</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: RED, lineHeight: 1 }}>{fmtUsd(summary.totalPlatformCents || 0)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 3 }}>{platformPct}% of volume</div>
            </div>
            <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 14px', gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>TOTAL VOLUME</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: TEXT, lineHeight: 1 }}>{fmtUsd(totalVolumeCents)}</div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8, gap: 1 }}>
                <div style={{ width: creatorPct + '%', background: GOLD, borderRadius: 3 }} />
                <div style={{ width: platformPct + '%', background: RED, borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD }}>■ Creator {creatorPct}%</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED }}>■ Platform {platformPct}%</span>
              </div>
            </div>
          </div>

          {/* Revenue split breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { label: 'GIFTS', data: summary.gifts, icon: '🎁', color: GOLD },
              { label: 'SUPERCHATS', data: summary.superChats, icon: '💬', color: RED },
              { label: 'PPV', data: summary.ppv, icon: '🔒', color: '#8A6AFF' },
            ].map(function(row) {
              var d = row.data || {};
              return (
                <div key={row.label} style={{ background: SURF, border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: '10px 10px' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>{row.icon} {row.label}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: row.color, lineHeight: 1, marginBottom: 2 }}>{fmtUsd(d.creatorCents || 0)}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED }}>creator</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#666', lineHeight: 1, marginTop: 3 }}>{fmtUsd(d.platformCents || 0)}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#444' }}>platform</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED, marginTop: 4 }}>{d.count || 0} txns</div>
                </div>
              );
            })}
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 12 }}>
            {tabBtn('overview', 'TRANSACTIONS')}
            {tabBtn('creators', 'TOP CREATORS')}
          </div>

          {/* Transactions tab */}
          {tab === 'overview' && (
            <div>
              {txns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020' }}>No transactions yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {txns.map(function(tx, i) {
                    return (
                      <div key={i} style={{ background: SURF, border: '1px solid rgba(255,255,255,.05)', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flexShrink: 0, fontFamily: "'DM Mono',monospace", fontSize: 8, color: typeColor(tx.type), background: typeColor(tx.type) + '18', border: '1px solid ' + typeColor(tx.type) + '33', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {typeLabel(tx.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.actor || '—'}
                          </div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{fmtAgo(tx.ts)}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: TEXT, lineHeight: 1 }}>{fmtUsd(tx.totalCents)}</div>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 1 }}>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: GOLD }}>{fmtUsd(tx.creatorCents)} cr</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: RED }}>{fmtUsd(tx.platformCents)} pl</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Top creators tab */}
          {tab === 'creators' && (
            <div>
              {creators.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3020' }}>No creator data yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {creators.map(function(c, i) {
                    var pct = creators[0].totalEarningsCents > 0 ? Math.floor((c.totalEarningsCents / creators[0].totalEarningsCents) * 100) : 0;
                    return (
                      <div key={c.userId} style={{ background: SURF, border: i === 0 ? '1px solid rgba(201,168,76,.25)' : '1px solid rgba(255,255,255,.05)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 22, textAlign: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: i === 0 ? GOLD : i === 1 ? '#A0A0A0' : i === 2 ? '#C87533' : MUTED, flexShrink: 0 }}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </div>
                        <AvatarPortrait username={c.displayName || c.username} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.displayName || c.username}
                          </div>
                          <div style={{ height: 3, background: '#2D2820', borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: 3, width: pct + '%', background: i === 0 ? GOLD : 'rgba(201,168,76,.4)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: i === 0 ? GOLD : TEXT, lineHeight: 1 }}>{fmtUsd(c.totalEarningsCents)}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED }}>total earned</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div style={{ textAlign: 'center', marginTop: 20, fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#2D2540', letterSpacing: 1 }}>
            Auto-refreshes every 30s
          </div>
        </>
      )}
    </div>
  );
}
