import React, { useState } from 'react';

function cryptoHex(len = 16) {
  const arr = crypto.getRandomValues(new Uint8Array(Math.ceil(len / 2)));
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Server, Copy, RefreshCw, Eye, EyeOff, Radio, Tv2, Wifi, Zap, Terminal, Globe, Lock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ZEGOStreamHealthCard from '../components/zego/ZEGOStreamHealthCard';
import ZEGOConfigPanel from '../components/zego/ZEGOConfigPanel';
import StreamHealthDashboard from '../components/streaming/StreamHealthDashboard';
import CoStreamPanel from '../components/collaboration/CoStreamPanel';
import EnhancedIngestPanel from '../components/streaming/EnhancedIngestPanel';
import GuestRTMPPanel from '../components/streaming/GuestRTMPPanel';
import RTMPFanoutPanel from '../components/streaming/RTMPFanoutPanel';
import GuestInviteGenerator from '../components/streaming/GuestInviteGenerator';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import WebhookHooks from '../components/live/WebhookHooks';
import RTMPIngestPanel from '../components/streaming/RTMPIngestPanel';
import AdvancedEncoderSettings from '../components/streaming/AdvancedEncoderSettings';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

const PLATFORMS = [
  { name: 'OBS Studio', logo: '🎬', url: 'https://obsproject.com', port: 1935, protocol: 'RTMP' },
  { name: 'Streamlabs', logo: '🎮', url: 'https://streamlabs.com', port: 1935, protocol: 'RTMP' },
  { name: 'XSplit', logo: '📺', url: 'https://xsplit.com', port: 1935, protocol: 'RTMP' },
  { name: 'vMix', logo: '🎥', url: 'https://vmix.com', port: 1935, protocol: 'RTMP' },
  { name: 'Wirecast', logo: '📡', url: 'https://telestream.net/wirecast', port: 1935, protocol: 'RTMP' },
  { name: 'Ecamm Live', logo: '🍎', url: 'https://ecamm.com', port: 1935, protocol: 'RTMP' },
];

function CopyField({ label, value, mono = true, secret = false }) {
  const [shown, setShown] = useState(!secret);
  const copy = () => { navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied!`)).catch(() => toast.error('Copy failed.')); };
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">{label}</label>
      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        <code className={`flex-1 text-sm ${mono ? 'font-mono' : ''} text-white/80 truncate`}>
          {shown ? value : '•'.repeat(Math.min(value.length, 32))}
        </code>
        {secret && (
          <button onClick={() => setShown(s => !s)} className="text-white/30 hover:text-white/60 shrink-0">
            {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button onClick={copy} className="text-[#d4af37]/60 hover:text-[#d4af37] shrink-0">
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function RTMPServer() {
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room_id');
  const [regenerating, setRegenerating] = useState(false);
  const [streamKey, setStreamKey] = useState(() => {
    const stored = localStorage.getItem(`rtmp_key_${user?.id}`);
    return stored || `sk_live_${cryptoHex(24)}`;
  });
  const [activeTab, setActiveTab] = useState('setup');

  const RTMP_SERVER = 'rtmp://ingest.seewhy.live/live';
  const SRT_SERVER = 'srt://ingest.seewhy.live:9710';
  const PLAYBACK_URL = `https://cdn.seewhy.live/hls/${streamKey}/index.m3u8`;

  const regenerateKey = () => {
    setRegenerating(true);
    setTimeout(() => {
      const newKey = `sk_live_${cryptoHex(24)}`;
      setStreamKey(newKey);
      localStorage.setItem(`rtmp_key_${user?.id}`, newKey);
      setRegenerating(false);
      toast.success('Stream key regenerated');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080B18] to-[#0d1020] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to={createPageUrl('CreatorDashboard')}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#D4854A] flex items-center justify-center">
              <Server className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-base font-bold">RTMP Media Server</h1>
              <p className="text-[11px] text-white/40">Ingest configuration &amp; stream keys</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#6DBF7E] animate-pulse" />
            <span className="text-xs text-[#6DBF7E] font-semibold">Server Online</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-0 flex gap-1">
          {['setup', 'stats', 'software'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Alert */}
            <div className="flex items-start gap-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl p-4">
              <Lock className="w-4 h-4 text-[#d4af37] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#d4af37]">Keep your stream key private</p>
                <p className="text-xs text-white/50 mt-0.5">Anyone with your stream key can broadcast to your channel. Never share it publicly.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Ingest settings */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="w-4 h-4 text-[#d4af37]" />
                  <h2 className="font-bold text-sm">RTMP Ingest</h2>
                  <span style={{ background: 'rgba(21,128,61,0.5)', color: '#6DBF7E', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>RECOMMENDED</span>
                </div>
                <CopyField label="Server URL" value={RTMP_SERVER} />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Stream Key</label>
                    <button
                      onClick={regenerateKey}
                      disabled={regenerating}
                      className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60"
                    >
                      <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                    <code className="flex-1 text-sm font-mono text-white/80 truncate">{'•'.repeat(24)}</code>
                    <button onClick={() => { navigator.clipboard.writeText(streamKey).then(() => toast.success('Stream key copied!')).catch(() => toast.error('Copy failed.')); }} className="text-[#d4af37]/60 hover:text-[#d4af37]">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25">Hidden for security — click copy to use it</p>
                </div>
              </div>

              {/* SRT / Playback */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi className="w-4 h-4 text-[#D4AF37]" />
                    <h2 className="font-bold text-sm">SRT Ingest</h2>
                    <span style={{ background: 'rgba(128,0,32,0.2)', color: '#C9A84C', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>LOW LATENCY</span>
                  </div>
                  <CopyField label="SRT URL" value={SRT_SERVER} />
                  <CopyField label="Stream ID (passphrase)" value={streamKey} secret />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Tv2 className="w-4 h-4 text-[#D4854A]" />
                    <h2 className="font-bold text-sm">HLS Playback</h2>
                  </div>
                  <CopyField label="HLS URL" value={PLAYBACK_URL} />
                </div>
              </div>
            </div>

            {/* Recommended settings */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-[#d4af37]" /> Recommended Encoder Settings</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Video Codec', value: 'H.264 (x264)' },
                  { label: 'Video Bitrate', value: '4500–6000 kbps' },
                  { label: 'Resolution', value: '1920×1080 (1080p)' },
                  { label: 'Frame Rate', value: '60 fps' },
                  { label: 'Keyframe Int.', value: '2 seconds' },
                  { label: 'Audio Codec', value: 'AAC' },
                  { label: 'Audio Bitrate', value: '160 kbps' },
                  { label: 'Audio Rate', value: '44.1 kHz' },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-lg p-3">
                    <p className="text-[10px] text-white/40 uppercase">{s.label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Status', value: 'Idle', color: 'text-[#D4AF37]', icon: '⏸' },
                { label: 'Uptime', value: '—', color: 'text-white', icon: '⏱' },
                { label: 'Bitrate', value: '—', color: 'text-white', icon: '📡' },
                { label: 'Viewers', value: '0', color: 'text-white', icon: '👁' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-white/40 uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-[#d4af37]" />
                <h2 className="font-bold text-sm">Stream Health Log</h2>
              </div>
              <div className="bg-black/60 rounded-lg p-4 font-mono text-[11px] text-white/40 min-h-32 space-y-1">
                <p className="text-[#6DBF7E]/70">[2026-05-03 00:00:00] RTMP server ready on port 1935</p>
                <p className="text-white/30">[2026-05-03 00:00:00] SRT server ready on port 9710</p>
                <p className="text-white/30">[2026-05-03 00:00:00] HLS packager initialized</p>
                <p className="text-white/20">[waiting for incoming stream...]</p>
              </div>
            </div>
          </div>
        )}

        {/* SOFTWARE TAB */}
        {activeTab === 'software' && (
          <div className="space-y-6">
            <p className="text-white/50 text-sm">Configure these streaming applications to broadcast to SeeWhy LIVE using your stream key.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLATFORMS.map(p => (
                <motion.a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#d4af37]/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{p.logo}</div>
                    <div>
                      <h3 className="font-bold text-white">{p.name}</h3>
                      <p className="text-[11px] text-white/40">{p.protocol} · Port {p.port}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-white/40">
                    <div className="flex gap-2"><span className="text-white/30 w-16 shrink-0">Server</span><code className="text-white/60">{RTMP_SERVER}</code></div>
                    <div className="flex gap-2"><span className="text-white/30 w-16 shrink-0">Key</span><code className="text-white/60">Your stream key ↑</code></div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[#d4af37]/50 group-hover:text-[#d4af37] text-[11px] font-semibold transition-colors">
                    <Globe className="w-3 h-3" /> Download {p.name} →
                  </div>
                </motion.a>
              ))}
            </div>
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ZEGOStreamHealthCard roomId={streamKey || null} />
              <ZEGOConfigPanel user={user} />
            </div>

            {/* OBS step-by-step */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-xl">🎬</span> OBS Studio Quick Setup
              </h2>
              <ol className="space-y-2">
                {[
                  'Open OBS → Settings → Stream',
                  'Set Service to "Custom..."',
                  `Set Server to: ${RTMP_SERVER}`,
                  'Paste your Stream Key (copied from Setup tab)',
                  'Click Apply & OK',
                  'Click "Start Streaming" — you\'re live on SeeWhy!',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                    <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          <StreamHealthDashboard isLive={false} />
          <CoStreamPanel roomId={roomId} />
          <RTMPFanoutPanel roomId={roomId} isHost={true} />
          <RTMPIngestPanel roomId={roomId} />
          <WebhookHooks roomId={roomId} userId={user?.id} isHost={true} />
          <EnhancedIngestPanel roomId={roomId} isHost={true} />
          <AdvancedEncoderSettings onApply={() => {}} />
          <GuestRTMPPanel participantId={null} userId={user?.id} />
          <StreamAnalyticsDashboard roomId={roomId} isHost={true} isLive={false} />
          <MilestoneAlerts userId={user?.id} roomId={roomId} />
          <SwanAIRecommendations roomId={roomId} currentLayout="broadcast" viewerCount={0} />
          <StreamGoals isHost={true} />
          <OnlineUsersGrid compact maxVisible={8} />
          <ContentRecommendations />
          <CollaborationMatcher currentUserId={user?.id} />
        </div>
      </div>
    </div>
  );
}