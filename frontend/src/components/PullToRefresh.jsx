'use strict';
import React, { useState, useRef } from 'react';

export default function PullToRefresh({ onRefresh, children }) {
  var [pulling, setPulling]   = useState(false);
  var [pullY,   setPullY]     = useState(0);
  var [ready,   setReady]     = useState(false);
  var startY   = useRef(0);
  var THRESHOLD = 72;

  function onTouchStart(e) {
    var el = e.currentTarget;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }

  function onTouchMove(e) {
    if (!pulling) return;
    var el = e.currentTarget;
    if (el.scrollTop > 0) { setPulling(false); setPullY(0); return; }
    var dy = Math.max(0, Math.min(e.touches[0].clientY - startY.current, 120));
    setPullY(dy);
    setReady(dy >= THRESHOLD);
  }

  function onTouchEnd() {
    if (!pulling) return;
    if (ready && onRefresh) onRefresh();
    setPulling(false);
    setPullY(0);
    setReady(false);
  }

  var indicatorTop = Math.max(-48, pullY - 48);

  return (
    <div
      style={{ position: 'relative', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', transform: pulling && pullY > 0 ? 'translateY(' + Math.min(pullY * 0.35, 36) + 'px)' : undefined, transition: pulling ? 'none' : 'transform .25s ease' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pullY > 10 && (
        <div style={{ position: 'absolute', top: indicatorTop, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(26,21,16,.95)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 20, padding: '6px 16px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C9A84C', letterSpacing: 1, pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap', transition: 'top .1s ease' }}>
          <div style={{ width: 12, height: 12, border: '1.5px solid rgba(201,168,76,.3)', borderTopColor: ready ? '#C9A84C' : 'rgba(201,168,76,.3)', borderRadius: '50%', animation: ready ? 'ptrSpin .7s linear infinite' : 'none', transform: ready ? 'none' : 'rotate(' + Math.floor(pullY * 3) + 'deg)' }} />
          {ready ? 'RELEASE TO REFRESH' : 'PULL TO REFRESH'}
        </div>
      )}
      {children}
    </div>
  );
}
