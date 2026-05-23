import React, { useEffect, useRef, useState } from 'react';

export default function Ticker({ chat, isLive }) {
  var [tickerText, setTickerText] = useState('SeeWhy LIVE · Washington Classic · Domino Entertainment · VibeN\'Bones · @dominoentertainment5513 · @aiversepodcast · @memoirsofashygirl');
  var [pos, setPos] = useState(0);
  var animRef = useRef(null);
  var containerRef = useRef(null);

  useEffect(function() {
    var recent = chat.slice(-5).map(function(m) {
      if (!m) return '';
      return (m.username || 'anon') + ': ' + (m.message || '');
    }).filter(function(s) { return s.length > 0; });

    if (recent.length > 0) {
      setTickerText(recent.join(' · ') + ' · Washington Classic · Domino Entertainment · VibeN\'Bones');
    }
  }, [chat]);

  useEffect(function() {
    var x = 0;
    var speed = 1;
    var container = containerRef.current;
    if (!container) return;

    function animate() {
      x -= speed;
      var textWidth = tickerText.length * 8;
      if (Math.abs(x) > textWidth) x = container.offsetWidth;
      container.style.transform = 'translateX(' + x + 'px)';
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return function() { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [tickerText]);

  return (
    <div className="ticker-strip" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '28px',
      background: '#0F0C14',
      borderTop: '1px solid #C9A84C33',
      zIndex: 700,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center'
    }}>
      {isLive && (
        <span className="ticker-live-badge" style={{ flexShrink: 0, background: '#800020', color: '#fff', padding: '2px 6px', fontSize: '10px', fontFamily: 'Bebas Neue, sans-serif', marginLeft: '8px' }}>
          LIVE
        </span>
      )}
      <div style={{ overflow: 'hidden', flex: 1, position: 'relative', height: '100%' }}>
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            whiteSpace: 'nowrap',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '12px',
            color: '#B0A0C0',
            letterSpacing: '0.05em'
          }}
        >
          {tickerText}
        </div>
      </div>
    </div>
  );
}
