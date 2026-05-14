import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Copy, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedIngestPanel({ roomId, isHost }) {
  const [activeTab, setActiveTab] = useState('rtmp');
  const [rtmpUrl, setRtmpUrl] = useState('rtmp://ingest.seewhy.live/live');
  const [rtmpKey, setRtmpKey] = useState('sk_abc123xyz789');
  const [whipUrl, setWhipUrl] = useState('https://ingest.seewhy.live/whip');
  const [whipAuth, setWhipAuth] = useState('Bearer token_abc123xyz789');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isHost) return null;

  return (
    <div className="bg-[rgba(13,6,24,0.95)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 bg-[rgba(7,7,15,0.7)]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-white">Stream Ingest Setup</h3>
          <Badge className="text-[9px] bg-cyan-900/50 text-cyan-300">BETA</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-white/5 rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger
            value="rtmp"
            className="px-4 py-2.5 text-xs font-semibold rounded-none border-b-2 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37]"
          >
            <Radio className="w-3 h-3 mr-1.5" />
            RTMP Ingest
          </TabsTrigger>
          <TabsTrigger
            value="whip"
            className="px-4 py-2.5 text-xs font-semibold rounded-none border-b-2 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37]"
          >
            WHIP Ingest
          </TabsTrigger>
          <TabsTrigger
            value="guests"
            className="px-4 py-2.5 text-xs font-semibold rounded-none border-b-2 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37]"
          >
            Guest Destinations
          </TabsTrigger>
        </TabsList>

        <div className="p-4 space-y-4">
          {/* RTMP Tab */}
          <TabsContent value="rtmp" className="space-y-3">
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">⚡</div>
                <h4 className="text-sm font-bold text-white">RTMP Server</h4>
              </div>
              <p className="text-[10px] text-white/50 mb-3">Send any RTMP stream directly into evmux. Perfect for OBS, Streamlabs, etc.</p>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Server URL</label>
                  <div className="flex gap-1.5 items-center">
                    <Input
                      readOnly
                      value={rtmpUrl}
                      className="bg-white/5 border-white/10 text-white text-xs font-mono h-8 flex-1"
                    />
                    <button
                      onClick={() => copyToClipboard(rtmpUrl, 'RTMP URL')}
                      className="w-8 h-8 rounded border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/10"
                    >
                      {copied === 'RTMP URL' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Stream Key</label>
                  <div className="flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? 'text' : 'password'}
                        readOnly
                        value={rtmpKey}
                        className="bg-white/5 border-white/10 text-white text-xs font-mono h-8"
                      />
                    </div>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-white/30 hover:text-white"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(rtmpKey, 'Stream Key')}
                      className="w-8 h-8 rounded border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/10"
                    >
                      {copied === 'Stream Key' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-600/30 rounded p-2 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-green-300">
                    <p className="font-semibold">Ready for OBS / Streamlabs</p>
                    <p className="text-white/60">Copy URL + Key into your streaming software</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* WHIP Tab */}
          <TabsContent value="whip" className="space-y-3">
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center text-xs font-bold text-white">W</div>
                <h4 className="text-sm font-bold text-white">WHIP Ingest</h4>
                <Badge className="text-[8px] bg-blue-900/50 text-blue-300">Modern</Badge>
              </div>
              <p className="text-[10px] text-white/50 mb-3">Ultra-low-latency WHIP stream ingest. Perfect for browser-based producers and mobile. Supports full customization of size, position, and layering.</p>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">WHIP Endpoint</label>
                  <div className="flex gap-1.5 items-center">
                    <Input
                      readOnly
                      value={whipUrl}
                      className="bg-white/5 border-white/10 text-white text-xs font-mono h-8 flex-1"
                    />
                    <button
                      onClick={() => copyToClipboard(whipUrl, 'WHIP URL')}
                      className="w-8 h-8 rounded border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/10"
                    >
                      {copied === 'WHIP URL' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Authorization Header</label>
                  <div className="flex gap-1.5 items-center">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      readOnly
                      value={whipAuth}
                      className="bg-white/5 border-white/10 text-white text-xs font-mono h-8 flex-1"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-white/30 hover:text-white"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(whipAuth, 'WHIP Auth')}
                      className="w-8 h-8 rounded border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/10"
                    >
                      {copied === 'WHIP Auth' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-600/30 rounded p-2 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-blue-300">
                    <p className="font-semibold">Low-Latency WebRTC</p>
                    <p className="text-white/60">Use with ffmpeg: ffmpeg -i input -c:v libx264 -c:a aac -f whip {whipUrl}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Guest Destinations Tab */}
          <TabsContent value="guests" className="space-y-3">
            <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-[#d4af37]" />
                <h4 className="text-sm font-bold text-white">Guest Streaming Destinations</h4>
                <Badge className="text-[8px] bg-purple-900/50 text-purple-300">BETA</Badge>
              </div>
              <p className="text-[10px] text-white/50 mb-3">Allow guests and speakers to stream their content from the studio to their own streaming destinations. Each guest gets individual RTMP/WHIP ingest points.</p>

              <div className="space-y-2">
                <div className="bg-white/5 border border-white/10 rounded p-2">
                  <p className="text-[10px] font-semibold text-white mb-1">Available Methods:</p>
                  <ul className="text-[9px] text-white/60 space-y-0.5">
                    <li>✓ Direct RTMP: Guest sends RTMP stream to their own YouTube, Twitch, etc.</li>
                    <li>✓ WHIP Protocol: Ultra-low latency WebRTC ingest for each guest feed</li>
                    <li>✓ Per-Guest Permissions: Control who can access streaming features</li>
                    <li>✓ Multi-Destination Support: Each guest configures up to 5 simulcast destinations</li>
                  </ul>
                </div>

                <Button className="w-full bg-[#d4af37] text-black hover:bg-[#e6c158] font-bold text-sm">
                  Configure Guest Destinations
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="px-4 py-3 bg-[rgba(7,7,15,0.5)] border-t border-white/5 text-[10px] text-white/40">
        💡 Tip: Save your RTMP key securely. Never share it publicly. Stream keys are AES-256 encrypted at rest.
      </div>
    </div>
  );
}