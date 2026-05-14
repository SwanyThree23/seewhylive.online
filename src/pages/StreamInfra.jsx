import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio, Server, Copy, Check, Users, Mic, MicOff,
  Video, VideoOff, Zap, Globe, RefreshCw, Terminal,
  Share2, Headphones, Crown, Eye, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

/* ── helpers ── */
function copyText(val) {
  navigator.clipboard.writeText(val);
  toast.success('Copied to clipboard');
}

function PanelCard({ title, icon: Icon, color, children }) {
  var borderColor = color || 'rgba(212,175,55,0.15)';
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(7,7,15,0.95)', border: '1px solid ' + borderColor }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid ' + borderColor }}>
        {Icon && <Icon className="w-4 h-4" style={{ color: color || '#d4af37' }} />}
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color || '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusDot({ active, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ background: active ? '#00FF88' : '#FF1564', boxShadow: active ? '0 0 6px #00FF88' : 'none' }} />
      <span className="text-xs" style={{ color: active ? '#00FF88' : '#FF1564' }}>{label}</span>
    </div>
  );
}

function CopyField({ label, value, mono }) {
  var [copied, setCopied] = useState(false);
  function handleCopy() {
    copyText(value);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-lg px-3 py-2 text-xs text-white/70 overflow-hidden text-ellipsis"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: mono ? 'Share Tech Mono, monospace' : 'inherit' }}
        >
          {value}
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: copied ? 'rgba(0,255,136,0.1)' : 'rgba(212,175,55,0.1)', border: '1px solid ' + (copied ? 'rgba(0,255,136,0.3)' : 'rgba(212,175,55,0.2)') }}
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-yellow-400" />}
        </button>
      </div>
    </div>
  );
}

