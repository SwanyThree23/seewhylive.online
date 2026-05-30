import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var OCT_CLIP = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

var BG     = '#0F0C14';
var SURF   = '#130F1C';
var CARD   = '#1A1526';
var CARD2  = '#211A30';
var GOLD   = '#C9A84C';
var BURG   = '#800020';
var TEAL   = '#00DEC0';
var RED    = '#FF1A3C';
var TEXT   = '#EDE8F5';
var MUTED  = '#7A6F90';
var DIM    = '#2E2545';
var BORDER = 'rgba(255,255,255,.06)';

var AVATAR_COLORS = ['#800020','#C9A84C','#00DEC0','#FF1A3C','#6A35FF','#00C9A7','#FF6B35','#9B59B6'];

function extractYtId(url) {
  if (!url) return '';
  var m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtS(s) {
  s = Math.floor(s) || 0;
  return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
}
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function getInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  var h = 0;
  for (var i = 0; i < name.length; i++) { h = (h * 31 + name.charCodeAt(i)) & 0xffff; }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

var ANIMATION_STYLES = '' +
  '@keyframes reactRise {' +
  '  0%   { transform: translateY(0);      opacity: 1; }' +
  '  100% { transform: translateY(-120px); opacity: 0; }' +
  '}' +
  '@keyframes watchPulse {' +
  '  0%,100% { box-shadow: 0 0 4px rgba(255,30,30,.6); }' +
  '  50%     { box-shadow: 0 0 12px rgba(255,30,30,1); }' +
  '}' +
  '@keyframes dotBlink {' +
  '  0%,80%,100% { opacity: 0; }' +
  '  40%         { opacity: 1; }' +
  '}';

var REACT_EMOJIS = ['❤️', '🔥', '😂', '💯', '😮', '👏'];

export default function WatchPartyTab({ guests, socket, roomId, role, addToast, isLive, chat }) {
  // --- video / player state ---
  var [urlInput,   setUrlInput]   = useState('');
  var [videoId,    setVideoId]    = useState('');
  var [playing,    setPlaying]    = useState(false);
  var [position,   setPosition]   = useState(0);
  var [duration,   setDuration]   = useState(0);
  var [ytReady,    setYtReady]    = useState(false);
  var [synced,     setSynced]     = useState(true);

  // --- party meta ---
  var [watchPartyActive, setWatchPartyActive] = useState(false);
  var [partyViewers,     setPartyViewers]     = useState(0);
  var [partyName,        setPartyName]        = useState('');
  var [sourceType,       setSourceType]       = useState('youtube');
  var [ytDetected,       setYtDetected]       = useState(false);
  var [showCreatePanel,  setShowCreatePanel]  = useState(true);

  // --- queue ---
  var [queue,        setQueue]        = useState([]);
  var [queueInput,   setQueueInput]   = useState('');
  var [currentTitle, setCurrentTitle] = useState('');
  var [showQueue,    setShowQueue]    = useState(false);

  // --- floating reactions ---
  var [floatReacts, setFloatReacts] = useState([]);

  // --- chat ---
  var [chatOpen,    setChatOpen]    = useState(false);
  var [chatInput,   setChatInput]   = useState('');
  var chatEndRef    = useRef(null);

  // refs
  var playerRef        = useRef(null);
  var posRef           = useRef(0);
  var tickRef          = useRef(null);
  var ytDivRef         = useRef(null);
  var partyViewerRef   = useRef(null);

  var isHost     = role === 'host' || role === 'cohost';
  var liveGuests = (guests || []).filter(function(g) { return g.live !== false; });
  var chatMsgs   = (chat || []).slice(-40);

  var prog = duration > 0 ? Math.min(100, Math.floor((position / duration) * 100)) : 0;
  var remaining = duration > 0 ? Math.floor(duration - position) : 0;

  // ─────────────────────────────────────────────
  // YouTube URL auto-detection
  // ─────────────────────────────────────────────
  useEffect(function() {
    var id = extractYtId(urlInput);
    setYtDetected(id.length > 0);
    if (id) setVideoId(id);
  }, [urlInput]);

  // ─────────────────────────────────────────────
  // Party viewer drift simulation
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (partyViewerRef.current) {
      clearInterval(partyViewerRef.current);
      partyViewerRef.current = null;
    }
    if (!watchPartyActive || !isLive) { return; }
    setPartyViewers(3);
    partyViewerRef.current = setInterval(function() {
      setPartyViewers(function(prev) {
        var next = prev + rnd(1, 4);
        return next > 25 ? 25 : next;
      });
    }, 5000);
    return function() {
      if (partyViewerRef.current) {
        clearInterval(partyViewerRef.current);
        partyViewerRef.current = null;
      }
    };
  }, [watchPartyActive, isLive]);

  // ─────────────────────────────────────────────
  // Load YouTube IFrame API once
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (window.YT && window.YT.Player) { setYtReady(true); return; }
    var existing = document.getElementById('yt-api-script');
    var origCb   = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      setYtReady(true);
      if (origCb) origCb();
    };
    if (!existing) {
      var script = document.createElement('script');
      script.id  = 'yt-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Create / recreate YT player when videoId + ytReady set
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (!videoId || !ytReady) return;
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch(e) {}
      playerRef.current = null;
    }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }

    var initTimer = setTimeout(function() {
      if (!ytDivRef.current) return;
      try {
        var p = new window.YT.Player(ytDivRef.current, {
          videoId: videoId,
          width:  '100%',
          height: '100%',
          playerVars: {
            rel:            0,
            modestbranding: 1,
            controls:       isHost ? 1 : 0,
            disablekb:      isHost ? 0 : 1,
            playsinline:    1
          },
          events: {
            onReady: function(e) {
              var dur = e.target.getDuration();
              if (dur) setDuration(Math.floor(dur));
            },
            onStateChange: function(e) {
              if (e.data === 1) {
                setPlaying(true);
              } else if (e.data === 0) {
                // video ended — auto-advance queue
                setPlaying(false);
                setQueue(function(q) {
                  if (q.length === 0) return q;
                  var next = q[0];
                  var rest = q.slice(1);
                  setVideoId(next.videoId);
                  setCurrentTitle(next.title || next.url);
                  setUrlInput(next.url || '');
                  setPosition(0);
                  posRef.current = 0;
                  if (socket && roomId) {
                    socket.emit('watch-party-url', { roomId: roomId, videoId: next.videoId, url: next.url });
                  }
                  return rest;
                });
              } else if (e.data === 2) {
                setPlaying(false);
              }
            }
          }
        });
        playerRef.current = p;
      } catch(err) {
        if (addToast) addToast('YouTube player init error', 'error');
      }
    }, 120);

    return function() {
      clearTimeout(initTimer);
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e) {}
        playerRef.current = null;
      }
    };
  }, [videoId, ytReady]);

  // ─────────────────────────────────────────────
  // Position ticker while playing
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!playing || !playerRef.current) return;
    tickRef.current = setInterval(function() {
      if (!playerRef.current) return;
      try {
        var t = playerRef.current.getCurrentTime();
        if (typeof t === 'number') {
          posRef.current = t;
          setPosition(Math.floor(t));
        }
        var d = playerRef.current.getDuration();
        if (typeof d === 'number' && d > 0) setDuration(Math.floor(d));
      } catch(e) {}
    }, 500);
    return function() { clearInterval(tickRef.current); };
  }, [playing]);

  // ─────────────────────────────────────────────
  // Auto-scroll chat to bottom
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (chatEndRef.current && chatOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMsgs.length, chatOpen]);

  // ─────────────────────────────────────────────
  // Socket sync
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (!socket) return;

    function onWatchUrl(data) {
      if (!data || !data.videoId) return;
      setVideoId(data.videoId);
      setUrlInput(data.url || '');
      setPosition(0);
      setPlaying(false);
      posRef.current = 0;
    }

    function onWatchPlay(data) {
      if (!data) return;
      setPlaying(true);
      if (!isHost && playerRef.current) {
        try {
          var serverPos = data.position || 0;
          var elapsed   = (Date.now() - (data.timestamp || Date.now())) / 1000;
          playerRef.current.seekTo(serverPos + elapsed, true);
          playerRef.current.playVideo();
        } catch(e) {}
      }
    }

    function onWatchPause(data) {
      setPlaying(false);
      if (!isHost && playerRef.current) {
        try {
          if (data && typeof data.position === 'number') {
            playerRef.current.seekTo(data.position, true);
          }
          playerRef.current.pauseVideo();
        } catch(e) {}
      }
    }

    function onWatchSeek(data) {
      if (!data || typeof data.position !== 'number') return;
      setPosition(Math.floor(data.position));
      posRef.current = data.position;
      if (!isHost && playerRef.current) {
        try { playerRef.current.seekTo(data.position, true); } catch(e) {}
      }
    }

    function onWatchSync(data) {
      if (!data) return;
      if (data.videoId) { setVideoId(data.videoId); setWatchPartyActive(true); }
      if (typeof data.position === 'number') {
        setPosition(Math.floor(data.position));
        posRef.current = data.position;
        if (playerRef.current) {
          try { playerRef.current.seekTo(data.position, true); } catch(e) {}
        }
      }
      if (data.playing) {
        setPlaying(true);
        if (playerRef.current) {
          try { playerRef.current.playVideo(); } catch(e) {}
        }
      } else {
        setPlaying(false);
        if (playerRef.current) {
          try { playerRef.current.pauseVideo(); } catch(e) {}
        }
      }
    }

    function onWatchReact(data) {
      if (!data || !data.emoji) return;
      var id = Date.now() + Math.random();
      setFloatReacts(function(p) {
        return p.slice(-9).concat([{ id: id, emoji: data.emoji, x: rnd(10, 80) }]);
      });
      setTimeout(function() {
        setFloatReacts(function(p) { return p.filter(function(r) { return r.id !== id; }); });
      }, 2100);
    }

    socket.on('watch-party-url',   onWatchUrl);
    socket.on('watch-party-play',  onWatchPlay);
    socket.on('watch-party-pause', onWatchPause);
    socket.on('watch-party-seek',  onWatchSeek);
    socket.on('watch-party-sync',  onWatchSync);
    socket.on('watch-react',       onWatchReact);

    if (!isHost && socket && roomId) {
      socket.emit('watch-party-sync-request', { roomId: roomId });
    }

    return function() {
      socket.off('watch-party-url',   onWatchUrl);
      socket.off('watch-party-play',  onWatchPlay);
      socket.off('watch-party-pause', onWatchPause);
      socket.off('watch-party-seek',  onWatchSeek);
      socket.off('watch-party-sync',  onWatchSync);
      socket.off('watch-react',       onWatchReact);
    };
  }, [socket, isHost]);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────
  function handleStartWatchParty() {
    setWatchPartyActive(true);
    if (addToast) addToast('Watch party started!', 'success');
    if (socket) socket.emit('watch-party-start', { roomId: roomId });
  }

  function handleEndWatchParty() {
    setWatchPartyActive(false);
    setPartyViewers(0);
    if (partyViewerRef.current) { clearInterval(partyViewerRef.current); partyViewerRef.current = null; }
    if (addToast) addToast('Watch party ended', 'info');
  }

  function handleLoadUrl() {
    var vid = extractYtId(urlInput.trim());
    if (!vid) {
      if (addToast) addToast('Invalid YouTube URL — paste a full youtube.com/watch?v= link', 'error');
      return;
    }
    setVideoId(vid);
    setCurrentTitle(urlInput.trim());
    setPosition(0);
    posRef.current = 0;
    if (socket && roomId) {
      socket.emit('watch-party-url', { roomId: roomId, videoId: vid, url: urlInput.trim() });
    }
    if (addToast) addToast('Loading video for all guests...', 'info');
  }

  function handlePlay() {
    var pos = posRef.current;
    setPlaying(true);
    if (playerRef.current) { try { playerRef.current.playVideo(); } catch(e) {} }
    if (socket && roomId) {
      socket.emit('watch-party-play', { roomId: roomId, position: pos, timestamp: Date.now() });
    }
  }

  function handlePause() {
    var pos = posRef.current;
    setPlaying(false);
    if (playerRef.current) { try { playerRef.current.pauseVideo(); } catch(e) {} }
    if (socket && roomId) {
      socket.emit('watch-party-pause', { roomId: roomId, position: pos });
    }
  }

  function handleSeekClick(e) {
    if (!isHost) return;
    var r      = e.currentTarget.getBoundingClientRect();
    var pct    = (e.clientX - r.left) / r.width;
    var newPos = pct * (duration || 1);
    posRef.current = newPos;
    setPosition(Math.floor(newPos));
    if (playerRef.current) { try { playerRef.current.seekTo(newPos, true); } catch(e2) {} }
    if (socket && roomId) {
      socket.emit('watch-party-seek', { roomId: roomId, position: newPos });
    }
  }

  function handleSyncAll() {
    var pos = posRef.current;
    if (socket && roomId) {
      socket.emit('watch-party-sync', {
        roomId:   roomId,
        videoId:  videoId,
        position: pos,
        playing:  playing
      });
    }
    if (addToast) addToast('Synced all viewers to current position', 'success');
  }

  function handleCreateParty() {
    setShowCreatePanel(false);
    setWatchPartyActive(true);
    if (addToast) addToast('Watch Party started! Sharing with room.', 'success');
    if (socket) socket.emit('watch-party-start', { roomId: roomId });
  }

  // Queue handlers
  function handleAddToQueue() {
    var vid = extractYtId(queueInput.trim());
    if (!vid) {
      if (addToast) addToast('Invalid YouTube URL for queue', 'error');
      return;
    }
    var item = { id: Date.now() + Math.random(), title: queueInput.trim(), url: queueInput.trim(), videoId: vid, addedBy: 'host', duration: 0 };
    setQueue(function(q) { return q.concat([item]); });
    setQueueInput('');
    if (addToast) addToast('Added to queue', 'success');
  }

  function handleQueueMove(idx, dir) {
    setQueue(function(q) {
      var arr = q.slice();
      var target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      var tmp    = arr[idx];
      arr[idx]   = arr[target];
      arr[target] = tmp;
      return arr;
    });
  }

  function handleQueueRemove(idx) {
    setQueue(function(q) { return q.filter(function(_, i) { return i !== idx; }); });
  }

  function handlePlayFromQueue(idx) {
    var item = queue[idx];
    if (!item) return;
    setQueue(function(q) { return q.filter(function(_, i) { return i !== idx; }); });
    setVideoId(item.videoId);
    setCurrentTitle(item.title || item.url);
    setUrlInput(item.url || '');
    setPosition(0);
    posRef.current = 0;
    if (socket && roomId) {
      socket.emit('watch-party-url', { roomId: roomId, videoId: item.videoId, url: item.url });
    }
  }

  // Reaction handlers
  function sendReact(emoji) {
    var id = Date.now() + Math.random();
    setFloatReacts(function(p) {
      return p.slice(-9).concat([{ id: id, emoji: emoji, x: rnd(10, 80) }]);
    });
    setTimeout(function() {
      setFloatReacts(function(p) { return p.filter(function(r) { return r.id !== id; }); });
    }, 2100);
    if (socket && roomId) {
      socket.emit('watch-react', { roomId: roomId, emoji: emoji });
    }
  }

  // Chat handler
  function handleChatSend() {
    var msg = chatInput.trim();
    if (!msg) return;
    if (socket && roomId) {
      socket.emit('chat-message', { roomId: roomId, message: msg });
    }
    setChatInput('');
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: BG, fontFamily: "'Barlow Condensed',sans-serif" }}>

      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />

      {/* ── CREATE PARTY PANEL ── */}
      {showCreatePanel && !watchPartyActive && (
        <div style={{
          background: 'rgba(22,16,32,.92)',
          border: '1px solid ' + BORDER,
          borderRadius: 12,
          padding: '16px',
          margin: '8px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>📺</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>WATCH PARTY</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: MUTED, marginBottom: 12, letterSpacing: 1 }}>
            Watch together in sync with chat
          </div>

          <input
            value={partyName}
            onChange={function(e) { setPartyName(e.target.value); }}
            placeholder="Party room name..."
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(7,5,10,.9)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, outline: 'none', marginBottom: 12 }}
          />

          {/* Source selector */}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Video Source</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { key: 'youtube', label: '🔴 YouTube', enabled: true },
              { key: 'twitch',  label: '💜 Twitch',  enabled: false },
              { key: 'direct',  label: '🎥 Direct URL', enabled: false }
            ].map(function(src) {
              return (
                <button
                  key={src.key}
                  onClick={function() { if (src.enabled) setSourceType(src.key); }}
                  style={{
                    flex: 1,
                    background: sourceType === src.key ? 'rgba(201,168,76,.2)' : 'transparent',
                    border: '1px solid ' + (sourceType === src.key ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.1)'),
                    borderRadius: 7,
                    padding: '7px 0',
                    color: src.enabled ? (sourceType === src.key ? GOLD : MUTED) : DIM,
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontWeight: 700,
                    fontSize: 10,
                    cursor: src.enabled ? 'pointer' : 'not-allowed',
                    letterSpacing: 1,
                    position: 'relative'
                  }}>
                  {src.label}
                  {!src.enabled && (
                    <span style={{ display: 'block', fontSize: 7, color: MUTED, letterSpacing: 0 }}>Coming Soon</span>
                  )}
                </button>
              );
            })}
          </div>

          <input
            value={urlInput}
            onChange={function(e) { setUrlInput(e.target.value); }}
            placeholder="Paste YouTube URL (youtube.com/watch?v=...)"
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(7,5,10,.9)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, outline: 'none', marginBottom: 6 }}
          />

          {ytDetected && sourceType === 'youtube' && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEAL, marginBottom: 8, letterSpacing: 1 }}>
              ▶ YouTube video detected ✓
            </div>
          )}

          {ytDetected && sourceType === 'youtube' && videoId && (
            <div style={{ marginBottom: 12 }}>
              <img
                src={'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg'}
                alt="YouTube thumbnail"
                style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          <button
            onClick={handleCreateParty}
            style={{ width: '100%', background: 'linear-gradient(135deg,' + GOLD + ',#E8C46A)', border: 'none', borderRadius: 8, padding: '10px 0', color: '#07050A', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>
            + Create Watch Party
          </button>
        </div>
      )}

      {/* ── HOST IS LIVE BANNER ── */}
      {isLive && (
        <div style={{ background: 'linear-gradient(90deg,rgba(128,0,32,.7),rgba(192,24,56,.5))', borderBottom: '1px solid rgba(192,24,56,.5)', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3030', animation: 'watchPulse 1.5s infinite' }} />
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: GOLD, letterSpacing: 2 }}>HOST IS LIVE</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEXT, opacity: 0.7, marginLeft: 4 }}>Stream is active · {liveGuests.length} in room</span>
        </div>
      )}

      {/* ── PARTY STATS BAR (when active) ── */}
      {watchPartyActive && videoId && (
        <div style={{ background: CARD, borderBottom: '1px solid ' + BORDER, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>
            👁 <span style={{ color: TEAL, fontWeight: 700 }}>{liveGuests.length + Math.floor(partyViewers)}</span> watching
          </span>
          <span style={{ color: DIM }}>·</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ▶ Now Playing: <span style={{ color: TEXT }}>{currentTitle || (videoId ? 'YouTube Video' : '—')}</span>
          </span>
          {duration > 0 && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, flexShrink: 0 }}>
              {fmtS(remaining)} left
            </span>
          )}
          {playing && (
            <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12, flexShrink: 0 }}>
              {[0, 0.15, 0.3].map(function(delay, i) {
                return (
                  <span key={i} style={{ width: 3, height: 10, background: TEAL, borderRadius: 2, display: 'inline-block', animation: 'dotBlink 1.2s ' + delay + 's infinite' }} />
                );
              })}
            </span>
          )}
        </div>
      )}

      {/* ── WATCH PARTY STATUS BAR ── */}
      {watchPartyActive && (
        <div style={{ background: isLive ? 'rgba(0,222,192,.08)' : 'rgba(245,158,11,.08)', border: '1px solid ' + (isLive ? 'rgba(0,222,192,.3)' : 'rgba(245,158,11,.35)'), margin: '6px 8px 0', borderRadius: 8, padding: '7px 10px', flexShrink: 0 }}>
          {isLive ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEAL, letterSpacing: 1 }}>{Math.floor(partyViewers)}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>viewers</span>
                  <div style={{ background: 'rgba(0,222,192,.15)', border: '1px solid rgba(0,222,192,.35)', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: TEAL, letterSpacing: 1 }}>
                    WATCHING TOGETHER
                  </div>
                </div>
                {isHost && (
                  <button
                    onClick={handleEndWatchParty}
                    style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 6, padding: '4px 10px', color: RED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                    END PARTY
                  </button>
                )}
              </div>
              {/* Synergy bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, flexShrink: 0 }}>SYNERGY</span>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: Math.min(100, liveGuests.length * 5) + '%', height: '100%', background: 'linear-gradient(90deg,' + TEAL + ',' + GOLD + ')', borderRadius: 3, transition: 'width .5s ease' }} />
                </div>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: GOLD, letterSpacing: 1, flexShrink: 0 }}>{Math.min(100, liveGuests.length * 5)}%</span>
              </div>
            </div>
          ) : (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: '#F59E0B' }}>⚠️ Stream offline — party paused</span>
          )}
        </div>
      )}

      {/* ── URL BAR (host only) ── */}
      {isHost && (
        <div style={{ background: BG, borderBottom: '1px solid ' + DIM, padding: '8px 10px', display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,0,0,.12)', border: '1px solid rgba(255,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#FF4444', flexShrink: 0 }}>▶</div>
          <input
            value={urlInput}
            onChange={function(e) { setUrlInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleLoadUrl(); }}
            placeholder="Paste YouTube URL (youtube.com/watch?v=...)"
            style={{ flex: 1, background: 'rgba(7,5,10,.9)', border: '1px solid ' + DIM, borderRadius: 7, padding: '7px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, outline: 'none' }}
          />
          <button
            onClick={handleLoadUrl}
            style={{ background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 7, padding: '7px 14px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
            LOAD
          </button>
          {ytDetected && (
            <button
              onClick={function() {
                var vid = extractYtId(urlInput.trim());
                if (!vid) return;
                var item = { id: Date.now() + Math.random(), title: urlInput.trim(), url: urlInput.trim(), videoId: vid, addedBy: 'host', duration: 0 };
                setQueue(function(q) { return q.concat([item]); });
                setQueueInput('');
                if (addToast) addToast('Added to queue', 'success');
              }}
              style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, padding: '7px 12px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
              + QUEUE
            </button>
          )}
        </div>
      )}

      {/* ── START PARTY BUTTON ── */}
      {isHost && !watchPartyActive && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid ' + DIM, flexShrink: 0 }}>
          <button
            onClick={handleStartWatchParty}
            style={{ width: '100%', background: 'linear-gradient(135deg,rgba(128,0,32,.7),rgba(192,24,56,.5))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '9px 0', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 2 }}>
            🎉 START WATCH PARTY
          </button>
        </div>
      )}

      {/* ── SOURCE SELECTOR ROW ── */}
      {watchPartyActive && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid ' + BORDER, display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>SOURCE:</span>
          {[
            { key: 'youtube', label: '🔴 YouTube', enabled: true },
            { key: 'twitch',  label: '💜 Twitch',  enabled: false },
            { key: 'direct',  label: '🎥 Direct',  enabled: false }
          ].map(function(src) {
            return (
              <button
                key={src.key}
                onClick={function() { if (src.enabled) setSourceType(src.key); }}
                style={{
                  background: sourceType === src.key ? 'rgba(201,168,76,.2)' : 'transparent',
                  border: '1px solid ' + (sourceType === src.key ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.08)'),
                  borderRadius: 5,
                  padding: '3px 10px',
                  color: src.enabled ? (sourceType === src.key ? GOLD : MUTED) : DIM,
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 700,
                  fontSize: 10,
                  cursor: src.enabled ? 'pointer' : 'not-allowed',
                  letterSpacing: 1
                }}>
                {src.label}{!src.enabled ? ' (soon)' : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* ── MAIN CONTENT: VIDEO + OPTIONAL CHAT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Video column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* ── VIDEO AREA ── */}
          <div style={{ flex: 1, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 180 }}>

            {/* Floating reactions overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
              {floatReacts.map(function(r) {
                return (
                  <div key={r.id} style={{ position: 'absolute', left: r.x + '%', bottom: '10%', fontSize: 28, animation: 'reactRise 2s ease forwards', userSelect: 'none', lineHeight: 1 }}>
                    {r.emoji}
                  </div>
                );
              })}
            </div>

            {/* YouTube player or placeholder */}
            {videoId ? (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div ref={ytDivRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 20px' }}>
                <div style={{ fontSize: 48, opacity: 0.2 }}>📺</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: MUTED, letterSpacing: 3, textAlign: 'center', lineHeight: 1.3 }}>
                  {isHost ? 'PASTE A YOUTUBE LINK ABOVE TO START THE WATCH PARTY' : 'WAITING FOR HOST TO LOAD A VIDEO'}
                </div>
                {!isHost && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: DIM, textAlign: 'center' }}>
                    All guests will sync automatically when host loads content
                  </div>
                )}
                {/* Party slots grid */}
                <div style={{ marginTop: 12, width: '100%', maxWidth: 340 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>PARTY SLOTS</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: GOLD, letterSpacing: 1 }}>{liveGuests.length}/20</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                    {Array(20).fill(null).map(function(_, i) {
                      var g = liveGuests[i];
                      return g ? (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <AvatarPortrait username={g.username || 'Guest'} size={44} />
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED, maxWidth: 46, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{g.username || 'Guest'}</div>
                        </div>
                      ) : (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 44, height: 44, clipPath: OCT_CLIP, background: 'rgba(255,255,255,.03)', border: '1px solid ' + BORDER }} />
                          <div style={{ height: 8 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SYNCED badge */}
            {synced && videoId && (
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,222,192,.15)', border: '1px solid rgba(0,222,192,.4)', borderRadius: 999, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, zIndex: 15 }}>
                🔗 SYNCED
              </div>
            )}

            {/* Guest count badge */}
            {liveGuests.length > 0 && (
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(7,5,10,.75)', border: '1px solid ' + DIM, borderRadius: 999, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEXT, zIndex: 15 }}>
                👁 {liveGuests.length} watching
              </div>
            )}

            {/* ── REACTION BAR (bottom of video) ── */}
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, background: 'rgba(0,0,0,.82)', borderRadius: 999, padding: '5px 12px', zIndex: 15, boxShadow: '0 2px 16px rgba(0,0,0,.6)' }}>
              {REACT_EMOJIS.map(function(em) {
                return (
                  <button key={em} onClick={function() { sendReact(em); }} style={{ fontSize: 18, cursor: 'pointer', background: 'none', border: 'none', padding: '2px 3px', transition: 'transform .1s', lineHeight: 1 }}>
                    {em}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── AUDIENCE AVATAR ROW ── */}
          {liveGuests.length > 0 && (
            <div style={{ background: CARD, borderTop: '1px solid ' + BORDER, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0 }}>{liveGuests.length} WATCHING</span>
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1 }}>
                {liveGuests.slice(0, 20).map(function(g) {
                  var name  = g.username || 'Guest';
                  var initials = getInitials(name);
                  var color = avatarColor(name);
                  return (
                    <div
                      key={g.userId || g.guestId || name}
                      title={name}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily: "'Barlow Condensed',sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        color: TEXT,
                        border: '2px solid ' + CARD,
                        boxShadow: '0 0 0 1px ' + BORDER,
                        cursor: 'default',
                        userSelect: 'none'
                      }}>
                      {initials}
                    </div>
                  );
                })}
                {liveGuests.length > 20 && (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0, border: '2px solid ' + CARD }}>
                    +{liveGuests.length - 20}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CONTROLS BAR ── */}
          <div style={{ background: BG, borderTop: '1px solid ' + DIM, padding: '8px 12px', flexShrink: 0 }}>
            {/* Scrubber */}
            {videoId && (
              <div
                style={{ background: DIM, borderRadius: 3, height: 6, cursor: isHost ? 'pointer' : 'default', marginBottom: 9, position: 'relative' }}
                onClick={isHost ? handleSeekClick : undefined}>
                <div style={{ width: prog + '%', height: '100%', background: 'linear-gradient(90deg,' + BURG + ',#C01838)', borderRadius: 3, position: 'relative', transition: 'width .3s linear' }}>
                  {isHost && (
                    <div style={{ position: 'absolute', right: -6, top: -3, width: 12, height: 12, borderRadius: '50%', background: '#C01838', boxShadow: '0 0 8px rgba(255,26,60,.7)' }} />
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Play / Pause */}
              {isHost && videoId ? (
                <button
                  onClick={playing ? handlePause : handlePlay}
                  style={{ background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 8, padding: '7px 16px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                  {playing ? '⏸ PAUSE' : '▶ PLAY'}
                </button>
              ) : (
                <div style={{ background: 'rgba(128,0,32,.18)', border: '1px solid ' + DIM, borderRadius: 8, padding: '7px 14px', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
                  {playing ? '▶ PLAYING' : '⏸ PAUSED'}
                </div>
              )}

              {/* Timestamp */}
              {videoId && (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, flexShrink: 0 }}>
                  {fmtS(position)}{duration > 0 ? ' / ' + fmtS(duration) : ''}
                </span>
              )}

              <div style={{ flex: 1 }} />

              {/* Sync all — host only */}
              {isHost && videoId && (
                <button
                  onClick={handleSyncAll}
                  style={{ background: 'rgba(0,222,192,.12)', border: '1px solid rgba(0,222,192,.35)', borderRadius: 6, padding: '5px 10px', color: TEAL, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  ⟳ SYNC ALL
                </button>
              )}

              {/* Sync toggle */}
              <button
                onClick={function() { setSynced(function(s) { return !s; }); }}
                style={{ background: synced ? 'rgba(0,222,192,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (synced ? 'rgba(0,222,192,.4)' : DIM), borderRadius: 6, padding: '5px 10px', color: synced ? TEAL : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                {synced ? '🔗 SYNCED' : '⛓ SYNC'}
              </button>

              {/* Chat toggle */}
              <button
                onClick={function() { setChatOpen(function(o) { return !o; }); }}
                style={{ background: chatOpen ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (chatOpen ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 6, padding: '5px 10px', color: chatOpen ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                💬 CHAT{chatMsgs.length > 0 ? ' (' + chatMsgs.length + ')' : ''}
              </button>

              {/* Queue toggle */}
              <button
                onClick={function() { setShowQueue(function(o) { return !o; }); }}
                style={{ background: showQueue ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (showQueue ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 6, padding: '5px 10px', color: showQueue ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                ☰ QUEUE{queue.length > 0 ? ' (' + queue.length + ')' : ''}
              </button>
            </div>
          </div>

          {/* ── VIDEO QUEUE PANEL ── */}
          {showQueue && (
            <div style={{ background: SURF, borderTop: '1px solid ' + BORDER, padding: '10px 12px', flexShrink: 0, maxHeight: 260, overflowY: 'auto' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: TEXT, letterSpacing: 2, marginBottom: 8 }}>VIDEO QUEUE</div>

              {/* Queue input — host only */}
              {isHost && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input
                    value={queueInput}
                    onChange={function(e) { setQueueInput(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') handleAddToQueue(); }}
                    placeholder="YouTube URL to add to queue..."
                    style={{ flex: 1, background: 'rgba(7,5,10,.9)', border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }}
                  />
                  <button
                    onClick={handleAddToQueue}
                    style={{ background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '6px 12px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                    + ADD
                  </button>
                </div>
              )}

              {queue.length === 0 ? (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: DIM, textAlign: 'center', padding: '12px 0' }}>
                  Queue is empty{isHost ? ' — add YouTube URLs above' : ''}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {queue.map(function(item, idx) {
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD2, borderRadius: 8, padding: '7px 10px', border: '1px solid ' + BORDER }}>
                        {/* Thumbnail */}
                        <img
                          src={'https://img.youtube.com/vi/' + item.videoId + '/default.jpg'}
                          alt=""
                          style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {idx + 1}. {item.title || item.videoId}
                          </div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
                            {item.videoId}
                          </div>
                        </div>
                        {/* Controls — host only */}
                        {isHost && (
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={function() { handlePlayFromQueue(idx); }}
                              style={{ background: 'rgba(0,222,192,.15)', border: '1px solid rgba(0,222,192,.3)', borderRadius: 5, padding: '3px 8px', color: TEAL, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                              ▶
                            </button>
                            <button
                              onClick={function() { handleQueueMove(idx, -1); }}
                              disabled={idx === 0}
                              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORDER, borderRadius: 5, padding: '3px 7px', color: idx === 0 ? DIM : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>
                              ▲
                            </button>
                            <button
                              onClick={function() { handleQueueMove(idx, 1); }}
                              disabled={idx === queue.length - 1}
                              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORDER, borderRadius: 5, padding: '3px 7px', color: idx === queue.length - 1 ? DIM : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: idx === queue.length - 1 ? 'not-allowed' : 'pointer' }}>
                              ▼
                            </button>
                            <button
                              onClick={function() { handleQueueRemove(idx); }}
                              style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '3px 8px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CHAT PANEL (sidebar) ── */}
        {chatOpen && (
          <div style={{ width: 220, background: SURF, borderLeft: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Chat header */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: TEXT, letterSpacing: 2 }}>PARTY CHAT</span>
              <button
                onClick={function() { setChatOpen(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, padding: 0 }}>
                ✕
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chatMsgs.length === 0 ? (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: DIM, textAlign: 'center', marginTop: 20 }}>
                  No messages yet
                </div>
              ) : (
                chatMsgs.map(function(msg, i) {
                  var name     = (msg.username || msg.user || 'Guest');
                  var initials = getInitials(name);
                  var color    = avatarColor(name);
                  return (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 8, color: TEXT, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: color, marginBottom: 1 }}>{name}</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, wordBreak: 'break-word', lineHeight: 1.3 }}>{msg.message || msg.text || ''}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div style={{ padding: '8px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 6 }}>
              <input
                value={chatInput}
                onChange={function(e) { setChatInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') handleChatSend(); }}
                placeholder="Say something..."
                style={{ flex: 1, background: 'rgba(7,5,10,.9)', border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, outline: 'none' }}
              />
              <button
                onClick={handleChatSend}
                style={{ background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 6, padding: '6px 10px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                ↵
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
