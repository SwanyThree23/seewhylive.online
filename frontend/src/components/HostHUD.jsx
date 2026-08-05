'use strict';
import React, { useState, useEffect, useRef } from 'react';

var CARD   = '#241C12';
var GOLD   = '#C9A84C';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var MUTED  = '#8A7A62';
var BORDER = 'rgba(201,168,76,.12)';

var MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

function healthColor(rtt, loss) {
  if (rtt === null) return MUTED;
  if (rtt < 80  && loss < 1)  return '#5CB85C';
  if (rtt < 150 && loss < 3)  return GOLD;
  if (rtt < 300 && loss < 8)  return AMBER;
  return RED;
}

function healthLabel(rtt, loss) {
  if (rtt === null) return 'NO DATA';
  if (rtt < 80  && loss < 1)  return 'EXCELLENT';
  if (rtt < 150 && loss < 3)  return 'GOOD';
  if (rtt < 300 && loss < 8)  return 'FAIR';
  return 'POOR';
}

function fmtBitrate(kbps) {
  if (!kbps) return '— kbps';
  if (kbps >= 1000) return (kbps / 1000).toFixed(1) + ' Mbps';
  return kbps + ' kbps';
}

export default function HostHUD(props) {
  var sessionEarningsCents = props.sessionEarningsCents;
  var viewerCount          = props.viewerCount;
  var superChatCount       = props.superChatCount;
  var giftCount            = props.giftCount;
  var addToast             = props.addToast;
  var isVisible            = props.isVisible;
  var streamStats          = props.streamStats || null; // { bitratekbps, rttMs, lossPct }
  var onHypePeak           = props.onHypePeak || null;
  var clipCount            = props.clipCount || 0;
  var socket               = props.socket  || null;

  if (!isVisible) return null;

  var openState  = useState(false);
  var open       = openState[0];
  var setOpen    = openState[1];

  var elapsedState = useState(0);
  var elapsed      = elapsedState[0];
  var setElapsed   = elapsedState[1];

  // viewer sparkline (last 20 samples)
  var sparkState = useState([]);
  var spark      = sparkState[0];
  var setSpark   = sparkState[1];

  // Hype meter (0–100)
  var hypeState    = useState(0);
  var hype         = hypeState[0];
  var setHype      = hypeState[1];
  var hypeRef      = useRef(0);
  var prevGiftRef  = useRef(giftCount || 0);
  var prevScRef    = useRef(superChatCount || 0);
  var prevViewRef  = useRef(viewerCount || 0);
  var hypeHighRef  = useRef(null);  // timestamp when hype crossed 80
  var peakFiredRef = useRef(false);
  var onPeakRef    = useRef(onHypePeak);
  onPeakRef.current = onHypePeak;

  var prevViewers = useRef(0);

  useEffect(function() {
    var id = setInterval(function() { setElapsed(function(e) { return e + 1; }); }, 1000);
    return function() { clearInterval(id); };
  }, []);

  // Hype meter tick — runs every 250ms, reads current prop values via refs
  var gcRefSync = useRef(giftCount || 0);
  var scRefSync = useRef(superChatCount || 0);
  var vcRefSync = useRef(viewerCount || 0);
  gcRefSync.current = giftCount || 0;
  scRefSync.current = superChatCount || 0;
  vcRefSync.current = viewerCount || 0;

  useEffect(function() {
    prevGiftRef.current = gcRefSync.current;
    prevScRef.current   = scRefSync.current;
    prevViewRef.current = vcRefSync.current;

    var id = setInterval(function() {
      var gc = gcRefSync.current;
      var sc = scRefSync.current;
      var vc = vcRefSync.current;

      var dg = Math.max(0, gc - prevGiftRef.current);
      var ds = Math.max(0, sc - prevScRef.current);
      var dv = Math.max(0, vc - prevViewRef.current);
      prevGiftRef.current = gc;
      prevScRef.current   = sc;
      prevViewRef.current = vc;

      var bump = dg * 15 + ds * 20 + dv * 3;
      hypeRef.current = Math.min(100, Math.max(0, hypeRef.current + bump - 0.42));

      var now = Date.now();
      if (hypeRef.current >= 80) {
        if (!hypeHighRef.current) hypeHighRef.current = now;
        if (!peakFiredRef.current && now - hypeHighRef.current >= 5000) {
          peakFiredRef.current = true;
          if (onPeakRef.current) onPeakRef.current();
        }
      } else {
        hypeHighRef.current = null;
        peakFiredRef.current = false;
      }

      setHype(Math.round(hypeRef.current));
    }, 250);
    return function() { clearInterval(id); };
  }, []);

  useEffect(function() {
    var prev = prevViewers.current;
    var curr = viewerCount || 0;
    MILESTONES.forEach(function(m) {
      if (prev < m && curr >= m) {
        if (addToast) addToast('🎉 ' + m + ' viewers in the room!', 'success');
      }
    });
    prevViewers.current = curr;
    setSpark(function(s) { return s.concat([curr]).slice(-20); });
  }, [viewerCount]);

  // ── Trivia launcher state ───────────────────────────────────────────────
  var showTriviaFormState = useState(false);
  var showTriviaForm      = showTriviaFormState[0];
  var setShowTriviaForm   = showTriviaFormState[1];

  var triviaQState = useState('');
  var triviaQ      = triviaQState[0];
  var setTriviaQ   = triviaQState[1];

  var triviaOptsState = useState(['', '']);
  var triviaOpts      = triviaOptsState[0];
  var setTriviaOpts   = triviaOptsState[1];

  var triviaCorrectState = useState(0);
  var triviaCorrect      = triviaCorrectState[0];
  var setTriviaCorrect   = triviaCorrectState[1];

  var triviaDurState = useState(20);
  var triviaDur      = triviaDurState[0];
  var setTriviaDur   = triviaDurState[1];

  var triviaActiveState = useState(false);
  var triviaActive      = triviaActiveState[0];
  var setTriviaActive   = triviaActiveState[1];

  var triviaSecsLeftState = useState(0);
  var triviaSecsLeft      = triviaSecsLeftState[0];
  var setTriviaSecsLeft   = triviaSecsLeftState[1];

  var triviaDurRef     = useRef(20);
  triviaDurRef.current = triviaDur;

  useEffect(function() {
    if (!triviaActive) return;
    var remaining = triviaDurRef.current;
    setTriviaSecsLeft(remaining);
    var id = setInterval(function() {
      remaining--;
      setTriviaSecsLeft(remaining);
      if (remaining <= 0) { clearInterval(id); setTriviaActive(false); }
    }, 1000);
    return function() { clearInterval(id); };
  }, [triviaActive]);

  var launchTrivia = function() {
    var q         = triviaQ.trim();
    var validOpts = triviaOpts.filter(function(o) { return o.trim().length > 0; });
    if (!q || validOpts.length < 2) {
      if (addToast) addToast('Need a question and at least 2 options', 'error');
      return;
    }
    if (!socket) { if (addToast) addToast('Not connected', 'error'); return; }
    var correctIdx = Math.min(triviaCorrect, validOpts.length - 1);
    socket.emit('trivia-start', {
      question:   q,
      options:    validOpts.map(function(o) { return { text: o.trim() }; }),
      correctIdx: correctIdx,
      durationMs: triviaDur * 1000
    });
    setTriviaActive(true);
    setShowTriviaForm(false);
    if (addToast) addToast('🎯 Trivia launched!', 'success');
  };

  var endTrivia = function() {
    if (socket) socket.emit('trivia-end', {});
    setTriviaActive(false);
    setTriviaSecsLeft(0);
    if (addToast) addToast('Trivia ended', 'info');
  };

  function fmtTime(s) {
    var h   = Math.floor(s / 3600);
    var m   = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  var totalCents    = Math.floor(sessionEarningsCents || 0);
  var creatorCents  = Math.floor(totalCents * 0.9);
  var platformCents = totalCents - creatorCents;
  var trendUp       = (viewerCount || 0) >= prevViewers.current;

  var hypeColor = hype >= 80 ? RED : hype >= 40 ? GOLD : MUTED;
  var hypeLabel = hype >= 80 ? '🔥 ON FIRE' : hype >= 60 ? 'WARMING UP' : hype >= 30 ? 'BUILDING' : 'COOL';

  // Stream health
  var rtt   = streamStats ? streamStats.rttMs   : null;
  var loss  = streamStats ? streamStats.lossPct : 0;
  var kbps  = streamStats ? streamStats.bitratekbps : 0;
  var hCol  = healthColor(rtt, loss);
  var hLbl  = healthLabel(rtt, loss);

  // Sparkline path
  var sparkMax  = Math.max(1, Math.max.apply(null, spark));
  var sparkPath = spark.length > 1 ? spark.map(function(v, i) {
    var x = Math.round(i / (spark.length - 1) * 100);
    var y = Math.round((1 - v / sparkMax) * 20);
    return (i === 0 ? 'M' : 'L') + x + ',' + y;
  }).join(' ') : '';

  return (
    <div style={{ position: 'fixed', top: 50, right: 0, zIndex: 8000, display: 'flex', alignItems: 'flex-start', pointerEvents: 'none' }}>

      {open && (
        <div style={{ background: 'rgba(26,21,16,.96)', border: '1px solid ' + BORDER, borderRadius: '10px 0 0 10px', padding: '12px 12px 14px', width: 210, pointerEvents: 'all', boxShadow: '-4px 4px 24px rgba(0,0,0,.5)', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2, marginBottom: 10 }}>📊 HOST STATS</div>

          {/* Session earnings */}
          <div style={{ marginBottom: 10, padding: '8px 10px', background: CARD, borderRadius: 8, border: '1px solid rgba(201,168,76,.15)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED, letterSpacing: 1, marginBottom: 3 }}>SESSION EARNED</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: GOLD, lineHeight: 1 }}>
              ${(totalCents / 100).toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <div style={{ flex: 1, background: 'rgba(201,168,76,.08)', borderRadius: 5, padding: '4px 6px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>YOU (90%)</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: GOLD }}>${(creatorCents / 100).toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(138,122,98,.06)', borderRadius: 5, padding: '4px 6px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>PLATFORM (10%)</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: MUTED }}>${(platformCents / 100).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Viewers + Duration */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(255,26,60,.12)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>VIEWERS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: RED, lineHeight: 1 }}>{viewerCount || 0}</div>
                <span style={{ fontSize: 9, color: trendUp ? GOLD : RED }}>{trendUp ? '▲' : '▼'}</span>
              </div>
              {sparkPath && (
                <svg viewBox="0 0 100 20" style={{ width: '100%', height: 14, marginTop: 4, overflow: 'visible' }}>
                  <path d={sparkPath} fill="none" stroke={RED} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(212,133,74,.12)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>DURATION</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: AMBER, marginTop: 2 }}>{fmtTime(elapsed)}</div>
            </div>
          </div>

          {/* Super chats + gifts + clips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>SUPER CHATS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, marginTop: 2 }}>{superChatCount || 0}</div>
            </div>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>GIFTS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, marginTop: 2 }}>{giftCount || 0}</div>
            </div>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>CLIPS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: clipCount > 0 ? GOLD : MUTED, marginTop: 2 }}>{clipCount}</div>
            </div>
          </div>

          {/* Hype Meter */}
          <div style={{ marginBottom: 10, padding: '8px 10px', background: CARD, borderRadius: 8, border: '1px solid ' + hypeColor + '33' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED, letterSpacing: 1 }}>HYPE METER</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: hypeColor, letterSpacing: 1 }}>{hypeLabel}</div>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: hype + '%', background: hype >= 80 ? 'linear-gradient(90deg,#C9A84C,#FF1A3C)' : hype >= 40 ? GOLD : MUTED, borderRadius: 4, transition: 'width .4s ease, background .4s ease', boxShadow: hype >= 80 ? '0 0 8px ' + RED + '88' : 'none' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>0</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: hypeColor }}>{hype}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>100</div>
            </div>
          </div>

          {/* Stream health */}
          <div style={{ borderTop: '1px solid rgba(201,168,76,.1)', paddingTop: 10 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>📡 STREAM HEALTH</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: CARD, borderRadius: 8, border: '1px solid ' + hCol + '33' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: hCol, boxShadow: '0 0 6px ' + hCol, flexShrink: 0 }} />
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: hCol, letterSpacing: 2 }}>{hLbl}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '5px 7px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>BITRATE</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: kbps > 500 ? GOLD : MUTED, marginTop: 2 }}>{fmtBitrate(kbps)}</div>
              </div>
              <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '5px 7px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>RTT</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: rtt !== null ? (rtt < 150 ? GOLD : AMBER) : MUTED, marginTop: 2 }}>
                  {rtt !== null ? rtt + 'ms' : '—'}
                </div>
              </div>
              <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '5px 7px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>LOSS</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: loss < 3 ? GOLD : RED, marginTop: 2 }}>{loss}%</div>
              </div>
            </div>
          </div>

          {/* ── Trivia launcher ─────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(201,168,76,.1)', paddingTop: 10, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2 }}>🎯 TRIVIA</div>
              {!triviaActive && (
                <button onClick={function() { setShowTriviaForm(function(v) { return !v; }); }}
                  style={{ background: 'none', border: 'none', color: showTriviaForm ? GOLD : MUTED, fontSize: 8, cursor: 'pointer', fontFamily: "'DM Mono',monospace", padding: 0 }}>
                  {showTriviaForm ? '▲ HIDE' : '▼ CREATE'}
                </button>
              )}
            </div>

            {triviaActive && (
              <div style={{ padding: '8px 10px', background: CARD, borderRadius: 8, border: '1px solid rgba(201,168,76,.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD }}>LIVE</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: triviaSecsLeft <= 5 ? RED : GOLD }}>{triviaSecsLeft}s</div>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: (triviaDurRef.current > 0 ? Math.round(triviaSecsLeft / triviaDurRef.current * 100) : 0) + '%', background: triviaSecsLeft <= 5 ? RED : GOLD, borderRadius: 2, transition: 'width 1s linear, background .3s' }} />
                </div>
                <button onClick={endTrivia}
                  style={{ width: '100%', padding: '6px 0', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, color: RED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>
                  END TRIVIA
                </button>
              </div>
            )}

            {!triviaActive && showTriviaForm && (
              <div>
                <input value={triviaQ} onChange={function(e) { setTriviaQ(e.target.value); }} placeholder="Question..."
                  style={{ width: '100%', boxSizing: 'border-box', background: CARD, border: '1px solid rgba(201,168,76,.15)', borderRadius: 6, padding: '5px 7px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none', marginBottom: 6 }} />

                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED, marginBottom: 4 }}>Radio = correct answer</div>

                {triviaOpts.map(function(opt, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <input type="radio" name="triviaCorrect" checked={triviaCorrect === i}
                        onChange={function() { setTriviaCorrect(i); }}
                        style={{ accentColor: GOLD, flexShrink: 0 }} />
                      <input value={opt}
                        onChange={function(e) {
                          var val = e.target.value;
                          setTriviaOpts(function(prev) { var n = prev.slice(); n[i] = val; return n; });
                        }}
                        placeholder={'Option ' + (i + 1)}
                        style={{ flex: 1, background: CARD, border: '1px solid ' + (triviaCorrect === i ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.1)'), borderRadius: 5, padding: '4px 6px', color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }} />
                      {triviaOpts.length > 2 && (
                        <button onClick={function() {
                          var idx = i;
                          setTriviaOpts(function(prev) { return prev.filter(function(_, j) { return j !== idx; }); });
                          if (triviaCorrect >= i && triviaCorrect > 0) setTriviaCorrect(function(c) { return c - 1; });
                        }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                      )}
                    </div>
                  );
                })}

                {triviaOpts.length < 4 && (
                  <button onClick={function() { setTriviaOpts(function(prev) { return prev.concat(''); }); }}
                    style={{ background: 'none', border: '1px dashed rgba(201,168,76,.2)', borderRadius: 5, color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '3px 0', cursor: 'pointer', width: '100%', marginBottom: 5 }}>
                    + OPTION
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, whiteSpace: 'nowrap' }}>DURATION</div>
                  <select value={triviaDur} onChange={function(e) { setTriviaDur(Number(e.target.value)); }}
                    style={{ flex: 1, background: CARD, border: '1px solid rgba(201,168,76,.15)', borderRadius: 5, color: '#F0E8D4', fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '3px 4px', outline: 'none' }}>
                    <option value={10}>10s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>

                <button onClick={launchTrivia}
                  style={{ width: '100%', padding: '7px 0', background: 'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.08))', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>
                  LAUNCH
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{ background: open ? 'rgba(26,21,16,.96)' : 'rgba(26,21,16,.85)', border: '1px solid ' + (hype >= 80 && !open ? RED + '99' : BORDER), borderRight: 'none', borderRadius: open ? '0 6px 6px 0' : '6px 0 0 6px', padding: '10px 7px', cursor: 'pointer', pointerEvents: 'all', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: hype >= 80 && !open ? '-2px 2px 14px ' + RED + '55' : '-2px 2px 10px rgba(0,0,0,.4)', transition: 'border-color .3s, box-shadow .3s' }}>
        <span style={{ fontSize: 14 }}>{open ? '▶' : hype >= 80 ? '🔥' : '📊'}</span>
        {!open && (
          <div style={{ width: 6, height: 6, borderRadius: 2, background: hypeColor, boxShadow: '0 0 5px ' + hypeColor, transition: 'background .3s' }} />
        )}
        {!open && (
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: GOLD, letterSpacing: 0.5, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>HOST</span>
        )}
      </button>
    </div>
  );
}
