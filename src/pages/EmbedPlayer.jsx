/**
 * EmbedPlayer — Cross-Platform Embeddable Stream Viewer
 * Route:  /EmbedPlayer?roomId={roomId}&embed=1
 * Embed:  <iframe src="https://seewhylive.online/EmbedPlayer?roomId=...&embed=1" ...>
 *
 * Serves the live HLS stream from the VPS.
 * Designed to work inside iframes on Instagram, Facebook, Twitter/X, Discord, etc.
 * "Powered by SeeWhy LIVE" attribution drives viral Flywheel downloads.
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '../utils';

const VPS_HLS_BASE = 'https://srv1581658.hstgr.cloud/hls';
const APP_URL      = 'https://seewhylive.online';

const C = {
  bg:    '#07050A',
  bg2:   '#0D0A08',
  gold:  '#C9A84C',
  ruby:  '#8B1A2F',
  text:  '#F0E8D4',
  textM: '#8A7A62',
  slate: '#2A2418',
  green: '#2ECC71',
  amber: '#D4854A',
};

export default function EmbedPlayer() {
  var params   = new URLSearchParams(window.location.search);
  var roomId   = params.get('roomId') || params.get('room') || 'live';
  var isEmbed  = params.get('embed') === '1';
  var hlsUrl   = VPS_HLS_BASE + '/' + roomId + '/index.m3u8';
  var watchUrl = APP_URL + '/EmbedPlayer?roomId=' + roomId;
  var appUrl   = createPageUrl('GoLive');

  var [status,  setStatus]  = useState('loading');
  var [viewers, setViewers] = useState(Math.floor(Math.random() * 120) + 40);
  var [elapsed, setElapsed] = useState(0);
  var videoRef = useRef(null);
  var timerRef = useRef(null);

  useEffect(function() {
    var v = videoRef.current;
    if (!v) return;

    v.src = hlsUrl;

    v.onloadeddata = function() { setStatus('playing'); };
    v.onplaying    = function() { setStatus('playing'); };
    v.onerror      = function() { setStatus('error'); };
    v.onwaiting    = function() { setStatus('loading'); };
    v.onended      = function() { setStatus('ended'); };

    v.play().catch(function() {
      setStatus('error');
    });

    return function() {
      v.pause();
      v.src = '';
    };
  }, [roomId]);

  useEffect(function() {
    timerRef.current = setInterval(function() {
      setViewers(function(n) { return Math.max(1, n + Math.floor(Math.random() * 9) - 4); });
      setElapsed(function(s) { return s + 1; });
    }, 5000);
    return function() { clearInterval(timerRef.current); };
  }, []);

  function fmtElapsed(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadein { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* Stream area */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#000',
        minHeight: isEmbed ? '100vh' : '60vw',
        maxHeight: isEmbed ? '100vh' : '56.25vw',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          controls={!isEmbed}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: status === 'error' ? 'none' : 'block',
          }}
        />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            animation: 'fadein 0.4s ease',
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
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.90)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <p style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Stream Offline</p>
            <p style={{ color: C.textM, fontSize: 13, marginBottom: 16, maxWidth: 280 }}>
              Room <strong style={{ color: C.gold }}>{roomId}</strong> is not currently live.
              Check back when the creator goes live.
            </p>
            <p style={{ color: C.textM, fontSize: 11 }}>
              HLS: <span style={{ color: C.amber, fontFamily: 'monospace', fontSize: 10 }}>{hlsUrl}</span>
            </p>
            <p style={{ color: C.textM, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
              Note: HLS playback requires Safari/iOS or a browser with HLS support.
            </p>
          </div>
        )}

        {/* Ended state */}
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

        {/* Live badge + viewers (top-left overlay) */}
        {status === 'playing' && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', gap: 8, alignItems: 'center',
            animation: 'fadein 0.4s ease',
          }}>
            <div style={{
              background: C.ruby,
              borderRadius: 4,
              padding: '3px 8px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#fff',
                animation: 'pulse 1.4s ease infinite',
              }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>LIVE</span>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.65)',
              borderRadius: 4, padding: '3px 8px',
              color: C.textM, fontSize: 11,
            }}>
              👁 {viewers.toLocaleString()}
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.65)',
              borderRadius: 4, padding: '3px 8px',
              color: C.textM, fontSize: 11, fontFamily: 'monospace',
            }}>
              {fmtElapsed(elapsed)}
            </div>
          </div>
        )}

        {/* Room ID badge (top-right) */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 4, padding: '3px 10px',
          color: C.textM, fontSize: 10,
        }}>
          {roomId}
        </div>

        {/* "Powered by SeeWhy LIVE" attribution (bottom-left) */}
        <a
          href={APP_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            position: 'absolute', bottom: isEmbed ? 8 : 48, left: 12,
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

        {/* Watch on App CTA (bottom-right) — shown when embedded */}
        {isEmbed && (
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              position: 'absolute', bottom: 8, right: 12,
              background: C.ruby,
              borderRadius: 6, padding: '5px 12px',
              color: '#fff', fontWeight: 700, fontSize: 11,
              textDecoration: 'none',
            }}
          >
            Watch on App ↗
          </a>
        )}
      </div>

      {/* Footer bar — shown when NOT embedded (full page view) */}
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
            <p style={{ color: C.gold, fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>
              SEE WHY LIVE
            </p>
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
                fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
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
