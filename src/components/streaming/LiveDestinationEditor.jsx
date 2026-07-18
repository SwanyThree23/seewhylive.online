import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Radio, Plus, Trash2, Wifi, WifiOff, Settings,
  Eye, EyeOff, Copy, Check, Play, Square, Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const PLATFORMS = [
  { key: 'youtube',   label: 'YouTube Live',   color: '#C0392B', rtmp: 'rtmp://a.rtmp.youtube.com/live2' },
  { key: 'twitch',    label: 'Twitch',          color: '#9146ff', rtmp: 'rtmp://live.twitch.tv/live' },
  { key: 'tiktok',    label: 'TikTok Live',     color: '#69C9D0', rtmp: 'rtmp://push.tiktokv.com/rtmp' },
  { key: 'facebook',  label: 'Facebook Live',   color: '#1877f2', rtmp: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { key: 'instagram', label: 'Instagram',       color: '#E1306C', rtmp: 'rtmps://edgetee-upload.facebook.com:443/rtmp' },
  { key: 'x',         label: 'X (Twitter)',     color: '#fff',    rtmp: 'rtmp://ingest.pscp.tv:80/x' },
  { key: 'linkedin',  label: 'LinkedIn Live',   color: '#0A66C2', rtmp: 'rtmp://4.rtmp.linkedin.com/live' },
  { key: 'kick',      label: 'Kick',            color: '#53FC18', rtmp: 'rtmp://ingest.kick.com/live' },
  { key: 'rumble',    label: 'Rumble',          color: '#85C742', rtmp: 'rtmp://ingest.rmbl.ws/live' },
  { key: 'custom',    label: 'Custom RTMP',     color: G,         rtmp: '' },
];

// Per-destination status
const STATUS = {
  idle:        { color: 'rgba(255,255,255,0.25)', label: 'Idle',        pulse: false },
  connecting:  { color: G,                        label: 'Connecting…', pulse: true  },
  live:        { color: '#6DBF7E',                label: 'LIVE',        pulse: true  },
  error:       { color: '#C0392B',                label: 'Error',       pulse: false },
};

let _destId = 0;
const newId = () => `dest_${++_destId}_${Date.now()}`;

// ── Single destination row ──────────────────────────────────────────────────

function DestRow({ dest, masterLive, onUpdate, onRemove, onToggleLive }) {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied]   = useState(false);
  const platform = PLATFORMS.find(p => p.key === dest.platform) || PLATFORMS.at(-1);
  const sCfg = STATUS[dest.status] || STATUS.idle;

  const copyKey = () => {
    if (!dest.streamKey) return;
    navigator.clipboard.writeText(dest.streamKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Stream key copied');
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${dest.status === 'live' ? '#6DBF7E30' : `${platform.color}22`}`, background: 'rgba(8,11,24,0.8)' }}
    >
      {/* Row summary */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0 transition-colors" style={{ background: platform.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black" style={{ ...T, color: dest.status === 'live' ? '#6DBF7E' : 'rgba(255,255,255,0.75)' }}>
              {dest.label || platform.label}
            </span>
            {/* Status badge */}
            <div className="flex items-center gap-1">
              {sCfg.pulse && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sCfg.color }} />}
              <span className="text-[9px] font-black uppercase" style={{ ...T, color: sCfg.color }}>{sCfg.label}</span>
            </div>
          </div>
          {dest.rtmpUrl && (
            <p className="text-[9px] font-mono text-white/20 truncate">{dest.rtmpUrl.replace(/^rtmps?:\/\//, '')}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Expand settings */}
          <button onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ background: expanded ? `${G}15` : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: expanded ? G : 'rgba(255,255,255,0.3)' }}>
            <Settings className="w-3 h-3" />
          </button>

          {/* Per-destination live toggle (only meaningful when master is live) */}
          {masterLive ? (
            <button
              onClick={() => onToggleLive(dest.id)}
              disabled={dest.status === 'connecting'}
              className="flex items-center gap-1 px-2 py-1 rounded font-black text-[9px] uppercase transition-all disabled:opacity-50"
              style={{
                ...T,
                background: dest.status === 'live' ? 'rgba(192,57,43,0.2)' : `${G}15`,
                border: `1px solid ${dest.status === 'live' ? 'rgba(192,57,43,0.5)' : `${G}40`}`,
                color: dest.status === 'live' ? '#C0392B' : G,
              }}
            >
              {dest.status === 'connecting' ? <Loader2 className="w-3 h-3 animate-spin" /> :
               dest.status === 'live'       ? <><Square className="w-3 h-3" /> Stop</> :
                                              <><Play  className="w-3 h-3" /> Start</>}
            </button>
          ) : (
            /* Enabled toggle (pre-flight) */
            <button
              onClick={() => onUpdate(dest.id, { enabled: !dest.enabled })}
              className="w-9 h-5 rounded-full relative flex-shrink-0 transition-all"
              style={{ background: dest.enabled ? G : 'rgba(255,255,255,0.1)' }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: dest.enabled ? 'calc(100% - 18px)' : 2 }} />
            </button>
          )}

          <button onClick={() => onRemove(dest.id)} className="w-6 h-6 flex items-center justify-center rounded text-white/15 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded settings — editable inline while live */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-2">
              {dest.status === 'live' && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse" />
                  <p className="text-[9px] text-[#6DBF7E] font-bold" style={T}>Changes apply to the next keyframe — no stream restart needed</p>
                </div>
              )}
              {/* Label */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>Label</p>
                <input
                  defaultValue={dest.label}
                  placeholder={platform.label}
                  onBlur={e => onUpdate(dest.id, { label: e.target.value.trim() || platform.label })}
                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] text-white/70 placeholder-white/20 outline-none focus:border-[#d4af37]/30"
                />
              </div>
              {/* RTMP URL */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>RTMP URL</p>
                <input
                  defaultValue={dest.rtmpUrl || platform.rtmp}
                  placeholder={platform.rtmp || 'rtmp://ingest.example.com/live'}
                  onBlur={e => onUpdate(dest.id, { rtmpUrl: e.target.value.trim() })}
                  className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-white/70 placeholder-white/20 outline-none focus:border-[#d4af37]/30"
                />
              </div>
              {/* Stream Key */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>Stream Key</p>
                <div className="flex gap-1">
                  <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded bg-black/40 border border-white/10">
                    <input
                      type={showKey ? 'text' : 'password'}
                      defaultValue={dest.streamKey}
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      onBlur={e => onUpdate(dest.id, { streamKey: e.target.value })}
                      className="flex-1 bg-transparent text-[10px] font-mono text-white/70 placeholder-white/20 outline-none"
                    />
                    <button onClick={() => setShowKey(s => !s)} className="text-white/25 hover:text-white/50">
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <button onClick={copyKey}
                    className="w-7 h-7 rounded flex items-center justify-center transition-all"
                    style={{ background: copied ? `${G}20` : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {copied ? <Check className="w-3 h-3" style={{ color: G }} /> : <Copy className="w-3 h-3 text-white/30" />}
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

// ── Add destination panel ────────────────────────────────────────────────────

function AddPanel({ onAdd, onClose, masterLive }) {
  const [platform, setPlatform] = useState('youtube');
  const [label, setLabel]       = useState('');

  const submit = () => {
    const p = PLATFORMS.find(x => x.key === platform);
    onAdd({
      id: newId(),
      platform,
      label: label.trim() || p.label,
      rtmpUrl: p.rtmp,
      streamKey: '',
      enabled: false,
      status: 'idle',
    });
    onClose();
    toast.success(`${p.label} added${masterLive ? ' — configure the stream key, then click Start' : ''}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="rounded-xl p-3 space-y-3" style={{ background: `${G}06`, border: `1px solid ${G}22` }}>
      {masterLive && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#6DBF7E] animate-pulse" />
          <p className="text-[9px] text-[#6DBF7E] font-bold" style={T}>Adding mid-stream — existing destinations are unaffected</p>
        </div>
      )}
      {/* Platform grid */}
      <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto">
        {PLATFORMS.map(p => (
          <button key={p.key} onClick={() => { setPlatform(p.key); setLabel(p.label); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all"
            style={{ background: platform === p.key ? `${p.color}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${platform === p.key ? `${p.color}55` : 'rgba(255,255,255,0.07)'}` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-[10px] font-bold text-white/70 truncate" style={T}>{p.label}</span>
          </button>
        ))}
      </div>
      {platform === 'custom' && (
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Kick, DLive, Odysee"
          className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] text-white placeholder-white/25 outline-none focus:border-[#d4af37]/40"
        />
      )}
      <div className="flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-1.5 rounded text-[11px] font-black uppercase transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', ...T }}>
          Cancel
        </button>
        <button onClick={submit}
          className="flex-1 py-1.5 rounded text-[11px] font-black uppercase transition-all"
          style={{ background: G, color: '#000', ...T }}>
          Add {PLATFORMS.find(p => p.key === platform)?.label}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * LiveDestinationEditor — RTMP destination manager with per-destination
 * start/stop while the master broadcast is live.
 *
 * Props:
 *   roomId  {string}
 *   isHost  {boolean}
 *   isLive  {boolean}  — whether the master broadcast is currently live
 */
export default function LiveDestinationEditor({ roomId, isHost, isLive = false }) {
  const qc = useQueryClient();
  const [destinations, setDestinations] = useState([]);
  const [showAdd, setShowAdd]           = useState(false);
  const [masterLive, setMasterLive]     = useState(isLive);

  // Persist destinations to room entity
  const persist = useCallback((dests) => {
    if (!roomId) return;
    base44.entities.Room.update(roomId, {
      rtmp_destinations: dests.map(d => ({
        id: d.id, platform: d.platform, label: d.label,
        rtmp_url: d.rtmpUrl, stream_key: d.streamKey,
        is_active: d.status === 'live', enabled: d.enabled,
      })),
    }).catch(() => {});
  }, [roomId]);

  // Load from DB on mount
  useQuery({
    queryKey: ['room-destinations', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const rooms = await base44.entities.Room.filter({ id: roomId });
      return rooms[0]?.rtmp_destinations || [];
    },
    enabled: !!roomId,
    onSuccess: (rows) => {
      if (rows.length && !destinations.length) {
        setDestinations(rows.map(d => ({
          id: d.id || newId(),
          platform: d.platform || 'custom',
          label: d.label || d.platform || 'Destination',
          rtmpUrl: d.rtmp_url || '',
          streamKey: d.stream_key || '',
          enabled: d.enabled ?? false,
          status: d.is_active ? 'live' : 'idle',
        })));
      }
    },
  });

  const updateDest = (id, patch) => {
    setDestinations(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...patch } : d);
      persist(next);
      return next;
    });
  };

  const removeDest = (id) => {
    setDestinations(prev => {
      const next = prev.filter(d => d.id !== id);
      persist(next);
      return next;
    });
    toast.success('Destination removed');
  };

  const addDest = (dest) => {
    setDestinations(prev => {
      const next = [dest, ...prev];
      persist(next);
      return next;
    });
  };

  // Per-destination toggle live (only when master is live)
  const toggleDestLive = (id) => {
    setDestinations(prev => {
      const dest = prev.find(d => d.id === id);
      if (!dest) return prev;

      if (dest.status === 'live') {
        // Stop this destination
        const next = prev.map(d => d.id === id ? { ...d, status: 'idle' } : d);
        persist(next);
        toast.success(`${dest.label} stopped`);
        return next;
      } else {
        // Start: connecting → live after 3s
        const connecting = prev.map(d => d.id === id ? { ...d, status: 'connecting' } : d);
        setTimeout(() => {
          setDestinations(cur => {
            const next = cur.map(d => d.id === id ? { ...d, status: 'live' } : d);
            persist(next);
            return next;
          });
          toast.success(`${dest.label} is now live`);
        }, 3000);
        return connecting;
      }
    });
  };

  // Master go-live / stop
  const toggleMasterLive = () => {
    const next = !masterLive;
    setMasterLive(next);
    if (next) {
      // Set all enabled destinations to connecting → live
      setDestinations(prev => {
        const connecting = prev.map(d => d.enabled ? { ...d, status: 'connecting' } : d);
        setTimeout(() => {
          setDestinations(cur => {
            const live = cur.map(d => d.status === 'connecting' ? { ...d, status: 'live' } : d);
            persist(live);
            return live;
          });
        }, 3000);
        persist(connecting);
        return connecting;
      });
      toast.success('All enabled destinations starting…');
    } else {
      setDestinations(prev => {
        const stopped = prev.map(d => ({ ...d, status: 'idle' }));
        persist(stopped);
        return stopped;
      });
      toast.success('All destinations stopped');
    }
    if (roomId) {
      base44.entities.Room.update(roomId, { multi_streaming_enabled: next }).catch(() => {});
    }
  };

  if (!isHost) return null;

  const enabledCount = destinations.filter(d => d.enabled).length;
  const liveCount    = destinations.filter(d => d.status === 'live').length;

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" style={{ color: masterLive ? '#C0392B' : G }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: masterLive ? '#C0392B' : G }}>
            Live Destinations
          </span>
          {liveCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ ...T, background: 'rgba(192,57,43,0.25)', color: '#C0392B' }}>
              {liveCount} live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Add while live */}
          <button onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-1 px-2 py-1 rounded transition-all"
            style={{ background: showAdd ? `${G}15` : 'rgba(255,255,255,0.05)', border: `1px solid ${showAdd ? `${G}40` : 'rgba(255,255,255,0.1)'}`, color: showAdd ? G : 'rgba(255,255,255,0.4)' }}>
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase" style={T}>Add</span>
          </button>
          {/* Master live toggle */}
          {enabledCount > 0 && (
            <button onClick={toggleMasterLive}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded font-black text-[10px] uppercase transition-all"
              style={{ ...T, background: masterLive ? 'rgba(192,57,43,0.2)' : `${G}20`, border: `1px solid ${masterLive ? 'rgba(192,57,43,0.5)' : `${G}50`}`, color: masterLive ? '#C0392B' : G }}>
              {masterLive ? <><WifiOff className="w-3 h-3" /> Stop All</> : <><Wifi className="w-3 h-3" /> Go Live</>}
            </button>
          )}
        </div>
      </div>

      {/* Add panel */}
      <AnimatePresence>
        {showAdd && (
          <AddPanel onAdd={addDest} onClose={() => setShowAdd(false)} masterLive={masterLive} />
        )}
      </AnimatePresence>

      {/* Destination list */}
      {destinations.length === 0 && !showAdd ? (
        <div className="py-5 text-center">
          <Radio className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.18)' }} />
          <p className="text-[11px] text-white/20" style={T}>No destinations yet</p>
          <p className="text-[10px] text-white/12 mt-0.5">Add YouTube, Twitch, TikTok + more</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-1.5">
            {destinations.map(dest => (
              <DestRow
                key={dest.id}
                dest={dest}
                masterLive={masterLive}
                onUpdate={updateDest}
                onRemove={removeDest}
                onToggleLive={toggleDestLive}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Master live status bar */}
      {masterLive && liveCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-black uppercase text-red-400" style={T}>
            {liveCount}/{enabledCount} destinations live — you can add or stop individual channels without interrupting others
          </span>
        </motion.div>
      )}
    </div>
  );
}
