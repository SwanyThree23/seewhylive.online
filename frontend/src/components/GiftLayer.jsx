'use strict';
import React from 'react';

export default function GiftLayer({ giftFloats }) {
  if (!giftFloats || giftFloats.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 800 }}>
      {giftFloats.map(function(g) {
        var left = Math.floor(Math.abs(g.floatId) % 70) + 5;
        var valueCents = Math.floor(g.value_cents || g.valueCents || 0);
        var borderColor;
        if (valueCents >= 500) {
          borderColor = 'rgba(201,168,76,.6)';
        } else if (valueCents >= 100) {
          borderColor = 'rgba(0,201,167,.5)';
        } else {
          borderColor = 'rgba(201,168,76,.25)';
        }
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
              gap: 2,
              animation: 'giftRise 3.5s ease-out forwards',
              background: 'rgba(13,10,20,.85)',
              border: '1px solid ' + borderColor,
              borderRadius: 10,
              padding: '8px 12px',
              minWidth: 80,
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{g.emoji || '🎁'}</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EDE8F5' }}>{g.name || 'Gift'}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>from {g.from_user || g.fromUser || 'anon'}</span>
            {valueCents > 0 && (
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 1 }}>
                ${(Math.floor(valueCents) / 100).toFixed(2)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
