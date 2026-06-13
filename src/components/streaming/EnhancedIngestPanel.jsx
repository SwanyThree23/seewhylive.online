import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Copy, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const inputStyle = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
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
    <div className="bg-[rgba(8,11,24,0.95)] border border-[rgba(212,175,55,0.15)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 bg-[rgba(8,11,24,0.7)]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-white">Stream Ingest Setup</h3>
          <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(13,16,34,0.5)', color:'#C9A84C' }}>BETA</span>
        </div>
      </div>

      <div>
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'transparent' }}>
          {[
            { id:'rtmp', label: <><Radio style={{width:12,height:12,marginRight:6,display:'inline'}}/>RTMP Ingest</> },
            { id:'whip', label: 'WHIP Ingest' },
            { id:'guests', label: 'Guest Destinations' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ padding:'10px 16px', fontSize:12, fontWeight:600, background:'transparent', border:'none', borderBottom: activeTab===t.id ? '2px solid #D4AF37' : '2px solid transparent', color: activeTab===t.id ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', fontFamily:'Barlow Condensed, sans-serif' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:16 }} className="space-y-4">
          {/* RTMP Tab */}
          {activeTab === 'rtmp' && <div className="space-y-3">
            <div className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#800020] to-[#C0392B] flex items-center justify-center text-xs font-bold text-white">⚡</div>
                <h4 className="text-sm font-bold text-white">RTMP Server</h4>
              </div>
              <p className="text-[10px] text-white/50 mb-3">Send any RTMP stream directly into evmux. Perfect for OBS, Streamlabs, etc.</p>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Server URL</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      readOnly
                      value={rtmpUrl}
                      style={{ ...inputStyle, fontFamily:'monospace', fontSize:12, height:32, flex:1 }}
                    />
                    <button
                      onClick={() => copyToClipboard(rtmpUrl, 'RTMP URL')}
                      className="w-8 h-8 rounded border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/10"
                    >
                      {copied === 'RTMP URL' ? <CheckCircle2 className="w-4 h-4 text-[#6DBF7E]" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Stream Key</label>
                  <div className="flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        readOnly
                        value={rtmpKey}
                        style={{ ...inputStyle, fontFamily:'monospace', fontSize:12, height:32 }}
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
                      {copied === 'Stream Key' ? <CheckCircle2 className="w-4 h-4 text-[#6DBF7E]" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div className="bg-[#0F1428]/20 border border-[#6DBF7E]/35/30 rounded p-2 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6DBF7E] shrink-0 mt-0.5" />
                  <div className="text-[10px] text-[#6DBF7E]/80">
                    <p className="font-semibold">Ready for OBS / Streamlabs</p>
                    <p className="text-white/60">Copy URL + Key into your streaming software</p>
                  </div>
                </div>
              </div>
            </div>
          </div>}

          {/* WHIP Tab */}
          {activeTab === 'whip' && <div className="space-y-3">
            <div className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#800020] to-[#D4AF37] flex items-center justify-center text-xs font-bold text-white">W</div>
                <h4 className="text-sm font-bold text-white">WHIP Ingest</h4>
                <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(128,0,32,0.2)', color:'#C9A84C' }}>Modern</span>
              </div>
              <p className="text-[10px] text-white/50 mb-3">Ultra-low-latency WHIP stream ingest. Perfect for browser-based producers and mobile. Supports full customization of size, position, and layering.</p>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/60 block mb-1">WHIP Endpoint</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      readOnly
                      value={whipUrl}
                      style={{ ...inputStyle, fontFamily:'monospace', fontSize:12, height:32, flex:1 }}
                    />
                    <button
                      onClick={() => copyToClipboard(whipUrl, 'WHIP URL')}
                      className="w-8 h-8 rounded border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/10"
                    >
                      {copied === 'WHIP URL' ? <CheckCircle2 className="w-4 h-4 text-[#6DBF7E]" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/60 block mb-1">Authorization Header</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      readOnly
                      value={whipAuth}
                      style={{ ...inputStyle, fontFamily:'monospace', fontSize:12, height:32, flex:1 }}
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
                      {copied === 'WHIP Auth' ? <CheckCircle2 className="w-4 h-4 text-[#6DBF7E]" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                <div className="bg-[#0F1428] border border-[#D4AF37]/25 rounded p-2 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-[10px] text-[#D4AF37]">
                    <p className="font-semibold">Low-Latency WebRTC</p>
                    <p className="text-white/60">Use with ffmpeg: ffmpeg -i input -c:v libx264 -c:a aac -f whip {whipUrl}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>}

          {/* Guest Destinations Tab */}
          {activeTab === 'guests' && <div className="space-y-3">
            <div className="space-y-3">
              {/* Guest Stream Monitor */}
              <GuestStreamMonitor guestName="Alex (YouTube)" isStreaming={mockGuestStreaming} />
              <GuestStreamMonitor guestName="Jordan (Twitch)" isStreaming={false} />

              <div className="bg-[#0F1428]/50 border border-[#d4af37]/15 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-[#d4af37]" />
                  <h4 className="text-sm font-bold text-white">Guest Destinations</h4>
                  <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(128,0,32,0.5)', color:'#C9A84C' }}>BETA</span>
                </div>

                <div className="space-y-3">
                  <BitratePresets selected={bitrate} onChange={setBitrate} />

                  <div className="bg-white/5 border border-white/10 rounded p-2">
                    <p className="text-[10px] font-semibold text-white mb-1">Per-Guest Controls:</p>
                    <ul className="text-[11px] text-white/60 space-y-0.5">
                      <li>✓ Real-time bitrate/latency monitoring</li>
                      <li>✓ Adaptive bitrate with fallback</li>
                      <li>✓ Multi-destination support (5+ platforms)</li>
                      <li>✓ Permission controls per guest</li>
                    </ul>
                  </div>

                  <button
                    style={{ width:'100%', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, padding:'8px 0', cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif', fontSize:14 }}
                  >
                    Manage Guest Streaming
                  </button>
                </div>
              </div>
            </div>
          </div>}
        </div>
      </div>

      <div className="px-4 py-3 bg-[rgba(8,11,24,0.5)] border-t border-white/5 text-[10px] text-white/40">
        💡 Tip: Save your RTMP key securely. Never share it publicly. Stream keys are AES-256 encrypted at rest.
      </div>
    </div>
  );
}