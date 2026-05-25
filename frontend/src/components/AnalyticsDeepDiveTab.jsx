import React, { useState, useEffect } from 'react';

var CREATOR = 0.90;
var PLATFORM = 0.10;

var BASE_TXN = [
  { id: 'tx1', type: 'tip',          amount: 2500, creator: 'SwanyThree',   stream: 'Friday Night Dominos' },
  { id: 'tx2', type: 'subscription', amount: 1500, creator: 'CaliBonesOG',  tier: 'gold' },
  { id: 'tx3', type: 'tip',          amount: 5000, creator: 'SwanyThree',   stream: 'Washington Classic' },
  { id: 'tx4', type: 'subscription', amount: 500,  creator: 'SwanyThree',   tier: 'silver' },
  { id: 'tx5', type: 'fades_boost',  amount: 1000, creator: 'CaliBonesOG',  stream: 'Fades Session' },
  { id: 'tx6', type: 'direct_pay',   amount: 10000,creator: 'SwanyThree',   stream: 'Special Event' },
];

var ENG_DATA = [72, 68, 81, 76, 85, 79, 88, 83, 91, 87, 94, 89];
var REV_DATA = [45, 52, 38, 71, 83, 67, 94, 88, 102, 95, 118, 134];
var TOP_COUNTRIES = [['🇺🇸', 'USA', 38], ['🇳🇬', 'Nigeria', 14], ['🇬🇧', 'UK', 11], ['🇧🇷', 'Brazil', 9], ['🇯🇵', 'Japan', 7]];

var RETENTION = [100, 96, 91, 88, 85, 79, 74, 68, 63, 57, 52, 49, 44, 41, 38, 35, 33, 31, 30, 29];
var HOURLY    = [142, 287, 612, 934, 1408, 2102, 2847, 2694, 2211, 1837, 1402, 987, 623, 401, 244, 178, 134, 97, 72, 54, 42, 31, 24, 18];

function fmtC(c) { return '$' + (Math.floor(c || 0) / 100).toFixed(2); }

var TYPE_COLORS = { tip: '#00C9A7', subscription: '#C0C0C0', fades_boost: '#FF1A3C', direct_pay: '#9B4DCA' };

