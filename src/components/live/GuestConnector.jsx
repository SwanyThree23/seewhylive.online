import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Share2, X, ExternalLink, Video, Mic, Monitor, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { safeSrc } from '@/lib/security';

const G = '#d4af37';
const BG = 'rgba(8,11,24,0.95)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function CopyBtn({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${label} copied!`);
    }).catch(() => toast.error('Copy failed.'));
  };
  return (
    <button
      onClick={copy}
      className="flex items-center justify-center gap-1 h-7 px-2 rounded transition-all"
      style={{ background: copied ? `${G}20` : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? `${G}40` : 'rgba(255,255,255,0.1)'}` }}
    >
      {copied
        ? <Check className="w-3 h-3" style={{ color: G }} />
        : <Copy className="w-3 h-3 text-white/40" />}
    </button>
  );
}

export default function GuestConnector({ roomId, roomName = 'SeeWhy Studio' }) {
  const [showPanel, setShowPanel] = useState(false);
  const [tab, setTab] = useState('invite'); // 'invite' | 'vdo'

  const rSlug = roomId?.slice(0, 8) || 'DEMO';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seewhylive.online';

  // Native SeeWhy guest join URL (the primary invite link guests click)
  const guestJoinUrl = `${origin}/GuestJoin?room=${roomId || 'demo'}`;

  // VDO.ninja links — push (send to guest) + view (host receives in OBS/SeeWhy)
  const vdoLinks = [
    {
      name: 'Main Stage (Video+Audio)',
      pushUrl: `https://vdo.ninja/?push=sw-${rSlug}-main&room=SW-${rSlug}&label=${encodeURIComponent(roomName)}`,
      viewUrl: `https://vdo.ninja/?view=sw-${rSlug}-main&room=SW-${rSlug}&solo`,
      icon: <Video className="w-3 h-3" />,
      color: G,
      desc: 'Full video + audio feed',
    },
    {
      name: 'Co-Host',
      pushUrl: `https://vdo.ninja/?push=sw-${rSlug}-cohost&room=SW-${rSlug}&label=CoHost`,
      viewUrl: `https://vdo.ninja/?view=sw-${rSlug}-cohost&room=SW-${rSlug}&solo`,
      icon: <Crown className="w-3 h-3" />,
      color: '#D4854A',
      desc: 'Co-host slot with broadcast',
    },
    {
      name: 'Audio Only',
      pushUrl: `https://vdo.ninja/?push=sw-${rSlug}-audio&room=SW-${rSlug}&audioonly&label=AudioGuest`,
      viewUrl: `https://vdo.ninja/?view=sw-${rSlug}-audio&room=SW-${rSlug}&audioonly&solo`,
      icon: <Mic className="w-3 h-3" />,
      color: '#6DBF7E',
      desc: 'Voice-only connection',
    },
    {
      name: 'Screen Share',
      pushUrl: `https://vdo.ninja/?push=sw-${rSlug}-screen&room=SW-${rSlug}&screen&label=ScreenShare`,
      viewUrl: `https://vdo.ninja/?view=sw-${rSlug}-screen&room=SW-${rSlug}&solo`,
      icon: <Monitor className="w-3 h-3" />,
      color: '#C9A84C',
      desc: 'Desktop screen capture',
    },
  ];

  const guestLinks = [
    { name: 'Guest Invite', url: guestJoinUrl },
    ...vdoLinks.map(v => ({ name: v.name, url: v.pushUrl })),
  ];

  return (
    <div className="flex flex-col gap-2">
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
          <span className="text-xs font-bold uppercase tracking-wider" style={T}>Guest Connector</span>
        </div>
        {showPanel ? <X className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg space-y-3" style={{ background: BG, border: `1px solid ${G}20` }}>

              {/* Tabs */}
              <div className="flex gap-1 p-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {[['invite', 'Guest Invite'], ['vdo', 'VDO.ninja']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="flex-1 py-1 rounded text-[10px] font-black uppercase transition-all"
                    style={{
                      background: tab === key ? `${G}20` : 'transparent',
                      color: tab === key ? G : 'rgba(255,255,255,0.35)',
                      border: tab === key ? `1px solid ${G}35` : '1px solid transparent',
                      ...T,
                    }}
                  >
                    {label}
                  </button>
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
                    background: 'rgba(212,175,55,0.12)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.25)',
                  }}
                >
                  <Copy className="inline w-3 h-3 mr-1" />
                  Copy All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}