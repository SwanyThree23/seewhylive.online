import React, { useState, useEffect, useRef, useCallback } from 'react';
import OctCell from './OctCell.jsx';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import rtcManager from '../webrtc.js';

var MAX_STAGE = 6;
var LAYOUTS = [
  { id: 'panel',  label: '⊞ PANEL' },
  { id: 'solo',   label: '◻ SOLO'  },
  { id: 'talk',   label: '⊡ TALK'  },
  { id: 'screen', label: '🖥 SCRN'  },
];

function RolePill({ role }) {
  var colors = { host: '#C9A84C', cohost: '#00C9A7', guest: '#5A8FFF', viewer: 'rgba(176,160,192,.5)' };
  var bg     = { host: 'rgba(201,168,76,.18)', cohost: 'rgba(0,201,167,.15)', guest: 'rgba(90,143,255,.15)', viewer: 'rgba(36,28,52,.6)' };
  var r      = role || 'viewer';
  return (
    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3, background: bg[r] || bg.viewer, color: colors[r] || colors.viewer, flexShrink: 0 }}>
      {r}
    </span>
  );
}

function LowerThird({ name, role, isMuted, isCamOff, isLive }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 8px', background: 'linear-gradient(transparent,rgba(7,5,10,.85))', zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: '#EDE8F5', letterSpacing: 1, textShadow: '0 1px 6px rgba(0,0,0,.8)', lineHeight: 1.1 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <RolePill role={role} />
            {isMuted   && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', background: 'rgba(255,26,60,.18)', padding: '1px 4px', borderRadius: 3 }}>🔇</span>}
            {isCamOff  && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF6B81', background: 'rgba(255,26,60,.18)', padding: '1px 4px', borderRadius: 3 }}>📵</span>}
          </div>
        </div>
        {isLive && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF1A3C', boxShadow: '0 0 6px #FF1A3C', animation: 'liveBlink 1s infinite', marginBottom: 4 }} />}
      </div>
    </div>
  );
}

export default function RoomTab({ socket, guests, chat, isLive, setIsLive, userId, username, role, roomId, branding, addToast }) {
  var [stageLayout,  setStageLayout]  = useState('panel');
  var [stageGuests,  setStageGuests]  = useState([userId]);
  var [handQueue,    setHandQueue]    = useState([]);
  var [featuredId,   setFeaturedId]   = useState(userId);
  var [isMuted,      setIsMuted]      = useState(false);
  var [isCamOff,     setIsCamOff]     = useState(false);
  var [isScreenShare,setIsScreenShare]= useState(false);
  var [showConfig,   setShowConfig]   = useState(false);
  var [mediaConfig,  setMediaConfig]  = useState(null);
  var [chatOpen,     setChatOpen]     = useState(true);
  var [chatInput,    setChatInput]    = useState('');
  var [rtcReady,     setRtcReady]     = useState(false);
  var [showGuests,   setShowGuests]   = useState(false);
  var chatEndRef     = useRef(null);
  var screenStreamRef = useRef(null);

  useEffect(function() {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(function() {
    if (!socket) return;
    socket.on('join-room-ack', async function(data) {
      if (!data) return;
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        setRtcReady(true);
        addToast('WebRTC ready', 'success');
      } catch(e) {
        addToast('WebRTC: ' + e.message, 'error');
      }
    });
    socket.on('hand-raise', function(data) {
      if (!data) return;
      var gid = data.guestId;
      var gname = data.username || gid;
      setHandQueue(function(q) {
        var already = q.find(function(x) { return x.guestId === gid; });
        if (already) return q;
        return q.concat([{ guestId: gid, username: gname, raisedAt: Date.now() }]);
      });
      if (role === 'host') addToast('✋ ' + gname + ' wants to join the stage', 'info');
    });
    return function() {
      socket.off('join-room-ack');
      socket.off('hand-raise');
    };
  }, [socket, role]);

  function sendChat() {
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: chatInput.trim() });
    setChatInput('');
  }

  function goLive() {
    if (!socket) return;
    socket.emit('go-live', { roomId: roomId, destinations: [] });
  }

  function endBroadcast() {
    if (!socket) return;
    socket.emit('end-broadcast', { roomId: roomId });
    setIsLive(false);
    stopScreenShare();
  }

  function sendHandRaise() {
    if (!socket) return;
    socket.emit('hand-raise', { roomId: roomId, guestId: userId, username: username });
    addToast('✋ Hand raised! Waiting for host...', 'info');
  }

  function inviteToStage(item) {
    setStageGuests(function(s) {
      if (s.indexOf(item.guestId) >= 0) return s;
      if (s.length >= MAX_STAGE) { addToast('Stage full (' + MAX_STAGE + ' max)', 'error'); return s; }
      return s.concat([item.guestId]);
    });
    setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== item.guestId; }); });
    if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: item.guestId });
    addToast(item.username + ' invited to stage', 'success');
  }

  function removeFromStage(gid) {
    if (gid === userId) return;
    setStageGuests(function(s) { return s.filter(function(x) { return x !== gid; }); });
    if (socket) socket.emit('stage-remove', { roomId: roomId, guestId: gid });
    addToast('Removed from stage', 'info');
  }

  function denyHand(gid) {
    setHandQueue(function(q) { return q.filter(function(x) { return x.guestId !== gid; }); });
  }

  function toggleMute() {
    var next = !isMuted;
    setIsMuted(next);
    addToast(next ? '🔇 Muted' : '🎙 Unmuted', 'info');
  }

  function toggleCam() {
    var next = !isCamOff;
    setIsCamOff(next);
    addToast(next ? '📵 Camera off' : '📷 Camera on', 'info');
  }

  async function toggleScreenShare() {
    if (isScreenShare) { stopScreenShare(); return; }
    try {
      var stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      var track = stream.getVideoTracks()[0];
      track.onended = function() { stopScreenShare(); };
      if (rtcManager && rtcReady) await rtcManager.replaceTrack('video', track);
      setIsScreenShare(true);
      setStageLayout('screen');
      addToast('📺 Screen sharing', 'success');
    } catch(e) {
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') addToast('Screen share: ' + e.message, 'error');
    }
  }

  function stopScreenShare() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    setIsScreenShare(false);
    if (stageLayout === 'screen') setStageLayout('panel');
  }

  function handleMediaApply(config) {
    setMediaConfig(config);
    setIsMuted(false);
    setIsCamOff(false);
  }

  // Build stage guest objects
  var allGuestMap = {};
  allGuestMap[userId] = { guestId: userId, username: username, role: role };
  guests.forEach(function(g) {
    var gid = g.guestId ? g.guestId : (g.userId ? g.userId : null);
    if (gid) allGuestMap[gid] = g;
  });
  var stagePeers = stageGuests.map(function(gid) {
    return allGuestMap[gid] || { guestId: gid, username: gid, role: 'guest' };
  });
  var featuredGuest = allGuestMap[featuredId] || stagePeers[0] || { guestId: userId, username: username, role: role };

  var panelClass = 'stage-panel stage-panel--' + Math.min(6, stagePeers.length);

  return (
    <div className="room-root">
      {showConfig && <MediaConfigPanel onClose={function() { setShowConfig(false); }} onApply={handleMediaApply} addToast={addToast} />}

      {/* Broadcast bar */}
      {isLive && (
        <div className="broadcast-bar">
          <div className="broadcast-bar-dot" />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>BROADCASTING LIVE</span>
          {isMuted && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF1A3C', marginLeft: 'auto' }}>⚠ YOU ARE MUTED</span>}
        </div>
      )}

      {/* Stage root */}
      <div className="stage-root">

        {/* Stage toolbar */}
        <div className="stage-toolbar">
          {LAYOUTS.map(function(l) {
            return (
              <button key={l.id}
                onClick={function() { setStageLayout(l.id); }}
                className={'stage-layout-btn' + (stageLayout === l.id ? ' stage-layout-btn--active' : '')}>
                {l.label}
              </button>
            );
          })}
          <button
            onClick={function() { setShowGuests(function(v) { return !v; }); }}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: '4px 8px', background: showGuests ? 'rgba(90,143,255,.15)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (showGuests ? 'rgba(90,143,255,.4)' : '#241C34'), borderRadius: 4, color: showGuests ? '#5A8FFF' : '#7A6F90', cursor: 'pointer', flexShrink: 0 }}>
            👥 {guests.length}
          </button>
          <span className="stage-capacity">{stagePeers.length}/{MAX_STAGE} ON STAGE</span>
        </div>

        {/* GUESTS LIST MODE */}
        {showGuests && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {guests.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#7A6F90', textAlign: 'center', padding: 20 }}>No viewers online</div>}
            {guests.map(function(g) {
              var gid   = g.guestId ? g.guestId : g.userId;
              var onStage = stageGuests.indexOf(gid) >= 0;
              return (
                <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(22,16,32,.7)', border: '1px solid ' + (onStage ? 'rgba(0,201,167,.3)' : '#241C34'), borderRadius: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#161020', border: '1px solid #241C34', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.username || gid}</div>
                    <RolePill role={g.role || 'viewer'} />
                  </div>
                  {onStage && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#00C9A7' }}>ON STAGE</span>}
                  {role === 'host' && !onStage && (
                    <button onClick={function() { inviteToStage({ guestId: gid, username: g.username || gid }); }}
                      style={{ background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.35)', borderRadius: 6, padding: '4px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                      + INVITE
                    </button>
                  )}
                  {role === 'host' && onStage && gid !== userId && (
                    <button onClick={function() { removeFromStage(gid); }}
                      style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '4px 8px', color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                      REMOVE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SOLO layout */}
        {!showGuests && stageLayout === 'solo' && (
          <div className="stage-featured" style={{ flex: 1 }}>
            {featuredGuest ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <OctCell
                  guest={featuredGuest}
                  sz={undefined}
                  isHost={role === 'host'}
                  fadesMode={false}
                  branding={branding}
                  onTap={null}
                  socket={socket}
                  roomId={roomId}
                  userId={userId}
                  rtcManager={rtcReady ? rtcManager : null}
                  mediaConfig={featuredGuest.guestId === userId ? mediaConfig : null}
                  isMuted={featuredGuest.guestId === userId ? isMuted : false}
                  isCamOff={featuredGuest.guestId === userId ? isCamOff : false}
                  onMuteToggle={featuredGuest.guestId === userId ? toggleMute : null}
                  onCamToggle={featuredGuest.guestId === userId ? toggleCam : null}
                />
                <LowerThird name={featuredGuest.username || featuredGuest.guestId} role={featuredGuest.role || role} isMuted={featuredGuest.guestId === userId && isMuted} isCamOff={featuredGuest.guestId === userId && isCamOff} isLive={isLive} />
                {stagePeers.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', gap: 4, padding: '0 8px', justifyContent: 'center', zIndex: 25 }}>
                    {stagePeers.filter(function(g) { var gid = g.guestId ? g.guestId : g.userId; return gid !== featuredId; }).map(function(g) {
                      var gid = g.guestId ? g.guestId : g.userId;
                      return (
                        <button key={gid} onClick={function() { setFeaturedId(gid); }}
                          style={{ background: 'rgba(7,5,10,.8)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '3px 8px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                          {g.username || gid}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="stage-featured-offline">
                <div style={{ fontSize: 36 }}>🎙</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: 'rgba(201,168,76,.4)', letterSpacing: 3 }}>NO SIGNAL</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>Waiting for camera...</div>
              </div>
            )}
          </div>
        )}

        {/* PANEL layout */}
        {!showGuests && stageLayout === 'panel' && (
          <div className={panelClass}>
            {stagePeers.map(function(g) {
              var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
              var isOwn = gid === userId;
              return (
                <div key={gid} className={'stage-panel-cell' + (gid === featuredId ? ' stage-panel-cell--featured' : '')}
                  onClick={function() { setFeaturedId(gid); }}>
                  <OctCell
                    guest={g}
                    sz={120}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={isOwn ? mediaConfig : null}
                    isMuted={isOwn ? isMuted : false}
                    isCamOff={isOwn ? isCamOff : false}
                    onMuteToggle={isOwn ? toggleMute : null}
                    onCamToggle={isOwn ? toggleCam : null}
                  />
                  <LowerThird name={g.username || gid} role={g.role || 'viewer'} isMuted={isOwn && isMuted} isCamOff={isOwn && isCamOff} isLive={isLive} />
                  {!isOwn && role === 'host' && (
                    <button onClick={function(e) { e.stopPropagation(); removeFromStage(gid); }}
                      style={{ position: 'absolute', top: 5, left: 5, zIndex: 30, background: 'rgba(255,26,60,.7)', border: 'none', borderRadius: 4, width: 20, height: 20, color: '#fff', fontSize: 10, cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TALK layout */}
        {!showGuests && stageLayout === 'talk' && (
          <div className="stage-talk">
            <div className="stage-talk-main">
              {featuredGuest && (
                <>
                  <OctCell
                    guest={featuredGuest}
                    sz={undefined}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={featuredGuest.guestId === userId ? mediaConfig : null}
                    isMuted={featuredGuest.guestId === userId ? isMuted : false}
                    isCamOff={featuredGuest.guestId === userId ? isCamOff : false}
                    onMuteToggle={featuredGuest.guestId === userId ? toggleMute : null}
                    onCamToggle={featuredGuest.guestId === userId ? toggleCam : null}
                  />
                  <LowerThird name={featuredGuest.username || featuredGuest.guestId} role={featuredGuest.role || role} isMuted={featuredGuest.guestId === userId && isMuted} isCamOff={featuredGuest.guestId === userId && isCamOff} isLive={isLive} />
                </>
              )}
            </div>
            <div className="stage-talk-sidebar">
              {stagePeers.filter(function(g) { var gid = g.guestId ? g.guestId : g.userId; return gid !== featuredId; }).map(function(g) {
                var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
                var isOwn = gid === userId;
                return (
                  <div key={gid} className="stage-talk-mini" onClick={function() { setFeaturedId(gid); }}>
                    <OctCell guest={g} sz={90} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false}
                      onMuteToggle={isOwn ? toggleMute : null} onCamToggle={isOwn ? toggleCam : null} />
                    <LowerThird name={g.username || gid} role={g.role || 'viewer'} isMuted={isOwn && isMuted} isCamOff={isOwn && isCamOff} isLive={isLive} />
                  </div>
                );
              })}
              {stagePeers.length < MAX_STAGE && role === 'host' && (
                <div style={{ border: '1px dashed rgba(201,168,76,.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16/9', cursor: 'pointer', color: 'rgba(201,168,76,.3)', fontFamily: "'DM Mono',monospace", fontSize: 8 }}
                  onClick={function() { setShowGuests(true); }}>
                  + INVITE
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN layout */}
        {!showGuests && stageLayout === 'screen' && (
          <div className="stage-screen">
            <div className="stage-screen-main">
              {isScreenShare ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🖥</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#5A8FFF', letterSpacing: 2 }}>SCREEN SHARING</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', marginTop: 4 }}>Your screen is broadcasting to viewers</div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 36 }}>🖥</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: 'rgba(90,143,255,.5)', letterSpacing: 2 }}>NO SCREEN SHARE</div>
                  <button onClick={toggleScreenShare}
                    style={{ background: 'rgba(90,143,255,.15)', border: '1px solid rgba(90,143,255,.4)', borderRadius: 8, padding: '8px 16px', color: '#5A8FFF', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    🖥 START SCREEN SHARE
                  </button>
                </div>
              )}
            </div>
            <div className="stage-screen-pip">
              {stagePeers.map(function(g) {
                var gid  = g.guestId ? g.guestId : (g.userId ? g.userId : 'x');
                var isOwn = gid === userId;
                return (
                  <div key={gid} className="stage-screen-pip-cell">
                    <OctCell guest={g} sz={80} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null}
                      mediaConfig={isOwn ? mediaConfig : null} isMuted={isOwn ? isMuted : false} isCamOff={isOwn ? isCamOff : false}
                      onMuteToggle={isOwn ? toggleMute : null} onCamToggle={isOwn ? toggleCam : null} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hand raise queue (host only) */}
      {role === 'host' && handQueue.length > 0 && (
        <div className="hand-queue-panel">
          <div className="hand-queue-header">
            <span>✋ RAISE QUEUE ({handQueue.length})</span>
          </div>
          {handQueue.map(function(item) {
            return (
              <div key={item.guestId} className="hand-queue-item">
                <span style={{ fontSize: 14 }}>✋</span>
                <span className="hand-queue-name">{item.username}</span>
                <button onClick={function() { inviteToStage(item); }}
                  style={{ background: 'rgba(0,201,167,.12)', border: '1px solid rgba(0,201,167,.35)', borderRadius: 5, padding: '3px 8px', color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                  INVITE
                </button>
                <button onClick={function() { denyHand(item.guestId); }}
                  style={{ background: 'transparent', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '3px 6px', color: '#FF6B81', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', flexShrink: 0 }}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Media controls bar */}
      <div className="media-controls-bar">
        <button onClick={toggleMute} className={'mc-btn' + (isMuted ? ' mc-btn--danger' : ' mc-btn--active')}>
          <span className="mc-btn-icon">{isMuted ? '🔇' : '🎙'}</span>
          <span className="mc-btn-label">{isMuted ? 'MUTED' : 'MIC'}</span>
        </button>
        <button onClick={toggleCam} className={'mc-btn' + (isCamOff ? ' mc-btn--danger' : ' mc-btn--active')}>
          <span className="mc-btn-icon">{isCamOff ? '📵' : '📷'}</span>
          <span className="mc-btn-label">{isCamOff ? 'OFF' : 'CAM'}</span>
        </button>
        <button onClick={toggleScreenShare} className={'mc-btn' + (isScreenShare ? ' mc-btn--danger' : '')}>
          <span className="mc-btn-icon">🖥</span>
          <span className="mc-btn-label">{isScreenShare ? 'STOP' : 'SCREEN'}</span>
        </button>
        <button onClick={function() { setShowConfig(true); }} className="mc-btn">
          <span className="mc-btn-icon">⚙️</span>
          <span className="mc-btn-label">CONFIG</span>
        </button>
        <div className="mc-divider" />
        {role === 'host' && !isLive && (
          <button onClick={goLive} className="mc-btn mc-btn--live" style={{ minWidth: 56 }}>
            <span className="mc-btn-icon">🔴</span>
            <span className="mc-btn-label">GO LIVE</span>
          </button>
        )}
        {role === 'host' && isLive && (
          <button onClick={endBroadcast} className="mc-btn mc-btn--danger" style={{ minWidth: 56 }}>
            <span className="mc-btn-icon">⏹</span>
            <span className="mc-btn-label">END</span>
          </button>
        )}
        {role !== 'host' && (
          <button onClick={sendHandRaise} className="mc-btn" style={{ animation: 'beat 1.5s infinite' }}>
            <span className="mc-btn-icon">✋</span>
            <span className="mc-btn-label">RAISE</span>
          </button>
        )}
      </div>

      {/* Collapsible chat */}
      <div className="chat-collapsed">
        <button className="chat-toggle-btn" onClick={function() { setChatOpen(function(v) { return !v; }); }}>
          <span>💬 LIVE CHAT {chat.length > 0 ? '(' + chat.length + ')' : ''}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9 }}>{chatOpen ? '▼' : '▲'}</span>
        </button>
        {chatOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 200 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {chat.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90', textAlign: 'center', padding: 12 }}>No messages yet</div>}
              {chat.map(function(msg) {
                return (
                  <div key={msg.id || Math.random()} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }}>
                    <span style={{ color: '#C9A84C', fontWeight: 700, marginRight: 5 }}>{msg.username || 'anon'}</span>
                    <span style={{ color: '#D0C0E0' }}>{msg.message}</span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid rgba(36,28,52,.6)', flexShrink: 0 }}>
              <input value={chatInput} onChange={function(e) { setChatInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
                placeholder="Say something..."
                maxLength={200}
                style={{ flex: 1, background: '#0F0C14', border: '1px solid #241C34', borderRadius: 6, padding: '6px 10px', color: '#D0C0E0', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }} />
              <button onClick={sendChat}
                style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '6px 14px', color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                SEND
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
