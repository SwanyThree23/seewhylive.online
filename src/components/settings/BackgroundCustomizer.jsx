import React from 'react';
import { motion } from 'framer-motion';
import { useBackground } from '@/lib/BackgroundManager';
import { Palette } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

export default function BackgroundCustomizer() {
  const { backgroundStyle, updateBackground, backgrounds } = useBackground();

  const bgOptions = [
    { id: 'default', label: 'Default', color: '#0B0B18' },
    { id: 'faded_dark', label: 'Faded Dark', color: 'linear-gradient(180deg, #0B0B18, #1a1530)' },
    { id: 'faded_earth', label: 'Earth Tone', color: 'linear-gradient(135deg, #0A0710, #2C1810)' },
    { id: 'faded_neon', label: 'Neon Glow', color: 'linear-gradient(135deg, #0A0710, #1a1a3a)' },
    { id: 'faded_terracotta', label: 'Terracotta', color: 'linear-gradient(135deg, #0A0710, #3D2B1F)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          App Background
        </h3>
      </div>

      <p className="text-xs text-white/60 mb-4">Choose your preferred background theme for the app</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {bgOptions.map((bg) => (
          <motion.button
            key={bg.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => updateBackground(bg.id)}
            className="p-4 rounded-lg transition-all relative group"
            style={{
              background: bg.color,
              border: backgroundStyle === bg.id ? `2px solid ${G}` : `1px solid ${BORDER}`,
              cursor: 'pointer',
            }}
          >
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: G }} />
            <p className="text-xs font-bold text-white relative z-10">{bg.label}</p>
            {backgroundStyle === bg.id && (
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ background: G }} />
            )}
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-white/40 mt-4">
        Your background preference will be saved and applied across all pages.
      </p>
    </motion.div>
  );
}