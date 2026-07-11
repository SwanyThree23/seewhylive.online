import React from 'react';

var OCT_CLIP = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

var COLOR_PAIRS = [
  ['#C0392B', '#800020'],
  ['#C9A84C', '#7A4800'],
  ['#C9A84C', '#005048'],
  ['#C9A84C', '#5B0099'],
  ['#C9A84C', '#0033AA'],
  ['#FF6B35', '#AA3300'],
  ['#00D4FF', '#005566'],
  ['#FF1493', '#880055'],
  ['#C9A84C', '#335500'],
  ['#FF8C00', '#663300'],
];

function strHash(s) {
  var h = 5381;
  var i;
  for (i = 0; i < (s ? s.length : 0); i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

var RANK_COLORS = { 1: '#C9A84C', 2: '#C0C0C0', 3: '#CD7F32' };

export default function AvatarPortrait({ username, size, isLive, isHost, rank, showName }) {
  var sz = size || 56;
  var name = username || '?';
  var initial = name.charAt(0).toUpperCase();
  var h = strHash(name);
  var pair = COLOR_PAIRS[h % COLOR_PAIRS.length];
  var accentColor = pair[0];
  var darkColor   = pair[1];
  var bg = 'radial-gradient(ellipse at 35% 25%, ' + accentColor + '88, ' + darkColor + '66, rgba(14,12,9,.95))';

  var ringColor = rank === 1 ? '#C9A84C' : (isHost ? '#C0392B' : accentColor + '88');
  var ringW     = (rank === 1 || isHost) ? 3 : 2;
  var glowSz    = Math.floor(sz / 3);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div style={{
        width: sz,
        height: sz,
        clipPath: OCT_CLIP,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 ' + ringW + 'px ' + ringColor + ', 0 0 ' + glowSz + 'px ' + accentColor + '44',
      }}>
        <span style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: Math.floor(sz * 0.44),
          color: '#fff',
          textShadow: '0 0 10px ' + accentColor + ', 0 0 20px ' + accentColor + '66',
          lineHeight: 1,
          userSelect: 'none',
        }}>{initial}</span>
      </div>

      {isLive && (
        <div style={{
          position: 'absolute',
          bottom: showName ? 20 : -5,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#FF1A3C',
          borderRadius: 3,
          padding: '1px 5px',
          fontFamily: "'DM Mono',monospace",
          fontSize: Math.max(5, Math.floor(sz * 0.1)),
          color: '#fff',
          letterSpacing: 1,
          whiteSpace: 'nowrap',
          zIndex: 2,
        }}>LIVE</div>
      )}

      {rank && rank <= 3 && (
        <div style={{
          position: 'absolute',
          top: -5,
          right: -5,
          width: Math.floor(sz * 0.3),
          height: Math.floor(sz * 0.3),
          borderRadius: '50%',
          background: RANK_COLORS[rank] || '#8A7A62',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: Math.max(7, Math.floor(sz * 0.13)),
          color: '#07050A',
          fontWeight: 700,
          zIndex: 2,
          border: '1px solid rgba(0,0,0,.5)',
          boxShadow: '0 0 6px ' + (RANK_COLORS[rank] || '#8A7A62'),
        }}>{'#' + rank}</div>
      )}

      {showName && (
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 700,
          fontSize: Math.max(9, Math.floor(sz * 0.18)),
          color: accentColor,
          marginTop: 4,
          maxWidth: sz + 16,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}>{name}</div>
      )}
    </div>
  );
}
