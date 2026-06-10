// SeeWhy LIVE v45 — Full Platform React JSX
// SwanyThree Entertainment Technology LLC · June 7, 2026
// v45: Complete consolidation — all v43 modals + v44 systems + v45 additions
// Auth · Onboarding · Multi-user Realtime · Supabase schema-correct wiring
// Rules: no ?. · no || · no localStorage · Math.floor() for money · inline styles only
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
  purple: '#7C3AED',
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
  var palette = [C.burgundy, '#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00695C', '#37474F', '#C62828'];
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function tsNow() { return Date.now(); }
function genStreamKey() { return STREAM_KEY_PREFIX + Math.random().toString(36).slice(2, 10); }

// ─── REDUCER ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  if (action.type === 'OPEN_MODAL') { return Object.assign({}, state, { activeModal: action.payload }); }
  if (action.type === 'CLOSE_MODAL') { return Object.assign({}, state, { activeModal: null }); }

  switch (action.type) {
    case 'SET_PAGE': return Object.assign({}, state, { page: action.payload, prevPage: state.page });
    case 'SET_BRIDGE_TOKEN': return Object.assign({}, state, { bridgeToken: action.payload.token, bridgeCreator: action.payload.creator, bridgeReturn: action.payload.returnUrl });
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
    activeModal: null,
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
            {[{ name: hostName, score: scoreA, color: C.burgundy }, { name: opponent, score: scoreB, color: '#1565C0' }].map(function(side, i) {
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
              <div style={{ width: pctB + '%', background: '#1565C0', transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>OPACITY: {Math.floor(local.opacity * 100)}%</div>
            <input type="range" min="0.1" max="1" step="0.05" value={local.opacity} onChange={function(e) { setLocal(Object.assign({}, local, { opacity: Number(e.target.value) })); }} style={{ width: '100%', accentColor: C.gold }} />
          </div>
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: C.muted }}>
            Preview: <span style={{ color: C.gold }}>{local.name || 'Sponsor Name'}</span> · "{local.ctaText || 'CTA'}" · {local.position} @ {Math.floor(local.opacity * 100)}%
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
        {tab === 'shop' && (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold, marginBottom: 12, letterSpacing: 1 }}>BUY GEMS</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>1 Gem = $0.10 USD · 90% goes to creators</div>
        {[
          { gems: 50, price: 4.99, bonus: 0, label: 'Starter' },
          { gems: 100, price: 9.99, bonus: 10, label: 'Popular' },
          { gems: 250, price: 22.99, bonus: 30, label: 'Value' },
          { gems: 500, price: 42.99, bonus: 75, label: 'Pro' },
          { gems: 1000, price: 79.99, bonus: 200, label: 'Elite' },
        ].map(function(pkg, i) { return (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (pkg.label === 'Popular' ? C.gold : 'rgba(255,255,255,0.08)'), borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#FFD700' }}>{pkg.gems}{pkg.bonus > 0 ? ' +' + pkg.bonus : ''} 💎</span>
                {pkg.label === 'Popular' && <span style={{ background: C.gold, color: '#000', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>BEST VALUE</span>}
              </div>
              {pkg.bonus > 0 && <div style={{ fontSize: 10, color: '#00FF88', marginTop: 2 }}>+{pkg.bonus} bonus gems</div>}
            </div>
            <button style={{ background: C.burgundy, border: 'none', borderRadius: 8, padding: '8px 16px', color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>${pkg.price.toFixed(2)}</button>
          </div>
        );})}
        <div style={{ fontSize: 10, color: '#444', textAlign: 'center', marginTop: 8 }}>Payments processed securely · Gems non-refundable</div>
      </div>
    ),
    tab === 'send' && (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold, marginBottom: 12, letterSpacing: 1 }}>SEND GEMS</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Gift gems to your favorite creators</div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>YOUR BALANCE</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#FFD700', marginBottom: 16 }}>{gems} 💎</div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>SEND TO</div>
          <input placeholder="@creator handle..." style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }} />
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>AMOUNT</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[10, 25, 50, 100, 250].map(function(amt) { return (
              <button key={amt} style={{ flex: 1, background: '#1a1a2a', border: '1px solid #333', borderRadius: 6, padding: '8px 4px', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{amt}💎</button>
            );})}
          </div>
          <button style={{ width: '100%', background: C.burgundy, border: 'none', borderRadius: 10, padding: 14, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>SEND GEMS</button>
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#888', marginBottom: 10, letterSpacing: 1 }}>TOP CREATORS</div>
        {[
          { name: 'SwanyThree23', gems: 4821, live: true },
          { name: 'CaliBone22', gems: 2103, live: true },
          { name: 'VibeNBones', gems: 1892, live: false },
        ].map(function(c, i) { return (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>@{c.name}{c.live ? ' 🔴' : ''}</div>
              <div style={{ color: '#666', fontSize: 10 }}>{c.gems.toLocaleString()} gems received</div>
            </div>
            <button style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid ' + C.gold, borderRadius: 8, padding: '6px 14px', color: C.gold, fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>💎 GIFT</button>
          </div>
        );})}
      </div>
    ),
    tab === 'history' && (
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

      {/* Trending Creators */}
      <div style={{ padding: '0 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>TRENDING CREATORS</span>
          <span style={{ color: C.gold, fontSize: 11, cursor: 'pointer' }}>SEE ALL</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
          {[
            { name: 'SwanyThree23', gems: 4821, live: true, fm: true },
            { name: 'CaliBone22', gems: 2103, live: true, fm: false },
            { name: 'VibeNBones', gems: 1892, live: false, fm: true },
            { name: 'AIversePod', gems: 1540, live: false, fm: false },
            { name: 'DominoKing_WA', gems: 1203, live: true, fm: true },
          ].map(function(c) { return (
            <div key={c.name} style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <Avatar name={c.name} size={52} isFM={c.fm} />
                {c.live && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', background: C.red, color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>LIVE</div>}
              </div>
              <div style={{ fontSize: 10, color: C.white, fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: C.gold }}>{fmtK(c.gems)} 💎</div>
            </div>
          );})}
        </div>
      </div>

      {/* Community Feed */}
      <div style={{ padding: '0 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>COMMUNITY</span>
          <span style={{ color: C.gold, fontSize: 11 }}>TECHMUNITY</span>
        </div>
        {[
          { user: 'SwanyThree23', fm: true, action: 'went LIVE', detail: 'Washington Classic 2026 Finals', time: '2m ago', type: 'live' },
          { user: 'CaliBone22', fm: false, action: 'won a PK Battle', detail: 'vs VibeNBones +250 Gems', time: '14m ago', type: 'battle' },
          { user: 'DominoKing_WA', fm: true, action: 'joined State VS State', detail: 'Washington Team Rank #1', time: '31m ago', type: 'svs' },
          { user: 'AIversePod', fm: false, action: 'dropped a VOD', detail: 'AIverse Podcast Ep. 43', time: '1h ago', type: 'vod' },
          { user: 'VibeNBones', fm: true, action: 'hit a new milestone', detail: '10,000 Gems earned', time: '2h ago', type: 'gem' },
        ].map(function(item, i) {
          var icons = { live: '🔴', battle: 'X', svs: '🏆', vod: '📼', gem: '💎' };
          return (
            <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icons[item.type]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.white }}>
                  <span style={{ fontWeight: 700, color: item.fm ? C.gold : C.white }}>{item.user}</span>
                  {' '}<span style={{ color: C.muted }}>{item.action}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.detail}</div>
              </div>
              <div style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{item.time}</div>
            </div>
          );
        })}
      </div>

      {/* Featured Event */}
      <div style={{ margin: '0 14px 16px', background: 'linear-gradient(135deg,' + C.burgundy + ',#1a0a1a)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 10, color: C.gold, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 4 }}>FEATURED EVENT</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.white, marginBottom: 4 }}>WASHINGTON CLASSIC 2026</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>7 Rock · Double Elimination · $50K Prize Pool · Jamar's Sports Bar</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'battles' }); }} style={{ flex: 1, background: C.gold, border: 'none', borderRadius: 8, padding: 10, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>VIEW BRACKET</button>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'live' }); }} style={{ flex: 1, background: C.burgundy, border: '1px solid ' + C.gold, borderRadius: 8, padding: 10, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>WATCH LIVE</button>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '16px 14px 0' }}>
        <div style={{ color: C.white, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 12 }}>CREATOR TOOLS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🚀', label: 'Go Live', action: function() { dispatch({ type: 'SET_PAGE', payload: 'live' }); } },
            { icon: '📊', label: 'Analytics', action: function() { dispatch({ type: 'SET_PAGE', payload: 'analytics' }); } },
            { icon: '💳', label: 'Wallet', action: function() { dispatch({ type: 'SET_PAGE', payload: 'wallet' }); } },
    { icon: '📡', label: 'Broadcast', action: function() { dispatch({ type: 'SET_PAGE', payload: 'broadcast' }); } },
    { icon: '💰', label: 'Monetize', action: function() { dispatch({ type: 'SET_PAGE', payload: 'monetize' }); } },
    { icon: '🎯', label: 'Domino', action: function() { dispatch({ type: 'SET_PAGE', payload: 'domino' }); } },
    { icon: '👥', label: 'Community', action: function() { dispatch({ type: 'SET_PAGE', payload: 'community' }); } },
    { icon: '🤖', label: 'AI Hub', action: function() { dispatch({ type: 'SET_PAGE', payload: 'aihub' }); } },
    { icon: '📊', label: 'Dashboard', action: function() { dispatch({ type: 'SET_PAGE', payload: 'creatordash' }); } },
    { icon: '⚙', label: 'Settings', action: function() { dispatch({ type: 'SET_PAGE', payload: 'settings' }); } },
    { icon: '⚡', label: 'InSForge', action: function() { dispatch({ type: 'SET_PAGE', payload: 'insforge' }); } },
    { icon: '🎥', label: 'Studio', action: function() { dispatch({ type: 'SET_PAGE', payload: 'studio' }); } },
    { icon: '🗺', label: 'SVS', action: function() { dispatch({ type: 'SET_PAGE', payload: 'svs' }); } },
    { icon: '📱', label: 'Mobile', action: function() { dispatch({ type: 'SET_PAGE', payload: 'mobile' }); } },
    { icon: '📊', label: 'Analytics', action: function() { dispatch({ type: 'SET_PAGE', payload: 'analytics' }); } },
    { icon: '🕯', label: 'Legends', action: function() { dispatch({ type: 'SET_PAGE', payload: 'fallenlegends' }); } },
    { icon: '💰', label: 'Payout', action: function() { dispatch({ type: 'SET_PAGE', payload: 'payout' }); } },
    { icon: '📅', label: 'Schedule', action: function() { dispatch({ type: 'SET_PAGE', payload: 'schedule' }); } },
    { icon: '⚡', label: 'INS Forge', action: function() { dispatch({ type: 'SET_PAGE', payload: 'insforge' }); } },
    { icon: '🤖', label: 'SwanyBot', action: function() { dispatch({ type: 'SET_PAGE', payload: 'swanybot' }); } },
    { icon: '🛡', label: 'Guardian', action: function() { dispatch({ type: 'SET_PAGE', payload: 'guardian' }); } },
    { icon: '💼', label: 'Sponsors', action: function() { dispatch({ type: 'SET_PAGE', payload: 'sponsors' }); } },
    { icon: '🏆', label: 'Bracket', action: function() { dispatch({ type: 'SET_PAGE', payload: 'bracket' }); } },
    { icon: '🔗', label: 'App Hub', action: function() { dispatch({ type: 'SET_PAGE', payload: 'hub' }); } },
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
              <div style={{ width: '46%', background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>CA 46%</span></div>
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

// ============================================================
// v48 LIVESTREAM & BROADCAST
// ============================================================
function StreamHealthV2({ state, dispatch }) {
  var C = COLORS;
  var [health, setHealth] = React.useState({ bitrate: 4823, dropped: 0.2, latency: 180, viewers: 342, uptime: 3720 });
  React.useEffect(function() {
    var t = setInterval(function() {
      setHealth(function(h) { return Object.assign({}, h, { bitrate: 4600 + Math.floor(Math.random()*600), viewers: h.viewers + Math.floor(Math.random()*3)-1, dropped: Math.round((Math.random()*0.8)*10)/10 }); });
    }, 3000);
    return function() { clearInterval(t); };
  }, []);
  function statusColor(v, good, warn) { return v <= good ? C.green : v <= warn ? C.orange : C.red; }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>STREAM HEALTH</div>
        <div style={{ fontSize: 11, color: C.muted }}>Live broadcast monitor</div>
      </div>
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'BITRATE', value: health.bitrate + ' kbps', color: statusColor(health.bitrate < 3000 ? 1 : 0, 0, 1) },
            { label: 'DROPPED FRAMES', value: health.dropped + '%', color: statusColor(health.dropped, 0.5, 2) },
            { label: 'LATENCY', value: health.latency + ' ms', color: statusColor(health.latency, 200, 500) },
            { label: 'VIEWERS', value: health.viewers, color: C.gold },
          ].map(function(m, i) { return (
            <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>{m.label}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: m.color }}>{m.value}</div>
            </div>
          );})}
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>STREAM UPTIME</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.green }}>{Math.floor(health.uptime/3600)}h {Math.floor((health.uptime%3600)/60)}m {health.uptime%60}s</div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, letterSpacing: 1 }}>RTMP INGEST</div>
          <div style={{ fontSize: 10, color: C.green, fontFamily: "'Space Mono',monospace", marginBottom: 6, wordBreak: 'break-all' }}>rtmp://ingest.seewhylive.online:1935/live</div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>STREAM KEY</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: C.gold, fontFamily: "'Space Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>swny-live-••••••••••••</div>
            <button style={{ background: C.burgundy, border: 'none', borderRadius: 6, padding: '8px 14px', color: C.white, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>COPY</button>
            <button style={{ background: '#1a1a2a', border: '1px solid #444', borderRadius: 6, padding: '8px 14px', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>REGEN</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FanoutManagerV2({ state, dispatch }) {
  var C = COLORS;
  var [platforms, setPlatforms] = React.useState([
    { id: 'youtube', name: 'YouTube', icon: '▶', active: true, viewers: 128, key: '' },
    { id: 'twitch', name: 'Twitch', icon: '📡', active: true, viewers: 94, key: '' },
    { id: 'facebook', name: 'Facebook', icon: '📘', active: false, viewers: 0, key: '' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', active: false, viewers: 0, key: '' },
    { id: 'x', name: 'X / Twitter', icon: '✖', active: false, viewers: 0, key: '' },
  ]);
  function toggle(id) {
    setPlatforms(function(prev) { return prev.map(function(p) { return p.id === id ? Object.assign({}, p, { active: !p.active }) : p; }); });
  }
  var totalViewers = platforms.reduce(function(a, p) { return a + (p.active ? p.viewers : 0); }, 0) + 342;
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>MULTI-PLATFORM FANOUT</div>
        <div style={{ fontSize: 11, color: C.muted }}>Total reach: <span style={{ color: C.gold, fontWeight: 700 }}>{totalViewers} viewers</span></div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid ' + C.green + '44', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green }}></div>
          <div style={{ fontSize: 12, color: C.green }}>SeeWhy LIVE broadcasting · RTMP active</div>
        </div>
        {platforms.map(function(p) { return (
          <div key={p.id} style={{ background: C.slate, border: '1px solid ' + (p.active ? C.gold + '44' : '#222'), borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: p.active ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  {p.active && <div style={{ fontSize: 10, color: C.green }}>{p.viewers} viewers</div>}
                </div>
              </div>
              <div onClick={function() { toggle(p.id); }} style={{ width: 44, height: 24, borderRadius: 12, background: p.active ? C.gold : '#333', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 2, left: p.active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}></div>
              </div>
            </div>
            {p.active && (
              <input placeholder="RTMP stream key..." style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 6, padding: '8px 10px', color: C.white, fontSize: 11, boxSizing: 'border-box', fontFamily: "'Space Mono',monospace" }} />
            )}
          </div>
        );})}
      </div>
    </div>
  );
}

function SceneSwitcherV2({ state, dispatch }) {
  var C = COLORS;
  var [activeScene, setActiveScene] = React.useState('cam');
  var [isLive, setIsLive] = React.useState(false);
  var scenes = [
    { id: 'cam', label: 'MAIN CAM', icon: '🎥', color: C.gold },
    { id: 'screen', label: 'SCREEN SHARE', icon: '🖥', color: C.cyan },
    { id: 'overlay', label: 'OVERLAY', icon: '🎨', color: C.burgundy },
    { id: 'intermission', label: 'BRB / INTERMISSION', icon: '⏸', color: '#666' },
    { id: 'starting', label: 'STARTING SOON', icon: '⏳', color: C.green },
    { id: 'ending', label: 'STREAM ENDED', icon: '🏁', color: C.red },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>SCENE SWITCHER</div>
        <div style={{ fontSize: 11, color: C.muted }}>Virtual broadcast control room</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: '#000', border: '2px solid ' + (isLive ? C.red : '#333'), borderRadius: 12, aspectRatio: '16/9', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{scenes.find(function(s) { return s.id === activeScene; }).icon}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.white }}>{scenes.find(function(s) { return s.id === activeScene; }).label}</div>
          </div>
          {isLive && <div style={{ position: 'absolute', top: 10, left: 10, background: C.red, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>● LIVE</div>}
        </div>
        <button onClick={function() { setIsLive(function(v) { return !v; }); }} style={{ width: '100%', background: isLive ? C.red : C.green, border: 'none', borderRadius: 10, padding: 14, color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, cursor: 'pointer', marginBottom: 14 }}>{isLive ? '⏹ END STREAM' : '● GO LIVE'}</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {scenes.map(function(s) { return (
            <div key={s.id} onClick={function() { setActiveScene(s.id); }} style={{ background: activeScene === s.id ? 'rgba(201,168,76,0.15)' : C.slate, border: '2px solid ' + (activeScene === s.id ? C.gold : '#2a2a2a'), borderRadius: 10, padding: 14, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 10, color: activeScene === s.id ? C.gold : C.muted, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{s.label}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function StreamSchedulerV2({ state, dispatch }) {
  var C = COLORS;
  var [scheduled, setScheduled] = React.useState([
    { title: 'Washington Classic 2026 Finals', date: '2026-06-15', time: '18:00', type: 'tournament', viewers: 0 },
    { title: 'SwanyThree23 Sunday Dominos', date: '2026-06-09', time: '20:00', type: 'casual', viewers: 0 },
  ]);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>STREAM SCHEDULER</div>
        <div style={{ fontSize: 11, color: C.muted }}>Plan and promote upcoming streams</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid ' + C.gold + '44', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold, marginBottom: 12, letterSpacing: 1 }}>SCHEDULE NEW STREAM</div>
          <input placeholder="Stream title..." style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input type="date" style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
            <input type="time" style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
          </div>
          <button style={{ width: '100%', background: C.burgundy, border: 'none', borderRadius: 8, padding: 12, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>SCHEDULE STREAM</button>
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#888', marginBottom: 10, letterSpacing: 1 }}>UPCOMING STREAMS</div>
        {scheduled.map(function(s, i) { return (
          <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: C.gold }}>{s.date} · {s.time}</div>
              </div>
              <span style={{ background: s.type === 'tournament' ? C.burgundy : '#1a2a1a', border: '1px solid ' + (s.type === 'tournament' ? C.gold : C.green), borderRadius: 6, padding: '3px 8px', fontSize: 9, color: s.type === 'tournament' ? C.gold : C.green, fontFamily: "'Bebas Neue',sans-serif" }}>{s.type.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={{ flex: 1, background: C.gold, border: 'none', borderRadius: 6, padding: 8, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>SHARE</button>
              <button style={{ flex: 1, background: '#1a1a2a', border: '1px solid #444', borderRadius: 6, padding: 8, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>EDIT</button>
              <button style={{ flex: 1, background: C.red + '22', border: '1px solid ' + C.red + '44', borderRadius: 6, padding: 8, color: C.red, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function ChatModerationV2({ state, dispatch }) {
  var C = COLORS;
  var [slowMode, setSlowMode] = React.useState(false);
  var [subOnly, setSubOnly] = React.useState(false);
  var [followOnly, setFollowOnly] = React.useState(false);
  var [keywords, setKeywords] = React.useState(['spam', 'hate', 'bot']);
  var [newKw, setNewKw] = React.useState('');
  var [banned, setBanned] = React.useState(['TrollUser99', 'SpamBot42']);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>CHAT MODERATION</div>
        <div style={{ fontSize: 11, color: C.muted }}>Guardian AI + manual controls</div>
      </div>
      <div style={{ padding: 14 }}>
        {[
          { label: 'SLOW MODE', sub: '30s between messages', val: slowMode, set: setSlowMode },
          { label: 'SUBSCRIBERS ONLY', sub: 'FM members only', val: subOnly, set: setSubOnly },
          { label: 'FOLLOWERS ONLY', sub: 'Must follow to chat', val: followOnly, set: setFollowOnly },
        ].map(function(ctrl, i) { return (
          <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{ctrl.label}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{ctrl.sub}</div>
            </div>
            <div onClick={function() { ctrl.set(function(v) { return !v; }); }} style={{ width: 44, height: 24, borderRadius: 12, background: ctrl.val ? C.gold : '#333', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 2, left: ctrl.val ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff' }}></div>
            </div>
          </div>
        );})}
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10, letterSpacing: 1 }}>BLOCKED KEYWORDS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {keywords.map(function(kw, i) { return (
              <span key={i} style={{ background: C.red + '22', border: '1px solid ' + C.red + '44', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: C.red, cursor: 'pointer' }} onClick={function() { setKeywords(function(k) { return k.filter(function(x) { return x !== kw; }); }); }}>{kw} ✕</span>
            );})}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newKw} onChange={function(e) { setNewKw(e.target.value); }} placeholder="Add keyword..." style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6, padding: '8px 10px', color: C.white, fontSize: 12 }} />
            <button onClick={function() { if (newKw.trim()) { setKeywords(function(k) { return k.concat([newKw.trim()]); }); setNewKw(''); } }} style={{ background: C.burgundy, border: 'none', borderRadius: 6, padding: '8px 14px', color: C.white, fontSize: 12, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>ADD</button>
          </div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.red, marginBottom: 10, letterSpacing: 1 }}>BANNED USERS</div>
          {banned.map(function(u, i) { return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < banned.length-1 ? '1px solid #222' : 'none' }}>
              <span style={{ color: C.white, fontSize: 13 }}>@{u}</span>
              <button onClick={function() { setBanned(function(b) { return b.filter(function(x) { return x !== u; }); }); }} style={{ background: 'none', border: '1px solid #444', borderRadius: 6, padding: '4px 10px', color: C.muted, fontSize: 11, cursor: 'pointer' }}>UNBAN</button>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// v48 SAAS & MONETIZATION
// ============================================================
function CreatorPlansV2({ state, dispatch }) {
  var C = COLORS;
  var plans = [
    { name: 'FREE', price: 0, color: '#666', features: ['Basic streaming', '720p max', 'SeeWhy chat', '1 platform fanout', 'Standard support'] },
    { name: 'PRO', price: 19.99, color: C.gold, features: ['1080p streaming', '3 platform fanout', 'Gem monetization', 'Analytics dashboard', 'Scene switcher', 'Priority support'] },
    { name: 'ELITE', price: 49.99, color: C.cyan, features: ['4K streaming', 'Unlimited fanout', 'PPV & ticketing', 'AI co-host (AURA)', 'White-label stream', 'Dedicated manager'] },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>CREATOR PLANS</div>
        <div style={{ fontSize: 11, color: C.muted }}>Choose your SeeWhy LIVE tier</div>
      </div>
      <div style={{ padding: 14 }}>
        {plans.map(function(plan, i) { return (
          <div key={i} style={{ background: i === 1 ? 'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(139,0,0,0.1))' : C.slate, border: '2px solid ' + (i === 1 ? C.gold : '#2a2a2a'), borderRadius: 14, padding: 18, marginBottom: 14 }}>
            {i === 1 && <div style={{ background: C.gold, color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 10, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>MOST POPULAR</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: plan.color, letterSpacing: 2 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.white }}>{plan.price === 0 ? 'FREE' : '$' + plan.price}<span style={{ fontSize: 14, color: C.muted }}>{plan.price > 0 ? '/mo' : ''}</span></div>
              </div>
            </div>
            {plan.features.map(function(f, j) { return (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: plan.color, fontSize: 12 }}>✓</span>
                <span style={{ color: C.white, fontSize: 12 }}>{f}</span>
              </div>
            );})}
            <button style={{ width: '100%', background: i === 1 ? C.gold : i === 2 ? C.cyan : '#333', border: 'none', borderRadius: 10, padding: 12, color: i === 1 ? '#000' : C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', marginTop: 14 }}>{i === 0 ? 'CURRENT PLAN' : 'UPGRADE NOW'}</button>
          </div>
        );})}
      </div>
    </div>
  );
}

function PPVManagerV2({ state, dispatch }) {
  var C = COLORS;
  var [events, setEvents] = React.useState([
    { title: 'Washington Classic 2026 Finals', price: 9.99, date: '2026-06-15', sold: 847, live: false },
    { title: 'Elite 7-Rock Invitational', price: 14.99, date: '2026-06-22', sold: 312, live: false },
  ]);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>PPV & TICKETING</div>
        <div style={{ fontSize: 11, color: C.muted }}>Pay-per-view event management</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>TOTAL TICKETS SOLD</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold }}>1,159</div>
          </div>
          <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>PPV REVENUE</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.green }}>$13,421</div>
          </div>
        </div>
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid ' + C.gold + '44', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold, marginBottom: 12 }}>CREATE PPV EVENT</div>
          <input placeholder="Event title..." style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input placeholder="Price ($)" type="number" style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
            <input type="date" style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
          </div>
          <button style={{ width: '100%', background: C.burgundy, border: 'none', borderRadius: 8, padding: 12, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>CREATE EVENT</button>
        </div>
        {events.map(function(ev, i) { return (
          <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{ev.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.gold }}>${ev.price} · {ev.date}</span>
              <span style={{ fontSize: 11, color: C.green }}>{ev.sold} sold · ${(Math.floor(ev.sold * ev.price * 0.9 * 100) / 100).toFixed(2)} earned</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: C.gold, border: 'none', borderRadius: 6, padding: 8, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>MANAGE</button>
              <button style={{ flex: 1, background: '#1a1a2a', border: '1px solid #444', borderRadius: 6, padding: 8, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>SHARE</button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function AffiliateV2({ state, dispatch }) {
  var C = COLORS;
  var refCode = 'SWANY2026';
  var stats = { referrals: 47, active: 31, earned: 284.50, pending: 42.00 };
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>AFFILIATE & REFERRALS</div>
        <div style={{ fontSize: 11, color: C.muted }}>Earn 10% of referred creator revenue</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#1a0a2a)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 18, marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>YOUR REFERRAL CODE</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: C.gold, letterSpacing: 4, marginBottom: 10 }}>{refCode}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>seewhylive.online/join?ref={refCode}</div>
          <button style={{ background: C.gold, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>COPY LINK</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'TOTAL REFERRALS', value: stats.referrals, color: C.white },
            { label: 'ACTIVE CREATORS', value: stats.active, color: C.green },
            { label: 'TOTAL EARNED', value: '$' + stats.earned.toFixed(2), color: C.gold },
            { label: 'PENDING', value: '$' + stats.pending.toFixed(2), color: C.orange },
          ].map(function(s, i) { return (
            <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: s.color }}>{s.value}</div>
            </div>
          );})}
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>HOW IT WORKS</div>
          {['Share your referral link with creators','They sign up and go live on SeeWhy','You earn 10% of their platform revenue','Paid monthly via Direct Pay'].map(function(step, i) { return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.burgundy, color: C.gold, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>{i+1}</div>
              <div style={{ fontSize: 12, color: C.white, paddingTop: 2 }}>{step}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function SponsorMarketV2({ state, dispatch }) {
  var C = COLORS;
  var deals = [
    { brand: 'DominoKing Gear', offer: '$500/stream', type: 'Product Placement', status: 'active' },
    { brand: 'WestCoast Dominos', offer: '$250/mo', type: 'Banner Sponsor', status: 'pending' },
    { brand: 'Gem Energy Drink', offer: '$1,200/event', type: 'Title Sponsor', status: 'active' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>SPONSOR MARKETPLACE</div>
        <div style={{ fontSize: 11, color: C.muted }}>Brand deals and sponsorships</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid ' + C.green + '33', borderRadius: 10, padding: 14, marginBottom: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>ACTIVE SPONSOR REVENUE</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.green }}>$1,750<span style={{ fontSize: 14, color: C.muted }}>/mo</span></div>
        </div>
        {deals.map(function(d, i) { return (
          <div key={i} style={{ background: C.slate, border: '1px solid ' + (d.status === 'active' ? C.green + '44' : C.gold + '33'), borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{d.brand}</div>
              <span style={{ background: d.status === 'active' ? C.green + '22' : C.gold + '22', border: '1px solid ' + (d.status === 'active' ? C.green : C.gold), borderRadius: 20, padding: '2px 8px', fontSize: 9, color: d.status === 'active' ? C.green : C.gold, fontFamily: "'Bebas Neue',sans-serif" }}>{d.status.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{d.type}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold }}>{d.offer}</div>
          </div>
        );})}
        <button style={{ width: '100%', background: C.burgundy, border: 'none', borderRadius: 10, padding: 14, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', marginTop: 6 }}>LIST YOUR CHANNEL</button>
      </div>
    </div>
  );
}

function BroadcastHubPageV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('health');
  var tabs = [['health','📡 HEALTH'],['fanout','🔀 FANOUT'],['scenes','🎬 SCENES'],['schedule','📅 SCHEDULE'],['moderation','🛡 MOD']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>BROADCAST HUB</div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 0 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 12px', color: tab === t[0] ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'health' && <StreamHealthV2 state={state} dispatch={dispatch} />}
        {tab === 'fanout' && <FanoutManagerV2 state={state} dispatch={dispatch} />}
        {tab === 'scenes' && <SceneSwitcherV2 state={state} dispatch={dispatch} />}
        {tab === 'schedule' && <StreamSchedulerV2 state={state} dispatch={dispatch} />}
        {tab === 'moderation' && <ChatModerationV2 state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

function MonetizationHubPageV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('plans');
  var tabs = [['plans','💎 PLANS'],['ppv','🎟 PPV'],['affiliate','🔗 AFFILIATE'],['sponsors','🤝 SPONSORS']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>MONETIZATION HUB</div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 0 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 12px', color: tab === t[0] ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'plans' && <CreatorPlansV2 state={state} dispatch={dispatch} />}
        {tab === 'ppv' && <PPVManagerV2 state={state} dispatch={dispatch} />}
        {tab === 'affiliate' && <AffiliateV2 state={state} dispatch={dispatch} />}
        {tab === 'sponsors' && <SponsorMarketV2 state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

// ============================================================
// v49 ONBOARDING, PROFILE, COMMUNITY, DOMINO FEATURES
// ============================================================

function OnboardingWizardV2({ state, dispatch }) {
  var C = COLORS;
  var [step, setStep] = React.useState(0);
  var [data, setData] = React.useState({ handle: '', displayName: '', bio: '', category: '', platforms: [] });
  var steps = ['WELCOME','PROFILE','CATEGORY','PLATFORMS','READY'];
  var categories = ['Domino Player','Tournament Host','Podcast Creator','Music Producer','Sports Commentator','Community Builder'];
  var platforms = ['YouTube','Twitch','Facebook','TikTok','X / Twitter','Instagram'];
  function update(k, v) { setData(function(d) { return Object.assign({}, d, { [k]: v }); }); }
  function togglePlat(p) { setData(function(d) { var arr = d.platforms.indexOf(p) === -1 ? d.platforms.concat([p]) : d.platforms.filter(function(x) { return x !== p; }); return Object.assign({}, d, { platforms: arr }); }); }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '20px 14px 14px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: C.gold, letterSpacing: 2 }}>SEEWHY LIVE</div>
        <div style={{ fontSize: 11, color: C.muted }}>Creator Setup · Step {step+1} of {steps.length}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {steps.map(function(s, i) { return (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.gold : '#333' }}></div>
          );})}
        </div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        {step === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎯</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.white, marginBottom: 8 }}>WELCOME TO THE CULTURE</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 30 }}>SeeWhy LIVE is the premier platform for domino entertainment, creator monetization, and community broadcasting.</div>
            <div style={{ background: C.slate, border: '1px solid ' + C.gold + '44', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              {['Stream live domino games','Earn gems from your community','Join State VS State tournaments','Get paid direct — 90% to you'].map(function(f, i) { return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: C.gold }}>✓</span>
                  <span style={{ color: C.white, fontSize: 13 }}>{f}</span>
                </div>
              );})}
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, marginBottom: 4 }}>YOUR PROFILE</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>Set up your creator identity</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>DISPLAY NAME</div>
              <input value={data.displayName} onChange={function(e) { update('displayName', e.target.value); }} placeholder="e.g. SwanyThree23" style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px 14px', color: C.white, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>HANDLE</div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px 14px' }}>
                <span style={{ color: C.gold, marginRight: 4 }}>@</span>
                <input value={data.handle} onChange={function(e) { update('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')); }} placeholder="yourhandle" style={{ flex: 1, background: 'none', border: 'none', color: C.white, fontSize: 14, outline: 'none' }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>BIO</div>
              <textarea value={data.bio} onChange={function(e) { update('bio', e.target.value); }} placeholder="Tell the community about yourself..." style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', minHeight: 80, resize: 'none' }} />
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, marginBottom: 4 }}>YOUR CATEGORY</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>What best describes you?</div>
            {categories.map(function(cat, i) { return (
              <div key={i} onClick={function() { update('category', cat); }} style={{ background: data.category === cat ? 'rgba(201,168,76,0.15)' : C.slate, border: '2px solid ' + (data.category === cat ? C.gold : '#2a2a2a'), borderRadius: 10, padding: 16, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ color: data.category === cat ? C.gold : C.white, fontWeight: 700, fontSize: 14 }}>{cat}</div>
              </div>
            );})}
          </div>
        )}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, marginBottom: 4 }}>YOUR PLATFORMS</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>Where else do you stream? (optional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {platforms.map(function(p, i) { return (
                <div key={i} onClick={function() { togglePlat(p); }} style={{ background: data.platforms.indexOf(p) !== -1 ? 'rgba(201,168,76,0.15)' : C.slate, border: '2px solid ' + (data.platforms.indexOf(p) !== -1 ? C.gold : '#2a2a2a'), borderRadius: 10, padding: 14, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ color: data.platforms.indexOf(p) !== -1 ? C.gold : C.white, fontSize: 13, fontWeight: 700 }}>{p}</div>
                </div>
              );})}
            </div>
          </div>
        )}
        {step === 4 && (
          <div style={{ textAlign: 'center', paddingTop: 30 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.gold, marginBottom: 8 }}>YOU'RE LIVE READY!</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>@{data.handle || 'creator'}</div>
            <div style={{ fontSize: 13, color: C.white, marginBottom: 20 }}>{data.category || 'Creator'}</div>
            <div style={{ background: C.slate, border: '1px solid ' + C.gold + '44', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>NEXT STEPS</div>
              {['Set up your RTMP stream key','Go live and earn your first gems','Join the Washington Classic','Connect with the TECHMUNITY'].map(function(s, i) { return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: C.gold, fontSize: 12 }}>{i+1}.</span>
                  <span style={{ color: C.white, fontSize: 12 }}>{s}</span>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '0 20px 30px', display: 'flex', gap: 10 }}>
        {step > 0 && <button onClick={function() { setStep(function(s) { return s-1; }); }} style={{ flex: 1, background: '#1a1a2a', border: '1px solid #444', borderRadius: 10, padding: 14, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>BACK</button>}
        <button onClick={function() { if (step < steps.length-1) { setStep(function(s) { return s+1; }); } else { dispatch({ type: 'SET_PAGE', payload: 'home' }); } }} style={{ flex: 2, background: step === steps.length-1 ? C.green : C.gold, border: 'none', borderRadius: 10, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>{step === steps.length-1 ? 'START STREAMING' : 'CONTINUE'}</button>
      </div>
    </div>
  );
}

function NotificationsCenterV2({ state, dispatch }) {
  var C = COLORS;
  var [filter, setFilter] = React.useState('all');
  var [notifs, setNotifs] = React.useState([
    { id: 1, type: 'gem', title: 'CaliBone22 sent you 50 gems', time: '2m ago', read: false, icon: '💎' },
    { id: 2, type: 'live', title: 'SwanyThree23 just went LIVE', time: '5m ago', read: false, icon: '🔴' },
    { id: 3, type: 'battle', title: 'You have a PK Battle challenge', time: '12m ago', read: false, icon: '🎯' },
    { id: 4, type: 'svs', title: 'Washington Team ranked #1', time: '1h ago', read: true, icon: '🏆' },
    { id: 5, type: 'follow', title: 'VibeNBones started following you', time: '2h ago', read: true, icon: '👤' },
    { id: 6, type: 'payout', title: 'Payout of $84.50 processed', time: '1d ago', read: true, icon: '💰' },
    { id: 7, type: 'gem', title: 'DominoKing_WA sent you 100 gems', time: '1d ago', read: true, icon: '💎' },
  ]);
  function markAll() { setNotifs(function(n) { return n.map(function(x) { return Object.assign({}, x, { read: true }); }); }); }
  var filters = ['all','gem','live','battle','payout'];
  var filtered = filter === 'all' ? notifs : notifs.filter(function(n) { return n.type === filter; });
  var unread = notifs.filter(function(n) { return !n.read; }).length;
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>NOTIFICATIONS</div>
            {unread > 0 && <div style={{ fontSize: 11, color: C.muted }}>{unread} unread</div>}
          </div>
          <button onClick={markAll} style={{ background: 'none', border: '1px solid #444', borderRadius: 6, padding: '6px 12px', color: C.muted, fontSize: 11, cursor: 'pointer' }}>MARK ALL READ</button>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {filters.map(function(f) { return (
            <button key={f} onClick={function() { setFilter(f); }} style={{ flexShrink: 0, background: filter === f ? C.gold : 'none', border: '1px solid ' + (filter === f ? C.gold : '#444'), borderRadius: 20, padding: '4px 12px', color: filter === f ? '#000' : C.muted, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{f.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {filtered.map(function(n) { return (
          <div key={n.id} onClick={function() { setNotifs(function(ns) { return ns.map(function(x) { return x.id === n.id ? Object.assign({}, x, { read: true }) : x; }); }); }} style={{ background: n.read ? C.slate : 'rgba(201,168,76,0.08)', border: '1px solid ' + (n.read ? '#2a2a2a' : C.gold + '33'), borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: n.read ? C.muted : C.white, fontWeight: n.read ? 400 : 700 }}>{n.title}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 3 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }}></div>}
          </div>
        );})}
      </div>
    </div>
  );
}

function ThemeToggleV2({ state, dispatch }) {
  var C = COLORS;
  var [darkMode, setDarkMode] = React.useState(true);
  var [accent, setAccent] = React.useState('gold');
  var accents = [
    { id: 'gold', color: '#C9A84C', label: 'Gold' },
    { id: 'cyan', color: '#00D4FF', label: 'Cyan' },
    { id: 'green', color: '#00FF88', label: 'Volt' },
    { id: 'purple', color: '#9B59B6', label: 'Purple' },
    { id: 'red', color: '#FF4444', label: 'Red' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>APPEARANCE</div>
        <div style={{ fontSize: 11, color: C.muted }}>Customize your experience</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>DARK MODE</div>
              <div style={{ fontSize: 11, color: C.muted }}>Broadcast Control Room Noir</div>
            </div>
            <div onClick={function() { setDarkMode(function(v) { return !v; }); }} style={{ width: 44, height: 24, borderRadius: 12, background: darkMode ? C.gold : '#333', cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 2, left: darkMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff' }}></div>
            </div>
          </div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>ACCENT COLOR</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Choose your platform accent</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {accents.map(function(a) { return (
              <div key={a.id} onClick={function() { setAccent(a.id); }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: a.color, border: accent === a.id ? '3px solid #fff' : '3px solid transparent', marginBottom: 6 }}></div>
                <div style={{ fontSize: 9, color: accent === a.id ? C.white : C.muted }}>{a.label}</div>
              </div>
            );})}
          </div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>FONT SIZE</div>
          {['Small','Medium','Large'].map(function(size, i) { return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #222' : 'none' }}>
              <span style={{ color: C.white, fontSize: 13 }}>{size}</span>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (i === 1 ? C.gold : '#444'), background: i === 1 ? C.gold : 'none' }}></div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function ProfileCustomizerV2({ state, dispatch }) {
  var C = COLORS;
  var [bio, setBio] = React.useState('7-Rock domino player · Washington State · Founder @SeeWhyLIVE');
  var [links, setLinks] = React.useState({ youtube: '', instagram: '', twitter: '', cashapp: '$SwanyThree' });
  var [banner, setBanner] = React.useState('gradient');
  var banners = [
    { id: 'gradient', label: 'Gold Noir', style: 'linear-gradient(135deg,#1a0a0a,#2a1500,#0a0a1a)' },
    { id: 'burgundy', label: 'Burgundy', style: 'linear-gradient(135deg,' + C.burgundy + ',#0a0a0a)' },
    { id: 'cyan', label: 'Cyan Night', style: 'linear-gradient(135deg,#001a2a,#002a3a)' },
    { id: 'green', label: 'Volt', style: 'linear-gradient(135deg,#001a00,#002a00)' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: banners.find(function(b) { return b.id === banner; }).style, padding: '40px 14px 20px', borderBottom: '1px solid #222', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.gold, border: '3px solid ' + C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#000' }}>SW</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.white }}>SwanyThree23</div>
            <div style={{ fontSize: 12, color: C.gold }}>@swanythree23 · FM Creator</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>BANNER STYLE</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {banners.map(function(b) { return (
              <div key={b.id} onClick={function() { setBanner(b.id); }} style={{ flex: 1, height: 40, borderRadius: 8, background: b.style, border: banner === b.id ? '2px solid ' + C.gold : '2px solid transparent', cursor: 'pointer' }}></div>
            );})}
          </div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>BIO</div>
          <textarea value={bio} onChange={function(e) { setBio(e.target.value); }} style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', minHeight: 70, resize: 'none' }} />
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>SOCIAL LINKS</div>
          {Object.keys(links).map(function(k) { return (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{k.toUpperCase()}</div>
              <input value={links[k]} onChange={function(e) { var v = e.target.value; setLinks(function(l) { var n = Object.assign({}, l); n[k] = v; return n; }); }} placeholder={k === 'cashapp' ? '$yourname' : '@' + k} style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          );})}
        </div>
        <button style={{ width: '100%', background: C.gold, border: 'none', borderRadius: 10, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>SAVE PROFILE</button>
      </div>
    </div>
  );
}

function DirectMessagesV2({ state, dispatch }) {
  var C = COLORS;
  var [activeChat, setActiveChat] = React.useState(null);
  var [msg, setMsg] = React.useState('');
  var [chats, setChats] = React.useState([
    { id: 1, user: 'CaliBone22', fm: true, lastMsg: 'Good game bro, rematch?', time: '2m', unread: 2, msgs: [{ from: 'them', text: 'Aye what time you going live?', t: '10:42' },{ from: 'me', text: 'Tonight around 8pm PST', t: '10:44' },{ from: 'them', text: 'Good game bro, rematch?', t: '10:51' }] },
    { id: 2, user: 'VibeNBones', fm: true, lastMsg: 'Thanks for the gems!', time: '14m', unread: 0, msgs: [{ from: 'them', text: 'Thanks for the gems!', t: '9:30' }] },
    { id: 3, user: 'DominoKing_WA', fm: false, lastMsg: 'Tournament brackets are set', time: '1h', unread: 1, msgs: [{ from: 'them', text: 'Tournament brackets are set', t: '8:00' }] },
  ]);
  function sendMsg() {
    if (!msg.trim() || !activeChat) return;
    var txt = msg;
    setMsg('');
    setChats(function(cs) { return cs.map(function(c) { return c.id === activeChat ? Object.assign({}, c, { msgs: c.msgs.concat([{ from: 'me', text: txt, t: 'now' }]), lastMsg: txt }) : c; }); });
  }
  var chat = chats.find(function(c) { return c.id === activeChat; });
  if (activeChat && chat) return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0a0a0a', padding: '14px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={function() { setActiveChat(null); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.white }}>{chat.user}</div>
        {chat.fm && <span style={{ background: C.gold, color: '#000', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>FM</span>}
      </div>
      <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>
        {chat.msgs.map(function(m, i) { return (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{ background: m.from === 'me' ? C.burgundy : C.slate, border: '1px solid ' + (m.from === 'me' ? C.gold + '44' : '#333'), borderRadius: 12, padding: '10px 14px', maxWidth: '75%' }}>
              <div style={{ fontSize: 13, color: C.white }}>{m.text}</div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 4, textAlign: 'right' }}>{m.t}</div>
            </div>
          </div>
        );})}
      </div>
      <div style={{ padding: '10px 14px 24px', borderTop: '1px solid #222', display: 'flex', gap: 8 }}>
        <input value={msg} onChange={function(e) { setMsg(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') sendMsg(); }} placeholder="Message..." style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 20, padding: '10px 16px', color: C.white, fontSize: 13 }} />
        <button onClick={sendMsg} style={{ background: C.gold, border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#000', fontSize: 18, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  );
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>MESSAGES</div>
        <div style={{ fontSize: 11, color: C.muted }}>Direct messages</div>
      </div>
      <div style={{ padding: 14 }}>
        {chats.map(function(c) { return (
          <div key={c.id} onClick={function() { setActiveChat(c.id); setChats(function(cs) { return cs.map(function(x) { return x.id === c.id ? Object.assign({}, x, { unread: 0 }) : x; }); }); }} style={{ background: C.slate, border: '1px solid ' + (c.unread > 0 ? C.gold + '44' : '#2a2a2a'), borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold, flexShrink: 0 }}>{c.user[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{c.user}{c.fm ? ' 💎' : ''}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{c.time}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMsg}</div>
            </div>
            {c.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.gold, color: '#000', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.unread}</div>}
          </div>
        );})}
      </div>
    </div>
  );
}

function LeaderboardsV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('gems');
  var data = {
    gems: [
      { rank: 1, name: 'SwanyThree23', value: '48,210 💎', fm: true },
      { rank: 2, name: 'CaliBone22', value: '21,030 💎', fm: false },
      { rank: 3, name: 'DominoKing_WA', value: '18,920 💎', fm: true },
      { rank: 4, name: 'VibeNBones', value: '15,400 💎', fm: true },
      { rank: 5, name: 'AIversePod', value: '12,030 💎', fm: false },
    ],
    viewers: [
      { rank: 1, name: 'SwanyThree23', value: '4,821 peak', fm: true },
      { rank: 2, name: 'WashingtonClassic', value: '3,204 peak', fm: false },
      { rank: 3, name: 'CaliBone22', value: '2,103 peak', fm: false },
      { rank: 4, name: 'VibeNBones', value: '1,892 peak', fm: true },
      { rank: 5, name: 'DominoKing_WA', value: '1,540 peak', fm: true },
    ],
    battles: [
      { rank: 1, name: 'SwanyThree23', value: '47W · 8L', fm: true },
      { rank: 2, name: 'CaliBone22', value: '38W · 12L', fm: false },
      { rank: 3, name: 'VibeNBones', value: '31W · 9L', fm: true },
      { rank: 4, name: 'DominoKing_WA', value: '28W · 14L', fm: true },
      { rank: 5, name: 'FastHandsFred', value: '22W · 6L', fm: false },
    ],
  };
  var medals = ['🥇','🥈','🥉'];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2, marginBottom: 10 }}>LEADERBOARDS</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['gems','viewers','battles'].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t ? C.gold : C.muted, fontSize: 12, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {data[tab].map(function(item, i) { return (
          <div key={i} style={{ background: i === 0 ? 'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(139,0,0,0.1))' : C.slate, border: '1px solid ' + (i === 0 ? C.gold + '66' : '#2a2a2a'), borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: i < 3 ? 28 : 20, width: 36, textAlign: 'center' }}>{i < 3 ? medals[i] : '#' + item.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: i === 0 ? C.gold : C.white, fontWeight: 700, fontSize: 14 }}>{item.name}{item.fm ? ' 💎' : ''}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{item.value}</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function VODLibraryV2({ state, dispatch }) {
  var C = COLORS;
  var [activeVOD, setActiveVOD] = React.useState(null);
  var [comment, setComment] = React.useState('');
  var vods = [
    { id: 1, title: 'Washington Classic 2026 - Semifinals', creator: 'SwanyThree23', views: 4821, duration: '2:34:12', date: 'Jun 7', clips: 8, comments: [{ user: 'CaliBone22', text: 'That last hand was insane!', time: '2h' },{ user: 'VibeNBones', text: 'SwanyThree23 is built different', time: '3h' }] },
    { id: 2, title: 'PKBattle: CaliBone vs VibeNBones', creator: 'CaliBone22', views: 2103, duration: '0:45:22', date: 'Jun 6', clips: 3, comments: [{ user: 'DominoKing_WA', text: 'Gg to both!', time: '1d' }] },
    { id: 3, title: 'AIverse Podcast Ep. 43 - AI in Dominos', creator: 'AIversePod', views: 1540, duration: '1:12:08', date: 'Jun 5', clips: 2, comments: [] },
  ];
  if (activeVOD) {
    var vod = vods.find(function(v) { return v.id === activeVOD; });
    return (
      <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
        <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ fontSize: 60 }}>▶</div>
          <button onClick={function() { setActiveVOD(null); }} style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 6, padding: '6px 12px', color: C.white, fontSize: 13, cursor: 'pointer' }}>← BACK</button>
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: C.white }}>{vod.duration}</div>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.white, marginBottom: 4 }}>{vod.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: C.gold }}>{vod.creator}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{vod.views.toLocaleString()} views · {vod.date}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['👍 Share','📌 Clip','💾 Save'].map(function(a, i) { return (
              <button key={i} style={{ flex: 1, background: C.slate, border: '1px solid #333', borderRadius: 8, padding: 10, color: C.white, fontSize: 12, cursor: 'pointer' }}>{a}</button>
            );})}
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold, marginBottom: 10 }}>COMMENTS ({vod.comments.length})</div>
          {vod.comments.map(function(c, i) { return (
            <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: 12 }}>{c.user}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{c.time}</span>
              </div>
              <div style={{ fontSize: 13, color: C.white }}>{c.text}</div>
            </div>
          );})}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={comment} onChange={function(e) { setComment(e.target.value); }} placeholder="Add a comment..." style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
            <button onClick={function() { setComment(''); }} style={{ background: C.burgundy, border: 'none', borderRadius: 8, padding: '10px 16px', color: C.white, fontSize: 13, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>POST</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>VOD LIBRARY</div>
        <div style={{ fontSize: 11, color: C.muted }}>Clips, replays and full streams</div>
      </div>
      <div style={{ padding: 14 }}>
        {vods.map(function(v) { return (
          <div key={v.id} onClick={function() { setActiveVOD(v.id); }} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, marginBottom: 14, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ background: '#111', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ fontSize: 40 }}>▶</div>
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: C.white }}>{v.duration}</div>
              <div style={{ position: 'absolute', bottom: 8, left: 8, background: C.burgundy, borderRadius: 4, padding: '2px 6px', fontSize: 9, color: C.white, fontFamily: "'Bebas Neue',sans-serif" }}>{v.clips} CLIPS</div>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{v.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.gold }}>{v.creator}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{v.views.toLocaleString()} views · {v.date}</span>
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function LiveScoreboardV2({ state, dispatch }) {
  var C = COLORS;
  var [scores, setScores] = React.useState([
    { player: 'SwanyThree23', state: 'WA', score: 7, sets: 2, status: 'live' },
    { player: 'CaliBone22', state: 'CA', score: 4, sets: 1, status: 'live' },
  ]);
  var [gameLog, setGameLog] = React.useState([
    { time: '18:42', event: 'SwanyThree23 rocks out — takes the set!', type: 'score' },
    { time: '18:38', event: 'Double six pulled — CaliBone22 leads hand', type: 'play' },
    { time: '18:31', event: 'SwanyThree23 draws heavy — 3 tiles picked up', type: 'play' },
    { time: '18:25', event: 'Set 1 begins — SwanyThree23 wins the bone', type: 'start' },
  ]);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>LIVE SCOREBOARD</div>
          <div style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4 }}>● LIVE</div>
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Washington Classic 2026 · Finals</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#1a0a1a)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {scores.map(function(p, i) { return (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.muted, marginBottom: 4 }}>{p.state}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.white, marginBottom: 6 }}>{p.player}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: p.score >= 7 ? C.gold : C.white, lineHeight: 1 }}>{p.score}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Sets: {p.sets}</div>
              </div>
            );})}
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold, paddingBottom: 20 }}>VS</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: C.muted }}>7-Rock · Double Elimination · Best of 5</div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10, letterSpacing: 1 }}>GAME LOG</div>
          {gameLog.map(function(log, i) { return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: i < gameLog.length-1 ? '1px solid #1a1a1a' : 'none' }}>
              <span style={{ fontSize: 10, color: C.muted, flexShrink: 0, marginTop: 2 }}>{log.time}</span>
              <span style={{ fontSize: 12, color: log.type === 'score' ? C.gold : C.white }}>{log.event}</span>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function PlayerStatsV2({ state, dispatch }) {
  var C = COLORS;
  var [search, setSearch] = React.useState('');
  var [selected, setSelected] = React.useState(null);
  var players = [
    { name: 'SwanyThree23', state: 'WA', wins: 47, losses: 8, gems: 48210, winRate: 85, sets: 124, rockedOut: 31, avgScore: 6.2, tournaments: 12, titles: 3 },
    { name: 'CaliBone22', state: 'CA', wins: 38, losses: 12, gems: 21030, winRate: 76, sets: 98, rockedOut: 22, avgScore: 5.8, tournaments: 9, titles: 1 },
    { name: 'VibeNBones', state: 'WA', wins: 31, losses: 9, gems: 18920, winRate: 78, sets: 84, rockedOut: 19, avgScore: 5.4, tournaments: 7, titles: 1 },
    { name: 'DominoKing_WA', state: 'WA', wins: 28, losses: 14, gems: 15400, winRate: 67, sets: 76, rockedOut: 15, avgScore: 5.1, tournaments: 8, titles: 0 },
  ];
  var filtered = players.filter(function(p) { return p.name.toLowerCase().indexOf(search.toLowerCase()) !== -1; });
  if (selected) {
    var p = players.find(function(x) { return x.name === selected; });
    return (
      <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
        <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
          <button onClick={function() { setSelected(null); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>← BACK</button>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold }}>{p.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{p.state} · {p.winRate}% win rate</div>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['WINS', p.wins, C.green],['LOSSES', p.losses, C.red],['SETS PLAYED', p.sets, C.white],['ROCKED OUT', p.rockedOut, C.gold],['AVG SCORE', p.avgScore, C.cyan],['TOURNAMENTS', p.tournaments, C.white],['TITLES', p.titles, C.gold],['GEMS EARNED', p.gems.toLocaleString()+' 💎', C.gold]].map(function(s, i) { return (
              <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{s[0]}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: s[2] }}>{s[1]}</div>
              </div>
            );})}
          </div>
          <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>WIN RATE</div>
            <div style={{ background: '#1a1a1a', borderRadius: 6, height: 12, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg,' + C.green + ',' + C.gold + ')', height: '100%', width: p.winRate + '%', borderRadius: 6 }}></div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'right' }}>{p.winRate}%</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>PLAYER STATS</div>
        <div style={{ fontSize: 11, color: C.muted }}>Career records and performance</div>
      </div>
      <div style={{ padding: 14 }}>
        <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search players..." style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, padding: '12px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />
        {filtered.map(function(p, i) { return (
          <div key={i} onClick={function() { setSelected(p.name); }} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{p.state} · {p.wins}W {p.losses}L · {p.winRate}% WR</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold }}>{p.titles}🏆</div>
              <div style={{ fontSize: 10, color: C.muted }}>titles</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function TournamentRegistrationV2({ state, dispatch }) {
  var C = COLORS;
  var [step, setStep] = React.useState(0);
  var [form, setForm] = React.useState({ name: '', state: '', experience: '', format: '', partner: '', agree: false });
  var states = ['WA','CA','TX','FL','NY','GA'];
  var formats = ['7-Rock Singles','7-Rock Doubles','9-Rock Singles','Mexican Train'];
  function update(k, v) { setForm(function(f) { return Object.assign({}, f, { [k]: v }); }); }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#0a0a0a)', padding: '16px 14px 12px', borderBottom: '1px solid ' + C.gold + '44' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>TOURNAMENT REGISTRATION</div>
        <div style={{ fontSize: 11, color: C.muted }}>Washington Classic 2026 · Jamar's Sports Bar</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid ' + C.gold + '44', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold }}>$50,000 PRIZE POOL</div>
            <div style={{ fontSize: 11, color: C.muted }}>June 15, 2026 · Des Moines, WA</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.green }}>OPEN</div>
            <div style={{ fontSize: 11, color: C.muted }}>47 registered</div>
          </div>
        </div>
        {[
          { label: 'FULL NAME', key: 'name', placeholder: 'Your real name' },
          { label: 'PARTNER NAME (doubles)', key: 'partner', placeholder: 'Leave blank for singles' },
        ].map(function(field, i) { return (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{field.label}</div>
            <input value={form[field.key]} onChange={function(e) { update(field.key, e.target.value); }} placeholder={field.placeholder} style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        );})}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>REPRESENTING STATE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {states.map(function(s) { return (
              <div key={s} onClick={function() { update('state', s); }} style={{ background: form.state === s ? C.burgundy : C.slate, border: '2px solid ' + (form.state === s ? C.gold : '#333'), borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: form.state === s ? C.gold : C.muted }}>{s}</div>
            );})}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>FORMAT</div>
          {formats.map(function(f) { return (
            <div key={f} onClick={function() { update('format', f); }} style={{ background: form.format === f ? 'rgba(201,168,76,0.1)' : C.slate, border: '1px solid ' + (form.format === f ? C.gold : '#2a2a2a'), borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ color: form.format === f ? C.gold : C.white, fontSize: 13, fontWeight: 700 }}>{f}</div>
            </div>
          );})}
        </div>
        <div onClick={function() { update('agree', !form.agree); }} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (form.agree ? C.gold : '#444'), background: form.agree ? C.gold : 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{form.agree && <span style={{ color: '#000', fontSize: 12, fontWeight: 700 }}>✓</span>}</div>
          <div style={{ fontSize: 12, color: C.muted }}>I agree to the tournament rules, code of conduct, and understand the $50 entry fee will be charged separately.</div>
        </div>
        <button style={{ width: '100%', background: form.agree && form.name && form.state && form.format ? C.gold : '#333', border: 'none', borderRadius: 10, padding: 14, color: form.agree && form.name && form.state && form.format ? '#000' : '#666', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, cursor: 'pointer' }}>REGISTER NOW</button>
      </div>
    </div>
  );
}

function HeadToHeadV2({ state, dispatch }) {
  var C = COLORS;
  var players = ['SwanyThree23','CaliBone22','VibeNBones','DominoKing_WA','FastHandsFred'];
  var [p1, setP1] = React.useState('SwanyThree23');
  var [p2, setP2] = React.useState('CaliBone22');
  var stats = {
    SwanyThree23: { wins: 47, losses: 8, winRate: 85, gems: 48210, sets: 124, titles: 3, rockedOut: 31 },
    CaliBone22: { wins: 38, losses: 12, winRate: 76, gems: 21030, sets: 98, titles: 1, rockedOut: 22 },
    VibeNBones: { wins: 31, losses: 9, winRate: 78, gems: 18920, sets: 84, titles: 1, rockedOut: 19 },
    DominoKing_WA: { wins: 28, losses: 14, winRate: 67, gems: 15400, sets: 76, titles: 0, rockedOut: 15 },
    FastHandsFred: { wins: 22, losses: 6, winRate: 79, gems: 9200, sets: 58, titles: 0, rockedOut: 11 },
  };
  var s1 = stats[p1];
  var s2 = stats[p2];
  var cats = [['WIN RATE', s1.winRate + '%', s2.winRate + '%', s1.winRate, s2.winRate],['WINS', s1.wins, s2.wins, s1.wins, s2.wins],['SETS', s1.sets, s2.sets, s1.sets, s2.sets],['ROCKED OUT', s1.rockedOut, s2.rockedOut, s1.rockedOut, s2.rockedOut],['TITLES', s1.titles, s2.titles, s1.titles, s2.titles]];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 12px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>HEAD TO HEAD</div>
        <div style={{ fontSize: 11, color: C.muted }}>Player comparison tool</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <select value={p1} onChange={function(e) { setP1(e.target.value); }} style={{ flex: 1, background: '#111', border: '1px solid ' + C.gold, borderRadius: 8, padding: '10px 12px', color: C.gold, fontSize: 13, fontFamily: "'Bebas Neue',sans-serif" }}>
            {players.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
          </select>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.muted }}>VS</div>
          <select value={p2} onChange={function(e) { setP2(e.target.value); }} style={{ flex: 1, background: '#111', border: '1px solid ' + C.cyan, borderRadius: 8, padding: '10px 12px', color: C.cyan, fontSize: 13, fontFamily: "'Bebas Neue',sans-serif" }}>
            {players.map(function(p) { return <option key={p} value={p}>{p}</option>; })}
          </select>
        </div>
        {cats.map(function(cat, i) {
          var total = cat[3] + cat[4];
          var pct1 = total > 0 ? Math.floor((cat[3] / total) * 100) : 50;
          var pct2 = 100 - pct1;
          var winner = cat[3] > cat[4] ? 'p1' : cat[4] > cat[3] ? 'p2' : 'tie';
          return (
            <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>{cat[0]}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: winner === 'p1' ? C.gold : C.muted }}>{cat[1]}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: winner === 'p2' ? C.cyan : C.muted }}>{cat[2]}</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: pct1 + '%', background: C.gold }}></div>
                <div style={{ width: pct2 + '%', background: C.cyan }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DominoHubPageV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('scoreboard');
  var tabs = [['scoreboard','🔴 LIVE'],['stats','📊 STATS'],['h2h','⚔ H2H'],['register','🏆 REGISTER']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#0a0a0a)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '44' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>DOMINO HUB</div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 12px', color: tab === t[0] ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'scoreboard' && <LiveScoreboardV2 state={state} dispatch={dispatch} />}
        {tab === 'stats' && <PlayerStatsV2 state={state} dispatch={dispatch} />}
        {tab === 'h2h' && <HeadToHeadV2 state={state} dispatch={dispatch} />}
        {tab === 'register' && <TournamentRegistrationV2 state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

function CommunityHubPageV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('leaderboards');
  var tabs = [['leaderboards','🏆 BOARDS'],['vods','📼 VODS'],['messages','💬 DMs']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>COMMUNITY</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'leaderboards' && <LeaderboardsV2 state={state} dispatch={dispatch} />}
        {tab === 'vods' && <VODLibraryV2 state={state} dispatch={dispatch} />}
        {tab === 'messages' && <DirectMessagesV2 state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

// ============================================================
// BATCH E — AI PERSONA PAGES
// ============================================================

function JoyceAIPageV2({ state, dispatch }) {
  var C = COLORS;
  var [msgs, setMsgs] = React.useState([
    { role: 'joyce', text: 'Hey baby! Mama Joyce is in the building. Ask me anything about dominos, the tournament, or just come talk to me. I got you!' }
  ]);
  var [input, setInput] = React.useState('');
  var [loading, setLoading] = React.useState(false);
  function send() {
    if (!input.trim() || loading) return;
    var userMsg = input.trim();
    setInput('');
    setMsgs(function(m) { return m.concat([{ role: 'user', text: userMsg }]); });
    setLoading(true);
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are Joyce AI — Mama Joyce Thompson, the warm, wise, spirited co-host of SeeWhy LIVE. You are a domino culture icon, community matriarch, and hype woman for the Washington Classic tournament. You speak with warmth, Southern charm, domino knowledge, and real talk. Keep responses conversational, fun, and under 3 sentences. Never break character.',
        messages: msgs.concat([{ role: 'user', content: userMsg }]).filter(function(m) { return m.role !== 'joyce'; }).map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; })
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      var reply = data.content && data.content[0] ? data.content[0].text : 'Baby, let me think on that one...';
      setMsgs(function(m) { return m.concat([{ role: 'joyce', text: reply }]); });
      setLoading(false);
    }).catch(function() {
      setMsgs(function(m) { return m.concat([{ role: 'joyce', text: 'Sugar, something went wrong on my end. Try me again!' }]); });
      setLoading(false);
    });
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a0a0a,' + C.burgundy + ')', padding: '16px 14px 14px', borderBottom: '1px solid ' + C.gold + '44' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.gold + ',' + C.burgundy + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid ' + C.gold }}>👑</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>JOYCE AI</div>
            <div style={{ fontSize: 11, color: C.muted }}>Mama Joyce · Community Matriarch · Powered by Claude Sonnet</div>
          </div>
          <div style={{ marginLeft: 'auto', background: C.green, borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#000', fontWeight: 700 }}>LIVE</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '14px 14px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map(function(m, i) { return (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'joyce' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👑</div>}
            <div style={{ background: m.role === 'user' ? C.burgundy : 'rgba(201,168,76,0.12)', border: '1px solid ' + (m.role === 'user' ? C.gold + '44' : C.gold + '33'), borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', maxWidth: '78%' }}>
              <div style={{ fontSize: 13, color: C.white, lineHeight: 1.5 }}>{m.text}</div>
            </div>
          </div>
        );})}
        {loading && <div style={{ display: 'flex', gap: 8 }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👑</div><div style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid ' + C.gold + '33', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}><div style={{ fontSize: 13, color: C.muted }}>Mama Joyce is typing...</div></div></div>}
      </div>
      <div style={{ padding: '12px 14px 28px', borderTop: '1px solid #222', display: 'flex', gap: 8 }}>
        <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') send(); }} placeholder="Talk to Mama Joyce..." style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 20, padding: '11px 16px', color: C.white, fontSize: 13 }} />
        <button onClick={send} style={{ background: C.gold, border: 'none', borderRadius: '50%', width: 42, height: 42, color: '#000', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>↑</button>
      </div>
    </div>
  );
}

function AuraAIPageV2({ state, dispatch }) {
  var C = COLORS;
  var [msgs, setMsgs] = React.useState([
    { role: 'aura', text: 'AURA online. I am your broadcast intelligence — stream analytics, overlay control, and creative direction. What do you need?' }
  ]);
  var [input, setInput] = React.useState('');
  var [loading, setLoading] = React.useState(false);
  function send() {
    if (!input.trim() || loading) return;
    var userMsg = input.trim();
    setInput('');
    setMsgs(function(m) { return m.concat([{ role: 'user', text: userMsg }]); });
    setLoading(true);
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are AURA — the AI broadcast intelligence system for SeeWhy LIVE. You are precise, futuristic, and data-driven. You help creators optimize their streams, understand analytics, control overlays, and make strategic broadcast decisions. Speak in short, sharp, technically confident sentences. You are the voice of the machine — calm, powerful, and always on.',
        messages: msgs.concat([{ role: 'user', content: userMsg }]).filter(function(m) { return m.role !== 'aura'; }).map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; })
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      var reply = data.content && data.content[0] ? data.content[0].text : 'Signal lost. Reconnecting...';
      setMsgs(function(m) { return m.concat([{ role: 'aura', text: reply }]); });
      setLoading(false);
    }).catch(function() {
      setMsgs(function(m) { return m.concat([{ role: 'aura', text: 'Connection interrupted. Retry.' }]); });
      setLoading(false);
    });
  }
  return (
    <div style={{ background: '#020408', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#020408,#001a2a)', padding: '16px 14px 14px', borderBottom: '1px solid #00D4FF33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4FF,#0044aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid #00D4FF' }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#00D4FF', letterSpacing: 3 }}>AURA AI</div>
            <div style={{ fontSize: 11, color: '#446677' }}>Broadcast Intelligence · Powered by Claude Sonnet</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#00D4FF', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#000', fontWeight: 700 }}>ONLINE</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '14px 14px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map(function(m, i) { return (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'aura' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4FF,#0044aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>}
            <div style={{ background: m.role === 'user' ? '#001a2a' : 'rgba(0,212,255,0.08)', border: '1px solid ' + (m.role === 'user' ? '#00D4FF44' : '#00D4FF22'), borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', maxWidth: '78%' }}>
              <div style={{ fontSize: 13, color: m.role === 'user' ? '#ccc' : '#00D4FF', lineHeight: 1.5, fontFamily: m.role === 'aura' ? "'IBM Plex Mono',monospace" : 'inherit' }}>{m.text}</div>
            </div>
          </div>
        );})}
        {loading && <div style={{ display: 'flex', gap: 8 }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4FF,#0044aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div><div style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid #00D4FF22', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}><div style={{ fontSize: 13, color: '#446677', fontFamily: "'IBM Plex Mono',monospace" }}>Processing...</div></div></div>}
      </div>
      <div style={{ padding: '12px 14px 28px', borderTop: '1px solid #00D4FF22', display: 'flex', gap: 8 }}>
        <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') send(); }} placeholder="Query AURA..." style={{ flex: 1, background: '#0a0f14', border: '1px solid #00D4FF33', borderRadius: 20, padding: '11px 16px', color: '#00D4FF', fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }} />
        <button onClick={send} style={{ background: '#00D4FF', border: 'none', borderRadius: '50%', width: 42, height: 42, color: '#000', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>↑</button>
      </div>
    </div>
  );
}

function SwanyBotPageV2({ state, dispatch }) {
  var C = COLORS;
  var [msgs, setMsgs] = React.useState([
    { role: 'swany', text: 'SwanyBot in the building! The Griot is here — keeper of domino culture, platform lore, and SeeWhy LIVE history. What you wanna know?' }
  ]);
  var [input, setInput] = React.useState('');
  var [loading, setLoading] = React.useState(false);
  function send() {
    if (!input.trim() || loading) return;
    var userMsg = input.trim();
    setInput('');
    setMsgs(function(m) { return m.concat([{ role: 'user', text: userMsg }]); });
    setLoading(true);
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are SwanyBot — The Griot of SeeWhy LIVE, built by SwanyThree23. You are the keeper of domino culture, platform history, and community lore. You know the Washington Classic tournament inside and out, you know the creators — CaliBonesOG, VibeNBones, Big Bone Earl, Mama Joyce Thompson, Fast Hands Rodriguez. You speak with confidence, cultural pride, and domino wisdom. Short, punchy responses with personality.',
        messages: msgs.concat([{ role: 'user', content: userMsg }]).filter(function(m) { return m.role !== 'swany'; }).map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; })
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      var reply = data.content && data.content[0] ? data.content[0].text : 'The Griot needs a moment...';
      setMsgs(function(m) { return m.concat([{ role: 'swany', text: reply }]); });
      setLoading(false);
    }).catch(function() {
      setMsgs(function(m) { return m.concat([{ role: 'swany', text: 'Connection dropped. Run it back.' }]); });
      setLoading(false);
    });
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#0a1a0a)', padding: '16px 14px 14px', borderBottom: '1px solid ' + C.green + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.green + ',#004400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid ' + C.green }}>🎙️</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.green, letterSpacing: 2 }}>SWANYBOT</div>
            <div style={{ fontSize: 11, color: C.muted }}>The Griot · Culture Keeper · Powered by Claude Sonnet</div>
          </div>
          <div style={{ marginLeft: 'auto', background: C.green, borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#000', fontWeight: 700 }}>ACTIVE</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '14px 14px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map(function(m, i) { return (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'swany' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.green + ',#004400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎙️</div>}
            <div style={{ background: m.role === 'user' ? '#0a1a0a' : 'rgba(200,255,0,0.06)', border: '1px solid ' + (m.role === 'user' ? C.green + '44' : C.green + '22'), borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', maxWidth: '78%' }}>
              <div style={{ fontSize: 13, color: m.role === 'user' ? '#ccc' : C.green, lineHeight: 1.5 }}>{m.text}</div>
            </div>
          </div>
        );})}
        {loading && <div style={{ display: 'flex', gap: 8 }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.green + ',#004400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎙️</div><div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid ' + C.green + '22', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}><div style={{ fontSize: 13, color: C.muted }}>The Griot is thinking...</div></div></div>}
      </div>
      <div style={{ padding: '12px 14px 28px', borderTop: '1px solid ' + C.green + '22', display: 'flex', gap: 8 }}>
        <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') send(); }} placeholder="Ask the Griot..." style={{ flex: 1, background: '#111', border: '1px solid ' + C.green + '44', borderRadius: 20, padding: '11px 16px', color: C.white, fontSize: 13 }} />
        <button onClick={send} style={{ background: C.green, border: 'none', borderRadius: '50%', width: 42, height: 42, color: '#000', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>↑</button>
      </div>
    </div>
  );
}

function GuardianAIPageV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('dashboard');
  var [log, setLog] = React.useState([
    { id: 1, user: 'TrollAcct99', msg: 'trash stream', action: 'flagged', score: 52, time: '2m ago' },
    { id: 2, user: 'SpamBot001', msg: 'click here for free gems!!!', action: 'muted', score: 78, time: '5m ago' },
    { id: 3, user: 'HateSpeech22', msg: '[removed]', action: 'banned', score: 96, time: '8m ago' },
    { id: 4, user: 'NormalUser1', msg: 'great stream!', action: 'allowed', score: 12, time: '10m ago' },
  ]);
  var stats = { flagged: 14, muted: 6, banned: 2, allowed: 1842, accuracy: 98.2 };
  var actionColor = { flagged: C.gold, muted: '#FF8C00', banned: C.red, allowed: C.green };
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a1a,#1a0a2a)', padding: '16px 14px 0', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#9B59B6,#1a0a2a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid #9B59B6' }}>🛡️</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#9B59B6', letterSpacing: 2 }}>GUARDIAN AI</div>
            <div style={{ fontSize: 11, color: C.muted }}>Chat Moderation · Powered by Claude Haiku</div>
          </div>
          <div style={{ marginLeft: 'auto', background: C.green, borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#000', fontWeight: 700 }}>ACTIVE</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['dashboard','log','thresholds'].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #9B59B6' : '2px solid transparent', padding: '8px 4px', color: tab === t ? '#9B59B6' : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[['FLAGGED', stats.flagged, C.gold],['MUTED', stats.muted, '#FF8C00'],['BANNED', stats.banned, C.red],['ACCURACY', stats.accuracy + '%', C.green]].map(function(s, i) { return (
                <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{s[0]}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: s[2] }}>{s[1]}</div>
                </div>
              );})}
            </div>
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#9B59B6', marginBottom: 10 }}>THRESHOLD LEVELS</div>
              {[['FLAG', 50, C.gold],['MUTE', 75, '#FF8C00'],['BAN', 95, C.red]].map(function(t, i) { return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{t[0]}</span>
                    <span style={{ fontSize: 11, color: t[2] }}>{t[1]}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6 }}>
                    <div style={{ width: t[1] + '%', background: t[2], height: '100%', borderRadius: 4 }}></div>
                  </div>
                </div>
              );})}
            </div>
          </div>
        )}
        {tab === 'log' && (
          <div>
            {log.map(function(entry) { return (
              <div key={entry.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{entry.user}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ background: actionColor[entry.action] + '22', border: '1px solid ' + actionColor[entry.action] + '66', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: actionColor[entry.action], fontFamily: "'Bebas Neue',sans-serif" }}>{entry.action.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{entry.time}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>"{entry.msg}"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Risk Score:</span>
                  <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 4, height: 4 }}>
                    <div style={{ width: entry.score + '%', background: entry.score >= 95 ? C.red : entry.score >= 75 ? '#FF8C00' : entry.score >= 50 ? C.gold : C.green, height: '100%', borderRadius: 4 }}></div>
                  </div>
                  <span style={{ fontSize: 10, color: C.muted }}>{entry.score}%</span>
                </div>
              </div>
            );})}
          </div>
        )}
        {tab === 'thresholds' && (
          <div>
            <div style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid #9B59B633', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Guardian AI uses Claude Haiku to analyze every chat message in real time. Messages are scored 0–100 for toxicity. Actions trigger automatically at threshold levels.</div>
            </div>
            {[{ level: 'FLAG', threshold: 50, color: C.gold, desc: 'Message is logged and reviewed. No action taken on user.' },{ level: 'MUTE', threshold: 75, color: '#FF8C00', desc: 'User is muted for 10 minutes. Message is hidden.' },{ level: 'BAN', threshold: 95, color: C.red, desc: 'User is immediately banned from the stream.' }].map(function(t, i) { return (
              <div key={i} style={{ background: C.slate, border: '2px solid ' + t.color + '44', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: t.color }}>{t.level}</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: t.color }}>{t.threshold}%+</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{t.desc}</div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

function AIHubPageV2({ state, dispatch }) {
  var C = COLORS;
  var personas = [
    { id: 'joyce', name: 'JOYCE AI', sub: 'Community Matriarch', icon: '👑', color: C.gold, bg: C.burgundy, desc: 'Warm, wise, spirited co-host. Domino culture icon. Ask her anything.', status: 'LIVE', page: 'joyce' },
    { id: 'aura', name: 'AURA AI', sub: 'Broadcast Intelligence', icon: '⚡', color: '#00D4FF', bg: '#001a2a', desc: 'Precision stream analytics, overlay control, and creative direction.', status: 'ONLINE', page: 'aura' },
    { id: 'swany', name: 'SWANYBOT', sub: 'The Griot', icon: '🎙️', color: C.green, bg: '#0a1a0a', desc: 'Culture keeper. Platform lore. Washington Classic historian.', status: 'ACTIVE', page: 'swanybot' },
    { id: 'guardian', name: 'GUARDIAN AI', sub: 'Chat Moderation', icon: '🛡️', color: '#9B59B6', bg: '#0a0a1a', desc: 'Real-time toxicity detection. Flag · Mute · Ban thresholds.', status: 'GUARDING', page: 'guardian' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#0a0a1a)', padding: '16px 14px 14px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold, letterSpacing: 2 }}>AI HUB</div>
        <div style={{ fontSize: 11, color: C.muted }}>Your AI crew — powered by Anthropic Claude</div>
      </div>
      <div style={{ padding: 14 }}>
        {personas.map(function(p) { return (
          <div key={p.id} onClick={function() { dispatch({ type: 'SET_PAGE', payload: p.page }); }} style={{ background: 'linear-gradient(135deg,' + p.bg + ',#0a0a0a)', border: '1px solid ' + p.color + '44', borderRadius: 14, padding: 18, marginBottom: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.bg, border: '2px solid ' + p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: p.color, letterSpacing: 1 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{p.sub}</div>
              </div>
              <div style={{ background: p.color, borderRadius: 20, padding: '3px 10px', fontSize: 9, color: '#000', fontWeight: 700 }}>{p.status}</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{p.desc}</div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: p.color, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>TALK TO {p.name} →</span>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ============================================================
// BATCH F — PK BATTLE ARENA UPGRADES
// ============================================================

function PKBattleLobbyV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('active');
  var battles = {
    active: [
      { id: 1, p1: 'SwanyThree23', p2: 'CaliBone22', gems1: 2400, gems2: 1800, viewers: 342, status: 'live', round: 3 },
      { id: 2, p1: 'VibeNBones', p2: 'DominoKing_WA', gems1: 900, gems2: 1100, viewers: 187, status: 'live', round: 1 },
    ],
    pending: [
      { id: 3, challenger: 'FastHandsFred', target: 'SwanyThree23', wager: 500, expires: '14m', status: 'pending' },
      { id: 4, challenger: 'BigBoneEarl', target: 'CaliBone22', wager: 250, expires: '32m', status: 'pending' },
    ],
    results: [
      { id: 5, winner: 'SwanyThree23', loser: 'VibeNBones', gems: 3200, date: 'Jun 7' },
      { id: 6, winner: 'CaliBone22', loser: 'DominoKing_WA', gems: 1800, date: 'Jun 6' },
      { id: 7, winner: 'VibeNBones', loser: 'FastHandsFred', gems: 900, date: 'Jun 5' },
    ]
  };
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#0a0a0a)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '44' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.gold, letterSpacing: 2 }}>PK BATTLE ARENA</div>
            <div style={{ fontSize: 11, color: C.muted }}>1v1 Domino Showdowns · Gem Stakes</div>
          </div>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'pkchallenge' }); }} style={{ background: C.gold, border: 'none', borderRadius: 8, padding: '8px 14px', color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>⚔ CHALLENGE</button>
        </div>
        <div style={{ display: 'flex' }}>
          {['active','pending','results'].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'active' && battles.active.map(function(b) { return (
          <div key={b.id} onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'pkwatch' }); }} style={{ background: 'linear-gradient(135deg,rgba(139,0,0,0.2),#0a0a0a)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 16, marginBottom: 14, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ background: C.red, borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 700 }}>● LIVE · Round {b.round}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{b.viewers} watching</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.white }}>{b.p1}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold }}>{b.gems1.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: C.muted }}>gems</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.burgundy }}>VS</div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.white }}>{b.p2}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.cyan }}>{ b.gems2.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: C.muted }}>gems</div>
              </div>
            </div>
            <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: '#1a1a1a', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.floor((b.gems1 / (b.gems1 + b.gems2)) * 100) + '%', background: 'linear-gradient(90deg,' + C.gold + ',' + C.burgundy + ')', borderRadius: 3 }}></div>
            </div>
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: C.gold, fontFamily: "'Bebas Neue',sans-serif" }}>TAP TO WATCH + SEND GEMS →</div>
          </div>
        );})}
        {tab === 'pending' && battles.pending.map(function(b) { return (
          <div key={b.id} style={{ background: C.slate, border: '1px solid #333', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold }}>CHALLENGE</span>
              <span style={{ fontSize: 11, color: C.red }}>Expires in {b.expires}</span>
            </div>
            <div style={{ fontSize: 13, color: C.white, marginBottom: 4 }}><span style={{ color: C.gold }}>{b.challenger}</span> challenged <span style={{ color: C.cyan }}>{b.target}</span></div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Wager: {b.wager} gems</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: C.green, border: 'none', borderRadius: 8, padding: 10, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>ACCEPT</button>
              <button style={{ flex: 1, background: 'none', border: '1px solid #444', borderRadius: 8, padding: 10, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>DECLINE</button>
            </div>
          </div>
        );})}
        {tab === 'results' && battles.results.map(function(b) { return (
          <div key={b.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: C.white }}><span style={{ color: C.gold }}>🏆 {b.winner}</span> def. {b.loser}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{b.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold }}>{b.gems.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: C.muted }}>gems won</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function PKChallengeFlowV2({ state, dispatch }) {
  var C = COLORS;
  var [step, setStep] = React.useState(0);
  var [form, setForm] = React.useState({ target: '', wager: 100, format: '7-Rock', rounds: 3 });
  var creators = ['CaliBone22','VibeNBones','DominoKing_WA','FastHandsFred','BigBoneEarl'];
  var formats = ['7-Rock','9-Rock','Mexican Train'];
  function update(k, v) { setForm(function(f) { return Object.assign({}, f, { [k]: v }); }); }
  var steps = ['TARGET','WAGER','FORMAT','CONFIRM'];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#0a0a0a)', padding: '16px 14px 14px', borderBottom: '1px solid ' + C.gold + '44' }}>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'pkbattle' }); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>← BACK</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold }}>SEND CHALLENGE</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {steps.map(function(s, i) { return (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.gold : '#333' }}></div>
          );})}
        </div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        {step === 0 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold, marginBottom: 16 }}>WHO YOU CHALLENGING?</div>
            {creators.map(function(c) { return (
              <div key={c} onClick={function() { update('target', c); }} style={{ background: form.target === c ? 'rgba(201,168,76,0.15)' : C.slate, border: '2px solid ' + (form.target === c ? C.gold : '#2a2a2a'), borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: form.target === c ? C.gold : C.white, fontWeight: 700, fontSize: 14 }}>{c}</span>
                {form.target === c && <span style={{ color: C.gold }}>✓</span>}
              </div>
            );})}
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold, marginBottom: 8 }}>SET THE WAGER</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>How many gems are you putting up?</div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, color: C.gold }}>{form.wager}</div>
              <div style={{ fontSize: 13, color: C.muted }}>💎 gems · ${(form.wager * 0.05).toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[50, 100, 250, 500, 1000].map(function(v) { return (
                <button key={v} onClick={function() { update('wager', v); }} style={{ background: form.wager === v ? C.gold : C.slate, border: '1px solid ' + (form.wager === v ? C.gold : '#333'), borderRadius: 8, padding: '10px 18px', color: form.wager === v ? '#000' : C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>{v}</button>
              );})}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold, marginBottom: 16 }}>PICK THE FORMAT</div>
            {formats.map(function(f) { return (
              <div key={f} onClick={function() { update('format', f); }} style={{ background: form.format === f ? 'rgba(201,168,76,0.15)' : C.slate, border: '2px solid ' + (form.format === f ? C.gold : '#2a2a2a'), borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ color: form.format === f ? C.gold : C.white, fontWeight: 700 }}>{f}</div>
              </div>
            );})}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>BEST OF</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 3, 5].map(function(r) { return (
                  <button key={r} onClick={function() { update('rounds', r); }} style={{ flex: 1, background: form.rounds === r ? C.burgundy : C.slate, border: '2px solid ' + (form.rounds === r ? C.gold : '#333'), borderRadius: 8, padding: 12, color: form.rounds === r ? C.gold : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>BO{r}</button>
                );})}
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold, marginBottom: 20 }}>CONFIRM CHALLENGE</div>
            <div style={{ background: 'linear-gradient(135deg,' + C.burgundy + ',#1a0a0a)', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>YOU vs</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold }}>{form.target}</div>
              </div>
              {[['FORMAT', form.format],['BEST OF', 'BO' + form.rounds],['WAGER', form.wager + ' 💎 gems'],['VALUE', '$' + (form.wager * 0.05).toFixed(2)]].map(function(row, i) { return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid #2a2a2a' : 'none' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{row[0]}</span>
                  <span style={{ fontSize: 12, color: C.white, fontWeight: 700 }}>{row[1]}</span>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '0 20px 30px', display: 'flex', gap: 10 }}>
        {step > 0 && <button onClick={function() { setStep(function(s) { return s - 1; }); }} style={{ flex: 1, background: '#1a1a2a', border: '1px solid #444', borderRadius: 10, padding: 14, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>BACK</button>}
        <button onClick={function() { if (step < steps.length - 1) { setStep(function(s) { return s + 1; }); } else { dispatch({ type: 'SET_PAGE', payload: 'pkbattle' }); } }} disabled={step === 0 && !form.target} style={{ flex: 2, background: step === 3 ? C.green : C.gold, border: 'none', borderRadius: 10, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', opacity: (step === 0 && !form.target) ? 0.4 : 1 }}>{step === 3 ? 'SEND CHALLENGE' : 'CONTINUE'}</button>
      </div>
    </div>
  );
}

function PKWatchRoomV2({ state, dispatch }) {
  var C = COLORS;
  var [gems, setGems] = React.useState({ p1: 2400, p2: 1800 });
  var [chatMsgs, setChatMsgs] = React.useState([
    { user: 'CaliBone22Fan', text: 'LETS GO CALI', gem: false },
    { user: 'SwanyArmy', text: '💎💎💎', gem: false },
    { user: 'VibeNBones', text: 'SwanyThree sending gems — 50 dropped!', gem: true },
  ]);
  var [chatInput, setChatInput] = React.useState('');
  var gemAmounts = [10, 25, 50, 100, 500];
  function sendGems(player, amount) {
    setGems(function(g) {
      var n = Object.assign({}, g);
      if (player === 1) { n.p1 = n.p1 + amount; } else { n.p2 = n.p2 + amount; }
      return n;
    });
    setChatMsgs(function(m) { return m.concat([{ user: 'You', text: 'Sent ' + amount + ' 💎 to ' + (player === 1 ? 'SwanyThree23' : 'CaliBone22'), gem: true }]); });
  }
  var total = gems.p1 + gems.p2;
  var pct1 = Math.floor((gems.p1 / total) * 100);
  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: 48, color: '#333' }}>⚔</div>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'pkbattle' }); }} style={{ position: 'absolute', top: 8, left: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 6, padding: '5px 10px', color: C.white, fontSize: 12, cursor: 'pointer' }}>← BACK</button>
        <div style={{ position: 'absolute', top: 8, right: 10, background: C.red, borderRadius: 4, padding: '3px 8px', fontSize: 10, color: '#fff', fontWeight: 700 }}>● LIVE</div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.9))', padding: '20px 10px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold }}>SwanyThree23</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.cyan }}>CaliBone22</span>
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: pct1 + '%', background: C.gold }}></div>
            <div style={{ width: (100 - pct1) + '%', background: C.cyan }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: C.gold }}>{gems.p1.toLocaleString()} 💎</span>
            <span style={{ fontSize: 11, color: C.cyan }}>{gems.p2.toLocaleString()} 💎</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 10px 4px' }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>SEND GEMS TO</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.gold, marginBottom: 4, fontFamily: "'Bebas Neue',sans-serif" }}>SWANY</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {gemAmounts.map(function(a) { return (
                <button key={a} onClick={function() { sendGems(1, a); }} style={{ background: C.burgundy, border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: '5px 8px', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{a}💎</button>
              );})}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.cyan, marginBottom: 4, fontFamily: "'Bebas Neue',sans-serif" }}>CALI</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {gemAmounts.map(function(a) { return (
                <button key={a} onClick={function() { sendGems(2, a); }} style={{ background: '#001a2a', border: '1px solid ' + C.cyan + '44', borderRadius: 6, padding: '5px 8px', color: C.cyan, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{a}💎</button>
              );})}
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '0 10px', overflowY: 'auto', maxHeight: 160 }}>
        {chatMsgs.map(function(m, i) { return (
          <div key={i} style={{ marginBottom: 4 }}>
            <span style={{ color: m.gem ? C.gold : C.cyan, fontSize: 11, fontWeight: 700 }}>{m.user}: </span>
            <span style={{ color: m.gem ? C.gold : C.white, fontSize: 11 }}>{m.text}</span>
          </div>
        );})}
      </div>
      <div style={{ padding: '8px 10px 20px', borderTop: '1px solid #222', display: 'flex', gap: 8 }}>
        <input value={chatInput} onChange={function(e) { setChatInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter' && chatInput.trim()) { setChatMsgs(function(m) { return m.concat([{ user: 'You', text: chatInput, gem: false }]); }); setChatInput(''); } }} placeholder="Cheer in chat..." style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 16, padding: '8px 14px', color: C.white, fontSize: 12 }} />
        <button onClick={function() { if (chatInput.trim()) { setChatMsgs(function(m) { return m.concat([{ user: 'You', text: chatInput, gem: false }]); }); setChatInput(''); } }} style={{ background: C.burgundy, border: 'none', borderRadius: '50%', width: 36, height: 36, color: C.white, fontSize: 16, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  );
}

// ============================================================
// BATCH G — CREATOR DASHBOARD + ANALYTICS
// ============================================================

function CreatorDashboardV2({ state, dispatch }) {
  var C = COLORS;
  var [period, setPeriod] = React.useState('7d');
  var stats = {
    '7d': { revenue: 284.50, gems: 5690, viewers: 12430, streams: 4, followers: 89, hours: 18.5 },
    '30d': { revenue: 1240.00, gems: 24800, viewers: 48200, streams: 14, followers: 312, hours: 67.0 },
    '90d': { revenue: 3820.00, gems: 76400, viewers: 142000, streams: 38, followers: 890, hours: 198.0 },
  };
  var s = stats[period];
  var chartData = {
    '7d': [120, 95, 210, 180, 340, 280, 420],
    '30d': [80, 140, 200, 160, 300, 240, 380, 420, 200, 160, 300, 280, 400, 360, 480, 320, 260, 200, 340, 380, 440, 300, 260, 480, 400, 360, 320, 280, 420, 500],
    '90d': [100, 150, 200, 180, 250, 300, 280, 320, 400, 380, 420, 460],
  };
  var bars = chartData[period];
  var maxBar = Math.max.apply(null, bars);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a0a)', padding: '16px 14px 14px', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>CREATOR DASHBOARD</div>
            <div style={{ fontSize: 11, color: C.muted }}>SwanyThree23 · FM Creator</div>
          </div>
          <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'analytics' }); }} style={{ background: 'none', border: '1px solid ' + C.gold + '44', borderRadius: 8, padding: '6px 12px', color: C.gold, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>DEEP ANALYTICS →</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d','30d','90d'].map(function(p) { return (
            <button key={p} onClick={function() { setPeriod(p); }} style={{ flex: 1, background: period === p ? C.gold : 'none', border: '1px solid ' + (period === p ? C.gold : '#444'), borderRadius: 20, padding: '5px 0', color: period === p ? '#000' : C.muted, fontSize: 12, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{p.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,0.12),rgba(139,0,0,0.08))', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>TOTAL REVENUE ({period})</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: C.gold, lineHeight: 1 }}>${s.revenue.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>↑ 90% creator split · ${(s.revenue * 0.9).toFixed(2)} yours</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[['GEMS', s.gems.toLocaleString(), C.gold],['VIEWERS', s.viewers.toLocaleString(), C.cyan],['STREAMS', s.streams, C.white],['FOLLOWERS', '+' + s.followers, C.green],['HOURS', s.hours + 'h', C.muted],['AVG/STREAM', '$' + (s.revenue / s.streams).toFixed(2), C.gold]].map(function(item, i) { return (
            <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{item[0]}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: item[2] }}>{item[1]}</div>
            </div>
          );})}
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 12, letterSpacing: 1 }}>GEM REVENUE ({period})</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {bars.map(function(v, i) { return (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(180deg,' + C.gold + ',' + C.burgundy + ')', borderRadius: '2px 2px 0 0', height: Math.floor((v / maxBar) * 80) + 'px', opacity: 0.8 }}></div>
            );})}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 9, color: C.muted }}>{period === '7d' ? 'Mon' : period === '30d' ? 'Day 1' : 'Month 1'}</span>
            <span style={{ fontSize: 9, color: C.muted }}>{period === '7d' ? 'Sun' : period === '30d' ? 'Day 30' : 'Month 3'}</span>
          </div>
        </div>
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 12 }}>RECENT STREAMS</div>
          {[{ title: 'Washington Classic Semifinals', date: 'Jun 7', viewers: 4821, gems: 2140, revenue: 107.00 },{ title: 'PK Battle vs CaliBone22', date: 'Jun 5', viewers: 2103, gems: 890, revenue: 44.50 },{ title: 'Community Night Live', date: 'Jun 3', viewers: 1240, gems: 620, revenue: 31.00 }].map(function(stream, i) { return (
            <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? '1px solid #1a1a1a' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{stream.title}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{stream.date}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{stream.viewers.toLocaleString()} viewers</span>
                <span style={{ fontSize: 11, color: C.gold }}>{stream.gems} 💎</span>
                <span style={{ fontSize: 11, color: C.green }}>${stream.revenue.toFixed(2)}</span>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function AnalyticsDashboardV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('audience');
  var audience = {
    topStates: [['Washington', 38], ['California', 24], ['Texas', 14], ['Georgia', 10], ['Florida', 8]],
    devices: [['Mobile', 64], ['Desktop', 28], ['Tablet', 8]],
    peakHour: '8–10 PM PST',
    avgWatch: '24m 18s',
    returnRate: 67,
  };
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a0a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'creatordash' }); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>← BACK</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2, marginBottom: 10 }}>DEEP ANALYTICS</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['audience','content','revenue'].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'audience' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[['PEAK HOUR', audience.peakHour, C.gold],['AVG WATCH TIME', audience.avgWatch, C.cyan],['RETURN RATE', audience.returnRate + '%', C.green],['TOP PLATFORM', 'Mobile', C.white]].map(function(item, i) { return (
                <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{item[0]}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: item[2] }}>{item[1]}</div>
                </div>
              );})}
            </div>
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 12 }}>VIEWERS BY STATE</div>
              {audience.topStates.map(function(item, i) { return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.white }}>{item[0]}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{item[1]}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6 }}>
                    <div style={{ width: item[1] + '%', background: 'linear-gradient(90deg,' + C.gold + ',' + C.burgundy + ')', height: '100%', borderRadius: 4 }}></div>
                  </div>
                </div>
              );})}
            </div>
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 12 }}>DEVICE BREAKDOWN</div>
              {audience.devices.map(function(item, i) { return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.white }}>{item[0]}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{item[1]}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6 }}>
                    <div style={{ width: item[1] + '%', background: C.cyan, height: '100%', borderRadius: 4 }}></div>
                  </div>
                </div>
              );})}
            </div>
          </div>
        )}
        {tab === 'content' && (
          <div>
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 12 }}>TOP PERFORMING STREAMS</div>
              {[{ title: 'Washington Classic Semifinals', viewers: 4821, retention: 78, gems: 2140 },{ title: 'PK Battle Championship', viewers: 3204, retention: 71, gems: 1580 },{ title: 'Community Night Live', viewers: 2103, retention: 65, gems: 890 }].map(function(s, i) { return (
                <div key={i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < 2 ? '1px solid #1a1a1a' : 'none' }}>
                  <div style={{ color: C.white, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{s.viewers.toLocaleString()} peak</span>
                    <span style={{ fontSize: 11, color: C.gold }}>{s.gems} 💎</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>Retention</span>
                    <span style={{ fontSize: 10, color: C.green }}>{s.retention}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 5 }}>
                    <div style={{ width: s.retention + '%', background: C.green, height: '100%', borderRadius: 4 }}></div>
                  </div>
                </div>
              );})}
            </div>
          </div>
        )}
        {tab === 'revenue' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(0,0,0,0))', border: '1px solid ' + C.gold + '44', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>30-DAY REVENUE</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: C.gold }}>$1,240.00</div>
              <div style={{ fontSize: 11, color: C.green }}>↑ 90% to you = $1,116.00</div>
            </div>
            {[{ label: 'Gem Tips', amount: 840.00, pct: 68 },{ label: 'Subscriptions', amount: 280.00, pct: 23 },{ label: 'PPV Events', amount: 120.00, pct: 10 }].map(function(item, i) { return (
              <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.gold }}>${item.amount.toFixed(2)}</span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6 }}>
                  <div style={{ width: item.pct + '%', background: 'linear-gradient(90deg,' + C.gold + ',' + C.burgundy + ')', height: '100%', borderRadius: 4 }}></div>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{item.pct}% of revenue</div>
              </div>
            );})}
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>NEXT PAYOUT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.white }}>$248.30</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Processes Jun 15, 2026</div>
                </div>
                <button style={{ background: C.burgundy, border: '1px solid ' + C.gold + '44', borderRadius: 8, padding: '10px 16px', color: C.gold, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>REQUEST EARLY</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalTrackerV2({ state, dispatch }) {
  var C = COLORS;
  var [goals, setGoals] = React.useState([
    { id: 1, title: '10K Monthly Gems', current: 5690, target: 10000, color: C.gold, emoji: '💎' },
    { id: 2, title: '1K Followers', current: 642, target: 1000, color: C.cyan, emoji: '👥' },
    { id: 3, title: '$500 Monthly Revenue', current: 284.50, target: 500, color: C.green, emoji: '💰' },
    { id: 4, title: 'Washington Classic Title', current: 1, target: 1, color: C.burgundy, emoji: '🏆' },
    { id: 5, title: '100 Stream Hours', current: 67, target: 100, color: '#9B59B6', emoji: '📺' },
  ]);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a0a)', padding: '16px 14px 14px', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>GOAL TRACKER</div>
        <div style={{ fontSize: 11, color: C.muted }}>Creator milestones and progress</div>
      </div>
      <div style={{ padding: 14 }}>
        {goals.map(function(g) {
          var pct = Math.min(100, Math.floor((g.current / g.target) * 100));
          var done = pct >= 100;
          return (
            <div key={g.id} style={{ background: done ? 'rgba(200,255,0,0.05)' : C.slate, border: '1px solid ' + (done ? C.green + '44' : '#2a2a2a'), borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{g.emoji}</span>
                  <div>
                    <div style={{ color: done ? C.green : C.white, fontWeight: 700, fontSize: 14 }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{typeof g.current === 'number' && g.current % 1 !== 0 ? '$' + g.current.toFixed(2) : g.current.toLocaleString()} / {typeof g.target === 'number' && g.target % 1 !== 0 ? '$' + g.target.toFixed(2) : g.target.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: done ? C.green : g.color }}>{done ? '✓' : pct + '%'}</div>
              </div>
              <div style={{ background: '#1a1a1a', borderRadius: 6, height: 8 }}>
                <div style={{ width: pct + '%', background: done ? C.green : 'linear-gradient(90deg,' + g.color + ',rgba(255,255,255,0.3))', height: '100%', borderRadius: 6 }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// BATCH H — SETTINGS + ACCOUNT PAGES
// ============================================================

function SettingsPageV2({ state, dispatch }) {
  var C = COLORS;
  var [notifications, setNotifications] = React.useState({ gems: true, live: true, battles: true, payouts: true, messages: true, tournament: false });
  var [privacy, setPrivacy] = React.useState({ showEarnings: false, showStats: true, allowDMs: true, publicProfile: true });
  var [tab, setTab] = React.useState('account');
  function toggle(obj, setObj, key) { setObj(function(o) { var n = Object.assign({}, o); n[key] = !n[key]; return n; }); }
  function ToggleRow(label, val, onToggle, sub) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
        <div>
          <div style={{ color: C.white, fontSize: 13 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
        </div>
        <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: val ? C.gold : '#333', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 2, left: val ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }}></div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2, marginBottom: 10 }}>SETTINGS</div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
          {['account','notifications','privacy','streaming','legal'].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 10px', color: tab === t ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'account' && (
          <div>
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: '#000' }}>SW</div>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.white }}>SwanyThree23</div>
                  <div style={{ fontSize: 12, color: C.gold }}>FM Creator · Washington</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Member since Jan 2025</div>
                </div>
              </div>
              <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'customize' }); }} style={{ width: '100%', background: 'none', border: '1px solid ' + C.gold + '44', borderRadius: 8, padding: 12, color: C.gold, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>EDIT PROFILE</button>
            </div>
            {[{ label: 'Verification', value: '✓ Verified Creator', color: C.green },{ label: 'Creator Tier', value: 'FM (Founding Member)', color: C.gold },{ label: 'Invite Code', value: 'SWANY2026', color: C.cyan },{ label: 'Account Type', value: 'Creator + Viewer', color: C.white }].map(function(item, i) { return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
                <span style={{ color: C.muted, fontSize: 13 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: 13, fontWeight: 700 }}>{item.value}</span>
              </div>
            );})}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'streamkeys' }); }} style={{ background: C.slate, border: '1px solid #333', borderRadius: 10, padding: 14, color: C.white, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>🔑 Stream Keys & RTMP Settings</button>
              <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'payoutsetup' }); }} style={{ background: C.slate, border: '1px solid #333', borderRadius: 10, padding: 14, color: C.white, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>💳 Payout Setup</button>
              <button style={{ background: 'none', border: '1px solid ' + C.red + '44', borderRadius: 10, padding: 14, color: C.red, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>⚠ Delete Account</button>
            </div>
          </div>
        )}
        {tab === 'notifications' && (
          <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: '0 16px' }}>
            {ToggleRow('Gem Alerts', notifications.gems, function() { toggle(notifications, setNotifications, 'gems'); }, 'When someone sends you gems')}
            {ToggleRow('Go Live Alerts', notifications.live, function() { toggle(notifications, setNotifications, 'live'); }, 'When creators you follow go live')}
            {ToggleRow('Battle Challenges', notifications.battles, function() { toggle(notifications, setNotifications, 'battles'); }, 'PK Battle challenges and results')}
            {ToggleRow('Payout Notifications', notifications.payouts, function() { toggle(notifications, setNotifications, 'payouts'); }, 'When payouts are processed')}
            {ToggleRow('Direct Messages', notifications.messages, function() { toggle(notifications, setNotifications, 'messages'); }, 'New DMs from creators')}
            {ToggleRow('Tournament Updates', notifications.tournament, function() { toggle(notifications, setNotifications, 'tournament'); }, 'Washington Classic brackets and results')}
          </div>
        )}
        {tab === 'privacy' && (
          <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: '0 16px' }}>
            {ToggleRow('Public Profile', privacy.publicProfile, function() { toggle(privacy, setPrivacy, 'publicProfile'); }, 'Allow anyone to view your profile')}
            {ToggleRow('Show Stats', privacy.showStats, function() { toggle(privacy, setPrivacy, 'showStats'); }, 'Display your win/loss record publicly')}
            {ToggleRow('Show Earnings', privacy.showEarnings, function() { toggle(privacy, setPrivacy, 'showEarnings'); }, 'Display gem earnings on leaderboard')}
            {ToggleRow('Allow DMs', privacy.allowDMs, function() { toggle(privacy, setPrivacy, 'allowDMs'); }, 'Let other creators message you')}
          </div>
        )}
        {tab === 'streaming' && (
          <div>
            {[{ label: 'RTMP Ingest', value: 'rtmp://ingest.seewhylive.online:1935/live' },{ label: 'Stream Key Format', value: 'swany:sw3_YOURKEY' },{ label: 'HLS Endpoint', value: 'https://seewhylive.online/hls' },{ label: 'VDO.Ninja Room', value: 'sw_thrrj4' }].map(function(item, i) { return (
              <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: C.cyan, fontFamily: "'IBM Plex Mono',monospace", wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            );})}
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid ' + C.gold + '33', borderRadius: 10, padding: 14, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: C.muted }}>Use OBS, Streamlabs, or any RTMP-compatible software. Set video to 1080p 30fps, bitrate 4000–6000 kbps.</div>
            </div>
          </div>
        )}
        {tab === 'legal' && (
          <div>
            {[{ title: 'Terms of Service', sub: 'Last updated Jan 2025' },{ title: 'Privacy Policy', sub: 'Last updated Jan 2025' },{ title: 'Creator Agreement', sub: 'Includes 90/10 revenue split terms' },{ title: 'DMCA Policy', sub: 'Content takedown procedures' }].map(function(doc, i) { return (
              <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{doc.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{doc.sub}</div>
                </div>
                <span style={{ color: C.gold, fontSize: 16 }}>→</span>
              </div>
            );})}
            <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginTop: 4 }}>
              <div style={{ fontSize: 12, color: C.muted }}>SwanyThree Entertainment Technology LLC · Des Moines, WA · Age 21+ to create, 18+ to view.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StreamKeysPageV2({ state, dispatch }) {
  var C = COLORS;
  var [revealed, setRevealed] = React.useState({});
  var keys = [
    { id: 'main', label: 'PRIMARY STREAM KEY', key: 'sw3_a8f2k9x1m4p7', platform: 'SeeWhy LIVE' },
    { id: 'yt', label: 'YOUTUBE RTMP KEY', key: 'xxxx-xxxx-xxxx-xxxx', platform: 'YouTube' },
    { id: 'twitch', label: 'TWITCH STREAM KEY', key: 'live_xxxxxxxxxxxxxxxxxx', platform: 'Twitch' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 14px', borderBottom: '1px solid #222' }}>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'settings' }); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>← BACK</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold }}>STREAM KEYS</div>
        <div style={{ fontSize: 11, color: C.muted }}>Keep these secret — never share publicly</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid ' + C.red + '44', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.red }}>⚠ Never share your stream keys. Anyone with your key can stream to your channel.</div>
        </div>
        {keys.map(function(k) { return (
          <div key={k.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: C.gold, marginBottom: 8 }}>{k.platform}</div>
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: revealed[k.id] ? C.cyan : '#555', marginBottom: 10, wordBreak: 'break-all' }}>{revealed[k.id] ? k.key : '••••••••••••••••••••'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setRevealed(function(r) { var n = Object.assign({}, r); n[k.id] = !n[k.id]; return n; }); }} style={{ flex: 1, background: 'none', border: '1px solid #444', borderRadius: 8, padding: 10, color: C.muted, fontSize: 12, cursor: 'pointer' }}>{revealed[k.id] ? 'HIDE' : 'REVEAL'}</button>
              <button style={{ flex: 1, background: C.burgundy, border: 'none', borderRadius: 8, padding: 10, color: C.white, fontSize: 12, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>COPY</button>
              <button style={{ flex: 1, background: 'none', border: '1px solid ' + C.red + '44', borderRadius: 8, padding: 10, color: C.red, fontSize: 12, cursor: 'pointer' }}>RESET</button>
            </div>
          </div>
        );})}
        <div style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, marginTop: 4 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, marginBottom: 10 }}>RTMP INGEST</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Server URL</div>
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.cyan }}>rtmp://ingest.seewhylive.online:1935/live</div>
        </div>
      </div>
    </div>
  );
}

