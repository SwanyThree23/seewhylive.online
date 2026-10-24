import React, { useState } from 'react';

var GOLD  = '#C9A84C';
var CARD  = '#241C12';
var MUTED = '#8A7A62';
var TEXT  = '#F0E8D4';
var RED   = '#FF1A3C';
var GREEN = '#22c55e';

var ACTIONS = [
  { id: 'mic',    emoji: '🎤', label: 'Mic'    },
  { id: 'cam',    emoji: '📷', label: 'Camera' },
  { id: 'invite', emoji: '👥', label: 'Invite' },
  { id: 'chat',   emoji: '💬', label: 'Chat'   },
  { id: 'live',   emoji: '🚀', label: 'Go Live'},
];

export default function HostQuickActions({ socket, roomId, isLive, isMuted, isCamOff, onToggleMic, onToggleCam, onToggleChat, onGoLive, addToast }) {
  var [inviteCopied, setInviteCopied] = useState(false);

  function handleAction(id) {
    if (id === 'mic') {
      if (onToggleMic) onToggleMic();
    } else if (id === 'cam') {
      if (onToggleCam) onToggleCam();
    } else if (id === 'invite') {
      var shareUrl = window.location.origin + (roomId ? '?room=' + roomId : '');
      try {
        navigator.clipboard.writeText(shareUrl).then(function() {
          setInviteCopied(true);
          if (addToast) addToast('Room link copied!', 'success');
          setTimeout(function() { setInviteCopied(false); }, 2500);
        });
      } catch(e) {
        if (addToast) addToast('Copy your URL from the address bar', 'info');
      }
    } else if (id === 'chat') {
      if (onToggleChat) onToggleChat();
    } else if (id === 'live') {
      if (!isLive && onGoLive) onGoLive();
    }
  }

  function getState(id) {
    if (id === 'mic')  return isMuted ? 'off' : 'on';
    if (id === 'cam')  return isCamOff ? 'off' : 'on';
    if (id === 'live') return isLive ? 'live' : 'ready';
    if (id === 'invite') return inviteCopied ? 'copied' : 'default';
    return 'default';
  }

  function getEmoji(id) {
    if (id === 'mic')    return isMuted ? '🔇' : '🎤';
    if (id === 'cam')    return isCamOff ? '📷' : '📸';
    if (id === 'invite') return inviteCopied ? '✅' : '👥';
    if (id === 'live')   return isLive ? '🔴' : '🚀';
    return id === 'chat' ? '💬' : '●';
  }

  function getLabel(id) {
    if (id === 'mic')  return isMuted ? 'Unmute' : 'Mute';
    if (id === 'cam')  return isCamOff ? 'Start Cam' : 'Camera';
    if (id === 'invite') return inviteCopied ? 'Copied!' : 'Invite';
    if (id === 'live') return isLive ? 'LIVE' : 'Go Live';
    return 'Chat';
  }

  function getBg(id) {
    var state = getState(id);
    if (id === 'live' && isLive) return 'rgba(255,26,60,.2)';
    if (id === 'mic' && isMuted) return 'rgba(255,26,60,.15)';
    if (id === 'cam' && isCamOff) return 'rgba(255,26,60,.15)';
    if (state === 'copied') return 'rgba(34,197,94,.15)';
    return CARD;
  }

  function getBorder(id) {
    var state = getState(id);
    if (id === 'live' && isLive) return '1px solid rgba(255,26,60,.5)';
    if (id === 'mic' && isMuted) return '1px solid rgba(255,26,60,.35)';
    if (id === 'cam' && isCamOff) return '1px solid rgba(255,26,60,.35)';
    if (state === 'copied') return '1px solid rgba(34,197,94,.4)';
    return '1px solid rgba(201,168,76,.15)';
  }

  function getLabelColor(id) {
    if (id === 'live' && isLive) return RED;
    if ((id === 'mic' && isMuted) || (id === 'cam' && isCamOff)) return RED;
    if (getState(id) === 'copied') return GREEN;
    return MUTED;
  }

  return (
    <div style={{
      overflowX: 'auto', display: 'flex', gap: 8, padding: '10px 16px 10px',
      background: '#120F0A', borderBottom: '1px solid rgba(201,168,76,.08)',
      WebkitOverflowScrolling: 'touch', flexShrink: 0,
      scrollbarWidth: 'none',
    }}>
      {ACTIONS.map(function(action) {
        return (
          <button
            key={action.id}
            onClick={function() { handleAction(action.id); }}
            title={getLabel(action.id)}
            style={{
              flexShrink: 0, width: 60, padding: '8px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: getBg(action.id),
              border: getBorder(action.id),
              borderRadius: 10, cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{getEmoji(action.id)}</span>
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: .5,
              color: getLabelColor(action.id), lineHeight: 1,
            }}>{getLabel(action.id)}</span>
          </button>
        );
      })}
    </div>
  );
}
