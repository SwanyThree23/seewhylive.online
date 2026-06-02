import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var BURG   = '#800020';
var AMBER  = '#D4854A';
var RED    = '#FF1A3C';
var TEXT   = '#F0E8D4';
var MUTED  = '#8A7A62';
var CARD   = '#241C12';
var CARD2  = '#2E2318';
var SURF   = '#1A1510';
var BG     = '#0E0C09';
var BORDER = 'rgba(201,168,76,.12)';
var DIM    = '#3D3020';

var STYLE_TAG =
  '@keyframes sfxFlash {' +
  '  0%   { transform: scale(1);    background: rgba(201,168,76,.2); }' +
  '  30%  { transform: scale(1.08); background: rgba(201,168,76,.45); }' +
  '  100% { transform: scale(1);    background: rgba(201,168,76,.1); }' +
  '}' +
  '@keyframes sfxPop {' +
  '  0%   { transform: translateY(0)  scale(1);    opacity: 1; }' +
  '  40%  { transform: translateY(-8px) scale(1.15); opacity: 1; }' +
  '  100% { transform: translateY(-24px) scale(.7);  opacity: 0; }' +
  '}';

// Sound FX definitions — name, emoji, frequency config for Web Audio synthesis
// We use the Web Audio API to synthesize tones so no external files are needed.
var SOUNDS = [
  { id: 'airhorn',   label: 'AIR HORN',    emoji: '📯', cat: 'hype',  freq: [880,660,440], dur: 0.8, type: 'sawtooth' },
  { id: 'cash',      label: 'CASH',        emoji: '💰', cat: 'money', freq: [523,659,784], dur: 0.5, type: 'sine' },
  { id: 'drum',      label: 'DRUM HIT',    emoji: '🥁', cat: 'hype',  noise: true, dur: 0.25 },
  { id: 'clap',      label: 'CLAP',        emoji: '👏', cat: 'crowd', noise: true, dur: 0.1, bright: true },
  { id: 'hype',      label: 'HYPE UP',     emoji: '🔥', cat: 'hype',  freq: [200,400,600,800], dur: 1.0, type: 'square', sweep: true },
  { id: 'win',       label: 'WINNER',      emoji: '🏆', cat: 'event', freq: [523,659,784,1047], dur: 1.2, type: 'sine', arp: true },
  { id: 'buzzer',    label: 'BUZZER',      emoji: '🚨', cat: 'event', freq: [160,150], dur: 0.6, type: 'square', alt: true },
  { id: 'love',      label: 'LOVE',        emoji: '♥',  cat: 'react', freq: [440,554,659], dur: 0.7, type: 'sine', chord: true },
  { id: 'laugh',     label: 'LOL',         emoji: '😂', cat: 'react', freq: [400,500,400,500,400], dur: 0.8, type: 'sine', bounce: true },
  { id: 'shock',     label: 'GASP',        emoji: '😮', cat: 'react', freq: [800,200], dur: 0.5, type: 'sine', fall: true },
  { id: 'sub',       label: 'NEW SUB',     emoji: '⭐', cat: 'event', freq: [392,494,587,740], dur: 1.0, type: 'sine', arp: true },
  { id: 'goat',      label: 'GOAT',        emoji: '🐐', cat: 'fun',   freq: [300,600,300,600], dur: 0.9, type: 'sawtooth', alt: true },
];

var CAT_COLORS = { hype: BURG, money: GOLD, crowd: AMBER, event: GOLD, react: MUTED, fun: AMBER };

function playSound(sfx) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (sfx.noise) {
      // Noise burst (drum/clap)
      var bufLen = Math.floor(ctx.sampleRate * sfx.dur);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen); }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = sfx.bright ? 'highpass' : 'lowpass';
      filt.frequency.value = sfx.bright ? 2000 : 200;
      src.connect(filt);
      filt.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + sfx.dur);
      setTimeout(function() { try { ctx.close(); } catch(e) {} }, (sfx.dur + 0.2) * 1000);
      return;
    }

    var freqs = sfx.freq || [440];
    var now = ctx.currentTime;
    var stepDur = sfx.arp ? (sfx.dur / freqs.length) : 0;

    freqs.forEach(function(f, idx) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = sfx.type || 'sine';

      var startT = now + (sfx.arp ? idx * stepDur : 0);
      var endT   = sfx.arp ? (startT + stepDur) : (now + sfx.dur);

      if (sfx.sweep) {
        osc.frequency.setValueAtTime(freqs[0], startT);
        osc.frequency.linearRampToValueAtTime(freqs[freqs.length - 1], endT);
      } else if (sfx.fall) {
        osc.frequency.setValueAtTime(freqs[0], startT);
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqs[freqs.length - 1], 1), endT);
      } else if (sfx.alt) {
        osc.frequency.setValueAtTime(freqs[idx % freqs.length], startT);
      } else if (sfx.bounce) {
        osc.frequency.setValueAtTime(freqs[idx % freqs.length], startT);
      } else {
        osc.frequency.setValueAtTime(f, startT);
      }

      if (sfx.chord) {
        // play all freqs simultaneously
        osc.frequency.setValueAtTime(f, now);
      }

      gain.gain.setValueAtTime(sfx.chord ? 0.25 : 0.4, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, endT);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(endT + 0.05);
    });

    setTimeout(function() { try { ctx.close(); } catch(e) {} }, (sfx.dur + 0.5) * 1000);
  } catch(e) {
    // Audio not available — silently fail
  }
}

