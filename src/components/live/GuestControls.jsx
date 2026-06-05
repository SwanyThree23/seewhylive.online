import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Users, Mic, MicOff, Video, VideoOff, Shield, ShieldOff,
  Trash2, Radio, Signal, Eye, EyeOff, Pin, Hand,
  ChevronDown, ChevronUp, Zap, Crown, Volume2, VolumeX,
  MoreVertical, X, UserCheck, AlertCircle,
} from 'lucide-react';

const G       = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

function qualityDot(health) {
  if (!health || health === 'offline') return '#555';
  if (health === 'excellent') return '#22c55e';
  if (health === 'good')      return G;
  if (health === 'warning')   return '#f59e0b';
  return '#ef4444';
}

function useGuestHealth(id, isStreaming) {
  const [h, setH] = useState('offline');
  const ref = useRef(null);
  useEffect(() => {
    if (!isStreaming) { setH('offline'); return; }
    const qualities = ['excellent','excellent','good','good','good','warning'];
    const tick = () => setH(qualities[Math.floor(Math.random() * qualities.length)]);
    tick();
    ref.current = setInterval(tick, 5000);
    return () => clearInterval(ref.current);
  }, [id, isStreaming]);
  return h;
}

function GuestRow({ guest, isHost, roomId, onSpotlight, spotlitId, raisedHands = new Set() }) {
  const [expanded, setExpanded] = useState(false);
  const [volume, setVolume]     = useState(100);
  const [muted, setMuted]       = useState(guest.is_muted || false);
  const [vidOff, setVidOff]     = useState(false);
  const [hidden, setHidden]     = useState(false);
  const health = useGuestHealth(guest.id, guest.is_streaming);
  const qc = useQueryClient();
  const isRaised  = raisedHands.has(guest.user_id);
  const isCoHost  = guest.role === 'co-host';
  const isHostP   = guest.role === 'host';
  const isSpotlit = spotlitId === guest.id;

  const promote = useMutation({
    mutationFn: () => base44.entities.Participant.update(guest.id, {
      role: isCoHost ? 'guest' : 'co-host',
    }),
    onSuccess: () => {
      toast.success(`${guest.user_name} ${isCoHost ? 'demoted to Guest' : 'promoted to Co-host'}`);
      qc.invalidateQueries(['participants', roomId]);
    },
  });

  const muteRemote = useMutation({
    mutationFn: () => base44.entities.Participant.update(guest.id, { is_muted: !muted }),
    onSuccess: () => setMuted(m => !m),
  });

  const kick = useMutation({
    mutationFn: () => base44.entities.Participant.update(guest.id, { status: 'removed' }),
    onSuccess: () => { toast.info(`${guest.user_name} removed`); qc.invalidateQueries(['participants', roomId]); },
  });

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: isSpotlit ? `${G}06` : 'transparent',
      transition: 'background 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        {/* Avatar + quality dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: `linear-gradient(135deg, ${isHostP ? '#5a4000' : isCoHost ? '#003050' : CRIMSON}, #0d0614)`,
            border: `1.5px solid ${isHostP ? G : isCoHost ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: isHostP ? G : isCoHost ? '#D4AF37' : '#fff', ...T,
          }}>
            {guest.user_avatar
              ? <img src={guest.user_avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : (guest.user_name || '?')[0].toUpperCase()}
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 8, height: 8, borderRadius: '50%',
            background: qualityDot(health), border: '1.5px solid #0d0614',
          }} />
        </div>

        {/* Name + role + raised hand */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {isHostP && <Crown style={{ width: 9, height: 9, color: G, flexShrink: 0 }} />}
            {isCoHost && <Shield style={{ width: 9, height: 9, color: '#D4AF37', flexShrink: 0 }} />}
            <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {guest.user_name || 'Guest'}
            </span>
            {isRaised && <span style={{ fontSize: 10 }}>✋</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{ ...T, color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'capitalize' }}>
              {guest.role}
            </span>
            {guest.is_streaming && (
              <span style={{ ...T, color: '#dc2626', fontSize: 9, fontWeight: 900 }}>· LIVE</span>
            )}
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: qualityDot(health), flexShrink: 0 }} />
          </div>
        </div>

        {/* Quick controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {/* Mute */}
          <IcoBtn icon={muted ? MicOff : Mic} color={muted ? '#ef4444' : 'rgba(255,255,255,0.5)'}
            active={muted} onClick={() => muteRemote.mutate()} title={muted ? 'Unmute' : 'Mute'} />

          {/* Video */}
          <IcoBtn icon={vidOff ? VideoOff : Video} color={vidOff ? '#ef4444' : 'rgba(255,255,255,0.5)'}
            active={vidOff} onClick={() => setVidOff(v => !v)} title={vidOff ? 'Show video' : 'Hide video'} />

          {/* Spotlight */}
          <IcoBtn icon={Pin} color={isSpotlit ? G : 'rgba(255,255,255,0.4)'} active={isSpotlit}
            onClick={() => onSpotlight?.(isSpotlit ? null : guest.id)} title={isSpotlit ? 'Un-spotlight' : 'Spotlight'} />

          {/* Expand */}
          <IcoBtn icon={expanded ? ChevronUp : ChevronDown} color="rgba(255,255,255,0.3)"
            onClick={() => setExpanded(v => !v)} title="More options" />
        </div>
      </div>

      {/* Expanded controls */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '6px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Volume slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Volume2 style={{ width: 10, height: 10, color: G, flexShrink: 0 }} />
                <input type="range" min="0" max="100" value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  style={{ flex: 1, accentColor: G, height: 3 }} />
                <span style={{ ...T, color: G, fontSize: 10, fontWeight: 900, minWidth: 28, textAlign: 'right' }}>
                  {volume}%
                </span>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {!isHostP && (
                  <ActionBtn
                    icon={isCoHost ? ShieldOff : Shield}
                    label={isCoHost ? 'Demote' : 'Co-host'}
                    color={isCoHost ? '#ef4444' : '#D4AF37'}
                    onClick={() => promote.mutate()}
                    loading={promote.isPending}
                  />
                )}
                <ActionBtn
                  icon={hidden ? Eye : EyeOff}
                  label={hidden ? 'Show' : 'Hide'}
                  color="rgba(255,255,255,0.5)"
                  onClick={() => setHidden(v => !v)}
                />
                <ActionBtn icon={Radio} label="RTMP" color={G} onClick={() => {}} />
                {!isHostP && (
                  <ActionBtn icon={X} label="Kick" color="#ef4444" danger
                    onClick={() => kick.mutate()} loading={kick.isPending} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IcoBtn({ icon: Icon, color, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 24, height: 24, background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 5, cursor: 'pointer', color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: 11, height: 11 }} />
    </button>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick, loading, danger }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 5, cursor: loading ? 'wait' : 'pointer',
      background: danger ? 'rgba(239,68,68,0.1)' : `${color}10`,
      border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : color + '30'}`,
      color: danger ? '#ef4444' : color, fontSize: 10, fontWeight: 900, ...T,
      opacity: loading ? 0.5 : 1,
    }}>
      <Icon style={{ width: 9, height: 9 }} />
      {label}
    </button>
  );
}

