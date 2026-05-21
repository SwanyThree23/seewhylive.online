import React, { useState, useRef, useEffect } from 'react';

var PADS = [
  { id: 'kick',   label: '🥁 Kick',   color: '#FF1A3C' },
  { id: 'snare',  label: '🎵 Snare',  color: '#C9A84C' },
  { id: 'clap',   label: '👏 Clap',   color: '#00C9A7' },
  { id: 'hihat',  label: '🔔 Hi-Hat', color: '#5A8FFF' },
  { id: 'bass',   label: '🎸 Bass',   color: '#C084FC' },
  { id: 'chord',  label: '🎹 Chord',  color: '#FF6B35' },
  { id: 'lead',   label: '🎺 Lead',   color: '#C8FF00' },
  { id: 'fx',     label: '✨ FX',     color: '#FF1493' },
];

var KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var KEY_COLORS = ['#FF4444','#FF7744','#FFAA44','#FFDD44','#BBFF44','#44FFAA','#44DDFF','#4488FF','#8844FF','#DD44FF','#FF44AA','#FF4466'];

var GRID_STEPS = 16;

function makeEmptyGrid() {
  var g = {};
  PADS.forEach(function(p) {
    g[p.id] = Array(GRID_STEPS).fill(false);
  });
  return g;
}

function makeInitGrid() {
  var g = makeEmptyGrid();
  g.kick  = [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean);
  g.snare = [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0].map(Boolean);
  g.hihat = [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean);
  return g;
}

