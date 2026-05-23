import React, { useState, useEffect, useRef } from 'react';

var CREATOR  = 0.90;
var PLATFORM = 0.10;

function fmtC(cents) { return '$' + (Math.floor(cents || 0) / 100).toFixed(2); }

export default function AnalyticsTab({ roomId, gifts, viewerCount, isLive }) {
  var [metrics,   setMetrics]   = useState(null);
  var [loading,   setLoading]   = useState(true);
  var [refreshed, setRefreshed] = useState(null);
  var [tab,       setTab]       = useState('overview');
  var [viewerSpark, setViewerSpark] = useState(function() {
    var base = viewerCount || 200;
    var arr = [];
    for (var i = 0; i < 24; i++) { arr.push(Math.max(0, base - Math.floor(Math.random() * 100) + i * 8)); }
    return arr;
  });
  var sparkRef = useRef(null);

  var [liveViewerCount, setLiveViewerCount] = useState(viewerCount || 0);
  var [peakViewers, setPeakViewers] = useState(viewerCount || 0);
  var liveViewerRef = useRef(null);

  var [liveGiftCount, setLiveGiftCount] = useState(0);
  var liveGiftRef = useRef(null);

  useEffect(function() {
    sparkRef.current = setInterval(function() {
      setViewerSpark(function(prev) {
        var next = prev.slice(1);
        var last = prev[prev.length - 1] || 0;
        var drift = Math.floor(Math.random() * 40) - 15;
        next.push(Math.max(0, last + drift));
        return next;
      });
    }, 5000);
    return function() { clearInterval(sparkRef.current); };
  }, []);

  useEffect(function() {
    if (liveViewerRef.current) {
      clearInterval(liveViewerRef.current);
      liveViewerRef.current = null;
    }
    if (liveGiftRef.current) {
      clearInterval(liveGiftRef.current);
      liveGiftRef.current = null;
    }
    if (!isLive) { return; }

    liveViewerRef.current = setInterval(function() {
      setLiveViewerCount(function(prev) {
        var drift = Math.floor(Math.random() * 30) - 10;
        var next = Math.max(0, prev + drift);
        setPeakViewers(function(peak) { return next > peak ? next : peak; });
        return next;
      });
    }, 6000);

    liveGiftRef.current = setInterval(function() {
      setLiveGiftCount(function(prev) {
        return prev + Math.floor(Math.random() * 3) + 1;
      });
    }, 12000);

    return function() {
      if (liveViewerRef.current) { clearInterval(liveViewerRef.current); liveViewerRef.current = null; }
      if (liveGiftRef.current) { clearInterval(liveGiftRef.current); liveGiftRef.current = null; }
    };
  }, [isLive]);

  function load() {
    setLoading(true);
    fetch('/api/metrics?roomId=' + roomId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setMetrics(data);
        setLoading(false);
        setRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch(function() { setLoading(false); });
  }

  useEffect(function() { load(); }, [roomId]);

  var giftList = gifts || [];
  var totalGiftCents   = giftList.reduce(function(s, g) { return s + (g.value_cents || g.valueCents || 0); }, 0);
  var creatorCents     = Math.floor(totalGiftCents * CREATOR);
  var platformCents    = Math.floor(totalGiftCents * PLATFORM);

  // Build 12-bucket chart (5 min each = last hour)
  var buckets = [];
  var now = Date.now();
  var BUCKET_MS = 5 * 60 * 1000;
  for (var bi = 0; bi < 12; bi++) {
    var bStart = now - (12 - bi) * BUCKET_MS;
    var bEnd   = bStart + BUCKET_MS;
    var cnt = giftList.filter(function(g) {
      var ts = g.ts || g.timestamp || 0;
      return ts >= bStart && ts < bEnd;
    }).length;
    buckets.push(cnt);
  }
  var maxBucket = Math.max.apply(null, buckets.concat([1]));

  var displayViewers = isLive ? liveViewerCount : (viewerCount || 0);

  var kpis = [
    ['LIVE VIEWERS',  String(displayViewers),                           'Real-time',                               '#C8FF00'],
    ['GIFTS',         String(giftList.length),                          'This session',                            '#C9A84C'],
    ['GIFT REVENUE',  fmtC(totalGiftCents),                             'Total sent',                              '#00C9A7'],
    ['CREATOR EARN',  fmtC(creatorCents),                               '90% of gifts',                            '#FF8C5A'],
    ['PEAK VIEWERS',  isLive ? String(peakViewers) : (metrics && metrics.peakViewers ? String(metrics.peakViewers) : '—'), 'Session peak', '#5A8FFF'],
    ['CHAT MSGS',     metrics && metrics.totalMessages ? String(metrics.totalMessages) : '—', 'This session',     '#C084FC'],
  ];

  var TABS = [['overview', '📊 OVERVIEW'], ['gifts', '🎁 GIFTS'], ['revenue', '💰 REVENUE']];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>

      {/* Header */}
      <div style={{ background: 'rgba(200,255,0,.05)', border: '1px solid rgba(200,255,0,.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C8FF00', letterSpacing: 3 }}>📊 SESSION ANALYTICS</div>
            {isLive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,30,30,.18)', border: '1px solid rgba(255,30,30,.4)', borderRadius: 999, padding: '2px 8px' }}>
                <span style={{ fontSize: 8, color: '#FF3030' }}>●</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#FF3030', letterSpacing: 2 }}>LIVE</span>
              </div>
            )}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>
            Live metrics · {refreshed ? 'Last: ' + refreshed : 'Loading...'}
          </div>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: loading ? 'transparent' : 'rgba(200,255,0,.1)', border: '1px solid rgba(200,255,0,.3)', borderRadius: 7, padding: '6px 12px', color: '#C8FF00', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, letterSpacing: 1 }}>
          {loading ? '...' : '↻ REFRESH'}
        </button>
      </div>

      {/* Live stat chips */}
      {isLive && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(90,143,255,.12)', border: '1px solid rgba(90,143,255,.35)', borderRadius: 999, padding: '4px 12px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#5A8FFF', letterSpacing: 1 }}>
            PEAK: {peakViewers}
          </div>
          <div style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 999, padding: '4px 12px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#C9A84C', letterSpacing: 1 }}>
            GIFTS RECV: {liveGiftCount}
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: 3 }}>
        {TABS.map(function(t) {
          var active = tab === t[0];
          return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(200,255,0,.1)' : 'transparent', border: 'none', borderRadius: 6, color: active ? '#C8FF00' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {kpis.map(function(k) {
              return (
                <div key={k[0]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1.5, marginBottom: 4 }}>{k[0]}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: k[3], lineHeight: 1 }}>{k[1]}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3450', marginTop: 3 }}>{k[2]}</div>
                </div>
              );
            })}
          </div>

          {/* Live viewer sparkline */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid rgba(200,255,0,.15)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#C8FF00', letterSpacing: 2 }}>LIVE VIEWERS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C8FF00', boxShadow: '0 0 4px #C8FF00' }} />
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C8FF00', lineHeight: 1 }}>
                  {isLive ? liveViewerCount.toLocaleString() : (viewerSpark.length > 0 ? viewerSpark[viewerSpark.length - 1].toLocaleString() : (viewerCount || 0).toLocaleString())}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 36, position: 'relative' }}>
              {viewerSpark.map(function(v, i) {
                var peak = Math.max.apply(null, viewerSpark.concat([1]));
                var h = Math.max(3, Math.floor((v / peak) * 100));
                var isLatest = i === viewerSpark.length - 1;
                return (
                  <div key={i} style={{ flex: 1, height: h + '%', background: isLatest ? '#C8FF00' : 'rgba(200,255,0,' + (0.15 + i * 0.025) + ')', borderRadius: '2px 2px 0 0', minHeight: 3, transition: 'height .5s ease' }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#3D3450' }}>2m ago</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>updates every 5s</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#3D3450' }}>now</span>
            </div>
          </div>

          {/* Gift activity sparkline */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 10 }}>GIFT ACTIVITY — LAST 60 MIN</div>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 44 }}>
              {buckets.map(function(v, i) {
                var barH = maxBucket > 0 ? Math.max(3, Math.floor((v / maxBucket) * 40)) : 3;
                return (
                  <div key={i} style={{ flex: 1, height: barH, background: v > 0 ? 'linear-gradient(180deg,#C9A84C,rgba(201,168,76,.5))' : '#241C34', borderRadius: 2, transition: 'height .3s ease' }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#3D3450' }}>60m ago</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C' }}>{giftList.length} total</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#3D3450' }}>now</span>
            </div>
          </div>

          {/* Revenue split bar */}
          {totalGiftCents > 0 && (
            <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 8 }}>REVENUE SPLIT</div>
              <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 7 }}>
                <div style={{ width: '90%', background: 'linear-gradient(90deg,#800020,#C9A84C)' }} />
                <div style={{ flex: 1, background: '#241C34' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A84C', lineHeight: 1 }}>{fmtC(creatorCents)}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>CREATOR 90%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#7A6F90', lineHeight: 1 }}>{fmtC(platformCents)}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1 }}>PLATFORM 10%</div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement metrics from API */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                [metrics.totalRevenueCents !== undefined ? fmtC(metrics.totalRevenueCents) : '—', 'ALL REVENUE', '#00C9A7'],
                [metrics.avgWatchSeconds   !== undefined ? Math.floor(metrics.avgWatchSeconds / 60) + 'm' : '—', 'AVG WATCH', '#5A8FFF'],
                [metrics.chatEngagement    !== undefined ? metrics.chatEngagement + '%' : '—', 'ENG SCORE', '#C8FF00'],
              ].map(function(row) {
                return (
                  <div key={row[1]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#7A6F90', letterSpacing: 1, marginBottom: 3 }}>{row[1]}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: row[2], lineHeight: 1 }}>{row[0]}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── GIFTS ── */}
      {tab === 'gifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {giftList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#3D3450' }}>No gifts this session yet</div>
          ) : (
            giftList.slice().reverse().slice(0, 30).map(function(g, i) {
              return (
                <div key={i} style={{ background: 'rgba(22,16,32,.6)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{g.emoji || '🎁'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.from_user || g.from || 'Anonymous'}
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>{g.name || 'Gift'}</div>
                  </div>
                  {g.value_cents ? (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#00C9A7', lineHeight: 1 }}>{fmtC(g.value_cents)}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>cr: {fmtC(Math.floor(g.value_cents * CREATOR))}</div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── REVENUE ── */}
      {tab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Summary cards */}
          {[
            ['TOTAL GIFTS',     fmtC(totalGiftCents),   'All gift transactions',          '#C9A84C'],
            ['CREATOR EARNED',  fmtC(creatorCents),     '90% of all gifts',               '#00C9A7'],
            ['PLATFORM FEE',    fmtC(platformCents),    '10% of all gifts',               '#7A6F90'],
          ].map(function(row) {
            return (
              <div key={row[0]} style={{ background: 'rgba(22,16,32,.8)', border: '1px solid #241C34', borderRadius: 9, padding: '12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 1, marginBottom: 3 }}>{row[0]}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3450' }}>{row[2]}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: row[3], lineHeight: 1 }}>{row[1]}</div>
              </div>
            );
          })}

          {/* 90/10 visual */}
          <div style={{ background: 'rgba(22,16,32,.7)', border: '1px solid #241C34', borderRadius: 10, padding: '12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', letterSpacing: 2, marginBottom: 10 }}>REVENUE SPLIT VISUALIZATION</div>
            <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div style={{ width: '90%', background: 'linear-gradient(90deg,rgba(128,0,32,.8),rgba(201,168,76,.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#07050A', letterSpacing: 2 }}>CREATOR 90%</span>
              </div>
              <div style={{ flex: 1, background: '#241C34', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>10%</span>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3450', textAlign: 'center', marginTop: 6 }}>
              IMMUTABLE — All platform transactions enforce this split
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