export default function SoundBoardTab(props) {
  var socket   = props.socket;
  var roomId   = props.roomId;
  var role     = props.role;
  var addToast = props.addToast;

  var [activeFx,    setActiveFx]    = useState(null);
  var [popLabels,   setPopLabels]   = useState([]);
  var [vol,         setVol]         = useState(80);
  var [filterCat,   setFilterCat]   = useState('all');
  var popIdRef = useRef(0);

  var isHost = role === 'host' || role === 'cohost';

  useEffect(function() {
    if (!socket) return;
    function onSfx(data) {
      if (!data || !data.sfxId) return;
      var sfx = SOUNDS.find(function(s) { return s.id === data.sfxId; });
      if (sfx) {
        playSound(sfx);
        setActiveFx(data.sfxId);
        setTimeout(function() { setActiveFx(null); }, 600);
      }
    }
    socket.on('sound-fx', onSfx);
    return function() { socket.off('sound-fx', onSfx); };
  }, [socket]);

  function triggerFx(sfx) {
    playSound(sfx);
    setActiveFx(sfx.id);
    setTimeout(function() { setActiveFx(null); }, 600);

    var pid = ++popIdRef.current;
    setPopLabels(function(p) { return p.concat([{ id: pid, label: sfx.emoji + ' ' + sfx.label }]); });
    setTimeout(function() {
      setPopLabels(function(p) { return p.filter(function(x) { return x.id !== pid; }); });
    }, 900);

    if (socket) socket.emit('sound-fx', { roomId: roomId, sfxId: sfx.id, sfxLabel: sfx.label });
  }

  var cats = ['all', 'hype', 'money', 'event', 'react', 'crowd', 'fun'];
  var filtered = filterCat === 'all' ? SOUNDS : SOUNDS.filter(function(s) { return s.cat === filterCat; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, fontFamily: "'Barlow Condensed',sans-serif", overflow: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />

      {/* Header */}
      <div style={{ background: SURF, borderBottom: '1px solid ' + BORDER, padding: '10px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 2 }}>🎚 SOUND BOARD</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>
            {isHost ? 'Tap to play for all viewers' : 'Listening to host sounds'}
          </div>
        </div>
        {/* Volume slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>🔊</span>
          <input
            type="range" min="0" max="100" value={vol}
            onChange={function(e) { setVol(parseInt(e.target.value, 10)); }}
            style={{ width: 60, accentColor: GOLD }}
          />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>{vol}%</span>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ background: CARD, borderBottom: '1px solid ' + BORDER, padding: '6px 10px', display: 'flex', gap: 5, overflowX: 'auto', flexShrink: 0 }}>
        {cats.map(function(cat) {
          var active = filterCat === cat;
          return (
            <button key={cat} onClick={function() { setFilterCat(cat); }}
              style={{ background: active ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (active ? GOLD : BORDER), borderRadius: 20, padding: '3px 10px', color: active ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', flexShrink: 0, letterSpacing: 1, textTransform: 'uppercase' }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Viewer-only message */}
      {!isHost && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 32 }}>🎚</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1, textAlign: 'center' }}>
            Host is controlling the sound board.<br />You'll hear effects when they play.
          </div>
        </div>
      )}

      {/* Sound grid (host only) */}
      {isHost && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {filtered.map(function(sfx) {
              var isActive = activeFx === sfx.id;
              var catColor = CAT_COLORS[sfx.cat] || MUTED;
              return (
                <button
                  key={sfx.id}
                  onClick={function() { triggerFx(sfx); }}
                  style={{
                    background: isActive ? 'rgba(201,168,76,.18)' : 'rgba(255,255,255,.04)',
                    border: '1px solid ' + (isActive ? GOLD : BORDER),
                    borderRadius: 12,
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    animation: isActive ? 'sfxFlash .5s ease' : 'none',
                    transition: 'border-color .15s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                  {/* Category accent line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: catColor, opacity: 0.6 }} />
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{sfx.emoji}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, letterSpacing: 1, textAlign: 'center' }}>{sfx.label}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: catColor, letterSpacing: 1, textTransform: 'uppercase' }}>{sfx.cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pop-up labels */}
      <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: 0, pointerEvents: 'none' }}>
        {popLabels.map(function(pl) {
          return (
            <div key={pl.id} style={{
              position: 'absolute',
              bottom: 0,
              left: -60,
              width: 120,
              textAlign: 'center',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: GOLD,
              animation: 'sfxPop .9s ease forwards',
              pointerEvents: 'none',
              textShadow: '0 1px 6px rgba(0,0,0,.8)',
              whiteSpace: 'nowrap'
            }}>
              {pl.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
