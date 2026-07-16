import React, { useState, useCallback } from 'react';

export function useModerationToasts() {
  var [toasts, setToasts] = useState([]);

  var push = useCallback(function (evt) {
    var id = Date.now() + '-' + Math.random().toString(36).slice(2);
    var message = buildMessage(evt);
    setToasts(function (prev) {
      return prev.concat([{ id: id, message: message, type: evt.type }]);
    });
    setTimeout(function () {
      setToasts(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
    }, 4000);
  }, []);

  return { toasts: toasts, push: push };
}

function buildMessage(evt) {
  if (evt.type === 'mute') return 'The host has muted ' + evt.target;
  if (evt.type === 'unmute') return evt.target + ' has been unmuted';
  if (evt.type === 'kick') return evt.target + ' was removed from the stage';
  if (evt.type === 'ban') return evt.target + ' has been banned from the room';
  if (evt.type === 'flag') return 'Guardian AI flagged a message from ' + evt.target;
  return evt.message || 'A moderation action occurred';
}

export default function ModerationToast(props) {
  var toasts = props.toasts || [];

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '110px',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 998,
        width: '90%',
        maxWidth: '380px',
        alignItems: 'center',
      }}
    >
      {toasts.map(function (t) {
        return (
          <div
            key={t.id}
            style={{
              background: '#1a1410ee',
              border: '1px solid #FFD70044',
              borderRadius: '10px',
              padding: '10px 16px',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '13px',
              color: '#F5F0E6',
              textAlign: 'center',
              boxShadow: '0 4px 16px #000000aa',
            }}
          >
            <span style={{ marginRight: '6px' }}>🛡️</span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
