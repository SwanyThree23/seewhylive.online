import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors } from 'lucide-react';
import { toast } from 'sonner';

var G      = '#D4AF37';
var BG     = '#080B18';
var PANEL  = '#0D1022';
var BORDER = 'rgba(212,175,55,0.18)';

export default function ClipCreator(props) {
  var streamSessionId = props.streamSessionId;
  var roomId          = props.roomId;
  var creatorId       = props.creatorId;
  var onClipCreated   = props.onClipCreated;

  var titleState = useState('');
  var title    = titleState[0];
  var setTitle = titleState[1];
  var startSecState = useState(0);
  var startSec    = startSecState[0];
  var setStartSec = startSecState[1];
  var endSecState = useState(60);
  var endSec    = endSecState[0];
  var setEndSec = endSecState[1];
  var isLoadingState = useState(false);
  var isLoading    = isLoadingState[0];
  var setIsLoading = isLoadingState[1];
  var queryClient = useQueryClient();

  var createClipMutation = useMutation({
    mutationFn: async function() {
      setIsLoading(true);
      var me   = await base44.auth.me();
      var clip = await base44.entities.StreamClip.create({
        stream_session_id: streamSessionId,
        room_id: roomId,
        creator_id: creatorId,
        clipped_by_id: me.id,
        clipped_by_username: me.full_name,
        title: title || ('Clip ' + new Date().toLocaleTimeString()),
        start_timestamp_seconds: startSec,
        end_timestamp_seconds: endSec,
        duration_seconds: endSec - startSec,
        clip_url: 'https://clips.example.com/' + roomId + '/' + streamSessionId + '/' + startSec + '-' + endSec,
        thumbnail_url: 'https://thumbs.example.com/' + roomId + '/' + streamSessionId + '/' + startSec + '.jpg',
      });
      setIsLoading(false);
      queryClient.invalidateQueries({ queryKey: ['streamClips'] });
      if (onClipCreated) onClipCreated(clip);
      setTitle('');
      return { clip: clip, userId: me.id };
    },
    onSuccess: function(result) {
      base44.entities.Activity.create({
        user_id: result.userId,
        type: 'clip_created',
        title: 'Clipped: ' + ((result.clip && result.clip.title) || 'Stream clip'),
      }).catch(function() {});
    },
    onError: function() { toast.error('Failed to create clip.'); },
  });

  var inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 14, outline: 'none',
    background: PANEL, border: '1px solid ' + BORDER, color: 'white', boxSizing: 'border-box',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 8, padding: 16, background: BG, border: '1px solid ' + BORDER }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Scissors style={{ width: 16, height: 16, color: G }} />
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: G, fontFamily: 'Barlow Condensed, sans-serif', margin: 0 }}>
          Create Clip
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title */}
        <input
          type="text"
          placeholder="Clip title (optional)"
          value={title}
          onChange={function(e) { setTitle(e.target.value); }}
          style={inputStyle}
        />

        {/* Time Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Start (sec)</label>
            <input
              type="number"
              min="0"
              value={startSec}
              onChange={function(e) { setStartSec(parseInt(e.target.value) || 0); }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>End (sec)</label>
            <input
              type="number"
              min={startSec + 1}
              value={endSec}
              onChange={function(e) { setEndSec(parseInt(e.target.value) || 60); }}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Duration Display */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
          Duration: {endSec - startSec}s
        </div>

        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={function() { createClipMutation.mutate(); }}
          disabled={isLoading || !title.trim()}
          style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: (isLoading || !title.trim()) ? 'not-allowed' : 'pointer', background: G, color: '#000', opacity: (isLoading || !title.trim()) ? 0.5 : 1 }}
        >
          {isLoading ? '⏳ Creating...' : '✂️ Create Clip'}
        </motion.button>
      </div>
    </motion.div>
  );
}
