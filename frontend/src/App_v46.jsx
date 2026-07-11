// SeeWhy LIVE v45 — Full Platform React JSX
// SwanyThree Entertainment Technology LLC · June 7, 2026
// v45: Complete consolidation — all v43 modals + v44 systems + v45 additions
// Auth · Onboarding · Multi-user Realtime · Supabase schema-correct wiring
// Rules: no ?. · no ?? · no localStorage · Math.floor() for money · inline styles only
// CREATOR_SPLIT = 90/10 IMMUTABLE · MAX_PANEL_GUESTS = 20 · PREVIEW_SECONDS = 120

import { useState, useEffect, useRef, useReducer, useCallback } from 'react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const C = {
  gold: '#C9A84C',
  burgundy: '#800020',
  charcoal: '#05030A',
  lime: '#C8F030',
  slate: '#1A1624',
  slate2: '#120F1C',
  muted: '#6B647A',
  white: '#F5F0FF',
  red: '#FF3B5C',
  green: '#00E676',
  blue: '#2979FF',
  cyan: '#00BCD4',
  orange: '#FF6D00',
  purple: '#7B5DA6',
};

const CREATOR_SPLIT = function(t) { return Math.floor(t * 90 / 100); };
const PLATFORM_SPLIT = function(t) { return t - CREATOR_SPLIT(t); };
const MAX_PANEL_GUESTS = 20;
const MAX_BREAKOUT_ROOMS = 35;
const PREVIEW_SECONDS = 120;
const MAX_VIDEO_SECONDS = 600;
const MAX_DRIFT_MS = 300;
const GUARDIAN_AUTOBAN = 0.95;
const GUARDIAN_WARN = 0.75;
const GUARDIAN_FLAG = 0.50;
const CONNECTION_CHECK_INTERVAL = 2000;
const BASE44_APP_ID = '6990f5f24823b53e21fcdc9d';
const INGEST_URL = 'rtmp://ingest.seewhylive.online:1935/live';
const STREAM_KEY_PREFIX = 'sw_6991033b_';
const SUPABASE_URL = 'https://xlrcibziouffgxciecvc.supabase.co';

// Subscription tiers
const TIERS = {
  free: { label: 'Free', color: C.muted, price: 0 },
  bronze: { label: 'Bronze', color: '#CD7F32', price: 1 },
  silver: { label: 'Silver', color: '#C0C0C0', price: 5 },
  gold: { label: 'Gold', color: C.gold, price: 15 },
};

// ─── GUARDIAN AI ──────────────────────────────────────────────────────────────
function filterMessageWithGuardianAI(text) {
  var hatePat = /hate|racist|slur|offensive|n-word/i;
  var spamPat = /spam|promote|buy now|click here|ads|link\s/i;
  var threatPat = /threat|violence|harm|kill|attack/i;
  var score = 0;
  if (hatePat.test(text)) score += 0.6;
  if (spamPat.test(text)) score += 0.4;
  if (threatPat.test(text)) score += 0.7;
  var severity = score >= GUARDIAN_AUTOBAN ? 'ban' : score >= GUARDIAN_WARN ? 'mute' : score >= GUARDIAN_FLAG ? 'flag' : 'pass';
  return { flagged: severity !== 'pass', text: text, severity: severity, score: score };
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function fmtDuration(s) {
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  return pad(h) + ':' + pad(m) + ':' + pad(sec);
}
function pad(n) { return n < 10 ? '0' + n : String(n); }
function fmtK(n) {
  if (n >= 1000000) return (Math.floor(n / 100000) / 10) + 'M';
  if (n >= 1000) return (Math.floor(n / 100) / 10) + 'K';
  return String(n);
}
function fmtTime(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
function fmtMoney(cents) { return '$' + (Math.floor(cents) / 100).toFixed(2); }
function avatarColor(name) {
  var palette = [C.burgundy, '#5B7FA6', '#2E7D32', '#6A1B9A', '#E65100', '#00695C', '#37474F', '#C62828'];
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function tsNow() { return Date.now(); }
function genStreamKey() { return STREAM_KEY_PREFIX + Math.random().toString(36).slice(2, 10); }

// ─── REDUCER ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE': return Object.assign({}, state, { page: action.payload, prevPage: state.page });
    case 'SET_LIVE_ROOM': return Object.assign({}, state, { liveRoom: action.payload });
    case 'SET_VIEWER_COUNT': return Object.assign({}, state, { liveRoom: Object.assign({}, state.liveRoom, { viewers: action.payload }) });
    case 'SET_STREAM_DURATION': return Object.assign({}, state, { liveRoom: Object.assign({}, state.liveRoom, { duration: action.payload }) });
    case 'SET_MODAL': return Object.assign({}, state, { modal: action.payload });
    case 'SET_TOASTS': return Object.assign({}, state, { toasts: action.payload });
    case 'ADD_TOAST': return Object.assign({}, state, { toasts: state.toasts.concat([action.payload]) });
    case 'SET_CONNECTION': return Object.assign({}, state, { connection: action.payload });
    case 'SET_SCREEN_SHARE': return Object.assign({}, state, { screenShareActive: action.payload });
    case 'SET_BREAKOUT_ROOMS': return Object.assign({}, state, { breakoutRooms: action.payload });
    case 'SET_GUESTS': return Object.assign({}, state, { guests: action.payload });
    case 'UPDATE_GUEST': return Object.assign({}, state, { guests: state.guests.map(function(g) { return g.id === action.payload.id ? action.payload : g; }) });
    case 'REMOVE_GUEST': return Object.assign({}, state, { guests: state.guests.filter(function(g) { return g.id !== action.payload; }) });
    case 'ADD_GUEST':
      if (state.guests.length >= MAX_PANEL_GUESTS) return state;
      return Object.assign({}, state, { guests: state.guests.concat([action.payload]) });
    case 'SET_RAISE_HAND_QUEUE': return Object.assign({}, state, { raiseHandQueue: action.payload });
    case 'SET_ROOM_TOKEN': return Object.assign({}, state, { roomToken: action.payload });
    case 'SET_WATCH_SYNC': return Object.assign({}, state, { watchPartySyncOffset: action.payload });
    case 'SET_WEBRTC_CONFIG': return Object.assign({}, state, { webrtcConfig: action.payload });
    case 'SET_SPONSOR_OVERLAY': return Object.assign({}, state, { sponsorOverlay: action.payload });
    case 'SET_GREENROOM_READY': return Object.assign({}, state, { greenroomReady: action.payload });
    case 'SET_BATTLE_STATE': return Object.assign({}, state, { battleState: action.payload });
    case 'SET_LIVE_POLL': return Object.assign({}, state, { livePoll: action.payload });
    case 'SET_ANALYTICS': return Object.assign({}, state, { analytics: action.payload });
    case 'SET_SCHEDULE': return Object.assign({}, state, { schedule: action.payload });
    case 'SET_MESSAGES': return Object.assign({}, state, { messages: action.payload });
    case 'SET_AUTH': return Object.assign({}, state, { auth: action.payload });
    case 'SET_NOTIFICATIONS': return Object.assign({}, state, { notifications: action.payload });
    case 'ADD_NOTIFICATION': return Object.assign({}, state, { notifications: [action.payload].concat(state.notifications).slice(0, 50) });
    case 'MARK_NOTIFS_READ': return Object.assign({}, state, { notifications: state.notifications.map(function(n) { return Object.assign({}, n, { read: true }); }) });
    case 'SET_WALLET': return Object.assign({}, state, { wallet: action.payload });
    case 'SET_CLIPS': return Object.assign({}, state, { clips: action.payload });
    case 'ADD_CLIP': return Object.assign({}, state, { clips: state.clips.concat([action.payload]) });
    case 'SET_BLOCKS': return Object.assign({}, state, { blocks: action.payload });
    case 'SET_CONNECTION_STATUS': return Object.assign({}, state, { connectionStatus: action.payload });
    default: return state;
  }
}

var initialState = {
  page: 'home',
  prevPage: null,
  modal: null,
  toasts: [],
  messages: [],
  connectionStatus: 'connected', // connected | reconnecting | offline
  liveRoom: {
    id: 'room_dc2026_1',
    title: 'Washington Classic 2026 — Main Stage',
    host: 'SwanyThree23',
    viewers: 4217,
    isLive: true,
    duration: 2847,
    battleActive: false,
  },
  guests: [
    { id: 'g1', name: 'DJ_Cipher', isMuted: false, isCameraOff: false, isSpotlighted: false, label: 'CO-HOST', isFM: true },
    { id: 'g2', name: 'CaliBonesOG', isMuted: false, isCameraOff: false, isSpotlighted: true, label: '', isFM: false },
    { id: 'g3', name: 'VibeNBones', isMuted: false, isCameraOff: false, isSpotlighted: false, label: '', isFM: true },
    { id: 'g4', name: 'JoyceM_LLC', isMuted: true, isCameraOff: false, isSpotlighted: false, label: 'PANELIST', isFM: true },
    { id: 'g5', name: 'WestCoast_Ace', isMuted: false, isCameraOff: false, isSpotlighted: false, label: '', isFM: false },
  ],
  currentUser: {
    id: 'user_swany',
    name: 'SwanyThree23',
    username: 'SwanyThree23',
    avatar_url: null,
    subscription_tier: 'gold',
    isHost: true,
    isFM: true,
    fmNumber: 1,
    fmDaysRemaining: 83,
    followers: 2847,
    verified: true,
    onboarding_complete: true,
    handles: { paypal: 'swanythree23', cashapp: 'SwanyThree23', venmo: 'SwanyThree23', zelle: '+16026986110' },
  },
  auth: {
    isSignedIn: true,
    user: null,
    loading: false,
    error: null,
  },
  streams: [
    { id: 's1', title: 'Washington Classic Finals', host: 'SwanyThree23', viewers: 4217, isPK: true, isFM: true },
    { id: 's2', title: 'Domino Masterclass', host: 'DJ_Cipher', viewers: 921, isPK: false, isFM: true },
    { id: 's3', title: 'Elite League Heat 1', host: 'VibeNBones', viewers: 2103, isPK: false, isFM: false },
    { id: 's4', title: 'State vs State: WA vs CA', host: 'CaliBonesOG', viewers: 1847, isPK: true, isFM: false },
    { id: 's5', title: 'AIverse Podcast Ep 91 Live', host: 'AIverse_Pod', viewers: 643, isPK: false, isFM: true },
  ],
  connection: { latency: 23, bitrate: 2850, packetLoss: 0.1, quality: 'excellent' },
  screenShareActive: false,
  breakoutRooms: [],
  raiseHandQueue: [],
  roomToken: { token: 'jwt_eyJ0eXAiOiJKV1QiLCJhbGc_' + Date.now(), expiresAt: Date.now() + 3600000, refreshCount: 0 },
  watchPartySyncOffset: 12,
  webrtcConfig: { codec: 'H264', resolution: '1080p', fps: 30, bitrate: '4M', dtx: true, simulcast: true },
  sponsorOverlay: { active: false, name: '', logoUrl: '', ctaText: '', ctaUrl: '', position: 'top-right', opacity: 0.9 },
  greenroomReady: false,
  battleState: { phase: 'idle', scoreA: 0, scoreB: 0, timer: 180, wager: 0 },
  livePoll: null,
  notifications: [
    { id: 'n1', type: 'tip', text: 'JoyceM_LLC tipped $25 💰', ts: tsNow() - 120000, read: false },
    { id: 'n2', type: 'follower', text: 'DominoKing_WA followed you', ts: tsNow() - 300000, read: false },
    { id: 'n3', type: 'battle', text: 'CaliBonesOG challenged you to PK Battle!', ts: tsNow() - 600000, read: true },
  ],
  wallet: {
    pendingCents: 112000,
    availableCents: 348500,
    lifetimeCents: 892000,
    lastPayoutDate: '2026-05-28',
  },
  clips: [],
  blocks: [],
  analytics: {
    totalViews: 98420, peakViewers: 4217, avgWatchTime: 847,
    tipsToday: 1240, tipCount: 34, newFollowers: 89,
    elitePoints: 98420, streamHours: 312,
    topTippers: [
      { name: 'JoyceM_LLC', amount: 250 },
      { name: 'WestCoast_Ace', amount: 180 },
      { name: 'DominoKing_WA', amount: 120 },
    ],
    weeklyViews: [1200, 1800, 2400, 3100, 2800, 4200, 4217],
    guardianEvents: 3,
    avgBitrate: 2850,
  },
  schedule: [
    { id: 'sch1', title: 'Washington Classic Finals', date: '2026-06-14', time: '7:00 PM PST', recurring: 'none', reminder: true },
    { id: 'sch2', title: 'AIverse Podcast Ep 92', date: '2026-06-10', time: '8:00 PM PST', recurring: 'weekly', reminder: true },
    { id: 'sch3', title: 'Domino Strategy Session', date: '2026-06-12', time: '6:00 PM PST', recurring: 'weekly', reminder: false },
  ],
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Badge(props) {
  return (
    <span style={{
      background: props.color || C.burgundy,
      color: props.textColor || '#fff',
      fontSize: 9, fontWeight: 800, padding: '2px 6px',
      borderRadius: 3, letterSpacing: 1,
      textTransform: 'uppercase', fontFamily: 'monospace',
      display: 'inline-flex', alignItems: 'center',
    }}>{props.children}</span>
  );
}
function GoldBadge(props) { return <Badge color={C.gold} textColor={C.charcoal}>{props.children}</Badge>; }
function TierBadge(props) {
  var tier = TIERS[props.tier] || TIERS.free;
  return <Badge color={tier.color} textColor={props.tier === 'free' ? C.white : C.charcoal}>{tier.label}</Badge>;
}

function Btn(props) {
  var variant = props.variant || 'primary';
  var variants = {
    primary: { background: C.burgundy, color: '#fff' },
    gold: { background: C.gold, color: C.charcoal },
    lime: { background: C.lime, color: C.charcoal },
    ghost: { background: 'rgba(255,255,255,0.07)', color: C.white, border: '1px solid rgba(255,255,255,0.15)' },
    danger: { background: C.red, color: '#fff' },
    dark: { background: C.slate, color: C.white, border: '1px solid rgba(201,168,76,0.3)' },
    cyan: { background: C.cyan, color: C.charcoal },
    green: { background: C.green, color: C.charcoal },
    purple: { background: C.purple, color: '#fff' },
  };
  return (
    <button
      onClick={props.disabled ? null : props.onClick}
      style={Object.assign({
        border: 'none', borderRadius: 8, cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif",
        padding: props.small ? '6px 14px' : '11px 22px',
        fontSize: props.small ? 12 : 14, letterSpacing: 0.5,
        opacity: props.disabled ? 0.5 : 1, width: props.full ? '100%' : undefined,
        transition: 'opacity 0.15s, transform 0.1s',
      }, variants[variant], props.style || {})}
    >{props.children}</button>
  );
}

function Avatar(props) {
  var size = props.size || 36;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: props.url ? undefined : 'linear-gradient(135deg, ' + avatarColor(props.name) + ', ' + C.gold + ')',
      backgroundImage: props.url ? 'url(' + props.url + ')' : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: Math.floor(size * 0.38), color: '#fff',
      flexShrink: 0,
      border: props.isHost ? '2px solid ' + C.gold : props.isFM ? '1px solid ' + C.gold + '88' : 'none',
      boxShadow: props.isHost ? '0 0 12px rgba(201,168,76,0.4)' : 'none',
    }}>{props.url ? '' : (props.name && props.name[0] ? props.name[0].toUpperCase() : '?')}</div>
  );
}

function Modal(props) {
  if (!props.open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5,3,10,0.93)',
      display: 'flex', alignItems: props.bottom ? 'flex-end' : 'center', justifyContent: 'center',
      padding: props.bottom ? 0 : 16,
    }} onClick={props.onClose}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{
        background: C.slate,
        border: props.bottom ? 'none' : '1px solid rgba(201,168,76,0.25)',
        borderTop: props.bottom ? '2px solid ' + C.gold : undefined,
        borderRadius: props.bottom ? '18px 18px 0 0' : 18,
        padding: 24, width: '100%', maxWidth: props.width || 420,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color: C.gold, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2 }}>{props.title}</div>
          <button onClick={props.onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function LiveDot(props) {
  var color = props.color || C.red;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: '0 0 6px ' + color, display: 'inline-block' }} />
      {!props.noLabel && <span style={{ color: color, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>LIVE</span>}
    </span>
  );
}

function ConnectionStatusBanner(props) {
  var status = props.status;
  if (status === 'connected') return null;
  return (
    <div style={{
      background: status === 'offline' ? C.red : C.orange,
      color: '#fff', fontSize: 12, fontWeight: 800,
      padding: '6px 16px', textAlign: 'center', letterSpacing: 1,
    }}>
      {status === 'offline' ? '⚠️ OFFLINE — Reconnecting...' : '⟳ RECONNECTING...'}
    </div>
  );
}

