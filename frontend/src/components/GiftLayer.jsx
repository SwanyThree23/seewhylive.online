'use strict';
import React from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

export default function GiftLayer({ giftFloats }) {
  if (!giftFloats || giftFloats.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 800 }}>
      {giftFloats.map(function(g) {
        var left = Math.floor(Math.abs(g.floatId) % 70) + 5;
        var valueCents = Math.floor(g.value_cents || g.valueCents || 0);
        var isLegendary = valueCents >= 500;
        var isLarge     = valueCents >= 100;
        var borderColor = isLegendary ? 'rgba(201,168,76,.8)' : isLarge ? 'rgba(0,201,167,.6)' : 'rgba(201,168,76,.25)';
        var glowColor   = isLegendary ? 'rgba(201,168,76,.25)' : isLarge ? 'rgba(0,201,167,.12)' : 'transparent';
        var sender = g.from_user || g.fromUser || 'anon';
        return (
          <div
            key={g.floatId}
            style={{
              position: 'absolute',
              left: left + '%',
              bottom: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              animation: 'giftRise 3.5s ease-out forwards',
              background: 'rgba(13,10,20,.92)',
              border: '1px solid ' + borderColor,
              borderRadius: 12,
              padding: isLegendary ? '10px 14px' : '8px 12px',
              minWidth: isLegendary ? 100 : 80,
              textAlign: 'center',
              boxShadow: isLegendary ? '0 0 18px ' + glowColor + ', 0 2px 8px rgba(0,0,0,.6)' : isLarge ? '0 0 10px ' + glowColor + ', 0 2px 6px rgba(0,0,0,.5)' : '0 2px 6px rgba(0,0,0,.4)'
            }}
          >
            <span style={{ fontSize: isLegendary ? 34 : 28, lineHeight: 1 }}>{g.emoji || '🎁'}</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: isLegendary ? 13 : 11, color: '#EDE8F5' }}>{g.name || 'Gift'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <AvatarPortrait username={sender} size={16} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#A89CC8', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sender}</span>
            </div>
            {valueCents > 0 && (
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: isLegendary ? 18 : 14, color: isLegendary ? '#C9A84C' : isLarge ? '#00C9A7' : '#C9A84C', letterSpacing: 1 }}>
                ${(Math.floor(valueCents) / 100).toFixed(2)}
              </span>
            )}
            {isLegendary && (
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: '#C9A84C', letterSpacing: 2, background: 'rgba(201,168,76,.12)', borderRadius: 4, padding: '1px 6px' }}>LEGENDARY</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
