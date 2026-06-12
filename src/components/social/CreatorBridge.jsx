import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';

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
            style={{
              width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'Barlow Condensed, sans-serif',
            }}
          />
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
          <button
            onClick={handleLinkYouTube}
            disabled={!youtubeUrl}
            style={{
              width: '100%', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, fontSize: 12, cursor: youtubeUrl ? 'pointer' : 'not-allowed', borderRadius: 8,
              background: '#FF0000', color: 'white', border: 'none', opacity: youtubeUrl ? 1 : 0.5,
            }}
          >
            <LinkIcon className="w-3 h-3" />
            Link Channel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(109,191,126,0.1)' }}>
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-xs font-semibold text-green-400">Connected</p>
            <p className="text-[11px] text-green-300/70">Your YouTube content syncs to SeeWhy LIVE</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
