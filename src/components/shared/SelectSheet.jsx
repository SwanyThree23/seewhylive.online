import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SelectSheet({ label, value, options, onChange, style, className }) {
  var [open, setOpen] = useState(false);

  function getLabel(opt) {
    return typeof opt === 'string' ? opt : opt.label;
  }
  function getValue(opt) {
    return typeof opt === 'string' ? opt : opt.value;
  }

  var displayLabel = (function() {
    for (var i = 0; i < options.length; i++) {
      if (getValue(options[i]) === value) return getLabel(options[i]);
    }
    return value || 'Select…';
  })();

  return (
    <div style={style} className={className}>
      <button
        type="button"
        onClick={function() { setOpen(true); }}
        style={{
          width: '100%',
          background: 'rgba(8,11,24,0.85)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: 8,
          padding: '9px 32px 9px 12px',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: 13,
          textAlign: 'left',
          cursor: 'pointer',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          boxSizing: 'border-box',
        }}
      >
        {displayLabel}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
              onClick={function() { setOpen(false); }}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                background: 'rgba(8,11,24,0.99)',
                borderTop: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '20px 20px 0 0',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                maxHeight: '75vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
              </div>
              {label && (
                <p style={{
                  padding: '4px 16px 12px',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  margin: 0,
                }}>
                  {label}
                </p>
              )}
              <div style={{ padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {options.map(function(opt) {
                  var v = getValue(opt);
                  var l = getLabel(opt);
                  var sel = v === value;
                  return (
                    <div
                      key={v}
                      onClick={function() { onChange(v); setOpen(false); }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: sel ? 'rgba(128,0,32,0.2)' : 'rgba(36,28,18,0.6)',
                        border: '1px solid ' + (sel ? 'rgba(128,0,32,0.4)' : 'rgba(212,175,55,0.08)'),
                        color: sel ? '#D4AF37' : 'rgba(255,255,255,0.85)',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: sel ? 700 : 400,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{l}</span>
                      {sel && <span style={{ color: '#D4AF37', fontSize: 16 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
