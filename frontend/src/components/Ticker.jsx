'use strict';
import React, { useEffect, useRef, useState } from 'react';

var BASE_TEXT = 'SeeWhy LIVE  ·  Washington Classic  ·  Domino Entertainment  ·  VibeN\'Bones  ·  90% CREATOR PAYOUT  ·  POWERED BY AURA AI  ·  SUBSCRIBE FOR EXCLUSIVE ACCESS  ·  @dominoentertainment5513  ·  @aiversepodcast  ·  @memoirsofashygirl  ·';

export default function Ticker(props) {
  var chat   = props.chat;
  var isLive = props.isLive;

  var [tickerText, setTickerText] = useState(BASE_TEXT);
  var [liveDot, setLiveDot]       = useState(true);
  var [isMobile, setIsMobile]     = useState(function() { return window.innerWidth <= 900; });
  var containerRef = useRef(null);
  var animRef      = useRef(null);
  var xRef         = useRef(0);

  useEffect(function() {
    function onResize() { setIsMobile(window.innerWidth <= 900); }
    window.addEventListener('resize', onResize);
    return function() { window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(function() {
    if (!chat || !chat.length) return;
    var recent = chat.slice(-5).map(function(m) {
      if (!m) return '';
      var text = (m.translated || m.text || m.message || '').slice(0, 60);
      return (m.username || 'anon') + ': ' + text;
    }).filter(function(s) { return s.length > 0; });
    if (recent.length > 0) {
      setTickerText(recent.join('  ·  ') + '  ·  Washington Classic  ·  Domino Entertainment  ·  VibeN\'Bones  ·');
    }
  }, [chat]);

  useEffect(function() {
    if (!isLive) return;
    var id = setInterval(function() { setLiveDot(function(d) { return !d; }); }, 600);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    var speed = isLive ? 1.6 : 1.0;
    var container = containerRef.current;
    if (!container) return;
    function animate() {
      xRef.current -= speed;
      var width = tickerText.length * 7.5;
      if (Math.abs(xRef.current) > width) xRef.current = window.innerWidth;
      container.style.transform = 'translateX(' + xRef.current + 'px)';
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return function() { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [tickerText, isLive]);

  var bottomOffset = isMobile ? 60 : 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: bottomOffset,
      left: 0,
      right: 0,
      height: 28,
      background: 'rgba(14,12,9,.96)',
      borderTop: '1px solid rgba(201,168,76,.2)',
      zIndex: 300,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      {isLive && (
        <span style={{
          flexShrink: 0,
          background: '#800020',
          color: '#F0E8D4',
          padding: '2px 8px',
          fontSize: 10,
          fontFamily: "'Bebas Neue',sans-serif",
          letterSpacing: 1.5,
          marginLeft: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderRadius: 2,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#FF1A3C',
            display: 'inline-block',
            boxShadow: liveDot ? '0 0 6px 2px #FF1A3C' : 'none',
            transition: 'box-shadow .3s ease',
          }} />
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
            fontSize: 11,
            color: '#8A7A62',
            letterSpacing: '0.08em',
            willChange: 'transform',
          }}
        >
          {tickerText}
        </div>
      </div>
    </div>
  );
}
