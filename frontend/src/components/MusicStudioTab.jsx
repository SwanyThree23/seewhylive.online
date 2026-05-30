import React, { useState, useRef, useEffect } from 'react';

// ─── Palette ───────────────────────────────────────────────────────────────
var BG    = '#0F0C14';
var SURF  = '#130F1C';
var CARD  = '#1A1526';
var CARD2 = '#211A30';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var TEAL  = '#00DEC0';
var RED   = '#FF1A3C';
var TEXT  = '#EDE8F5';
var MUTED = '#7A6F90';
var DIM   = '#2E2545';
var BORD  = 'rgba(255,255,255,.06)';

// ─── Animations ────────────────────────────────────────────────────────────
var ANIM = [
  '@keyframes trackIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes genPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.4)}70%{box-shadow:0 0 0 10px rgba(201,168,76,0)}}',
  '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
  '@keyframes speakBar{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}',
].join('\n');

// ─── Constants ─────────────────────────────────────────────────────────────
var STYLE_TAGS = ['Trap','R&B','Hip-Hop','Soul','Gospel','Lo-Fi','Drill','Afrobeats','Jazz','Electronic','Classical','Reggae','Pop','Country','Rock'];
var MOOD_TAGS  = ['Hype','Chill','Emotional','Aggressive','Uplifting','Dark','Romantic','Triumphant','Nostalgic'];
var DURATIONS  = [{ id: '30s', label: '0:30' }, { id: '1min', label: '1:00' }, { id: '2min', label: '~2:00' }, { id: 'full', label: 'Full' }];

var GEN_STEPS = [
  'Analyzing prompt…',
  'Composing melody…',
  'Building arrangement…',
  'Mixing tracks…',
  'Adding vocals…',
  'Mastering audio…',
  'Finalizing…',
];

var COVER_GRADIENTS = [
  'linear-gradient(135deg,#800020,#C01838)',
  'linear-gradient(135deg,#1a0533,#7928CA)',
  'linear-gradient(135deg,#003d4d,#00DEC0)',
  'linear-gradient(135deg,#1a2a00,#7CB518)',
  'linear-gradient(135deg,#2d1b00,#C9A84C)',
  'linear-gradient(135deg,#00104d,#5A8FFF)',
  'linear-gradient(135deg,#2d0033,#FF1A3C)',
  'linear-gradient(135deg,#001a33,#00A2E8)',
  'linear-gradient(135deg,#1a1000,#FF6B35)',
  'linear-gradient(135deg,#0d0d1a,#9B59B6)',
  'linear-gradient(135deg,#001a00,#00C851)',
  'linear-gradient(135deg,#1a0000,#FF4757)',
];
var COVER_EMOJIS = ['🎵','🎸','🎹','🎺','🎻','🥁','🎙','🎤','🎼','🎧','💿','🔊','🎶','👑','🔥'];

// ─── Beat Maker ─────────────────────────────────────────────────────────────
var PADS = [
  { id: 'kick',  label: '🥁 Kick',  color: RED         },
  { id: 'snare', label: '🎵 Snare', color: GOLD        },
  { id: 'clap',  label: '👏 Clap',  color: TEAL        },
  { id: 'hihat', label: '🔔 Hi-Hat',color: '#5A8FFF'   },
  { id: 'bass',  label: '🎸 Bass',  color: '#C084FC'   },
  { id: 'chord', label: '🎹 Chord', color: '#FF6B35'   },
  { id: 'lead',  label: '🎺 Lead',  color: '#C8FF00'   },
  { id: 'fx',    label: '✨ FX',    color: '#FF1493'   },
];
var GRID_STEPS = 16;
var BPM_PRESETS = [
  { label: 'Trap',    bpm: 75  },
  { label: 'Hip-Hop', bpm: 95  },
  { label: 'R&B',     bpm: 88  },
  { label: 'House',   bpm: 128 },
  { label: 'Drill',   bpm: 140 },
];

function makeInitGrid() {
  var g = {};
  PADS.forEach(function(p) { g[p.id] = Array(GRID_STEPS).fill(false); });
  g.kick  = [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean);
  g.snare = [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0].map(Boolean);
  g.hihat = [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean);
  return g;
}

