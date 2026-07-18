import React, { useState, useCallback } from 'react';
import {
  Video, Link2, Copy, Plus, Trash2, RefreshCw, Users, Settings,
  ExternalLink, Eye, EyeOff, Share2, Wifi, WifiOff, QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const BG    = '#07050A';
const GOLD  = '#C9A84C';
const BURG  = '#6B1F2A';
const GREEN = '#6DBF7E';
const DIM   = 'rgba(255,255,255,0.45)';
const T     = { fontFamily: 'Barlow Condensed, sans-serif' };

const BASE = 'https://vdo.ninja';

const GUEST_ROLES = [
  { id: 'guest',    label: 'Guest (Camera)',    desc: 'Standard video/audio guest' },
  { id: 'director', label: 'Director',          desc: 'Control room — no camera shown' },
  { id: 'view',     label: 'Viewer Only',       desc: 'Watch-only, no camera access' },
  { id: 'push',     label: 'Push (Screenshare)', desc: 'Share screen as source' },
];

const QUALITY_PRESETS = [
  { id: 'low',    label: '480p Low',    videoWidth: 640,  videoHeight: 480,  bitrate: 500  },
  { id: 'medium', label: '720p Medium', videoWidth: 1280, videoHeight: 720,  bitrate: 2000 },
  { id: 'high',   label: '1080p High',  videoWidth: 1920, videoHeight: 1080, bitrate: 4000 },
  { id: 'ultra',  label: '4K Ultra',   videoWidth: 3840, videoHeight: 2160, bitrate: 8000 },
];

const STORAGE_KEY = 'swl_vdo_sessions';

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveSessions(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function randomId(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

function buildGuestLink(roomId, options = {}) {
  const params = new URLSearchParams();
  if (options.quality) {
    const q = QUALITY_PRESETS.find(p => p.id === options.quality);
    if (q) {
      params.set('width', q.videoWidth);
      params.set('height', q.videoHeight);
      params.set('videobitrate', q.bitrate);
    }
  }
  if (options.noAudio) params.set('noaudio', '1');
  if (options.noVideo) params.set('novideo', '1');
  if (options.audioOnly) { params.set('novideo', '1'); }
  if (options.effects) params.set('effects', '1');
  if (options.record) params.set('record', '1');
  if (options.label) params.set('label', encodeURIComponent(options.label));
  if (options.muted) params.set('muted', '1');

  const paramStr = params.toString();
  const base = `${BASE}/?push=${roomId}`;
  return paramStr ? `${base}&${paramStr}` : base;
}

function buildViewLink(roomId, options = {}) {
  const params = new URLSearchParams();
  if (options.label) params.set('label', encodeURIComponent(options.label));
  const paramStr = params.toString();
  const base = `${BASE}/?view=${roomId}`;
  return paramStr ? `${base}&${paramStr}` : base;
}

function buildDirectorLink(roomId) {
  return `${BASE}/?director=${roomId}`;
}

function buildRoomLink(roomId) {
  return `${BASE}/?room=${roomId}`;
}

const inp = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.22)',
  color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

function GuestCard({ guest, roomId, onRemove, onUpdate }) {
  const [showOptions, setShowOptions] = useState(false);
  const guestLink = buildGuestLink(roomId, { quality: guest.quality, label: guest.name, muted: guest.muted, noAudio: guest.noAudio, effects: guest.effects });
  const viewLink = buildViewLink(guest.streamId || roomId, { label: guest.name });

  function copy(url) {
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => {});
  }

  return (
    <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: guest.connected ? GREEN : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
        <Video style={{ width: 14, height: 14, color: GOLD, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', ...T }}>{guest.name || 'Unnamed Guest'}</p>
          <p style={{ fontSize: 10, color: DIM, ...T }}>{GUEST_ROLES.find(r => r.id === guest.role)?.label || 'Guest'} · {QUALITY_PRESETS.find(q => q.id === guest.quality)?.label || '720p'}</p>
        </div>
        <button onClick={() => copy(guestLink)} title="Copy guest link" style={{ padding: '5px 10px', borderRadius: 6, background: `${GOLD}15`, border: `1px solid ${GOLD}35`, color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, ...T }}>
          <Copy style={{ width: 11, height: 11 }} /> Guest Link
        </button>
        <button onClick={() => setShowOptions(!showOptions)} style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: DIM, cursor: 'pointer' }}>
          <Settings style={{ width: 13, height: 13 }} />
        </button>
        <button onClick={onRemove} style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(107,31,42,0.08)', border: '1px solid rgba(107,31,42,0.2)', color: BURG, cursor: 'pointer' }}>
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Link preview */}
      <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, padding: '5px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', fontSize: 9, color: DIM, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {guestLink}
        </div>
        <button onClick={() => window.open(guestLink, '_blank')} title="Open guest link" style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: DIM, cursor: 'pointer' }}>
          <ExternalLink style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {showOptions && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 9, color: DIM, ...T }}>Guest Name (label)</label>
              <input value={guest.name} onChange={e => onUpdate({ ...guest, name: e.target.value })}
                placeholder="Guest label" style={{ ...inp, marginTop: 4, fontSize: 11 }} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: DIM, ...T }}>Quality</label>
              <select value={guest.quality} onChange={e => onUpdate({ ...guest, quality: e.target.value })}
                style={{ ...inp, marginTop: 4, fontSize: 11 }}>
                {QUALITY_PRESETS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { key: 'muted', label: '🔇 Start Muted' },
              { key: 'noVideo', label: '📵 Audio Only' },
              { key: 'effects', label: '✨ Video Effects' },
              { key: 'record', label: '🔴 Auto Record' },
            ].map(opt => (
              <button key={opt.key} onClick={() => onUpdate({ ...guest, [opt.key]: !guest[opt.key] })} style={{
                padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 10, fontWeight: 700, ...T,
                background: guest[opt.key] ? `${GOLD}20` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${guest[opt.key] ? GOLD + '50' : 'rgba(255,255,255,0.07)'}`,
                color: guest[opt.key] ? GOLD : DIM,
              }}>{opt.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => copy(guestLink)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, fontSize: 11, fontWeight: 800, ...T }}>
              📋 Copy Guest Link
            </button>
            <button onClick={() => copy(viewLink)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', background: 'rgba(109,191,126,0.08)', border: '1px solid rgba(109,191,126,0.25)', color: GREEN, fontSize: 11, fontWeight: 800, ...T }}>
              👁 Copy View Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VDONinjaManager() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [customRoomId, setCustomRoomId] = useState('');

  const activeSession = sessions.find(s => s.id === activeSessionId);

  function createSession() {
    const name = newSessionName.trim() || `Session ${sessions.length + 1}`;
    const roomId = customRoomId.trim() || randomId(8);
    const session = {
      id: Date.now().toString(36),
      name,
      roomId,
      guests: [],
      createdAt: Date.now(),
    };
    const updated = [...sessions, session];
    setSessions(updated);
    saveSessions(updated);
    setActiveSessionId(session.id);
    setNewSessionName('');
    setCustomRoomId('');
    toast.success(`Session "${name}" created.`);
  }

  function deleteSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (activeSessionId === id) setActiveSessionId(null);
  }

  function addGuest() {
    if (!activeSession) return;
    const guest = {
      id: Date.now().toString(36),
      name: `Guest ${(activeSession.guests?.length || 0) + 1}`,
      role: 'guest',
      quality: 'medium',
      streamId: randomId(6),
      muted: false,
      noVideo: false,
      effects: false,
      record: false,
      connected: false,
    };
    updateSession(activeSessionId, { guests: [...(activeSession.guests || []), guest] });
    toast.success('Guest slot added.');
  }

  function updateSession(id, patch) {
    const updated = sessions.map(s => s.id === id ? { ...s, ...patch } : s);
    setSessions(updated);
    saveSessions(updated);
  }

  function updateGuest(guestId, guestPatch) {
    if (!activeSession) return;
    const guests = activeSession.guests.map(g => g.id === guestId ? { ...g, ...guestPatch } : g);
    updateSession(activeSessionId, { guests });
  }

  function removeGuest(guestId) {
    if (!activeSession) return;
    const guests = activeSession.guests.filter(g => g.id !== guestId);
    updateSession(activeSessionId, { guests });
  }

  function copy(url) {
    navigator.clipboard.writeText(url).then(() => toast.success('Copied!')).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(12px)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Video style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, ...T }}>VDO.ninja Manager</h1>
          <p style={{ fontSize: 11, color: DIM, ...T }}>Generate and manage guest links for browser-based WebRTC streaming</p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px', display: 'flex', gap: 16 }}>

        {/* Left: Sessions list */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>New Session</p>
            <input value={newSessionName} onChange={e => setNewSessionName(e.target.value)}
              placeholder="Session name" style={{ ...inp, fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={customRoomId} onChange={e => setCustomRoomId(e.target.value)}
                placeholder="Room ID (auto)" style={{ ...inp, fontSize: 11, flex: 1 }} />
              <button onClick={() => setCustomRoomId(randomId(8))} title="Generate ID" style={{ padding: '7px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer' }}>
                <RefreshCw style={{ width: 12, height: 12 }} />
              </button>
            </div>
            <button onClick={createSession} style={{ padding: '8px 0', borderRadius: 8, cursor: 'pointer', background: `${GOLD}20`, border: `1px solid ${GOLD}50`, color: GOLD, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', ...T }}>
              <Plus style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} /> Create Session
            </button>
          </div>

          {sessions.map(s => (
            <button key={s.id} onClick={() => setActiveSessionId(s.id)} style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              background: activeSessionId === s.id ? `${GOLD}16` : 'rgba(13,6,24,0.8)',
              border: `1px solid ${activeSessionId === s.id ? GOLD + '45' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: activeSessionId === s.id ? GOLD : '#fff', ...T }}>{s.name}</p>
                <p style={{ fontSize: 9, color: DIM, ...T }}>Room: {s.roomId} · {s.guests?.length || 0} guests</p>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }} style={{ padding: '3px 5px', borderRadius: 5, background: 'rgba(107,31,42,0.08)', border: '1px solid rgba(107,31,42,0.15)', color: BURG, cursor: 'pointer' }}>
                <Trash2 style={{ width: 10, height: 10 }} />
              </button>
            </button>
          ))}

          {sessions.length === 0 && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px 0', ...T }}>
              No sessions yet. Create one above.
            </p>
          )}
        </div>

        {/* Right: Session detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeSession ? (
            <>
              {/* Session info */}
              <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(201,168,76,0.2)', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', ...T }}>{activeSession.name}</h2>
                    <p style={{ fontSize: 11, color: DIM, ...T }}>Room ID: <span style={{ color: GOLD, fontFamily: 'monospace' }}>{activeSession.roomId}</span></p>
                  </div>
                  <button onClick={addGuest} style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', background: `${GOLD}20`, border: `1px solid ${GOLD}50`, color: GOLD, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, ...T }}>
                    <Plus style={{ width: 12, height: 12 }} /> Add Guest
                  </button>
                </div>

                {/* Quick links */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Director Link', url: buildDirectorLink(activeSession.roomId), desc: 'Full control room', color: GOLD },
                    { label: 'Room Link', url: buildRoomLink(activeSession.roomId), desc: 'All guests in one room', color: GREEN },
                    { label: 'View Link', url: buildViewLink(activeSession.roomId), desc: 'Watch-only output', color: '#3B82F6' },
                  ].map(link => (
                    <div key={link.label} style={{ borderRadius: 9, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: link.color, ...T, marginBottom: 2 }}>{link.label}</p>
                      <p style={{ fontSize: 9, color: DIM, ...T, marginBottom: 8 }}>{link.desc}</p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => copy(link.url)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: DIM, fontSize: 9, fontWeight: 700, ...T }}>
                          Copy
                        </button>
                        <button onClick={() => window.open(link.url, '_blank')} style={{ padding: '5px 7px', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: DIM }}>
                          <ExternalLink style={{ width: 10, height: 10 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guest slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeSession.guests?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12, ...T }}>
                    No guest slots yet. Hit <strong style={{ color: GOLD }}>Add Guest</strong> to create one.
                  </div>
                )}
                {activeSession.guests?.map(guest => (
                  <GuestCard key={guest.id} guest={guest} roomId={activeSession.roomId}
                    onRemove={() => removeGuest(guest.id)}
                    onUpdate={g => updateGuest(guest.id, g)} />
                ))}
              </div>

              {/* VDO.ninja info */}
              <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: DIM, ...T }}>
                <strong style={{ color: GOLD }}>How it works:</strong> VDO.ninja is a free, browser-based WebRTC tool. Send the Guest Link to panelists — they open it in Chrome/Firefox, allow camera access, and their video appears in your OBS/studio via the View link or Director room. No downloads required.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 14, ...T }}>
              <Video style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.2 }} />
              Select or create a session to manage VDO.ninja guest links.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
