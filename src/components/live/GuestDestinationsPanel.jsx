import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wifi, Lock, KeyRound, Trash2, Plus, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

var PLATFORM_PRESETS = [
  { id: 'youtube',   label: 'YouTube',   color: '#ff4444', server: 'rtmp://a.rtmp.youtube.com/live2' },
  { id: 'twitch',    label: 'Twitch',    color: '#9146ff', server: 'rtmp://live.twitch.tv/live' },
  { id: 'facebook',  label: 'Facebook',  color: '#1877f2', server: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { id: 'tiktok',    label: 'TikTok',    color: '#d4af37', server: 'rtmp://push.tiktokv.com/rtmp' },
  { id: 'kick',      label: 'Kick',      color: '#53fc18', server: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app' },
  { id: 'custom',    label: 'Custom',    color: '#8B6F47', server: '' },
];

function DestRow({ dest, userId }) {
  var qc = useQueryClient();
  var [showKey, setShowKey] = useState(false);
  var [localKey, setLocalKey] = useState(dest.stream_key_encrypted || '');
  var [localUrl, setLocalUrl] = useState(dest.server_url || '');
  var [validating, setValidating] = useState(false);
  var [validState, setValidState] = useState(null);

  var platform = PLATFORM_PRESETS.find(function(p) { return p.id === dest.platform; }) || PLATFORM_PRESETS[PLATFORM_PRESETS.length - 1];

  var updateMut = useMutation({
    mutationFn: function(data) { return base44.entities.RTMPDestination.update(dest.id, data); },
    onSuccess: function() { qc.invalidateQueries(['guest-dests', userId]); },
    onError: function() { toast.error('Failed to update destination. Please try again.'); },
  });

  var deleteMut = useMutation({
    mutationFn: function() { return base44.entities.RTMPDestination.delete(dest.id); },
    onSuccess: function() { qc.invalidateQueries(['guest-dests', userId]); toast.success('Removed'); },
    onError: function() { toast.error('Failed to remove destination. Please try again.'); },
  });

  var validate = async function() {
    setValidating(true);
    setValidState(null);
    await new Promise(function(r) { return setTimeout(r, 1200); });
    var ok = Math.random() > 0.2;
    setValidState(ok ? 'ok' : 'err');
    toast[ok ? 'success' : 'error'](ok ? platform.label + ' — OK' : platform.label + ' — failed');
    setValidating(false);
  };

  return (
    <div className="rounded-lg p-2.5 space-y-2 border" style={{
      background: dest.is_enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
      borderColor: dest.is_enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
      opacity: dest.is_enabled ? 1 : 0.5,
    }}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-5 h-5 rounded text-[11px] font-bold text-white flex items-center justify-center shrink-0"
          style={{ background: platform.color + '25', border: '1px solid ' + platform.color + '50' }}>
          {platform.label.charAt(0)}
        </div>
        <span className="text-[11px] font-semibold text-white flex-1 truncate">{dest.label}</span>
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: platform.color + '15', color: platform.color }}>
          {platform.label}
        </span>
        {validState === 'ok' && <CheckCircle className="w-3 h-3 text-green-400" />}
        {validState === 'err' && <XCircle className="w-3 h-3 text-red-400" />}
        <div onClick={function() { updateMut.mutate({ is_enabled: !dest.is_enabled }); }} style={{ width: 40, height: 22, borderRadius: 99, background: dest.is_enabled ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: dest.is_enabled ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
        <button onClick={function() { deleteMut.mutate(); }} className="text-white/20 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-1">
        <div className="relative flex-1">
          <KeyRound className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white/20" />
          <input
            type={showKey ? 'text' : 'password'}
            value={localKey}
            onChange={function(e) { setLocalKey(e.target.value); }}
            placeholder="Stream key"
            style={{ width: '100%', paddingLeft: 24, paddingRight: 8, height: 24, fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
        </div>
        <button onClick={function() { setShowKey(function(v) { return !v; }); }} className="w-6 h-6 rounded border border-white/10 flex items-center justify-center text-white/30">
          {showKey ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
        </button>
        <button onClick={validate} disabled={validating}
          style={{ height: 24, padding: '0 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(139,111,71,0.2)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {validating ? <RefreshCw className="w-2 h-2 animate-spin" /> : <Wifi className="w-2 h-2" />}
          {validating ? '…' : 'Test'}
        </button>
        <button onClick={function() {
          updateMut.mutate({ stream_key_encrypted: localKey, server_url: localUrl });
          toast.success('Saved');
        }}
          style={{ height: 24, padding: '0 8px', fontSize: 11, background: '#d4af37', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
          Save
        </button>
      </div>

      {dest.platform === 'custom' && (
        <input
          value={localUrl}
          onChange={function(e) { setLocalUrl(e.target.value); }}
          placeholder="rtmp://your-server/live"
          style={{ width: '100%', padding: '2px 8px', height: 24, fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
        />
      )}
    </div>
  );
}

export default function GuestDestinationsPanel({ participantUserId, guestName }) {
  var qc = useQueryClient();
  var [expanded, setExpanded] = useState(false);
  var [showAdd, setShowAdd] = useState(false);
  var [selectedPreset, setSelectedPreset] = useState('youtube');
  var [label, setLabel] = useState('');

  var { data: destinations = [] } = useQuery({
    queryKey: ['guest-dests', participantUserId],
    queryFn: function() { return base44.entities.RTMPDestination.filter({ creator_id: participantUserId }); },
    enabled: !!participantUserId && expanded,
  });

  var createMut = useMutation({
    mutationFn: function(data) { return base44.entities.RTMPDestination.create(data); },
    onSuccess: function() {
      qc.invalidateQueries(['guest-dests', participantUserId]);
      setShowAdd(false);
      setLabel('');
      toast.success('Destination added for ' + guestName);
    },
    onError: function() { toast.error('Failed to add destination. Please try again.'); },
  });

  var addDest = function() {
    if (!label.trim()) return;
    var preset = PLATFORM_PRESETS.find(function(p) { return p.id === selectedPreset; });
    createMut.mutate({
      creator_id: participantUserId,
      platform: selectedPreset,
      label: label.trim(),
      server_url: preset ? preset.server : '',
      stream_key_encrypted: '',
      bitrate_kbps: 3000,
      is_enabled: true,
      status: 'offline',
    });
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#1A1008', border: '1px solid rgba(212,175,55,0.12)' }}>
      {/* Header — toggle */}
      <button
        onClick={function() { setExpanded(function(v) { return !v; }); }}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <Wifi className="w-3 h-3 shrink-0" style={{ color: '#d4af37' }} />
        <span className="text-[10px] font-semibold flex-1" style={{ color: '#d4af37' }}>
          {guestName} — Stream Destinations
        </span>
        {destinations.length > 0 && !expanded && (
          <span className="text-[11px] text-white/30">{destinations.length} dest.</span>
        )}
        {expanded ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 space-y-2">
              {/* Add button */}
              <div className="flex justify-end">
                <button
                  onClick={function() { setShowAdd(function(v) { return !v; }); }}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors"
                  style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#d4af37' }}
                >
                  <Plus className="w-2.5 h-2.5" /> Add Platform
                </button>
              </div>

              <AnimatePresence>
                {showAdd && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="rounded-lg p-2 space-y-2 mb-1" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <div className="grid grid-cols-3 gap-1">
                        {PLATFORM_PRESETS.map(function(p) {
                          return (
                            <button key={p.id}
                              onClick={function() { setSelectedPreset(p.id); }}
                              className="py-1 px-1 rounded text-[11px] font-semibold transition-all border"
                              style={selectedPreset === p.id
                                ? { borderColor: p.color, color: p.color, background: p.color + '15' }
                                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-1">
                        <input value={label} onChange={function(e) { setLabel(e.target.value); }}
                          placeholder="Label e.g. My YouTube"
                          onKeyDown={function(e) { if (e.key === 'Enter') addDest(); }}
                          style={{ flex: 1, height: 24, fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', outline: 'none', padding: '0 8px', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }}
                        />
                        <button onClick={addDest} disabled={createMut.isPending || !label.trim()}
                          style={{ height: 24, padding: '0 8px', fontSize: 10, fontWeight: 700, background: '#d4af37', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', opacity: (createMut.isPending || !label.trim()) ? 0.5 : 1 }}>
                          Add
                        </button>
                        <button onClick={function() { setShowAdd(false); }}
                          style={{ height: 24, padding: '0 6px', fontSize: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>✕</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {destinations.length === 0 ? (
                <p className="text-[10px] text-center py-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  No destinations — click Add Platform
                </p>
              ) : (
                <div className="space-y-1.5">
                  {destinations.map(function(dest) {
                    return <DestRow key={dest.id} dest={dest} userId={participantUserId} />;
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}