import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Save } from 'lucide-react';

const PRESETS = [
  {
    name: 'Creator Starter',
    bitrate: 3000,
    resolution: '720p',
    fps: 30,
    description: 'Best for new creators'
  },
  {
    name: 'Professional',
    bitrate: 5000,
    resolution: '1080p',
    fps: 60,
    description: 'High-quality streaming'
  },
  {
    name: 'Ultra HD',
    bitrate: 8000,
    resolution: '1440p',
    fps: 60,
    description: 'Premium broadcast'
  },
  {
    name: 'Mobile Optimized',
    bitrate: 1500,
    resolution: '480p',
    fps: 24,
    description: 'Mobile viewers'
  }
];

export default function StreamingPresets({ onApply }) {
  const [selected, setSelected] = useState(null);

  const handleApply = (preset) => {
    setSelected(preset.name);
    onApply?.(preset);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#d4af37]" />
        <h3 className="text-sm font-bold text-white">Quick Presets</h3>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {PRESETS.map((preset) => (
          <motion.button
            key={preset.name}
            onClick={() => handleApply(preset)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-2.5 rounded-lg border transition-all text-left ${
              selected === preset.name
                ? 'bg-[#d4af37]/20 border-[#d4af37]/50'
                : 'bg-white/5 border-white/10 hover:border-[#d4af37]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white">{preset.name}</p>
                <p className="text-[8px] text-white/50">{preset.description}</p>
              </div>
              {selected === preset.name && (
                <Save className="w-3.5 h-3.5 text-[#d4af37]" />
              )}
            </div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                {preset.bitrate} kbps
              </span>
              <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                {preset.resolution}
              </span>
              <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                {preset.fps} fps
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}