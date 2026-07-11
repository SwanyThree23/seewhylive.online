import { useState, useEffect, useRef, useCallback } from "react";
import SwanyBotWidget from '../components/guide/ARIAWidget';
import NotificationBell from '../components/shared/NotificationBell';
import GlobalSearch from '../components/shared/GlobalSearch';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import BroadcastAnalyticsDashboard from '../components/analytics/BroadcastAnalyticsDashboard';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import StreamScheduler from '../components/live/StreamScheduler';

const BG   = '#080B18';
const BG2  = 'rgba(13,6,24,0.95)';
const GOLD  = '#D4AF37';
const GOLDD = '#8A6F2E';
const SLATE = '#1A1530';
const TEXT  = '#F0EAF8';
const TEXTD = '#B8AECF';
const TEXTM = '#7A6E8A';
const GREEN = '#6DBF7E';
const RED   = '#C0392B';
const CYAN  = '#D4AF37';
const PURPLE = '#7B5DA6';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'Space Mono, monospace' };

const OCT = 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)';

const VDO_ROOM = 'sw_thrrj4';
const MEDIAMTX_API = 'https://seewhylive.online:9997';

const DESTINATIONS = [
  { key: 'youtube',  label: 'YouTube',  color: '#ff0000', icon: '▶' },
  { key: 'twitch',   label: 'Twitch',   color: '#9146ff', icon: '🎮' },
  { key: 'facebook', label: 'Facebook', color: '#1877f2', icon: 'f' },
  { key: 'kick',     label: 'Kick',     color: '#53fc18', icon: '⚡' },
];

const INITIAL_ROOMS = [
  { id: 1, name: 'State vs State Main Stage', host: 'SwanyThree', status: 'live', viewers: 247, category: 'Tournament' },
  { id: 2, name: 'PK Battle Arena #1',        host: 'BigBoneEarl', status: 'live', viewers: 89, category: 'PK Battle' },
  { id: 3, name: 'Practice Lounge',           host: 'SwanyThree', status: 'idle', viewers: 0, category: 'Practice' },
  { id: 4, name: 'Watch Party — Classics',    host: 'SwanyThree', status: 'scheduled', viewers: 0, category: 'Watch Party' },
];

