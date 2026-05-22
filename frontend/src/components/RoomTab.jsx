import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import rtcManager from '../webrtc.js';

export default function RoomTab({ socket, guests, chat, isLive, setIsLive, userId, username, role, roomId, branding, addToast }) {
  const [mode,          setMode]          = useState('stage');
  const [chatInput,     setChatInput]     = useState('');
  const [rtcReady,      setRtcReady]      = useState(false);
  const [destinations,  setDestinations]  = useState([]);
  const [isMuted,       setIsMuted]       = useState(false);
  const [isCamOff,      setIsCamOff]      = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [showConfig,    setShowConfig]    = useState(false);
  const [mediaConfig,   setMediaConfig]   = useState(null);
  const chatEndRef = useRef(null);
  const screenStreamRef = useRef(null);

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
        addToast('WebRTC connected', 'success');
      } catch(e) {
        addToast('WebRTC error: ' + e.message, 'error');
      }
    });
    return function() { socket.off('join-room-ack'); };
  }, [socket]);

  function sendChat() {
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: chatInput.trim() });
    setChatInput('');
  }

  function goLive() {
    if (!socket) return;
    socket.emit('go-live', { roomId: roomId, destinations: destinations });
  }

  function endBroadcast() {
    if (!socket) return;
    socket.emit('end-broadcast', { roomId: roomId });
    setIsLive(false);
    stopScreenShare();
  }

  function sendHandRaise() {
    if (!socket) return;
    socket.emit('hand-raise', { roomId: roomId, guestId: userId });
    addToast('Hand raised ✋', 'info');
  }

  function toggleMute() {
    setIsMuted(function(m) { return !m; });
    addToast(isMuted ? '🎙 Unmuted' : '🔇 Muted', 'info');
  }

  function toggleCam() {
    setIsCamOff(function(c) { return !c; });
    addToast(isCamOff ? '📷 Camera on' : '📵 Camera off', 'info');
  }

  async function toggleScreenShare() {
    if (isScreenShare) {
      stopScreenShare();
      return;
    }
    try {
      var screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      screenStreamRef.current = screenStream;
      var screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = function() { stopScreenShare(); };
      if (rtcManager && rtcReady) {
        await rtcManager.replaceTrack('video', screenTrack);
      }
      setIsScreenShare(true);
      addToast('📺 Screen share started', 'success');
    } catch(e) {
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
        addToast('Screen share error: ' + e.message, 'error');
      }
    }
  }

  function stopScreenShare() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    setIsScreenShare(false);
  }

  function handleMediaApply(config) {
    setMediaConfig(config);
    setIsMuted(false);
    setIsCamOff(false);
  }

  var selfGuest   = { guestId: userId, username: username, role: role };
  var otherGuests = guests.filter(function(g) {
    var gid = g.guestId ? g.guestId : (g.userId ? g.userId : null);
    return gid !== userId;
  });
  var allCells = [selfGuest].concat(otherGuests).slice(0, 20);

  return (
    <div className="tab-panel room-tab">

      {/* Media Config Panel overlay */}
      {showConfig && (
        <MediaConfigPanel
          onClose={function() { setShowConfig(false); }}
          onApply={handleMediaApply}
          addToast={addToast}
        />
      )}

      {/* Mode switcher */}
      <div className="mode-bar">
        {['stage','watch','guests'].map(function(m) {
          return (
            <button key={m} className={'mode-btn' + (mode === m ? ' mode-btn--active' : '')} onClick={function() { setMode(m); }}>
              {m.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Stage mode */}
      {mode === 'stage' && (
        <div className="stage-area">
          <div className="oct-grid">
            {allCells.map(function(g) {
              var gid = g.guestId ? g.guestId : (g.userId ? g.userId : Math.random());
              var isOwn = gid === userId;
              return (
                <OctCell
                  key={gid}
                  guest={g}
                  sz={180}
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
              );
            })}
          </div>
        </div>
      )}

      {/* Watch mode */}
      {mode === 'watch' && (
        <div className="watch-area">
          <p className="muted-text">Viewing stream — HLS player available in EMBED tab</p>
        </div>
      )}

      {/* Guests mode */}
      {mode === 'guests' && (
        <div className="guests-list">
          {guests.length === 0 && <p className="muted-text">No guests online</p>}
          {guests.map(function(g) {
            var gid = g.guestId ? g.guestId : g.userId;
            return (
              <div key={gid} className="guest-row">
                <div className="guest-avatar" />
                <span className="guest-name">{g.username || gid}</span>
                <span className={'guest-role-badge guest-role--' + (g.role || 'viewer')}>{(g.role || 'viewer').toUpperCase()}</span>
                {role === 'host' && (
                  <button className="btn-sm btn-burg" onClick={function() { socket && socket.emit('mute-guest', { roomId: roomId, guestId: gid }); }}>
                    MUTE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Media controls bar */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: 'rgba(7,5,10,.8)', borderTop: '1px solid #241C34', flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Mic toggle */}
        <button onClick={toggleMute}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: isMuted ? 'rgba(255,26,60,.2)' : 'rgba(0,201,167,.1)', border: '1px solid ' + (isMuted ? 'rgba(255,26,60,.5)' : 'rgba(0,201,167,.3)'), borderRadius: 9, padding: '7px 14px', color: isMuted ? '#FF6B81' : '#00C9A7', cursor: 'pointer', minWidth: 54 }}>
          <span style={{ fontSize: 16 }}>{isMuted ? '🔇' : '🎙'}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>{isMuted ? 'MUTED' : 'MIC'}</span>
        </button>

        {/* Cam toggle */}
        <button onClick={toggleCam}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: isCamOff ? 'rgba(255,26,60,.2)' : 'rgba(0,201,167,.1)', border: '1px solid ' + (isCamOff ? 'rgba(255,26,60,.5)' : 'rgba(0,201,167,.3)'), borderRadius: 9, padding: '7px 14px', color: isCamOff ? '#FF6B81' : '#00C9A7', cursor: 'pointer', minWidth: 54 }}>
          <span style={{ fontSize: 16 }}>{isCamOff ? '📵' : '📷'}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>{isCamOff ? 'CAM OFF' : 'CAM'}</span>
        </button>

        {/* Screen share */}
        <button onClick={toggleScreenShare}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: isScreenShare ? 'rgba(90,143,255,.25)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (isScreenShare ? 'rgba(90,143,255,.6)' : '#241C34'), borderRadius: 9, padding: '7px 14px', color: isScreenShare ? '#5A8FFF' : '#7A6F90', cursor: 'pointer', minWidth: 54 }}>
          <span style={{ fontSize: 16 }}>🖥</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>{isScreenShare ? 'SHARING' : 'SCREEN'}</span>
        </button>

        {/* Config */}
        <button onClick={function() { setShowConfig(true); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 9, padding: '7px 14px', color: '#C9A84C', cursor: 'pointer', minWidth: 54 }}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>CONFIG</span>
        </button>

        {/* Go Live / End */}
        {role === 'host' && !isLive && (
          <button onClick={goLive}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 9, padding: '7px 18px', color: '#C9A84C', cursor: 'pointer', minWidth: 64, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🔴</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>GO LIVE</span>
          </button>
        )}
        {role === 'host' && isLive && (
          <button onClick={endBroadcast}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(128,0,32,.3)', border: '1px solid rgba(192,24,56,.5)', borderRadius: 9, padding: '7px 18px', color: '#FF6B81', cursor: 'pointer', minWidth: 64 }}>
            <span style={{ fontSize: 16 }}>⏹</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>END</span>
          </button>
        )}
        {role !== 'host' && (
          <button onClick={sendHandRaise}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 9, padding: '7px 14px', color: '#00C9A7', cursor: 'pointer', minWidth: 54 }}>
            <span style={{ fontSize: 16 }}>✋</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>RAISE</span>
          </button>
        )}
      </div>

      {/* Live status bar */}
      {isLive && (
        <div style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 0, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF1A3C', animation: 'liveBlink 1s infinite' }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#FF6B81' }}>BROADCASTING LIVE</span>
          {isMuted && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF1A3C', marginLeft: 'auto' }}>⚠ YOU ARE MUTED</span>}
        </div>
      )}

      {/* Chat panel */}
      <div className="chat-panel">
        <div className="chat-header">LIVE CHAT</div>
        <div className="chat-messages">
          {chat.map(function(msg) {
            return (
              <div key={msg.id || Math.random()} className={'chat-msg' + (msg.isBot ? ' chat-msg--bot' : '')}>
                <span className="chat-user">{msg.username || 'anon'}</span>
                <span className="chat-text">{msg.message}</span>
                {msg.translated && msg.lang && msg.lang !== 'EN' && (
                  <span className="chat-translation">[{msg.lang}→EN: {msg.translated}]</span>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={chatInput}
            onChange={function(e) { setChatInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
            placeholder="Say something..."
            maxLength={200}
          />
          <button className="btn-gold chat-send-btn" onClick={sendChat}>SEND</button>
        </div>
      </div>

    </div>
  );
}
