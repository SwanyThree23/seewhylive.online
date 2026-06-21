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
      color: 'bg-[rgba(212,175,55,0.08)]',
      textColor: '#D4AF37',
      icon: '🎙️',
      description: 'Audio stream only',
    },
    {
      name: 'Screen Share',
      url: `https://vdo.ninja/?view=Swan23&room=SCREEN-${roomId?.slice(0, 8) || 'DEMO'}&screen`,
      color: 'bg-[rgba(201,168,76,0.08)]',
      textColor: '#C9A84C',
      icon: '🖥️',
      description: 'Screen sharing mode',
    },
    {
      name: 'Co-Host',
      url: `https://vdo.ninja/?view=Swan23&room=COHOST-${roomId?.slice(0, 8) || 'DEMO'}&broadcast`,
      color: 'bg-[rgba(255,136,0,0.08)]',
      textColor: '#D4854A',
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
                        <p className="text-[11px] text-white/30 break-all font-mono line-clamp-1">
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
                    background: 'rgba(212,175,55,0.12)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.25)',
                  }}
                >
                  <Copy className="inline w-3 h-3 mr-1" />
                  Copy All
                </button>
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
                        navigator.clipboard.writeText(guestJoinUrl).then(() => toast.success('Guest link copied!')).catch(() => toast.error('Copy failed.'));
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
                      navigator.clipboard.writeText(all).then(() => toast.success('All VDO.ninja links copied!')).catch(() => toast.error('Copy failed.'));
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