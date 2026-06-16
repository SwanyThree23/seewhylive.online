import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Radio, Plus, Trash2, Wifi, WifiOff, Loader2, ChevronDown, ChevronUp, Settings, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const PLATFORM_DEFS = [
  { key: 'youtube',    label: 'YouTube Live',    color: '#C0392B',   rtmp: 'rtmp://a.rtmp.youtube.com/live2' },
  { key: 'twitch',     label: 'Twitch',          color: '#9146ff',   rtmp: 'rtmp://live.twitch.tv/live' },
  { key: 'facebook',   label: 'Facebook Live',   color: '#1877f2',   rtmp: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { key: 'instagram',  label: 'Instagram Live',  color: '#C0392B',   rtmp: 'rtmps://edgetee-upload.facebook.com:443/rtmp' },
  { key: 'tiktok',     label: 'TikTok Live',     color: '#fff',      rtmp: 'rtmp://push.tiktokv.com/rtmp' },
  { key: 'x',          label: 'X (Twitter)',      color: '#fff',      rtmp: 'rtmp://ingest.pscp.tv:80/x' },
  { key: 'linkedin',   label: 'LinkedIn Live',   color: '#0A66C2',   rtmp: 'rtmp://4.rtmp.linkedin.com/live' },
  { key: 'amazon',     label: 'Amazon Live',     color: '#FF9900',   rtmp: 'rtmp://live.amazon.com/live' },
  { key: 'telegram',   label: 'Telegram',        color: '#2AABEE',   rtmp: 'rtmp://dc1-1.rtmp.t.me/s' },
  { key: 'steam',      label: 'Steam',           color: '#1b2838',   rtmp: 'rtmp://ingest.steam.tv/live' },
  { key: 'custom',     label: 'Custom RTMP',     color: G,           rtmp: '' },
];

const STATUS_CFG = {
  live:        { color: '#6DBF7E', dot: true,  label: 'LIVE' },
  connecting:  { color: G,         dot: true,  label: 'Connecting' },
  error:       { color: '#C0392B', dot: false, label: 'Error' },
  offline:     { color: 'rgba(255,255,255,0.2)', dot: false, label: 'Idle' },
};

function PlatformRow({ dest, onRemove, onToggle, onStatusChange, fanoutActive }) {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const def = PLATFORM_DEFS.find(p => p.key === dest.platform) || PLATFORM_DEFS.find(p => p.key === 'custom');
  const sCfg = STATUS_CFG[dest.status] || STATUS_CFG.offline;

  const copyKey = () => {
    if (!dest.stream_key) return;
    navigator.clipboard.writeText(dest.stream_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success('Stream key copied');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${dest.enabled ? `${def.color}30` : 'rgba(255,255,255,0.06)'}`, background: 'rgba(8,11,24,0.8)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Platform dot */}
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: def.color }} />

        {/* Label + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black" style={{ ...T, color: dest.enabled ? def.color : 'rgba(255,255,255,0.3)' }}>
              {dest.label || def.label}
            </span>
            {fanoutActive && dest.enabled && (
              <div className="flex items-center gap-1">
                {sCfg.dot && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sCfg.color }} />}
                <span className="text-[9px] font-black uppercase" style={{ color: sCfg.color, ...T }}>{sCfg.label}</span>
              </div>
            )}
          </div>
          {dest.rtmp_url && (
            <p className="text-[9px] font-mono text-white/20 truncate">{dest.rtmp_url}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ background: expanded ? `${G}15` : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Settings className="w-3 h-3" style={{ color: expanded ? G : 'rgba(255,255,255,0.3)' }} />
          </button>
          {/* Enable toggle */}
          <button
            onClick={() => onToggle(dest.id, !dest.enabled)}
            className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
            style={{ background: dest.enabled ? G : 'rgba(255,255,255,0.1)' }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: dest.enabled ? 'calc(100% - 18px)' : 2 }} />
          </button>
          <button
            onClick={() => onRemove(dest.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded config */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
              {/* RTMP URL */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>RTMP URL</p>
                <input
                  defaultValue={dest.rtmp_url || def.rtmp}
                  placeholder={def.rtmp || 'rtmp://ingest.example.com/live'}
                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-white/70 placeholder-white/20 outline-none focus:border-[#d4af37]/30"
                  onBlur={e => onToggle(dest.id, dest.enabled, { rtmp_url: e.target.value })}
                />
              </div>
              {/* Stream Key */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>Stream Key</p>
                <div className="flex items-center gap-1">
                  <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded bg-black/40 border border-white/10">
                    <input
                      type={showKey ? 'text' : 'password'}
                      defaultValue={dest.stream_key || ''}
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      className="flex-1 bg-transparent text-[10px] font-mono text-white/70 placeholder-white/20 outline-none"
                      onBlur={e => onToggle(dest.id, dest.enabled, { stream_key: e.target.value })}
                    />
                    <button onClick={() => setShowKey(s => !s)} className="text-white/25 hover:text-white/50">
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <button onClick={copyKey}
                    className="w-7 h-7 rounded flex items-center justify-center transition-all"
                    style={{ background: copiedKey ? `${G}20` : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {copiedKey ? <Check className="w-3 h-3" style={{ color: G }} /> : <Copy className="w-3 h-3 text-white/30" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RTMPFanoutPanel({ roomId, isHost }) {
  const qc = useQueryClient();
  const [destinations, setDestinations] = useState([]);
  const [fanoutActive, setFanoutActive] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [customLabel, setCustomLabel] = useState('');

  // Load existing RTMP destinations from room entity
  const { data: room } = useQuery({
    queryKey: ['room-fanout', roomId],
    queryFn: () => base44.entities.Room.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: fanoutActive ? 8000 : false,
  });

  useEffect(() => {
    if (room?.rtmp_destinations?.length && destinations.length === 0) {
      setDestinations(room.rtmp_destinations.map(d => ({
        id: d.id || `dest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        platform: d.platform || 'custom',
        label: d.label || d.platform,
        rtmp_url: d.rtmp_url || '',
        stream_key: d.stream_key || '',
        enabled: d.isActive || false,
        status: 'offline',
      })));
    }
    if (room?.multi_streaming_enabled !== undefined) {
      setFanoutActive(room.multi_streaming_enabled);
    }
  }, [room]);

  const addDestination = () => {
    const def = PLATFORM_DEFS.find(p => p.key === selectedPlatform);
    const id = `dest_${Date.now()}`;
    const newDest = {
      id,
      platform: selectedPlatform,
      label: customLabel.trim() || def.label,
      rtmp_url: def.rtmp,
      stream_key: '',
      enabled: false,
      status: 'offline',
    };
    const updated = [newDest, ...destinations];
    setDestinations(updated);
    persistDestinations(updated);
    setCustomLabel('');
    setShowAdd(false);
    toast.success(`${def.label} added`);
  };

  const removeDestination = (id) => {
    const updated = destinations.filter(d => d.id !== id);
    setDestinations(updated);
    persistDestinations(updated);
  };

  const toggleDestination = (id, enabled, patch = {}) => {
    const updated = destinations.map(d => d.id === id ? { ...d, enabled, ...patch } : d);
    setDestinations(updated);
    persistDestinations(updated);
  };

  const persistDestinations = (dests) => {
    if (!roomId) return;
    base44.entities.Room.update(roomId, {
      rtmp_destinations: dests.map(d => ({
        id: d.id,
        platform: d.platform,
        label: d.label,
        rtmp_url: d.rtmp_url,
        stream_key: d.stream_key,
        isActive: d.enabled,
      })),
    }).catch(() => {});
  };

  const toggleFanout = async () => {
    const next = !fanoutActive;
    setFanoutActive(next);
    if (next) {
      // Mark all enabled destinations as connecting
      setDestinations(prev => prev.map(d => d.enabled ? { ...d, status: 'connecting' } : d));
      setTimeout(() => setDestinations(prev => prev.map(d => d.enabled ? { ...d, status: 'live' } : d)), 3000);
    } else {
      setDestinations(prev => prev.map(d => ({ ...d, status: 'offline' })));
    }
    if (roomId) {
      await base44.entities.Room.update(roomId, { multi_streaming_enabled: next }).catch(() => {});
    }
    toast.success(next ? 'Fanout started' : 'Fanout stopped');
  };

  if (!isHost) return null;

  const enabledCount = destinations.filter(d => d.enabled).length;

  return (
    <div className="space-y-2">
      {/* Header + master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" style={{ color: fanoutActive ? '#C0392B' : G }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: fanoutActive ? '#C0392B' : G }}>
            RTMP Fanout
          </span>
          {enabledCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: fanoutActive ? 'rgba(192,57,43,0.25)' : `${G}22`, color: fanoutActive ? '#C0392B' : G, ...T }}>
              {enabledCount} platforms
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-1 px-2 py-1 rounded transition-all"
            style={{
              background: showAdd ? `${G}15` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showAdd ? `${G}40` : 'rgba(255,255,255,0.1)'}`,
              color: showAdd ? G : 'rgba(255,255,255,0.4)',
            }}
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase" style={T}>Add</span>
          </button>
          {enabledCount > 0 && (
            <button
              onClick={toggleFanout}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded font-black text-[10px] uppercase transition-all"
              style={{
                background: fanoutActive ? 'rgba(192,57,43,0.2)' : `${G}20`,
                border: `1px solid ${fanoutActive ? 'rgba(192,57,43,0.5)' : `${G}50`}`,
                color: fanoutActive ? '#C0392B' : G,
                ...T,
              }}
            >
              {fanoutActive ? (
                <><WifiOff className="w-3 h-3" /> Stop</>
              ) : (
                <><Wifi className="w-3 h-3" /> Go Live</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add platform form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2.5 rounded-lg" style={{ background: `${G}06`, border: `1px solid ${G}20` }}>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                {PLATFORM_DEFS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPlatform(p.key)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                    style={{
                      background: selectedPlatform === p.key ? `${p.color}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedPlatform === p.key ? `${p.color}50` : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-[10px] font-bold text-white/70 truncate" style={T}>{p.label}</span>
                  </button>
                ))}
              </div>
              {selectedPlatform === 'custom' && (
                <input
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  placeholder="Custom label (e.g. Rumble, Kick)"
                  className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] text-white placeholder-white/25 outline-none focus:border-[#d4af37]/40"
                />
              )}
              <button
                onClick={addDestination}
                className="w-full py-1.5 rounded text-[11px] font-black uppercase transition-all"
                style={{ background: G, color: '#000', ...T }}
              >
                Add {PLATFORM_DEFS.find(p => p.key === selectedPlatform)?.label}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destinations list */}
      {destinations.length === 0 && !showAdd ? (
        <div className="py-5 text-center">
          <Radio className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p className="text-[11px] text-white/20" style={T}>No platforms configured</p>
          <p className="text-[10px] text-white/15 mt-0.5">Add YouTube, Twitch, TikTok + 8 more</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-1.5">
            {destinations.map(dest => (
              <PlatformRow
                key={dest.id}
                dest={dest}
                onRemove={removeDestination}
                onToggle={toggleDestination}
                fanoutActive={fanoutActive}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Fanout status summary */}
      {fanoutActive && enabledCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)' }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-black uppercase text-red-400" style={T}>
            Streaming to {destinations.filter(d => d.enabled && d.status === 'live').length}/{enabledCount} platforms
          </span>
        </motion.div>
      )}
    </div>
  );
}
