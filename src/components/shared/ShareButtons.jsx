import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Twitter, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareButtons({ url, title, className = '' }) {
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Join me on SeeWhy LIVE!';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`${shareTitle} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${shareTitle} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button size="sm" variant="ghost" onClick={shareTwitter} title="Share on Twitter" className="gap-1.5 text-xs px-2">
        <Twitter className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={shareWhatsApp} title="Share on WhatsApp" className="gap-1.5 text-xs px-2">
        <MessageCircle className="w-3.5 h-3.5 text-green-400" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={copyLink} title="Copy link" className="gap-1.5 text-xs px-2">
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>
    </div>
  );
}