function ToastSystem(props) {
  var toasts = props.toasts;
  var dispatch = props.dispatch;
  useEffect(function() {
    if (toasts.length === 0) return;
    var t = setTimeout(function() {
      dispatch({ type: 'SET_TOASTS', payload: toasts.slice(1) });
    }, 3200);
    return function() { clearTimeout(t); };
  }, [toasts, dispatch]);
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 360, maxWidth: '92%' }}>
      {toasts.slice(0, 3).map(function(t, i) {
        return (
          <div key={i} style={{
            background: t.type === 'error' ? C.red : t.type === 'success' ? '#1b4d35' : t.type === 'warn' ? '#7a4800' : C.slate,
            color: '#fff', padding: '12px 16px', borderRadius: 10, marginBottom: 8,
            fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <span>{t.message}</span>
            <button onClick={function() { dispatch({ type: 'SET_TOASTS', payload: toasts.filter(function(_, j) { return j !== i; }) }); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, marginLeft: 8 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

function Skeleton(props) {
  var w = props.width || '100%';
  var h = props.height || 16;
  return (
    <div style={{
      width: w, height: h, borderRadius: props.round ? '50%' : 6,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(201,168,76,0.07) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite',
    }} />
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: C.slate, borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Skeleton width={48} height={48} round />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          <Skeleton width="70%" height={12} />
          <Skeleton width="45%" height={10} />
        </div>
      </div>
    </div>
  );
}

// ─── PK BATTLE MODAL ─────────────────────────────────────────────────────────
function PKBattleModal(props) {
  var dispatch = props.dispatch;
  var open = props.open;
  var onClose = props.onClose;
  var hostName = props.hostName || 'SwanyThree23';
  var [phase, setPhase] = useState('setup');
  var [scoreA, setScoreA] = useState(0);
  var [scoreB, setScoreB] = useState(0);
  var [timer, setTimer] = useState(180);
  var [running, setRunning] = useState(false);
  var [wager, setWager] = useState(10);
  var [opponent, setOpponent] = useState('DominoKing_CA');
  var [aura, setAura] = useState('AURA: Get ready to battle! 🔥');

  var AURA_LINES = [
    'AURA: ' + hostName + ' is PULLING AWAY!! 🔥',
    'AURA: The crowd is going WILD — tip your player! 💰',
    'AURA: This is ELECTRIC!! State vs State!! 🏴',
    'AURA: Guardian says vibes clean — keep going! ✅',
    'AURA: PK brought to you by Domino Entertainment! 🎲',
    'AURA: Both players are LOCKED IN! 🧠',
    'AURA: Audience tips are FLOODING in! 🌊',
  ];

  useEffect(function() {
    if (!running) return;
    var t = setInterval(function() {
      setTimer(function(p) {
        if (p <= 0) { clearInterval(t); setRunning(false); setPhase('result'); return 0; }
        return p - 1;
      });
      if (Math.random() > 0.6) setScoreA(function(s) { return s + rand(5, 20); });
      if (Math.random() > 0.65) setScoreB(function(s) { return s + rand(3, 16); });
      if (Math.random() > 0.8) setAura(AURA_LINES[rand(0, AURA_LINES.length - 1)]);
    }, 1000);
    return function() { clearInterval(t); };
  }, [running]);

  var total = scoreA + scoreB;
  var pctA = total > 0 ? Math.floor(scoreA * 100 / total) : 50;
  var pctB = 100 - pctA;
  var winner = scoreA >= scoreB ? hostName : opponent;

  function boost(amt) {
    setScoreA(function(s) { return s + amt * 12; });
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '$' + amt + ' boost → ' + hostName + '! Creator gets $' + CREATOR_SPLIT(amt) } });
  }

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="⚔️ PK BATTLE MANAGER" bottom>
      {phase === 'setup' && (
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Challenge another creator. Audience tips boost scores — 90% goes to the winner instantly.</div>
          <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>OPPONENT USERNAME</label>
          <input value={opponent} onChange={function(e) { setOpponent(e.target.value); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />
          <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8 }}>WAGER (Creator gets {CREATOR_SPLIT(wager)} / Platform gets {PLATFORM_SPLIT(wager)})</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
            {[5, 10, 25, 50].map(function(w) {
              return <button key={w} onClick={function() { setWager(w); }} style={{ padding: '10px 0', background: wager === w ? C.gold : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, color: wager === w ? C.charcoal : C.white, fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>${w}</button>;
            })}
          </div>
          <Btn onClick={function() { setPhase('active'); setRunning(true); }} variant="gold" full>⚔️ SEND BATTLE REQUEST</Btn>
        </div>
      )}
      {phase === 'active' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 52, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 4, color: timer < 30 ? C.red : C.gold }}>{fmtTime(timer)}</div>
            <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1 }}>REMAINING</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[{ name: hostName, score: scoreA, color: C.burgundy }, { name: opponent, score: scoreB, color: '#5B7FA6' }].map(function(side, i) {
              return (
                <div key={i} style={{ background: 'linear-gradient(135deg,' + side.color + '33,' + C.charcoal + ')', border: '2px solid ' + side.color, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 11, marginBottom: 4 }}>{side.name}</div>
                  <div style={{ color: side.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 2 }}>{side.score}</div>
                  <div style={{ color: C.muted, fontSize: 9 }}>TIP POINTS</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 22 }}>
              <div style={{ width: pctA + '%', background: C.burgundy, transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{pctA}%</span>
              </div>
              <div style={{ width: pctB + '%', background: '#5B7FA6', transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{pctB}%</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(200,240,48,0.07)', border: '1px solid ' + C.lime + '33', borderRadius: 8, padding: '10px 14px', color: C.lime, fontSize: 12, fontStyle: 'italic', marginBottom: 14 }}>{aura}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[5, 10, 25, 50].map(function(amt) {
              return <button key={amt} onClick={function() { boost(amt); }} style={{ background: 'rgba(128,0,32,0.3)', border: '1px solid ' + C.burgundy, borderRadius: 7, color: C.white, fontSize: 11, fontWeight: 800, padding: '9px 4px', cursor: 'pointer' }}>${amt} Boost</button>;
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={function() { setRunning(function(r) { return !r; }); }} variant="gold" style={{ flex: 1 }}>{running ? '⏸ PAUSE' : '▶ RESUME'}</Btn>
            <Btn onClick={function() { setPhase('result'); setRunning(false); }} variant="ghost" small>Surrender</Btn>
          </div>
        </div>
      )}
      {phase === 'result' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 56 }}>🏆</div>
          <div style={{ color: C.gold, fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginTop: 8 }}>{winner} WINS!</div>
          <div style={{ color: C.muted, marginTop: 8, fontSize: 13 }}>Final: {scoreA} — {scoreB}</div>
          <div style={{ color: C.lime, fontSize: 12, marginTop: 8 }}>Creator receives ${CREATOR_SPLIT(wager)} (90%) instantly · Platform: ${PLATFORM_SPLIT(wager)}</div>
          <Btn onClick={function() { setPhase('setup'); setScoreA(0); setScoreB(0); setTimer(180); onClose(); }} variant="gold" style={{ marginTop: 20 }}>Close</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── GREEN ROOM MODAL ─────────────────────────────────────────────────────────
function GreenRoomModal(props) {
  var dispatch = props.dispatch;
  var open = props.open;
  var onClose = props.onClose;
  var [micReady, setMicReady] = useState(false);
  var [camReady, setCamReady] = useState(false);
  var [netReady, setNetReady] = useState(false);
  var [testing, setTesting] = useState('');
  var [rtmpKey, setRtmpKey] = useState('');
  var [ninjaUrl, setNinjaUrl] = useState('');

  function runTest(item, setter) {
    setTesting(item);
    setTimeout(function() { setter(true); setTesting(''); }, 1800);
  }

  var allReady = micReady && camReady && netReady;

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="🟢 GREEN ROOM — PRE-FLIGHT" bottom>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Complete all checks before going live. Your JWT session token is active.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'mic', label: '🎙 Microphone Test', ready: micReady, test: function() { runTest('mic', setMicReady); } },
          { key: 'cam', label: '📷 Camera Test', ready: camReady, test: function() { runTest('cam', setCamReady); } },
          { key: 'net', label: '🌐 Network / SFU Test', ready: netReady, test: function() { runTest('net', setNetReady); } },
        ].map(function(item) {
          return (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: item.ready ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.04)',
              border: '1px solid ' + (item.ready ? C.green + '44' : 'rgba(255,255,255,0.08)'),
              borderRadius: 10, padding: 14,
            }}>
              <span style={{ fontSize: 13, flex: 1, color: C.white, fontWeight: 700 }}>{item.label}</span>
              {item.ready ? (
                <span style={{ color: C.green, fontWeight: 800, fontSize: 12 }}>✓ READY</span>
              ) : testing === item.key ? (
                <span style={{ color: C.gold, fontSize: 12 }}>Testing...</span>
              ) : (
                <Btn onClick={item.test} small variant="ghost">Test</Btn>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>RTMP STREAM KEY (OBS / vMix / StreamYard)</label>
        <input value={rtmpKey} onChange={function(e) { setRtmpKey(e.target.value); }} placeholder="sw_xxxxxxxx_xxxxxxxx"
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace' }} />
        <div style={{ color: C.lime, fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>Ingest: {INGEST_URL}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>VDO.NINJA 4K GUEST LINK</label>
        <input value={ninjaUrl} onChange={function(e) { setNinjaUrl(e.target.value); }} placeholder="https://vdo.ninja/?push=..."
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace' }} />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>SESSION TOKEN (60m)</div>
        <div style={{ color: C.lime, fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>{genStreamKey()}?session={tsNow()}</div>
      </div>
      <Btn onClick={function() {
        if (allReady) {
          dispatch({ type: 'SET_GREENROOM_READY', payload: true });
          dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '✅ Pre-flight complete — you are cleared for the stage!' } });
          onClose();
        }
      }} variant={allReady ? 'lime' : 'ghost'} full disabled={!allReady}>
        {allReady ? '🚀 ENTER STAGE — GO LIVE' : 'Complete all tests to continue'}
      </Btn>
    </Modal>
  );
}

// ─── INVITE GUESTS MODAL ──────────────────────────────────────────────────────
function InviteGuestsModal(props) {
  var dispatch = props.dispatch;
  var open = props.open;
  var onClose = props.onClose;
  var guests = props.guests;
  var [username, setUsername] = useState('');
  var [role, setRole] = useState('GUEST');
  var [pending, setPending] = useState([]);

  var ROLES = ['GUEST', 'CO-HOST', 'PANELIST', 'MODERATOR'];

  function addPending() {
    if (!username.trim()) return;
    setPending(function(p) { return p.concat([{ name: username, role: role, id: 'inv_' + tsNow() }]); });
    setUsername('');
  }

  function sendAll() {
    pending.forEach(function(inv) {
      if (guests.length < MAX_PANEL_GUESTS) {
        dispatch({ type: 'ADD_GUEST', payload: { id: 'g_' + tsNow() + '_' + inv.name, name: inv.name, isMuted: false, isCameraOff: false, isSpotlighted: false, label: inv.role === 'GUEST' ? '' : inv.role, isFM: false } });
      }
    });
    setPending([]);
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '✅ ' + pending.length + ' invite(s) sent! Guests joining stage.' } });
    onClose();
  }

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={'👥 INVITE GUESTS (' + guests.length + '/' + MAX_PANEL_GUESTS + ')'} bottom>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Add guests by username. Set role first. Hard cap: {MAX_PANEL_GUESTS} guests on stage.</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={username} onChange={function(e) { setUsername(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') addPending(); }} placeholder="@username"
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {ROLES.map(function(r) {
          return <button key={r} onClick={function() { setRole(r); }} style={{ background: role === r ? C.gold : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 20, padding: '5px 12px', color: role === r ? C.charcoal : C.white, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{r}</button>;
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Btn onClick={addPending} variant="dark" style={{ flex: 1 }}>+ Add to Queue</Btn>
        {pending.length > 0 && <Btn onClick={sendAll} variant="gold" style={{ flex: 1 }}>Send All ({pending.length})</Btn>}
      </div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>PENDING INVITES</div>
          {pending.map(function(inv) {
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: C.white, fontSize: 13, flex: 1 }}>@{inv.name}</span>
                <Badge color={C.blue}>{inv.role}</Badge>
                <button onClick={function() { setPending(function(p) { return p.filter(function(x) { return x.id !== inv.id; }); }); }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ON STAGE NOW</div>
      {guests.length === 0 && <div style={{ color: C.muted, fontSize: 12, padding: '10px 0' }}>No guests yet.</div>}
      {guests.map(function(g) {
        return (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Avatar name={g.name} size={28} isFM={g.isFM} />
            <span style={{ color: C.white, fontSize: 12, flex: 1 }}>{g.name}</span>
            {g.label && <Badge color={C.gold} textColor={C.charcoal}>{g.label}</Badge>}
            <button onClick={function() { dispatch({ type: 'UPDATE_GUEST', payload: Object.assign({}, g, { isMuted: !g.isMuted }) }); }}
              style={{ background: g.isMuted ? 'rgba(255,59,92,0.2)' : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, color: g.isMuted ? C.red : C.white, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
              {g.isMuted ? '🔇' : '🎙'}
            </button>
            <button onClick={function() { dispatch({ type: 'REMOVE_GUEST', payload: g.id }); }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        );
      })}
    </Modal>
  );
}

// ─── WEBRTC CONFIG MODAL ──────────────────────────────────────────────────────
function WebRTCConfigModal(props) {
  var dispatch = props.dispatch;
  var open = props.open;
  var onClose = props.onClose;
  var cfg = props.config;
  var [local, setLocal] = useState(Object.assign({}, cfg));

  var CODECS = [
    { id: 'H264', note: 'Best compatibility. Hardware accelerated on most devices.' },
    { id: 'VP8', note: 'Good for older browsers. Low CPU. Widely supported.' },
    { id: 'VP9', note: 'Better compression than VP8. 4K capable. More CPU.' },
    { id: 'AV1', note: 'Best quality/bitrate. Next-gen codec. Limited hardware support.' },
  ];
  var RESOLUTIONS = ['720p', '1080p', '1440p', '4K'];
  var FPS_OPTIONS = [24, 30, 60];
  var BITRATE_PRESETS = ['1M', '2M', '4M', '6M', '8M'];

  function save() {
    dispatch({ type: 'SET_WEBRTC_CONFIG', payload: local });
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '⚙️ WebRTC: ' + local.codec + ' ' + local.resolution + ' @ ' + local.fps + 'fps · ' + local.bitrate } });
    onClose();
  }

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="⚙️ WEBRTC CONFIG" bottom>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>CODEC</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CODECS.map(function(c) {
            return (
              <button key={c.id} onClick={function() { setLocal(Object.assign({}, local, { codec: c.id })); }} style={{
                background: local.codec === c.id ? C.burgundy + '44' : 'rgba(255,255,255,0.04)',
                border: '1px solid ' + (local.codec === c.id ? C.burgundy : 'rgba(255,255,255,0.08)'),
                borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ color: local.codec === c.id ? C.gold : C.white, fontWeight: 800, fontSize: 13 }}>{c.id}</div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{c.note}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>RESOLUTION</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RESOLUTIONS.map(function(r) {
              return <button key={r} onClick={function() { setLocal(Object.assign({}, local, { resolution: r })); }} style={{ padding: '8px', background: local.resolution === r ? C.gold : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, color: local.resolution === r ? C.charcoal : C.white, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>{r}</button>;
            })}
          </div>
        </div>
        <div>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>FPS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FPS_OPTIONS.map(function(f) {
              return <button key={f} onClick={function() { setLocal(Object.assign({}, local, { fps: f })); }} style={{ padding: '8px', background: local.fps === f ? C.gold : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, color: local.fps === f ? C.charcoal : C.white, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>{f}fps</button>;
            })}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>BITRATE TARGET</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BITRATE_PRESETS.map(function(b) {
            return <button key={b} onClick={function() { setLocal(Object.assign({}, local, { bitrate: b })); }} style={{ flex: 1, padding: '8px', background: local.bitrate === b ? C.burgundy : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, color: C.white, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>{b}</button>;
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {[['dtx', 'DTX (Disc. TX)'], ['simulcast', 'Simulcast']].map(function(pair) {
          return (
            <button key={pair[0]} onClick={function() { var upd = {}; upd[pair[0]] = !local[pair[0]]; setLocal(Object.assign({}, local, upd)); }} style={{ flex: 1, padding: '10px', background: local[pair[0]] ? 'rgba(200,240,48,0.12)' : 'rgba(255,255,255,0.07)', border: '1px solid ' + (local[pair[0]] ? C.lime : 'rgba(255,255,255,0.1)'), borderRadius: 8, color: local[pair[0]] ? C.lime : C.muted, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              {local[pair[0]] ? '✓ ' : ''}{pair[1]}
            </button>
          );
        })}
      </div>
      <Btn onClick={save} variant="gold" full>SAVE WEBRTC CONFIG</Btn>
    </Modal>
  );
}

// ─── SPONSOR OVERLAY MODAL ────────────────────────────────────────────────────
function SponsorOverlayModal(props) {
  var dispatch = props.dispatch;
  var open = props.open;
  var onClose = props.onClose;
  var [local, setLocal] = useState(Object.assign({}, props.overlay));

  var POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  function save() {
    dispatch({ type: 'SET_SPONSOR_OVERLAY', payload: local });
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: local.active ? '✅ Sponsor overlay LIVE on stream' : 'Sponsor overlay deactivated' } });
    onClose();
  }

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="💼 SPONSOR OVERLAY" bottom>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: C.white, fontWeight: 700 }}>Overlay Active</span>
        <button onClick={function() { setLocal(Object.assign({}, local, { active: !local.active })); }} style={{ width: 52, height: 28, borderRadius: 14, background: local.active ? C.lime : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 3, left: local.active ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: local.active ? C.charcoal : '#666', transition: 'left 0.2s' }} />
        </button>
      </div>
      {local.active && (
        <div>
          {[['name', 'SPONSOR NAME', 'e.g. Domino Entertainment'], ['logoUrl', 'LOGO URL', 'https://...'], ['ctaText', 'CTA BUTTON TEXT', 'Learn More'], ['ctaUrl', 'CTA URL', 'https://...']].map(function(pair) {
            return (
              <div key={pair[0]} style={{ marginBottom: 12 }}>
                <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>{pair[1]}</label>
                <input value={local[pair[0]]} onChange={function(e) { var upd = {}; upd[pair[0]] = e.target.value; setLocal(Object.assign({}, local, upd)); }} placeholder={pair[2]} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '9px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            );
          })}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>POSITION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {POSITIONS.map(function(pos) {
                return <button key={pos} onClick={function() { setLocal(Object.assign({}, local, { position: pos })); }} style={{ padding: '8px', background: local.position === pos ? C.burgundy : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, color: C.white, fontSize: 11, cursor: 'pointer', fontWeight: local.position === pos ? 800 : 400 }}>{pos}</button>;
              })}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>OPACITY: {Math.round(local.opacity * 100)}%</div>
            <input type="range" min="0.1" max="1" step="0.05" value={local.opacity} onChange={function(e) { setLocal(Object.assign({}, local, { opacity: Number(e.target.value) })); }} style={{ width: '100%', accentColor: C.gold }} />
          </div>
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: C.muted }}>
            Preview: <span style={{ color: C.gold }}>{local.name || 'Sponsor Name'}</span> · "{local.ctaText || 'CTA'}" · {local.position} @ {Math.round(local.opacity * 100)}%
          </div>
        </div>
      )}
      <Btn onClick={save} variant="gold" full>SAVE SPONSOR OVERLAY</Btn>
    </Modal>
  );
}

// ─── PAYMENT MODAL (v45 — Direct tips, no virtual gifts) ─────────────────────
var PAY_PLATFORMS = [
  { id: 'paypal', label: 'PayPal', color: '#003087', icon: '🅿', dl: function(h, a) { return 'https://paypal.me/' + h + '/' + a; } },
  { id: 'cashapp', label: 'Cash App', color: '#00C244', icon: '💵', dl: function(h, a) { return 'https://cash.app/$' + h + '/' + a; } },
  { id: 'venmo', label: 'Venmo', color: '#008CFF', icon: 'V', dl: function(h, a) { return 'https://venmo.com/' + h + '?txn=pay&amount=' + a; } },
  { id: 'zelle', label: 'Zelle', color: '#6D1ED4', icon: 'Z', dl: function() { return 'https://enroll.zellepay.com/qr-codes'; } },
  { id: 'chime', label: 'Chime', color: '#00C9A7', icon: '⚡', dl: function() { return 'https://chime.com/'; } },
  { id: 'applepay', label: 'Apple Pay', color: '#1C1C1E', icon: '', dl: function() { return ''; } },
];

function PaymentModal(props) {
  var open = props.open;
  var onClose = props.onClose;
  var host = props.host || 'SwanyThree23';
  var handles = props.handles || { paypal: 'swanythree23', cashapp: 'SwanyThree23', venmo: 'SwanyThree23' };
  var dispatch = props.dispatch;
  var [amount, setAmount] = useState('10');
  var [note, setNote] = useState('');
  var [sent, setSent] = useState('');

  var amtNum = Number(amount) || 0;
  var creatorGets = CREATOR_SPLIT(amtNum);

  function pay(p) {
    var handle = handles[p.id] || host;
    var url = p.dl(handle, amount);
    setSent(p.label);
    if (url) { try { window.open(url, '_blank'); } catch(e) {} }
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '💰 Sent via ' + p.label + '! Creator gets $' + creatorGets + ' (90%)' } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id: 'tip_' + tsNow(), type: 'tip', text: 'You tipped @' + host + ' $' + amtNum + ' via ' + p.label, ts: tsNow(), read: false } });
  }

  if (!open) return null;
  return (
    <Modal open={open} onClose={function() { setSent(''); onClose(); }} title="💰 DIRECT TIP — NO VIRTUAL GIFTS">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 52 }}>✅</div>
          <div style={{ color: C.lime, fontWeight: 800, fontSize: 20, marginTop: 12 }}>Sent via {sent}!</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>@{host} receives <span style={{ color: C.gold }}>90%</span> — real money, zero middleman</div>
          <Btn onClick={function() { setSent(''); }} style={{ marginTop: 20 }} variant="ghost">Send Another</Btn>
        </div>
      ) : (
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Real money directly to @{host}. They keep <span style={{ color: C.lime, fontWeight: 800 }}>90%</span> — platform takes 10% to keep the lights on.</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['5', '10', '20', '50'].map(function(v) {
              return <button key={v} onClick={function() { setAmount(v); }} style={{ flex: 1, padding: '9px 0', background: amount === v ? C.gold : 'rgba(255,255,255,0.07)', color: amount === v ? C.charcoal : C.white, border: 'none', borderRadius: 7, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>${v}</button>;
            })}
          </div>
          <input type="number" value={amount} onChange={function(e) { setAmount(e.target.value); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 18, fontWeight: 800, boxSizing: 'border-box', marginBottom: 12 }} />
          <input value={note} onChange={function(e) { setNote(e.target.value); }} placeholder="Leave a note for @{host}..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: C.lime, fontWeight: 800, fontSize: 14 }}>@{host} receives: ${creatorGets}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>Platform fee: ${amtNum - creatorGets} (10%)</div>
            </div>
            <span style={{ fontSize: 24 }}>💰</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {PAY_PLATFORMS.map(function(p) {
              return (
                <button key={p.id} onClick={function() { pay(p); }} style={{ background: p.color, border: 'none', borderRadius: 10, padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────
var SHARE_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📸', url: function() { return 'https://www.instagram.com/'; } },
  { id: 'tiktok', label: 'TikTok', color: '#69C9D0', icon: '🎵', url: function() { return 'https://www.tiktok.com/'; } },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: '📘', url: function(l) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(l); } },
  { id: 'snapchat', label: 'Snapchat', color: '#FFFC00', icon: '👻', url: function(l) { return 'https://www.snapchat.com/scan?attachmentUrl=' + encodeURIComponent(l); } },
  { id: 'x', label: 'X/Twitter', color: '#14171A', icon: '𝕏', url: function(l, t) { return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(l) + '&text=' + encodeURIComponent('🔥 Watch LIVE: ' + t); } },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: '💬', url: function(l, t) { return 'https://wa.me/?text=' + encodeURIComponent('🔥 Watch LIVE: ' + t + ' ' + l); } },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: '▶', url: function() { return 'https://youtube.com/'; } },
  { id: 'kick', label: 'Kick', color: '#53FC18', icon: '⚡', url: function() { return 'https://kick.com/'; } },
];

function ShareModal(props) {
  var open = props.open;
  var onClose = props.onClose;
  var streamId = props.streamId || 'room_dc2026_1';
  var title = props.title || '';
  var [copied, setCopied] = useState(false);
  var link = 'https://seewhylive.online/watch/' + streamId;

  function copy() {
    try { navigator.clipboard.writeText(link); } catch(e) {}
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2200);
  }

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="📤 SHARE TO THE WORLD">
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Outsiders get {PREVIEW_SECONDS}s free preview then see the download prompt. Built-in growth engine.</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(201,168,76,0.2)' }}>
        <span style={{ color: C.gold, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{link}</span>
        <button onClick={copy} style={{ background: copied ? C.lime : C.gold, border: 'none', borderRadius: 5, padding: '4px 12px', color: C.charcoal, fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>{copied ? '✓ COPIED' : 'COPY'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {SHARE_PLATFORMS.map(function(p) {
          return (
            <button key={p.id} onClick={function() { var u = p.url(link, title); if (u) { try { window.open(u, '_blank'); } catch(e) {} } }} style={{ background: p.color === '#FFFC00' ? p.color : p.color + '22', border: '1px solid ' + p.color + '55', borderRadius: 10, padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span style={{ color: p.color === '#FFFC00' ? '#000' : p.color, fontSize: 9, fontWeight: 800 }}>{p.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ padding: '10px 14px', background: 'rgba(200,240,48,0.07)', border: '1px solid ' + C.lime + '33', borderRadius: 8, color: C.lime, fontSize: 11 }}>
        🚀 Every share markets to new viewers automatically — {PREVIEW_SECONDS}s hook then install prompt
      </div>
    </Modal>
  );
}

// ─── ROOM TOKEN MODAL ─────────────────────────────────────────────────────────
function RoomTokenModal(props) {
  var token = props.token;
  var dispatch = props.dispatch;
  var onClose = props.onClose;
  var [copied, setCopied] = useState(false);
  var mins = Math.floor(Math.max(0, token.expiresAt - Date.now()) / 60000);

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title="🔑 ROOM TOKEN" bottom>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>JWT Session Token — Expires in {mins}m</div>
        <div style={{ color: C.lime, fontSize: 10, wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 12 }}>{token.token}</div>
        <button onClick={function() { try { navigator.clipboard.writeText(token.token); } catch(e) {} setCopied(true); setTimeout(function() { setCopied(false); }, 2000); }} style={{ width: '100%', padding: '8px', background: copied ? '#2d6a4f' : C.gold, color: copied ? '#fff' : C.charcoal, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
          {copied ? '✓ Copied' : 'Copy Token'}
        </button>
      </div>
      <div style={{ color: C.muted, fontSize: 11, marginBottom: 14 }}>Anti-sharing device-bound token. Auto-expires 60m. {10 - token.refreshCount} refreshes remaining today.</div>
      <Btn onClick={function() {
        dispatch({ type: 'SET_ROOM_TOKEN', payload: Object.assign({}, token, { token: 'jwt_' + tsNow(), expiresAt: tsNow() + 3600000, refreshCount: token.refreshCount + 1 }) });
        dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '🔑 Token refreshed!' } });
      }} variant="gold" full>Refresh Token</Btn>
    </Modal>
  );
}

// ─── BREAKOUT ROOMS MODAL ─────────────────────────────────────────────────────
function BreakoutRoomsModal(props) {
  var dispatch = props.dispatch;
  var breakoutRooms = props.breakoutRooms;
  var onClose = props.onClose;
  var [name, setName] = useState('');
  var [showForm, setShowForm] = useState(false);

  function create() {
    if (!name.trim() || breakoutRooms.length >= MAX_BREAKOUT_ROOMS) return;
    dispatch({ type: 'SET_BREAKOUT_ROOMS', payload: breakoutRooms.concat([{ id: 'br_' + tsNow(), name: name, participants: [] }]) });
    setName(''); setShowForm(false);
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '🚪 "' + name + '" breakout room created!' } });
  }

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title={'🚪 BREAKOUT ROOMS (' + breakoutRooms.length + '/' + MAX_BREAKOUT_ROOMS + ')'} bottom>
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <input value={name} onChange={function(e) { setName(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') create(); }} placeholder="Room name..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={create} variant="gold" style={{ flex: 1 }}>Create</Btn>
            <Btn onClick={function() { setShowForm(false); }} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
          </div>
        </div>
      )}
      {!showForm && breakoutRooms.length < MAX_BREAKOUT_ROOMS && (
        <Btn onClick={function() { setShowForm(true); }} variant="dark" full style={{ marginBottom: 14 }}>+ Create Breakout Room</Btn>
      )}
      {breakoutRooms.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No breakout rooms yet. Create one above.</div>}
      {breakoutRooms.map(function(r) {
        return (
          <div key={r.id} style={{ background: C.slate2, borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: C.white, fontWeight: 700 }}>{r.name}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{r.participants.length} participants</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn small variant="gold">Join</Btn>
              <button onClick={function() { dispatch({ type: 'SET_BREAKOUT_ROOMS', payload: breakoutRooms.filter(function(x) { return x.id !== r.id; }) }); }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

// ─── LIVE POLL MODAL ──────────────────────────────────────────────────────────
function LivePollModal(props) {
  var dispatch = props.dispatch;
  var onClose = props.onClose;
  var [q, setQ] = useState('');
  var [opts, setOpts] = useState(['', '', '', '']);
  var [active, setActive] = useState(null);

  function startPoll() {
    var validOpts = opts.filter(function(o) { return o.trim(); });
    if (!q.trim() || validOpts.length < 2) return;
    setActive({ question: q, options: validOpts.map(function(o) { return { text: o, votes: rand(0, 40) }; }), total: 100 });
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '📊 Poll started: "' + q + '"' } });
    setQ(''); setOpts(['', '', '', '']);
  }

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title="📊 LIVE POLL" bottom>
      {!active ? (
        <div>
          <input value={q} onChange={function(e) { setQ(e.target.value); }} placeholder="Poll question..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }} />
          {opts.map(function(opt, i) {
            return <input key={i} value={opt} onChange={function(e) { var n = opts.slice(); n[i] = e.target.value; setOpts(n); }} placeholder={'Option ' + (i + 1)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }} />;
          })}
          <Btn onClick={startPoll} variant="gold" full style={{ marginTop: 6 }}>Start Poll</Btn>
        </div>
      ) : (
        <div>
          <div style={{ color: C.white, fontWeight: 800, fontSize: 15, marginBottom: 14 }}>{active.question}</div>
          {active.options.map(function(opt, i) {
            var pct = active.total > 0 ? Math.floor(opt.votes * 100 / active.total) : 0;
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: C.white }}>{opt.text}</span>
                  <span style={{ color: C.gold, fontWeight: 800 }}>{pct}% ({opt.votes})</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: i === 0 ? C.gold : i === 1 ? C.burgundy : i === 2 ? C.cyan : C.lime, transition: 'width 0.3s', minWidth: 4 }} />
                </div>
              </div>
            );
          })}
          <Btn onClick={function() { setActive(null); }} variant="ghost" full style={{ marginTop: 8 }}>Close Poll</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── SCREEN SHARE MODAL ───────────────────────────────────────────────────────
function ScreenShareModal(props) {
  var dispatch = props.dispatch;
  var active = props.active;
  var onClose = props.onClose;

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title="🖥️ SCREEN SHARE" bottom>
      {!active ? (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {[
              { label: '🎯 Presenter Mode', desc: 'Camera in corner, screen fills stage' },
              { label: '📊 Slides Only', desc: 'Full screen presentation, camera hidden' },
              { label: '📱 App Window', desc: 'Share a single application window' },
            ].map(function(mode) {
              return (
                <button key={mode.label} onClick={function() { dispatch({ type: 'SET_SCREEN_SHARE', payload: true }); dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '🖥️ ' + mode.label + ' active!' } }); onClose(); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '14px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ color: C.gold, fontWeight: 800, fontSize: 13 }}>{mode.label}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{mode.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid ' + C.green + '44', borderRadius: 10, padding: 14, marginBottom: 14, textAlign: 'center' }}>
            <div style={{ color: C.green, fontWeight: 800, marginBottom: 4 }}>✓ Screen Sharing Active</div>
            <div style={{ color: C.muted, fontSize: 12 }}>All viewers can see your screen. Your camera stays in corner.</div>
          </div>
          <Btn onClick={function() { dispatch({ type: 'SET_SCREEN_SHARE', payload: false }); dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '⏹ Screen sharing stopped' } }); onClose(); }} variant="danger" full>Stop Sharing</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── AUTO-CLIP / PODCAST MODAL ────────────────────────────────────────────────
function AutoClipModal(props) {
  var dispatch = props.dispatch;
  var onClose = props.onClose;
  var [dur, setDur] = useState(30);
  var [creating, setCreating] = useState(false);
  var [destinations, setDestinations] = useState(['spotify', 'apple', 'soundcloud']);

  var DESTS = [
    { id: 'spotify', label: 'Spotify', color: '#1DB954' },
    { id: 'apple', label: 'Apple Podcasts', color: '#FC3C44' },
    { id: 'soundcloud', label: 'SoundCloud', color: '#FF5500' },
    { id: 'podbean', label: 'Podbean', color: '#F70' },
    { id: 'youtube', label: 'YouTube', color: '#FF0000' },
  ];

  function toggleDest(id) {
    setDestinations(function(d) {
      return d.includes(id) ? d.filter(function(x) { return x !== id; }) : d.concat([id]);
    });
  }

  function create() {
    setCreating(true);
    setTimeout(function() {
      setCreating(false);
      var eps = rand(90, 99);
      dispatch({ type: 'ADD_CLIP', payload: { id: 'clip_' + tsNow(), title: dur + 'min Episode — ' + new Date().toLocaleDateString(), dur: dur, ts: tsNow(), dests: destinations } });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '🎙 Episode created! Publishing to ' + destinations.length + ' platforms... You earn 100% of podcast revenue.' } });
      onClose();
    }, 2000);
  }

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title="🎬 AUTO-CLIP TO PODCAST" bottom>
      <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
        Every stream becomes a podcast. Every podcast becomes a newsletter.<br />
        <span style={{ color: C.gold, fontWeight: 800 }}>You earn 100%</span> of podcast revenue (separate from stream tips).
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>CLIP DURATION</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={function() { setDur(Math.max(5, dur - 5)); }} style={{ background: C.slate, border: '1px solid rgba(255,255,255,0.15)', color: C.gold, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 18, fontWeight: 800 }}>−</button>
          <div style={{ flex: 1, textAlign: 'center', color: C.gold, fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2 }}>{dur}m</div>
          <button onClick={function() { setDur(Math.min(60, dur + 5)); }} style={{ background: C.slate, border: '1px solid rgba(255,255,255,0.15)', color: C.gold, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 18, fontWeight: 800 }}>+</button>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>PUBLISH TO</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DESTS.map(function(d) {
            var on = destinations.includes(d.id);
            return (
              <button key={d.id} onClick={function() { toggleDest(d.id); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: on ? d.color + '22' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (on ? d.color + '66' : 'rgba(255,255,255,0.08)'), borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>
                <span style={{ color: on ? d.color : C.muted, fontWeight: on ? 800 : 400, fontSize: 13 }}>{d.label}</span>
                <span style={{ color: on ? d.color : C.muted }}>{on ? '✓' : '○'}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Btn onClick={create} variant="gold" full disabled={creating || destinations.length === 0}>
        {creating ? '⏳ Creating Episode...' : '🎙 Create & Publish Episode'}
      </Btn>
    </Modal>
  );
}

// ─── MEDIA EMBED MODAL ────────────────────────────────────────────────────────
function MediaEmbedModal(props) {
  var dispatch = props.dispatch;
  var onClose = props.onClose;
  var [url, setUrl] = useState('');
  var [type, setType] = useState('youtube');

  var TYPES = [
    { id: 'youtube', label: 'YouTube' }, { id: 'vimeo', label: 'Vimeo' },
    { id: 'mp4', label: 'MP4 Video' }, { id: 'canva', label: 'Canva Design' },
    { id: 'google-docs', label: 'Google Docs' }, { id: 'miro', label: 'Miro Board' },
  ];

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title="📺 EMBED MEDIA IN STREAM" bottom>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>MEDIA TYPE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TYPES.map(function(t) {
            return <button key={t.id} onClick={function() { setType(t.id); }} style={{ background: type === t.id ? C.gold : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 20, padding: '5px 12px', color: type === t.id ? C.charcoal : C.white, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{t.label}</button>;
          })}
        </div>
      </div>
      <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>URL OR EMBED CODE</label>
      <textarea value={url} onChange={function(e) { setUrl(e.target.value); }} placeholder="Paste URL or embed code..."
        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 12, boxSizing: 'border-box', minHeight: 80, resize: 'none', marginBottom: 14, fontFamily: 'monospace' }} />
      <Btn onClick={function() { if (url.trim()) { dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '📺 ' + type + ' media embedding as stream overlay...' } }); setUrl(''); onClose(); } }} variant="gold" full disabled={!url.trim()}>Embed in Stream</Btn>
      <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>Appears as a corner overlay. Viewers can tap to expand full-screen.</div>
    </Modal>
  );
}

// ─── RAISE HAND MODAL ─────────────────────────────────────────────────────────
function RaiseHandModal(props) {
  var dispatch = props.dispatch;
  var queue = props.queue;
  var onClose = props.onClose;

  if (!props.open) return null;
  return (
    <Modal open={props.open} onClose={onClose} title={'✋ RAISE HAND QUEUE (' + queue.length + ')'} bottom>
      {queue.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No one waiting to speak.<br/><span style={{ fontSize: 11 }}>Viewers can tap "Raise Hand" to request the stage.</span></div>}
      {queue.map(function(req, i) {
        return (
          <div key={i} style={{ background: C.slate2, borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.gold, fontWeight: 800 }}>{req.name}</div>
                <div style={{ color: C.muted, fontSize: 10 }}>Waiting {Math.floor((tsNow() - req.timestamp) / 1000)}s</div>
              </div>
              {req.isFM && <GoldBadge>FM</GoldBadge>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={function() { dispatch({ type: 'SET_RAISE_HAND_QUEUE', payload: queue.filter(function(_, j) { return j !== i; }) }); dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '✅ ' + req.name + ' approved to speak!' } }); }} variant="lime" style={{ flex: 1 }}>Approve</Btn>
              <Btn onClick={function() { dispatch({ type: 'SET_RAISE_HAND_QUEUE', payload: queue.filter(function(_, j) { return j !== i; }) }); }} variant="ghost" style={{ flex: 1 }}>Decline</Btn>
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
function NotificationsPanel(props) {
  var notifications = props.notifications;
  var dispatch = props.dispatch;
  var onClose = props.onClose;

  var ICONS = { tip: '💰', follower: '👥', battle: '⚔️', system: '📢', fm: '👑', clip: '🎬' };

  return (
    <div style={{ minHeight: '100vh', background: C.charcoal, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(5,3,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.white, fontSize: 24, cursor: 'pointer' }}>‹</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2, flex: 1 }}>🔔 NOTIFICATIONS</div>
        <button onClick={function() { dispatch({ type: 'MARK_NOTIFS_READ' }); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer' }}>Mark all read</button>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            No notifications yet.
          </div>
        )}
        {notifications.map(function(n) {
          return (
            <div key={n.id} onClick={function() { dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications.map(function(x) { return x.id === n.id ? Object.assign({}, x, { read: true }) : x; }) }); }} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', opacity: n.read ? 0.6 : 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.read ? 'rgba(255,255,255,0.05)' : C.burgundy + '33', border: '1px solid ' + (n.read ? 'rgba(255,255,255,0.08)' : C.burgundy), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ICONS[n.type] || '📢'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: n.read ? C.muted : C.white, fontSize: 13, fontWeight: n.read ? 400 : 700 }}>{n.text}</div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{Math.floor((tsNow() - n.ts) / 60000)}m ago</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: 6 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WALLET PAGE ──────────────────────────────────────────────────────────────
function WalletPage(props) {
  var wallet = props.wallet;
  var dispatch = props.dispatch;
  var onClose = props.onClose;
  var [tab, setTab] = useState('balance');

  return (
    <div style={{ minHeight: '100vh', background: C.charcoal, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(5,3,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.white, fontSize: 24, cursor: 'pointer' }}>‹</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>💳 CREATOR WALLET</div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['balance', 'history', 'payout'].map(function(t) {
          return <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? C.gold : C.muted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent' }}>{t}</button>;
        })}
      </div>
      <div style={{ padding: 16 }}>
        {tab === 'balance' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,' + C.gold + '22,' + C.burgundy + '33)', border: '1px solid ' + C.gold + '44', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>AVAILABLE BALANCE</div>
              <div style={{ color: C.lime, fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2 }}>${(Math.floor(wallet.availableCents) / 100).toFixed(2)}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Includes 90% of all tips received</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Pending', value: '$' + (Math.floor(wallet.pendingCents) / 100).toFixed(2), color: C.orange, icon: '⏳' },
                { label: 'Lifetime', value: '$' + (Math.floor(wallet.lifetimeCents) / 100).toFixed(2), color: C.gold, icon: '🏆' },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{ background: C.slate, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ color: s.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginTop: 4 }}>{s.value}</div>
                    <div style={{ color: C.muted, fontSize: 10 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
            <Btn variant="lime" full onClick={function() { dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '✅ Payout request submitted! Funds arrive in 2-3 business days.' } }); }}>💸 REQUEST PAYOUT</Btn>
            <div style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>Last payout: {wallet.lastPayoutDate}</div>
          </div>
        )}
        {tab === 'history' && (
          <div>
            {[
              { type: 'tip', from: 'JoyceM_LLC', amount: 25, ts: tsNow() - 120000 },
              { type: 'tip', from: 'WestCoast_Ace', amount: 10, ts: tsNow() - 300000 },
              { type: 'tip', from: 'DominoKing_WA', amount: 50, ts: tsNow() - 900000 },
              { type: 'payout', from: 'Platform', amount: -850, ts: tsNow() - 86400000 },
            ].map(function(tx, i) {
              var credit = tx.type === 'tip' ? CREATOR_SPLIT(tx.amount) : tx.amount;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 22 }}>{tx.type === 'tip' ? '💰' : '💸'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{tx.type === 'tip' ? 'Tip from @' + tx.from : 'Payout'}</div>
                    <div style={{ color: C.muted, fontSize: 10 }}>{Math.floor((tsNow() - tx.ts) / 60000)}m ago {tx.type === 'tip' ? '· 90% creator split' : ''}</div>
                  </div>
                  <div style={{ color: credit >= 0 ? C.lime : C.red, fontWeight: 800 }}>{credit >= 0 ? '+' : ''}${Math.abs(credit).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'payout' && (
          <div>
            <div style={{ background: C.slate, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ color: C.gold, fontWeight: 700, marginBottom: 8 }}>Payout Methods</div>
              {['PayPal', 'Cash App', 'Venmo', 'Zelle', 'ACH Direct Deposit'].map(function(m) {
                return (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: C.white, fontSize: 13 }}>{m}</span>
                    <Btn small variant="ghost">Connect</Btn>
                  </div>
                );
              })}
            </div>
            <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.6, padding: '0 4px' }}>
              Payouts process within 2-3 business days. Minimum $10 to request. You keep 90% of all tips — platform takes 10% to keep the lights on.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANALYTICS DASHBOARD ──────────────────────────────────────────────────────
function AnalyticsDashboard(props) {
  var analytics = props.analytics;
  var onClose = props.onClose;
  var [tab, setTab] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: C.charcoal, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(5,3,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.white, fontSize: 24, cursor: 'pointer' }}>‹</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>📊 ANALYTICS</div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['overview', 'revenue', 'audience', 'guardian'].map(function(t) {
          return <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? C.gold : C.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent' }}>{t}</button>;
        })}
      </div>
      <div style={{ padding: 16 }}>
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Views', value: fmtK(analytics.totalViews), icon: '👁', color: C.gold },
                { label: 'Peak Viewers', value: fmtK(analytics.peakViewers), icon: '🔴', color: C.red },
                { label: 'Avg Watch', value: analytics.avgWatchTime + 's', icon: '⏱', color: C.cyan },
                { label: 'Stream Hours', value: analytics.streamHours + 'h', icon: '📡', color: C.lime },
                { label: 'New Followers', value: '+' + analytics.newFollowers, icon: '👥', color: C.blue },
                { label: 'Elite Points', value: fmtK(analytics.elitePoints), icon: '🏆', color: C.gold },
              ].map(function(stat) {
                return (
                  <div key={stat.label} style={{ background: C.slate, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ color: stat.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1 }}>{stat.value}</div>
                    <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{stat.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>WEEKLY VIEWS (7-DAY)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 16 }}>
              {analytics.weeklyViews.map(function(v, i) {
                var maxV = Math.max.apply(null, analytics.weeklyViews);
                var pct = Math.floor(v * 100 / maxV);
                var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', height: pct + '%', background: i === analytics.weeklyViews.length - 1 ? C.gold : C.burgundy, borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                    <div style={{ color: C.muted, fontSize: 9 }}>{days[i]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>CONNECTION QUALITY</div>
            <div style={{ background: C.slate, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Avg bitrate</span>
                <span style={{ color: C.lime, fontWeight: 800, fontSize: 12 }}>{analytics.avgBitrate} kbps</span>
              </div>
            </div>
          </div>
        )}
        {tab === 'revenue' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,' + C.gold + '22,' + C.burgundy + '22)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 20, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>TIPS TODAY (your 90%)</div>
              <div style={{ color: C.lime, fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 2 }}>${CREATOR_SPLIT(analytics.tipsToday)}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{analytics.tipCount} tips · Platform: ${PLATFORM_SPLIT(analytics.tipsToday)}</div>
            </div>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>TOP TIPPERS TODAY</div>
            {analytics.topTippers.map(function(t, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: C.gold, fontWeight: 800, fontSize: 16, width: 24 }}>#{i + 1}</span>
                  <Avatar name={t.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.white, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ color: C.muted, fontSize: 10 }}>Creator gets ${CREATOR_SPLIT(t.amount)}</div>
                  </div>
                  <div style={{ color: C.lime, fontWeight: 800, fontSize: 16 }}>${t.amount}</div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'audience' && (
          <div>
            <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
              Geo & demographics data<br />
              <span style={{ fontSize: 11 }}>Available after 1K cumulative views.</span>
            </div>
          </div>
        )}
        {tab === 'guardian' && (
          <div>
            <div style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid ' + C.green + '33', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ color: C.green, fontWeight: 800, marginBottom: 4 }}>✓ Guardian AI — Active</div>
              <div style={{ color: C.muted, fontSize: 12 }}>{analytics.guardianEvents} events flagged today</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Flag threshold', value: (GUARDIAN_FLAG * 100) + '% confidence → ⚑ Flag' },
                { label: 'Mute threshold', value: (GUARDIAN_WARN * 100) + '% confidence → 🔇 Mute' },
                { label: 'Ban threshold', value: (GUARDIAN_AUTOBAN * 100) + '% confidence → 🚫 Ban' },
              ].map(function(r) {
                return (
                  <div key={r.label} style={{ background: C.slate, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.muted, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>{r.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCHEDULE MANAGER ─────────────────────────────────────────────────────────
function ScheduleManager(props) {
  var schedule = props.schedule;
  var dispatch = props.dispatch;
  var onClose = props.onClose;
  var [showAdd, setShowAdd] = useState(false);
  var [newTitle, setNewTitle] = useState('');
  var [newDate, setNewDate] = useState('');
  var [newTime, setNewTime] = useState('');
  var [newRecurring, setNewRecurring] = useState('none');

  function addShow() {
    if (!newTitle.trim() || !newDate || !newTime) return;
    var newItem = { id: 'sch_' + tsNow(), title: newTitle, date: newDate, time: newTime + ' PST', recurring: newRecurring, reminder: true };
    dispatch({ type: 'SET_SCHEDULE', payload: schedule.concat([newItem]) });
    setShowAdd(false); setNewTitle(''); setNewDate(''); setNewTime('');
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '📅 ' + newTitle + ' scheduled!' } });
  }

  return (
    <div style={{ minHeight: '100vh', background: C.charcoal, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(5,3,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.white, fontSize: 24, cursor: 'pointer' }}>‹</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2, flex: 1 }}>📅 SCHEDULE</div>
        <Btn onClick={function() { setShowAdd(true); }} variant="gold" small>+ NEW</Btn>
      </div>
      <div style={{ padding: 16 }}>
        {showAdd && (
          <div style={{ background: C.slate, border: '1px solid rgba(201,168,76,0.25)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ color: C.gold, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 14 }}>NEW SHOW</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>SHOW TITLE</label>
              <input value={newTitle} onChange={function(e) { setNewTitle(e.target.value); }} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>DATE</label>
                <input type="date" value={newDate} onChange={function(e) { setNewDate(e.target.value); }} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>TIME</label>
                <input type="time" value={newTime} onChange={function(e) { setNewTime(e.target.value); }} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>RECURRING</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['none', 'daily', 'weekly', 'monthly'].map(function(r) {
                return <button key={r} onClick={function() { setNewRecurring(r); }} style={{ flex: 1, padding: '7px 0', background: newRecurring === r ? C.gold : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, color: newRecurring === r ? C.charcoal : C.white, fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize' }}>{r}</button>;
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn onClick={addShow} variant="gold" style={{ flex: 1 }}>Save Show</Btn>
              <Btn onClick={function() { setShowAdd(false); }} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
        )}
        {schedule.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            No shows scheduled. Add one above.
          </div>
        )}
        {schedule.map(function(item) {
          return (
            <div key={item.id} style={{ background: C.slate, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>{item.title}</div>
                <button onClick={function() { dispatch({ type: 'SET_SCHEDULE', payload: schedule.filter(function(s) { return s.id !== item.id; }) }); }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>📅 {item.date} · ⏰ {item.time}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.recurring !== 'none' && <Badge color={C.blue}>{item.recurring}</Badge>}
                {item.reminder && <Badge color="rgba(255,255,255,0.1)">🔔 Reminder</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GUEST CELL ───────────────────────────────────────────────────────────────
function GuestCell(props) {
  var guest = props.guest;
  var expanded = props.expanded;
  var isHost = props.isHost;
  var onExpand = props.onExpand;
  var onAction = props.onAction;

  return (
    <div onClick={onExpand} style={{
      position: 'relative',
      background: isHost
        ? 'linear-gradient(135deg,' + C.burgundy + '44,' + C.charcoal + ')'
        : 'linear-gradient(135deg,' + C.slate2 + ',' + C.charcoal + ')',
      border: isHost ? '2px solid ' + C.gold : expanded ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: expanded ? 14 : 10, overflow: 'hidden', cursor: 'pointer',
      aspectRatio: expanded ? '16/9' : '1/1', minHeight: expanded ? 150 : 68,
      transition: 'all 0.3s', boxShadow: isHost ? '0 0 20px rgba(201,168,76,0.2)' : 'none',
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Avatar name={guest.name} size={expanded ? 48 : 26} isHost={isHost} isFM={guest.isFM} />
        {expanded && <span style={{ color: C.white, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', textAlign: 'center', padding: '0 4px' }}>{guest.name}</span>}
      </div>
      <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {isHost && <GoldBadge>HOST</GoldBadge>}
        {guest.isFM && !isHost && <GoldBadge>FM</GoldBadge>}
        {guest.label && <Badge color={C.blue}>{guest.label}</Badge>}
      </div>
      {guest.isMuted && <div style={{ position: 'absolute', bottom: 4, right: 4 }}><Badge color="rgba(0,0,0,0.7)">🔇</Badge></div>}
      {onAction && expanded && (
        <button onClick={function(e) { e.stopPropagation(); onAction(guest); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 16, cursor: 'pointer', padding: '2px 8px' }}>⋮</button>
      )}
    </div>
  );
}

// ─── CONNECTION QUALITY BAR ───────────────────────────────────────────────────
function ConnectionBar(props) {
  var q = props.quality;
  var syncOffset = props.syncOffset;
  var color = q.quality === 'excellent' ? C.green : q.quality === 'good' ? C.gold : C.red;
  return (
    <div style={{ padding: '6px 14px', background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ color: C.muted }}>Connection: <span style={{ color: color, fontWeight: 800 }}>{q.quality.toUpperCase()}</span></span>
        <span style={{ color: C.muted }}>{q.latency}ms · {q.bitrate}kbps · {q.packetLoss}% loss</span>
        {syncOffset !== undefined && <span style={{ color: C.gold }}>Sync: {Math.abs(syncOffset)}ms {syncOffset > 0 ? 'ahead' : 'behind'}</span>}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', height: 3, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: Math.min(100, Math.floor(q.bitrate / 5000 * 100)) + '%', height: '100%', background: color, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

// ─── LIVE ROOM ────────────────────────────────────────────────────────────────
function LiveRoom(props) {
  var state = props.state;
  var dispatch = props.dispatch;
  var room = state.liveRoom;
  var [tab, setTab] = useState('chat');
  var [expanded, setExpanded] = useState(null);
  var [msgInput, setMsgInput] = useState('');
  var [guestAction, setGuestAction] = useState(null);
  var [payOpen, setPayOpen] = useState(false);
  var [shareOpen, setShareOpen] = useState(false);
  var chatRef = useRef(null);

  // Live viewer counter
  useEffect(function() {
    var t = setInterval(function() {
      dispatch({ type: 'SET_VIEWER_COUNT', payload: Math.max(1, room.viewers + rand(-3, 4)) });
    }, 4000);
    return function() { clearInterval(t); };
  }, [dispatch, room.viewers]);

  // Stream duration timer
  useEffect(function() {
    var t = setInterval(function() {
      dispatch({ type: 'SET_STREAM_DURATION', payload: room.duration + 1 });
    }, 1000);
    return function() { clearInterval(t); };
  }, [dispatch, room.duration]);

  // Auto-scroll chat
  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [state.messages]);

  // Simulated incoming chat messages
  useEffect(function() {
    var names = ['BonesDave', 'CaliBones', 'WashingtonAce', 'NYDomino', 'ATL_Pro'];
    var msgs = ['Lets GO!! 🔥', 'WA ALL DAY 🏴', 'This stream is CRAZY', 'Who winning rn??', 'Drop $50 on WA!!', 'GM from Texas 🤠'];
    var t = setInterval(function() {
      if (Math.random() > 0.6) {
        var name = names[rand(0, names.length - 1)];
        var msg = { id: tsNow(), user: name, text: msgs[rand(0, msgs.length - 1)], isFM: Math.random() > 0.6, ts: tsNow() };
        dispatch({ type: 'SET_MESSAGES', payload: state.messages.slice(-30).concat([msg]) });
      }
    }, 3500);
    return function() { clearInterval(t); };
  }, [dispatch, state.messages]);

  function sendMsg() {
    if (!msgInput.trim()) return;
    var filtered = filterMessageWithGuardianAI(msgInput);
    if (filtered.flagged) {
      dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: '⚠️ Guardian AI: Message ' + filtered.severity + '. Please revise.' } });
      return;
    }
    var msg = { id: tsNow(), user: state.currentUser.name, text: msgInput, isFM: state.currentUser.isFM, ts: tsNow() };
    dispatch({ type: 'SET_MESSAGES', payload: state.messages.concat([msg]) });
    setMsgInput('');
  }

  var displayGuests = expanded ? [] : state.guests.slice(0, 8);
  var cols = Math.min(displayGuests.length + 1, 4);
  var sponsor = state.sponsorOverlay;
  var unreadCount = state.notifications.filter(function(n) { return !n.read; }).length;

  return (
    <div style={{ minHeight: '100vh', background: C.charcoal, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(5,3,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'home' }); }} style={{ background: 'none', border: 'none', color: C.white, fontSize: 24, cursor: 'pointer' }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.white, fontWeight: 800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
            <LiveDot />
            <span style={{ color: C.muted, fontSize: 11 }}>{fmtDuration(room.duration)} · 👁 {fmtK(room.viewers)}</span>
            {state.sponsorOverlay.active && <Badge color={C.orange}>💼 {state.sponsorOverlay.name}</Badge>}
            {state.screenShareActive && <Badge color={C.cyan}>🖥️ SHARE</Badge>}
            {state.greenroomReady && <Badge color={C.green}>🟢 LIVE</Badge>}
          </div>
        </div>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'notifications' }); }} style={{ background: 'none', border: 'none', color: unreadCount > 0 ? C.gold : C.muted, fontSize: 20, cursor: 'pointer', position: 'relative' }}>
          🔔
          {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: C.red, color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
        </button>
        <button onClick={function() { setShareOpen(true); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 20, cursor: 'pointer' }}>📤</button>
        <button onClick={function() { setPayOpen(true); }} style={{ background: C.lime, border: 'none', borderRadius: 20, color: C.charcoal, fontWeight: 800, fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>💰 TIP</button>
      </div>

      {/* Sponsor overlay banner */}
      {sponsor.active && sponsor.name && (
        <div style={{ background: 'rgba(255,109,0,0.15)', borderBottom: '1px solid rgba(255,109,0,0.3)', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: C.orange, fontSize: 11, fontWeight: 800 }}>💼 Presented by {sponsor.name}</span>
          {sponsor.ctaText && <span style={{ color: C.orange, fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}>{sponsor.ctaText} →</span>}
        </div>
      )}

      <ConnectionBar quality={state.connection} syncOffset={state.watchPartySyncOffset} />
      <ConnectionStatusBanner status={state.connectionStatus} />

      {/* Guest grid */}
      <div style={{ padding: 10, background: C.slate2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ',1fr)', gap: 8, transition: 'all 0.3s' }}>
          <GuestCell
            guest={{ name: room.host, isFM: true, isMuted: false, isSpotlighted: true, label: '', isCameraOff: false }}
            isHost expanded={expanded === 'host' || !expanded}
            onExpand={function() { setExpanded(expanded === 'host' ? null : 'host'); }}
          />
          {displayGuests.map(function(g) {
            return <GuestCell key={g.id} guest={g} expanded={expanded === g.id} onExpand={function() { setExpanded(expanded === g.id ? null : g.id); }} onAction={setGuestAction} />;
          })}
        </div>

        {/* Host controls — Row 1: Room management */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {[
            { label: '👥 Invite', modal: 'invite-guests' },
            { label: '📡 RTMP', modal: 'rtmp' },
            { label: '🔑 Token', modal: 'room-token' },
            { label: '🔗 Link', modal: 'room-link' },
            { label: '🟢 Green Room', modal: 'green-room' },
          ].map(function(ctrl) {
            return <button key={ctrl.label} onClick={function() { dispatch({ type: 'SET_MODAL', payload: ctrl.modal }); }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '5px 12px', color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>{ctrl.label}</button>;
          })}
        </div>

        {/* Host controls — Row 2: Stream tools */}
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {[
            { label: '⚙️ WebRTC', modal: 'webrtc-config' },
            { label: '💼 Sponsor', modal: 'sponsor-overlay' },
            { label: '🖥️ Screen', modal: 'screen-share' },
            { label: '📺 Embed', modal: 'media-embed' },
            { label: '🎙 Podcast', modal: 'auto-clip' },
          ].map(function(ctrl) {
            return <button key={ctrl.label} onClick={function() { dispatch({ type: 'SET_MODAL', payload: ctrl.modal }); }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '5px 12px', color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>{ctrl.label}</button>;
          })}
        </div>

        {/* Host controls — Row 3: Live engagement (host only) */}
        {state.currentUser.isHost && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {[
              { label: '✋ Raise Hand', modal: 'raise-hand' },
              { label: '⚔️ PK Battle', modal: 'pk-battle' },
              { label: '📊 Poll', modal: 'live-poll' },
              { label: '🚪 Breakout', modal: 'breakout-rooms' },
            ].map(function(ctrl) {
              return <button key={ctrl.label} onClick={function() { dispatch({ type: 'SET_MODAL', payload: ctrl.modal }); }} style={{ background: 'rgba(128,0,32,0.25)', border: '1px solid rgba(128,0,32,0.5)', borderRadius: 20, padding: '5px 12px', color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>{ctrl.label}</button>;
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['chat', 'guests', 'info'].map(function(t) {
          return <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? C.gold : C.muted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent' }}>{t}</button>;
        })}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 240 }}>
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {state.messages.length === 0 && <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Chat is quiet... say something! 👋</div>}
              {state.messages.slice(-40).map(function(m) {
                return (
                  <div key={m.id}>
                    <span style={{ color: m.isFM ? C.gold : C.muted, fontSize: 11, fontWeight: 800 }}>
                      {m.isFM ? '✓ ' : ''}{m.user}
                    </span>
                    <span style={{ color: C.white, fontSize: 13, marginLeft: 6 }}>{m.text}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '10px 12px', display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <input value={msgInput} onChange={function(e) { setMsgInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') sendMsg(); }} placeholder="Say something..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 20, padding: '10px 16px', color: C.white, fontSize: 13 }} />
              <button onClick={sendMsg} style={{ background: C.burgundy, border: 'none', borderRadius: 20, color: '#fff', padding: '10px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>→</button>
            </div>
          </div>
        )}
        {tab === 'guests' && (
          <div style={{ padding: 14, overflowY: 'auto' }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>{state.guests.length}/{MAX_PANEL_GUESTS} guests on stage</div>
            {state.guests.map(function(g) {
              return (
                <div key={g.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Avatar name={g.name} size={32} isFM={g.isFM} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{g.name}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                      {g.isFM && <GoldBadge>FM</GoldBadge>}
                      {g.label && <Badge color={C.blue}>{g.label}</Badge>}
                      {g.isMuted && <Badge color="#333">🔇</Badge>}
                    </div>
                  </div>
                  <button onClick={function() { dispatch({ type: 'UPDATE_GUEST', payload: Object.assign({}, g, { isMuted: !g.isMuted }) }); }} style={{ background: 'none', border: 'none', color: g.isMuted ? C.red : C.muted, cursor: 'pointer', fontSize: 16 }}>
                    {g.isMuted ? '🔇' : '🎙'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'info' && (
          <div style={{ padding: 14, overflowY: 'auto' }}>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{room.title}</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Host: @{room.host}</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
              Real money directly to the creator. They keep <span style={{ color: C.lime, fontWeight: 800 }}>90%</span> instantly — no virtual gifts, no middleman.
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.muted, fontSize: 11 }}>WebRTC Config</span>
                <span style={{ color: C.gold, fontSize: 11, fontFamily: 'monospace' }}>{state.webrtcConfig.codec} · {state.webrtcConfig.resolution} · {state.webrtcConfig.fps}fps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.muted, fontSize: 11 }}>Bitrate</span>
                <span style={{ color: C.gold, fontSize: 11 }}>{state.webrtcConfig.bitrate}</span>
              </div>
            </div>
            <Btn onClick={function() { setPayOpen(true); }} variant="lime" full>💰 TIP @{room.host}</Btn>
          </div>
        )}
      </div>

      {/* Guest action sheet */}
      {guestAction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }} onClick={function() { setGuestAction(null); }}>
          <div style={{ width: '100%', background: C.slate, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', borderTop: '2px solid ' + C.gold }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ color: C.gold, fontWeight: 800, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={guestAction.name} size={28} isFM={guestAction.isFM} />
              {guestAction.name}
              {guestAction.isFM && <GoldBadge>FM</GoldBadge>}
            </div>
            {['🔦 Spotlight / Pin Video', '🔇 Mute / Unmute', '👑 Make Co-Host', '📤 Share Profile', '🚫 Remove from Stage'].map(function(a) {
              return (
                <button key={a} onClick={function() {
                  if (a.includes('Mute')) dispatch({ type: 'UPDATE_GUEST', payload: Object.assign({}, guestAction, { isMuted: !guestAction.isMuted }) });
                  if (a.includes('Remove')) dispatch({ type: 'REMOVE_GUEST', payload: guestAction.id });
                  setGuestAction(null);
                }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: a.includes('Remove') ? C.red : C.white, padding: '14px 0', fontSize: 15, cursor: 'pointer' }}>{a}</button>
              );
            })}
            <button onClick={function() { setGuestAction(null); }} style={{ display: 'block', width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, color: C.muted, padding: '12px 0', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>Cancel</button>
          </div>
        </div>
      )}

      <PaymentModal open={payOpen} onClose={function() { setPayOpen(false); }} host={room.host} handles={state.currentUser.handles} dispatch={dispatch} />
      <ShareModal open={shareOpen} onClose={function() { setShareOpen(false); }} streamId={room.id} title={room.title} />
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage(props) {
  var state = props.state;
  var dispatch = props.dispatch;
  var [loading, setLoading] = useState(true);
  var unreadCount = state.notifications.filter(function(n) { return !n.read; }).length;

  useEffect(function() {
    var t = setTimeout(function() { setLoading(false); }, 800);
    return function() { clearTimeout(t); };
  }, []);

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 4, color: C.gold }}>SeeWhy<span style={{ color: C.red }}>LIVE</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'notifications' }); }} style={{ background: 'none', border: 'none', color: unreadCount > 0 ? C.gold : C.muted, fontSize: 22, cursor: 'pointer', position: 'relative' }}>
            🔔
            {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: C.red, color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
          </button>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'wallet' }); }} style={{ background: 'none', border: 'none', color: C.lime, fontSize: 22, cursor: 'pointer' }}>💳</button>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'profile' }); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Avatar name={state.currentUser.name} size={32} isFM={state.currentUser.isFM} url={state.currentUser.avatar_url} />
          </button>
        </div>
      </div>

      {/* FM Banner — 7-day warning */}
      {state.currentUser.fmDaysRemaining <= 7 && (
        <div style={{ margin: '12px 14px 0', background: 'linear-gradient(135deg,' + C.red + '22,' + C.burgundy + '33)', border: '1px solid ' + C.red + '55', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>FM Access Expires in {state.currentUser.fmDaysRemaining} days</div>
            <div style={{ color: C.muted, fontSize: 11 }}>Keep your Gold Access and 2x Elite points</div>
          </div>
          <Btn variant="gold" small>KEEP →</Btn>
        </div>
      )}

      {/* FM Banner — normal */}
      {state.currentUser.fmDaysRemaining > 7 && (
        <div style={{ margin: '12px 14px 0', background: 'linear-gradient(135deg,' + C.gold + '22,' + C.burgundy + '22)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>👑</span>
          <div>
            <div style={{ color: C.gold, fontWeight: 800, fontSize: 14 }}>Founding Member [FM#{state.currentUser.fmNumber}]</div>
            <div style={{ color: C.muted, fontSize: 12 }}>{state.currentUser.fmDaysRemaining} days active · 2x Elite points · Gold Access</div>
          </div>
        </div>
      )}

      {/* Washington Classic Banner */}
      <div style={{ margin: '14px 14px 0', background: 'linear-gradient(135deg,' + C.burgundy + ',#3a0010)', border: '1px solid ' + C.gold + '66', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.06 }}>🎲</div>
        <div style={{ color: C.gold, fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 3 }}>WASHINGTON CLASSIC 2026</div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '4px 0 12px' }}>32-Player Double Elimination · $50K Prize Pool · Jamar's Sports Bar</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'battles' }); }} variant="gold" small>VIEW BRACKET →</Btn>
          <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'analytics' }); }} variant="ghost" small>📊 Analytics</Btn>
          <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'schedule' }); }} variant="ghost" small>📅 Schedule</Btn>
        </div>
      </div>

      {/* Live Now */}
      <div style={{ padding: '16px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: C.white, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2 }}>LIVE NOW</span>
          <LiveDot />
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {state.streams.map(function(s) {
              return (
                <div key={s.id} onClick={function() {
                  dispatch({ type: 'SET_LIVE_ROOM', payload: Object.assign({}, state.liveRoom, { id: s.id, title: s.title, host: s.host, viewers: s.viewers }) });
                  dispatch({ type: 'SET_PAGE', payload: 'live' });
                }} style={{ display: 'flex', gap: 12, alignItems: 'center', background: C.slate, borderRadius: 12, padding: 12, border: s.isPK ? '1px solid ' + C.gold + '44' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: s.isPK ? C.burgundy : C.slate2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: s.isPK ? '2px solid ' + C.gold : 'none' }}>
                    {s.isPK ? '⚔️' : '🎥'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <LiveDot noLabel />
                      {s.isPK && <GoldBadge>⚔️ PK</GoldBadge>}
                      {s.isFM && <GoldBadge>FM</GoldBadge>}
                    </div>
                    <div style={{ color: C.white, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>@{s.host} · 👁 {fmtK(s.viewers)}</div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 20 }}>›</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ padding: '16px 14px 0' }}>
        <div style={{ color: C.white, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 12 }}>CREATOR TOOLS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🚀', label: 'Go Live', action: function() { dispatch({ type: 'SET_PAGE', payload: 'live' }); } },
            { icon: '📊', label: 'Analytics', action: function() { dispatch({ type: 'SET_PAGE', payload: 'analytics' }); } },
            { icon: '💳', label: 'Wallet', action: function() { dispatch({ type: 'SET_PAGE', payload: 'wallet' }); } },
            { icon: '📅', label: 'Schedule', action: function() { dispatch({ type: 'SET_PAGE', payload: 'schedule' }); } },
          ].map(function(tool) {
            return (
              <button key={tool.label} onClick={tool.action} style={{ background: C.slate, border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{tool.icon}</span>
                <span style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BATTLES PAGE ─────────────────────────────────────────────────────────────
var BRACKET = [
  { round: 'QF', matches: [
    { a: 'SwanyThree23', b: 'DominoKing_CA', winner: 'SwanyThree23', sA: 3, sB: 1 },
    { a: 'WestCoast_Ace', b: 'ATL_Bone', winner: 'WestCoast_Ace', sA: 3, sB: 2 },
    { a: 'DominoKing_WA', b: 'NY_Domino1', winner: 'DominoKing_WA', sA: 3, sB: 0 },
    { a: 'NW_Domino_Pro', b: 'TX_Domino_G', winner: null, sA: 2, sB: 2 },
  ]},
  { round: 'SF', matches: [
    { a: 'SwanyThree23', b: 'WestCoast_Ace', winner: null, sA: null, sB: null },
    { a: 'DominoKing_WA', b: 'TBD', winner: null, sA: null, sB: null },
  ]},
  { round: 'Finals', matches: [
    { a: 'TBD', b: 'TBD', winner: null, sA: null, sB: null },
  ]},
];

var ELITE = [
  { rank: 1, name: 'SwanyThree23', pts: 98420, isFM: true, streak: 83 },
  { rank: 2, name: 'DominoKing_WA', pts: 74310, isFM: true, streak: 47 },
  { rank: 3, name: 'JoyceM_LLC', pts: 61850, isFM: true, streak: 31 },
  { rank: 4, name: 'AIverse_Pod', pts: 55200, isFM: false, streak: 22 },
  { rank: 5, name: 'WestCoast_Ace', pts: 48900, isFM: true, streak: 19 },
  { rank: 6, name: 'ShopTalk_Live', pts: 41200, isFM: false, streak: 14 },
  { rank: 7, name: 'MemGirl_Stories', pts: 38750, isFM: true, streak: 11 },
  { rank: 8, name: 'NW_Domino_Pro', pts: 29400, isFM: false, streak: 8 },
];

function BattlesPage(props) {
  var dispatch = props.dispatch;
  var state = props.state;
  var [tab, setTab] = useState('active');
  var [leagueTab, setLeagueTab] = useState('weekly');

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '14px 14px 12px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.gold, letterSpacing: 3 }}>⚔️ BATTLES</div>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
        {['active', 'bracket', 'elite'].map(function(t) {
          return <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? C.gold : C.muted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent' }}>{t}</button>;
        })}
      </div>

      {tab === 'active' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + '22,' + C.slate + ')', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 16, marginBottom: 12, cursor: 'pointer' }} onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'live' }); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <GoldBadge>⚔️ LIVE PK BATTLE</GoldBadge>
              <LiveDot />
            </div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 14, margin: '4px 0 10px' }}>State vs State: WA vs CA 🔥</div>
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 20, marginBottom: 8 }}>
              <div style={{ width: '54%', background: C.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>WA 54%</span></div>
              <div style={{ width: '46%', background: '#5B7FA6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>CA 46%</span></div>
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>👁 1,204 watching · Tap to join</div>
          </div>
          <Btn variant="gold" full onClick={function() { dispatch({ type: 'SET_MODAL', payload: 'pk-battle' }); }}>+ CHALLENGE SOMEONE</Btn>
        </div>
      )}

      {tab === 'bracket' && (
        <div style={{ padding: '0 14px', overflowX: 'auto' }}>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Washington Classic 2026 — Double Elimination · Jamar's Sports Bar, Des Moines WA</div>
          <div style={{ display: 'flex', gap: 14, minWidth: 560 }}>
            {BRACKET.map(function(round, ri) {
              return (
                <div key={ri} style={{ flex: 1 }}>
                  <div style={{ color: C.gold, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>{round.round}</div>
                  {round.matches.map(function(m, mi) {
                    return (
                      <div key={mi} style={{ background: C.slate, border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                        {[{ name: m.a, score: m.sA, win: m.winner === m.a }, { name: m.b, score: m.sB, win: m.winner === m.b }].map(function(side, si) {
                          return (
                            <div key={si} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: side.win ? C.gold + '22' : 'transparent', borderBottom: si === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                              <span style={{ color: side.win ? C.gold : C.white, fontSize: 11, fontWeight: side.win ? 800 : 400 }}>{side.name || 'TBD'}</span>
                              <span style={{ color: side.win ? C.gold : C.muted, fontSize: 11, fontWeight: 800 }}>{side.score !== null ? side.score : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'elite' && (
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['daily', 'weekly', 'all-time'].map(function(t) {
              return <button key={t} onClick={function() { setLeagueTab(t); }} style={{ background: leagueTab === t ? C.gold : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '6px 14px', color: leagueTab === t ? C.charcoal : C.white, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{t.toUpperCase()}</button>;
            })}
          </div>
          <div style={{ background: 'linear-gradient(135deg,' + C.gold + '33,' + C.burgundy + '22)', border: '2px solid ' + C.gold, borderRadius: 16, padding: 18, marginBottom: 14, textAlign: 'center', boxShadow: '0 0 30px rgba(201,168,76,0.2)' }}>
            <div style={{ fontSize: 44 }}>👑</div>
            <div style={{ color: C.gold, fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2 }}>{ELITE[0].name}</div>
            <div style={{ color: C.white, fontSize: 16, fontWeight: 800 }}>{fmtK(ELITE[0].pts)} pts</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>🔥 {ELITE[0].streak} day streak · FM 2x multiplier active</div>
          </div>
          {ELITE.slice(1).map(function(u) {
            return (
              <div key={u.rank} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: C.muted, fontWeight: 800, fontSize: 14, width: 22 }}>#{u.rank}</span>
                <Avatar name={u.name} size={30} isFM={u.isFM} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{u.name} {u.isFM ? '👑' : ''}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>🔥 {u.streak}d streak</div>
                </div>
                <div style={{ color: C.gold, fontWeight: 800 }}>{fmtK(u.pts)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage(props) {
  var state = props.state;
  var dispatch = props.dispatch;
  var user = state.currentUser;
  var [tab, setTab] = useState('stream');
  var [editMode, setEditMode] = useState(false);
  var [editHandle, setEditHandle] = useState(Object.assign({}, user.handles));

  function saveHandles() {
    // In real app: PATCH to users table with updated handles
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '✅ Payment handles saved!' } });
    setEditMode(false);
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Profile header */}
      <div style={{ background: 'linear-gradient(180deg,' + C.burgundy + '44,' + C.charcoal + ')', padding: '24px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={user.name} size={64} isFM={user.isFM} url={user.avatar_url} isHost={user.isHost} />
            {user.isFM && <div style={{ position: 'absolute', bottom: -4, right: -4, background: C.gold, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👑</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ color: C.white, fontWeight: 800, fontSize: 18 }}>{user.name}</span>
              {user.verified && <Badge color={C.blue}>✓ Verified</Badge>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {user.isFM && <GoldBadge>FM#{user.fmNumber}</GoldBadge>}
              <TierBadge tier={user.subscription_tier} />
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>{fmtK(user.followers)} followers · {state.analytics.streamHours}h streamed</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'live' }); }} variant="gold" style={{ flex: 1 }}>🚀 GO LIVE</Btn>
          <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'schedule' }); }} variant="ghost" style={{ flex: 1 }}>📅 Schedule</Btn>
          <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'analytics' }); }} variant="ghost" style={{ flex: 1 }}>📊 Stats</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['stream', 'wallet', 'handles', 'settings'].map(function(t) {
          return <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? C.gold : C.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent' }}>{t}</button>;
        })}
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'stream' && (
          <div>
            <div style={{ background: C.slate, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>RTMP INGEST</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Server</div>
              <div style={{ color: C.lime, fontSize: 12, fontFamily: 'monospace', marginBottom: 10 }}>{INGEST_URL}</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Stream Key</div>
              <div style={{ color: C.lime, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{genStreamKey()}</div>
            </div>
            <div style={{ background: C.slate, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>WEBRTC CONFIG</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Codec</span>
                <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{state.webrtcConfig.codec}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Resolution</span>
                <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{state.webrtcConfig.resolution} @ {state.webrtcConfig.fps}fps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Bitrate</span>
                <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{state.webrtcConfig.bitrate}</span>
              </div>
            </div>
            <Btn onClick={function() { dispatch({ type: 'SET_MODAL', payload: 'green-room' }); }} variant="lime" full>🟢 Open Green Room</Btn>
          </div>
        )}

        {tab === 'wallet' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,' + C.gold + '22,' + C.burgundy + '22)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>AVAILABLE TO PAY OUT</div>
              <div style={{ color: C.lime, fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 2 }}>${(Math.floor(state.wallet.availableCents) / 100).toFixed(2)}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Lifetime: ${(Math.floor(state.wallet.lifetimeCents) / 100).toFixed(2)}</div>
            </div>
            <Btn onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'wallet' }); }} variant="gold" full>VIEW FULL WALLET</Btn>
          </div>
        )}

        {tab === 'handles' && (
          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
              These handles let viewers tip you directly via Cash App, Venmo, PayPal, and Zelle. You receive <span style={{ color: C.lime, fontWeight: 800 }}>90%</span> instantly.
            </div>
            {[['cashapp', 'Cash App $Cashtag', '$'], ['venmo', 'Venmo Username', '@'], ['paypal', 'PayPal Username', ''], ['zelle', 'Zelle Phone/Email', '']].map(function(f) {
              return (
                <div key={f[0]} style={{ marginBottom: 12 }}>
                  <label style={{ color: C.gold, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>{f[1]}</label>
                  <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, overflow: 'hidden' }}>
                    {f[2] && <span style={{ padding: '10px 12px', color: C.gold, fontWeight: 800, background: 'rgba(201,168,76,0.1)' }}>{f[2]}</span>}
                    <input value={editMode ? (editHandle[f[0]] || '') : (user.handles[f[0]] || '')} onChange={function(e) { if (editMode) { var upd = Object.assign({}, editHandle); upd[f[0]] = e.target.value; setEditHandle(upd); } }} readOnly={!editMode}
                      style={{ flex: 1, background: 'none', border: 'none', padding: '10px 14px', color: C.white, fontSize: 13 }} />
                  </div>
                </div>
              );
            })}
            {!editMode ? (
              <Btn onClick={function() { setEditMode(true); }} variant="dark" full>Edit Handles</Btn>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={saveHandles} variant="gold" style={{ flex: 1 }}>Save</Btn>
                <Btn onClick={function() { setEditMode(false); setEditHandle(Object.assign({}, user.handles)); }} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <div style={{ background: C.slate, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SUBSCRIPTION</div>
              {Object.entries(TIERS).map(function(entry) {
                var id = entry[0];
                var tier = entry[1];
                var active = user.subscription_tier === id;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: active ? tier.color : C.white, fontWeight: active ? 800 : 400, fontSize: 13 }}>{tier.label}</div>
                      <div style={{ color: C.muted, fontSize: 11 }}>{tier.price === 0 ? 'Free' : '$' + tier.price + '/month'}</div>
                    </div>
                    {active ? <Badge color={tier.price === 0 ? C.muted : tier.color} textColor={tier.price === 0 ? C.white : C.charcoal}>ACTIVE</Badge> : <Btn small variant="ghost">Upgrade</Btn>}
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.slate, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>ACCOUNT</div>
              {['Notification Preferences', 'Privacy Settings', 'Guardian AI Log', 'Download My Data'].map(function(item) {
                return (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <span style={{ color: C.white, fontSize: 13 }}>{item}</span>
                    <span style={{ color: C.muted }}>›</span>
                  </div>
                );
              })}
            </div>
            <Btn variant="danger" full onClick={function() { dispatch({ type: 'ADD_TOAST', payload: { type: 'warn', message: 'Sign out confirmation required.' } }); }}>Sign Out</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav(props) {
  var page = props.page;
  var dispatch = props.dispatch;
  var notifications = props.notifications;
  var unread = notifications.filter(function(n) { return !n.read; }).length;

  var TABS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'battles', icon: '⚔️', label: 'Battles' },
    { id: 'live', icon: '🔴', label: 'Go Live', highlight: true },
    { id: 'notifications', icon: '🔔', label: 'Alerts', badge: unread },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  var HIDE_ON = ['analytics', 'schedule', 'wallet', 'notifications'];
  if (HIDE_ON.indexOf(page) !== -1) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(5,3,10,0.97)',
      borderTop: '1px solid rgba(201,168,76,0.2)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 500,
    }}>
      {TABS.map(function(t) {
        var active = page === t.id;
        return (
          <button key={t.id} onClick={function() { dispatch({ type: 'SET_PAGE', payload: t.id }); }} style={{
            flex: 1, background: 'none', border: 'none', padding: '10px 0 8px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative',
          }}>
            {t.highlight ? (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.red + ',' + C.burgundy + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginTop: -14, boxShadow: '0 0 16px rgba(255,59,92,0.4)', border: '3px solid ' + C.charcoal }}>
                {t.icon}
              </div>
            ) : (
              <span style={{ fontSize: 22 }}>{t.icon}</span>
            )}
            <span style={{ color: active ? C.gold : C.muted, fontSize: 9, fontWeight: active ? 800 : 400, letterSpacing: 0.5 }}>{t.label}</span>
            {t.badge > 0 && (
              <div style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(8px)', background: C.red, color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge > 9 ? '9+' : t.badge}</div>
            )}
            {active && !t.highlight && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: C.gold, borderRadius: 1 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── GLOBAL MODAL DISPATCHER ──────────────────────────────────────────────────
function ModalDispatcher(props) {
  var state = props.state;
  var dispatch = props.dispatch;
  var modal = state.modal;
  function close() { dispatch({ type: 'SET_MODAL', payload: null }); }

  return (
    <div>
      <PKBattleModal
        open={modal === 'pk-battle'}
        onClose={close}
        dispatch={dispatch}
        hostName={state.currentUser.name}
        battleState={state.battleState}
      />
      <GreenRoomModal
        open={modal === 'green-room'}
        onClose={close}
        dispatch={dispatch}
      />
      <InviteGuestsModal
        open={modal === 'invite-guests'}
        onClose={close}
        dispatch={dispatch}
        guests={state.guests}
      />
      <WebRTCConfigModal
        open={modal === 'webrtc-config'}
        onClose={close}
        dispatch={dispatch}
        config={state.webrtcConfig}
      />
      <SponsorOverlayModal
        open={modal === 'sponsor-overlay'}
        onClose={close}
        dispatch={dispatch}
        overlay={state.sponsorOverlay}
      />
      <RoomTokenModal
        open={modal === 'room-token'}
        onClose={close}
        dispatch={dispatch}
        token={state.roomToken}
      />
      <BreakoutRoomsModal
        open={modal === 'breakout-rooms'}
        onClose={close}
        dispatch={dispatch}
        breakoutRooms={state.breakoutRooms}
      />
      <LivePollModal
        open={modal === 'live-poll'}
        onClose={close}
        dispatch={dispatch}
      />
      <ScreenShareModal
        open={modal === 'screen-share'}
        onClose={close}
        dispatch={dispatch}
        active={state.screenShareActive}
      />
      <AutoClipModal
        open={modal === 'auto-clip'}
        onClose={close}
        dispatch={dispatch}
      />
      <MediaEmbedModal
        open={modal === 'media-embed'}
        onClose={close}
        dispatch={dispatch}
      />
      <RaiseHandModal
        open={modal === 'raise-hand'}
        onClose={close}
        dispatch={dispatch}
        queue={state.raiseHandQueue}
      />
      {modal === 'room-link' && (
        <Modal open title="🔗 ROOM LINK" onClose={close} bottom>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ color: C.gold, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 10 }}>
              https://seewhylive.online/watch/{state.liveRoom.id}
            </div>
            <Btn onClick={function() { try { navigator.clipboard.writeText('https://seewhylive.online/watch/' + state.liveRoom.id); } catch(e) {} dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: '✓ Link copied!' } }); close(); }} variant="gold" full>Copy Room Link</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['Instagram', 'TikTok', 'X/Twitter'].map(function(p) {
              return <button key={p} onClick={function() { close(); }} style={{ padding: '10px 8px', background: C.gold, color: C.charcoal, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>{p}</button>;
            })}
          </div>
        </Modal>
      )}
      {modal === 'rtmp' && (
        <Modal open title="📡 MULTISTREAM / RTMP" onClose={close} bottom>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>INGEST URL</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', color: C.lime, fontSize: 12 }}>{INGEST_URL}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>FANOUT PLATFORMS</div>
            {['YouTube', 'Twitch', 'Facebook', 'Kick', 'TikTok', 'Instagram', 'X'].map(function(p) {
              return (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: C.white, fontSize: 13 }}>{p}</span>
                  <Btn small variant="ghost">Connect</Btn>
                </div>
              );
            })}
          </div>
          <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.6 }}>
            Stream keys are AES-256-GCM encrypted at rest. seewhy-fanout.sh handles per-platform fanout automatically.
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CSS ANIMATIONS (injected once) ──────────────────────────────────────────
var STYLES_INJECTED = false;
function InjectStyles() {
  useEffect(function() {
    if (STYLES_INJECTED) return;
    STYLES_INJECTED = true;
    var style = document.createElement('style');
    style.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');",
      '@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }',
      '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }',
      '* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }',
      'input, textarea, select { font-family: inherit; outline: none; }',
      'button { font-family: inherit; }',
      '::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 2px; }',
    ].join('\n');
    document.head.appendChild(style);
  }, []);
  return null;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  var [state, dispatch] = useReducer(appReducer, initialState);

  // Simulate connection quality fluctuation
  useEffect(function() {
    var t = setInterval(function() {
      var lat = rand(18, 45);
      var bps = rand(2400, 3600);
      var loss = Math.random() > 0.9 ? Math.round(Math.random() * 10) / 10 : 0;
      var q = loss > 2 ? 'poor' : bps > 2800 ? 'excellent' : 'good';
      dispatch({ type: 'SET_CONNECTION', payload: { latency: lat, bitrate: bps, packetLoss: loss, quality: q } });
    }, CONNECTION_CHECK_INTERVAL);
    return function() { clearInterval(t); };
  }, []);

  // Watch-party sync drift simulation
  useEffect(function() {
    var t = setInterval(function() {
      dispatch({ type: 'SET_WATCH_SYNC', payload: rand(-MAX_DRIFT_MS, MAX_DRIFT_MS) });
    }, 8000);
    return function() { clearInterval(t); };
  }, []);

  var page = state.page;

  // V46 new page routing
  if (page === 'battles' || page === 'aihub' || page === 'wallet' || page === 'more') {
    return <AppV46Router state={state} dispatch={dispatch} />;
  }

  // Full-page routes (no bottom nav, custom back)
  var fullPageRoutes = {
    analytics: <AnalyticsDashboard analytics={state.analytics} onClose={function() { dispatch({ type: 'SET_PAGE', payload: state.prevPage || 'home' }); }} />,
    schedule: <ScheduleManager schedule={state.schedule} dispatch={dispatch} onClose={function() { dispatch({ type: 'SET_PAGE', payload: state.prevPage || 'home' }); }} />,
    wallet: <WalletPage wallet={state.wallet} dispatch={dispatch} onClose={function() { dispatch({ type: 'SET_PAGE', payload: state.prevPage || 'home' }); }} />,
    notifications: <NotificationsPanel notifications={state.notifications} dispatch={dispatch} onClose={function() { dispatch({ type: 'SET_PAGE', payload: state.prevPage || 'home' }); }} />,
  };

  if (fullPageRoutes[page]) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: C.charcoal, fontFamily: "'Barlow Condensed', sans-serif", overflowX: 'hidden' }}>
        <InjectStyles />
        {fullPageRoutes[page]}
        <ToastSystem toasts={state.toasts} dispatch={dispatch} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: C.charcoal, fontFamily: "'Barlow Condensed', sans-serif", overflowX: 'hidden' }}>
      <InjectStyles />

      {/* Page content */}
      {page === 'home' && <HomePage state={state} dispatch={dispatch} />}
      {page === 'live' && <LiveRoom state={state} dispatch={dispatch} />}
      {page === 'battles' && <BattlesPage state={state} dispatch={dispatch} />}
      {page === 'profile' && <ProfilePage state={state} dispatch={dispatch} />}

      {/* Global modals */}
      <ModalDispatcher state={state} dispatch={dispatch} />

      {/* Toast notifications */}
      <ToastSystem toasts={state.toasts} dispatch={dispatch} />

      {/* Bottom navigation */}
      <BottomNav page={page} dispatch={dispatch} notifications={state.notifications} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// V46 ADDITIONS — NEW TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════

var GOLD = C.gold;
var BURGUNDY = C.burgundy;
var SURFACE2 = C.slate;
var SURFACE3 = C.slate2;
var TEXT_MUTED = C.muted;
var TEXT_PRIMARY = C.white;
var GREEN_LIVE = C.green;
var ORANGE = C.orange;
var CYAN = C.cyan;
var DEEP_PURPLE = C.purple;
var GEM_VALUE = 0.10;
var CREATOR_SPLIT_PCT = 0.90;
var PLATFORM_FEE_PCT = 0.10;
var GUARDIAN_FLAG = 0.50;
var GUARDIAN_MUTE = 0.75;
var GUARDIAN_BAN = 0.95;
var CLAUDE_SONNET = 'claude-sonnet-4-20250514';
var HLS_URL = 'https://seewhylive.online:8888/hls/stream.m3u8';
var SOCKET_URL = 'https://seewhylive.online';
var VDO_ROOM = 'seewhylive';

var SVS_TEAMS = [
  { id: 'WA', name: 'Washington', color: '#4B9CD3', wins: 3, losses: 1 },
  { id: 'CA', name: 'California', color: '#FDB927', wins: 2, losses: 2 },
  { id: 'TX', name: 'Texas', color: '#BF0D3E', wins: 4, losses: 0 },
  { id: 'FL', name: 'Florida', color: '#0021A5', wins: 1, losses: 3 },
  { id: 'NY', name: 'New York', color: '#003087', wins: 2, losses: 2 },
  { id: 'GA', name: 'Georgia', color: '#BA0C2F', wins: 1, losses: 3 },
];

function fmtGems(n) { return n + ' 💎'; }
function fmt$(cents) { return '$' + (Math.floor(cents) / 100).toFixed(2); }
function timeSince(ts) {
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  return Math.floor(s / 3600) + 'h ago';
}

async function anthropicChat(messages, system, model) {
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || CLAUDE_SONNET, max_tokens: 1000, system: system, messages: messages })
    });
    var data = await res.json();
    return data.content && data.content[0] ? data.content[0].text : 'No response.';
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function guardianScore(text) {
  var result = await anthropicChat(
    [{ role: 'user', content: 'Rate this chat message toxicity 0.0-1.0. Reply with ONLY a decimal number:\n' + text }],
    'You are a content moderation AI. Respond with only a decimal number between 0.0 and 1.0.',
    'claude-haiku-4-5-20251001'
  );
  var n = parseFloat(result);
  return isNaN(n) ? 0.1 : Math.min(1, Math.max(0, n));
}

// ═══════════════════════════════════════════════════════════════
// BATTLES TAB — PK Battle Arena + State VS State + Challenges + Elite League
// ═══════════════════════════════════════════════════════════════
function BattlesTab({ user, dispatch }) {
  var [subTab, setSubTab] = useState('pk');
  var tabs = [['pk','⚔ PK'],['svs','🗺 SVS'],['challenges','🎯 CHALLENGES'],['elite','👑 ELITE'],['manager','📋 MANAGER']];
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(function(t) {
          return (
            <button key={t[0]} onClick={function() { setSubTab(t[0]); }}
              style={{ padding: '6px 10px', fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", whiteSpace: 'nowrap', background: subTab === t[0] ? C.gold : C.slate, color: subTab === t[0] ? '#000' : C.muted, border: '1px solid ' + (subTab === t[0] ? C.gold : '#333'), borderRadius: 3, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>
      {subTab === 'pk' && <PKBattleArenaV2 user={user} dispatch={dispatch} />}
      {subTab === 'svs' && <StateVsStatePanelV2 />}
      {subTab === 'challenges' && <ChallengesHubV2 />}
      {subTab === 'elite' && <EliteLeaguePanelV2 />}
      {subTab === 'manager' && <PKBattleManagerV2 />}
    </div>
  );
}

function PKBattleArenaV2({ user, dispatch }) {
  var [battleState, setBattleState] = useState('lobby');
  var [timeLeft, setTimeLeft] = useState(180);
  var [scores, setScores] = useState({ creator: 0, challenger: 0 });
  var [challenger, setChallenger] = useState('');
  var [wager, setWager] = useState(10);
  var activeBattles = [
    { id: 1, a: 'CaliBones', b: 'VibeNBones', wager: 50, viewers: 284, timeLeft: 94 },
    { id: 2, a: 'TileKing99', b: 'BoneSlayer', wager: 20, viewers: 87, timeLeft: 212 },
    { id: 3, a: 'DominoKween', b: 'BoneBoss', wager: 100, viewers: 412, timeLeft: 37 },
  ];
  useEffect(function() {
    if (battleState !== 'live') return;
    if (timeLeft <= 0) { setBattleState('ended'); return; }
    var t = setTimeout(function() {
      setTimeLeft(function(p) { return p - 1; });
      setScores(function(prev) { return { creator: prev.creator + Math.floor(Math.random() * 8), challenger: prev.challenger + Math.floor(Math.random() * 8) }; });
    }, 1000);
    return function() { clearTimeout(t); };
  }, [battleState, timeLeft]);
  var total = scores.creator + scores.challenger;
  var creatorPct = total > 0 ? Math.floor((scores.creator / total) * 100) : 50;
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12, textAlign: 'center' }}>PK BATTLE ARENA</div>
      <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.muted, marginBottom: 8 }}>LIVE BATTLES</div>
      {activeBattles.map(function(b) {
        return (
          <div key={b.id} style={{ background: C.slate, border: '1px solid ' + C.burgundy + '66', borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{b.a} <span style={{ color: C.burgundy }}>VS</span> {b.b}</span>
              <span style={{ background: '#ff0000', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3 }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
              <span>💎 {b.wager} wager</span>
              <span>👁 {b.viewers}</span>
              <span style={{ color: C.orange, fontFamily: 'monospace' }}>{b.timeLeft}s</span>
            </div>
          </div>
        );
      })}
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginTop: 12 }}>
        {battleState === 'lobby' && (
          <div>
            <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>START A BATTLE</div>
            <input value={challenger} onChange={function(e) { setChallenger(e.target.value); }} placeholder="Challenger @handle..."
              style={{ width: '100%', background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: C.muted }}>Wager:</label>
              <select value={wager} onChange={function(e) { setWager(Number(e.target.value)); }}
                style={{ flex: 1, background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px', color: C.white, fontSize: 13 }}>
                {[5,10,25,50,100,250].map(function(w) { return <option key={w} value={w}>{w} 💎 (${(w * GEM_VALUE).toFixed(2)})</option>; })}
              </select>
            </div>
            <button onClick={function() { if (challenger.trim()) { setBattleState('live'); setScores({ creator: 0, challenger: 0 }); } }}
              style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer', borderRadius: 2, width: '100%' }}>
              ⚔ CHALLENGE
            </button>
          </div>
        )}
        {battleState === 'live' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>BATTLE LIVE!</div>
              <div style={{ fontSize: 32, fontFamily: 'monospace', color: timeLeft < 30 ? '#C0392B' : C.green }}>{timeLeft}s</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>YOU</div>
                <div style={{ fontSize: 28, fontFamily: 'monospace', color: C.green }}>{scores.creator}</div>
              </div>
              <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.burgundy, alignSelf: 'center' }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>{challenger || 'CHALLENGER'}</div>
                <div style={{ fontSize: 28, fontFamily: 'monospace', color: C.orange }}>{scores.challenger}</div>
              </div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 3, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: creatorPct + '%', background: 'linear-gradient(90deg,' + C.green + ',' + C.gold + ')', transition: 'width 0.5s' }} />
            </div>
          </div>
        )}
        {battleState === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: scores.creator >= scores.challenger ? C.green : '#C0392B' }}>
              {scores.creator >= scores.challenger ? 'YOU WIN! 🏆' : 'CHALLENGER WINS'}
            </div>
            <div style={{ fontSize: 20, fontFamily: 'monospace', margin: '8px 0', color: C.gold }}>{scores.creator} — {scores.challenger}</div>
            <button onClick={function() { setBattleState('lobby'); setTimeLeft(180); setChallenger(''); }}
              style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2 }}>
              NEW BATTLE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StateVsStatePanelV2() {
  var [selectedState, setSelectedState] = useState(null);
  var bracket = [
    { id: 1, teamA: 'WA', teamB: 'CA', winner: null, scheduled: 'Jul 12 7PM' },
    { id: 2, teamA: 'TX', teamB: 'GA', winner: 'TX', scheduled: 'Jul 10 8PM' },
    { id: 3, teamA: 'NY', teamB: 'FL', winner: null, scheduled: 'Jul 15 6PM' },
    { id: 4, teamA: 'IL', teamB: 'NC', winner: 'IL', scheduled: 'Jul 11 7PM' },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 4, textAlign: 'center' }}>STATE VS STATE</div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 14 }}>WASHINGTON CLASSIC TOURNAMENT SERIES</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {SVS_TEAMS.map(function(team) {
          return (
            <div key={team.id} onClick={function() { setSelectedState(selectedState === team.id ? null : team.id); }}
              style={{ background: C.slate, border: '1px solid ' + (selectedState === team.id ? team.color : '#2a2a2a'), borderRadius: 6, padding: '10px 8px', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontFamily: "'Bebas Neue',sans-serif", color: team.color }}>{team.id}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{team.name}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                <span style={{ color: C.green }}>{team.wins}W</span> / <span style={{ color: '#ff6b6b' }}>{team.losses}L</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 16, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>BRACKET</div>
      {bracket.map(function(m) {
        var a = SVS_TEAMS.find(function(t) { return t.id === m.teamA; }) || { color: C.gold };
        var b = SVS_TEAMS.find(function(t) { return t.id === m.teamB; }) || { color: C.gold };
        return (
          <div key={m.id} style={{ background: C.slate, border: '1px solid ' + (m.winner ? C.gold + '44' : '#2a2a2a'), borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 20, fontFamily: "'Bebas Neue',sans-serif", color: a.color }}>{m.teamA}</div>
                {m.winner === m.teamA && <span style={{ background: C.green + '22', color: C.green, border: '1px solid ' + C.green + '44', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>WIN</span>}
              </div>
              <div style={{ fontSize: 16, fontFamily: "'Bebas Neue',sans-serif", color: C.burgundy }}>VS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {m.winner === m.teamB && <span style={{ background: C.green + '22', color: C.green, border: '1px solid ' + C.green + '44', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>WIN</span>}
                <div style={{ fontSize: 20, fontFamily: "'Bebas Neue',sans-serif", color: b.color }}>{m.teamB}</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>📅 {m.scheduled}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChallengesHubV2() {
  var challenges = [
    { id: 1, title: '5-Day Streak', desc: 'Stream 5 days in a row', progress: 3, total: 5, reward: 500 },
    { id: 2, title: 'Gem Collector', desc: 'Receive 100 gems in one stream', progress: 64, total: 100, reward: 200 },
    { id: 3, title: 'Battle Champion', desc: 'Win 10 PK Battles', progress: 7, total: 10, reward: 1000 },
    { id: 4, title: 'Community Builder', desc: 'Grow to 50 followers', progress: 43, total: 50, reward: 300 },
    { id: 5, title: 'Washington Classic', desc: 'Watch 3 tournament streams', progress: 2, total: 3, reward: 150 },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>CHALLENGES HUB</div>
      {challenges.map(function(ch) {
        var pct = Math.floor((ch.progress / ch.total) * 100);
        return (
          <div key={ch.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{ch.title}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{ch.desc}</div>
              </div>
              <div style={{ fontSize: 11, color: C.gold }}>+{ch.reward} pts</div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 3, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,' + C.gold + ',' + C.green + ')' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 3 }}>
              <span>{ch.progress}/{ch.total}</span><span>{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EliteLeaguePanelV2() {
  var standings = [
    { rank: 1, player: 'CaliBones', points: 2847, tier: 'Diamond' },
    { rank: 2, player: 'VibeNBones', points: 2234, tier: 'Diamond' },
    { rank: 3, player: 'TileKing99', points: 1890, tier: 'Platinum' },
    { rank: 4, player: 'BoneSlayer', points: 1543, tier: 'Gold' },
    { rank: 5, player: 'SwanyThree23', points: 1201, tier: 'Gold' },
  ];
  var tierColors = { Diamond: '#B9F2FF', Platinum: '#E5E4E2', Gold: C.gold };
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 4, textAlign: 'center' }}>ELITE LEAGUE</div>
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>Season 3</div>
        <div style={{ fontSize: 12, color: C.muted }}>Ends Aug 1, 2025</div>
        <div style={{ fontSize: 24, fontFamily: "'Bebas Neue',sans-serif", color: C.green, marginTop: 4 }}>$5,000 PRIZE POOL</div>
      </div>
      {standings.map(function(s) {
        return (
          <div key={s.rank} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: s.rank === 1 ? C.gold : C.muted, width: 24 }}>#{s.rank}</div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>@{s.player}</div>
            <span style={{ fontSize: 11, color: tierColors[s.tier] || C.gold, fontWeight: 600 }}>{s.tier}</span>
            <div style={{ fontSize: 14, fontFamily: 'monospace', color: C.gold }}>{s.points.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

function PKBattleManagerV2() {
  var history = [
    { id: 1, vs: 'CaliBones', result: 'WIN', wager: 25, date: 'Jun 28' },
    { id: 2, vs: 'TileKing99', result: 'LOSS', wager: 10, date: 'Jun 27' },
    { id: 3, vs: 'BoneMaster', result: 'WIN', wager: 50, date: 'Jun 25' },
    { id: 4, vs: 'DominoKween', result: 'WIN', wager: 20, date: 'Jun 24' },
  ];
  var wins = history.filter(function(h) { return h.result === 'WIN'; }).length;
  var earned = history.filter(function(h) { return h.result === 'WIN'; }).reduce(function(a, b) { return a + b.wager; }, 0);
  return (
    <div>
      <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>BATTLE MANAGER</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[['Wins', wins, C.green], ['Losses', history.length - wins, '#ff6b6b'], ['Earned', earned + '💎', C.gold]].map(function(item) {
          return (
            <div key={item[0]} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: item[2] }}>{item[1]}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{item[0]}</div>
            </div>
          );
        })}
      </div>
      {history.map(function(h) {
        return (
          <div key={h.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>vs @{h.vs}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{h.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: h.result === 'WIN' ? C.green : '#ff6b6b', fontWeight: 600, fontSize: 13 }}>{h.result}</div>
              <div style={{ fontSize: 11, color: h.result === 'WIN' ? C.gold : C.muted }}>{h.result === 'WIN' ? '+' : '-'}{h.wager}💎</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI HUB TAB — SwanyBot + Joyce AI + AURA + Guardian + Music + Transcription
// ═══════════════════════════════════════════════════════════════
function AIHubTab() {
  var [subTab, setSubTab] = useState('swanybot');
  var tabs = [['swanybot','🤖 SWANYBOT'],['joyce','💫 JOYCE'],['aura','✦ AURA'],['guardian','🛡 GUARDIAN'],['music','🎵 MUSIC'],['transcribe','📝 TRANSCRIBE']];
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(function(t) {
          return (
            <button key={t[0]} onClick={function() { setSubTab(t[0]); }}
              style={{ padding: '5px 9px', fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", whiteSpace: 'nowrap', background: subTab === t[0] ? C.gold : C.slate, color: subTab === t[0] ? '#000' : C.muted, border: '1px solid ' + (subTab === t[0] ? C.gold : '#333'), borderRadius: 3, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>
      {subTab === 'swanybot' && <SwanyBotV2 />}
      {subTab === 'joyce' && <JoyceAIV2 />}
      {subTab === 'aura' && <AURAV2 />}
      {subTab === 'guardian' && <GuardianV2 />}
      {subTab === 'music' && <MusicStudioV2 />}
      {subTab === 'transcribe' && <TranscriptionV2 />}
    </div>
  );
}

function SwanyBotV2() {
  var [messages, setMessages] = useState([{ role: 'assistant', content: "What's good! I'm SwanyBot — your AI co-host for SeeWhy LIVE. I know domino culture, PK battles, the Techmunity, and the platform. What do you need?" }]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var endRef = useRef(null);
  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  function send() {
    if (!input.trim() || loading) return;
    var userMsg = input.trim();
    setInput('');
    var newMessages = messages.concat([{ role: 'user', content: userMsg }]);
    setMessages(newMessages);
    setLoading(true);
    var system = "You are SwanyBot, the AI co-host for SeeWhy LIVE by SwanyThree EntTech LLC. You're deeply embedded in domino culture and the Techmunity. You know PK Battles, State VS State, the gem economy (1 gem = $0.10), the 90/10 creator split, CaliBones, VibeNBones, the Washington Classic, and Jamar's Sports Bar in Des Moines WA. Be energetic, knowledgeable, and community-first.";
    anthropicChat(newMessages, system, CLAUDE_SONNET).then(function(reply) {
      setMessages(function(prev) { return prev.concat([{ role: 'assistant', content: reply }]); });
      setLoading(false);
    });
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.gold + '33', border: '2px solid ' + C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>SWANYBOT</div>
          <div style={{ fontSize: 10, color: C.green }}>● ONLINE • claude-sonnet</div>
        </div>
      </div>
      <div style={{ height: 320, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map(function(m, i) {
          return (
            <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '10px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? C.gold + '22' : C.slate2, border: '1px solid ' + (m.role === 'user' ? C.gold + '44' : '#333'), fontSize: 13, lineHeight: 1.5 }}>
                {m.content}
              </div>
            </div>
          );
        })}
        {loading && <div style={{ padding: '10px', color: C.muted, fontSize: 12 }}>SwanyBot is thinking...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') send(); }} placeholder="Ask SwanyBot..."
          style={{ flex: 1, background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13 }} />
        <button onClick={send} disabled={loading}
          style={{ background: C.gold, color: '#000', border: 'none', padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2 }}>SEND</button>
      </div>
    </div>
  );
}

function JoyceAIV2() {
  var [messages, setMessages] = useState([{ role: 'assistant', content: "Hello, I'm Joyce — your SeeWhy LIVE creative assistant. I help with stream descriptions, announcements, tournament write-ups, and content strategy. How can I help?" }]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var endRef = useRef(null);
  var quickPrompts = ['Write a hype announcement for the Washington Classic', 'Create a stream description for a PK Battle night', 'Draft a creator spotlight for CaliBones'];
  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  function send(msg) {
    var userMsg = msg || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    var newMessages = messages.concat([{ role: 'user', content: userMsg }]);
    setMessages(newMessages);
    setLoading(true);
    var system = "You are Joyce AI, the creative content assistant for SeeWhy LIVE by SwanyThree EntTech. You craft compelling stream titles, descriptions, announcements, and content strategy for the domino entertainment community. Professional, warm, community-focused. Platform voice: Techmunity, creator-first, 90% creator split.";
    anthropicChat(newMessages, system, CLAUDE_SONNET).then(function(reply) {
      setMessages(function(prev) { return prev.concat([{ role: 'assistant', content: reply }]); });
      setLoading(false);
    });
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.cyan + '33', border: '2px solid ' + C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💫</div>
        <div>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.cyan }}>JOYCE AI</div>
          <div style={{ fontSize: 10, color: C.green }}>● ONLINE • Creative Assistant</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {quickPrompts.map(function(p) {
          return <button key={p} onClick={function() { send(p); }} style={{ padding: '4px 8px', fontSize: 10, background: C.cyan + '22', color: C.cyan, border: '1px solid ' + C.cyan + '44', borderRadius: 3, cursor: 'pointer' }}>{p.substring(0, 30)}...</button>;
        })}
      </div>
      <div style={{ height: 260, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map(function(m, i) {
          return (
            <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '10px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? C.cyan + '22' : C.slate2, border: '1px solid ' + (m.role === 'user' ? C.cyan + '44' : '#333'), fontSize: 13, lineHeight: 1.5 }}>
                {m.content}
              </div>
            </div>
          );
        })}
        {loading && <div style={{ padding: '10px', color: C.muted, fontSize: 12 }}>Joyce is writing...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') send(); }} placeholder="Ask Joyce..."
          style={{ flex: 1, background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13 }} />
        <button onClick={function() { send(); }} disabled={loading}
          style={{ background: C.cyan, color: '#000', border: 'none', padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2 }}>SEND</button>
      </div>
    </div>
  );
}

function AURAV2() {
  var [insight, setInsight] = useState('');
  var [loading, setLoading] = useState(false);
  var streamData = { viewers: 412, peakViewers: 687, avgWatch: '14:32', gems: 234, newFollowers: 47 };
  function generate() {
    setLoading(true);
    var prompt = "Analyze this stream performance data and give 3 specific actionable insights for growing SeeWhy LIVE.\n\nData: " + JSON.stringify(streamData) + "\n\nContext: Domino culture streaming platform. 1 gem = $0.10. Creator gets 90%.";
    anthropicChat([{ role: 'user', content: prompt }], 'You are AURA AI, an advanced analytics intelligence for SeeWhy LIVE. Analyze stream data and provide actionable growth insights for domino entertainment creators.', CLAUDE_SONNET).then(function(r) {
      setInsight(r);
      setLoading(false);
    });
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.orange + '33', border: '2px solid ' + C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✦</div>
        <div>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.orange }}>AURA AI</div>
          <div style={{ fontSize: 10, color: C.muted }}>Analytics Intelligence</div>
        </div>
      </div>
      <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>LAST STREAM DATA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Peak Viewers', streamData.peakViewers], ['Avg Watch', streamData.avgWatch], ['Gems', fmtGems(streamData.gems)], ['New Followers', '+' + streamData.newFollowers]].map(function(item) {
            return (
              <div key={item[0]} style={{ padding: 8, background: C.slate2, borderRadius: 3 }}>
                <div style={{ fontSize: 16, fontFamily: 'monospace', color: C.gold }}>{item[1]}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{item[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={generate} disabled={loading}
        style={{ background: C.orange, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer', borderRadius: 2, width: '100%', marginBottom: 12 }}>
        {loading ? 'ANALYZING...' : '✦ GENERATE AURA INSIGHTS'}
      </button>
      {insight && (
        <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{insight}</div>
      )}
    </div>
  );
}

function GuardianV2() {
  var [testMsg, setTestMsg] = useState('');
  var [score, setScore] = useState(null);
  var [loading, setLoading] = useState(false);
  var recentFlags = [
    { msg: '[user removed]', score: 0.87, action: 'MUTED', ts: Date.now() - 120000 },
    { msg: '[content hidden]', score: 0.62, action: 'FLAGGED', ts: Date.now() - 300000 },
    { msg: '[user banned]', score: 0.97, action: 'BANNED', ts: Date.now() - 600000 },
  ];
  function getAction(s) {
    if (s >= GUARDIAN_BAN) return { label: 'BAN', color: '#C0392B' };
    if (s >= GUARDIAN_MUTE) return { label: 'MUTE', color: C.orange };
    if (s >= GUARDIAN_FLAG) return { label: 'FLAG', color: '#ffcc00' };
    return { label: 'ALLOW', color: C.green };
  }
  function test() {
    if (!testMsg.trim()) return;
    setLoading(true);
    guardianScore(testMsg).then(function(s) { setScore(s); setLoading(false); });
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.burgundy + '55', border: '2px solid ' + C.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡</div>
        <div>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.burgundy }}>GUARDIAN AI</div>
          <div style={{ fontSize: 10, color: C.muted }}>claude-haiku • Auto-moderation</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[['FLAG', GUARDIAN_FLAG, '#ffcc00'], ['MUTE', GUARDIAN_MUTE, C.orange], ['BAN', GUARDIAN_BAN, '#C0392B']].map(function(item) {
          return (
            <div key={item[0]} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: item[2], fontWeight: 700 }}>{item[1]}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{item[0]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>TEST MESSAGE</div>
        <input value={testMsg} onChange={function(e) { setTestMsg(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') test(); }} placeholder="Enter test message..."
          style={{ width: '100%', background: C.slate2, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
        <button onClick={test} disabled={loading}
          style={{ background: 'none', color: C.gold, border: '1px solid ' + C.gold + '44', padding: '8px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', borderRadius: 2 }}>
          {loading ? 'SCORING...' : 'SCORE MESSAGE'}
        </button>
        {score !== null && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 3, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (score * 100) + '%', background: score >= 0.95 ? '#C0392B' : score >= 0.75 ? C.orange : score >= 0.5 ? '#ffcc00' : C.green, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 14, fontFamily: 'monospace', color: getAction(score).color }}>{score.toFixed(2)} → {getAction(score).label}</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>RECENT FLAGS</div>
      {recentFlags.map(function(f, i) {
        var a = getAction(f.score);
        return (
          <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>{f.msg}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{timeSince(f.ts)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: a.color, fontWeight: 600, fontSize: 12 }}>{f.action}</div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.muted }}>{f.score.toFixed(2)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MusicStudioV2() {
  var [mode, setMode] = useState('lyrics');
  var [prompt, setPrompt] = useState('');
  var [output, setOutput] = useState('');
  var [loading, setLoading] = useState(false);
  var [bpm, setBpm] = useState(90);
  var [beatPattern, setBeatPattern] = useState(
    [0,1,2,3].map(function() { return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(function() { return false; }); })
  );
  var instruments = ['Kick', 'Snare', 'Hi-Hat', 'Perc'];
  var VOLT = '#C8FF00';
  function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    var p = mode === 'lyrics'
      ? 'Write original hip-hop song lyrics inspired by: ' + prompt + '. Include domino culture themes, a hook and 2 verses. Keep it authentic and hype.'
      : 'Create a detailed music vibe/mood board for: ' + prompt + '. Include BPM suggestion, key, instruments, energy level. Context: SeeWhy LIVE domino streaming.';
    var sys = mode === 'lyrics'
      ? 'You are DOMINO, a legendary producer in domino culture hip-hop. Write authentic bars about dominoes, battles, and the Techmunity.'
      : 'You are a music curator for SeeWhy LIVE. Create detailed vibe descriptions for domino culture streams.';
    anthropicChat([{ role: 'user', content: p }], sys, CLAUDE_SONNET).then(function(r) { setOutput(r); setLoading(false); });
  }
  function toggleBeat(row, col) {
    setBeatPattern(function(prev) {
      return prev.map(function(r, i) {
        return i === row ? r.map(function(v, j) { return j === col ? !v : v; }) : r;
      });
    });
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: VOLT + '33', border: '2px solid ' + VOLT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
        <div>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: VOLT }}>MUSIC STUDIO</div>
          <div style={{ fontSize: 10, color: C.muted }}>AI Beat + Lyrics Lab</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['lyrics','✍ LYRICS'],['beats','🥁 BEATS'],['vibe','✦ VIBE']].map(function(t) {
          return <button key={t[0]} onClick={function() { setMode(t[0]); setOutput(''); }}
            style={{ flex: 1, padding: 8, fontSize: 12, fontFamily: "'Bebas Neue',sans-serif", background: mode === t[0] ? VOLT : C.slate, color: mode === t[0] ? '#000' : C.muted, border: '1px solid ' + (mode === t[0] ? VOLT : '#333'), borderRadius: 3, cursor: 'pointer' }}>{t[1]}</button>;
        })}
      </div>
      {(mode === 'lyrics' || mode === 'vibe') && (
        <div>
          <textarea value={prompt} onChange={function(e) { setPrompt(e.target.value); }} placeholder={mode === 'lyrics' ? 'What are the lyrics about? (winning battles, Washington Classic, Techmunity...)' : 'Describe your vibe (late night domino session, tournament hype...)'}
            style={{ width: '100%', background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, minHeight: 80, marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
          <button onClick={generate} disabled={loading}
            style={{ background: VOLT, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer', borderRadius: 2, width: '100%', marginBottom: 10 }}>
            {loading ? 'GENERATING...' : mode === 'lyrics' ? '✍ GENERATE LYRICS' : '✦ CREATE VIBE BOARD'}
          </button>
          {output && <div style={{ background: C.slate, border: '1px solid #333', borderRadius: 6, padding: 12, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{output}</div>}
        </div>
      )}
      {mode === 'beats' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>BPM: {bpm}</div>
              <input type="range" min="60" max="180" value={bpm} onChange={function(e) { setBpm(Number(e.target.value)); }} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto', marginBottom: 10 }}>
            {beatPattern.map(function(row, ri) {
              return (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ width: 44, fontSize: 10, color: C.muted, flexShrink: 0 }}>{instruments[ri]}</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {row.map(function(active, ci) {
                      return <div key={ci} onClick={function() { toggleBeat(ri, ci); }}
                        style={{ width: 16, height: 28, borderRadius: 2, background: active ? VOLT : C.slate2, border: '1px solid ' + (ci % 4 === 0 ? '#444' : '#222'), cursor: 'pointer' }} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <button style={{ background: VOLT, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2, width: '100%' }}>
            ▶ PLAY BEAT
          </button>
        </div>
      )}
    </div>
  );
}

function TranscriptionV2() {
  var [transcript, setTranscript] = useState('');
  var [translated, setTranslated] = useState('');
  var [language, setLanguage] = useState('es');
  var [loading, setLoading] = useState(false);
  var languages = [['es','Spanish'],['fr','French'],['de','German'],['pt','Portuguese'],['ja','Japanese']];
  function translate() {
    if (!transcript.trim()) return;
    setLoading(true);
    var target = languages.find(function(l) { return l[0] === language; });
    anthropicChat([{ role: 'user', content: 'Translate this stream transcript to ' + (target ? target[1] : language) + '. Keep it natural:\n\n' + transcript }],
      'You are a professional translator specializing in live stream content.', CLAUDE_SONNET).then(function(r) { setTranslated(r); setLoading(false); });
  }
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>TRANSCRIPTION</div>
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>LIVE CAPTIONS</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.cyan, marginBottom: 8, wordBreak: 'break-all' }}>https://caption.ninja/receive?room={VDO_ROOM}</div>
        <div style={{ fontSize: 11, color: C.muted }}>Powered by Caption.Ninja • 6 languages supported</div>
      </div>
      <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>TRANSLATE TRANSCRIPT</div>
        <textarea value={transcript} onChange={function(e) { setTranscript(e.target.value); }} placeholder="Paste transcript here..."
          style={{ width: '100%', background: C.slate2, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, minHeight: 100, marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={language} onChange={function(e) { setLanguage(e.target.value); }}
            style={{ flex: 1, background: C.slate2, border: '1px solid #333', borderRadius: 3, padding: 8, color: C.white, fontSize: 13 }}>
            {languages.map(function(l) { return <option key={l[0]} value={l[0]}>{l[1]}</option>; })}
          </select>
          <button onClick={translate} disabled={loading || !transcript.trim()}
            style={{ background: C.gold, color: '#000', border: 'none', padding: '8px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', borderRadius: 2 }}>
            {loading ? 'TRANSLATING...' : 'TRANSLATE'}
          </button>
        </div>
        {translated && <div style={{ background: C.slate2, border: '1px solid #333', borderRadius: 3, padding: 10, fontSize: 13, lineHeight: 1.6 }}>{translated}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WALLET TAB
// ═══════════════════════════════════════════════════════════════
function WalletTabV2() {
  var [subTab, setSubTab] = useState('overview');
  var tabs = [['overview','💎 OVERVIEW'],['gems','⬆ GEMS'],['revenue','📊 REVENUE'],['payouts','💸 PAYOUTS']];
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(function(t) {
          return (
            <button key={t[0]} onClick={function() { setSubTab(t[0]); }}
              style={{ padding: '6px 10px', fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", whiteSpace: 'nowrap', background: subTab === t[0] ? C.gold : C.slate, color: subTab === t[0] ? '#000' : C.muted, border: '1px solid ' + (subTab === t[0] ? C.gold : '#333'), borderRadius: 3, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>
      {subTab === 'overview' && <WalletOverviewV2 />}
      {subTab === 'gems' && <GemPanelV2 />}
      {subTab === 'revenue' && <RevenueCenterV2 />}
      {subTab === 'payouts' && <PayoutsPanelV2 />}
    </div>
  );
}

function WalletOverviewV2() {
  var totalGems = 2847;
  var pendingCents = 18432;
  var thisMonthCents = 4821;
  var creatorCents = Math.floor(thisMonthCents * 0.90);
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#1a0a2e,#80002088)', border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: '20px 16px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: '0.1em' }}>TOTAL GEMS</div>
        <div style={{ fontSize: 40, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, lineHeight: 1 }}>{totalGems.toLocaleString()} 💎</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>${(totalGems * GEM_VALUE).toFixed(2)} USD value</div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + C.gold + '33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted }}>PENDING PAYOUT</div>
            <div style={{ fontSize: 20, fontFamily: "'Bebas Neue',sans-serif", color: C.green }}>{fmt$(pendingCents)}</div>
          </div>
          <button style={{ background: C.gold, color: '#000', border: 'none', padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', borderRadius: 2 }}>REQUEST PAYOUT</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.green }}>{fmt$(creatorCents)}</div>
          <div style={{ fontSize: 10, color: C.muted }}>Your Cut (90%)</div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>{fmt$(Math.floor(thisMonthCents * 0.10))}</div>
          <div style={{ fontSize: 10, color: C.muted }}>Platform (10%)</div>
        </div>
      </div>
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>DIRECT PAYMENTS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['PayPal','CashApp','Venmo','Zelle','Chime'].map(function(p) {
            return <span key={p} style={{ background: C.cyan + '22', color: C.cyan, border: '1px solid ' + C.cyan + '44', fontSize: 10, padding: '2px 8px', borderRadius: 3 }}>{p}</span>;
          })}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Direct payout — 100% to creators, no middlemen</div>
      </div>
    </div>
  );
}

function GemPanelV2() {
  var [selected, setSelected] = useState(100);
  var packs = [[10,1.00],[50,4.99],[100,9.99],[250,24.99],[500,49.99],[1000,99.99]];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 4 }}>GEM ECONOMY</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>1 Gem = $0.10 · Creator earns 90% of all gems</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {packs.map(function(p) {
          return (
            <button key={p[0]} onClick={function() { setSelected(p[0]); }}
              style={{ background: selected === p[0] ? C.gold + '11' : C.slate, border: '1px solid ' + (selected === p[0] ? C.gold : '#2a2a2a'), borderRadius: 6, padding: '10px 8px', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>{p[0]} 💎</div>
              <div style={{ fontSize: 12, color: selected === p[0] ? C.gold : C.muted }}>${p[1].toFixed(2)}</div>
            </button>
          );
        })}
      </div>
      <button style={{ background: C.gold, color: '#000', border: 'none', padding: '14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', borderRadius: 2, width: '100%' }}>
        BUY {selected} GEMS — ${(packs.find(function(p) { return p[0] === selected; }) || [0,0])[1].toFixed(2)}
      </button>
      <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>SEND GEMS</div>
        <input placeholder="@creator handle..." style={{ width: '100%', background: C.slate2, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Amount..." type="number" style={{ flex: 1, background: C.slate2, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13 }} />
          <button style={{ background: C.gold, color: '#000', border: 'none', padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', borderRadius: 2 }}>💎 SEND</button>
        </div>
      </div>
    </div>
  );
}

function RevenueCenterV2() {
  var [period, setPeriod] = useState('30d');
  var data = { '7d': 1240, '30d': 4821, '90d': 14203, 'ytd': 28401 };
  var total = data[period];
  var breakdown = [['Gem Tips', Math.floor(total * 0.45), 45], ['Subscriptions', Math.floor(total * 0.30), 30], ['PPV Events', Math.floor(total * 0.15), 15], ['Battle Wins', Math.floor(total * 0.10), 10]];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>REVENUE CENTER</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['7d','30d','90d','ytd'].map(function(p) {
          return <button key={p} onClick={function() { setPeriod(p); }}
            style={{ flex: 1, padding: 6, fontSize: 12, fontFamily: "'Bebas Neue',sans-serif", background: period === p ? C.gold : C.slate, color: period === p ? '#000' : C.muted, border: '1px solid ' + (period === p ? C.gold : '#333'), borderRadius: 3, cursor: 'pointer' }}>{p.toUpperCase()}</button>;
        })}
      </div>
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: C.muted }}>TOTAL REVENUE</div>
        <div style={{ fontSize: 36, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, lineHeight: 1 }}>{fmt$(total * 100)}</div>
        <div style={{ fontSize: 13, color: C.green, marginTop: 4 }}>You earned: {fmt$(Math.floor(total * 0.90) * 100)}</div>
      </div>
      {breakdown.map(function(b) {
        return (
          <div key={b[0]} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{b[0]}</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: C.gold }}>{fmt$(b[1] * 100)}</span>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 3, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: b[2] + '%', background: 'linear-gradient(90deg,' + C.gold + ',' + C.green + ')' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PayoutsPanelV2() {
  var payouts = [
    { id: 1, amount: 12400, method: 'PayPal', date: 'Jun 25' },
    { id: 2, amount: 8750, method: 'CashApp', date: 'Jun 10' },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>PAYOUTS</div>
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>PENDING PAYOUT</div>
            <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: C.green }}>{fmt$(18432)}</div>
          </div>
          <button style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2 }}>REQUEST</button>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Min payout: $20.00 · Creator gets 90%</div>
      </div>
      <div style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>PAYOUT METHODS</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {['PayPal','CashApp','Venmo','Zelle','Chime'].map(function(m) {
          return <button key={m} style={{ background: 'none', color: C.gold, border: '1px solid ' + C.gold + '44', padding: '6px 12px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>{m}</button>;
        })}
      </div>
      <div style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>HISTORY</div>
      {payouts.map(function(p) {
        return (
          <div key={p.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{fmt$(p.amount)}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{p.method} · {p.date}</div>
            </div>
            <span style={{ background: '#ff000022', color: '#C0392B', border: '1px solid #C0392B44', fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>PAID</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MORE TAB — Tribute + Social + Newsletter + Infra + Settings + About
// ═══════════════════════════════════════════════════════════════
function MoreTab({ user, dispatch }) {
  var [subTab, setSubTab] = useState('tribute');
  var tabs = [['tribute','🕊 TRIBUTE'],['social','🌐 SOCIAL'],['newsletter','✉ NEWS'],['infra','🔧 INFRA'],['about','ℹ ABOUT']];
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(function(t) {
          return (
            <button key={t[0]} onClick={function() { setSubTab(t[0]); }}
              style={{ padding: '5px 9px', fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", whiteSpace: 'nowrap', background: subTab === t[0] ? C.gold : C.slate, color: subTab === t[0] ? '#000' : C.muted, border: '1px solid ' + (subTab === t[0] ? C.gold : '#333'), borderRadius: 3, cursor: 'pointer' }}>
              {t[1]}
            </button>
          );
        })}
      </div>
      {subTab === 'tribute' && <TributeWallV2 />}
      {subTab === 'social' && <SocialExpoV2 />}
      {subTab === 'newsletter' && <NewsletterV2 />}
      {subTab === 'infra' && <InfraV2 />}
      {subTab === 'about' && <AboutV2 />}
    </div>
  );
}

function TributeWallV2() {
  var tributes = [
    { id: 1, name: 'Big Bone Earl', title: 'Legend of the Pacific Northwest', years: '1952-2023', tribute: 'A founding pillar of domino culture in Washington State. His teachings echo through every player in the Northwest.' },
    { id: 2, name: 'Mama Joyce Thompson', title: 'Community Matriarch', years: '1948-2022', tribute: 'She opened her home for 30 years to the domino family. The original Techmunity before tech existed.' },
    { id: 3, name: 'Fast Hands Rodriguez', title: 'Tournament Champion', years: '1965-2024', tribute: '14-time state champion. Nobody ran tiles like Fast Hands. Rest in power.' },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 4 }}>TRIBUTE WALL</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>In memory of our fallen community legends</div>
      {tributes.map(function(t) {
        return (
          <div key={t.id} style={{ background: 'linear-gradient(135deg,#1a0a2e22,#80002011)', border: '1px solid ' + C.gold + '33', borderRadius: 6, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>🕊</div>
              <div>
                <div style={{ fontSize: 20, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>{t.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{t.title} · {t.years}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>"{t.tribute}"</div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>LEAVE A TRIBUTE</div>
        <input placeholder="Name of legend..." style={{ width: '100%', background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
        <textarea placeholder="Write a tribute message..." style={{ width: '100%', background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, minHeight: 80, marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
        <button style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2 }}>🕊 SUBMIT TRIBUTE</button>
      </div>
    </div>
  );
}

function SocialExpoV2() {
  var platforms = [
    { name: 'YouTube', handle: '@SeeWhyLIVE', followers: '8.2K', icon: '▶' },
    { name: 'Instagram', handle: '@seewhylive', followers: '12.4K', icon: '📷' },
    { name: 'TikTok', handle: '@seewhylive', followers: '24.1K', icon: '♪' },
    { name: 'X / Twitter', handle: '@SeeWhyLIVE', followers: '6.8K', icon: '✕' },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>SOCIAL EXPO</div>
      {platforms.map(function(p) {
        return (
          <div key={p.name} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.gold + '22', border: '1px solid ' + C.gold + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{p.handle} · {p.followers} followers</div>
            </div>
            <button style={{ background: 'none', color: C.gold, border: '1px solid ' + C.gold + '44', padding: '4px 10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>FOLLOW</button>
          </div>
        );
      })}
    </div>
  );
}

function NewsletterV2() {
  var [email, setEmail] = useState('');
  var [subscribed, setSubscribed] = useState(false);
  var issues = [
    { title: 'Washington Classic 2025 Recap', date: 'Jun 28', opens: '74%' },
    { title: 'Techmunity Grows to 12K Members', date: 'Jun 21', opens: '68%' },
    { title: 'v46 Platform Launch', date: 'Jun 14', opens: '82%' },
  ];
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>NEWSLETTER HUB</div>
      {!subscribed ? (
        <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 4 }}>JOIN THE TECHMUNITY LIST</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Weekly domino culture, platform updates, and tournament news</div>
          <input value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="your@email.com"
            style={{ width: '100%', background: C.slate, border: '1px solid #333', borderRadius: 3, padding: '8px 10px', color: C.white, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
          <button onClick={function() { if (email.includes('@')) setSubscribed(true); }}
            style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', borderRadius: 2, width: '100%' }}>SUBSCRIBE FREE</button>
        </div>
      ) : (
        <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>✉</div>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',sans-serif", color: C.green }}>YOU'RE IN!</div>
          <div style={{ fontSize: 12, color: C.muted }}>{email}</div>
        </div>
      )}
      <div style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>RECENT ISSUES</div>
      {issues.map(function(n, i) {
        return (
          <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{n.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: C.gold }}>{n.opens}</div>
              <div style={{ fontSize: 10, color: C.muted }}>open rate</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfraV2() {
  var [services, setServices] = useState([
    { name: 'VPS (Hostinger)', url: 'seewhylive.online', status: 'checking' },
    { name: 'MediaMTX RTMP', url: 'rtmp://seewhylive.online:1935', status: 'checking' },
    { name: 'HLS Stream', url: HLS_URL, status: 'checking' },
    { name: 'Socket.IO', url: SOCKET_URL, status: 'checking' },
    { name: 'Supabase DB', url: 'xlrcibziouffgxciecvc', status: 'checking' },
  ]);
  useEffect(function() {
    var t = setTimeout(function() {
      setServices(function(prev) {
        return prev.map(function(s) { return Object.assign({}, s, { status: Math.random() > 0.15 ? 'online' : 'degraded' }); });
      });
    }, 1200);
    return function() { clearTimeout(t); };
  }, []);
  function statusColor(s) { return s === 'online' ? C.green : s === 'degraded' ? C.orange : s === 'offline' ? '#C0392B' : C.muted; }
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 12 }}>INFRASTRUCTURE</div>
      {services.map(function(s, i) {
        return (
          <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, wordBreak: 'break-all' }}>{s.url.substring(0, 40)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: statusColor(s.status), fontSize: 16 }}>{s.status === 'online' ? '●' : s.status === 'degraded' ? '◐' : '...'}</span>
              <span style={{ fontSize: 11, color: statusColor(s.status) }}>{s.status}</span>
            </div>
          </div>
        );
      })}
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 6 }}>VPS INFO</div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, lineHeight: 1.8 }}>
          <div>IP: 76.13.31.91</div>
          <div>RTMP: port 1935</div>
          <div>HLS: port 8888</div>
          <div>VDO.Ninja room: {VDO_ROOM}</div>
          <div>Supabase: xlrcibziouffgxciecvc</div>
        </div>
      </div>
    </div>
  );
}

function AboutV2() {
  return (
    <div>
      <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 4 }}>ABOUT</div>
      <div style={{ background: C.slate2, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: 14, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>SEEWHY LIVE</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>v46 — Ultimate Merge</div>
        <div style={{ fontSize: 12, color: C.gold }}>SwanyThree EntTech LLC</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>by @SwanyThree23</div>
      </div>
      <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 8 }}>PLATFORM CONSTANTS</div>
        {[['Creator Split','90%'],['Platform Fee','10%'],['Gem Value','$0.10'],['Max Guests','20'],['VPS IP','76.13.31.91']].map(function(row) {
          return (
            <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: 12, color: C.muted }}>{row[0]}</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.gold }}>{row[1]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 6, padding: 12 }}>
        <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',sans-serif", color: C.gold, marginBottom: 6 }}>TECHMUNITY</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>Tech + Community = Techmunity. SeeWhy LIVE was built for domino culture — a creator-first platform where the people who build the culture earn 90% of everything they create.</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// V46 BOTTOM NAV PATCH — replaces BottomNav with new 7-tab version
// ═══════════════════════════════════════════════════════════════
function BottomNavV46(props) {
  var page = props.page;
  var dispatch = props.dispatch;
  var notifications = props.notifications || [];
  var unread = notifications.filter(function(n) { return !n.read; }).length;
  var TABS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'battles', icon: '⚔', label: 'Battles', highlight: false },
    { id: 'live', icon: '🔴', label: 'Go Live', highlight: true },
    { id: 'aihub', icon: '🤖', label: 'AI Hub' },
    { id: 'wallet', icon: '💎', label: 'Wallet' },
    { id: 'more', icon: '☰', label: 'More' },
  ];
  var HIDE_ON = ['analytics', 'schedule', 'notifications'];
  if (HIDE_ON.indexOf(page) !== -1) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(5,3,10,0.97)', borderTop: '1px solid rgba(201,168,76,0.2)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)', zIndex: 500 }}>
      {TABS.map(function(t) {
        var active = page === t.id;
        return (
          <button key={t.id} onClick={function() { dispatch({ type: 'SET_PAGE', payload: t.id }); }}
            style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
            {t.highlight ? (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.red + ',' + C.burgundy + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginTop: -14, boxShadow: '0 0 16px rgba(255,59,92,0.4)', border: '3px solid ' + C.charcoal }}>
                {t.icon}
              </div>
            ) : (
              <span style={{ fontSize: 20 }}>{t.icon}</span>
            )}
            <span style={{ color: active ? C.gold : C.muted, fontSize: 9, fontWeight: active ? 800 : 400, letterSpacing: 0.5 }}>{t.label}</span>
            {active && !t.highlight && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: C.gold, borderRadius: 1 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// V46 APP ROUTER PATCH — wire new pages into existing App
// ═══════════════════════════════════════════════════════════════
function AppV46Router({ state, dispatch }) {
  var page = state.page;
  var user = state.user;
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: C.charcoal, color: C.white, fontFamily: 'DM Sans,sans-serif', position: 'relative' }}>
      {page === 'battles' && <BattlesTab user={user} dispatch={dispatch} />}
      {page === 'aihub' && <AIHubTab />}
      {page === 'wallet' && <WalletTabV2 />}
      {page === 'more' && <MoreTab user={user} dispatch={dispatch} />}
      <BottomNavV46 page={page} dispatch={dispatch} notifications={state.notifications || []} />
    </div>
  );
}