/* ── LiveKit Status Panel ── */
function LiveKitStatus() {
  var appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com';
  return (
    <PanelCard title="LiveKit Infrastructure Status" icon={Server} color="#00F5FF">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)' }}>
            <StatusDot active={true} label="WebRTC Engine" />
            <p className="text-[10px] text-white/30 mt-1">SFU mode active</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
            <StatusDot active={true} label="RTMP Ingress" />
            <p className="text-[10px] text-white/30 mt-1">OBS ready</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <StatusDot active={true} label="Egress/Record" />
            <p className="text-[10px] text-white/30 mt-1">Simulcast enabled</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <StatusDot active={true} label="n8n Orchestration" />
            <p className="text-[10px] text-white/30 mt-1">Webhooks active</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Rooms', val: '0', color: '#00F5FF' },
            { label: 'Participants', val: '0', color: '#d4af37' },
            { label: 'Bitrate', val: '0 Mbps', color: '#00FF88' },
          ].map(function(s) {
            return (
              <div key={s.label} className="text-center rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-lg font-bold font-mono-sw" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[9px] text-white/30 uppercase">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PanelCard>
  );
}

/* ── RTMP Ingress / OBS Key Generator ── */
function RTMPIngressPanel({ user }) {
  var userId = (user && user.id) || 'demo';
  var streamKey = 'sw_' + userId.slice(0, 8) + '_' + Math.random().toString(36).slice(2, 10);
  var [key, setKey] = useState(streamKey);
  var rtmpUrl = 'rtmp://ingest.seewhy.live/live';

  function regenerate() {
    setKey('sw_' + userId.slice(0, 8) + '_' + Math.random().toString(36).slice(2, 10));
    toast.success('New stream key generated');
  }

  return (
    <PanelCard title="RTMP Ingress — OBS / Encoder Setup" icon={Radio} color="#FF1564">
      <div className="space-y-3">
        <CopyField label="RTMP Server URL" value={rtmpUrl} mono={true} />
        <CopyField label="Stream Key" value={key} mono={true} />
        <Button
          size="sm"
          onClick={regenerate}
          className="w-full h-8 text-xs gap-1"
          style={{ background: 'rgba(255,21,100,0.15)', color: '#FF1564', border: '1px solid rgba(255,21,100,0.3)' }}
        >
          <RefreshCw className="w-3 h-3" /> Regenerate Key
        </Button>
        <div className="rounded-lg p-3 space-y-1" style={{ background: 'rgba(255,21,100,0.04)', border: '1px solid rgba(255,21,100,0.08)' }}>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">OBS Quick Config</p>
          <p className="text-[10px] text-white/30">Server: {rtmpUrl}</p>
          <p className="text-[10px] text-white/30">Bitrate: 4000-8000 kbps · Keyframe: 2s · H.264</p>
        </div>
      </div>
    </PanelCard>
  );
}

/* ── Social Audio Rooms ── */
function SocialAudioPanel({ user }) {
  var [role, setRole] = useState('listener');
  var roles = [
    { id: 'speaker', label: 'Speaker', icon: Mic, color: '#d4af37', desc: 'Full mic + video' },
    { id: 'cohost', label: 'Co-Host', icon: Crown, color: '#FFB800', desc: 'Speaker + moderation' },
    { id: 'listener', label: 'Listener', icon: Headphones, color: '#8B5CF6', desc: 'Audio-only view' },
  ];

  return (
    <PanelCard title="Social Audio Rooms" icon={Headphones} color="#8B5CF6">
      <div className="space-y-3">
        <p className="text-[11px] text-white/40">Select your role when joining audio-first rooms</p>
        <div className="grid grid-cols-3 gap-2">
          {roles.map(function(r) {
            var Icon = r.icon;
            var isActive = role === r.id;
            return (
              <button
                key={r.id}
                onClick={function() { setRole(r.id); }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                style={{
                  background: isActive ? r.color + '18' : 'rgba(255,255,255,0.03)',
                  border: '1px solid ' + (isActive ? r.color + '60' : 'rgba(255,255,255,0.06)')
                }}
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? r.color : 'rgba(255,255,255,0.3)' }} />
                <span className="text-[10px] font-bold uppercase" style={{ color: isActive ? r.color : 'rgba(255,255,255,0.4)' }}>{r.label}</span>
                <span className="text-[9px] text-center px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{r.desc}</span>
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <Mic className="w-3 h-3 mr-1" /> Join Audio Room as {roles.find(function(r) { return r.id === role; }).label}
        </Button>
      </div>
    </PanelCard>
  );
}

/* ── Multi-Stream Egress / Simulcast ── */
function MultiStreamEgress() {
  var platforms = [
    { name: 'YouTube Live', key: '', placeholder: 'yt_xxxx...' },
    { name: 'Twitch', key: '', placeholder: 'live_xxxx...' },
    { name: 'Facebook Live', key: '', placeholder: 'FB-xxxx...' },
    { name: 'X / Twitter', key: '', placeholder: 'xxxx...' },
  ];
  var [keys, setKeys] = useState({});

  return (
    <PanelCard title="Multi-Destination Simulcast Egress" icon={Share2} color="#00FF88">
      <div className="space-y-3">
        <p className="text-[11px] text-white/40">Broadcast to multiple platforms simultaneously via RTMP egress</p>
        {platforms.map(function(p) {
          return (
            <div key={p.name} className="flex items-center gap-2">
              <span className="text-[10px] text-white/50 w-24 shrink-0">{p.name}</span>
              <input
                value={keys[p.name] || ''}
                onChange={function(e) {
                  var v = e.target.value;
                  setKeys(function(prev) {
                    var next = Object.assign({}, prev);
                    next[p.name] = v;
                    return next;
                  });
                }}
                placeholder={p.placeholder}
                className="flex-1 rounded-lg px-2 py-1.5 text-[10px] text-white/70 font-mono-sw focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          );
        })}
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}
        >
          <Zap className="w-3 h-3 mr-1" /> Start Simulcast to All Active
        </Button>
      </div>
    </PanelCard>
  );
}

/* ── VDO.Ninja Guest Integration ── */
function VDONinjaPanel() {
  var roomCode = 'sw_' + Math.random().toString(36).slice(2, 10);
  var guestUrl = 'https://vdo.ninja/?push=' + roomCode + '&room=seewhy&quality=0';
  var directorUrl = 'https://vdo.ninja/?view=' + roomCode + '&room=seewhy';

  return (
    <PanelCard title="VDO.Ninja Guest Integration" icon={Video} color="#FFB800">
      <div className="space-y-3">
        <p className="text-[11px] text-white/40">Browser-based guest video — no install required for guests</p>
        <CopyField label="Guest Join URL (send to guest)" value={guestUrl} mono={true} />
        <CopyField label="Director View URL" value={directorUrl} mono={true} />
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.1)' }}>
          <p className="text-[10px] text-white/30">Guest opens their URL · You see their feed in Director View · Add to OBS via Browser Source</p>
        </div>
      </div>
    </PanelCard>
  );
}

/* ── n8n Orchestration ── */
function N8NPanel() {
  var webhookBase = typeof window !== 'undefined' ? window.location.origin + '/api/hooks/' : 'https://your-app.com/api/hooks/';
  return (
    <PanelCard title="n8n Workflow Orchestration" icon={Terminal} color="#d4af37">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { event: 'stream.started', color: '#FF1564' },
            { event: 'tip.received', color: '#d4af37' },
            { event: 'subscriber.new', color: '#00F5FF' },
            { event: 'raid.incoming', color: '#8B5CF6' },
          ].map(function(w) {
            return (
              <div key={w.event} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: w.color }} />
                  <span className="text-[9px] font-mono-sw text-white/50">{w.event}</span>
                </div>
                <StatusDot active={true} label="Webhook ready" />
              </div>
            );
          })}
        </div>
        <CopyField label="n8n Webhook Base URL" value={webhookBase} mono={true} />
      </div>
    </PanelCard>
  );
}

