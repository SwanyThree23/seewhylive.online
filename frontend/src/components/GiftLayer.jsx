import React from 'react';

export default function GiftLayer({ giftFloats }) {
  if (!giftFloats || giftFloats.length === 0) return null;

  return (
    <div className="gift-layer" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 800 }}>
      {giftFloats.map((g) => {
        var left = 10 + (Math.abs(g.floatId % 80));
        return (
          <div
            key={g.floatId}
            className="gift-float"
            style={{ left: left + '%', bottom: '120px' }}
          >
            <span className="gift-float-emoji">{g.emoji || '🎁'}</span>
            <span className="gift-float-name">{g.name || 'Gift'}</span>
            <span className="gift-float-from">{g.from_user || g.fromUser || 'anon'}</span>
            <span className="gift-float-value" style={{color:'#C9A84C'}}>
              ${((g.value_cents || g.valueCents || 0) / 100).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
