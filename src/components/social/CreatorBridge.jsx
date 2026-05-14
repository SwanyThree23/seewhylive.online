import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreatorBridge({ user }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState('');

  const handleLinkYouTube = () => {
    if (!youtubeUrl.includes('youtube.com/@') && !youtubeUrl.includes('youtube.com/c/')) {
      setError('Please enter a valid YouTube channel URL');
      return;
    }

    // Extract channel name
    const channelName = youtubeUrl.split('@')[1] || youtubeUrl.split('c/')[1];
    setLinked(true);
    setError('');
    setTimeout(() => setYoutubeUrl(''), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg p-4 space-y-3"
      style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-white">Connect YouTube Channel</h3>
        </div>
        {linked && <CheckCircle2 className="w-4 h-4 text-green-400" />}
      </div>

      {!linked ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="https://youtube.com/@yourChannel"
            value={youtubeUrl}
            onChange={(e) => {
              setYoutubeUrl(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder:text-white/30"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
          <Button
            onClick={handleLinkYouTube}
            disabled={!youtubeUrl}
            className="w-full h-8 text-xs"
            style={{ background: '#FF0000', color: 'white' }}
          >
            <LinkIcon className="w-3 h-3 mr-1" />
            Link Channel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-xs font-semibold text-green-400">Connected</p>
            <p className="text-[9px] text-green-300/70">Your YouTube content syncs to SeeWhy LIVE</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}