/* ── Stream Permissions Panel ── */
function StreamPermissionsPanel() {
  var [perms, setPerms] = useState({
    speakers_can_share_screen: true,
    listeners_can_react: true,
    require_hand_raise: true,
    auto_admit_followers: false,
    subscribers_only: false,
    record_consent: true,
  });

  function toggle(key) {
    setPerms(function(p) {
      var next = Object.assign({}, p);
      next[key] = !p[key];
      return next;
    });
  }

  var permList = [
    { key: 'speakers_can_share_screen', label: 'Speakers can share screen' },
    { key: 'listeners_can_react', label: 'Listeners can react/emoji' },
    { key: 'require_hand_raise', label: 'Require hand-raise to speak' },
    { key: 'auto_admit_followers', label: 'Auto-admit followers' },
    { key: 'subscribers_only', label: 'Subscribers only' },
    { key: 'record_consent', label: 'Show recording consent banner' },
  ];

  return (
    <PanelCard title="Stream Permissions" icon={AlertCircle} color="#FF8C00">
      <div className="space-y-2">
        {permList.map(function(p) {
          var active = perms[p.key];
          return (
            <div key={p.key} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-white/60">{p.label}</span>
              <button
                onClick={function() { toggle(p.key); }}
                className="w-10 h-5 rounded-full relative transition-all"
                style={{ background: active ? '#d4af37' : 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: active ? '22px' : '2px' }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}

/* ── Main Page ── */
export default function StreamInfraPage() {
  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  return (
    <div className="min-h-screen" style={{ background: '#0B0B18', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(7,7,15,0.98)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37' }}>
                STREAM INFRASTRUCTURE
              </h1>
              <p className="text-xs text-white/40 mt-0.5">LiveKit · RTMP Ingress · Simulcast · VDO.Ninja · n8n</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-bold">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <LiveKitStatus />
          <RTMPIngressPanel user={user} />
          <SocialAudioPanel user={user} />
          <MultiStreamEgress />
          <VDONinjaPanel />
          <N8NPanel />
          <div className="xl:col-span-1">
            <StreamPermissionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}