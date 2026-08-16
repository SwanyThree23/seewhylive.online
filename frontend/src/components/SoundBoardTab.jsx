import React, { useState, useEffect, useRef } from 'react';
import { SOUNDS, playSound, playCustomSound } from '../utils/soundFx.js';

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

var CAT_COLORS = { hype: BURG, money: GOLD, crowd: AMBER, event: GOLD, react: MUTED, fun: AMBER, custom: GOLD };

export default function SoundBoardTab(props) {
  var socket   = props.socket;
  var roomId   = props.roomId;
  var role     = props.role;
  var addToast = props.addToast;

  var [activeFx,    setActiveFx]    = useState(null);
  var [popLabels,   setPopLabels]   = useState([]);
  var [vol,         setVol]         = useState(80);
  var [filterCat,   setFilterCat]   = useState('all');
  var popIdRef   = useRef(0);
  var sfxTimerRef = useRef(null);
  var [customSounds, setCustomSounds] = useState([]);

  var isHost = role === 'host' || role === 'cohost';

  useEffect(function() {
    if (!socket) return;
    function onSfx(data) {
      if (!data || !data.sfxId) return;
      var sfx = SOUNDS.find(function(s) { return s.id === data.sfxId; });
      if (sfx) {
        playSound(sfx);
        setActiveFx(data.sfxId);
        if (sfxTimerRef.current) clearTimeout(sfxTimerRef.current);
        sfxTimerRef.current = setTimeout(function() { setActiveFx(null); }, 600);
      }
    }
    socket.on('sound-fx', onSfx);
    return function() {
      socket.off('sound-fx', onSfx);
      if (sfxTimerRef.current) clearTimeout(sfxTimerRef.current);
    };
  }, [socket]);
  useEffect(function() { fetch('/api/sounds', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('sw_token') || '') } }).then(function(r) { return r.json(); }).then(function(list) { if (Array.isArray(list)) { setCustomSounds(list.map(function(s) { return { id: s.id, label: s.label || 'CUSTOM', emoji: '🎵', cat: 'custom', url: s.playback_url }; })); } }).catch(function(e) {}); }, []);

  function triggerFx(sfx) {
    if (sfx.url) { playCustomSound(sfx, vol); } else { playSound(sfx); }
    setActiveFx(sfx.id);
    if (sfxTimerRef.current) clearTimeout(sfxTimerRef.current);
    sfxTimerRef.current = setTimeout(function() { setActiveFx(null); }, 600);

    var pid = ++popIdRef.current;
    setPopLabels(function(p) { return p.concat([{ id: pid, label: sfx.emoji + ' ' + sfx.label }]); });
    setTimeout(function() {
      setPopLabels(function(p) { return p.filter(function(x) { return x.id !== pid; }); });
    }, 900);

    if (socket) socket.emit('sound-fx', { roomId: roomId, sfxId: sfx.id, sfxLabel: sfx.label });
  }

  var cats = ['all', 'hype', 'money', 'event', 'react', 'crowd', 'fun', 'custom'];
  var filtered = filterCat === 'all' ? SOUNDS.concat(customSounds) : SOUNDS.concat(customSounds).filter(function(s) { return s.cat === filterCat; });

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
