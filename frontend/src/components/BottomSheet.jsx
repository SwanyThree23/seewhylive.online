import React, { useEffect, useRef } from 'react';

var ANIM = '@keyframes sheetIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}';

export default function BottomSheet(props) {
  var open     = props.open;
  var onClose  = props.onClose;
  var title    = props.title;
  var children = props.children;
  var maxH     = props.maxHeight || '70vh';

  useEffect(function() {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  // Push to history when sheet opens — Android back button dismisses it
  var pushedRef = useRef(false);

  useEffect(function() {
    if (open && !pushedRef.current) {
      window.history.pushState({ swOverlay: 'sheet' }, '');
      pushedRef.current = true;
    }
    if (!open && pushedRef.current) {
      pushedRef.current = false;
    }
  }, [open]);

  useEffect(function() {
    function onPop() {
      if (pushedRef.current) {
        pushedRef.current = false;
        onClose();
      }
    }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, [onClose]);

  function handleClose() {
    if (pushedRef.current) {
      window.history.back();
    } else {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div>
      <style>{ANIM}</style>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(14,12,9,.72)',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
        background: '#1A1510',
        borderTop: '1px solid rgba(201,168,76,.18)',
        borderRadius: '16px 16px 0 0',
        maxHeight: maxH,
        display: 'flex', flexDirection: 'column',
        animation: 'sheetIn .22s ease',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(201,168,76,.25)', margin: '0 auto', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
          {title && (
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#F0E8D4', letterSpacing: .5 }}>
              {title}
            </span>
          )}
          <button
            onClick={handleClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#8A7A62', fontSize: 18, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1, userSelect: 'none', WebkitUserSelect: 'none' }}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 16px', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  );
}