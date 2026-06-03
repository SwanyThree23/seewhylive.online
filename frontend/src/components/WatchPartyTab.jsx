import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var OCT_CLIP = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

var BG     = '#0E0C09';
var SURF   = '#1A1510';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var DIM    = '#3D3020';
var BORDER = 'rgba(201,168,76,.12)';

var AVATAR_COLORS = [BURG, GOLD, AMBER, '#C04040', '#8A6020', '#A07040', '#6A3010', '#D4A060'];

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
  '}' +
  '@keyframes screenShareBadge {' +
  '  0%,100% { opacity: 1; }' +
  '  50%     { opacity: .7; }' +
  '}';

var REACT_EMOJIS = ['❤️', '🔥', '😂', '💯', '😮', '👏'];

export default function WatchPartyTab(props) {
  var guests   = props.guests;
  var socket   = props.socket;
  var roomId   = props.roomId;
  var role     = props.role;
  var addToast = props.addToast;
  var isLive   = props.isLive;
  var chat     = props.chat;

  // --- video / player state ---
  var [urlInput,     setUrlInput]     = useState('');
  var [videoId,      setVideoId]      = useState('');
  var [directUrl,    setDirectUrl]    = useState('');
  var [localFileUrl, setLocalFileUrl] = useState('');
  var [playing,      setPlaying]      = useState(false);
  var [position,     setPosition]     = useState(0);
  var [duration,     setDuration]     = useState(0);
  var [ytReady,      setYtReady]      = useState(false);
  var [synced,       setSynced]       = useState(true);

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
  var [chatOpen,  setChatOpen]  = useState(false);
  var [chatInput, setChatInput] = useState('');
  var chatEndRef   = useRef(null);

  // --- screen share ---
  var [screenSharing,     setScreenSharing]     = useState(false);
  var [remoteScreenUser,  setRemoteScreenUser]  = useState(null);
  var screenStreamRef = useRef(null);
  var screenTrackRef  = useRef(null);

  // --- 4K toggle ---
  var [is4K, setIs4K] = useState(false);

  // --- sync watch ---
  var [syncActive, setSyncActive] = useState(false);

  // --- sync latency ---
  var [syncMs, setSyncMs] = useState(null);

  // --- AI Summary ---
  var [aiSummary,    setAiSummary]    = useState('');
  var [aiLoading,    setAiLoading]    = useState(false);
  var [showAiPanel,  setShowAiPanel]  = useState(false);

  // refs
  var playerRef        = useRef(null);
  var videoRef2        = useRef(null);
  var fileInputRef     = useRef(null);
  var posRef           = useRef(0);
  var tickRef          = useRef(null);
  var ytDivRef         = useRef(null);
  var partyViewerRef   = useRef(null);
  var sourceTypeRef    = useRef(sourceType);

  var isHost     = role === 'host' || role === 'cohost';
  var liveGuests = (guests || []).filter(function(g) { return g.live !== false; });
  var chatMsgs   = (chat || []).slice(-40);

  var prog      = duration > 0 ? Math.min(100, Math.floor((position / duration) * 100)) : 0;
  var remaining = duration > 0 ? Math.floor(duration - position) : 0;

  // Keep sourceTypeRef current
  useEffect(function() { sourceTypeRef.current = sourceType; }, [sourceType]);

  // ─────────────────────────────────────────────
  // YouTube URL auto-detection
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (sourceType !== 'youtube') { setYtDetected(false); return; }
    var id = extractYtId(urlInput);
    setYtDetected(id.length > 0);
    if (id) setVideoId(id);
  }, [urlInput, sourceType]);

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

    function _playerSeekTo(pos) {
      if (sourceTypeRef.current === 'youtube') {
        if (playerRef.current) { try { playerRef.current.seekTo(pos, true); } catch(e) {} }
      } else if (videoRef2.current) {
        videoRef2.current.currentTime = pos;
      }
    }
    function _playerPlay() {
      if (sourceTypeRef.current === 'youtube') {
        if (playerRef.current) { try { playerRef.current.playVideo(); } catch(e) {} }
      } else if (videoRef2.current) {
        videoRef2.current.play().catch(function() {});
      }
    }
    function _playerPause() {
      if (sourceTypeRef.current === 'youtube') {
        if (playerRef.current) { try { playerRef.current.pauseVideo(); } catch(e) {} }
      } else if (videoRef2.current) {
        videoRef2.current.pause();
      }
    }

    function onWatchUrl(data) {
      if (!data) return;
      var type = data.type || (data.videoId ? 'youtube' : 'direct');
      setSourceType(type);
      if (type === 'youtube' && data.videoId) {
        setVideoId(data.videoId);
        setDirectUrl('');
        setLocalFileUrl('');
      } else if (data.url) {
        setDirectUrl(data.url);
        setVideoId('');
        setLocalFileUrl('');
      }
      setUrlInput(data.url || '');
      setPosition(0);
      setPlaying(false);
      posRef.current = 0;
    }

    function onWatchPlay(data) {
      if (!data) return;
      setPlaying(true);
      if (!isHost) {
        var serverPos = data.position || 0;
        var elapsed   = (Date.now() - (data.timestamp || Date.now())) / 1000;
        _playerSeekTo(serverPos + elapsed);
        _playerPlay();
      }
    }

    function onWatchPause(data) {
      setPlaying(false);
      if (!isHost) {
        if (data && typeof data.position === 'number') {
          _playerSeekTo(data.position);
        }
        _playerPause();
      }
    }

    function onWatchSeek(data) {
      if (!data || typeof data.position !== 'number') return;
      setPosition(Math.floor(data.position));
      posRef.current = data.position;
      if (!isHost) {
        _playerSeekTo(data.position);
      }
    }

    function onWatchSync(data) {
      if (!data) return;
      var type = data.type || (data.videoId ? 'youtube' : 'direct');
      setSourceType(type);
      if (data.videoId) {
        setVideoId(data.videoId);
        setDirectUrl('');
        setWatchPartyActive(true);
      } else if (data.url) {
        setDirectUrl(data.url);
        setVideoId('');
        setWatchPartyActive(true);
      }
      if (typeof data.position === 'number') {
        setPosition(Math.floor(data.position));
        posRef.current = data.position;
        _playerSeekTo(data.position);
      }
      if (data.playing) {
        setPlaying(true);
        _playerPlay();
      } else {
        setPlaying(false);
        _playerPause();
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

    // Screen share events
    function onScreenShareActive(data) {
      if (!data) return;
      setRemoteScreenUser(data.username || 'Someone');
    }
    function onScreenShareEnded() {
      setRemoteScreenUser(null);
    }

    // New watch-sync event (from server broadcast)
    function onSyncAction(data) {
      if (!data) return;
      if (data.timestamp) {
        setSyncMs(Math.abs(Date.now() - data.timestamp));
      }
      if (isHost) return;
      if (data.action === 'play') {
        _playerSeekTo(data.position || 0);
        _playerPlay();
        setPlaying(true);
      } else if (data.action === 'pause') {
        _playerPause();
        setPlaying(false);
      } else if (data.action === 'seek') {
        _playerSeekTo(data.position || 0);
      }
    }

    socket.on('watch-party-url',    onWatchUrl);
    socket.on('watch-party-play',   onWatchPlay);
    socket.on('watch-party-pause',  onWatchPause);
    socket.on('watch-party-seek',   onWatchSeek);
    socket.on('watch-party-sync',   onWatchSync);
    socket.on('watch-react',        onWatchReact);
    socket.on('screen-share-active',onScreenShareActive);
    socket.on('screen-share-ended', onScreenShareEnded);
    socket.on('watch-sync',         onSyncAction);

    if (!isHost && socket && roomId) {
      socket.emit('watch-party-sync-request', { roomId: roomId });
    }

    return function() {
      socket.off('watch-party-url',    onWatchUrl);
      socket.off('watch-party-play',   onWatchPlay);
      socket.off('watch-party-pause',  onWatchPause);
      socket.off('watch-party-seek',   onWatchSeek);
      socket.off('watch-party-sync',   onWatchSync);
      socket.off('watch-react',        onWatchReact);
      socket.off('screen-share-active',onScreenShareActive);
      socket.off('screen-share-ended', onScreenShareEnded);
      socket.off('watch-sync',         onSyncAction);
    };
  }, [socket, isHost, sourceType]);

  // ─────────────────────────────────────────────
  // 4K constraint when toggled
  // ─────────────────────────────────────────────
  useEffect(function() {
    if (!screenStreamRef.current) return;
    var videoTrack = screenStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    if (is4K) {
      videoTrack.applyConstraints({ width: 3840, height: 2160, frameRate: 30 }).catch(function() {});
    } else {
      videoTrack.applyConstraints({ width: 1920, height: 1080, frameRate: 30 }).catch(function() {});
    }
  }, [is4K]);

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
    var raw = urlInput.trim();
    if (!raw) {
      if (addToast) addToast('Paste a video URL first', 'error');
      return;
    }
    if (sourceType === 'youtube') {
      var vid = extractYtId(raw);
      if (!vid) {
        if (addToast) addToast('Invalid YouTube URL — paste a youtube.com/watch?v= link', 'error');
        return;
      }
      setVideoId(vid);
      setDirectUrl('');
      setLocalFileUrl('');
      setCurrentTitle(raw);
      setPosition(0); posRef.current = 0;
      if (socket && roomId) {
        socket.emit('watch-party-url', { roomId: roomId, videoId: vid, url: raw, type: 'youtube' });
      }
      if (addToast) addToast('Loading YouTube video for all guests...', 'info');
    } else {
      // Direct URL (MP4, WebM, HLS, etc.)
      setDirectUrl(raw);
      setVideoId('');
      setLocalFileUrl('');
      setCurrentTitle(raw.split('/').pop() || raw);
      setPosition(0); posRef.current = 0;
      setDuration(0);
      if (socket && roomId) {
        socket.emit('watch-party-url', { roomId: roomId, videoId: null, url: raw, type: 'direct' });
      }
      if (addToast) addToast('Loading direct video...', 'info');
    }
  }

  function handleFileSelect(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    var blob = URL.createObjectURL(file);
    setLocalFileUrl(blob);
    setDirectUrl(blob);
    setVideoId('');
    setCurrentTitle(file.name);
    setPosition(0); posRef.current = 0;
    setDuration(0);
    if (addToast) addToast('Local file loaded: ' + file.name, 'success');
    // Local blob URLs can't be shared with other users
  }

  function _playerPlay() {
    if (sourceType === 'youtube') {
      if (playerRef.current) { try { playerRef.current.playVideo(); } catch(e) {} }
    } else if (videoRef2.current) {
      videoRef2.current.play().catch(function() {});
    }
  }

  function _playerPause() {
    if (sourceType === 'youtube') {
      if (playerRef.current) { try { playerRef.current.pauseVideo(); } catch(e) {} }
    } else if (videoRef2.current) {
      videoRef2.current.pause();
    }
  }

  function _playerSeekTo(pos) {
    if (sourceType === 'youtube') {
      if (playerRef.current) { try { playerRef.current.seekTo(pos, true); } catch(e) {} }
    } else if (videoRef2.current) {
      videoRef2.current.currentTime = pos;
    }
  }

  function handlePlay() {
    var pos = posRef.current;
    setPlaying(true);
    _playerPlay();
    if (socket && roomId) {
      socket.emit('watch-party-play', { roomId: roomId, position: pos, timestamp: Date.now() });
    }
  }

  function handlePause() {
    var pos = posRef.current;
    setPlaying(false);
    _playerPause();
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
    _playerSeekTo(newPos);
    if (socket && roomId) {
      socket.emit('watch-party-seek', { roomId: roomId, position: newPos });
    }
  }

  function handleSyncAll() {
    var pos = posRef.current;
    if (socket && roomId) {
      socket.emit('watch-party-sync', {
        roomId:   roomId,
        videoId:  videoId || null,
        url:      directUrl || '',
        type:     sourceType,
        position: pos,
        playing:  playing
      });
    }
    if (addToast) addToast('Synced all viewers to current position', 'success');
  }

  function handleCreateParty() {
    setShowCreatePanel(false);
    setWatchPartyActive(true);
    if (socket) socket.emit('watch-party-start', { roomId: roomId });
    // Auto-broadcast whatever URL/file was entered in the create panel
    var raw = urlInput.trim();
    if (raw && sourceType === 'youtube') {
      var vid = extractYtId(raw);
      if (vid) {
        setVideoId(vid);
        if (socket && roomId) socket.emit('watch-party-url', { roomId: roomId, videoId: vid, url: raw, type: 'youtube' });
      }
    } else if (raw && sourceType === 'direct') {
      setDirectUrl(raw);
      if (socket && roomId) socket.emit('watch-party-url', { roomId: roomId, videoId: null, url: raw, type: 'direct' });
    } else if (localFileUrl) {
      setDirectUrl(localFileUrl);
    }
    if (addToast) addToast('Watch Party started!', 'success');
  }

  // ── Screen Share ──────────────────────────────
  function handleScreenShare() {
    if (!isHost) return;
    navigator.mediaDevices.getDisplayMedia({ video: { width: 3840, height: 2160 }, audio: true })
      .then(function(stream) {
        screenStreamRef.current = stream;
        setScreenSharing(true);
        if (addToast) addToast('Screen sharing started', 'success');
        if (socket && roomId) {
          socket.emit('screen-share-start', { roomId: roomId, userId: props.userId, username: props.username });
        }
        // Auto-stop when track ends
        var track = stream.getVideoTracks()[0];
        if (track) {
          screenTrackRef.current = track;
          track.addEventListener('ended', function() {
            handleStopScreenShare();
          });
        }
      })
      .catch(function(err) {
        if (err.name !== 'NotAllowedError') {
          if (addToast) addToast('Screen share error: ' + err.message, 'error');
        }
      });
  }

  function handleStopScreenShare() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    screenTrackRef.current = null;
    setScreenSharing(false);
    if (socket && roomId) {
      socket.emit('screen-share-stop', { roomId: roomId });
    }
  }

  // ── 4K Toggle ─────────────────────────────────
  function toggle4K() {
    setIs4K(function(prev) { return !prev; });
    if (addToast) addToast(!is4K ? '4K quality enabled' : '4K quality disabled', 'info');
  }

  // ── Sync Watch ────────────────────────────────
  function handleSyncWatch(action) {
    if (!isHost || !socket || !roomId) return;
    var pos = posRef.current;
    socket.emit('watch-sync', { roomId: roomId, action: action, position: pos });
    if (action === 'play') handlePlay();
    else if (action === 'pause') handlePause();
    if (addToast) addToast('Sync – ' + action + ' sent to all viewers', 'success');
  }

  // ── Queue handlers ───────────────────────────
  function handleAddToQueue() {
    var raw = queueInput.trim();
    if (!raw) { if (addToast) addToast('Enter a URL to add', 'error'); return; }
    var vid = extractYtId(raw);
    var item;
    if (vid) {
      item = { id: Date.now() + Math.random(), title: raw, url: raw, videoId: vid, type: 'youtube', addedBy: 'host', duration: 0 };
    } else {
      item = { id: Date.now() + Math.random(), title: raw.split('/').pop() || raw, url: raw, videoId: null, type: 'direct', addedBy: 'host', duration: 0 };
    }
    setQueue(function(q) { return q.concat([item]); });
    setQueueInput('');
    if (addToast) addToast('Added to queue', 'success');
  }

  function handleQueueMove(idx, dir) {
    setQueue(function(q) {
      var arr = q.slice();
      var target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      var tmp     = arr[idx];
      arr[idx]    = arr[target];
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
    setCurrentTitle(item.title || item.url);
    setUrlInput(item.url || '');
    setPosition(0); posRef.current = 0;
    if (item.videoId) {
      setVideoId(item.videoId); setDirectUrl(''); setSourceType('youtube');
      if (socket && roomId) socket.emit('watch-party-url', { roomId: roomId, videoId: item.videoId, url: item.url, type: 'youtube' });
    } else {
      setDirectUrl(item.url); setVideoId(''); setSourceType('direct');
      if (socket && roomId) socket.emit('watch-party-url', { roomId: roomId, videoId: null, url: item.url, type: 'direct' });
    }
  }

  // ── Reaction handlers ────────────────────────
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

  // ── Chat handler ─────────────────────────────
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

      <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />

      {/* ── URL INPUT ROW (host only, when active) ── */}
      {watchPartyActive && isHost && (
        <div style={{ background: SURF, borderBottom: '1px solid ' + BORDER, padding: '6px 10px', display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Source type picker */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {[{ k: 'youtube', l: '▶ YT' }, { k: 'direct', l: '🎥 URL/File' }].map(function(s) {
              return (
                <button key={s.k} onClick={function() { setSourceType(s.k); }}
                  style={{ background: sourceType === s.k ? 'rgba(201,168,76,.2)' : 'transparent', border: '1px solid ' + (sourceType === s.k ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 5, padding: '4px 8px', color: sourceType === s.k ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer', letterSpacing: .5 }}>
                  {s.l}
                </button>
              );
            })}
          </div>
          <input
            value={urlInput}
            onChange={function(e) { setUrlInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleLoadUrl(); }}
            placeholder={sourceType === 'direct' ? 'Paste MP4/WebM/HLS URL...' : 'Paste YouTube URL...'}
            style={{ flex: 1, background: 'rgba(14,12,9,.9)', border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none', minWidth: 100 }}
          />
          {sourceType === 'direct' && (
            <button
              onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
              style={{ background: 'rgba(212,133,74,.1)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 6, padding: '6px 8px', color: AMBER, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', flexShrink: 0, letterSpacing: .5 }}>
              📂 FILE
            </button>
          )}
          <input type="file" ref={fileInputRef} accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          <button
            onClick={handleLoadUrl}
            style={{ background: BURG, border: 'none', borderRadius: 6, padding: '6px 12px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
            LOAD
          </button>
          {/* Queue toggle */}
          <button
            onClick={function() { setShowQueue(function(o) { return !o; }); }}
            style={{ background: showQueue ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (showQueue ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 6, padding: '6px 10px', color: showQueue ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
            {'☰'} QUEUE{queue.length > 0 ? ' (' + queue.length + ')' : ''}
          </button>
          {/* Add to queue */}
          {showQueue && (
            <input
              value={queueInput}
              onChange={function(e) { setQueueInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handleAddToQueue(); }}
              placeholder="Add URL to queue..."
              style={{ width: 140, background: 'rgba(14,12,9,.9)', border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }}
            />
          )}
          {showQueue && (
            <button
              onClick={handleAddToQueue}
              style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, padding: '6px 12px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
              + QUEUE
            </button>
          )}
        </div>
      )}

      {/* ── CREATE PARTY PANEL ── */}
      {showCreatePanel && !watchPartyActive && (
        <div style={{
          background: 'rgba(26,21,16,.92)',
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
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(14,12,9,.9)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, outline: 'none', marginBottom: 12 }}
          />

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Video Source</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { key: 'youtube', label: '🔴 YouTube',    enabled: true },
              { key: 'twitch',  label: '🟤 Twitch',     enabled: false },
              { key: 'direct',  label: '🎥 Direct / File', enabled: true }
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
            placeholder={sourceType === 'direct' ? 'Paste MP4/WebM/HLS URL...' : 'Paste YouTube URL (youtube.com/watch?v=...)'}
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(14,12,9,.9)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, outline: 'none', marginBottom: sourceType === 'direct' ? 6 : 6 }}
          />

          {sourceType === 'direct' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.1)' }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.1)' }} />
            </div>
          )}

          {sourceType === 'direct' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
                style={{ width: '100%', background: 'rgba(212,133,74,.08)', border: '1px dashed rgba(212,133,74,.4)', borderRadius: 7, padding: '10px', color: AMBER, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1, marginBottom: 8 }}>
                📂 UPLOAD FROM DEVICE
              </button>
              {localFileUrl && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: AMBER, marginBottom: 6, letterSpacing: 1 }}>
                  ✓ {currentTitle || 'File loaded'} (device-only — not shared to room)
                </div>
              )}
              {sourceType === 'direct' && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>
                  Supports MP4, WebM, HLS (.m3u8). Direct URLs sync to all guests. Device uploads are local only.
                </div>
              )}
            </div>
          )}

          {ytDetected && sourceType === 'youtube' && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: AMBER, marginBottom: 8, letterSpacing: 1 }}>
              ▶ YouTube video detected ✓
            </div>
          )}

          {ytDetected && sourceType === 'youtube' && videoId && (
            <img
              src={'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg'}
              alt="Thumbnail"
              style={{ width: '100%', borderRadius: 8, marginBottom: 10, objectFit: 'cover', maxHeight: 100 }}
            />
          )}

          <button
            onClick={handleCreateParty}
            style={{ width: '100%', background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '10px 0', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>
            🎉 START WATCH PARTY
          </button>
        </div>
      )}

      {/* ── START PARTY BUTTON ── */}
      {isHost && !watchPartyActive && !showCreatePanel && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid ' + DIM, flexShrink: 0 }}>
          <button
            onClick={handleStartWatchParty}
            style={{ width: '100%', background: 'linear-gradient(135deg,rgba(128,0,32,.7),rgba(192,24,56,.5))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '9px 0', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 2 }}>
            🎉 START WATCH PARTY
          </button>
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

            {/* Screen share banner (own) */}
            {screenSharing && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(128,0,32,.85)', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20, animation: 'screenShareBadge 2s ease infinite' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, letterSpacing: 1 }}>🖥 Sharing your screen</span>
                <button onClick={handleStopScreenShare} style={{ background: RED, border: 'none', borderRadius: 4, padding: '3px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>STOP</button>
              </div>
            )}

            {/* Remote screen share badge */}
            {remoteScreenUser && !screenSharing && (
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(36,28,18,.9)', border: '1px solid ' + BORDER, borderRadius: 999, padding: '4px 12px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, zIndex: 15, whiteSpace: 'nowrap' }}>
                👁 {remoteScreenUser} is sharing screen
              </div>
            )}

            {/* 4K badge — top right */}
            {isHost && (
              <button
                onClick={toggle4K}
                style={{ position: 'absolute', top: screenSharing ? 36 : 8, right: 8, background: is4K ? GOLD : 'rgba(36,28,18,.8)', border: '1px solid ' + (is4K ? BURG : BORDER), borderRadius: 4, padding: '3px 8px', color: is4K ? BG : MUTED, fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 9, cursor: 'pointer', letterSpacing: 1, zIndex: 15 }}>
                4K
              </button>
            )}

            {/* Player area: YouTube / Direct HTML5 / Placeholder */}
            {videoId ? (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div ref={ytDivRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              </div>
            ) : directUrl ? (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
                <video
                  ref={videoRef2}
                  src={directUrl}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  controls={isHost}
                  onTimeUpdate={function() {
                    if (!videoRef2.current) return;
                    var t = videoRef2.current.currentTime;
                    posRef.current = t;
                    setPosition(Math.floor(t));
                  }}
                  onDurationChange={function() {
                    if (videoRef2.current && !isNaN(videoRef2.current.duration)) {
                      setDuration(Math.floor(videoRef2.current.duration));
                    }
                  }}
                  onPlay={function() { setPlaying(true); }}
                  onPause={function() { setPlaying(false); }}
                  onEnded={function() {
                    setPlaying(false);
                    setQueue(function(q) {
                      if (q.length === 0) return q;
                      var next = q[0];
                      var rest = q.slice(1);
                      setCurrentTitle(next.title || next.url);
                      setUrlInput(next.url || '');
                      setPosition(0); posRef.current = 0;
                      if (next.videoId) {
                        setVideoId(next.videoId); setDirectUrl(''); setSourceType('youtube');
                        if (socket && roomId) socket.emit('watch-party-url', { roomId: roomId, videoId: next.videoId, url: next.url, type: 'youtube' });
                      } else {
                        setDirectUrl(next.url); setVideoId(''); setSourceType('direct');
                        if (socket && roomId) socket.emit('watch-party-url', { roomId: roomId, videoId: null, url: next.url, type: 'direct' });
                      }
                      return rest;
                    });
                  }}
                />
                {localFileUrl && directUrl === localFileUrl && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(212,133,74,.85)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: BG, letterSpacing: 1 }}>
                    📂 LOCAL FILE
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 20px' }}>
                <div style={{ fontSize: 48, opacity: 0.2 }}>📺</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: MUTED, letterSpacing: 3, textAlign: 'center', lineHeight: 1.3 }}>
                  {isHost ? 'LOAD A VIDEO OR FILE ABOVE TO START' : 'WAITING FOR HOST TO LOAD A VIDEO'}
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

            {/* ±Nms sync badge */}
            {(videoId || directUrl) {videoId && ({videoId && ( (
              <div style={{
                position: 'absolute', top: 8,
                right: is4K && isHost ? 50 : 8,
                background: 'rgba(14,12,9,.82)',
                border: '1px solid ' + (syncMs === null ? BORDER : syncMs < 100 ? 'rgba(80,200,80,.5)' : syncMs < 500 ? 'rgba(212,133,74,.5)' : 'rgba(255,26,60,.5)'),
                borderRadius: 999, padding: '3px 10px',
                fontFamily: "'DM Mono',monospace", fontSize: 8,
                color: syncMs === null ? MUTED : syncMs < 100 ? '#50C850' : syncMs < 500 ? AMBER : RED,
                zIndex: 15
              }}>
                {syncMs === null ? '🔗 SYNC' : '±' + syncMs + 'ms'}
              </div>
            )}

            {/* Guest count badge */}
            {liveGuests.length > 0 && (
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(14,12,9,.75)', border: '1px solid ' + DIM, borderRadius: 999, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEXT, zIndex: 15 }}>
                👁 {liveGuests.length} watching
              </div>
            )}

            {/* ── REACTION BAR ── */}
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

          {/* ── CO-WATCHER PRESENCE STRIP ── */}
          {liveGuests.length > 0 && (
            <div style={{ background: CARD, borderTop: '1px solid ' + BORDER, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, minHeight: 52 }}>
              {/* Live dot + count */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C', animation: 'watchPulse 1.2s ease infinite' }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: TEXT, letterSpacing: 1 }}>{liveGuests.length}</span>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED, letterSpacing: .5 }}>WATCHING</span>
              </div>
              {/* Avatar chips with name */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, alignItems: 'center', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {liveGuests.slice(0, 12).map(function(g) {
                  var name     = g.username || 'Guest';
                  var initials = getInitials(name);
                  var acolor   = avatarColor(name);
                  var isLast   = g === liveGuests[liveGuests.length - 1];
                  return (
                    <div key={g.userId || g.guestId || name} title={name}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'linear-gradient(135deg,' + acolor + ',' + acolor + 'BB)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT,
                        border: '2px solid ' + CARD,
                        boxShadow: '0 0 0 1px ' + BORDER,
                        userSelect: 'none',
                      }}>
                        {initials}
                      </div>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED, maxWidth: 32, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name.length > 6 ? name.slice(0, 5) + '…' : name}
                      </span>
                    </div>
                  );
                })}
                {liveGuests.length > 12 && (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0, border: '2px solid ' + CARD }}>
                    +{liveGuests.length - 12}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AI SUMMARY PANEL ── */}
          {(showAiPanel || aiSummary) && (
            <div style={{ background: CARD, borderTop: '1px solid ' + BORDER, padding: '10px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1 }}>✨ AI SUMMARY</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {isHost && (
                    <button
                      onClick={function() {
                        if (aiLoading) return;
                        setAiLoading(true);
                        var msgs = (chat || []).slice(-50).map(function(m) { return (m.username || 'Guest') + ': ' + (m.message || m.text || ''); }).join('\n');
                        fetch('/api/summarize-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs }) })
                          .then(function(r) { return r.json(); })
                          .then(function(d) { setAiSummary(d.summary || 'No summary available.'); setAiLoading(false); })
                          .catch(function() { setAiSummary('Could not generate summary.'); setAiLoading(false); });
                      }}
                      style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 4, padding: '2px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: aiLoading ? 'default' : 'pointer' }}>
                      {aiLoading ? '...' : '↻ REFRESH'}
                    </button>
                  )}
                  <button onClick={function() { setShowAiPanel(false); setAiSummary(''); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 11, cursor: 'pointer', padding: '0 2px' }}>✕</button>
                </div>
              </div>
              <div style={{ borderLeft: '2px solid ' + GOLD, paddingLeft: 10, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.4, minHeight: 32 }}>
                {aiLoading ? (
                  <span style={{ color: MUTED }}>Summarizing chat...</span>
                ) : aiSummary ? aiSummary : (
                  <span style={{ color: MUTED }}>Click Refresh to generate a chat summary.</span>
                )}
              </div>
            </div>
          )}

          {/* ── CONTROLS BAR ── */}
          <div style={{ background: BG, borderTop: '1px solid ' + DIM, padding: '8px 12px', flexShrink: 0 }}>
            {/* Scrubber */}
            {(videoId || directUrl) {videoId && ({videoId && ( (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {/* Play / Pause */}
              {isHost && videoId ? (
                <button
                  onClick={playing ? handlePause : handlePlay}
                  style={{ background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 8, padding: '7px 14px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {playing ? '⏸ PAUSE' : '▶ PLAY'}
                </button>
              ) : (
                <div style={{ background: 'rgba(128,0,32,.18)', border: '1px solid ' + DIM, borderRadius: 8, padding: '7px 12px', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, flexShrink: 0 }}>
                  {playing ? '▶ PLAYING' : '⏸ PAUSED'}
                </div>
              )}

              {/* Timestamp */}
              {(videoId || directUrl) {videoId && ({videoId && ( (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, flexShrink: 0 }}>
                  {fmtS(position)}{duration > 0 ? ' / ' + fmtS(duration) : ''}
                </span>
              )}

              <div style={{ flex: 1 }} />

              {/* Screen share — host only */}
              {isHost && (
                <button
                  onClick={screenSharing ? handleStopScreenShare : handleScreenShare}
                  style={{ background: screenSharing ? 'rgba(255,26,60,.15)' : 'rgba(36,28,18,.8)', border: '1px solid ' + (screenSharing ? RED : BORDER), borderRadius: 6, padding: '5px 8px', color: screenSharing ? RED : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {screenSharing ? '🖥 STOP SHARE' : '🖥 SHARE SCREEN'}
                </button>
              )}

              {/* SYNC button — host only, for YouTube sync-watch */}
              {isHost {isHost && videoId && ({isHost && videoId && ( (videoId || directUrl) {isHost && videoId && ({isHost && videoId && ( (
                <button
                  onClick={function() {
                    setSyncActive(function(s) { return !s; });
                    if (!syncActive) {
                      handleSyncWatch(playing ? 'play' : 'pause');
                    }
                  }}
                  style={{ background: syncActive ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (syncActive ? GOLD : DIM), borderRadius: 6, padding: '5px 8px', color: syncActive ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  🔗 SYNC
                </button>
              )}

              {/* Sync all — host only */}
              {isHost {isHost && videoId && ({isHost && videoId && ( (videoId || directUrl) {isHost && videoId && ({isHost && videoId && ( (
                <button
                  onClick={handleSyncAll}
                  style={{ background: 'rgba(212,133,74,.12)', border: '1px solid rgba(212,133,74,.35)', borderRadius: 6, padding: '5px 8px', color: AMBER, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  ⟳ SYNC ALL
                </button>
              )}

              {/* Sync toggle */}
              <button
                onClick={function() { setSynced(function(s) { return !s; }); }}
                style={{ background: synced ? 'rgba(212,133,74,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (synced ? 'rgba(212,133,74,.4)' : DIM), borderRadius: 6, padding: '5px 8px', color: synced ? AMBER : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                {synced ? '🔗 SYNCED' : '⛓ SYNC'}
              </button>

              {/* Chat toggle */}
              <button
                onClick={function() { setChatOpen(function(o) { return !o; }); }}
                style={{ background: chatOpen ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (chatOpen ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 6, padding: '5px 8px', color: chatOpen ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                💬 CHAT{chatMsgs.length > 0 ? ' (' + chatMsgs.length + ')' : ''}
              </button>
              {/* AI Summary toggle */}
              <button
                onClick={function() { setShowAiPanel(function(o) { return !o; }); }}
                style={{ background: showAiPanel ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (showAiPanel ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 6, padding: '5px 8px', color: showAiPanel ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>
                ✨ AI
              </button>
            </div>
          </div>

          {/* ── VIDEO QUEUE PANEL ── */}
          {showQueue && (
            <div style={{ background: SURF, borderTop: '1px solid ' + BORDER, padding: '10px 12px', flexShrink: 0, maxHeight: 260, overflowY: 'auto' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: TEXT, letterSpacing: 2, marginBottom: 8 }}>VIDEO QUEUE</div>
              {queue.length === 0 ? (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: DIM, textAlign: 'center', padding: '12px 0' }}>
                  Queue is empty{isHost ? ' — add YouTube URLs above' : ''}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {queue.map(function(item, idx) {
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD2, borderRadius: 8, padding: '7px 10px', border: '1px solid ' + BORDER }}>
                        <img
                          src={'https://img.youtube.com/vi/' + item.videoId + '/default.jpg'}
                          alt=""
                          style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {idx + 1}. {item.title || item.videoId}
                          </div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{item.videoId}</div>
                        </div>
                        {isHost && (
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={function() { handlePlayFromQueue(idx); }}
                              style={{ background: 'rgba(212,133,74,.15)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 5, padding: '3px 8px', color: AMBER, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
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
            <div style={{ padding: '10px 12px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: TEXT, letterSpacing: 2 }}>PARTY CHAT</span>
              <button
                onClick={function() { setChatOpen(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, padding: 0 }}>
                ✕
              </button>
            </div>
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
            <div style={{ padding: '8px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 6 }}>
              <input
                value={chatInput}
                onChange={function(e) { setChatInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') handleChatSend(); }}
                placeholder="Say something..."
                style={{ flex: 1, background: 'rgba(14,12,9,.9)', border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, outline: 'none' }}
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
