import React, { useState, useEffect, useRef } from 'react';

var BURG   = '#800020';
var GOLD   = '#C9A84C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';

var HEART_STYLE = '' +
  '@keyframes heartFloat {' +
  '  0%   { transform: translateY(0) scale(1);      opacity: 1; }' +
  '  70%  { transform: translateY(-80px) scale(1.2); opacity: 0.8; }' +
  '  100% { transform: translateY(-140px) scale(0.5); opacity: 0; }' +
  '}' +
  '@keyframes loveBounce {' +
  '  0%   { transform: translateY(0) scale(1);   opacity: 1; }' +
  '  40%  { transform: translateY(-12px) scale(1.2); opacity: 1; }' +
  '  100% { transform: translateY(-24px) scale(.8);  opacity: 0; }' +
  '}' +
  '@keyframes lovePulse {' +
  '  0%,100% { transform: scale(1); }' +
  '  50%     { transform: scale(1.08); }' +
  '}';

export default function LoveTap(props) {
  var socket   = props.socket;
  var roomId   = props.roomId;
  var userId   = props.userId;
  var username = props.username;
  var addToast = props.addToast;

  var [loveTotal,    setLoveTotal]    = useState(0);
  var [flyHearts,    setFlyHearts]    = useState([]);
  var [bounceTexts,  setBounceTexts]  = useState([]);
  var lastTapRef = useRef(0);
  var heartIdRef = useRef(0);

  // ── Socket: receive love-update ────────────────────────────
  useEffect(function() {
    if (!socket) return;

    function onLoveUpdate(data) {
      if (!data) return;
      if (data.roomId && String(data.roomId) !== String(roomId)) return;
      setLoveTotal(data.total || 0);
      // spawn hearts on others' taps too
      spawnHearts(2);
    }

    socket.on('love-update', onLoveUpdate);
    return function() { socket.off('love-update', onLoveUpdate); };
  }, [socket, roomId]);

  // ── Heart spawner ──────────────────────────────────────────
  function spawnHearts(count) {
    var newHearts = [];
    for (var i = 0; i < count; i++) {
      var id  = ++heartIdRef.current;
      var off = Math.floor(Math.random() * 40) - 20;
      newHearts.push({ id: id, offset: off });
    }
    setFlyHearts(function(prev) { return prev.concat(newHearts); });
    var removeIds = newHearts.map(function(h) { return h.id; });
    setTimeout(function() {
      setFlyHearts(function(prev) {
        return prev.filter(function(h) { return removeIds.indexOf(h.id) === -1; });
      });
    }, 1600);
  }

  // ── Tap handler ────────────────────────────────────────────
  function handleTap() {
    var now = Date.now();
    if (now - lastTapRef.current < 200) return; // 5 taps/sec max
    lastTapRef.current = now;

    // Spawn 3-5 hearts locally
    var count = Math.floor(Math.random() * 3) + 3;
    spawnHearts(count);

    // Bounce text
    var bid = ++heartIdRef.current;
    setBounceTexts(function(prev) { return prev.concat([bid]); });
    setTimeout(function() {
      setBounceTexts(function(prev) { return prev.filter(function(x) { return x !== bid; }); });
    }, 800);

    // Emit to server
    if (socket) {
      socket.emit('love-send', { roomId: roomId, userId: userId, username: username, amount: 1 });
    }
  }

  var displayTotal = loveTotal > 999
    ? (Math.floor(loveTotal / 100) / 10).toFixed(1) + 'K'
    : loveTotal;

  return (
    <div style={{ position: 'fixed', bottom: 140, right: 16, zIndex: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: HEART_STYLE }} />

      {/* Flying hearts */}
      <div style={{ position: 'absolute', bottom: 90, left: '50%', pointerEvents: 'none', width: 0, height: 0 }}>
        {flyHearts.map(function(h) {
          return (
            <div
              key={h.id}
              style={{
                position: 'absolute',
                left: h.offset,
                bottom: 0,
                fontSize: 20,
                animation: 'heartFloat 1.5s ease forwards',
                userSelect: 'none',
                lineHeight: 1,
                pointerEvents: 'none'
              }}>
              ♥
            </div>
          );
        })}

        {/* Bounce texts */}
        {bounceTexts.map(function(bid) {
          return (
            <div
              key={'bt-' + bid}
              style={{
                position: 'absolute',
                left: -6,
                bottom: 0,
                fontSize: 11,
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                color: GOLD,
                animation: 'loveBounce .8s ease forwards',
                userSelect: 'none',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
              +♥ 1
            </div>
          );
        })}
      </div>

      {/* Love count */}
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, textAlign: 'center', pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>
        ♥ {displayTotal}
      </div>

      {/* Big heart button */}
      <button
        onClick={handleTap}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #C01838, ' + BURG + ')',
          border: '2px solid rgba(255,26,60,.4)',
          color: TEXT,
          fontSize: 26,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(128,0,32,.6), 0 0 0 0 rgba(128,0,32,.3)',
          animation: 'lovePulse 2s ease infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          pointerEvents: 'all',
          transition: 'transform .1s',
          userSelect: 'none'
        }}>
        ♥
      </button>
    </div>
  );
}
