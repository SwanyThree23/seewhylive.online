import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const BG      = '#080B18';

const GLOBAL_CSS = `
@keyframes live-pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes wave{0%,100%{transform:scaleY(0.4);}50%{transform:scaleY(1);}}
@keyframes fade-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.live-dot{animation:live-pulse 1.1s ease infinite;}
.wave-bar{animation:wave 1.2s ease infinite;}
.fade-in{animation:fade-in .4s ease forwards;}
`;

const BARS = [0.4, 0.7, 1.0, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.75];

function AudioWave({ active, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
      {BARS.map((h, i) => (
        <div key={i} className={active ? 'wave-bar' : ''} style={{
          width: 3, borderRadius: 2,
          background: color || GOLD,
          height: `${h * 100}%`,
          animationDelay: `${i * 0.09}s`,
          opacity: active ? 1 : 0.25,
        }} />
      ))}
    </div>
  );
}

function LiveBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 900, padding: '3px 10px',
      borderRadius: 999, background: CRIMSON, color: '#fff',
      fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em',
    }}>
      <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
      LIVE
    </span>
  );
}

export default function EmbedPage() {
  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [muted, setMuted]       = useState(true);
  const [error, setError]       = useState(false);
  const videoRef                = useRef(null);

  const roomId = new URLSearchParams(window.location.search).get('room');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    // Remove default body margin for clean embed
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = BG;
    return () => {
      document.head.removeChild(style);
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    if (!roomId) { setError(true); setLoading(false); return; }
    base44.entities.Room.filter({ id: roomId })
      .then(rooms => {
        if (rooms && rooms.length > 0) setRoom(rooms[0]);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [roomId]);

  // Attempt HLS playback — fallback gracefully if stream not active
  useEffect(() => {
    if (!room || !videoRef.current) return;
    const hlsUrl = `https://seewhylive.online:8888/${roomId}/index.m3u8`;
    const vid = videoRef.current;
    vid.src = hlsUrl;
    vid.muted = muted;
    vid.play().catch(() => { /* stream may not be active — show placeholder */ });
  }, [room, roomId]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const isLive = room?.status === 'live';

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `3px solid rgba(212,175,55,0.2)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 40 }}>📡</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Stream not found</div>
        <AttributionBadge />
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: BG, position: 'relative', overflow: 'hidden' }}>
      {/* Video element — tries HLS; shows gradient bg when stream offline */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        loop={false}
        muted={muted}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
        onError={() => { /* stream not reachable — gradient fallback is visible below */ }}
      />

      {/* Gradient fallback (always visible behind video) */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse at 30% 40%, ${CRIMSON}55 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(0,50,100,0.4) 0%, transparent 60%), linear-gradient(135deg, #0D0A1A, #080B18)`,
      }}>
        {/* Ambient audio wave — shown when stream is "live" */}
        {isLive && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `linear-gradient(135deg, ${CRIMSON}, #a0002a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${CRIMSON}66`, fontSize: 32,
              }}>🎙️</div>
              <AudioWave active={isLive} color={GOLD} />
            </div>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '10px 12px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive ? <LiveBadge /> : (
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', fontWeight: 700 }}>
              {room.status === 'scheduled' ? 'UPCOMING' : 'ENDED'}
            </span>
          )}
          {room.viewer_count > 0 && (
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              👁 {room.viewer_count.toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={() => setMuted(m => !m)}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Bottom info */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '24px 12px 12px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
      }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '0.03em', marginBottom: 2, lineHeight: 1.2 }}>
          {room.title}
        </div>
        {room.host_id && (
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            by {room.host_id.slice(0, 12)}…
          </div>
        )}
        <AttributionBadge />
      </div>
    </div>
  );
}

function AttributionBadge() {
  return (
    <a
      href="https://seewhylive.online"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', color: 'rgba(212,175,55,0.7)',
        textDecoration: 'none', padding: '4px 10px',
        background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 999,
      }}
    >
      ▶ Powered by SeeWhy LIVE
    </a>
  );
}
