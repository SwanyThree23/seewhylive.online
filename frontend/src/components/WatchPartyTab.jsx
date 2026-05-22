import React, { useState, useEffect, useRef } from 'react';

function extractYtId(url) {
  if (!url) return '';
  var m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function fmtS(s) { s = Math.floor(s) || 0; return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

export default function WatchPartyTab({ guests, socket, roomId, role, addToast }) {
  var [urlInput, setUrlInput] = useState('');
  var [videoId,  setVideoId]  = useState('');
  var [playing,  setPlaying]  = useState(false);
  var [position, setPosition] = useState(0);
  var [duration, setDuration] = useState(0);
  var [ytReady,  setYtReady]  = useState(false);
  var [synced,   setSynced]   = useState(true);
  var [reacts,   setReacts]   = useState([]);
  var [guestCount, setGuestCount] = useState(0);

  var playerRef  = useRef(null);
  var posRef     = useRef(0);
  var tickRef    = useRef(null);
  var ytDivRef   = useRef(null);

  var isHost = role === 'host' || role === 'cohost';
  var liveGuests = (guests || []).filter(function(g) { return g.live !== false; });

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

    socket.on('watch-party-url',   onWatchUrl);
    socket.on('watch-party-play',  onWatchPlay);
    socket.on('watch-party-pause', onWatchPause);
    socket.on('watch-party-seek',  onWatchSeek);

    return function() {
      socket.off('watch-party-url',   onWatchUrl);
      socket.off('watch-party-play',  onWatchPlay);
      socket.off('watch-party-pause', onWatchPause);
      socket.off('watch-party-seek',  onWatchSeek);
    };
  }, [socket, isHost]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

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
            {liveGuests.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320, marginTop: 8 }}>
                {liveGuests.slice(0, 6).map(function(g) {
                  return (
                    <div key={g.userId || g.guestId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(128,0,32,.3)', border: '1px solid rgba(201,168,76,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || 'Guest'}</div>
                    </div>
                  );
                })}
              </div>
            )}
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
