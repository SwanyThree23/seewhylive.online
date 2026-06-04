import React, { useState, useRef, useEffect } from 'react';

// ─── Palette ───────────────────────────────────────────────────────────────
var BG    = '#0E0C09';
var SURF  = '#0E0C09';
var CARD  = '#1A1510';
var CARD2 = '#241C12';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var TEAL  = '#C9A84C';
var RED   = '#FF1A3C';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var DIM   = '#2E2318';
var BORD  = 'rgba(255,255,255,.06)';
var BLUE  = '#C9A84C';
var PURP  = '#C9A84C';

// ─── Animations ────────────────────────────────────────────────────────────
var ANIM = [
  '@keyframes trackIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes genPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.4)}70%{box-shadow:0 0 0 10px rgba(201,168,76,0)}}',
  '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
  '@keyframes speakBar{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}',
  '@keyframes vocalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}',
  '@keyframes creatorSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes copyBlink{0%,100%{opacity:1}50%{opacity:.4}}',
].join('\n');

// ─── Genre / mood constants ─────────────────────────────────────────────────
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
  'linear-gradient(135deg,#3D1A00,#C9A84C)',
  'linear-gradient(135deg,#1A0F00,#D4854A)',
  'linear-gradient(135deg,#2A1200,#FF6B35)',
  'linear-gradient(135deg,#2d1b00,#C9A84C)',
  'linear-gradient(135deg,#1a0000,#800020)',
  'linear-gradient(135deg,#2d0a0a,#FF1A3C)',
  'linear-gradient(135deg,#1a1000,#C9A84C)',
  'linear-gradient(135deg,#1a1000,#FF6B35)',
  'linear-gradient(135deg,#1a0a00,#800020)',
  'linear-gradient(135deg,#1a0a00,#D4854A)',
  'linear-gradient(135deg,#1a0000,#FF1A3C)',
];
var COVER_EMOJIS = ['🎵','🎸','🎹','🎺','🎻','🥁','🎙','🎤','🎼','🎧','💿','🔊','🎶','👑','🔥'];

