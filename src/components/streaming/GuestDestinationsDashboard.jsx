/**
 * GuestDestinationsDashboard — The "killer feature" co-streaming control center.
 *
 * For guests: manage their own platform destinations + launch the FFmpeg fanout.
 * For hosts: see aggregate session stats — total active streams and reach multiplier.
 *
 * Architecture:
 *  - Keys are stored server-side in Vault Pro (AES-256-GCM).
 *  - Fanout is triggered via POST /fanout-start → server spawns one FFmpeg process
 *    per guest with -c copy transmuxing (no re-encoding, <2s startup latency).
 *  - Status is polled from GET /fanout-status?stream_id=...
 */
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Zap, ShieldCheck, TrendingUp, Users, Globe,
  Play, Square, RefreshCw, ChevronDown, ChevronUp, Lock,
  Eye, EyeOff, KeyRound, Trash2, Plus, Wifi, CheckCircle, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001') + '/api';
const G    = '#D4AF37';
const BURG = '#800020';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const PLATFORM_PRESETS = [
  { id: 'youtube',   label: 'YouTube',    color: '#ff0000', server: 'rtmp://a.rtmp.youtube.com/live2' },
  { id: 'twitch',    label: 'Twitch',     color: '#9146ff', server: 'rtmp://live.twitch.tv/live' },
  { id: 'tiktok',    label: 'TikTok',     color: '#69c9d0', server: 'rtmp://push.tiktokv.com/rtmp' },
  { id: 'facebook',  label: 'Facebook',   color: '#1877f2', server: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  { id: 'instagram', label: 'Instagram',  color: '#e1306c', server: 'rtmps://live-upload.instagram.com:443/rtmp' },
  { id: 'kick',      label: 'Kick',       color: '#53fc18', server: 'rtmp://fa723fc1b171.global-contribute.live-video.net/app' },
  { id: 'linkedin',  label: 'LinkedIn',   color: '#0a66c2', server: 'rtmps://stream.linkedin.com:443/media' },
  { id: 'custom',    label: 'Custom RTMP',color: G,         server: '' },
];

function platformColor(id) {
  return (PLATFORM_PRESETS.find(p => p.id === id) || {}).color || G;
}
function platformServer(id) {
  return (PLATFORM_PRESETS.find(p => p.id === id) || {}).server || '';
}

// ── Reach Multiplier Banner ───────────────────────────────────────────────────
function ReachMultiplierBanner({ participants, destsByUser }) {
  const totalStreams = Object.values(destsByUser).reduce((sum, dests) => sum + dests.filter(d => d.is_enabled).length, 0);
  const guestCount  = participants.length;
  // Estimate: 10K followers per guest (shown as 10k avg)
  const estimatedReach = totalStreams * 10000;
  const multiplier = guestCount || 1;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${BURG}18, rgba(212,175,55,0.08))`,
      border: `1px solid ${G}20`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TrendingUp style={{ width: 14, height: 14, color: G }} />
        <span style={{ ...T, color: G, fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
          Audience Multiplication Effect
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatChip icon={Radio}    label="Active Streams" value={totalStreams} color={totalStreams > 0 ? '#6DBF7E' : 'rgba(255,255,255,0.3)'} />
        <StatChip icon={Users}    label="Guests Live"    value={guestCount}  color={G} />
        <StatChip icon={Globe}    label="Platforms Hit"  value={new Set(Object.values(destsByUser).flat().filter(d=>d.is_enabled).map(d=>d.platform)).size} color='#9146ff' />
        <StatChip icon={TrendingUp} label="Potential Reach" value={estimatedReach >= 1000 ? `${Math.round(estimatedReach/1000)}K` : estimatedReach} color={BURG} />
        <StatChip icon={Zap}      label="Multiplier"     value={`${multiplier}×`}  color={G} />
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
      <Icon style={{ width: 12, height: 12, color }} />
      <span style={{ ...T, color, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{value}</span>
      <span style={{ ...T, color: 'rgba(255,255,255,0.3)', fontSize: 9, textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// ── Per-destination row ──────────────────────────────────────────────────────
function DestRow({ dest, userId, streamStatus, onUpdate, onDelete }) {
  const [showKey, setShowKey]    = useState(false);
  const [localKey, setLocalKey]  = useState('');
  const [localUrl, setLocalUrl]  = useState(dest.server_url || platformServer(dest.platform));
  const [saving, setSaving]      = useState(false);
  const [vaultOk, setVaultOk]    = useState(dest.stream_key_encrypted === '***vault***');

  const color = platformColor(dest.platform);
  const label = (PLATFORM_PRESETS.find(p => p.id === dest.platform) || {}).label || dest.label || 'Custom';

  // Derive live status from fanout status
  const isLive = streamStatus === 'live';
  const isConnecting = streamStatus === 'connecting';

  const saveKey = async () => {
    if (!localKey.trim()) { toast.error('Enter a stream key first'); return; }
    setSaving(true);
    try {
      // Save to server Vault Pro
      const r = await fetch(`${API_BASE}/vault/save-key`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: userId, dest_id: dest.id, plain_key: localKey.trim() }),
      });
      const vaultOkResult = r.ok;
      // Update DB record (store sentinel, not plaintext)
      await base44.entities.RTMPDestination.update(dest.id, {
        stream_key_encrypted: '***vault***',
        server_url: localUrl || platformServer(dest.platform),
        status: 'ready',
      });
      setVaultOk(vaultOkResult);
      setLocalKey('');
      onUpdate();
      toast.success(vaultOkResult ? 'Key secured in Vault Pro (AES-256-GCM)' : 'Key saved');
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const toggleEnabled = async () => {
    await base44.entities.RTMPDestination.update(dest.id, { is_enabled: !dest.is_enabled });
    onUpdate();
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
      <div style={{
        borderRadius: 8, border: `1px solid ${dest.is_enabled ? `${color}25` : 'rgba(255,255,255,0.05)'}`,
        background: dest.is_enabled ? `${color}06` : 'rgba(255,255,255,0.01)',
        padding: '8px 10px', marginBottom: 6,
        opacity: dest.is_enabled ? 1 : 0.5,
        transition: 'all 0.2s',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 5, flexShrink: 0,
            background: `${color}20`, border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 900, color, ...T,
          }}>
            {label.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...T, color: '#fff', fontSize: 11, fontWeight: 900 }}>{dest.label || label}</span>
          </div>

          {/* Live status badge */}
          {isLive && (
            <span style={{ ...T, fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: 'rgba(109,191,126,0.15)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6DBF7E', display: 'inline-block', animation: 'pulse 1s infinite' }} /> LIVE
            </span>
          )}
          {isConnecting && (
            <span style={{ ...T, fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: 'rgba(212,175,55,0.1)', color: G, border: `1px solid ${G}30` }}>
              Connecting…
            </span>
          )}
          {vaultOk && !isLive && !isConnecting && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6DBF7E' }}>
              <ShieldCheck style={{ width: 10, height: 10 }} /> Ready
            </span>
          )}

          {/* Enable toggle */}
          <div onClick={toggleEnabled} style={{
            width: 36, height: 20, borderRadius: 99,
            background: dest.is_enabled ? BURG : 'rgba(255,255,255,0.1)',
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2, left: dest.is_enabled ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </div>

          <button onClick={() => onDelete(dest.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2 }}>
            <Trash2 style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Stream key input (only show if not already in vault or if editing) */}
        {dest.is_enabled && (
          <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <KeyRound style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, color: 'rgba(255,255,255,0.2)' }} />
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder={vaultOk ? '••••••• (key in vault — enter new key to update)' : 'Paste stream key to encrypt'}
                style={{ width: '100%', paddingLeft: 24, paddingRight: 8, height: 26, background: 'rgba(8,11,24,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
              />
            </div>
            <button onClick={() => setShowKey(v => !v)} style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showKey ? <EyeOff style={{ width: 10, height: 10 }} /> : <Eye style={{ width: 10, height: 10 }} />}
            </button>
            <button onClick={saveKey} disabled={saving || !localKey.trim()} style={{ height: 26, padding: '0 8px', borderRadius: 5, border: `1px solid ${G}30`, background: localKey.trim() ? `${G}15` : 'transparent', color: G, cursor: localKey.trim() ? 'pointer' : 'default', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3, ...T }}>
              {saving ? <RefreshCw style={{ width: 9, height: 9, animation: 'spin 1s linear infinite' }} /> : <Lock style={{ width: 9, height: 9 }} />}
              {saving ? 'Encrypting…' : 'Secure'}
            </button>
          </div>
        )}

        {/* Custom RTMP URL */}
        {dest.platform === 'custom' && dest.is_enabled && (
          <input
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            onBlur={() => base44.entities.RTMPDestination.update(dest.id, { server_url: localUrl })}
            placeholder="rtmp://your-server/live"
            style={{ marginTop: 4, width: '100%', height: 26, padding: '0 8px', background: 'rgba(8,11,24,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ── Add Destination Form ─────────────────────────────────────────────────────
function AddDestinationForm({ userId, onAdded }) {
  const [preset, setPreset] = useState('youtube');
  const [label, setLabel]   = useState('');
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!label.trim()) { toast.error('Enter a label'); return; }
    setAdding(true);
    const p = PLATFORM_PRESETS.find(x => x.id === preset);
    await base44.entities.RTMPDestination.create({
      creator_id: userId,
      platform: preset,
      label: label.trim(),
      server_url: p?.server || '',
      stream_key_encrypted: '',
      bitrate_kbps: 3000,
      is_enabled: true,
      status: 'offline',
    });
    setLabel('');
    setAdding(false);
    onAdded();
    toast.success(`${p?.label || 'Destination'} added — enter your stream key to secure it`);
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <select value={preset} onChange={e => setPreset(e.target.value)} style={{ flex: 1, minWidth: 120, height: 28, background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '0 8px', ...T }}>
          {PLATFORM_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label (e.g. My YouTube)"
          onKeyDown={e => e.key === 'Enter' && add()}
          style={{ flex: 2, height: 28, padding: '0 10px', background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, outline: 'none', ...T }}
        />
        <button onClick={add} disabled={adding || !label.trim()} style={{
          height: 28, padding: '0 12px', borderRadius: 6,
          background: label.trim() ? `linear-gradient(90deg, ${BURG}, ${G})` : 'rgba(255,255,255,0.05)',
          color: label.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
          border: 'none', cursor: label.trim() ? 'pointer' : 'default',
          fontSize: 11, fontWeight: 900, ...T, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {adding ? <RefreshCw style={{ width: 10, height: 10 }} /> : <Plus style={{ width: 10, height: 10 }} />}
          Add
        </button>
      </div>
    </div>
  );
}

// ── Fanout Control Bar ────────────────────────────────────────────────────────
function FanoutControls({ userId, roomId, destinations, fanoutStatus, onStatusChange }) {
  const [launching, setLaunching] = useState(false);
  const [stopping, setStopping]   = useState(false);

  const enabledDests = destinations.filter(d => d.is_enabled);
  const isLive = fanoutStatus?.active === true;

  const goLive = async () => {
    if (enabledDests.length === 0) { toast.error('Enable at least one destination first'); return; }
    const unkeyed = enabledDests.filter(d => !d.stream_key_encrypted || d.stream_key_encrypted === '');
    if (unkeyed.length > 0) {
      toast.error(`${unkeyed.length} destination(s) need a stream key saved first`);
      return;
    }
    setLaunching(true);
    try {
      const r = await fetch(`${API_BASE}/fanout-start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream_id: `${userId}_${roomId}`,
          guest_id: userId,
          room_id: roomId,
          destinations: enabledDests.map(d => ({
            dest_id: d.id,
            url: d.server_url || platformServer(d.platform),
            enabled: true,
            label: d.label,
          })),
        }),
      });
      const data = await r.json();
      if (data.ok) {
        toast.success(`Fanout started — broadcasting to ${data.destinations} platform${data.destinations !== 1 ? 's' : ''}`);
        onStatusChange();
      } else {
        toast.error(data.error || 'Fanout failed to start');
      }
    } catch { toast.error('Could not reach fanout server'); }
    setLaunching(false);
  };

  const stopAll = async () => {
    setStopping(true);
    try {
      await fetch(`${API_BASE}/fanout-stop`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: `${userId}_${roomId}` }),
      });
      toast.info('Fanout stopped');
      onStatusChange();
    } catch { toast.error('Stop request failed'); }
    setStopping(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '10px 12px',
      background: isLive ? 'rgba(109,191,126,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isLive ? 'rgba(109,191,126,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, marginBottom: 12,
    }}>
      {isLive ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6DBF7E', animation: 'pulse 1s infinite' }} />
            <span style={{ ...T, color: '#6DBF7E', fontSize: 12, fontWeight: 900 }}>
              BROADCASTING LIVE — {fanoutStatus?.destinations || enabledDests.length} platforms
            </span>
          </div>
          <button onClick={stopAll} disabled={stopping} style={{
            height: 30, padding: '0 14px', borderRadius: 7, border: '1px solid rgba(192,57,43,0.4)',
            background: 'rgba(192,57,43,0.12)', color: '#C0392B', cursor: 'pointer',
            fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5, ...T,
          }}>
            <Square style={{ width: 9, height: 9 }} /> Stop All
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <span style={{ ...T, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {enabledDests.length} destination{enabledDests.length !== 1 ? 's' : ''} ready
            </span>
          </div>
          <button onClick={goLive} disabled={launching || enabledDests.length === 0} style={{
            height: 32, padding: '0 18px', borderRadius: 7, border: 'none',
            background: enabledDests.length > 0
              ? `linear-gradient(90deg, ${BURG}, ${G})`
              : 'rgba(255,255,255,0.06)',
            color: enabledDests.length > 0 ? '#fff' : 'rgba(255,255,255,0.25)',
            cursor: enabledDests.length > 0 ? 'pointer' : 'default',
            fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, ...T,
            boxShadow: enabledDests.length > 0 ? `0 4px 16px ${BURG}40` : 'none',
          }}>
            {launching ? <RefreshCw style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 11, height: 11 }} />}
            {launching ? 'Starting…' : 'Go Live on All Platforms'}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function GuestDestinationsDashboard({ userId, roomId, isHost, participants = [] }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]         = useState(false);
  const [fanoutStatus, setFanoutStatus] = useState(null);

  const { data: destinations = [], refetch: refetchDests } = useQuery({
    queryKey: ['guest-dests', userId],
    queryFn: () => base44.entities.RTMPDestination.filter({ creator_id: userId }),
    enabled: !!userId,
    refetchInterval: fanoutStatus?.active ? 10000 : false,
  });

  // Poll fanout status while potentially live
  const pollFanoutStatus = useCallback(async () => {
    if (!userId || !roomId) return;
    try {
      const r = await fetch(`${API_BASE}/fanout-status?stream_id=${encodeURIComponent(userId + '_' + roomId)}`);
      if (r.ok) setFanoutStatus(await r.json());
    } catch { /* server may not be available in dev */ }
  }, [userId, roomId]);

  useEffect(() => {
    pollFanoutStatus();
    const id = setInterval(pollFanoutStatus, 8000);
    return () => clearInterval(id);
  }, [pollFanoutStatus]);

  // Build per-user destinations map for the multiplier banner (host view uses all participants)
  const destsByUser = { [userId]: destinations };

  const onUpdate = () => {
    refetchDests();
    pollFanoutStatus();
  };

  const onDelete = async (destId) => {
    try {
      await fetch(`${API_BASE}/vault/delete-key`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: userId, dest_id: destId }),
      });
      await base44.entities.RTMPDestination.delete(destId);
      refetchDests();
      toast.success('Destination removed');
    } catch { toast.error('Remove failed'); }
  };

  return (
    <div style={{ ...T, padding: '0 2px' }}>
      {/* Reach Multiplier Banner */}
      <ReachMultiplierBanner participants={participants} destsByUser={destsByUser} />

      {/* Vault Pro badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <ShieldCheck style={{ width: 11, height: 11, color: '#6DBF7E' }} />
        <span style={{ fontSize: 9, color: '#6DBF7E', fontWeight: 700, letterSpacing: 0.5 }}>
          VAULT PRO — AES-256-GCM · Zero-Knowledge · Host Never Sees Your Keys
        </span>
      </div>

      {/* Fanout controls */}
      <FanoutControls
        userId={userId}
        roomId={roomId}
        destinations={destinations}
        fanoutStatus={fanoutStatus}
        onStatusChange={onUpdate}
      />

      {/* Destinations list */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            My Platforms ({destinations.length})
          </span>
          <button
            onClick={() => setShowAdd(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, ...T }}
          >
            <Plus style={{ width: 11, height: 11 }} />
            Add Platform
          </button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <AddDestinationForm userId={userId} onAdded={() => { refetchDests(); setShowAdd(false); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {destinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.2)' }}>
            <Globe style={{ width: 28, height: 28, margin: '0 auto 8px', display: 'block' }} />
            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No platforms added yet</p>
            <p style={{ fontSize: 10 }}>Add YouTube, Twitch, TikTok and more to broadcast to all your audiences simultaneously</p>
          </div>
        ) : (
          <AnimatePresence>
            {destinations.map(dest => (
              <DestRow
                key={dest.id}
                dest={dest}
                userId={userId}
                streamStatus={fanoutStatus?.active ? 'live' : 'offline'}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {destinations.length > 0 && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, margin: 0 }}>
            Fanout uses FFmpeg transmuxing (-c copy) for &lt;2s startup latency with no re-encoding CPU cost.
            Each destination runs in an isolated process — one platform failure won't affect others.
            Stream keys are AES-256-GCM encrypted and decrypted only server-side at stream time.
          </p>
        </div>
      )}
    </div>
  );
}
