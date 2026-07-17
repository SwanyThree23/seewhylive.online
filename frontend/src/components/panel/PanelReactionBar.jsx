// frontend/src/components/panel/PanelReactionBar.jsx
// Floating emoji reaction bar for panel viewers. Emits panel:react to the
// server which broadcasts panel:reaction to everyone in the room.
// Also subscribes to incoming panel:reaction events and shows floating
// emoji animations over the panel grid.
import { useEffect, useRef, useState } from 'react';

const EMOJIS = ['❤️', '🔥', '👏', '😂', '😮', '💯', '🎉', '💜'];
const GOLD = '#D4AF37';

// Individual floating emoji that rises and fades out
function FloatingEmoji({ emoji, x, onDone }) {
  const ref = useRef(null);
  useEffect(function() {
    var el = ref.current;
    if (!el) return;
    el.animate(
      [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: 'translateY(-80px) scale(1.3)', opacity: 0 },
      ],
      { duration: 1400, easing: 'ease-out', fill: 'forwards' }
    ).onfinish = onDone;
  }, []);
  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        bottom: 8,
        left: x + '%',
        fontSize: 28,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 20,
        willChange: 'transform, opacity',
      }}
    >
      {emoji}
    </span>
  );
}

export default function PanelReactionBar({ socket, roomId, userId }) {
  const [floats, setFloats] = useState([]);
  const floatId = useRef(0);
  const cooldown = useRef(false);

  useEffect(function() {
    if (!socket || !roomId) return;
    function onReaction(payload) {
      if (payload.roomId !== roomId) return;
      spawnFloat(payload.emoji);
    }
    socket.on('panel:reaction', onReaction);
    return function() { socket.off('panel:reaction', onReaction); };
  }, [socket, roomId]);

  function spawnFloat(emoji) {
    var id = ++floatId.current;
    var x = 5 + Math.random() * 70;
    setFloats(function(prev) { return prev.concat([{ id: id, emoji: emoji, x: x }]); });
  }

  function sendReaction(emoji) {
    if (cooldown.current || !socket) return;
    cooldown.current = true;
    setTimeout(function() { cooldown.current = false; }, 800);
    socket.emit('panel:react', { roomId: roomId, guestId: userId, emoji: emoji });
    spawnFloat(emoji);
  }

  return (
    <>
      {/* Floating reaction overlays (position:absolute relative to parent) */}
      {floats.map(function(f) {
        return (
          <FloatingEmoji
            key={f.id}
            emoji={f.emoji}
            x={f.x}
            onDone={function() {
              setFloats(function(prev) { return prev.filter(function(p) { return p.id !== f.id; }); });
            }}
          />
        );
      })}

      {/* Reaction button bar */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '6px 8px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 24,
        backdropFilter: 'blur(6px)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {EMOJIS.map(function(emoji) {
          return (
            <button
              key={emoji}
              onClick={function() { sendReaction(emoji); }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 8,
                transition: 'transform 0.1s',
                lineHeight: 1,
              }}
              onMouseDown={function(e) { e.currentTarget.style.transform = 'scale(0.8)'; }}
              onMouseUp={function(e) { e.currentTarget.style.transform = 'scale(1)'; }}
              title={emoji}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </>
  );
}
