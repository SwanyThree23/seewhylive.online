import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Lock, Unlock, Users, Palette, MessageSquare, Mic, Video, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';

export default function HostControls({ isHost, party, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    chatEnabled: true,
    reactionsEnabled: true,
    guestMicEnabled: true,
    guestVideoEnabled: true,
    playlistEnabled: true,
    battlesEnabled: true,
    maxViewers: 20,
    theme: 'dark',
  });

  if (!isHost) return null;

  const toggle = (key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      onUpdate && onUpdate(updated);
      return updated;
    });
  };

  const TOGGLES = [
    { key: 'chatEnabled',       label: 'Party Chat',        icon: MessageSquare },
    { key: 'reactionsEnabled',  label: 'Reactions',         icon: Volume2 },
    { key: 'guestMicEnabled',   label: 'Guest Mics',        icon: Mic },
    { key: 'guestVideoEnabled', label: 'Guest Cams',        icon: Video },
    { key: 'playlistEnabled',   label: 'Collab Playlist',   icon: Users },
    { key: 'battlesEnabled',    label: 'Battle Tiers',      icon: Settings },
  ];

  const THEMES = [
    { id: 'dark',     label: 'Dark',    color: '#0B0B18' },
    { id: 'cinema',   label: 'Cinema',  color: '#1A0F0A' },
    { id: 'neon',     label: 'Neon',    color: '#080B18' },
    { id: 'forest',   label: 'Forest',  color: '#0a1a0a' },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      {/* Header toggle */}
      <button className="w-full flex items-center gap-2 px-3 py-2 transition-all"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        onClick={() => setOpen(v => !v)}>
        <Settings className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#d4af37' }}>
          Host Controls
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="p-3 space-y-3">
              {/* Toggles */}
              <div className="space-y-2">
                {TOGGLES.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3 h-3" style={{ color: settings[key] ? '#d4af37' : 'rgba(255,255,255,0.3)' }} />
                      <span className="text-[10px] font-bold" style={{ color: settings[key] ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>
                        {label}
                      </span>
                    </div>
                    <div onClick={() => toggle(key)} style={{ width:40, height:22, borderRadius:99, background:settings[key]?'#800020':'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:3, left:settings[key]?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Theme picker */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Room Theme
                </p>
                <div className="flex gap-1.5">
                  {THEMES.map(t => (
                    <button key={t.id}
                      onClick={() => setSettings(s => ({ ...s, theme: t.id }))}
                      className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
                      style={{
                        background: t.color,
                        border: settings.theme === t.id ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.1)',
                        color: settings.theme === t.id ? '#d4af37' : 'rgba(255,255,255,0.4)',
                        fontFamily: 'Barlow Condensed, sans-serif',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max viewers */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Max Viewers: {settings.maxViewers}
                </p>
                <input type="range" min={4} max={20} step={2}
                  value={settings.maxViewers}
                  onChange={e => setSettings(s => ({ ...s, maxViewers: +e.target.value }))}
                  className="w-full h-1.5 rounded-full appearance-none"
                  style={{ background: `linear-gradient(to right, #d4af37 ${((settings.maxViewers - 4) / 16) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}