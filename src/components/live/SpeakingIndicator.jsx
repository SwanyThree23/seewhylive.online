import React from 'react';

export default function SpeakingIndicator(props) {
  var isSpeaking = props.isSpeaking || false;
  var isHost = props.isHost || false;
  var volume = props.volume != null ? props.volume : (isSpeaking ? 0.6 : 0);
  var children = props.children;

  var ringColor = isHost ? '#FFD700' : '#22D3EE';
  var ringOpacity = isSpeaking ? Math.max(0.6, volume) : 0;
  var pulseScale = isSpeaking ? (1 + volume * 0.04) : 1;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          borderRadius: '12px',
          transition: 'box-shadow 160ms ease, transform 160ms ease',
          boxShadow: isSpeaking
            ? '0 0 0 3px ' + ringColor + ', 0 0 ' + Math.round(18 + volume * 20) + 'px 4px ' + ringColor + Math.round(ringOpacity * 100).toString(16).padStart(2, '0')
            : '0 0 0 0px transparent',
          transform: isSpeaking ? 'scale(' + pulseScale + ')' : 'scale(1)',
          animation: isSpeaking ? 'sw-speak-pulse 1100ms ease-in-out infinite' : 'none',
        }}
      >
        {children}
      </div>

      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            bottom: '-22px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {/* Volume level bars */}
          {[0.3, 0.6, 1.0].map(function(threshold, i) {
            var lit = volume >= threshold;
            return (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: (6 + i * 3) + 'px',
                  borderRadius: '2px',
                  background: lit ? ringColor : 'rgba(255,255,255,0.15)',
                  transition: 'background 100ms ease, height 100ms ease',
                }}
              />
            );
          })}
          <span
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.05em',
              color: ringColor,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              marginLeft: '2px',
            }}
          >
            Speaking
          </span>
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
