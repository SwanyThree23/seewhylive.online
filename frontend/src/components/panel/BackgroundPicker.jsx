// frontend/src/components/panel/BackgroundPicker.jsx
import { useState, useRef, useEffect } from 'react';

var GOLD = '#C9A84C';

// Preset IDs must match the server-side allowlist in panelHandlers.js
var PRESETS = [
  {
    id: 'default', label: 'Dark',
    previewBg: '#0E0C09',
    style: { background: '#0E0C09' },
  },
  {
    id: 'aurora', label: 'Aurora',
    previewBg: 'linear-gradient(135deg,#2d0050,#003366,#004d00)',
    style: { background: 'linear-gradient(135deg,#0d001a,#001a2e,#0d1a00,#1a000d)', backgroundSize: '400% 400%', animationName: 'bgShift', animationDuration: '8s', animationTimingFunction: 'ease', animationIterationCount: 'infinite' },
  },
  {
    id: 'gold', label: 'Gold Haze',
    previewBg: 'radial-gradient(ellipse,#4a3800 0%,#1a1000 100%)',
    style: { background: 'radial-gradient(ellipse at 50% 20%,rgba(201,168,76,.22) 0%,rgba(60,45,10,.28) 38%,#080604 68%)' },
  },
  {
    id: 'neon', label: 'Neon',
    previewBg: 'linear-gradient(135deg,#2d0050,#000d40,#2d0030)',
    style: { background: 'linear-gradient(135deg,#0d0020,#000d30,#200010,#000d20)', backgroundSize: '400% 400%', animationName: 'bgShift', animationDuration: '5s', animationTimingFunction: 'ease', animationIterationCount: 'infinite' },
  },
  {
    id: 'space', label: 'Space',
    previewBg: 'radial-gradient(ellipse at top,#0d0a2e,#050508)',
    style: { background: 'radial-gradient(ellipse at top,#0d0a2e 0%,#04040a 100%)' },
  },
  {
    id: 'fire', label: 'Fire',
    previewBg: 'linear-gradient(180deg,#2d0a00,#4a1400)',
    style: { background: 'linear-gradient(135deg,#1a0300,#2d0a00,#3d1000,#1a0300)', backgroundSize: '400% 400%', animationName: 'bgShift', animationDuration: '4s', animationTimingFunction: 'ease', animationIterationCount: 'infinite' },
  },
  {
    id: 'ocean', label: 'Ocean',
    previewBg: 'linear-gradient(135deg,#001a2e,#003344)',
    style: { background: 'linear-gradient(135deg,#000d1a,#001a2e,#003344,#000d1a)', backgroundSize: '400% 400%', animationName: 'bgShift', animationDuration: '7s', animationTimingFunction: 'ease', animationIterationCount: 'infinite' },
  },
];

export { PRESETS };

export default function BackgroundPicker({ currentBgId, onSelect }) {
  var [open, setOpen] = useState(false);
  var wrapRef = useRef(null);

  useEffect(function() {
    if (!open) return;
    var onDown = function(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return function() { document.removeEventListener('mousedown', onDown); };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        title="Stage background"
        style={{
          background: 'transparent', color: open ? GOLD : '#888',
          border: '1px solid ' + (open ? 'rgba(201,168,76,.4)' : '#333'),
          borderRadius: 6, padding: '4px 8px', fontSize: 11,
          fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
          transition: 'color 0.2s, border-color 0.2s',
        }}
      >
        🎨
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 60,
          background: '#1a1510', border: '1px solid rgba(201,168,76,.28)',
          borderRadius: 10, padding: 10, minWidth: 200,
          boxShadow: '0 8px 28px rgba(0,0,0,.8)',
        }}>
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 9, color: '#555', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Stage Background</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map(function(p) {
              var isSelected = currentBgId === p.id;
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <button
                    onClick={function() { onSelect(p); setOpen(false); }}
                    title={p.label}
                    style={{
                      width: 40, height: 40, borderRadius: 8, cursor: 'pointer', padding: 0,
                      background: p.previewBg,
                      border: '2px solid ' + (isSelected ? GOLD : 'rgba(255,255,255,.08)'),
                      position: 'relative', overflow: 'hidden',
                      transition: 'border-color 0.15s, transform 0.1s',
                    }}
                  >
                    {isSelected && (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', textShadow: '0 0 6px rgba(0,0,0,.8)' }}>✓</span>
                    )}
                  </button>
                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 8, color: isSelected ? GOLD : '#555', whiteSpace: 'nowrap' }}>{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
