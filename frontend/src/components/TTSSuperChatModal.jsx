import React, { useState } from 'react';

var BG    = '#0E0C09';
var GOLD  = '#C9A84C';
var RED   = '#FF1A3C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var SURF  = '#1A1510';
var CARD  = '#1E1810';

var VOICES = [
  { id: 'cynic',  label: 'The Cynic',  emoji: '🎩', pitch: 0.5, rate: 0.8,  desc: 'Deep & skeptical' },
  { id: 'diva',   label: 'Urban Diva', emoji: '💃', pitch: 1.6, rate: 1.1,  desc: 'Confident & smooth' },
  { id: 'trick',  label: 'Trickster',  emoji: '🃏', pitch: 2.0, rate: 1.4,  desc: 'High & quick' },
  { id: 'anchor', label: 'The Anchor', emoji: '📻', pitch: 0.7, rate: 0.9,  desc: 'Authoritative' },
  { id: 'hype',   label: 'Hype Man',   emoji: '🔥', pitch: 1.3, rate: 1.5,  desc: 'Energy & fast' },
];

var TIERS = [
  { cents: 100,  label: '$1',  color: '#4FC3F7' },
  { cents: 200,  label: '$2',  color: '#67C19A' },
  { cents: 500,  label: '$5',  color: '#C9A84C' },
  { cents: 1000, label: '$10', color: '#FF9F43' },
  { cents: 2000, label: '$20', color: '#FF6B81' },
  { cents: 5000, label: '$50', color: '#FF1A3C' },
];

