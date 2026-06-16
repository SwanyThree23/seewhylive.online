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
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`${label} copied!`);
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

              {/* Invite tab — native SeeWhy guest join */}
              {tab === 'invite' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider" style={T}>Guest Join Link</p>
                    <p className="text-[10px] text-white/25 leading-relaxed">
                      Share this link with anyone you want on stage. They'll enter their name and wait in the greenroom.
                    </p>
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${G}25` }}>
                      <code className="flex-1 text-[11px] font-mono text-white/70 truncate">{guestJoinUrl}</code>
                      <CopyBtn value={guestJoinUrl} label="Guest link" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={safeSrc(guestJoinUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-black uppercase transition-all"
                      style={{ background: `${G}20`, color: G, border: `1px solid ${G}40`, ...T }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Preview Page
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(guestJoinUrl);
                        toast.success('Guest link copied!');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-black uppercase transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', ...T }}
                    >
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </button>
                  </div>

                  <div className="px-3 py-2 rounded-lg text-[10px] text-white/30 leading-relaxed" style={{ background: 'rgba(212,175,55,0.04)', border: `1px solid ${G}12` }}>
                    Guests join from any browser — no app install required. You'll see them in your greenroom waitlist and can admit them to the stage.
                  </div>
                </div>
              )}

              {/* VDO.ninja tab — push/view pairs */}
              {tab === 'vdo' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/30 leading-relaxed">
                    Send the <span style={{ color: G }}>Push link</span> to your guest — they open it to share their camera/mic. Use the <span className="text-white/50">View link</span> in OBS or SeeWhy studio to receive their feed.
                  </p>
                  {vdoLinks.map(link => (
                    <div
                      key={link.name}
                      className="p-2.5 rounded-lg space-y-2"
                      style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${link.color}`, border: `1px solid rgba(255,255,255,0.07)` }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: link.color }}>{link.icon}</span>
                        <p className="text-[11px] font-bold" style={{ color: link.color, ...T }}>{link.name}</p>
                        <span className="text-[10px] text-white/30">{link.desc}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase text-white/25 font-bold" style={T}>Push (send to guest)</p>
                          <div className="flex items-center gap-1 px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${link.color}30` }}>
                            <code className="flex-1 text-[9px] font-mono text-white/50 truncate">{link.pushUrl.replace('https://vdo.ninja/', '')}</code>
                            <CopyBtn value={link.pushUrl} label={`${link.name} push`} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase text-white/25 font-bold" style={T}>View (in your studio)</p>
                          <div className="flex items-center gap-1 px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <code className="flex-1 text-[9px] font-mono text-white/30 truncate">{link.viewUrl.replace('https://vdo.ninja/', '')}</code>
                            <CopyBtn value={link.viewUrl} label={`${link.name} view`} />
                          </div>
                        </div>
                      </div>
                      <a
                        href={safeSrc(link.pushUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] transition-colors"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Open push link
                      </a>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const all = vdoLinks.map(l => `${l.name}\nPush: ${l.pushUrl}\nView: ${l.viewUrl}`).join('\n\n');
                      navigator.clipboard.writeText(all);
                      toast.success('All VDO.ninja links copied!');
                    }}
                    className="w-full py-1.5 rounded text-[10px] font-black uppercase transition-all"
                    style={{ background: 'rgba(212,175,55,0.08)', color: G, border: `1px solid ${G}25`, ...T }}
                  >
                    <Copy className="inline w-3 h-3 mr-1" />
                    Copy All Links
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
