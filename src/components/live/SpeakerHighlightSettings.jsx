import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Check } from 'lucide-react';

const GOLD = '#D4AF37';

// ── Active-speaker highlight styles (creator-selectable) ───────────────
// Each id maps to rendering rules consumed by PanelGrid's OctCell.
export const HIGHLIGHT_STYLES = [
  { id: 'glow',  name: 'Gold Glow',     desc: 'Border glow + zoom' },
  { id: 'zoom',  name: 'Zoom In',       desc: 'Subtle scale-up' },
  { id: 'pulse', name: 'Pulse Ring',    desc: 'Animated gold ring' },
  { id: 'dim',   name: 'Spotlight Dim', desc: 'Dim non-speakers' },
  { id: 'off',   name: 'Off',           desc: 'No highlight' },
];

export default function SpeakerHighlightSettings({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const active = HIGHLIGHT_STYLES.find(s => s.id === value) || HIGHLIGHT_STYLES[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
        style={{ background: open ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${open ? GOLD + 'aa' : 'rgba(255,255,255,0.1)'}` }}
      >
        <Settings2 className="w-3.5 h-3.5" style={{ color: open ? GOLD : 'rgba(255,255,255,0.5)' }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: open ? GOLD : 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Speaker FX
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 151,
                width: 224, background: '#0d0618', border: `1px solid ${GOLD}40`, borderRadius: 14,
                padding: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                Active Speaker Highlight
              </p>
              <div className="space-y-1">
                {HIGHLIGHT_STYLES.map(s => {
                  const isActive = (value || 'glow') === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { onChange(s.id); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left"
                      style={{ background: isActive ? 'rgba(212,175,55,0.15)' : 'transparent', border: `1px solid ${isActive ? GOLD + '66' : 'transparent'}` }}
                    >
                      <div className="flex-1">
                        <p className="text-[11px] font-bold" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>{s.name}</p>
                        <p className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.desc}</p>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 pt-2 text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                Choice saves to this device for every room you host.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}