// ─── Community tracks (simulated) ──────────────────────────────────────────
var COMMUNITY = [
  { id: 'c1', title: 'Late Night Drive',     style: 'Lo-Fi',      mood: 'Chill',      emoji: '🎧', grad: COVER_GRADIENTS[1],  dur: '2:34', plays: 1847 },
  { id: 'c2', title: 'Trap God Season',      style: 'Trap',       mood: 'Hype',       emoji: '👑', grad: COVER_GRADIENTS[0],  dur: '3:12', plays: 3290 },
  { id: 'c3', title: 'Soul Sunday Morning',  style: 'Soul',       mood: 'Uplifting',  emoji: '🎵', grad: COVER_GRADIENTS[2],  dur: '4:01', plays: 922  },
  { id: 'c4', title: 'Drill Season Vol. 3',  style: 'Drill',      mood: 'Aggressive', emoji: '🔊', grad: COVER_GRADIENTS[6],  dur: '2:47', plays: 5614 },
  { id: 'c5', title: 'Golden Hour Vibes',    style: 'R&B',        mood: 'Romantic',   emoji: '💿', grad: COVER_GRADIENTS[4],  dur: '3:55', plays: 2103 },
  { id: 'c6', title: 'Afrobeats Summer',     style: 'Afrobeats',  mood: 'Hype',       emoji: '🎶', grad: COVER_GRADIENTS[7],  dur: '3:28', plays: 7831 },
];

// ─── WaveformBars ────────────────────────────────────────────────────────────
function WaveformBars(props) {
  var count  = props.count  || 8;
  var color  = props.color  || TEAL;
  var height = props.height || 20;
  var bars = [];
  var bi;
  for (bi = 0; bi < count; bi++) bars.push(bi);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: height }}>
      {bars.map(function(i) {
        return (
          <div key={i} style={{
            width: 3, height: height, background: color, borderRadius: 2,
            transformOrigin: 'bottom', transform: 'scaleY(.25)',
            animation: 'speakBar .45s ease-in-out ' + (i * .07) + 's infinite alternate',
            opacity: .85,
          }} />
        );
      })}
    </div>
  );
}

