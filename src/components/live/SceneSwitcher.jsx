import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Monitor, Layout, Pause, Play, Sunrise, Sunset, ChevronDown, ChevronUp } from 'lucide-react';

const SCENES = [
  { id: 'camera', label: 'Camera Only', icon: Camera, desc: 'Webcam full view' },
  { id: 'screen', label: 'Screen Share', icon: Monitor, desc: 'Desktop/app share' },
  { id: 'pip', label: 'Cam + Screen', icon: Layout, desc: 'Picture-in-picture' },
  { id: 'brb', label: 'BRB', icon: Pause, desc: 'Be Right Back' },
  { id: 'starting', label: 'Starting Soon', icon: Sunrise, desc: 'Countdown overlay' },
  { id: 'ending', label: 'Ending Soon', icon: Sunset, desc: 'Goodbye screen' },
];

export default function SceneSwitcher({ activeScene, onSceneChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [brbMessage, setBrbMessage] = useState('Be Right Back!');

  return (
    <div className="bg-[rgba(13,6,24,0.9)] border border-[rgba(212,175,55,0.2)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5"
      >
        <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">Scene Switcher</span>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/40" /> : <ChevronUp className="w-3 h-3 text-white/40" />}
      </button>

      {!collapsed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {SCENES.map((scene) => {
              const Icon = scene.icon;
              const isActive = activeScene === scene.id;
              return (
                <motion.button
                  key={scene.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSceneChange(scene.id)}
                  className={`relative p-2 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" style={{ color: isActive ? '#d4af37' : 'rgba(255,255,255,0.5)' }} />
                    <span className="text-[10px] font-semibold text-white truncate">{scene.label}</span>
                  </div>
                  <p className="text-[11px] text-white/40 truncate">{scene.desc}</p>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                  )}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {activeScene === 'brb' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <p className="text-[10px] text-white/50">BRB Message</p>
                <input
                  value={brbMessage}
                  onChange={(e) => setBrbMessage(e.target.value)}
                  placeholder="Be Right Back!"
                  style={{ width:'100%', padding:'10px 14px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}