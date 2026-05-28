import React, { useState, useEffect, useRef } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var OCT_CLIP = 'polygon(29% 0%,71% 0%,100% 29%,100% 71%,71% 100%,29% 100%,0% 71%,0% 29%)';

function extractYtId(url) {
  if (!url) return '';
  var m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtS(s) { s = Math.floor(s) || 0; return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

export default function WatchPartyTab({ guests, socket, roomId, role, addToast, isLive }) {
  var [urlInput, setUrlInput] = useState('');
  var [videoId,  setVideoId]  = useState('');
  var [playing,  setPlaying]  = useState(false);
  var [position, setPosition] = useState(0);
  var [duration, setDuration] = useState(0);
  var [ytReady,  setYtReady]  = useState(false);
  var [synced,   setSynced]   = useState(true);
  var [reacts,   setReacts]   = useState([]);
  var [guestCount, setGuestCount] = useState(0);

  var [watchPartyActive, setWatchPartyActive] = useState(false);
  var [partyViewers, setPartyViewers] = useState(0);
  var partyViewerRef = useRef(null);

  var [partyName, setPartyName] = useState('');
  var [sourceType, setSourceType] = useState('youtube');
  var [ytDetected, setYtDetected] = useState(false);
  var [showCreatePanel, setShowCreatePanel] = useState(true);

  var playerRef  = useRef(null);
  var posRef     = useRef(0);
  var tickRef    = useRef(null);
  var ytDivRef   = useRef(null);

  var isHost = role === 'host' || role === 'cohost';
  var liveGuests = (guests || []).filter(function(g) { return g.live !== false; });

  // YouTube URL auto-detection
  useEffect(function() {
    var id = extractYtId(urlInput);
    setYtDetected(id.length > 0);
    if (id) setVideoId(id);
  }, [urlInput]);

  // Party viewer drift simulation
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

  // Load YouTube IFrame API once
  useEffect(function() {
    if (window.YT && window.YT.Player) {
      setYtReady(true);
      return;
    }
    var existing = document.getElementById('yt-api-script');
    var origCb = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      setYtReady(true);
      if (origCb) origCb();
    };
    if (!existing) {
      var script = document.createElement('script');
      script.id = 'yt-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }, []);

  // Create / recreate YT player when videoId + ytReady both set
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
          width: '100%',
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
              if (dur) setDuration(dur);
            },
            onStateChange: function(e) {
              if (e.data === 1) {
                setPlaying(true);
              } else if (e.data === 2 || e.data === 0) {
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

  // Position ticker while playing
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
        if (typeof d === 'number' && d > 0) setDuration(d);
      } catch(e) {}
    }, 500);
    return function() { clearInterval(tickRef.current); };
  }, [playing]);

  // Socket sync
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

    socket.on('watch-party-url',   onWatchUrl);
    socket.on('watch-party-play',  onWatchPlay);
    socket.on('watch-party-pause', onWatchPause);
    socket.on('watch-party-seek',  onWatchSeek);
    socket.on('watch-party-sync',  onWatchSync);

    // Request current state on tab mount (for late-joiners)
    if (!isHost && socket && roomId) {
      socket.emit('watch-party-sync-request', { roomId: roomId });
    }

    return function() {
      socket.off('watch-party-url',   onWatchUrl);
      socket.off('watch-party-play',  onWatchPlay);
      socket.off('watch-party-pause', onWatchPause);
      socket.off('watch-party-seek',  onWatchSeek);
      socket.off('watch-party-sync',  onWatchSync);
    };
  }, [socket, isHost]);

  function handleStartWatchParty() {
    setWatchPartyActive(true);
    if (addToast) addToast('🎉 Watch party started!', 'success');
    if (socket) {
      socket.emit('watch-party-start', { roomId: roomId });
    }
  }

  function handleEndWatchParty() {
    setWatchPartyActive(false);
    setPartyViewers(0);
    if (partyViewerRef.current) {
      clearInterval(partyViewerRef.current);
      partyViewerRef.current = null;
    }
    if (addToast) addToast('Watch party ended', 'info');
  }

  function handleLoadUrl() {
    var vid = extractYtId(urlInput.trim());
    if (!vid) {
      if (addToast) addToast('Invalid YouTube URL — paste a full youtube.com/watch?v= link', 'error');
      return;
    }
    setVideoId(vid);
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
    if (playerRef.current) {
      try { playerRef.current.playVideo(); } catch(e) {}
    }
    if (socket && roomId) {
      socket.emit('watch-party-play', { roomId: roomId, position: pos, timestamp: Date.now() });
    }
  }

  function handlePause() {
    var pos = posRef.current;
    setPlaying(false);
    if (playerRef.current) {
      try { playerRef.current.pauseVideo(); } catch(e) {}
    }
    if (socket && roomId) {
      socket.emit('watch-party-pause', { roomId: roomId, position: pos });
    }
  }

  function handleSeekClick(e) {
    if (!isHost) return;
    var r = e.currentTarget.getBoundingClientRect();
    var pct = (e.clientX - r.left) / r.width;
    var newPos = pct * (duration || 1);
    posRef.current = newPos;
    setPosition(Math.floor(newPos));
    if (playerRef.current) {
      try { playerRef.current.seekTo(newPos, true); } catch(e2) {}
    }
    if (socket && roomId) {
      socket.emit('watch-party-seek', { roomId: roomId, position: newPos });
    }
  }

  function sendReact(emoji) {
    var id = Date.now() + Math.random();
    setReacts(function(p) {
      return p.slice(-20).concat([{ id: id, emoji: emoji, x: rnd(5, 88), sz: rnd(22, 34), dur: rnd(16, 22) / 10 }]);
    });
    setTimeout(function() {
      setReacts(function(p) { return p.filter(function(r) { return r.id !== id; }); });
    }, 2400);
  }

  var prog = duration > 0 ? Math.min(100, Math.floor((position / duration) * 100)) : 0;

  function handleCreateParty() {
    setShowCreatePanel(false);
    setWatchPartyActive(true);
    if (addToast) addToast('Watch Party started! Sharing with room.', 'success');
    if (socket) {
      socket.emit('watch-party-start', { roomId: roomId });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* CREATE PARTY PANEL */}
      {showCreatePanel && !watchPartyActive && (
        <div style={{
          background: 'rgba(22,16,32,.8)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 12,
          padding: '16px',
          margin: '8px',
          flexShrink: 0
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>📺</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#EDE8F5', letterSpacing: 2 }}>WATCH PARTY</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#7A6F90', marginBottom: 12, letterSpacing: 1 }}>
            Watch together in sync with chat
          </div>

          {/* Party name input */}
          <input
            value={partyName}
            onChange={function(e) { setPartyName(e.target.value); }}
            placeholder="Party room name..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(7,5,10,.9)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 7,
              padding: '8px 10px',
              color: '#EDE8F5',
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              outline: 'none',
              marginBottom: 12
            }}
          />

          {/* VIDEO SOURCE toggle */}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
            Video Source
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button
              onClick={function() { setSourceType('youtube'); }}
              style={{
                flex: 1,
                background: sourceType === 'youtube' ? 'rgba(201,168,76,.2)' : 'transparent',
                border: '1px solid ' + (sourceType === 'youtube' ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.1)'),
                borderRadius: 7,
                padding: '7px 0',
                color: sourceType === 'youtube' ? '#C9A84C' : '#7A6F90',
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 1
              }}>
              🔴 YouTube URL
            </button>
            <button
              onClick={function() { setSourceType('direct'); }}
              style={{
                flex: 1,
                background: sourceType === 'direct' ? 'rgba(201,168,76,.2)' : 'transparent',
                border: '1px solid ' + (sourceType === 'direct' ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.1)'),
                borderRadius: 7,
                padding: '7px 0',
                color: sourceType === 'direct' ? '#C9A84C' : '#7A6F90',
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 1
              }}>
              🎥 Direct URL
            </button>
          </div>

          {/* URL input */}
          <input
            value={urlInput}
            onChange={function(e) { setUrlInput(e.target.value); }}
            placeholder={sourceType === 'youtube' ? 'Paste YouTube URL (youtube.com/watch?v=...)' : 'Paste direct video URL...'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(7,5,10,.9)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 7,
              padding: '8px 10px',
              color: '#EDE8F5',
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              outline: 'none',
              marginBottom: 6
            }}
          />

          {/* YouTube detected indicator */}
          {ytDetected && sourceType === 'youtube' && (
            <div style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 9,
              color: '#FF1564',
              marginBottom: 8,
              letterSpacing: 1
            }}>
              ▶ YouTube video detected ✓
            </div>
          )}

          {/* Thumbnail preview */}
          {ytDetected && sourceType === 'youtube' && videoId && (
            <div style={{ marginBottom: 12 }}>
              <img
                src={'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg'}
                alt="YouTube thumbnail"
                style={{
                  width: '100%',
                  borderRadius: 8,
                  aspectRatio: '16/9',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreateParty}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg,#C9A84C,#E8C46A)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              color: '#07050A',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              letterSpacing: 2
            }}>
            + Create Watch Party
          </button>
        </div>
      )}

      {/* HOST IS LIVE banner */}
      {isLive && (
        <div style={{ background: 'linear-gradient(90deg,rgba(128,0,32,.7),rgba(192,24,56,.5))', borderBottom: '1px solid rgba(192,24,56,.5)', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3030', boxShadow: '0 0 6px #FF3030' }} />
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#C9A84C', letterSpacing: 2 }}>HOST IS LIVE</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#EDE8F5', opacity: 0.7, marginLeft: 4 }}>Stream is active · {liveGuests.length} in room</span>
        </div>
      )}

      {/* Watch party status bar */}
      {watchPartyActive && (
        <div style={{ background: isLive ? 'rgba(0,201,167,.08)' : 'rgba(245,158,11,.08)', border: '1px solid ' + (isLive ? 'rgba(0,201,167,.3)' : 'rgba(245,158,11,.35)'), margin: '6px 8px 0', borderRadius: 8, padding: '7px 10px', flexShrink: 0 }}>
          {isLive ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#00C9A7', letterSpacing: 1 }}>{partyViewers}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90' }}>viewers</span>
                  <div style={{ background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.35)', borderRadius: 999, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: '#00C9A7', letterSpacing: 1 }}>
                    WATCHING TOGETHER
                  </div>
                </div>
                <button
                  onClick={handleEndWatchParty}
                  style={{ background: 'rgba(255,30,30,.12)', border: '1px solid rgba(255,30,30,.35)', borderRadius: 6, padding: '4px 10px', color: '#FF5555', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  END PARTY
                </button>
              </div>
              {/* Synergy bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', letterSpacing: 1, flexShrink: 0 }}>SYNERGY</span>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: Math.min(100, liveGuests.length * 5) + '%',
                    height: '100%',
                    background: 'linear-gradient(90deg,#00C9A7,#C9A84C)',
                    borderRadius: 3,
                    transition: 'width .5s ease',
                  }} />
                </div>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: '#C9A84C', letterSpacing: 1, flexShrink: 0 }}>{Math.min(100, liveGuests.length * 5)}%</span>
              </div>
              {/* Participant avatar strip */}
              {liveGuests.length > 0 && (
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginTop: 8, paddingBottom: 2 }}>
                  {liveGuests.slice(0, 20).map(function(g) {
                    return (
                      <div key={g.userId || g.guestId} style={{ flexShrink: 0 }}>
                        <AvatarPortrait username={g.username || 'Guest'} size={32} />
                      </div>
                    );
                  })}
                  {liveGuests.length < 20 && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#3D3450' }}>
                      +{20 - liveGuests.length} open
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: '#F59E0B' }}>⚠️ Stream offline — party paused</span>
          )}
        </div>
      )}

      {/* URL bar — host only */}
      {isHost && (
        <div style={{ background: '#0F0C14', borderBottom: '1px solid #241C34', padding: '8px 10px', display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,0,0,.12)', border: '1px solid rgba(255,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#FF4444', flexShrink: 0 }}>▶</div>
          <input
            value={urlInput}
            onChange={function(e) { setUrlInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleLoadUrl(); }}
            placeholder="Paste YouTube URL (youtube.com/watch?v=...)"
            style={{ flex: 1, background: 'rgba(7,5,10,.9)', border: '1px solid #241C34', borderRadius: 7, padding: '7px 10px', color: '#EDE8F5', fontFamily: "'DM Mono',monospace", fontSize: 10, outline: 'none' }}
          />
          <button
            onClick={handleLoadUrl}
            style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 7, padding: '7px 16px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, letterSpacing: 1 }}>
            LOAD
          </button>
        </div>
      )}

      {/* Start watch party button — host/co-host only, party not active */}
      {isHost && !watchPartyActive && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #241C34', flexShrink: 0 }}>
          <button
            onClick={handleStartWatchParty}
            style={{ width: '100%', background: 'linear-gradient(135deg,rgba(128,0,32,.7),rgba(192,24,56,.5))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '9px 0', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 2 }}>
            🎉 START WATCH PARTY
          </button>
        </div>
      )}

      {/* Video area */}
      <div style={{ flex: 1, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 180 }}>

        {/* Floating reacts */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
          {reacts.map(function(r) {
            return (
              <div key={r.id} style={{ position: 'absolute', left: r.x + '%', bottom: '8%', fontSize: r.sz, animation: 'giftRise ' + r.dur + 's ease forwards', userSelect: 'none' }}>
                {r.emoji}
              </div>
            );
          })}
        </div>

        {/* YouTube player container or placeholder */}
        {videoId ? (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div ref={ytDivRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 20px' }}>
            <div style={{ fontSize: 48, opacity: 0.2 }}>📺</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#7A6F90', letterSpacing: 3, textAlign: 'center', lineHeight: 1.3 }}>
              {isHost ? 'PASTE A YOUTUBE LINK ABOVE TO START THE WATCH PARTY' : 'WAITING FOR HOST TO LOAD A VIDEO'}
            </div>
            {!isHost && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#3D3450', textAlign: 'center' }}>
                All guests will sync automatically when host loads content
              </div>
            )}
            {/* 20-slot participant grid */}
            <div style={{ marginTop: 12, width: '100%', maxWidth: 340 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', letterSpacing: 1 }}>PARTY SLOTS</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#C9A84C', letterSpacing: 1 }}>{liveGuests.length}/20</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                {Array(20).fill(null).map(function(_, i) {
                  var g = liveGuests[i];
                  return g ? (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <AvatarPortrait username={g.username || 'Guest'} size={44} />
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#7A6F90', maxWidth: 46, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{g.username || 'Guest'}</div>
                    </div>
                  ) : (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 44, height: 44, clipPath: OCT_CLIP, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }} />
                      <div style={{ height: 8 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SYNCED badge */}
        {synced && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,201,167,.15)', border: '1px solid rgba(0,201,167,.4)', borderRadius: 999, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00C9A7', zIndex: 15 }}>
            🔗 SYNCED
          </div>
        )}

        {/* Guest count badge */}
        {liveGuests.length > 0 && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(7,5,10,.75)', border: '1px solid #241C34', borderRadius: 999, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#EDE8F5', zIndex: 15 }}>
            👁 {liveGuests.length}
          </div>
        )}

        {/* Reaction bar */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, background: 'rgba(0,0,0,.78)', borderRadius: 999, padding: '4px 10px', zIndex: 5 }}>
          {['🔥', '😂', '💎', '👑', '🎲', '❤️', '⚡', '🌟'].map(function(em) {
            return (
              <button key={em} onClick={function() { sendReact(em); }} style={{ fontSize: 16, cursor: 'pointer', background: 'none', border: 'none', padding: '2px 1px' }}>{em}</button>
            );
          })}
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ background: '#0F0C14', borderTop: '1px solid #241C34', padding: '8px 12px', flexShrink: 0 }}>

        {/* Scrubber */}
        {videoId && (
          <div
            style={{ background: '#241C34', borderRadius: 3, height: 6, cursor: isHost ? 'pointer' : 'default', marginBottom: 9, position: 'relative' }}
            onClick={isHost ? handleSeekClick : undefined}>
            <div style={{ width: prog + '%', height: '100%', background: 'linear-gradient(90deg,#800020,#C01838)', borderRadius: 3, position: 'relative', transition: 'width .3s linear' }}>
              <div style={{ position: 'absolute', right: -6, top: -3, width: 12, height: 12, borderRadius: '50%', background: '#C01838', boxShadow: '0 0 8px rgba(255,26,60,.7)' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Play/Pause */}
          {isHost && videoId ? (
            <button
              onClick={playing ? handlePause : handlePlay}
              style={{ background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 8, padding: '7px 16px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
              {playing ? '⏸ PAUSE' : '▶ PLAY'}
            </button>
          ) : (
            <div style={{ background: 'rgba(128,0,32,.18)', border: '1px solid #241C34', borderRadius: 8, padding: '7px 14px', color: '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
              {playing ? '▶ PLAYING' : '⏸ PAUSED'}
            </div>
          )}

          {/* Timestamp */}
          {videoId && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', flexShrink: 0 }}>
              {fmtS(position)}{duration > 0 ? ' / ' + fmtS(duration) : ''}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Watching count */}
          {liveGuests.length > 0 && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>
              {liveGuests.length} WATCHING
            </div>
          )}

          {/* Sync toggle */}
          <button
            onClick={function() { setSynced(function(s) { return !s; }); }}
            style={{ background: synced ? 'rgba(0,201,167,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (synced ? 'rgba(0,201,167,.4)' : '#241C34'), borderRadius: 6, padding: '5px 10px', color: synced ? '#00C9A7' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
            {synced ? '🔗 SYNCED' : '⛓ SYNC'}
          </button>
        </div>
      </div>
    </div>
  );
}
