/**
 * NativeSelect — drops to an iOS-style bottom sheet on mobile (<640px),
 * stays as a styled custom dropdown on desktop.
 *
 * Props match a standard <select>:
 *   value, onChange, options=[{value, label}], placeholder, disabled, style, className
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';

const G      = '#D4AF37';
const BG     = '#080B18';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 640;
}

/* ─── Desktop dropdown ──────────────────────────────────────────────────── */
function DesktopSelect({ value, onChange, options, placeholder, disabled, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'rgba(17,8,34,0.85)', border: `1px solid ${open ? G + '60' : 'rgba(255,255,255,0.1)'}`,
          color: selected ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 13, outline: 'none',
          opacity: disabled ? 0.45 : 1, transition: 'border-color 0.2s', ...T,
        }}
      >
        <span>{selected ? selected.label : (placeholder || 'Select…')}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.4)' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.92 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
              background: 'rgba(13,6,24,0.98)', border: `1px solid ${G}30`,
              borderRadius: 10, overflow: 'hidden', transformOrigin: 'top',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: isSelected ? `${G}12` : 'transparent',
                    border: 'none', cursor: 'pointer', color: isSelected ? G : 'rgba(255,255,255,0.75)',
                    fontSize: 13, textAlign: 'left', transition: 'background 0.12s', ...T,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt.label}
                  {isSelected && <Check style={{ width: 13, height: 13, color: G }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── iOS-style bottom sheet ─────────────────────────────────────────────── */
function MobileSelect({ value, onChange, options, placeholder, disabled, style }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'rgba(17,8,34,0.85)', border: `1px solid rgba(255,255,255,0.1)`,
          color: selected ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, outline: 'none',
          opacity: disabled ? 0.45 : 1, minHeight: 44, ...T, ...style,
        }}
      >
        <span>{selected ? selected.label : (placeholder || 'Select…')}</span>
        <ChevronDown style={{ width: 16, height: 16, color: G }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500,
                backdropFilter: 'blur(4px)' }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 501,
                background: 'rgba(13,6,24,0.99)', borderTop: `1px solid ${G}25`,
                borderRadius: '20px 20px 0 0',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Handle + header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 0' }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)',
                  margin: '0 auto 14px', position: 'absolute', left: '50%', top: 8,
                  transform: 'translateX(-50%)' }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', paddingTop: 12, ...T }}>
                  {placeholder || 'Select an option'}
                </span>
                <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                  marginTop: 10 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
              {/* Options */}
              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {options.map(opt => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 20px', background: isSelected ? `${G}10` : 'transparent',
                        border: 'none', cursor: 'pointer',
                        color: isSelected ? G : 'rgba(255,255,255,0.85)',
                        fontSize: 16, minHeight: 52, borderBottom: '1px solid rgba(255,255,255,0.04)',
                        ...T,
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? 700 : 400 }}>{opt.label}</span>
                      {isSelected && <Check style={{ width: 18, height: 18, color: G }} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Exported NativeSelect ──────────────────────────────────────────────── */
export default function NativeSelect({ value, onChange, options = [], placeholder, disabled, style, className }) {
  const [mobile, setMobile] = useState(isMobile);

  useEffect(() => {
    function check() { setMobile(window.innerWidth < 640); }
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleChange = (val) => {
    if (typeof onChange === 'function') {
      // Support both raw value and synthetic event shapes
      onChange(val);
    }
  };

  const props = { value, onChange: handleChange, options, placeholder, disabled, style };

  return mobile
    ? <MobileSelect {...props} />
    : <DesktopSelect {...props} />;
}

/**
 * Helper: convert options from a <select> format
 *   opts = [{value, label}] — already our format
 *   OR pass children from <select> as raw strings: convertOptions(['a','b']) → [{value:'a',label:'A'}]
 */
export function convertOptions(arr) {
  return arr.map(o =>
    typeof o === 'string'
      ? { value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }
      : o
  );
}
