// frontend/src/components/nav/MoreMenuSheet.jsx
import React, { useEffect, useRef } from 'react';

const BG = '#0C0806';
const CREAM = '#F5F5DC';
const GOLD = '#D4AF37';

export default function MoreMenuSheet({ items, onSelect, onClose }) {
  var pushedRef = useRef(false);

  useEffect(function() {
    window.history.pushState({ swOverlay: 'moremenu' }, '');
    pushedRef.current = true;
    function onPop() {
      if (pushedRef.current) { pushedRef.current = false; onClose(); }
    }
    window.addEventListener('popstate', onPop);
    return function() {
      window.removeEventListener('popstate', onPop);
      if (pushedRef.current) { pushedRef.current = false; }
    };
  }, [onClose]);

  function handleClose() {
    if (pushedRef.current) { window.history.back(); }
    else { onClose(); }
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        overscrollBehavior: 'contain',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: BG,
          borderTop: `1px solid ${GOLD}55`,
          borderRadius: '16px 16px 0 0',
          padding: '20px 16px calc(20px + env(safe-area-inset-bottom, 16px))',
          maxHeight: '70vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 16px' }} />
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.route)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'transparent',
              border: 'none',
              padding: '14px 8px',
              minHeight: 48,
              color: CREAM,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 18,
              textAlign: 'left',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}