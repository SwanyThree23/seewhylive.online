import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const FONT = 'Barlow Condensed, sans-serif';
const GOLD = '#D4AF37';

/**
 * BottomSheet — mobile-native slide-up sheet.
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   title        string (optional)
 *   children     ReactNode
 *   maxHeight    string  (default '80vh')
 *   snapPoints   never used — future extension
 */
export default function BottomSheet({ isOpen, onClose, title, children, maxHeight = '80vh' }) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="bs-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed left-0 right-0 bottom-0 z-[201] pb-safe flex flex-col"
            style={{
              maxHeight,
              background: 'rgba(10,7,22,0.99)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderBottom: 'none',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-black text-base text-white uppercase tracking-wide"
                  style={{ fontFamily: FONT }}>
                  {title}
                </span>
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * BottomSheetOption — single option row inside a BottomSheet option list.
 */
export function BottomSheetOption({ label, description, selected, onSelect, icon, color }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-5 py-3.5 transition-all active:scale-[0.98] text-left"
      style={{
        background: selected ? 'rgba(212,175,55,0.08)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {icon && (
        <span className="text-xl shrink-0">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white leading-tight" style={{ fontFamily: FONT, color: selected ? GOLD : 'white' }}>
          {label}
        </p>
        {description && (
          <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
            {description}
          </p>
        )}
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: GOLD }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}