const GLOBAL_CSS = `
@keyframes pulse-live{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes rec-blink{0%,100%{opacity:1;}50%{opacity:.2;}}
.live-dot{animation:pulse-live 1.1s ease infinite;}
.rec-dot{animation:rec-blink 0.8s ease infinite;}
.room-card{animation:fadeUp .3s ease forwards;}
`;

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function Toggle({ value, onChange, color }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: value ? (color || GOLD) : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        width: 18, height: 18, borderRadius: 9,
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

function StatusBadge({ status }) {
  const conf = status === 'live'
    ? { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', color: GREEN, label: 'LIVE' }
    : status === 'scheduled'
    ? { bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)', color: CYAN, label: 'SOON' }
    : { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: TEXTM, label: 'IDLE' };
  return (
    <span style={{
      ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
      background: conf.bg, border: `1px solid ${conf.border}`, borderRadius: 999,
      padding: '3px 8px', color: conf.color, display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {status === 'live' && <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN }} />}
      {conf.label}
    </span>
  );
}

export default function RoomsManager() {
  const [rooms]             = useState(INITIAL_ROOMS);
  const [selectedRoom, setSelectedRoom]   = useState(null);
  const [recording, setRecording]         = useState(false);
  const [recSecs, setRecSecs]             = useState(0);
  const [destinations, setDestinations]   = useState({ youtube: false, twitch: false, facebook: false, kick: false });
  const [recordings, setRecordings]       = useState([]);
  const [mtxStatus, setMtxStatus]         = useState(null);
  const [activeTab, setActiveTab]         = useState('rooms');
  const recTimerRef = useRef(null);
  const recBytesRef = useRef(0);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // MediaMTX status poll (every 15s)
  useEffect(() => {
    async function fetchMtx() {
      try {
        const res = await fetch(`${MEDIAMTX_API}/v3/paths/list`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) { const d = await res.json(); setMtxStatus(d); }
      } catch { /* MediaMTX may not be reachable from browser — normal */ }
    }
    fetchMtx();
    const id = setInterval(fetchMtx, 15000);
    return () => clearInterval(id);
  }, []);

  function startRecording() {
    setRecording(true);
    setRecSecs(0);
    recBytesRef.current = 0;
    recTimerRef.current = setInterval(() => {
      setRecSecs(s => s + 1);
      recBytesRef.current += Math.floor(Math.random() * 800000 + 400000); // ~400-1200 KB/s estimate
    }, 1000);
  }

  function stopRecording() {
    clearInterval(recTimerRef.current);
    setRecording(false);
    const durationSecs = recSecs;
    if (durationSecs > 0) {
      const now = new Date();
      setRecordings(prev => [...prev, {
        id: Date.now(),
        name: `Recording ${now.toLocaleTimeString()}`,
        duration: formatTime(durationSecs),
        size: formatBytes(recBytesRef.current),
        date: now.toLocaleDateString(),
        room: selectedRoom?.name || 'Unknown Room',
      }]);
    }
    setRecSecs(0);
  }

  useEffect(() => { return () => clearInterval(recTimerRef.current); }, []);

  function toggleDest(key) {
    setDestinations(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const TABS = [
    { key: 'rooms',   label: 'Rooms' },
    { key: 'stream',  label: 'Stream' },
    { key: 'vdo',     label: 'VDO.Ninja' },
    { key: 'library', label: 'Recordings' },
    { key: 'infra',   label: 'Infra' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: BG2, borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${CRIMSON}, #a0002a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📡</div>
        <div>
          <div style={{ ...T, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: '0.08em', lineHeight: 1 }}>ROOMS MANAGER</div>
          <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginTop: 2 }}>STREAM CONTROL · RECORDING · MULTI-DESTINATION</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${SLATE}`, background: BG2, flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...T, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              background: 'none', color: activeTab === tab.key ? GOLD : TEXTM,
              borderBottom: `2px solid ${activeTab === tab.key ? GOLD : 'transparent'}`,
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>

        {/* ── ROOMS TAB ── */}
        {activeTab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rooms.map(room => (
              <div key={room.id} className="room-card" style={{
                background: BG2, border: `1px solid ${selectedRoom?.id === room.id ? GOLD : 'rgba(212,175,55,0.1)'}`,
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }} onClick={() => setSelectedRoom(room)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <StatusBadge status={room.status} />
                      <span style={{ ...MONO, fontSize: 9, color: PURPLE, letterSpacing: '0.08em', background: 'rgba(123,93,166,0.1)', border: '1px solid rgba(123,93,166,0.2)', borderRadius: 999, padding: '2px 8px' }}>{room.category}</span>
                    </div>
                    <div style={{ ...T, fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: '0.04em', lineHeight: 1.2, marginBottom: 4 }}>{room.name}</div>
                    <div style={{ ...MONO, fontSize: 10, color: TEXTM }}>Host: {room.host} {room.viewers > 0 ? `· ${room.viewers} viewers` : ''}</div>
                  </div>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: room.status === 'live' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${room.status === 'live' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>
                    {room.status === 'live' ? '🔴' : room.status === 'scheduled' ? '🕐' : '⚫'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STREAM TAB ── */}
        {activeTab === 'stream' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Recording */}
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '16px' }}>
              <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 14 }}>RECORDING</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  style={{
                    ...T, fontSize: 16, fontWeight: 800, letterSpacing: '0.06em',
                    background: recording ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.15)',
                    border: `1px solid ${recording ? RED : GOLD}`,
                    borderRadius: 10, padding: '10px 24px',
                    color: recording ? RED : GOLD, cursor: 'pointer',
                  }}
                >
                  {recording ? '⏹ STOP REC' : '⏺ START REC'}
                </button>
                {recording && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="rec-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: RED }} />
                    <span style={{ ...MONO, fontSize: 14, color: RED, letterSpacing: '0.06em' }}>{formatTime(recSecs)}</span>
                    <span style={{ ...MONO, fontSize: 10, color: TEXTM, letterSpacing: '0.06em' }}>~{formatBytes(recBytesRef.current)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Multi-destination */}
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, padding: '16px' }}>
              <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 14 }}>MULTI-DESTINATION STREAMING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DESTINATIONS.map(dest => (
                  <div key={dest.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${destinations[dest.key] ? dest.color + '44' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: dest.color + '22', border: `1px solid ${dest.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dest.color, fontSize: 14, fontWeight: 700 }}>{dest.icon}</div>
                      <div>
                        <div style={{ ...T, fontSize: 16, fontWeight: 700, color: TEXT }}>{dest.label}</div>
                        <div style={{ ...MONO, fontSize: 9, color: destinations[dest.key] ? GREEN : TEXTM }}>{destinations[dest.key] ? 'STREAMING' : 'OFF'}</div>
                      </div>
                    </div>
                    <Toggle value={destinations[dest.key]} onChange={() => toggleDest(dest.key)} color={dest.color} />
                  </div>
                ))}
              </div>
              <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.06em', marginTop: 12 }}>
                Configure RTMP keys in Stream Setup. Multi-stream via MediaMTX fanout.
              </div>
            </div>
          </div>
        )}

        {/* ── VDO.NINJA TAB ── */}
        {activeTab === 'vdo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: BG2, border: `1px solid rgba(212,175,55,0.12)`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${SLATE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ ...T, fontSize: 16, fontWeight: 700, color: TEXT }}>VDO.Ninja Room</div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTM, marginTop: 2 }}>Room: {VDO_ROOM}</div>
                </div>
                <a
                  href={`https://vdo.ninja/?room=${VDO_ROOM}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...MONO, fontSize: 10, color: CYAN, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, padding: '5px 12px', textDecoration: 'none', letterSpacing: '0.08em' }}
                >
                  OPEN ↗
                </a>
              </div>
              <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                <iframe
                  src={`https://vdo.ninja/?room=${VDO_ROOM}&view`}
                  title="VDO.Ninja Co-Host Room"
                  allow="camera;microphone;fullscreen;display-capture;autoplay"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
            <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ ...T, fontSize: 14, fontWeight: 700, color: CYAN, marginBottom: 6 }}>Guest Invite Link</div>
              <div style={{ ...MONO, fontSize: 11, color: TEXTD, wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                {`https://vdo.ninja/?room=${VDO_ROOM}&push`}
              </div>
              <div style={{ ...MONO, fontSize: 9, color: TEXTM, marginTop: 8 }}>Share with co-hosts to join your live session as guest participants</div>
            </div>
          </div>
        )}

        {/* ── RECORDINGS LIBRARY ── */}
        {activeTab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recordings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📼</div>
                <div style={{ ...T, fontSize: 18, fontWeight: 700, color: TEXTD, marginBottom: 8 }}>No recordings yet</div>
                <div style={{ ...MONO, fontSize: 11, color: TEXTM }}>Start a recording from the Stream tab</div>
              </div>
            ) : recordings.map(rec => (
              <div key={rec.id} style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(128,0,32,0.2)', border: '1px solid rgba(128,0,32,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📹</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...T, fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{rec.name}</div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTM }}>{rec.room} · {rec.duration} · {rec.size} · {rec.date}</div>
                </div>
                <button
                  onClick={() => setRecordings(prev => prev.filter(r => r.id !== rec.id))}
                  style={{ ...MONO, fontSize: 10, color: RED, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.06em' }}
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── INFRA TAB ── */}
        {activeTab === 'infra' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)', borderRadius: 14, padding: '16px' }}>
              <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 14 }}>MEDIAMTX STATUS</div>
              {mtxStatus ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
                    <span style={{ ...MONO, fontSize: 11, color: GREEN }}>MediaMTX reachable</span>
                  </div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTD, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(mtxStatus, null, 2).slice(0, 800)}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEXTM }} />
                    <span style={{ ...MONO, fontSize: 11, color: TEXTM }}>MediaMTX API not reachable from browser (expected — server-side only)</span>
                  </div>
                  <div style={{ ...MONO, fontSize: 10, color: TEXTM }}>API endpoint: {MEDIAMTX_API}/v3/paths/list</div>
                </div>
              )}
            </div>
            <div style={{ background: BG2, border: '1px solid rgba(212,175,55,0.12)', borderRadius: 14, padding: '16px' }}>
              <div style={{ ...T, fontSize: 13, fontWeight: 700, color: TEXTM, letterSpacing: '0.1em', marginBottom: 14 }}>STREAM ENDPOINTS</div>
              {[
                { label: 'RTMP Ingest', value: 'rtmp://seewhylive.online/live' },
                { label: 'HLS Playback', value: 'https://seewhylive.online:8888/live/index.m3u8' },
                { label: 'VPS Health', value: 'https://srv1581658.hstgr.cloud:3001/api/health' },
                { label: 'VDO.Ninja Room', value: VDO_ROOM },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div style={{ ...MONO, fontSize: 9, color: TEXTM, letterSpacing: '0.1em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ ...MONO, fontSize: 11, color: TEXTD, background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
      <SwanyBotWidget />
      <NotificationBell />
      <GlobalSearch />
      <QuickActionPanel />
      <BroadcastAnalyticsDashboard />
      <SwanAIRecommendations roomId={null} currentLayout='rooms' viewerCount={0} />
      <StreamScheduler />
  );
}
