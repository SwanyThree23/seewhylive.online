import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import EnhancedIngestPanel from '@/components/streaming/EnhancedIngestPanel';
import {
  Radio, Server, Copy, Check, Users, Mic, MicOff,
  Video, VideoOff, Zap, Globe, RefreshCw, Terminal,
  Share2, Headphones, Crown, Eye, AlertCircle, Hand,
  Settings, Play, Square, Plus, Trash2, ExternalLink,
  Wifi, Activity, BarChart2, Lock, Unlock, Shield,
  ChevronRight, Music, Monitor, PhoneOff, UserCheck
} from 'lucide-react';

/* ─── Helpers ─── */
function copyText(val) {
  navigator.clipboard.writeText(val);
  toast.success('Copied to clipboard');
}

function genKey(prefix, userId) {
  var id = userId ? userId.slice(0, 8) : 'demo0000';
  return prefix + '_' + id + '_' + Math.random().toString(36).slice(2, 10);
}

/* ─── Sub-components ─── */

function PanelCard({ title, icon: Icon, color, children, className }) {
  var c = color || '#d4af37';
  return (
    <div className={'rounded-xl overflow-hidden ' + (className || '')} style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid ' + c + '28' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid ' + c + '18' }}>
        {Icon && <Icon className="w-4 h-4" style={{ color: c }} />}
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusDot({ active, label, pulse }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={pulse ? 'animate-pulse' : ''}
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: active ? '#6DBF7E' : '#C0392B',
          boxShadow: active ? '0 0 6px #6DBF7E60' : 'none'
        }}
      />
      <span className="text-xs" style={{ color: active ? '#6DBF7E' : '#C0392B' }}>{label}</span>
    </div>
  );
}

function CopyField({ label, value, mono }) {
  var [copied, setCopied] = useState(false);
  function handle() {
    copyText(value);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }
  return (
    <div className="space-y-1">
      {label && <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-lg px-3 py-2 text-xs text-white/70 truncate"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: mono ? 'Share Tech Mono, monospace' : 'Rajdhani, sans-serif'
          }}
        >
          {value}
        </div>
        <button
          onClick={handle}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: copied ? 'rgba(109,191,126,0.1)' : 'rgba(212,175,55,0.1)', border: '1px solid ' + (copied ? '#6DBF7E60' : '#d4af3740') }}
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-yellow-400" />}
        </button>
      </div>
    </div>
  );
}