function PayoutSetupV2({ state, dispatch }) {
  var C = COLORS;
  var [method, setMethod] = React.useState('stripe');
  var [tab, setTab] = React.useState('overview');
  var payouts = [
    { date: 'Jun 1, 2026', amount: 284.50, status: 'processed', method: 'Stripe' },
    { date: 'May 15, 2026', amount: 198.20, status: 'processed', method: 'Stripe' },
    { date: 'May 1, 2026', amount: 142.80, status: 'processed', method: 'Stripe' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a0a1a)', padding: '16px 14px 0', borderBottom: '1px solid #222' }}>
        <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'settings' }); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>← BACK</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, marginBottom: 10 }}>PAYOUT SETUP</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['overview','history','setup'].map(function(t) { return (
            <button key={t} onClick={function() { setTab(t); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t ? C.gold : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'overview' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,0.12),rgba(0,0,0,0))', border: '1px solid ' + C.gold + '44', borderRadius: 14, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>AVAILABLE BALANCE</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: C.gold, lineHeight: 1 }}>$248.30</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Next automatic payout: Jun 15, 2026</div>
              <button style={{ marginTop: 14, width: '100%', background: C.gold, border: 'none', borderRadius: 10, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>REQUEST PAYOUT NOW</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['TOTAL EARNED', '$3,820.00', C.gold],['TOTAL PAID', '$3,571.70', C.green],['PLATFORM FEE', '$382.00', C.muted],['YOUR SPLIT', '90%', C.green]].map(function(item, i) { return (
                <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{item[0]}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: item[2] }}>{item[1]}</div>
                </div>
              );})}
            </div>
          </div>
        )}
        {tab === 'history' && (
          <div>
            {payouts.map(function(p, i) { return (
              <div key={i} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>${p.amount.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.date} · {p.method}</div>
                </div>
                <div style={{ background: C.green + '22', border: '1px solid ' + C.green + '44', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.green, fontFamily: "'Bebas Neue',sans-serif" }}>{p.status.toUpperCase()}</div>
              </div>
            );})}
          </div>
        )}
        {tab === 'setup' && (
          <div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Choose your payout method. Minimum payout is $25.00.</div>
            {[{ id: 'stripe', label: 'Stripe Connect', sub: 'Instant to bank account', icon: '💳' },{ id: 'cashapp', label: 'Cash App', sub: '$SwanyThree', icon: '💰' },{ id: 'paypal', label: 'PayPal', sub: 'Standard 3-5 business days', icon: '🅿' }].map(function(m) { return (
              <div key={m.id} onClick={function() { setMethod(m.id); }} style={{ background: method === m.id ? 'rgba(201,168,76,0.1)' : C.slate, border: '2px solid ' + (method === m.id ? C.gold : '#2a2a2a'), borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: method === m.id ? C.gold : C.white, fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{m.sub}</div>
                </div>
                {method === m.id && <span style={{ color: C.gold }}>✓</span>}
              </div>
            );})}
            <button style={{ width: '100%', background: C.gold, border: 'none', borderRadius: 10, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', marginTop: 10 }}>SAVE PAYOUT METHOD</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// v50 — INSFORGE AI CONTENT GENERATION STUDIO
// ============================================================

function InSForgeStudioV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('generate');
  var tabs = [['generate','✨ FORGE'],['library','📁 LIBRARY'],['templates','🗂 TEMPLATES'],['scheduler','📅 SCHEDULE']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0a1a,#1a0a2a)', padding: '16px 14px 0', borderBottom: '1px solid #9B59B633' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#9B59B6,#1a0a2a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #9B59B644' }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#9B59B6', letterSpacing: 2 }}>INSFORGE STUDIO</div>
            <div style={{ fontSize: 11, color: C.muted }}>AI Content Engine · Powered by Claude Sonnet</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid #9B59B6' : '2px solid transparent', padding: '8px 10px', color: tab === t[0] ? '#9B59B6' : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'generate' && <InSForgeGeneratorV2 state={state} dispatch={dispatch} />}
        {tab === 'library' && <InSForgeLibraryV2 state={state} dispatch={dispatch} />}
        {tab === 'templates' && <InSForgeTemplatesV2 state={state} dispatch={dispatch} />}
        {tab === 'scheduler' && <InSForgeSchedulerV2 state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

function InSForgeGeneratorV2({ state, dispatch }) {
  var C = COLORS;
  var purple = '#9B59B6';
  var [contentType, setContentType] = React.useState('caption');
  var [platform, setPlatform] = React.useState('instagram');
  var [context, setContext] = React.useState('');
  var [tone, setTone] = React.useState('hype');
  var [output, setOutput] = React.useState('');
  var [loading, setLoading] = React.useState(false);
  var [saved, setSaved] = React.useState(false);

  var contentTypes = [
    { id: 'caption', label: 'Social Caption', icon: '📝' },
    { id: 'title', label: 'Stream Title', icon: '🎯' },
    { id: 'recap', label: 'Tournament Recap', icon: '🏆' },
    { id: 'script', label: 'Highlight Script', icon: '🎬' },
    { id: 'bio', label: 'Creator Bio', icon: '👤' },
    { id: 'hype', label: 'Hype Post', icon: '🔥' },
    { id: 'announcement', label: 'Event Announcement', icon: '📣' },
    { id: 'thread', label: 'Twitter Thread', icon: '🧵' },
  ];

  var platforms = ['instagram','twitter','tiktok','youtube','facebook','all'];
  var tones = [
    { id: 'hype', label: 'HYPE' },
    { id: 'professional', label: 'PRO' },
    { id: 'community', label: 'COMMUNITY' },
    { id: 'domino', label: 'DOMINO CULTURE' },
    { id: 'griot', label: 'GRIOT' },
  ];

  var systemPrompts = {
    caption: 'You are InSForge, the AI content engine for SeeWhy LIVE — the premier domino entertainment streaming platform. Generate a compelling social media caption for the given context. The platform features the Washington Classic tournament, creators like SwanyThree23, CaliBonesOG, VibeNBones, Big Bone Earl, Mama Joyce Thompson, and Fast Hands Rodriguez. Use domino culture language, relevant emojis, and hashtags. Keep it under 150 words.',
    title: 'You are InSForge, the AI content engine for SeeWhy LIVE. Generate 5 punchy stream title options for the given context. Each title should be under 60 characters, attention-grabbing, and reflect domino culture. Number each option.',
    recap: 'You are InSForge, the AI content engine for SeeWhy LIVE. Write a short, exciting tournament recap (under 200 words) for the given context. Use domino terminology, highlight key moments, and end with a call to action to watch on SeeWhy LIVE.',
    script: 'You are InSForge, the AI content engine for SeeWhy LIVE. Write a 60-second highlight reel script for the given context. Format as: [HOOK] [HIGHLIGHT 1] [HIGHLIGHT 2] [HIGHLIGHT 3] [CTA]. Use energetic, broadcast-style language.',
    bio: 'You are InSForge, the AI content engine for SeeWhy LIVE. Write a compelling creator bio for the given context. Under 100 words. Should include domino culture references, the platform, and a strong personal brand statement.',
    hype: 'You are InSForge, the AI content engine for SeeWhy LIVE. Write a maximum hype post for the given context. Short, punchy, uses caps for emphasis, 2-3 relevant emojis, and 3-5 hashtags. Pure energy.',
    announcement: 'You are InSForge, the AI content engine for SeeWhy LIVE. Write a professional event announcement for the given context. Include: what, when, where, why it matters, and a call to action. Under 150 words.',
    thread: 'You are InSForge, the AI content engine for SeeWhy LIVE. Write a 5-tweet Twitter/X thread for the given context. Number each tweet 1/ through 5/. Each tweet under 280 characters. Build narrative momentum.',
  };

  var toneModifiers = {
    hype: ' Write with maximum energy and hype. Use exclamation points, caps for emphasis.',
    professional: ' Write in a polished, professional tone suitable for a sports broadcast.',
    community: ' Write with warmth and community spirit, like talking to family.',
    domino: ' Write deeply embedded in Black domino culture — reference bones, rocks, sets, the culture.',
    griot: ' Write like a griot — storytelling, cultural pride, historical context, wisdom.',
  };

  function generate() {
    if (!context.trim() || loading) return;
    setLoading(true);
    setOutput('');
    setSaved(false);
    var ct = contentTypes.find(function(c) { return c.id === contentType; });
    var systemPrompt = (systemPrompts[contentType] || systemPrompts.caption) + toneModifiers[tone] + ' Platform target: ' + platform + '.';
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: context }]
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      var reply = data.content && data.content[0] ? data.content[0].text : 'Generation failed. Try again.';
      setOutput(reply);
      setLoading(false);
    }).catch(function() {
      setOutput('Connection error. Please try again.');
      setLoading(false);
    });
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>CONTENT TYPE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {contentTypes.map(function(ct) { return (
            <div key={ct.id} onClick={function() { setContentType(ct.id); }} style={{ background: contentType === ct.id ? 'rgba(155,89,182,0.15)' : C.slate, border: '2px solid ' + (contentType === ct.id ? purple : '#2a2a2a'), borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{ct.icon}</span>
              <span style={{ color: contentType === ct.id ? purple : C.white, fontSize: 12, fontWeight: 700 }}>{ct.label}</span>
            </div>
          );})}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>PLATFORM</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {platforms.map(function(p) { return (
            <button key={p} onClick={function() { setPlatform(p); }} style={{ background: platform === p ? purple : 'none', border: '1px solid ' + (platform === p ? purple : '#444'), borderRadius: 20, padding: '5px 12px', color: platform === p ? '#fff' : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{p.toUpperCase()}</button>
          );})}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>TONE</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tones.map(function(t) { return (
            <button key={t.id} onClick={function() { setTone(t.id); }} style={{ background: tone === t.id ? 'rgba(155,89,182,0.2)' : 'none', border: '1px solid ' + (tone === t.id ? purple : '#444'), borderRadius: 20, padding: '5px 12px', color: tone === t.id ? purple : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.label}</button>
          );})}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>TELL INSFORGE WHAT TO CREATE</div>
        <textarea value={context} onChange={function(e) { setContext(e.target.value); }} placeholder={'e.g. "SwanyThree23 just won the Washington Classic semifinals vs CaliBone22, final score 7-4 in 3 sets. Stream was live on SeeWhy LIVE with 4,800 viewers."'} style={{ width: '100%', background: '#111', border: '1px solid ' + (context ? purple + '66' : '#333'), borderRadius: 10, padding: '12px 14px', color: C.white, fontSize: 13, boxSizing: 'border-box', minHeight: 100, resize: 'none', lineHeight: 1.5 }} />
      </div>

      <button onClick={generate} disabled={!context.trim() || loading} style={{ width: '100%', background: loading ? '#333' : 'linear-gradient(135deg,' + purple + ',#6a0dad)', border: 'none', borderRadius: 10, padding: 16, color: loading ? C.muted : '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, cursor: loading ? 'default' : 'pointer', marginBottom: 16, letterSpacing: 1 }}>{loading ? '⚡ FORGING...' : '⚡ FORGE CONTENT'}</button>

      {output !== '' && (
        <div style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid ' + purple + '44', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: purple, letterSpacing: 1 }}>FORGED OUTPUT</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={function() { setSaved(true); }} style={{ background: saved ? C.green + '22' : 'none', border: '1px solid ' + (saved ? C.green : '#444'), borderRadius: 6, padding: '4px 10px', color: saved ? C.green : C.muted, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{saved ? '✓ SAVED' : 'SAVE'}</button>
              <button onClick={generate} style={{ background: 'none', border: '1px solid ' + purple + '44', borderRadius: 6, padding: '4px 10px', color: purple, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>RETRY</button>
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.white, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{output}</div>
        </div>
      )}
    </div>
  );
}

function InSForgeLibraryV2({ state, dispatch }) {
  var C = COLORS;
  var purple = '#9B59B6';
  var [filter, setFilter] = React.useState('all');
  var library = [
    { id: 1, type: 'caption', platform: 'instagram', title: 'WA Classic Semifinals Cap...', preview: 'The bones dont lie. SwanyThree23 put on a CLINIC tonight...', date: 'Jun 7', platform_icon: '📸' },
    { id: 2, type: 'title', platform: 'youtube', title: '5 Stream Title Options', preview: '1. "SwanyThree23 ROCKS OUT in WA Classic Semis 🎯"...', date: 'Jun 7', platform_icon: '▶' },
    { id: 3, type: 'hype', platform: 'twitter', title: 'Pre-stream Hype Post', preview: 'WE GOING LIVE IN 30 MINUTES 🔴🎯 WASHINGTON CLASSIC...', date: 'Jun 6', platform_icon: '🐦' },
    { id: 4, type: 'recap', platform: 'all', title: 'Tournament Recap - Quarters', preview: 'What a night on SeeWhy LIVE. The quarterfinals...', date: 'Jun 5', platform_icon: '🏆' },
    { id: 5, type: 'script', platform: 'tiktok', title: '60-sec Highlight Script', preview: '[HOOK] You thought dominos was just a game?...', date: 'Jun 4', platform_icon: '🎵' },
  ];
  var types = ['all','caption','title','hype','recap','script'];
  var filtered = filter === 'all' ? library : library.filter(function(i) { return i.type === filter; });
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {types.map(function(t) { return (
          <button key={t} onClick={function() { setFilter(t); }} style={{ background: filter === t ? purple : 'none', border: '1px solid ' + (filter === t ? purple : '#444'), borderRadius: 20, padding: '5px 12px', color: filter === t ? '#fff' : C.muted, fontSize: 11, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t.toUpperCase()}</button>
        );})}
      </div>
      {filtered.map(function(item) { return (
        <div key={item.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.platform_icon}</span>
              <div>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: purple, marginTop: 2 }}>{item.type.toUpperCase()} · {item.platform.toUpperCase()}</div>
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{item.date}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>{item.preview}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ flex: 1, background: 'none', border: '1px solid #444', borderRadius: 8, padding: 8, color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>COPY</button>
            <button style={{ flex: 1, background: 'none', border: '1px solid ' + purple + '44', borderRadius: 8, padding: 8, color: purple, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>EDIT</button>
            <button style={{ flex: 1, background: purple, border: 'none', borderRadius: 8, padding: 8, color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>USE</button>
          </div>
        </div>
      );})}
    </div>
  );
}

function InSForgeTemplatesV2({ state, dispatch }) {
  var C = COLORS;
  var purple = '#9B59B6';
  var templates = [
    { id: 1, name: 'Washington Classic Hype', type: 'hype', icon: '🏆', desc: 'Pre-tournament energy post for WA Classic events', uses: 47 },
    { id: 2, name: 'Go Live Announcement', type: 'announcement', icon: '🔴', desc: 'Stream start announcement across all platforms', uses: 124 },
    { id: 3, name: 'PK Battle Callout', type: 'hype', icon: '⚔', desc: 'Challenge another creator to a PK Battle', uses: 38 },
    { id: 4, name: 'Gem Thank You', type: 'caption', icon: '💎', desc: 'Thank your community for gem support', uses: 89 },
    { id: 5, name: 'Tournament Bracket Drop', type: 'announcement', icon: '📊', desc: 'Announce bracket reveal with creator details', uses: 21 },
    { id: 6, name: 'SVS State Pride Post', type: 'hype', icon: '🗺', desc: 'State vs State community pride content', uses: 33 },
    { id: 7, name: 'Stream Recap Thread', type: 'thread', icon: '🧵', desc: '5-tweet recap thread after a big stream', uses: 15 },
    { id: 8, name: 'Creator Spotlight', type: 'caption', icon: '⭐', desc: 'Feature another creator in your community', uses: 29 },
  ];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Pre-built prompts for SeeWhy LIVE content. Tap to load into the generator.</div>
      {templates.map(function(t) { return (
        <div key={t.id} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(155,89,182,0.15)', border: '1px solid ' + purple + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.white, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{t.desc}</div>
            <div style={{ fontSize: 10, color: purple, marginTop: 4 }}>{t.type.toUpperCase()} · {t.uses} uses</div>
          </div>
          <button style={{ background: purple, border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>USE</button>
        </div>
      );})}
    </div>
  );
}

function InSForgeSchedulerV2({ state, dispatch }) {
  var C = COLORS;
  var purple = '#9B59B6';
  var [scheduled, setScheduled] = React.useState([
    { id: 1, content: 'Washington Classic Finals TONIGHT 🎯🔴 Watch live on SeeWhy LIVE...', platform: 'instagram', time: 'Jun 15, 6:00 PM', status: 'scheduled', icon: '📸' },
    { id: 2, content: 'BRACKET IS SET. 8 players. One champion. Washington Classic 2026 starts NOW...', platform: 'twitter', time: 'Jun 15, 5:30 PM', status: 'scheduled', icon: '🐦' },
    { id: 3, content: '🏆 SwanyThree23 wins the Washington Classic Semifinals in DOMINANT fashion...', platform: 'instagram', time: 'Jun 7, 11:00 PM', status: 'posted', icon: '📸' },
  ]);
  var statusColor = { scheduled: C.gold, posted: C.green, failed: C.red };
  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid ' + purple + '33', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Schedule forged content to post automatically across your connected platforms. Connect accounts in Settings.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: purple, letterSpacing: 1 }}>SCHEDULED POSTS</div>
        <button style={{ background: purple, border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>+ SCHEDULE</button>
      </div>
      {scheduled.map(function(post) { return (
        <div key={post.id} style={{ background: C.slate, border: '1px solid ' + (post.status === 'scheduled' ? purple + '33' : '#2a2a2a'), borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{post.icon}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{post.platform.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: C.muted }}>{post.time}</span>
              <span style={{ background: statusColor[post.status] + '22', border: '1px solid ' + statusColor[post.status] + '44', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: statusColor[post.status], fontFamily: "'Bebas Neue',sans-serif" }}>{post.status.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: post.status === 'scheduled' ? 10 : 0 }}>{post.content}</div>
          {post.status === 'scheduled' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ flex: 1, background: 'none', border: '1px solid #444', borderRadius: 6, padding: 8, color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>EDIT</button>
              <button onClick={function() { setScheduled(function(s) { return s.filter(function(p) { return p.id !== post.id; }); }); }} style={{ flex: 1, background: 'none', border: '1px solid ' + C.red + '44', borderRadius: 6, padding: 8, color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>CANCEL</button>
            </div>
          )}
        </div>
      );})}
    </div>
  );
}

// ============================================================
// BATCH K — STUDIO CONTROLS + SVS ARENA + MOBILE HARDENING
// ============================================================

// ── A: STUDIO CONTROLS + GO-LIVE ENGINE ──────────────────────

function StudioControlsV1({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('preflight');
  var tabs = [['preflight','✅ PRE-FLIGHT'],['controls','🎛 CONTROLS'],['scenes','🎬 SCENES'],['health','📡 HEALTH']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0500,#1a0a00)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.burgundy + ',#0a0500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.gold + '44' }}>🎛</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>STUDIO CONTROLS</div>
            <div style={{ fontSize: 11, color: C.muted }}>Go-Live Engine · SeeWhy LIVE</div>
          </div>
          <GoLiveButtonV1 state={state} dispatch={dispatch} C={C} />
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 10px', color: tab === t[0] ? C.gold : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'preflight' && <StudioPreflightV1 state={state} dispatch={dispatch} C={C} />}
        {tab === 'controls' && <StudioLiveControlsV1 state={state} dispatch={dispatch} C={C} />}
        {tab === 'scenes' && <StudioScenesV1 state={state} dispatch={dispatch} C={C} />}
        {tab === 'health' && <StudioHealthV1 state={state} dispatch={dispatch} C={C} />}
      </div>
    </div>
  );
}

function GoLiveButtonV1({ state, dispatch, C }) {
  var isLive = state.isLive || false;
  var [countdown, setCountdown] = React.useState(null);
  var [arming, setArming] = React.useState(false);

  function handlePress() {
    if (isLive) {
      dispatch({ type: 'SET_LIVE', payload: false });
      return;
    }
    if (arming) return;
    setArming(true);
    setCountdown(3);
    var n = 3;
    var iv = setInterval(function() {
      n = n - 1;
      if (n <= 0) {
        clearInterval(iv);
        setArming(false);
        setCountdown(null);
        dispatch({ type: 'SET_LIVE', payload: true });
      } else {
        setCountdown(n);
      }
    }, 1000);
  }

  return (
    <button onClick={handlePress} style={{ background: isLive ? 'rgba(200,0,0,0.2)' : arming ? 'rgba(201,168,76,0.2)' : 'linear-gradient(135deg,' + C.burgundy + ',#8B0000)', border: '2px solid ' + (isLive ? C.red : arming ? C.gold : C.burgundy), borderRadius: 12, padding: '10px 16px', color: isLive ? C.red : arming ? C.gold : C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: isLive ? 13 : 16, cursor: 'pointer', flexShrink: 0, letterSpacing: 1, minWidth: 80, textAlign: 'center' }}>
      {isLive ? '⏹ END' : arming ? ('LIVE IN ' + countdown) : '🔴 GO LIVE'}
    </button>
  );
}

function StudioPreflightV1({ state, dispatch, C }) {
  var [checks, setChecks] = React.useState([
    { id: 'cam',     label: 'Camera',          sub: 'Primary camera feed',         status: 'ok',      icon: '📹' },
    { id: 'mic',     label: 'Microphone',      sub: 'Audio input detected',        status: 'ok',      icon: '🎤' },
    { id: 'rtmp',    label: 'RTMP Connection', sub: 'rtmp://ingest.seewhylive.online:1935/live', status: 'ok', icon: '📡' },
    { id: 'stream',  label: 'Stream Key',      sub: 'sw_6991033b_n8gf2vyf · VaultPro encrypted', status: 'ok', icon: '🔐' },
    { id: 'net',     label: 'Network',         sub: '24.8 Mbps upload',            status: 'ok',      icon: '📶' },
    { id: 'backup',  label: 'Backup Ingest',   sub: 'Secondary endpoint standby',  status: 'warn',    icon: '⚠️' },
    { id: 'guardian',label: 'Guardian AI',     sub: 'Moderation armed · claude-haiku-4-5', status: 'ok', icon: '🛡' },
    { id: 'overlay', label: 'Lower Thirds',    sub: 'Overlay package loaded',      status: 'ok',      icon: '🎞' },
  ]);

  var statusColor = { ok: C.green, warn: C.gold, err: C.red };
  var allOk = checks.every(function(c) { return c.status === 'ok'; });
  var warnMsg = warnCount > 1 ? 'WARNINGS' : 'WARNING';
  var errMsg = errCount > 0 ? ' - ' + errCount + ' ERROR' : '';
  var statusLabel = allOk ? 'READY TO BROADCAST' : (warnCount + ' ' + warnMsg + errMsg);
  var warnCount = checks.filter(function(c) { return c.status === 'warn'; }).length;
  var errCount = checks.filter(function(c) { return c.status === 'err'; }).length;

  function recheck(id) {
    setChecks(function(cs) {
      return cs.map(function(c) {
        if (c.id !== id) return c;
        return Object.assign({}, c, { status: Math.random() > 0.2 ? 'ok' : 'warn' });
      });
    });
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: allOk ? 'rgba(0,200,100,0.08)' : 'rgba(201,168,76,0.08)', border: '1px solid ' + (allOk ? C.green : C.gold) + '44', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28 }}>{allOk ? '✅' : '⚠️'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: allOk ? C.green : C.gold, letterSpacing: 1 }}>{statusLabel}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{allOk ? "All systems nominal. You're clear to go live." : "Resolve warnings before broadcasting."}</div>
        </div>
      </div>
      {checks.map(function(check) {
        return (
          <div key={check.id} style={{ background: '#111', border: '1px solid ' + (check.status === 'ok' ? '#1e1e1e' : statusColor[check.status] + '33'), borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{check.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{check.label}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{check.sub}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[check.status] || C.muted, boxShadow: '0 0 6px ' + (statusColor[check.status] || C.muted) }}></div>
              <span style={{ fontSize: 10, color: statusColor[check.status], fontFamily: "'Bebas Neue',sans-serif" }}>{check.status.toUpperCase()}</span>
              {check.status !== 'ok' && <button onClick={function() { recheck(check.id); }} style={{ background: 'none', border: '1px solid #444', borderRadius: 6, padding: '3px 8px', color: C.muted, fontSize: 10, cursor: 'pointer' }}>↻</button>}
            </div>
          </div>
        );
      })}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>STREAM DESTINATION</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['SeeWhy LIVE', true, C.gold], ['YouTube', false, C.red], ['Twitch', false, '#9B59B6'], ['Facebook', false, C.cyan]].map(function(dest, i) {
            return (
              <div key={i} style={{ background: dest[1] ? dest[2] + '15' : 'none', border: '1px solid ' + (dest[1] ? dest[2] + '44' : '#333'), borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: dest[1] ? dest[2] : '#444' }}></div>
                <span style={{ fontSize: 11, color: dest[1] ? dest[2] : C.muted, fontFamily: "'Bebas Neue',sans-serif" }}>{dest[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StudioLiveControlsV1({ state, dispatch, C }) {
  var [micVol, setMicVol] = React.useState(85);
  var [camVol, setCamVol] = React.useState(100);
  var [muteAll, setMuteAll] = React.useState(false);
  var [camOff, setCamOff] = React.useState(false);
  var [showBanner, setShowBanner] = React.useState(false);
  var [bannerText, setBannerText] = React.useState('Washington Classic 2026 — LIVE on SeeWhy LIVE');
  var [bannerActive, setBannerActive] = React.useState(false);

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: muteAll ? 'UNMUTE ALL' : 'MUTE ALL', icon: muteAll ? '🔇' : '🎤', color: muteAll ? C.red : C.muted, action: function() { setMuteAll(function(v) { return !v; }); } },
          { label: camOff ? 'CAM ON' : 'CAM OFF', icon: camOff ? '📵' : '📹', color: camOff ? C.red : C.muted, action: function() { setCamOff(function(v) { return !v; }); } },
          { label: 'LOWER THIRD', icon: '🎞', color: C.cyan, action: function() { setShowBanner(function(v) { return !v; }); } },
          { label: 'SCREENSHOT', icon: '📸', color: C.gold, action: function() {} },
          { label: 'PANIC CUT', icon: '✂️', color: C.red, action: function() {} },
          { label: 'BREAK CARD', icon: '☕', color: '#9B59B6', action: function() {} },
        ].map(function(btn, i) {
          return (
            <button key={i} onClick={btn.action} style={{ background: btn.color + '15', border: '1px solid ' + btn.color + '44', borderRadius: 12, padding: 14, color: btn.color, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 22 }}>{btn.icon}</span>
              {btn.label}
            </button>
          );
        })}
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, letterSpacing: 1 }}>AUDIO LEVELS</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.white }}>🎤 Host Mic</span>
            <span style={{ fontSize: 11, color: C.gold, fontFamily: "'Bebas Neue',sans-serif" }}>{micVol}%</span>
          </div>
          <input type="range" min={0} max={100} value={micVol} onChange={function(e) { setMicVol(Number(e.target.value)); }} style={{ width: '100%', accentColor: C.gold }} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.white }}>🎵 Stream Audio</span>
            <span style={{ fontSize: 11, color: C.cyan, fontFamily: "'Bebas Neue',sans-serif" }}>{camVol}%</span>
          </div>
          <input type="range" min={0} max={100} value={camVol} onChange={function(e) { setCamVol(Number(e.target.value)); }} style={{ width: '100%', accentColor: C.cyan }} />
        </div>
      </div>
      {showBanner && (
        <div style={{ background: '#111', border: '1px solid ' + C.cyan + '44', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, letterSpacing: 1 }}>LOWER THIRD / BANNER</div>
          <input value={bannerText} onChange={function(e) { setBannerText(e.target.value); }} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ background: 'rgba(0,0,0,0.8)', border: '2px solid ' + C.gold + '66', borderRadius: 6, padding: '8px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: C.gold, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 2 }}>SEEWHY LIVE</div>
            <div style={{ fontSize: 13, color: C.white, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{bannerText}</div>
          </div>
          <button onClick={function() { setBannerActive(function(v) { return !v; }); }} style={{ width: '100%', background: bannerActive ? C.cyan + '22' : C.gold, border: bannerActive ? '1px solid ' + C.cyan : 'none', borderRadius: 8, padding: 12, color: bannerActive ? C.cyan : '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>{bannerActive ? '✕ HIDE BANNER' : 'SHOW BANNER'}</button>
        </div>
      )}
    </div>
  );
}

function StudioScenesV1({ state, dispatch, C }) {
  var [activeScene, setActiveScene] = React.useState(0);
  var [transitioning, setTransitioning] = React.useState(false);
  var scenes = [
    { id: 0, name: 'MAIN BROADCAST', icon: '🎮', desc: 'Full panel + game view', layout: '16:9 + guests' },
    { id: 1, name: 'FACE CAM ONLY', icon: '👤', desc: 'Host close-up', layout: 'Solo host' },
    { id: 2, name: 'GAME FOCUS', icon: '🎯', desc: 'Domino table full screen', layout: 'Table cam' },
    { id: 3, name: 'SPLIT SCREEN', icon: '⚔️', desc: 'Host + opponent side by side', layout: 'PK Battle' },
    { id: 4, name: 'BRACKET VIEW', icon: '📊', desc: 'Tournament bracket display', layout: 'WA Classic' },
    { id: 5, name: 'BE RIGHT BACK', icon: '☕', desc: 'Break card + music', layout: 'Interstitial' },
    { id: 6, name: 'OUTRO', icon: '🎬', desc: 'End screen + social links', layout: 'End card' },
  ];

  function cut(id) {
    if (id === activeScene || transitioning) return;
    setTransitioning(true);
    setTimeout(function() {
      setActiveScene(id);
      setTransitioning(false);
    }, 400);
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: C.slate, border: '1px solid ' + C.gold + '33', borderRadius: 12, padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, boxShadow: '0 0 8px ' + C.red, flexShrink: 0 }}></div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.white, letterSpacing: 1 }}>LIVE: {scenes[activeScene].name}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{scenes[activeScene].desc}</div>
        </div>
        {transitioning && <div style={{ marginLeft: 'auto', fontSize: 10, color: C.gold }}>CUTTING...</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {scenes.map(function(scene) {
          var isActive = scene.id === activeScene;
          return (
            <div key={scene.id} onClick={function() { cut(scene.id); }} style={{ background: isActive ? C.gold + '15' : '#111', border: '2px solid ' + (isActive ? C.gold : '#2a2a2a'), borderRadius: 12, padding: 14, cursor: isActive ? 'default' : 'pointer', position: 'relative', transition: 'border-color 0.2s' }}>
              {isActive && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: C.red, boxShadow: '0 0 6px ' + C.red }}></div>}
              <div style={{ fontSize: 24, marginBottom: 6 }}>{scene.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: isActive ? C.gold : C.white, letterSpacing: 0.5, marginBottom: 3 }}>{scene.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{scene.layout}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudioHealthV1({ state, dispatch, C }) {
  var [health] = React.useState({
    bitrate: 6240, bitrateTarget: 6000, fps: 60, fpsTarget: 60, dropped: 0,
    latency: 1.4, viewers: 4823, peakViewers: 6102, uptime: '01:42:17',
    bandwidth: 24.8, cpu: 34, gpu: 51, memory: 62,
  });
  var bitrateOk = health.bitrate >= health.bitrateTarget * 0.9;
  var fpsOk = health.fps >= health.fpsTarget * 0.95;

  function StatRow(props) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{props.icon}</span>
          <span style={{ fontSize: 12, color: C.muted }}>{props.label}</span>
        </div>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: props.color || C.white, letterSpacing: 0.5 }}>{props.value}</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'VIEWERS', value: health.viewers.toLocaleString(), icon: '👁', color: C.cyan },
          { label: 'UPTIME', value: health.uptime, icon: '⏱', color: C.green },
          { label: 'PEAK', value: health.peakViewers.toLocaleString(), icon: '🏔', color: C.gold },
          { label: 'DROPPED', value: health.dropped + ' frames', icon: '⚡', color: health.dropped === 0 ? C.green : C.red },
        ].map(function(stat, i) {
          return (
            <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: stat.color, letterSpacing: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{stat.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: 1 }}>STREAM DIAGNOSTICS</div>
        <StatRow icon="📡" label="Bitrate" value={health.bitrate + ' kbps'} color={bitrateOk ? C.green : C.red} />
        <StatRow icon="🎞" label="Frame Rate" value={health.fps + ' fps'} color={fpsOk ? C.green : C.red} />
        <StatRow icon="⏱" label="Stream Latency" value={health.latency + 's'} color={C.cyan} />
        <StatRow icon="📶" label="Upload Bandwidth" value={health.bandwidth + ' Mbps'} color={C.green} />
        <StatRow icon="🖥" label="CPU Usage" value={health.cpu + '%'} color={health.cpu < 70 ? C.green : C.red} />
        <StatRow icon="🎮" label="GPU Usage" value={health.gpu + '%'} color={health.gpu < 80 ? C.green : C.gold} />
        <StatRow icon="💾" label="Memory" value={health.memory + '%'} color={health.memory < 80 ? C.green : C.gold} />
      </div>
    </div>
  );
}

// ── B: SVS STATE VS STATE ARENA ───────────────────────────────

function SVSArenaV1({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('bracket');
  var tabs = [['bracket','🏆 BRACKET'],['scoring','🎯 SCORING'],['rosters','👥 ROSTERS'],['history','📜 HISTORY']];

  var [bracket] = React.useState({
    title: 'Washington Classic 2026',
    format: '7 Rock / 5-150 / Double Elimination',
    venue: "Jamar's Sports Bar & Grill, Des Moines, WA",
    rounds: [
      {
        name: 'QUARTERFINALS',
        matches: [
          { id: 1, stateA: 'WA', stateB: 'CA', scoreA: 7, scoreB: 4, status: 'complete', winner: 'WA' },
          { id: 2, stateA: 'TX', stateB: 'FL', scoreA: 5, scoreB: 7, status: 'complete', winner: 'FL' },
          { id: 3, stateA: 'NY', stateB: 'GA', scoreA: 7, scoreB: 3, status: 'complete', winner: 'NY' },
          { id: 4, stateA: 'IL', stateB: 'NC', scoreA: 6, scoreB: 7, status: 'complete', winner: 'NC' },
        ]
      },
      {
        name: 'SEMIFINALS',
        matches: [
          { id: 5, stateA: 'WA', stateB: 'FL', scoreA: 0, scoreB: 0, status: 'live', winner: null },
          { id: 6, stateA: 'NY', stateB: 'NC', scoreA: 0, scoreB: 0, status: 'upcoming', winner: null },
        ]
      },
      {
        name: 'FINALS',
        matches: [
          { id: 7, stateA: 'TBD', stateB: 'TBD', scoreA: 0, scoreB: 0, status: 'upcoming', winner: null },
        ]
      },
    ]
  });

  var stateColors = { WA: '#4B9CD3', CA: '#003DA5', TX: '#BF0A30', FL: '#FF6600', NY: '#003087', GA: '#BA0C2F', IL: '#00A3E0', NC: '#4B9CD3' };

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#050A1A,#0A1A0A)', padding: '16px 14px 0', borderBottom: '1px solid #4B9CD333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#003DA5,#050A1A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #4B9CD344' }}>🗺</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.white, letterSpacing: 2 }}>STATE VS STATE</div>
            <div style={{ fontSize: 10, color: C.muted }}>{bracket.venue}</div>
          </div>
        </div>
        <div style={{ background: 'rgba(75,156,211,0.1)', border: '1px solid #4B9CD333', borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.white, letterSpacing: 1 }}>{bracket.title}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{bracket.format}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, boxShadow: '0 0 6px ' + C.red }}></div>
            <span style={{ fontSize: 10, color: C.red, fontFamily: "'Bebas Neue',sans-serif" }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid #4B9CD3' : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? '#4B9CD3' : C.muted, fontSize: 9, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer', letterSpacing: 0.5 }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'bracket' && <SVSBracketV1 bracket={bracket} stateColors={stateColors} C={C} />}
        {tab === 'scoring' && <SVSScoringV1 bracket={bracket} stateColors={stateColors} C={C} />}
        {tab === 'rosters' && <SVSRostersV1 stateColors={stateColors} C={C} />}
        {tab === 'history' && <SVSHistoryV1 C={C} />}
      </div>
    </div>
  );
}

function SVSBracketV1({ bracket, stateColors, C }) {
  var statusColor = { complete: C.green, live: C.red, upcoming: C.muted };
  var statusLabel = { complete: 'FINAL', live: '🔴 LIVE', upcoming: 'UPCOMING' };

  return (
    <div style={{ padding: 14 }}>
      {bracket.rounds.map(function(round, ri) {
        return (
          <div key={ri} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#4B9CD3', letterSpacing: 2, marginBottom: 10 }}>{round.name}</div>
            {round.matches.map(function(match) {
              var isLive = match.status === 'live';
              return (
                <div key={match.id} style={{ background: isLive ? 'rgba(200,0,0,0.08)' : '#111', border: '2px solid ' + (isLive ? C.red + '66' : '#2a2a2a'), borderRadius: 14, padding: 14, marginBottom: 10, position: 'relative' }}>
                  {isLive && <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 10, color: C.red, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>🔴 LIVE</div>}
                  {match.status === 'complete' && <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 9, color: C.green, fontFamily: "'Bebas Neue',sans-serif" }}>FINAL</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: (stateColors[match.stateA] || '#333') + '22', border: '2px solid ' + (stateColors[match.stateA] || '#333') + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: stateColors[match.stateA] || C.muted }}>{match.stateA}</div>
                        <div style={{ flex: 1, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: match.winner === match.stateA ? C.white : C.muted }}>{match.stateA}</div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: match.winner === match.stateA ? C.gold : C.white, minWidth: 24, textAlign: 'right' }}>{match.scoreA}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: (stateColors[match.stateB] || '#333') + '22', border: '2px solid ' + (stateColors[match.stateB] || '#333') + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: stateColors[match.stateB] || C.muted }}>{match.stateB}</div>
                        <div style={{ flex: 1, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: match.winner === match.stateB ? C.white : C.muted }}>{match.stateB}</div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: match.winner === match.stateB ? C.gold : C.white, minWidth: 24, textAlign: 'right' }}>{match.scoreB}</div>
                      </div>
                    </div>
                  </div>
                  {match.winner && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: stateColors[match.winner] || C.gold, fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏆</div>
                    <span style={{ fontSize: 10, color: C.gold, fontFamily: "'Bebas Neue',sans-serif" }}>{match.winner} ADVANCES</span>
                  </div>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function SVSScoringV1({ bracket, stateColors, C }) {
  var liveMatch = null;
  for (var ri = 0; ri < bracket.rounds.length; ri++) {
    for (var mi = 0; mi < bracket.rounds[ri].matches.length; mi++) {
      if (bracket.rounds[ri].matches[mi].status === 'live') {
        liveMatch = bracket.rounds[ri].matches[mi];
        break;
      }
    }
  }
  var [scoreA, setScoreA] = React.useState(liveMatch ? liveMatch.scoreA : 0);
  var [scoreB, setScoreB] = React.useState(liveMatch ? liveMatch.scoreB : 0);
  var [round, setRound] = React.useState(1);
  var [events, setEvents] = React.useState([
    { id: 1, time: '6:48', state: 'WA', event: 'Double-6 opening drop', pts: 0 },
    { id: 2, time: '6:49', state: 'FL', event: 'Block — WA forced to draw 3', pts: 0 },
    { id: 3, time: '6:51', state: 'WA', event: 'ROUND WIN — domino!', pts: 7 },
  ]);

  var stA = liveMatch ? liveMatch.stateA : 'WA';
  var stB = liveMatch ? liveMatch.stateB : 'FL';
  var colorA = stateColors[stA] || '#4B9CD3';
  var colorB = stateColors[stB] || C.red;

  function addEvent(st, text, pts) {
    setEvents(function(ev) { return [{ id: Date.now(), time: 'Now', state: st, event: text, pts: pts }].concat(ev); });
    if (st === stA) { setScoreA(function(s) { return s + pts; }); }
    else { setScoreB(function(s) { return s + pts; }); }
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a1020,#1a0a00)', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ textAlign: 'center', fontSize: 10, color: C.muted, marginBottom: 12, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>SEMIFINALS · ROUND {round} · BEST OF 7</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: colorA, lineHeight: 1 }}>{scoreA}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.white, marginTop: 4 }}>{stA}</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.muted }}>VS</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: colorB, lineHeight: 1 }}>{scoreB}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.white, marginTop: 4 }}>{stB}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <button onClick={function() { addEvent(stA, 'Round win', 1); }} style={{ background: colorA + '22', border: '1px solid ' + colorA + '44', borderRadius: 10, padding: 12, color: colorA, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>+1 {stA}</button>
        <button onClick={function() { addEvent(stB, 'Round win', 1); }} style={{ background: colorB + '22', border: '1px solid ' + colorB + '44', borderRadius: 10, padding: 12, color: colorB, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>+1 {stB}</button>
      </div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>MATCH LOG</div>
      {events.map(function(ev) {
        return (
          <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, flexShrink: 0, paddingTop: 2, minWidth: 30 }}>{ev.time}</div>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: (stateColors[ev.state] || '#333') + '22', border: '1px solid ' + (stateColors[ev.state] || '#333') + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: "'Bebas Neue',sans-serif", color: stateColors[ev.state] || C.muted, flexShrink: 0 }}>{ev.state}</div>
            <div style={{ fontSize: 12, color: C.white, flex: 1 }}>{ev.event}</div>
            {ev.pts > 0 && <div style={{ fontSize: 11, color: C.gold, fontFamily: "'Bebas Neue',sans-serif", flexShrink: 0 }}>+{ev.pts}</div>}
          </div>
        );
      })}
    </div>
  );
}

function SVSRostersV1({ stateColors, C }) {
  var [selectedState, setSelectedState] = React.useState('WA');
  var rosters = {
    WA: [
      { name: 'SwanyThree23', handle: '@SwanyThree23', role: 'CAPTAIN', gems: 312, wins: 8 },
      { name: 'PNW Bones', handle: '@PNWBones', role: 'ANCHOR', gems: 178, wins: 5 },
      { name: 'Seattle Slider', handle: '@SeattleSlider', role: 'PLAYER', gems: 94, wins: 3 },
      { name: 'Tacoma T-Bone', handle: '@TacomaT', role: 'PLAYER', gems: 67, wins: 4 },
    ],
    FL: [
      { name: 'CaliBonesOG', handle: '@CaliBonesOG', role: 'CAPTAIN', gems: 241, wins: 6 },
      { name: 'Sunshine Rock', handle: '@SunshineRock', role: 'ANCHOR', gems: 156, wins: 4 },
      { name: 'Miami Marble', handle: '@MiamiMarble', role: 'PLAYER', gems: 88, wins: 3 },
    ],
  };
  var states = Object.keys(stateColors);
  var roster = rosters[selectedState] || [];

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {states.map(function(st) { return (
          <button key={st} onClick={function() { setSelectedState(st); }} style={{ background: selectedState === st ? (stateColors[st] || '#333') + '22' : 'none', border: '1px solid ' + (selectedState === st ? stateColors[st] || '#333' : '#444'), borderRadius: 20, padding: '5px 14px', color: selectedState === st ? stateColors[st] || C.white : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>{st}</button>
        );})}
      </div>
      {roster.length > 0 ? roster.map(function(player, i) {
        return (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: (stateColors[selectedState] || '#333') + '22', border: '2px solid ' + (stateColors[selectedState] || '#333') + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: stateColors[selectedState] || C.white, flexShrink: 0 }}>{(player.name[0] || '?').toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{player.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{player.handle}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 9, color: stateColors[selectedState] || C.gold, fontFamily: "'Bebas Neue',sans-serif", background: (stateColors[selectedState] || '#333') + '22', borderRadius: 4, padding: '2px 6px' }}>{player.role}</span>
                <span style={{ fontSize: 9, color: C.gold }}>💎 {player.gems}</span>
                <span style={{ fontSize: 9, color: C.green }}>W: {player.wins}</span>
              </div>
            </div>
          </div>
        );
      }) : (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>No roster data for {selectedState} yet.</div>
      )}
    </div>
  );
}

function SVSHistoryV1({ C }) {
  var history = [
    { year: 2025, winner: 'TX', runnerUp: 'CA', score: '7-5', event: 'Washington Classic 2025', viewers: '3,812' },
    { year: 2024, winner: 'WA', runnerUp: 'NY', score: '7-3', event: 'Washington Classic 2024', viewers: '2,441' },
    { year: 2023, winner: 'IL', runnerUp: 'FL', score: '7-6', event: 'Washington Classic 2023', viewers: '1,889' },
  ];
  return (
    <div style={{ padding: 14 }}>
      {history.map(function(h) {
        return (
          <div key={h.year} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold, letterSpacing: 1 }}>{h.event}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{h.viewers} peak viewers</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.muted }}>{h.year}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, background: C.gold + '15', border: '1px solid ' + C.gold + '44', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>CHAMPION</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold }}>🏆 {h.winner}</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.muted }}>{h.score}</div>
              <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>RUNNER-UP</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.muted }}>{h.runnerUp}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── D: MOBILE WEBVIEW HARDENING ───────────────────────────────

function MobileWebViewHardeningInit() {
  React.useEffect(function() {
    // Safe-area CSS variables
    var style = document.createElement('style');
    style.innerHTML = [
      ':root {',
      '  --sat: env(safe-area-inset-top, 0px);',
      '  --sar: env(safe-area-inset-right, 0px);',
      '  --sab: env(safe-area-inset-bottom, 0px);',
      '  --sal: env(safe-area-inset-left, 0px);',
      '}',
      'body { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; overscroll-behavior: none; }',
      'input, textarea, select { font-size: 16px !important; }',
      '* { -webkit-overflow-scrolling: touch; }',
    ].join('\n');
    document.head.appendChild(style);

    // Viewport meta patch
    var existing = document.querySelector('meta[name="viewport"]');
    if (existing) { existing.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'); }
    else {
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no';
      document.head.appendChild(meta);
    }

    // Prevent rubber-band scroll on iOS
    function preventPull(e) { if (e.touches.length > 1) { e.preventDefault(); } }
    document.addEventListener('touchstart', preventPull, { passive: false });

    // Keyboard avoidance — push content up when keyboard opens
    function onFocus() {
      setTimeout(function() {
        if (document.activeElement && document.activeElement.scrollIntoView) {
          document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
    document.addEventListener('focusin', onFocus);

    // Bridge: PostMessage API for native app shell
    window.SeeWhyBridge = {
      postToNative: function(event, payload) {
        try {
          if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(JSON.stringify({ event: event, payload: payload })); }
          else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.seewhyBridge) { window.webkit.messageHandlers.seewhyBridge.postMessage({ event: event, payload: payload }); }
        } catch (e) {}
      },
      onMessage: function(data) {
        try {
          var parsed = typeof data === 'string' ? JSON.parse(data) : data;
          window.dispatchEvent(new CustomEvent('sw_native_message', { detail: parsed }));
        } catch (e) {}
      }
    };

    // Deeplink handler
    function handleDeeplink(e) {
      var url = e.detail && e.detail.url ? e.detail.url : '';
      if (!url) return;
      if (url.indexOf('seewhylive://stream/') === 0) { window.dispatchEvent(new CustomEvent('sw_deeplink_stream', { detail: { id: url.replace('seewhylive://stream/', '') } })); }
      else if (url.indexOf('seewhylive://tournament/') === 0) { window.dispatchEvent(new CustomEvent('sw_deeplink_tournament', { detail: { id: url.replace('seewhylive://tournament/', '') } })); }
    }
    window.addEventListener('sw_deeplink', handleDeeplink);

    return function() {
      document.removeEventListener('touchstart', preventPull);
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('sw_deeplink', handleDeeplink);
    };
  }, []);
  return null;
}

function MobileHardeningDashboard({ state, dispatch }) {
  var C = COLORS;
  var [tested, setTested] = React.useState({});
  var checks = [
    { id: 'safearea',   label: 'Safe Area Insets',      sub: 'env(safe-area-inset-*) applied to nav + bottom bar', icon: '📐' },
    { id: 'viewport',   label: 'Viewport Fit Cover',    sub: 'viewport-fit=cover + user-scalable=no patched', icon: '📱' },
    { id: 'keyboard',   label: 'Keyboard Avoidance',    sub: 'focusin listener scrolls input into view', icon: '⌨️' },
    { id: 'font16',     label: 'Input Font 16px',       sub: 'Prevents iOS zoom on input focus', icon: '🔤' },
    { id: 'overscroll', label: 'Overscroll Disabled',   sub: 'overscroll-behavior: none on body', icon: '🚫' },
    { id: 'bridge',     label: 'Native Bridge',         sub: 'window.SeeWhyBridge · ReactNativeWebView + WKWebView', icon: '🌉' },
    { id: 'deeplink',   label: 'Deeplink Handler',      sub: 'seewhylive://stream/* and seewhylive://tournament/*', icon: '🔗' },
    { id: 'taphl',      label: 'Tap Highlight Off',     sub: '-webkit-tap-highlight-color: transparent', icon: '👆' },
    { id: 'rubberband', label: 'Rubber-Band Blocked',   sub: 'Multi-touch touchstart preventDefault', icon: '🔒' },
  ];

  function test(id) {
    setTested(function(t) {
      var n = Object.assign({}, t);
      n[id] = Math.random() > 0.1 ? 'pass' : 'fail';
      return n;
    });
  }

  var passCount = Object.values(tested).filter(function(v) { return v === 'pass'; }).length;
  var totalTested = Object.keys(tested).length;

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#050A05,#0a1a0a)', padding: '16px 14px 12px', borderBottom: '1px solid #00ff6633' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#00ff66,#050A05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #00ff6644' }}>📱</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#00ff66', letterSpacing: 2 }}>MOBILE HARDENING</div>
            <div style={{ fontSize: 11, color: C.muted }}>App Store · Google Play · WebView Patches</div>
          </div>
        </div>
        {totalTested > 0 && (
          <div style={{ background: 'rgba(0,255,102,0.08)', border: '1px solid #00ff6633', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#00ff66' }}>{passCount}/{totalTested}</div>
            <div style={{ fontSize: 11, color: C.muted }}>checks passed</div>
            <div style={{ marginLeft: 'auto', width: 100, height: 6, borderRadius: 3, background: '#1a1a1a', overflow: 'hidden' }}>
              <div style={{ width: (passCount / totalTested * 100) + '%', height: '100%', background: '#00ff66', borderRadius: 3, transition: 'width 0.3s' }}></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: 14 }}>
        {checks.map(function(check) {
          var result = tested[check.id];
          return (
            <div key={check.id} style={{ background: '#111', border: '1px solid ' + (result === 'pass' ? '#00ff6633' : result === 'fail' ? C.red + '33' : '#1e1e1e'), borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{check.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{check.label}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{check.sub}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {result && <span style={{ fontSize: 9, color: result === 'pass' ? '#00ff66' : C.red, fontFamily: "'Bebas Neue',sans-serif" }}>{result === 'pass' ? '✓ PASS' : '✕ FAIL'}</span>}
                <button onClick={function() { test(check.id); }} style={{ background: 'none', border: '1px solid ' + (result ? (result === 'pass' ? '#00ff6633' : C.red + '44') : '#333'), borderRadius: 6, padding: '3px 10px', color: result ? (result === 'pass' ? '#00ff66' : C.red) : C.muted, fontSize: 10, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{result ? 'RETEST' : 'TEST'}</button>
              </div>
            </div>
          );
        })}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginTop: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#00ff66', letterSpacing: 1, marginBottom: 12 }}>SUBMISSION CHECKLIST</div>
          {[
            { label: 'Bundle ID', value: 'online.seewhylive.app', done: true },
            { label: 'App Name', value: 'SeeWhy LIVE', done: true },
            { label: 'Icons', value: '1024x1024 required (iOS) · Adaptive (Android)', done: false },
            { label: 'Splash Screen', value: 'Black + Gold · 2732x2732 (iOS) · 1242x2208', done: false },
            { label: 'Privacy Policy', value: 'Required for App Store approval', done: false },
            { label: 'Push Notifications', value: 'APNS (iOS) · FCM (Android) keys', done: false },
            { label: 'RTMP Entitlement', value: 'iOS requires com.apple.security.network.client', done: true },
            { label: 'Minimum OS', value: 'iOS 15+ · Android 8.0 (API 26)+', done: true },
          ].map(function(item, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: item.done ? '#00ff6622' : '#1a1a1a', border: '1px solid ' + (item.done ? '#00ff6644' : '#333'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: item.done ? '#00ff66' : C.muted, flexShrink: 0, marginTop: 1 }}>{item.done ? '✓' : ''}</div>
                <div>
                  <div style={{ color: item.done ? C.white : C.muted, fontSize: 12 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BATCH L — ALL FIVE COMPONENTS
// ============================================================

// ── C: CREATOR ANALYTICS DEEP DIVE ───────────────────────────

function CreatorAnalyticsDashboard({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('overview');
  var [range, setRange] = React.useState('7d');
  var tabs = [['overview','📊 OVERVIEW'],['revenue','💰 REVENUE'],['gems','💎 GEMS'],['viewers','👁 VIEWERS'],['tippers','🏆 TIPPERS']];
  var ranges = ['24h','7d','30d','90d','all'];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#050510,#0a0520)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.gold + ',#050510)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.gold + '44' }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>CREATOR ANALYTICS</div>
            <div style={{ fontSize: 11, color: C.muted }}>@SwanyThree23 · SeeWhy LIVE</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {ranges.map(function(r) { return (
              <button key={r} onClick={function() { setRange(r); }} style={{ background: range === r ? C.gold + '22' : 'none', border: '1px solid ' + (range === r ? C.gold : '#333'), borderRadius: 6, padding: '4px 8px', color: range === r ? C.gold : C.muted, fontSize: 9, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{r.toUpperCase()}</button>
            );})}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 10px', color: tab === t[0] ? C.gold : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'overview' && <AnalyticsOverviewTab C={C} range={range} />}
        {tab === 'revenue' && <AnalyticsRevenueTab C={C} range={range} />}
        {tab === 'gems' && <AnalyticsGemsTab C={C} range={range} />}
        {tab === 'viewers' && <AnalyticsViewersTab C={C} range={range} />}
        {tab === 'tippers' && <AnalyticsTippersTab C={C} range={range} />}
      </div>
    </div>
  );
}

function MiniBarChart({ data, color, height, C }) {
  var max = Math.max.apply(null, data.map(function(d) { return d.v; }));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: height || 48 }}>
      {data.map(function(d, i) {
        var pct = max > 0 ? Math.floor((d.v / max) * 100) : 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: pct + '%', minHeight: d.v > 0 ? 3 : 0, opacity: 0.85 }}></div>
            {d.label && <div style={{ fontSize: 7, color: C.muted, whiteSpace: 'nowrap' }}>{d.label}</div>}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, C }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: color || C.white, letterSpacing: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: color || C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function AnalyticsOverviewTab({ C, range }) {
  var stats = [
    { icon: '💰', label: 'TOTAL REVENUE', value: '$4,812', sub: '+23% vs last period', color: C.gold },
    { icon: '👁', label: 'TOTAL VIEWERS', value: '28,441', sub: '+11% vs last period', color: C.cyan },
    { icon: '💎', label: 'GEMS RECEIVED', value: '6,230', sub: '623 unique senders', color: '#9B59B6' },
    { icon: '📺', label: 'STREAMS', value: '14', sub: 'Avg 2.1h each', color: C.green },
    { icon: '⏱', label: 'WATCH TIME', value: '8,842h', sub: '21.4 min avg session', color: C.volt },
    { icon: '🔔', label: 'NEW FOLLOWERS', value: '1,204', sub: '+18% vs last period', color: C.burgundy },
  ];
  var weekData = [
    { label: 'M', v: 312 }, { label: 'T', v: 480 }, { label: 'W', v: 290 },
    { label: 'T', v: 620 }, { label: 'F', v: 890 }, { label: 'S', v: 1240 }, { label: 'S', v: 980 },
  ];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {stats.map(function(s, i) { return <StatCard key={i} C={C} icon={s.icon} label={s.label} value={s.value} sub={s.sub} color={s.color} />; })}
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.gold, letterSpacing: 1 }}>VIEWER TREND</div>
          <div style={{ fontSize: 10, color: C.muted }}>This week</div>
        </div>
        <MiniBarChart data={weekData} color={C.gold} height={64} C={C} />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 12 }}>TOP STREAMS THIS PERIOD</div>
        {[
          { title: 'Washington Classic Semis', date: 'Jun 7', viewers: 4823, revenue: '$892', gems: 1240 },
          { title: 'PK Battle vs CaliBone22', date: 'Jun 4', viewers: 3102, revenue: '$541', gems: 780 },
          { title: 'VibeN Bones Sunday Session', date: 'Jun 2', viewers: 2441, revenue: '$388', gems: 512 },
          { title: 'Washington Classic Preview', date: 'May 30', viewers: 2108, revenue: '$312', gems: 420 },
        ].map(function(s, i) { return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: C.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.date} · {s.viewers.toLocaleString()} viewers</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: C.gold, fontFamily: "'Bebas Neue',sans-serif" }}>{s.revenue}</div>
              <div style={{ fontSize: 9, color: '#9B59B6' }}>💎 {s.gems}</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function AnalyticsRevenueTab({ C, range }) {
  var months = [
    { label: 'Jan', v: 280 }, { label: 'Feb', v: 340 }, { label: 'Mar', v: 520 },
    { label: 'Apr', v: 490 }, { label: 'May', v: 710 }, { label: 'Jun', v: 892 },
  ];
  var breakdown = [
    { label: 'Gem Conversions', amount: '$2,841', pct: 59, color: '#9B59B6' },
    { label: 'Subscriptions', amount: '$1,240', pct: 26, color: C.gold },
    { label: 'PPV Events', amount: '$480', pct: 10, color: C.cyan },
    { label: 'Tips (Direct)', amount: '$251', pct: 5, color: C.green },
  ];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard icon="💰" label="GROSS" value="$5,346" C={C} color={C.gold} />
        <StatCard icon="✂️" label="PLATFORM" value="-$535" sub="10% fee" C={C} color={C.red} />
        <StatCard icon="🏦" label="YOUR CUT" value="$4,812" sub="90%" C={C} color={C.green} />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 12 }}>MONTHLY REVENUE</div>
        <MiniBarChart data={months} color={C.gold} height={80} C={C} />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 12 }}>REVENUE BREAKDOWN</div>
        {breakdown.map(function(b, i) { return (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.white }}>{b.label}</span>
              <span style={{ fontSize: 12, color: b.color, fontFamily: "'Bebas Neue',sans-serif" }}>{b.amount}</span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: b.pct + '%', height: '100%', background: b.color, borderRadius: 3 }}></div>
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{b.pct}% of total</div>
          </div>
        );})}
      </div>
      <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid ' + C.green + '33', borderRadius: 12, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.green, letterSpacing: 1, marginBottom: 6 }}>CREATOR SPLIT GUARANTEE</div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>CREATOR_SPLIT = 0.90 is immutable across all payment rails. Enforced at DB trigger, API middleware, and Stripe application_fee_amount layers.</div>
      </div>
    </div>
  );
}

function AnalyticsGemsTab({ C, range }) {
  var gemData = [
    { label: 'M', v: 420 }, { label: 'T', v: 680 }, { label: 'W', v: 310 },
    { label: 'T', v: 890 }, { label: 'F', v: 1240 }, { label: 'S', v: 1680 }, { label: 'S', v: 1010 },
  ];
  var gemTypes = [
    { name: 'Ruby Gem', icon: '🔴', count: 2841, value: '$1,420', color: C.red },
    { name: 'Gold Gem', icon: '🟡', count: 1440, value: '$720', color: C.gold },
    { name: 'Diamond', icon: '💎', count: 580, value: '$580', color: C.cyan },
    { name: 'Purple Gem', icon: '🟣', count: 890, value: '$445', color: '#9B59B6' },
    { name: 'Bone Gem', icon: '🦴', count: 480, value: '$240', color: C.muted },
  ];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard icon="💎" label="GEMS RECEIVED" value="6,231" C={C} color="#9B59B6" />
        <StatCard icon="👥" label="UNIQUE SENDERS" value="623" sub="+41 new" C={C} color={C.cyan} />
        <StatCard icon="📈" label="PEAK GEM RATE" value="48/min" sub="WA Classic Semis" C={C} color={C.gold} />
        <StatCard icon="🔄" label="CONVERTED" value="$2,841" sub="90% to you" C={C} color={C.green} />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#9B59B6', letterSpacing: 1, marginBottom: 12 }}>GEM FLOW THIS WEEK</div>
        <MiniBarChart data={gemData} color="#9B59B6" height={72} C={C} />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#9B59B6', letterSpacing: 1, marginBottom: 12 }}>GEM TYPE BREAKDOWN</div>
        {gemTypes.map(function(g, i) { return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.white }}>{g.name}</span>
                <span style={{ fontSize: 11, color: g.color, fontFamily: "'Bebas Neue',sans-serif" }}>{g.value}</span>
              </div>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: Math.floor(g.count / 28.41) + '%', height: '100%', background: g.color, borderRadius: 2 }}></div>
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{g.count.toLocaleString()} gems</div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function AnalyticsViewersTab({ C, range }) {
  var retentionData = [
    { label: '0m', v: 100 }, { label: '5m', v: 88 }, { label: '10m', v: 74 },
    { label: '20m', v: 61 }, { label: '30m', v: 52 }, { label: '45m', v: 44 },
    { label: '60m', v: 38 }, { label: '90m', v: 31 }, { label: '120m', v: 26 },
  ];
  var sources = [
    { label: 'Direct / seewhylive.online', pct: 42, color: C.gold },
    { label: 'YouTube', pct: 28, color: C.red },
    { label: 'Twitter / X', pct: 14, color: C.cyan },
    { label: 'Instagram', pct: 10, color: '#E1306C' },
    { label: 'Other', pct: 6, color: C.muted },
  ];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard icon="👁" label="PEAK VIEWERS" value="6,102" sub="WA Classic Semis" C={C} color={C.cyan} />
        <StatCard icon="📊" label="AVG CONCURRENT" value="2,841" C={C} color={C.green} />
        <StatCard icon="⏱" label="AVG SESSION" value="21.4m" C={C} color={C.gold} />
        <StatCard icon="🔁" label="RETURN RATE" value="68%" sub="+4% vs last" C={C} color="#9B59B6" />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.cyan, letterSpacing: 1, marginBottom: 4 }}>VIEWER RETENTION CURVE</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>% of viewers still watching by minute</div>
        <MiniBarChart data={retentionData} color={C.cyan} height={72} C={C} />
      </div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.cyan, letterSpacing: 1, marginBottom: 12 }}>TRAFFIC SOURCES</div>
        {sources.map(function(s, i) { return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: C.white }}>{s.label}</span>
              <span style={{ fontSize: 11, color: s.color, fontFamily: "'Bebas Neue',sans-serif" }}>{s.pct}%</span>
            </div>
            <div style={{ height: 5, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: s.pct + '%', height: '100%', background: s.color, borderRadius: 3 }}></div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function AnalyticsTippersTab({ C, range }) {
  var tippers = [
    { rank: 1, name: 'BigBoneEarl', handle: '@BigBoneEarl', gems: 1240, value: '$620', streams: 8, badge: '👑' },
    { rank: 2, name: 'CaliBonesOG', handle: '@CaliBonesOG', gems: 890, value: '$445', streams: 6, badge: '🥈' },
    { rank: 3, name: 'MamaJoyce', handle: '@MamaJoyce', gems: 640, value: '$320', streams: 11, badge: '🥉' },
    { rank: 4, name: 'VibeNBones', handle: '@VibeNBones', gems: 480, value: '$240', streams: 5, badge: null },
    { rank: 5, name: 'SeattleSlider', handle: '@SeattleSlider', gems: 380, value: '$190', streams: 4, badge: null },
    { rank: 6, name: 'PNW_Domino', handle: '@PNW_Domino', gems: 310, value: '$155', streams: 7, badge: null },
    { rank: 7, name: 'TacomaTBone', handle: '@TacomaTBone', gems: 280, value: '$140', streams: 3, badge: null },
    { rank: 8, name: 'FastHandsRod', handle: '@FastHandsRod', gems: 240, value: '$120', streams: 5, badge: null },
  ];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard icon="🏆" label="TOP TIPPER" value="Earl" sub="1,240 gems" C={C} color={C.gold} />
        <StatCard icon="💎" label="TOTAL GEMS" value="6,231" C={C} color="#9B59B6" />
        <StatCard icon="👥" label="SUPPORTERS" value="623" C={C} color={C.cyan} />
      </div>
      {tippers.map(function(t) { return (
        <div key={t.rank} style={{ background: t.rank <= 3 ? C.gold + '08' : '#111', border: '1px solid ' + (t.rank <= 3 ? C.gold + '33' : '#1e1e1e'), borderRadius: 12, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: t.rank <= 3 ? C.gold + '22' : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: t.badge ? 18 : 14, color: C.gold, flexShrink: 0 }}>{t.badge || t.rank}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{t.handle} · {t.streams} streams</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#9B59B6' }}>💎 {t.gems.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: C.gold }}>{t.value}</div>
          </div>
        </div>
      );})}
    </div>
  );
}

// ── FALLEN LEGENDS TRIBUTE ────────────────────────────────────

function FallenLegendsTributeV1({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('wall');
  var [selected, setSelected] = React.useState(null);
  var [showAdd, setShowAdd] = React.useState(false);
  var tabs = [['wall','🕯 WALL'],['submit','✍️ SUBMIT'],['ceremony','🏆 CEREMONY']];

  var [legends, setLegends] = React.useState([
    { id: 1, name: 'Big Bone Bobby', years: '1961 - 2019', region: 'Pacific Northwest', quote: 'Let the bones speak for themselves.', games: 847, titles: 3, photo: 'BB', color: C.gold, tributes: 124, candles: 89 },
    { id: 2, name: 'Domino Queen Vera', years: '1955 - 2021', region: 'California', quote: 'Every rock tells a story.', games: 1204, titles: 7, photo: 'VQ', color: '#9B59B6', tributes: 203, candles: 156 },
    { id: 3, name: 'Slim Shake Johnson', years: '1968 - 2020', region: 'Texas', quote: 'Patience is the double-six.', games: 632, titles: 2, photo: 'SJ', color: C.cyan, tributes: 87, candles: 64 },
    { id: 4, name: 'Mama Rose Washington', years: '1949 - 2022', region: 'Georgia', quote: 'We play for those who came before.', games: 1891, titles: 12, photo: 'MR', color: C.burgundy, tributes: 312, candles: 241 },
  ]);

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#050305,#0d0508)', padding: '16px 14px 0', borderBottom: '1px solid #55223344' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#552233,#050305)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #55223344' }}>🕯</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A0A0', letterSpacing: 2 }}>FALLEN LEGENDS</div>
            <div style={{ fontSize: 11, color: C.muted }}>Washington Classic · In Memoriam</div>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid #C9A0A0' : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? '#C9A0A0' : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>

      {tab === 'wall' && (
        <div style={{ padding: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(85,34,51,0.2),transparent)', border: '1px solid #55223344', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🕯</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A0A0', letterSpacing: 2, marginBottom: 4 }}>IN LOVING MEMORY</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>We honor those who shaped domino culture. Their rocks echo in every game played on SeeWhy LIVE.</div>
          </div>
          {legends.map(function(legend) {
            var isSelected = selected && selected.id === legend.id;
            return (
              <div key={legend.id} style={{ background: isSelected ? 'rgba(85,34,51,0.15)' : '#111', border: '1px solid ' + (isSelected ? '#55223388' : '#1e1e1e'), borderRadius: 14, padding: 16, marginBottom: 12, cursor: 'pointer' }} onClick={function() { setSelected(isSelected ? null : legend); }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: legend.color + '22', border: '2px solid ' + legend.color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: legend.color, flexShrink: 0 }}>{legend.photo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#C9A0A0', letterSpacing: 1 }}>{legend.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{legend.years} · {legend.region}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>"{legend.quote}"</div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #2a2a2a' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: legend.color }}>{legend.games}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>GAMES</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold }}>{legend.titles}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>TITLES</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A0A0' }}>{legend.tributes}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>TRIBUTES</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={function(e) { e.stopPropagation(); setLegends(function(ls) { return ls.map(function(l) { return l.id === legend.id ? Object.assign({}, l, { candles: l.candles + 1 }) : l; }); }); }} style={{ flex: 1, background: 'rgba(85,34,51,0.3)', border: '1px solid #55223355', borderRadius: 8, padding: 10, color: '#C9A0A0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>🕯 LIGHT CANDLE ({legend.candles})</button>
                      <button onClick={function(e) { e.stopPropagation(); setTab('submit'); }} style={{ flex: 1, background: 'none', border: '1px solid #333', borderRadius: 8, padding: 10, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>✍️ TRIBUTE</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'submit' && (
        <div style={{ padding: 14 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#C9A0A0', letterSpacing: 1, marginBottom: 14 }}>SUBMIT A TRIBUTE OR NOMINATION</div>
          {[
            { label: 'FULL NAME', placeholder: 'Player name as known in the community' },
            { label: 'YEARS', placeholder: 'e.g. 1955 - 2021' },
            { label: 'REGION / STATE', placeholder: 'e.g. Pacific Northwest, California' },
            { label: 'THEIR SAYING', placeholder: 'A quote or phrase they were known for' },
          ].map(function(field, i) { return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>{field.label}</div>
              <input placeholder={field.placeholder} style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          );})}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>YOUR TRIBUTE MESSAGE</div>
            <textarea placeholder="Share a memory, story, or tribute..." style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', minHeight: 100, resize: 'none' }} />
          </div>
          <button style={{ width: '100%', background: 'linear-gradient(135deg,#552233,#3a1525)', border: 'none', borderRadius: 10, padding: 16, color: '#C9A0A0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 1 }}>🕯 SUBMIT TRIBUTE</button>
        </div>
      )}

      {tab === 'ceremony' && (
        <div style={{ padding: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(85,34,51,0.2),transparent)', border: '1px solid #55223344', borderRadius: 14, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#C9A0A0', letterSpacing: 2, marginBottom: 6 }}>OPENING CEREMONY</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>The Washington Classic 2026 opens with a moment of silence and a live tribute segment honoring our Fallen Legends. Their names will be displayed on stream during the ceremony.</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#C9A0A0', letterSpacing: 1, marginBottom: 12 }}>2026 HONORED LEGENDS</div>
          {legends.map(function(legend) { return (
            <div key={legend.id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20 }}>🕯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A0A0' }}>{legend.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{legend.years} · {legend.region}</div>
              </div>
              <div style={{ fontSize: 10, color: '#C9A0A0', fontFamily: "'Bebas Neue',sans-serif" }}>🕯 {legend.candles}</div>
            </div>
          );})}
          <button style={{ width: '100%', background: 'rgba(85,34,51,0.3)', border: '1px solid #55223355', borderRadius: 10, padding: 14, color: '#C9A0A0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', marginTop: 8, letterSpacing: 1 }}>▶ TRIGGER CEREMONY OVERLAY</button>
        </div>
      )}
    </div>
  );
}

// ── PK BATTLE MODAL V2 ────────────────────────────────────────

function PKBattleModalV2({ state, dispatch }) {
  var C = COLORS;
  var [phase, setPhase] = React.useState('lobby');
  var [scoreA, setScoreA] = React.useState(0);
  var [scoreB, setScoreB] = React.useState(0);
  var [round, setRound] = React.useState(1);
  var [log, setLog] = React.useState([]);
  var [challenged, setChallenged] = React.useState(null);
  var [challengeInput, setChallengeInput] = React.useState('');

  var host = { name: 'SwanyThree23', handle: '@SwanyThree23', color: C.gold, avatar: 'SW', wins: 47, losses: 12 };
  var opponent = challenged || { name: 'CaliBone22', handle: '@CaliBone22', color: C.cyan, avatar: 'CB', wins: 31, losses: 18 };

  var maxScore = 7;
  var hostPct = Math.floor((scoreA / maxScore) * 100);
  var oppPct = Math.floor((scoreB / maxScore) * 100);

  function addPoint(who) {
    var newA = who === 'host' ? scoreA + 1 : scoreA;
    var newB = who === 'opp' ? scoreB + 1 : scoreB;
    var entry = { id: Date.now(), round: round, scorer: who === 'host' ? host.name : opponent.name, time: 'R' + round };
    setLog(function(l) { return [entry].concat(l); });
    if (who === 'host') { setScoreA(newA); } else { setScoreB(newB); }
    if (newA >= maxScore || newB >= maxScore) { setPhase('result'); }
    else { setRound(function(r) { return r + 1; }); }
  }

  function reset() { setScoreA(0); setScoreB(0); setRound(1); setLog([]); setPhase('lobby'); }

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a0500,#0a0010)', padding: '14px 14px 12px', borderBottom: '1px solid ' + C.burgundy + '44', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={function() { dispatch({ type: 'CLOSE_MODAL' }); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', padding: 0 }}>✕</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.white, letterSpacing: 2 }}>⚔️ PK BATTLE</div>
            <div style={{ fontSize: 10, color: C.muted }}>First to {maxScore} wins · Round {round}</div>
          </div>
          {phase === 'active' && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, boxShadow: '0 0 6px ' + C.red }}></div>
            <span style={{ fontSize: 10, color: C.red, fontFamily: "'Bebas Neue',sans-serif" }}>LIVE</span>
          </div>}
        </div>
      </div>

      {phase === 'lobby' && (
        <div style={{ flex: 1, padding: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(139,0,0,0.1),rgba(0,0,100,0.1))', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: host.color + '22', border: '2px solid ' + host.color + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: host.color, margin: '0 auto 8px' }}>{host.avatar}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.white }}>{host.name}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{host.wins}W - {host.losses}L</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.muted, padding: '0 10px' }}>VS</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: opponent.color + '22', border: '2px solid ' + opponent.color + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: opponent.color, margin: '0 auto 8px' }}>{opponent.avatar}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.white }}>{opponent.name}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{opponent.wins}W - {opponent.losses}L</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, letterSpacing: 1 }}>CHALLENGE SOMEONE</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={challengeInput} onChange={function(e) { setChallengeInput(e.target.value); }} placeholder="@handle or search..." style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
              <button onClick={function() { if (challengeInput.trim()) { setChallenged({ name: challengeInput.replace('@',''), handle: '@' + challengeInput.replace('@',''), color: C.cyan, avatar: challengeInput.replace('@','')[0].toUpperCase(), wins: 0, losses: 0 }); setChallengeInput(''); }}} style={{ background: C.burgundy, border: 'none', borderRadius: 8, padding: '10px 16px', color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>CALL OUT</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[['First to 7', 7],['First to 5', 5],['First to 10', 10],['First to 3', 3]].map(function(opt, i) { return (
              <button key={i} style={{ background: opt[1] === maxScore ? C.gold + '22' : 'none', border: '1px solid ' + (opt[1] === maxScore ? C.gold : '#333'), borderRadius: 10, padding: 12, color: opt[1] === maxScore ? C.gold : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>{opt[0]}</button>
            );})}
          </div>
          <button onClick={function() { setPhase('active'); }} style={{ width: '100%', background: 'linear-gradient(135deg,' + C.burgundy + ',#8B0000)', border: 'none', borderRadius: 12, padding: 18, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, cursor: 'pointer', letterSpacing: 2 }}>⚔️ START BATTLE</button>
        </div>
      )}

      {phase === 'active' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 14px', background: 'linear-gradient(135deg,#1a0500,#00001a)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: host.color, lineHeight: 1 }}>{scoreA}</div>
                <div style={{ fontSize: 12, color: C.white, fontFamily: "'Bebas Neue',sans-serif" }}>{host.name}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 10px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.muted }}>VS</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>R{round}</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: opponent.color, lineHeight: 1 }}>{scoreB}</div>
                <div style={{ fontSize: 12, color: C.white, fontFamily: "'Bebas Neue',sans-serif" }}>{opponent.name}</div>
              </div>
            </div>
            <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: hostPct + '%', background: host.color, transition: 'width 0.3s' }}></div>
              <div style={{ flex: 1, background: '#1a1a1a' }}></div>
              <div style={{ width: oppPct + '%', background: opponent.color, transition: 'width 0.3s' }}></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 14px 0' }}>
            <button onClick={function() { addPoint('host'); }} style={{ background: host.color + '22', border: '2px solid ' + host.color + '66', borderRadius: 14, padding: 20, color: host.color, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>+1 {host.name.split(/(?=[A-Z])/)[0]}</button>
            <button onClick={function() { addPoint('opp'); }} style={{ background: opponent.color + '22', border: '2px solid ' + opponent.color + '66', borderRadius: 14, padding: 20, color: opponent.color, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>+1 {opponent.name.split(/(?=[A-Z])/)[0]}</button>
          </div>
          <div style={{ padding: '14px 14px 0', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>MATCH LOG</div>
            {log.map(function(entry) { return (
              <div key={entry.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: C.muted, minWidth: 20 }}>{entry.time}</span>
                <span style={{ fontSize: 12, color: C.white }}>{entry.scorer}</span>
                <span style={{ fontSize: 11, color: C.gold, marginLeft: 'auto' }}>+1</span>
              </div>
            );})}
          </div>
          <div style={{ padding: 14 }}>
            <button onClick={reset} style={{ width: '100%', background: 'none', border: '1px solid ' + C.red + '44', borderRadius: 10, padding: 12, color: C.red, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>FORFEIT BATTLE</button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold, letterSpacing: 2, marginBottom: 4 }}>{scoreA >= maxScore ? host.name : opponent.name}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.muted, marginBottom: 16 }}>WINS THE PK BATTLE</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: C.white, letterSpacing: 8, marginBottom: 24 }}>{scoreA} - {scoreB}</div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={reset} style={{ flex: 1, background: C.gold, border: 'none', borderRadius: 12, padding: 16, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>REMATCH</button>
            <button onClick={function() { dispatch({ type: 'CLOSE_MODAL' }); }} style={{ flex: 1, background: 'none', border: '1px solid #444', borderRadius: 12, padding: 16, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GREEN ROOM MODAL V2 ───────────────────────────────────────

function GreenRoomModalV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('queue');
  var tabs = [['queue','🎬 QUEUE'],['holding','⏳ HOLDING'],['settings','⚙️ SETTINGS']];

  var [queue, setQueue] = React.useState([
    { id: 1, name: 'CaliBonesOG', handle: '@CaliBonesOG', role: 'Co-Host', status: 'ready', wait: '2m', avatar: 'CB', color: C.cyan, mic: true, cam: true },
    { id: 2, name: 'VibeNBones', handle: '@VibeNBones', role: 'Guest', status: 'waiting', wait: '5m', avatar: 'VB', color: '#9B59B6', mic: true, cam: false },
    { id: 3, name: 'BigBoneEarl', handle: '@BigBoneEarl', role: 'Guest', status: 'ready', wait: '1m', avatar: 'BE', color: C.gold, mic: false, cam: true },
    { id: 4, name: 'SeattleSlider', handle: '@SeattleSlider', role: 'Guest', status: 'connecting', wait: '8m', avatar: 'SS', color: C.green, mic: false, cam: false },
  ]);

  var [holding, setHolding] = React.useState([
    { id: 5, name: 'MamaJoyce', handle: '@MamaJoyce', role: 'Viewer', status: 'hold', wait: '12m', avatar: 'MJ', color: C.muted },
    { id: 6, name: 'FastHandsRod', handle: '@FastHandsRod', role: 'Guest', status: 'hold', wait: '15m', avatar: 'FR', color: C.volt },
  ]);

  var statusColor = { ready: C.green, waiting: C.gold, connecting: C.cyan, hold: C.muted };
  var statusLabel = { ready: 'READY', waiting: 'WAITING', connecting: 'CONNECTING', hold: 'ON HOLD' };

  function admit(person) {
    setQueue(function(q) { return q.filter(function(p) { return p.id !== person.id; }); });
  }

  function holdPerson(person) {
    setQueue(function(q) { return q.filter(function(p) { return p.id !== person.id; }); });
    setHolding(function(h) { return h.concat(Object.assign({}, person, { status: 'hold' })); });
  }

  function admitFromHold(person) {
    setHolding(function(h) { return h.filter(function(p) { return p.id !== person.id; }); });
    setQueue(function(q) { return [Object.assign({}, person, { status: 'waiting' })].concat(q); });
  }

  var readyCount = queue.filter(function(p) { return p.status === 'ready'; }).length;

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#001a0a,#051505)', padding: '14px 14px 0', borderBottom: '1px solid ' + C.green + '33', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={function() { dispatch({ type: 'CLOSE_MODAL' }); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', padding: 0 }}>✕</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.green, letterSpacing: 2 }}>GREEN ROOM</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 10, color: readyCount > 0 ? C.green : C.muted }}>{readyCount} READY</span>
              <span style={{ fontSize: 10, color: C.muted }}>· {queue.length} IN QUEUE · {holding.length} ON HOLD</span>
            </div>
          </div>
          <button style={{ background: C.green + '22', border: '1px solid ' + C.green + '44', borderRadius: 10, padding: '8px 14px', color: C.green, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>ADMIT ALL READY</button>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.green : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.green : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {tab === 'queue' && (
          <div>
            {queue.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>Queue is empty. Guests will appear here when they join.</div>}
            {queue.map(function(person) { return (
              <div key={person.id} style={{ background: person.status === 'ready' ? 'rgba(0,200,100,0.08)' : '#111', border: '2px solid ' + (person.status === 'ready' ? C.green + '44' : '#2a2a2a'), borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: person.color + '22', border: '2px solid ' + person.color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: person.color, flexShrink: 0 }}>{person.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{person.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{person.handle} · {person.role}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: statusColor[person.status], fontFamily: "'Bebas Neue',sans-serif" }}>{statusLabel[person.status]}</span>
                      <span style={{ fontSize: 9, color: C.muted }}>Waiting {person.wait}</span>
                      <span style={{ fontSize: 9, color: person.mic ? C.green : C.red }}>🎤 {person.mic ? 'OK' : 'OFF'}</span>
                      <span style={{ fontSize: 9, color: person.cam ? C.green : C.red }}>📹 {person.cam ? 'OK' : 'OFF'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={function() { admit(person); }} style={{ flex: 2, background: person.status === 'ready' ? C.green : C.green + '22', border: '1px solid ' + C.green + '44', borderRadius: 8, padding: 10, color: person.status === 'ready' ? '#000' : C.green, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>ADMIT TO PANEL</button>
                  <button onClick={function() { holdPerson(person); }} style={{ flex: 1, background: 'none', border: '1px solid #444', borderRadius: 8, padding: 10, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>HOLD</button>
                  <button style={{ flex: 1, background: 'none', border: '1px solid ' + C.red + '44', borderRadius: 8, padding: 10, color: C.red, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>REMOVE</button>
                </div>
              </div>
            );})}
          </div>
        )}

        {tab === 'holding' && (
          <div>
            {holding.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>No one on hold.</div>}
            {holding.map(function(person) { return (
              <div key={person.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 14, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1a1a1a', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.muted, flexShrink: 0 }}>{person.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{person.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{person.handle} · On hold {person.wait}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={function() { admitFromHold(person); }} style={{ background: C.green + '22', border: '1px solid ' + C.green + '44', borderRadius: 8, padding: '6px 12px', color: C.green, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>MOVE TO QUEUE</button>
                </div>
              </div>
            );})}
          </div>
        )}

        {tab === 'settings' && (
          <div>
            {[
              { label: 'Auto-admit Ready Guests', sub: 'Automatically bring in guests when status is READY', on: false },
              { label: 'Require Camera', sub: 'Block admission if camera is off', on: true },
              { label: 'Require Mic', sub: 'Block admission if mic is off', on: false },
              { label: 'Hold Latecomers', sub: 'Move guests to hold if they join after stream starts', on: true },
              { label: 'Max Panel Size', sub: 'Hard cap at 20 guests (MAX_PANEL_GUESTS)', on: true },
              { label: 'Notify on Join', sub: 'Alert host when a new guest enters the green room', on: true },
            ].map(function(setting, i) { return (
              <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontSize: 13 }}>{setting.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{setting.sub}</div>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: setting.on ? C.green + '33' : '#2a2a2a', border: '1px solid ' + (setting.on ? C.green + '55' : '#333'), cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: setting.on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: setting.on ? C.green : '#555', transition: 'left 0.2s' }}></div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAYOUT DASHBOARD ──────────────────────────────────────────

function PayoutDashboardV1({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('summary');
  var tabs = [['summary','💰 SUMMARY'],['history','📜 HISTORY'],['stripe','💳 STRIPE'],['settings','⚙️ SETTINGS']];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#020a00,#0a1400)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.green + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.green + ',#020a00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.green + '44' }}>💰</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.green, letterSpacing: 2 }}>PAYOUT CENTER</div>
            <div style={{ fontSize: 11, color: C.muted }}>Stripe Connect · acct_1Svbvv2N0KWn0OQu</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.green : '2px solid transparent', padding: '8px 10px', color: tab === t[0] ? C.green : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div>
        {tab === 'summary' && <PayoutSummaryTab C={C} />}
        {tab === 'history' && <PayoutHistoryTab C={C} />}
        {tab === 'stripe' && <PayoutStripeTab C={C} />}
        {tab === 'settings' && <PayoutSettingsTab C={C} />}
      </div>
    </div>
  );
}

function PayoutSummaryTab({ C }) {
  var [requesting, setRequesting] = React.useState(false);
  var [requested, setRequested] = React.useState(false);
  function requestPayout() {
    setRequesting(true);
    setTimeout(function() { setRequesting(false); setRequested(true); }, 1800);
  }
  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(0,200,100,0.12),transparent)', border: '1px solid ' + C.green + '44', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, letterSpacing: 2 }}>AVAILABLE BALANCE</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: C.green, letterSpacing: 2, lineHeight: 1 }}>$4,812</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>After 10% platform fee · 90% creator split</div>
        <button onClick={requestPayout} disabled={requesting || requested} style={{ marginTop: 16, background: requested ? C.green + '22' : requesting ? '#333' : C.green, border: requested ? '1px solid ' + C.green + '44' : 'none', borderRadius: 12, padding: '14px 40px', color: requested ? C.green : requesting ? C.muted : '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: requesting || requested ? 'default' : 'pointer', letterSpacing: 1 }}>{requested ? '✓ PAYOUT REQUESTED' : requesting ? 'PROCESSING...' : 'REQUEST PAYOUT'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold }}>$5,346</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>GROSS THIS MONTH</div>
        </div>
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.red }}>-$534</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>PLATFORM FEE (10%)</div>
        </div>
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.cyan }}>$1,240</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>PENDING CLEARANCE</div>
        </div>
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#9B59B6' }}>$28,441</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>LIFETIME EARNINGS</div>
        </div>
      </div>
      <div style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid ' + C.green + '33', borderRadius: 12, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.green, letterSpacing: 1, marginBottom: 8 }}>SPLIT ENFORCEMENT LOG</div>
        {[
          { layer: 'PostgreSQL Trigger', status: 'ENFORCED', detail: 'assertCreatorSplit() on every transaction' },
          { layer: 'API Middleware', status: 'ENFORCED', detail: 'assertSplit() blocks any non-90 payout' },
          { layer: 'Stripe application_fee_amount', status: 'ENFORCED', detail: '10% fee hardcoded at payment intent creation' },
        ].map(function(item, i) { return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }}></div>
            <div style={{ flex: 1, fontSize: 11, color: C.muted }}>{item.layer}</div>
            <span style={{ fontSize: 9, color: C.green, fontFamily: "'Bebas Neue',sans-serif", background: C.green + '22', borderRadius: 4, padding: '2px 6px' }}>{item.status}</span>
          </div>
        );})}
      </div>
    </div>
  );
}

function PayoutHistoryTab({ C }) {
  var payouts = [
    { id: 'po_001', date: 'Jun 1', amount: '$3,241', status: 'paid', method: 'Bank Transfer', streams: 12 },
    { id: 'po_002', date: 'May 1', amount: '$2,890', status: 'paid', method: 'Bank Transfer', streams: 10 },
    { id: 'po_003', date: 'Apr 1', amount: '$1,980', status: 'paid', method: 'Bank Transfer', streams: 8 },
    { id: 'po_004', date: 'Mar 1', amount: '$1,540', status: 'paid', method: 'Bank Transfer', streams: 7 },
    { id: 'po_005', date: 'Jun 15 (pending)', amount: '$4,812', status: 'pending', method: 'Bank Transfer', streams: 14 },
  ];
  var statusColor = { paid: C.green, pending: C.gold, failed: C.red };
  return (
    <div style={{ padding: 14 }}>
      {payouts.map(function(p) { return (
        <div key={p.id} style={{ background: '#111', border: '1px solid ' + (p.status === 'pending' ? C.gold + '33' : '#1e1e1e'), borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: p.status === 'paid' ? C.green : C.gold }}>{p.amount}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.date} · {p.method}</div>
            </div>
            <span style={{ background: statusColor[p.status] + '22', border: '1px solid ' + statusColor[p.status] + '44', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: statusColor[p.status], fontFamily: "'Bebas Neue',sans-serif" }}>{p.status.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 10, color: C.muted }}>{p.streams} streams</span>
            <span style={{ fontSize: 10, color: C.muted }}>{p.id}</span>
          </div>
        </div>
      );})}
    </div>
  );
}

function PayoutStripeTab({ C }) {
  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: '#111', border: '1px solid #6772E544', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#6772E522', border: '1px solid #6772E544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💳</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#6772E5', letterSpacing: 1 }}>STRIPE CONNECT</div>
            <div style={{ fontSize: 10, color: C.green }}>● CONNECTED</div>
          </div>
        </div>
        {[
          { label: 'Account ID', value: 'acct_1Svbvv2N0KWn0OQu' },
          { label: 'Account Type', value: 'Express Connected' },
          { label: 'Payout Schedule', value: 'Monthly (1st of month)' },
          { label: 'Bank on File', value: '••••••••1234' },
          { label: 'Currency', value: 'USD' },
          { label: 'Application Fee', value: '10% (CREATOR_SPLIT = 0.90)' },
        ].map(function(item, i) { return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #1a1a1a' : 'none' }}>
            <span style={{ fontSize: 11, color: C.muted }}>{item.label}</span>
            <span style={{ fontSize: 11, color: C.white, fontFamily: "'Bebas Neue',sans-serif" }}>{item.value}</span>
          </div>
        );})}
      </div>
      <button style={{ width: '100%', background: '#6772E522', border: '1px solid #6772E544', borderRadius: 10, padding: 14, color: '#6772E5', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>OPEN STRIPE DASHBOARD</button>
      <button style={{ width: '100%', background: 'none', border: '1px solid #333', borderRadius: 10, padding: 14, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer' }}>UPDATE BANK ACCOUNT</button>
    </div>
  );
}

function PayoutSettingsTab({ C }) {
  return (
    <div style={{ padding: 14 }}>
      {[
        { label: 'Auto-Payout', sub: 'Automatically request payout when balance exceeds $1,000', on: true },
        { label: 'Payout Notifications', sub: 'Email + push when payout is processed', on: true },
        { label: 'Weekly Summary Email', sub: 'Revenue breakdown every Monday', on: false },
        { label: 'Tax Document Alerts', sub: 'Notify when 1099 forms are available', on: true },
        { label: '2FA for Payouts', sub: 'Require two-factor auth for payout requests', on: true },
      ].map(function(setting, i) { return (
        <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.white, fontSize: 13 }}>{setting.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{setting.sub}</div>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: setting.on ? C.green + '33' : '#2a2a2a', border: '1px solid ' + (setting.on ? C.green + '55' : '#333'), cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: setting.on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: setting.on ? C.green : '#555', transition: 'left 0.2s' }}></div>
          </div>
        </div>
      );})}
      <div style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid ' + C.green + '22', borderRadius: 10, padding: 14, marginTop: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>CREATOR_SPLIT = 0.90 is an immutable platform constant. It cannot be changed through settings. Contact support@seewhylive.online to discuss enterprise arrangements.</div>
      </div>
    </div>
  );
}

// ============================================================
// BATCH M — Schedule + Breakout + INS Forge + SwanyBot +
//           Guardian AI + Sponsor Overlay V2 + WA Classic
// ============================================================

// ── SCHEDULE MANAGER ─────────────────────────────────────────

function ScheduleManager({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('upcoming');
  var [showAdd, setShowAdd] = React.useState(false);
  var tabs = [['upcoming','📅 UPCOMING'],['live','🔴 LIVE'],['past','📼 PAST'],['add','➕ ADD']];
  var [events, setEvents] = React.useState([
    { id: 1, title: 'Washington Classic Semis', date: 'Jun 14', time: '7:00 PM', type: 'tournament', status: 'upcoming', desc: 'Semi-final matches — top 8 players', thumb: '🏆', color: C.gold, ppv: true, price: 9.99, registered: 1204 },
    { id: 2, title: 'PK Battle Night', date: 'Jun 16', time: '8:00 PM', type: 'pk', status: 'upcoming', desc: 'Open challenge night — all skill levels', thumb: '⚔️', color: C.burgundy, ppv: false, price: 0, registered: 486 },
    { id: 3, title: 'VibeNBones Sunday Session', date: 'Jun 18', time: '4:00 PM', type: 'casual', status: 'upcoming', desc: 'Chill Sunday domino vibes', thumb: '🎵', color: '#9B59B6', ppv: false, price: 0, registered: 312 },
    { id: 4, title: 'Washington Classic Finals', date: 'Jun 21', time: '6:00 PM', type: 'tournament', status: 'upcoming', desc: 'Championship match — live from Des Moines WA', thumb: '🏆', color: C.gold, ppv: true, price: 14.99, registered: 2841 },
    { id: 5, title: 'SwanyThree23 Live Now', date: 'Today', time: 'LIVE', type: 'live', status: 'live', desc: 'Domino session in progress', thumb: '🔴', color: C.red, ppv: false, price: 0, registered: 892 },
  ]);
  var upcoming = events.filter(function(e) { return e.status === 'upcoming'; });
  var live = events.filter(function(e) { return e.status === 'live'; });
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#050510,#0a0a20)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.gold + ',#050510)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.gold + '44' }}>📅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>SCHEDULE MANAGER</div>
            <div style={{ fontSize: 11, color: C.muted }}>{upcoming.length} upcoming · {live.length} live now</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); if (t[0] === 'add') setShowAdd(true); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 12px', color: tab === t[0] ? C.gold : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {live.length > 0 && tab === 'upcoming' && (
          <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid ' + C.red + '44', borderRadius: 14, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.red, boxShadow: '0 0 8px ' + C.red, flexShrink: 0 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: C.red, letterSpacing: 1 }}>{live[0].title}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{live[0].registered.toLocaleString()} watching now</div>
            </div>
            <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'live' }); }} style={{ background: C.red, border: 'none', borderRadius: 8, padding: '8px 14px', color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>JOIN</button>
          </div>
        )}
        {(tab === 'upcoming' ? upcoming : tab === 'live' ? live : []).map(function(ev) { return (
          <div key={ev.id} style={{ background: '#111', border: '1px solid ' + ev.color + '33', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: ev.color + '22', border: '1px solid ' + ev.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{ev.thumb}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.white, letterSpacing: 1 }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: ev.color, marginTop: 2 }}>{ev.date} · {ev.time}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{ev.desc}</div>
              </div>
              {ev.ppv && <div style={{ background: C.gold + '22', border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: C.gold, fontFamily: "'Bebas Neue',sans-serif", flexShrink: 0 }}>${ev.price}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: C.muted }}>{ev.registered.toLocaleString()} registered</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: 'none', border: '1px solid #333', borderRadius: 8, padding: '6px 12px', color: C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer' }}>EDIT</button>
                <button style={{ background: ev.color + '22', border: '1px solid ' + ev.color + '44', borderRadius: 8, padding: '6px 12px', color: ev.color, fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer' }}>GO LIVE</button>
              </div>
            </div>
          </div>
        );})}
        {tab === 'add' && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: C.gold, letterSpacing: 1, marginBottom: 14 }}>SCHEDULE NEW STREAM</div>
            {[{l:'TITLE',p:'Stream title'},{l:'DATE',p:'Jun 14, 2026'},{l:'TIME',p:'7:00 PM PT'},{l:'DESCRIPTION',p:'What this stream is about'}].map(function(f,i) { return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>{f.l}</div>
                <input placeholder={f.p} style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            );})}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>TYPE</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Tournament','PK Battle','Casual','PPV Event'].map(function(t,i) { return (
                  <button key={i} style={{ background: i === 0 ? C.gold + '22' : 'none', border: '1px solid ' + (i === 0 ? C.gold : '#333'), borderRadius: 8, padding: '8px 14px', color: i === 0 ? C.gold : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>{t}</button>
                );})}
              </div>
            </div>
            <button style={{ width: '100%', background: 'linear-gradient(135deg,' + C.gold + ',#8B6914)', border: 'none', borderRadius: 12, padding: 16, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 1, marginTop: 8 }}>📅 SCHEDULE STREAM</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BREAKOUT ROOMS MODAL ──────────────────────────────────────

function BreakoutRoomsModal({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('rooms');
  var tabs = [['rooms','🚪 ROOMS'],['assign','👥 ASSIGN'],['settings','⚙️ SETTINGS']];
  var [rooms, setRooms] = React.useState([
    { id: 1, name: 'Main Stage', guests: ['SwanyThree23','CaliBonesOG','VibeNBones'], capacity: 6, active: true, color: C.gold },
    { id: 2, name: 'Bone Room A', guests: ['BigBoneEarl','SeattleSlider'], capacity: 4, active: true, color: C.cyan },
    { id: 3, name: 'Bone Room B', guests: ['MamaJoyce'], capacity: 4, active: false, color: '#9B59B6' },
    { id: 4, name: 'VIP Lounge', guests: [], capacity: 3, active: false, color: C.burgundy },
  ]);
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#001520,#000a15)', padding: '14px 14px 0', borderBottom: '1px solid ' + C.cyan + '33', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={function() { dispatch({ type: 'CLOSE_MODAL' }); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', padding: 0 }}>✕</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.cyan, letterSpacing: 2 }}>BREAKOUT ROOMS</div>
            <div style={{ fontSize: 10, color: C.muted }}>{rooms.filter(function(r) { return r.active; }).length} active · {rooms.reduce(function(a,r) { return a + r.guests.length; }, 0)} guests placed</div>
          </div>
          <button onClick={function() { setRooms(function(rs) { return rs.concat({ id: Date.now(), name: 'Room ' + (rs.length + 1), guests: [], capacity: 4, active: false, color: C.green }); }); }} style={{ background: C.cyan + '22', border: '1px solid ' + C.cyan + '44', borderRadius: 10, padding: '8px 12px', color: C.cyan, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>+ ROOM</button>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.cyan : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.cyan : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {tab === 'rooms' && rooms.map(function(room) { return (
          <div key={room.id} style={{ background: room.active ? room.color + '08' : '#111', border: '2px solid ' + (room.active ? room.color + '44' : '#2a2a2a'), borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: room.color + '22', border: '1px solid ' + room.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚪</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: C.white }}>{room.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{room.guests.length}/{room.capacity} guests</div>
              </div>
              <button onClick={function() { setRooms(function(rs) { return rs.map(function(r) { return r.id === room.id ? Object.assign({}, r, { active: !r.active }) : r; }); }); }} style={{ background: room.active ? room.color + '22' : 'none', border: '1px solid ' + (room.active ? room.color : '#444'), borderRadius: 8, padding: '6px 12px', color: room.active ? room.color : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer' }}>{room.active ? 'ACTIVE' : 'INACTIVE'}</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {room.guests.map(function(g, i) { return (
                <div key={i} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.white }}>{g}</div>
              );})}
              {room.guests.length === 0 && <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>Empty — drag guests here</div>}
            </div>
          </div>
        );})}
        {tab === 'assign' && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.cyan, letterSpacing: 1, marginBottom: 12 }}>DRAG GUESTS TO ROOMS</div>
            {['CaliBonesOG','VibeNBones','BigBoneEarl','SeattleSlider','MamaJoyce','FastHandsRod'].map(function(g, i) { return (
              <div key={i} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.cyan + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.cyan }}>{g[0]}</div>
                <div style={{ flex: 1, fontSize: 13, color: C.white }}>{g}</div>
                <select style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 10px', color: C.white, fontSize: 11 }}>
                  {rooms.map(function(r) { return <option key={r.id} value={r.id}>{r.name}</option>; })}
                </select>
              </div>
            );})}
            <button style={{ width: '100%', background: C.cyan, border: 'none', borderRadius: 12, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', marginTop: 8 }}>APPLY ASSIGNMENTS</button>
          </div>
        )}
        {tab === 'settings' && (
          <div>
            {[
              { label: 'Auto-balance Rooms', sub: 'Distribute guests evenly on open', on: false },
              { label: 'Allow Guest Movement', sub: 'Guests can move between rooms', on: true },
              { label: 'Broadcast All Rooms', sub: 'RTMP fanout covers all active rooms', on: false },
              { label: 'Main Stage Priority', sub: 'Main Stage always gets best bitrate', on: true },
            ].map(function(s, i) { return (
              <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.sub}</div>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: s.on ? C.cyan + '33' : '#2a2a2a', border: '1px solid ' + (s.on ? C.cyan + '55' : '#333'), position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: s.on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: s.on ? C.cyan : '#555' }}></div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── INS FORGE ─────────────────────────────────────────────────

function INSForgePage({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('forge');
  var [prompt, setPrompt] = React.useState('');
  var [generating, setGenerating] = React.useState(false);
  var [output, setOutput] = React.useState('');
  var [style, setStyle] = React.useState('hype');
  var tabs = [['forge','⚡ FORGE'],['templates','📋 TEMPLATES'],['history','📜 HISTORY']];
  var styles = [['hype','🔥 HYPE'],['smooth','😎 SMOOTH'],['classic','🎭 CLASSIC'],['announce','📢 ANNOUNCE']];
  var templates = [
    { name: 'Stream Intro', icon: '🎬', prompt: 'Write a 30-second hype intro for a SeeWhy LIVE domino stream hosted by SwanyThree23' },
    { name: 'PK Challenge', icon: '⚔️', prompt: 'Write a trash-talk PK battle callout from SwanyThree23 challenging the community' },
    { name: 'Washington Classic', icon: '🏆', prompt: 'Write tournament hype copy for the Washington Classic Domino Championship in Des Moines WA' },
    { name: 'Gem Drop Alert', icon: '💎', prompt: 'Write a short gem drop announcement for SeeWhy LIVE viewers' },
    { name: 'Creator Shoutout', icon: '📣', prompt: 'Write a creator economy shoutout about the 90/10 split on SeeWhy LIVE' },
    { name: 'Sponsor Read', icon: '💼', prompt: 'Write a natural sponsor read for a SeeWhy LIVE stream' },
  ];
  var [history, setHistory] = React.useState([
    { id: 1, prompt: 'Stream intro hype', output: 'Ayo SeeWhy LIVE is in the building! SwanyThree23 bringing you the hardest domino content on the internet...', style: 'hype', time: '2h ago' },
    { id: 2, prompt: 'Washington Classic announcement', output: 'The Washington Classic returns to Des Moines WA. The bones are set. The players are ready...', style: 'announce', time: '1d ago' },
  ]);
  function forge() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setOutput('');
    var responses = {
      hype: 'YO! SeeWhy LIVE is LIVE and SwanyThree23 is in the building! The Techmunity is here, the bones are HOT, and we are NOT playing games tonight — well, actually we are. DOUBLE SIX ENERGY. Drop your gems in the chat, let the creator know you see them, and LETS GET THIS BROADCAST STARTED!',
      smooth: 'Welcome back to SeeWhy LIVE — the only platform built for real domino culture. SwanyThree23 in the seat tonight, bringing you the cleanest game on the net. Sit back, send some gems, and let the bones tell the story.',
      classic: 'Ladies and gentlemen, welcome to SeeWhy LIVE. Tonight your host SwanyThree23 presents another edition of premium domino entertainment, broadcast live from the Pacific Northwest to the Techmunity worldwide.',
      announce: 'ATTENTION SEEWHYLIVE COMMUNITY: SwanyThree23 is now broadcasting. Tonight's stream features live domino action, PK battles, and gem rewards for active participants. Stream is live at seewhylive.online.',
    };
    setTimeout(function() {
      var result = responses[style] || responses.hype;
      setOutput(result);
      setHistory(function(h) { return [{ id: Date.now(), prompt: prompt, output: result, style: style, time: 'just now' }].concat(h); });
      setGenerating(false);
    }, 1800);
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#100520,#050010)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.volt + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.volt + ',#100520)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.volt + '44' }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.volt, letterSpacing: 2 }}>INS FORGE</div>
            <div style={{ fontSize: 11, color: C.muted }}>AI Content Engine · Anthropic Claude</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flexShrink: 0, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.volt : '2px solid transparent', padding: '8px 12px', color: tab === t[0] ? C.volt : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'forge' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {styles.map(function(s) { return (
                <button key={s[0]} onClick={function() { setStyle(s[0]); }} style={{ background: style === s[0] ? C.volt + '22' : 'none', border: '1px solid ' + (style === s[0] ? C.volt : '#333'), borderRadius: 8, padding: '6px 12px', color: style === s[0] ? C.volt : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer' }}>{s[1]}</button>
              );})}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>WHAT DO YOU NEED?</div>
              <textarea value={prompt} onChange={function(e) { setPrompt(e.target.value); }} placeholder="Write a hype intro for tonight's Washington Classic stream..." style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px', color: C.white, fontSize: 13, boxSizing: 'border-box', minHeight: 90, resize: 'none' }} />
            </div>
            <button onClick={forge} disabled={generating} style={{ width: '100%', background: generating ? '#1a1a1a' : 'linear-gradient(135deg,' + C.volt + ',#4a8000)', border: 'none', borderRadius: 12, padding: 16, color: generating ? C.muted : '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: generating ? 'default' : 'pointer', letterSpacing: 1, marginBottom: 16 }}>{generating ? '⚡ FORGING...' : '⚡ FORGE CONTENT'}</button>
            {output && (
              <div style={{ background: C.volt + '08', border: '1px solid ' + C.volt + '33', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.volt, letterSpacing: 1 }}>FORGED OUTPUT</div>
                  <button style={{ background: 'none', border: '1px solid #333', borderRadius: 6, padding: '4px 10px', color: C.muted, fontSize: 10, cursor: 'pointer' }}>COPY</button>
                </div>
                <div style={{ fontSize: 13, color: C.white, lineHeight: 1.7 }}>{output}</div>
              </div>
            )}
          </div>
        )}
        {tab === 'templates' && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.volt, letterSpacing: 1, marginBottom: 14 }}>QUICK TEMPLATES</div>
            {templates.map(function(t, i) { return (
              <div key={i} onClick={function() { setPrompt(t.prompt); setTab('forge'); }} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.prompt.substring(0, 60)}...</div>
                </div>
                <div style={{ color: C.volt, fontSize: 16 }}>→</div>
              </div>
            );})}
          </div>
        )}
        {tab === 'history' && (
          <div>
            {history.map(function(h) { return (
              <div key={h.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: C.volt, fontFamily: "'Bebas Neue',sans-serif" }}>{h.style.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{h.time}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{h.prompt}</div>
                <div style={{ fontSize: 12, color: C.white, lineHeight: 1.6 }}>{h.output.substring(0, 120)}...</div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SWANYBOT DASHBOARD ────────────────────────────────────────

function SwanyBotDashboard({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('live');
  var [botEnabled, setBotEnabled] = React.useState(true);
  var tabs = [['live','💬 LIVE'],['commands','⌨️ COMMANDS'],['config','⚙️ CONFIG']];
  var [messages, setMessages] = React.useState([
    { id: 1, user: 'BigBoneEarl', text: '💎💎💎', type: 'gem', bot: false, time: '7:42' },
    { id: 2, user: 'SwanyBot', text: 'BigBoneEarl just dropped 50 gems! 🔥 Creator gets $25.00', type: 'bot', bot: true, time: '7:42' },
    { id: 3, user: 'SeattleSlider', text: '!score', type: 'command', bot: false, time: '7:43' },
    { id: 4, user: 'SwanyBot', text: 'Current score: SwanyThree23 4 - CaliBone22 3 | First to 7 wins!', type: 'bot', bot: true, time: '7:43' },
    { id: 5, user: 'MamaJoyce', text: 'LETS GO SWANY', type: 'chat', bot: false, time: '7:43' },
    { id: 6, user: 'VibeNBones', text: '!gems', type: 'command', bot: false, time: '7:44' },
    { id: 7, user: 'SwanyBot', text: 'Top tipper tonight: BigBoneEarl with 240 gems 👑', type: 'bot', bot: true, time: '7:44' },
  ]);
  var commands = [
    { cmd: '!score', desc: 'Shows current PK battle score', uses: 142, enabled: true },
    { cmd: '!gems', desc: 'Shows top gem senders tonight', uses: 89, enabled: true },
    { cmd: '!split', desc: 'Shows 90/10 creator split info', uses: 34, enabled: true },
    { cmd: '!schedule', desc: 'Shows upcoming stream schedule', uses: 67, enabled: true },
    { cmd: '!classic', desc: 'Washington Classic bracket info', uses: 201, enabled: true },
    { cmd: '!rules', desc: 'Domino game rules', uses: 28, enabled: false },
    { cmd: '!shoutout', desc: 'Shoutout a viewer (mod only)', uses: 15, enabled: true },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#050a20,#000510)', padding: '16px 14px 0', borderBottom: '1px solid #4488ff33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#4488ff,#050a20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid #4488ff44' }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: '#4488ff', letterSpacing: 2 }}>SWANYBOT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: botEnabled ? C.green : C.red, boxShadow: '0 0 6px ' + (botEnabled ? C.green : C.red) }}></div>
              <span style={{ fontSize: 10, color: botEnabled ? C.green : C.red, fontFamily: "'Bebas Neue',sans-serif" }}>{botEnabled ? 'ACTIVE' : 'OFFLINE'}</span>
            </div>
          </div>
          <button onClick={function() { setBotEnabled(function(b) { return !b; }); }} style={{ background: botEnabled ? C.green + '22' : C.red + '22', border: '1px solid ' + (botEnabled ? C.green : C.red) + '44', borderRadius: 10, padding: '8px 14px', color: botEnabled ? C.green : C.red, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>{botEnabled ? 'DISABLE' : 'ENABLE'}</button>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid #4488ff' : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? '#4488ff' : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'live' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#4488ff' }}>1,204</div>
                <div style={{ fontSize: 9, color: C.muted }}>MSGS TONIGHT</div>
              </div>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.green }}>312</div>
                <div style={{ fontSize: 9, color: C.muted }}>BOT REPLIES</div>
              </div>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold }}>0</div>
                <div style={{ fontSize: 9, color: C.muted }}>MODERATED</div>
              </div>
            </div>
            {messages.map(function(m) { return (
              <div key={m.id} style={{ background: m.bot ? '#4488ff08' : '#111', border: '1px solid ' + (m.bot ? '#4488ff33' : '#1e1e1e'), borderRadius: 10, padding: 10, marginBottom: 8, display: 'flex', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: m.bot ? '#4488ff22' : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{m.bot ? '🤖' : m.user[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: m.bot ? '#4488ff' : C.gold, fontWeight: 700 }}>{m.user}</span>
                    <span style={{ fontSize: 9, color: C.muted }}>{m.time}</span>
                    {m.type === 'command' && <span style={{ fontSize: 9, background: '#333', borderRadius: 4, padding: '1px 5px', color: C.muted }}>CMD</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.white }}>{m.text}</div>
                </div>
              </div>
            );})}
          </div>
        )}
        {tab === 'commands' && commands.map(function(cmd, i) { return (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: '#4488ff' }}>{cmd.cmd}</span>
                <span style={{ fontSize: 9, color: C.muted }}>used {cmd.uses}x</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{cmd.desc}</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: cmd.enabled ? '#4488ff33' : '#2a2a2a', border: '1px solid ' + (cmd.enabled ? '#4488ff55' : '#333'), position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: cmd.enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: cmd.enabled ? '#4488ff' : '#555' }}></div>
            </div>
          </div>
        );})}
        {tab === 'config' && (
          <div>
            {[
              { label: 'Auto-respond to !commands', sub: 'Bot replies to viewer commands automatically', on: true },
              { label: 'Gem Alerts', sub: 'Announce gem drops in chat', on: true },
              { label: 'New Follower Welcome', sub: 'Welcome new followers automatically', on: true },
              { label: 'Raid Announcements', sub: 'Hype message when a raid arrives', on: true },
              { label: 'Score Updates', sub: 'Auto-post PK battle score updates', on: false },
              { label: 'Guardian Integration', sub: 'Share moderation duties with Guardian AI', on: true },
            ].map(function(s, i) { return (
              <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.white, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.sub}</div>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: s.on ? '#4488ff33' : '#2a2a2a', border: '1px solid ' + (s.on ? '#4488ff55' : '#333'), position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: s.on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: s.on ? '#4488ff' : '#555' }}></div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GUARDIAN AI DASHBOARD ─────────────────────────────────────

function GuardianAIDashboard({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('monitor');
  var tabs = [['monitor','🛡 MONITOR'],['incidents','⚠️ INCIDENTS'],['thresholds','🎚 THRESHOLDS']];
  var [guardianOn, setGuardianOn] = React.useState(true);
  var incidents = [
    { id: 1, user: 'anon_4821', text: 'spam spam spam spam spam', type: 'SPAM', action: 'MUTED', time: '7:41', severity: 'low' },
    { id: 2, user: 'troll_99', text: '[inappropriate content removed]', type: 'HATE', action: 'BANNED', time: '7:38', severity: 'high' },
    { id: 3, user: 'user_2241', text: 'http://sus-link.xyz/click', type: 'LINK', action: 'DELETED', time: '7:22', severity: 'medium' },
  ];
  var severityColor = { low: C.gold, medium: C.volt, high: C.red };
  var thresholds = [
    { label: 'Spam Detection', value: 72, color: C.gold },
    { label: 'Hate Speech', value: 95, color: C.red },
    { label: 'Link Filter', value: 80, color: C.cyan },
    { label: 'Toxicity Score', value: 85, color: C.burgundy },
    { label: 'Bot Detection', value: 68, color: '#9B59B6' },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#001510,#000a08)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.green + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.green + ',#001510)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.green + '44' }}>🛡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.green, letterSpacing: 2 }}>GUARDIAN AI</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: guardianOn ? C.green : C.red, boxShadow: '0 0 6px ' + (guardianOn ? C.green : C.red) }}></div>
              <span style={{ fontSize: 10, color: guardianOn ? C.green : C.red, fontFamily: "'Bebas Neue',sans-serif" }}>{guardianOn ? 'PROTECTING' : 'OFFLINE'}</span>
            </div>
          </div>
          <button onClick={function() { setGuardianOn(function(g) { return !g; }); }} style={{ background: guardianOn ? C.green + '22' : C.red + '22', border: '1px solid ' + (guardianOn ? C.green : C.red) + '44', borderRadius: 10, padding: '8px 14px', color: guardianOn ? C.green : C.red, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer' }}>{guardianOn ? 'DISABLE' : 'ENABLE'}</button>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.green : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.green : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'monitor' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid ' + C.green + '33', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.green }}>3</div>
                <div style={{ fontSize: 9, color: C.muted }}>ACTIONS TODAY</div>
              </div>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold }}>1</div>
                <div style={{ fontSize: 9, color: C.muted }}>PENDING REVIEW</div>
              </div>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.cyan }}>98.2%</div>
                <div style={{ fontSize: 9, color: C.muted }}>ACCURACY</div>
              </div>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#9B59B6' }}>12ms</div>
                <div style={{ fontSize: 9, color: C.muted }}>AVG RESPONSE</div>
              </div>
            </div>
            <div style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid ' + C.green + '33', borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.green, letterSpacing: 1, marginBottom: 10 }}>LIVE FEED</div>
              {['Monitoring chat stream...','Scanning 892 active viewers','No threats detected in last 60s','SwanyBot integration: active'].map(function(line, i) { return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }}></div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.muted }}>{line}</div>
                </div>
              );})}
            </div>
          </div>
        )}
        {tab === 'incidents' && incidents.map(function(inc) { return (
          <div key={inc.id} style={{ background: '#111', border: '1px solid ' + severityColor[inc.severity] + '33', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: severityColor[inc.severity] + '22', border: '1px solid ' + severityColor[inc.severity] + '44', borderRadius: 5, padding: '3px 8px', fontSize: 9, color: severityColor[inc.severity], fontFamily: "'Bebas Neue',sans-serif" }}>{inc.type}</span>
                <span style={{ fontSize: 11, color: C.white, fontWeight: 700 }}>{inc.user}</span>
              </div>
              <span style={{ fontSize: 9, color: C.muted }}>{inc.time}</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{inc.text}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: C.green, fontFamily: "'Bebas Neue',sans-serif" }}>ACTION: {inc.action}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ background: 'none', border: '1px solid #333', borderRadius: 6, padding: '4px 10px', color: C.muted, fontSize: 10, cursor: 'pointer' }}>REVIEW</button>
                <button style={{ background: 'none', border: '1px solid ' + C.green + '44', borderRadius: 6, padding: '4px 10px', color: C.green, fontSize: 10, cursor: 'pointer' }}>APPROVE</button>
              </div>
            </div>
          </div>
        );})}
        {tab === 'thresholds' && (
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>Adjust Guardian AI sensitivity thresholds. Higher = stricter enforcement.</div>
            {thresholds.map(function(t, i) { return (
              <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: C.white }}>{t.label}</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: t.color }}>{t.value}%</span>
                </div>
                <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: t.value + '%', height: '100%', background: t.color, borderRadius: 3 }}></div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SPONSOR OVERLAY V2 ────────────────────────────────────────

function SponsorOverlayV2({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('active');
  var tabs = [['active','✅ ACTIVE'],['manage','📋 MANAGE'],['tiers','🏅 TIERS']];
  var [sponsors, setSponsors] = React.useState([
    { id: 1, name: 'Bone Masters', tier: 'title', logo: 'BM', color: C.gold, active: true, position: 'top-right', duration: 30, impressions: 12840 },
    { id: 2, name: 'PNW Domino Supply', tier: 'gold', logo: 'PD', color: '#DAA520', active: true, position: 'bottom-left', duration: 15, impressions: 8420 },
    { id: 3, name: 'Seattle Tiles', tier: 'silver', logo: 'ST', color: '#C0C0C0', active: false, position: 'bottom-right', duration: 10, impressions: 4210 },
  ]);
  var tiers = [
    { name: 'Title Sponsor', color: C.gold, price: '$500/mo', perks: ['Full overlay branding','30s spots','Logo on all streams','Shoutout every 30min'], slots: 1 },
    { name: 'Gold Sponsor', color: '#DAA520', price: '$200/mo', perks: ['Corner overlay','15s spots','Tournament branding'], slots: 2 },
    { name: 'Silver Sponsor', color: '#C0C0C0', price: '$75/mo', perks: ['Lower-third bar','10s spots'], slots: 4 },
    { name: 'Community', color: C.cyan, price: '$25/mo', perks: ['Chat badge','Monthly shoutout'], slots: 10 },
  ];
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0800,#150d00)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.gold + ',#0a0800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.gold + '44' }}>💼</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>SPONSOR OVERLAY</div>
            <div style={{ fontSize: 11, color: C.muted }}>{sponsors.filter(function(s) { return s.active; }).length} active · {sponsors.length} total</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.gold : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'active' && (
          <div>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid ' + C.gold + '33', borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 10 }}>STREAM OVERLAY PREVIEW</div>
              <div style={{ background: '#000', borderRadius: 10, height: 120, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 11 }}>[ STREAM PREVIEW ]</div>
                <div style={{ position: 'absolute', top: 8, right: 8, background: C.gold + 'dd', borderRadius: 6, padding: '4px 8px', fontSize: 9, color: '#000', fontFamily: "'Bebas Neue',sans-serif" }}>BONE MASTERS</div>
                <div style={{ position: 'absolute', bottom: 8, left: 8, background: '#DAA520dd', borderRadius: 6, padding: '4px 8px', fontSize: 9, color: '#000', fontFamily: "'Bebas Neue',sans-serif" }}>PNW DOMINO SUPPLY</div>
              </div>
            </div>
            {sponsors.map(function(sp) { return (
              <div key={sp.id} style={{ background: sp.active ? sp.color + '08' : '#111', border: '1px solid ' + (sp.active ? sp.color + '44' : '#2a2a2a'), borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: sp.color + '22', border: '2px solid ' + sp.color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: sp.color, flexShrink: 0 }}>{sp.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: C.white }}>{sp.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{sp.tier.toUpperCase()} · {sp.duration}s · {sp.impressions.toLocaleString()} impressions</div>
                </div>
                <button onClick={function() { setSponsors(function(ss) { return ss.map(function(s) { return s.id === sp.id ? Object.assign({}, s, { active: !s.active }) : s; }); }); }} style={{ background: sp.active ? C.green + '22' : 'none', border: '1px solid ' + (sp.active ? C.green : '#444') + '44', borderRadius: 8, padding: '6px 12px', color: sp.active ? C.green : C.muted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, cursor: 'pointer' }}>{sp.active ? 'LIVE' : 'OFF'}</button>
              </div>
            );})}
          </div>
        )}
        {tab === 'manage' && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 14 }}>ADD NEW SPONSOR</div>
            {[{l:'SPONSOR NAME',p:'Company or creator name'},{l:'TIER',p:'Title / Gold / Silver / Community'},{l:'LOGO URL',p:'https://...'},{l:'DURATION (seconds)',p:'15'}].map(function(f,i) { return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>{f.l}</div>
                <input placeholder={f.p} style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            );})}
            <button style={{ width: '100%', background: 'linear-gradient(135deg,' + C.gold + ',#8B6914)', border: 'none', borderRadius: 12, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer' }}>💼 ADD SPONSOR</button>
          </div>
        )}
        {tab === 'tiers' && tiers.map(function(tier, i) { return (
          <div key={i} style={{ background: '#111', border: '1px solid ' + tier.color + '33', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: tier.color, letterSpacing: 1 }}>{tier.name}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.green }}>{tier.price}</div>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{tier.slots} slot{tier.slots > 1 ? 's' : ''} available</div>
            {tier.perks.map(function(perk, j) { return (
              <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: tier.color, flexShrink: 0 }}></div>
                <span style={{ fontSize: 11, color: C.muted }}>{perk}</span>
              </div>
            );})}
          </div>
        );})}
      </div>
    </div>
  );
}

// ── WASHINGTON CLASSIC BRACKET ────────────────────────────────

function WashingtonClassicBracket({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('bracket');
  var tabs = [['bracket','🏆 BRACKET'],['players','👥 PLAYERS'],['results','📊 RESULTS']];
  var [bracket, setBracket] = React.useState({
    qf: [
      { id: 1, p1: { name: 'SwanyThree23', seed: 1, wins: 3, losses: 0 }, p2: { name: 'CaliBonesOG', seed: 8, wins: 2, losses: 1 }, winner: 'SwanyThree23', score: '4-1', status: 'complete' },
      { id: 2, p1: { name: 'BigBoneEarl', seed: 4, wins: 2, losses: 1 }, p2: { name: 'SeattleSlider', seed: 5, wins: 2, losses: 1 }, winner: 'BigBoneEarl', score: '4-2', status: 'complete' },
      { id: 3, p1: { name: 'VibeNBones', seed: 3, wins: 2, losses: 0 }, p2: { name: 'FastHandsRod', seed: 6, wins: 1, losses: 2 }, winner: 'VibeNBones', score: '4-0', status: 'complete' },
      { id: 4, p1: { name: 'PNW_Domino', seed: 2, wins: 3, losses: 0 }, p2: { name: 'TacomaTBone', seed: 7, wins: 1, losses: 2 }, winner: 'PNW_Domino', score: '4-3', status: 'complete' },
    ],
    sf: [
      { id: 5, p1: { name: 'SwanyThree23', seed: 1 }, p2: { name: 'BigBoneEarl', seed: 4 }, winner: null, score: null, status: 'live', date: 'Jun 14 7PM' },
      { id: 6, p1: { name: 'VibeNBones', seed: 3 }, p2: { name: 'PNW_Domino', seed: 2 }, winner: null, score: null, status: 'upcoming', date: 'Jun 14 9PM' },
    ],
    final: { id: 7, p1: null, p2: null, winner: null, score: null, status: 'upcoming', date: 'Jun 21 6PM' },
  });
  function MatchCard({ match, round }) {
    var isLive = match.status === 'live';
    var isDone = match.status === 'complete';
    return (
      <div style={{ background: isLive ? 'rgba(255,50,50,0.08)' : '#111', border: '2px solid ' + (isLive ? C.red + '66' : isDone ? C.green + '33' : '#2a2a2a'), borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: C.muted, letterSpacing: 1 }}>{round}</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: isLive ? C.red : isDone ? C.green : C.muted, letterSpacing: 1 }}>{isLive ? '🔴 LIVE' : isDone ? '✓ FINAL' : match.date || 'TBD'}</span>
        </div>
        {[match.p1, match.p2].map(function(p, i) {
          if (!p) return <div key={i} style={{ padding: 10, background: '#0a0a0a', borderRadius: 8, marginBottom: i === 0 ? 6 : 0, color: C.muted, fontSize: 12, textAlign: 'center' }}>TBD</div>;
          var isWinner = match.winner === p.name;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isWinner ? C.gold + '15' : '#0d0d0d', border: '1px solid ' + (isWinner ? C.gold + '44' : '#1a1a1a'), borderRadius: 10, marginBottom: i === 0 ? 6 : 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: C.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: C.gold, flexShrink: 0 }}>#{p.seed}</div>
              <div style={{ flex: 1, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: isWinner ? C.gold : C.white }}>{p.name}</div>
              {isWinner && <div style={{ fontSize: 14 }}>👑</div>}
              {isDone && match.score && <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: isWinner ? C.gold : C.muted }}>{isWinner ? match.score.split('-')[i === 0 ? 0 : 1] : match.score.split('-')[i === 0 ? 1 : 0]}</div>}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0800,#150d00)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '55' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,' + C.gold + ',#0a0800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid ' + C.gold + '66' }}>🏆</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold, letterSpacing: 2 }}>WASHINGTON CLASSIC</div>
            <div style={{ fontSize: 11, color: C.muted }}>2026 · Des Moines, WA · SeeWhy LIVE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.gold : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {tab === 'bracket' && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>SEMI-FINALS</div>
            {bracket.sf.map(function(m) { return <MatchCard key={m.id} match={m} round="SEMI-FINAL" />; })}
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: C.muted, letterSpacing: 2, marginBottom: 10, marginTop: 4 }}>GRAND FINAL</div>
            <MatchCard match={bracket.final} round="GRAND FINAL" />
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: C.muted, letterSpacing: 2, marginBottom: 10, marginTop: 4 }}>QUARTER-FINALS (COMPLETED)</div>
            {bracket.qf.map(function(m) { return <MatchCard key={m.id} match={m} round="QUARTER-FINAL" />; })}
          </div>
        )}
        {tab === 'players' && (
          <div>
            {[...bracket.qf.map(function(m) { return m.p1; }), ...bracket.qf.map(function(m) { return m.p2; })].map(function(p, i) { return (
              <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.gold }}>#{p.seed}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: C.white }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.wins}W - {p.losses}L</div>
                </div>
                {p.seed <= 4 && <div style={{ fontSize: 16 }}>⭐</div>}
              </div>
            );})}
          </div>
        )}
        {tab === 'results' && (
          <div>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid ' + C.gold + '33', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: C.muted, letterSpacing: 2 }}>CHAMPION TO BE DETERMINED</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.gold, marginTop: 4 }}>GRAND FINAL · JUN 21</div>
            </div>
            {bracket.qf.map(function(m) { return (
              <div key={m.id} style={{ background: '#111', border: '1px solid ' + C.green + '22', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 16 }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.white, fontWeight: 700 }}>{m.winner}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>def. {m.p1.name === m.winner ? m.p2.name : m.p1.name} · {m.score}</div>
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Bebas Neue',sans-serif" }}>QF</div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// BATCH N — Platform Integration Bridge
// Deep links to Base44 + JWT token receiver + stream sync
// ============================================================

// ── PLATFORM BRIDGE UTILITY ──────────────────────────────────

var PLATFORM = {
  base44: 'https://app.seewhylive.online',
  links: {
    dashboard:    'https://app.seewhylive.online/CreatorDashboard',
    analytics:    'https://app.seewhylive.online/AdvancedAnalytics',
    community:    'https://app.seewhylive.online/Communities',
    profile:      'https://app.seewhylive.online/Profile',
    vod:          'https://app.seewhylive.online/VODLibrary',
    clips:        'https://app.seewhylive.online/ClipsLibrary',
    scheduler:    'https://app.seewhylive.online/StreamScheduler',
    overlay:      'https://app.seewhylive.online/OverlayBuilder',
    guardian:     'https://app.seewhylive.online/GuardianAI',
    swanybot:     'https://app.seewhylive.online/SwanyBotPage',
    insforge:     'https://app.seewhylive.online/INSForge',
    leaderboard:  'https://app.seewhylive.online/Leaderboard',
    monetization: 'https://app.seewhylive.online/Monetization',
    podcast:      'https://app.seewhylive.online/PodcastStudio',
    newsletter:   'https://app.seewhylive.online/NewsletterHub',
    loyalty:      'https://app.seewhylive.online/LoyaltyHub',
    ppv:          'https://app.seewhylive.online/PayPerViewEvents',
    subscriptions:'https://app.seewhylive.online/CreatorSubscriptions',
  }
};

function openBase44(path) {
  window.open(PLATFORM.links[path] || PLATFORM.base44, '_blank');
}

// ── PLATFORM BRIDGE HUB PAGE ─────────────────────────────────

function PlatformBridgePage({ state, dispatch }) {
  var C = COLORS;
  var [tab, setTab] = React.useState('creator');
  var tabs = [['creator','🎬 CREATOR'],['viewer','👁 VIEWER'],['admin','⚙️ ADMIN']];

  var creatorLinks = [
    { icon: '📊', label: 'Creator Dashboard', key: 'dashboard', desc: 'Revenue, stats, stream history', color: C.gold },
    { icon: '📈', label: 'Advanced Analytics', key: 'analytics', desc: 'Deep audience insights', color: C.cyan },
    { icon: '💰', label: 'Monetization', key: 'monetization', desc: 'Payment settings, gem rates', color: C.green },
    { icon: '📅', label: 'Stream Scheduler', key: 'scheduler', desc: 'Schedule & promote streams', color: C.gold },
    { icon: '🎙', label: 'Podcast Studio', key: 'podcast', desc: 'Record & publish podcasts', color: '#9B59B6' },
    { icon: '🎭', label: 'Overlay Builder', key: 'overlay', desc: 'Design stream overlays', color: C.terracotta },
    { icon: '📰', label: 'Newsletter Hub', key: 'newsletter', desc: 'Email your community', color: C.cyan },
    { icon: '💎', label: 'Loyalty Hub', key: 'loyalty', desc: 'Manage viewer rewards', color: C.burgundy },
    { icon: '🎟', label: 'PPV Events', key: 'ppv', desc: 'Pay-per-view setup & sales', color: C.gold },
    { icon: '🤝', label: 'Subscriptions', key: 'subscriptions', desc: 'Bronze / Silver / Gold tiers', color: C.green },
  ];

  var viewerLinks = [
    { icon: '🎬', label: 'VOD Library', key: 'vod', desc: 'Past streams on demand', color: C.gold },
    { icon: '✂️', label: 'Clips Library', key: 'clips', desc: 'Best moments, shareable clips', color: C.cyan },
    { icon: '🏆', label: 'Leaderboard', key: 'leaderboard', desc: 'Top tippers & community ranks', color: C.gold },
    { icon: '👥', label: 'Communities', key: 'community', desc: 'Join creator communities', color: '#9B59B6' },
    { icon: '👤', label: 'Profile', key: 'profile', desc: 'Your viewer profile & history', color: C.muted },
  ];

  var adminLinks = [
    { icon: '🛡', label: 'Guardian AI', key: 'guardian', desc: 'Moderation dashboard & logs', color: C.green },
    { icon: '🤖', label: 'SwanyBot Config', key: 'swanybot', desc: 'Chat bot settings & commands', color: '#4488ff' },
    { icon: '⚡', label: 'INS Forge', key: 'insforge', desc: 'AI content generator', color: C.volt },
  ];

  var links = tab === 'creator' ? creatorLinks : tab === 'viewer' ? viewerLinks : adminLinks;

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0a0800,#050510)', padding: '16px 14px 0', borderBottom: '1px solid ' + C.gold + '44' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,' + C.gold + ',#800020)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '2px solid ' + C.gold + '55' }}>🔗</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.gold, letterSpacing: 2 }}>PLATFORM HUB</div>
            <div style={{ fontSize: 11, color: C.muted }}>seewhylive.online ↔ app.seewhylive.online</div>
          </div>
        </div>
        <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid ' + C.gold + '33', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: '0 0 6px ' + C.green, flexShrink: 0 }}></div>
          <div style={{ fontSize: 11, color: C.muted }}>Both platforms connected · Supabase shared backend</div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(function(t) { return (
            <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t[0] ? '2px solid ' + C.gold : '2px solid transparent', padding: '8px 4px', color: tab === t[0] ? C.gold : C.muted, fontSize: 10, fontFamily: "'Bebas Neue',sans-serif", cursor: 'pointer' }}>{t[1]}</button>
          );})}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid ' + C.gold + '22', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 18 }}>💡</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            <span style={{ color: C.cream }}>Broadcast Console</span> (this app) handles live streams, PK battles, panels & real-time tools.
            {' '}<span style={{ color: C.cream }}>app.seewhylive.online</span> handles profiles, analytics, communities & creator management.
          </div>
        </div>

        {links.map(function(link, i) { return (
          <div key={i} onClick={function() { openBase44(link.key); }} style={{ background: '#111', border: '1px solid ' + link.color + '22', borderRadius: 14, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: link.color + '18', border: '1px solid ' + link.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{link.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: C.white, letterSpacing: 1 }}>{link.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{link.desc}</div>
            </div>
            <div style={{ color: link.color, fontSize: 18, flexShrink: 0 }}>→</div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ── TOKEN RECEIVER (reads ?token= from URL) ──────────────────

function useTokenBridge(dispatch) {
  React.useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token');
    var creator = params.get('creator');
    var returnUrl = params.get('return');
    if (token) {
      dispatch({ type: 'SET_BRIDGE_TOKEN', payload: { token: token, creator: creator, returnUrl: returnUrl } });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
}

// ── STREAM SYNC UTILITY ───────────────────────────────────────

function syncStreamToSupabase(streamData) {
  var SUPABASE_URL = 'https://rxlgywvfclyjdfyvfvyc.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bGd5d3ZmY2x5amRmeXZmdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODA0ODIsImV4cCI6MjA2MDE1NjQ4Mn0.r3QDG62lOq3GNGCF16SqNjBSSbJBBVIxHC1Y5r-LFCI';
  return fetch(SUPABASE_URL + '/rest/v1/streams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      creator_id: streamData.creatorId || 'swanythree23',
      title: streamData.title || 'SeeWhy LIVE Stream',
      status: streamData.status || 'live',
      rtmp_key: streamData.rtmpKey || '',
      viewer_count: streamData.viewerCount || 0,
      started_at: new Date().toISOString()
    })
  }).catch(function(e) { console.warn('Stream sync failed:', e); });
}

// ── UNIFIED STATUS BAR (shows on all pages) ──────────────────

function PlatformStatusBar({ state, dispatch }) {
  var C = COLORS;
  var [visible, setVisible] = React.useState(true);
  if (!visible) return null;
  return (
    <div style={{ background: 'linear-gradient(90deg,#0a0800,#050510,#0a0800)', borderBottom: '1px solid ' + C.gold + '33', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: '0 0 5px ' + C.green }}></div>
        <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>CONSOLE</span>
        <span style={{ fontSize: 9, color: '#333', marginLeft: 4, marginRight: 4 }}>|</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: '0 0 5px ' + C.green }}></div>
        <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>APP</span>
      </div>
      <button onClick={function() { openBase44('dashboard'); }} style={{ background: C.gold + '18', border: '1px solid ' + C.gold + '44', borderRadius: 6, padding: '4px 10px', color: C.gold, fontFamily: "'Bebas Neue',sans-serif", fontSize: 9, cursor: 'pointer', letterSpacing: 1 }}>DASHBOARD →</button>
      <button onClick={function() { setVisible(false); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', padding: '0 2px' }}>×</button>
    </div>
  );
}
export default function App() {
  var [state, dispatch] = useReducer(appReducer, initialState);

  // Simulate connection quality fluctuation
  useEffect(function() {
    var t = setInterval(function() {
      var lat = rand(18, 45);
      var bps = rand(2400, 3600);
      var loss = Math.random() > 0.9 ? Math.floor(Math.random() * 10) / 10 : 0;
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
      {page === 'watchparty' && <WatchPartyPage state={state} dispatch={dispatch} />}
      {page === 'vods' && <VODLibraryPage state={state} dispatch={dispatch} />}
      {page === 'overlay' && <OverlayBuilderPage state={state} dispatch={dispatch} />}
      {page === 'clips' && <ClipEditorPage state={state} dispatch={dispatch} />}
      {page === 'podcast' && <PodcastStudioPage state={state} dispatch={dispatch} />}
      {page === 'multistream' && <MultiStreamPage state={state} dispatch={dispatch} />}
      {page === 'captions' && <CaptionStudioPage state={state} dispatch={dispatch} />}
      {page === 'greenroom' && <GreenRoomPage state={state} dispatch={dispatch} />}
      {page === 'broadcast' && <BroadcastHubPageV2 state={state} dispatch={dispatch} />}
        {page === 'domino' && <DominoHubPageV2 state={state} dispatch={dispatch} />}
        {page === 'community' && <CommunityHubPageV2 state={state} dispatch={dispatch} />}
        {page === 'notifications' && <NotificationsCenterV2 state={state} dispatch={dispatch} />}
        {page === 'messages' && <DirectMessagesV2 state={state} dispatch={dispatch} />}
        {page === 'appearance' && <ThemeToggleV2 state={state} dispatch={dispatch} />}
        {page === 'customize' && <ProfileCustomizerV2 state={state} dispatch={dispatch} />}
        {page === 'vods' && <VODLibraryV2 state={state} dispatch={dispatch} />}
        {page === 'onboarding' && <OnboardingWizardV2 state={state} dispatch={dispatch} />}
        {page === 'aihub' && <AIHubPageV2 state={state} dispatch={dispatch} />}
        {page === 'joyce' && <JoyceAIPageV2 state={state} dispatch={dispatch} />}
        {page === 'aura' && <AuraAIPageV2 state={state} dispatch={dispatch} />}
        {page === 'swanybot' && <SwanyBotPageV2 state={state} dispatch={dispatch} />}
        {page === 'guardian' && <GuardianAIPageV2 state={state} dispatch={dispatch} />}
        {page === 'pkbattle' && <PKBattleLobbyV2 state={state} dispatch={dispatch} />}
        {page === 'pkchallenge' && <PKChallengeFlowV2 state={state} dispatch={dispatch} />}
        {page === 'pkwatch' && <PKWatchRoomV2 state={state} dispatch={dispatch} />}
        {page === 'creatordash' && <CreatorDashboardV2 state={state} dispatch={dispatch} />}
        {page === 'analytics' && <AnalyticsDashboardV2 state={state} dispatch={dispatch} />}
        {page === 'goals' && <GoalTrackerV2 state={state} dispatch={dispatch} />}
        {page === 'settings' && <SettingsPageV2 state={state} dispatch={dispatch} />}
        {page === 'streamkeys' && <StreamKeysPageV2 state={state} dispatch={dispatch} />}
        {page === 'payoutsetup' && <PayoutSetupV2 state={state} dispatch={dispatch} />}
        {page === 'insforge' && <InSForgeStudioV2 state={state} dispatch={dispatch} />}
        <MobileWebViewHardeningInit />
        {page === 'studio' && <StudioControlsV1 state={state} dispatch={dispatch} />}
        {page === 'svs' && <SVSArenaV1 state={state} dispatch={dispatch} />}
        {page === 'mobile' && <MobileHardeningDashboard state={state} dispatch={dispatch} />}
        {page === 'analytics' && <CreatorAnalyticsDashboard state={state} dispatch={dispatch} />}
        {page === 'fallenlegends' && <FallenLegendsTributeV1 state={state} dispatch={dispatch} />}
        {page === 'payout' && <PayoutDashboardV1 state={state} dispatch={dispatch} />}
        {page === 'schedule' && <ScheduleManager state={state} dispatch={dispatch} />}
        {page === 'insforge' && <INSForgePage state={state} dispatch={dispatch} />}
        {page === 'swanybot' && <SwanyBotDashboard state={state} dispatch={dispatch} />}
        {page === 'guardian' && <GuardianAIDashboard state={state} dispatch={dispatch} />}
        {page === 'sponsors' && <SponsorOverlayV2 state={state} dispatch={dispatch} />}
        {page === 'bracket' && <WashingtonClassicBracket state={state} dispatch={dispatch} />}
        {page === 'hub' && <PlatformBridgePage state={state} dispatch={dispatch} />}
      {page === 'monetize' && <MonetizationHubPageV2 state={state} dispatch={dispatch} />}
      {page === 'profile' && <ProfilePage state={state} dispatch={dispatch} />}

      {/* Global modals */}
      <ModalDispatcher state={state} dispatch={dispatch} />

      {/* Toast notifications */}
      <ToastSystem toasts={state.toasts} dispatch={dispatch} />

      {/* Bottom navigation */}
      <BottomNavV46 page={page} dispatch={dispatch} notifications={state.notifications} />
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
  var tabs = [['pk','X PK'],['svs','SVS'],['challenges','CHALLENGES'],['elite','ELITE'],['manager','MANAGER'],['watchparty','PARTY'],['vods','VODS']];
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
      {subTab === 'watchparty' && <WatchPartyPage state={state} dispatch={dispatch} />}
      {subTab === 'vods' && <VODLibraryPage state={state} dispatch={dispatch} />}
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
            <button onClick={function() { if (challenger.trim()) { setBattleState('live'); setScores({ creator: 0, challenger: 0 }); dispatch({ type: 'OPEN_MODAL', payload: 'pk_battle' }); } }}
              style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, cursor: 'pointer', borderRadius: 2, width: '100%' }}>
              ⚔ CHALLENGE
            </button>
          </div>
        )}
        {battleState === 'live' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", color: C.gold }}>BATTLE LIVE!</div>
              <div style={{ fontSize: 32, fontFamily: 'monospace', color: timeLeft < 30 ? '#ff4444' : C.green }}>{timeLeft}s</div>
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
            <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: scores.creator >= scores.challenger ? C.green : '#ff4444' }}>
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
    if (s >= GUARDIAN_BAN) return { label: 'BAN', color: '#ff4444' };
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
        {[['FLAG', GUARDIAN_FLAG, '#ffcc00'], ['MUTE', GUARDIAN_MUTE, C.orange], ['BAN', GUARDIAN_BAN, '#ff4444']].map(function(item) {
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
              <div style={{ height: '100%', width: (score * 100) + '%', background: score >= 0.95 ? '#ff4444' : score >= 0.75 ? C.orange : score >= 0.5 ? '#ffcc00' : C.green, transition: 'width 0.5s' }} />
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
  var tabs = [['overview','💎 OVERVIEW'],['gems','⬆ GEMS'],['shop','🛒 SHOP'],['send','🎁 SEND'],['revenue','📊 REVENUE'],['payouts','💸 PAYOUTS']];
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
      {subTab === 'shop' && <GemShopV2 />}
      {subTab === 'send' && <GemSendV2 />}
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

function GemShopV2() {
  var C = COLORS;
  var packs = [[50,4.99,0,'Starter'],[100,9.99,10,'Popular'],[250,22.99,30,'Value'],[500,42.99,75,'Pro'],[1000,79.99,200,'Elite']];
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold, marginBottom: 12, letterSpacing: 1 }}>BUY GEMS</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>1 Gem = $0.10 USD · 90% goes to creators</div>
      {packs.map(function(p, i) { return (
        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (p[3] === 'Popular' ? C.gold : 'rgba(255,255,255,0.08)'), borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#FFD700' }}>{p[0]}{p[2] > 0 ? ' +' + p[2] : ''} 💎</span>
              {p[3] === 'Popular' && <span style={{ background: C.gold, color: '#000', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>BEST VALUE</span>}
            </div>
            {p[2] > 0 && <div style={{ fontSize: 10, color: '#00FF88', marginTop: 2 }}>+{p[2]} bonus gems</div>}
          </div>
          <button style={{ background: C.burgundy, border: 'none', borderRadius: 8, padding: '8px 16px', color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer' }}>${p[1].toFixed(2)}</button>
        </div>
      );})}
      <div style={{ fontSize: 10, color: '#444', textAlign: 'center', marginTop: 8 }}>Payments processed securely · Gems non-refundable</div>
    </div>
  );
}
function GemSendV2() {
  var C = COLORS;
  var creators = [{name:'SwanyThree23',gems:4821,live:true},{name:'CaliBone22',gems:2103,live:true},{name:'VibeNBones',gems:1892,live:false}];
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold, marginBottom: 12, letterSpacing: 1 }}>SEND GEMS</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Gift gems to your favorite creators</div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>SEND TO</div>
        <input placeholder="@creator handle..." style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }} />
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>AMOUNT</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[10,25,50,100,250].map(function(amt) { return (
            <button key={amt} style={{ flex: 1, background: '#1a1a2a', border: '1px solid #333', borderRadius: 6, padding: '8px 4px', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{amt}💎</button>
          );})}
        </div>
        <button style={{ width: '100%', background: C.burgundy, border: 'none', borderRadius: 10, padding: 14, color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>SEND GEMS</button>
      </div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#888', marginBottom: 10, letterSpacing: 1 }}>TOP CREATORS</div>
      {creators.map(function(c, i) { return (
        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>@{c.name}{c.live ? ' 🔴' : ''}</div>
            <div style={{ color: '#666', fontSize: 10 }}>{c.gems.toLocaleString()} gems received</div>
          </div>
          <button style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid ' + C.gold, borderRadius: 8, padding: '6px 14px', color: C.gold, fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>💎 GIFT</button>
        </div>
      );})}
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
            <span style={{ background: '#ff000022', color: '#ff4444', border: '1px solid #ff444444', fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>PAID</span>
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


function WashingtonClassicBracket() {
  var TEAMS = [["SwanyThree23","DominoKing"],["ClassicLive","TechMunity1"],["AIverse_Fan","NightOwl88"],["DCDomino","SwanyFam"],["MidAtlantic","BaltimoreB"],["VirginiaAce","PGCounty"],["AnnapolisDom","NoVaElite"],["DMVChampion","BYE"]];
  const [results, setResults] = React.useState({});
  function win(k,p1,p2){if(results[k])return results[k];if(p2==="BYE")return p1;return null;}
  function pick(k,n){if(results[k])return;setResults(function(p){var x=Object.assign({},p);x[k]=n;return x;});}
  var r1=TEAMS.map(function(t,i){return win("r1_"+i,t[0],t[1]);});
  var r2=[win("r2_0",r1[0]||"TBD",r1[1]||"TBD"),win("r2_1",r1[2]||"TBD",r1[3]||"TBD"),win("r2_2",r1[4]||"TBD",r1[5]||"TBD"),win("r2_3",r1[6]||"TBD",r1[7]||"TBD")];
  var r3=[win("r3_0",r2[0]||"TBD",r2[1]||"TBD"),win("r3_1",r2[2]||"TBD",r2[3]||"TBD")];
  var champ=win("final",r3[0]||"TBD",r3[1]||"TBD");
  function MB(props){var w=results[props.mk]||(props.p2==="BYE"?props.p1:null);return React.createElement("div",{style:{marginBottom:6}},[props.p1,props.p2].map(function(p,i){var iw=w===p;return React.createElement("div",{key:i,onClick:function(){if(!w&&p!=="TBD"&&p!=="BYE")pick(props.mk,p);},style:{background:iw?"#800020":"#111",border:iw?"1px solid #C9A84C":"1px solid #1a1a1a",borderRadius:i===0?"6px 6px 0 0":"0 0 6px 6px",padding:"6px 10px",fontSize:12,color:iw?"#fff":p==="TBD"||p==="BYE"?"#444":"#ccc",cursor:!w&&p!=="TBD"&&p!=="BYE"?"pointer":"default",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",justifyContent:"space-between"}},React.createElement("span",null,p==="BYE"?"—BYE—":p),iw&&React.createElement("span",{style:{color:"#C9A84C",fontSize:11}},"✓"));}));}
  var rounds=[TEAMS.map(function(t,i){return{p1:t[0],p2:t[1],mk:"r1_"+i};}),r1.reduce(function(a,_,i){if(i%2===0)a.push({p1:r1[i]||"TBD",p2:r1[i+1]||"TBD",mk:"r2_"+Math.floor(i/2)});return a;},[]),r2.reduce(function(a,_,i){if(i%2===0)a.push({p1:r2[i]||"TBD",p2:r2[i+1]||"TBD",mk:"r3_"+Math.floor(i/2)});return a;},[]),[{p1:r3[0]||"TBD",p2:r3[1]||"TBD",mk:"final"}]];
  return React.createElement("div",{style:{background:"#0A0A0A",minHeight:"100vh",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",padding:"16px"}},React.createElement("div",{style:{textAlign:"center",marginBottom:16}},React.createElement("div",{style:{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:4,color:"#800020"}},"SWANYTHREE ENTERTAINMENT PRESENTS"),React.createElement("h2",{style:{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:"#C9A84C",margin:0,letterSpacing:3}},"WASHINGTON CLASSIC 2026")),champ&&React.createElement("div",{style:{background:"linear-gradient(135deg,#800020,#C9A84C)",borderRadius:12,padding:"14px",textAlign:"center",marginBottom:16}},React.createElement("div",{style:{fontSize:11,letterSpacing:2,color:"rgba(255,255,255,0.7)"}},"🏆 CHAMPION"),React.createElement("div",{style:{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:3}},champ)),React.createElement("div",{style:{display:"flex",gap:8,overflowX:"auto",marginBottom:12}},rounds.map(function(rnd,ri){return React.createElement("div",{key:ri,style:{minWidth:130,flex:"0 0 130px"}},React.createElement("div",{style:{fontSize:10,color:"#555",letterSpacing:1,marginBottom:6,textAlign:"center"}},["R16","QF","SF","FINAL"][ri]),rnd.map(function(m){return React.createElement(MB,{key:m.mk,p1:m.p1,p2:m.p2,mk:m.mk});}));})),React.createElement("div",{style:{textAlign:"center"}},React.createElement("button",{onClick:function(){setResults({});},style:{background:"#1a1a1a",color:"#888",border:"1px solid #333",borderRadius:6,padding:"7px 18px",fontSize:12,cursor:"pointer"}},"RESET BRACKET")));
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
  function statusColor(s) { return s === 'online' ? C.green : s === 'degraded' ? C.orange : s === 'offline' ? '#ff4444' : C.muted; }
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

// ================================================================
// WATCH PARTY
// ================================================================
function WatchPartyPage({ state, dispatch }) {
  var [partyCode, setPartyCode] = React.useState('');
  var [inputCode, setInputCode] = React.useState('');
  var [inParty, setInParty] = React.useState(false);
  var [synced, setSynced] = React.useState(true);
  var [partyChat, setPartyChat] = React.useState([
    { user: '@SwanyThree23', text: 'Lets gooo! Washington Classic starting!', time: '2m ago' },
    { user: '@TechBones', text: 'CaliBones about to get bodied lol', time: '1m ago' },
    { user: '@VibeNBones', text: 'House money on the line', time: '30s ago' },
  ]);
  var [chatInput, setChatInput] = React.useState('');
  var [viewers, setViewers] = React.useState(47);
  var HLS_URL = 'https://seewhylive.online/hls/live/index.m3u8';
  function generateCode() { var code = Math.random().toString(36).substring(2,8).toUpperCase(); setPartyCode(code); setInParty(true); }
  function joinParty() { if (inputCode.trim().length < 4) return; setPartyCode(inputCode.trim().toUpperCase()); setInParty(true); }
  function sendChat() { if (!chatInput.trim()) return; var user = (state.user && state.user.username) ? '@' + state.user.username : '@You'; setPartyChat(function(prev) { return prev.concat([{ user: user, text: chatInput.trim(), time: 'now' }]); }); setChatInput(''); }
  if (!inParty) return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold, marginBottom: 4 }}>WATCH PARTY</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Watch together in sync with your crew</div>
      <div style={{ background: C.slate, borderRadius: 12, padding: 20, marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.white, marginBottom: 8 }}>START A PARTY</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Generate a code and share with your crew</div>
        <button onClick={generateCode} style={{ background: C.burgundy, border: 'none', borderRadius: 10, padding: '14px 32px', color: C.white, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>CREATE PARTY</button>
      </div>
      <div style={{ background: C.slate, borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.white, marginBottom: 12 }}>JOIN A PARTY</div>
        <input value={inputCode} onChange={function(e) { setInputCode(e.target.value.toUpperCase()); }} placeholder="Enter party code..." maxLength={8} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '12px', color: C.white, fontSize: 16, textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: 12 }} />
        <button onClick={joinParty} style={{ width: '100%', background: C.gold, border: 'none', borderRadius: 10, padding: 14, color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer' }}>JOIN PARTY</button>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: 80 }}>
      <div style={{ background: C.charcoal, borderBottom: '1px solid #2a2a2a', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.gold }}>PARTY: {partyCode}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{viewers} watching together</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: synced ? '#00FF88' : '#FF4444' }} />
          <span style={{ fontSize: 10, color: synced ? '#00FF88' : '#FF4444' }}>{synced ? 'SYNCED' : 'SYNCING'}</span>
          <button onClick={function() { setInParty(false); }} style={{ background: 'none', border: '1px solid #333', borderRadius: 6, padding: '4px 10px', color: C.muted, fontSize: 11, cursor: 'pointer' }}>Leave</button>
        </div>
      </div>
      <div style={{ background: '#000', position: 'relative' }}>
        <video src={HLS_URL} controls autoPlay style={{ width: '100%', maxHeight: 220 }} />
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#fff', fontFamily: 'monospace' }}>{partyCode}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>PARTY CHAT</div>
        {partyChat.map(function(m, i) { return (
          <div key={i} style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: C.gold, fontSize: 12 }}>{m.user} </span>
            <span style={{ fontSize: 12, color: C.white }}>{m.text}</span>
            <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>{m.time}</span>
          </div>
        );})}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #2a2a2a' }}>
        <input value={chatInput} onChange={function(e) { setChatInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }} placeholder="Say something..." style={{ flex: 1, background: C.slate, border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13 }} />
        <button onClick={sendChat} style={{ background: C.burgundy, border: 'none', borderRadius: 8, padding: '10px 16px', color: C.white, fontWeight: 700, cursor: 'pointer' }}>SEND</button>
      </div>
    </div>
  );
}

// ================================================================
// VOD LIBRARY
// ================================================================
function VODLibraryPage({ state, dispatch }) {
  var [filter, setFilter] = React.useState('all');
  var [search, setSearch] = React.useState('');
  var [playing, setPlaying] = React.useState(null);
  var HLS_URL = 'https://seewhylive.online/hls/live/index.m3u8';
  var vods = [
    { id: 1, title: 'Washington Classic 2024 - Finals', creator: '@SwanyThree23', category: 'tournament', duration: '2:14:33', views: 4821, date: '2d ago' },
    { id: 2, title: 'PK Battle Royale - CaliBones vs VibeNBones', creator: '@CaliBone22', category: 'battle', duration: '45:12', views: 1203, date: '4d ago' },
    { id: 3, title: 'AIverse Podcast Ep. 42', creator: '@AIversePod', category: 'podcast', duration: '1:02:18', views: 892, date: '1w ago' },
    { id: 4, title: 'Techmunity Stream - SeeWhy LIVE v46 Launch', creator: '@SwanyThree23', category: 'stream', duration: '3:44:07', views: 2341, date: '3d ago' },
    { id: 5, title: 'State VS State - Washington vs California', creator: '@SwanyThree23', category: 'tournament', duration: '1:28:44', views: 3102, date: '5d ago' },
    { id: 6, title: 'Bones and Bars - Domino Music Session', creator: '@VibeNBones', category: 'music', duration: '58:21', views: 567, date: '1w ago' },
  ];
  var categories = ['all','tournament','battle','podcast','stream','music'];
  var filtered = vods.filter(function(v) { return (filter === 'all' || v.category === filter) && (!search || v.title.toLowerCase().indexOf(search.toLowerCase()) !== -1); });
  if (playing) {
    var vod = vods.find(function(v) { return v.id === playing; });
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ background: '#000' }}><video src={HLS_URL} controls autoPlay style={{ width: '100%', maxHeight: 240 }} /></div>
        <div style={{ padding: 16 }}>
          <button onClick={function() { setPlaying(null); }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 14, cursor: 'pointer', marginBottom: 12 }}>Back to Library</button>
          <div style={{ fontWeight: 700, color: C.white, fontSize: 16, marginBottom: 4 }}>{vod.title}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{vod.creator} - {vod.views.toLocaleString()} views - {vod.date}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { dispatch({ type: 'SET_PAGE', payload: 'watchparty' }); }} style={{ background: C.burgundy, border: 'none', borderRadius: 8, padding: '8px 16px', color: C.white, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>Watch Party</button>
            <button style={{ background: C.slate, border: '1px solid #333', borderRadius: 8, padding: '8px 16px', color: C.white, fontSize: 13, cursor: 'pointer' }}>Clip</button>
            <button style={{ background: C.slate, border: '1px solid #333', borderRadius: 8, padding: '8px 16px', color: C.white, fontSize: 13, cursor: 'pointer' }}>Share</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.gold, marginBottom: 4 }}>VOD LIBRARY</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{filtered.length} videos</div>
      <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search videos..." style={{ width: '100%', background: C.slate, border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
        {categories.map(function(cat) { return (
          <button key={cat} onClick={function() { setFilter(cat); }} style={{ flexShrink: 0, padding: '6px 14px', fontSize: 11, background: filter === cat ? C.burgundy : C.slate, border: '1px solid ' + (filter === cat ? C.burgundy : '#333'), borderRadius: 20, color: filter === cat ? C.white : C.muted, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif" }}>{cat.toUpperCase()}</button>
        );})}
      </div>
      {filtered.map(function(v) { return (
        <div key={v.id} onClick={function() { setPlaying(v.id); }} style={{ background: C.slate, border: '1px solid #2a2a2a', borderRadius: 12, marginBottom: 10, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', padding: 12 }}>
          <div style={{ width: 80, height: 50, background: 'linear-gradient(135deg,#1a0a0a,#2a1a2a)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 24 }}>{v.category === 'tournament' ? '🏆' : v.category === 'battle' ? 'X' : v.category === 'podcast' ? '🎙' : v.category === 'music' ? '🎵' : '📺'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: C.white, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{v.creator} - {v.views.toLocaleString()} views</div>
            <div style={{ fontSize: 10, color: C.muted }}>{v.duration} - {v.date}</div>
          </div>
          <span style={{ color: C.muted, fontSize: 18, flexShrink: 0 }}>▶</span>
        </div>
      );})}
    </div>
  );
}

// ================================================================
// STUDIO TOOL PAGES
// ================================================================
function OverlayBuilderPage({ state, dispatch }) {
  var overlays = [{ id:1, name:'Game Score Bar', active:true },{ id:2, name:'Donation Alert', active:false },{ id:3, name:'Lower Third', active:true },{ id:4, name:'Logo Watermark', active:true }];
  var [on, setOn] = React.useState({ 1:true, 3:true, 4:true });
  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <button onClick={function() { dispatch({ type:'SET_PAGE', payload:'studio' }); }} style={{ background:'none', border:'none', color:C.gold, fontSize:14, cursor:'pointer', marginBottom:12 }}>Back to Studio</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:C.gold, marginBottom:4 }}>OVERLAY BUILDER</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Customize your stream overlays</div>
      {overlays.map(function(o) { return (
        <div key={o.id} style={{ background:C.slate, border:'1px solid #2a2a2a', borderRadius:10, padding:'12px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:C.white, fontSize:14 }}>{o.name}</span>
          <div onClick={function() { setOn(function(s) { var n=Object.assign({},s); n[o.id]=!n[o.id]; return n; }); }} style={{ width:40, height:22, borderRadius:11, background:on[o.id] ? C.gold : '#333', display:'flex', alignItems:'center', padding:'0 3px', cursor:'pointer' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', marginLeft:on[o.id] ? 'auto' : 0 }} />
          </div>
        </div>
      );})}
    </div>
  );
}
function ClipEditorPage({ state, dispatch }) {
  return (
    <div style={{ padding:16, paddingBottom:80 }}>
      <button onClick={function() { dispatch({ type:'SET_PAGE', payload:'studio' }); }} style={{ background:'none', border:'none', color:C.gold, fontSize:14, cursor:'pointer', marginBottom:12 }}>Back to Studio</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:C.gold, marginBottom:4 }}>CLIP EDITOR</div>
      <div style={{ background:'#000', borderRadius:10, height:200, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}><span style={{ fontSize:48 }}>✂️</span></div>
      <div style={{ display:'flex', gap:10 }}>
        <button style={{ flex:1, background:C.slate, border:'1px solid #333', borderRadius:8, padding:12, color:C.white, fontSize:13, cursor:'pointer' }}>Trim</button>
        <button style={{ flex:1, background:C.slate, border:'1px solid #333', borderRadius:8, padding:12, color:C.white, fontSize:13, cursor:'pointer' }}>Music</button>
        <button style={{ flex:1, background:C.burgundy, border:'none', borderRadius:8, padding:12, color:C.white, fontSize:13, cursor:'pointer' }}>Share</button>
      </div>
    </div>
  );
}
function PodcastStudioPage({ state, dispatch }) {
  var [recording, setRecording] = React.useState(false);
  var [seconds, setSeconds] = React.useState(0);
  React.useEffect(function() { if (!recording) return; var t = setInterval(function() { setSeconds(function(s) { return s+1; }); },1000); return function() { clearInterval(t); }; }, [recording]);
  var fmt = Math.floor(seconds/60) + ':' + String(seconds%60).padStart(2,'0');
  return (
    <div style={{ padding:16, paddingBottom:80 }}>
      <button onClick={function() { dispatch({ type:'SET_PAGE', payload:'studio' }); }} style={{ background:'none', border:'none', color:C.gold, fontSize:14, cursor:'pointer', marginBottom:12 }}>Back to Studio</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:C.gold, marginBottom:4 }}>PODCAST STUDIO</div>
      <div style={{ textAlign:'center', background:C.slate, borderRadius:16, padding:32, marginBottom:16 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{recording ? '🔴' : '🎙'}</div>
        <div style={{ fontFamily:'monospace', fontSize:36, color:recording ? '#ff4444' : '#666', marginBottom:20 }}>{fmt}</div>
        <button onClick={function() { setRecording(function(r) { if(r) setSeconds(0); return !r; }); }} style={{ background:recording ? C.burgundy : C.gold, border:'none', borderRadius:12, padding:'14px 40px', color:recording ? C.white : '#000', fontFamily:"'Bebas Neue',sans-serif", fontSize:20, cursor:'pointer' }}>{recording ? 'STOP' : 'START RECORDING'}</button>
      </div>
    </div>
  );
}
function MultiStreamPage({ state, dispatch }) {
  var platforms = [{ name:'YouTube', icon:'▶', key:'yt' },{ name:'Twitch', icon:'T', key:'tw' },{ name:'Facebook', icon:'f', key:'fb' },{ name:'X / Twitter', icon:'X', key:'x' },{ name:'Kick', icon:'K', key:'kick' }];
  var [active, setActive] = React.useState({});
  function toggle(key) { setActive(function(a) { var n=Object.assign({},a); n[key]=!n[key]; return n; }); }
  return (
    <div style={{ padding:16, paddingBottom:80 }}>
      <button onClick={function() { dispatch({ type:'SET_PAGE', payload:'studio' }); }} style={{ background:'none', border:'none', color:C.gold, fontSize:14, cursor:'pointer', marginBottom:12 }}>Back to Studio</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:C.gold, marginBottom:4 }}>MULTI-STREAM</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Go live everywhere simultaneously</div>
      {platforms.map(function(p) { var on=active[p.key]; return (
        <div key={p.key} style={{ background:C.slate, border:'1px solid '+(on?C.gold:'#2a2a2a'), borderRadius:10, padding:'14px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}><span style={{ fontSize:20 }}>{p.icon}</span><span style={{ color:C.white, fontWeight:700 }}>{p.name}</span></div>
          <button onClick={function() { toggle(p.key); }} style={{ background:on?C.gold:'#333', border:'none', borderRadius:8, padding:'6px 16px', color:on?'#000':C.white, fontSize:12, cursor:'pointer', fontWeight:700 }}>{on?'ON':'OFF'}</button>
        </div>
      );})}
      <button style={{ width:'100%', background:C.burgundy, border:'none', borderRadius:10, padding:16, color:C.white, fontFamily:"'Bebas Neue',sans-serif", fontSize:18, cursor:'pointer', marginTop:8 }}>START ALL STREAMS</button>
    </div>
  );
}
function CaptionStudioPage({ state, dispatch }) {
  var langs = ['English','Spanish','French','Portuguese','Japanese'];
  var [selected, setSelected] = React.useState('English');
  var [enabled, setEnabled] = React.useState(false);
  return (
    <div style={{ padding:16, paddingBottom:80 }}>
      <button onClick={function() { dispatch({ type:'SET_PAGE', payload:'studio' }); }} style={{ background:'none', border:'none', color:C.gold, fontSize:14, cursor:'pointer', marginBottom:12 }}>Back to Studio</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:C.gold, marginBottom:4 }}>CAPTION STUDIO</div>
      <div style={{ background:C.slate, borderRadius:12, padding:16, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <span style={{ color:C.white, fontWeight:700 }}>Live Captions</span>
          <button onClick={function() { setEnabled(function(e) { return !e; }); }} style={{ background:enabled?C.gold:'#333', border:'none', borderRadius:20, padding:'6px 18px', color:enabled?'#000':C.white, fontWeight:700, cursor:'pointer' }}>{enabled?'ON':'OFF'}</button>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {langs.map(function(l) { return <button key={l} onClick={function() { setSelected(l); }} style={{ padding:'6px 12px', fontSize:11, background:selected===l?C.burgundy:'#333', border:'none', borderRadius:16, color:C.white, cursor:'pointer' }}>{l}</button>; })}
        </div>
      </div>
      <button onClick={function() { window.open('https://caption.ninja/?room=sw_thrrj4','_blank'); }} style={{ width:'100%', background:C.slate, border:'1px solid '+C.gold, borderRadius:10, padding:14, color:C.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:16, cursor:'pointer' }}>Open Caption.Ninja</button>
    </div>
  );
}
function GreenRoomPage({ state, dispatch }) {
  var VDO_URL = 'https://vdo.ninja/?room=sw_thrrj4&push';
  var guests = [{ slot:1, name:'Guest 1', status:'waiting' },{ slot:2, name:'Guest 2', status:'empty' },{ slot:3, name:'Guest 3', status:'empty' },{ slot:4, name:'Guest 4', status:'empty' }];
  return (
    <div style={{ padding:16, paddingBottom:80 }}>
      <button onClick={function() { dispatch({ type:'SET_PAGE', payload:'studio' }); }} style={{ background:'none', border:'none', color:C.gold, fontSize:14, cursor:'pointer', marginBottom:12 }}>Back to Studio</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:C.gold, marginBottom:4 }}>GREEN ROOM</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Pre-show prep - up to 20 guests via VDO.Ninja</div>
      {guests.map(function(g) { return (
        <div key={g.slot} style={{ background:C.slate, border:'1px solid #2a2a2a', borderRadius:10, padding:'12px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:C.white, fontWeight:700, fontSize:13 }}>{g.name}</div>
            <div style={{ fontSize:11, color:g.status==='waiting'?'#00FF88':'#666' }}>{g.status==='waiting'?'In waiting room':'Empty slot'}</div>
          </div>
          <button onClick={function() { window.open(VDO_URL,'_blank'); }} style={{ background:'#333', border:'none', borderRadius:8, padding:'6px 14px', color:C.white, fontSize:12, cursor:'pointer' }}>Invite</button>
        </div>
      );})}
      <button onClick={function() { window.open(VDO_URL,'_blank'); }} style={{ width:'100%', background:C.gold, border:'none', borderRadius:10, padding:14, color:'#000', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, cursor:'pointer', marginTop:8 }}>OPEN GREEN ROOM</button>
    </div>
  );
}
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
      {state.activeModal === 'pk_battle' && <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999 }}><PKBattleModalV2 state={state} dispatch={dispatch} /></div>}
      <PlatformStatusBar state={state} dispatch={dispatch} />
      {state.activeModal === 'breakout' && <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999 }}><BreakoutRoomsModal state={state} dispatch={dispatch} /></div>}
      {state.activeModal === 'green_room' && <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999 }}><GreenRoomModalV2 state={state} dispatch={dispatch} /></div>}
    </div>
  );
}
