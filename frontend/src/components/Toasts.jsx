import React from 'react';

export default function Toasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toasts-container" style={{ position: 'fixed', top: '4rem', right: '1rem', zIndex: 850, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={'toast toast--' + (t.type || 'info')}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
