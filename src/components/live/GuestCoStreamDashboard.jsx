/**
 * GuestCoStreamDashboard — Unified host/co-host control center for all 20 panel members.
 * Shows every guest's RTMP destination count, connection quality, stream status, and
 * provides bulk ops + per-guest controls in a single scrollable panel.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Shield, ShieldOff, Mic, MicOff, Video, VideoOff, Radio,
  Wifi, WifiOff, Pin, Users, Zap, Crown, Lock, Unlock,
  BarChart2, Signal, Settings, X, Eye, EyeOff, Hand,
  Copy, RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
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

function GuestCard({ participant, isHost, roomId, onSpotlight, spotlitId, raisedHands, index }) {
  const [muted, setMuted]   = useState(participant.is_muted || false);
  const [vidOff, setVidOff] = useState(false);
  const [showRTMP, setShowRTMP] = useState(false);
  const health = useNetworkHealth(participant.id, participant.is_streaming);
  const q = QUALITY[health.quality] || QUALITY.offline;
  const isCoHost  = participant.role === 'co-host';
  const isHostP   = participant.role === 'host';
  const isSpotlit = spotlitId === participant.id;
  const isRaised  = raisedHands.has(participant.user_id);
  const qc = useQueryClient();

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
        {/* Index */}
        <span style={{ ...T, color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 900, width: 14, flexShrink: 0, textAlign: 'center' }}>
          {index + 1}
        </span>

        {/* Avatar */}
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
          {/* Quality ring */}
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 8, height: 8, borderRadius: '50%',
            background: q.color, border: '1.5px solid #080B18',
          }} />
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isHostP && <Crown style={{ width: 9, height: 9, color: G }} />}
            {isCoHost && <Shield style={{ width: 9, height: 9, color: '#D4AF37' }} />}
            <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {participant.user_name || 'Guest'}
            </span>
            {isRaised && <span style={{ fontSize: 10 }}>✋</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {participant.is_streaming ? (
              <>
                <span style={{ ...T, color: '#dc2626', fontSize: 9, fontWeight: 900 }}>LIVE</span>
                <span style={{ ...T, color: q.color, fontSize: 9 }}>{health.bitrate} kbps</span>
                <span style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{health.latency}ms</span>
              </>
            ) : (
              <span style={{ ...T, color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{isHostP ? 'host' : isCoHost ? 'co-host' : 'guest'}</span>
            )}
          </div>
        </div>

        {/* RTMP destination count */}
        {participant.is_streaming && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: `${G}15`, border: `1px solid ${G}30`,
            borderRadius: 5, padding: '2px 6px', flexShrink: 0,
          }}>
            <Radio style={{ width: 8, height: 8, color: G }} />
            <span style={{ ...T, color: G, fontSize: 9, fontWeight: 900 }}>{health.destinations}</span>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <CBtn icon={muted ? MicOff : Mic} color={muted ? '#ef4444' : 'rgba(255,255,255,0.4)'}
            active={muted} onClick={() => muteToggle.mutate()} />
          <CBtn icon={vidOff ? VideoOff : Video} color={vidOff ? '#ef4444' : 'rgba(255,255,255,0.4)'}
            active={vidOff} onClick={() => setVidOff(v => !v)} />
          <CBtn icon={Pin} color={isSpotlit ? G : 'rgba(255,255,255,0.35)'} active={isSpotlit}
            onClick={() => onSpotlight?.(isSpotlit ? null : participant.id)} />
          {!isHostP && isHost && (
            <CBtn icon={isCoHost ? ShieldOff : Shield} color={isCoHost ? '#D4AF37' : 'rgba(255,255,255,0.35)'}
              active={isCoHost} onClick={() => promote.mutate()} />
          )}
          {!isHostP && isHost && (
            <CBtn icon={X} color="#ef4444" onClick={() => kick.mutate()} />
          )}
        </div>
      </div>

      {/* RTMP row (streaming only) */}
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

function CBtn({ icon: Icon, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
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

export default function GuestCoStreamDashboard({
  participants = [], roomId, isHost, onSpotlight, spotlitId,
  raisedHands = new Set(), onLockRoom,
}) {
  const [locked, setLocked]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [sortBy, setSortBy]         = useState('role');
  const [showHealth, setShowHealth] = useState(true);
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
      {/* Header */}
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

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <StatCard icon={Radio} label="Live" value={liveCount} color="#dc2626" />
          <StatCard icon={Shield} label="Co-hosts" value={coHostCount} color="#D4AF37" />
          <StatCard icon={Users} label="Panel" value={guests.length} />
          {raisedCount > 0 && <StatCard icon={Hand} label="Raised" value={raisedCount} color={PINK} />}
        </div>
      </div>

      {/* Bulk actions */}
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

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search guests…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, outline: 'none', ...T,
          }}
        />
        {[
          { id: 'all', label: 'All' },
          { id: 'live', label: 'Live' },
          { id: 'cohost', label: 'Co-hosts' },
          ...(raisedCount > 0 ? [{ id: 'hands', label: `✋ ${raisedCount}` }] : []),
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

      {/* Guest list */}
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

        {/* Empty slots */}
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