function Toggle({ active, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-white/60">{label}</span>
      <button
        onClick={function() { onChange(!active); }}
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
}

/* ═══════════════════════════════════════
   TAB 1 — STREAM (LiveKit Infrastructure)
═══════════════════════════════════════ */

function StreamTab({ user }) {
  var userId = (user && user.id) || 'demo0000';
  var [streamKey, setStreamKey] = useState(function() { return genKey('sw', userId); });
  var [egressKeys, setEgressKeys] = useState({ youtube: '', twitch: '', facebook: '', x: '' });
  var [vdoRoom] = useState(function() { return 'sw_' + Math.random().toString(36).slice(2, 10); });
  var [perms, setPerms] = useState({
    speakers_can_share_screen: true,
    listeners_can_react: true,
    require_hand_raise: true,
    auto_admit_followers: false,
    subscribers_only: false,
    record_consent: true,
  });

  var rtmpUrl = 'rtmp://ingest.seewhy.live/live';
  var guestUrl = 'https://vdo.ninja/?push=' + vdoRoom + '&room=seewhy&quality=0';
  var directorUrl = 'https://vdo.ninja/?view=' + vdoRoom + '&room=seewhy';
  var webhookBase = (typeof window !== 'undefined' ? window.location.origin : 'https://seewhy.live') + '/api/hooks/';

  function togglePerm(key) {
    setPerms(function(p) {
      var n = Object.assign({}, p);
      n[key] = !p[key];
      return n;
    });
  }

  var platforms = [
    { id: 'youtube', label: 'YouTube Live', ph: 'yt_xxxx...', color: '#C0392B' },
    { id: 'twitch', label: 'Twitch', ph: 'live_xxxx...', color: '#D4AF37' },
    { id: 'facebook', label: 'Facebook Live', ph: 'FB-xxxx...', color: '#C9A84C' },
    { id: 'x', label: 'X / Twitter', ph: 'xxxx...', color: '#d4af37' },
  ];

  var n8nEvents = [
    { event: 'stream.started', color: '#C0392B' },
    { event: 'tip.received', color: '#d4af37' },
    { event: 'subscriber.new', color: '#C9A84C' },
    { event: 'raid.incoming', color: '#D4AF37' },
    { event: 'goal.reached', color: '#6DBF7E' },
    { event: 'clip.created', color: '#FF8C00' },
  ];

  var permList = [
    { key: 'speakers_can_share_screen', label: 'Speakers can share screen' },
    { key: 'listeners_can_react', label: 'Listeners can react/emoji' },
    { key: 'require_hand_raise', label: 'Require hand-raise to speak' },
    { key: 'auto_admit_followers', label: 'Auto-admit followers' },
    { key: 'subscribers_only', label: 'Subscribers only' },
    { key: 'record_consent', label: 'Show recording consent banner' },
  ];

  return (
    <div className="space-y-4">
      {/* Enhanced Ingest Panel */}
      <EnhancedIngestPanel roomId="main" isHost={true} />

      {/* Status grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'WebRTC Engine', sub: 'SFU mode', active: true, color: '#C9A84C' },
          { label: 'RTMP Ingress', sub: 'OBS ready', active: true, color: '#6DBF7E' },
          { label: 'Egress/Record', sub: 'Simulcast on', active: true, color: '#D4AF37' },
          { label: 'n8n Hooks', sub: 'Webhooks live', active: true, color: '#d4af37' },
        ].map(function(s) {
          return (
            <div key={s.label} className="rounded-xl p-3" style={{ background: s.color + '08', border: '1px solid ' + s.color + '20' }}>
              <StatusDot active={s.active} label={s.label} pulse={s.active} />
              <p className="text-[10px] text-white/30 mt-1 ml-3">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* RTMP Ingress */}
        <PanelCard title="RTMP Ingress — OBS Setup" icon={Radio} color="#C0392B">
          <div className="space-y-3">
            <CopyField label="RTMP Server URL" value={rtmpUrl} mono={true} />
            <CopyField label="Stream Key" value={streamKey} mono={true} />
            <button
              onClick={function() { setStreamKey(genKey('sw', userId)); toast.success('Key regenerated'); }}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', height:32, padding:'0 12px', borderRadius:8, background:'rgba(192,57,43,0.12)', color:'#C0392B', border:'1px solid rgba(192,57,43,0.25)', fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}
            >
              <RefreshCw className="w-3 h-3" /> Regenerate Key
            </button>
            <div className="rounded-lg p-2.5 space-y-1" style={{ background: 'rgba(192,57,43,0.04)', border: '1px solid rgba(192,57,43,0.08)' }}>
              <p className="text-[10px] text-white/40 font-bold uppercase">OBS Quick Config</p>
              <p className="text-[10px] text-white/25">Service: Custom RTMP</p>
              <p className="text-[10px] text-white/25">Bitrate: 4000–8000 kbps · Keyframe: 2s · H.264</p>
              <p className="text-[10px] text-white/25">Audio: AAC 160 kbps · 44.1 kHz</p>
            </div>
          </div>
        </PanelCard>

        {/* Social Audio Rooms */}
        <PanelCard title="Social Audio Rooms" icon={Headphones} color="#D4AF37">
          <SocialAudioRoles />
        </PanelCard>

        {/* Multi-Destination Egress */}
        <PanelCard title="Multi-Destination Simulcast" icon={Share2} color="#6DBF7E">
          <div className="space-y-3">
            <p className="text-[11px] text-white/40">Broadcast to platforms simultaneously via RTMP egress</p>
            {platforms.map(function(p) {
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-[10px] w-24 shrink-0" style={{ color: p.color + 'CC' }}>{p.label}</span>
                  <input
                    value={egressKeys[p.id] || ''}
                    onChange={function(e) {
                      var v = e.target.value;
                      setEgressKeys(function(prev) {
                        var n = Object.assign({}, prev);
                        n[p.id] = v;
                        return n;
                      });
                    }}
                    placeholder={p.ph}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[10px] text-white/60 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Share Tech Mono, monospace' }}
                  />
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: egressKeys[p.id] ? '#6DBF7E' : 'rgba(255,255,255,0.15)' }} />
                </div>
              );
            })}
            <button
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', height:32, padding:'0 12px', borderRadius:8, background:'rgba(109,191,126,0.12)', color:'#6DBF7E', border:'1px solid rgba(109,191,126,0.25)', fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}
            >
              <Zap className="w-3 h-3" /> Start Simulcast to All Active
            </button>
          </div>
        </PanelCard>

        {/* VDO.Ninja */}
        <PanelCard title="VDO.Ninja Guest Integration" icon={Video} color="#FFB800">
          <div className="space-y-3">
            <p className="text-[11px] text-white/40">Browser-based guest video — no install required</p>
            <CopyField label="Guest Join URL" value={guestUrl} mono={true} />
            <CopyField label="Director View URL" value={directorUrl} mono={true} />
            <div className="grid grid-cols-2 gap-2">
              <a href={guestUrl} target="_blank" rel="noopener noreferrer">
                <button style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, width:'100%', height:32, padding:'0 8px', borderRadius:8, background:'rgba(255,184,0,0.12)', color:'#FFB800', border:'1px solid rgba(255,184,0,0.25)', fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}>
                  <ExternalLink className="w-3 h-3" /> Guest Link
                </button>
              </a>
              <a href={directorUrl} target="_blank" rel="noopener noreferrer">
                <button style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, width:'100%', height:32, padding:'0 8px', borderRadius:8, background:'rgba(255,184,0,0.08)', color:'rgba(255,184,0,0.6)', border:'1px solid rgba(255,184,0,0.15)', fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}>
                  <Eye className="w-3 h-3" /> Director
                </button>
              </a>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.08)' }}>
              <p className="text-[10px] text-white/30">Guest opens URL → feeds into OBS via Browser Source</p>
            </div>
          </div>
        </PanelCard>

        {/* n8n Orchestration */}
        <PanelCard title="n8n Workflow Orchestration" icon={Terminal} color="#d4af37">
          <div className="space-y-3">
            <CopyField label="Webhook Base URL" value={webhookBase} mono={true} />
            <div className="grid grid-cols-2 gap-2">
              {n8nEvents.map(function(w) {
                return (
                  <div key={w.event} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: w.color }} />
                      <span className="text-[11px] text-white/40" style={{ fontFamily: 'Share Tech Mono, monospace' }}>{w.event}</span>
                    </div>
                    <StatusDot active={true} label="Ready" />
                  </div>
                );
              })}
            </div>
          </div>
        </PanelCard>

        {/* Stream Permissions */}
        <PanelCard title="Stream Permissions" icon={Shield} color="#FF8C00">
          <div className="space-y-0.5">
            {permList.map(function(p) {
              return (
                <Toggle
                  key={p.key}
                  active={perms[p.key]}
                  label={p.label}
                  onChange={function() { togglePerm(p.key); }}
                />
              );
            })}
          </div>
        </PanelCard>

      </div>
    </div>
  );
}

