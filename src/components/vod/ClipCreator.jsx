import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors, Play, Copy, Share2, Heart } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const BG = '#0A0710';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

export default function ClipCreator({ streamSessionId, roomId, creatorId, onClipCreated }) {
  const [title, setTitle] = useState('');
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const createClipMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const clip = await base44.entities.StreamClip.create({
        stream_session_id: streamSessionId,
        room_id: roomId,
        creator_id: creatorId,
        clipped_by_id: (await base44.auth.me()).id,
        clipped_by_username: (await base44.auth.me()).full_name,
        title: title || `Clip ${new Date().toLocaleTimeString()}`,
        start_timestamp_seconds: startSec,
        end_timestamp_seconds: endSec,
        duration_seconds: endSec - startSec,
        clip_url: `https://clips.example.com/${roomId}/${streamSessionId}/${startSec}-${endSec}`,
        thumbnail_url: `https://thumbs.example.com/${roomId}/${streamSessionId}/${startSec}.jpg`,
      });
      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: ['streamClips'] });
      if (onClipCreated) onClipCreated(clip);
      setTitle('');
      return clip;
    },
    onError: () => { toast.error('Failed to create clip. Please try again.'); },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4"
      style={{ background: BG, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="w-4 h-4" style={{ color: G }} />
        <h3 className="text-xs font-bold uppercase" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Create Clip
        </h3>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <input
          type="text"
          placeholder="Clip title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: PANEL, border: `1px solid ${BORDER}`, color: 'white' }}
        />

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Start (sec)</label>
            <input
              type="number"
              min="0"
              value={startSec}
              onChange={(e) => setStartSec(parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 rounded text-sm outline-none"
              style={{ background: PANEL, border: `1px solid ${BORDER}`, color: 'white' }}
            />
          </div>
          <div>
            <label className="text-[10px] text-white/50 block mb-1">End (sec)</label>
            <input
              type="number"
              min={startSec + 1}
              value={endSec}
              onChange={(e) => setEndSec(parseInt(e.target.value) || 60)}
              className="w-full px-2 py-1.5 rounded text-sm outline-none"
              style={{ background: PANEL, border: `1px solid ${BORDER}`, color: 'white' }}
            />
          </div>
        </div>

        {/* Duration Display */}
        <div className="text-center text-xs text-white/60 font-bold">
          Duration: {endSec - startSec}s
        </div>

        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => createClipMutation.mutate()}
          disabled={isLoading || !title.trim()}
          className="w-full py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
          style={{ background: G, color: '#000' }}
        >
          {isLoading ? '⏳ Creating...' : '✂️ Create Clip'}
        </motion.button>
      </div>
    </motion.div>
  );
}