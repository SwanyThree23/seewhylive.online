import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlignLeft } from 'lucide-react';

const PRESETS = [
  '🔴 LIVE NOW — StreamSpace',
  '💬 Drop your questions below!',
  '⭐ Subscribe for exclusive content!',
  '🎯 Stream Goal: 100 viewers!',
  '💰 Tips appreciated! All support matters',
];

const DURATIONS = [
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '∞', value: 0 },
];

export default function LowerThirdsBanner({ onBannerChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('🔴 LIVE NOW — StreamSpace');
  const [style, setStyle] = useState('gradient');
  const [color, setColor] = useState('#d4af37');
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (onBannerChange) onBannerChange({ enabled, text, style, color });
  }, [enabled, text, style, color]);

  useEffect(() => {
    if (!enabled || duration === 0) { setProgress(100); return; }
    setProgress(100);
    const start = Date.now();
    const total = duration * 1000;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / total) * 100);
      setProgress(pct);
      if (pct <= 0) { setEnabled(false); clearInterval(tick); }
    }, 100);
    return () => clearInterval(tick);
  }, [enabled, duration]);

  const bgStyle = {
    gradient: 'linear-gradient(90deg, rgba(128,0,32,0.9) 0%, rgba(212,175,55,0.9) 100%)',
    solid: 'rgba(13,6,24,0.95)',
    transparent: 'transparent',
  };

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <AlignLeft className="w-3 h-3 text-[#d4af37]" />
          <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">Lower Thirds</span>
          {enabled && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden px-3 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/60">Enable Banner</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} className="scale-75 data-[state=checked]:bg-[#d4af37]" />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-white/40">Banner Text</p>
            <Input
              value={text} onChange={(e) => setText(e.target.value)}
              className="h-7 text-xs bg-white/5 border-white/20 text-white"
              placeholder="Enter banner text..."
            />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-white/40">Presets</p>
            <div className="flex flex-col gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setText(p)}
                  className="text-left text-[10px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 truncate"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {['gradient', 'solid', 'transparent'].map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`text-[10px] py-1 rounded capitalize border transition-all ${
                  style === s ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[10px] text-white/40">Color</p>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
            <p className="text-[10px] text-white/40 ml-auto">Duration</p>
            <div className="flex gap-1">
              {DURATIONS.map(d => (
                <button
                  key={d.label}
                  onClick={() => setDuration(d.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                    duration === d.value ? 'border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/50'
                  }`}
                >{d.label}</button>
              ))}
            </div>
          </div>

          {enabled && duration > 0 && (
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Live Preview */}
          {enabled && (
            <div className="rounded overflow-hidden relative h-10">
              <div className="absolute inset-0" style={{ background: bgStyle[style] }} />
              <div className="relative h-full flex items-center px-3">
                <p className="text-sm font-bold truncate" style={{ color, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{text}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}