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

var G  = '#D4AF37';
var T  = { fontFamily: 'Barlow Condensed, sans-serif' };

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 640;
}

/* ─── Desktop dropdown ──────────────────────────────────────────────────── */
function DesktopSelect(props) {
  var value = props.value;
  var onChange = props.onChange;
  var options = props.options;
  var placeholder = props.placeholder;
  var disabled = props.disabled;
  var style = props.style;

  var openState = useState(false);
  var open = openState[0];
  var setOpen = openState[1];

  var ref = useRef(null);
  var selected = options.find(function(o) { return o.value === value; });

  useEffect(function() {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return function() { document.removeEventListener('mousedown', handler); };
  }, []);

  return (
    <div ref={ref} style={Object.assign({ position: 'relative' }, style)}>
      <button
        type="button"
        disabled={disabled}
        onClick={function() { if (!disabled) setOpen(function(v) { return !v; }); }}
        style={Object.assign({
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'rgba(8,11,24,0.85)', border: '1px solid ' + (open ? G + '60' : 'rgba(255,255,255,0.1)'),
          color: selected ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 13, outline: 'none',
          opacity: disabled ? 0.45 : 1, transition: 'border-color 0.2s',
        }, T)}
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
              background: 'rgba(8,11,24,0.98)', border: '1px solid ' + G + '30',
              borderRadius: 10, overflow: 'hidden', transformOrigin: 'top',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {options.map(function(opt) {
              var isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={function() { onChange(opt.value); setOpen(false); }}
                  style={Object.assign({
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: isSelected ? G + '12' : 'transparent',
                    border: 'none', cursor: 'pointer', color: isSelected ? G : 'rgba(255,255,255,0.75)',
                    fontSize: 13, textAlign: 'left', transition: 'background 0.12s',
                  }, T)}
                  onMouseEnter={function(e) { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={function(e) { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
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
function MobileSelect(props) {
  var value = props.value;
  var onChange = props.onChange;
  var options = props.options;
  var placeholder = props.placeholder;
  var disabled = props.disabled;
  var style = props.style;

  var openState = useState(false);
  var open = openState[0];
  var setOpen = openState[1];

  var selected = options.find(function(o) { return o.value === value; });

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={function() { if (!disabled) setOpen(true); }}
        style={Object.assign({
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)',
          color: selected ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, outline: 'none',
          opacity: disabled ? 0.45 : 1, minHeight: 44,
        }, T, style)}
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
              onClick={function() { setOpen(false); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500,
                backdropFilter: 'blur(4px)' }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 501,
                background: 'rgba(8,11,24,0.99)', borderTop: '1px solid ' + G + '25',
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
                <span style={Object.assign({ fontSize: 15, fontWeight: 700, color: '#fff', paddingTop: 12 }, T)}>
                  {placeholder || 'Select an option'}
                </span>
                <button onClick={function() { setOpen(false); }} style={{ background: 'rgba(255,255,255,0.08)',
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
                {options.map(function(opt) {
                  var isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={function() { onChange(opt.value); setOpen(false); }}
                      style={Object.assign({
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 20px', background: isSelected ? G + '10' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        color: isSelected ? G : 'rgba(255,255,255,0.85)',
                        fontSize: 16, minHeight: 52, borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }, T)}
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
export default function NativeSelect(props) {
  var value = props.value;
  var onChange = props.onChange;
  var options = props.options || [];
  var placeholder = props.placeholder;
  var disabled = props.disabled;
  var style = props.style;

  var mobileState = useState(isMobile);
  var mobile = mobileState[0];
  var setMobile = mobileState[1];

  useEffect(function() {
    function check() { setMobile(window.innerWidth < 640); }
    window.addEventListener('resize', check, { passive: true });
    return function() { window.removeEventListener('resize', check); };
  }, []);

  function handleChange(val) {
    if (typeof onChange === 'function') {
      onChange(val);
    }
  }

  var selectProps = { value: value, onChange: handleChange, options: options, placeholder: placeholder, disabled: disabled, style: style };

  return mobile
    ? React.createElement(MobileSelect, selectProps)
    : React.createElement(DesktopSelect, selectProps);
}

/**
 * Helper: convert options from a <select> format
 */
export function convertOptions(arr) {
  return arr.map(function(o) {
    return typeof o === 'string'
      ? { value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }
      : o;
  });
}
