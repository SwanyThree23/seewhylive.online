import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import StreamHealthMonitor from '../components/streaming/StreamHealthMonitor';
import ViewerCount from '../components/live/ViewerCount';

// ── Brand constants ───────────────────────────────────────────────────────────
const GOLD    = '#D4AF37';
const GOLDD   = '#8A6F2E';
const CRIMSON = '#800020';
const BG      = '#080B18';
const T       = 'Barlow Condensed, sans-serif';
const MONO    = 'Space Mono, monospace';

const PREVIEW_SECS    = 120; // Golden Paywall preview window
const BLUR_START_SECS = 20;  // Begin blurring with this many seconds left
const MAX_BLUR_PX     = 18;

const GLOBAL_CSS = `
@keyframes live-pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes wave{0%,100%{transform:scaleY(0.4);}50%{transform:scaleY(1);}}
@keyframes fade-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes slide-up{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes gold-glow{0%,100%{box-shadow:0 0 10px rgba(212,175,55,.3);}50%{box-shadow:0 0 28px rgba(212,175,55,.8);}}
@keyframes timer-warn{0%,100%{color:${GOLD};}50%{color:#ff9800;}}
.live-dot{animation:live-pulse 1.1s ease infinite;}
.wave-bar{animation:wave 1.2s ease infinite;}
.fade-in{animation:fade-in .35s ease forwards;}
.slide-up{animation:slide-up .45s cubic-bezier(.25,.46,.45,.94) forwards;}
.gold-glow{animation:gold-glow 2s ease infinite;}
.timer-warn{animation:timer-warn .8s ease infinite;}
`;

const BARS = [0.4, 0.7, 1.0, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.75];
const PAY_METHODS = ['Stripe', 'PayPal', 'CashApp', 'Venmo'];

// ── Sub-components ────────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: T, fontSize: 10, fontWeight: 900,
      padding: '3px 10px', borderRadius: 999,
      background: CRIMSON, color: '#fff', letterSpacing: '0.1em',
    }}>
      <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
      LIVE
    </span>
  );
}

