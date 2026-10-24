import React, { useState } from 'react';

var BG   = '#0E0C09';
var SURF = '#1A1510';
var CARD = '#241C12';
var GOLD = '#C9A84C';
var TEXT = '#F0E8D4';
var MUTED = '#8A7A62';
var GREEN = '#22c55e';
var RED   = '#FF1A3C';

var overlay = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
};
var modal = {
  background: SURF, borderRadius: 16, width: '100%', maxWidth: 420,
  border: '1px solid rgba(201,168,76,.2)',
  boxShadow: '0 24px 80px rgba(0,0,0,.7)',
  overflow: 'hidden',
  fontFamily: "'Barlow Condensed',sans-serif",
};
var header = {
  padding: '20px 24px 0',
};
var body = {
  padding: '16px 24px 24px',
};
var title = {
  fontFamily: "'Bebas Neue',sans-serif",
  fontSize: 26, color: TEXT, letterSpacing: 1, lineHeight: 1.1, marginBottom: 6,
};
var sub = {
  fontSize: 14, color: MUTED, lineHeight: 1.4, marginBottom: 20,
};
var primaryBtn = {
  width: '100%', padding: '13px 0', borderRadius: 10,
  background: GOLD, border: 'none', cursor: 'pointer',
  fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#0E0C09',
  letterSpacing: 1, marginTop: 8,
};
var secondaryBtn = {
  background: 'none', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10,
  padding: '10px 0', width: '100%', cursor: 'pointer',
  color: MUTED, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", marginTop: 8,
};
var inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8,
  padding: '10px 12px', color: TEXT, fontSize: 16, fontFamily: "'Barlow Condensed',sans-serif",
  outline: 'none',
};
var checkRow = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: CARD, borderRadius: 8, padding: '10px 14px', marginBottom: 8,
};

function Dot({ active }) {
  return (
    <div style={{
      width: active ? 10 : 7, height: active ? 10 : 7,
      borderRadius: '50%', flexShrink: 0, transition: 'all .25s',
      background: active ? GOLD : 'rgba(201,168,76,.25)',
    }} />
  );
}

export default function GoLiveWizard({ onComplete, onDismiss }) {
  var [step, setStep] = useState(1);
  var [camOk, setCamOk] = useState(false);
  var [micOk, setMicOk] = useState(false);
  var [checking, setChecking] = useState(false);
  var [checkErr, setCheckErr] = useState('');
  var [streamTitle, setStreamTitle] = useState('');
  var [isPrivate, setIsPrivate] = useState(false);
  var streamRef = React.useRef(null);

  function handleDismiss() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function(t) { t.stop(); });
    }
    try { localStorage.setItem('swlv_wizard_done', '1'); } catch(e) {}
    if (onDismiss) onDismiss();
  }

  function handleCheckDevice() {
    setChecking(true);
    setCheckErr('');
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(stream) {
        streamRef.current = stream;
        setCamOk(true);
        setMicOk(true);
        setChecking(false);
      })
      .catch(function(err) {
        setChecking(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCheckErr('Permission denied. Please allow camera & mic in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setCheckErr('No camera or mic found. Check your device connections.');
        } else {
          setCheckErr('Could not access devices: ' + err.message);
        }
      });
  }

  function handleComplete() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function(t) { t.stop(); });
    }
    try { localStorage.setItem('swlv_wizard_done', '1'); } catch(e) {}
    if (onComplete) onComplete(streamTitle, isPrivate);
  }

  return (
    <div style={overlay} onClick={function(e) { if (e.target === e.currentTarget) handleDismiss(); }}>
      <div style={modal}>
        {/* Dismiss X */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleDismiss}
            style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: MUTED, fontSize: 20, cursor: 'pointer', lineHeight: 1, zIndex: 1 }}
          >✕</button>
        </div>

        <div style={header}>
          {step === 1 && (
            <>
              <div style={title}>Let's check your camera & mic</div>
              <div style={sub}>Make sure your audience can see and hear you.</div>
            </>
          )}
          {step === 2 && (
            <>
              <div style={title}>Name your stream</div>
              <div style={sub}>Give viewers a reason to tune in.</div>
            </>
          )}
          {step === 3 && (
            <>
              <div style={title}>You're all set! 🎉</div>
              <div style={sub}>Here's a quick guide to get you started.</div>
            </>
          )}
        </div>

        <div style={body}>
          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div style={checkRow}>
                <span style={{ fontSize: 20 }}>{camOk ? '✅' : '📷'}</span>
                <span style={{ color: camOk ? GREEN : TEXT, fontSize: 16, flex: 1 }}>Camera</span>
                {camOk && <span style={{ color: GREEN, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>OK</span>}
              </div>
              <div style={checkRow}>
                <span style={{ fontSize: 20 }}>{micOk ? '✅' : '🎤'}</span>
                <span style={{ color: micOk ? GREEN : TEXT, fontSize: 16, flex: 1 }}>Microphone</span>
                {micOk && <span style={{ color: GREEN, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>OK</span>}
              </div>
              {checkErr && (
                <div style={{ color: RED, fontSize: 13, marginTop: 8, lineHeight: 1.4, padding: '8px 12px', background: 'rgba(255,26,60,.1)', borderRadius: 6 }}>
                  {checkErr}
                </div>
              )}
              {!camOk ? (
                <button style={primaryBtn} onClick={handleCheckDevice} disabled={checking}>
                  {checking ? 'Checking…' : 'Allow Access'}
                </button>
              ) : (
                <button style={primaryBtn} onClick={function() { setStep(2); }}>
                  Looks Good — Next →
                </button>
              )}
              <button style={secondaryBtn} onClick={function() { setStep(3); }}>
                Skip setup
              </button>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 6, fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}>STREAM TITLE</label>
                <input
                  style={inputStyle}
                  type="text"
                  maxLength={100}
                  placeholder="What are you streaming today?"
                  value={streamTitle}
                  onChange={function(e) { setStreamTitle(e.target.value); }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: MUTED, marginTop: 4 }}>{streamTitle.length}/100</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CARD, borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, color: TEXT }}>🔒 Private stream</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Only invited guests can join</div>
                </div>
                <button
                  onClick={function() { setIsPrivate(function(p) { return !p; }); }}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: isPrivate ? GOLD : 'rgba(255,255,255,.1)',
                    position: 'relative', transition: 'background .2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: isPrivate ? 22 : 2, width: 20, height: 20,
                    borderRadius: '50%', background: isPrivate ? '#0E0C09' : '#F0E8D4',
                    transition: 'left .2s',
                  }} />
                </button>
              </div>
              <button style={primaryBtn} onClick={function() { setStep(3); }}>Next →</button>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <div style={{ background: CARD, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                {['Start/stop your camera with the cam button', 'Invite guests by sharing your room link', 'Go live when you\'re ready — your audience will see you'].map(function(tip, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 2 ? 12 : 0 }}>
                      <span style={{ color: GOLD, fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>•</span>
                      <span style={{ fontSize: 15, color: TEXT, lineHeight: 1.4 }}>{tip}</span>
                    </div>
                  );
                })}
              </div>
              <button style={primaryBtn} onClick={handleComplete}>Start Streaming</button>
              <button style={secondaryBtn} onClick={handleDismiss}>I'll explore on my own</button>
            </>
          )}

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <Dot active={step === 1} />
            <Dot active={step === 2} />
            <Dot active={step === 3} />
          </div>
        </div>
      </div>
    </div>
  );
}
