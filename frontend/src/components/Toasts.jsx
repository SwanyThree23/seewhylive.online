'use strict';
import React from 'react';

var TYPE_STYLES = {
  success: { background: 'rgba(0,201,106,.18)', border: '1px solid rgba(0,201,106,.4)', color: '#00C96A' },
  error:   { background: 'rgba(255,26,60,.18)',  border: '1px solid rgba(255,26,60,.4)',  color: '#FF6B81' },
  info:    { background: 'rgba(90,143,255,.15)', border: '1px solid rgba(90,143,255,.35)', color: '#7AAEFF' },
  warn:    { background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', color: '#C9A84C' },
};

export default function Toasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '4rem', right: '1rem', zIndex: 850, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {toasts.map(function(t) {
        var ts = TYPE_STYLES[t.type || 'info'] || TYPE_STYLES.info;
        return (
          <div
            key={t.id}
            style={{ background: ts.background, border: ts.border, borderRadius: 8, padding: '9px 14px', color: ts.color, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, maxWidth: 300, wordBreak: 'break-word', boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}
          >
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