// ─── Beat Maker ─────────────────────────────────────────────────────────────
var PADS = [
  { id: 'kick',  label: '🥁 Kick',  color: RED       },
  { id: 'snare', label: '🎵 Snare', color: GOLD      },
  { id: 'clap',  label: '👏 Clap',  color: TEAL      },
  { id: 'hihat', label: '🔔 Hi-Hat',color: BLUE      },
  { id: 'bass',  label: '🎸 Bass',  color: PURP      },
  { id: 'chord', label: '🎹 Chord', color: '#FF6B35' },
  { id: 'lead',  label: '🎺 Lead',  color: '#C9A84C' },
  { id: 'fx',    label: '✨ FX',    color: '#FF1493' },
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

// ─── Vocal constants ─────────────────────────────────────────────────────────
var VOCAL_STYLES = [
  { id: 'melodic-trap',  label: 'Melodic Trap',  desc: 'Auto-tuned hooks, emo ad-libs',     color: BURG,         emoji: '🎯' },
  { id: 'rnb-silk',      label: 'R&B Silk',       desc: 'Silky runs, whisper falsettos',     color: PURP,         emoji: '✨' },
  { id: 'lyrical-rap',   label: 'Lyrical Rap',    desc: 'Complex flows, internal rhymes',    color: GOLD,         emoji: '🎤' },
  { id: 'soul-church',   label: 'Soul / Church',  desc: 'Full range, powerful gospel belts', color: '#FF6B35',    emoji: '🙏' },
  { id: 'afro-flow',     label: 'Afro Flow',      desc: 'Percussive cadence, diaspora vibe', color: '#D4854A',    emoji: '🌍' },
  { id: 'pop-radio',     label: 'Pop Radio',      desc: 'Catchy hooks, clean delivery',      color: BLUE,         emoji: '📻' },
  { id: 'drill-cadence', label: 'Drill Cadence',  desc: 'Menacing flow, UK/Chicago style',   color: RED,          emoji: '🔱' },
  { id: 'lo-fi-chill',   label: 'Lo-Fi Chill',    desc: 'Breathy, intimate, bedroom pop',    color: TEAL,         emoji: '🎧' },
];

var KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var PITCHES = [
  { id: 'low',  label: 'LOW',  desc: 'Bass / Baritone',    color: BURG },
  { id: 'mid',  label: 'MID',  desc: 'Tenor / Alto',       color: GOLD },
  { id: 'high', label: 'HIGH', desc: 'Soprano / Falsetto', color: TEAL },
  { id: 'flex', label: 'FLEX', desc: 'Full Range',          color: BLUE },
];
var VOCAL_EFFECTS = ['Auto-Tune','Reverb','Echo','Harmony','Vibrato','Compression','Distortion','Pitch Shift'];

// ─── Creator tool constants ──────────────────────────────────────────────────
var CREATOR_TOOLS = [
  { id: 'bio',      label: 'Artist Bio',       emoji: '🎤', color: GOLD,
    placeholder: 'Your name, genre, 3 words that describe your sound, notable achievements or collabs...',
    prompt: 'Write a compelling 3-paragraph artist bio. Include a hook opening, their artistic journey and style, and a closing call-to-action for fans and industry. Make it feel real, vivid, and press-ready.' },
  { id: 'caption',  label: 'Post Caption',      emoji: '📱', color: TEAL,
    placeholder: 'Describe what you\'re posting (new song, clip, milestone). Platform: IG / TikTok / Twitter. Vibe: hype / chill / personal...',
    prompt: 'Write a scroll-stopping social media caption. Keep it authentic, add 2-3 relevant emojis, end with a strong call-to-action. No generic filler. Match the platform energy.' },
  { id: 'hashtags', label: 'Hashtag Pack',      emoji: '#️⃣', color: PURP,
    placeholder: 'Your genre, mood, topics in the song, target audience, any relevant cultural references...',
    prompt: 'Generate a hashtag pack with 30 hashtags across three tiers: 8 mega (1M+ posts), 12 mid (100K–1M), 10 niche (under 100K). Format each tier on its own line. Focus on discoverability and relevance.' },
  { id: 'press',    label: 'Press Release',     emoji: '📰', color: '#FF6B35',
    placeholder: 'Event or release name, date, venue or platform, key highlights, artist quote, contact info...',
    prompt: 'Write a professional press release. Include: headline, dateline, lead paragraph with the who/what/when/where/why, artist quote, boilerplate About section, and media contact. Use AP style.' },
  { id: 'epk',      label: 'EPK Snippet',       emoji: '📋', color: BLUE,
    placeholder: 'Artist name, genre, key stats/streams, performance highlights, current project, what makes you unique...',
    prompt: 'Write a punchy Electronic Press Kit (EPK) paragraph for booking agents and festival promoters. Lead with the hook, include proof points and accolades, close with availability/contact.' },
  { id: 'drop',     label: 'Drop Announcement', emoji: '🚀', color: RED,
    placeholder: 'Song/project title, release date, streaming platforms, features/collabs, what\'s the story behind it...',
    prompt: 'Write a hype drop announcement for social media. Build anticipation, tease what makes it special, create FOMO with a countdown element, and drive to presave/stream. Keep energy high.' },
];

// ─── Community tracks ────────────────────────────────────────────────────────
var COMMUNITY = [
  { id: 'c1', title: 'Late Night Drive',    style: 'Lo-Fi',     mood: 'Chill',      emoji: '🎧', grad: COVER_GRADIENTS[1], dur: '2:34', plays: 1847 },
  { id: 'c2', title: 'Trap God Season',     style: 'Trap',      mood: 'Hype',       emoji: '👑', grad: COVER_GRADIENTS[0], dur: '3:12', plays: 3290 },
  { id: 'c3', title: 'Soul Sunday Morning', style: 'Soul',      mood: 'Uplifting',  emoji: '🎵', grad: COVER_GRADIENTS[2], dur: '4:01', plays: 922  },
  { id: 'c4', title: 'Drill Season Vol. 3', style: 'Drill',     mood: 'Aggressive', emoji: '🔊', grad: COVER_GRADIENTS[6], dur: '2:47', plays: 5614 },
  { id: 'c5', title: 'Golden Hour Vibes',   style: 'R&B',       mood: 'Romantic',   emoji: '💿', grad: COVER_GRADIENTS[4], dur: '3:55', plays: 2103 },
  { id: 'c6', title: 'Afrobeats Summer',    style: 'Afrobeats', mood: 'Hype',       emoji: '🎶', grad: COVER_GRADIENTS[7], dur: '3:28', plays: 7831 },
];

// ─── WaveformBars ─────────────────────────────────────────────────────────────
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
  var t           = props.track;
  var playing     = props.playing;
  var onPlay      = props.onPlay;
  var onDel       = props.onDel;
  var onShare     = props.onShare;
  var onQuickDrop = props.onQuickDrop;
  var dropActive  = props.dropActive;

  return (
    <div style={{
      background: CARD, border: '1px solid ' + (playing ? GOLD + '55' : dropActive ? RED + '44' : BORD),
      borderRadius: 14, overflow: 'hidden', animation: 'trackIn .3s ease',
      boxShadow: playing ? '0 0 20px rgba(201,168,76,.18)' : dropActive ? '0 0 14px rgba(255,26,60,.15)' : 'none',
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
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, background: 'rgba(201,168,76,.1)', borderRadius: 4, padding: '1px 5px' }}>{t.style}</span>
          {t.mood && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, background: 'rgba(255,255,255,.06)', borderRadius: 4, padding: '1px 5px' }}>{t.mood}</span>}
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginLeft: 'auto' }}>{t.dur || '--:--'}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onShare && (
            <button onClick={onShare} style={{ flex: 1, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.22)', borderRadius: 6, padding: '5px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>📡 STREAM</button>
          )}
          {onQuickDrop && (
            <button onClick={onQuickDrop} style={{ flex: 1, background: dropActive ? 'rgba(255,26,60,.22)' : 'rgba(255,26,60,.08)', border: '1px solid ' + (dropActive ? 'rgba(255,26,60,.5)' : 'rgba(255,26,60,.2)'), borderRadius: 6, padding: '5px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>🚀 DROP</button>
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

  var [tab, setTab] = useState('generate');

  // ── Generate ──
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

  // ── Beat Maker ──
  var [grid,           setGrid]           = useState(makeInitGrid);
  var [beatPlaying,    setBeatPlaying]    = useState(false);
  var [beatStep,       setBeatStep]       = useState(-1);
  var [bpm,            setBpm]            = useState(120);
  var [beatPreset,     setBeatPreset]     = useState(null);
  var [padFlash,       setPadFlash]       = useState({});
  var [padVolumes,     setPadVolumes]     = useState(function() {
    var v = {};
    PADS.forEach(function(p) { v[p.id] = 80; });
    return v;
  });
  var [showMix,        setShowMix]        = useState(false);
  var [aiBeating,      setAiBeating]      = useState(false);
  var [chordKey,       setChordKey]       = useState('C');
  var [chordStyle,     setChordStyle]     = useState('Hip-Hop');
  var [chordResult,    setChordResult]    = useState('');
  var [chordLoading,   setChordLoading]   = useState(false);
  var [showChords,     setShowChords]     = useState(false);
  var [savedPresets,   setSavedPresets]   = useState(function() {
    try { var s = localStorage.getItem('sw_beat_presets'); if (s) return JSON.parse(s); } catch(e) {}
    return [];
  });
  var [presetName,     setPresetName]     = useState('');
  var [showSavePreset, setShowSavePreset] = useState(false);
  var beatStepRef = useRef(-1);
  var beatPlayRef = useRef(null);
  var gridRef     = useRef(grid);
  var tapRef      = useRef([]);

  // ── Library ──
  var [libTab,       setLibTab]      = useState('mine');
  var [quickDropId,  setQuickDropId] = useState(null);
  var [quickDropLoading, setQuickDropLoading] = useState(false);
  var [quickDropContent, setQuickDropContent] = useState(null);
  var [copiedPlatform,   setCopiedPlatform]   = useState(null);

  // ── Lyrics ──
  var [lyricPrompt,   setLyricPrompt]  = useState('');
  var [lyricStyle,    setLyricStyle]   = useState('Hip-Hop');
  var [lyricHook,     setLyricHook]    = useState('');
  var [lyricsEdited,  setLyricsEdited] = useState('');
  var [genLyricsing,  setGenLyricsing] = useState(false);

  // ── Vocal ──
  var [vocalStyle,    setVocalStyle]   = useState(null);
  var [vocalKey,      setVocalKey]     = useState('C');
  var [vocalPitch,    setVocalPitch]   = useState('mid');
  var [vocalFX,       setVocalFX]      = useState([]);
  var [vocalNotes,    setVocalNotes]   = useState('');

  // ── Creator ──
  var [creatorTool,    setCreatorTool]    = useState('bio');
  var [creatorInput,   setCreatorInput]   = useState('');
  var [creatorOutput,  setCreatorOutput]  = useState('');
  var [creatorLoading, setCreatorLoading] = useState(false);
  var [copiedCreator,  setCopiedCreator]  = useState(false);

  // ── Live waveform ──
  var [waveform, setWaveform] = useState([]);

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

  // ── AI helper ────────────────────────────────────────────────────────────
  function callAI(systemPrompt, userMsg, onSuccess, onError) {
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt, message: userMsg }),
    }).then(function(r) {
      if (!r.ok) throw new Error('AI error ' + r.status);
      return r.json();
    }).then(function(d) {
      onSuccess(d.text || d.response || '');
    }).catch(function(e) {
      if (onError) onError(e);
    });
  }

  // ── Generate ─────────────────────────────────────────────────────────────
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
        var gradIdx  = Math.floor(Math.random() * COVER_GRADIENTS.length);
        var emojiIdx = Math.floor(Math.random() * COVER_EMOJIS.length);
        var durMap   = { '30s': '0:30', '1min': '1:00', '2min': '2:' + String(10 + Math.floor(Math.random() * 50)), 'full': (3 + Math.floor(Math.random() * 2)) + ':' + String(10 + Math.floor(Math.random() * 50)) };
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

  // ── Lyrics (real AI) ─────────────────────────────────────────────────────
  function generateLyrics() {
    if (!lyricPrompt.trim()) { if (addToast) addToast('Describe the song topic first', 'error'); return; }
    setGenLyricsing(true);
    var system = 'You are a professional songwriter and lyricist specializing in authentic, emotionally resonant music. Write compelling song lyrics that feel real and personal, not generic.';
    var userMsg = 'Write complete song lyrics in ' + lyricStyle + ' style.' +
      (lyricHook.trim() ? ' Core hook/theme: "' + lyricHook.trim() + '".' : '') +
      ' Topic: ' + lyricPrompt.trim() + '.' +
      ' Include: [Intro] (optional), [Verse 1], [Pre-Chorus] (if applicable), [Chorus], [Verse 2], [Bridge], [Outro].' +
      ' Make the lyrics authentic, culturally relevant, and emotionally compelling. Use vivid imagery and specific details rather than clichés.';
    callAI(system, userMsg, function(text) {
      setLyricsEdited(text);
      setGenLyricsing(false);
    }, function() {
      // Fallback template on error
      var topic = lyricPrompt.trim();
      var fallback =
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
      setLyricsEdited(fallback);
      setGenLyricsing(false);
      if (addToast) addToast('Generated with template (AI unavailable)', 'info');
    });
  }

  // ── Vocal → Generate ────────────────────────────────────────────────────
  function applyVocalToGenerate() {
    var vs = VOCAL_STYLES.find(function(v) { return v.id === vocalStyle; });
    var styleDesc = vs ? vs.label : '';
    var fxStr = vocalFX.length > 0 ? ', ' + vocalFX.join(', ') : '';
    var built = [
      styleDesc && (styleDesc + ' vocal style'),
      'Key of ' + vocalKey,
      PITCHES.find(function(p) { return p.id === vocalPitch; }) ? PITCHES.find(function(p) { return p.id === vocalPitch; }).desc + ' range' : '',
      vocalFX.length > 0 ? 'with ' + vocalFX.join(' + ') : '',
      vocalNotes.trim(),
    ].filter(Boolean).join(', ');
    setPrompt(function(prev) { return prev ? prev + '\n\nVocal settings: ' + built : 'Vocal settings: ' + built; });
    setTab('generate');
    if (addToast) addToast('Vocal settings applied to Generate!', 'success');
  }

  // ── Creator AI ──────────────────────────────────────────────────────────
  function generateCreatorContent() {
    if (!creatorInput.trim()) { if (addToast) addToast('Fill in the details first', 'error'); return; }
    var tool = CREATOR_TOOLS.find(function(t) { return t.id === creatorTool; });
    if (!tool) return;
    setCreatorLoading(true);
    setCreatorOutput('');
    callAI(
      'You are an expert music industry publicist, social media strategist, and copywriter. You write compelling content for artists and content creators. Your writing is authentic, punchy, and platform-aware.',
      tool.prompt + '\n\nArtist/project details: ' + creatorInput.trim(),
      function(text) {
        setCreatorOutput(text);
        setCreatorLoading(false);
      },
      function() {
        setCreatorOutput('Unable to generate content right now. Please try again.');
        setCreatorLoading(false);
        if (addToast) addToast('AI unavailable — try again', 'error');
      }
    );
  }

  function copyCreatorOutput() {
    if (!creatorOutput) return;
    try {
      navigator.clipboard.writeText(creatorOutput).then(function() {
        setCopiedCreator(true);
        setTimeout(function() { setCopiedCreator(false); }, 2000);
        if (addToast) addToast('Copied to clipboard!', 'success');
      });
    } catch(e) {
      if (addToast) addToast('Copy failed', 'error');
    }
  }

  // ── Quick Drop ──────────────────────────────────────────────────────────
  function openQuickDrop(track) {
    if (quickDropId === track.id) { setQuickDropId(null); setQuickDropContent(null); return; }
    setQuickDropId(track.id);
    setQuickDropContent(null);
    setQuickDropLoading(true);
    var system = 'You are a music marketing expert who writes platform-native social media content for independent artists.';
    var userMsg = 'Write 3 separate post captions for this track: "' + track.title + '" — ' + track.style + (track.mood ? ', ' + track.mood : '') + ' style.' +
      ' Format as:\n\nINSTAGRAM:\n[caption]\n\nTIKTOK:\n[caption]\n\nTWITTER/X:\n[caption]\n\n' +
      'Each should be distinct, platform-appropriate, include relevant emojis, and drive engagement. Max 280 chars for Twitter. IG can be longer with hashtags.';
    callAI(system, userMsg, function(text) {
      var ig = '';
      var tt = '';
      var tw = '';
      var igMatch = text.match(/INSTAGRAM[:\s]*\n([\s\S]*?)(?=\nTIKTOK|\nTWITTER|$)/i);
      var ttMatch = text.match(/TIKTOK[:\s]*\n([\s\S]*?)(?=\nTWITTER|TWITTER\/X|$)/i);
      var twMatch = text.match(/TWITTER[/\w]*[:\s]*\n([\s\S]*?)(?=$)/i);
      if (igMatch) ig = igMatch[1].trim();
      if (ttMatch) tt = ttMatch[1].trim();
      if (twMatch) tw = twMatch[1].trim();
      if (!ig && !tt && !tw) {
        var parts = text.split(/\n{2,}/);
        ig = parts[0] || text;
        tt = parts[1] || '';
        tw = parts[2] || '';
      }
      setQuickDropContent({ ig: ig, tt: tt, tw: tw });
      setQuickDropLoading(false);
    }, function() {
      setQuickDropContent({ ig: 'New track "' + track.title + '" is live! 🎵 #' + track.style.replace(/[^a-zA-Z]/g,'') + ' #NewMusic', tt: '🎵 "' + track.title + '" dropped! ' + track.style + ' vibes only 🔥 #music', tw: '"' + track.title + '" is out now — ' + track.style + ' 🎵' });
      setQuickDropLoading(false);
    });
  }

  function copyPlatformText(text, platform) {
    try {
      navigator.clipboard.writeText(text).then(function() {
        setCopiedPlatform(platform);
        setTimeout(function() { setCopiedPlatform(null); }, 2000);
        if (addToast) addToast('Copied ' + platform + ' caption!', 'success');
      });
    } catch(e) {
      if (addToast) addToast('Copy failed', 'error');
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
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

  function randomizeBeat() {
    var probMap = { kick: 0.25, snare: 0.2, clap: 0.15, hihat: 0.5, bass: 0.2, chord: 0.15, lead: 0.12, fx: 0.1 };
    var newGrid = {};
    PADS.forEach(function(p) {
      var prob = probMap[p.id] || 0.2;
      newGrid[p.id] = Array(GRID_STEPS).fill(null).map(function() { return Math.random() < prob; });
    });
    setGrid(newGrid);
    if (addToast) addToast('Pattern randomized!', 'info');
  }

  function clearBeat() {
    var newGrid = {};
    PADS.forEach(function(p) { newGrid[p.id] = Array(GRID_STEPS).fill(false); });
    setGrid(newGrid);
    if (addToast) addToast('Pattern cleared', 'info');
  }

  function savePreset() {
    var name = presetName.trim() || ('Pattern ' + (savedPresets.length + 1));
    var preset = { id: 'p' + Date.now(), name: name, grid: grid, bpm: bpm };
    setSavedPresets(function(prev) {
      var next = prev.concat([preset]).slice(-12);
      try { localStorage.setItem('sw_beat_presets', JSON.stringify(next)); } catch(e) {}
      return next;
    });
    setPresetName('');
    setShowSavePreset(false);
    if (addToast) addToast('Preset saved: ' + name, 'success');
  }

  function loadPreset(preset) {
    setGrid(preset.grid);
    setBpm(preset.bpm);
    setBeatPreset(preset.name);
    if (addToast) addToast('Loaded: ' + preset.name, 'success');
  }

  function deletePreset(id) {
    setSavedPresets(function(prev) {
      var next = prev.filter(function(p) { return p.id !== id; });
      try { localStorage.setItem('sw_beat_presets', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  function aiGenerateBeat() {
    setAiBeating(true);
    var style = beatPreset || selStyles[0] || 'Hip-Hop';
    var system = 'You are a professional music producer AI. When asked for a beat pattern, respond ONLY with valid compact JSON, no markdown, no explanation.';
    var userMsg = 'Generate a ' + style + ' beat pattern at ' + bpm + ' BPM with 16 steps. ' +
      'Respond ONLY with this exact JSON structure (1=active, 0=inactive):\n' +
      '{"kick":[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],"snare":[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],' +
      '"clap":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"hihat":[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],' +
      '"bass":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"chord":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],' +
      '"lead":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"fx":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}\n' +
      'Make the pattern authentic and musical for ' + style + '. Each array must have exactly 16 values.';
    callAI(system, userMsg, function(text) {
      var jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { setAiBeating(false); if (addToast) addToast('AI returned invalid pattern', 'error'); return; }
      try {
        var parsed = JSON.parse(jsonMatch[0]);
        var newGrid = {};
        PADS.forEach(function(p) {
          var arr = parsed[p.id];
          if (Array.isArray(arr) && arr.length === 16) {
            newGrid[p.id] = arr.map(function(v) { return Boolean(v); });
          } else {
            newGrid[p.id] = Array(GRID_STEPS).fill(false);
          }
        });
        setGrid(newGrid);
        setAiBeating(false);
        if (addToast) addToast('AI beat pattern generated!', 'success');
      } catch(e) {
        setAiBeating(false);
        if (addToast) addToast('Could not parse AI pattern', 'error');
      }
    }, function() {
      setAiBeating(false);
      if (addToast) addToast('AI unavailable — try again', 'error');
    });
  }

  function generateChords() {
    setChordLoading(true);
    setChordResult('');
    var system = 'You are a music theory expert. Respond with concise chord progressions only, no lengthy explanation.';
    var userMsg = 'Generate 3 different chord progressions in the key of ' + chordKey + ' for a ' + chordStyle + ' track. ' +
      'Format each as a numbered list with Roman numerals and chord names, like:\n' +
      '1. I - V - vi - IV (C - G - Am - F)\n' +
      '2. ...\n' +
      'Keep it brief and practical.';
    callAI(system, userMsg, function(text) {
      setChordResult(text.trim());
      setChordLoading(false);
    }, function() {
      setChordResult('AI unavailable. Try: I - IV - V - I / vi - IV - I - V / I - V - vi - iii');
      setChordLoading(false);
    });
  }

  var TABS = [
    { id: 'generate', label: '✨ Gen'     },
    { id: 'beat',     label: '🥁 Beat'    },
    { id: 'library',  label: '🎵 Library' },
    { id: 'lyrics',   label: '📝 Lyrics'  },
    { id: 'vocal',    label: '🎤 Vocal'   },
    { id: 'creator',  label: '🚀 Creator' },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, fontFamily: "'Barlow Condensed',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Live waveform banner */}
      {isLive && waveform.length > 0 && (
        <div style={{ background: 'rgba(14,12,9,.7)', borderBottom: '1px solid rgba(201,168,76,.15)', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 2, flexShrink: 0 }}>● LIVE</div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26, flex: 1, overflow: 'hidden' }}>
            {waveform.map(function(h, wi) {
              return <div key={wi} style={{ flex: 1, height: Math.floor(h * .26) + 'px', background: 'rgba(201,168,76,' + (0.4 + h * .005) + ')', borderRadius: 2, transition: 'height 120ms', minWidth: 0 }} />;
            })}
          </div>
        </div>
      )}

      {/* Tab bar — scrollable */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', background: SURF, borderBottom: '1px solid ' + BORD, flexShrink: 0 }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {TABS.map(function(t) {
            var active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: '2.5px solid ' + (active ? GOLD : 'transparent'),
                  padding: '10px 14px', cursor: 'pointer',
                  fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11,
                  color: active ? GOLD : MUTED, letterSpacing: .5,
                  transition: 'color .15s, border-color .15s', whiteSpace: 'nowrap',
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
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

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>MOOD</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MOOD_TAGS.map(function(m) {
                  var active = selMoods.indexOf(m) >= 0;
                  return (
                    <button key={m} onClick={function() { toggleTag(selMoods, setSelMoods, m); }}
                      style={{ padding: '5px 11px', background: active ? 'rgba(201,168,76,.15)' : CARD2, border: '1px solid ' + (active ? 'rgba(201,168,76,.45)' : DIM), borderRadius: 999, color: active ? TEAL : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 10, cursor: 'pointer', transition: 'all .15s' }}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

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
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: instrumental ? 'rgba(201,168,76,.12)' : CARD2, border: '1px solid ' + (instrumental ? 'rgba(201,168,76,.4)' : DIM), borderRadius: 10, padding: '8px 11px', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ width: 18, height: 10, borderRadius: 999, background: instrumental ? TEAL : DIM, position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 1, left: instrumental ? 9 : 1, width: 8, height: 8, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: instrumental ? TEAL : MUTED, letterSpacing: .5, whiteSpace: 'nowrap' }}>INSTRUMENTAL</span>
              </button>
            </div>

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
              </div>
            ) : (
              <button onClick={generateSong}
                style={{ width: '100%', background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 14, padding: '16px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, animation: 'genPulse 2.2s ease infinite', boxShadow: '0 4px 24px rgba(128,0,32,.4)' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD }}>{bpm} BPM</div>
              </div>
            </div>

            <div style={{ background: CARD, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {BPM_PRESETS.map(function(p) {
                  var active = beatPreset === p.label;
                  return (
                    <button key={p.label} onClick={function() { setBpm(p.bpm); setBeatPreset(p.label); }}
                      style={{ padding: '5px 11px', background: active ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (active ? 'rgba(201,168,76,.5)' : DIM), borderRadius: 999, color: active ? TEAL : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
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

            {/* ── AI + Pattern controls ── */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={aiGenerateBeat} disabled={aiBeating}
                style={{ flex: 2, background: aiBeating ? CARD2 : 'linear-gradient(135deg,rgba(128,0,32,.6),rgba(192,24,56,.4))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '9px', color: aiBeating ? MUTED : GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: aiBeating ? 'default' : 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {aiBeating
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>⟳</span> AI thinking…</span>
                  : '🤖 AI BEAT'}
              </button>
              <button onClick={randomizeBeat}
                style={{ flex: 1, background: 'rgba(212,133,74,.1)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 8, padding: '9px', color: AMBER, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                🎲 RANDOM
              </button>
              <button onClick={clearBeat}
                style={{ flex: 1, background: 'rgba(255,26,60,.07)', border: '1px solid rgba(255,26,60,.2)', borderRadius: 8, padding: '9px', color: RED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
                🗑 CLEAR
              </button>
            </div>

            {/* ── Mix Panel ── */}
            <div style={{ background: CARD, borderRadius: 10, padding: '10px 12px' }}>
              <button onClick={function() { setShowMix(function(v) { return !v; }); }}
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer', padding: 0, marginBottom: showMix ? 10 : 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: showMix ? GOLD : MUTED, letterSpacing: 1 }}>🎚 MIX PANEL</span>
                <span style={{ color: showMix ? GOLD : MUTED, fontSize: 10 }}>{showMix ? '▲' : '▼'}</span>
              </button>
              {showMix && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {PADS.map(function(pad) {
                    var vol = padVolumes[pad.id] !== undefined ? padVolumes[pad.id] : 80;
                    return (
                      <div key={pad.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 56, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: pad.color, flexShrink: 0 }}>{pad.label}</div>
                        <input type="range" min={0} max={100} value={vol}
                          onChange={function(e) {
                            var v = Number(e.target.value);
                            setPadVolumes(function(prev) { var n = Object.assign({}, prev); n[pad.id] = v; return n; });
                          }}
                          style={{ flex: 1, accentColor: pad.color, height: 4 }} />
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, width: 24, textAlign: 'right', flexShrink: 0 }}>{vol}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Chord Progressions ── */}
            <div style={{ background: CARD, borderRadius: 10, padding: '10px 12px' }}>
              <button onClick={function() { setShowChords(function(v) { return !v; }); }}
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer', padding: 0, marginBottom: showChords ? 10 : 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: showChords ? GOLD : MUTED, letterSpacing: 1 }}>🎹 CHORD PROGRESSIONS</span>
                <span style={{ color: showChords ? GOLD : MUTED, fontSize: 10 }}>{showChords ? '▲' : '▼'}</span>
              </button>
              {showChords && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>KEY</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {KEYS.slice(0, 6).concat(KEYS.slice(6)).map(function(k) {
                          return (
                            <button key={k} onClick={function() { setChordKey(k); }}
                              style={{ width: 28, height: 26, borderRadius: 5, background: chordKey === k ? BURG : CARD2, border: '1px solid ' + (chordKey === k ? 'rgba(128,0,32,.6)' : DIM), color: chordKey === k ? GOLD : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, cursor: 'pointer' }}>
                              {k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>STYLE</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {['Hip-Hop','R&B','Soul','Jazz','Trap','Pop'].map(function(s) {
                          return (
                            <button key={s} onClick={function() { setChordStyle(s); }}
                              style={{ padding: '3px 7px', background: chordStyle === s ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (chordStyle === s ? 'rgba(201,168,76,.45)' : DIM), borderRadius: 5, color: chordStyle === s ? GOLD : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9, cursor: 'pointer' }}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button onClick={generateChords} disabled={chordLoading}
                    style={{ background: chordLoading ? CARD2 : 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '8px', color: chordLoading ? MUTED : GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: chordLoading ? 'default' : 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {chordLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>⟳</span> Generating…</span> : '✨ GENERATE PROGRESSIONS'}
                  </button>
                  {chordResult ? (
                    <div style={{ background: CARD2, border: '1px solid rgba(201,168,76,.15)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEXT, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{chordResult}</div>
                      <button onClick={function() { navigator.clipboard && navigator.clipboard.writeText(chordResult).then(function() { if (addToast) addToast('Progressions copied!', 'success'); }); }}
                        style={{ marginTop: 6, background: 'rgba(255,255,255,.05)', border: '1px solid ' + BORD, borderRadius: 5, padding: '3px 10px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>
                        COPY
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── Save / Load Presets ── */}
            <div style={{ background: CARD, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 8 }}>💾 PATTERNS</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: savedPresets.length > 0 ? 8 : 0 }}>
                {showSavePreset ? (
                  <input value={presetName} onChange={function(e) { setPresetName(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') savePreset(); if (e.key === 'Escape') setShowSavePreset(false); }}
                    placeholder="Preset name..."
                    autoFocus
                    style={{ flex: 1, background: 'rgba(14,12,9,.8)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 7, padding: '6px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, outline: 'none' }} />
                ) : null}
                <button onClick={function() { if (showSavePreset) { savePreset(); } else { setShowSavePreset(true); } }}
                  style={{ flex: showSavePreset ? 0 : 1, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 7, padding: '7px 12px', color: GOLD, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {showSavePreset ? '✓ SAVE' : '+ SAVE'}
                </button>
                {showSavePreset && (
                  <button onClick={function() { setShowSavePreset(false); setPresetName(''); }}
                    style={{ background: 'none', border: '1px solid ' + DIM, borderRadius: 7, padding: '7px 10px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                    ✕
                  </button>
                )}
              </div>
              {savedPresets.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                  {savedPresets.map(function(p) {
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD2, borderRadius: 6, padding: '5px 8px' }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flexShrink: 0 }}>{p.bpm} bpm</span>
                        <button onClick={function() { loadPreset(p); }}
                          style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '2px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer' }}>LOAD</button>
                        <button onClick={function() { deletePreset(p.id); }}
                          style={{ background: 'none', border: 'none', color: RED, fontSize: 9, cursor: 'pointer', padding: '2px 4px' }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
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

            {/* Stats banner */}
            {myTracks.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'MY TRACKS', value: myTracks.length, color: GOLD },
                  { label: 'SHARED',    value: myTracks.filter(function(t) { return t.shared; }).length, color: TEAL },
                  { label: 'COMMUNITY', value: COMMUNITY.length, color: PURP },
                ].map(function(stat) {
                  return (
                    <div key={stat.label} style={{ flex: 1, background: CARD, border: '1px solid ' + BORD, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED, letterSpacing: .5, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {myTracks.map(function(t) {
                      return (
                        <TrackCard key={t.id} track={t}
                          playing={playingId === t.id}
                          dropActive={quickDropId === t.id}
                          onPlay={function() { setPlayingId(function(prev) { return prev === t.id ? null : t.id; }); }}
                          onDel={function() {
                            setMyTracks(function(mt) { return mt.filter(function(x) { return x.id !== t.id; }); });
                            setPlayingId(null);
                            if (quickDropId === t.id) { setQuickDropId(null); setQuickDropContent(null); }
                            if (addToast) addToast('Track removed', 'info');
                          }}
                          onShare={function() { shareTrack(t); }}
                          onQuickDrop={function() { openQuickDrop(t); }}
                        />
                      );
                    })}
                  </div>

                  {/* Quick Drop panel */}
                  {quickDropId && (
                    <div style={{ background: CARD, border: '1px solid rgba(255,26,60,.3)', borderRadius: 14, padding: '14px', animation: 'dropIn .25s ease', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: RED, letterSpacing: 1 }}>🚀 Quick Drop</div>
                        <button onClick={function() { setQuickDropId(null); setQuickDropContent(null); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 16, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>✕</button>
                      </div>

                      {quickDropLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                          <div style={{ width: 18, height: 18, border: '2px solid ' + RED, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>Writing platform captions with AI…</span>
                        </div>
                      ) : quickDropContent ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[
                            { key: 'ig', platform: 'INSTAGRAM', icon: '📸', color: PURP },
                            { key: 'tt', platform: 'TIKTOK',    icon: '🎵', color: RED  },
                            { key: 'tw', platform: 'TWITTER/X', icon: '🐦', color: BLUE },
                          ].map(function(p) {
                            var txt = quickDropContent[p.key];
                            var copied = copiedPlatform === p.platform;
                            if (!txt) return null;
                            return (
                              <div key={p.key} style={{ background: CARD2, border: '1px solid ' + BORD, borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: p.color, letterSpacing: 1 }}>{p.icon} {p.platform}</span>
                                  <button onClick={function() { copyPlatformText(txt, p.platform); }}
                                    style={{ background: copied ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (copied ? TEAL : BORD), borderRadius: 6, padding: '3px 8px', color: copied ? TEAL : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', animation: copied ? 'copyBlink .4s ease' : 'none' }}>
                                    {copied ? '✓ COPIED' : 'COPY'}
                                  </button>
                                </div>
                                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{txt}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}
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
                        onShare={null} onDel={null} onQuickDrop={null}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>AI Lyrics</div>
              <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: TEAL }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 1 }}>AI POWERED</span>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>WHAT SHOULD THE SONG BE ABOUT?</div>
              <textarea value={lyricPrompt} onChange={function(e) { setLyricPrompt(e.target.value); }}
                placeholder="e.g. overcoming hard times, loyalty, coming up from nothing, late nights in the studio..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '12px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>CORE HOOK / PHRASE (optional)</div>
              <input value={lyricHook} onChange={function(e) { setLyricHook(e.target.value); }}
                placeholder='e.g. "never gave up, still standing" or "real ones only"...'
                style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }} />
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>STYLE</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['Hip-Hop','R&B','Pop','Soul','Gospel','Trap','Drill','Afrobeats','Lo-Fi'].map(function(s) {
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
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>⟳</span> Writing with AI…</span>
                : '📝 GENERATE LYRICS'
              }
            </button>

            {lyricsEdited ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1 }}>EDIT YOUR LYRICS</div>
                  <button onClick={function() {
                    navigator.clipboard && navigator.clipboard.writeText(lyricsEdited).then(function() {
                      if (addToast) addToast('Lyrics copied!', 'success');
                    });
                  }} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORD, borderRadius: 6, padding: '3px 8px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>COPY</button>
                </div>
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

        {/* ════ VOCAL ════ */}
        {tab === 'vocal' && (
          <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'vocalIn .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>Vocal Settings</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>APPLY TO GENERATE</div>
            </div>

            {/* Style grid */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 9 }}>VOCAL STYLE ARCHETYPE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {VOCAL_STYLES.map(function(vs) {
                  var active = vocalStyle === vs.id;
                  return (
                    <button key={vs.id} onClick={function() { setVocalStyle(active ? null : vs.id); }}
                      style={{
                        background: active ? 'rgba(201,168,76,.12)' : CARD,
                        border: '1.5px solid ' + (active ? vs.color : BORD),
                        borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        boxShadow: active ? ('0 0 12px ' + vs.color + '33') : 'none',
                        transition: 'all .15s',
                      }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{vs.emoji}</span>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: active ? vs.color : TEXT, lineHeight: 1 }}>{vs.label}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2, lineHeight: 1.3 }}>{vs.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key picker */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>KEY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {KEYS.map(function(k) {
                  var active = vocalKey === k;
                  return (
                    <button key={k} onClick={function() { setVocalKey(k); }}
                      style={{ width: 36, height: 36, borderRadius: 8, background: active ? BURG : CARD2, border: '1px solid ' + (active ? 'rgba(128,0,32,.7)' : DIM), color: active ? GOLD : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}>
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch range */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>PITCH RANGE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                {PITCHES.map(function(p) {
                  var active = vocalPitch === p.id;
                  return (
                    <button key={p.id} onClick={function() { setVocalPitch(p.id); }}
                      style={{ background: active ? ('rgba(0,0,0,.2)') : CARD2, border: '2px solid ' + (active ? p.color : DIM), borderRadius: 10, padding: '8px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: active ? p.color : MUTED, letterSpacing: 1 }}>{p.label}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: MUTED, marginTop: 2 }}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effects */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>VOCAL EFFECTS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {VOCAL_EFFECTS.map(function(fx) {
                  var active = vocalFX.indexOf(fx) >= 0;
                  return (
                    <button key={fx} onClick={function() { toggleTag(vocalFX, setVocalFX, fx); }}
                      style={{ padding: '5px 12px', background: active ? 'rgba(212,133,74,.18)' : CARD2, border: '1px solid ' + (active ? 'rgba(212,133,74,.5)' : DIM), borderRadius: 999, color: active ? BLUE : MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 10, cursor: 'pointer', transition: 'all .15s' }}>
                      {fx}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extra notes */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>ADDITIONAL NOTES (optional)</div>
              <textarea value={vocalNotes} onChange={function(e) { setVocalNotes(e.target.value); }}
                placeholder="e.g. raspy delivery, breathy tone, ad-libs on every bar, double-tracked chorus..."
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
            </div>

            {/* Current config summary */}
            {(vocalStyle || vocalFX.length > 0) && (
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1, marginBottom: 5 }}>YOUR VOCAL PROFILE</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.6 }}>
                  {[
                    vocalStyle ? VOCAL_STYLES.find(function(v) { return v.id === vocalStyle; }).label : null,
                    'Key of ' + vocalKey,
                    PITCHES.find(function(p) { return p.id === vocalPitch; }).desc,
                    vocalFX.length > 0 ? vocalFX.join(' · ') : null,
                  ].filter(Boolean).join('  ·  ')}
                </div>
              </div>
            )}

            <button onClick={applyVocalToGenerate}
              style={{ width: '100%', background: 'linear-gradient(135deg,' + BURG + ',#C01838)', border: 'none', borderRadius: 14, padding: '15px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(128,0,32,.35)' }}>
              🎤 APPLY TO GENERATE
            </button>
          </div>
        )}

        {/* ════ CREATOR ════ */}
        {tab === 'creator' && (
          <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'creatorSlide .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>Creator Hub</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5 }}>AI tools for artists & influencers</div>
              </div>
              <div style={{ marginLeft: 'auto', background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 8, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: RED }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, letterSpacing: 1 }}>AI POWERED</span>
              </div>
            </div>

            {/* Tool selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {CREATOR_TOOLS.map(function(tool) {
                var active = creatorTool === tool.id;
                return (
                  <button key={tool.id} onClick={function() { setCreatorTool(tool.id); setCreatorOutput(''); }}
                    style={{
                      background: active ? 'rgba(201,168,76,.12)' : CARD,
                      border: '1.5px solid ' + (active ? tool.color : BORD),
                      borderRadius: 10, padding: '8px 6px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all .15s',
                    }}>
                    <span style={{ fontSize: 18 }}>{tool.emoji}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: active ? tool.color : MUTED, letterSpacing: .3, textAlign: 'center', lineHeight: 1.3 }}>{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active tool */}
            {CREATOR_TOOLS.map(function(tool) {
              if (creatorTool !== tool.id) return null;
              return (
                <div key={tool.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid ' + BORD, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: tool.color }}>{tool.emoji} {tool.label}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 3 }}>{tool.desc}</div>
                  </div>

                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>YOUR DETAILS</div>
                    <textarea value={creatorInput} onChange={function(e) { setCreatorInput(e.target.value); }}
                      placeholder={tool.placeholder}
                      rows={4}
                      style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 10, padding: '12px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
                  </div>

                  <button onClick={generateCreatorContent} disabled={creatorLoading}
                    style={{ background: creatorLoading ? CARD2 : ('linear-gradient(135deg,' + BURG + ',#C01838)'), border: 'none', borderRadius: 12, padding: '13px', color: creatorLoading ? MUTED : GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: creatorLoading ? 'default' : 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {creatorLoading
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>⟳</span>Generating with AI…</span>
                      : tool.emoji + ' GENERATE'
                    }
                  </button>

                  {creatorOutput ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, letterSpacing: 1 }}>OUTPUT</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={copyCreatorOutput}
                            style={{ background: copiedCreator ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (copiedCreator ? TEAL : BORD), borderRadius: 6, padding: '4px 10px', color: copiedCreator ? TEAL : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>
                            {copiedCreator ? '✓ COPIED' : '📋 COPY'}
                          </button>
                          <button onClick={function() { setCreatorOutput(''); }}
                            style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.15)', borderRadius: 6, padding: '4px 8px', color: RED, fontSize: 10, cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                      <div style={{ background: CARD2, border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: '14px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {creatorOutput}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={function() {
                          setCreatorInput('');
                          setCreatorOutput('');
                          if (addToast) addToast('Cleared — start fresh', 'info');
                        }} style={{ flex: 1, background: CARD, border: '1px solid ' + BORD, borderRadius: 8, padding: '9px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                          🔄 NEW
                        </button>
                        <button onClick={generateCreatorContent} disabled={creatorLoading}
                          style={{ flex: 2, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '9px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                          ⟳ REGENERATE
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
