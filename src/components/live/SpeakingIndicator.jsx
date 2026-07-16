import React from 'react';

export default function SpeakingIndicator(props) {
  var isSpeaking = props.isSpeaking || false;
  var isHost = props.isHost || false;
  var children = props.children;

  var ringColor = isHost ? '#FFD700' : '#22D3EE';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          borderRadius: '12px',
          transition: 'box-shadow 160ms ease, transform 160ms ease',
          boxShadow: isSpeaking
            ? '0 0 0 3px ' + ringColor + ', 0 0 18px 4px ' + ringColor + '66'
            : '0 0 0 0px transparent',
          transform: isSpeaking ? 'scale(1.02)' : 'scale(1)',
          animation: isSpeaking ? 'sw-speak-pulse 1100ms ease-in-out infinite' : 'none',
        }}
      >
        {children}
      </div>

      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.05em',
            color: ringColor,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          Speaking
        </div>
      )}

      <style>{`
        @keyframes sw-speak-pulse {
          0%   { filter: brightness(1); }
          50%  { filter: brightness(1.15); }
          100% { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
