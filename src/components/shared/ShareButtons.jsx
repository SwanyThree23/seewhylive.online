import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
      window.open(platform.getUrl(shareUrl, shareTitle), '_blank');
    }
    setOpen(false);
  };

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        title="Share"
        className="gap-1.5 text-xs px-2"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={copyLink} title="Copy link" className="gap-1.5 text-xs px-2">
        <Copy className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 w-52">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold px-1">Share to</p>
          <div className="space-y-1">
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePlatform(p)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left"
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: p.color, color: p.textColor || '#fff' }}
                >
                  {p.icon}
                </span>
                <span className="text-sm font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}