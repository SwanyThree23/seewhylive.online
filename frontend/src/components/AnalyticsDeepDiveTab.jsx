import React from 'react';

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

export default function AnalyticsDeepDiveTab({ viewerCount, gifts }) {
  var totalGross   = BASE_TXN.reduce(function(s, t) { return s + t.amount; }, 0);
  var totalCreator = Math.floor(totalGross * CREATOR);
  var totalPlatform = Math.floor(totalGross * PLATFORM);
  var peakEng      = Math.max.apply(null, ENG_DATA);
  var peakRev      = Math.max.apply(null, REV_DATA);
  var viewers      = viewerCount || 2847;

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430, overflowY: 'auto' }}>
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
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>ENGAGEMENT — LAST 12 MIN</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
          {ENG_DATA.map(function(v, i) {
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
          {REV_DATA.map(function(v, i) {
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

      {/* Ledger */}
      <div style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>TRANSACTION LEDGER</div>
        {BASE_TXN.map(function(tx) {
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
