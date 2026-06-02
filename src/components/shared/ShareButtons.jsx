import React, { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  {
    key: 'twitter',
    label: 'X / Twitter',
    color: '#000000',
    icon: '𝕏',
    getUrl: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: 'f',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: '💬',
    getUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    key: 'snapchat',
    label: 'Snapchat',
    color: '#FFFC00',
    textColor: '#000',
    icon: '👻',
    getUrl: (url) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: '#010101',
    icon: '♪',
    // TikTok doesn't have a web share URL — open app store or profile
    getUrl: (url, title) => `https://www.tiktok.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    icon: '📸',
    // Instagram has no direct web share URL; open Stories share intent via clipboard
    getUrl: null,
    action: (url) => {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! Paste it in your Instagram story or bio.');
    },
  },
];

const btnStyle = {
  display:'inline-flex', alignItems:'center', gap:6,
  padding:'5px 8px', background:'transparent', border:'none',
  cursor:'pointer', color:'inherit', borderRadius:8, fontSize:12, fontWeight:600,
  transition:'background 0.15s',
};

export default function ShareButtons({ url, title, className = '' }) {
  const [open, setOpen] = useState(false);
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Join me on SeeWhy LIVE!';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  const handlePlatform = (platform) => {
    if (platform.action) {
      platform.action(shareUrl, shareTitle);
    } else if (platform.getUrl) {
      window.open(platform.getUrl(shareUrl, shareTitle), '_blank', 'noopener,noreferrer');
    }
    setOpen(false);
  };

  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', gap:6 }} className={className}>
      <button style={btnStyle} onClick={() => setOpen(o => !o)} title="Share">
        <Share2 style={{ width:14, height:14 }} />
        <span>Share</span>
      </button>
      <button style={btnStyle} onClick={copyLink} title="Copy link">
        <Copy style={{ width:14, height:14 }} />
        <span>Copy Link</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'100%', right:0, marginTop:4, zIndex:50,
          background:'rgba(13,6,24,0.98)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.6)', padding:12, width:208,
        }}>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700, paddingLeft:4 }}>Share to</p>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePlatform(p)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'6px 8px', borderRadius:8, background:'transparent', border:'none',
                  cursor:'pointer', color:'#fff', textAlign:'left', transition:'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span
                  style={{
                    width:24, height:24, borderRadius:6, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0,
                    background: p.color, color: p.textColor || '#fff',
                  }}
                >
                  {p.icon}
                </span>
                <span style={{ fontSize:14, fontWeight:500 }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }} onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