// ─── TrackCard ────────────────────────────────────────────────────────────────
function TrackCard(props) {
  var t       = props.track;
  var playing = props.playing;
  var onPlay  = props.onPlay;
  var onDel   = props.onDel;
  var onShare = props.onShare;
  return (
    <div style={{
      background: CARD, border: '1px solid ' + (playing ? GOLD + '55' : BORD),
      borderRadius: 14, overflow: 'hidden', animation: 'trackIn .3s ease',
      boxShadow: playing ? '0 0 20px rgba(201,168,76,.18)' : 'none',
      transition: 'border-color .2s, box-shadow .2s',
    }}>
      <div style={{ position: 'relative', background: t.grad, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 34, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.5))' }}>{t.emoji}</span>
        {playing && (
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <WaveformBars count={10} color={GOLD} height={16} />
          </div>
        )}
        <button onClick={onPlay} style={{
          position: 'absolute', top: 6, right: 6,
          width: 28, height: 28, borderRadius: '50%',
          background: playing ? 'rgba(201,168,76,.3)' : 'rgba(0,0,0,.55)',
          border: '1.5px solid ' + (playing ? GOLD : 'rgba(255,255,255,.3)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: playing ? GOLD : TEXT, cursor: 'pointer',
        }}>
          {playing ? '⏸' : '▶'}
        </button>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: TEXT, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, background: 'rgba(0,222,192,.1)', borderRadius: 4, padding: '1px 5px' }}>{t.style}</span>
          {t.mood && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, background: 'rgba(255,255,255,.06)', borderRadius: 4, padding: '1px 5px' }}>{t.mood}</span>}
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginLeft: 'auto' }}>{t.dur || '--:--'}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onShare && (
            <button onClick={onShare} style={{ flex: 1, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.22)', borderRadius: 6, padding: '5px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>📡 STREAM</button>
          )}
          {t.plays != null && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px 7px', background: CARD2, borderRadius: 6 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>▶ {t.plays >= 1000 ? (t.plays / 1000).toFixed(1) + 'k' : t.plays}</span>
            </div>
          )}
          {onDel && (
            <button onClick={onDel} style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.14)', borderRadius: 6, padding: '5px 8px', color: RED, fontSize: 10, cursor: 'pointer' }}>🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MusicStudioTab(props) {
  var addToast = props.addToast;
  var isLive   = props.isLive;
  var socket   = props.socket;
  var roomId   = props.roomId;

  var [tab,          setTab]         = useState('generate');

  // Generate
  var [prompt,       setPrompt]      = useState('');
  var [titleInput,   setTitleInput]  = useState('');
  var [selStyles,    setSelStyles]   = useState([]);
  var [selMoods,     setSelMoods]    = useState([]);
  var [duration,     setDuration]    = useState('2min');
  var [instrumental, setInstr]       = useState(false);
  var [customMode,   setCustomMode]  = useState(false);
  var [lyricsInput,  setLyricsInput] = useState('');
  var [styleInput,   setStyleInput]  = useState('');
  var [generating,   setGenerating]  = useState(false);
  var [genStep,      setGenStep]     = useState(0);
  var [genPct,       setGenPct]      = useState(0);
  var [myTracks,     setMyTracks]    = useState(function() {
    try { var s = localStorage.getItem('sw_my_tracks'); if (s) return JSON.parse(s); } catch(e) {}
    return [];
  });
  var [playingId,    setPlayingId]   = useState(null);

  // Beat Maker
  var [grid,         setGrid]        = useState(makeInitGrid);
  var [beatPlaying,  setBeatPlaying] = useState(false);
  var [beatStep,     setBeatStep]    = useState(-1);
  var [bpm,          setBpm]         = useState(120);
  var [beatPreset,   setBeatPreset]  = useState(null);
  var [padFlash,     setPadFlash]    = useState({});
  var beatStepRef = useRef(-1);
  var beatPlayRef = useRef(null);
  var gridRef     = useRef(grid);
  var tapRef      = useRef([]);

  // Library
  var [libTab,       setLibTab]      = useState('mine');

  // Lyrics
  var [lyricPrompt,  setLyricPrompt] = useState('');
  var [lyricStyle,   setLyricStyle]  = useState('Hip-Hop');
  var [lyricsEdited, setLyricsEdited]= useState('');
  var [genLyricsing, setGenLyricsing]= useState(false);

  // Live waveform
  var [waveform,     setWaveform]    = useState([]);

  useEffect(function() { gridRef.current = grid; }, [grid]);

  useEffect(function() {
    if (!isLive) { setWaveform([]); return; }
    function gen() { var b = []; for (var i = 0; i < 20; i++) b.push(10 + Math.floor(Math.random() * 91)); return b; }
    setWaveform(gen());
    var id = setInterval(function() { setWaveform(gen()); }, 130);
    return function() { clearInterval(id); };
  }, [isLive]);

  useEffect(function() {
    try { localStorage.setItem('sw_my_tracks', JSON.stringify(myTracks)); } catch(e) {}
  }, [myTracks]);

  useEffect(function() {
    if (!beatPlaying) {
      if (beatPlayRef.current) clearInterval(beatPlayRef.current);
      setBeatStep(-1); beatStepRef.current = -1; return;
    }
    var interval = Math.floor(60000 / bpm / 4);
    beatPlayRef.current = setInterval(function() {
      beatStepRef.current = (beatStepRef.current + 1) % GRID_STEPS;
      setBeatStep(beatStepRef.current);
      var flash = {};
      var g = gridRef.current;
      PADS.forEach(function(p) { if (g[p.id] && g[p.id][beatStepRef.current]) flash[p.id] = true; });
      if (Object.keys(flash).length > 0) {
        setPadFlash(flash);
        setTimeout(function() { setPadFlash({}); }, 80);
      }
    }, interval);
    return function() { clearInterval(beatPlayRef.current); };
  }, [beatPlaying, bpm]);

  function generateSong() {
    var p = customMode ? lyricsInput : prompt;
    if (!p.trim() && selStyles.length === 0) { if (addToast) addToast('Add a prompt or select a style first', 'error'); return; }
    setGenerating(true); setGenPct(0); setGenStep(0);
    var steps = GEN_STEPS.length;
    var i = 0;
    function tick() {
      i++;
      setGenPct(Math.floor((i / steps) * 100));
      setGenStep(i < steps ? i : steps - 1);
      if (i >= steps) {
        var gradIdx = Math.floor(Math.random() * COVER_GRADIENTS.length);
        var emojiIdx = Math.floor(Math.random() * COVER_EMOJIS.length);
        var durMap = { '30s': '0:30', '1min': '1:00', '2min': '2:' + (String(10 + Math.floor(Math.random() * 50))), 'full': (3 + Math.floor(Math.random() * 2)) + ':' + (String(10 + Math.floor(Math.random() * 50))) };
        var newTrack = {
          id: 'gen-' + Date.now(),
          title: titleInput.trim() || ((selStyles[0] || 'Custom') + ' Track'),
          style: selStyles.join(', ') || styleInput || 'Custom',
          mood:  selMoods.join(', ') || '',
          emoji: COVER_EMOJIS[emojiIdx],
          grad:  COVER_GRADIENTS[gradIdx],
          dur:   durMap[duration] || '2:30',
          ts:    Date.now(),
          instrumental: instrumental,
        };
        setMyTracks(function(mt) { return [newTrack].concat(mt).slice(0, 50); });
        setGenerating(false); setGenPct(0); setGenStep(0);
        setTab('library'); setLibTab('mine');
        if (addToast) addToast('✨ "' + newTrack.title + '" generated!', 'success');
        return;
      }
      setTimeout(tick, 850);
    }
    setTimeout(tick, 850);
  }

  function generateLyrics() {
    if (!lyricPrompt.trim()) { if (addToast) addToast('Describe the song topic first', 'error'); return; }
    setGenLyricsing(true);
    setTimeout(function() {
      var topic = lyricPrompt.trim();
      var generated =
        '[Verse 1]\nI been working on my craft since way back in the day\n' +
        'People tried to tell me that I had to change my ways\n' +
        topic.split(' ').slice(0, 3).join(' ') + ' — that\'s what drives me through the night\n' +
        'Every single sunrise is a reason why I fight\n\n' +
        '[Pre-Chorus]\nYeah I know where I\'m headed\nAnd I can\'t be stopped\n\n' +
        '[Chorus]\nThis is for the dreamers who kept going through the pain\n' +
        'This is for the ones who had to stand out in the rain\n' +
        'We gon\' rise up higher, we ain\'t going back\n' +
        topic.charAt(0).toUpperCase() + topic.slice(1) + ' on my mind and I can\'t look back\n\n' +
        '[Verse 2]\nEvery battle scar became a lesson that I learned\n' +
        'Every bridge I burned became a bridge that I returned\n' +
        'Built my empire brick by brick with calloused hands\n' +
        'Now they all want in but they don\'t understand\n\n' +
        '[Bridge]\nThrough the storm I stood tall\nNever let the pressure make me fall\n' +
        'This right here is everything\n' +
        topic.charAt(0).toUpperCase() + topic.slice(1) + ' gave me wings\n\n' +
        '[Outro]\nWe made it, we made it\nStill chasing, still chasing';
      setLyricsEdited(generated);
      setGenLyricsing(false);
    }, 2600);
  }

  function toggleTag(arr, setArr, val) {
    setArr(function(prev) {
      var idx = prev.indexOf(val);
      if (idx >= 0) return prev.filter(function(x) { return x !== val; });
      return prev.concat([val]);
    });
  }

  function shareTrack(track) {
    if (!socket || !roomId) { if (addToast) addToast('Join a room to share', 'error'); return; }
    socket.emit('share-music', { roomId: roomId, title: track.title, style: track.style, emoji: track.emoji });
    if (addToast) addToast('🎵 "' + track.title + '" shared to stream!', 'success');
  }

  function tapTempo() {
    var now = Date.now();
    var taps = tapRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 3000) taps = [];
    taps = taps.concat([now]);
    if (taps.length > 8) taps = taps.slice(taps.length - 8);
    tapRef.current = taps;
    if (taps.length >= 2) {
      var intervals = [];
      var ii;
      for (ii = 1; ii < taps.length; ii++) intervals.push(taps[ii] - taps[ii - 1]);
      var sum = 0;
      for (ii = 0; ii < intervals.length; ii++) sum += intervals[ii];
      var calc = Math.floor(60000 / (sum / intervals.length));
      if (calc < 60) calc = 60;
      if (calc > 220) calc = 220;
      setBpm(calc); setBeatPreset(null);
    }
  }

  function beatToGenerate() {
    var style = beatPreset || 'Custom';
    setPrompt(style + ' beat at ' + bpm + ' BPM');
    setTab('generate');
    if (addToast) addToast('Beat settings sent to Generate!', 'success');
  }

  // ─────────────────────── RENDER ──────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, fontFamily: "'Barlow Condensed',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Live waveform banner */}
      {isLive && waveform.length > 0 && (
        <div style={{ background: 'rgba(7,5,10,.7)', borderBottom: '1px solid rgba(0,222,192,.15)', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 2, flexShrink: 0 }}>● LIVE</div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26, flex: 1, overflow: 'hidden' }}>
            {waveform.map(function(h, wi) {
              return <div key={wi} style={{ flex: 1, height: Math.floor(h * .26) + 'px', background: 'rgba(0,222,192,' + (0.4 + h * .005) + ')', borderRadius: 2, transition: 'height 120ms', minWidth: 0 }} />;
            })}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', background: SURF, borderBottom: '1px solid ' + BORD, flexShrink: 0 }}>
        {[
          { id: 'generate', label: '✨ Generate' },
          { id: 'beat',     label: '🥁 Beat' },
          { id: 'library',  label: '🎵 Library' },
          { id: 'lyrics',   label: '📝 Lyrics' },
        ].map(function(t) {
          var active = tab === t.id;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }}
              style={{
                flex: 1, background: 'none', border: 'none',
                borderBottom: '2px solid ' + (active ? GOLD : 'transparent'),
                padding: '10px 4px', cursor: 'pointer',
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11,
                color: active ? GOLD : MUTED, letterSpacing: .5,
                transition: 'color .15s, border-color .15s',
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ════ GENERATE ════ */}
        {tab === 'generate' && (
          <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>AI Music Studio</div>
              <button onClick={function() { setCustomMode(function(v) { return !v; }); }}
                style={{ background: customMode ? 'rgba(201,168,76,.15)' : CARD2, border: '1px solid ' + (customMode ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 999, padding: '5px 12px', color: customMode ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer', letterSpacing: .5 }}>
                {customMode ? '✓ CUSTOM' : 'CUSTOM MODE'}
              </button>
            </div>

            {/* Title */}
            <input value={titleInput} onChange={function(e) { setTitleInput(e.target.value); }} placeholder="Song title (optional)..."
              style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, outline: 'none' }} />

            {!customMode ? (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>DESCRIBE YOUR SONG</div>
                <textarea value={prompt} onChange={function(e) { setPrompt(e.target.value); }}
                  placeholder="An emotional hip-hop track about perseverance, cinematic strings, deep male voice, 808s..."
                  rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '12px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>LYRICS</div>
                  <textarea value={lyricsInput} onChange={function(e) { setLyricsInput(e.target.value); }}
                    placeholder={'[Verse 1]\nWrite your lyrics here...\n\n[Chorus]\n...'}
                    rows={7}
                    style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '12px 14px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none', resize: 'none', lineHeight: 1.7 }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>STYLE DESCRIPTION</div>
                  <input value={styleInput} onChange={function(e) { setStyleInput(e.target.value); }}
                    placeholder="dark trap, 808s, melodic hook, autotune..."
                    style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }} />
                </div>
              </div>
            )}

            {/* Style tags */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>GENRE / STYLE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STYLE_TAGS.map(function(s) {
                  var active = selStyles.indexOf(s) >= 0;
                  return (
                    <button key={s} onClick={function() { toggleTag(selStyles, setSelStyles, s); }}
                      style={{ padding: '5px 11px', background: active ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : DIM), borderRadius: 999, color: active ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 10, cursor: 'pointer', transition: 'all .15s' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood tags */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>MOOD</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MOOD_TAGS.map(function(m) {
                  var active = selMoods.indexOf(m) >= 0;
                  return (
                    <button key={m} onClick={function() { toggleTag(selMoods, setSelMoods, m); }}
                      style={{ padding: '5px 11px', background: active ? 'rgba(0,222,192,.15)' : CARD2, border: '1px solid ' + (active ? 'rgba(0,222,192,.45)' : DIM), borderRadius: 999, color: active ? TEAL : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 10, cursor: 'pointer', transition: 'all .15s' }}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration + Instrumental row */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>DURATION</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {DURATIONS.map(function(d) {
                    var active = duration === d.id;
                    return (
                      <button key={d.id} onClick={function() { setDuration(d.id); }}
                        style={{ flex: 1, padding: '7px 3px', background: active ? 'rgba(128,0,32,.3)' : CARD2, border: '1px solid ' + (active ? 'rgba(128,0,32,.6)' : DIM), borderRadius: 8, color: active ? TEXT : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={function() { setInstr(function(v) { return !v; }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: instrumental ? 'rgba(0,222,192,.12)' : CARD2, border: '1px solid ' + (instrumental ? 'rgba(0,222,192,.4)' : DIM), borderRadius: 10, padding: '8px 11px', cursor: 'pointer', flexShrink: 0, marginBottom: 0 }}>
                <div style={{ width: 18, height: 10, borderRadius: 999, background: instrumental ? TEAL : DIM, position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 1, left: instrumental ? 9 : 1, width: 8, height: 8, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: instrumental ? TEAL : MUTED, letterSpacing: .5, whiteSpace: 'nowrap' }}>INSTRUMENTAL</span>
              </button>
            </div>

            {/* Generate button / progress */}
            {generating ? (
              <div style={{ background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, border: '2px solid ' + GOLD, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT }}>Generating your track…</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{GEN_STEPS[genStep]}</div>
                  </div>
                </div>
                <div style={{ height: 5, background: DIM, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,' + BURG + ',' + GOLD + ')', borderRadius: 999, width: genPct + '%', transition: 'width .4s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selStyles.concat(selMoods).map(function(tag) {
                    return <span key={tag} style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, background: 'rgba(201,168,76,.1)', borderRadius: 4, padding: '2px 7px' }}>{tag}</span>;
                  })}
                </div>
              </div>
            ) : (
              <button onClick={generateSong}
                style={{
                  width: '100%', background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 14,
                  padding: '16px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 3,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  animation: 'genPulse 2.2s ease infinite', boxShadow: '0 4px 24px rgba(128,0,32,.4)',
                }}>
                <span>✨</span> GENERATE
              </button>
            )}
          </div>
        )}

        {/* ════ BEAT MAKER ════ */}
        {tab === 'beat' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEAL, letterSpacing: 2 }}>Beat Maker</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD }}>{bpm} BPM</div>
            </div>

            {/* BPM row */}
            <div style={{ background: CARD, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {BPM_PRESETS.map(function(p) {
                  var active = beatPreset === p.label;
                  return (
                    <button key={p.label} onClick={function() { setBpm(p.bpm); setBeatPreset(p.label); }}
                      style={{ padding: '5px 11px', background: active ? 'rgba(0,222,192,.18)' : CARD2, border: '1px solid ' + (active ? 'rgba(0,222,192,.5)' : DIM), borderRadius: 999, color: active ? TEAL : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                      {p.label} {p.bpm}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="range" min={60} max={200} value={bpm}
                  onChange={function(e) { setBpm(Number(e.target.value)); setBeatPreset(null); }}
                  style={{ flex: 1, accentColor: TEAL }} />
                <button onClick={tapTempo} style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '7px 13px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>TAP</button>
                <button onClick={function() { setBeatPlaying(function(p2) { return !p2; }); }}
                  style={{ background: beatPlaying ? 'rgba(255,26,60,.18)' : 'linear-gradient(135deg,' + BURG + ',#C01838)', border: beatPlaying ? '1px solid rgba(255,26,60,.4)' : 'none', borderRadius: 8, padding: '7px 16px', color: beatPlaying ? RED : GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                  {beatPlaying ? '■ STOP' : '▶ PLAY'}
                </button>
              </div>
            </div>

            {/* Step sequencer */}
            <div style={{ background: CARD, borderRadius: 12, padding: '12px 8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {PADS.map(function(pad) {
                var isFlash = !!padFlash[pad.id];
                return (
                  <div key={pad.id} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 58, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: isFlash ? pad.color : MUTED, flexShrink: 0, letterSpacing: .2, transition: 'color .05s' }}>{pad.label}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array(GRID_STEPS).fill(null).map(function(_, si) {
                        var isOn  = grid[pad.id] && grid[pad.id][si];
                        var isCur = si === beatStep;
                        var isGrp = si % 4 === 0;
                        return (
                          <div key={si}
                            onClick={function() {
                              setGrid(function(g) {
                                var row = g[pad.id].slice(); row[si] = !row[si];
                                return Object.assign({}, g, { [pad.id]: row });
                              });
                            }}
                            style={{
                              width: 16, height: 16, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                              background: isOn ? pad.color : (isCur ? 'rgba(255,255,255,.18)' : (isGrp ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.03)')),
                              border: '1px solid ' + (isOn ? pad.color + '88' : (isCur ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.05)')),
                              boxShadow: isOn && isCur ? ('0 0 6px ' + pad.color) : 'none',
                              transition: 'background .05s',
                            }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={beatToGenerate}
              style={{ width: '100%', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>
              SEND BEAT TO GENERATE ✨
            </button>
          </div>
        )}

        {/* ════ LIBRARY ════ */}
        {tab === 'library' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', background: CARD2, borderRadius: 10, padding: 4 }}>
              {[{ id: 'mine', label: 'My Songs' }, { id: 'community', label: 'Community' }].map(function(lt) {
                var active = libTab === lt.id;
                return (
                  <button key={lt.id} onClick={function() { setLibTab(lt.id); }}
                    style={{ flex: 1, background: active ? CARD : 'transparent', border: 'none', borderRadius: 8, padding: '8px', color: active ? TEXT : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .15s' }}>
                    {lt.label}
                  </button>
                );
              })}
            </div>

            {libTab === 'mine' && (
              myTracks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '44px 20px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 42 }}>🎵</span>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEXT }}>No tracks yet</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>Generate your first AI song above</div>
                  <button onClick={function() { setTab('generate'); }} style={{ background: BURG, border: 'none', borderRadius: 10, padding: '10px 22px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>✨ GENERATE NOW</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {myTracks.map(function(t) {
                    return (
                      <TrackCard key={t.id} track={t}
                        playing={playingId === t.id}
                        onPlay={function() { setPlayingId(function(prev) { return prev === t.id ? null : t.id; }); }}
                        onDel={function() { setMyTracks(function(mt) { return mt.filter(function(x) { return x.id !== t.id; }); }); setPlayingId(null); if (addToast) addToast('Track removed', 'info'); }}
                        onShare={function() { shareTrack(t); }}
                      />
                    );
                  })}
                </div>
              )
            )}

            {libTab === 'community' && (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 10 }}>🔥 TRENDING IN THE COMMUNITY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {COMMUNITY.map(function(t) {
                    return (
                      <TrackCard key={t.id} track={t}
                        playing={playingId === t.id}
                        onPlay={function() { setPlayingId(function(prev) { return prev === t.id ? null : t.id; }); }}
                        onShare={null}
                        onDel={null}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ LYRICS ════ */}
        {tab === 'lyrics' && (
          <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>AI Lyrics Generator</div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>WHAT SHOULD THE SONG BE ABOUT?</div>
              <textarea value={lyricPrompt} onChange={function(e) { setLyricPrompt(e.target.value); }}
                placeholder="e.g. overcoming hard times, loyalty, coming up from nothing..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '12px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>STYLE</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['Hip-Hop','R&B','Pop','Soul','Gospel','Trap'].map(function(s) {
                  var active = lyricStyle === s;
                  return (
                    <button key={s} onClick={function() { setLyricStyle(s); }}
                      style={{ padding: '5px 11px', background: active ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : DIM), borderRadius: 999, color: active ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 10, cursor: 'pointer' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={generateLyrics} disabled={genLyricsing}
              style={{ background: genLyricsing ? CARD2 : 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 12, padding: '13px', color: genLyricsing ? MUTED : GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: genLyricsing ? 'default' : 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {genLyricsing
                ? <span><span style={{ display: 'inline-block', animation: 'spin .8s linear infinite', marginRight: 8 }}>⟳</span>Writing lyrics…</span>
                : '📝 GENERATE LYRICS'
              }
            </button>

            {lyricsEdited ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1 }}>EDIT YOUR LYRICS</div>
                <textarea value={lyricsEdited} onChange={function(e) { setLyricsEdited(e.target.value); }} rows={18}
                  style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '12px 14px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none', resize: 'none', lineHeight: 1.7 }} />
                <button onClick={function() { setTab('generate'); setCustomMode(true); setLyricsInput(lyricsEdited); if (addToast) addToast('Lyrics sent to Generate!', 'success'); }}
                  style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '12px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>
                  USE IN GENERATE ✨
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
