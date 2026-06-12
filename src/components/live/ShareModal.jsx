import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  {
    name: 'Instagram',
    color: 'from-[#800020] to-[#D4854A]',
    emoji: '📸',
    action: (url, title) => `https://www.instagram.com/`,
    note: 'Copy link → paste in your Story or Bio',
  },
  {
    name: 'Facebook',
    color: 'from-blue-600 to-blue-700',
    emoji: '👥',
    action: (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
    note: 'Opens Facebook share dialog',
  },
  {
    name: 'TikTok',
    color: 'from-black to-gray-800',
    emoji: '🎵',
    action: (url) => `https://www.tiktok.com/`,
    note: 'Copy link → paste in TikTok bio or DM',
  },
  {
    name: 'Snapchat',
    color: 'from-[#C9A84C] to-[#D4AF37]',
    emoji: '👻',
    action: (url, title) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    note: 'Share via Snapchat link',
  },
  {
    name: 'Twitter/X',
    color: 'from-sky-500 to-sky-600',
    emoji: '🐦',
    action: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('🔴 I\'m LIVE on SeeWhy! Join me: ' + title)}`,
    note: 'Tweet your live link',
  },
  {
    name: 'WhatsApp',
    color: 'from-green-500 to-green-600',
    emoji: '💬',
    action: (url, title) => `https://wa.me/?text=${encodeURIComponent('🔴 Join me LIVE on SeeWhy! ' + title + ' → ' + url)}`,
    note: 'Share via WhatsApp',
  },
  {
    name: 'YouTube',
    color: 'from-red-600 to-red-700',
    emoji: '▶️',
    action: (url) => `https://www.youtube.com/`,
    note: 'Share as a community post',
  },
  {
    name: 'Telegram',
    color: 'from-sky-400 to-blue-500',
    emoji: '✈️',
    action: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('🔴 LIVE on SeeWhy: ' + title)}`,
    note: 'Share via Telegram',
  },
];

export default function ShareModal({ isOpen, onClose, url, title }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Join me LIVE on SeeWhy!';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const shareLink = platform.action(shareUrl, shareTitle);
    if (platform.name === 'Instagram' || platform.name === 'TikTok' || platform.name === 'YouTube') {
      navigator.clipboard.writeText(shareUrl);
      toast.success(`Link copied — paste it in ${platform.name}!`);
    } else {
      window.open(shareLink, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#080B18', border:'1px solid rgba(212,175,55,0.2)', borderRadius:16, padding:24, width:'100%', maxWidth:448, color:'#fff' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <span style={{ color:'#d4af37', fontWeight:700, fontSize:18 }}>🔴 Share Your Live</span>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-white/50">
            Share your live stream to outside platforms. Viewers don't need the app — they can watch from the link and discover SeeWhy!
          </p>

          {/* Copy link */}
          <div className="flex gap-2">
            <input
              value={shareUrl}
              readOnly
              style={{ width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.7)', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
            />
            <button
              onClick={handleCopy}
              style={{ flexShrink:0, padding:'8px 12px', borderRadius:8, border:'none', background: copied ? '#4A9B5E' : '#d4af37', color: copied ? '#fff' : '#000', cursor:'pointer', display:'flex', alignItems:'center' }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Platforms */}
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handleShare(platform)}
                className={`flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r ${platform.color} hover:opacity-90 transition-all text-left`}
              >
                <span className="text-lg">{platform.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">{platform.name}</p>
                  <p className="text-[11px] text-white/70 truncate">{platform.note}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-white/50 ml-auto shrink-0" />
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 pt-3">
            <p className="text-[10px] text-white/30 text-center">
              🌐 Anyone with the link can watch — even without a SeeWhy account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}