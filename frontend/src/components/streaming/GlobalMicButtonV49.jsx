import { useState, useRef, useCallback, useEffect } from 'react';

var GOLD     = '#C9A84C';
var LIVE_RED = '#dc2626';
var TEAL     = '#5CB8A0';

export default function GlobalMicButtonV49(props) {
  var audioEnabled = props.audioEnabled !== undefined ? props.audioEnabled : true;
  var toggleAudio  = props.toggleAudio  || function() {};
  var isSpeaking   = props.isSpeaking   || false;
  var micLevel     = props.micLevel     || 0;
  var visible      = props.visible !== undefined ? props.visible : true;

  var s1 = useState(false); var pttActive = s1[0]; var setPttActive = s1[1];
  var longPressRef = useRef(null);
  var pttRef       = useRef(false);

  var handlePressStart = useCallback(function(e) {
    e.preventDefault();
    longPressRef.current = setTimeout(function() {
      pttRef.current = true;
      setPttActive(true);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 350);
  }, []);

  var handlePressEnd = useCallback(function(e) {
    e.preventDefault();
    clearTimeout(longPressRef.current);
    if (pttRef.current) {
      pttRef.current = false;
      setPttActive(false);
    } else {
      if (navigator.vibrate) navigator.vibrate(20);
      toggleAudio();
    }
  }, [toggleAudio]);

  useEffect(function() {
    return function() { clearTimeout(longPressRef.current); };
  }, []);

  if (!visible) return null;

  var isMuted = !audioEnabled;

  var ringColor = pttActive ? '#10b981' : GOLD;
  var ringVisible = isSpeaking && !isMuted;
  var scale = 1 + (micLevel / 100) * 0.45;

  var btnBg = isMuted
    ? 'rgba(255,255,255,0.12)'
    : pttActive
    ? 'rgba(16,185,129,0.18)'
    : isSpeaking
    ? 'rgba(212,175,55,0.18)'
    : 'rgba(255,255,255,0.07)';

  var btnBorder = isMuted
    ? 'rgba(255,255,255,0.15)'
    : pttActive
    ? 'rgba(16,185,129,0.6)'
    : isSpeaking
    ? 'rgba(212,175,55,0.6)'
    : 'rgba(255,255,255,0.12)';

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom,0px) + 88px)',
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Speaking ring */}
        {ringVisible && (
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '2px solid ' + ringColor,
            transform: 'scale(' + scale + ')',
            opacity: micLevel > 5 ? 0.6 : 0.2,
            transition: 'transform 0.1s, opacity 0.1s',
            pointerEvents: 'none',
          }} />
        )}

        {/* Mic button */}
        <button
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onContextMenu={function(e) { e.preventDefault(); }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Tap to unmute / Long press for PTT' : 'Tap to mute / Long press for PTT'}
          style={{
            width: 56, height: 56, minWidth: 56, minHeight: 56,
            borderRadius: '50%',
            border: '1.5px solid ' + btnBorder,
            background: btnBg,
            cursor: 'pointer',
            fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            touchAction: 'none',
            transform: pttActive ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.1s, border-color 0.15s, background 0.15s',
            boxShadow: isSpeaking && !isMuted
              ? '0 0 12px ' + GOLD + '66'
              : pttActive
              ? '0 0 12px rgba(16,185,129,0.5)'
              : '0 2px 8px rgba(0,0,0,0.4)',
          }}>
          {isMuted ? '🔇' : pttActive ? '🟢' : '🎙️'}
        </button>

        {/* Mic level bar */}
        {!isMuted && (
          <div style={{
            position: 'absolute',
            bottom: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 56,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: micLevel + '%',
              background: micLevel > 60 ? LIVE_RED : GOLD,
              borderRadius: 2,
              transition: 'width 0.05s',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}
