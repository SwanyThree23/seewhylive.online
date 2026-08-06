import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getSocket } from '../socket.js';
import rtcManager from '../webrtc.js';

var BG    = '#0E0C09';
var CARD  = '#1A1510';
var CARD2 = '#241C12';
var GOLD  = '#C9A84C';
var RED   = '#FF1A3C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var DIM   = '#2E2318';
var BORD  = 'rgba(255,255,255,.06)';

// Camera and screen-share are toggled — only one video source active at a time.
function DesktopStudioTab() {
  var liveState        = useState(false);
  var isLive           = liveState[0];
  var setIsLive        = liveState[1];

  var micState         = useState(true);
  var micOn            = micState[0];
  var setMicOn         = micState[1];

  var camState         = useState(false);
  var camOn            = camState[0];
  var setCamOn         = camState[1];

  var screenState      = useState(false);
  var screenOn         = screenState[0];
  var setScreenOn      = screenState[1];

  var statusState      = useState('idle');
  var status           = statusState[0];
  var setStatus        = statusState[1];

  var titleState       = useState('');
  var streamTitle      = titleState[0];
  var setStreamTitle   = titleState[1];

  var viewerState      = useState(0);
  var viewerCount      = viewerState[0];
  var setViewerCount   = viewerState[1];

  var errorState       = useState('');
  var error            = errorState[0];
  var setError         = errorState[1];

  var videoRef         = useRef(null);
  var socketRef        = useRef(null);
  var localStreamRef   = useRef(null);
  var screenStreamRef  = useRef(null);
  var uptimeRef        = useRef(null);
  var uptimeState      = useState(0);
  var uptime           = uptimeState[0];
  var setUptime        = uptimeState[1];

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(function() {
    var token   = localStorage.getItem('sw_token') || '';
    var userId  = localStorage.getItem('sw_user_id') || '';
    var username = localStorage.getItem('sw_username') || 'Host';
    var roomId  = localStorage.getItem('sw_room_id') || '';

    if (!token || !roomId) return;

    var socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', function() {
      socket.emit('join-room', { roomId: roomId, userId: userId, username: username, role: 'host', token: token });
      setStatus('connected');
    });

    socket.on('disconnect', function() {
      setStatus('idle');
    });

    socket.on('go-live-confirmed', function() {
      setIsLive(true);
      setStatus('live');
      var start = Date.now();
      uptimeRef.current = setInterval(function() {
        setUptime(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    });

    socket.on('viewer-count', function(data) {
      if (data && typeof data.count === 'number') setViewerCount(data.count);
    });

    socket.on('broadcast-ended', function() {
      stopLive();
    });

    return function() {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('go-live-confirmed');
      socket.off('viewer-count');
      socket.off('broadcast-ended');
    };
  }, []);

  // ── Camera helpers ────────────────────────────────────────────────────────
  var startCamera = useCallback(function() {
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
      .then(function(stream) {
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
        }
        setCamOn(true);
        setScreenOn(false);
        setError('');
      })
      .catch(function(err) {
        setError('Camera access denied: ' + err.message);
      });
  }, []);

  var stopCamera = useCallback(function() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      localStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  var startScreenShare = useCallback(function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError('Screen share not supported in this browser');
      return;
    }
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      .then(function(stream) {
        screenStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
        }
        // If already live, replace the video track in the transport
        if (isLive) {
          var newTrack = stream.getVideoTracks()[0];
          if (newTrack) rtcManager.replaceTrack('video', newTrack);
        }
        setScreenOn(true);
        setCamOn(false);
        stream.getVideoTracks()[0].addEventListener('ended', function() {
          stopScreenShare();
        });
      })
      .catch(function(err) {
        setError('Screen share failed: ' + err.message);
      });
  }, [isLive]);

  var stopScreenShare = useCallback(function() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScreenOn(false);
    // Switch back to camera if we had one
    startCamera();
  }, [startCamera]);

  var toggleMic = useCallback(function() {
    var stream = localStreamRef.current || screenStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(function(t) { t.enabled = !micOn; });
    if (isLive) {
      if (micOn) rtcManager.pauseProducer('audio');
      else rtcManager.resumeProducer('audio');
    }
    setMicOn(!micOn);
  }, [micOn, isLive]);

  // ── Go Live ───────────────────────────────────────────────────────────────
  var goLive = useCallback(function() {
    var socket = socketRef.current;
    if (!socket) { setError('Not connected to server'); return; }

    var stream = (screenOn && screenStreamRef.current)
      ? screenStreamRef.current
      : localStreamRef.current;

    if (!stream) { setError('Start camera or screen share first'); return; }

    var token   = localStorage.getItem('sw_token') || '';
    var userId  = localStorage.getItem('sw_user_id') || '';
    var roomId  = localStorage.getItem('sw_room_id') || '';

    setStatus('connecting');
    setError('');

    rtcManager.connect(socket, roomId, userId, 'host')
      .then(function() {
        return rtcManager.publishStream(stream);
      })
      .then(function() {
        socket.emit('go-live', { roomId: roomId, streamTitle: streamTitle || 'Live Stream', token: token });
      })
      .catch(function(err) {
        setStatus('connected');
        setError('Go live failed: ' + err.message);
      });
  }, [screenOn, streamTitle]);

  var stopLive = useCallback(function() {
    var socket = socketRef.current;
    var roomId = localStorage.getItem('sw_room_id') || '';

    if (uptimeRef.current) {
      clearInterval(uptimeRef.current);
      uptimeRef.current = null;
    }

    rtcManager.destroy();

    if (socket) socket.emit('end-broadcast', { roomId: roomId });

    setIsLive(false);
    setStatus('connected');
    setUptime(0);
  }, []);

  // ── Uptime formatter ──────────────────────────────────────────────────────
  function fmtTime(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    if (h > 0) return h + ':' + pad(m) + ':' + pad(s);
    return pad(m) + ':' + pad(s);
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // ── Render ────────────────────────────────────────────────────────────────
  var statusColor = isLive ? RED : status === 'connecting' ? GOLD : MUTED;
  var statusLabel = isLive ? 'LIVE' : status === 'connecting' ? 'STARTING…' : status === 'connected' ? 'READY' : 'OFFLINE';

  return React.createElement('div', {
    style: { background: BG, minHeight: '100vh', padding: '24px 32px', color: TEXT, fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }
  },
    // Header
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', background: statusColor, boxShadow: isLive ? ('0 0 8px ' + RED) : 'none' } }),
        React.createElement('span', { style: { fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', color: statusColor } }, statusLabel),
        isLive && React.createElement('span', { style: { fontSize: 13, color: MUTED, marginLeft: 8 } }, fmtTime(uptime)),
        isLive && React.createElement('span', { style: { fontSize: 13, color: MUTED, marginLeft: 16 } }, viewerCount + ' watching')
      ),
      React.createElement('span', { style: { fontSize: 20, fontWeight: 700, color: GOLD, letterSpacing: '0.06em' } }, 'Studio')
    ),

    // Main layout
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' } },

      // Left — preview
      React.createElement('div', null,
        React.createElement('div', {
          style: { background: CARD2, borderRadius: 10, border: '1px solid ' + BORD, overflow: 'hidden', position: 'relative', aspectRatio: '16/9' }
        },
          React.createElement('video', {
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            muted: true,
            style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
          }),
          !camOn && !screenOn && React.createElement('div', {
            style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: MUTED }
          },
            React.createElement('div', { style: { fontSize: 48 } }, '📷'),
            React.createElement('div', { style: { marginTop: 8, fontSize: 13 } }, 'No video source')
          ),
          isLive && React.createElement('div', {
            style: { position: 'absolute', top: 12, left: 12, background: RED, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4 }
          }, '● LIVE')
        ),

        // Source controls
        React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 12 } },
          React.createElement('button', {
            onClick: camOn ? stopCamera : startCamera,
            style: {
              flex: 1, padding: '10px 0', borderRadius: 7, border: '1px solid ' + (camOn ? GOLD : BORD),
              background: camOn ? 'rgba(201,168,76,.12)' : CARD, color: camOn ? GOLD : MUTED,
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }
          }, camOn ? '📷 Camera On' : '📷 Camera Off'),

          React.createElement('button', {
            onClick: screenOn ? stopScreenShare : startScreenShare,
            style: {
              flex: 1, padding: '10px 0', borderRadius: 7, border: '1px solid ' + (screenOn ? GOLD : BORD),
              background: screenOn ? 'rgba(201,168,76,.12)' : CARD, color: screenOn ? GOLD : MUTED,
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }
          }, screenOn ? '🖥 Screen On' : '🖥 Share Screen'),

          React.createElement('button', {
            onClick: toggleMic,
            style: {
              padding: '10px 16px', borderRadius: 7, border: '1px solid ' + (micOn ? BORD : RED),
              background: micOn ? CARD : 'rgba(255,26,60,.10)', color: micOn ? TEXT : RED,
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }
          }, micOn ? '🎙 Mic' : '🔇 Muted')
        )
      ),

      // Right — controls
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },

        // Stream title
        React.createElement('div', { style: { background: CARD, borderRadius: 8, border: '1px solid ' + BORD, padding: 14 } },
          React.createElement('div', { style: { fontSize: 11, color: MUTED, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' } }, 'Stream Title'),
          React.createElement('input', {
            value: streamTitle,
            onChange: function(e) { setStreamTitle(e.target.value.slice(0, 120)); },
            placeholder: 'What are you streaming today?',
            disabled: isLive,
            style: {
              width: '100%', background: DIM, border: '1px solid ' + BORD, borderRadius: 6,
              color: TEXT, fontSize: 13, padding: '8px 10px', boxSizing: 'border-box',
              outline: 'none'
            }
          })
        ),

        // Go Live / Stop
        React.createElement('button', {
          onClick: isLive ? stopLive : goLive,
          disabled: status === 'connecting',
          style: {
            padding: '16px 0', borderRadius: 8, border: 'none',
            background: isLive ? DIM : RED,
            color: isLive ? RED : '#fff',
            fontWeight: 700, fontSize: 16, letterSpacing: '0.08em',
            cursor: status === 'connecting' ? 'not-allowed' : 'pointer',
            opacity: status === 'connecting' ? 0.7 : 1,
            boxShadow: isLive ? ('inset 0 0 0 2px ' + RED) : '0 0 18px rgba(255,26,60,.3)',
            transition: 'all 0.2s'
          }
        }, isLive ? '⏹ End Stream' : status === 'connecting' ? 'Starting…' : '▶ Go Live'),

        // Stats card (when live)
        isLive && React.createElement('div', { style: { background: CARD, borderRadius: 8, border: '1px solid ' + BORD, padding: 14 } },
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
            React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: { fontSize: 22, fontWeight: 700, color: GOLD } }, viewerCount),
              React.createElement('div', { style: { fontSize: 11, color: MUTED, marginTop: 2 } }, 'Viewers')
            ),
            React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: { fontSize: 22, fontWeight: 700, color: TEXT } }, fmtTime(uptime)),
              React.createElement('div', { style: { fontSize: 11, color: MUTED, marginTop: 2 } }, 'Duration')
            )
          )
        ),

        // Error
        error && React.createElement('div', {
          style: { background: 'rgba(255,26,60,.10)', border: '1px solid rgba(255,26,60,.30)', borderRadius: 8, padding: '10px 12px', color: RED, fontSize: 13 }
        }, error),

        // Setup hints
        !isLive && React.createElement('div', { style: { background: CARD, borderRadius: 8, border: '1px solid ' + BORD, padding: 14 } },
          React.createElement('div', { style: { fontSize: 11, color: MUTED, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' } }, 'Before going live'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            React.createElement('div', { style: { fontSize: 12, color: camOn || screenOn ? GOLD : MUTED } },
              (camOn || screenOn ? '✓' : '○') + ' Video source active'),
            React.createElement('div', { style: { fontSize: 12, color: status !== 'idle' ? GOLD : MUTED } },
              (status !== 'idle' ? '✓' : '○') + ' Server connected'),
            React.createElement('div', { style: { fontSize: 12, color: streamTitle ? GOLD : MUTED } },
              (streamTitle ? '✓' : '○') + ' Stream title set')
          )
        )
      )
    )
  );
}

export default DesktopStudioTab;
