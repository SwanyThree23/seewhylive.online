'use strict';
import React, { useEffect, useRef } from 'react';

var _toastStyleInjected = false;

var TYPE_MAP = {
  success: { bg: 'rgba(201,168,76,.16)',   border: 'rgba(201,168,76,.45)',   color: '#C9A84C' },
  error:   { bg: 'rgba(255,26,60,.16)',   border: 'rgba(255,26,60,.5)',    color: '#FF6B81' },
  info:    { bg: 'rgba(212,133,74,.13)',  border: 'rgba(212,133,74,.35)',  color: '#D4854A' },
  warn:    { bg: 'rgba(201,168,76,.15)',  border: 'rgba(201,168,76,.4)',   color: '#C9A84C' },
  gift:    { bg: 'rgba(201,168,76,.18)',  border: 'rgba(232,196,106,.5)',  color: '#E8C46A' },
  sub:     { bg: 'rgba(192,132,252,.14)', border: 'rgba(192,132,252,.4)', color: '#C084FC' },
  teal:    { bg: 'rgba(201,168,76,.14)',   border: 'rgba(201,168,76,.4)',   color: '#C9A84C' },
  burg:    { bg: 'rgba(128,0,32,.22)',    border: 'rgba(192,24,56,.5)',    color: '#FF8C9A' },
  volt:    { bg: 'rgba(170,255,0,.12)',   border: 'rgba(170,255,0,.35)',  color: '#AAFF00' },
};

export default function Toasts(props) {
  var toasts = props.toasts;

  var injected = useRef(false);
  useEffect(function() {
    if (injected.current) return;
    injected.current = true;
    if (!_toastStyleInjected) {
      _toastStyleInjected = true;
      var el = document.createElement('style');
      el.textContent = '@keyframes toastSlide{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}';
      document.head.appendChild(el);
    }
  }, []);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '52px',
      right: '12px',
      zIndex: 8500,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      pointerEvents: 'none',
      maxWidth: 300,
    }}>
      {toasts.map(function(t) {
        var ts = TYPE_MAP[t.type || 'info'] || TYPE_MAP.info;
        return (
          <div
            key={t.id}
            style={{
              background: ts.bg,
              border: '1px solid ' + ts.border,
              borderRadius: 8,
              padding: '9px 13px',
              color: ts.color,
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 600,
              fontSize: 13,
              lineHeight: 1.35,
              maxWidth: 300,
              wordBreak: 'break-word',
              boxShadow: '0 4px 20px rgba(0,0,0,.5)',
              backdropFilter: 'blur(16px)',
              animation: 'toastSlide .28s ease',
            }}
          >
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
