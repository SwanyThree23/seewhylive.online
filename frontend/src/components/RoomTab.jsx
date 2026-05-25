import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import rtcManager from '../webrtc.js';

export default function RoomTab({ socket, guests, chat, isLive, setIsLive, userId, username, role, roomId, branding, addToast }) {
  const [mode, setMode] = useState('stage'); // stage / watch / guests
  const [chatInput, setChatInput] = useState('');
  const [guestListView, setGuestListView] = useState(false);
  const [rtcReady, setRtcReady] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  useEffect(() => {
    if (!socket) return;
    socket.on('join-room-ack', async (data) => {
      if (!data) return;
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        setRtcReady(true);
        addToast('WebRTC connected', 'success');
      } catch(e) {
        addToast('WebRTC error: ' + e.message, 'error');
      }
    });
    return () => { socket.off('join-room-ack'); };
  }, [socket]);

  function sendChat() {
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat-message', { roomId, userId, username, message: chatInput.trim() });
    setChatInput('');
  }

  function goLive() {
    if (!socket) return;
    socket.emit('go-live', { roomId, destinations });
  }

  function endBroadcast() {
    if (!socket) return;
    socket.emit('end-broadcast', { roomId });
    setIsLive(false);
  }

  function sendHandRaise() {
    if (!socket) return;
    socket.emit('hand-raise', { roomId, guestId: userId });
    addToast('Hand raised ✋', 'info');
  }

  const selfGuest = { guestId: userId, username, role };
  const otherGuests = guests.filter((g) => {
    const gid = g.guestId || g.userId;
    return gid !== userId;
  });
  const allCells = [selfGuest, ...otherGuests].slice(0, 20);

  return (
    <div className="tab-panel room-tab">
      {/* Mode switcher */}
      <div className="mode-bar">
        {['stage','watch','guests'].map((m) => (
          <button key={m} className={'mode-btn' + (mode===m?' mode-btn--active':'')} onClick={() => setMode(m)}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stage mode: grid of OctCells */}
      {mode === 'stage' && (
        <div className="stage-area">
          <div className="oct-grid">
            {allCells.map((g) => (
              <OctCell
                key={g.guestId || g.userId || Math.random()}
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Watch mode: single large viewer */}
      {mode === 'watch' && (
        <div className="watch-area">
          <p className="muted-text">Viewing stream — HLS player available in EMBED tab</p>
        </div>
      )}

      {/* Guests mode: list */}
      {mode === 'guests' && (
        <div className="guests-list">
          {guests.length === 0 && <p className="muted-text">No guests online</p>}
          {guests.map((g) => (
            <div key={g.guestId || g.userId} className="guest-row">
              <div className="guest-avatar" />
              <span className="guest-name">{g.username || g.guestId}</span>
              <span className={'guest-role-badge guest-role--' + (g.role || 'viewer')}>{(g.role || 'viewer').toUpperCase()}</span>
              {role === 'host' && (
                <button className="btn-sm btn-burg" onClick={() => socket && socket.emit('mute-guest', { roomId, guestId: g.guestId })}>
                  MUTE
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="room-controls">
        {role === 'host' && !isLive && (
          <button className="btn-gold btn-go-live" onClick={goLive}>
            🔴 GO LIVE
          </button>
        )}
        {role === 'host' && isLive && (
          <button className="btn-burg" onClick={endBroadcast}>
            ⏹ END BROADCAST
          </button>
        )}
        {role !== 'host' && (
          <button className="btn-teal" onClick={sendHandRaise}>✋ RAISE HAND</button>
        )}
      </div>

      {/* Chat panel */}
      <div className="chat-panel">
        <div className="chat-header">LIVE CHAT</div>
        <div className="chat-messages">
          {chat.map((msg) => (
            <div key={msg.id || Math.random()} className={'chat-msg' + (msg.isBot ? ' chat-msg--bot' : '')}>
              <span className="chat-user">{msg.username || 'anon'}</span>
              <span className="chat-text">{msg.message}</span>
              {msg.translated && msg.lang && msg.lang !== 'EN' && (
                <span className="chat-translation">[{msg.lang}→EN: {msg.translated}]</span>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Say something..."
            maxLength={200}
          />
          <button className="btn-gold chat-send-btn" onClick={sendChat}>SEND</button>
        </div>
      </div>
    </div>
  );
}
