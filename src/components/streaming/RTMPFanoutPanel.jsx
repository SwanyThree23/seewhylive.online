import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, ZapOff, Plus, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const PLATFORM_META = {
  youtube:   { icon: '▶', color: '#FF0000', label: 'YouTube Live' },
  twitch:    { icon: '◉', color: '#9146FF', label: 'Twitch' },
  facebook:  { icon: 'f', color: '#1877F2', label: 'Facebook Live' },
  instagram: { icon: '◈', color: '#E1306C', label: 'Instagram Live' },
  tiktok:    { icon: '♫', color: '#69C9D0', label: 'TikTok LIVE' },
  linkedin:  { icon: 'in', color: '#0A66C2', label: 'LinkedIn Live' },
  kick:      { icon: '⚡', color: '#53FC18', label: 'Kick' },
  x:         { icon: '𝕏', color: '#FFFFFF', label: 'X (Twitter)' },
  custom:    { icon: '⊕', color: GOLD,      label: 'Custom RTMP' },
};

function PlatformRow({ dest, isLive, onToggle, isPending }) {
  const meta = PLATFORM_META[dest.platform] || PLATFORM_META.custom;
  return (
    <motion.div
      layout
      className="flex items-center gap-2 rounded-lg p-2"
      style={{ background: isLive ? 'rgba(109,191,126,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLive ? 'rgba(109,191,126,0.2)' : 'rgba(255,255,255,0.06)'}` }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
        style={{ background: `${meta.color}22`, color: meta.color }}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white leading-none truncate">{dest.label || meta.label}</p>
        <p className="text-[9px] text-white/30 mt-0.5 truncate">{dest.server_url || '—'}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLive && <span className="flex items-center gap-1 text-[9px] font-black text-[#6DBF7E]"><span className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse inline-block" /> LIVE</span>}
        <button
          disabled={isPending}
          onClick={() => onToggle(dest.id, !isLive)}
          style={{ ...T, padding: '3px 10px', fontSize: 10, fontWeight: 900, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(109,191,126,0.15)',
            color: isLive ? '#f87171' : '#6DBF7E', opacity: isPending ? 0.5 : 1 }}
        >
          {isLive ? 'Stop' : 'Start'}
        </button>
      </div>
    </motion.div>
  );
}

export default function RTMPFanoutPanel({ userId, streamId, isStreaming }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [liveSet, setLiveSet] = useState(new Set());
  const [pending, setPending] = useState(new Set());

  const { data: destinations = [] } = useQuery({
    queryKey: ['rtmp-destinations', userId],
    queryFn: () => userId ? base44.entities.RTMPDestination.filter({ creator_id: userId }) : [],
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const enabledDests = destinations.filter(d => d.is_enabled !== false);

  const toggleDest = async (destId, goLive) => {
    setPending(p => new Set([...p, destId]));
    try {
      await base44.entities.RTMPDestination.update(destId, { is_live: goLive });
      setLiveSet(prev => {
        const next = new Set(prev);
        goLive ? next.add(destId) : next.delete(destId);
        return next;
      });
      if (userId) {
        base44.entities.Activity.create({
          user_id: userId,
          type: 'milestone',
          title: goLive ? 'RTMP fanout started' : 'RTMP fanout stopped',
          description: `Destination: ${destId}`,
        }).catch(() => {});
      }
      toast.success(goLive ? 'Fanout started' : 'Fanout stopped');
      qc.invalidateQueries(['rtmp-destinations', userId]);
    } catch {
      toast.error('Failed to update destination');
    } finally {
      setPending(p => { const n = new Set(p); n.delete(destId); return n; });
    }
  };

  const goLiveAll = async () => {
    if (!enabledDests.length) { toast.error('No destinations configured'); return; }
    for (const d of enabledDests) await toggleDest(d.id, true);
  };

  const stopAll = async () => {
    for (const d of enabledDests) await toggleDest(d.id, false);
  };

  const liveCount = enabledDests.filter(d => liveSet.has(d.id) || d.is_live).length;

  return (
    <div className="rounded-xl border" style={{ background: 'rgba(8,11,24,0.95)', borderColor: liveCount > 0 ? 'rgba(109,191,126,0.3)' : 'rgba(212,175,55,0.15)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-3"
        style={T}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: GOLD }}>RTMP Fanout</span>
          {liveCount > 0 && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#6DBF7E]/20 text-[#6DBF7E] border border-[#6DBF7E]/30">
              {liveCount} LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">{enabledDests.length} dest.</span>
          {expanded ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {enabledDests.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="w-5 h-5 text-white/20 mx-auto mb-1" />
                  <p className="text-[10px] text-white/30">No destinations configured</p>
                  <p className="text-[10px] text-white/20">Add them in Multi-Platform Settings</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {enabledDests.map(dest => (
                    <PlatformRow
                      key={dest.id}
                      dest={dest}
                      isLive={liveSet.has(dest.id) || !!dest.is_live}
                      isPending={pending.has(dest.id)}
                      onToggle={toggleDest}
                    />
                  ))}
                </div>
              )}

              {enabledDests.length > 0 && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={goLiveAll}
                    disabled={!isStreaming}
                    style={{ ...T, flex: 1, height: 30, fontSize: 11, fontWeight: 900, borderRadius: 8, border: 'none', cursor: isStreaming ? 'pointer' : 'not-allowed',
                      background: isStreaming ? `linear-gradient(135deg, ${CRIMSON}, #B22222)` : 'rgba(255,255,255,0.05)', color: '#fff',
                      opacity: isStreaming ? 1 : 0.4 }}
                  >
                    <Zap className="w-3 h-3 inline mr-1" />Go Live All
                  </button>
                  <button
                    onClick={stopAll}
                    style={{ ...T, height: 30, padding: '0 10px', fontSize: 11, fontWeight: 900, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
                  >
                    <ZapOff className="w-3 h-3 inline mr-1" />Stop All
                  </button>
                </div>
              )}

              {!isStreaming && enabledDests.length > 0 && (
                <p className="text-[9px] text-white/20 text-center">Start your main stream first to enable fanout</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
