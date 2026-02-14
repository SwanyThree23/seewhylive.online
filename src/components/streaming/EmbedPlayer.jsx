import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, ExternalLink, Clock } from 'lucide-react';

export default function EmbedPlayer({ roomId, previewDuration = 120 }) {
  const [timeLeft, setTimeLeft] = useState(previewDuration);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLocked) {
    return (
      <div className="w-full h-full min-h-[400px] bg-[#3C2F2F] flex items-center justify-center relative overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/20 to-[#2A1F1F] backdrop-blur-md" />
        
        {/* Golden Glow Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37] rounded-full blur-[100px]" />
        </div>

        {/* Paywall Card */}
        <Card className="z-10 bg-[#2A1F1F] border-2 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.3)] max-w-md mx-4">
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800020] to-[#D4AF37] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(212,175,55,0.5)]">
              <Lock className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">Preview Ended</h2>
            <p className="text-[#F5E6D3] mb-6">
              Join this Watch Party to continue streaming and interact with the community.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-[#3C2F2F] rounded-lg">
                <span className="text-[#F5E6D3]">✨ HD Streaming</span>
                <Badge className="bg-green-600">Included</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#3C2F2F] rounded-lg">
                <span className="text-[#F5E6D3]">💬 Live Chat</span>
                <Badge className="bg-green-600">Included</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#3C2F2F] rounded-lg">
                <span className="text-[#F5E6D3]">🎤 Guest Panel</span>
                <Badge className="bg-green-600">Included</Badge>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-[#800020] to-[#D4AF37] text-white font-bold py-6 text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              Unlock for $0.99
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-gray-400 mt-4">
              One-time payment • Instant access • No subscription required
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] group">
      {/* Video Stream Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3C2F2F] to-[#2A1F1F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-[#800020] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]" />
          </div>
          <p className="text-[#F5E6D3] text-xl font-bold">Live Stream Preview</p>
        </div>
      </div>

      {/* Preview Timer Badge */}
      <Badge className="absolute top-4 left-4 bg-[#800020] text-[#D4AF37] border-2 border-[#D4AF37] text-lg px-4 py-2 animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.5)]">
        <Clock className="w-4 h-4 mr-2" />
        PREVIEW: {formatTime(timeLeft)}
      </Badge>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 text-[#D4AF37] font-bold text-sm opacity-70">
        StreamSpace Preview
      </div>

      {/* Unlock Hint */}
      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Card className="bg-black/80 border-[#D4AF37] p-3">
          <p className="text-[#F5E6D3] text-sm">
            🔓 Unlock full access after preview
          </p>
        </Card>
      </div>
    </div>
  );
}