export default function AnalyticsDeepDiveTab({ viewerCount, gifts, isLive, addToast }) {
  var [engData, setEngData] = useState(ENG_DATA.slice());
  var [revData, setRevData] = useState(REV_DATA.slice());
  var [txns, setTxns] = useState(BASE_TXN.slice());
  var [typeFilter, setTypeFilter] = useState('all');
  var [leaderboard, setLeaderboard] = useState([]);

  useEffect(function() {
    fetch('/api/leaderboard')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.leaderboard && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(function() {});
  }, []);

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
    setTxns(function(prev) {
      var ids = {};
      prev.forEach(function(t) { ids[t.id] = true; });
      var newOnes = liveGiftTxns.filter(function(t) { return !ids[t.id]; });
      if (newOnes.length === 0) return prev;
      return prev.concat(newOnes).slice(-30);
    });
  }, [gifts]);

  function exportCSV() {
    var rows = ['id,type,creator,amount_cents,creator_payout_cents,stream'].concat(txns.map(function(tx) {
      return [tx.id, tx.type, tx.creator, tx.amount, Math.floor(tx.amount * CREATOR), (tx.stream || tx.tier || '')].join(',');
    }));
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'seewhy-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(function() {
    if (!isLive) { return; }
    var interval = setInterval(function() {
      var newEng = Math.floor(60 + Math.random() * 40);
      setEngData(function(prev) {
        return prev.slice(1).concat([newEng]);
      });
      setRevData(function(prev) {
        var last = prev[prev.length - 1];
        var newRev = Math.floor(last + Math.random() * 20 - 5);
        if (newRev < 10) { newRev = 10; }
        return prev.slice(1).concat([newRev]);
      });
    }, 4500);
    return function() { clearInterval(interval); };
  }, [isLive]);

  useEffect(function() {
    if (!isLive) { return; }
    var interval = setInterval(function() {
      var types = ['tip', 'subscription', 'fades_boost'];
      var creators = ['SwanyThree', 'CaliBonesOG'];
      var newType = types[Math.floor(Math.random() * types.length)];
      var newCreator = creators[Math.floor(Math.random() * creators.length)];
      var newAmount = Math.floor(200 + Math.random() * 2000);
      var newTx = {
        id: 'live_' + Date.now(),
        type: newType,
        amount: newAmount,
        creator: newCreator,
        stream: 'Live Stream'
      };
      setTxns(function(prev) {
        return prev.concat([newTx]).slice(-10);
      });
    }, 7000);
    return function() { clearInterval(interval); };
  }, [isLive]);

  var TX_TYPES = ['all', 'tip', 'subscription', 'fades_boost', 'direct_pay'];
  var visibleTxns = typeFilter === 'all' ? txns : txns.filter(function(t) { return t.type === typeFilter; });

  var totalGross   = txns.reduce(function(s, t) { return s + t.amount; }, 0);
  var totalCreator = Math.floor(totalGross * CREATOR);
  var totalPlatform = Math.floor(totalGross * PLATFORM);
  var peakEng      = Math.max.apply(null, engData);
  var peakRev      = Math.max.apply(null, revData);
  var viewers      = viewerCount || 2847;
  var topTxn       = txns.reduce(function(m, t) { return t.amount > m ? t.amount : m; }, 0);

  var creatorMap = {};
  txns.forEach(function(tx) {
    if (!creatorMap[tx.creator]) creatorMap[tx.creator] = { total: 0, count: 0 };
    creatorMap[tx.creator].total += tx.amount;
    creatorMap[tx.creator].count += 1;
  });
  var topCreators = Object.keys(creatorMap).map(function(name) {
    return [name, creatorMap[name].total, creatorMap[name].count];
  }).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430, overflowY: 'auto' }}>
      {/* Session summary */}
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>SESSION SUMMARY</span>
          <button
            onClick={exportCSV}
            style={{ background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 4, padding: '3px 10px', color: '#00C9A7', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
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
              <div key={item[1]} style={{ textAlign: 'center', background: 'rgba(22,16,32,.6)', borderRadius: 6, padding: '6px 4px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C' }}>{item[0]}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>{item[1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          [viewers.toLocaleString(), 'VIEWERS',  '#C8FF00'],
          [fmtC(totalCreator),       'EARNED',   '#C9A84C'],
          [(gifts || []).length + '🎁','GIFTS',   '#C8FF00'],
          ['48',                     'COUNTRIES','#00DEC0'],
          ['94/100',                 'ENG SCORE','#00C96A'],
          ['12.4m',                  'AVG WATCH','#5A8FFF'],
        ].map(function(row) {
          return (
            <div key={row[1]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1.5, marginBottom: 3 }}>{row[1]}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: row[2], lineHeight: 1.1 }}>{row[0]}</div>
            </div>
          );
        })}
      </div>

      {/* Engagement chart */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
          ENGAGEMENT — LAST 12 MIN
          {isLive && (
            <span style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', marginLeft: 6 }}>● LIVE</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
          {engData.map(function(v, i) {
            return (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(180deg,#5A8FFF,#2A6BFF88)', borderRadius: '3px 3px 0 0', height: (v / peakEng * 100) + '%', minHeight: 4 }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>12m ago</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#5A8FFF' }}>PEAK: {peakEng}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>now</span>
        </div>
      </div>

      {/* Revenue trend */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>REVENUE TREND</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 44 }}>
          {revData.map(function(v, i) {
            return (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(180deg,#C9A84C,#80002088)', borderRadius: '3px 3px 0 0', height: (v / peakRev * 100) + '%', minHeight: 4 }} />
            );
          })}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C9A84C', marginTop: 4, textAlign: 'right' }}>↑ Session high: +47%</div>
      </div>

      {/* Countries */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>TOP VIEWER COUNTRIES</div>
        {TOP_COUNTRIES.map(function(row) {
          return (
            <div key={row[1]} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{row[0]}</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5', width: 56, flexShrink: 0 }}>{row[1]}</span>
              <div style={{ flex: 1, height: 5, background: '#241C34', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: row[2] + '%', background: 'linear-gradient(90deg,#800020,#C9A84C)', borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', flexShrink: 0 }}>{row[2]}%</span>
            </div>
          );
        })}
      </div>

      {/* Retention curve */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C084FC', letterSpacing: 2, marginBottom: 8 }}>VIEWER RETENTION CURVE</div>
        <div style={{ position: 'relative', height: 50, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          {RETENTION.map(function(v, i) {
            var h = (v / 100) * 100;
            var hue = Math.floor((v / 100) * 120);
            var color = 'hsl(' + hue + ',90%,55%)';
            return (
              <div key={i} style={{ flex: 1, height: h + '%', background: color, borderRadius: '2px 2px 0 0', opacity: 0.8, minHeight: 3 }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>0:00</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C084FC' }}>AVG HOLD: {RETENTION[Math.floor(RETENTION.length / 2)]}%</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>+20m</span>
        </div>
      </div>

      {/* Hourly viewers */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00DEC0', letterSpacing: 2, marginBottom: 8 }}>HOURLY VIEWERS — TODAY</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 50 }}>
          {HOURLY.map(function(v, i) {
            var peak = Math.max.apply(null, HOURLY);
            var h = Math.floor((v / peak) * 100);
            var isPeak = v === peak;
            return (
              <div key={i} style={{ flex: 1, height: h + '%', background: isPeak ? 'linear-gradient(180deg,#C8FF00,#00DEC0)' : 'linear-gradient(180deg,#00DEC055,#00DEC022)', borderRadius: '2px 2px 0 0', minHeight: 3 }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>12AM</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C8FF00' }}>PEAK: {Math.max.apply(null, HOURLY).toLocaleString()} @ 6PM</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>11PM</span>
        </div>
      </div>

      {/* 90/10 split */}
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2, marginBottom: 8 }}>90/10 SPLIT HEALTH</div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: '90%', background: 'linear-gradient(90deg,#800020,#C9A84C)' }} />
          <div style={{ flex: 1, background: '#241C34' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C' }}>CREATOR 90% — {fmtC(totalCreator)}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>PLATFORM 10% — {fmtC(totalPlatform)}</span>
        </div>
      </div>

      {/* Top Creators leaderboard */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', letterSpacing: 2 }}>TOP CREATORS BY REVENUE</div>
          {leaderboard.length > 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7', letterSpacing: 1 }}>● LIVE DB</div>}
        </div>
        {(leaderboard.length > 0 ? leaderboard.map(function(row, i) {
          var topTotal = leaderboard[0].total_cents || 1;
          var pct = Math.floor((row.total_cents / topTotal) * 100);
          return (
            <div key={row.from_user + i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: i === 0 ? '#C9A84C' : '#7A6F90', width: 16, flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5', flex: 1 }}>{row.from_user}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7' }}>{fmtC(row.creator_cents)}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{row.gift_count} TXN</span>
              </div>
              <div style={{ height: 3, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: i === 0 ? 'linear-gradient(90deg,#800020,#C9A84C)' : 'linear-gradient(90deg,#5A8FFF,#00C9A7)', borderRadius: 2 }} />
              </div>
            </div>
          );
        }) : topCreators.map(function(item, i) {
          var pct = totalGross > 0 ? Math.floor((item[1] / totalGross) * 100) : 0;
          return (
            <div key={item[0]} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: i === 0 ? '#C9A84C' : '#7A6F90', width: 16, flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5', flex: 1 }}>{item[0]}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7' }}>{fmtC(Math.floor(item[1] * CREATOR))}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{item[2]} TXN</span>
              </div>
              <div style={{ height: 3, background: '#241C34', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: i === 0 ? 'linear-gradient(90deg,#800020,#C9A84C)' : 'linear-gradient(90deg,#5A8FFF,#00C9A7)', borderRadius: 2 }} />
              </div>
            </div>
          );
        }))}
      </div>

      {/* Ledger */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2 }}>TRANSACTION LEDGER</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{visibleTxns.length} shown</div>
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 8, paddingBottom: 2 }}>
          {TX_TYPES.map(function(t) {
            var active = typeFilter === t;
            var c = TYPE_COLORS[t] || '#7A6F90';
            return (
              <button key={t} onClick={function() { setTypeFilter(t); }}
                style={{ background: active ? (c + '22') : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? (c + '66') : '#241C34'), borderRadius: 999, padding: '2px 10px', color: active ? c : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t}
              </button>
            );
          })}
        </div>
        {visibleTxns.map(function(tx) {
          var c = TYPE_COLORS[tx.type] || '#7A6F90';
          var creatorAmt = Math.floor(tx.amount * CREATOR);
          return (
            <div key={tx.id} style={{ background: 'rgba(7,5,10,.6)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ background: c + '18', border: '1px solid ' + c + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: c }}>
                  {tx.type.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5', flex: 1 }}>{tx.creator}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#C9A84C' }}>{fmtC(tx.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{tx.stream || tx.tier || '—'}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7' }}>→ {fmtC(creatorAmt)} creator</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
