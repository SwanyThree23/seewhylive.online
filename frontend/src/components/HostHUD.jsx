import React, { useState, useEffect, useRef } from 'react';

var BG     = '#0E0C09';
var SURF   = '#1A1510';
var CARD   = '#241C12';
var GOLD   = '#C9A84C';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var BORDER = 'rgba(201,168,76,.12)';

var MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export default function HostHUD(props) {
  var sessionEarningsCents = props.sessionEarningsCents;
  var viewerCount          = props.viewerCount;
  var superChatCount       = props.superChatCount;
  var giftCount            = props.giftCount;
  var addToast             = props.addToast;
  var isVisible            = props.isVisible;

  if (!isVisible) return null;

  var openState   = useState(false);
  var open        = openState[0];
  var setOpen     = openState[1];

  var elapsedState = useState(0);
  var elapsed      = elapsedState[0];
  var setElapsed   = elapsedState[1];

  var prevViewers = useRef(0);

  // Elapsed timer
  useEffect(function() {
    var id = setInterval(function() { setElapsed(function(e) { return e + 1; }); }, 1000);
    return function() { clearInterval(id); };
  }, []);

  // Viewer milestone toasts
  useEffect(function() {
    var prev = prevViewers.current;
    var curr = viewerCount || 0;
    MILESTONES.forEach(function(m) {
      if (prev < m && curr >= m) {
        if (addToast) addToast('🎉 ' + m + ' viewers in the room!', 'success');
      }
    });
    prevViewers.current = curr;
  }, [viewerCount]);

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

  var prevCount = viewerCount || 0;
  var trendUp   = prevCount >= (prevViewers.current || 0);

  return (
    <div style={{ position: 'fixed', top: 50, right: 0, zIndex: 8000, display: 'flex', alignItems: 'flex-start', pointerEvents: 'none' }}>

      {/* Expanded Panel */}
      {open && (
        <div style={{ background: 'rgba(26,21,16,.95)', border: '1px solid ' + BORDER, borderRadius: '10px 0 0 10px', padding: '12px 12px 14px', width: 200, pointerEvents: 'all', boxShadow: '-4px 4px 24px rgba(0,0,0,.5)' }}>
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

          {/* Viewers */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(255,26,60,.12)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>VIEWERS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: RED, lineHeight: 1 }}>{viewerCount || 0}</div>
                <span style={{ fontSize: 9, color: trendUp ? '#C9A84C' : RED }}>{trendUp ? '▲' : '▼'}</span>
              </div>
            </div>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(212,133,74,.12)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>DURATION</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: AMBER, marginTop: 2 }}>{fmtTime(elapsed)}</div>
            </div>
          </div>

          {/* Super chats + gifts */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>SUPER CHATS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, marginTop: 2 }}>{superChatCount || 0}</div>
            </div>
            <div style={{ flex: 1, background: CARD, borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>GIFTS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, marginTop: 2 }}>{giftCount || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Tab */}
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{ background: open ? 'rgba(26,21,16,.95)' : 'rgba(26,21,16,.85)', border: '1px solid ' + BORDER, borderRight: 'none', borderRadius: open ? '0 6px 6px 0' : '6px 0 0 6px', padding: '10px 7px', cursor: 'pointer', pointerEvents: 'all', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '-2px 2px 10px rgba(0,0,0,.4)' }}>
        <span style={{ fontSize: 14 }}>{open ? '▶' : '📊'}</span>
        {!open && (
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: GOLD, letterSpacing: 0.5, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>HOST</span>
        )}
      </button>
    </div>
  );
}
