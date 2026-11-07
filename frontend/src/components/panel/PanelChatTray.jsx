// frontend/src/components/panel/PanelChatTray.jsx
// Compact read + send chat tray for panelists on stage.
// Subscribes directly to chat-message events on the socket already held by PanelGrid.
import { useEffect, useRef, useState } from 'react';

var GOLD = '#C9A84C';
var CREAM = '#F0E8D4';
var MAX_MESSAGES = 60;

export default function PanelChatTray({ socket, roomId, userId, username }) {
  var [open, setOpen] = useState(false);
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState('');
  var [unread, setUnread] = useState(0);
  var scrollRef = useRef(null);
  var openRef = useRef(false);
  openRef.current = open;

  useEffect(function() {
    if (!socket || !roomId) return;
    var onMsg = function(data) {
      if (data.roomId && data.roomId !== roomId) return;
      setMessages(function(prev) {
        var next = prev.concat([data]);
        return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
      });
      if (!openRef.current) setUnread(function(n) { return n + 1; });
    };
    socket.on('chat-message', onMsg);
    return function() { socket.off('chat-message', onMsg); };
  }, [socket, roomId]);

  useEffect(function() {
    if (!open) return;
    setUnread(0);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, messages.length]);

  var send = function() {
    var msg = input.trim();
    if (!msg || !socket) return;
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: msg });
    setInput('');
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Toggle button */}
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          color: open ? GOLD : '#888',
          border: '1px solid ' + (open ? 'rgba(201,168,76,.4)' : '#333'),
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 10,
          fontFamily: '"DM Sans", sans-serif',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'color 0.2s, border-color 0.2s',
          margin: '2px 8px',
        }}
      >
        💬
        {!open && unread > 0 && (
          <span style={{
            background: '#FF1A3C', color: CREAM, borderRadius: 8,
            fontSize: 9, fontWeight: 700, padding: '1px 5px',
            fontFamily: '"DM Sans", sans-serif',
          }}>{unread > 99 ? '99+' : unread}</span>
        )}
        {open && <span style={{ fontSize: 9, color: '#666' }}>hide</span>}
      </button>

      {open && (
        <div style={{
          margin: '0 8px 4px',
          background: 'rgba(14,12,9,.92)',
          border: '1px solid rgba(201,168,76,.18)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 180,
          overflow: 'hidden',
        }}>
          {/* Message list */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {messages.length === 0 && (
              <span style={{ color: '#444', fontSize: 10, fontFamily: '"DM Sans", sans-serif', textAlign: 'center', paddingTop: 8 }}>No messages yet</span>
            )}
            {messages.map(function(m, i) {
              var isOwn = m.userId === userId || m.guestId === userId;
              var isSuperChat = m.type === 'super-chat' || m.superChat;
              return (
                <div key={m.id || i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', flexShrink: 0 }}>
                  <span style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    fontWeight: 700,
                    color: isSuperChat ? GOLD : isOwn ? '#8EB4E3' : '#8A7A62',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    maxWidth: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{m.username || 'Guest'}</span>
                  <span style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    color: isSuperChat ? GOLD : CREAM,
                    opacity: 0.85,
                    wordBreak: 'break-word',
                    lineHeight: 1.35,
                  }}>{m.message}</span>
                </div>
              );
            })}
          </div>

          {/* Input */}
          {userId && (
            <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.06)', padding: '4px 6px', gap: 5 }}>
              <input
                value={input}
                onChange={function(e) { setInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
                maxLength={300}
                placeholder="Say something…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: CREAM, fontFamily: '"DM Sans", sans-serif', fontSize: 11,
                  padding: '2px 0',
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                style={{
                  background: input.trim() ? 'rgba(201,168,76,.2)' : 'transparent',
                  color: input.trim() ? GOLD : '#444',
                  border: 'none', borderRadius: 4, padding: '2px 8px',
                  fontSize: 10, fontFamily: '"DM Sans", sans-serif',
                  cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'background 0.15s, color 0.15s',
                  fontWeight: 700,
                }}
              >Send</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
