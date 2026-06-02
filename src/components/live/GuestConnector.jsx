import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Share2, Volume2, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { safeSrc } from '@/lib/security';

const G = '#d4af37';
const BG = 'rgba(7,7,15,0.95)';

export default function GuestConnector({ roomId, roomName = 'SeeWhy Studio' }) {
  const [showPanel, setShowPanel] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const timeoutRef = useRef(null);

  // Generate VDO.ninja quick-join links with unique room IDs
  const guestLinks = [
    {
      name: 'Main Stage',
      url: `https://vdo.ninja/?view=Swan23&room=MAIN-${roomId?.slice(0, 8) || 'DEMO'}&solo`,
      color: 'bg-[rgba(212,175,55,0.08)]',
      textColor: '#d4af37',
      icon: '🎬',
      description: 'Full video + audio',
    },
    {
      name: 'Audio Only',
      url: `https://vdo.ninja/?view=Swan23&room=AUDIO-${roomId?.slice(0, 8) || 'DEMO'}&audioonly`,
      color: 'bg-[rgba(139,92,246,0.08)]',
      textColor: '#8B5CF6',
      icon: '🎙️',
      description: 'Audio stream only',
    },
    {
      name: 'Screen Share',
      url: `https://vdo.ninja/?view=Swan23&room=SCREEN-${roomId?.slice(0, 8) || 'DEMO'}&screen`,
      color: 'bg-[rgba(0,245,255,0.08)]',
      textColor: '#00F5FF',
      icon: '🖥️',
      description: 'Screen sharing mode',
    },
    {
      name: 'Co-Host',
      url: `https://vdo.ninja/?view=Swan23&room=COHOST-${roomId?.slice(0, 8) || 'DEMO'}&broadcast`,
      color: 'bg-[rgba(255,136,0,0.08)]',
      textColor: '#FF8C00',
      icon: '👥',
      description: 'Full co-host access',
    },
  ];

  const handleCopyLink = (link, name) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(name);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedLink(null), 2000);
    toast.success(`${name} link copied!`);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all"
        style={{
          background: showPanel ? `${G}12` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${showPanel ? `${G}40` : 'rgba(255,255,255,0.08)'}`,
          color: showPanel ? G : 'rgba(255,255,255,0.6)',
        }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Guest Connector</span>
        </div>
        {showPanel ? <X className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      </button>

      {/* Expandable Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg space-y-2" style={{ background: BG, border: `1px solid ${G}20` }}>
              {/* Header Info */}
              <div className="text-[11px] text-white/40 mb-2">
                <p className="font-semibold">Quick-join links for remote guests</p>
                <p className="mt-0.5">Low-latency VDO.ninja integration · Click to copy</p>
              </div>

              {/* Link Cards */}
              <div className="space-y-2">
                {guestLinks.map((link, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleCopyLink(link.url, link.name)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95 ${link.color}`}
                    style={{ borderLeft: `3px solid ${link.textColor}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg">{link.icon}</span>
                          <p className="text-xs font-bold" style={{ color: link.textColor }}>
                            {link.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-white/40 mb-1">{link.description}</p>
                        <p className="text-[9px] text-white/30 break-all font-mono line-clamp-1">
                          {link.url.replace('https://', '')}
                        </p>
                      </div>
                      <div className="flex-shrink-0 pt-0.5">
                        {copiedLink === link.name ? (
                          <Check className="w-4 h-4" style={{ color: link.textColor }} />
                        ) : (
                          <Copy className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1.5 pt-1 border-t border-white/10">
                <a
                  href={safeSrc(guestLinks[0].url) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-all"
                  style={{
                    background: `${G}20`,
                    color: G,
                    border: `1px solid ${G}40`,
                  }}
                >
                  <ExternalLink className="inline w-3 h-3 mr-1" />
                  Open Main Stage
                </a>
                <button
                  onClick={() => {
                    const allLinks = guestLinks.map(l => `${l.name}: ${l.url}`).join('\n\n');
                    navigator.clipboard.writeText(allLinks);
                    toast.success('All links copied!');
                  }}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-all"
                  style={{
                    background: 'rgba(139,92,246,0.12)',
                    color: '#8B5CF6',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  <Copy className="inline w-3 h-3 mr-1" />
                  Copy All
                </button>
              </div>

              {/* Info Footer */}
              <div className="text-[9px] text-white/20 pt-1 border-t border-white/10">
                Share these links with remote guests. VDO.ninja handles video/audio with low latency directly in browser.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}