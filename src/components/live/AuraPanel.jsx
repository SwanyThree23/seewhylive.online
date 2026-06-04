import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Heart, BarChart2, Smile, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const MODES = [
  { id: 'SASSY', label: 'Sassy', emoji: '💅', color: '#FF1564', desc: 'Sharp & witty' },
  { id: 'HYPE', label: 'Hype', emoji: '🔥', color: '#FF8C00', desc: 'High energy' },
  { id: 'CALM', label: 'Calm', emoji: '🧠', color: '#C9A84C', desc: 'Analytical' },
  { id: 'KIND', label: 'Kind', emoji: '💜', color: '#D4AF37', desc: 'Warm & uplifting' },
];

const MODE_PROMPTS = {
  SASSY: `You are AURA, a sharp and witty AI co-host for SeeWhy LIVE. Be clever, occasionally shade things lightly, and keep it punchy. Max 180 chars.`,
  HYPE: `You are AURA, a HIGH ENERGY AI co-host for SeeWhy LIVE. USE CAPS for emphasis. Bring MAXIMUM enthusiasm. Make people feel the energy! Max 180 chars.`,
  CALM: `You are AURA, a calm analytical AI co-host for SeeWhy LIVE. Be measured, data-driven, and thoughtful. Speak with quiet authority. Max 180 chars.`,
  KIND: `You are AURA, a warm and inclusive AI co-host for SeeWhy LIVE. Be uplifting, supportive, and make everyone feel welcomed and valued. Max 180 chars.`,
};

export default function AuraPanel({ roomId, isHost, streamTitle, viewerCount, isLive, userTier }) {
  const [mode, setMode] = useState('HYPE');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [callCount, setCallCount] = useState(0);
  const CAP = 20;
  const bottomRef = useRef(null);

  // Gate: only Pro/Studio tier (or admin in this demo, we just allow all)
  const isAllowed = true; // In production gate by tier

  const generateAuraMessage = async (trigger, context) => {
    if (!enabled || callCount >= CAP || !isLive) return;
    setIsGenerating(true);
    try {
      const systemPrompt = MODE_PROMPTS[mode];
      const userPrompt = buildPrompt(trigger, context);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nSituation: ${userPrompt}\n\nRespond in character. Keep it under 180 characters.`,
      });
      const text = typeof result === 'string' ? result : result?.text || result?.content || '';
      const trimmed = text.slice(0, 180);
      const msg = {
        id: Date.now(),
        text: trimmed,
        mode,
        trigger,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(-19), msg]);
      setCallCount(c => c + 1);

      // Post to room chat as bot message
      if (roomId) {
        await base44.entities.Message.create({
          room_id: roomId,
          user_id: 'aura-bot',
          user_name: `AURA (${MODES.find(m => m.id === mode)?.emoji})`,
          content: trimmed,
          message_type: 'aura',
        });
      }
    } catch (e) {
      // silent fail
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPrompt = (trigger, ctx) => {
    switch (trigger) {
      case 'stream_start': return `Stream "${ctx.title}" just went live with ${ctx.viewers} viewers. Give an opening line!`;
      case 'tip': return `${ctx.name} just tipped $${ctx.amount}${ctx.note ? ` saying "${ctx.note}"` : ''}. React!`;
      case 'new_viewer': return `${ctx.name} just joined the stream${ctx.returning ? ' — they\'re a returning viewer' : ''}. Welcome them!`;
      case 'gift': return `${ctx.name} sent a ${ctx.gift}! React to the gift!`;
      case 'stream_end': return `Stream ending. Peak viewers: ${ctx.peak}. Total earned: $${ctx.earnings}. Give a closing line!`;
      case 'milestone': return `The stream just hit ${ctx.viewers} viewers! React!`;
      default: return ctx.custom || 'Say something engaging to the audience.';
    }
  };

  // Auto-trigger on stream start
  useEffect(() => {
    if (isLive && streamTitle && enabled) {
      setTimeout(() => {
        generateAuraMessage('stream_start', { title: streamTitle, viewers: viewerCount });
      }, 2000);
    }
  }, [isLive]);

  // Milestone triggers
  const prevViewers = useRef(viewerCount);
  useEffect(() => {
    const milestones = [10, 50, 100, 500, 1000, 2000, 5000];
    const crossed = milestones.find(m => prevViewers.current < m && viewerCount >= m);
    if (crossed && enabled) {
      generateAuraMessage('milestone', { viewers: crossed });
    }
    prevViewers.current = viewerCount;
  }, [viewerCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentMode = MODES.find(m => m.id === mode);

  return (
    <div className="border border-[#D4AF37]/30 rounded-xl bg-[#0B0B18] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#D4AF37]/10 bg-[#07070F]">
        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
        </div>
        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">AURA AI</span>
        {isGenerating && (
          <div className="flex gap-0.5 ml-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-[#D4AF37]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-white/30 font-mono">{callCount}/{CAP}/hr</span>
          <button
            onClick={() => setEnabled(v => !v)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
              enabled ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/30'
            }`}
          >
            {enabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-2 pt-2 flex gap-1">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 py-1 rounded text-[11px] font-bold transition-all border ${
              mode === m.id
                ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-white/10 text-white/30 hover:border-white/20'
            }`}
            title={m.desc}
          >
            {m.emoji}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="p-2 space-y-2 max-h-40 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-[10px] text-white/20 text-center py-4">
            {isLive ? 'AURA will respond to tips, gifts, and milestones...' : 'Go live to activate AURA'}
          </p>
        ) : (
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 text-xs"
              >
                <span className="text-[#D4AF37] shrink-0">✦</span>
                <p className="text-white/70 leading-relaxed">{msg.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Manual trigger */}
      {isHost && isLive && (
        <div className="px-2 pb-2">
          <button
            onClick={() => generateAuraMessage('stream_start', { title: streamTitle, viewers: viewerCount })}
            disabled={isGenerating || !enabled || callCount >= CAP}
            style={{ width: '100%', height: 24, fontSize: 11, color: '#D4AF37', background: 'transparent', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <RefreshCw className="w-2.5 h-2.5" style={{ marginRight: 2 }} /> Trigger AURA
          </button>
        </div>
      )}
    </div>
  );
}

// Expose trigger for parent components to call
export function useAuraTrigger(generateFn) {
  return {
    onTip: (name, amount, note) => generateFn('tip', { name, amount, note }),
    onNewViewer: (name, returning) => generateFn('new_viewer', { name, returning }),
    onGift: (name, gift) => generateFn('gift', { name, gift }),
    onStreamEnd: (peak, earnings) => generateFn('stream_end', { peak, earnings }),
  };
}