export default function TTSSuperChatModal({ socket, roomId, userId, username, onClose, addToast }) {
  var [step, setStep]           = useState('amount');
  var [selectedTier, setTier]   = useState(null);
  var [selectedVoice, setVoice] = useState(null);
  var [message, setMessage]     = useState('');
  var [previewing, setPreviewing] = useState(false);
  var [sending, setSending]     = useState(false);

  function previewVoice(v) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var u = new window.SpeechSynthesisUtterance(message.trim() || 'This is how ' + v.label + ' sounds in the room!');
    u.pitch = v.pitch;
    u.rate  = v.rate;
    u.onend = function() { setPreviewing(false); };
    setPreviewing(true);
    window.speechSynthesis.speak(u);
  }

  function stopPreview() {
    window.speechSynthesis && window.speechSynthesis.cancel();
    setPreviewing(false);
  }

  function handleSend() {
    if (!selectedTier || !selectedVoice || !message.trim() || !socket) return;
    setSending(true);
    socket.emit('super-chat:tts', {
      roomId:      roomId,
      userId:      userId,
      username:    username,
      message:     message.trim(),
      amountCents: selectedTier.cents,
      voice: {
        id:    selectedVoice.id,
        label: selectedVoice.label,
        emoji: selectedVoice.emoji,
        pitch: selectedVoice.pitch,
        rate:  selectedVoice.rate,
      },
    });
    if (addToast) addToast('🚀 Voice SuperChat blasting off!', 'success');
    stopPreview();
    onClose();
  }

  var canNext  = step === 'amount' ? !!selectedTier : !!selectedVoice;
  var canSend  = !!(selectedTier && selectedVoice && message.trim() && !sending);

  var stepIdx  = { amount: 0, voice: 1, message: 2 };

  return (
    <div
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div style={{ background: BG, border: '1px solid rgba(201,168,76,.25)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, padding: '20px 18px 36px', fontFamily: "'Barlow Condensed',sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 3 }}>🚀 VOICE SUPERCHAT</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1 }}>Pick a voice · write a message · blast it to the whole room</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>✕</button>
        </div>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          {['amount', 'voice', 'message'].map(function(s, i) {
            var current = step === s;
            var done    = stepIdx[step] > i;
            return (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: current ? GOLD : done ? 'rgba(201,168,76,.45)' : 'rgba(255,255,255,.08)', transition: 'background .2s' }} />
            );
          })}
        </div>

        {/* ── STEP 1: Amount ── */}
        {step === 'amount' && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>STEP 1 · PICK YOUR AMOUNT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {TIERS.map(function(tier) {
                var active = selectedTier && selectedTier.cents === tier.cents;
                return (
                  <button
                    key={tier.cents}
                    onClick={function() { setTier(tier); }}
                    style={{
                      background: active ? 'rgba(201,168,76,.15)' : SURF,
                      border: '1px solid ' + (active ? GOLD : 'rgba(255,255,255,.07)'),
                      borderRadius: 12, padding: '14px 0', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: active ? GOLD : TEXT, lineHeight: 1 }}>{tier.label}</div>
                    <div style={{ width: 28, height: 3, background: tier.color, borderRadius: 2, margin: '5px auto 0', opacity: active ? 1 : 0.5 }} />
                  </button>
                );
              })}
            </div>
            <button
              onClick={function() { if (selectedTier) setStep('voice'); }}
              style={{ width: '100%', marginTop: 16, padding: '13px 0', background: selectedTier ? GOLD : 'rgba(201,168,76,.15)', border: 'none', borderRadius: 12, color: selectedTier ? BG : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, cursor: selectedTier ? 'pointer' : 'default', letterSpacing: 2 }}
            >
              NEXT — PICK A VOICE →
            </button>
          </div>
        )}

        {/* ── STEP 2: Voice ── */}
        {step === 'voice' && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>STEP 2 · PICK A CHARACTER VOICE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VOICES.map(function(v) {
                var active = selectedVoice && selectedVoice.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={function() { setVoice(v); }}
                    style={{
                      background: active ? 'rgba(201,168,76,.12)' : SURF,
                      border: '1px solid ' + (active ? GOLD : 'rgba(255,255,255,.07)'),
                      borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{v.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: active ? GOLD : TEXT }}>{v.label}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{v.desc}</div>
                    </div>
                    <button
                      onClick={function(e) {
                        e.stopPropagation();
                        if (previewing) { stopPreview(); } else { setVoice(v); previewVoice(v); }
                      }}
                      style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '4px 9px', color: TEXT, fontSize: 9, cursor: 'pointer', fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap' }}
                    >
                      {previewing && active ? '■ STOP' : '▶ PREVIEW'}
                    </button>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={function() { setStep('amount'); }} style={{ flex: 1, padding: '11px 0', background: SURF, border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, color: MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer' }}>← BACK</button>
              <button
                onClick={function() { if (selectedVoice) setStep('message'); }}
                style={{ flex: 2, padding: '11px 0', background: selectedVoice ? GOLD : 'rgba(201,168,76,.15)', border: 'none', borderRadius: 12, color: selectedVoice ? BG : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: selectedVoice ? 'pointer' : 'default', letterSpacing: 1 }}
              >
                NEXT — WRITE MESSAGE →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Message + Send ── */}
        {step === 'message' && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 8 }}>
              STEP 3 · YOUR MESSAGE · SPOKEN AS {selectedVoice ? selectedVoice.emoji + ' ' + selectedVoice.label.toUpperCase() : ''}
            </div>
            <textarea
              value={message}
              onChange={function(e) { setMessage(e.target.value); }}
              maxLength={120}
              placeholder="Type what you want the voice to say..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: SURF, border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10, padding: '12px 14px', color: TEXT,
                fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16,
                resize: 'none', height: 88, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{message.length}/120</span>
              <button
                onClick={function() { if (message.trim() && selectedVoice) { if (previewing) stopPreview(); else previewVoice(selectedVoice); } }}
                style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '4px 10px', color: TEXT, fontSize: 9, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}
              >
                {previewing ? '■ STOP PREVIEW' : '▶ HEAR IT FIRST'}
              </button>
            </div>

            {/* Summary card */}
            <div style={{ background: CARD, border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>SENDING </span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD }}>{selectedTier ? selectedTier.label : ''}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}> AS {selectedVoice ? selectedVoice.emoji + ' ' + selectedVoice.label.toUpperCase() : ''}</span>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>heard by the whole room</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { stopPreview(); setStep('voice'); }} style={{ flex: 1, padding: '13px 0', background: SURF, border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, color: MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer' }}>← BACK</button>
              <button
                onClick={handleSend}
                disabled={!canSend}
                style={{ flex: 2, padding: '13px 0', background: canSend ? RED : 'rgba(255,26,60,.18)', border: 'none', borderRadius: 12, color: canSend ? TEXT : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: canSend ? 'pointer' : 'default', letterSpacing: 2 }}
              >
                🚀 BLAST OFF {selectedTier ? selectedTier.label : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
