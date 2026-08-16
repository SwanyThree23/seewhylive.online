'use strict';

export var SOUNDS = [
  { id: 'airhorn', label: 'AIR HORN',  emoji: '📯', cat: 'hype',  freq: [880,660,440],      dur: 0.8, type: 'sawtooth' },
  { id: 'cash',    label: 'CASH',      emoji: '💰', cat: 'money', freq: [523,659,784],      dur: 0.5, type: 'sine' },
  { id: 'drum',    label: 'DRUM HIT',  emoji: '🥁', cat: 'hype',  noise: true,              dur: 0.25 },
  { id: 'clap',    label: 'CLAP',      emoji: '👏', cat: 'crowd', noise: true,              dur: 0.1,  bright: true },
  { id: 'hype',    label: 'HYPE UP',   emoji: '🔥', cat: 'hype',  freq: [200,400,600,800],  dur: 1.0,  type: 'square', sweep: true },
  { id: 'win',     label: 'WINNER',    emoji: '🏆', cat: 'event', freq: [523,659,784,1047], dur: 1.2,  type: 'sine',    arp: true },
  { id: 'buzzer',  label: 'BUZZER',    emoji: '🚨', cat: 'event', freq: [160,150],          dur: 0.6,  type: 'square',  alt: true },
  { id: 'love',    label: 'LOVE',      emoji: '♥',  cat: 'react', freq: [440,554,659],      dur: 0.7,  type: 'sine',    chord: true },
  { id: 'laugh',   label: 'LOL',       emoji: '😂', cat: 'react', freq: [400,500,400,500,400], dur: 0.8, type: 'sine', bounce: true },
  { id: 'shock',   label: 'GASP',      emoji: '😮', cat: 'react', freq: [800,200],          dur: 0.5,  type: 'sine',    fall: true },
  { id: 'sub',     label: 'NEW SUB',   emoji: '⭐', cat: 'event', freq: [392,494,587,740],  dur: 1.0,  type: 'sine',    arp: true },
  { id: 'goat',    label: 'GOAT',      emoji: '🐐', cat: 'fun',   freq: [300,600,300,600],  dur: 0.9,  type: 'sawtooth', alt: true },
  { id: 'boo', label: 'BOO', emoji: '👎', cat: 'crowd', freq: [200,150], dur: 0.9, type: 'sawtooth', fall: true },
  { id: 'gong', label: 'GONG', emoji: '🔔', cat: 'event', freq: [110], dur: 1.5, type: 'sine' },
  { id: 'heartbeat', label: 'HEARTBEAT', emoji: '💓', cat: 'react', freq: [60,50,60,50], dur: 1.0, type: 'sine', bounce: true },
];

export function playSound(sfx) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (sfx.noise) {
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
