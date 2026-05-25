'use strict';
import React, { useEffect, useRef, useState } from 'react';

export default function Ticker({ chat, isLive }) {
  var [tickerText, setTickerText] = useState('SeeWhy LIVE · Washington Classic · Domino Entertainment · VibeN\'Bones · @dominoentertainment5513 · @aiversepodcast · @memoirsofashygirl');
  var [liveDot, setLiveDot] = useState(true);
  var animRef = useRef(null);
  var containerRef = useRef(null);
  var xRef = useRef(0);

  useEffect(function() {
    var recent = chat.slice(-5).map(function(m) {
      if (!m) return '';
      var text = m.translated || m.text || m.message || '';
      return (m.username || 'anon') + ': ' + text;
    }).filter(function(s) { return s.length > 0; });

    if (recent.length > 0) {
      setTickerText(recent.join(' · ') + ' · Washington Classic · Domino Entertainment · VibeN\'Bones');
    }
  }, [chat]);

  useEffect(function() {
    if (!isLive) return;
    var id = setInterval(function() {
      setLiveDot(function(d) { return !d; });
    }, 600);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    var tickerSpeed = isLive ? 1.5 : 1;
    var container = containerRef.current;
    if (!container) return;

    function animate() {
      xRef.current -= tickerSpeed;
      var textWidth = tickerText.length * 8;
      if (Math.abs(xRef.current) > textWidth) xRef.current = 0;
      container.style.transform = 'translateX(' + xRef.current + 'px)';
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return function() { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [tickerText, isLive]);

  return (
    <div style={{
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
        <span style={{ flexShrink: 0, background: '#800020', color: '#fff', padding: '2px 6px', fontSize: '10px', fontFamily: "'Bebas Neue',sans-serif", marginLeft: '8px', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', display: 'inline-block', boxShadow: liveDot ? '0 0 6px 2px #FF1A3C' : 'none' }} />
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
            fontFamily: "'Barlow Condensed',sans-serif",
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
