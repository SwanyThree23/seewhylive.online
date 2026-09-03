import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Clock } from 'lucide-react';
import { SWANYBOT_PRO_MODULES } from '@/lib/swanybotProModules';
import VideoTransformStudio from '@/components/swanybotpro/VideoTransformStudio';
import VoiceLipSyncStudio from '@/components/swanybotpro/VoiceLipSyncStudio';
import StoryMusicVideoStudio from '@/components/swanybotpro/StoryMusicVideoStudio';
import ProductAdStudio from '@/components/swanybotpro/ProductAdStudio';
import PromptForge from '@/components/swanybotpro/PromptForge';
import AssetLibrary from '@/components/swanybotpro/AssetLibrary';

const MODULE_COMPONENTS = {
  'video-transform': VideoTransformStudio,
  'voice-lipsync': VoiceLipSyncStudio,
  'story-music-video': StoryMusicVideoStudio,
  'product-ad': ProductAdStudio,
  'prompt-forge': PromptForge,
  'asset-library': AssetLibrary,
};

const G = '#D4AF37';
const PURPLE = '#7B5DA6';
const BORDER = 'rgba(212,175,55,0.18)';

export default function SwanyBotPro() {
  const [activeId, setActiveId] = useState('video-transform');
  const active = SWANYBOT_PRO_MODULES.find((m) => m.id === activeId);

  return (
    <div className="min-h-screen pb-16">
      {/* HERO */}
      <div className="px-4 pt-6 pb-4 md:pt-8" style={{ background: 'linear-gradient(180deg, rgba(123,93,166,0.10), transparent)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7B5DA6, #D4AF37)', boxShadow: '0 4px 20px rgba(123,93,166,0.4)' }}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider leading-none"
                style={{ fontFamily: 'Orbitron, monospace', background: 'linear-gradient(90deg, #7B5DA6, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SwanyBot Pro
              </h1>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.18em' }}>
                SWANYTHREE ECOSYSTEM · REAL-TIME CREATIVE AI STUDIO
              </p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Instant iteration, live performance, immersive storytelling. Reskin video in real-time, clone voices with emotion,
            produce music videos, generate product commercials, and forge cinematic prompts — all in one place.
            Where the platform can render natively, it renders in-app; where it can't (live real-time), export a ready-to-feed pack.
          </p>
        </div>
      </div>

      {/* MODULE RAIL */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
          {SWANYBOT_PRO_MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = m.id === activeId;
            return (
              <button key={m.id} onClick={() => setActiveId(m.id)}
                className="relative rounded-2xl p-3 text-left transition-all"
                style={{
                  background: isActive ? 'rgba(123,93,166,0.16)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? m.accent + 'aa' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${m.accent}33, ${m.accent}11)` }}>
                    <Icon className="w-4 h-4" style={{ color: m.accent }} />
                  </div>
                  {m.status === 'live'
                    ? <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: G, color: '#000' }}>Live</span>
                    : <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}><Clock className="w-2 h-2" /> Next</span>}
                </div>
                <p className="text-[11px] font-black uppercase tracking-wide leading-tight" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>{m.name}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.tagline}</p>
              </button>
            );
          })}
        </div>

        {/* ACTIVE MODULE */}
        <motion.div key={activeId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* Module header */}
          <div className="flex items-start gap-3 mb-4 rounded-2xl p-4" style={{ background: 'rgba(13,16,34,0.6)', border: `1px solid ${active.accent}33` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${active.accent}, ${active.accent}55)` }}>
              <active.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black uppercase tracking-wider" style={{ color: active.accent, fontFamily: 'Barlow Condensed, sans-serif' }}>{active.name}</h2>
                {active.status === 'live'
                  ? <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: G, color: '#000' }}><Check className="w-2.5 h-2.5" /> Live Module</span>
                  : <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}><Clock className="w-2.5 h-2.5" /> Scheduled — Building Next Turn</span>}
              </div>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{active.description}</p>
            </div>
          </div>

          {/* Module body */}
          {active.status === 'live' ? (
            (() => { const Comp = MODULE_COMPONENTS[active.id] || VideoTransformStudio; return <Comp />; })()
          ) : (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(13,16,34,0.6)', border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: active.accent, fontFamily: 'Barlow Condensed, sans-serif' }}>What this module will do</p>
              <div className="grid sm:grid-cols-2 gap-2 mb-5">
                {active.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: active.accent }} />
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{b}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: `${active.accent}14`, border: `1px solid ${active.accent}44` }}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: active.accent }} />
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  This module is scheduled for the next build turn. The flagship <strong style={{ color: G }}>Video Transform Studio</strong> is live now — try it above.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}