import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Video, Clock, Lock } from 'lucide-react';

const G = '#d4af37';

export default function VideoShortRecorder({ roomId, creatorId }) {
  const [isRecording, isRecordingSet] = useState(false);
  const [duration, setDuration] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const [paywallPrice, setPaywallPrice] = useState(2.99);
  const [videoTitle, setVideoTitle] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setDuration(d => {
          if (d >= 600) {
            isRecordingSet(false);
            return 600;
          }
          return d + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const result = await base44.functions.invoke('createVideoShort', {
        room_id: roomId,
        title: videoTitle || 'Untitled Short',
        description: `Published at ${new Date().toLocaleTimeString()}`,
        video_url: 'https://example.com/video.mp4', // Would be actual recording
        thumbnail_url: 'https://example.com/thumb.jpg',
        duration_seconds: duration,
        paywall_enabled: paywall,
        paywall_price: paywall ? paywallPrice : 0,
      });

      if (result?.data) {
        alert('Video published!');
        setDuration(0);
        setVideoTitle('');
      }
    } catch (error) {
      console.error('Publish error:', error);
    }
    setPublishing(false);
  };

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const maxDuration = duration >= 600;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg space-y-3"
      style={{ background: 'rgba(8,11,24,0.95)', border: `1px solid ${G}30` }}
    >
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4" style={{ color: G }} />
        <p className="text-xs font-bold" style={{ color: G }}>Create Short (Max 10 min)</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
            style={{ background: isRecording ? '#C0392B' : 'rgba(255,255,255,0.2)' }} />
          <span className="text-xs font-bold text-white/70">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} / 10:00
          </span>
        </div>
        <button
          onClick={() => isRecordingSet(!isRecording)}
          disabled={maxDuration}
          className="px-3 py-1.5 rounded text-xs font-bold"
          style={{ background: isRecording ? '#C0392B' : G, color: isRecording ? 'white' : '#000' }}
        >
          {isRecording ? 'Stop' : 'Record'}
        </button>
      </div>

      {duration > 0 && (
        <>
          <input
            type="text"
            placeholder="Short title..."
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="w-full px-2 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-white/30"
          />

          <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <input
              type="checkbox"
              id="paywall"
              checked={paywall}
              onChange={(e) => setPaywall(e.target.checked)}
              className="w-3 h-3"
            />
            <label htmlFor="paywall" className="text-xs text-white/70 flex items-center gap-1">
              <Lock className="w-3 h-3" style={{ color: G }} />
              Paywall (viewers pay to watch)
            </label>
          </div>

          {paywall && (
            <input
              type="number"
              min="0.99"
              step="0.01"
              value={paywallPrice}
              onChange={(e) => setPaywallPrice(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white"
              placeholder="Price in USD"
            />
          )}

          <button
            onClick={handlePublish}
            disabled={publishing || !videoTitle}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: G, color: '#000' }}
          >
            {publishing ? 'Publishing...' : 'Publish Short'}
          </button>
        </>
      )}
    </motion.div>
  );
}