export default function GuestControls({
  participants = [], onMuteGuest, onRemoveGuest, roomId, isHost,
  onSpotlight, spotlitId, raisedHands = new Set(),
}) {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter]     = useState('all'); // 'all' | 'live' | 'cohost'
  const qc = useQueryClient();

  const filtered = participants.filter(p => {
    if (filter === 'live')   return p.is_streaming;
    if (filter === 'cohost') return p.role === 'co-host' || p.role === 'host';
    return true;
  });

  const liveCount   = participants.filter(p => p.is_streaming).length;
  const coHostCount = participants.filter(p => p.role === 'co-host').length;
  const raisedCount = raisedHands.size;

  const muteAll = () => {
    participants.forEach(p => {
      base44.entities.Participant.update(p.id, { is_muted: true }).catch(() => {});
      onMuteGuest?.(p.id);
    });
    toast.info('All guests muted');
  };

  const unmuteAll = () => {
    participants.forEach(p => {
      base44.entities.Participant.update(p.id, { is_muted: false }).catch(() => {});
    });
    toast.success('All guests unmuted');
  };

  return (
    <div style={{
      background: 'rgba(13,6,24,0.96)', border: `1px solid ${G}15`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Users style={{ width: 14, height: 14, color: G }} />
          <span style={{ ...T, color: '#fff', fontSize: 12, fontWeight: 900 }}>Guest Controls</span>
          {/* Badges */}
          <span style={{ background: CRIMSON, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 6px', ...T }}>
            {participants.length}
          </span>
          {liveCount > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: 20, padding: '2px 6px', ...T }}>
              {liveCount} LIVE
            </span>
          )}
          {raisedCount > 0 && (
            <span style={{ background: `${G}25`, color: G, fontSize: 9, fontWeight: 900, borderRadius: 20, padding: '2px 6px', ...T, border: `1px solid ${G}40` }}>
              ✋{raisedCount}
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
          : <ChevronDown style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Bulk ops */}
            {isHost && participants.length > 0 && (
              <div style={{ display: 'flex', gap: 5, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <button onClick={muteAll} style={{
                  ...T, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', fontSize: 10, fontWeight: 900, borderRadius: 6, padding: '5px 0', cursor: 'pointer',
                }}>
                  <MicOff style={{ width: 9, height: 9 }} /> Mute All
                </button>
                <button onClick={unmuteAll} style={{
                  ...T, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  color: '#22c55e', fontSize: 10, fontWeight: 900, borderRadius: 6, padding: '5px 0', cursor: 'pointer',
                }}>
                  <Mic style={{ width: 9, height: 9 }} /> Unmute All
                </button>
              </div>
            )}

            {/* Filter tabs */}
            {participants.length > 0 && (
              <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                  { id: 'all', label: `All (${participants.length})` },
                  { id: 'live', label: `Live (${liveCount})` },
                  { id: 'cohost', label: `Co-hosts (${coHostCount})` },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    ...T, fontSize: 9, padding: '3px 7px', borderRadius: 5, cursor: 'pointer',
                    background: filter === f.id ? `${G}18` : 'rgba(255,255,255,0.04)',
                    color: filter === f.id ? G : 'rgba(255,255,255,0.35)',
                    border: filter === f.id ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.07)',
                    fontWeight: 900,
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Guest list */}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', ...T, fontSize: 11 }}>
                  {participants.length === 0 ? 'No guests on stage yet' : 'No guests match filter'}
                </div>
              ) : (
                filtered.map(guest => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    isHost={isHost}
                    roomId={roomId}
                    onSpotlight={onSpotlight}
                    spotlitId={spotlitId}
                    raisedHands={raisedHands}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
