import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Copy, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import BitratePresets from './BitratePresets';
import GuestStreamMonitor from './GuestStreamMonitor';

const PLATFORM_PRESETS = [
  { id: 'youtube',   label: 'YouTube',   color: '#ff0000', server: 'rtmp://a.rtmp.youtube.com/live2' },
  { id: 'twitch',    label: 'Twitch',    color: '#9146ff', server: 'rtmp://live.twitch.tv/live' },
  { id: 'facebook',  label: 'Facebook',  color: '#1877f2', server: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { id: 'tiktok',    label: 'TikTok',    color: '#010101', server: 'rtmp://push.tiktokv.com/rtmp' },
  { id: 'instagram', label: 'Instagram', color: '#e1306c', server: 'rtmps://live-upload.instagram.com:443/rtmp' },
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2', server: 'rtmps://stream.linkedin.com:443/media' },
  { id: 'kick',      label: 'Kick',      color: '#53fc18', server: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app' },
  { id: 'dlive',     label: 'DLive',     color: '#ffd700', server: 'rtmp://stream.dlive.tv/live' },
  { id: 'custom',    label: 'Custom',    color: '#8B6F47', server: '' },
];

export default function EnhancedIngestPanel({ roomId, isHost }) {
  const [activeTab, setActiveTab] = useState('rtmp');
  const [rtmpUrl, setRtmpUrl] = useState('rtmp://ingest.seewhy.live/live');
  const [rtmpKey, setRtmpKey] = useState('sk_abc123xyz789');
  const [whipUrl, setWhipUrl] = useState('https://ingest.seewhy.live/whip');
  const [whipAuth, setWhipAuth] = useState('Bearer token_abc123xyz789');
  const [bitrate, setBitrate] = useState(3000);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(null);
  const [mockGuestStreaming] = useState(true);

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
            <div className="space-y-3">
              {/* Guest Stream Monitor */}
              <GuestStreamMonitor guestName="Alex (YouTube)" isStreaming={mockGuestStreaming} />
              <GuestStreamMonitor guestName="Jordan (Twitch)" isStreaming={false} />

              <div className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-[#d4af37]" />
                  <h4 className="text-sm font-bold text-white">Guest Destinations</h4>
                  <Badge className="text-[8px] bg-purple-900/50 text-purple-300">BETA</Badge>
                </div>
                
                <div className="space-y-3">
                  <BitratePresets selected={bitrate} onChange={setBitrate} />

                  <div className="bg-white/5 border border-white/10 rounded p-2">
                    <p className="text-[10px] font-semibold text-white mb-1">Per-Guest Controls:</p>
                    <ul className="text-[9px] text-white/60 space-y-0.5">
                      <li>✓ Real-time bitrate/latency monitoring</li>
                      <li>✓ Adaptive bitrate with fallback</li>
                      <li>✓ Multi-destination support (5+ platforms)</li>
                      <li>✓ Permission controls per guest</li>
                    </ul>
                  </div>

                  <Button className="w-full bg-[#d4af37] text-black hover:bg-[#e6c158] font-bold text-sm">
                    Manage Guest Streaming
                  </Button>
                </div>
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