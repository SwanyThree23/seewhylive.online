import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Youtube, Copy, CheckCircle2, Link as LinkIcon } from 'lucide-react';

export default function ShareToSocial({ content }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = content?.url || window.location.href;
  const shareText = content?.title || 'Check this out on SeeWhy LIVE!';

  const platforms = [
    {
      name: 'YouTube',
      icon: Youtube,
      action: () => {
        window.open(`https://youtube.com/results?search_query=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
      },
      color: '#FF0000',
    },
    {
      name: 'Twitter',
      icon: Share2,
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
      },
      color: '#1DA1F2',
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-white/60" />
        <h3 className="text-sm font-bold text-white">Share</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {platforms.map(platform => {
          const Icon = platform.icon;
          return (
            <motion.button
              key={platform.name}
              whileHover={{ scale: 1.05 }}
              onClick={platform.action}
              className="flex items-center gap-2 p-2 rounded-lg transition-all"
              style={{
                background: `rgba(${platform.color === '#FF0000' ? '255,0,0' : '29,161,242'},0.1)`,
                border: `1px solid rgba(${platform.color === '#FF0000' ? '255,0,0' : '29,161,242'},0.3)`,
                cursor: 'pointer',
              }}
            >
              <Icon className="w-4 h-4" style={{ color: platform.color }} />
              <span className="text-xs font-semibold text-white">{platform.name}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={handleCopyLink}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-all"
        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer' }}
      >
        {copied ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs font-semibold text-[#d4af37]">Copy Link</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
