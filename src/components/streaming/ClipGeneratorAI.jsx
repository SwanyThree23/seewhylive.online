import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const G = '#d4af37';

export default function ClipGeneratorAI({ sessionId, roomId, creatorId }) {
  const [generating, setGenerating] = useState(false);
  const [clips, setClips] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  const generateClips = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 highlight clip suggestions for a live stream. Each clip should represent an exciting moment. Return JSON: { "clips": [{ "title": string, "duration": number (15-90 seconds), "views": 0 }] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            clips: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  duration: { type: 'number' },
                  views: { type: 'number' },
                },
              },
            },
          },
        },
      });
      if (result?.clips?.length) {
        const persisted = await Promise.all(
          result.clips.map(c =>
            base44.entities.StreamClip.create({
              stream_session_id: sessionId || null,
              room_id: roomId || null,
              creator_id: creatorId || null,
              title: c.title,
              clip_type: 'highlight',
              trigger_type: 'auto',
              duration_seconds: c.duration,
              status: 'ready',
              view_count: 0,
              like_count: 0,
            }).catch(() => null)
          )
        );
        setClips(
          result.clips.map((c, i) => ({
            ...c,
            id: persisted[i]?.id || null,
            shareUrl: persisted[i]?.id ? `${window.location.origin}/clips/${persisted[i].id}` : null,
          }))
        );
        toast.success(`Generated ${result.clips.length} clip suggestions!`);
      }
    } catch (error) {
      toast.error('Failed to generate clips');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-2">
      {/* Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (clips.length === 0) generateClips();
          else setShowPanel(!showPanel);
        }}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-sm transition-all"
        style={{
          background: generating ? `${G}20` : G,
          color: generating ? G : '#000',
        }}
      >
        <Sparkles className="w-4 h-4" />
        {generating ? 'Analyzing...' : clips.length > 0 ? `View ${clips.length} Clips` : 'Generate Clips'}
      </motion.button>

      {/* Clips List */}
      {showPanel && clips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 p-3 rounded-lg"
          style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${G}20` }}
        >
          {clips.map((clip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-2.5 rounded-lg flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{clip.title}</p>
                <p className="text-[10px] text-white/40">{clip.duration}s • {clip.views} views</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {clip.shareUrl && (
                  <a href={clip.shareUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 text-white/40 hover:text-white transition-colors" />
                  </a>
                )}
                <button
                  onClick={() => {
                    if (!clip.shareUrl) { toast.error('No share link yet'); return; }
                    navigator.clipboard.writeText(clip.shareUrl)
                      .then(() => toast.success('Share link copied!'))
                      .catch(() => toast.error('Copy failed'));
                  }}
                >
                  <Share2 className="w-3.5 h-3.5 text-white/40 hover:text-white transition-colors" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}