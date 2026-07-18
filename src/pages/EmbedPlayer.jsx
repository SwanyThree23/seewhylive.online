/**
 * EmbedPlayer — Cross-Platform Embeddable Stream Viewer
 * Route:  /EmbedPlayer?roomId={roomId}&embed=1
 * Embed:  <iframe src="https://seewhylive.online/EmbedPlayer?roomId=...&embed=1" ...>
 *
 * 120-Second Golden Paywall
 * ──────────────────────────
 * Viewers get a free 120-second preview.
 * - At t=90s  a golden warning bar fades in (30-second countdown).
 * - At t=120s the Golden Paywall overlay fires: video blurs, CTA appears.
 * Bypass: add ?noPaywall=1 (creator preview) or ?paywallSec=N (custom trigger).
 *
 * "Powered by SeeWhy LIVE" attribution drives Viral Flywheel downloads.
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';

const VPS_HLS_BASE = 'https://srv1581658.hstgr.cloud/hls';
const APP_URL      = 'https://seewhylive.online';
const WARNING_LEAD = 30;   // seconds before paywall that warning bar appears

const C = {
  bg:     '#07050A',
  bg2:    '#0D0A08',
  gold:   '#C9A84C',
  goldL:  '#E8C96A',
  goldD:  '#8A6F2E',
  ruby:   '#8B1A2F',
  rubyL:  '#B22340',
  text:   '#F0E8D4',
  textD:  '#C4B596',
  textM:  '#8A7A62',
  slate:  '#2A2418',
  slate2: '#1E1A0E',
  green:  '#6DBF7E',
  amber:  '#D4854A',
};

export default function EmbedPlayer() {
  var params      = new URLSearchParams(window.location.search);
  var roomId      = params.get('roomId') || params.get('room') || 'live';
  var isEmbed     = params.get('embed') === '1';
  var noPaywall   = params.get('noPaywall') === '1';
  var paywallSec  = parseInt(params.get('paywallSec') || '120', 10) || 120;
  var warnAt      = paywallSec - WARNING_LEAD;

  var hlsUrl   = VPS_HLS_BASE + '/' + roomId + '/index.m3u8';
  var watchUrl = APP_URL + '/EmbedPlayer?roomId=' + encodeURIComponent(roomId);
  var appDlUrl = APP_URL + createPageUrl('GoLive');

  var [status,        setStatus]        = useState('loading');
  var [viewers,       setViewers]       = useState(0);
  var [playSeconds,   setPlaySeconds]   = useState(0);   // per-second when playing
  var [paywallActive, setPaywallActive] = useState(false);
  var [dismissed,     setDismissed]     = useState(false); // viewer dismissed via app CTA
  var tickRef   = useRef(0);  // viewer update every 5 ticks
  var videoRef  = useRef(null);
  var tickTimer = useRef(null);

  // ── Real viewer count from Room entity ────────────────────────────────────
  useEffect(function() {
    if (!roomId || roomId === 'live') return;
    function fetchViewers() {
      base44.entities.Room.filter({ id: roomId })
        .then(function(rooms) { if (rooms?.[0]?.viewer_count != null) setViewers(rooms[0].viewer_count); })
        .catch(function() {});
    }
    fetchViewers();
    var iv = setInterval(fetchViewers, 30000);
    return function() { clearInterval(iv); };
  }, [roomId]);

  // ── Video setup ────────────────────────────────────────────────────────────
  useEffect(function() {
    var v = videoRef.current;
    if (!v) return;
    v.src = hlsUrl;
    v.onloadeddata = function() { setStatus('playing'); };
    v.onplaying    = function() { setStatus('playing'); };
    v.onerror      = function() { setStatus('error'); };
    v.onwaiting    = function() { setStatus('loading'); };
    v.onended      = function() { setStatus('ended'); };
    v.play().catch(function() { setStatus('error'); });
    return function() { v.pause(); v.src = ''; };
  }, [roomId]);

  // ── Per-second tick — viewer count + paywall counter ─────────────────────
  useEffect(function() {
    tickTimer.current = setInterval(function() {
      tickRef.current += 1;

      if (status !== 'playing' || noPaywall) return;

      setPlaySeconds(function(s) {
        var next = s + 1;
        if (next >= paywallSec && !paywallActive) {
          setPaywallActive(true);
          // Mute video; don't fully stop so blur stays live
          if (videoRef.current) {
            videoRef.current.volume = 0;
          }
        }
        return next;
      });
    }, 1000);
    return function() { clearInterval(tickTimer.current); };
  }, [status, noPaywall, paywallSec, paywallActive]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  var warningActive  = !noPaywall && playSeconds >= warnAt && !paywallActive;
  var warningRemain  = paywallSec - playSeconds;
  var warningPct     = Math.min(100, Math.floor(((playSeconds - warnAt) / WARNING_LEAD) * 100));
  var isLocked       = paywallActive && !dismissed;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { display: none; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes fadein  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes goldpulse {
          0%,100% { box-shadow: 0 0 0 0 ${C.gold}60; }
          50%     { box-shadow: 0 0 0 12px ${C.gold}00; }
        }
        @keyframes lockbounce {
          0%,100%{ transform: scale(1); }
          50%    { transform: scale(1.12); }
        }
      `}</style>

      {/* ── Stream area ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#000',
        minHeight: isEmbed ? '100vh' : '56.25vw',
        maxHeight: isEmbed ? '100vh' : '56.25vw',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* Video element — blurs behind paywall */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          controls={!isEmbed && !isLocked}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: status === 'error' ? 'none' : 'block',
            transition: 'filter 0.8s ease, opacity 0.8s ease',
            filter:   isLocked ? 'blur(14px) brightness(0.25) saturate(0.4)' : 'none',
            opacity:  isLocked ? 0.6 : 1,
          }}
        />

        {/* ── Loading overlay ──────────────────────────────────────────── */}
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.88)',
          }}>
            <div style={{
              width: 48, height: 48,
              border: `3px solid ${C.slate}`,
              borderTop: `3px solid ${C.gold}`,
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
              marginBottom: 16,
            }} />
            <p style={{ color: C.textM, fontSize: 13 }}>Connecting to stream…</p>
          </div>
        )}

        {/* ── Error overlay ────────────────────────────────────────────── */}
        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.92)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <p style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Stream Offline</p>
            <p style={{ color: C.textM, fontSize: 13, marginBottom: 16, maxWidth: 280, lineHeight: 1.5 }}>
              Room <strong style={{ color: C.gold }}>{roomId}</strong> is not currently live.
            </p>
            <p style={{ color: C.textM, fontSize: 10, fontStyle: 'italic' }}>
              HLS requires Safari/iOS or a browser with native HLS support.
            </p>
          </div>
        )}

        {/* ── Ended overlay ────────────────────────────────────────────── */}
        {status === 'ended' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.88)',
          }}>
            <p style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Stream Ended</p>
            <p style={{ color: C.textM, fontSize: 13 }}>Thanks for watching!</p>
          </div>
        )}

        {/* ── Live badge + viewers (top-left) ─────────────────────────── */}
        {status === 'playing' && !isLocked && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', gap: 8, alignItems: 'center',
            animation: 'fadein 0.4s ease',
          }}>
            <div style={{
              background: C.ruby, borderRadius: 4, padding: '3px 8px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.4s ease infinite' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>LIVE</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '3px 8px', color: C.textM, fontSize: 11 }}>
              👁 {viewers.toLocaleString()}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '3px 8px', color: C.textM, fontSize: 11, fontFamily: 'monospace' }}>
              {fmtTime(playSeconds)}
            </div>
            {noPaywall && (
              <div style={{ background: C.goldD, borderRadius: 4, padding: '3px 8px', color: C.bg, fontSize: 10, fontWeight: 700 }}>
                CREATOR PREVIEW
              </div>
            )}
          </div>
        )}

        {/* ── Room ID (top-right) ──────────────────────────────────────── */}
        {!isLocked && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 4, padding: '3px 10px',
            color: C.textM, fontSize: 10,
          }}>
            {roomId}
          </div>
        )}

        {/* ── "Powered by SeeWhy LIVE" attribution ────────────────────── */}
        {!isLocked && (
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              position: 'absolute', bottom: isEmbed ? 8 : 52, left: 12,
              background: 'rgba(0,0,0,0.72)',
              borderRadius: 6, padding: '5px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
              textDecoration: 'none',
              border: `1px solid ${C.gold}40`,
            }}
          >
            <span style={{ color: C.gold, fontWeight: 900, fontSize: 11, letterSpacing: 0.5 }}>SEE WHY LIVE</span>
            <span style={{ color: C.textM, fontSize: 9 }}>Powered by</span>
          </a>
        )}

        {/* ── Watch on App CTA (bottom-right, embed mode only) ────────── */}
        {isEmbed && !isLocked && (
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              position: 'absolute', bottom: 8, right: 12,
              background: C.ruby, borderRadius: 6, padding: '5px 12px',
              color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none',
            }}
          >
            Watch on App ↗
          </a>
        )}

        {/* ── 30-second Warning Bar ───────────────────────────────────── */}
        {warningActive && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.82)',
            borderTop: `1px solid ${C.goldD}`,
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadein 0.5s ease',
          }}>
            {/* Progress bar fill */}
            <div style={{ flex: 1, height: 4, background: C.slate, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: warningPct + '%',
                height: '100%',
                background: `linear-gradient(90deg, ${C.gold}, ${C.amber})`,
                borderRadius: 99,
                transition: 'width 1s linear',
                backgroundSize: '200px 100%',
                animation: 'shimmer 2s linear infinite',
              }} />
            </div>
            <span style={{ color: C.gold, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
              🔒 Free preview ends in {warningRemain}s
            </span>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                background: C.gold, color: C.bg,
                borderRadius: 4, padding: '4px 10px',
                fontWeight: 700, fontSize: 11, textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Watch Free →
            </a>
          </div>
        )}

        {/* ══ GOLDEN PAYWALL OVERLAY ══════════════════════════════════════ */}
        {isLocked && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg, rgba(7,5,10,0.97) 0%, rgba(20,15,5,0.97) 60%, rgba(30,22,8,0.97) 100%)',
            padding: 24, textAlign: 'center',
            animation: 'fadein 0.6s ease',
            zIndex: 20,
          }}>

            {/* Golden shimmer border */}
            <div style={{
              position: 'absolute', inset: 0,
              border: `2px solid transparent`,
              borderRadius: 0,
              background: `linear-gradient(${C.bg}, ${C.bg}) padding-box,
                           linear-gradient(135deg, ${C.gold}, ${C.amber}, ${C.gold}) border-box`,
              pointerEvents: 'none',
            }} />

            {/* Lock icon */}
            <div style={{
              width: 72, height: 72,
              background: `radial-gradient(circle, ${C.goldD}55 0%, transparent 70%)`,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              animation: 'goldpulse 2.5s ease infinite',
            }}>
              <span style={{ fontSize: 36, animation: 'lockbounce 3s ease infinite' }}>🔒</span>
            </div>

            {/* Heading */}
            <p style={{
              color: C.gold,
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: 1,
              marginBottom: 6,
              textShadow: `0 0 20px ${C.gold}55`,
            }}>
              GOLDEN ACCESS
            </p>
            <p style={{
              color: C.textD,
              fontSize: 14,
              marginBottom: 6,
              lineHeight: 1.5,
              maxWidth: 320,
            }}>
              Your 2-minute free preview has ended.
            </p>
            <p style={{
              color: C.textM,
              fontSize: 12,
              marginBottom: 28,
              maxWidth: 300,
              lineHeight: 1.5,
            }}>
              This stream is live on <strong style={{ color: C.gold }}>SeeWhy LIVE</strong> — where creators keep 90% of every dollar.
            </p>

            {/* Primary CTA */}
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                background: `linear-gradient(135deg, ${C.gold} 0%, ${C.amber} 100%)`,
                color: C.bg,
                borderRadius: 10,
                padding: '14px 32px',
                fontWeight: 900,
                fontSize: 15,
                textDecoration: 'none',
                marginBottom: 12,
                width: '100%',
                maxWidth: 300,
                letterSpacing: 0.5,
                boxShadow: `0 4px 20px ${C.gold}44`,
                animation: 'goldpulse 2.5s ease infinite',
              }}
            >
              Watch Free — Get the App ↗
            </a>

            {/* Secondary CTA */}
            <a
              href={APP_URL + '/Monetization'}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                background: 'transparent',
                color: C.gold,
                borderRadius: 10,
                padding: '12px 32px',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                border: `1px solid ${C.goldD}`,
                marginBottom: 20,
                width: '100%',
                maxWidth: 300,
              }}
            >
              🎟 Get Creator Pass
            </a>

            {/* Sign in line */}
            <p style={{ color: C.textM, fontSize: 11, marginBottom: 20 }}>
              Already have access?{' '}
              <a href={APP_URL} target="_blank" rel="noreferrer" style={{ color: C.amber, textDecoration: 'none', fontWeight: 600 }}>
                Sign in →
              </a>
            </p>

            {/* Divider */}
            <div style={{ width: '100%', maxWidth: 300, height: 1, background: C.slate, marginBottom: 20 }} />

            {/* Attribution */}
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <p style={{ color: C.gold, fontWeight: 900, fontSize: 13, letterSpacing: 1, marginBottom: 3 }}>
                SEE WHY LIVE
              </p>
              <p style={{ color: C.textM, fontSize: 10 }}>
                Live streaming • Creator economy • 90/10 revenue split
              </p>
            </a>

            {/* Room info */}
            <p style={{ color: C.slate, fontSize: 10, marginTop: 16, fontFamily: 'monospace' }}>
              room: {roomId}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer bar (full-page view only) ──────────────────────────────── */}
      {!isEmbed && (
        <div style={{
          background: C.bg2,
          borderTop: `1px solid ${C.slate}`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <p style={{ color: C.gold, fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>SEE WHY LIVE</p>
            <p style={{ color: C.textM, fontSize: 12, marginTop: 2 }}>
              Live streaming • Creator economy • 90/10 revenue split
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                background: C.gold, color: C.bg,
                borderRadius: 6, padding: '8px 18px',
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}
            >
              Start Creating →
            </a>
            <button
              onClick={function() {
                navigator.clipboard?.writeText(watchUrl).catch(function(){});
                alert('Watch link copied!');
              }}
              style={{
                background: C.slate, color: C.textM,
                border: 'none', borderRadius: 6,
                padding: '8px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
              }}
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
