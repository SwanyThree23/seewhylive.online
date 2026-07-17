import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Scissors, Loader2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CLIP_TRIGGERS = [
  { label: 'Peak Moments (High Chat Activity)', value: 'peak' },
  { label: 'Viral Clips (Trending Keywords)', value: 'viral' },
  { label: 'Achievements & Milestones', value: 'achievements' },
  { label: 'Game Highlights', value: 'highlights' },
  { label: 'Manual Selection', value: 'manual' }
];

export default function AutomatedClipGenerator({ streamSession, isLive }) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [selectedTriggers, setSelectedTriggers] = useState(['peak']);
  const [copied, setCopied] = useState(null);

  // Load persisted clips from DB
  const { data: clips = [] } = useQuery({
    queryKey: ['stream-clips', streamSession?.id],
    queryFn: () => base44.entities.StreamClip.filter({ stream_session_id: streamSession.id }),
    enabled: !!streamSession?.id,
    refetchInterval: isLive ? 8000 : false,
  });

  const handleGenerateClip = async () => {
    if (!streamSession?.id) { toast.error('No active stream session'); return; }
    setGenerating(true);
    try {
      await base44.entities.StreamClip.create({
        stream_session_id: streamSession.id,
        room_id: streamSession.room_id || null,
        creator_id: streamSession.creator_id || null,
        title: `Highlight — ${new Date().toLocaleTimeString()}`,
        trigger_type: selectedTriggers[0] || 'manual',
        duration_seconds: 60,
        start_timestamp_seconds: null,
        end_timestamp_seconds: null,
        clip_url: null,
        status: 'generating',
        is_featured: false,
        view_count: 0,
        like_count: 0,
      });
      qc.invalidateQueries({ queryKey: ['stream-clips', streamSession.id] });
      toast.success('Clip queued — will be ready once processed');
    } catch {
      toast.error('Clip creation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyUrl = (clip) => {
    const shareUrl = clip.clip_url || `${window.location.origin}/clips/${clip.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(clip.id);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => toast.error('Copy failed'));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="w-4 h-4 text-[#d4af37]" />
        <h3 className="text-sm font-bold text-white">Auto Clip Generator</h3>
      </div>

      <div className="space-y-3">
        {/* Triggers */}
        <div>
          <label className="text-[11px] text-white/60 uppercase block mb-2 font-semibold">Auto Triggers</label>
          <div className="grid grid-cols-1 gap-1.5">
            {CLIP_TRIGGERS.map(trigger => (
              <button
                key={trigger.value}
                onClick={() =>
                  setSelectedTriggers(prev =>
                    prev.includes(trigger.value)
                      ? prev.filter(t => t !== trigger.value)
                      : [...prev, trigger.value]
                  )
                }
                className={`p-2 rounded-lg text-left transition-all border text-[11px] ${
                  selectedTriggers.includes(trigger.value)
                    ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTriggers.includes(trigger.value)}
                  className="mr-2"
                  readOnly
                />
                {trigger.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateClip}
          disabled={generating || !isLive}
          style={{ width:'100%', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, height:36, cursor:(generating||!isLive)?'not-allowed':'pointer', opacity:(generating||!isLive)?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Barlow Condensed, sans-serif', fontSize:13 }}
        >
          {generating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Scissors className="w-3 h-3" />
              Create Clip Now
            </>
          )}
        </button>

        {/* Recent Clips */}
        {clips.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/10">
            <p className="text-[11px] text-white/60 uppercase font-semibold">Recent Clips</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {clips.map(clip => (
                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-white truncate">{clip.title}</span>
                    {clip.status === 'ready' && <Check className="w-3 h-3 text-[#6DBF7E]" />}
                    {clip.status === 'generating' && <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/50 mb-1.5">
                    <span>{clip.duration_seconds ?? '—'}s</span>
                    <span>•</span>
                    <span>{clip.view_count ?? 0} views</span>
                  </div>
                  <button
                    onClick={() => handleCopyUrl(clip)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 rounded px-2 py-1"
                  >
                    {copied === clip.id ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-[#6DBF7E]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        Share Link
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