function SocialAudioRoles() {
  var [role, setRole] = useState('listener');
  var roles = [
    { id: 'speaker', label: 'Speaker', Icon: Mic, color: '#d4af37', desc: 'Mic + video' },
    { id: 'cohost', label: 'Co-Host', Icon: Crown, color: '#FFB800', desc: 'Moderation' },
    { id: 'listener', label: 'Listener', Icon: Headphones, color: '#D4AF37', desc: 'Audio-only' },
  ];
  var selected = roles.find(function(r) { return r.id === role; }) || roles[2];
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-white/40">Select your role for audio-first rooms</p>
      <div className="grid grid-cols-3 gap-2">
        {roles.map(function(r) {
          var active = role === r.id;
          return (
            <button
              key={r.id}
              onClick={function() { setRole(r.id); }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
              style={{
                background: active ? r.color + '18' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (active ? r.color + '55' : 'rgba(255,255,255,0.06)')
              }}
            >
              <r.Icon className="w-5 h-5" style={{ color: active ? r.color : 'rgba(255,255,255,0.25)' }} />
              <span className="text-[10px] font-bold uppercase" style={{ color: active ? r.color : 'rgba(255,255,255,0.35)' }}>{r.label}</span>
              <span className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>{r.desc}</span>
            </button>
          );
        })}
      </div>
      <button
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', height:32, padding:'0 12px', borderRadius:8, background: selected.color + '1A', color: selected.color, border: '1px solid ' + selected.color + '40', fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}
      >
        <selected.Icon className="w-3 h-3" /> Join as {selected.label}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAB 2 — LIVE ROOM (WebRTC Social Audio)
═══════════════════════════════════════ */

function LiveRoomTab({ user }) {
  var [micOn, setMicOn] = useState(false);
  var [videoOn, setVideoOn] = useState(false);
  var [handRaised, setHandRaised] = useState(false);
  var [myRole, setMyRole] = useState('listener');
  var [roomActive, setRoomActive] = useState(false);

  var mockParticipants = [
    { id: '1', name: 'Alex Rivera', role: 'host', mic: true, video: true, hand: false, speaking: true },
    { id: '2', name: 'Jordan M.', role: 'speaker', mic: true, video: false, hand: false, speaking: false },
    { id: '3', name: 'Sam Chen', role: 'speaker', mic: false, video: true, hand: true, speaking: false },
    { id: '4', name: 'Tara K.', role: 'listener', mic: false, video: false, hand: false, speaking: false },
    { id: '5', name: 'Devon L.', role: 'listener', mic: false, video: false, hand: true, speaking: false },
    { id: '6', name: 'Maya R.', role: 'cohost', mic: true, video: true, hand: false, speaking: false },
  ];

  var roleColors = { host: '#C0392B', cohost: '#FFB800', speaker: '#d4af37', listener: '#D4AF37' };
  var hostParticipants = mockParticipants.filter(function(p) { return p.role === 'host' || p.role === 'cohost' || p.role === 'speaker'; });
  var listenerParticipants = mockParticipants.filter(function(p) { return p.role === 'listener'; });

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="flex items-center gap-3">
          {roomActive ? (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>ROOM LIVE</span>
            </div>
          ) : (
            <span className="text-sm text-white/40" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Room Offline</span>
          )}
          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }}>
            {mockParticipants.length} participants
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={function() { setRoomActive(!roomActive); }}
            style={{ display:'flex', alignItems:'center', gap:6, height:32, padding:'0 12px', borderRadius:8, background: roomActive ? 'rgba(192,57,43,0.15)' : 'rgba(212,175,55,0.15)', color: roomActive ? '#C0392B' : '#d4af37', border: '1px solid ' + (roomActive ? 'rgba(192,57,43,0.3)' : 'rgba(212,175,55,0.3)'), fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}
          >
            {roomActive ? <><Square className="w-3 h-3" /> End Room</> : <><Play className="w-3 h-3" /> Start Room</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Stage / Participant Grid */}
        <div className="lg:col-span-2 space-y-3">
          <PanelCard title="Stage — Speakers & Co-Hosts" icon={Users} color="#d4af37">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {hostParticipants.map(function(p) {
                var rc = roleColors[p.role] || '#d4af37';
                return (
                  <div key={p.id} className="flex flex-col items-center gap-2">
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold"
                      style={{
                        background: 'linear-gradient(135deg, ' + rc + '22, ' + rc + '08)',
                        border: '2px solid ' + (p.speaking ? rc : rc + '30'),
                        boxShadow: p.speaking ? '0 0 12px ' + rc + '40' : 'none'
                      }}
                    >
                      {p.name.charAt(0)}
                      {p.hand && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[11px]" style={{ background: '#FFB800' }}>
                          ✋
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                        {p.mic && <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: '#6DBF7E' }}><Mic className="w-2 h-2 text-black" /></div>}
                        {!p.mic && <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: '#C0392B' }}><MicOff className="w-2 h-2 text-white" /></div>}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-white/80 truncate max-w-[4rem]">{p.name.split(' ')[0]}</p>
                      <p className="text-[11px] font-bold uppercase" style={{ color: rc }}>{p.role}</p>
                    </div>
                  </div>
                );
              })}

              {/* Empty slots */}
              {[1,2].map(function(i) {
                return (
                  <div key={'empty' + i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
                    >
                      <Plus className="w-4 h-4 text-white/20" />
                    </div>
                    <p className="text-[11px] text-white/20">Open slot</p>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          {/* Listeners */}
          <PanelCard title="Listeners" icon={Headphones} color="#D4AF37">
            <div className="flex flex-wrap gap-2">
              {listenerParticipants.map(function(p) {
                return (
                  <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'rgba(212,175,55,0.4)' }}>
                      {p.name.charAt(0)}
                    </div>
                    <span className="text-[10px] text-white/60">{p.name.split(' ')[0]}</span>
                    {p.hand && <span className="text-[10px]">✋</span>}
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <span className="text-[10px] text-white/25">+ 42 more</span>
              </div>
            </div>
          </PanelCard>
        </div>

        {/* Controls Panel */}
        <div className="space-y-3">

          {/* My Role */}
          <PanelCard title="My Role" icon={UserCheck} color="#C9A84C">
            <div className="space-y-2">
              {['host', 'speaker', 'listener'].map(function(r) {
                var active = myRole === r;
                var rc = roleColors[r] || '#d4af37';
                return (
                  <button
                    key={r}
                    onClick={function() { setMyRole(r); }}
                    className="w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all"
                    style={{ background: active ? rc + '15' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (active ? rc + '40' : 'rgba(255,255,255,0.06)') }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: active ? rc : 'rgba(255,255,255,0.2)' }} />
                    <span className="text-xs font-bold uppercase" style={{ color: active ? rc : 'rgba(255,255,255,0.4)' }}>{r}</span>
                    {active && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: rc }} />}
                  </button>
                );
              })}
            </div>
          </PanelCard>

          {/* Media Controls */}
          <PanelCard title="Media Controls" icon={Activity} color="#6DBF7E">
            <div className="space-y-2">
              <button
                onClick={function() { setMicOn(!micOn); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all"
                style={{ background: micOn ? 'rgba(109,191,126,0.1)' : 'rgba(192,57,43,0.08)', border: '1px solid ' + (micOn ? 'rgba(109,191,126,0.25)' : 'rgba(192,57,43,0.2)') }}
              >
                {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                <span className="text-xs" style={{ color: micOn ? '#6DBF7E' : '#C0392B' }}>{micOn ? 'Mic On' : 'Mic Muted'}</span>
              </button>
              <button
                onClick={function() { setVideoOn(!videoOn); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all"
                style={{ background: videoOn ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (videoOn ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.08)') }}
              >
                {videoOn ? <Video className="w-4 h-4 text-[#6DBF7E]" /> : <VideoOff className="w-4 h-4 text-white/40" />}
                <span className="text-xs" style={{ color: videoOn ? '#C9A84C' : 'rgba(255,255,255,0.4)' }}>{videoOn ? 'Video On' : 'Video Off'}</span>
              </button>
              <button
                onClick={function() { setHandRaised(!handRaised); toast(handRaised ? 'Hand lowered' : '✋ Hand raised — waiting to speak'); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all"
                style={{ background: handRaised ? 'rgba(255,184,0,0.12)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (handRaised ? 'rgba(255,184,0,0.3)' : 'rgba(255,255,255,0.08)') }}
              >
                <Hand className="w-4 h-4" style={{ color: handRaised ? '#FFB800' : 'rgba(255,255,255,0.4)' }} />
                <span className="text-xs" style={{ color: handRaised ? '#FFB800' : 'rgba(255,255,255,0.4)' }}>{handRaised ? 'Hand Raised ✋' : 'Raise Hand'}</span>
              </button>
            </div>
          </PanelCard>

          {/* Quick Stats */}
          <PanelCard title="Room Stats" icon={BarChart2} color="#FF8C00">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'On Stage', val: String(hostParticipants.length), c: '#d4af37' },
                { label: 'Listeners', val: String(listenerParticipants.length + 42), c: '#D4AF37' },
                { label: 'Hand Up', val: String(mockParticipants.filter(function(p) { return p.hand; }).length), c: '#FFB800' },
                { label: 'Speaking', val: String(mockParticipants.filter(function(p) { return p.speaking; }).length), c: '#6DBF7E' },
              ].map(function(s) {
                return (
                  <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xl font-bold" style={{ fontFamily: 'Share Tech Mono, monospace', color: s.c }}>{s.val}</p>
                    <p className="text-[11px] text-white/30 uppercase">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </PanelCard>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAB 3 — STUDIO (LiveKit Room Management)
═══════════════════════════════════════ */

function StudioTab({ user }) {
  var [rooms, setRooms] = useState([
    { id: '1', name: 'Main Stage', type: 'video', participants: 3, status: 'live', bitrate: '4.2 Mbps' },
    { id: '2', name: 'Green Room', type: 'audio', participants: 1, status: 'active', bitrate: '0.4 Mbps' },
    { id: '3', name: 'Backstage Chat', type: 'audio', participants: 5, status: 'active', bitrate: '1.1 Mbps' },
  ]);
  var [newRoomName, setNewRoomName] = useState('');
  var [newRoomType, setNewRoomType] = useState('video');

  function addRoom() {
    if (!newRoomName.trim()) { toast.error('Room name required'); return; }
    setRooms(function(prev) {
      return prev.concat([{ id: String(Date.now()), name: newRoomName.trim(), type: newRoomType, participants: 0, status: 'idle', bitrate: '—' }]);
    });
    setNewRoomName('');
    toast.success('Room created: ' + newRoomName.trim());
  }

  function removeRoom(id) {
    setRooms(function(prev) { return prev.filter(function(r) { return r.id !== id; }); });
  }

  var statusColor = { live: '#C0392B', active: '#6DBF7E', idle: '#d4af3780' };
  var typeIcon = { video: Video, audio: Music };

  return (
    <div className="space-y-4">
      {/* LiveKit global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Rooms', val: String(rooms.filter(function(r) { return r.status !== 'idle'; }).length), c: '#C9A84C' },
          { label: 'Total Participants', val: String(rooms.reduce(function(a, r) { return a + r.participants; }, 0)), c: '#d4af37' },
          { label: 'Live Rooms', val: String(rooms.filter(function(r) { return r.status === 'live'; }).length), c: '#C0392B' },
          { label: 'Idle Rooms', val: String(rooms.filter(function(r) { return r.status === 'idle'; }).length), c: '#D4AF3780' },
        ].map(function(s) {
          return (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: s.c }}>{s.val}</p>
              <p className="text-[10px] text-white/30 uppercase mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Room list */}
      <PanelCard title="LiveKit Room Management" icon={Server} color="#C9A84C">
        <div className="space-y-2">
          {rooms.map(function(room) {
            var TypeIcon = typeIcon[room.type] || Video;
            var sc = statusColor[room.status] || '#d4af37';
            return (
              <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: sc + '15', border: '1px solid ' + sc + '30' }}>
                  <TypeIcon className="w-4 h-4" style={{ color: sc }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90 truncate">{room.name}</span>
                    <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: sc + '18', color: sc }}>{room.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-white/35"><Users className="w-2.5 h-2.5 inline mr-0.5" />{room.participants}</span>
                    <span className="text-[10px] text-white/35" style={{ fontFamily: 'Share Tech Mono' }}>{room.bitrate}</span>
                    <span className="text-[10px]" style={{ color: room.type === 'video' ? '#C9A84C60' : '#D4AF3760' }}>{room.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', height:28, padding:'0 8px', borderRadius:8, background:'rgba(201,168,76,0.08)', color:'rgba(201,168,76,0.5)', border:'1px solid rgba(201,168,76,0.15)', cursor:'pointer' }}
                  >
                    <Settings className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={function() { removeRoom(room.id); }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', height:28, padding:'0 8px', borderRadius:8, background:'rgba(192,57,43,0.08)', color:'rgba(192,57,43,0.38)', border:'1px solid rgba(192,57,43,0.15)', cursor:'pointer' }}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Create room */}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={newRoomName}
              onChange={function(e) { setNewRoomName(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') { addRoom(); } }}
              placeholder="New room name..."
              className="flex-1 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <select
              value={newRoomType}
              onChange={function(e) { setNewRoomType(e.target.value); }}
              className="rounded-lg px-2 py-2 text-xs focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
            <button
              onClick={addRoom}
              style={{ display:'flex', alignItems:'center', gap:4, height:36, padding:'0 12px', borderRadius:8, background:'rgba(212,175,55,0.15)', color:'#d4af37', border:'1px solid rgba(212,175,55,0.3)', fontSize:12, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}
            >
              <Plus className="w-3 h-3" /> Create
            </button>
          </div>
        </div>
      </PanelCard>

      {/* Recording & Clips */}
      <PanelCard title="Recording & Clips" icon={Radio} color="#C0392B">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Auto-Record All Live Rooms', desc: 'Saves to VOD library automatically', active: true },
            { label: 'Multi-Track Recording', desc: 'Separate audio per participant', active: false },
            { label: 'Auto-Clip Highlights', desc: 'AI detects peak moments', active: true },
          ].map(function(item) {
            return (
              <div key={item.label} className="rounded-lg p-3" style={{ background: item.active ? 'rgba(192,57,43,0.06)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (item.active ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.06)') }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-white/80">{item.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: item.active ? '#6DBF7E' : 'rgba(255,255,255,0.15)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </PanelCard>

    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */

var TABS = [
  { id: 'stream', label: '🔴 STREAM', sub: 'LiveKit Infrastructure' },
  { id: 'liveroom', label: '🎙 LIVE ROOM', sub: 'Social Audio Space' },
  { id: 'studio', label: '🎬 STUDIO', sub: 'Room Management' },
];

export default function StreamInfra() {
  var [activeTab, setActiveTab] = useState('stream');

  var { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });

  return (
    <div className="min-h-screen" style={{ background: '#0B0B18', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Page header */}
      <div style={{ background: 'rgba(8,11,24,0.98)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace', color: '#d4af37', letterSpacing: '0.08em' }}>
                STREAM INFRASTRUCTURE
              </h1>
              <p className="text-xs text-white/35 mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                LiveKit · RTMP Ingress · Simulcast · VDO.Ninja · n8n · Social Audio
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0 mt-4 overflow-x-auto scrollbar-hide">
            {TABS.map(function(t) {
              var active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={function() { setActiveTab(t.id); }}
                  className="flex flex-col items-start px-5 py-2.5 shrink-0 transition-all border-b-2"
                  style={{
                    borderBottomColor: active ? '#d4af37' : 'transparent',
                    background: active ? 'rgba(212,175,55,0.06)' : 'transparent',
                  }}
                >
                  <span className="text-xs font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.07em', color: active ? '#d4af37' : 'rgba(255,255,255,0.4)' }}>
                    {t.label}
                  </span>
                  <span className="text-[11px] text-white/25">{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'stream' && <StreamTab user={user} />}
            {activeTab === 'liveroom' && <LiveRoomTab user={user} />}
            {activeTab === 'studio' && <StudioTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}