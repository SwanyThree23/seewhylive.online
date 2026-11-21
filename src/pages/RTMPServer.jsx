import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Server, Copy, RefreshCw, Eye, EyeOff, Radio, Tv2, Wifi, Zap, Terminal, Globe, Lock, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import OutboundWebhooks from '../components/live/OutboundWebhooks';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import CreatorBridge from '../components/social/CreatorBridge';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';

function cryptoHex(len) {
  var l = len === undefined ? 16 : len;
  var arr = crypto.getRandomValues(new Uint8Array(Math.ceil(l / 2)));
  return Array.from(arr, function(b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, l);
}

var PLATFORMS = [
  { name: 'OBS Studio', logo: '🎬', url: 'https://obsproject.com', port: 1935, protocol: 'RTMP' },
  { name: 'Streamlabs', logo: '🎮', url: 'https://streamlabs.com', port: 1935, protocol: 'RTMP' },
  { name: 'XSplit', logo: '📺', url: 'https://xsplit.com', port: 1935, protocol: 'RTMP' },
  { name: 'vMix', logo: '🎥', url: 'https://vmix.com', port: 1935, protocol: 'RTMP' },
  { name: 'Wirecast', logo: '📡', url: 'https://telestream.net/wirecast', port: 1935, protocol: 'RTMP' },
  { name: 'Ecamm Live', logo: '🍎', url: 'https://ecamm.com', port: 1935, protocol: 'RTMP' },
];

function CopyField(props) {
  var label = props.label;
  var value = props.value;
  var mono = props.mono !== undefined ? props.mono : true;
  var secret = props.secret !== undefined ? props.secret : false;
  var [shown, setShown] = useState(!secret);
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);


  function copy() {
    navigator.clipboard.writeText(value).then(function() {
      toast.success(label + ' copied!');
    }).catch(function() {
      toast.error('Copy failed.');
    });
  }

  return (
    <div className="space-y-1">
      <label className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">{label}</label>
      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        <code className={'flex-1 text-sm ' + (mono ? 'font-mono' : '') + ' text-white/80 truncate'}>
          {shown ? value : '•'.repeat(Math.min(value.length, 32))}
        </code>
        {secret && (
          <button onClick={function() { setShown(!shown); }} className="text-white/30 hover:text-white/60 shrink-0">
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
  var qc = useQueryClient();
  var userQuery = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var user = userQuery.data;
  var activeRoomQuery = useQuery({
    queryKey: ['rtmpserver-active-room', (user && user.id)],
    queryFn: function() {
      return base44.entities.Room.filter({ host_id: user.id, status: 'live' }).then(function(r) { return r[0] || null; });
    },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoom = activeRoomQuery.data;
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var [regenerating, setRegenerating] = useState(false);
  var [streamKey, setStreamKey] = useState('');
  var [activeTab, setActiveTab] = useState('setup');

  function getEvmuxKeyInitial() {
    try { return localStorage.getItem('swl_evmux_key') || ''; } catch (_e) { return ''; }
  }
  var [evmuxKey, setEvmuxKey] = useState(getEvmuxKeyInitial);
  var [evmuxSaved, setEvmuxSaved] = useState(false);

  useEffect(function() {
    if (!user) return;
    if (user.stream_key) {
      setStreamKey(user.stream_key);
    } else {
      var newKey = 'sk_live_' + cryptoHex(24);
      setStreamKey(newKey);
      base44.auth.updateMe({ stream_key: newKey }).catch(function() {});
    }
  }, [(user && user.id)]);

  var RTMP_SERVER = 'rtmp://ingest.seewhy.live/live';
  var SRT_SERVER = 'srt://ingest.seewhy.live:9710';
  var PLAYBACK_URL = 'https://cdn.seewhy.live/hls/' + streamKey + '/index.m3u8';

  function regenerateKey() {
    setRegenerating(true);
    var newKey = 'sk_live_' + cryptoHex(24);
    setStreamKey(newKey);
    base44.auth.updateMe({ stream_key: newKey }).then(function() {
      toast.success('Stream key regenerated');
      setRegenerating(false);
    }).catch(function() {
      toast.error('Failed to save new key');
      setRegenerating(false);
    });
  }

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
          {['setup', 'evmux', 'stats', 'software'].map(function(tab) {
            return (
              <button
                key={tab}
                onClick={function() { setActiveTab(tab); }}
                className={'px-4 py-2 text-xs font-semibold capitalize border-b-2 transition-all ' + (
                  activeTab === tab
                    ? 'border-[#d4af37] text-[#d4af37]'
                    : 'border-transparent text-white/40 hover:text-white/60'
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl p-4">
              <Lock className="w-4 h-4 text-[#d4af37] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#d4af37]">Keep your stream key private</p>
                <p className="text-xs text-white/50 mt-0.5">Anyone with your stream key can broadcast to your channel. Never share it publicly.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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
                      <RefreshCw className={'w-3 h-3 ' + (regenerating ? 'animate-spin' : '')} />
                      Regenerate
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                    <code className="flex-1 text-sm font-mono text-white/80 truncate">{'•'.repeat(24)}</code>
                    <button onClick={function() { navigator.clipboard.writeText(streamKey).then(function() { toast.success('Stream key copied!'); }).catch(function() { toast.error('Copy failed.'); }); }} className="text-[#d4af37]/60 hover:text-[#d4af37]">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25">Hidden for security — click copy to use it</p>
                </div>
              </div>

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
                ].map(function(s) {
                  return (
                    <div key={s.label} className="bg-black/30 rounded-lg p-3">
                      <p className="text-[10px] text-white/40 uppercase">{s.label}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{s.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* EVMUX TAB */}
        {activeTab === 'evmux' && (
          <div className="space-y-6">

            {/* Receive EvMux or Chatter into SeeWhy */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-4 h-4 text-[#C9A84C]" />
                <h2 className="font-bold text-sm">Receive EvMux or Chatter into SeeWhy</h2>
                <span style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>INGEST</span>
              </div>
              <p className="text-xs text-white/50">
                Use this when EvMux or Chatter is your production switcher and you want to push your final mixed output into SeeWhy for live distribution and monetization.
                Paste SeeWhy's ingest URL and stream key into EvMux's <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Destinations → Custom RTMP</strong> or Chatter's <strong style={{ color: 'rgba(255,255,255,0.7)' }}>RTMP Output</strong> settings.
              </p>
              <CopyField label="SeeWhy RTMP Ingest URL" value={RTMP_SERVER} />
              <CopyField label="SeeWhy Stream Key" value={streamKey} secret />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">EvMux Setup</p>
                  <ol className="space-y-1">
                    {[
                      'Open your EvMux Channel → Destinations → + Add Destination',
                      'Choose "Custom RTMP"',
                      'Paste the SeeWhy RTMP Ingest URL as the RTMP URL',
                      'Paste your SeeWhy Stream Key as the Stream Key',
                      'Save — EvMux will push your output directly into SeeWhy',
                    ].map(function(step, i) {
                      return (
                        <li key={i} className="flex items-start gap-3 text-xs text-white/70">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>{i + 1}</span>
                          {step}
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <div className="bg-black/30 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Chatter Setup</p>
                  <ol className="space-y-1">
                    {[
                      'In Chatter, go to Settings → RTMP Output',
                      'Paste the SeeWhy RTMP Ingest URL as the Server',
                      'Paste your SeeWhy Stream Key as the Key',
                      'Enable Output and start your Chatter session',
                    ].map(function(step, i) {
                      return (
                        <li key={i} className="flex items-start gap-3 text-xs text-white/70">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>{i + 1}</span>
                          {step}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>

            {/* EVMux push intro */}
            <div className="flex items-start gap-3 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
              <Layers className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-300">EVMux Adaptive Streaming</p>
                <p className="text-xs text-white/50 mt-0.5">EVMux transcodes your RTMP ingest into multiple quality tiers (1080p / 720p / 480p / 360p) and distributes via CDN. Push once — viewers get automatic ABR.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <h2 className="font-bold text-sm">EVMux Push Ingest</h2>
                  <span style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: 11, fontWeight: 900, padding: '2px 6px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif' }}>PRIMARY</span>
                </div>
                <CopyField label="RTMP Server" value="rtmp://live.evmux.com/live" />
                <div className="space-y-1">
                  <label className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Push Stream Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={evmuxKey}
                      onChange={function(e) { setEvmuxKey(e.target.value); }}
                      placeholder="Paste your EVMux push key here…"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white/80 outline-none"
                    />
                    <button
                      onClick={function() {
                        try { localStorage.setItem('swl_evmux_key', evmuxKey); setEvmuxSaved(true); setTimeout(function() { setEvmuxSaved(false); }, 2000); } catch (_e) {}
                        toast.success('EVMux key saved.');
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}
                    >
                      {evmuxSaved ? '✓' : 'Save'}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25">Find this in your EVMux dashboard → Channels → Push Key</p>
                </div>
                {evmuxKey && <CopyField label="Full Ingest String (OBS)" value={'rtmp://live.evmux.com/live/' + evmuxKey} secret />}
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Tv2 className="w-4 h-4 text-blue-400" />
                    <h2 className="font-bold text-sm">Playback / Pull URLs</h2>
                  </div>
                  {[
                    { label: 'HLS (ABR)',  value: evmuxKey ? 'https://cdn.evmux.com/hls/' + evmuxKey + '/index.m3u8' : 'Add push key above to generate' },
                    { label: 'DASH',       value: evmuxKey ? 'https://cdn.evmux.com/dash/' + evmuxKey + '/manifest.mpd' : '—' },
                    { label: 'RTMP Pull',  value: evmuxKey ? 'rtmp://pull.evmux.com/live/' + evmuxKey : '—' },
                  ].map(function(u) {
                    return <CopyField key={u.label} label={u.label} value={u.value} />;
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Adaptive Bitrate Ladder
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/30 border-b border-white/10">
                      {['Quality', 'Resolution', 'Video Bitrate', 'Audio', 'Frame Rate'].map(function(h) {
                        return <th key={h} className="text-left py-2 pr-4 font-semibold uppercase tracking-wider">{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody className="text-white/70">
                    {[
                      { q: '1080p', res: '1920×1080', vbr: '5500 kbps', audio: '192 kbps', fps: '60' },
                      { q: '720p',  res: '1280×720',  vbr: '3000 kbps', audio: '128 kbps', fps: '60' },
                      { q: '480p',  res: '854×480',   vbr: '1200 kbps', audio: '128 kbps', fps: '30' },
                      { q: '360p',  res: '640×360',   vbr: '600 kbps',  audio: '96 kbps',  fps: '30' },
                    ].map(function(r) {
                      return (
                        <tr key={r.q} className="border-b border-white/5">
                          <td className="py-2 pr-4 font-bold" style={{ color: r.q === '1080p' ? '#a78bfa' : undefined }}>{r.q}</td>
                          <td className="py-2 pr-4 font-mono">{r.res}</td>
                          <td className="py-2 pr-4">{r.vbr}</td>
                          <td className="py-2 pr-4">{r.audio}</td>
                          <td className="py-2 pr-4">{r.fps} fps</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-white/30 mt-3">EVMux auto-transcodes from your 1080p source. Push at 6000+ kbps for best results. Ingest must be H.264 + AAC.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-xl">🎬</span> OBS → EVMux Quick Setup
              </h2>
              <ol className="space-y-2">
                {[
                  'Create a Channel in your EVMux dashboard and copy the Push Key',
                  'Open OBS → Settings → Stream',
                  'Set Service to "Custom..."',
                  'Set Server to: rtmp://live.evmux.com/live',
                  'Paste your EVMux Push Key as the Stream Key',
                  'Set encoder to x264, bitrate ≥ 5500 kbps, keyframe 2s',
                  'Click Apply & OK, then Start Streaming',
                  'Embed the HLS playback URL on your SeeWhy LIVE page',
                ].map(function(step, i) {
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>{i + 1}</span>
                      {step}
                    </li>
                  );
                })}
              </ol>
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
              ].map(function(s) {
                return (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className={'text-xl font-black ' + s.color}>{s.value}</p>
                    <p className="text-[11px] text-white/40 uppercase mt-1">{s.label}</p>
                  </div>
                );
              })}
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
              {PLATFORMS.map(function(p) {
                return (
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
                );
              })}
            </div>
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ZEGOStreamHealthCard roomId={activeRoomId} />
              <ZEGOConfigPanel user={user} />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-xl">🎬</span> OBS Studio Quick Setup
              </h2>
              <ol className="space-y-2">
                {[
                  'Open OBS → Settings → Stream',
                  'Set Service to "Custom..."',
                  'Set Server to: ' + RTMP_SERVER,
                  'Paste your Stream Key (copied from Setup tab)',
                  'Click Apply & OK',
                  "Click \"Start Streaming\" — you're live on SeeWhy!",
                ].map(function(step, i) {
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                      <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          <StreamHealthDashboard isLive={!!activeRoomId} />
          <CoStreamPanel roomId={activeRoomId} />
          <OutboundWebhooks isHost={true} />
          <EnhancedIngestPanel roomId={activeRoomId} isHost={true} />
          <GuestRTMPPanel participantId={null} userId={(user && user.id)} />
          {(user && user.id) && <RTMPFanoutPanel userId={user.id} isStreaming={!!activeRoom} streamId={activeRoomId} />}
          {(user && user.id) && <GuestInviteGenerator userId={user.id} roomId={activeRoomId} />}
          <StreamAnalyticsDashboard roomId={activeRoomId} isHost={true} isLive={!!activeRoomId} />
          <OnlineUsersGrid compact maxVisible={10} />
          <ContentRecommendations />
        </div>
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="rtmp" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.peak_viewers) || 0} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  );
}
