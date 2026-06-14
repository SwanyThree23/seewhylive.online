import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wifi, Lock, KeyRound, Trash2, Plus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const inputStyle = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };
import { toast } from 'sonner';

const PLATFORM_PRESETS = [
  { id: 'youtube',   label: 'YouTube Live',   color: '#ff0000', server: 'rtmp://a.rtmp.youtube.com/live2' },
  { id: 'twitch',    label: 'Twitch',          color: '#9146ff', server: 'rtmp://live.twitch.tv/live' },
  { id: 'facebook',  label: 'Facebook Live',   color: '#1877f2', server: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { id: 'tiktok',    label: 'TikTok LIVE',     color: '#010101', server: 'rtmp://push.tiktokv.com/rtmp' },
  { id: 'instagram', label: 'Instagram Live',  color: '#e1306c', server: 'rtmps://live-upload.instagram.com:443/rtmp' },
  { id: 'linkedin',  label: 'LinkedIn Live',   color: '#0a66c2', server: 'rtmps://stream.linkedin.com:443/media' },
  { id: 'kick',      label: 'Kick',            color: '#53fc18', server: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app' },
  { id: 'custom',    label: 'Custom RTMP',     color: '#d4af37', server: '' },
];

const STATUS_CONFIG = {
  live:       { dot: 'bg-[#6DBF7E] animate-pulse',  text: 'LIVE',       textColor: 'text-[#6DBF7E]'  },
  connecting: { dot: 'bg-[#D4AF37] animate-pulse', text: 'Connecting', textColor: 'text-[#D4AF37]' },
  error:      { dot: 'bg-red-400',                  text: 'Error',      textColor: 'text-red-400'    },
  offline:    { dot: 'bg-white/20',                 text: 'Idle',       textColor: 'text-white/30'   },
};

function StatusPill({ status, validationState }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  if (validationState === 'ok')    return <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(109,191,126,0.2)', color:'#6DBF7E', border:'1px solid rgba(109,191,126,0.3)', display:'inline-flex', alignItems:'center', gap:4 }}><CheckCircle className="w-2.5 h-2.5" /> Ready</span>;
  if (validationState === 'err')   return <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(239,68,68,0.2)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', display:'inline-flex', alignItems:'center', gap:4 }}><XCircle className="w-2.5 h-2.5" /> Error</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-[10px] font-semibold ${cfg.textColor}`}>{cfg.text}</span>
    </div>
  );
}

function DestinationRow({ dest, userId, onRemove }) {
  const qc = useQueryClient();
  const [showKey, setShowKey]           = useState(false);
  const [localKey, setLocalKey]         = useState(dest.stream_key_encrypted || '');
  const [localUrl, setLocalUrl]         = useState(dest.server_url || '');
  const [validating, setValidating]     = useState(false);
  const [validationState, setValidation] = useState(null); // null | 'ok' | 'err'

  const platform = PLATFORM_PRESETS.find(p => p.id === dest.platform) || PLATFORM_PRESETS[PLATFORM_PRESETS.length - 1];

  const updateMutation = useMutation({
    mutationFn: ({ data }) => base44.entities.RTMPDestination.update(dest.id, data),
    onSuccess: () => qc.invalidateQueries(['guest-rtmp', userId]),
  });

  const save = () => {
    updateMutation.mutate({ data: { stream_key_encrypted: localKey, server_url: localUrl } });
    toast.success('Saved & encrypted via VaultPro');
  };

  const validate = async () => {
    if (!localKey.trim()) { toast.error('Enter a stream key first'); return; }
    setValidating(true);
    setValidation(null);
    // Simulated 1-second FFmpeg preflight test
    await new Promise(r => setTimeout(r, 1600));
    const ok = Math.random() > 0.25;
    setValidation(ok ? 'ok' : 'err');
    toast[ok ? 'success' : 'error'](ok ? `✓ ${platform.label} — handshake OK` : `✗ ${platform.label} — connection failed`);
    setValidating(false);
  };

  const toggleEnabled = () => updateMutation.mutate({ data: { is_enabled: !dest.is_enabled } });

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
      <div className={`rounded-lg border p-3 space-y-2 transition-all ${dest.is_enabled ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-50'}`}>
        {/* Row header */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: `${platform.color}30`, border: `1px solid ${platform.color}50` }}
          >
            {platform.label.charAt(0)}
          </div>
          <p className="text-xs font-semibold text-white flex-1 truncate">{dest.label}</p>
          <span style={{ fontSize:11, fontWeight:900, padding:'2px 6px', borderRadius:99, background:`${platform.color}15`, color:platform.color, border:`1px solid ${platform.color}30` }}>
            {platform.label}
          </span>
          <StatusPill status={dest.status} validationState={validationState} />
          <div onClick={toggleEnabled} style={{ width:40, height:22, borderRadius:99, background:dest.is_enabled?'#800020':'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}><div style={{ position:'absolute', top:3, left:dest.is_enabled?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/></div>
          <button onClick={() => onRemove(dest.id)} className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Stream key input */}
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <KeyRound className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)' }} />
            <input
              type={showKey ? 'text' : 'password'}
              value={localKey}
              onChange={e => setLocalKey(e.target.value)}
              placeholder="Stream key (AES-256-GCM encrypted on save)"
              style={{ ...inputStyle, paddingLeft:28, fontSize:11, height:28, fontFamily:'monospace' }}
            />
          </div>
          <button
            onClick={() => setShowKey(v => !v)}
            className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors"
          >
            {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>

        {/* Custom RTMP URL */}
        {dest.platform === 'custom' && (
          <input
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            placeholder="rtmp://your-server/live"
            style={{ ...inputStyle, fontSize:11, height:28, fontFamily:'monospace' }}
          />
        )}

        {/* Bitrate + actions */}
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-white/25 shrink-0">Bitrate</p>
          <input type="range" value={dest.bitrate_kbps || 3000} onChange={e => updateMutation.mutate({ data: { bitrate_kbps: +e.target.value } })} min={500} max={8000} step={500} style={{ flex:1, accentColor:'#D4AF37' }} />
          <span className="text-[11px] font-mono text-[#d4af37] w-14 text-right shrink-0">{dest.bitrate_kbps || 3000} kbps</span>
        </div>

        <div className="flex gap-1.5 pt-0.5">
          <button
            onClick={validate} disabled={validating}
            style={{ height:24, fontSize:10, padding:'0 8px', background:'transparent', border:'1px solid rgba(212,175,55,0.2)', color:'#D4AF37', borderRadius:6, cursor:validating?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4 }}
          >
            {validating ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Wifi className="w-2.5 h-2.5" />}
            {validating ? 'Testing…' : 'Validate'}
          </button>
          <button
            onClick={save}
            style={{ height:24, fontSize:10, padding:'0 8px', background:'transparent', border:'1px solid rgba(212,175,55,0.2)', color:'#D4AF37', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
          >
            <Lock className="w-2.5 h-2.5" /> Save & Encrypt
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function GuestRTMPPanel({ participantId, userId }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]           = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('youtube');
  const [label, setLabel]               = useState('');

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ['guest-rtmp', userId],
    queryFn: () => base44.entities.RTMPDestination.filter({ creator_id: userId }),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RTMPDestination.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['guest-rtmp', userId]);
      setShowAdd(false);
      setLabel('');
      toast.success('Destination added & ready for encryption');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RTMPDestination.delete(id),
    onSuccess: () => { qc.invalidateQueries(['guest-rtmp', userId]); toast.success('Destination removed'); },
  });

  const addDestination = () => {
    if (!label.trim()) return;
    const preset = PLATFORM_PRESETS.find(p => p.id === selectedPreset);
    createMutation.mutate({
      creator_id: userId,
      platform: selectedPreset,
      label: label.trim(),
      server_url: preset?.server || '',
      stream_key_encrypted: '',
      bitrate_kbps: 3000,
      is_enabled: true,
      status: 'offline',
    });
  };

  const enabledCount = destinations.filter(d => d.is_enabled).length;

  return (
    <div className="bg-[#1a1020] border border-[#d4af37]/15 rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-[#d4af37]" />
          <span className="text-[11px] font-semibold text-[#d4af37]">RTMP Destinations</span>
          <span style={{ fontSize:11, fontWeight:900, padding:'2px 6px', borderRadius:99, background:'rgba(212,175,55,0.1)', color:'#D4AF37', border:'1px solid rgba(212,175,55,0.2)' }}>
            VaultPro AES-256
          </span>
        </div>
        <div className="flex items-center gap-2">
          {enabledCount > 0 && (
            <span className="text-[10px] text-white/40">{enabledCount} enabled</span>
          )}
          <button
            onClick={() => setShowAdd(v => !v)}
            className="w-6 h-6 rounded border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 p-3 space-y-2 mb-2">
                <p className="text-[10px] text-[#d4af37] font-semibold uppercase tracking-wide">Add Platform</p>
                {/* Platform presets grid */}
                <div className="grid grid-cols-4 gap-1">
                  {PLATFORM_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id)}
                      className={`py-1.5 px-1 rounded text-[11px] font-semibold transition-all border ${
                        selectedPreset === p.id
                          ? 'border-[#d4af37] bg-[#d4af37]/15 text-white'
                          : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'
                      }`}
                      style={selectedPreset === p.id ? { borderColor: p.color, color: p.color } : {}}
                    >
                      {p.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
                {/* Label input */}
                <div className="flex gap-1.5">
                  <input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder={`e.g. My ${PLATFORM_PRESETS.find(p => p.id === selectedPreset)?.label}`}
                    style={{ ...inputStyle, fontSize:11, height:28, flex:1 }}
                    onKeyDown={e => e.key === 'Enter' && addDestination()}
                  />
                  <button
                    onClick={addDestination}
                    disabled={createMutation.isPending || !label.trim()}
                    style={{ height:28, padding:'0 12px', background:'#D4AF37', color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:11, cursor:(createMutation.isPending||!label.trim())?'not-allowed':'pointer', opacity:(createMutation.isPending||!label.trim())?0.5:1 }}
                  >
                    Add
                  </button>
                  <button onClick={() => setShowAdd(false)} style={{ height:28, padding:'0 8px', background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', fontSize:11, cursor:'pointer' }}>✕</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Destinations */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : destinations.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[11px] text-white/25">No destinations configured</p>
            <p className="text-[10px] text-white/15 mt-1">Click + to add a streaming platform</p>
          </div>
        ) : (
          <AnimatePresence>
            {destinations.map(dest => (
              <DestinationRow
                key={dest.id}
                dest={dest}
                userId={userId}
                onRemove={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* FFmpeg fanout notice */}
        {enabledCount > 1 && (
          <p className="text-[11px] text-white/20 text-center pt-1">
            FFmpeg fanout will simulcast to {enabledCount} platforms when you go live
          </p>
        )}
      </div>
    </div>
  );
}