export default function MusicStudioTab({ addToast }) {
  var [tab,       setTab]    = useState('pads');
  var [grid,      setGrid]   = useState(makeInitGrid);
  var [playing,   setPlaying] = useState(false);
  var [step,      setStep]   = useState(-1);
  var [bpm,       setBpm]    = useState(120);
  var [activeKey, setActiveKey] = useState(null);
  var [padFlash,  setPadFlash] = useState({});
  var stepRef = useRef(-1);
  var playRef = useRef(null);

  useEffect(function() {
    if (!playing) {
      if (playRef.current) clearInterval(playRef.current);
      setStep(-1);
      stepRef.current = -1;
      return;
    }
    var interval = Math.floor(60000 / bpm / 4);
    playRef.current = setInterval(function() {
      stepRef.current = (stepRef.current + 1) % GRID_STEPS;
      setStep(stepRef.current);
      var flash = {};
      PADS.forEach(function(p) {
        if (grid[p.id] && grid[p.id][stepRef.current]) {
          flash[p.id] = true;
        }
      });
      if (Object.keys(flash).length > 0) {
        setPadFlash(flash);
        setTimeout(function() { setPadFlash({}); }, 80);
      }
    }, interval);
    return function() { clearInterval(playRef.current); };
  }, [playing, bpm, grid]);

  function toggleCell(padId, stepIdx) {
    setGrid(function(g) {
      var row = g[padId].slice();
      row[stepIdx] = !row[stepIdx];
      return Object.assign({}, g, { [padId]: row });
    });
  }

  function fireKey(k) {
    setActiveKey(k);
    setTimeout(function() { setActiveKey(null); }, 160);
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 430 }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.22)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#00DEC0', letterSpacing: 3 }}>🎵 MUSIC STUDIO</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#7A6F90' }}>{bpm} BPM · 16-step sequencer</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range" min={60} max={200} value={bpm}
            onChange={function(e) { setBpm(Number(e.target.value)); }}
            style={{ width: 70, accentColor: '#00C9A7' }}
          />
          <button
            onClick={function() { setPlaying(function(p) { return !p; }); }}
            style={{ background: playing ? 'rgba(255,26,60,.2)' : 'linear-gradient(135deg,#800020,#C01838)', border: playing ? '1px solid rgba(255,26,60,.5)' : 'none', borderRadius: 8, padding: '7px 16px', color: playing ? '#FF6B81' : '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {playing ? '■ STOP' : '▶ PLAY'}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['pads', '🥁 BEAT PADS'], ['keys', '🎹 KEYS'], ['seq', '🎛 SEQUENCER']].map(function(t) {
          var active = tab === t[0];
          return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }}
              style={{ flex: 1, padding: '7px 0', background: active ? 'rgba(0,201,167,.15)' : 'rgba(22,16,32,.7)', border: '1px solid ' + (active ? 'rgba(0,201,167,.4)' : '#241C34'), borderRadius: 8, color: active ? '#00C9A7' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>

      {/* BEAT PADS */}
      {tab === 'pads' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {PADS.map(function(p) {
            var flash = Boolean(padFlash[p.id]);
            return (
              <button key={p.id}
                onMouseDown={function() { setPadFlash(function(pf) { return Object.assign({}, pf, { [p.id]: true }); }); }}
                onMouseUp={function()   { setPadFlash(function(pf) { return Object.assign({}, pf, { [p.id]: false }); }); }}
                style={{ aspectRatio: '1', background: flash ? p.color + '55' : p.color + '12', border: '2px solid ' + (flash ? p.color : p.color + '44'), borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transform: flash ? 'scale(0.93)' : 'scale(1)', transition: 'all 60ms', boxShadow: flash ? '0 0 18px ' + p.color + '66' : 'none' }}>
                <span style={{ fontSize: 22 }}>{p.label.split(' ')[0]}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, color: flash ? p.color : '#7A6F90' }}>{p.label.split(' ').slice(1).join(' ')}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* KEYS */}
      {tab === 'keys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {KEYS.map(function(k, i) {
              var active = activeKey === k;
              var isSharp = k.includes('#');
              return (
                <button key={k}
                  onMouseDown={function() { fireKey(k); }}
                  style={{ flex: isSharp ? 0.7 : 1, padding: isSharp ? '24px 0 8px' : '34px 0 8px', background: active ? KEY_COLORS[i] : isSharp ? '#161020' : '#EDE8F5', border: '1px solid ' + KEY_COLORS[i] + '55', borderRadius: '0 0 6px 6px', cursor: 'pointer', transition: 'all 60ms', boxShadow: active ? '0 0 12px ' + KEY_COLORS[i] : 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: active ? '#07050A' : isSharp ? KEY_COLORS[i] : '#241C34', fontWeight: 700 }}>{k}</span>
                </button>
              );
            })}
          </div>
          <div style={{ background: 'rgba(7,5,10,.8)', border: '1px solid #241C34', borderRadius: 8, padding: '8px 12px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: activeKey ? '#C9A84C' : '#7A6F90', textAlign: 'center', minHeight: 32 }}>
            {activeKey ? '♪ ' + activeKey + '4 playing' : 'Tap a key to play'}
          </div>
        </div>
      )}

      {/* SEQUENCER */}
      {tab === 'seq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            {Array.from({ length: GRID_STEPS }).map(function(_, i) {
              return (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: step === i ? '#C9A84C' : i % 4 === 0 ? '#241C34' : '#161020', transition: 'background 60ms' }} />
              );
            })}
          </div>
          {PADS.map(function(p) {
            return (
              <div key={p.id} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: p.color, width: 14, flexShrink: 0, textAlign: 'center' }}>{p.label.split(' ')[0]}</div>
                {grid[p.id].map(function(on, i) {
                  var isCurrent = step === i;
                  return (
                    <button key={i}
                      onClick={function() { toggleCell(p.id, i); }}
                      style={{ flex: 1, height: 18, borderRadius: 3, background: on ? (isCurrent ? p.color : p.color + '88') : (isCurrent ? '#241C34' : '#161020'), border: '1px solid ' + (on ? p.color + '66' : '#241C34'), cursor: 'pointer', transition: 'background 60ms', boxShadow: on && isCurrent ? '0 0 6px ' + p.color : 'none' }} />
                  );
                })}
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button onClick={function() { setGrid(makeInitGrid()); }}
              style={{ flex: 1, padding: '6px', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, color: '#C9A84C', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              RESET
            </button>
            <button onClick={function() { setGrid(makeEmptyGrid()); }}
              style={{ flex: 1, padding: '6px', background: 'rgba(230,57,70,.1)', border: '1px solid rgba(230,57,70,.3)', borderRadius: 6, color: '#FF6B81', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              CLEAR
            </button>
            <button onClick={function() { if (addToast) addToast('Pattern saved 🎵', 'success'); }}
              style={{ flex: 1, padding: '6px', background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 6, color: '#00C9A7', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
              SAVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
