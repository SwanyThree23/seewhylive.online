import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const GOLD = '#D4AF37';
const BG   = '#080B18';

/**
 * KeyboardShortcutsHelp
 *
 * Renders a floating overlay listing keyboard shortcuts when the user presses `?`.
 *
 * Props:
 *   shortcuts — array of { key: string, label: string } (required)
 *   extraShortcuts — extra array appended after shortcuts (optional)
 */
export default function KeyboardShortcutsHelp({ shortcuts = [], extraShortcuts = [] }) {
  const [open, setOpen] = useState(false);
  const all = [...shortcuts, ...extraShortcuts];

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === '?') { e.preventDefault(); setOpen(v => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Hint badge — bottom-right corner */}
      <div
        className="fixed z-40 select-none cursor-pointer"
        style={{ bottom: 76, right: 12, opacity: 0.35 }}
        onClick={() => setOpen(v => !v)}
        title="Keyboard shortcuts (?)"
      >
        <kbd style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: 4,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: 12, fontFamily: 'monospace', lineHeight: 1,
        }}>?</kbd>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed z-50 rounded-2xl overflow-hidden"
              style={{
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 320, background: BG,
                border: `1px solid rgba(212,175,55,0.25)`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              }}
              initial={{ opacity: 0, scale: 0.92, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            >
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-black uppercase text-sm text-white"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                  Keyboard Shortcuts
                </span>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-1.5">
                {all.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/70" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
                    <kbd style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 24, height: 22, padding: '0 6px', borderRadius: 5,
                      background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.3)`,
                      color: GOLD, fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>{key}</kbd>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-3 text-center">
                <span className="text-[10px] text-white/25" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Press <kbd style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>?</kbd> or <kbd style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Esc</kbd> to close
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