function AudioWave({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
      {BARS.map((h, i) => (
        <div key={i} className={active ? 'wave-bar' : ''} style={{
          width: 3, borderRadius: 2, background: GOLD,
          height: `${h * 100}%`,
          animationDelay: `${i * 0.09}s`,
          opacity: active ? 1 : 0.25,
        }} />
      ))}
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
        fontFamily: T, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', color: 'rgba(212,175,55,0.7)',
        textDecoration: 'none', padding: '4px 10px',
        background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 999,
      }}
    >
      ▶ Powered by SeeWhy LIVE
    </a>
  );
}

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmbedPage() {
  const params   = new URLSearchParams(window.location.search);
  const roomId   = params.get('room');
  const priceOTP = parseFloat(params.get('price') || '4.99');
  const priceSub = parseFloat(params.get('sub')   || '9.99');

  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  // Playback state
  const [muted, setMuted]       = useState(true);
  const videoRef                = useRef(null);

  // Golden Paywall state
  const [timeLeft, setTimeLeft]       = useState(PREVIEW_SECS);
  const [paywallLocked, setPaywallLocked] = useState(false);
  const [extended, setExtended]       = useState(false);
  const [blurPx, setBlurPx]           = useState(0);
  const [selectedMethod, setMethod]   = useState(null);

  // ── Styles injected once ──────────────────────────────────────────────────
  useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = GLOBAL_CSS;
    document.head.appendChild(tag);
    document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;background:#080B18;';
    return () => {
      document.head.removeChild(tag);
      document.body.style.cssText = '';
    };
  }, []);

  // ── Room fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) { setError(true); setLoading(false); return; }
    base44.entities.Room.filter({ id: roomId })
      .then(rooms => {
        if (rooms?.length) setRoom(rooms[0]);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [roomId]);

  // ── HLS playback ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!room || !videoRef.current) return;
    const vid = videoRef.current;
    vid.src = `https://seewhylive.online:8888/${roomId}/index.m3u8`;
    vid.muted = muted;
    vid.play().catch(() => {});
  }, [room, roomId]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // ── 120-second Golden Paywall countdown ──────────────────────────────────
  useEffect(() => {
    if (paywallLocked) return;
    const tid = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        // Ramp up blur in the final BLUR_START_SECS seconds
        if (next <= BLUR_START_SECS && next > 0) {
          setBlurPx(((BLUR_START_SECS - next) / BLUR_START_SECS) * MAX_BLUR_PX);
        }
        if (next <= 0) {
          clearInterval(tid);
          setBlurPx(MAX_BLUR_PX);
          setPaywallLocked(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tid);
  }, [paywallLocked]);

  function extend15() {
    setExtended(true);
    setTimeLeft(t => t + 15);
  }

  // Preview progress: how much of the bar is "consumed"
  const progressPct = ((PREVIEW_SECS - timeLeft) / PREVIEW_SECS) * 100;
  const isLive      = room?.status === 'live';
  const nearEnd     = timeLeft <= 30 && !paywallLocked;
  const creatorChar = (room?.host_id || 'S').charAt(0).toUpperCase();

  // ── Loading / Error screens ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(212,175,55,.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ fontSize: 40 }}>📡</div>
        <div style={{ fontFamily: T, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>Stream not found</div>
        <AttributionBadge />
      </div>
    );
  }

  // ── Main embed render ─────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', background: BG, position: 'relative', overflow: 'hidden' }}>

      {/* ── HLS video layer ── */}
      <video
        ref={videoRef}
        autoPlay playsInline muted={muted}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 1,
          filter: `blur(${blurPx}px)`,
          transition: 'filter .6s ease',
        }}
      />

      {/* ── Gradient fallback (always behind video) ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        filter: `blur(${blurPx}px)`,
        transition: 'filter .6s ease',
        background: `
          radial-gradient(ellipse at 30% 40%, ${CRIMSON}55 0%, transparent 60%),
          radial-gradient(ellipse at 70% 60%, rgba(0,50,100,.4) 0%, transparent 60%),
          linear-gradient(135deg, #0D0A1A, #080B18)`,
      }}>
        {isLive && !paywallLocked && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `linear-gradient(135deg, ${CRIMSON}, #a0002a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${CRIMSON}66`, fontSize: 32,
              }}>🎙️</div>
              <AudioWave active={isLive} />
            </div>
          </div>
        )}
      </div>

      {/* ── Top bar ── */}
      {!paywallLocked && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '10px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,.75) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive ? <LiveBadge /> : (
              <span style={{ fontFamily: T, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em' }}>
                {room.status === 'scheduled' ? 'UPCOMING' : 'ENDED'}
              </span>
            )}
            {room.viewer_count > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
                👁 {room.viewer_count.toLocaleString()}
              </span>
            )}
          </div>
          {/* Preview timer badge — appears at 30 s */}
          {nearEnd && (
            <span className="timer-warn" style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
              padding: '3px 10px', borderRadius: 999,
              background: 'rgba(128,0,32,.5)', border: `1px solid ${CRIMSON}`,
              color: GOLD,
            }}>
              ⏱ PREVIEW {fmt(timeLeft)}
            </span>
          )}
          <button
            onClick={() => setMuted(m => !m)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.2)',
              color: '#fff', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      )}

      {/* ── Golden preview progress bar ── */}
      {!paywallLocked && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20, background: 'rgba(255,255,255,.08)' }}>
          <div style={{
            height: '100%',
            width: `${100 - progressPct}%`,  // shrinks left-to-right as time runs out
            background: nearEnd
              ? `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`
              : `linear-gradient(90deg, ${GOLD}, ${GOLDD})`,
            transition: 'width 1s linear, background .4s ease',
          }} />
        </div>
      )}

      {/* ── Bottom info strip (below video, above paywall) ── */}
      {!paywallLocked && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: '28px 12px 12px',
          background: 'linear-gradient(to top, rgba(0,0,0,.88) 0%, transparent 100%)',
        }}>
          <div style={{ fontFamily: T, fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '.03em', marginBottom: 2 }}>
            {room.title}
          </div>
          {room.host_id && (
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>
              {room.host_id.length > 14 ? room.host_id.slice(0, 14) + '…' : room.host_id}
            </div>
          )}
          <AttributionBadge />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          GOLDEN PAYWALL OVERLAY — slides up from bottom after 120 s
         ══════════════════════════════════════════════════════════════ */}
      {paywallLocked && (
        <div
          className="slide-up"
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            backdropFilter: 'blur(14px)',
            background: 'rgba(8,11,24,.88)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          {/* Faint gold radial in background */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 30%, rgba(212,175,55,.08) 0%, transparent 65%)`,
          }} />

          <div style={{
            position: 'relative',
            padding: '24px 18px 20px',
            background: 'linear-gradient(to top, rgba(8,11,24,.98) 60%, transparent 100%)',
            borderTop: `1px solid rgba(212,175,55,.18)`,
          }}>

            {/* Creator row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div className="gold-glow" style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T, fontSize: 22, fontWeight: 900, color: '#fff',
              }}>
                {creatorChar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T, fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '.04em' }}>
                  Continue watching
                </div>
                <div style={{ fontFamily: T, fontSize: 14, fontWeight: 700, color: GOLD, letterSpacing: '.04em', marginTop: 1 }}>
                  {room.title}
                </div>
              </div>
              {/* Lock icon */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(212,175,55,.1)', border: `1px solid rgba(212,175,55,.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                🔒
              </div>
            </div>

            {/* Preview expired notice */}
            <div style={{
              fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,.45)',
              letterSpacing: '.06em', marginBottom: 16, textAlign: 'center',
            }}>
              FREE PREVIEW ENDED · 120-SECOND WINDOW COMPLETE
            </div>

            {/* CTA buttons — One-time + Subscribe */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button style={{
                flex: 1, padding: '13px 0',
                borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${CRIMSON}, #a0002a)`,
                fontFamily: T, fontSize: 16, fontWeight: 900,
                color: GOLD, letterSpacing: '.06em',
                boxShadow: `0 4px 20px rgba(128,0,32,.4)`,
              }}>
                UNLOCK ${priceOTP.toFixed(2)}
                <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(212,175,55,.7)', letterSpacing: '.08em', marginTop: 2 }}>ONE-TIME ACCESS</div>
              </button>
              <button style={{
                flex: 1, padding: '13px 0',
                borderRadius: 12, border: `1px solid rgba(212,175,55,.35)`, cursor: 'pointer',
                background: `linear-gradient(135deg, rgba(212,175,55,.18), rgba(212,175,55,.06))`,
                fontFamily: T, fontSize: 16, fontWeight: 900,
                color: GOLD, letterSpacing: '.06em',
              }}>
                SUBSCRIBE ${priceSub.toFixed(2)}/mo
                <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(212,175,55,.7)', letterSpacing: '.08em', marginTop: 2 }}>UNLIMITED ACCESS</div>
              </button>
            </div>

            {/* Payment method selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', marginBottom: 8, textAlign: 'center' }}>
                PAY WITH
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {PAY_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m === selectedMethod ? null : m)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 8,
                      border: `1px solid ${selectedMethod === m ? GOLD : 'rgba(255,255,255,.12)'}`,
                      background: selectedMethod === m ? 'rgba(212,175,55,.15)' : 'rgba(255,255,255,.04)',
                      fontFamily: T, fontSize: 13, fontWeight: 700,
                      color: selectedMethod === m ? GOLD : 'rgba(255,255,255,.55)',
                      cursor: 'pointer', letterSpacing: '.04em',
                      transition: 'all .15s',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <a
                href="https://seewhylive.online/login"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,.35)', textDecoration: 'underline', letterSpacing: '.06em', cursor: 'pointer' }}
              >
                Already a member? Sign In
              </a>

              {/* "Watch 15s free" — single use */}
              {!extended && (
                <button
                  onClick={extend15}
                  style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    color: '#D4AF37', background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline', letterSpacing: '.06em',
                  }}
                >
                  Watch 15s more free →
                </button>
              )}
            </div>

            {/* Attribution — always visible even on paywall */}
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
              <AttributionBadge />
            </div>
          </div>
        </div>
      )}
      <StreamHealthMonitor isStreaming={true} />
      <ViewerCount count={room?.viewer_count || 0} peakViewers={room?.viewer_count || 0} />
    </div>
  );
}
