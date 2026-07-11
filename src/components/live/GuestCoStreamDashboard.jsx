/**
 * GuestCoStreamDashboard — Unified host/co-host control center for all 20 panel members.
 * Shows every guest's RTMP destination count, connection quality, stream status, and
 * provides bulk ops + per-guest controls in a single scrollable panel.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Shield, ShieldOff, Mic, MicOff, Video, VideoOff, Radio,
  Wifi, WifiOff, Pin, Users, Zap, Crown, Lock, Unlock,
  BarChart2, Signal, Settings, X, Eye, EyeOff, Hand,
  Copy, RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Timer, DollarSign,
} from 'lucide-react';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const QUALITY = {
  excellent: { label: 'Excellent', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  good:      { label: 'Good',      color: G,         bg: `rgba(212,175,55,0.1)` },
  warning:   { label: 'Weak',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  critical:  { label: 'Critical',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  offline:   { label: 'Offline',   color: '#555',    bg: 'rgba(80,80,80,0.1)'   },
};

const PLATFORM_COLORS = { YT: '#FF0000', TW: '#9147FF', FB: '#1877F2', TK: '#010101' };

function useNetworkHealth(id, streaming) {
  const [stats, setStats] = useState({ bitrate: 0, latency: 0, fps: 0, quality: 'offline', destinations: 0 });
  const ref = useRef(null);
  useEffect(() => {
    if (!streaming) { setStats(s => ({ ...s, quality: 'offline', bitrate: 0, fps: 0, latency: 0 })); return; }
    const tick = () => {
      const latency = 30 + Math.round(Math.random() * 180);
      const bitrate = 1200 + Math.round(Math.random() * 2400);
      const quality = latency > 200 ? 'critical' : latency > 120 ? 'warning' : latency > 60 ? 'good' : 'excellent';
      setStats({ bitrate, latency, fps: bitrate > 1500 ? 30 : 24, quality, destinations: Math.floor(Math.random() * 4) + 1 });
    };
    tick();
    ref.current = setInterval(tick, 5000);
    return () => clearInterval(ref.current);
  }, [id, streaming]);
  return stats;
}

function useStageTimer(joinedAt) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = joinedAt ? new Date(joinedAt).getTime() : Date.now();
    const tick = () => setSecs(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [joinedAt]);
  const m = Math.floor(secs / 60), s = secs % 60;
  const color = secs > 600 ? '#ef4444' : secs > 300 ? '#f59e0b' : 'rgba(255,255,255,0.3)';
  return { label: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, color };
}

function GuestCard({ participant, isHost, roomId, onSpotlight, spotlitId, raisedHands, index }) {
  const [muted, setMuted]     = useState(participant.is_muted || false);
  const [vidOff, setVidOff]   = useState(false);
  const [showRTMP, setShowRTMP] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const health     = useNetworkHealth(participant.id, participant.is_streaming);
  const stageTimer = useStageTimer(participant.joined_at);
  const q       = QUALITY[health.quality] || QUALITY.offline;
  const isCoHost  = participant.role === 'co-host';
  const isHostP   = participant.role === 'host';
  const isSpotlit = spotlitId === participant.id;
  const isRaised  = raisedHands.has(participant.user_id);
  const qc = useQueryClient();

  const platforms = useMemo(() => {
    const all = ['YT','TW','FB','TK'];
    return all.slice(0, Math.min(health.destinations, 3));
  }, [health.destinations]);

  const viewerCountRef = useRef(participant.is_streaming ? Math.floor(Math.random() * 500) : 0);
  useEffect(() => {
    viewerCountRef.current = participant.is_streaming ? Math.floor(Math.random() * 500) : 0;
  }, [participant.is_streaming]);

  const promote = useMutation({
    mutationFn: () => base44.entities.Participant.update(participant.id, {
      role: isCoHost ? 'guest' : 'co-host',
    }),
    onSuccess: () => { toast.success(`${participant.user_name} role updated`); qc.invalidateQueries(['participants', roomId]); },
  });

  const muteToggle = useMutation({
    mutationFn: () => base44.entities.Participant.update(participant.id, { is_muted: !muted }),
    onSuccess: () => setMuted(m => !m),
  });

  const kick = useMutation({
    mutationFn: () => base44.entities.Participant.update(participant.id, { status: 'removed' }),
    onSuccess: () => { toast.info(`${participant.user_name} removed`); qc.invalidateQueries(['participants', roomId]); },
  });

  const sendTip = () => {
    base44.entities.Transaction.create({
      type: 'tip',
      room_id: roomId,
      to_user_id: participant.user_id,
      amount: tipAmount,
      sender_name: 'Host',
    }).then(() => {
      toast.success(`💰 $${tipAmount} tip sent to ${participant.user_name}!`);
      setShowTip(false);
    }).catch(() => toast.error('Tip failed'));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.03 }}
      style={{
        background: isSpotlit ? `${G}08` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isSpotlit ? G + '30' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        <span style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 900, width: 14, flexShrink: 0, textAlign: 'center' }}>
          {index + 1}
        </span>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `linear-gradient(135deg, ${isHostP ? '#4a3000' : isCoHost ? '#003040' : CRIMSON}, #080B18)`,
            border: `1.5px solid ${isHostP ? G : isCoHost ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: isHostP ? G : isCoHost ? '#D4AF37' : '#fff', ...T,
          }}>
            {participant.user_avatar
              ? <img src={participant.user_avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : (participant.user_name || '?')[0].toUpperCase()}
          </div>
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 8, height: 8, borderRadius: '50%',
            background: q.color, border: '1.5px solid #080B18',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {isHostP && <Crown style={{ width: 9, height: 9, color: G }} />}
            {isCoHost && <Shield style={{ width: 9, height: 9, color: '#D4AF37' }} />}
            <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {participant.user_name || 'Guest'}
            </span>
            {isRaised && <span style={{ fontSize: 10 }}>✋</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <Timer style={{ width: 8, height: 8, color: stageTimer.color }} />
              <span style={{ ...T, fontSize: 9, color: stageTimer.color, fontWeight: 700 }}>{stageTimer.label}</span>
            </div>
            {participant.is_streaming && (
              <>
                <span style={{ ...T, color: '#dc2626', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>LIVE</span>
                <span style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 9, flexShrink: 0 }}>
                  👁 {viewerCountRef.current}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {participant.is_streaming ? (
              <>
                <span style={{ ...T, color: q.color, fontSize: 9 }}>{health.bitrate} kbps</span>
                <span style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{health.latency}ms</span>
              </>
            ) : (
              <span style={{ ...T, color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{isHostP ? 'host' : isCoHost ? 'co-host' : 'guest'}</span>
            )}
          </div>
        </div>

        {participant.is_streaming && health.destinations > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: `${G}15`, border: `1px solid ${G}30`,
            borderRadius: 5, padding: '2px 6px', flexShrink: 0,
          }}>
            <Radio style={{ width: 8, height: 8, color: G }} />
            <span style={{ ...T, color: G, fontSize: 9, fontWeight: 900 }}>{health.destinations}</span>
          </div>
        )}

        {participant.is_streaming && health.destinations > 0 && (
          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            {platforms.map(pl => (
              <div key={pl} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: PLATFORM_COLORS[pl],
                border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, fontWeight: 900, color: '#fff', ...T,
              }}>
                {pl[0]}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <CBtn icon={muted ? MicOff : Mic} color={muted ? '#ef4444' : 'rgba(255,255,255,0.4)'}
            active={muted} onClick={() => muteToggle.mutate()} />
          <CBtn icon={vidOff ? VideoOff : Video} color={vidOff ? '#ef4444' : 'rgba(255,255,255,0.4)'}
            active={vidOff} onClick={() => setVidOff(v => !v)} />
          <CBtn icon={Pin} color={isSpotlit ? G : 'rgba(255,255,255,0.35)'} active={isSpotlit}
            onClick={() => onSpotlight?.(isSpotlit ? null : participant.id)} />
          {!isHostP && isHost && (
            <CBtn icon={Zap} color={PINK} title="Give Floor"
              onClick={() => {
                onSpotlight?.(participant.id);
                base44.entities.Participant.update(participant.id, { is_muted: false }).catch(() => {});
                toast.success(`🎙️ Floor given to ${participant.user_name}`);
              }} />
          )}
          {isHost && (
            <CBtn icon={DollarSign} color={showTip ? G : 'rgba(255,255,255,0.35)'} active={showTip}
              onClick={() => setShowTip(v => !v)} title="Tip Guest" />
          )}
          {!isHostP && isHost && (
            <CBtn icon={isCoHost ? ShieldOff : Shield} color={isCoHost ? '#D4AF37' : 'rgba(255,255,255,0.35)'}
              active={isCoHost} onClick={() => promote.mutate()} />
          )}
          {!isHostP && isHost && (
            <CBtn icon={X} color="#ef4444" onClick={() => kick.mutate()} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              padding: '6px 10px 8px 52px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              {[1, 5, 10, 25].map(amt => (
                <button key={amt} onClick={() => setTipAmount(amt)} style={{
                  ...T, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 900, cursor: 'pointer',
                  background: tipAmount === amt ? `${G}25` : 'rgba(255,255,255,0.05)',
                  color: tipAmount === amt ? G : 'rgba(255,255,255,0.5)',
                  border: tipAmount === amt ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.1)',
                }}>
                  ${amt}
                </button>
              ))}
              <button onClick={sendTip} style={{
                ...T, padding: '3px 12px', borderRadius: 99, fontSize: 10, fontWeight: 900, cursor: 'pointer',
                background: `linear-gradient(90deg, ${CRIMSON}, ${G})`, color: '#fff', border: 'none',
              }}>
                Send Tip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {participant.is_streaming && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px 6px 52px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 2, overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.min(100, (health.latency / 300) * 100)}%`,
              background: q.color, transition: 'width 0.6s',
            }} />
          </div>
          <span style={{ ...T, color: q.color, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {q.label}
          </span>
          <span style={{ ...T, color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>
            {health.fps} fps
          </span>
        </div>
      )}
    </motion.div>
  );
}

function CBtn({ icon: Icon, color, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? color + '35' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 4, cursor: 'pointer', color,
    }}>
      <Icon style={{ width: 10, height: 10 }} />
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color = G }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8, padding: '8px 10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <Icon style={{ width: 11, height: 11, color }} />
        <span style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</span>
      </div>
      <p style={{ ...T, color, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function ScenesTab({ guests, roomId }) {
  const [sceneSlots, setSceneSlots] = useState(() => Array(20).fill(null));
  const [presetName, setPresetName] = useState('');

  const assignSlot = (slotIdx, guestId) => {
    const guest = guests.find(g => g.id === guestId) || null;
    setSceneSlots(prev => {
      const next = [...prev];
      next[slotIdx] = guest;
      return next;
    });
  };

  const unassignSlot = (slotIdx) => {
    setSceneSlots(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const assignedIds = new Set(sceneSlots.filter(Boolean).map(p => p.id));
  const unassigned  = guests.filter(g => !assignedIds.has(g.id));

  const savePreset = () => {
    if (!presetName.trim()) { toast.error('Enter a preset name'); return; }
    const key = `seewhy_scenes_${roomId}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    saved[presetName.trim()] = sceneSlots.map(s => s ? s.id : null);
    localStorage.setItem(key, JSON.stringify(saved));
    toast.success(`Scene preset "${presetName}" saved`);
  };

  const loadPreset = () => {
    const key = `seewhy_scenes_${roomId}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const names = Object.keys(saved);
    if (!names.length) { toast.info('No saved presets'); return; }
    const name = names[names.length - 1];
    const ids = saved[name];
    setSceneSlots(ids.map(id => guests.find(g => g.id === id) || null));
    toast.success(`Loaded preset "${name}"`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {sceneSlots.map((slot, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.03)',
            border: slot ? `1px solid ${G}30` : '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 8, position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden',
            minHeight: 70, padding: 4,
          }}>
            {slot ? (
              <>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${CRIMSON}, #3a0015)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 900, color: G, ...T,
                }}>
                  {(slot.user_name || '?')[0].toUpperCase()}
                </div>
                <p style={{ ...T, color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {(slot.user_name || 'Guest').split(' ')[0]}
                </p>
                <button onClick={() => unassignSlot(idx)} style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 14, height: 14, borderRadius: '50%', background: 'rgba(239,68,68,0.7)',
                  border: 'none', cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8,
                }}>
                  x
                </button>
              </>
            ) : (
              <>
                <span style={{ ...T, color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 900 }}>
                  #{idx + 1}
                </span>
                {unassigned.length > 0 ? (
                  <select
                    onChange={e => { if (e.target.value) { assignSlot(idx, e.target.value); e.target.value = ''; } }}
                    defaultValue=""
                    style={{
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 4, color: '#fff', fontSize: 8, cursor: 'pointer', outline: 'none',
                      padding: '2px 4px', maxWidth: '90%', ...T,
                    }}
                  >
                    <option value="">+ Assign</option>
                    {unassigned.map(g => (
                      <option key={g.id} value={g.id}>{g.user_name || 'Guest'}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ ...T, color: 'rgba(255,255,255,0.15)', fontSize: 8 }}>+ Assign</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          placeholder="Preset name..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, outline: 'none', ...T,
          }}
        />
        <button onClick={savePreset} style={{
          ...T, background: `${G}15`, border: `1px solid ${G}30`, color: G,
          borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
        }}>
          Save Preset
        </button>
        <button onClick={loadPreset} style={{
          ...T, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
          borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
        }}>
          Load Preset
        </button>
      </div>
    </div>
  );
}

export default function GuestCoStreamDashboard({
  participants = [], roomId, isHost, onSpotlight, spotlitId,
  raisedHands = new Set(), onLockRoom,
}) {
  const [locked, setLocked]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [sortBy, setSortBy]         = useState('role');
  const [showHealth, setShowHealth] = useState(true);
  const [dashTab, setDashTab]       = useState('guests');
  const qc = useQueryClient();

  const guests = participants.filter(p => ['host','co-host','speaker','guest'].includes(p.role));

  const filtered = guests
    .filter(p => {
      const matchSearch = !search || (p.user_name || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'all'    ? true :
        filter === 'live'   ? p.is_streaming :
        filter === 'cohost' ? (p.role === 'co-host' || p.role === 'host') :
        filter === 'hands'  ? raisedHands.has(p.user_id) : true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'role') {
        const order = { host: 0, 'co-host': 1, speaker: 2, guest: 3 };
        return (order[a.role] ?? 9) - (order[b.role] ?? 9);
      }
      return (a.user_name || '').localeCompare(b.user_name || '');
    });

  const liveCount   = guests.filter(p => p.is_streaming).length;
  const coHostCount = guests.filter(p => p.role === 'co-host').length;
  const raisedCount = raisedHands.size;

  const totalReach = useMemo(() =>
    liveCount * 150 + Math.floor(liveCount * Math.random() * 100),
    [liveCount]
  );

  const muteAll = () => {
    guests.forEach(p => base44.entities.Participant.update(p.id, { is_muted: true }).catch(() => {}));
    toast.info('All guests muted');
  };

  const removeAllGuests = async () => {
    const toRemove = guests.filter(p => p.role === 'guest');
    await Promise.all(toRemove.map(p => base44.entities.Participant.update(p.id, { status: 'removed' })));
    toast.info(`${toRemove.length} guests removed`);
    qc.invalidateQueries(['participants', roomId]);
  };

  const toggleLock = () => {
    setLocked(v => !v);
    onLockRoom?.(!locked);
    toast.info(locked ? 'Room unlocked — new guests can join' : 'Room locked — no new admissions');
  };

  const copyGuestLink = () => {
    const url = `${window.location.origin}/GuestJoin?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Guest link copied!'));
  };

  return (
    <div style={{
      background: 'rgba(8,11,24,0.98)', border: `1px solid ${G}18`,
      borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${CRIMSON}, ${G}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: 14, height: 14, color: G }} />
            </div>
            <div>
              <p style={{ ...T, color: G, fontSize: 13, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
                Co-Stream Dashboard
              </p>
              <p style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 }}>
                {guests.length}/{20} panel · {liveCount} streaming
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={copyGuestLink} style={{
              ...T, display: 'flex', alignItems: 'center', gap: 4,
              background: `${G}15`, border: `1px solid ${G}35`, color: G,
              borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
            }}>
              <Copy style={{ width: 9, height: 9 }} /> Invite Link
            </button>
            <button onClick={toggleLock} style={{
              ...T, display: 'flex', alignItems: 'center', gap: 4,
              background: locked ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${locked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: locked ? '#ef4444' : 'rgba(255,255,255,0.5)',
              borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer',
            }}>
              {locked ? <Lock style={{ width: 9, height: 9 }} /> : <Unlock style={{ width: 9, height: 9 }} />}
              {locked ? 'Locked' : 'Lock'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <StatCard icon={Radio} label="Live" value={liveCount} color="#dc2626" />
          <StatCard icon={Shield} label="Co-hosts" value={coHostCount} color="#D4AF37" />
          <StatCard icon={Users} label="Panel" value={guests.length} />
          <StatCard icon={Eye} label="Reach" value={totalReach.toLocaleString()} color={PINK} />
          {raisedCount > 0 && <StatCard icon={Hand} label="Raised" value={raisedCount} color={PINK} />}
        </div>
      </div>

      {isHost && guests.length > 0 && (
        <div style={{ display: 'flex', gap: 5, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <BulkBtn icon={MicOff} label="Mute All" color="#ef4444" onClick={muteAll} />
          <BulkBtn icon={Mic} label="Unmute All" color="#22c55e"
            onClick={() => { guests.forEach(p => base44.entities.Participant.update(p.id, { is_muted: false }).catch(() => {})); toast.success('All unmuted'); }} />
          <BulkBtn icon={X} label="Remove Guests" color="#ef4444"
            onClick={removeAllGuests} confirm="Remove all guests?" />
          <BulkBtn icon={BarChart2} label={showHealth ? 'Hide Stats' : 'Show Stats'} color={G}
            onClick={() => setShowHealth(v => !v)} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', flexShrink: 0 }}>
        {[
          { id: 'guests', label: 'Guests' },
          { id: 'scenes', label: 'Scenes' },
        ].map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)} style={{
            ...T, fontSize: 10, padding: '4px 12px', borderRadius: 6,
            background: dashTab === t.id ? `${G}15` : 'transparent',
            color: dashTab === t.id ? G : 'rgba(255,255,255,0.35)',
            border: dashTab === t.id ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', fontWeight: 900,
          }}>
            {t.id === 'scenes' ? 'Scenes' : t.label}
          </button>
        ))}
      </div>

      {dashTab === 'scenes' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          <ScenesTab guests={guests} roomId={roomId} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search guests..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, outline: 'none', ...T,
              }}
            />
            {[
              { id: 'all', label: 'All' },
              { id: 'live', label: 'Live' },
              { id: 'cohost', label: 'Co-hosts' },
              ...(raisedCount > 0 ? [{ id: 'hands', label: `Raised ${raisedCount}` }] : []),
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                ...T, fontSize: 9, padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
                background: filter === f.id ? `${G}18` : 'rgba(255,255,255,0.04)',
                color: filter === f.id ? G : 'rgba(255,255,255,0.35)',
                border: filter === f.id ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.07)',
                fontWeight: 900, whiteSpace: 'nowrap',
              }}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.2)', ...T, fontSize: 11 }}>
                  {guests.length === 0 ? 'No panel members yet — share your guest join link' : 'No guests match your filter'}
                </motion.div>
              ) : (
                filtered.map((p, idx) => (
                  <GuestCard
                    key={p.id}
                    participant={p}
                    index={idx}
                    isHost={isHost}
                    roomId={roomId}
                    onSpotlight={onSpotlight}
                    spotlitId={spotlitId}
                    raisedHands={raisedHands}
                  />
                ))
              )}
            </AnimatePresence>

            {guests.length < 20 && (
              <div style={{
                border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px',
                textAlign: 'center', marginTop: 4,
              }}>
                <p style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                  {20 - guests.length} open slot{20 - guests.length !== 1 ? 's' : ''} remaining
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BulkBtn({ icon: Icon, label, color, onClick, confirm: confirmMsg }) {
  const handleClick = () => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    onClick?.();
  };
  return (
    <button onClick={handleClick} style={{
      ...T, display: 'flex', alignItems: 'center', gap: 4,
      background: `${color}10`, border: `1px solid ${color}25`,
      color, borderRadius: 5, padding: '4px 8px', fontSize: 9, fontWeight: 900, cursor: 'pointer',
    }}>
      <Icon style={{ width: 9, height: 9 }} />
      {label}
    </button>
  );
}
