import React, { useState, useEffect } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var CREATOR = 0.90;
var PLATFORM = 0.10;


function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }

var TYPE_COLORS = { tip: '#C9A84C', subscription: '#C0C0C0', fades_boost: '#FF1A3C', direct_pay: '#800020', gift: '#D4854A', paywall: '#800020' };

var VALID_PERIODS = ['today', 'week', 'month'];

export default function AnalyticsDeepDiveTab({ viewerCount, gifts, isLive, addToast }) {
  var [engData, setEngData] = useState([]);
  var [revData, setRevData] = useState([]);
  var [typeFilter, setTypeFilter] = useState('all');
  var [leaderboard, setLeaderboard] = useState([]);
  var [period, setPeriod] = useState('month');
  var [apiData, setApiData] = useState(null);
  var [apiLoading, setApiLoading] = useState(false);
  var [liveTxns, setLiveTxns] = useState([]);

  useEffect(function() {
    fetch('/api/leaderboard')
      .then(function(r) { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(function(data) {
        if (data && data.leaderboard && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(function() {});
  }, []);

  useEffect(function() {
    var token = localStorage.getItem('sw_token') || '';
    if (!token) return;
    setApiLoading(true);
    fetch('/api/creator/analytics?period=' + period, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function(r) { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(function(data) {
        setApiData(data);
        setApiLoading(false);
      })
      .catch(function() { setApiLoading(false); });
  }, [period]);

  useEffect(function() {
    if (!gifts || gifts.length === 0) return;
    var liveGiftTxns = gifts.map(function(g) {
      return {
        id:      'gift_' + (g.id || g.ts || Math.random()),
        type:    'tip',
        amount:  Math.floor(g.value_cents || g.valueCents || 0),
        creator: g.from_user || g.fromUser || 'Anonymous',
        stream:  g.name || 'Gift'
      };
    });
    setLiveTxns(function(prev) {
      var ids = {};
      prev.forEach(function(t) { ids[t.id] = true; });
      var newOnes = liveGiftTxns.filter(function(t) { return !ids[t.id]; });
      if (newOnes.length === 0) return prev;
      return prev.concat(newOnes).slice(-30);
    });
  }, [gifts]);


  // Build txn list: prefer real API recentEarnings, append live gifts not already in it
  var dbTxns = (apiData && apiData.recentEarnings) ? apiData.recentEarnings.map(function(e) {
    return {
      id:      e.id,
      type:    e.payment_type,
      amount:  Math.floor(e.amount_cents || 0),
      creator: e.note || e.stream_id || '—',
      stream:  e.payment_type,
    };
  }) : [];

  var dbIds = {};
  dbTxns.forEach(function(t) { dbIds[t.id] = true; });
  var freshLive = liveTxns.filter(function(t) { return !dbIds[t.id]; });
  var txns = dbTxns.concat(freshLive).slice(-50);

  var TX_TYPES = ['all', 'tip', 'subscription', 'gift', 'paywall', 'fades_boost', 'direct_pay'];
  var visibleTxns = typeFilter === 'all' ? txns : txns.filter(function(t) { return t.type === typeFilter; });

  var totalGross   = txns.reduce(function(s, t) { return s + t.amount; }, 0);
  var totalCreator = apiData ? Math.floor(apiData.creatorCents || 0) : Math.floor(totalGross * CREATOR);
  var totalPlatform = apiData ? Math.floor(apiData.platformCents || 0) : Math.floor(totalGross * PLATFORM);
  var peakEng      = engData.length > 0 ? Math.max.apply(null, engData) : 0;
  var peakRev      = revData.length > 0 ? Math.max.apply(null, revData) : 0;
  var viewers      = viewerCount || 0;
  var topTxn       = txns.reduce(function(m, t) { return t.amount > m ? t.amount : m; }, 0);
  var streamCount  = (apiData && apiData.streamCount) || 0;
  var avgViewers   = (apiData && apiData.avgViewersPerStream) || 0;

  var byType = (apiData && apiData.byType) || { tip: 0, subscription: 0, paywall: 0, gift: 0 };
  var topSupporters = (apiData && apiData.topSupporters) || [];

  function exportCSV() {
    var rows = ['id,type,note,amount_cents,creator_payout_cents'].concat(txns.map(function(tx) {
      return [tx.id, tx.type, (tx.creator || tx.stream || ''), tx.amount, Math.floor(tx.amount * CREATOR)].join(',');
    }));
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'seewhy-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430, overflowY: 'auto' }}>

      {/* Period picker */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1.5 }}>PERIOD:</span>
        {VALID_PERIODS.map(function(p) {
          var active = period === p;
          return (
            <button key={p} onClick={function() { setPeriod(p); }}
              style={{ background: active ? 'rgba(201,168,76,.15)' : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : '#3D3020'), borderRadius: 999, padding: '2px 10px', color: active ? '#C9A84C' : '#8A7A62', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
              {p}
            </button>
          );
        })}
        {apiLoading && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>loading…</span>}
      </div>

      {/* Session summary */}
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>PERIOD SUMMARY</span>
          <button
            onClick={exportCSV}
            style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '3px 10px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
            &#x2193; CSV
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            [txns.length + ' TXN', 'TOTAL'],
            [fmtC(totalCreator), 'EARNED'],
            [fmtC(topTxn), 'TOP TXN'],
          ].map(function(item) {
            return (
              <div key={item[1]} style={{ textAlign: 'center', background: 'rgba(26,21,16,.6)', borderRadius: 6, padding: '6px 4px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C' }}>{item[0]}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1 }}>{item[1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          [viewers.toLocaleString(),             'LIVE NOW',    '#C9A84C'],
          [fmtC(totalCreator),                   'EARNED',      '#C9A84C'],
          [(gifts || []).length + '🎁', 'GIFTS',       '#C9A84C'],
          [streamCount,                          'STREAMS',     '#C9A84C'],
          [avgViewers,                           'AVG VIEWERS', '#C9A84C'],
          [fmtC(byType.tip || 0),               'TIPS',        '#C9A84C'],
        ].map(function(row) {
          return (
            <div key={row[1]} style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62', letterSpacing: 1.5, marginBottom: 3 }}>{row[1]}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: row[2], lineHeight: 1.1 }}>{row[0]}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue breakdown by type */}
      {apiData && (
        <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 10 }}>REVENUE BY TYPE</div>
          {['tip', 'subscription', 'gift', 'paywall'].map(function(t) {
            var val = byType[t] || 0;
            var total = apiData.totalEarningsCents || 1;
            var pct = Math.min(100, Math.floor((val / total) * 100));
            var color = TYPE_COLORS[t] || '#8A7A62';
            return (
              <div key={t} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', textTransform: 'uppercase' }}>{t}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: color }}>{fmtC(val)}</span>
                </div>
                <div style={{ height: 4, background: '#3D3020', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Engagement chart */}
      <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
          ENGAGEMENT — LAST 12 MIN
          {isLive && (
            <span style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', marginLeft: 6 }}>● LIVE</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
          {engData.map(function(v, i) {
            return (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(180deg,#C9A84C,#C9A84C44)', borderRadius: '3px 3px 0 0', height: (v / peakEng * 100) + '%', minHeight: 4 }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>12m ago</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>PEAK: {peakEng}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>now</span>
        </div>
      </div>

      {/* Revenue trend */}
      <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>REVENUE TREND</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 44 }}>
          {revData.map(function(v, i) {
            return (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(180deg,#C9A84C,#80002088)', borderRadius: '3px 3px 0 0', height: (v / peakRev * 100) + '%', minHeight: 4 }} />
            );
          })}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', marginTop: 4, textAlign: 'right' }}>live session trend</div>
      </div>

      {/* 90/10 split */}
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>90/10 SPLIT</div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: '90%', background: 'linear-gradient(90deg,#800020,#C9A84C)' }} />
          <div style={{ flex: 1, background: '#3D3020' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>CREATOR 90% — {fmtC(totalCreator)}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>PLATFORM 10% — {fmtC(totalPlatform)}</span>
        </div>
      </div>

      {/* Top Supporters (real DB) / Top Creators (leaderboard fallback) */}
      <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>
            {topSupporters.length > 0 ? 'TOP SUPPORTERS' : (leaderboard.length > 0 ? 'TOP CREATORS' : 'TOP SUPPORTERS')}
          </div>
          {apiData && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>● LIVE DB</div>}
        </div>
        {topSupporters.length > 0 ? topSupporters.map(function(row, i) {
          var topTotal = (topSupporters[0] && topSupporters[0].totalCents) || 1;
          var pct = Math.floor((row.totalCents / topTotal) * 100);
          return (
            <div key={row.userId + i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ flexShrink: 0 }}>
                  <AvatarPortrait username={row.userId} size={28} rank={i < 3 ? i + 1 : undefined} />
                </div>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', flex: 1 }}>{row.userId}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtC(row.totalCents)}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{row.count} TXN</span>
              </div>
              <div style={{ height: 3, background: '#3D3020', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: i === 0 ? 'linear-gradient(90deg,#800020,#C9A84C)' : '#C9A84C', borderRadius: 2 }} />
              </div>
            </div>
          );
        }) : leaderboard.length > 0 ? leaderboard.map(function(row, i) {
          var topTotal = (leaderboard[0] && leaderboard[0].total_cents) || 1;
          var pct = Math.floor((row.total_cents / topTotal) * 100);
          return (
            <div key={row.from_user + i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ flexShrink: 0 }}>
                  <AvatarPortrait username={row.from_user} size={28} rank={i < 3 ? i + 1 : undefined} />
                </div>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', flex: 1 }}>{row.from_user}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>{fmtC(row.creator_cents)}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{row.gift_count} TXN</span>
              </div>
              <div style={{ height: 3, background: '#3D3020', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: i === 0 ? 'linear-gradient(90deg,#800020,#C9A84C)' : '#C9A84C', borderRadius: 2 }} />
              </div>
            </div>
          );
        }) : (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', textAlign: 'center', padding: '12px 0' }}>
            No data yet — log in as host to see supporter stats
          </div>
        )}
      </div>

      {/* Transaction Ledger */}
      <div style={{ background: 'rgba(26,21,16,.8)', border: '1px solid #3D3020', borderRadius: 10, padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2 }}>TRANSACTION LEDGER</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{visibleTxns.length} shown</div>
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 8, paddingBottom: 2 }}>
          {TX_TYPES.map(function(t) {
            var active = typeFilter === t;
            var c = TYPE_COLORS[t] || '#8A7A62';
            return (
              <button key={t} onClick={function() { setTypeFilter(t); }}
                style={{ background: active ? (c + '22') : 'rgba(26,21,16,.7)', border: '1px solid ' + (active ? (c + '66') : '#3D3020'), borderRadius: 999, padding: '2px 10px', color: active ? c : '#8A7A62', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t}
              </button>
            );
          })}
        </div>
        {visibleTxns.length === 0 && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', textAlign: 'center', padding: '16px 0' }}>
            {apiData ? 'No transactions in this period' : 'Log in as host to see transactions'}
          </div>
        )}
        {visibleTxns.map(function(tx) {
          var c = TYPE_COLORS[tx.type] || '#8A7A62';
          var creatorAmt = Math.floor(tx.amount * CREATOR);
          return (
            <div key={tx.id} style={{ background: 'rgba(14,12,9,.6)', border: '1px solid #3D3020', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ background: c + '18', border: '1px solid ' + c + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: c }}>
                  {tx.type.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#F0E8D4', flex: 1 }}>{tx.creator || '—'}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C' }}>{fmtC(tx.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>{tx.stream || '—'}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>→ {fmtC(creatorAmt)} creator</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
