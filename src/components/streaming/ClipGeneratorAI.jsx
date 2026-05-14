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
      const result = await base44.functions.invoke('generateAutoClips', {
        session_id: sessionId,
        room_id: roomId,
        creator_id: creatorId,
      });

      if (result?.data?.clips) {
        setClips(result.data.clips);
        toast.success(`Generated ${result.data.clips.length} clips!`);
      }
    } catch (error) {
      console.error('Clip generation error:', error);
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
          style={{ background: 'rgba(7,7,15,0.9)', border: `1px solid ${G}20` }}
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
                <a href={clip.url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3.5 h-3.5 text-white/40 hover:text-white transition-colors" />
                </a>
                <button>
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