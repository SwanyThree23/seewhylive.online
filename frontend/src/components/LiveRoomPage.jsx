import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import rtcManager from '../webrtc.js';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import { saveClip } from '../clipStore.js';
import { getPlatformHandles } from '../platformConfig.js';
import HostHUD from './HostHUD.jsx';
import HostQuickActions from './HostQuickActions.jsx';
import ChyronOverlay from './ChyronOverlay.jsx';
import PollOverlay from './PollOverlay.jsx';
import AudioOnlyToggle from './panel/AudioOnlyToggle.jsx';
import JoinRequestQueue from './panel/JoinRequestQueue.jsx';
import GiftLayer from './GiftLayer.jsx';
import PowerPlayPanel from './PowerPlayPanel.jsx';
import GoldenWallPanel from './GoldenWallPanel.jsx';
import GlobalMicButtonV49 from './streaming/GlobalMicButtonV49.jsx';
import ShareSheet from './share/ShareSheet.jsx';
import TTSSuperChatModal from './TTSSuperChatModal.jsx';

var MAX_STAGE = 20;

// ─── Palette ───────────────────────────────────────────────────────────────
var BG      = '#0E0C09';
var SURF    = '#1A1510';
var CARD    = '#241C12';
var CARD2   = '#2E2318';
var BORDER  = 'rgba(201,168,76,.12)';
var GOLD    = '#C9A84C';
var BURG    = '#800020';
var TEAL    = '#D4854A';
var RED     = '#FF1A3C';
var TEXT    = '#F0E8D4';
var MUTED   = '#8A7A62';
var DIM     = '#3D3020';

// ─── Animation CSS ─────────────────────────────────────────────────────────
var ANIM = [
  '@keyframes speakBar{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}',
  '@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}',
  '@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}',
  '@keyframes speakRing{0%,100%{box-shadow:0 0 0 2px '+TEAL+',0 0 14px '+TEAL+'44}50%{box-shadow:0 0 0 3px '+TEAL+',0 0 24px '+TEAL+'66}}',
  '@keyframes goldPulse{0%,100%{opacity:1}50%{opacity:.6}}',
  '@keyframes tipSlide{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}',
  '@keyframes tipOut{from{opacity:1}to{opacity:0;transform:translateX(60px)}}',
  '@keyframes pollBar{from{width:0}to{width:var(--pct)}}',
  '@keyframes qaIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes musicIn{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
  '@keyframes vsIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes scoreReveal{0%{opacity:0;transform:scale(.6)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}',
  '@keyframes scoreFade{from{opacity:1}to{opacity:0;transform:scale(.9)}}',
  '@keyframes cellExpand{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}',
  '@keyframes recPulse{0%,100%{opacity:1;background:rgba(255,26,60,.9)}50%{opacity:.6;background:rgba(255,26,60,.5)}}',
  '@keyframes waveBar{0%{height:4px}100%{height:20px}}',
  '@keyframes speakPulseGrid{0%,100%{box-shadow:0 0 0 2px '+TEAL+'99,0 0 8px '+TEAL+'22}50%{box-shadow:0 0 0 3px '+TEAL+',0 0 18px '+TEAL+'44}}',
  '@keyframes handBadgePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.85}}',
  '@keyframes cellMenuIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes announceIn{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
  '@keyframes announceOut{from{opacity:1;transform:translateX(-50%) translateY(0)}to{opacity:0;transform:translateX(-50%) translateY(-10px)}}',
  '@keyframes reactionFloat{0%{transform:translateY(0) scale(1);opacity:1}70%{transform:translateY(-110px) scale(1.25);opacity:.85}100%{transform:translateY(-150px) scale(.9);opacity:0}}',
  '@keyframes tickerScroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}',
  '@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(110%) rotate(540deg);opacity:0}}',
].join('\n');

// ─── Subtle reaction tone for emoji bursts ─────────────────────────────────
var REACTION_FREQS = { '🔥': 880, '❤️': 554, '😂': 660, '👍': 523, '💎': 740, '⚡': 830, '🎉': 698 };
function playReactionTone(emoji) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = REACTION_FREQS[emoji] || 523;
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(function() { try { ctx.close(); } catch(e) {} }, 300);
  } catch(e) {}
}

// ─── Direct Pay platforms ───────────────────────────────────────────────────
var DP_PLATFORMS = [
  { id: 'paypal',  emoji: '💸', name: 'PayPal',  color: '#0070BA', buildUrl: function(h) { return 'https://paypal.me/' + h.replace(/^@/,''); } },
  { id: 'cashapp', emoji: '💚', name: 'CashApp', color: '#00D54B', buildUrl: function(h) { return 'https://cash.app/$' + h.replace(/^\$/,''); } },
  { id: 'venmo',   emoji: '💙', name: 'Venmo',   color: '#3D95CE', buildUrl: function(h) { return 'https://venmo.com/' + h.replace(/^@/,''); } },
  { id: 'zelle',   emoji: '💜', name: 'Zelle',   color: '#6D1ED4', buildUrl: null },
  { id: 'chime',   emoji: '🟢', name: 'Chime',   color: '#16BE45', buildUrl: null },
];

// ─── Social share platforms ─────────────────────────────────────────────────
var SOC_PLATFORMS = [
  { id: 'facebook',  emoji: '📘', name: 'Facebook',   open: true,  buildUrl: function(u,t){ return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u)+'&quote='+encodeURIComponent(t); } },
  { id: 'twitter',   emoji: '🐦', name: 'X / Twitter', open: true,  buildUrl: function(u,t){ return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(t+' '+u); } },
  { id: 'whatsapp',  emoji: '💬', name: 'WhatsApp',   open: true,  buildUrl: function(u,t){ return 'https://wa.me/?text='+encodeURIComponent(t+' '+u); } },
  { id: 'instagram', emoji: '📸', name: 'Instagram',  open: false, buildUrl: null },
  { id: 'tiktok',    emoji: '🎵', name: 'TikTok',     open: false, buildUrl: null },
  { id: 'snapchat',  emoji: '👻', name: 'Snapchat',   open: false, buildUrl: null },
];

// ─── Sub-components ────────────────────────────────────────────────────────

function SpeakBars({ color, small }) {
  var c = color || TEAL;
  var h = small ? 10 : 14;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: h, flexShrink: 0 }}>
      {[0, 1, 2, 3].map(function(i) {
        return (
          <div key={i} style={{
            width: small ? 2 : 3,
            height: h,
            background: c,
            borderRadius: 2,
            transformOrigin: 'bottom',
            transform: 'scaleY(.25)',
            animation: 'speakBar .5s ease-in-out ' + (i * .1) + 's infinite alternate',
          }} />
        );
      })}
    </div>
  );
}

function RolePill({ role }) {
  var cfg = {
    host:   { bg: 'rgba(201,168,76,.18)',  color: GOLD,    label: 'HOST'    },
    cohost: { bg: 'rgba(201,168,76,.12)',   color: TEAL,    label: 'CO-HOST' },
    guest:  { bg: 'rgba(212,133,74,.14)',  color: '#D4854A', label: 'GUEST'  },
    viewer: { bg: 'rgba(36,28,20,.7)',     color: MUTED,   label: 'VIEWER'  },
  };
  var s = cfg[role] || cfg.viewer;
  return (
    <span style={{
      fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: 1,
      padding: '1px 5px', borderRadius: 3,
      background: s.bg, color: s.color, flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}

function AudienceCircle({ g, speaking, handRaised, onInvite, isTopGifter }) {
  var name = g.username || g.guestId || '?';
  var init = name.charAt(0).toUpperCase();
  return (
    <div onClick={onInvite || undefined}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 64, cursor: onInvite ? 'pointer' : 'default' }}>
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: 'linear-gradient(135deg,' + BURG + '50,' + CARD + ')',
        border: '2px solid ' + (handRaised ? 'rgba(255,140,0,.8)' : speaking ? TEAL : DIM),
        boxShadow: handRaised ? '0 0 10px rgba(255,140,0,.5)' : (speaking ? ('0 0 10px ' + TEAL + '55') : 'none'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', flexShrink: 0, overflow: 'visible',
        transition: 'border-color .3s, box-shadow .3s',
      }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, lineHeight: 1, userSelect: 'none' }}>
          {init}
        </span>
        {isTopGifter && !handRaised && (
          <div style={{
            position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)',
            fontSize: 13, lineHeight: 1, filter: 'drop-shadow(0 0 4px rgba(201,168,76,.8))',
          }}>👑</div>
        )}
        {handRaised && (
          <div style={{
            position: 'absolute', top: -6, right: -6,
            width: 18, height: 18, borderRadius: '50%',
            background: 'rgba(255,140,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, border: '1.5px solid ' + BG, animation: 'handBadgePulse 1.2s ease-in-out infinite',
          }}>✋</div>
        )}
        {g.remoteMuted && !handRaised && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 16, height: 16, borderRadius: '50%',
            background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, border: '1.5px solid ' + BG,
          }}>🔇</div>
        )}
      </div>
      <span style={{
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 500, fontSize: 10,
        color: handRaised ? 'rgba(255,140,0,.9)' : MUTED, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.2,
      }}>
        {name}
      </span>
      {onInvite && (
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: .5 }}>+ INVITE</span>
      )}
    </div>
  );
}

function IconBtn({ icon, label, active, danger, badge, onPress, size }) {
  var sz  = size || 42;
  var bg  = active && danger  ? 'rgba(255,26,60,.25)'
          : active            ? 'rgba(201,168,76,.18)'
          :                     'rgba(255,255,255,.06)';
  var bc  = active && danger  ? 'rgba(255,26,60,.5)'
          : active            ? 'rgba(201,168,76,.4)'
          :                     'rgba(255,255,255,.1)';
  var ic  = active && danger  ? RED
          : active            ? TEAL
          :                     MUTED;
  return (
    <button onClick={onPress} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
      position: 'relative', userSelect: 'none',
    }}>
      <div style={{
        width: sz, height: sz, borderRadius: '50%',
        background: bg, border: '1px solid ' + bc,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: sz > 40 ? 18 : 15,
        transition: 'background .2s, border-color .2s',
      }}>
        {icon}
      </div>
      {label && (
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: ic, letterSpacing: .5, lineHeight: 1 }}>
          {label}
        </span>
      )}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: 0, right: 2,
          width: 16, height: 16, borderRadius: '50%',
          background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', fontWeight: 700,
          border: '1.5px solid ' + BG,
        }}>
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </button>
  );
}

function WaveBars({ color }) {
  var c = color || TEAL;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20, flexShrink: 0 }}>
      {[0,1,2,3,4].map(function(i) {
        return (
          <div key={i} style={{
            width: 4, height: 4, background: c, borderRadius: 2,
            transformOrigin: 'bottom',
            animation: 'waveBar .6s ease-in-out ' + (i * .12) + 's infinite alternate',
          }} />
        );
      })}
    </div>
  );
}

function StageTimer({ startMs }) {
  var [elapsed, setElapsed] = useState(function() { return startMs ? Math.floor((Date.now() - startMs) / 1000) : 0; });
  useEffect(function() {
    if (!startMs) return;
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startMs) / 1000)); }, 1000);
    return function() { clearInterval(id); };
  }, [startMs]);
  if (!startMs) return null;
  var m = Math.floor(elapsed / 60);
  var s = elapsed % 60;
  return React.createElement('span', {
    style: { fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0, letterSpacing: 0.3 },
  }, (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);
}

function SignalBars({ quality }) {
  var bars  = quality === 'green' ? 4 : quality === 'yellow' ? 2 : quality === 'red' ? 1 : 0;
  var color = quality === 'green' ? '#6DBF7E' : quality === 'yellow' ? '#F0A500' : '#FF1A3C';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 10, flexShrink: 0 }}>
      {[1, 2, 3, 4].map(function(i) {
        return (
          <div key={i} style={{
            width: 3,
            height: 2 + 2 * i,
            background: i <= bars ? color : 'rgba(138,122,98,.25)',
            borderRadius: 1,
          }} />
        );
      })}
    </div>
  );
}

function OverlayBanner({ banner }) {
  if (!banner || !banner.visible || !banner.text) return null;
  var isTop = banner.position === 'top';
  return (
    <div style={{ position: 'absolute', [isTop ? 'top' : 'bottom']: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none', padding: isTop ? '10px 16px 20px' : '20px 16px 10px', background: isTop ? 'linear-gradient(rgba(14,12,9,.85),transparent)' : 'linear-gradient(transparent,rgba(14,12,9,.85))' }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: banner.color || '#C9A84C', letterSpacing: 4, textShadow: '0 2px 10px rgba(0,0,0,.9)', textAlign: 'center' }}>
        {banner.text}
      </div>
    </div>
  );
}

function OverlayCountdown({ countdown }) {
  var [rem, setRem] = useState(0);
  useEffect(function() {
    if (!countdown || !countdown.visible || !countdown.targetTs) return;
    var tick = function() { setRem(Math.max(0, countdown.targetTs - Math.floor(Date.now() / 1000))); }
    tick();
    var t = setInterval(tick, 1000);
    return function() { clearInterval(t); };
  }, [countdown]);
  if (!countdown || !countdown.visible) return null;
  var h   = Math.floor(rem / 3600);
  var m   = Math.floor((rem % 3600) / 60);
  var s   = rem % 60;
  var str = (h > 0 ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 35, pointerEvents: 'none', textAlign: 'center', background: 'rgba(14,12,9,.75)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 12, padding: '14px 24px', backdropFilter: 'blur(8px)' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 3, marginBottom: 4 }}>{countdown.label || 'STARTING SOON'}</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: '#C9A84C', letterSpacing: 6, lineHeight: 1 }}>{str}</div>
    </div>
  );
}

function OverlayScoreBug({ scoreBug }) {
  if (!scoreBug || !scoreBug.visible) return null;
  return (
    <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 30, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', background: 'rgba(10,7,18,.88)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, overflow: 'hidden', backdropFilter: 'blur(4px)' }}>
        <div style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid rgba(201,168,76,.2)' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#F0E8D4', letterSpacing: 2 }}>{scoreBug.team1.name || 'TEAM 1'}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: '#C9A84C', lineHeight: 1 }}>{scoreBug.team1.score}</div>
        </div>
        <div style={{ padding: '5px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#8A7A62', letterSpacing: 1 }}>{scoreBug.label || ''}</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 10, color: '#FF6B81' }}>VS</div>
        </div>
        <div style={{ padding: '5px 10px', textAlign: 'center', borderLeft: '1px solid rgba(201,168,76,.2)' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: '#F0E8D4', letterSpacing: 2 }}>{scoreBug.team2.name || 'TEAM 2'}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: '#C9A84C', lineHeight: 1 }}>{scoreBug.team2.score}</div>
        </div>
      </div>
    </div>
  );
}

function OverlayCustomLT({ lowerThirds, guestId }) {
  if (!lowerThirds) return null;
  var lt = lowerThirds[guestId];
  if (!lt || !lt.visible) return null;
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25, pointerEvents: 'none', padding: '24px 10px 8px', background: 'linear-gradient(transparent,rgba(14,12,9,.9))' }}>
      <div style={{ borderLeft: '3px solid #C9A84C', paddingLeft: 7 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#F0E8D4', letterSpacing: 2, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,.9)' }}>{lt.name}</div>
        {lt.title && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', marginTop: 2, letterSpacing: 1 }}>{lt.title}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function LiveRoomPage({
  socket, guests, chat: initialChat, isLive, setIsLive,
  userId, username, role, roomId, branding,
  addToast, overlayConfig, viewerCount, mediaConfig,
  streamInfo, streamGoal, setStreamGoal, sessionEarningsCents, onLeave,
  setChat, initialStreamTitle,
}) {
  var chat = initialChat || [];
  var [rtcReady,      setRtcReady]      = useState(false);
  var [isMuted,       setIsMuted]       = useState(false);
  var [micLevel,      setMicLevel]      = useState(0);
  var [isCamOff,      setIsCamOff]      = useState(false);
  var [chatOpen,      setChatOpen]      = useState(false);
  var [chatInput,     setChatInput]     = useState('');
  var [handRaised,    setHandRaised]    = useState(false);
  var [speakingIds,   setSpeakingIds]   = useState({});
  var [showAllAud,    setShowAllAud]    = useState(false);
  var [medConf,       setMedConf]       = useState(mediaConfig || null);
  var [reactsOpen,    setReactsOpen]    = useState(false);
  var [floatReacts,   setFloatReacts]   = useState([]);
  var [stageLayout,    setStageLayout]    = useState(function() { try { return localStorage.getItem('sw_layout') || 'grid'; } catch(e) { return 'grid'; } });   // 'grid' | 'featured'
  var [featuredId,     setFeaturedId]     = useState(userId);
  var [cinemaMode,     setCinemaMode]     = useState(false);  // hide thumbnail strip in featured layout
  var [stageLocked,    setStageLocked]    = useState(false);  // stage entry locked by host
  var [showLiveModal,  setShowLiveModal]  = useState(false);
  var [liveTitle,       setLiveTitle]       = useState(function() {
    try { return localStorage.getItem('sw_stream_title') || ''; } catch(e) { return ''; }
  });
  var [liveDestinations, setLiveDestinations] = useState(function() {
    try { return JSON.parse(localStorage.getItem('sw_stream_dests') || '{}'); } catch(e) { return {}; }
  });
  var [liveKeys,        setLiveKeys]        = useState(function() {
    try { return JSON.parse(localStorage.getItem('sw_stream_keys') || '{}'); } catch(e) { return {}; }
  });
  var [liveKeysVisible, setLiveKeysVisible] = useState({});       // { youtube: false, ... }
  var [fanoutStatus,    setFanoutStatus]    = useState([]);        // [{ platform }] active fanout platforms
  var [activeStreamTitle, setActiveStreamTitle] = useState(initialStreamTitle || ''); // confirmed title from go-live-confirmed
  var [streamRecap,       setStreamRecap]       = useState(null); // post-broadcast stats from broadcast-ended
  var [recapShareCopied,  setRecapShareCopied]  = useState(false);
  var [customRtmpEnabled, setCustomRtmpEnabled] = useState(false);
  var [customRtmpUrl,     setCustomRtmpUrl]     = useState(function() {
    try { return localStorage.getItem('sw_custom_rtmp_url') || ''; } catch(e) { return ''; }
  });
  var [customRtmpKey,     setCustomRtmpKey]     = useState(function() {
    try { return localStorage.getItem('sw_custom_rtmp_key') || ''; } catch(e) { return ''; }
  });
  var [customRtmpVisible, setCustomRtmpVisible] = useState(false);
  var [coHostLinkCopied,  setCoHostLinkCopied]  = useState(false);
  var [stageGuests,    setStageGuests]    = useState([userId]);
  var [showMediaConf,  setShowMediaConf]  = useState(false);
  var [tipFeed,        setTipFeed]        = useState([]);      // {id,from,amount,emoji,ts}
  var [tipLeader,      setTipLeader]      = useState([]);      // [{username,totalCents}]
  var [showLeader,     setShowLeader]     = useState(false);
  var [activePoll,     setActivePoll]     = useState(null);    // {q,opts:[{text,votes}]}
  var [pollVoted,      setPollVoted]      = useState(false);
  var [showPollCreate, setShowPollCreate] = useState(false);
  var [pollDraft,      setPollDraft]      = useState({ q: '', opts: ['', '', '', ''] });
  var [qaQueue,        setQaQueue]        = useState([]);      // {id,username,text,upvotes}
  var [qaInput,        setQaInput]        = useState('');
  var [showQa,         setShowQa]         = useState(false);
  var [qaMyVotes,      setQaMyVotes]      = useState({});
  var [showShareSheet, setShowShareSheet] = useState(false);
  var [panelMode,      setPanelMode]      = useState('grid'); // grid | list — for 20-person layout hint
  var [raisedHands,    setRaisedHands]    = useState({});    // { [guestId]: timestamp } — persistent raised-hand indicators
  var [pinnedId,       setPinnedId]       = useState(null);  // guestId | null — pinned/spotlight cell in grid
  var [cellMenuId,     setCellMenuId]     = useState(null);  // guestId | null — host cell action menu
  var [musicBanner,    setMusicBanner]    = useState(null);   // {title,style,emoji,sharedBy} | null
  var [showGoalSet,    setShowGoalSet]    = useState(false);
  var [goalDraft,      setGoalDraft]      = useState({ label: '', amount: '' });
  var [vsPoll,         setVsPoll]         = useState(null);   // { id,sideA,sideB,votesA,votesB,pctA,pctB,totalVotes,active }
  var [vsVoted,        setVsVoted]        = useState(null);   // 'A' | 'B' | null
  var [showVsCreate,   setShowVsCreate]   = useState(false);
  var [vsDraft,        setVsDraft]        = useState({ sideA: '', sideB: '', duration: '60' });
  var [judges,         setJudges]         = useState([]);     // [{ userId, username, scoreCount, avgScore, lastScore }]
  var [showJudges,     setShowJudges]     = useState(false);
  var [judgeAssignName, setJudgeAssignName] = useState('');
  var [judgeScoreVal,  setJudgeScoreVal]  = useState('');
  var [judgeScoreLabel, setJudgeScoreLabel] = useState('');
  var [showPaySheet,   setShowPaySheet]   = useState(false);
  var [audioOnly,      setAudioOnly]      = useState(false);
  var [privateMode,    setPrivateMode]    = useState(false);
  var [subscriberOnly, setSubscriberOnly] = useState(false);
  var [privatePwd,     setPrivatePwd]     = useState('');
  var [approvalMode,  setApprovalMode]  = useState(false);
  var [pendingRequests, setPendingRequests] = useState([]);
  var [showPrivateSet, setShowPrivateSet] = useState(false);
  var [paywallOn,      setPaywallOn]      = useState(false);
  var [paywallPrice,   setPaywallPrice]   = useState('');
  var [expandedCell,   setExpandedCell]   = useState(null);
  var [showRecorder,   setShowRecorder]   = useState(false);
  var [recState,       setRecState]       = useState('idle');
  var [recSeconds,     setRecSeconds]     = useState(0);
  var [recUrl,         setRecUrl]         = useState(null);
  var addToastRef    = useRef(addToast);
  addToastRef.current = addToast;
  var recTimerRef    = useRef(null);
  var mediaRecRef    = useRef(null);
  var recChunksRef   = useRef([]);
  var recSecondsRef  = useRef(0);
  var recUrlRef      = useRef(null);
  var [scoreReveal,    setScoreReveal]    = useState(null); // { username, score, label } | null
  var [showSuperChatSheet, setShowSuperChatSheet] = useState(false);
  var [showTTSSheet,       setShowTTSSheet]       = useState(false);
  var [scMsg,              setScMsg]              = useState('');
  var [scAmt,              setScAmt]              = useState(100);
  var [gifInput,           setGifInput]           = useState('');
  var [showGifInput,       setShowGifInput]       = useState(false);
  var [giftCount,          setGiftCount]          = useState(0);
  var [superChatCount,     setSuperChatCount]     = useState(0);
  var [guestGiftTotals,    setGuestGiftTotals]    = useState({});  // { [guestId]: totalCents }
  var [panelEffects,       setPanelEffects]       = useState({});  // { [guestId]: { id, playType, expiresAt } }
  var [showPowerPlay,      setShowPowerPlay]       = useState(null); // target guest object
  var [pendingPPId,        setPendingPPId]         = useState(null); // playId awaiting host approval
  var [hostPendingPlays,   setHostPendingPlays]    = useState([]); // [{playId, playType, emoji, name, fromUser, targetGuestId, valueCents}]
  var [streamStats,        setStreamStats]        = useState(null); // { bitratekbps, rttMs, lossPct }
  var [theaterMode,        setTheaterMode]        = useState(false);
  var [theaterChatVisible, setTheaterChatVisible] = useState(true);
  var [isScreenSharing,    setIsScreenSharing]    = useState(false);
  var [screenShareHost,    setScreenShareHost]    = useState(null);  // { username } when remote host is sharing
  var [autoFocusSpeaker,   setAutoFocusSpeaker]   = useState(false); // auto-track dominant speaker in featured mode
  var [producerQuality,    setProducerQuality]    = useState({});   // { [producerId]: 'green'|'yellow'|'red' }
  var [consumerRawStats,   setConsumerRawStats]   = useState({});   // { [producerId]: { bitratekbps, jitter, packetsLost } }
  var [frozenProducers,    setFrozenProducers]    = useState({});   // { [producerId]: true } — bitrate near-zero last sample
  var [avCameras,          setAvCameras]          = useState([]);   // available video input devices for hot-swap
  var [camDevIdx,          setCamDevIdx]          = useState(0);    // index into avCameras currently active
  var [guestVolumes,       setGuestVolumes]       = useState({});   // { [guestId]: 0..1 } — per-guest local volume override
  var [showKeyHelp,        setShowKeyHelp]        = useState(false); // keyboard shortcut guide modal
  var [spotlight,          setSpotlight]          = useState(null); // { guestId, username } | null — host-broadcast spotlight
  var [speakingSnapshots,  setSpeakingSnapshots]  = useState({});   // { [guestId]: totalSeconds } — polled every 5s from speakingTimeRef
  var [stageSort,          setStageSort]          = useState('joined'); // 'joined' | 'speaking' | 'quality'
  var [showStageStats,     setShowStageStats]     = useState(false); // host stage analytics sheet
  var [statsSortCol,       setStatsSortCol]       = useState('speaking'); // 'name'|'speaking'|'stage'|'quality'|'gifts'
  var [autoMuteJoin,       setAutoMuteJoin]       = useState(false); // host: auto-mute new guests on stage join
  var [stageLimitSec,      setStageLimitSec]      = useState(0);     // 0 = off; 180/300/600 = 3/5/10 min
  var [reactionBurst,      setReactionBurst]      = useState([]);    // [{ id, emoji, x }] — flying emoji over stage
  var [lowBwMode,          setLowBwMode]          = useState(false); // cap remote simulcast to lowest layer
  var [gridDensity,        setGridDensity]        = useState(0);     // -1=wider, 0=auto, +1=tighter column count
  var [spotlightElapsed,   setSpotlightElapsed]   = useState(0);     // seconds spotlight has been active
  var [avMics,             setAvMics]             = useState([]);    // available audioinput devices for hot-swap
  var [micDevIdx,          setMicDevIdx]          = useState(0);     // index into avMics currently active
  var [showNotes,          setShowNotes]          = useState(false); // host-only presenter notes overlay
  var [noteText,           setNoteText]           = useState('');    // content of host notes (never transmitted)
  var [joinSoundEnabled,   setJoinSoundEnabled]   = useState(true);  // play ping when guest joins stage
  var [streamDuration,     setStreamDuration]     = useState(0);     // seconds since isLive became true
  var [cellAspect,         setCellAspect]         = useState('16:9'); // '16:9' | '4:3' | '9:16'
  var [stageCountdownMs,   setStageCountdownMs]   = useState(0);     // 0=off; epoch ms of countdown end
  var [countdownInput,     setCountdownInput]     = useState('5:00'); // text input for countdown setting
  var [showCountdownInput, setShowCountdownInput] = useState(false);  // show the countdown set panel
  var [activityLog,        setActivityLog]        = useState([]);    // [{ id, type, msg, ts }] — host activity feed
  var [showActivityLog,    setShowActivityLog]    = useState(false); // toggle activity log drawer
  var [cellColors,         setCellColors]         = useState({});    // { [guestId]: '#hex' } — host-local cell accent color
  var [localGuestNames,    setLocalGuestNames]    = useState({});    // { [guestId]: 'string' } — host-local display name override
  var [renamingGid,        setRenamingGid]        = useState(null);  // guestId currently being renamed (inline input)
  var [renameInput,        setRenameInput]        = useState('');    // controlled input for rename
  var [showCellStats,      setShowCellStats]      = useState(false); // show speaking-time micro-badge on grid cells
  var [peakViewers,        setPeakViewers]        = useState(0);     // max viewerCount seen this session
  var [stageTint,          setStageTint]          = useState('');    // '' | '#hex' — translucent color wash over stage
  var [msgTargetGid,       setMsgTargetGid]       = useState(null);  // guestId receiving a private host message
  var [msgInput,           setMsgInput]           = useState('');    // controlled input for private message
  var [inboundHostMsg,     setInboundHostMsg]     = useState(null);  // { from, text } — private message received from host
  var [hoverGid,           setHoverGid]           = useState(null);  // guestId under mouse (grid hover tooltip)
  var [hoverRect,          setHoverRect]          = useState(null);  // { top, left, width } from getBoundingClientRect
  var [swapPickGid,        setSwapPickGid]        = useState(null);  // first cell selected in swap-mode
  var [swapMode,           setSwapMode]           = useState(false); // host cell-swap mode active
  var [stageOrderOverride, setStageOrderOverride] = useState(null);  // null | string[] — custom cell order for grid
  var [autoLayout,         setAutoLayout]         = useState(false); // auto-switch grid↔featured by stage count
  var [broadcastText,      setBroadcastText]      = useState('');    // text for host broadcast overlay
  var [showBroadcastInput, setShowBroadcastInput] = useState(false); // show broadcast input panel
  var [broadcastOverlay,   setBroadcastOverlay]   = useState(null);  // { text, from } | null — fullscreen text overlay
  var [hiddenVideos,       setHiddenVideos]       = useState({});    // { [guestId]: true } — host-local video hide
  var [showEmojiBar,       setShowEmojiBar]       = useState(false); // host quick-emoji fire bar
  var [showSessionSummary, setShowSessionSummary] = useState(false); // session wrap-up card
  var [reactionCounts,     setReactionCounts]     = useState({});    // { [emoji]: count } — cumulative session counts
  var [showReactionBar,    setShowReactionBar]    = useState(true);  // show reaction tally below stage
  var [showTeleprompter,   setShowTeleprompter]   = useState(false); // host teleprompter overlay
  var [prompterText,       setPrompterText]       = useState('');    // teleprompter script text
  var [prompterSpeed,      setPrompterSpeed]      = useState(40);    // scroll speed px/s (20–120)
  var [prompterRunning,    setPrompterRunning]    = useState(false); // auto-scroll active
  var [spotlightRotateSec, setSpotlightRotateSec] = useState(0);     // 0=off, or rotation interval seconds
  var [joinRequests,       setJoinRequests]       = useState([]);    // [{ guestId, username, ts }] — pending stage requests
  var [bgBlurOn,           setBgBlurOn]           = useState(false); // canvas background blur active
  var [bgBlurLevel,        setBgBlurLevel]        = useState(8);     // blur radius in px (2–20)
  var [showBlurSlider,     setShowBlurSlider]     = useState(false); // blur config popover visible
  var [showDevicePicker,   setShowDevicePicker]   = useState(false); // camera/mic picker sheet
  var [layoutPresets,      setLayoutPresets]      = useState(function() { try { var s = localStorage.getItem('sw_layout_presets'); return s ? JSON.parse(s) : []; } catch(e) { return []; } });
  var [showPresetsPanel,   setShowPresetsPanel]   = useState(false); // layout presets sheet
  var [presetNameInput,    setPresetNameInput]    = useState('');    // name input for saving preset
  var [brbActive,          setBrbActive]          = useState(false); // BRB overlay visible (from socket brb event)
  var [brbMsg,             setBrbMsg]             = useState('');    // message shown in BRB overlay
  var [brbInput,           setBrbInput]           = useState('');    // input text for custom BRB message
  var [showBrbInput,       setShowBrbInput]       = useState(false); // show BRB config popover
  var [noiseSuppOn,        setNoiseSuppOn]        = useState(false); // Web Audio noise suppression active
  var [pipActive,          setPipActive]          = useState(false); // browser native PiP active
  var [tickerText,         setTickerText]         = useState('');    // current scrolling ticker text
  var [tickerActive,       setTickerActive]       = useState(false); // ticker strip visible
  var [tickerInput,        setTickerInput]        = useState('');    // host input for ticker text
  var [showTickerInput,    setShowTickerInput]    = useState(false); // ticker config popover
  var [ltEditGid,          setLtEditGid]          = useState(null);  // guestId whose name card is being edited
  var [ltEditName,         setLtEditName]         = useState('');    // editor name field
  var [ltEditTitle,        setLtEditTitle]        = useState('');    // editor title field
  var [autoRecord,         setAutoRecord]         = useState(false); // auto-start recording when going live
  var [confettiBurst,      setConfettiBurst]      = useState([]);    // array of { id, x, color, delay, size } particles
  var [roomTimerSec,       setRoomTimerSec]       = useState(0);     // seconds remaining on room countdown
  var [roomTimerActive,    setRoomTimerActive]    = useState(false); // room timer overlay visible
  var [showTimerPicker,    setShowTimerPicker]    = useState(false); // host timer preset picker popover
  var roomTimerRef         = useRef(null);
  var [stageBg,            setStageBg]            = useState('');    // CSS gradient string or '' for default
  var [showBgPicker,       setShowBgPicker]       = useState(false); // stage bg picker popover
  var [wordFilter,         setWordFilter]         = useState(function() { try { var s = localStorage.getItem('sw_word_filter'); return s ? JSON.parse(s) : []; } catch(e) { return []; } });
  var [showWordFilter,     setShowWordFilter]     = useState(false); // word filter editor visible
  var [wordFilterInput,    setWordFilterInput]    = useState('');    // new word input
  var [showGiftStrip,      setShowGiftStrip]      = useState(false); // gift leaderboard strip visible
  var [showSoundboard,     setShowSoundboard]     = useState(false); // soundboard popover visible
  var [sentimentPoll,      setSentimentPoll]      = useState(null);  // { question, yesCount, noCount, endTs } | null
  var [sentimentVoted,     setSentimentVoted]     = useState(null);  // 'yes' | 'no' | null
  var [sentimentInput,     setSentimentInput]     = useState('');    // host input for sentiment question
  var [showSentimentInput, setShowSentimentInput] = useState(false); // host sentiment trigger popover
  var [chatSearch,         setChatSearch]         = useState('');    // live filter string for chat panel
  var [showChatSearch,     setShowChatSearch]     = useState(false); // chat search bar visible
  var [showHealthHud,      setShowHealthHud]      = useState(false); // stream health HUD corner overlay
  var [stageTimerTick,     setStageTimerTick]     = useState(0);     // incremented each second when stageLimitSec > 0
  var [customReactions,    setCustomReactions]    = useState(function() { try { var s = localStorage.getItem('sw_reactions'); return s ? JSON.parse(s) : ['🔥','❤️','😂','👍','💎','⚡']; } catch(e) { return ['🔥','❤️','😂','👍','💎','⚡']; } });
  var [showReactionPicker, setShowReactionPicker] = useState(false); // host emoji set config popover
  var [reactionPickerSlot, setReactionPickerSlot] = useState(0);     // which of the 6 slots is being edited
  var [reactionPickerInput,setReactionPickerInput]= useState('');    // emoji input for selected slot

  var [guestNotes,        setGuestNotes]        = useState(function() { try { var s = localStorage.getItem('sw_guest_notes'); return s ? JSON.parse(s) : {}; } catch(e) { return {}; } }); // { [guestId]: string }
  var [editingGuestNote,  setEditingGuestNote]  = useState(null);    // guestId whose note panel is open
  var [guestTags,         setGuestTags]         = useState({});       // { [guestId]: 'red'|'yellow'|'green' }
  var [chatSparkline,     setChatSparkline]     = useState([0,0,0,0,0,0,0,0,0,0]); // rolling 10×6s message counts
  var chatLenRef2          = useRef(0);          // last chat.length for sparkline delta tracking

  var [starredMsgs,    setStarredMsgs]    = useState(function() { try { var s = localStorage.getItem('sw_starred'); return s ? JSON.parse(s) : []; } catch(e) { return []; } }); // array of msg ids
  var [showStarred,    setShowStarred]    = useState(false);  // show only starred messages
  var [chatScrolledUp, setChatScrolledUp] = useState(false);  // user scrolled up from bottom
  var [chatUnread,     setChatUnread]     = useState(0);       // new messages while scrolled up
  var [chatCmdHint,    setChatCmdHint]    = useState(false);   // slash-command hint dropdown visible
  var chatScrollRef    = useRef(null);                          // scrollable chat messages container

  var [ccEnabled,  setCcEnabled]  = useState(false);
  var [ccLines,    setCcLines]    = useState([]);
  var ccRecogRef = useRef(null);
  var [stageInvitePending, setStageInvitePending] = useState(null); // { invitedBy, hostSocketId, guestId }
  var [pinnedMsg,          setPinnedMsg]          = useState(null); // { id, username, message, ts } | null
  var [followAlert,        setFollowAlert]        = useState(null); // { id, follower } | null
  var [hasFollowed,        setHasFollowed]        = useState(false);
  var [viewerMilestone,    setViewerMilestone]    = useState(null); // { count } | null
  var [answeringQ,         setAnsweringQ]         = useState(null); // { id, username, text } | null
  var [showSubModal,       setShowSubModal]       = useState(false);
  var [subConfirmed,       setSubConfirmed]       = useState(null); // tier id after subscribing
  var [shoutout,           setShoutout]           = useState(null); // { username, by } | null
  var [slowModeSec,        setSlowModeSec]        = useState(0);   // room slow mode (seconds)
  var [slowWaitSec,        setSlowWaitSec]        = useState(0);   // viewer countdown until next message
  var slowWaitRef = useRef(null);
  var [kicked,             setKicked]             = useState(false);
  var [clipLog,            setClipLog]            = useState([]); // [{ id, label, ts }]
  var [showClipLog,        setShowClipLog]        = useState(false);
  var [isFullscreen,       setIsFullscreen]       = useState(false);
  var [removeConfirmId,    setRemoveConfirmId]    = useState(null); // guestId pending removal confirmation
  var [mirrorSelf,         setMirrorSelf]         = useState(true);  // mirror own camera view
  var [stageAnnounce,      setStageAnnounce]      = useState(null);  // { username } | null — brief on-stage banner
  var [pipCorner,          setPipCorner]          = useState('BR');  // 'TL'|'TR'|'BL'|'BR' — PiP position
  var [localLowerThirds,   setLocalLowerThirds]   = useState({});    // { [guestId]: { visible, name, title } } — host-local name cards

  var chatEndRef         = useRef(null);
  var announceTimerRef   = useRef(null);
  var guestsRef          = useRef(guests || []);   // always-fresh guests list for async callbacks
  var freezeTimersRef    = useRef({});             // { [producerId]: timerId } — auto-reconnect on freeze
  var containerRef       = useRef(null);
  var cameraTrackRef     = useRef(null);
  var pipVideoRef        = useRef(null);
  var screenStreamRef    = useRef(null);
  var stageJoinTimesRef  = useRef({});   // { [guestId]: epochMs } — when each guest appeared on stage
  var speakingTimeRef    = useRef({});   // { [guestId]: totalSeconds } — cumulative speaking time
  var speakingStartRef   = useRef({});   // { [guestId]: epochMs | null } — current speaking start
  var micTrackRef            = useRef(null); // saved mic track for restoration after screen audio
  var autoFocusTimerRef      = useRef(null);
  var prevQualityRef         = useRef({});   // { [producerId]: quality } — last known quality for change-detection
  var qualityToastCoolRef    = useRef({});   // { [producerId]: true } — cooldown: suppress repeat toasts < 30 s
  var prevStageGidsRef       = useRef(new Set()); // Set<guestId> — previous render's on-stage set for new-joiner detection
  var stageLimitWarnedRef    = useRef({});   // { [guestId]: true } — guests already warned about time limit
  var spotlightStartRef      = useRef(null); // Date.now() when spotlight last activated
  var joinSoundEnabledRef    = useRef(true); // always-fresh mirror of joinSoundEnabled
  joinSoundEnabledRef.current = joinSoundEnabled;
  var liveStartRef           = useRef(null); // Date.now() when isLive first became true
  var streamDurationRef      = useRef(0);   // always-current mirror of streamDuration for callbacks
  var prompterScrollRef      = useRef(null); // teleprompter scrollable div
  var prompterRafRef         = useRef(null); // requestAnimationFrame id for scroll
  var prompterLastTs         = useRef(null); // last rAF timestamp for delta-time scroll
  var spotlightRotateRef     = useRef(null); // interval id for spotlight auto-rotation
  var spotlightRotateIdxRef  = useRef(0);    // current index in sortedOnStage for rotation
  var bgBlurVideoRef         = useRef(null); // hidden video element feeding camera into blur canvas
  var bgBlurRafRef           = useRef(null); // rAF id for blur draw loop
  var bgBlurStreamRef        = useRef(null); // canvas.captureStream() used as blurred producer source
  var bgBlurLevelRef         = useRef(8);    // mirrors bgBlurLevel for use inside rAF closure
  bgBlurLevelRef.current = bgBlurLevel;
  var nsRawTrackRef          = useRef(null); // raw mic track saved before NS processing
  var nsAudioCtxRef          = useRef(null); // AudioContext for NS chain
  var nsDestRef              = useRef(null); // MediaStreamDestination for NS chain
  var gold            = (branding && branding.gold) ? branding.gold : GOLD;

  // ── Trivia ──────────────────────────────────────────────────────────────
  var [activeTrivia,    setActiveTrivia]    = useState(null); // { question, options, durationMs, startTs }
  var [triviaMyAnswer,  setTriviaMyAnswer]  = useState(-1);   // option index selected by this user, -1=none
  var [triviaResults,   setTriviaResults]   = useState(null); // { question, options, correctIdx, correct, wrong, total }
  var [triviaCountdown, setTriviaCountdown] = useState(0);    // ms remaining
  var [triviaStartId,   setTriviaStartId]   = useState(null); // startTs used to key the countdown useEffect

  // ── Web Audio sound alerts ──────────────────────────────────────────────
  var audioCtxRef     = useRef(null);
  var soundOnRef      = useRef(true);
  var floatTimersRef  = useRef(new Set());
  var [soundOn, setSoundOn] = useState(true);
  var [chatReactions, setChatReactions] = useState({}); // msgId → { emoji: count }

  var playTone = function(freqs, duration) {
    if (!soundOnRef.current) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
    }
    var ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') { ctx.resume(); }
    freqs.forEach(function(freq, i) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12 / freqs.length, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime + i * 0.055);
      osc.stop(ctx.currentTime + duration + 0.1);
    });
  };

  // ── Trivia countdown (100ms ticks, keyed on triviaStartId) ────────────
  useEffect(function() {
    if (!triviaStartId) return;
    var id = setInterval(function() {
      setTriviaCountdown(function(prev) {
        return prev <= 100 ? 0 : prev - 100;
      });
    }, 100);
    return function() { clearInterval(id); };
  }, [triviaStartId]);

  useEffect(function() {
    if (triviaCountdown === 0 && triviaStartId) setTriviaStartId(null);
  }, [triviaCountdown, triviaStartId]);

  useEffect(function() {
    if (slowWaitSec === 0) clearInterval(slowWaitRef.current);
  }, [slowWaitSec]);

  // ── Camera warm-up ──
  useEffect(function() {
    if (role === 'viewer') return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(s) { s.getTracks().forEach(function(t) { t.stop(); }); })
      .catch(function() {});
  }, []);

  useEffect(function() {
    return function() {
      floatTimersRef.current.forEach(function(tid) { clearTimeout(tid); });
      floatTimersRef.current.clear();
    };
  }, []);

  // ── RTC + socket events ──
  useEffect(function() {
    if (!socket) return;

    var mounted = true;
    var onStatsUpdate = function(s) { setStreamStats(s); };

    var onJoinRoomAck = async function(data) {
      if (!data || data.error) {
        if (addToastRef.current) addToastRef.current((data && data.error) || 'Room connect failed', 'error');
        return;
      }
      // Pre-load chat history and room state.
      // On reconnect, merge server history so messages missed during the disconnect
      // gap appear rather than being silently lost.
      if (Array.isArray(data.chatHistory) && data.chatHistory.length > 0) {
        setChat(function(prev) {
          if (!prev.length) return data.chatHistory;
          var seenIds = {};
          for (var _ci = 0; _ci < prev.length; _ci++) { if (prev[_ci].id) seenIds[prev[_ci].id] = true; }
          var merged = prev.slice();
          for (var _si = 0; _si < data.chatHistory.length; _si++) {
            var _sm = data.chatHistory[_si];
            if (_sm.id && !seenIds[_sm.id]) merged.push(_sm);
          }
          merged.sort(function(a, b) { return (a.ts || 0) - (b.ts || 0); });
          return merged.slice(-200);
        });
      }
      if (data.activePoll) {
        var _ap = data.activePoll;
        // New-system polls (poll-create) have endsAt; they are shown by PollOverlay
        // via the seeded poll-start event. Skip setting LiveRoomPage's activePoll for them.
        if (!_ap.endsAt) {
          var _apOpts = Array.isArray(_ap.options)
            ? _ap.options.map(function(o) {
                return typeof o === 'string'
                  ? { text: o, votes: (_ap.votes && _ap.votes[o]) || 0 }
                  : { text: o.text || '', votes: o.votes || 0 };
              })
            : [];
          setActivePoll({ q: _ap.question || _ap.q || '', opts: _apOpts });
          setShowQa(true);
        }
      }
      if (data.activeVsPoll) {
        setVsPoll(data.activeVsPoll);
        setShowQa(true);
      }
      if (Array.isArray(data.judges) && data.judges.length > 0) {
        setJudges(data.judges);
      }
      if (Array.isArray(data.giftLeaderboard) && data.giftLeaderboard.length > 0) {
        setTipLeader(data.giftLeaderboard.map(function(e) { return { username: e.username || '', totalCents: e.totalCents || 0 }; }));
      }
      if (data.pinnedMessage && data.pinnedMessage.message) {
        setPinnedMsg({ id: data.pinnedMessage.id || '', username: data.pinnedMessage.username || '', message: String(data.pinnedMessage.message).slice(0, 300), ts: data.pinnedMessage.ts || 0 });
      }
      if (data.slowMode && data.slowMode > 0) {
        setSlowModeSec(data.slowMode);
      }
      if (Array.isArray(data.qaQueue) && data.qaQueue.length > 0) {
        setQaQueue(data.qaQueue.map(function(q) { return { id: q.id, username: q.username || 'Guest', text: String(q.text || '').slice(0, 300), upvotes: q.upvotes || 0 }; }));
      }
      if (data.streamGoal && data.streamGoal.target > 0) {
        if (setStreamGoal) setStreamGoal({ label: data.streamGoal.label || 'Stream Goal', goalCents: data.streamGoal.target });
      }
      if (data.audioOnly)      setAudioOnly(true);
      if (data.privateMode)    setPrivateMode(true);
      if (data.subscriberOnly) setSubscriberOnly(true);
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        if (!mounted) return;
        setRtcReady(true);
        // Wire up stream health stats; guard against duplicate registration on reconnect
        rtcManager.off('stats', onStatsUpdate);
        rtcManager.on('stats', onStatsUpdate);
      } catch(e) {
        if (!mounted) return;
        if (addToastRef.current) addToastRef.current('WebRTC: ' + e.message, 'error');
      }
    };
    socket.on('join-room-ack', onJoinRoomAck);

    socket.on('speaking', function(data) {
      if (!data || !data.guestId) return;
      setSpeakingIds(function(prev) {
        var next = Object.assign({}, prev);
        next[data.guestId] = !!data.speaking;
        return next;
      });
    });

    var onSuperChat = function(sc) {
      if (!sc) return;
      var scEntry = Object.assign({ type: 'super' }, sc);
      setChat(function(prev) { return [...prev.slice(-200), scEntry]; });
      setSuperChatCount(function(c) { return c + 1; });
      if (addToastRef.current && role !== 'host') addToastRef.current('💬 ' + sc.username + ' sent a $' + (Math.floor(sc.amountCents) / 100).toFixed(2) + ' Super Chat!', 'success');
      playTone([523, 659, 784], 1.5); // C5 E5 G5 — bright chord
    };
    socket.on('super-chat', onSuperChat);

    socket.on('super-chat:tts', function(sc) {
      if (!sc) return;
      var ttsEntry = Object.assign({ type: 'tts-super' }, sc);
      setChat(function(prev) { return [...prev.slice(-200), ttsEntry]; });
      setSuperChatCount(function(c) { return c + 1; });
      if (addToastRef.current && role !== 'host') addToastRef.current('🚀 ' + sc.username + ' sent a Voice SuperChat!', 'success');
      if (window.speechSynthesis && sc.message && sc.voice) {
        window.speechSynthesis.cancel();
        var u = new window.SpeechSynthesisUtterance(sc.username + ' says: ' + sc.message);
        u.pitch = sc.voice.pitch || 1;
        u.rate  = sc.voice.rate  || 1;
        window.speechSynthesis.speak(u);
      }
    });

    socket.on('gift-received', function(gift) {
      if (!gift) return;
      setGiftCount(function(c) { return c + 1; });
      playTone([880, 1109], 1.0); // A5 C#6 — crisp bell
      if (gift.toGuestId) {
        var cents = Math.floor(gift.valueCents || 0);
        setGuestGiftTotals(function(prev) {
          var next = Object.assign({}, prev);
          next[gift.toGuestId] = (next[gift.toGuestId] || 0) + cents;
          return next;
        });
      }
      setActivityLog(function(prev) {
        var from = gift.fromUsername || 'someone';
        var val  = gift.valueCents ? ('$' + (Math.floor(gift.valueCents) / 100).toFixed(2)) : '';
        return [{ id: Date.now() + '_gift', type: 'gift', msg: '🎁 ' + from + ' sent a gift' + (val ? ' ' + val : ''), ts: Date.now() }].concat(prev).slice(0, 100);
      });
    });

    socket.on('power-play', function(pp) {
      if (!pp || !pp.targetGuestId) return;
      var ppId = pp.id || String(Date.now());
      setPanelEffects(function(prev) {
        var next = Object.assign({}, prev);
        next[pp.targetGuestId] = { id: ppId, playType: pp.playType, durMs: pp.durMs || 4000 };
        return next;
      });
      if (pp.durMs > 0) {
        setTimeout(function() {
          setPanelEffects(function(prev) {
            if (!prev[pp.targetGuestId] || prev[pp.targetGuestId].id !== ppId) return prev;
            var next = Object.assign({}, prev);
            delete next[pp.targetGuestId];
            return next;
          });
        }, pp.durMs);
      }
    });

    socket.on('power-play:pending', function(pp) {
      if (!pp) return;
      setHostPendingPlays(function(prev) { return prev.concat([pp]); });
    });

    socket.on('power-play:awaiting', function(pp) {
      if (pp && pp.playId) setPendingPPId(pp.playId);
    });

    socket.on('power-play:approved', function(pp) {
      setPendingPPId(null);
    });

    socket.on('power-play:rejected', function(pp) {
      setPendingPPId(null);
      if (addToastRef.current) addToastRef.current('Power Play was declined', 'error');
    });

    socket.on('merch-order-received', function(order) {
      if (!order) return;
      if (order.toGuestId) {
        var cents = Math.floor(order.priceCents || 0);
        setGuestGiftTotals(function(prev) {
          var next = Object.assign({}, prev);
          next[order.toGuestId] = (next[order.toGuestId] || 0) + cents;
          return next;
        });
      }
    });

    socket.on('react-burst', function(data) {
      if (!data || !data.emoji) return;
      playReactionTone(data.emoji);
      var fid = Date.now() + Math.random();
      setFloatReacts(function(r) { return r.concat([{ emoji: data.emoji, fid: fid }]); });
      floatTimersRef.current.add(setTimeout(function() { setFloatReacts(function(r) { return r.filter(function(x) { return x.fid !== fid; }); }); }, 2200));
    });

    socket.on('hand-raise', function(data) {
      if (!data) return;
      if (role === 'host' && addToastRef.current) addToastRef.current('✋ ' + (data.username || data.guestId) + ' wants on stage', 'info');
      setRaisedHands(function(h) { var n = Object.assign({}, h); n[data.guestId] = data.ts || Date.now(); return n; });
      setActivityLog(function(prev) { return [{ id: Date.now() + '_hand_' + data.guestId, type: 'hand', msg: '✋ ' + (data.username || data.guestId) + ' raised hand', ts: Date.now() }].concat(prev).slice(0, 100); });
    });

    socket.on('hand-lower', function(data) {
      if (!data) return;
      setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[data.guestId]; return n; });
    });

    socket.on('mute-all', function() {
      setIsMuted(true);
      if (addToastRef.current) addToastRef.current('🔇 Host muted all participants', 'info');
    });

    socket.on('please-reconnect', function(data) {
      var who = (data && data.by) ? data.by : 'Host';
      if (addToastRef.current) addToastRef.current('⚠️ ' + who + ' is asking you to reconnect — leave and rejoin to fix your stream quality', 'warn');
    });

    socket.on('stage-lock-update', function(data) {
      setStageLocked(!!(data && data.locked));
    });

    socket.on('host-private-msg', function(data) {
      if (!data || !data.text) return;
      setInboundHostMsg({ from: data.from || 'Host', text: data.text });
      if (addToastRef.current) addToastRef.current('📨 ' + (data.from || 'Host') + ': ' + data.text, 'info');
      setTimeout(function() { setInboundHostMsg(null); }, 8000);
    });

    socket.on('broadcast-overlay', function(data) {
      if (!data || !data.text) return;
      setBroadcastOverlay({ text: String(data.text).slice(0, 200), from: data.from || 'Host' });
      setTimeout(function() { setBroadcastOverlay(null); }, 6000);
    });

    socket.on('brb', function(data) {
      if (!data) return;
      setBrbActive(!!data.active);
      if (!data.active) { setBrbMsg(''); return; }
      setBrbMsg(data.msg ? String(data.msg).slice(0, 100) : '');
    });

    socket.on('ticker', function(data) {
      if (!data) return;
      if (!data.active) { setTickerActive(false); setTickerText(''); return; }
      setTickerText(data.text ? String(data.text).slice(0, 200) : '');
      setTickerActive(true);
    });

    socket.on('unmute-all', function() {
      setIsMuted(false);
      if (addToastRef.current) addToastRef.current('🎙 Host unmuted all participants', 'info');
    });

    socket.on('confetti-burst', function() {
      var colors = [GOLD, RED, TEAL, '#00e676', '#7c4dff', '#ff6d00', '#00b0ff', '#ff4081'];
      var particles = [];
      for (var ci = 0; ci < 32; ci++) {
        particles.push({
          id: Date.now() + ci,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 1.2,
          size: 6 + Math.floor(Math.random() * 8),
        });
      }
      setConfettiBurst(particles);
      setTimeout(function() { setConfettiBurst([]); }, 3800);
    });

    socket.on('room-timer', function(data) {
      if (!data) return;
      clearInterval(roomTimerRef.current);
      if (!data.active || !data.seconds) {
        setRoomTimerActive(false);
        setRoomTimerSec(0);
        return;
      }
      setRoomTimerSec(data.seconds);
      setRoomTimerActive(true);
      roomTimerRef.current = setInterval(function() {
        setRoomTimerSec(function(prev) {
          if (prev <= 1) {
            clearInterval(roomTimerRef.current);
            setTimeout(function() { setRoomTimerActive(false); }, 800);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('soundboard', function(data) {
      if (!data || !data.sound) return;
      playSoundboardEffect(data.sound);
    });

    socket.on('sentiment-poll', function(data) {
      if (!data) return;
      if (!data.active) {
        setTimeout(function() { setSentimentPoll(null); setSentimentVoted(null); }, 3000);
        return;
      }
      setSentimentVoted(null);
      setSentimentPoll({
        question: data.question ? String(data.question).slice(0, 120) : 'Quick check-in!',
        yesCount: data.yesCount || 0,
        noCount: data.noCount || 0,
        endTs: data.endTs || (Date.now() + 30000),
      });
    });

    socket.on('sentiment-update', function(data) {
      if (!data) return;
      setSentimentPoll(function(prev) {
        if (!prev) return prev;
        return Object.assign({}, prev, { yesCount: data.yesCount || 0, noCount: data.noCount || 0 });
      });
    });

    socket.on('stage-join-requested', function(data) {
      if (!data || !data.guestId) return;
      setJoinRequests(function(prev) {
        if (prev.some(function(r) { return r.guestId === data.guestId; })) return prev;
        return prev.concat([{ guestId: data.guestId, username: data.username || data.guestId, ts: Date.now() }]);
      });
      if (addToastRef.current) addToastRef.current('📩 ' + (data.username || data.guestId) + ' wants to join stage', 'info');
    });

    socket.on('stage-join-denied', function() {
      if (addToastRef.current) addToastRef.current('Host declined your stage request', 'info');
    });

    socket.on('stage-join-approved', function(data) {
      if (!data || data.guestId !== userId) return;
      if (addToastRef.current) addToastRef.current('🎤 Host approved — you are now on stage!', 'success');
    });

    socket.on('lower-all-hands', function() {
      setRaisedHands({});
    });

    var onStageInvite = function(data) {
      if (!data || !data.guestId) return;
      setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[data.guestId]; return n; });
      setStageGuests(function(s) {
        if (s.indexOf(data.guestId) >= 0) return s;
        if (s.length >= MAX_STAGE) return s;
        return s.concat([data.guestId]);
      });
    };
    socket.on('stage-invite', onStageInvite);

    socket.on('stage-invite-pending', function(data) {
      if (!data) return;
      setStageInvitePending({ invitedBy: data.invitedBy || 'Host', hostSocketId: data.hostSocketId || '', guestId: data.guestId || '' });
    });

    socket.on('stage-invite-accepted', function(data) {
      if (addToastRef.current) addToastRef.current('🎤 ' + (data.username || 'Viewer') + ' joined the stage!', 'success');
    });

    socket.on('stage-invite-declined', function(data) {
      if (addToastRef.current) addToastRef.current((data.username || 'Viewer') + ' declined the stage invite', 'info');
    });

    socket.on('slow-mode-update', function(data) {
      if (!data) return;
      setSlowModeSec(data.seconds || 0);
      if (addToastRef.current) addToastRef.current(data.seconds > 0 ? ('🐌 Slow mode: ' + data.seconds + 's cooldown') : '🐌 Slow mode off', 'info');
    });

    socket.on('chat-slow-mode', function(data) {
      if (!data) return;
      var wait = data.waitSeconds || 0;
      setSlowWaitSec(wait);
      clearInterval(slowWaitRef.current);
      slowWaitRef.current = setInterval(function() {
        setSlowWaitSec(function(w) { return w <= 1 ? 0 : w - 1; });
      }, 1000);
    });

    socket.on('shoutout', function(data) {
      if (!data || !data.username) return;
      var so = { username: String(data.username).slice(0, 60), by: String(data.by || '').slice(0, 60) };
      setShoutout(so);
      floatTimersRef.current.add(setTimeout(function() { setShoutout(null); }, 5000));
    });

    socket.on('qa-answering', function(data) {
      if (!data || !data.text) return;
      setAnsweringQ({ id: data.id || '', username: data.username || '', text: String(data.text).slice(0, 300) });
    });

    socket.on('qa-answering-cleared', function() {
      setAnsweringQ(null);
    });

    socket.on('viewer-milestone', function(data) {
      if (!data || !data.count) return;
      setViewerMilestone({ count: data.count });
      floatTimersRef.current.add(setTimeout(function() { setViewerMilestone(null); }, 5000));
    });

    socket.on('gift-leaderboard', function(data) {
      if (!data || !data.leaders) return;
      setTipLeader(data.leaders.map(function(e) {
        return { username: e.username || '', totalCents: e.totalCents || 0 };
      }));
    });

    var onCreatorFollowed = function(data) {
      if (!data || !data.follower) return;
      var alert = { id: Date.now() + Math.random(), follower: String(data.follower).slice(0, 60) };
      setFollowAlert(alert);
      floatTimersRef.current.add(setTimeout(function() {
        setFollowAlert(function(cur) { return (cur && cur.id === alert.id) ? null : cur; });
      }, 4000));
    };
    socket.on('creator-followed', onCreatorFollowed);

    socket.on('chat-pinned', function(data) {
      if (!data || !data.message) return;
      setPinnedMsg({ id: data.id || '', username: data.username || '', message: String(data.message).slice(0, 300), ts: data.ts || 0 });
    });

    socket.on('chat-unpinned', function() {
      setPinnedMsg(null);
    });

    var onYouWereKicked = function() {
      setKicked(true);
    };
    socket.on('you-were-kicked', onYouWereKicked);

    socket.on('clip-marked', function(data) {
      if (!data || !data.label) return;
      var entry = { id: data.id || String(Date.now()), label: String(data.label).slice(0, 120), ts: data.ts || Math.floor(Date.now() / 1000) };
      setClipLog(function(prev) { return [entry].concat(prev).slice(0, 50); });
      if (addToastRef.current) addToastRef.current('✂️ ' + entry.label, 'info');
    });

    socket.on('trivia-question', function(data) {
      if (!data || !data.question) return;
      var dur = data.durationMs || 20000;
      var ts  = Date.now();
      setActiveTrivia({ question: String(data.question).slice(0, 200), options: Array.isArray(data.options) ? data.options : [], durationMs: dur, startTs: ts });
      setTriviaMyAnswer(-1);
      setTriviaResults(null);
      setTriviaCountdown(dur);
      setTriviaStartId(ts);
    });

    socket.on('trivia-results', function(data) {
      if (!data) return;
      setActiveTrivia(null);
      setTriviaStartId(null);
      setTriviaCountdown(0);
      setTriviaResults({
        question:   String(data.question || '').slice(0, 200),
        options:    Array.isArray(data.options) ? data.options : [],
        correctIdx: typeof data.correctIdx === 'number' ? data.correctIdx : 0,
        correct:    Array.isArray(data.correct) ? data.correct : [],
        wrong:      Array.isArray(data.wrong)   ? data.wrong   : [],
        total:      data.total || 0
      });
      floatTimersRef.current.add(setTimeout(function() { setTriviaResults(null); setTriviaMyAnswer(-1); }, 10000));
    });

    socket.on('chat-react-update', function(data) {
      if (!data || !data.msgId) return;
      setChatReactions(function(prev) {
        var next = Object.assign({}, prev);
        next[data.msgId] = data.reactions || {};
        return next;
      });
    });

    socket.on('stream-caption', function(data) {
      if (!data || !data.text) return;
      var line = { id: Date.now() + Math.random(), text: String(data.text).slice(0, 300) };
      setCcLines(function(prev) { return prev.concat(line).slice(-3); });
      floatTimersRef.current.add(setTimeout(function() {
        setCcLines(function(prev) { return prev.filter(function(l) { return l.id !== line.id; }); });
      }, 6000));
    });

    socket.on('poll-update', function(data) {
      if (!data) return;
      if (!data.active) { setActivePoll(null); setPollVoted(false); return; }
      setActivePoll({
        q: data.question || '',
        opts: (data.options || []).map(function(o) { return { text: o.text, votes: o.votes || 0 }; })
      });
    });

    socket.on('qa-question', function(data) {
      if (!data || !data.text) return;
      setQaQueue(function(q) {
        return [{ id: data.id || Date.now(), username: data.username || 'Guest', text: data.text, upvotes: 0 }]
          .concat(q).slice(0, 20);
      });
    });

    socket.on('qa-upvote', function(data) {
      if (!data || !data.id) return;
      setQaQueue(function(q) {
        return q.map(function(item) {
          return item.id === data.id ? { id: item.id, username: item.username, text: item.text, upvotes: item.upvotes + 1 } : item;
        }).sort(function(a, b) { return b.upvotes - a.upvotes; });
      });
    });

    socket.on('qa-dismissed', function(data) {
      if (!data || !data.id) return;
      setQaQueue(function(q) { return q.filter(function(item) { return item.id !== data.id; }); });
    });

    socket.on('music-shared', function(data) {
      if (!data || !data.title) return;
      setMusicBanner({ title: data.title, style: data.style || '', emoji: data.emoji || '🎵', sharedBy: data.sharedBy || '' });
      floatTimersRef.current.add(setTimeout(function() { setMusicBanner(null); }, 6000));
    });

    socket.on('vs-update', function(data) {
      if (!data) { setVsPoll(null); setVsVoted(null); return; }
      setVsPoll(data);
      if (!data.active) {
        floatTimersRef.current.add(setTimeout(function() { setVsPoll(null); setVsVoted(null); }, 8000));
      }
    });

    socket.on('judges-update', function(data) {
      if (!data) return;
      setJudges(data);
    });

    socket.on('judge-scored', function(data) {
      if (!data) return;
      setScoreReveal({ username: data.username || 'Judge', score: data.score, label: data.label || '' });
      floatTimersRef.current.add(setTimeout(function() { setScoreReveal(null); }, 3200));
    });

    socket.on('screen-share-active', function(data) {
      if (!data) return;
      if (data.userId !== userId) {
        setScreenShareHost({ userId: data.userId, username: data.username || 'Host' });
        setStageLayout('featured');
        setFeaturedId(data.userId);
      }
    });

    socket.on('screen-share-ended', function() {
      setScreenShareHost(null);
      setStageLayout('grid');
    });

    socket.on('spotlight-guest', function(data) {
      if (!data || !data.guestId) return;
      setSpotlight({ guestId: data.guestId, username: data.username || data.guestId });
      setStageLayout('featured');
      setFeaturedId(data.guestId);
      setAutoFocusSpeaker(false);
    });

    socket.on('spotlight-end', function() {
      setSpotlight(null);
      setStageLayout('grid');
    });

    socket.on('room-audio-only', function(data) {
      if (!data) return;
      setAudioOnly(Boolean(data.enabled));
      if (addToastRef.current) addToastRef.current(data.enabled ? '🎤 Host switched to audio-only mode' : '📹 Video mode re-enabled', 'info');
    });

    socket.on('room-private', function(data) {
      if (!data) return;
      setPrivateMode(Boolean(data.enabled));
      if (addToastRef.current) addToastRef.current(data.enabled ? '🔒 Room is now invite-only' : '🔓 Room is now open to all', 'info');
    });

    socket.on('panel:audio_only_changed', function(data) {
      if (!data || data.roomId !== roomId) return;
      setAudioOnly(Boolean(data.isAudioOnly));
    });

    socket.on('subscriber-only-changed', function(data) {
      if (!data) return;
      setSubscriberOnly(Boolean(data.enabled));
      if (addToastRef.current) addToastRef.current(data.enabled ? '⭐ This room is now subscriber-only' : 'Room is now open to all viewers', 'info');
    });

    socket.on('user-banned', function(data) {
      if (!data) return;
      if (data.userId === userId) {
        if (addToastRef.current) addToastRef.current('🚫 You have been removed from this room', 'error');
      }
    });

    socket.on('user-unbanned', function(data) {
      if (!data) return;
      if (data.username && username && data.username === username) {
        if (addToastRef.current) addToastRef.current('✅ Your ban has been lifted — welcome back!', 'success');
      }
    });

    socket.on('go-live-confirmed', function(data) {
      if (data && data.streamTitle) setActiveStreamTitle(data.streamTitle);
      // Notify everyone in the room (host gets their own 'Going LIVE...' toast already)
      if (addToastRef.current) {
        var msg = data && data.streamTitle
          ? '🔴 Stream started: ' + data.streamTitle
          : '🔴 The stream has started!';
        addToastRef.current(msg, 'success');
      }
    });

    socket.on('broadcast-ended', function(data) {
      setActiveStreamTitle('');
      if (data) setStreamRecap(Object.assign({}, data, { duration: streamDurationRef.current }));
      if (addToastRef.current) addToastRef.current('Stream ended', 'info');
    });
    socket.on('fanout-started', function(data) {
      if (data && data.destinations) {
        setFanoutStatus(data.destinations);
      }
    });
    socket.on('fanout-failed', function() {
      if (addToastRef.current) addToastRef.current('⚠️ Stream relay failed — retrying…', 'error');
      setFanoutStatus([]);
    });
    socket.on('fanout-restarted', function() {
      if (addToastRef.current) addToastRef.current('🔄 Stream relay reconnected', 'success');
    });
    socket.on('fanout-stopped', function() {
      setFanoutStatus([]);
      setActiveStreamTitle('');
    });
    socket.on('viewer-milestone', function(data) {
      if (!data || !data.count) return;
      var msgs = {
        10: '🔥 10 viewers — you\'re picking up steam!',
        25: '⚡ 25 viewers in the room!',
        50: '🎉 50 viewers! Halfway to 100!',
        100: '💯 100 viewers watching — you\'re on fire!',
        250: '🚀 250 viewers! Incredible!',
        500: '🌟 500 viewers! You\'re going viral!',
        1000: '👑 1,000 viewers! YOU\'RE VIRAL!',
        2500: '🏆 2,500 viewers — LEGENDARY!',
        5000: '💎 5,000 viewers — ICON STATUS!',
      };
      var msg = msgs[data.count] || ('🎉 ' + data.count.toLocaleString() + ' viewers!');
      if (addToastRef.current) addToastRef.current(msg, 'success');
    });

    return function() {
      mounted = false;
      clearInterval(slowWaitRef.current);
      rtcManager.off('stats', onStatsUpdate);
      rtcManager.destroy();
      socket.off('join-room-ack', onJoinRoomAck);
      socket.off('speaking');
      socket.off('hand-raise');
      socket.off('hand-lower');
      socket.off('stage-invite', onStageInvite);
      socket.off('poll-update');
      socket.off('qa-question');
      socket.off('qa-upvote');
      socket.off('qa-dismissed');
      socket.off('music-shared');
      socket.off('vs-update');
      socket.off('judges-update');
      socket.off('judge-scored');
      socket.off('super-chat', onSuperChat);
      socket.off('super-chat:tts');
      socket.off('react-burst');
      socket.off('gift-received');
      socket.off('merch-order-received');
      socket.off('power-play');
      socket.off('power-play:pending');
      socket.off('power-play:awaiting');
      socket.off('power-play:approved');
      socket.off('power-play:rejected');
      socket.off('screen-share-active');
      socket.off('screen-share-ended');
      socket.off('spotlight-guest');
      socket.off('spotlight-end');
      socket.off('mute-all');
      socket.off('please-reconnect');
      socket.off('stage-lock-update');
      socket.off('lower-all-hands');
      socket.off('broadcast-overlay');
      socket.off('stage-join-requested');
      socket.off('stage-join-denied');
      socket.off('stage-join-approved');
      socket.off('room-audio-only');
      socket.off('room-private');
      socket.off('subscriber-only-changed');
      socket.off('user-banned');
      socket.off('user-unbanned');
      socket.off('stream-caption');
      socket.off('stage-invite-pending');
      socket.off('stage-invite-accepted');
      socket.off('stage-invite-declined');
      socket.off('slow-mode-update');
      socket.off('chat-slow-mode');
      socket.off('shoutout');
      socket.off('qa-answering');
      socket.off('qa-answering-cleared');
      socket.off('viewer-milestone');
      socket.off('gift-leaderboard');
      socket.off('creator-followed', onCreatorFollowed);
      socket.off('chat-pinned');
      socket.off('chat-unpinned');
      socket.off('you-were-kicked', onYouWereKicked);
      socket.off('clip-marked');
      socket.off('trivia-question');
      socket.off('trivia-results');
      socket.off('chat-react-update');
      socket.off('panel:audio_only_changed');
      socket.off('brb');
      socket.off('ticker');
      socket.off('unmute-all');
      socket.off('confetti-burst');
      socket.off('room-timer');
      socket.off('soundboard');
      socket.off('sentiment-poll');
      socket.off('sentiment-update');
      socket.off('go-live-confirmed');
      socket.off('broadcast-ended');
      socket.off('fanout-started');
      socket.off('fanout-failed');
      socket.off('fanout-restarted');
      socket.off('fanout-stopped');
      socket.off('viewer-milestone');
      clearInterval(roomTimerRef.current);
      if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
        try { mediaRecRef.current.stop(); } catch(e) {}
      }
      clearInterval(recTimerRef.current);
      if (recUrlRef.current) { URL.revokeObjectURL(recUrlRef.current); recUrlRef.current = null; }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
        screenStreamRef.current = null;
      }
      if (bgBlurRafRef.current) { cancelAnimationFrame(bgBlurRafRef.current); bgBlurRafRef.current = null; }
      if (bgBlurVideoRef.current) { bgBlurVideoRef.current.srcObject = null; bgBlurVideoRef.current = null; }
      if (bgBlurStreamRef.current) { bgBlurStreamRef.current.getTracks().forEach(function(t) { t.stop(); }); bgBlurStreamRef.current = null; }
      if (nsAudioCtxRef.current) {
        try { nsAudioCtxRef.current.close(); } catch(e) {}
        nsAudioCtxRef.current = null;
        nsRawTrackRef.current = null;
        nsDestRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch(e) {}
        audioCtxRef.current = null;
      }
    };
  }, [socket]);

  // ── Scroll chat to bottom (skip when user has scrolled up) ──
  useEffect(function() {
    if (!chatOpen) return;
    if (chatScrolledUp) { setChatUnread(function(v) { return v + 1; }); return; }
    setChatUnread(0);
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat, chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update medConf when mediaConfig prop changes ──
  useEffect(function() { setMedConf(mediaConfig || null); }, [mediaConfig]);

  // ── Live Closed Captions (host only, Web Speech API) ──
  useEffect(function() {
    if (!ccEnabled || role !== 'host' || !isLive || !socket) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (addToastRef.current) addToastRef.current('CC: browser does not support speech recognition', 'error');
      setCcEnabled(false);
      return;
    }
    var stopped = false;
    var recog = new SR();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'en-US';
    recog.onresult = function(e) {
      var text = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      text = text.trim().slice(0, 300);
      if (!text) return;
      socket.emit('stream-caption', { text: text });
      var line = { id: Date.now() + Math.random(), text: text };
      setCcLines(function(prev) { return prev.concat(line).slice(-3); });
      setTimeout(function() {
        setCcLines(function(prev) { return prev.filter(function(l) { return l.id !== line.id; }); });
      }, 6000);
    };
    recog.onerror = function(e) {
      if (e.error !== 'no-speech') console.warn('[CC]', e.error);
    };
    recog.onend = function() {
      if (!stopped) { try { recog.start(); } catch (ex) {} }
    };
    recog.start();
    ccRecogRef.current = recog;
    return function() {
      stopped = true;
      recog.onend = null;
      try { recog.stop(); } catch (ex) {}
      ccRecogRef.current = null;
    };
  }, [ccEnabled, role, isLive, socket]);

  // ── RTC reconnect: clear stale screen share state ──────────────────────────
  // When the transport reconnects, OctCell re-publishes the camera stream.
  // If screen sharing was active, the screen track is gone but isScreenSharing
  // is still true. Reset it so the UI and server stay in sync.
  useEffect(function() {
    if (!rtcReady) return;
    var onReady = function() {
      if (!screenStreamRef.current) return; // nothing to clean up
      setIsScreenSharing(false);
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
      if (micTrackRef.current) { micTrackRef.current = null; }
      if (socket) socket.emit('screen-share-stop', { roomId: roomId });
    };
    rtcManager.on('sendTransportReady', onReady);
    return function() { rtcManager.off('sendTransportReady', onReady); };
  }, [rtcReady, socket, roomId]);

  // ── Dominant speaker auto-focus ─────────────────────────────────────────
  // When in featured layout with autoFocusSpeaker enabled (and no active screen
  // share), watch speakingIds and switch featuredId to whoever starts speaking.
  // A 1 400 ms debounce prevents rapid hopping when multiple people overlap.
  useEffect(function() {
    if (!autoFocusSpeaker || stageLayout !== 'featured' || isScreenSharing || screenShareHost) {
      clearTimeout(autoFocusTimerRef.current);
      return;
    }
    var nextSpeaker = null;
    var keys = Object.keys(speakingIds);
    for (var i = 0; i < keys.length; i++) {
      if (speakingIds[keys[i]] && allGuestMap[keys[i]]) { nextSpeaker = keys[i]; break; }
    }
    if (!nextSpeaker) { clearTimeout(autoFocusTimerRef.current); return; }
    clearTimeout(autoFocusTimerRef.current);
    autoFocusTimerRef.current = setTimeout(function() {
      setFeaturedId(nextSpeaker);
    }, 1400);
    return function() { clearTimeout(autoFocusTimerRef.current); };
  }, [speakingIds, stageLayout, autoFocusSpeaker, isScreenSharing, screenShareHost]);

  // ── Per-consumer network quality tracking ────────────────────────────────
  // Collect incoming bitrate/jitter/loss from webrtc.js consumerStats events
  // and build a producerId → quality map rendered as a dot on each remote tile.
  useEffect(function() {
    if (!rtcReady) return;
    var onStats = function(data) {
      if (!data || !data.producerId) return;
      var q = 'green';
      if (data.bitratekbps < 60 || data.packetsLost > 5) q = 'red';
      else if (data.bitratekbps < 200 || data.jitter > 30) q = 'yellow';
      setProducerQuality(function(prev) {
        if (prev[data.producerId] === q) return prev;
        var next = Object.assign({}, prev);
        next[data.producerId] = q;
        return next;
      });
      setConsumerRawStats(function(prev) {
        var next = Object.assign({}, prev);
        next[data.producerId] = { bitratekbps: data.bitratekbps, jitter: data.jitter, packetsLost: data.packetsLost };
        return next;
      });
    };
    rtcManager.on('consumerStats', onStats);
    return function() { rtcManager.off('consumerStats', onStats); };
  }, [rtcReady]);

  // Keep guestsRef current so async callbacks see fresh guest list
  useEffect(function() { guestsRef.current = guests || []; }, [guests]);

  // ── Freeze detection: mark producers whose bitrate stays ~0 ─────────────
  useEffect(function() {
    setFrozenProducers(function(prev) {
      var next = Object.assign({}, prev);
      var changed = false;
      Object.keys(consumerRawStats).forEach(function(pid) {
        var isFrozen = consumerRawStats[pid].bitratekbps < 10;
        if (isFrozen && !next[pid]) { next[pid] = true; changed = true; }
        else if (!isFrozen && next[pid]) { delete next[pid]; changed = true; }
      });
      return changed ? next : prev;
    });
  }, [consumerRawStats]);

  // ── Quality-drop toasts (host only, 30 s cooldown per producer) ──────────
  useEffect(function() {
    if (role !== 'host') return;
    Object.keys(producerQuality).forEach(function(pid) {
      var cur  = producerQuality[pid];
      var prev = prevQualityRef.current[pid];
      var worsened = (cur === 'red' && prev !== 'red') || (cur === 'yellow' && prev === 'green');
      if (worsened && !qualityToastCoolRef.current[pid]) {
        var g = guestsRef.current.find(function(guest) { return guest.producerId === pid; });
        var label = g ? (g.username || g.guestId || pid) : pid;
        var msg   = cur === 'red' ? (label + ': POOR signal') : (label + ': FAIR signal');
        if (addToastRef.current) addToastRef.current(msg, cur === 'red' ? 'error' : 'warning');
        qualityToastCoolRef.current[pid] = true;
        setTimeout(function() { delete qualityToastCoolRef.current[pid]; }, 30000);
      }
    });
    prevQualityRef.current = Object.assign({}, producerQuality);
  }, [producerQuality, role]);

  // ── Auto-mute new stage joiners (host toggle) ────────────────────────────
  useEffect(function() {
    if (role !== 'host' || !autoMuteJoin || !socket) return;
    var currentGids = new Set(onStage.map(function(g) { return g.guestId || g.userId; }));
    currentGids.forEach(function(gid) {
      if (gid === userId) return;
      if (!prevStageGidsRef.current.has(gid)) {
        socket.emit('mute-guest', { roomId: roomId, guestId: gid });
      }
    });
    prevStageGidsRef.current = currentGids;
  }, [onStage, autoMuteJoin, role]);

  // ── Stage time limit: warn + remove guests who exceed the host-set limit ──
  useEffect(function() {
    if (role !== 'host' || stageLimitSec === 0) return;
    var now = Date.now();
    onStage.forEach(function(g) {
      var gid = g.guestId || g.userId;
      if (gid === userId) return;
      var joinMs = stageJoinTimesRef.current[gid];
      if (!joinMs) return;
      var elapsedSec = Math.floor((now - joinMs) / 1000);
      var warnAt  = stageLimitSec - 60;
      var warnKey = gid + '_' + stageLimitSec;
      if (elapsedSec >= stageLimitSec && !stageLimitWarnedRef.current[warnKey + '_removed']) {
        stageLimitWarnedRef.current[warnKey + '_removed'] = true;
        if (socket) socket.emit('stage-remove', { roomId: roomId, guestId: gid });
        if (addToastRef.current) addToastRef.current((g.username || gid) + ': stage time limit reached', 'info');
      } else if (elapsedSec >= warnAt && warnAt > 0 && !stageLimitWarnedRef.current[warnKey + '_warned']) {
        stageLimitWarnedRef.current[warnKey + '_warned'] = true;
        if (addToastRef.current) addToastRef.current((g.username || gid) + ': 60 s left on stage', 'warning');
      }
    });
  }, [speakingSnapshots, stageLimitSec, role]); // piggyback on 5 s snapshot tick

  // ── Stage prefs: restore from localStorage on mount ─────────────────────
  useEffect(function() {
    try {
      var saved = localStorage.getItem('sw_stage_prefs');
      if (saved) {
        var prefs = JSON.parse(saved);
        if (prefs.layout) setStageLayout(prefs.layout);
        if (prefs.sort)   setStageSort(prefs.sort);
        if (prefs.limitSec !== undefined) setStageLimitSec(Number(prefs.limitSec) || 0);
        if (prefs.density !== undefined)  setGridDensity(Number(prefs.density) || 0);
        if (prefs.aspect)                 setCellAspect(prefs.aspect);
        if (prefs.tint !== undefined)     setStageTint(prefs.tint || '');
        if (prefs.bg !== undefined)       setStageBg(prefs.bg || '');
      }
    } catch(e) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stage prefs: persist to localStorage whenever they change ───────────
  useEffect(function() {
    try {
      localStorage.setItem('sw_stage_prefs', JSON.stringify({ layout: stageLayout, sort: stageSort, limitSec: stageLimitSec, density: gridDensity, aspect: cellAspect, tint: stageTint, bg: stageBg }));
    } catch(e) {}
  }, [stageLayout, stageSort, stageLimitSec, gridDensity, cellAspect, stageTint, stageBg]);

  // ── Word filter: persist whenever list changes ──────────────────────────
  useEffect(function() {
    try { localStorage.setItem('sw_word_filter', JSON.stringify(wordFilter)); } catch(e) {}
  }, [wordFilter]);

  // ── Sentiment poll: auto-expire when endTs is reached ───────────────────
  useEffect(function() {
    if (!sentimentPoll || !sentimentPoll.endTs) return;
    var remaining = sentimentPoll.endTs - Date.now();
    if (remaining <= 0) { setSentimentPoll(null); setSentimentVoted(null); return; }
    var tid = setTimeout(function() { setSentimentPoll(null); setSentimentVoted(null); }, remaining);
    return function() { clearTimeout(tid); };
  }, [sentimentPoll && sentimentPoll.endTs]);

  // ── Stage time limit: 1-second tick so badges stay current ─────────────
  useEffect(function() {
    if (!stageLimitSec) { setStageTimerTick(0); return; }
    var id = setInterval(function() { setStageTimerTick(function(v) { return v + 1; }); }, 1000);
    return function() { clearInterval(id); };
  }, [stageLimitSec]);

  // ── Custom reactions: persist whenever set changes ──────────────────────
  useEffect(function() {
    try { localStorage.setItem('sw_reactions', JSON.stringify(customReactions)); } catch(e) {}
  }, [customReactions]);

  // ── Guest notes: persist to localStorage ────────────────────────────────
  useEffect(function() {
    try { localStorage.setItem('sw_guest_notes', JSON.stringify(guestNotes)); } catch(e) {}
  }, [guestNotes]);

  // ── Starred messages: persist to localStorage ────────────────────────────
  useEffect(function() {
    try { localStorage.setItem('sw_starred', JSON.stringify(starredMsgs)); } catch(e) {}
  }, [starredMsgs]);

  // ── Chat sparkline: tally new messages into current bucket ───────────────
  useEffect(function() {
    var newLen = chat ? chat.length : 0;
    var delta = newLen - chatLenRef2.current;
    if (delta <= 0) { chatLenRef2.current = newLen; return; }
    chatLenRef2.current = newLen;
    setChatSparkline(function(prev) {
      var next = prev.slice();
      next[next.length - 1] = (next[next.length - 1] || 0) + delta;
      return next;
    });
  }, [chat && chat.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat sparkline: advance bucket every 6 s ────────────────────────────
  useEffect(function() {
    var id = setInterval(function() {
      setChatSparkline(function(prev) {
        var next = prev.slice(1);
        next.push(0);
        return next;
      });
    }, 6000);
    return function() { clearInterval(id); };
  }, []);

  // ── Presenter notes: restore from localStorage on mount ─────────────────
  useEffect(function() {
    try {
      var saved = localStorage.getItem('sw_notes');
      if (saved) setNoteText(saved);
    } catch(e) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Low-bandwidth mode: cap/restore simulcast layers for all consumers ───
  useEffect(function() {
    if (!socket) return;
    guests.forEach(function(g) {
      if (!g.producerId) return;
      socket.emit('consumer-layers', { producerId: g.producerId, spatialLayer: lowBwMode ? 0 : 2, temporalLayer: lowBwMode ? 0 : 2 });
    });
  }, [lowBwMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Incoming stage-reaction from remote peers ────────────────────────────
  useEffect(function() {
    if (!socket) return;
    function onRemoteReaction(data) {
      if (!data || !data.emoji) return;
      var rid = Date.now() + data.emoji + (Math.random() * 1000 | 0);
      var x   = 10 + Math.floor(Math.random() * 80);
      setReactionBurst(function(prev) { return prev.concat([{ id: rid, emoji: data.emoji, x: x }]); });
      setTimeout(function() { setReactionBurst(function(prev) { return prev.filter(function(r) { return r.id !== rid; }); }); }, 2200);
      setReactionCounts(function(prev) {
        var next = Object.assign({}, prev);
        next[data.emoji] = (next[data.emoji] || 0) + 1;
        return next;
      });
    }
    socket.on('stage-reaction', onRemoteReaction);
    return function() { socket.off('stage-reaction', onRemoteReaction); };
  }, [socket]);

  // ── Stream duration clock: tick every second while live ──────────────────
  useEffect(function() {
    if (isLive) {
      if (!liveStartRef.current) liveStartRef.current = Date.now();
      var t = setInterval(function() {
        setStreamDuration(Math.floor((Date.now() - liveStartRef.current) / 1000));
      }, 1000);
      return function() { clearInterval(t); };
    } else {
      liveStartRef.current = null;
      setStreamDuration(0);
    }
  }, [isLive]);

  // Keep ref in sync so broadcast-ended callback captures duration before it resets
  streamDurationRef.current = streamDuration;

  // ── Auto-record: start recording when stream goes live ─────────────────
  useEffect(function() {
    if (isLive && autoRecord && recState === 'idle') {
      startRecording();
    }
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Peak viewer counter ─────────────────────────────────────────────────
  useEffect(function() {
    if (viewerCount > peakViewers) setPeakViewers(viewerCount);
  }, [viewerCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-layout: switch grid↔featured by stage count ───────────────────
  useEffect(function() {
    if (!autoLayout) return;
    var n2 = onStage.length;
    if (n2 <= 1 && stageLayout !== 'featured') { setStageLayout('featured'); }
    else if (n2 >= 2 && stageLayout === 'featured') { setStageLayout('grid'); }
  }, [guests.length, autoLayout]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spotlight auto-rotation ──────────────────────────────────────────────
  useEffect(function() {
    if (spotlightRotateRef.current) { clearInterval(spotlightRotateRef.current); spotlightRotateRef.current = null; }
    if (!spotlightRotateSec || !socket) return;
    spotlightRotateRef.current = setInterval(function() {
      var stage = sortedOnStage;
      if (stage.length < 2) return;
      spotlightRotateIdxRef.current = (spotlightRotateIdxRef.current + 1) % stage.length;
      var g2 = stage[spotlightRotateIdxRef.current];
      var gid2 = g2.guestId || g2.userId;
      socket.emit('spotlight-guest', { roomId: roomId, guestId: gid2, username: g2.username || gid2 });
    }, spotlightRotateSec * 1000);
    return function() { if (spotlightRotateRef.current) { clearInterval(spotlightRotateRef.current); spotlightRotateRef.current = null; } };
  }, [spotlightRotateSec, socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Teleprompter rAF scroll ──────────────────────────────────────────────
  useEffect(function() {
    if (prompterRafRef.current) { cancelAnimationFrame(prompterRafRef.current); prompterRafRef.current = null; }
    if (!prompterRunning || !prompterScrollRef.current) return;
    prompterLastTs.current = null;
    var tick = function(ts) {
      if (!prompterScrollRef.current) return;
      if (prompterLastTs.current !== null) {
        var dt = ts - prompterLastTs.current;
        prompterScrollRef.current.scrollTop += (prompterSpeed / 1000) * dt;
      }
      prompterLastTs.current = ts;
      prompterRafRef.current = requestAnimationFrame(tick);
    };
    prompterRafRef.current = requestAnimationFrame(tick);
    return function() { if (prompterRafRef.current) { cancelAnimationFrame(prompterRafRef.current); prompterRafRef.current = null; } };
  }, [prompterRunning, prompterSpeed]);

  // ── Spotlight elapsed timer ──────────────────────────────────────────────
  useEffect(function() {
    if (spotlight) {
      if (!spotlightStartRef.current) spotlightStartRef.current = Date.now();
      var t = setInterval(function() {
        setSpotlightElapsed(Math.floor((Date.now() - spotlightStartRef.current) / 1000));
      }, 1000);
      return function() { clearInterval(t); };
    } else {
      spotlightStartRef.current = null;
      setSpotlightElapsed(0);
    }
  }, [spotlight ? spotlight.guestId : null]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-reconnect: host-only, fires after 15 s of sustained freeze ─────
  useEffect(function() {
    if (role !== 'host') return;
    // Start a 15 s timer for any newly frozen producer
    Object.keys(frozenProducers).forEach(function(pid) {
      if (freezeTimersRef.current[pid]) return;
      freezeTimersRef.current[pid] = setTimeout(function() {
        delete freezeTimersRef.current[pid];
        var g = guestsRef.current.find(function(guest) { return guest.producerId === pid; });
        if (!g) return;
        var gid = g.guestId || g.userId;
        if (socket) socket.emit('request-reconnect', { roomId: roomId, guestId: gid });
        if (addToastRef.current) addToastRef.current('Auto-reconnect → ' + (g.username || gid), 'info');
      }, 15000);
    });
    // Cancel timers for producers that recovered
    Object.keys(freezeTimersRef.current).forEach(function(pid) {
      if (!frozenProducers[pid]) {
        clearTimeout(freezeTimersRef.current[pid]);
        delete freezeTimersRef.current[pid];
      }
    });
  }, [frozenProducers, role]);

  // ── Camera enumeration for hot-swap ─────────────────────────────────────
  useEffect(function() {
    if (role === 'viewer') return;
    if (!navigator.mediaDevices) return;
    var doEnum = function() {
      navigator.mediaDevices.enumerateDevices().then(function(devs) {
        var cams = devs.filter(function(d) { return d.kind === 'videoinput'; });
        var mics = devs.filter(function(d) { return d.kind === 'audioinput'; });
        setAvCameras(cams);
        setAvMics(mics);
      }).catch(function() {});
    };
    doEnum();
    navigator.mediaDevices.addEventListener('devicechange', doEnum);
    return function() { navigator.mediaDevices.removeEventListener('devicechange', doEnum); };
  }, []);

  // ── Speaking time accumulation ───────────────────────────────────────────
  // Track when each guest starts/stops speaking; accumulate seconds into
  // speakingTimeRef so the expanded-cell modal can show total speaking time.
  useEffect(function() {
    var now = Date.now();
    Object.keys(speakingIds).forEach(function(gid) {
      if (speakingIds[gid] && !speakingStartRef.current[gid]) {
        speakingStartRef.current[gid] = now;
      }
    });
    Object.keys(speakingStartRef.current).forEach(function(gid) {
      if (speakingStartRef.current[gid] && !speakingIds[gid]) {
        var elapsed = Math.floor((now - speakingStartRef.current[gid]) / 1000);
        speakingTimeRef.current[gid] = (speakingTimeRef.current[gid] || 0) + elapsed;
        delete speakingStartRef.current[gid];
      }
    });
  }, [speakingIds]);

  // ── Speaking-time snapshots: poll speakingTimeRef every 5 s for badges ────
  useEffect(function() {
    var t = setInterval(function() {
      var snap = {};
      var now = Date.now();
      // Include any ongoing speaking session in the snapshot
      Object.keys(speakingStartRef.current).forEach(function(gid) {
        if (speakingStartRef.current[gid]) {
          var live = Math.floor((now - speakingStartRef.current[gid]) / 1000);
          snap[gid] = (speakingTimeRef.current[gid] || 0) + live;
        }
      });
      Object.keys(speakingTimeRef.current).forEach(function(gid) {
        if (!snap[gid]) snap[gid] = speakingTimeRef.current[gid] || 0;
      });
      setSpeakingSnapshots(snap);
    }, 5000);
    return function() { clearInterval(t); };
  }, []);

  // Persist chosen layout to localStorage so it survives page reloads
  useEffect(function() {
    try { localStorage.setItem('sw_layout', stageLayout); } catch(e) {}
    if (stageLayout !== 'featured') setCinemaMode(false);
  }, [stageLayout]);

  // ── Local mic level analyzer (for GlobalMicButtonV49) ──
  useEffect(function() {
    if (!rtcReady || isMuted) { setMicLevel(0); return; }
    var producer = rtcManager && rtcManager.producers && rtcManager.producers['audio'];
    if (!producer || !producer.track) return;
    var ctx, source, analyser, buf, id;
    try {
      var stream = new MediaStream([producer.track]);
      ctx      = new (window.AudioContext || window.webkitAudioContext)();
      source   = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      buf = new Uint8Array(analyser.frequencyBinCount);
      id  = setInterval(function() {
        analyser.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i];
        var avg = sum / buf.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
      }, 80);
    } catch(e) {}
    return function() {
      clearInterval(id);
      try { if (ctx) ctx.close(); } catch(e2) {}
    };
  }, [rtcReady, isMuted]);

  // Auto-dismiss raised hand when a guest appears on stage (gets a producer);
  // also record their stage join time for the StageTimer display.
  useEffect(function() {
    var now = Date.now();
    // Record own join time once
    if (!stageJoinTimesRef.current[userId]) stageJoinTimesRef.current[userId] = now;
    guests.forEach(function(g) {
      var gid = g.guestId || g.userId;
      if (gid && (g.producerId || g.audioProducerId) && !stageJoinTimesRef.current[gid]) {
        stageJoinTimesRef.current[gid] = now;
        if (gid !== userId) {
          var _announceName = g.username || gid;
          if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
          setStageAnnounce({ username: _announceName });
          announceTimerRef.current = setTimeout(function() { setStageAnnounce(null); }, 3500);
          // Stage join ping — two ascending tones
          if (joinSoundEnabledRef.current) {
            try {
              var _jctx = new (window.AudioContext || window.webkitAudioContext)();
              [440, 660].forEach(function(freq, i) {
                var _o = _jctx.createOscillator();
                var _g = _jctx.createGain();
                _o.connect(_g); _g.connect(_jctx.destination);
                _o.frequency.value = freq;
                _o.type = 'sine';
                _g.gain.setValueAtTime(0.18, _jctx.currentTime + i * 0.12);
                _g.gain.exponentialRampToValueAtTime(0.001, _jctx.currentTime + i * 0.12 + 0.25);
                _o.start(_jctx.currentTime + i * 0.12);
                _o.stop(_jctx.currentTime + i * 0.12 + 0.25);
              });
              setTimeout(function() { _jctx.close(); }, 800);
            } catch(e) {}
          }
          // Activity log entry
          setActivityLog(function(prev) { return [{ id: Date.now() + '_join_' + gid, type: 'join', msg: '🎤 ' + _announceName + ' joined stage', ts: Date.now() }].concat(prev).slice(0, 100); });
        }
      }
    });
    setRaisedHands(function(prev) {
      var changed = false;
      var next = Object.assign({}, prev);
      guests.forEach(function(g) {
        var gid = g.guestId || g.userId;
        if (gid && next[gid] && (g.producerId || g.audioProducerId)) {
          delete next[gid];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [guests]);

  // Camera PiP: wire own camera feed into the PiP video element while screen sharing
  useEffect(function() {
    var vid = pipVideoRef.current;
    if (!isScreenSharing || !vid) return;
    var track = cameraTrackRef.current;
    if (!track || track.readyState === 'ended') return;
    try {
      vid.srcObject = new MediaStream([track]);
      vid.play().catch(function() {});
    } catch(e) {}
    return function() {
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = null;
      }
    };
  }, [isScreenSharing]);

  var toggleMute = function() { setIsMuted(function(v) { return !v; }); }
  var toggleCam = function() {
    setIsCamOff(function(v) {
      var next = !v;
      if (socket) socket.emit('toggle-cam', { roomId: roomId, camOff: next });
      return next;
    });
  }

  var addChatReaction = function(msgId, emoji) {
    if (!socket || !msgId) return;
    socket.emit('chat-react', { roomId: roomId, msgId: msgId, emoji: emoji });
  }

  var sendChat = function() {
    if (slowWaitSec > 0) return;
    var msg = chatInput.trim();
    if (!msg || !socket) return;
    // Slash commands (host / cohost only)
    if ((role === 'host' || role === 'cohost') && msg.charAt(0) === '/') {
      setChatInput(''); setChatCmdHint(false);
      var parts = msg.slice(1).split(' ');
      var cmd = parts[0].toLowerCase();
      var arg = parts.slice(1).join(' ').trim();
      if (cmd === 'slow' || cmd === 'slowmode') {
        var slashSec = parseInt(arg, 10); if (isNaN(slashSec)) slashSec = 0;
        socket.emit('set-slow-mode', { roomId: roomId, seconds: slashSec });
        if (addToastRef.current) addToastRef.current('Slow mode: ' + (slashSec > 0 ? slashSec + 's' : 'off'), 'info');
      } else if (cmd === 'shout' || cmd === 'shoutout') {
        socket.emit('shoutout', { roomId: roomId, username: arg.replace(/^@/, '') || '?', by: username || 'Host' });
      } else if (cmd === 'confetti') {
        socket.emit('confetti-burst', { roomId: roomId });
      } else if (cmd === 'clip') {
        socket.emit('clip-marker', { roomId: roomId, label: arg || 'Manual clip' });
        if (addToastRef.current) addToastRef.current('Clip marked', 'success');
      } else if (cmd === 'mute') {
        var muteUn = arg.replace(/^@/, '').toLowerCase();
        var muteG = onStage.find(function(g) { return (g.username || '').toLowerCase() === muteUn; });
        if (muteG) socket.emit('mute-guest', { roomId: roomId, guestId: muteG.guestId || muteG.userId });
        else if (addToastRef.current) addToastRef.current('Not on stage: ' + arg, 'warning');
      } else if (cmd === 'ticker') {
        socket.emit('ticker-start', { roomId: roomId, text: arg }); setTickerInput(arg);
        if (addToastRef.current) addToastRef.current('Ticker started', 'info');
      } else if (cmd === 'help') {
        if (addToastRef.current) addToastRef.current('/slow [s]  /shout @user  /confetti  /clip [label]  /mute @user  /ticker [text]', 'info');
      } else {
        if (addToastRef.current) addToastRef.current('Unknown command /' + cmd + '  — try /help', 'warning');
      }
      return;
    }
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: msg });
    setChatInput('');
  }

  var sendGif = function() {
    if (slowWaitSec > 0) return;
    var url = gifInput.trim();
    if (!url || !socket) return;
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: url, type: 'gif' });
    setGifInput('');
    setShowGifInput(false);
  }

  var raiseHand = function() {
    var next = !handRaised;
    setHandRaised(next);
    if (socket && next)  socket.emit('hand-raise', { roomId: roomId, guestId: userId, username: username });
    if (socket && !next) socket.emit('hand-lower', { roomId: roomId, guestId: userId });
    if (addToast) addToast(next ? '✋ Hand raised — waiting for host' : 'Hand lowered', 'info');
  }

  var sendReact = function(emoji) {
    var fid = Date.now() + Math.random();
    setFloatReacts(function(r) { return r.concat([{ emoji: emoji, fid: fid }]); });
    floatTimersRef.current.add(setTimeout(function() { setFloatReacts(function(r) { return r.filter(function(x) { return x.fid !== fid; }); }); }, 2200));
    if (socket) socket.emit('viewer-react', { roomId: roomId, userId: userId, emoji: emoji });
    setReactsOpen(false);
  }

  var stopScreenShare = function() {
    setIsScreenSharing(false);
    setStageLayout('grid');
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    // Restore camera simulcast — back to motion-optimized downscale profile
    var _topBR = medConf && medConf.preset && medConf.preset.bitrate ? Math.min(medConf.preset.bitrate, 5000000) : 900000;
    rtcManager.setVideoEncodings([
      { rid: 'r0', maxBitrate: Math.round(_topBR * 0.11), scaleResolutionDownBy: 4 },
      { rid: 'r1', maxBitrate: Math.round(_topBR * 0.33), scaleResolutionDownBy: 2 },
      { rid: 'r2', maxBitrate: _topBR, scaleResolutionDownBy: 1 },
    ]).catch(function() {});
    // Restore camera: use the saved track if still live, else re-acquire
    if (cameraTrackRef.current && cameraTrackRef.current.readyState !== 'ended') {
      if ('contentHint' in cameraTrackRef.current) cameraTrackRef.current.contentHint = 'motion';
      rtcManager.replaceTrack('video', cameraTrackRef.current).catch(function() {});
    } else {
      navigator.mediaDevices.getUserMedia({ video: true }).then(function(s) {
        var t = s.getVideoTracks()[0];
        if (t) {
          if ('contentHint' in t) t.contentHint = 'motion';
          cameraTrackRef.current = t;
          rtcManager.replaceTrack('video', t).catch(function() {});
        }
      }).catch(function() {});
    }
    // Restore microphone if screen audio was captured and replaced the mic track
    if (micTrackRef.current && rtcManager) {
      rtcManager.replaceTrack('audio', micTrackRef.current).catch(function() {});
      micTrackRef.current = null;
    }
    if (socket) socket.emit('screen-share-stop', { roomId: roomId });
    if (addToast) addToast('Screen share ended — camera restored', 'info');
  }

  var startScreenShare = async function() {
    if (!rtcManager || !rtcManager.producers || !rtcManager.producers['video']) {
      if (addToast) addToast('Go live first to share your screen', 'error');
      return;
    }
    try {
      var displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: { sampleRate: 48000, channelCount: 2, echoCancellation: false, noiseSuppression: false }
      });
      var videoTrack = displayStream.getVideoTracks()[0];
      if (!videoTrack) { displayStream.getTracks().forEach(function(t) { t.stop(); }); return; }
      // Tell the browser encoder this is screen content (sharp edges, text) not motion video
      if ('contentHint' in videoTrack) videoTrack.contentHint = 'detail';
      videoTrack.addEventListener('ended', stopScreenShare);
      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);
      setStageLayout('featured');
      setFeaturedId(userId);
      rtcManager.replaceTrack('video', videoTrack);
      // Optimize simulcast for screen content: reduce downscale so low layers remain readable;
      // increase bitrate so text stays crisp at all layers.
      rtcManager.setVideoEncodings([
        { rid: 'r0', maxBitrate: 300000, scaleResolutionDownBy: 2 },
        { rid: 'r1', maxBitrate: 800000, scaleResolutionDownBy: 1 },
        { rid: 'r2', maxBitrate: 2000000, scaleResolutionDownBy: 1 },
      ]).catch(function() {});
      // If browser provided system/tab audio, route it through the audio producer
      var screenAudioTrack = displayStream.getAudioTracks()[0];
      var ap = rtcManager.producers && rtcManager.producers['audio'];
      if (screenAudioTrack && ap && ap.track) {
        micTrackRef.current = ap.track;
        rtcManager.replaceTrack('audio', screenAudioTrack).catch(function() {});
      }
      if (socket) socket.emit('screen-share-start', { roomId: roomId, userId: userId, username: username });
      if (addToast) addToast('Screen share active — viewers now see your screen', 'success');
    } catch(e) {
      if (e.name !== 'NotAllowedError') {
        if (addToast) addToast('Screen share failed: ' + e.message, 'error');
      }
    }
  }

  var submitPoll = function() {
    if (!socket || !pollDraft.q.trim()) return;
    var opts = pollDraft.opts.filter(function(o) { return o.trim(); });
    if (opts.length < 2) { if (addToast) addToast('Need at least 2 options', 'error'); return; }
    socket.emit('poll-start', { roomId: roomId, question: pollDraft.q.trim(), options: opts });
    setShowPollCreate(false);
    setPollDraft({ q: '', opts: ['', '', '', ''] });
    if (addToast) addToast('Poll launched!', 'success');
  }

  var votePoll = function(idx) {
    if (!socket || pollVoted) return;
    socket.emit('poll-vote', { roomId: roomId, optionIdx: idx });
    setPollVoted(true);
    setActivePoll(function(p) {
      if (!p) return p;
      var opts = p.opts.map(function(o, i) {
        return i === idx ? { text: o.text, votes: o.votes + 1 } : o;
      });
      return { q: p.q, opts: opts };
    });
  }

  var submitQa = function() {
    var text = qaInput.trim();
    if (!text || !socket) return;
    var qid = Date.now() + '-' + userId;
    socket.emit('qa-question', { roomId: roomId, id: qid, username: username, text: text });
    setQaInput('');
    if (addToast) addToast('Question sent!', 'success');
  }

  var startVs = function() {
    if (!socket || !vsDraft.sideA.trim() || !vsDraft.sideB.trim()) return;
    var dur = Math.min(300, Math.max(10, parseInt(vsDraft.duration) || 60));
    socket.emit('vs-start', { roomId: roomId, sideA: vsDraft.sideA.trim(), sideB: vsDraft.sideB.trim(), durationSec: dur });
    setShowVsCreate(false);
    setVsDraft({ sideA: '', sideB: '', duration: '60' });
    if (addToast) addToast('VS Poll launched!', 'success');
  }

  var submitJudgeScore = function() {
    var s = parseInt(judgeScoreVal);
    if (!socket || isNaN(s) || s < 0 || s > 10) { if (addToast) addToast('Score must be 0–10', 'error'); return; }
    socket.emit('judge-score', { roomId: roomId, score: s, label: judgeScoreLabel.trim() });
    setJudgeScoreVal('');
    setJudgeScoreLabel('');
    if (addToast) addToast('Score submitted!', 'success');
  }

  // ── Fullscreen ───────────────────────────────────────────────────────────
  useEffect(function() {
    var onFsChange = function() {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return function() {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  var toggleFullscreen = function() {
    var el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) { el.requestFullscreen(); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    } else {
      if (document.exitFullscreen) { document.exitFullscreen(); }
      else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    }
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  // m = mute/unmute, v = cam toggle, f = fullscreen, x = mirror
  // [/ArrowLeft = prev guest in featured, ]/ArrowRight = next guest, Escape = close modals
  // Skipped when focus is inside an input or textarea.
  useEffect(function() {
    var onKey = function(e) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'm' || e.key === 'M') { toggleMute(); }
      else if (e.key === 'v' || e.key === 'V') { toggleCam(); }
      else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
      else if (e.key === 'x' || e.key === 'X') { setMirrorSelf(function(v) { return !v; }); }
      else if ((e.key === '[' || e.key === 'ArrowLeft') && stageLayout === 'featured') { prevGuest(); }
      else if ((e.key === ']' || e.key === 'ArrowRight') && stageLayout === 'featured') { nextGuest(); }
      else if (e.key === '1') { setStageLayout('grid'); }
      else if (e.key === '2') { setStageLayout('featured'); }
      else if (e.key === '3') { setStageLayout('split'); }
      else if (e.key === '+' || e.key === '=') { setGridDensity(function(d) { return Math.min(2, d + 1); }); }
      else if (e.key === '-' || e.key === '_') { setGridDensity(function(d) { return Math.max(-2, d - 1); }); }
      else if (e.key === '?') { setShowKeyHelp(function(v) { return !v; }); }
      else if ((e.key === 'w' || e.key === 'W') && (role === 'host' || role === 'cohost')) { setAutoLayout(function(v) { return !v; }); }
      else if (e.key === 'Escape') {
        if (showKeyHelp) { setShowKeyHelp(false); }
        else if (showBroadcastInput) { setShowBroadcastInput(false); }
        else if (swapMode) { setSwapMode(false); setSwapPickGid(null); }
        else if (showActivityLog) { setShowActivityLog(false); }
        else if (expandedCell) { setExpandedCell(null); }
        else if (cellMenuId) { setCellMenuId(null); setRemoveConfirmId(null); setRenamingGid(null); setMsgTargetGid(null); }
      }
    };
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [expandedCell, cellMenuId, stageLayout, featuredId, showKeyHelp, showActivityLog, showBroadcastInput, swapMode]);

  var shareRoom = function() {
    var url = window.location.origin + (roomId !== '6990f5f2-4823-453e-a1fc-dc9d00000000' ? ('?room=' + roomId) : '');
    if (navigator.share) {
      navigator.share({ title: 'SeeWhy LIVE', text: 'Watch live domino action on SeeWhy LIVE!', url: url });
    } else {
      navigator.clipboard.writeText(url).then(function() {
        if (addToast) addToast('Room link copied!', 'success');
      }).catch(function() {
        if (addToast) addToast('seewhylive.online', 'info');
      });
    }
  }

  var openPayLink = function(platform, handle) {
    if (!handle || !handle.trim()) {
      if (addToast) addToast('Host hasn\'t set up ' + platform.name + ' yet', 'info');
      return;
    }
    if (platform.buildUrl) {
      window.open(platform.buildUrl(handle.trim()), '_blank', 'noopener');
    } else {
      navigator.clipboard.writeText(handle.trim()).then(function() {
        if (addToast) addToast(platform.name + ': ' + handle + ' copied!', 'success');
      }).catch(function() {
        if (addToast) addToast(platform.name + ': ' + handle, 'info');
      });
    }
  }

  var openSocialShare = function(platform, roomUrl, msg) {
    if (platform.open && platform.buildUrl) {
      window.open(platform.buildUrl(roomUrl, msg), '_blank', 'noopener,width=600,height=450');
    } else {
      navigator.clipboard.writeText(msg + ' ' + roomUrl).then(function() {
        if (addToast) addToast(platform.name + ': link copied — paste to share!', 'success');
      }).catch(function() {
        if (addToast) addToast('Link: ' + roomUrl, 'info');
      });
    }
  }

  var startRecording = function() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function(stream) {
      recChunksRef.current = [];
      var opts = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? { mimeType: 'video/webm;codecs=vp9' } : {};
      var mr = new MediaRecorder(stream, opts);
      mr.ondataavailable = function(e) { if (e.data && e.data.size > 0) recChunksRef.current.push(e.data); };
      mr.onstop = function() {
        var blob = new Blob(recChunksRef.current, { type: 'video/webm' });
        if (recUrlRef.current) URL.revokeObjectURL(recUrlRef.current);
        var url  = URL.createObjectURL(blob);
        recUrlRef.current = url;
        setRecUrl(url);
        setRecState('done');
        stream.getTracks().forEach(function(t) { t.stop(); });
        clearInterval(recTimerRef.current);
        // Persist to IndexedDB so VOD Library can access it
        var clipId = 'clip-' + Date.now();
        var dur    = recSecondsRef.current;
        saveClip(clipId, blob, {
          title:    'Clip ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          duration: dur,
          ts:       Date.now(),
          size:     blob.size,
        }).catch(function() {});
      };
      mr.start(1000);
      mediaRecRef.current = mr;
      setRecState('recording');
      recSecondsRef.current = 0;
      setRecSeconds(0);
      recTimerRef.current = setInterval(function() {
        recSecondsRef.current = recSecondsRef.current + 1;
        var next = recSecondsRef.current;
        setRecSeconds(next);
        if (next >= 600) {
          clearInterval(recTimerRef.current);
          mr.stop();
        }
      }, 1000);
    }).catch(function() {
      if (addToast) addToast('Camera access required to record', 'error');
    });
  }

  var stopRecording = function() {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    clearInterval(recTimerRef.current);
  }

  var fmtTime = function(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  useEffect(function() {
    try { localStorage.setItem('sw_stream_keys', JSON.stringify(liveKeys)); } catch(e) {}
  }, [liveKeys]);

  useEffect(function() {
    try { localStorage.setItem('sw_stream_title', liveTitle); } catch(e) {}
  }, [liveTitle]);

  useEffect(function() {
    try { localStorage.setItem('sw_stream_dests', JSON.stringify(liveDestinations)); } catch(e) {}
  }, [liveDestinations]);

  useEffect(function() {
    try { localStorage.setItem('sw_custom_rtmp_url', customRtmpUrl); } catch(e) {}
  }, [customRtmpUrl]);

  useEffect(function() {
    try { localStorage.setItem('sw_custom_rtmp_key', customRtmpKey); } catch(e) {}
  }, [customRtmpKey]);

  var goLive = function() {
    if (!socket) return;
    var dests = [];
    var platformUrls = {
      youtube:  'rtmp://a.rtmp.youtube.com/live2',
      tiktok:   'rtmp://push.rtmp.tiktok.com/live',
      twitch:   'rtmp://live.twitch.tv/app',
      facebook: 'rtmps://live-api-s.facebook.com:443/rtmp',
      kick:     'rtmp://fa723fc1b171.global-contribute.live-video.net/app',
      rumble:   'rtmp://p.contribute.live-video.net/live'
    };
    Object.keys(liveDestinations).forEach(function(platform) {
      if (!liveDestinations[platform]) return;
      var key = liveKeys[platform] ? String(liveKeys[platform]).trim() : '';
      if (!key) return;
      var url = platformUrls[platform];
      if (!url) return;
      dests.push({ platform: platform, url: url + '/' + key, streamKey: key });
    });
    if (customRtmpEnabled) {
      var cUrl = customRtmpUrl.trim();
      var cKey = customRtmpKey.trim();
      if (cUrl && cKey) {
        dests.push({ platform: 'custom', url: cUrl + '/' + cKey, rtmpUrl: cUrl, streamKey: cKey });
      }
    }
    socket.emit('go-live', {
      roomId: roomId,
      streamTitle: liveTitle.trim() || '',
      destinations: dests
    });
    setShowLiveModal(false);
  }

  var endStream = function() {
    if (!socket) return;
    if (isScreenSharing) stopScreenShare();
    socket.emit('end-broadcast', { roomId: roomId });
    if (setIsLive) setIsLive(false);
    if (addToast) addToast('Stream ended', 'info');
  }

  var exportStageStatsCsv = function(rows) {
    var lines = ['Name,Role,SpeakSecs,StageSecs,Quality,GiftsCents'];
    rows.forEach(function(r) {
      var cols = [r.name, r.guestRole || 'guest', r.speakSecs || 0, r.stageSecs || 0, r.q || '', r.gifts || 0];
      lines.push(cols.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'stage-stats-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Build participant arrays ──
  var allGuestMap = {};
  allGuestMap[userId] = { guestId: userId, username: username, role: role };
  guests.forEach(function(g) {
    var gid = g.guestId || g.userId;
    if (gid) allGuestMap[gid] = g;
  });

  var allParticipants = (function() {
    var own  = allGuestMap[userId] || { guestId: userId, username: username, role: role };
    var seen = {};
    seen[userId] = true;
    var others = guests.map(function(g) {
      var gid = g.guestId || g.userId;
      if (!gid || seen[gid]) return null;
      seen[gid] = true;
      return allGuestMap[gid] || g;
    }).filter(Boolean);
    return [own].concat(others).slice(0, MAX_STAGE);
  })();

  // On-stage = self + any guest that has a video producer (actively streaming)
  var onStage = allParticipants.filter(function(g) {
    var gid = g.guestId || g.userId;
    return gid === userId || g.producerId || g.audioProducerId;
  });
  if (onStage.length === 0) {
    onStage = [allGuestMap[userId] || { guestId: userId, username: username, role: role }];
  }

  var audienceList = allParticipants.filter(function(g) {
    var gid = g.guestId || g.userId;
    if (gid === userId) return false;
    return !g.producerId && !g.audioProducerId;
  });

  // Dominant speaker: guest with most speaking time (≥30 s threshold)
  var topSpeakerId = null;
  var topSpeakSecs = 30;
  onStage.forEach(function(g) {
    var gid  = g.guestId || g.userId;
    var secs = speakingSnapshots[gid] || 0;
    if (secs > topSpeakSecs) { topSpeakSecs = secs; topSpeakerId = gid; }
  });

  // Sorted stage array according to stageSort mode or stageOrderOverride
  var sortedOnStage = (function() {
    var arr = onStage.slice();
    if (stageOrderOverride && stageOrderOverride.length > 0) {
      arr.sort(function(a, b) {
        var ia = stageOrderOverride.indexOf(a.guestId || a.userId);
        var ib = stageOrderOverride.indexOf(b.guestId || b.userId);
        if (ia < 0) ia = 9999;
        if (ib < 0) ib = 9999;
        return ia - ib;
      });
      return arr;
    }
    if (stageSort === 'speaking') {
      arr.sort(function(a, b) {
        var sa = speakingSnapshots[a.guestId || a.userId] || 0;
        var sb = speakingSnapshots[b.guestId || b.userId] || 0;
        return sb - sa;
      });
    } else if (stageSort === 'quality') {
      var qRank = function(g) {
        var q = producerQuality[g.producerId];
        return q === 'green' ? 0 : q === 'yellow' ? 1 : q === 'red' ? 2 : 3;
      };
      arr.sort(function(a, b) { return qRank(a) - qRank(b); });
    }
    return arr;
  })();

  // Top gifter this session — show 👑 in audience circle
  var topGifterId = null;
  var topGiftMax  = 0;
  Object.keys(guestGiftTotals).forEach(function(gid) {
    var v = guestGiftTotals[gid] || 0;
    if (v > topGiftMax) { topGiftMax = v; topGifterId = gid; }
  });

  // Grid sizing
  var n    = onStage.length;
  var cols = Math.max(1, (n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5) + gridDensity);
  // Cell aspect ratio → CSS padding-bottom trick
  var cellAspectPb = cellAspect === '4:3' ? '75%' : cellAspect === '9:16' ? '177.78%' : '56.25%';
  var sz   = n <= 2 ? 160 : n <= 4 ? 130 : n <= 9 ? 100 : 80;

  // Host info
  var hostEntry = guests.find(function(g) { return g.role === 'host'; }) || allGuestMap[userId];
  var hostName  = (hostEntry && (hostEntry.username || hostEntry.guestId)) || username || 'Host';

  // Current speaker
  var speakerName = null;
  Object.keys(speakingIds).forEach(function(gid) {
    if (speakingIds[gid] && allGuestMap[gid]) {
      speakerName = (allGuestMap[gid].username || allGuestMap[gid].guestId) || null;
    }
  });

  // Featured guest for single-focus layout
  var featuredGuest = allGuestMap[featuredId] || onStage[0] || { guestId: userId, username: username, role: role };

  var newMsgCount = chat ? chat.length : 0;

  // Sorted queue of raised hands (oldest first = first in line)
  var handQueue = Object.keys(raisedHands).filter(function(gid) { return !!raisedHands[gid]; })
    .sort(function(a, b) { return raisedHands[a] - raisedHands[b]; });

  // Featured-mode guest navigator helpers
  var prevGuest = function() {
    if (onStage.length <= 1) return;
    var idx = onStage.findIndex(function(g) { return (g.guestId || g.userId) === featuredId; });
    var prev = onStage[(idx - 1 + onStage.length) % onStage.length];
    if (prev) { setFeaturedId(prev.guestId || prev.userId); setAutoFocusSpeaker(false); }
  };
  var nextGuest = function() {
    if (onStage.length <= 1) return;
    var idx = onStage.findIndex(function(g) { return (g.guestId || g.userId) === featuredId; });
    var next = onStage[(idx + 1) % onStage.length];
    if (next) { setFeaturedId(next.guestId || next.userId); setAutoFocusSpeaker(false); }
  };

  // Cycle to next available camera and update medConf.camId
  var handleCamFlip = function() {
    if (avCameras.length < 2) return;
    var nextIdx = (camDevIdx + 1) % avCameras.length;
    setCamDevIdx(nextIdx);
    var nextCam = avCameras[nextIdx];
    setMedConf(function(prev) { return Object.assign({}, prev || {}, { camId: nextCam.deviceId }); });
    if (addToast) addToast('Camera: ' + (nextCam.label || 'Camera ' + (nextIdx + 1)), 'info');
  };

  // Cycle to next available microphone
  var handleMicFlip = function() {
    if (avMics.length < 2) return;
    var nextIdx = (micDevIdx + 1) % avMics.length;
    var nextMic = avMics[nextIdx];
    setMicDevIdx(nextIdx);
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: nextMic.deviceId } } }).then(function(stream) {
      var track = stream.getAudioTracks()[0];
      if (!track) return;
      if (rtcManager && rtcManager.producers && rtcManager.producers['audio']) {
        rtcManager.replaceTrack('audio', track).catch(function() {});
      }
      if (addToast) addToast('Mic: ' + (nextMic.label || 'Mic ' + (nextIdx + 1)), 'info');
    }).catch(function(e) {
      if (addToast) addToast('Mic swap failed: ' + e.message, 'error');
    });
  };

  // Select camera by index (device picker sheet)
  var handleCamSelect = function(idx) {
    if (idx === camDevIdx || idx >= avCameras.length) return;
    var cam = avCameras[idx];
    setCamDevIdx(idx);
    setMedConf(function(prev) { return Object.assign({}, prev || {}, { camId: cam.deviceId }); });
    if (addToast) addToast('Camera: ' + (cam.label || 'Camera ' + (idx + 1)), 'info');
    setShowDevicePicker(false);
  };

  // Select mic by index (device picker sheet)
  var handleMicSelect = function(idx) {
    if (idx === micDevIdx || idx >= avMics.length) return;
    var mic = avMics[idx];
    setMicDevIdx(idx);
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: mic.deviceId } } }).then(function(stream) {
      var track = stream.getAudioTracks()[0];
      if (!track) return;
      if (rtcManager && rtcManager.producers && rtcManager.producers['audio']) {
        rtcManager.replaceTrack('audio', track).catch(function() {});
      }
      if (addToast) addToast('Mic: ' + (mic.label || 'Mic ' + (idx + 1)), 'info');
    }).catch(function(e) {
      if (addToast) addToast('Mic swap failed: ' + e.message, 'error');
    });
    setShowDevicePicker(false);
  };

  // Layout preset helpers
  var saveLayoutPreset = function(name) {
    var preset = { id: Date.now().toString(), name: name || ('Layout ' + (layoutPresets.length + 1)), layout: stageLayout, order: stageOrderOverride ? stageOrderOverride.slice() : null, ts: Date.now() };
    var updated = layoutPresets.concat([preset]);
    setLayoutPresets(updated);
    try { localStorage.setItem('sw_layout_presets', JSON.stringify(updated)); } catch(e) {}
    if (addToastRef.current) addToastRef.current('Preset "' + preset.name + '" saved', 'success');
  };
  var loadLayoutPreset = function(preset) {
    setStageLayout(preset.layout || 'grid');
    setStageOrderOverride(preset.order || null);
    if (addToastRef.current) addToastRef.current('Loaded "' + preset.name + '"', 'info');
    setShowPresetsPanel(false);
  };
  var deleteLayoutPreset = function(id) {
    var updated = layoutPresets.filter(function(p) { return p.id !== id; });
    setLayoutPresets(updated);
    try { localStorage.setItem('sw_layout_presets', JSON.stringify(updated)); } catch(e) {}
  };

  // Background blur: canvas-based soft-focus on own camera feed
  var toggleBgBlur = async function() {
    if (bgBlurOn) {
      if (bgBlurRafRef.current) { cancelAnimationFrame(bgBlurRafRef.current); bgBlurRafRef.current = null; }
      if (bgBlurVideoRef.current) { bgBlurVideoRef.current.srcObject = null; bgBlurVideoRef.current = null; }
      if (bgBlurStreamRef.current) { bgBlurStreamRef.current.getTracks().forEach(function(t) { t.stop(); }); bgBlurStreamRef.current = null; }
      setBgBlurOn(false);
      setShowBlurSlider(false);
      var rawTrack = cameraTrackRef.current;
      if (rawTrack && !isCamOff && rtcManager.sendTransport) {
        var rawStream = new MediaStream([rawTrack]);
        rtcManager.publishStream(rawStream, { maxBitrate: (medConf && medConf.maxBitrate) || 900000 }).catch(function() {});
      }
      return;
    }
    var rawTrack = cameraTrackRef.current;
    if (!rawTrack) { if (addToastRef.current) addToastRef.current('Camera not active', 'error'); return; }
    if (isCamOff)  { if (addToastRef.current) addToastRef.current('Turn camera on first', 'error'); return; }
    try {
      var vid = document.createElement('video');
      vid.autoplay = true; vid.muted = true; vid.playsInline = true;
      vid.srcObject = new MediaStream([rawTrack]);
      await new Promise(function(res, rej) { vid.onloadedmetadata = res; setTimeout(rej, 5000); });
      vid.play();
      bgBlurVideoRef.current = vid;
      var settings = rawTrack.getSettings();
      var canvas = document.createElement('canvas');
      canvas.width  = settings.width  || 640;
      canvas.height = settings.height || 480;
      var ctx = canvas.getContext('2d');
      var blurDraw = function() {
        if (!bgBlurVideoRef.current) return;
        ctx.filter = 'blur(' + bgBlurLevelRef.current + 'px)';
        ctx.drawImage(bgBlurVideoRef.current, 0, 0, canvas.width, canvas.height);
        bgBlurRafRef.current = requestAnimationFrame(blurDraw);
      };
      blurDraw();
      var captured = canvas.captureStream(30);
      bgBlurStreamRef.current = captured;
      setBgBlurOn(true);
      setShowBlurSlider(false);
      await rtcManager.publishStream(captured, { maxBitrate: (medConf && medConf.maxBitrate) || 900000 });
      if (addToastRef.current) addToastRef.current('Soft blur active', 'success');
    } catch(e) {
      if (bgBlurRafRef.current) { cancelAnimationFrame(bgBlurRafRef.current); bgBlurRafRef.current = null; }
      if (bgBlurVideoRef.current) { bgBlurVideoRef.current.srcObject = null; bgBlurVideoRef.current = null; }
      if (bgBlurStreamRef.current) { bgBlurStreamRef.current.getTracks().forEach(function(t) { t.stop(); }); bgBlurStreamRef.current = null; }
      if (addToastRef.current) addToastRef.current('Blur unavailable', 'error');
    }
  };

  // Noise suppression: HighPass + DynamicsCompressor chain over live mic track
  var playSoundboardEffect = function(name) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var now = ctx.currentTime;
      var mkOsc = function(freq, start, end, type) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + end);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + start); o.stop(now + end + 0.05);
      };
      if (name === 'applause') {
        var buf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
        var ch = buf.getChannelData(0);
        for (var i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.min(1, i / (ctx.sampleRate * 0.1)) * Math.max(0, 1 - i / (ctx.sampleRate * 1.2));
        var src = ctx.createBufferSource();
        var lpf = ctx.createBiquadFilter(); lpf.type = 'bandpass'; lpf.frequency.value = 1200; lpf.Q.value = 0.5;
        var gn = ctx.createGain(); gn.gain.value = 0.6;
        src.buffer = buf; src.connect(lpf); lpf.connect(gn); gn.connect(ctx.destination);
        src.start(now); src.stop(now + 1.2);
      } else if (name === 'drumroll') {
        for (var di = 0; di < 32; di++) { mkOsc(60 + Math.random() * 20, di * 0.03, di * 0.03 + 0.05, 'sawtooth'); }
      } else if (name === 'airhorn') {
        mkOsc(233, 0, 0.8, 'sawtooth'); mkOsc(466, 0, 0.8, 'sawtooth'); mkOsc(116, 0, 0.8, 'square');
      } else if (name === 'chaching') {
        mkOsc(1318, 0, 0.12); mkOsc(1047, 0.05, 0.18); mkOsc(1568, 0.1, 0.28); mkOsc(2093, 0.15, 0.36);
      } else if (name === 'fanfare') {
        mkOsc(523, 0, 0.18); mkOsc(659, 0.16, 0.34); mkOsc(784, 0.32, 0.5); mkOsc(1046, 0.48, 0.72);
      } else if (name === 'boom') {
        mkOsc(55, 0, 0.6, 'sine'); mkOsc(40, 0, 0.5, 'sine');
      }
      setTimeout(function() { try { ctx.close(); } catch(e) {} }, 2000);
    } catch(e) {}
  };

  var toggleNoiseSuppression = function() {
    if (noiseSuppOn) {
      if (nsAudioCtxRef.current) {
        try { nsAudioCtxRef.current.close(); } catch(e) {}
        nsAudioCtxRef.current = null;
        nsDestRef.current = null;
      }
      setNoiseSuppOn(false);
      var rawT = nsRawTrackRef.current;
      nsRawTrackRef.current = null;
      if (rawT && rtcManager.producers && rtcManager.producers['audio']) {
        try { rtcManager.replaceTrack('audio', rawT); } catch(e) {}
      }
      if (addToastRef.current) addToastRef.current('Noise suppression off', 'info');
      return;
    }
    var prod = rtcManager.producers && rtcManager.producers['audio'];
    if (!prod || !prod.track) { if (addToastRef.current) addToastRef.current('Mic not active', 'error'); return; }
    var liveTrack = prod.track;
    try {
      var nsCtx = new (window.AudioContext || window.webkitAudioContext)();
      var src = nsCtx.createMediaStreamSource(new MediaStream([liveTrack]));
      var hpf = nsCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 100;
      var comp = nsCtx.createDynamicsCompressor();
      comp.threshold.value = -30;
      comp.knee.value = 10;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;
      var dest = nsCtx.createMediaStreamDestination();
      src.connect(hpf);
      hpf.connect(comp);
      comp.connect(dest);
      nsAudioCtxRef.current = nsCtx;
      nsDestRef.current = dest;
      nsRawTrackRef.current = liveTrack;
      var processedTrack = dest.stream.getAudioTracks()[0];
      rtcManager.replaceTrack('audio', processedTrack);
      setNoiseSuppOn(true);
      if (addToastRef.current) addToastRef.current('Noise suppression on', 'success');
    } catch(e) {
      if (nsAudioCtxRef.current) { try { nsAudioCtxRef.current.close(); } catch(ee) {} nsAudioCtxRef.current = null; }
      nsRawTrackRef.current = null;
      nsDestRef.current = null;
      if (addToastRef.current) addToastRef.current('NS unavailable', 'error');
    }
  };

  // Browser native PiP: pins featured guest (or first on-stage) into a floating window
  var toggleBrowserPip = function() {
    if (!document.pictureInPictureEnabled) {
      if (addToastRef.current) addToastRef.current('PiP not supported in this browser', 'error');
      return;
    }
    if (pipActive) {
      try { document.exitPictureInPicture(); } catch(e) {}
      setPipActive(false);
      return;
    }
    var targetGid = spotlightGid || (sortedOnStage.length > 0 ? sortedOnStage[0].guestId : null);
    if (!targetGid) { if (addToastRef.current) addToastRef.current('No one on stage', 'error'); return; }
    var vid = document.querySelector('[data-cell-gid="' + targetGid + '"] video');
    if (!vid) { if (addToastRef.current) addToastRef.current('Video not found', 'error'); return; }
    vid.requestPictureInPicture().then(function(pipWin) {
      setPipActive(true);
      pipWin.addEventListener('leavepictureinpicture', function() { setPipActive(false); }, { once: true });
    }).catch(function() {
      if (addToastRef.current) addToastRef.current('PiP unavailable', 'error');
    });
  };

  // Chat export: downloads all chat messages as plain text
  var downloadChat = function() {
    if (!chat || chat.length === 0) { if (addToastRef.current) addToastRef.current('No chat to export', 'info'); return; }
    var lines = chat.map(function(m) {
      var ts = m.ts ? new Date(m.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      return '[' + ts + '] ' + (m.username || 'Guest') + ': ' + (m.message || '');
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = 'seewhy-chat-' + new Date().toISOString().slice(0, 10) + '.txt'; a.click();
    URL.revokeObjectURL(url);
    if (addToastRef.current) addToastRef.current('Chat exported', 'success');
  };

  // Stage ticker: host broadcasts a scrolling text banner to all viewers
  var startTicker = function(text) {
    if (!text || !text.trim()) return;
    if (socket) socket.emit('ticker-start', { text: text.trim().slice(0, 200) });
    setTickerInput('');
    setShowTickerInput(false);
  };

  var stopTicker = function() {
    if (socket) socket.emit('ticker-stop');
  };

  // Merged lower-thirds: local host overrides merged over server overlayConfig
  var mergedLowerThirds = (function() {
    var base = (overlayConfig && overlayConfig.lowerThirds) || {};
    var hasLocal = Object.keys(localLowerThirds).length > 0;
    return hasLocal ? Object.assign({}, base, localLowerThirds) : base;
  })();

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, overflow: 'hidden', position: 'relative', fontFamily: "'Barlow Condensed',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* ── Inbound private host message banner ── */}
      {inboundHostMsg && role !== 'host' && (
        <div style={{ position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)', zIndex: 62, animation: 'announceIn .3s ease', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,.18)', border: '1px solid rgba(201,168,76,.6)', borderRadius: 20, padding: '8px 18px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,.6)', whiteSpace: 'nowrap', maxWidth: '80%' }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>📨</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, letterSpacing: .5, flexShrink: 0 }}>{inboundHostMsg.from}</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis' }}>{inboundHostMsg.text}</span>
          <button onClick={function() { setInboundHostMsg(null); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* ── Broadcast overlay (fullscreen text from host) ── */}
      {broadcastOverlay && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', animation: 'fadeSlideIn .35s ease' }}>
          <div style={{ background: 'rgba(0,0,0,.82)', borderRadius: 24, padding: '28px 40px', maxWidth: '80%', textAlign: 'center', border: '2px solid ' + GOLD + '55', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 0 60px rgba(201,168,76,.25)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 10 }}>{broadcastOverlay.from.toUpperCase()}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: TEXT, lineHeight: 1.15, letterSpacing: 1.5 }}>{broadcastOverlay.text}</div>
          </div>
        </div>
      )}

      {/* ── Hover quick-stats tooltip (host/cohost, grid mode) ── */}
      {hoverGid && hoverRect && stageLayout === 'grid' && (role === 'host' || role === 'cohost') && (function() {
        var hg = allGuestMap[hoverGid] || {};
        var hName = localGuestNames[hoverGid] || hg.username || hoverGid;
        var hSecs = speakingTimeRef.current[hoverGid] || 0;
        var hm = Math.floor(hSecs / 60);
        var hs = hSecs % 60;
        var hPid = hg.producerId;
        var hQ = hPid ? producerQuality[hPid] : null;
        var hRaw = hPid ? (consumerRawStats[hPid] || null) : null;
        var qColor = hQ === 'green' ? '#00e676' : hQ === 'yellow' ? '#ffc107' : hQ === 'red' ? RED : MUTED;
        return (
          <div style={{ position: 'fixed', top: hoverRect.top - 4, left: hoverRect.left + hoverRect.width / 2, transform: 'translate(-50%,-100%)', zIndex: 9999, pointerEvents: 'none', animation: 'fadeSlideIn .15s ease' }}>
            <div style={{ background: 'rgba(9,7,14,.97)', border: '1px solid ' + BORDER, borderRadius: 8, padding: '6px 10px', minWidth: 120, maxWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,.7)' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: TEXT, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hName}</div>
              {hQ && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: qColor, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: qColor, letterSpacing: .3 }}>{hQ.toUpperCase()}</span>
                </div>
              )}
              {hRaw && hRaw.bitratekbps != null && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{'📡 ' + hRaw.bitratekbps + ' kbps'}{hRaw.jitter != null ? ' · ' + hRaw.jitter + 'ms' : ''}</div>
              )}
              {hSecs > 0 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{'🗣 ' + (hm < 10 ? '0' : '') + hm + ':' + (hs < 10 ? '0' : '') + hs}</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Stage join announcement banner ── */}
      {stageAnnounce && (
        <div style={{ position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)', zIndex: 60, pointerEvents: 'none', animation: 'announceIn .3s ease', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(26,21,16,.95)', border: '1px solid rgba(212,133,74,.5)', borderRadius: 20, padding: '7px 16px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,.55)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>🎤</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, letterSpacing: .5 }}>{stageAnnounce.username}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: .3 }}>joined the stage</span>
        </div>
      )}

      <HostHUD
        sessionEarningsCents={sessionEarningsCents}
        viewerCount={viewerCount}
        superChatCount={superChatCount}
        giftCount={giftCount}
        clipCount={clipLog.length}
        addToast={addToast}
        isVisible={role === 'host' || role === 'cohost'}
        streamStats={streamStats}
        socket={socket}
        roomId={roomId}
        onHypePeak={function() {
          if (socket) socket.emit('clip-marker', { label: '🔥 Hype Peak' });
          if (addToast) addToast('🔥 HYPE PEAK — clip auto-marked!', 'success');
        }}
      />

      {(role === 'host' || role === 'cohost') && (
        <JoinRequestQueue socket={socket} roomId={roomId} />
      )}

      {role === 'host' && (
        <HostQuickActions
          socket={socket}
          roomId={roomId}
          isLive={isLive}
          isMuted={isMuted}
          isCamOff={isCamOff}
          addToast={addToast}
          onToggleMic={function() {
            var next = !isMuted;
            setIsMuted(next);
            if (socket) socket.emit('toggle-mic', { roomId: roomId, muted: next });
          }}
          onToggleCam={function() {
            var next = !isCamOff;
            setIsCamOff(next);
            if (socket) socket.emit('toggle-cam', { roomId: roomId, camOff: next });
          }}
          onToggleChat={function() { setChatOpen(function(o) { return !o; }); }}
          onGoLive={function() { setShowLiveModal(true); }}
          isScreenSharing={isScreenSharing}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
        />
      )}

      {/* ════════════════ ROOM HEADER ════════════════ */}
      <div style={{ background: SURF, borderBottom: '1px solid ' + BORDER, padding: '10px 16px 10px', flexShrink: 0 }}>

        {/* Top row: Title + live badge + controls */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, lineHeight: 1.1, letterSpacing: .3 }}>
              {(streamInfo && streamInfo.title) ? streamInfo.title : 'Live Room'}
            </div>
            {streamInfo && streamInfo.subtitle && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, letterSpacing: 1.5, marginTop: 3, textTransform: 'uppercase', opacity: .85 }}>
                {streamInfo.subtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginTop: 2 }}>
            {privateMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(109,30,212,.2)', border: '1px solid rgba(109,30,212,.5)', borderRadius: 999, padding: '3px 8px' }}>
                <span style={{ fontSize: 9 }}>🔒</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#B08FFF', letterSpacing: 1 }}>PRIVATE</span>
              </div>
            )}
            {audioOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 999, padding: '3px 8px' }}>
                <span style={{ fontSize: 9 }}>🎤</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 1 }}>AUDIO</span>
              </div>
            )}
            {(role === 'host' || role === 'cohost') && (
              <button onClick={function() { setShowSessionSummary(true); }}
                title="Session summary"
                style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '4px 8px', cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: .5 }}>
                📈 SUMMARY
              </button>
            )}
            {isLive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={endStream} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite' }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED, letterSpacing: 1 }}>LIVE</span>
                </button>
                {streamDuration > 0 && (function() {
                  var h = Math.floor(streamDuration / 3600);
                  var m = Math.floor((streamDuration % 3600) / 60);
                  var s = streamDuration % 60;
                  var str = (h > 0 ? (h < 10 ? '0' : '') + h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
                  return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>{str}</span>;
                })()}
              </div>
            ) : role === 'host' ? (
              <button onClick={function() { setShowLiveModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: RED, border: 'none', borderRadius: 999, padding: '5px 12px', cursor: 'pointer' }}>
                <span style={{ fontSize: 9 }}>▶</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: '#fff', letterSpacing: 1 }}>GO LIVE</span>
              </button>
            ) : (
              <div style={{ background: 'rgba(36,28,20,.8)', borderRadius: 999, padding: '4px 10px' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>OFFLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Host + viewer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg,' + gold + '55,' + BURG + '55)',
              border: '1.5px solid ' + gold + '66',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: gold, lineHeight: 1 }}>
                {hostName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>{hostName}</span>
            <RolePill role={hostEntry ? hostEntry.role : role} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
              👥 {viewerCount || allParticipants.length}{peakViewers > (viewerCount || allParticipants.length) ? ' ↑' + peakViewers : ''}
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
              {allParticipants.length} here now
            </span>
          </div>
        </div>

        {/* Stage Room View — stream title (when set) */}
        {isLive && activeStreamTitle && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStreamTitle}</div>
          </div>
        )}

        {/* Stage Room View — Rec strip + viewer count */}
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: activeStreamTitle ? 4 : 8, paddingTop: activeStreamTitle ? 4 : 8, borderTop: activeStreamTitle ? 'none' : '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: RED, letterSpacing: 1 }}>REC</span>
            </div>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>·</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: TEXT }}>{allParticipants.length} here now</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>·</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{viewerCount || 0} total{peakViewers > (viewerCount || 0) ? ' (peak: ' + peakViewers + ')' : ''}</span>
            {fanoutStatus.length > 0 && (
              <div style={{ display: 'flex', gap: 3 }}>
                {fanoutStatus.slice(0, 4).map(function(fs, i) {
                  var icons = { youtube: '▶️', twitch: '💜', tiktok: '🎵', facebook: '👍', kick: '🟢', rumble: '🔴', custom: '📡' };
                  return (
                    <span key={i} title={fs.platform} style={{ fontSize: 9, lineHeight: 1 }}>{icons[fs.platform] || '📡'}</span>
                  );
                })}
                {fanoutStatus.length > 4 && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD }}>+{fanoutStatus.length - 4}</span>}
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() {
                  var next = !stageLocked;
                  if (socket) socket.emit('lock-stage', { roomId: roomId, locked: next });
                }} title={stageLocked ? 'Unlock stage — let guests join' : 'Lock stage — no new guests'}
                  style={{ background: stageLocked ? 'rgba(201,168,76,.18)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (stageLocked ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '3px 8px', fontSize: 10, color: stageLocked ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", transition: 'all .15s' }}>
                  {stageLocked ? '🔒' : '🔓'}
                </button>
              )}
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() {
                  if (socket) socket.emit('mute-all', { roomId: roomId });
                  if (addToast) addToast('🔇 All participants muted', 'info');
                }} title="Mute all participants" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>🔇</button>
              )}
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() {
                  if (socket) socket.emit('unmute-all', { roomId: roomId });
                  if (addToast) addToast('🎙 All participants unmuted', 'info');
                }} title="Unmute all participants" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>🎙</button>
              )}
              {Object.keys(guestGiftTotals).some(function(k) { return guestGiftTotals[k] > 0; }) && (
                <button onClick={function() { setShowGiftStrip(function(v) { return !v; }); }}
                  title="Gift leaderboard"
                  style={{ background: showGiftStrip ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (showGiftStrip ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '3px 8px', fontSize: 10, color: showGiftStrip ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>🎁</button>
              )}
              <button onClick={function() { setShowTTSSheet(true); }} title="Voice SuperChat" style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.25)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: RED, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>🚀</button>
              <button onClick={function() { setShowSuperChatSheet(true); }} title="Super Chat" style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: GOLD, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>💬</button>
              <button onClick={function() { setShowShareSheet(true); }} title="Share" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: TEXT, cursor: 'pointer' }}>🔗</button>
            </div>
          </div>
        )}

        {/* Speaking indicator */}
        {speakerName && !isScreenSharing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, paddingTop: 7, borderTop: '1px solid ' + BORDER }}>
            <SpeakBars color={TEAL} small />
            <span style={{ fontSize: 12, color: TEAL, fontWeight: 500 }}>{speakerName} is speaking</span>
          </div>
        )}
        {/* Screen share banner — host side */}
        {isScreenSharing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, paddingTop: 7, borderTop: '1px solid ' + BORDER }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: RED, animation: 'livePulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: RED, fontWeight: 600, letterSpacing: 0.5 }}>SCREEN SHARING</span>
            <button
              onClick={stopScreenShare}
              style={{ marginLeft: 'auto', padding: '3px 8px', background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 5, color: RED, fontSize: 10, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}
            >STOP</button>
          </div>
        )}
        {/* Screen share banner — viewer side */}
        {!isScreenSharing && screenShareHost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, paddingTop: 7, borderTop: '1px solid ' + BORDER }}>
            <span style={{ fontSize: 14 }}>🖥</span>
            <span style={{ fontSize: 12, color: TEAL, fontWeight: 600, letterSpacing: 0.5 }}>{screenShareHost.username} is sharing screen</span>
          </div>
        )}
        {/* Spotlight banner */}
        {spotlight && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, paddingTop: 7, borderTop: '1px solid ' + BORDER }}>
            <span style={{ fontSize: 13 }}>🔦</span>
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: 0.5 }}>{spotlight.username} spotlighted</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginLeft: 2 }}>
              {Math.floor(spotlightElapsed / 60) + ':' + (spotlightElapsed % 60 < 10 ? '0' : '') + (spotlightElapsed % 60)}
            </span>
            {(role === 'host' || role === 'cohost') && (
              <button onClick={function() { if (socket) socket.emit('spotlight-end', { roomId: roomId }); }}
                style={{ marginLeft: 'auto', padding: '3px 8px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 5, color: GOLD, fontSize: 10, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>
                END
              </button>
            )}
          </div>
        )}
      </div>

      {/* ════════════════ STREAM GOAL BAR ════════════════ */}
      {streamGoal && isLive && (function() {
        var earned = Math.floor(sessionEarningsCents || 0);
        var target = Math.floor(streamGoal.goalCents || 1);
        var pct    = Math.min(100, Math.floor(earned / target * 100));
        var bar    = pct >= 100 ? GOLD : pct >= 75 ? TEAL : '#C9A84C';
        return (
          <div style={{ background: 'rgba(14,12,9,.9)', borderBottom: '1px solid ' + BORDER, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, flexShrink: 0 }}>GOAL</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, flexShrink: 0, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{streamGoal.label || 'Stream Goal'}</span>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.07)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: bar, width: pct + '%', transition: 'width .6s ease' }} />
            </div>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: bar, letterSpacing: 1, flexShrink: 0 }}>{pct}%</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flexShrink: 0 }}>${(earned / 100).toFixed(0)}/${(target / 100).toFixed(0)}</span>
            {role === 'host' && <button onClick={function() { if (setStreamGoal) setStreamGoal(null); if (socket) socket.emit('stream-goal-clear', { roomId: roomId }); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1 }}>✕</button>}
          </div>
        );
      })()}
      {!streamGoal && role === 'host' && isLive && (
        <div style={{ background: 'rgba(14,12,9,.7)', borderBottom: '1px solid ' + BORDER, padding: '4px 14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={function() { setShowGoalSet(true); }} style={{ background: 'none', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '3px 10px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7.5, cursor: 'pointer', letterSpacing: 1 }}>
            + SET STREAM GOAL
          </button>
        </div>
      )}

      {/* ── Quick emoji fire bar (host/cohost) ── */}
      {showEmojiBar && (role === 'host' || role === 'cohost') && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 16px', background: 'rgba(9,7,14,.95)', borderBottom: '1px solid ' + BORDER }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, flexShrink: 0 }}>FIRE EMOJI</span>
          {['🔥', '💯', '👏', '😂', '❤️', '🎉', '💎', '🙌', '😮', '💪'].map(function(em) {
            return (
              <button key={em}
                onClick={function() {
                  if (socket) socket.emit('stage-reaction', { roomId: roomId, emoji: em });
                  setReactionBurst(function(prev) {
                    return prev.concat([{ id: Date.now() + em, emoji: em, x: 20 + Math.random() * 60 }]).slice(-20);
                  });
                  setReactionCounts(function(prev) { var next = Object.assign({}, prev); next[em] = (next[em] || 0) + 1; return next; });
                }}
                style={{ background: 'none', border: '1px solid ' + DIM, borderRadius: 8, padding: '4px 8px', fontSize: 18, cursor: 'pointer', transition: 'transform .1s, border-color .1s', lineHeight: 1 }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'scale(1.35)'; e.currentTarget.style.borderColor = GOLD + '66'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = DIM; }}>
                {em}
              </button>
            );
          })}
        </div>
      )}

      {/* ════════════════ SCROLLABLE BODY ════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ── Stage Section ── */}
        <div style={{ padding: '12px 14px 6px', position: 'relative', overflow: 'hidden', background: stageBg || 'transparent' }}>
          {/* Stage tint overlay */}
          {stageTint && (
            <div style={{ position: 'absolute', inset: 0, background: stageTint, opacity: 0.08, pointerEvents: 'none', zIndex: 1 }} />
          )}
          {/* BRB overlay */}
          {brbActive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,12,9,.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', pointerEvents: 'none', animation: 'fadeSlideIn .3s ease' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: GOLD, letterSpacing: 3, lineHeight: 1, animation: 'goldPulse 2s ease-in-out infinite' }}>BE RIGHT BACK</div>
              {brbMsg ? (
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 16, color: TEXT, marginTop: 10, opacity: .85 }}>{brbMsg}</div>
              ) : null}
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                {['', '', ''].map(function(_, i) {
                  return (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: .7, animation: 'goldPulse 1.4s ease-in-out ' + (i * 0.35) + 's infinite' }} />
                  );
                })}
              </div>
            </div>
          )}
          {/* Host countdown floating chip */}
          {role === 'host' && stageCountdownMs > 0 && (function() {
            var remMs = stageCountdownMs - Date.now();
            var remSec = Math.max(0, Math.ceil(remMs / 1000));
            var m = Math.floor(remSec / 60);
            var s = remSec % 60;
            var str = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            var urgent = remSec <= 30;
            if (remSec === 0) { setTimeout(function() { setStageCountdownMs(0); }, 100); }
            return (
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 55, pointerEvents: 'none', background: urgent ? 'rgba(255,26,60,.18)' : 'rgba(14,12,9,.82)', border: '1px solid ' + (urgent ? 'rgba(255,26,60,.5)' : 'rgba(201,168,76,.35)'), borderRadius: 10, padding: '5px 14px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10 }}>⏳</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: urgent ? RED : GOLD, letterSpacing: 2, fontWeight: 700 }}>{str}</span>
              </div>
            );
          })()}

          {/* Room countdown timer overlay */}
          {roomTimerActive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 58, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: 'rgba(14,12,9,.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'fadeSlideIn .25s ease' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' }}>COUNTDOWN</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 80, lineHeight: 1, letterSpacing: 4, color: roomTimerSec <= 5 ? RED : GOLD, animation: roomTimerSec <= 5 ? 'livePulse .6s ease-in-out infinite' : 'none', textShadow: '0 0 40px ' + (roomTimerSec <= 5 ? RED : GOLD) + '55' }}>
                {roomTimerSec > 59 ? (Math.floor(roomTimerSec / 60) + ':' + (roomTimerSec % 60 < 10 ? '0' : '') + (roomTimerSec % 60)) : roomTimerSec}
              </div>
            </div>
          )}

          {/* Confetti burst */}
          {confettiBurst.length > 0 && confettiBurst.map(function(p) {
            return (
              <div key={p.id} style={{ position: 'absolute', top: 0, left: p.x + '%', zIndex: 65, pointerEvents: 'none', width: p.size, height: p.size, background: p.color, borderRadius: 2, animation: 'confettiFall 2.8s ' + p.delay + 's ease-in forwards', opacity: 0 }} />
            );
          })}

          {/* ── Sentiment poll overlay ── */}
          {sentimentPoll && (function() {
            var total = (sentimentPoll.yesCount || 0) + (sentimentPoll.noCount || 0);
            var yesPct = total > 0 ? Math.round(sentimentPoll.yesCount * 100 / total) : 50;
            var noPct  = total > 0 ? Math.round(sentimentPoll.noCount  * 100 / total) : 50;
            var secLeft = Math.max(0, Math.round((sentimentPoll.endTs - Date.now()) / 1000));
            return (
              <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 62, width: 220, background: 'rgba(14,12,9,.92)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 14, padding: '12px 14px', boxShadow: '0 6px 28px rgba(0,0,0,.7)', animation: 'fadeSlideIn .25s ease' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>QUICK POLL</span>
                  <span style={{ color: secLeft <= 5 ? RED : MUTED }}>{secLeft}s</span>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: TEXT, marginBottom: 10, lineHeight: 1.3 }}>{sentimentPoll.question}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button
                    disabled={!!sentimentVoted}
                    onClick={function() {
                      if (sentimentVoted || !socket) return;
                      setSentimentVoted('yes');
                      socket.emit('sentiment-vote', { vote: 'yes' });
                    }}
                    style={{ flex: 1, background: sentimentVoted === 'yes' ? 'rgba(109,191,126,.25)' : 'rgba(255,255,255,.06)', border: '1.5px solid ' + (sentimentVoted === 'yes' ? '#6DBF7E' : 'rgba(255,255,255,.12)'), borderRadius: 8, padding: '7px 4px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: sentimentVoted ? 'default' : 'pointer', opacity: sentimentVoted && sentimentVoted !== 'yes' ? 0.5 : 1 }}>
                    👍
                  </button>
                  <button
                    disabled={!!sentimentVoted}
                    onClick={function() {
                      if (sentimentVoted || !socket) return;
                      setSentimentVoted('no');
                      socket.emit('sentiment-vote', { vote: 'no' });
                    }}
                    style={{ flex: 1, background: sentimentVoted === 'no' ? 'rgba(255,26,60,.2)' : 'rgba(255,255,255,.06)', border: '1.5px solid ' + (sentimentVoted === 'no' ? RED : 'rgba(255,255,255,.12)'), borderRadius: 8, padding: '7px 4px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: sentimentVoted ? 'default' : 'pointer', opacity: sentimentVoted && sentimentVoted !== 'no' ? 0.5 : 1 }}>
                    👎
                  </button>
                </div>
                {total > 0 && (
                  <div>
                    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: yesPct + '%', background: '#6DBF7E', transition: 'width .4s ease' }} />
                      <div style={{ flex: 1, background: RED, opacity: .7, transition: 'width .4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>
                      <span style={{ color: '#6DBF7E' }}>👍 {yesPct}% ({sentimentPoll.yesCount})</span>
                      <span style={{ color: RED }}>👎 {noPct}% ({sentimentPoll.noCount})</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Stream health HUD (host only) ── */}
          {showHealthHud && (role === 'host' || role === 'cohost') && (function() {
            var st = streamStats;
            var quality = !st ? null : (st.bitratekbps < 100 || st.lossPct > 5 ? 'red' : st.bitratekbps < 350 || st.lossPct > 1 ? 'yellow' : 'green');
            var qualColor = quality === 'green' ? '#6DBF7E' : quality === 'yellow' ? '#F0A500' : quality === 'red' ? RED : MUTED;
            var worstConsumer = (function() {
              var entries = Object.entries(consumerRawStats);
              if (!entries.length) return null;
              return entries.reduce(function(worst, entry) { return (!worst || entry[1].bitratekbps < worst[1].bitratekbps) ? entry : worst; }, null);
            })();
            return (
              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 52, background: 'rgba(14,12,9,.85)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 10px', minWidth: 110, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>STREAM HEALTH</div>
                {st ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: qualColor, flexShrink: 0, boxShadow: '0 0 6px ' + qualColor }} />
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: qualColor, letterSpacing: .5 }}>{st.bitratekbps} kbps</span>
                    </div>
                    {st.rttMs != null && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: st.rttMs > 150 ? RED : MUTED }}>RTT {st.rttMs}ms</span>}
                    {st.lossPct != null && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: st.lossPct > 2 ? RED : MUTED }}>loss {st.lossPct.toFixed(1)}%</span>}
                    {worstConsumer && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: worstConsumer[1].bitratekbps < 80 ? RED : MUTED }}>↓ {worstConsumer[1].bitratekbps} kbps</span>}
                  </div>
                ) : (
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>—</span>
                )}
              </div>
            );
          })()}

          {/* Scrolling ticker strip */}
          {tickerActive && tickerText && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 55, pointerEvents: 'none', overflow: 'hidden', background: 'rgba(14,12,9,.88)', borderTop: '1px solid rgba(201,168,76,.25)', height: 26, display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: GOLD, letterSpacing: .8, animation: 'tickerScroll 18s linear infinite' }}>
                {'⚡ ' + tickerText + '   ·   ⚡ ' + tickerText + '   ·   ⚡ ' + tickerText}
              </span>
            </div>
          )}

          {/* Reaction rain overlay */}
          {reactionBurst.map(function(r) {
            return (
              <div key={r.id} style={{ position: 'absolute', left: r.x + '%', bottom: 0, fontSize: 22, pointerEvents: 'none', zIndex: 60, animation: 'reactionFloat 2.2s ease-out forwards' }}>
                {r.emoji}
              </div>
            );
          })}

          {/* ── Gift leaderboard strip ── */}
          {showGiftStrip && (function() {
            var entries = Object.keys(guestGiftTotals)
              .filter(function(gid) { return guestGiftTotals[gid] > 0; })
              .sort(function(a, b) { return guestGiftTotals[b] - guestGiftTotals[a]; })
              .slice(0, 5)
              .map(function(gid) {
                var g = allGuestMap[gid] || {};
                return { gid: gid, name: localGuestNames[gid] || g.username || gid, cents: guestGiftTotals[gid] };
              });
            if (entries.length === 0) return null;
            var medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1, flexShrink: 0 }}>🎁 TOP GIFTERS</span>
                {entries.map(function(e, i) {
                  return (
                    <span key={e.gid} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: i === 0 ? GOLD : TEXT, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 11 }}>{medals[i]}</span>
                      <span style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD }}>${(e.cents / 100).toFixed(0)}</span>
                    </span>
                  );
                })}
              </div>
            );
          })()}

          {/* ── Reaction counter bar (host/cohost) ── */}
          {showReactionBar && (role === 'host' || role === 'cohost') && Object.keys(reactionCounts).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'rgba(9,7,14,.8)', borderRadius: 20, border: '1px solid ' + DIM, marginBottom: 6, flexWrap: 'wrap' }}>
              {Object.entries(reactionCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8).map(function(entry) {
                return (
                  <span key={entry[0]} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEXT, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 13 }}>{entry[0]}</span>
                    <span style={{ color: GOLD }}>{entry[1]}</span>
                  </span>
                );
              })}
              <button onClick={function() { setReactionCounts({}); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, fontSize: 9, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                title="Reset reaction counts">✕</button>
            </div>
          )}

          {/* ── Join request notifications (host only, when stage locked) ── */}
          {joinRequests.length > 0 && (role === 'host' || role === 'cohost') && (
            <div style={{ marginBottom: 6 }}>
              {joinRequests.slice(0, 3).map(function(req) {
                return (
                  <div key={req.guestId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 8, marginBottom: 3, animation: 'fadeSlideIn .2s ease' }}>
                    <span style={{ fontSize: 12, lineHeight: 1 }}>📩</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.username}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flexShrink: 0 }}>wants on stage</span>
                    <button onClick={function() {
                      if (socket) socket.emit('stage-join-approve', { roomId: roomId, guestId: req.guestId });
                      setJoinRequests(function(prev) { return prev.filter(function(r) { return r.guestId !== req.guestId; }); });
                      if (addToastRef.current) addToastRef.current('Approved: ' + req.username, 'success');
                    }} style={{ background: 'rgba(0,200,120,.2)', border: '1px solid rgba(0,200,120,.45)', borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#00e676', cursor: 'pointer', letterSpacing: .3, flexShrink: 0 }}>
                      ✓ LET IN
                    </button>
                    <button onClick={function() {
                      if (socket) socket.emit('stage-join-deny', { roomId: roomId, guestId: req.guestId });
                      setJoinRequests(function(prev) { return prev.filter(function(r) { return r.guestId !== req.guestId; }); });
                    }} style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED, cursor: 'pointer', letterSpacing: .3, flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                );
              })}
              {joinRequests.length > 3 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, padding: '2px 10px' }}>+{joinRequests.length - 3} more requests</div>
              )}
            </div>
          )}

          {/* Stage header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 20, color: TEXT, letterSpacing: .3 }}>Stage</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: MUTED, letterSpacing: 1 }}>{onStage.length}/{MAX_STAGE}</span>
              {stageLocked && (
                <span title="Stage locked — no new guests can join" style={{ fontSize: 12, lineHeight: 1 }}>🔒</span>
              )}
              {stageLocked && role !== 'host' && role !== 'cohost' && !onStage.some(function(g) { return (g.guestId || g.userId) === userId; }) && (
                <button onClick={function() {
                  if (socket) socket.emit('stage-join-request', { roomId: roomId });
                  if (addToastRef.current) addToastRef.current('Request sent to host', 'info');
                }} style={{ background: 'rgba(0,195,255,.15)', border: '1px solid rgba(0,195,255,.4)', borderRadius: 10, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, cursor: 'pointer', letterSpacing: .3 }}>
                  📩 REQUEST STAGE
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Stage sort toggle */}
              <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                {[
                  { id: 'joined',   icon: '⏱', title: 'Sort by join order' },
                  { id: 'speaking', icon: '🗣', title: 'Sort by speaking time' },
                  { id: 'quality',  icon: '📶', title: 'Sort by signal quality' },
                ].map(function(s) {
                  return (
                    <button key={s.id} onClick={function() { setStageSort(s.id); }} title={s.title}
                      style={{ background: stageSort === s.id ? CARD2 : 'transparent', border: 'none', color: stageSort === s.id ? TEXT : MUTED, cursor: 'pointer', padding: '5px 9px', fontSize: 11, transition: 'background .15s' }}>
                      {s.icon}
                    </button>
                  );
                })}
              </div>
              {/* Auto-mute + stage time limit (host only) */}
              {role === 'host' && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button
                    onClick={function() { setAutoMuteJoin(function(v) { return !v; }); }}
                    title={autoMuteJoin ? 'Auto-mute ON: new guests join muted' : 'Auto-mute OFF: new guests join with mic open'}
                    style={{ background: autoMuteJoin ? 'rgba(255,26,60,.18)' : CARD, border: '1px solid ' + (autoMuteJoin ? 'rgba(255,26,60,.4)' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: autoMuteJoin ? RED : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                    🔇{autoMuteJoin ? ' ON' : ' OFF'}
                  </button>
                  <select
                    value={stageLimitSec}
                    onChange={function(e) {
                      var v = parseInt(e.target.value, 10) || 0;
                      setStageLimitSec(v);
                      stageLimitWarnedRef.current = {};
                    }}
                    title="Per-guest stage time limit (0 = off)"
                    style={{ background: stageLimitSec > 0 ? 'rgba(201,168,76,.15)' : CARD, border: '1px solid ' + (stageLimitSec > 0 ? 'rgba(201,168,76,.4)' : BORDER), borderRadius: 6, padding: '4px 6px', fontSize: 9, color: stageLimitSec > 0 ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace', letterSpacing: .3", outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}>
                    <option value="0">⏰ OFF</option>
                    <option value="180">⏰ 3m</option>
                    <option value="300">⏰ 5m</option>
                    <option value="600">⏰ 10m</option>
                  </select>
                </div>
              )}
              {/* Panel mode (list vs grid for 20-person) */}
              <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                {[
                  { id: 'grid', icon: '⊞', title: 'Grid' },
                  { id: 'list', icon: '☰', title: 'List' },
                ].map(function(m) {
                  return (
                    <button key={m.id} onClick={function() { setPanelMode(m.id); }}
                      style={{ background: panelMode === m.id ? CARD2 : 'transparent', border: 'none', color: panelMode === m.id ? TEXT : MUTED, cursor: 'pointer', padding: '5px 10px', fontSize: 12, transition: 'background .15s' }}>
                      {m.icon}
                    </button>
                  );
                })}
              </div>
              {/* Cell aspect ratio toggle */}
              {stageLayout === 'grid' && panelMode !== 'list' && (
                <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                  {[
                    { id: '16:9', icon: '▬', title: '16:9 widescreen' },
                    { id: '4:3',  icon: '▪', title: '4:3 standard' },
                    { id: '9:16', icon: '▮', title: '9:16 portrait' },
                  ].map(function(item) {
                    return (
                      <button key={item.id} onClick={function() { setCellAspect(item.id); }} title={item.title}
                        style={{ background: cellAspect === item.id ? CARD2 : 'transparent', border: 'none', color: cellAspect === item.id ? TEXT : MUTED, cursor: 'pointer', padding: '5px 8px', fontSize: 10, transition: 'background .15s', fontFamily: "'DM Mono',monospace", letterSpacing: .3 }}>
                        {item.id}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Grid density (fewer/auto/more columns) */}
              {stageLayout === 'grid' && panelMode !== 'list' && (
                <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                  {[
                    { d: -1, icon: '⊟', title: 'Fewer columns (wider cells)' },
                    { d:  0, icon: '⊡', title: 'Auto columns' },
                    { d:  1, icon: '⊞', title: 'More columns (smaller cells)' },
                  ].map(function(item) {
                    return (
                      <button key={item.d} onClick={function() { setGridDensity(item.d); }} title={item.title}
                        style={{ background: gridDensity === item.d ? CARD2 : 'transparent', border: 'none', color: gridDensity === item.d ? TEXT : MUTED, cursor: 'pointer', padding: '5px 8px', fontSize: 12, transition: 'background .15s' }}>
                        {item.icon}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Cell stats toggle (grid mode, host/cohost) */}
              {stageLayout === 'grid' && panelMode !== 'list' && (role === 'host' || role === 'cohost') && (
                <button
                  onClick={function() { setShowCellStats(function(v) { return !v; }); }}
                  title={showCellStats ? 'Hide per-cell speaking stats' : 'Show per-cell speaking time'}
                  style={{ background: showCellStats ? 'rgba(212,133,74,.18)' : CARD, border: '1px solid ' + (showCellStats ? 'rgba(212,133,74,.5)' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: showCellStats ? TEAL : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap', transition: 'all .15s' }}>
                  ⏱ STATS
                </button>
              )}
              {/* Stage tint (host/cohost) */}
              {(role === 'host' || role === 'cohost') && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, flexShrink: 0 }}>TINT</span>
                  {[
                    { hex: '',        title: 'None'   },
                    { hex: '#C9A84C', title: 'Gold'   },
                    { hex: '#FF1A3C', title: 'Red'    },
                    { hex: '#0066FF', title: 'Blue'   },
                    { hex: '#00AA44', title: 'Green'  },
                    { hex: '#9900CC', title: 'Purple' },
                  ].map(function(t) {
                    var isActive = stageTint === t.hex;
                    return (
                      <button key={t.hex || 'none'}
                        onClick={function() { setStageTint(t.hex); }}
                        title={t.title}
                        style={{ width: 14, height: 14, borderRadius: '50%', background: t.hex || DIM, border: '1.5px solid ' + (isActive ? TEXT : 'transparent'), cursor: 'pointer', padding: 0, outline: 'none', flexShrink: 0 }}>
                        {!t.hex && <span style={{ fontSize: 7, lineHeight: 1, color: MUTED }}>✕</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Stage countdown (host only) */}
              {role === 'host' && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={function() {
                      if (stageCountdownMs > 0) { setStageCountdownMs(0); setShowCountdownInput(false); return; }
                      setShowCountdownInput(function(v) { return !v; });
                    }}
                    title={stageCountdownMs > 0 ? 'Stop countdown' : 'Start stage countdown timer'}
                    style={{ background: stageCountdownMs > 0 ? 'rgba(201,168,76,.2)' : CARD, border: '1px solid ' + (stageCountdownMs > 0 ? 'rgba(201,168,76,.5)' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: stageCountdownMs > 0 ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap' }}>
                    ⏳ {stageCountdownMs > 0 ? 'STOP' : 'TIMER'}
                  </button>
                  {showCountdownInput && stageCountdownMs === 0 && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', zIndex: 30, display: 'flex', gap: 6, alignItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}>
                      <input
                        value={countdownInput}
                        onChange={function(e) { setCountdownInput(e.target.value); }}
                        placeholder="mm:ss"
                        style={{ width: 60, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '4px 7px', fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEXT, outline: 'none' }}
                      />
                      <button
                        onClick={function() {
                          var parts = countdownInput.split(':');
                          var totalSec = 0;
                          if (parts.length === 2) { totalSec = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0); }
                          else { totalSec = parseInt(parts[0], 10) || 0; }
                          if (totalSec > 0) { setStageCountdownMs(Date.now() + totalSec * 1000); }
                          setShowCountdownInput(false);
                        }}
                        style={{ background: GOLD, border: 'none', borderRadius: 5, padding: '4px 9px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#0E0C09', cursor: 'pointer', letterSpacing: .5 }}>
                        START
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Mute all (host only) */}
              {role === 'host' && onStage.some(function(g) { var gid = g.guestId || g.userId; return gid !== userId && !g.remoteMuted; }) && (
                <button
                  onClick={function() {
                    onStage.forEach(function(g) {
                      var gid = g.guestId || g.userId;
                      if (gid === userId || g.remoteMuted) return;
                      if (socket) socket.emit('mute-guest', { roomId: roomId, guestId: gid });
                    });
                    if (addToastRef.current) addToastRef.current('All guests muted', 'info');
                  }}
                  title="Mute all guests on stage"
                  style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 6, padding: '4px 7px', fontSize: 9, color: MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap', transition: 'all .15s' }}>
                  🔇 ALL
                </button>
              )}
              {/* Spotlight auto-rotation (host/cohost) */}
              {(role === 'host' || role === 'cohost') && onStage.length >= 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, flexShrink: 0 }}>ROTATE</span>
                  {[0, 30, 60, 120].map(function(sec) {
                    return (
                      <button key={sec}
                        onClick={function() {
                          setSpotlightRotateSec(sec);
                          if (sec === 0 && socket) socket.emit('spotlight-end', { roomId: roomId });
                          else if (addToastRef.current) addToastRef.current('Spotlight rotation: ' + sec + 's', 'info');
                        }}
                        title={sec === 0 ? 'Off' : 'Rotate spotlight every ' + sec + 's'}
                        style={{ background: spotlightRotateSec === sec ? 'rgba(0,195,255,.2)' : CARD, border: '1px solid ' + (spotlightRotateSec === sec ? TEAL : BORDER), borderRadius: 4, padding: '2px 5px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: spotlightRotateSec === sec ? TEAL : MUTED, cursor: 'pointer', letterSpacing: .3 }}>
                        {sec === 0 ? 'OFF' : sec + 's'}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Broadcast overlay (host only) */}
              {role === 'host' && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={function() { setShowBroadcastInput(function(v) { return !v; }); }}
                    title="Send fullscreen text overlay to all viewers"
                    style={{ background: showBroadcastInput ? 'rgba(201,168,76,.2)' : CARD, border: '1px solid ' + (showBroadcastInput ? 'rgba(201,168,76,.5)' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: showBroadcastInput ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap' }}>
                    📡 BROADCAST
                  </button>
                  {showBroadcastInput && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', zIndex: 30, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 4px 14px rgba(0,0,0,.6)', minWidth: 220 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: .5 }}>FULLSCREEN OVERLAY (6s)</div>
                      <input
                        value={broadcastText}
                        onChange={function(e) { setBroadcastText(e.target.value.slice(0, 100)); }}
                        onKeyDown={function(e) {
                          if (e.key === 'Enter') {
                            var txt = broadcastText.trim();
                            if (txt && socket) { socket.emit('host-broadcast-overlay', { roomId: roomId, text: txt, from: username || 'Host' }); setBroadcastOverlay({ text: txt, from: username || 'Host' }); setTimeout(function() { setBroadcastOverlay(null); }, 6000); }
                            setBroadcastText(''); setShowBroadcastInput(false);
                          } else if (e.key === 'Escape') { setShowBroadcastInput(false); }
                        }}
                        autoFocus
                        placeholder="Type message, Enter to broadcast…"
                        maxLength={100}
                        style={{ background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '5px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                      <button onClick={function() {
                        var txt = broadcastText.trim();
                        if (txt && socket) { socket.emit('host-broadcast-overlay', { roomId: roomId, text: txt, from: username || 'Host' }); setBroadcastOverlay({ text: txt, from: username || 'Host' }); setTimeout(function() { setBroadcastOverlay(null); }, 6000); }
                        setBroadcastText(''); setShowBroadcastInput(false);
                      }} style={{ background: GOLD, border: 'none', borderRadius: 5, padding: '4px 9px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#0E0C09', cursor: 'pointer', letterSpacing: .5 }}>
                        SEND
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Auto-layout toggle (host/cohost) */}
              {(role === 'host' || role === 'cohost') && (
                <button
                  onClick={function() { setAutoLayout(function(v) { return !v; }); }}
                  title={autoLayout ? 'Auto-layout ON: click to disable' : 'Auto-layout: auto-switch grid/featured by count'}
                  style={{ background: autoLayout ? 'rgba(0,195,255,.18)' : CARD, border: '1px solid ' + (autoLayout ? 'rgba(0,195,255,.5)' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: autoLayout ? TEAL : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap' }}>
                  {autoLayout ? '⟳ AUTO' : '⟳ AUTO'}
                </button>
              )}
              {/* Cell swap mode (host/cohost, grid only) */}
              {stageLayout === 'grid' && (role === 'host' || role === 'cohost') && (
                <button
                  onClick={function() { setSwapMode(function(v) { var next = !v; if (!next) { setSwapPickGid(null); } return next; }); }}
                  title={swapMode ? 'Exit swap mode' : 'Swap mode: click two cells to reorder them'}
                  style={{ background: swapMode ? 'rgba(201,168,76,.25)' : CARD, border: '1px solid ' + (swapMode ? GOLD : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: swapMode ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap' }}>
                  ⇄ {swapMode ? 'SWAP ON' : 'SWAP'}
                </button>
              )}
              {/* Layout presets (host/cohost) */}
              {(role === 'host' || role === 'cohost') && (
                <button
                  onClick={function() { setShowPresetsPanel(function(v) { return !v; }); }}
                  title="Save and load named layout presets"
                  style={{ background: showPresetsPanel ? 'rgba(201,168,76,.18)' : CARD, border: '1px solid ' + (showPresetsPanel ? 'rgba(201,168,76,.45)' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: showPresetsPanel ? GOLD : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .3, whiteSpace: 'nowrap' }}>
                  📐 {layoutPresets.length > 0 ? 'PRESETS(' + layoutPresets.length + ')' : 'PRESETS'}
                </button>
              )}
              {/* Stage layout (single focus) */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                  {[
                    { id: 'grid',     icon: '⊞' },
                    { id: 'featured', icon: '◻' },
                    { id: 'split',    icon: '⤢' },
                  ].map(function(l) {
                    return (
                      <button key={l.id} onClick={function() { setStageLayout(l.id); }}
                        style={{ background: stageLayout === l.id ? CARD2 : 'transparent', border: 'none', color: stageLayout === l.id ? TEXT : MUTED, cursor: 'pointer', padding: '5px 10px', fontSize: 12, transition: 'background .15s' }}>
                        {l.icon}
                      </button>
                    );
                  })}
                </div>
                {stageLayout === 'featured' && (
                  <button
                    onClick={function() { setAutoFocusSpeaker(function(v) { return !v; }); }}
                    title={autoFocusSpeaker ? 'Auto-focus active — click to disable' : 'Enable auto-focus: featured tile follows the speaker'}
                    style={{ background: autoFocusSpeaker ? 'rgba(109,191,126,.18)' : CARD, border: '1px solid ' + (autoFocusSpeaker ? '#6DBF7E66' : BORDER), borderRadius: 6, padding: '4px 7px', fontSize: 9, color: autoFocusSpeaker ? '#6DBF7E' : MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap', transition: 'all .15s', letterSpacing: 0.3 }}>
                    {autoFocusSpeaker ? '● AUTO' : '○ AUTO'}
                  </button>
                )}
                {(function() {
                  var n = onStage.length;
                  var stageColor = n >= MAX_STAGE ? RED : n >= MAX_STAGE - 4 ? '#F0A500' : MUTED;
                  return (
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: stageColor, letterSpacing: 0.3, whiteSpace: 'nowrap', alignSelf: 'center' }}>
                      {n}/{MAX_STAGE}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── Stage health bar (host only) ── */}
          {role === 'host' && onStage.length > 1 && (function() {
            var cGood = 0; var cFair = 0; var cPoor = 0; var cFroz = 0;
            onStage.forEach(function(g) {
              if ((g.guestId || g.userId) === userId) return;
              var pid = g.producerId;
              if (!pid) return;
              if (frozenProducers[pid]) { cFroz++; return; }
              var q = producerQuality[pid];
              if (q === 'green') cGood++;
              else if (q === 'yellow') cFair++;
              else if (q === 'red') cPoor++;
            });
            if (cGood + cFair + cPoor + cFroz === 0) return null;
            return (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: '5px 10px', background: 'rgba(14,12,9,.55)', borderRadius: 8, border: '1px solid ' + BORDER }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, flexShrink: 0 }}>STAGE</span>
                {cGood > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6DBF7E', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#6DBF7E' }}>{cGood}</span>
                  </div>
                )}
                {cFair > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F0A500', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#F0A500' }}>{cFair}</span>
                  </div>
                )}
                {cPoor > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED }}>{cPoor}</span>
                  </div>
                )}
                {cFroz > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 8, lineHeight: 1 }}>❄</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(100,149,237,.9)' }}>{cFroz}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── LIST MODE ── */}
          {stageLayout === 'grid' && panelMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {onStage.map(function(g) {
                var gid    = g.guestId || g.userId || 'x';
                var isOwn  = gid === userId;
                var isSp   = !!speakingIds[gid];
                var isHand = !!raisedHands[gid];
                return (
                  <div key={gid}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: CARD, borderRadius: 12, padding: '8px 12px',
                      border: '1.5px solid ' + (isSp ? TEAL + '99' : isHand ? 'rgba(255,140,0,.5)' : BORDER),
                      boxShadow: isSp ? ('0 0 10px ' + TEAL + '22') : 'none',
                      animation: isSp ? 'speakPulseGrid 1.4s ease-in-out infinite' : 'fadeSlideIn .2s ease',
                      transition: 'border-color .2s, box-shadow .2s',
                    }}>
                    {/* Speaking bar */}
                    <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: isSp ? TEAL : DIM, flexShrink: 0, transition: 'background .2s' }} />
                    {/* Avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD2 + ')', border: '1.5px solid ' + (isSp ? TEAL : DIM), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, lineHeight: 1 }}>
                        {(localGuestNames[gid] || g.username || gid).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Name + role + hand */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: localGuestNames[gid] ? GOLD : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {localGuestNames[gid] || g.username || gid}
                          {isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 3 }}>(YOU)</span>}
                          {localGuestNames[gid] && <span style={{ color: MUTED, fontWeight: 400, fontSize: 8, marginLeft: 2 }}>*</span>}
                        </span>
                        {isHand && <span style={{ fontSize: 13, animation: 'handBadgePulse 1.2s ease-in-out infinite' }} title="Hand raised">✋</span>}
                        {isSp && <SpeakBars color={TEAL} small />}
                      </div>
                      <RolePill role={g.role || (isOwn ? role : 'guest')} />
                    </div>
                    {/* Stage time limit badge */}
                    {stageLimitSec > 0 && (function() {
                      var joined = stageJoinTimesRef.current[gid] || Date.now();
                      var elapsed = Math.floor((Date.now() - joined) / 1000);
                      var rem = stageLimitSec - elapsed;
                      if (rem <= 0) return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, background: 'rgba(255,26,60,.18)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 4, padding: '1px 4px', flexShrink: 0 }}>TIME</span>;
                      var urgent = rem < 30;
                      var minStr = rem >= 60 ? Math.floor(rem / 60) + ':' + String(rem % 60).padStart(2, '0') : rem + 's';
                      return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: urgent ? RED : MUTED, background: urgent ? 'rgba(255,26,60,.12)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (urgent ? 'rgba(255,26,60,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 4, padding: '1px 4px', flexShrink: 0, animation: urgent ? 'livePulse .8s ease-in-out infinite' : 'none' }}>⏱ {minStr}</span>;
                    })()}
                    {/* Mute status */}
                    {(isOwn ? isMuted : g.remoteMuted) && <span style={{ fontSize: 12, color: RED }}>🔇</span>}
                    {/* Own controls */}
                    {isOwn && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={function(e) { e.stopPropagation(); toggleMute(); }}
                          style={{ background: isMuted ? 'rgba(255,26,60,.18)' : CARD2, border: 'none', borderRadius: 8, padding: '5px 9px', color: isMuted ? RED : MUTED, cursor: 'pointer', fontSize: 13 }}>
                          {isMuted ? '🔇' : '🎙'}
                        </button>
                        <button onClick={function(e) { e.stopPropagation(); toggleCam(); }}
                          style={{ background: isCamOff ? 'rgba(255,26,60,.18)' : CARD2, border: 'none', borderRadius: 8, padding: '5px 9px', color: isCamOff ? RED : MUTED, cursor: 'pointer', fontSize: 13 }}>
                          {isCamOff ? '📵' : '🎥'}
                        </button>
                      </div>
                    )}
                    {/* Host/cohost controls */}
                    {(role === 'host' || role === 'cohost') && !isOwn && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isHand && (
                          <button
                            onClick={function(e) { e.stopPropagation(); if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: gid }); }}
                            title="Invite to stage"
                            style={{ padding: '4px 8px', background: 'rgba(255,140,0,.18)', border: '1px solid rgba(255,140,0,.4)', borderRadius: 7, color: '#D4854A', cursor: 'pointer', fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: .5 }}>
                            + STAGE
                          </button>
                        )}
                        <button
                          onClick={function(e) { e.stopPropagation(); if (socket) socket.emit(g.remoteMuted ? 'unmute-guest' : 'mute-guest', { roomId: roomId, guestId: gid }); }}
                          title={g.remoteMuted ? 'Unmute' : 'Mute'}
                          style={{ width: 28, height: 28, background: g.remoteMuted ? 'rgba(255,26,60,.18)' : CARD2, border: 'none', borderRadius: 7, color: g.remoteMuted ? RED : MUTED, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {g.remoteMuted ? '🎙' : '🔇'}
                        </button>
                        <button
                          onClick={function(e) { e.stopPropagation(); if (socket) socket.emit('stage-remove', { roomId: roomId, guestId: gid }); }}
                          title="Remove from stage"
                          style={{ width: 28, height: 28, background: 'rgba(255,26,60,.08)', border: 'none', borderRadius: 7, color: RED, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── GRID MODE ── CSS Grid, 16:9 cells, speaking animation, host actions */}
          {stageLayout === 'grid' && panelMode !== 'list' && (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ',1fr)', gap: 4 }}
              onClick={function() { if (cellMenuId) { setCellMenuId(null); setRemoveConfirmId(null); setRenamingGid(null); setMsgTargetGid(null); } }}>
              {/* Swap mode banner */}
              {swapMode && (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: .5 }}>
                    ⇄ SWAP MODE — {swapPickGid ? 'NOW CLICK THE TARGET CELL' : 'CLICK FIRST CELL TO SWAP'}
                    {stageOrderOverride ? ' · ORDER SAVED' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {stageOrderOverride && (
                      <button onClick={function(e) { e.stopPropagation(); setStageOrderOverride(null); if (addToastRef.current) addToastRef.current('Order reset', 'info'); }} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid ' + BORDER, borderRadius: 4, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer' }}>RESET ORDER</button>
                    )}
                    <button onClick={function(e) { e.stopPropagation(); setSwapMode(false); setSwapPickGid(null); }} style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 4, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, cursor: 'pointer' }}>DONE</button>
                  </div>
                </div>
              )}
              {sortedOnStage.map(function(g) {
                var gid      = g.guestId || g.userId || 'x';
                var isOwn    = gid === userId;
                var isSp     = !!speakingIds[gid];
                var isHand   = !!raisedHands[gid];
                var handPos  = isHand ? handQueue.indexOf(gid) + 1 : 0;
                var isPinned = gid === pinnedId;
                var showMenu = cellMenuId === gid;
                return (
                  <div key={gid}
                    data-cell-gid={gid}
                    onMouseEnter={function(e) {
                      if (role !== 'host' && role !== 'cohost') return;
                      setHoverGid(gid);
                      setHoverRect(e.currentTarget.getBoundingClientRect());
                    }}
                    onMouseLeave={function() { setHoverGid(null); setHoverRect(null); }}
                    onClick={function(e) {
                      if (cellMenuId === gid) { setCellMenuId(null); setRemoveConfirmId(null); return; }
                      if (cellMenuId) { setCellMenuId(null); setRemoveConfirmId(null); }
                      if (swapMode) {
                        if (!swapPickGid) {
                          setSwapPickGid(gid);
                        } else if (swapPickGid !== gid) {
                          var base = stageOrderOverride || sortedOnStage.map(function(x) { return x.guestId || x.userId; });
                          var ia2 = base.indexOf(swapPickGid);
                          var ib2 = base.indexOf(gid);
                          if (ia2 < 0) ia2 = base.length;
                          if (ib2 < 0) ib2 = base.length;
                          var next2 = base.slice();
                          var tmp = next2[ia2]; next2[ia2] = next2[ib2]; next2[ib2] = tmp;
                          setStageOrderOverride(next2);
                          setSwapPickGid(null);
                          if (addToastRef.current) addToastRef.current('Cells swapped', 'info');
                        }
                        return;
                      }
                      setFeaturedId(gid);
                      setStageLayout('featured');
                      setAutoFocusSpeaker(false);
                    }}
                    style={{
                      gridColumn: isPinned && cols > 1 ? 'span 2' : 'span 1',
                      position: 'relative',
                      background: CARD,
                      borderRadius: 10,
                      overflow: 'hidden',
                      cursor: swapMode ? (swapPickGid === gid ? 'copy' : 'crosshair') : 'pointer',
                      border: '2px solid ' + (swapPickGid === gid ? GOLD : cellColors[gid] ? cellColors[gid] + '99' : isSp ? TEAL + 'BB' : isPinned ? GOLD + '66' : isHand ? 'rgba(255,140,0,.65)' : BORDER),
                      animation: isSp ? 'speakPulseGrid 1.4s ease-in-out infinite' : 'fadeSlideIn .22s ease',
                      transition: 'border-color .2s',
                      outline: swapMode && swapPickGid !== gid ? '1px dashed rgba(201,168,76,.35)' : 'none',
                    }}>
                    {/* Video wrapper — aspect ratio driven by cellAspect */}
                    <div style={{ position: 'relative', paddingBottom: cellAspectPb }}>
                      <div style={{ position: 'absolute', inset: 0 }}>
                        {audioOnly ? (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,' + CARD2 + ',' + BG + ')', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD + ')', border: '2px solid ' + (isSp ? TEAL : DIM), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD }}>{(g.username || gid).charAt(0).toUpperCase()}</span>
                            </div>
                            {isSp && <WaveBars color={TEAL} />}
                          </div>
                        ) : (
                          <OctCell
                            guest={g}
                            fill={true}
                            isHost={role === 'host'}
                            fadesMode={false}
                            branding={branding}
                            onTap={null}
                            socket={socket}
                            roomId={roomId}
                            userId={userId}
                            rtcManager={rtcReady ? rtcManager : null}
                            mediaConfig={isOwn ? medConf : null}
                            isMuted={isOwn ? isMuted : false}
                            isCamOff={isOwn ? isCamOff : false}
                            onMuteToggle={isOwn ? toggleMute : null}
                            onCamToggle={isOwn ? toggleCam : null}
                            onCameraTrack={isOwn ? function(t) { cameraTrackRef.current = t; if (rtcManager && rtcManager.producers && rtcManager.producers['video']) { rtcManager.replaceTrack('video', t).catch(function() {}); } } : null}
                            handRaised={isHand}
                            giftTotal={guestGiftTotals[gid] || 0}
                            activeEffect={panelEffects[gid] || null}
                            onPowerPlay={!isOwn && role !== 'host' ? function(guest) { setShowPowerPlay(guest); } : null}
                            isScreenSharing={isOwn ? isScreenSharing : !!(screenShareHost && screenShareHost.userId === gid)}
                            remoteQuality={isOwn ? null : (producerQuality[g.producerId] || null)}
                            mirrorOverride={isOwn ? mirrorSelf : undefined}
                            remoteVolume={isOwn ? undefined : (guestVolumes[gid] !== undefined ? guestVolumes[gid] : 1)}
                          />
                        )}
                      </div>
                    </div>

                    <OverlayCustomLT lowerThirds={mergedLowerThirds} guestId={gid} />

                    {/* Host-local video hide overlay */}
                    {!isOwn && hiddenVideos[gid] && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,9,.92)', zIndex: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: CARD2, border: '1px solid ' + DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🙈</div>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5 }}>VIDEO HIDDEN</span>
                      </div>
                    )}

                    {/* Overlay badges (top-left) */}
                    <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', gap: 3, zIndex: 10, pointerEvents: 'none' }}>
                      {(isOwn ? isScreenSharing : !!(screenShareHost && screenShareHost.userId === gid)) && (
                        <div style={{ background: 'rgba(0,160,255,.92)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#fff', letterSpacing: .3 }}>📺</span>
                        </div>
                      )}
                      {gid === topSpeakerId && (
                        <div style={{ background: 'rgba(201,168,76,.92)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 7, lineHeight: 1 }}>👑</span>
                        </div>
                      )}
                      {gid === topGifterId && topGiftMax > 0 && (
                        <div style={{ background: 'rgba(100,200,120,.9)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 7, lineHeight: 1 }}>🏆</span>
                        </div>
                      )}
                      {isHand && (
                        <div style={{ background: 'rgba(255,140,0,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>✋{handPos > 0 ? ' #' + handPos : ''}</div>
                      )}
                      {isPinned && (
                        <div style={{ background: 'rgba(201,168,76,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#0E0C09' }}>📌</div>
                      )}
                      {isSp && (
                        <div style={{ background: 'rgba(212,133,74,.85)', borderRadius: 999, padding: '1px 5px', display: 'flex', alignItems: 'center' }}>
                          <SpeakBars color='#fff' small />
                        </div>
                      )}
                      {!isOwn && g.producerId && (producerQuality[g.producerId] === 'red' || producerQuality[g.producerId] === 'yellow') && (
                        <div style={{ background: producerQuality[g.producerId] === 'red' ? 'rgba(255,26,60,.88)' : 'rgba(240,165,0,.88)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#fff', letterSpacing: .3 }}>
                            {producerQuality[g.producerId] === 'red' ? 'POOR' : 'FAIR'}
                          </span>
                        </div>
                      )}
                      {!isOwn && g.producerId && frozenProducers[g.producerId] && (
                        <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(100,149,237,.5)', borderRadius: 999, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 7, lineHeight: 1 }}>❄</span>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: 'rgba(100,149,237,.9)', letterSpacing: .3 }}>FROZEN</span>
                        </div>
                      )}
                      {lowBwMode && !isOwn && (
                        <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(255,165,0,.4)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: 'rgba(255,165,0,.9)', letterSpacing: .3 }}>LO</span>
                        </div>
                      )}
                    </div>

                    {/* Own-cell ✋ raise-hand shortcut (guest/viewer) */}
                    {isOwn && role !== 'host' && role !== 'cohost' && (
                      <button
                        onClick={function(e) { e.stopPropagation(); raiseHand(); }}
                        title={handRaised ? 'Lower hand' : 'Raise hand'}
                        style={{ position: 'absolute', bottom: 5, left: 5, zIndex: 10, width: 22, height: 22, borderRadius: '50%', background: handRaised ? 'rgba(255,140,0,.9)' : 'rgba(0,0,0,.65)', border: '1px solid ' + (handRaised ? 'rgba(255,140,0,.9)' : 'rgba(255,255,255,.2)'), cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, animation: handRaised ? 'handBadgePulse 1.2s ease-in-out infinite' : 'none' }}>
                        ✋
                      </button>
                    )}

                    {/* Top-right buttons: expand + host ⋮ menu */}
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3, zIndex: 10 }}>
                      <button onClick={function(e) { e.stopPropagation(); setExpandedCell(gid); }}
                        style={{ width: 20, height: 20, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4, color: TEXT, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ⤢
                      </button>
                      {(role === 'host' || role === 'cohost') && !isOwn && (
                        <button onClick={function(e) { e.stopPropagation(); setCellMenuId(function(p) { return p === gid ? null : gid; }); }}
                          style={{ width: 20, height: 20, background: showMenu ? 'rgba(201,168,76,.25)' : 'rgba(0,0,0,.6)', border: '1px solid ' + (showMenu ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.18)'), borderRadius: 4, color: TEXT, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                          ⋮
                        </button>
                      )}
                    </div>

                    {/* Host context menu */}
                    {showMenu && (
                      <div style={{ position: 'absolute', top: 28, right: 4, background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, overflow: 'hidden', zIndex: 30, minWidth: 150, boxShadow: '0 6px 22px rgba(0,0,0,.75)', animation: 'cellMenuIn .15s ease' }}
                        onClick={function(e) { e.stopPropagation(); }}>
                        {[
                          { label: isPinned ? '📌 Unpin' : '📌 Pin (local)', action: 'pin' },
                          { label: spotlight && spotlight.guestId === gid ? '🔦 End spotlight' : '🔦 Spotlight all', action: 'spotlight' },
                          { label: g.remoteMuted ? '🎙 Unmute' : '🔇 Mute', action: 'mute' },
                          { label: g.role === 'cohost' ? '⬇ Demote to Guest' : '⬆ Promote to Co-host', action: 'promote' },
                          { label: (localLowerThirds[gid] && localLowerThirds[gid].visible) ? '📛 Hide name card' : '📛 Show name card', action: 'namecard' },
                          { label: '✏️ Edit name card', action: 'ltEdit' },
                          { label: isHand ? '✋ Invite to Stage' : null, action: 'invite', hide: !isHand },
                          { label: producerQuality[g.producerId] === 'red' ? '↺ Request Reconnect' : null, action: 'reconnect', hide: producerQuality[g.producerId] !== 'red' },
                          { label: '📸 Snapshot', action: 'snapshot' },
                          { label: '✂️ Mark Clip', action: 'clip' },
                          { label: hiddenVideos[gid] ? '📹 Restore Video' : '🙈 Hide Video (local)', action: 'hidevideo' },
                          { label: '📨 Message', action: 'msg' },
                          { label: '✏️ Rename (local)', action: 'rename' },
                          { label: '🎨 Cell Color', action: 'color' },
                          { label: guestNotes[gid] ? '📓 Note ✓' : '📓 Note', action: 'note' },
                          { label: '🚫 Remove from Stage', action: 'remove' },
                        ].filter(function(item) { return !item.hide; }).map(function(item) {
                          return (
                            <button key={item.action}
                              onClick={function(e) {
                                e.stopPropagation();
                                if (item.action === 'remove') {
                                  setRemoveConfirmId(gid);
                                  return;
                                }
                                setCellMenuId(null);
                                if (item.action === 'pin') {
                                  setPinnedId(function(p) { return p === gid ? null : gid; });
                                } else if (item.action === 'spotlight') {
                                  var isSpotlit = spotlight && spotlight.guestId === gid;
                                  if (isSpotlit) {
                                    if (socket) socket.emit('spotlight-end', { roomId: roomId });
                                  } else {
                                    if (socket) socket.emit('spotlight-guest', { roomId: roomId, guestId: gid, username: g.username || gid });
                                  }
                                } else if (item.action === 'mute') {
                                  if (socket) socket.emit(g.remoteMuted ? 'unmute-guest' : 'mute-guest', { roomId: roomId, guestId: gid });
                                } else if (item.action === 'invite') {
                                  if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: gid });
                                } else if (item.action === 'reconnect') {
                                  if (socket) socket.emit('request-reconnect', { roomId: roomId, guestId: gid });
                                  if (addToast) addToast('Reconnect request sent to ' + (g.username || gid), 'info');
                                } else if (item.action === 'promote') {
                                  var newRole = g.role === 'cohost' ? 'guest' : 'cohost';
                                  if (socket) socket.emit('promote-guest', { roomId: roomId, guestId: gid, role: newRole });
                                  if (addToast) addToast((g.username || gid) + ' → ' + newRole, 'success');
                                } else if (item.action === 'namecard') {
                                  setLocalLowerThirds(function(prev) {
                                    var cur = prev[gid] || {};
                                    var next = Object.assign({}, prev);
                                    next[gid] = { visible: !cur.visible, name: g.username || gid, title: (g.role || 'guest').toUpperCase() };
                                    return next;
                                  });
                                } else if (item.action === 'ltEdit') {
                                  var curLt = localLowerThirds[gid] || {};
                                  setLtEditName(curLt.name || g.username || gid);
                                  setLtEditTitle(curLt.title || (g.role || 'guest').toUpperCase());
                                  setLtEditGid(gid);
                                  return; // keep menu open
                                } else if (item.action === 'hidevideo') {
                                  setHiddenVideos(function(prev) {
                                    var next = Object.assign({}, prev);
                                    if (next[gid]) { delete next[gid]; } else { next[gid] = true; }
                                    return next;
                                  });
                                  if (addToastRef.current) addToastRef.current(hiddenVideos[gid] ? 'Video restored' : 'Video hidden (local)', 'info');
                                } else if (item.action === 'snapshot') {
                                  var snapEl = document.querySelector('[data-cell-gid="' + gid + '"] video');
                                  if (snapEl && snapEl.videoWidth > 0) {
                                    var cv = document.createElement('canvas');
                                    cv.width = snapEl.videoWidth; cv.height = snapEl.videoHeight;
                                    cv.getContext('2d').drawImage(snapEl, 0, 0);
                                    cv.toBlob(function(blob) {
                                      if (!blob) return;
                                      var _url = URL.createObjectURL(blob);
                                      var _a = document.createElement('a');
                                      _a.href = _url; _a.download = (g.username || gid) + '_snapshot.jpg'; _a.click();
                                      URL.revokeObjectURL(_url);
                                    }, 'image/jpeg', 0.9);
                                    if (addToastRef.current) addToastRef.current('Snapshot saved', 'success');
                                  } else {
                                    if (addToastRef.current) addToastRef.current('No video to snapshot', 'warning');
                                  }
                                } else if (item.action === 'clip') {
                                  var clipLabel = '✂️ ' + (g.username || gid);
                                  if (socket) socket.emit('clip-marker', { label: clipLabel });
                                  setClipLog(function(prev) { return [{ id: Date.now() + '', label: clipLabel, ts: Date.now() }].concat(prev); });
                                  if (addToastRef.current) addToastRef.current(clipLabel, 'success');
                                } else if (item.action === 'msg') {
                                  setMsgTargetGid(gid);
                                  setMsgInput('');
                                  return; // keep menu open
                                } else if (item.action === 'rename') {
                                  setRenamingGid(gid);
                                  setRenameInput(localGuestNames[gid] || g.username || '');
                                  return; // keep menu open
                                } else if (item.action === 'color') {
                                  // color picker handled inline — just close the main menu items
                                  return;
                                } else if (item.action === 'note') {
                                  setEditingGuestNote(function(p) { return p === gid ? null : gid; });
                                  return; // keep menu open
                                }
                              }}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 13px', background: 'none', border: 'none', borderBottom: '1px solid ' + DIM, color: item.action === 'remove' ? RED : TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer', letterSpacing: .3 }}>
                              {item.label}
                            </button>
                          );
                        })}
                        {/* Inline private message input */}
                        {msgTargetGid === gid && (
                          <div style={{ padding: '7px 10px 6px', borderTop: '1px solid ' + DIM }}>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, marginBottom: 5 }}>📨 PRIVATE MSG TO {(localGuestNames[gid] || g.username || gid).toUpperCase()}</div>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <input
                                autoFocus
                                value={msgInput}
                                onChange={function(e) { setMsgInput(e.target.value); }}
                                onKeyDown={function(e) {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    var text = msgInput.trim();
                                    if (text && socket) socket.emit('host-private-msg', { roomId: roomId, toGuestId: gid, text: text, from: username || 'Host' });
                                    if (text && addToastRef.current) addToastRef.current('Msg sent to ' + (localGuestNames[gid] || g.username || gid), 'success');
                                    setMsgTargetGid(null); setCellMenuId(null);
                                  } else if (e.key === 'Escape') { setMsgTargetGid(null); }
                                }}
                                onClick={function(e) { e.stopPropagation(); }}
                                maxLength={120}
                                placeholder="Type message, Enter to send…"
                                style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '4px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, outline: 'none', minWidth: 0 }}
                              />
                              <button
                                onClick={function(e) {
                                  e.stopPropagation();
                                  var text = msgInput.trim();
                                  if (text && socket) socket.emit('host-private-msg', { roomId: roomId, toGuestId: gid, text: text, from: username || 'Host' });
                                  if (text && addToastRef.current) addToastRef.current('Msg sent to ' + (localGuestNames[gid] || g.username || gid), 'success');
                                  setMsgTargetGid(null); setCellMenuId(null);
                                }}
                                style={{ background: GOLD, border: 'none', borderRadius: 5, padding: '4px 9px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#0E0C09', cursor: 'pointer', flexShrink: 0 }}>
                                ➤
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Inline rename input */}
                        {renamingGid === gid && (
                          <div style={{ padding: '7px 10px 6px', borderTop: '1px solid ' + DIM }}>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, marginBottom: 5 }}>✏️ LOCAL NAME</div>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <input
                                autoFocus
                                value={renameInput}
                                onChange={function(e) { setRenameInput(e.target.value); }}
                                onKeyDown={function(e) {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    var trimmed = renameInput.trim();
                                    setLocalGuestNames(function(prev) {
                                      var next = Object.assign({}, prev);
                                      if (trimmed) { next[gid] = trimmed; } else { delete next[gid]; }
                                      return next;
                                    });
                                    setRenamingGid(null); setCellMenuId(null);
                                  } else if (e.key === 'Escape') { setRenamingGid(null); }
                                }}
                                onClick={function(e) { e.stopPropagation(); }}
                                maxLength={32}
                                placeholder={g.username || gid}
                                style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '4px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, outline: 'none', minWidth: 0 }}
                              />
                              <button
                                onClick={function(e) {
                                  e.stopPropagation();
                                  var trimmed = renameInput.trim();
                                  setLocalGuestNames(function(prev) {
                                    var next = Object.assign({}, prev);
                                    if (trimmed) { next[gid] = trimmed; } else { delete next[gid]; }
                                    return next;
                                  });
                                  setRenamingGid(null); setCellMenuId(null);
                                }}
                                style={{ background: GOLD, border: 'none', borderRadius: 5, padding: '4px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: '#0E0C09', cursor: 'pointer', flexShrink: 0 }}>
                                ✓
                              </button>
                              {localGuestNames[gid] && (
                                <button
                                  onClick={function(e) {
                                    e.stopPropagation();
                                    setLocalGuestNames(function(prev) { var next = Object.assign({}, prev); delete next[gid]; return next; });
                                    setRenamingGid(null); setCellMenuId(null);
                                  }}
                                  title="Reset to original name"
                                  style={{ background: 'rgba(255,26,60,.18)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '4px 7px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: RED, cursor: 'pointer', flexShrink: 0 }}>
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Inline lower-thirds editor */}
                        {ltEditGid === gid && (
                          <div style={{ padding: '7px 10px 7px', borderTop: '1px solid ' + DIM }} onClick={function(e) { e.stopPropagation(); }}>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, marginBottom: 5 }}>✏️ NAME CARD</div>
                            <input
                              value={ltEditName}
                              onChange={function(e) { setLtEditName(e.target.value.slice(0, 40)); }}
                              placeholder="Display name"
                              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '4px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, outline: 'none', marginBottom: 4 }}
                            />
                            <input
                              value={ltEditTitle}
                              onChange={function(e) { setLtEditTitle(e.target.value.slice(0, 40)); }}
                              placeholder="Title / role"
                              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '4px 7px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEXT, outline: 'none', marginBottom: 6 }}
                            />
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button
                                onClick={function(e) {
                                  e.stopPropagation();
                                  setLocalLowerThirds(function(prev) {
                                    var next = Object.assign({}, prev);
                                    next[gid] = { visible: true, name: ltEditName.trim() || g.username || gid, title: ltEditTitle.trim() };
                                    return next;
                                  });
                                  setLtEditGid(null); setCellMenuId(null);
                                }}
                                style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 5, padding: '5px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                                SHOW
                              </button>
                              <button
                                onClick={function(e) {
                                  e.stopPropagation();
                                  setLocalLowerThirds(function(prev) {
                                    var next = Object.assign({}, prev);
                                    next[gid] = { visible: false, name: '', title: '' };
                                    return next;
                                  });
                                  setLtEditGid(null); setCellMenuId(null);
                                }}
                                style={{ flex: 1, background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 5, padding: '5px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: RED, cursor: 'pointer', letterSpacing: 1 }}>
                                CLEAR
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Cell accent color swatches */}
                        <div style={{ padding: '7px 10px 6px', borderTop: '1px solid ' + DIM }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, marginBottom: 5 }}>🎨 CELL COLOR</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {['', '#C9A84C', '#FF1A3C', '#00C3FF', '#00E676', '#FF6D00', '#CE93D8'].map(function(hex) {
                              var isActive = hex ? (cellColors[gid] === hex) : !cellColors[gid];
                              return (
                                <button key={hex || 'default'}
                                  onClick={function(e) {
                                    e.stopPropagation();
                                    setCellColors(function(prev) {
                                      var next = Object.assign({}, prev);
                                      if (hex) { next[gid] = hex; } else { delete next[gid]; }
                                      return next;
                                    });
                                  }}
                                  title={hex || 'Default'}
                                  style={{ width: 18, height: 18, borderRadius: '50%', background: hex || DIM, border: '2px solid ' + (isActive ? TEXT : 'transparent'), cursor: 'pointer', flexShrink: 0, outline: 'none', padding: 0 }}>
                                  {!hex && <span style={{ fontSize: 8, lineHeight: 1, color: MUTED }}>✕</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* Per-guest private note (host-local, never transmitted) */}
                        {editingGuestNote === gid && (
                          <div style={{ padding: '7px 10px 8px', borderTop: '1px solid ' + DIM }} onClick={function(e) { e.stopPropagation(); }}>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .3, marginBottom: 5 }}>📓 GUEST NOTE (private)</div>
                            <textarea
                              value={guestNotes[gid] || ''}
                              onChange={function(e) {
                                var val = e.target.value.slice(0, 400);
                                setGuestNotes(function(prev) { var next = Object.assign({}, prev); if (val) { next[gid] = val; } else { delete next[gid]; } return next; });
                              }}
                              onClick={function(e) { e.stopPropagation(); }}
                              placeholder="Private notes about this guest…"
                              rows={3}
                              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '5px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, outline: 'none', resize: 'none', lineHeight: 1.4 }}
                            />
                            {guestNotes[gid] && (
                              <button onClick={function(e) { e.stopPropagation(); setGuestNotes(function(prev) { var next = Object.assign({}, prev); delete next[gid]; return next; }); }}
                                style={{ marginTop: 4, background: 'none', border: 'none', fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED + '99', cursor: 'pointer', padding: 0, letterSpacing: .3 }}>
                                clear note
                              </button>
                            )}
                          </div>
                        )}
                        {removeConfirmId === gid && (
                          <div style={{ padding: '8px 12px', background: 'rgba(255,26,60,.08)', borderTop: '1px solid rgba(255,26,60,.25)' }}>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED, marginBottom: 6, letterSpacing: .3 }}>
                              Remove {g.username || gid} from stage?
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={function(e) { e.stopPropagation(); if (socket) socket.emit('stage-remove', { roomId: roomId, guestId: gid }); setRemoveConfirmId(null); setCellMenuId(null); }}
                                style={{ flex: 1, padding: '5px 0', background: 'rgba(255,26,60,.25)', border: '1px solid rgba(255,26,60,.5)', borderRadius: 5, color: RED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: .3 }}>
                                YES, REMOVE
                              </button>
                              <button
                                onClick={function(e) { e.stopPropagation(); setRemoveConfirmId(null); }}
                                style={{ flex: 1, padding: '5px 0', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 5, color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {!isOwn && (
                          <div style={{ padding: '7px 13px 6px', borderTop: '1px solid ' + DIM }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 9, flexShrink: 0 }}>{(guestVolumes[gid] || 1) === 0 ? '🔇' : '🔊'}</span>
                              <input
                                type="range" min="0" max="100"
                                value={Math.round((guestVolumes[gid] !== undefined ? guestVolumes[gid] : 1) * 100)}
                                onChange={function(e) {
                                  var vol = parseInt(e.target.value, 10) / 100;
                                  setGuestVolumes(function(prev) { var next = Object.assign({}, prev); next[gid] = vol; return next; });
                                }}
                                onClick={function(e) { e.stopPropagation(); }}
                                style={{ flex: 1, height: 3, cursor: 'pointer', accentColor: GOLD }} />
                              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, width: 24, textAlign: 'right', flexShrink: 0 }}>
                                {Math.round((guestVolumes[gid] !== undefined ? guestVolumes[gid] : 1) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                        {(function() {
                          var rs = g.producerId && consumerRawStats[g.producerId];
                          if (!rs) return null;
                          var dotColor = producerQuality[g.producerId] === 'red' ? '#FF1A3C' : producerQuality[g.producerId] === 'yellow' ? '#F0A500' : '#6DBF7E';
                          return (
                            <div style={{ padding: '7px 13px 8px', borderTop: '1px solid ' + DIM, display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>CONNECTION</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>bitrate</span>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEXT }}>{Math.round(rs.bitratekbps)} kbps</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>jitter</span>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEXT }}>{Math.round(rs.jitter)} ms</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>pkt loss</span>
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: rs.packetsLost > 5 ? RED : TEXT }}>{rs.packetsLost}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Cell footer */}
                    <div style={{ padding: '4px 8px 6px', background: CARD, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: localGuestNames[gid] ? GOLD : TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {localGuestNames[gid] || g.username || gid}
                        {isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 3 }}>(YOU)</span>}
                        {localGuestNames[gid] && <span style={{ color: MUTED, fontWeight: 400, fontSize: 8, marginLeft: 2 }}>*</span>}
                      </span>
                      <RolePill role={g.role || (isOwn ? role : 'guest')} />
                      {(isOwn ? isMuted : g.remoteMuted) && <span style={{ fontSize: 9 }}>🔇</span>}
                      {showCellStats && (speakingSnapshots[gid] || 0) > 0 && (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: TEAL, letterSpacing: .3, flexShrink: 0 }} title="Speaking time">
                          ⏱{Math.floor((speakingSnapshots[gid] || 0) / 60)}m{(speakingSnapshots[gid] || 0) % 60}s
                        </span>
                      )}
                      {!showCellStats && (speakingSnapshots[gid] || 0) >= 5 && (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: .3, flexShrink: 0 }}>
                          🗣{Math.floor((speakingSnapshots[gid] || 0) / 60)}m
                        </span>
                      )}
                      <StageTimer startMs={stageJoinTimesRef.current[gid]} />
                      {!isOwn && stageLimitSec > 0 && stageJoinTimesRef.current[gid] && (function() {
                        var elapsed = Math.floor((Date.now() - stageJoinTimesRef.current[gid]) / 1000);
                        var rem     = stageLimitSec - elapsed;
                        if (rem <= 0) return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: RED, letterSpacing: .3, flexShrink: 0 }}>⏰0s</span>;
                        if (rem <= 60) return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#F0A500', letterSpacing: .3, flexShrink: 0 }}>⏰{rem}s</span>;
                        return null;
                      })()}
                      {!isOwn && g.producerId && producerQuality[g.producerId] && (
                        <SignalBars quality={producerQuality[g.producerId]} />
                      )}
                      {(role === 'host' || role === 'cohost') && guestNotes[gid] && (
                        <span title="Has note" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6DBF7E', display: 'inline-block', flexShrink: 0 }} />
                      )}
                      {(role === 'host' || role === 'cohost') && (
                        <button
                          onClick={function(e) {
                            e.stopPropagation();
                            var seq = ['red', 'yellow', 'green', null];
                            var cur = guestTags[gid] || null;
                            var idx = seq.indexOf(cur);
                            var nxt = seq[(idx + 1) % seq.length];
                            setGuestTags(function(prev) { var n = Object.assign({}, prev); if (nxt) { n[gid] = nxt; } else { delete n[gid]; } return n; });
                          }}
                          title={guestTags[gid] ? 'Tag: ' + guestTags[gid] + ' — click to change' : 'Click to tag'}
                          style={{ width: 8, height: 8, borderRadius: '50%', background: guestTags[gid] === 'red' ? RED : guestTags[gid] === 'yellow' ? '#F0A500' : guestTags[gid] === 'green' ? '#6DBF7E' : DIM, border: guestTags[gid] ? 'none' : '1px solid ' + BORDER, cursor: 'pointer', padding: 0, outline: 'none', flexShrink: 0 }}
                        />
                      )}
                      {/* 🚀 Rocket reaction — send flying emoji to this tile */}
                      {!isOwn && (
                        <button
                          onClick={function(e) { e.stopPropagation(); if (socket) socket.emit('panel:reaction', { roomId: roomId, guestId: gid, emoji: '🚀' }); }}
                          title="Send rocket reaction"
                          style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', padding: '0 1px', lineHeight: 1, flexShrink: 0, opacity: .75 }}>
                          🚀
                        </button>
                      )}
                      {/* Ask to Speak — own cell only, non-host */}
                      {isOwn && role !== 'host' && role !== 'cohost' && (
                        <button
                          onClick={function(e) { e.stopPropagation(); raiseHand(); }}
                          title={handRaised ? 'Lower hand' : 'Ask to speak'}
                          style={{ background: handRaised ? 'rgba(255,140,0,.2)' : 'rgba(201,168,76,.08)', border: '1px solid ' + (handRaised ? 'rgba(255,140,0,.55)' : 'rgba(201,168,76,.3)'), borderRadius: 6, padding: '2px 4px', fontSize: 8, cursor: 'pointer', color: handRaised ? '#D4854A' : GOLD, fontFamily: "'DM Mono',monospace", letterSpacing: .3, flexShrink: 0, lineHeight: 1, animation: handRaised ? 'handBadgePulse 1.2s ease-in-out infinite' : 'none' }}>
                          {handRaised ? '✋' : '🎙'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SPLIT MODE ── Active speakers/pinned as tiles, others as avatar strip */}
          {stageLayout === 'split' && (function() {
            var activeTileIds = new Set();
            onStage.forEach(function(g) {
              var gid = g.guestId || g.userId || 'x';
              if (speakingIds[gid] || gid === pinnedId) activeTileIds.add(gid);
            });
            if (activeTileIds.size === 0) activeTileIds.add(userId);
            var tileGuests  = onStage.filter(function(g) { var gid = g.guestId || g.userId || 'x'; return activeTileIds.has(gid); });
            var stripGuests = onStage.filter(function(g) { var gid = g.guestId || g.userId || 'x'; return !activeTileIds.has(gid); });
            var tileCols = tileGuests.length <= 1 ? 1 : tileGuests.length <= 4 ? 2 : 3;
            return (
              <div key='split-root'>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + tileCols + ',1fr)', gap: 4 }}>
                  {tileGuests.map(function(g) {
                    var gid      = g.guestId || g.userId || 'x';
                    var isOwn    = gid === userId;
                    var isSp     = !!speakingIds[gid];
                    var isHand   = !!raisedHands[gid];
                    var handPos  = isHand ? handQueue.indexOf(gid) + 1 : 0;
                    var isPinned = gid === pinnedId;
                    return (
                      <div key={gid}
                        style={{ position: 'relative', background: CARD, borderRadius: 10, overflow: 'hidden',
                          border: '2px solid ' + (isSp ? TEAL + 'BB' : isPinned ? GOLD + '66' : isHand ? 'rgba(255,140,0,.65)' : BORDER),
                          animation: isSp ? 'speakPulseGrid 1.4s ease-in-out infinite' : 'fadeSlideIn .22s ease',
                          transition: 'border-color .2s' }}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                          <div style={{ position: 'absolute', inset: 0 }}>
                            {audioOnly ? (
                              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,' + CARD2 + ',' + BG + ')', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD + ')', border: '2px solid ' + (isSp ? TEAL : DIM), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD }}>{(g.username || gid).charAt(0).toUpperCase()}</span>
                                </div>
                                {isSp && <WaveBars color={TEAL} />}
                              </div>
                            ) : (
                              <OctCell
                                guest={g}
                                fill={true}
                                isHost={role === 'host'}
                                fadesMode={false}
                                branding={branding}
                                onTap={null}
                                socket={socket}
                                roomId={roomId}
                                userId={userId}
                                rtcManager={rtcReady ? rtcManager : null}
                                mediaConfig={isOwn ? medConf : null}
                                isMuted={isOwn ? isMuted : false}
                                isCamOff={isOwn ? isCamOff : false}
                                onMuteToggle={isOwn ? toggleMute : null}
                                onCamToggle={isOwn ? toggleCam : null}
                                onCameraTrack={isOwn ? function(t) { cameraTrackRef.current = t; if (rtcManager && rtcManager.producers && rtcManager.producers['video']) { rtcManager.replaceTrack('video', t).catch(function() {}); } } : null}
                                handRaised={isHand}
                                giftTotal={guestGiftTotals[gid] || 0}
                                activeEffect={panelEffects[gid] || null}
                                onPowerPlay={!isOwn && role !== 'host' ? function(guest) { setShowPowerPlay(guest); } : null}
                                isScreenSharing={isOwn ? isScreenSharing : !!(screenShareHost && screenShareHost.userId === gid)}
                                remoteQuality={isOwn ? null : (producerQuality[g.producerId] || null)}
                                mirrorOverride={isOwn ? mirrorSelf : undefined}
                                remoteVolume={isOwn ? undefined : (guestVolumes[gid] !== undefined ? guestVolumes[gid] : 1)}
                              />
                            )}
                          </div>
                        </div>
                        <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', gap: 3, zIndex: 10, pointerEvents: 'none' }}>
                          {gid === topSpeakerId && <div style={{ background: 'rgba(201,168,76,.92)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 7, lineHeight: 1 }}>👑</span></div>}
                          {gid === topGifterId && topGiftMax > 0 && <div style={{ background: 'rgba(100,200,120,.9)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 7, lineHeight: 1 }}>🏆</span></div>}
                          {isHand && <div style={{ background: 'rgba(255,140,0,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>✋{handPos > 0 ? ' #' + handPos : ''}</div>}
                          {isPinned && <div style={{ background: 'rgba(201,168,76,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#0E0C09' }}>📌</div>}
                          {isSp && <div style={{ background: 'rgba(212,133,74,.85)', borderRadius: 999, padding: '1px 5px', display: 'flex', alignItems: 'center' }}><SpeakBars color='#fff' small /></div>}
                          {!isOwn && g.producerId && (producerQuality[g.producerId] === 'red' || producerQuality[g.producerId] === 'yellow') && (
                            <div style={{ background: producerQuality[g.producerId] === 'red' ? 'rgba(255,26,60,.88)' : 'rgba(240,165,0,.88)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
                              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#fff', letterSpacing: .3 }}>{producerQuality[g.producerId] === 'red' ? 'POOR' : 'FAIR'}</span>
                            </div>
                          )}
                          {!isOwn && g.producerId && frozenProducers[g.producerId] && (
                            <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(100,149,237,.5)', borderRadius: 999, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <span style={{ fontSize: 7, lineHeight: 1 }}>❄</span>
                              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: 'rgba(100,149,237,.9)', letterSpacing: .3 }}>FROZEN</span>
                            </div>
                          )}
                          {lowBwMode && !isOwn && (
                            <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(255,165,0,.4)', borderRadius: 999, padding: '2px 5px', display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: 'rgba(255,165,0,.9)', letterSpacing: .3 }}>LO</span>
                            </div>
                          )}
                        </div>
                        <button onClick={function(e) { e.stopPropagation(); setExpandedCell(gid); }}
                          style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4, color: TEXT, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                          ⤢
                        </button>
                        <div style={{ padding: '4px 8px 6px', background: CARD, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.username || gid}
                            {isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 3 }}>(YOU)</span>}
                          </span>
                          <RolePill role={g.role || (isOwn ? role : 'guest')} />
                          {(isOwn ? isMuted : g.remoteMuted) && <span style={{ fontSize: 9 }}>🔇</span>}
                          {(speakingSnapshots[gid] || 0) >= 5 && (
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: .3, flexShrink: 0 }}>
                              🗣{Math.floor((speakingSnapshots[gid] || 0) / 60)}m
                            </span>
                          )}
                          <StageTimer startMs={stageJoinTimesRef.current[gid]} />
                          {!isOwn && stageLimitSec > 0 && stageJoinTimesRef.current[gid] && (function() {
                            var elapsed = Math.floor((Date.now() - stageJoinTimesRef.current[gid]) / 1000);
                            var rem     = stageLimitSec - elapsed;
                            if (rem <= 0) return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: RED, letterSpacing: .3, flexShrink: 0 }}>⏰0s</span>;
                            if (rem <= 60) return <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#F0A500', letterSpacing: .3, flexShrink: 0 }}>⏰{rem}s</span>;
                            return null;
                          })()}
                          {!isOwn && g.producerId && producerQuality[g.producerId] && (
                            <SignalBars quality={producerQuality[g.producerId]} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {stripGuests.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 5 }}>
                      {'OTHERS ON STAGE (' + stripGuests.length + ')'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                      {stripGuests.map(function(g) {
                        var gid    = g.guestId || g.userId || 'x';
                        var isHand = !!raisedHands[gid];
                        return (
                          <AudienceCircle
                            key={gid}
                            g={g}
                            speaking={!!speakingIds[gid]}
                            handRaised={isHand}
                            onInvite={null}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Featured layout */}
          {stageLayout === 'featured' && (function() {
            var featuredGid = featuredGuest.guestId || featuredGuest.userId;
            var featuredIsScreenSharing = featuredGid === userId ? isScreenSharing : !!(screenShareHost && screenShareHost.userId === featuredGid);
            var featuredIsSpotlit = !!(spotlight && spotlight.guestId === featuredGid);
            return (
            <div>
              {/* Big featured cell */}
              <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden', border: '1.5px solid ' + (featuredIsSpotlit ? GOLD + '99' : speakingIds[featuredGid] ? TEAL + '88' : BORDER), boxShadow: featuredIsSpotlit ? ('0 0 28px ' + GOLD + '44') : speakingIds[featuredGid] ? ('0 0 24px ' + TEAL + '33') : 'none', marginBottom: 10 }}>
                {featuredIsScreenSharing ? (
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                      <OctCell
                        guest={featuredGuest}
                        sz={0}
                        fill={true}
                        isHost={role === 'host'}
                        fadesMode={false}
                        branding={branding}
                        onTap={null}
                        socket={socket}
                        roomId={roomId}
                        userId={userId}
                        rtcManager={rtcReady ? rtcManager : null}
                        mediaConfig={featuredGid === userId ? medConf : null}
                        isMuted={featuredGid === userId ? isMuted : false}
                        isCamOff={featuredGid === userId ? isCamOff : false}
                        onMuteToggle={featuredGid === userId ? toggleMute : null}
                        onCamToggle={featuredGid === userId ? toggleCam : null}
                        giftTotal={guestGiftTotals[featuredGid] || 0}
                        handRaised={!!(raisedHands && raisedHands[featuredGid])}
                        activeEffect={panelEffects[featuredGid] || null}
                        isScreenSharing={featuredIsScreenSharing}
                        remoteQuality={featuredGid === userId ? null : (producerQuality[featuredGuest.producerId] || null)}
                        mirrorOverride={featuredGid === userId ? mirrorSelf : undefined}
                        remoteVolume={featuredGid === userId ? undefined : (guestVolumes[featuredGid] !== undefined ? guestVolumes[featuredGid] : 1)}
                      />
                      <OverlayCustomLT lowerThirds={mergedLowerThirds} guestId={featuredGid} />
                    </div>
                    {/* Camera PiP — own camera while screen sharing */}
                    {featuredGid === userId && !isCamOff && (
                      <div style={{
                        position: 'absolute',
                        ...(pipCorner === 'BR' ? {bottom:10,right:10} : pipCorner === 'BL' ? {bottom:10,left:10} : pipCorner === 'TR' ? {top:10,right:10} : {top:10,left:10}),
                        width: 110, zIndex: 20,
                      }}>
                        <button
                          onClick={function() { setPipCorner(function(c) { return c === 'BR' ? 'BL' : c === 'BL' ? 'TL' : c === 'TL' ? 'TR' : 'BR'; }); }}
                          title="Move camera PiP"
                          style={{ position: 'absolute', top: -8, left: -8, width: 20, height: 20, borderRadius: '50%', background: 'rgba(14,12,9,.92)', border: '1px solid rgba(201,168,76,.5)', color: GOLD, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, lineHeight: 1, padding: 0 }}>
                          ⤡
                        </button>
                        <div style={{ borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(201,168,76,.7)', boxShadow: '0 4px 18px rgba(0,0,0,.7)', background: '#0E0C09' }}>
                          <video
                            ref={pipVideoRef}
                            autoPlay={true}
                            playsInline={true}
                            muted={true}
                            style={{ width: '100%', display: 'block', transform: mirrorSelf ? 'scaleX(-1)' : 'none' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                <div style={{ position: 'relative' }}>
                  <OctCell
                    guest={featuredGuest}
                    sz={300}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={featuredGid === userId ? medConf : null}
                    isMuted={featuredGid === userId ? isMuted : false}
                    isCamOff={featuredGid === userId ? isCamOff : false}
                    onMuteToggle={featuredGid === userId ? toggleMute : null}
                    onCamToggle={featuredGid === userId ? toggleCam : null}
                    giftTotal={guestGiftTotals[featuredGid] || 0}
                    handRaised={!!(raisedHands && raisedHands[featuredGid])}
                    activeEffect={panelEffects[featuredGid] || null}
                    isScreenSharing={false}
                    remoteQuality={featuredGid === userId ? null : (producerQuality[featuredGuest.producerId] || null)}
                    mirrorOverride={featuredGid === userId ? mirrorSelf : undefined}
                    remoteVolume={featuredGid === userId ? undefined : (guestVolumes[featuredGid] !== undefined ? guestVolumes[featuredGid] : 1)}
                  />
                  <OverlayCustomLT lowerThirds={mergedLowerThirds} guestId={featuredGid} />
                </div>
                )}
                <div style={{ padding: '8px 12px 10px', background: CARD }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={function() { setStageLayout('grid'); }}
                      title="Back to grid"
                      style={{ flexShrink: 0, background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 13, padding: '0 4px 0 0', lineHeight: 1 }}>
                      ←
                    </button>
                    {onStage.length > 1 && (
                      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                        <button onClick={prevGuest} title="Previous guest  [  or  ←" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>‹</button>
                        <button onClick={nextGuest} title="Next guest  ]  or  →" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>›</button>
                      </div>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 16, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {featuredGuest.username || featuredGuest.guestId}
                    </span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .3, flexShrink: 0 }}>
                      {onStage.findIndex(function(g) { return (g.guestId || g.userId) === featuredId; }) + 1}/{onStage.length}
                    </span>
                    <RolePill role={featuredGuest.role || role} />
                    {speakingIds[featuredGuest.guestId || featuredGuest.userId] && <SpeakBars color={TEAL} small />}
                    {featuredGid !== userId && featuredGuest.producerId && frozenProducers[featuredGuest.producerId] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(14,12,9,.88)', border: '1px solid rgba(100,149,237,.4)', borderRadius: 999, padding: '2px 6px', flexShrink: 0 }}>
                        <span style={{ fontSize: 8, lineHeight: 1 }}>❄</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: 'rgba(100,149,237,.9)', letterSpacing: .3 }}>FROZEN</span>
                      </div>
                    )}
                    {featuredGid !== userId && featuredGuest.producerId && producerQuality[featuredGuest.producerId] && (
                      <SignalBars quality={producerQuality[featuredGuest.producerId]} />
                    )}
                    {onStage.length > 1 && (
                      <button
                        onClick={function() { setCinemaMode(function(v) { return !v; }); }}
                        title={cinemaMode ? 'Show thumbnails' : 'Cinema mode'}
                        style={{ flexShrink: 0, background: cinemaMode ? 'rgba(201,168,76,.18)' : 'none', border: '1px solid ' + (cinemaMode ? 'rgba(201,168,76,.4)' : 'transparent'), borderRadius: 5, color: cinemaMode ? GOLD : MUTED, cursor: 'pointer', fontSize: 10, padding: '2px 6px', fontFamily: "'DM Mono',monospace", letterSpacing: 0.3, lineHeight: 1 }}>
                        {cinemaMode ? '⊡' : '⊡'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Thumbnail strip */}
              {onStage.length > 1 && !cinemaMode && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                  {onStage.filter(function(g) {
                    return (g.guestId || g.userId) !== (featuredGuest.guestId || featuredGuest.userId);
                  }).map(function(g) {
                    var gid  = g.guestId || g.userId || 'x';
                    var isOwn = gid === userId;
                    var isSp  = !!speakingIds[gid];
                    return (
                      <div key={gid} onClick={function() { setAutoFocusSpeaker(false); setFeaturedId(gid); }}
                        style={{
                          flexShrink: 0, width: 90,
                          background: CARD2, borderRadius: 10, overflow: 'hidden',
                          border: '1.5px solid ' + (isSp ? TEAL + '66' : BORDER),
                          cursor: 'pointer', position: 'relative',
                        }}>
                        {!isOwn && g.producerId && (producerQuality[g.producerId] === 'red' || producerQuality[g.producerId] === 'yellow') && (
                          <div style={{ position: 'absolute', top: 3, left: 3, zIndex: 12, pointerEvents: 'none', background: producerQuality[g.producerId] === 'red' ? 'rgba(255,26,60,.88)' : 'rgba(240,165,0,.88)', borderRadius: 999, padding: '1px 4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: '#fff' }}>{producerQuality[g.producerId] === 'red' ? 'POOR' : 'FAIR'}</span>
                          </div>
                        )}
                        <OctCell
                          guest={g}
                          sz={90}
                          isHost={role === 'host'}
                          fadesMode={false}
                          branding={branding}
                          onTap={null}
                          socket={socket}
                          roomId={roomId}
                          userId={userId}
                          rtcManager={rtcReady ? rtcManager : null}
                          mediaConfig={isOwn ? medConf : null}
                          isMuted={isOwn ? isMuted : false}
                          isCamOff={isOwn ? isCamOff : false}
                          onMuteToggle={null}
                          onCamToggle={null}
                          giftTotal={guestGiftTotals[gid] || 0}
                          handRaised={!!(raisedHands && raisedHands[gid])}
                          activeEffect={panelEffects[gid] || null}
                          onPowerPlay={!isOwn && role !== 'host' ? function(guest) { setShowPowerPlay(guest); } : null}
                          isScreenSharing={isOwn ? isScreenSharing : !!(screenShareHost && screenShareHost.userId === gid)}
                          remoteQuality={isOwn ? null : (producerQuality[g.producerId] || null)}
                          remoteVolume={isOwn ? undefined : (guestVolumes[gid] !== undefined ? guestVolumes[gid] : 1)}
                        />
                        <div style={{ padding: '3px 5px 5px' }}>
                          <span style={{ fontSize: 10, color: MUTED, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.username || gid}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );}())}
          <OverlayBanner banner={overlayConfig && overlayConfig.banner} />
          <OverlayCountdown countdown={overlayConfig && overlayConfig.countdown} />
          <OverlayScoreBug scoreBug={overlayConfig && overlayConfig.scoreBug} />
          <ChyronOverlay socket={socket} roomId={roomId} role={role} isLive={isLive} />
          {ccLines.length > 0 && (
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, padding: '0 14px', zIndex: 50, pointerEvents: 'none' }}>
              {ccLines.map(function(l) {
                return (
                  <div key={l.id} style={{ background: 'rgba(0,0,0,.82)', borderRadius: 6, padding: '4px 10px', marginTop: 3, fontFamily: "'DM Mono',monospace", fontSize: 11, color: TEXT, animation: 'fadeSlideIn .25s ease', textAlign: 'center', lineHeight: 1.5 }}>
                    {l.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Hand-Raise Queue (host only) ── */}
        {role === 'host' && handQueue.length > 0 && (
          <div style={{ margin: '0 14px 10px', background: 'rgba(255,140,0,.06)', border: '1px solid rgba(255,140,0,.28)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1.5, color: '#D4854A' }}>✋ STAGE QUEUE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{handQueue.length} waiting</span>
                {onStage.length < MAX_STAGE && handQueue.length > 0 && (
                  <button
                    onClick={function() {
                      var nextGid = handQueue[0];
                      if (!nextGid || !socket) return;
                      var nextEntry = allGuestMap[nextGid] || { guestId: nextGid, username: nextGid };
                      socket.emit('stage-invite', { roomId: roomId, guestId: nextGid });
                      socket.emit('spotlight-guest', { roomId: roomId, guestId: nextGid, username: nextEntry.username || nextGid });
                      setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[nextGid]; return n; });
                    }}
                    title="Invite #1 and spotlight them"
                    style={{ background: TEAL, border: 'none', borderRadius: 5, padding: '2px 8px', fontSize: 7, color: BG, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .5, fontWeight: 700, flexShrink: 0 }}>
                    CALL NEXT
                  </button>
                )}
                <button
                  onClick={function() {
                    if (socket) socket.emit('lower-all-hands', { roomId: roomId });
                  }}
                  title="Lower all raised hands"
                  style={{ background: 'none', border: '1px solid rgba(255,140,0,.35)', borderRadius: 5, padding: '2px 7px', fontSize: 7, color: '#D4854A', cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: .5 }}>
                  CLEAR ALL
                </button>
              </div>
            </div>
            {handQueue.map(function(gid, idx) {
              var entry = allGuestMap[gid] || audienceList.find(function(x) { return (x.guestId || x.userId) === gid; }) || { guestId: gid, username: gid };
              var uname = entry.username || gid;
              var canInvite = onStage.length < MAX_STAGE;
              return (
                <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: idx < handQueue.length - 1 ? '1px solid rgba(255,140,0,.1)' : 'none' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#D4854A', minWidth: 18, textAlign: 'right' }}>#{idx + 1}</span>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(212,133,74,.3),rgba(14,12,9,.8))', border: '1px solid rgba(255,140,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: GOLD }}>{uname.charAt(0).toUpperCase()}</span>
                  </div>
                  <span style={{ flex: 1, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uname}</span>
                  {canInvite && (
                    <button
                      onClick={function() { if (socket) { socket.emit('stage-invite', { roomId: roomId, guestId: gid }); setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[gid]; return n; }); } }}
                      style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#0E0C09', background: GOLD, border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', letterSpacing: .5, flexShrink: 0 }}>
                      INVITE
                    </button>
                  )}
                  {!canInvite && (
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>FULL</span>
                  )}
                  <button
                    onClick={function() { setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[gid]; return n; }); }}
                    title="Dismiss — skip this guest"
                    style={{ width: 20, height: 20, background: 'none', border: '1px solid rgba(255,255,255,.15)', borderRadius: 4, color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0 }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Ask to Speak bar — shown to non-host users not yet on stage ── */}
        {role !== 'host' && role !== 'cohost' && onStage.every(function(g) { return (g.guestId || g.userId) !== userId; }) && (
          <div style={{ padding: '0 14px 10px' }}>
            <button
              onClick={raiseHand}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 14, cursor: 'pointer', border: 'none', background: handRaised ? 'rgba(255,140,0,.18)' : 'rgba(201,168,76,.12)', outline: '1.5px solid ' + (handRaised ? 'rgba(255,140,0,.55)' : 'rgba(201,168,76,.4)'), animation: handRaised ? 'handBadgePulse 1.4s ease-in-out infinite' : 'none' }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{handRaised ? '✋' : '🎙'}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: handRaised ? '#D4854A' : GOLD, letterSpacing: 1.5, lineHeight: 1 }}>{handRaised ? 'Hand Raised — Waiting for Host' : 'Ask to Speak'}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5 }}>{handRaised ? 'tap to lower' : 'Request mic access from the host'}</span>
              </div>
            </button>
          </div>
        )}

        {/* ── Audience Section ── */}
        {(audienceList.length > 0 || (role !== 'host' && onStage.every(function(g) { return (g.guestId || g.userId) !== userId; }))) && (
          <div style={{ padding: '10px 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: MUTED, letterSpacing: .3 }}>
                  In the Room
                </span>
                {handQueue.length > 0 && (
                  <span style={{ background: 'rgba(255,140,0,.18)', border: '1px solid rgba(255,140,0,.4)', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#D4854A', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>
                    ✋ {handQueue.length} in queue
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {role === 'host' && audienceList.length > 0 && onStage.length < MAX_STAGE && (
                  <button
                    onClick={function() {
                      if (socket) socket.emit('stage-invite-all', { roomId: roomId });
                      if (addToast) addToast('Stage invite sent to all (' + audienceList.length + ')', 'success');
                    }}
                    title="Invite everyone in the audience to stage"
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, background: 'rgba(212,133,74,.12)', border: '1px solid rgba(212,133,74,.35)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', letterSpacing: .5, flexShrink: 0 }}>
                    + INVITE ALL
                  </button>
                )}
                {audienceList.length > 8 && (
                  <button onClick={function() { setShowAllAud(function(v) { return !v; }); }}
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: .5 }}>
                    {showAllAud ? 'COLLAPSE' : 'SEE ALL (' + audienceList.length + ')'}
                  </button>
                )}
              </div>
            </div>
            {/* Emoji reaction bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {['🚀','🔥','❤️','👏','💯','🎉','😂'].map(function(em) {
                return (
                  <button key={em} onClick={function() {
                    var rid = Date.now() + em;
                    var x   = 10 + Math.floor(Math.random() * 80);
                    setReactionBurst(function(prev) { return prev.concat([{ id: rid, emoji: em, x: x }]); });
                    setTimeout(function() { setReactionBurst(function(prev) { return prev.filter(function(r) { return r.id !== rid; }); }); }, 2200);
                    if (socket) socket.emit('stage-reaction', { roomId: roomId, emoji: em });
                  }}
                    style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '4px 9px', fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>
                    {em}
                  </button>
                );
              })}
            </div>

            {showAllAud ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {audienceList.map(function(g) {
                  var gid = g.guestId || g.userId || 'x';
                  var isHand = !!raisedHands[gid];
                  return (
                    <AudienceCircle key={gid} g={g} speaking={!!speakingIds[gid]}
                      handRaised={isHand}
                      isTopGifter={topGifterId === gid && topGiftMax > 0}
                      onInvite={role === 'host' && onStage.length < MAX_STAGE ? function() { if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: gid }); } : undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {audienceList.slice(0, 20).map(function(g) {
                  var gid = g.guestId || g.userId || 'x';
                  var isHand = !!raisedHands[gid];
                  return (
                    <AudienceCircle key={gid} g={g} speaking={!!speakingIds[gid]}
                      handRaised={isHand}
                      isTopGifter={topGifterId === gid && topGiftMax > 0}
                      onInvite={role === 'host' && onStage.length < MAX_STAGE ? function() { if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: gid }); } : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Quick Action Tools ── */}
        <div style={{ padding: '6px 14px 10px', display: 'flex', gap: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { emoji: '💸', label: 'Pay',      active: false, onTap: function() { setShowPaySheet(true); } },
            { emoji: '💬', label: 'SC',       active: false, onTap: function() { setShowSuperChatSheet(true); } },
            { emoji: '🚀', label: 'Voice SC', active: false, onTap: function() { setShowTTSSheet(true); } },
            { emoji: '🎞', label: 'GIF',      active: showGifInput, onTap: function() { setShowGifInput(function(v) { return !v; }); } },
            { emoji: '🔗', label: 'Share',    active: false, onTap: function() { setShowShareSheet(true); } },
            { emoji: '🎤', label: audioOnly ? 'Video ON' : 'Audio', active: audioOnly, onTap: function() { setAudioOnly(function(v) { return !v; }); if (addToast) addToast(audioOnly ? 'Video mode on' : '🎤 Audio-only mode', 'info'); } },
            { emoji: privateMode ? '🔒' : '🔓', label: 'Private', active: privateMode, onTap: function() { if (role === 'host') { setShowPrivateSet(true); } else { if (addToast) addToast(privateMode ? 'Room is private — invite only' : 'Room is open', 'info'); } } },
            { emoji: '📹', label: 'Record',   active: recState === 'recording', onTap: function() { setShowRecorder(true); } },
            { emoji: '📊', label: 'Poll',     active: false, onTap: function() { setShowQa(true); setShowPollCreate(true); setShowVsCreate(false); setShowJudges(false); setChatOpen(false); } },
            { emoji: '⚔',  label: 'VS',      active: false, onTap: function() { setShowQa(true); setShowVsCreate(true); setShowPollCreate(false); setShowJudges(false); setChatOpen(false); } },
            { emoji: '⚖',  label: 'Judges',  active: false, onTap: function() { setShowQa(true); setShowJudges(true); setShowPollCreate(false); setShowVsCreate(false); setChatOpen(false); } },
            { emoji: '⚙',  label: 'Camera',  active: false, onTap: function() { setShowMediaConf(true); } },
            { emoji: '📝', label: 'CC',      active: ccEnabled, onTap: function() { setCcEnabled(function(v) { var n = !v; if (!n) setCcLines([]); return n; }); if (addToast) addToast(ccEnabled ? 'Closed captions OFF' : '📝 Closed captions ON — mic transcribing', ccEnabled ? 'info' : 'success'); } },
          ].map(function(tool) {
            return (
              <div key={tool.label} onClick={tool.onTap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: tool.active ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (tool.active ? 'rgba(201,168,76,.4)' : BORDER), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'background .15s' }}>
                  {tool.emoji}
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: tool.active ? TEAL : MUTED, letterSpacing: .5 }}>{tool.label}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer for fixed bar */}
        <div style={{ height: 74 }} />
      </div>

      {/* ════════════════ STAGE INVITE MODAL ════════════════ */}
      {stageInvitePending && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.55)', animation: 'fadeSlideIn .25s ease' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#1A1510', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid rgba(201,168,76,.2)', boxShadow: '0 -8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎤</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>
                You're invited to the stage!
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginTop: 6 }}>
                {stageInvitePending.invitedBy} wants you to join the panel
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={function() {
                  if (socket) socket.emit('stage-invite-accept', { hostSocketId: stageInvitePending.hostSocketId });
                  setStageInvitePending(null);
                  if (addToast) addToast('🎤 You joined the stage!', 'success');
                }}
                style={{ flex: 1, padding: '14px 0', background: 'linear-gradient(135deg,#800020,#C01838)', border: 'none', borderRadius: 12, color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, cursor: 'pointer' }}>
                ACCEPT
              </button>
              <button
                onClick={function() {
                  if (socket) socket.emit('stage-invite-decline', { hostSocketId: stageInvitePending.hostSocketId });
                  setStageInvitePending(null);
                }}
                style={{ flex: 1, padding: '14px 0', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, cursor: 'pointer' }}>
                DECLINE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ FOLLOW ALERT ════════════════ */}
      {followAlert && (
        <div style={{ position: 'absolute', top: 72, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 60, pointerEvents: 'none', animation: 'fadeSlideIn .3s ease' }}>
          <div style={{ background: 'rgba(255,26,60,.9)', borderRadius: 14, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 4px 24px rgba(255,26,60,.45)', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>❤️</span>
            <div>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: '#fff', letterSpacing: 1.2 }}>{followAlert.follower}</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,.82)', marginLeft: 6 }}>is now following!</span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SHOUTOUT BANNER ════════════════ */}
      {shoutout && (
        <div style={{ position: 'absolute', left: 12, right: 12, top: 72, zIndex: 62, pointerEvents: 'none', animation: 'fadeSlideIn .35s ease' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.08))', border: '1.5px solid rgba(201,168,76,.55)', borderRadius: 16, padding: '14px 18px', boxShadow: '0 6px 28px rgba(201,168,76,.22),0 2px 12px rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 5 }}>🎤 SHOUTOUT from {shoutout.by}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: gold, letterSpacing: 3, lineHeight: 1, textShadow: '0 0 20px rgba(201,168,76,.6)' }}>@{shoutout.username}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginTop: 4 }}>✨ show some love in chat!</div>
          </div>
        </div>
      )}

      {/* ════════════════ VIEWER MILESTONE CELEBRATION ════════════════ */}
      {viewerMilestone && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, pointerEvents: 'none', animation: 'fadeSlideIn .4s ease' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 8, filter: 'drop-shadow(0 0 18px rgba(201,168,76,.8))' }}>🎉</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 54, color: gold, letterSpacing: 4, lineHeight: 1, textShadow: '0 0 32px rgba(201,168,76,.9),0 4px 16px rgba(0,0,0,.9)' }}>
              {(viewerMilestone.count || 0).toLocaleString()}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 6, marginTop: 4, textShadow: '0 2px 12px rgba(0,0,0,.9)' }}>VIEWERS</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginTop: 6, letterSpacing: 2 }}>milestone reached</div>
          </div>
        </div>
      )}

      {/* ════════════════ FLOATING REACTIONS ════════════════ */}
      {floatReacts.map(function(r) {
        return (
          <div key={r.fid} style={{
            position: 'absolute', left: '38%', bottom: 90,
            fontSize: 28, pointerEvents: 'none', zIndex: 55,
            animation: 'fadeSlideIn .4s ease',
          }}>
            {r.emoji}
          </div>
        );
      })}

      <GiftLayer giftFloats={tipFeed} />

      {/* ════════════════ POWER PLAY PANEL ════════════════ */}
      {showPowerPlay && (
        <PowerPlayPanel
          targetGuest={showPowerPlay}
          pendingPlayId={pendingPPId}
          onClose={function() { setShowPowerPlay(null); }}
          onSend={function(payload) {
            if (socket) socket.emit('send-gift', payload);
            setShowPowerPlay(null);
          }}
        />
      )}

      {/* ════════════════ HOST POWER PLAY APPROVAL ════════════════ */}
      {role === 'host' && hostPendingPlays.length > 0 && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340, width: '92vw' }}>
          {hostPendingPlays.map(function(pp) {
            return (
              <div key={pp.playId} style={{ background: '#1A1510', border: '1px solid rgba(201,168,76,.4)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{pp.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#F0E8D4' }}>{pp.fromUser} → {pp.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#8A7A62' }}>target: {pp.targetGuestId}</div>
                </div>
                <button onClick={function() {
                  if (socket) socket.emit('power-play:approve', { playId: pp.playId });
                  setHostPendingPlays(function(prev) { return prev.filter(function(p) { return p.playId !== pp.playId; }); });
                }} style={{ background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 8, padding: '4px 10px', color: '#C9A84C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>✓</button>
                <button onClick={function() {
                  if (socket) socket.emit('power-play:reject', { playId: pp.playId });
                  setHostPendingPlays(function(prev) { return prev.filter(function(p) { return p.playId !== pp.playId; }); });
                }} style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 8, padding: '4px 10px', color: '#FF1A3C', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ AUDIO-ONLY BANNER ════════════════ */}
      {audioOnly && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(201,168,76,.12)', borderBottom: '1px solid rgba(201,168,76,.3)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 35, pointerEvents: 'none' }}>
          <WaveBars color={TEAL} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 2 }}>AUDIO-ONLY MODE</span>
        </div>
      )}

      {/* ════════════════ REACT PICKER ════════════════ */}
      {reactsOpen && (
        <div style={{
          position: 'absolute', bottom: 80, right: 12,
          background: CARD2, border: '1px solid ' + BORDER, borderRadius: 20,
          padding: '10px 14px', display: 'flex', gap: 10, zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'fadeSlideIn .2s ease',
        }}>
          {customReactions.map(function(e) {
            return (
              <button key={e} onClick={function() { sendReact(e); }}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '2px 3px', borderRadius: 8, transition: 'transform .1s' }}>
                {e}
              </button>
            );
          })}
          {(role === 'host' || role === 'cohost') && (
            <button onClick={function() { setShowReactionPicker(function(v) { return !v; }); setReactsOpen(false); }}
              title="Customise reactions"
              style={{ background: 'none', border: '1px dashed rgba(255,255,255,.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer', padding: '2px 5px', color: MUTED, lineHeight: 1 }}>
              ✎
            </button>
          )}
        </div>
      )}

      {/* ════════════════ REACTION EMOJI PICKER ════════════════ */}
      {showReactionPicker && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 93, display: 'flex', alignItems: 'flex-end', animation: 'fadeSlideIn .18s ease' }}
          onClick={function() { setShowReactionPicker(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '16px 16px 0 0', border: '1px solid ' + BORDER, padding: '16px', boxShadow: '0 -10px 40px rgba(0,0,0,.7)' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEXT, letterSpacing: 1 }}>🎭 Reaction Emojis</span>
              <button onClick={function() { setShowReactionPicker(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 10 }}>TAP A SLOT TO CHANGE IT</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {customReactions.map(function(em, idx) {
                var isActive = reactionPickerSlot === idx;
                return (
                  <button key={idx}
                    onClick={function() { setReactionPickerSlot(idx); setReactionPickerInput(em); }}
                    style={{ flex: 1, background: isActive ? 'rgba(201,168,76,.18)' : CARD, border: '1.5px solid ' + (isActive ? GOLD : BORDER), borderRadius: 10, padding: '8px 4px', fontSize: 22, cursor: 'pointer', textAlign: 'center' }}>
                    {em}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={reactionPickerInput}
                onChange={function(e) { setReactionPickerInput(e.target.value.slice(0, 4)); }}
                placeholder="Paste emoji…"
                style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: TEXT, outline: 'none', textAlign: 'center' }}
              />
              <button
                onClick={function() {
                  if (!reactionPickerInput) return;
                  setCustomReactions(function(prev) {
                    var next = prev.slice();
                    next[reactionPickerSlot] = reactionPickerInput;
                    return next;
                  });
                  setReactionPickerInput('');
                }}
                style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                SET
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {['🔥','❤️','😂','👍','💎','⚡','🎉','💯','👏','🙌','😮','💪','🫶','🤩','🥳','🫡','💸','👑','🚀','✨'].map(function(em) {
                return (
                  <button key={em}
                    onClick={function() {
                      setCustomReactions(function(prev) {
                        var next = prev.slice();
                        next[reactionPickerSlot] = em;
                        return next;
                      });
                    }}
                    style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 8, padding: '5px 6px', fontSize: 18, cursor: 'pointer' }}>
                    {em}
                  </button>
                );
              })}
            </div>
            <button
              onClick={function() { setCustomReactions(['🔥','❤️','😂','👍','💎','⚡']); setShowReactionPicker(false); }}
              style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
              RESET TO DEFAULT
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ CHAT PANEL ════════════════ */}
      {chatOpen && (
        <div style={{
          position: 'absolute', bottom: 62, left: 0, right: 0,
          height: '52%', background: 'rgba(9,7,14,.97)',
          borderTop: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column',
          animation: 'slideUp .2s ease', zIndex: 48,
        }}>
          {/* Chat header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: TEXT, letterSpacing: .3 }}>Chat</span>
              {slowModeSec > 0 && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, background: 'rgba(255,255,255,.07)', borderRadius: 4, padding: '2px 5px', letterSpacing: 1 }}>🐌 {slowModeSec}s</span>}
              {subscriberOnly && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '2px 5px', letterSpacing: 1 }}>⭐ SUB ONLY</span>}
              {(function() {
                var maxVal = Math.max.apply(null, chatSparkline.concat([1]));
                return (
                  <div title="Chat activity (last 60s)" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12, marginLeft: 2 }}>
                    {chatSparkline.map(function(v, i) {
                      var pct = maxVal > 0 ? v / maxVal : 0;
                      var isLast = i === chatSparkline.length - 1;
                      return (
                        <div key={i} style={{ width: 3, borderRadius: 1, background: isLast ? GOLD : 'rgba(201,168,76,.35)', height: Math.max(2, Math.round(pct * 12)), alignSelf: 'flex-end', transition: 'height .3s ease' }} />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() {
                  var steps = [0, 3, 5, 10, 30, 60];
                  var next = steps[(steps.indexOf(slowModeSec) + 1) % steps.length];
                  if (socket) socket.emit('set-slow-mode', { seconds: next });
                }} style={{ background: slowModeSec > 0 ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (slowModeSec > 0 ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '3px 7px', color: slowModeSec > 0 ? gold : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', letterSpacing: 1 }}>
                  🐌 {slowModeSec > 0 ? (slowModeSec + 's') : 'OFF'}
                </button>
              )}
              {starredMsgs.length > 0 && (
                <button onClick={function() { setShowStarred(function(v) { return !v; }); }}
                  title="Show starred messages"
                  style={{ background: showStarred ? 'rgba(240,165,0,.2)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (showStarred ? 'rgba(240,165,0,.5)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '3px 7px', color: showStarred ? '#F0A500' : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', lineHeight: 1 }}>
                  ⭐{starredMsgs.length}
                </button>
              )}
              <button onClick={function() { setShowChatSearch(function(v) { return !v; }); if (showChatSearch) setChatSearch(''); }}
                title="Search chat"
                style={{ background: showChatSearch ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (showChatSearch ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '3px 7px', color: showChatSearch ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', lineHeight: 1 }}>
                🔍
              </button>
              <button onClick={downloadChat} title="Export chat as .txt"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '3px 7px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', lineHeight: 1 }}>
                📥
              </button>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() { setShowWordFilter(function(v) { return !v; }); }}
                  title={wordFilter.length > 0 ? ('Word filter: ' + wordFilter.length + ' words') : 'Word filter (none)'}
                  style={{ background: wordFilter.length > 0 ? 'rgba(255,140,0,.15)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (wordFilter.length > 0 ? 'rgba(255,140,0,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '3px 7px', color: wordFilter.length > 0 ? 'rgba(255,140,0,.9)' : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', lineHeight: 1 }}>
                  🚫{wordFilter.length > 0 ? (' ' + wordFilter.length) : ''}
                </button>
              )}
              <button onClick={function() {
                var next = !soundOn;
                setSoundOn(next);
                soundOnRef.current = next;
              }} title={soundOn ? 'Mute sound alerts' : 'Enable sound alerts'}
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '3px 7px', color: soundOn ? MUTED : RED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', lineHeight: 1 }}>
                {soundOn ? '🔊' : '🔇'}
              </button>
              <button onClick={function() { setChatOpen(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
            </div>
          </div>
          {/* Chat search bar */}
          {showChatSearch && (
            <div style={{ padding: '7px 12px', borderBottom: '1px solid ' + DIM, background: 'rgba(201,168,76,.04)', flexShrink: 0 }}>
              <input
                autoFocus
                value={chatSearch}
                onChange={function(e) { setChatSearch(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Escape') { setChatSearch(''); setShowChatSearch(false); } }}
                placeholder="Search by name or message…"
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 10px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, outline: 'none' }}
              />
              {chatSearch && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 4, letterSpacing: .3 }}>
                  {(function() {
                    var q = chatSearch.toLowerCase();
                    var count = (chat || []).filter(function(m) { return (m.message || '').toLowerCase().indexOf(q) !== -1 || (m.username || '').toLowerCase().indexOf(q) !== -1; }).length;
                    return count + ' match' + (count !== 1 ? 'es' : '');
                  })()}
                </div>
              )}
            </div>
          )}
          {/* Word filter editor (host/cohost) */}
          {showWordFilter && (role === 'host' || role === 'cohost') && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + DIM, background: 'rgba(255,140,0,.06)', flexShrink: 0 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(255,140,0,.8)', letterSpacing: .5, marginBottom: 6 }}>🚫 WORD FILTER — messages containing these words show as [filtered]</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                <input
                  value={wordFilterInput}
                  onChange={function(e) { setWordFilterInput(e.target.value.slice(0, 40)); }}
                  onKeyDown={function(e) {
                    if (e.key === 'Enter') {
                      var w = wordFilterInput.trim().toLowerCase();
                      if (w && !wordFilter.includes(w)) setWordFilter(function(prev) { return prev.concat([w]); });
                      setWordFilterInput('');
                    }
                  }}
                  placeholder="Add word…"
                  style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 5, padding: '4px 7px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, outline: 'none' }}
                />
                <button
                  onClick={function() {
                    var w = wordFilterInput.trim().toLowerCase();
                    if (w && !wordFilter.includes(w)) setWordFilter(function(prev) { return prev.concat([w]); });
                    setWordFilterInput('');
                  }}
                  style={{ background: 'rgba(255,140,0,.2)', border: '1px solid rgba(255,140,0,.4)', borderRadius: 5, padding: '4px 10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: 'rgba(255,140,0,.9)', cursor: 'pointer', letterSpacing: 1 }}>
                  ADD
                </button>
              </div>
              {wordFilter.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {wordFilter.map(function(w) {
                    return (
                      <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,140,0,.12)', border: '1px solid rgba(255,140,0,.3)', borderRadius: 4, padding: '2px 6px' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: 'rgba(255,140,0,.9)' }}>{w}</span>
                        <button onClick={function() { setWordFilter(function(prev) { return prev.filter(function(x) { return x !== w; }); }); }}
                          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1 }}>✕</button>
                      </div>
                    );
                  })}
                  <button onClick={function() { setWordFilter([]); }}
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>clear all</button>
                </div>
              )}
            </div>
          )}
          {/* Pinned message banner */}
          {pinnedMsg && (
            <div style={{ padding: '7px 14px', background: 'rgba(201,168,76,.10)', borderBottom: '1px solid rgba(201,168,76,.22)', display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>📌</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, display: 'block', marginBottom: 2 }}>{pinnedMsg.username}</span>
                <p style={{ margin: 0, fontSize: 12, color: TEXT, lineHeight: 1.4, wordBreak: 'break-word' }}>{pinnedMsg.message}</p>
              </div>
              {role === 'host' && (
                <button onClick={function() { if (socket) socket.emit('unpin-chat-message', {}); }}
                  style={{ background: 'none', border: 'none', color: MUTED, fontSize: 13, cursor: 'pointer', padding: '1px 3px', lineHeight: 1, flexShrink: 0 }}>✕</button>
              )}
            </div>
          )}
          {/* Messages */}
          <div ref={chatScrollRef}
            onScroll={function() {
              var el = chatScrollRef.current;
              if (!el) return;
              var fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
              if (fromBottom > 120) { setChatScrolledUp(true); }
              else { setChatScrolledUp(false); setChatUnread(0); }
            }}
            style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', position: 'relative' }}>
            {chatScrolledUp && chatUnread > 0 && (
              <div style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                <button
                  onClick={function() {
                    setChatScrolledUp(false); setChatUnread(0);
                    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ background: GOLD, border: 'none', borderRadius: 999, padding: '4px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: BG, cursor: 'pointer', letterSpacing: 1, boxShadow: '0 2px 10px rgba(201,168,76,.45)' }}>
                  ↓ {chatUnread} NEW
                </button>
              </div>
            )}
            {(!chat || chat.length === 0) && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No messages yet</div>
            )}
            {chat && (function() {
              var msgs = chat;
              if (chatSearch) msgs = msgs.filter(function(m) { var q = chatSearch.toLowerCase(); return (m.message || '').toLowerCase().indexOf(q) !== -1 || (m.username || '').toLowerCase().indexOf(q) !== -1; });
              if (showStarred && starredMsgs.length > 0) msgs = msgs.filter(function(m) { return m.id && starredMsgs.indexOf(m.id) >= 0; });
              return msgs;
            })().map(function(m, i) {
              if (m.type === 'super') {
                var scColor = m.tierColor || '#C9A84C';
                var scDollars = '$' + (Math.floor(m.amountCents || 0) / 100).toFixed(2);
                return (
                  <div key={m.id || i} style={{ marginBottom: 12, background: scColor + '18', border: '1.5px solid ' + scColor + '66', borderRadius: 12, padding: '10px 12px', animation: 'fadeSlideIn .2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>💬</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: scColor, letterSpacing: 1 }}>{scDollars} SUPER CHAT</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: scColor, opacity: .8 }}>from {m.username}</span>
                    </div>
                    <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45, fontWeight: 600 }}>{m.message}</p>
                  </div>
                );
              }
              if (m.type === 'tts-super') {
                var ttsColor = m.tierColor || '#C9A84C';
                var ttsDollars = '$' + (Math.floor(m.amountCents || 0) / 100).toFixed(2);
                var voiceEmoji = (m.voice && m.voice.emoji) ? m.voice.emoji : '🎙';
                var voiceLabel = (m.voice && m.voice.label) ? m.voice.label : 'Voice';
                return (
                  <div key={m.id || i} style={{ marginBottom: 12, background: 'linear-gradient(135deg,' + ttsColor + '22,rgba(255,26,60,.1))', border: '1.5px solid ' + ttsColor + '88', borderRadius: 12, padding: '10px 12px', animation: 'fadeSlideIn .2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>🚀</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: ttsColor, letterSpacing: 1 }}>{ttsDollars} VOICE SC</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>from {m.username}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: 8, color: ttsColor, background: ttsColor + '22', borderRadius: 4, padding: '1px 5px' }}>{voiceEmoji} {voiceLabel}</span>
                    </div>
                    <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45, fontWeight: 600, fontStyle: 'italic' }}>"{m.message}"</p>
                  </div>
                );
              }
              if (m.type === 'gif') {
                return (
                  <div key={m.id || i} style={{ marginBottom: 12, animation: 'fadeSlideIn .2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: gold }}>{m.username || 'Guest'}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>GIF</span>
                    </div>
                    <img src={m.message} alt="gif" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, display: 'block' }} onError={function(e) { e.target.style.display = 'none'; }} />
                  </div>
                );
              }
              var isMention = username && (m.message || '').toLowerCase().indexOf('@' + username.toLowerCase()) !== -1 && m.userId !== userId;
              if (isMention) {
                playTone([440], 0.1);
              }
              return (
                <div key={m.id || i} style={{ marginBottom: 12, animation: 'fadeSlideIn .2s ease', position: 'relative', background: isMention ? 'rgba(201,168,76,.09)' : 'transparent', border: isMention ? '1px solid rgba(201,168,76,.25)' : '1px solid transparent', borderRadius: isMention ? 8 : 0, padding: isMention ? '4px 8px' : 0, marginLeft: isMention ? -8 : 0, marginRight: isMention ? -8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: gold }}>{m.username || 'Guest'}</span>
                    {isMention && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: .5 }}>@you</span>}
                    {m.ts && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>
                      {new Date(m.ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>}
                    {m.id && (
                      <button onClick={function() {
                        var key = m.id;
                        setStarredMsgs(function(prev) {
                          var idx = prev.indexOf(key);
                          if (idx >= 0) { var n = prev.slice(); n.splice(idx, 1); return n; }
                          return prev.concat([key]);
                        });
                      }} title={starredMsgs.indexOf(m.id) >= 0 ? 'Unstar' : 'Star'}
                      style={{ background: 'none', border: 'none', color: starredMsgs.indexOf(m.id) >= 0 ? '#F0A500' : 'transparent', fontSize: 10, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>
                        ⭐
                      </button>
                    )}
                    {(role === 'host' || role === 'cohost') && (
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                        <button onClick={function() {
                          if (socket) socket.emit('pin-chat-message', { id: m.id || '', username: m.username || 'Guest', message: m.message || '', ts: m.ts || 0 });
                        }} title="Pin message" style={{ background: 'none', border: 'none', color: pinnedMsg && pinnedMsg.id === m.id ? gold : MUTED, fontSize: 11, cursor: 'pointer', padding: '0 2px', lineHeight: 1, opacity: .75 }}>📌</button>
                        {m.message && (
                          <button onClick={function() {
                            var d = new Date(m.ts ? m.ts * 1000 : Date.now());
                            var hh = (d.getHours() < 10 ? '0' : '') + d.getHours();
                            var mm2 = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
                            var line = '[' + hh + ':' + mm2 + '] ' + (m.username || '?') + ': ' + (m.message || '');
                            setNoteText(function(prev) { return (prev ? prev + '\n' : '') + line; });
                            if (addToastRef.current) addToastRef.current('Saved to notes', 'success');
                          }} title="Save to notes" style={{ background: 'none', border: 'none', color: MUTED, fontSize: 11, cursor: 'pointer', padding: '0 2px', lineHeight: 1, opacity: .7 }}>📝</button>
                        )}
                        {m.id && (
                          <button onClick={function() {
                            if (socket) socket.emit('chat-delete', { id: m.id });
                          }} title="Delete message" style={{ background: 'none', border: 'none', color: RED + '99', fontSize: 11, cursor: 'pointer', padding: '0 2px', lineHeight: 1, opacity: .7 }}>🗑</button>
                        )}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45 }}>{(function() {
                    if (!wordFilter || wordFilter.length === 0) return m.message;
                    var filtered = m.message || '';
                    wordFilter.forEach(function(w) {
                      if (!w) return;
                      var re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                      filtered = filtered.replace(re, '[filtered]');
                    });
                    return filtered;
                  })()}</p>
                  {m.translated && m.translated !== m.message && (
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, margin: '2px 0 0', fontStyle: 'italic' }}>{m.translated}</p>
                  )}
                  {(function() {
                    var rxns   = (m.id && chatReactions[m.id]) ? chatReactions[m.id] : {};
                    var EMOJIS = ['👍','❤️','🔥','😂','🎯'];
                    var hasAny = EMOJIS.some(function(e) { return (rxns[e] || 0) > 0; });
                    return (
                      <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                        {EMOJIS.map(function(emoji) {
                          var count = rxns[emoji] || 0;
                          if (!hasAny && count === 0) return null;
                          return (
                            <button key={emoji}
                              onClick={function() { addChatReaction(m.id, emoji); }}
                              style={{ background: count > 0 ? 'rgba(201,168,76,.12)' : 'transparent', border: count > 0 ? '1px solid rgba(201,168,76,.25)' : '1px dashed rgba(255,255,255,.1)', borderRadius: 10, padding: '1px 5px', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', gap: 2, color: count > 0 ? TEXT : MUTED }}>
                              {emoji}
                              {count > 0 && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7 }}>{count}</span>}
                            </button>
                          );
                        })}
                        {!hasAny && (
                          <button
                            onClick={function() { addChatReaction(m.id, '👍'); }}
                            style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 10, padding: '1px 6px', cursor: 'pointer', fontSize: 8, color: MUTED }}>
                            + react
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>{/* end messages scroll container */}
          {/* GIF input bar */}
          {showGifInput && (
            <div style={{ padding: '6px 12px', display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
              <input
                value={gifInput}
                onChange={function(e) { setGifInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendGif(); }}
                placeholder="Paste GIF URL (giphy.com, tenor.com...)"
                style={{ flex: 1, background: '#1E1810', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '7px 14px', fontSize: 12, color: '#F0E8D4', outline: 'none', fontFamily: "'Barlow Condensed',sans-serif" }}
              />
              <button onClick={sendGif} style={{ background: '#C9A84C', border: 'none', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: 12, color: '#0E0C09', cursor: 'pointer' }}>GIF</button>
            </div>
          )}
          {/* Slash-command hint (host/cohost only) */}
          {chatCmdHint && (role === 'host' || role === 'cohost') && (
            <div style={{ padding: '6px 12px', borderTop: '1px solid ' + DIM, background: 'rgba(201,168,76,.06)', flexShrink: 0 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: .5, marginBottom: 5 }}>⌨ COMMANDS</div>
              {[
                { cmd: '/slow 5', desc: 'Slow mode 5s' },
                { cmd: '/shout @user', desc: 'Shoutout' },
                { cmd: '/confetti', desc: 'Burst' },
                { cmd: '/clip [label]', desc: 'Mark clip' },
                { cmd: '/mute @user', desc: 'Mute on stage' },
                { cmd: '/ticker [text]', desc: 'Start ticker' },
              ].map(function(item) {
                return (
                  <button key={item.cmd} onClick={function() { setChatInput(item.cmd.split(' ')[0] + ' '); setChatCmdHint(false); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 6, marginBottom: 4, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 7px', cursor: 'pointer' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>{item.cmd.split(' ')[0]}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>{item.desc}</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* Input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={chatInput}
              onChange={function(e) { setChatInput(e.target.value); setChatCmdHint((role === 'host' || role === 'cohost') && e.target.value.charAt(0) === '/'); }}
              onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); if (e.key === 'Escape') { setChatCmdHint(false); } }}
              placeholder={(role === 'host' || role === 'cohost') ? 'Say something or /command…' : 'Say something...'}
              style={{
                flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 999,
                padding: '9px 16px', fontSize: 13, color: TEXT, outline: 'none',
                fontFamily: "'Barlow Condensed',sans-serif",
              }}
            />
            <button onClick={slowWaitSec > 0 ? undefined : sendChat} style={{
              background: slowWaitSec > 0 ? CARD : gold, border: 'none', borderRadius: 999,
              padding: '9px 18px', fontWeight: 700, fontSize: 13, color: slowWaitSec > 0 ? MUTED : BG,
              cursor: slowWaitSec > 0 ? 'default' : 'pointer', transition: 'background .2s',
              minWidth: 58, textAlign: 'center',
            }}>
              {slowWaitSec > 0 ? (slowWaitSec + 's') : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ SUBSCRIBE MODAL ════════════════ */}
      {showSubModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 70, animation: 'fadeSlideIn .2s ease' }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowSubModal(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2, marginBottom: 4 }}>⭐ Subscribe</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 20, letterSpacing: 1 }}>Support this creator every month</div>
            {[
              { id: 'bronze', label: 'BRONZE', cents: 500,  icon: '🥉', color: MUTED,  perks: 'Fan badge · Ad-free chat · Exclusive emotes' },
              { id: 'silver', label: 'SILVER', cents: 1000, icon: '🥈', color: gold,   perks: 'Priority Q&A · Exclusive streams · All Bronze' },
              { id: 'gold',   label: 'GOLD',   cents: 2000, icon: '👑', color: gold,   perks: 'Direct DMs · Monthly shoutout · All Silver' },
            ].map(function(tier) {
              return (
                <button key={tier.id} onClick={function() {
                  if (socket) socket.emit('subscribe', { tier: tier.id, price_cents: tier.cents });
                  setSubConfirmed(tier.id);
                  setShowSubModal(false);
                  if (addToast) addToast(tier.icon + ' Thanks for subscribing at ' + tier.label + '!', 'success');
                  playTone([440, 554, 659, 880], 2.0); // A4 C#5 E5 A5 — warm rising chord
                }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(255,255,255,.04)', border: '1.5px solid rgba(255,255,255,.1)',
                  borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                  cursor: 'pointer', textAlign: 'left', transition: 'background .15s',
                }}>
                  <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{tier.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: tier.color, letterSpacing: 2 }}>{tier.label}</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1 }}>${(Math.floor(tier.cents) / 100).toFixed(0)}<span style={{ fontSize: 11, color: MUTED, letterSpacing: 0 }}>/mo</span></span>
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .3 }}>{tier.perks}</div>
                  </div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: tier.color, letterSpacing: 1, flexShrink: 0 }}>JOIN →</span>
                </button>
              );
            })}
            <button onClick={function() { setShowSubModal(false); }} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: MUTED, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ════════════════ STREAM RECAP MODAL ════════════════ */}
      {streamRecap && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#1A140D', borderRadius: 18, border: '1px solid rgba(201,168,76,.25)', padding: '24px 20px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 22, color: '#F0E8D4', letterSpacing: 1 }}>BROADCAST ENDED</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>HERE'S HOW YOUR STREAM WENT</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: '#C9A84C', fontWeight: 700, lineHeight: 1 }}>{streamRecap.peakViewers || 0}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>PEAK VIEWERS</div>
              </div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: '#C9A84C', fontWeight: 700, lineHeight: 1 }}>${streamRecap.sessionRevenueCents ? (Math.floor(streamRecap.sessionRevenueCents) / 100).toFixed(2) : '0.00'}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>EARNINGS (90%)</div>
              </div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: '#C9A84C', fontWeight: 700, lineHeight: 1 }}>{streamRecap.superChatCount || 0}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>SUPER CHATS</div>
              </div>
              <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color: '#C9A84C', fontWeight: 700, lineHeight: 1 }}>{streamRecap.clipCount || 0}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>CLIPS MADE</div>
              </div>
            </div>

            {streamRecap.duration > 0 && (function() {
              var dh = Math.floor(streamRecap.duration / 3600);
              var dm = Math.floor((streamRecap.duration % 3600) / 60);
              var ds = streamRecap.duration % 60;
              var dStr = (dh > 0 ? dh + 'h ' : '') + dm + 'm ' + ds + 's';
              return (
                <div style={{ background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 10, padding: '10px', textAlign: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: '#C9A84C', fontWeight: 700, lineHeight: 1 }}>{dStr}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginTop: 4 }}>STREAM DURATION</div>
                </div>
              );
            })()}

            {streamRecap.topGifters && streamRecap.topGifters.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 1, marginBottom: 8 }}>TOP SUPPORTERS</div>
                {streamRecap.topGifters.slice(0, 3).map(function(g, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(201,168,76,.06)', borderRadius: 6, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C' }}>{'#' + (i + 1)}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: '#F0E8D4', fontWeight: 600 }}>{g.username || 'Anonymous'}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#C9A84C' }}>${(Math.floor(g.totalCents || 0) / 100).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={function() {
                  var r = streamRecap;
                  var dh2 = Math.floor((r.duration || 0) / 3600);
                  var dm2 = Math.floor(((r.duration || 0) % 3600) / 60);
                  var ds2 = (r.duration || 0) % 60;
                  var durLine = r.duration > 0 ? '\n⏱ Duration: ' + (dh2 > 0 ? dh2 + 'h ' : '') + dm2 + 'm ' + ds2 + 's' : '';
                  var shareText = 'Just wrapped a live stream on SeeWhy LIVE! 🔴\n'
                    + '👥 Peak viewers: ' + (r.peakViewers || 0) + '\n'
                    + '💰 Earned: $' + (r.sessionRevenueCents ? (Math.floor(r.sessionRevenueCents) / 100).toFixed(2) : '0.00') + '\n'
                    + '💬 Super chats: ' + (r.superChatCount || 0) + '\n'
                    + '🎥 Clips: ' + (r.clipCount || 0)
                    + durLine
                    + '\n\nseewhylive.online';
                  if (navigator.share) {
                    navigator.share({ text: shareText }).catch(function() {});
                  } else {
                    try {
                      navigator.clipboard.writeText(shareText).then(function() {
                        setRecapShareCopied(true);
                        setTimeout(function() { setRecapShareCopied(false); }, 2500);
                      });
                    } catch(e) {}
                  }
                }}
                style={{ flex: 1, background: recapShareCopied ? 'rgba(34,197,94,.18)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (recapShareCopied ? 'rgba(34,197,94,.5)' : 'rgba(201,168,76,.3)'), borderRadius: 10, padding: '12px', fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 10, color: recapShareCopied ? '#22c55e' : '#C9A84C', cursor: 'pointer', letterSpacing: 1 }}
              >
                {recapShareCopied ? '✅ COPIED!' : '📊 SHARE STATS'}
              </button>
              <button
                onClick={function() { setStreamRecap(null); setRecapShareCopied(false); }}
                style={{ flex: 1, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 10, padding: '12px', fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 11, color: '#C9A84C', cursor: 'pointer', letterSpacing: 1 }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ GO-LIVE MODAL ════════════════ */}
      {showLiveModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-end', zIndex: 70, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowLiveModal(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', border: '1px solid ' + BORDER, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 22, color: TEXT }}>{isLive ? '🔴 On Air' : 'Go Live'}</div>
              <button onClick={function() { setShowLiveModal(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 16 }}>{isLive ? 'You are currently broadcasting' : 'Configure and start your broadcast'}</div>

            {/* Currently live status panel */}
            {isLive && (
              <div style={{ background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: activeStreamTitle || fanoutStatus.length > 0 ? 8 : 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: RED, letterSpacing: 2 }}>LIVE NOW</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginLeft: 'auto' }}>{viewerCount || 0} viewers</span>
                </div>
                {activeStreamTitle && (
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: fanoutStatus.length > 0 ? 6 : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStreamTitle}</div>
                )}
                {fanoutStatus.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {fanoutStatus.map(function(fs, i) {
                      var icons = { youtube: '▶️', twitch: '💜', tiktok: '🎵', facebook: '👍', kick: '🟢', rumble: '🔴', custom: '📡' };
                      var labels = { youtube: 'YouTube', twitch: 'Twitch', tiktok: 'TikTok', facebook: 'Facebook', kick: 'Kick', rumble: 'Rumble', custom: 'Custom' };
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '2px 8px' }}>
                          <span style={{ fontSize: 10 }}>{icons[fs.platform] || '📡'}</span>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>{labels[fs.platform] || fs.platform}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button onClick={function() { endStream(); setShowLiveModal(false); }} style={{ width: '100%', marginTop: 12, background: 'transparent', border: '1px solid rgba(255,26,60,.4)', borderRadius: 8, padding: '10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: RED, cursor: 'pointer', letterSpacing: 2 }}>
                  ■ STOP BROADCAST
                </button>
              </div>
            )}

            {/* Stream title */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 6 }}>STREAM TITLE</div>
              <input
                type="text"
                maxLength={80}
                placeholder="What are you streaming today?"
                value={liveTitle}
                onChange={function(e) { setLiveTitle(e.target.value); }}
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '10px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, outline: 'none' }}
              />
            </div>

            {/* Multi-platform fanout */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2 }}>MULTISTREAM DESTINATIONS</div>
                <button onClick={function() { setLiveKeys({}); setCustomRtmpUrl(''); setCustomRtmpKey(''); setLiveDestinations({}); try { localStorage.removeItem('sw_stream_keys'); localStorage.removeItem('sw_custom_rtmp_url'); localStorage.removeItem('sw_custom_rtmp_key'); localStorage.removeItem('sw_stream_dests'); } catch(e) {} }} style={{ background: 'none', border: 'none', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', padding: 0 }}>clear all</button>
              </div>
              {[
                { id: 'youtube',  label: 'YouTube',  emoji: '▶️', placeholder: 'YouTube stream key',  keyHint: 'youtube.com/live_dashboard' },
                { id: 'twitch',   label: 'Twitch',   emoji: '💜', placeholder: 'Twitch stream key',   keyHint: 'dashboard.twitch.tv/settings/stream' },
                { id: 'tiktok',   label: 'TikTok',   emoji: '🎵', placeholder: 'TikTok stream key',   keyHint: 'TikTok Live Studio → Settings' },
                { id: 'facebook', label: 'Facebook', emoji: '👍', placeholder: 'Facebook stream key', keyHint: 'facebook.com/live/producer' },
                { id: 'kick',     label: 'Kick',     emoji: '🟢', placeholder: 'Kick stream key',     keyHint: 'kick.com/dashboard/settings' },
                { id: 'rumble',   label: 'Rumble',   emoji: '🔴', placeholder: 'Rumble stream key',   keyHint: 'rumble.com/account/livestream' }
              ].map(function(p) {
                var enabled = !!liveDestinations[p.id];
                var keyVal = liveKeys[p.id] || '';
                var keyVisible = !!liveKeysVisible[p.id];
                return (
                  <div key={p.id} style={{ background: BG, border: '1px solid ' + (enabled ? GOLD + '44' : BORDER), borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: enabled ? 8 : 0 }}>
                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                      <span style={{ flex: 1, color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14 }}>{p.label}</span>
                      <button
                        onClick={function() { setLiveDestinations(function(prev) { var n = Object.assign({}, prev); n[p.id] = !n[p.id]; return n; }); }}
                        style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: enabled ? GOLD : 'rgba(255,255,255,.1)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                      >
                        <div style={{ position: 'absolute', top: 2, left: enabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: enabled ? BG : '#F0E8D4', transition: 'left .2s' }} />
                      </button>
                    </div>
                    {enabled && (
                      <div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type={keyVisible ? 'text' : 'password'}
                            placeholder={p.placeholder}
                            value={keyVal}
                            onChange={function(e) { var v = e.target.value; setLiveKeys(function(prev) { var n = Object.assign({}, prev); n[p.id] = v; return n; }); }}
                            style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none' }}
                          />
                          <button
                            onClick={function() { setLiveKeysVisible(function(prev) { var n = Object.assign({}, prev); n[p.id] = !n[p.id]; return n; }); }}
                            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORDER, borderRadius: 6, padding: '7px 9px', color: MUTED, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                          >{keyVisible ? '🙈' : '👁'}</button>
                        </div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4 }}>Get key: {p.keyHint}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Custom RTMP */}
              <div style={{ background: BG, border: '1px solid ' + (customRtmpEnabled ? GOLD + '44' : BORDER), borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: customRtmpEnabled ? 8 : 0 }}>
                  <span style={{ fontSize: 16 }}>📡</span>
                  <span style={{ flex: 1, color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14 }}>Custom RTMP</span>
                  <button
                    onClick={function() { setCustomRtmpEnabled(function(v) { return !v; }); }}
                    style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: customRtmpEnabled ? GOLD : 'rgba(255,255,255,.1)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: customRtmpEnabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: customRtmpEnabled ? BG : '#F0E8D4', transition: 'left .2s' }} />
                  </button>
                </div>
                {customRtmpEnabled && (
                  <div>
                    <input
                      type="text"
                      placeholder="rtmp://your-server/app"
                      value={customRtmpUrl}
                      onChange={function(e) { setCustomRtmpUrl(e.target.value); }}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none', marginBottom: 6 }}
                    />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type={customRtmpVisible ? 'text' : 'password'}
                        placeholder="Stream key"
                        value={customRtmpKey}
                        onChange={function(e) { setCustomRtmpKey(e.target.value); }}
                        style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid ' + BORDER, borderRadius: 7, padding: '8px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none' }}
                      />
                      <button
                        onClick={function() { setCustomRtmpVisible(function(v) { return !v; }); }}
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid ' + BORDER, borderRadius: 6, padding: '7px 9px', color: MUTED, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                      >{customRtmpVisible ? '🙈' : '👁'}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Co-streaming invite panel */}
            <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2 }}>CO-STREAMING</div>
                {guests && guests.filter(function(g) { return g.role === 'cohost'; }).length > 0 && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>
                    {guests.filter(function(g) { return g.role === 'cohost'; }).length} co-host{guests.filter(function(g) { return g.role === 'cohost'; }).length !== 1 ? 's' : ''} on stage
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginBottom: 10 }}>
                Share your room link so guests can join as co-hosts. Their camera feeds appear in the panel grid alongside yours on all destinations.
              </div>
              <button
                onClick={function() {
                  var shareUrl = window.location.origin + (roomId ? '?room=' + roomId : '');
                  try {
                    navigator.clipboard.writeText(shareUrl).then(function() {
                      setCoHostLinkCopied(true);
                      setTimeout(function() { setCoHostLinkCopied(false); }, 2500);
                    });
                  } catch(e) {
                    if (addToast) addToast('Copy the URL from your address bar', 'info');
                  }
                }}
                style={{ width: '100%', background: coHostLinkCopied ? 'rgba(34,197,94,.12)' : 'rgba(201,168,76,.1)', border: '1px solid ' + (coHostLinkCopied ? 'rgba(34,197,94,.4)' : 'rgba(201,168,76,.35)'), borderRadius: 7, padding: '8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: coHostLinkCopied ? '#22c55e' : GOLD, cursor: 'pointer', letterSpacing: 1, transition: 'all .2s' }}
              >
                {coHostLinkCopied ? '✅ LINK COPIED' : '🔗 COPY CO-HOST INVITE LINK'}
              </button>
            </div>

            <button onClick={goLive} style={{ width: '100%', background: RED, border: 'none', borderRadius: 12, padding: '14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#fff', cursor: 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <span>●</span> START BROADCAST
            </button>
            <button onClick={function() { setShowLiveModal(false); }} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ GOAL SETTER MODAL ════════════════ */}
      {showGoalSet && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 70, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: TEXT, marginBottom: 4 }}>Set Stream Goal</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 20 }}>Visible to all viewers as a progress bar</div>
            <input
              type="text"
              maxLength={40}
              placeholder="Goal label (e.g. New Studio Setup)"
              value={goalDraft.label}
              onChange={function(e) { setGoalDraft(function(d) { return { label: e.target.value, amount: d.amount }; }); }}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 16, outline: 'none', marginBottom: 10 }}
            />
            <input
              type="number"
              min="1"
              placeholder="Goal amount in $ (e.g. 500)"
              value={goalDraft.amount}
              onChange={function(e) { setGoalDraft(function(d) { return { label: d.label, amount: e.target.value }; }); }}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, outline: 'none', marginBottom: 16, letterSpacing: 1 }}
            />
            <button onClick={function() {
              var amt = parseFloat(goalDraft.amount);
              if (!goalDraft.label.trim() || !amt || amt <= 0) { if (addToast) addToast('Enter a label and amount', 'error'); return; }
              var goalCents = Math.floor(amt * 100);
              if (setStreamGoal) setStreamGoal({ label: goalDraft.label.trim(), goalCents: goalCents });
              if (socket) socket.emit('stream-goal-set', { roomId: roomId, type: 'revenue', target: goalCents, label: goalDraft.label.trim() });
              setShowGoalSet(false);
              setGoalDraft({ label: '', amount: '' });
              if (addToast) addToast('Stream goal set!', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
              ACTIVATE GOAL
            </button>
            <button onClick={function() { setShowGoalSet(false); setGoalDraft({ label: '', amount: '' }); }} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: 10, padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ MUSIC BANNER ════════════════ */}
      {musicBanner && (
        <div style={{
          position: 'absolute', bottom: 68, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(14,12,9,.96)',
          border: '1.5px solid rgba(201,168,76,.5)',
          borderRadius: 999, padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'musicIn .35s ease',
          boxShadow: '0 0 18px rgba(201,168,76,.2)',
          whiteSpace: 'nowrap', zIndex: 42, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 18 }}>{musicBanner.emoji}</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, letterSpacing: .3 }}>{musicBanner.title}</div>
            {musicBanner.style ? <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1 }}>{musicBanner.style.toUpperCase()}</div> : null}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, borderLeft: '1px solid ' + BORDER, paddingLeft: 10 }}>
            shared by {musicBanner.sharedBy}
          </div>
        </div>
      )}

      {/* ════════════════ THEATER MODE OVERLAY ════════════════ */}
      {theaterMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex' }}>
          {/* Video fills screen */}
          <div
            style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
            onClick={function() { setTheaterChatVisible(function(v) { return !v; }); }}
          >
            {/* Reuse the current stage view inside theater mode */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: 'rgba(201,168,76,.4)', letterSpacing: 3 }}>
                {stageLayout === 'featured' ? 'FEATURED VIEW' : 'GRID VIEW'} — THEATER MODE
              </div>
            </div>
            {/* Exit + controls bar (always visible at top) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(rgba(0,0,0,.7),transparent)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isLive && <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: RED, borderRadius: 999, padding: '3px 9px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'livePulse 1.2s infinite' }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: '#fff', letterSpacing: 2 }}>LIVE</span>
                </div>}
                {isLive && activeStreamTitle && (
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: 'rgba(240,232,212,.85)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStreamTitle}</span>
                )}
                {isLive && fanoutStatus.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {fanoutStatus.map(function(fs, i) {
                      var icons = { youtube: '▶️', twitch: '💜', tiktok: '🎵', facebook: '👍', kick: '🟢', rumble: '🔴', custom: '📡' };
                      return (
                        <div key={i} title={fs.platform} style={{ background: 'rgba(201,168,76,.18)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 999, padding: '2px 7px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: 10 }}>{icons[fs.platform] || '📡'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(240,232,212,.6)' }}>{viewerCount || 0} viewers</span>
              </div>
              <button
                onClick={function(e) { e.stopPropagation(); setTheaterMode(false); }}
                style={{ background: 'rgba(14,12,9,.7)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '6px 12px', color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}
              >
                ⊡ EXIT THEATER
              </button>
            </div>
            {/* Tap hint */}
            <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', fontFamily: "'DM Mono',monospace", fontSize: 7, color: 'rgba(240,232,212,.3)', letterSpacing: 1, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              TAP TO {theaterChatVisible ? 'HIDE' : 'SHOW'} CHAT
            </div>
          </div>

          {/* Floating chat panel */}
          {theaterChatVisible && (
            <div style={{ width: 280, flexShrink: 0, background: 'rgba(14,12,9,.88)', borderLeft: '1px solid rgba(201,168,76,.12)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(201,168,76,.1)', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62', letterSpacing: 2 }}>
                💬 LIVE CHAT
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(chat || []).slice(-80).map(function(msg, i) {
                  var isSuper = msg.type === 'super';
                  return (
                    <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: isSuper ? '#C9A84C' : '#8A7A62' }}>
                        {msg.username}
                        {isSuper && <span style={{ color: '#C9A84C', marginLeft: 4 }}>💛 ${(Math.floor(msg.amountCents || 0) / 100).toFixed(2)}</span>}
                      </span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#F0E8D4', lineHeight: 1.3 }}>{msg.message}</span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              {/* Theater chat input */}
              <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(201,168,76,.1)', display: 'flex', gap: 6 }}>
                <input
                  value={chatInput}
                  onChange={function(e) { setChatInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') { sendChat(); } }}
                  placeholder="Say something..."
                  style={{ flex: 1, background: '#241C12', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '7px 10px', color: '#F0E8D4', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
                />
                <button onClick={sendChat} style={{ background: '#800020', border: 'none', borderRadius: 8, padding: '7px 10px', color: '#C9A84C', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}>
                  SEND
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queue position hint for waiting panelists */}
      {handRaised && role !== 'host' && (function() {
        var myPos = handQueue.indexOf(userId) + 1;
        if (!myPos) return null;
        return (
          <div style={{ position: 'absolute', bottom: 62, left: '50%', transform: 'translateX(-50%)', zIndex: 41, pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(14,12,9,.9)', border: '1px solid rgba(255,140,0,.5)', borderRadius: 999, padding: '4px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#D4854A', whiteSpace: 'nowrap', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>
              ✋ You are #{myPos} in queue
            </div>
          </div>
        );
      })()}

      {/* ════════════════ BOTTOM TOOLBAR ════════════════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(14,12,9,.97)',
        borderTop: '1px solid ' + BORDER,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        paddingBottom: 'max(6px,env(safe-area-inset-bottom))',
        zIndex: 40, flexShrink: 0,
      }}>
        {/* Leave */}
        <button onClick={function() { if (onLeave) onLeave(); }} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: RED, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', letterSpacing: .3 }}>
          Leave room
        </button>
        {/* Right-side icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <IconBtn
            icon="💬"
            label="Chat"
            active={chatOpen}
            badge={chatOpen ? 0 : (chat && chat.length > 99 ? 99 : (chat && chat.length) || 0)}
            onPress={function() { setChatOpen(function(v) { return !v; }); }}
          />
          <IconBtn
            icon="❤️"
            label="React"
            active={reactsOpen}
            onPress={function() { setReactsOpen(function(v) { return !v; }); }}
          />
          {role === 'viewer' && (
            <IconBtn
              icon={hasFollowed ? '❤️' : '🤍'}
              label={hasFollowed ? 'Following' : 'Follow'}
              active={hasFollowed}
              activeColor={RED}
              onPress={function() {
                if (hasFollowed) return;
                var hostGuest = guests.find(function(g) { return g.role === 'host'; });
                var hUser = hostGuest ? (hostGuest.username || '') : '';
                if (socket && hUser) socket.emit('follow-creator', { username: hUser });
                setHasFollowed(true);
              }}
            />
          )}
          {role === 'viewer' && (
            <IconBtn
              icon={subConfirmed ? '⭐' : '✦'}
              label={subConfirmed ? 'Subbed' : 'Subscribe'}
              active={!!subConfirmed}
              activeColor={GOLD}
              onPress={function() { if (!subConfirmed) setShowSubModal(true); }}
            />
          )}
          <IconBtn
            icon="✋"
            label="Hand"
            active={handRaised}
            badge={role === 'host' ? handQueue.length : 0}
            onPress={raiseHand}
          />
          <IconBtn
            icon={isMuted ? '🔇' : '🎙'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            danger={true}
            onPress={toggleMute}
          />
          {role !== 'viewer' && (
            <IconBtn
              icon={isCamOff ? '📵' : '📷'}
              label={isCamOff ? 'Cam Off' : 'Cam On'}
              active={isCamOff}
              danger={isCamOff}
              onPress={toggleCam}
            />
          )}
          <IconBtn
            icon="❓"
            label="Q&A"
            active={showQa}
            badge={qaQueue.length > 0 && !showQa ? qaQueue.length : 0}
            onPress={function() { setShowQa(function(v) { return !v; }); setChatOpen(false); }}
          />
          <IconBtn
            icon="🏆"
            label="Leaders"
            active={showLeader}
            activeColor={gold}
            onPress={function() { setShowLeader(function(v) { return !v; }); }}
          />
          <IconBtn
            icon="⚙"
            label="Camera"
            active={showMediaConf}
            onPress={function() { setShowMediaConf(function(v) { return !v; }); }}
          />
          {role !== 'viewer' && (
            <IconBtn
              icon="⇔"
              label={mirrorSelf ? 'Mirrored' : 'Normal'}
              active={mirrorSelf}
              onPress={function() { setMirrorSelf(function(v) { return !v; }); }}
            />
          )}
          {role !== 'viewer' && avCameras.length > 1 && (
            <IconBtn
              icon="📷"
              label="Flip Cam"
              onPress={handleCamFlip}
            />
          )}
          {role !== 'viewer' && avMics.length > 1 && (
            <IconBtn
              icon="🎙"
              label="Flip Mic"
              onPress={handleMicFlip}
            />
          )}
          {role !== 'viewer' && (avCameras.length > 0 || avMics.length > 0) && (
            <IconBtn
              icon="🎛"
              label="Devices"
              active={showDevicePicker}
              activeColor={TEAL}
              onPress={function() { setShowDevicePicker(function(v) { return !v; }); }}
            />
          )}
          {role !== 'viewer' && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="🌫"
                label={bgBlurOn ? 'Blur ✓' : 'Blur'}
                active={bgBlurOn}
                activeColor={TEAL}
                onPress={bgBlurOn ? toggleBgBlur : function() { setShowBlurSlider(function(v) { return !v; }); }}
              />
              {showBlurSlider && !bgBlurOn && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', zIndex: 20, width: 148, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 6, textAlign: 'center' }}>BLUR STRENGTH</div>
                  <input type="range" min={2} max={20} value={bgBlurLevel}
                    onChange={function(e) { setBgBlurLevel(Number(e.target.value)); }}
                    style={{ width: '100%', accentColor: TEAL }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>SOFT</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL }}>{bgBlurLevel}px</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>HEAVY</span>
                  </div>
                  <button onClick={toggleBgBlur}
                    style={{ width: '100%', background: TEAL, border: 'none', borderRadius: 6, padding: '6px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                    APPLY BLUR
                  </button>
                  <button onClick={function() { setShowBlurSlider(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', marginTop: 4 }}>
                    cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {role !== 'viewer' && (
            <IconBtn
              icon="🎚"
              label={noiseSuppOn ? 'NS ✓' : 'NS'}
              active={noiseSuppOn}
              activeColor={TEAL}
              onPress={toggleNoiseSuppression}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="🌙"
                label={brbActive ? 'BRB ✓' : 'BRB'}
                active={brbActive}
                activeColor={GOLD}
                onPress={function() {
                  if (brbActive) {
                    if (socket) socket.emit('brb-end');
                  } else {
                    setShowBrbInput(function(v) { return !v; });
                  }
                }}
              />
              {showBrbInput && !brbActive && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', zIndex: 20, width: 180, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 6, textAlign: 'center' }}>BRB MESSAGE (optional)</div>
                  <input
                    value={brbInput}
                    onChange={function(e) { setBrbInput(e.target.value.slice(0, 80)); }}
                    placeholder="Back in 5 min…"
                    style={{ width: '100%', boxSizing: 'border-box', background: DIM, border: '1px solid ' + BORDER, borderRadius: 6, padding: '5px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, outline: 'none', marginBottom: 8 }}
                  />
                  <button
                    onClick={function() {
                      if (socket) socket.emit('brb-start', { msg: brbInput });
                      setShowBrbInput(false);
                      setBrbInput('');
                    }}
                    style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 6, padding: '6px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                    GO BRB
                  </button>
                  <button onClick={function() { setShowBrbInput(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', marginTop: 4 }}>
                    cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {typeof document !== 'undefined' && document.pictureInPictureEnabled && role !== 'viewer' && (
            <IconBtn
              icon="🖼"
              label={pipActive ? 'PiP ✓' : 'PiP'}
              active={pipActive}
              activeColor={TEAL}
              onPress={toggleBrowserPip}
            />
          )}
          {role !== 'host' && (
            <IconBtn
              icon="✋"
              label={handRaised ? 'Hand ✓' : 'Hand'}
              active={handRaised}
              activeColor='rgba(255,140,0,.9)'
              onPress={raiseHand}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="🎊"
              label="Confetti"
              onPress={function() {
                if (socket) socket.emit('confetti-burst', { roomId: roomId });
              }}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="⏱"
                label={roomTimerActive ? 'Timer ✓' : 'Timer'}
                active={roomTimerActive}
                activeColor={GOLD}
                onPress={roomTimerActive
                  ? function() { if (socket) socket.emit('room-timer-stop', { roomId: roomId }); }
                  : function() { setShowTimerPicker(function(v) { return !v; }); }}
              />
              {showTimerPicker && !roomTimerActive && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', zIndex: 20, width: 160, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 8, textAlign: 'center' }}>COUNTDOWN TIMER</div>
                  {[[15,'15s'],[30,'30s'],[60,'1m'],[180,'3m'],[300,'5m']].map(function(preset) {
                    return (
                      <button key={preset[0]}
                        onClick={function() {
                          if (socket) socket.emit('room-timer-start', { roomId: roomId, seconds: preset[0] });
                          setShowTimerPicker(false);
                        }}
                        style={{ display: 'block', width: '100%', background: DIM, border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: TEXT, cursor: 'pointer', letterSpacing: 1, marginBottom: 4 }}>
                        {preset[1]}
                      </button>
                    );
                  })}
                  <button onClick={function() { setShowTimerPicker(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', marginTop: 2 }}>
                    cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {(role === 'host' || role === 'cohost') && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="📰"
                label={tickerActive ? 'Ticker ✓' : 'Ticker'}
                active={tickerActive}
                activeColor={GOLD}
                onPress={tickerActive ? stopTicker : function() { setShowTickerInput(function(v) { return !v; }); }}
              />
              {showTickerInput && !tickerActive && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', zIndex: 20, width: 200, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 6, textAlign: 'center' }}>STAGE TICKER</div>
                  <input
                    value={tickerInput}
                    onChange={function(e) { setTickerInput(e.target.value.slice(0, 200)); }}
                    placeholder="Scrolling message…"
                    onKeyDown={function(e) { if (e.key === 'Enter') { startTicker(tickerInput); } else if (e.key === 'Escape') { setShowTickerInput(false); } }}
                    style={{ width: '100%', boxSizing: 'border-box', background: DIM, border: '1px solid ' + BORDER, borderRadius: 6, padding: '5px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, outline: 'none', marginBottom: 8 }}
                  />
                  <button
                    onClick={function() { startTicker(tickerInput); }}
                    style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 6, padding: '6px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                    START TICKER
                  </button>
                  <button onClick={function() { setShowTickerInput(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', marginTop: 4 }}>
                    cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {(role === 'host' || role === 'cohost') && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="🎨"
                label={stageBg ? 'BG ✓' : 'Stage BG'}
                active={!!stageBg}
                activeColor={TEAL}
                onPress={function() { setShowBgPicker(function(v) { return !v; }); }}
              />
              {showBgPicker && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', zIndex: 20, width: 194, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 8, textAlign: 'center' }}>STAGE BACKGROUND</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {[
                      { label: 'Default', val: '' },
                      { label: 'Deep Space', val: 'linear-gradient(135deg,#0a0015 0%,#0e0c09 50%,#0a0820 100%)' },
                      { label: 'Sunset', val: 'linear-gradient(160deg,#1a0a00 0%,#3d1200 40%,#1a0020 100%)' },
                      { label: 'Ocean', val: 'linear-gradient(160deg,#001428 0%,#002244 50%,#001020 100%)' },
                      { label: 'Forest', val: 'linear-gradient(160deg,#041a08 0%,#0a2412 50%,#041008 100%)' },
                      { label: 'Crimson', val: 'linear-gradient(160deg,#1a0008 0%,#2d0012 50%,#1a0005 100%)' },
                      { label: 'Neon', val: 'linear-gradient(135deg,#07001a 0%,#0e0028 50%,#1a0a00 100%)' },
                      { label: 'Gold', val: 'linear-gradient(160deg,#100c00 0%,#1e1600 50%,#0e0a00 100%)' },
                    ].map(function(opt) {
                      var isActive = stageBg === opt.val;
                      return (
                        <button key={opt.label}
                          onClick={function() { setStageBg(opt.val); setShowBgPicker(false); }}
                          style={{ flex: '1 1 40%', background: opt.val || DIM, border: '1.5px solid ' + (isActive ? GOLD : BORDER), borderRadius: 6, padding: '7px 4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: isActive ? GOLD : TEXT, cursor: 'pointer', letterSpacing: .3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={function() { setShowBgPicker(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer' }}>
                    close
                  </button>
                </div>
              )}
            </div>
          )}
          {(role === 'host' || role === 'cohost') && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="🔊"
                label="Sounds"
                active={showSoundboard}
                activeColor={TEAL}
                onPress={function() { setShowSoundboard(function(v) { return !v; }); }}
              />
              {showSoundboard && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 12px', zIndex: 20, width: 178, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 8, textAlign: 'center' }}>SOUNDBOARD</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { name: 'applause',  label: '👏 Applause'  },
                      { name: 'drumroll',  label: '🥁 Drum Roll' },
                      { name: 'airhorn',   label: '📯 Air Horn'  },
                      { name: 'chaching',  label: '💰 Cha-Ching' },
                      { name: 'fanfare',   label: '🎺 Fanfare'   },
                      { name: 'boom',      label: '💥 Boom'      },
                    ].map(function(s) {
                      return (
                        <button key={s.name}
                          onClick={function() { if (socket) socket.emit('soundboard', { sound: s.name, roomId: roomId }); }}
                          style={{ flex: '1 1 44%', background: DIM, border: '1px solid ' + BORDER, borderRadius: 7, padding: '6px 4px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: TEXT, cursor: 'pointer', textAlign: 'center', letterSpacing: .3 }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={function() { setShowSoundboard(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', marginTop: 6 }}>
                    close
                  </button>
                </div>
              )}
            </div>
          )}
          {(role === 'host' || role === 'cohost') && (
            <div style={{ position: 'relative' }}>
              <IconBtn
                icon="📊"
                label={sentimentPoll ? 'Poll ✓' : 'Poll'}
                active={!!sentimentPoll}
                activeColor={GOLD}
                onPress={sentimentPoll
                  ? function() { if (socket) socket.emit('sentiment-end', { roomId: roomId }); }
                  : function() { setShowSentimentInput(function(v) { return !v; }); }}
              />
              {showSentimentInput && !sentimentPoll && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: SURF, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', zIndex: 20, width: 200, boxShadow: '0 4px 16px rgba(0,0,0,.7)', animation: 'fadeSlideIn .15s ease' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5, marginBottom: 6, textAlign: 'center' }}>AUDIENCE POLL (30s 👍/👎)</div>
                  <input
                    value={sentimentInput}
                    onChange={function(e) { setSentimentInput(e.target.value.slice(0, 120)); }}
                    placeholder="How's everyone feeling?"
                    onKeyDown={function(e) {
                      if (e.key === 'Enter') {
                        if (socket) socket.emit('sentiment-start', { roomId: roomId, question: sentimentInput });
                        setShowSentimentInput(false);
                      } else if (e.key === 'Escape') { setShowSentimentInput(false); }
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', background: DIM, border: '1px solid ' + BORDER, borderRadius: 6, padding: '5px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, outline: 'none', marginBottom: 8 }}
                  />
                  <button
                    onClick={function() {
                      if (socket) socket.emit('sentiment-start', { roomId: roomId, question: sentimentInput });
                      setShowSentimentInput(false);
                      setSentimentInput('');
                    }}
                    style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 6, padding: '6px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                    LAUNCH POLL
                  </button>
                  <button onClick={function() { setShowSentimentInput(false); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '4px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer', marginTop: 4 }}>
                    cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {(role === 'host' || role === 'cohost') && role !== 'viewer' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 4px' }}>
              <input
                type="checkbox"
                id="sw-autorecord"
                checked={autoRecord}
                onChange={function(e) { setAutoRecord(e.target.checked); }}
                style={{ accentColor: RED, cursor: 'pointer' }}
              />
              <label htmlFor="sw-autorecord" style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: autoRecord ? RED : MUTED, cursor: 'pointer', letterSpacing: .3, whiteSpace: 'nowrap' }}>
                Auto-REC
              </label>
            </div>
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="📡"
              label={showHealthHud ? 'HUD ✓' : 'HUD'}
              active={showHealthHud}
              activeColor={TEAL}
              onPress={function() { setShowHealthHud(function(v) { return !v; }); }}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="📝"
              label="Notes"
              active={showNotes}
              activeColor={GOLD}
              onPress={function() { setShowNotes(function(v) { return !v; }); }}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="📜"
              label={showTeleprompter ? 'Prompt ×' : 'Prompt'}
              active={showTeleprompter}
              activeColor={TEAL}
              onPress={function() { setShowTeleprompter(function(v) { return !v; }); }}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="📋"
              label={'Activity' + (activityLog.length > 0 ? ' ' + activityLog.length : '')}
              active={showActivityLog}
              activeColor={GOLD}
              onPress={function() { setShowActivityLog(function(v) { return !v; }); }}
            />
          )}
          {role === 'host' && (
            <IconBtn
              icon={joinSoundEnabled ? '🔔' : '🔕'}
              label="Join SFX"
              active={joinSoundEnabled}
              activeColor={GOLD}
              onPress={function() { setJoinSoundEnabled(function(v) { return !v; }); }}
            />
          )}
          <IconBtn
            icon="?"
            label="Shortcuts"
            active={showKeyHelp}
            onPress={function() { setShowKeyHelp(function(v) { return !v; }); }}
          />
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="🎉"
              label={showEmojiBar ? 'Emoji ×' : 'Emojis'}
              active={showEmojiBar}
              activeColor={GOLD}
              onPress={function() { setShowEmojiBar(function(v) { return !v; }); }}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="📊"
              label="Stats"
              active={showStageStats}
              activeColor={gold}
              onPress={function() { setShowStageStats(function(v) { return !v; }); }}
            />
          )}
          {(role === 'host' || role === 'cohost') && (
            <IconBtn
              icon="📶"
              label={lowBwMode ? 'LO-BW' : 'HD'}
              active={lowBwMode}
              danger={lowBwMode}
              onPress={function() { setLowBwMode(function(v) { return !v; }); }}
            />
          )}
          {(role === 'host' || role === 'cohost' || role === 'owner') && (
            <IconBtn
              icon={isScreenSharing ? '🛑' : '🖥'}
              label={isScreenSharing ? 'Stop' : 'Screen'}
              active={isScreenSharing}
              danger={isScreenSharing}
              onPress={isScreenSharing ? stopScreenShare : startScreenShare}
            />
          )}
          <IconBtn
            icon={theaterMode ? '⊡' : '⛶'}
            label={theaterMode ? 'Exit' : 'Theater'}
            active={theaterMode}
            activeColor={gold}
            onPress={function() { setTheaterMode(function(v) { return !v; }); }}
          />
          <IconBtn
            icon={isFullscreen ? '⊠' : '⤢'}
            label={isFullscreen ? 'Exit FS' : 'Full'}
            active={isFullscreen}
            onPress={toggleFullscreen}
          />
        </div>
      </div>

      {/* ════════════════ TIP FEED (right edge, floating) ════════════════ */}
      {tipFeed.length > 0 && (
        <div style={{ position: 'absolute', right: 8, top: 130, zIndex: 45, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none', maxWidth: 170 }}>
          {tipFeed.slice(0, 5).map(function(tip, i) {
            var isLarge = tip.amount >= 10000;
            var isMed   = tip.amount >= 500;
            var border  = isLarge ? 'rgba(201,168,76,.7)' : isMed ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.12)';
            var amtColor = isLarge ? GOLD : isMed ? TEAL : TEXT;
            return (
              <div key={tip.id} style={{
                background: 'rgba(14,12,9,.92)', border: '1px solid ' + border,
                borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 7,
                animation: 'tipSlide .3s ease ' + (i * .05) + 's both',
                boxShadow: isLarge ? ('0 0 12px rgba(201,168,76,.25)') : 'none',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tip.from}</div>
                  {tip.amount > 0 && (
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: amtColor, letterSpacing: 1 }}>
                      ${(Math.floor(tip.amount) / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Leaderboard toggle */}
          <button onClick={function() { setShowLeader(function(v) { return !v; }); }}
            style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '4px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer', letterSpacing: .5, pointerEvents: 'all' }}>
            🏆 TOP TIPPERS
          </button>
        </div>
      )}

      {/* ════════════════ TIP LEADERBOARD PANEL ════════════════ */}
      {(role === 'host' || role === 'cohost') && tipFeed.length > 0 && (
        <div style={{ position: 'absolute', left: 8, top: 80, zIndex: 60, width: 200 }}>
          <GoldenWallPanel
            items={tipFeed.map(function(t) { return { id: t.id, type: t.emoji ? 'GIFT' : 'TIP', amountCents: t.amount, username: t.from, ts: t.ts }; })}
            maxVisible={5}
          />
        </div>
      )}

      {showLeader && (
        <div style={{
          position: 'absolute', right: 8, top: 80, zIndex: 60,
          background: 'rgba(9,7,14,.97)', border: '1px solid rgba(201,168,76,.3)',
          borderRadius: 14, padding: '12px 14px', width: 180,
          animation: 'fadeSlideIn .2s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>🏆 TOP TIPPERS</span>
            <button onClick={function() { setShowLeader(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
          </div>
          {tipLeader.length === 0 && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, textAlign: 'center', padding: '8px 0' }}>No gifts yet this stream</div>
          )}
          {tipLeader.map(function(e, i) {
            var medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={e.username} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{medals[i] || (i + 1) + '.'}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: GOLD, letterSpacing: 1, flexShrink: 0 }}>${(Math.floor(e.totalCents) / 100).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ VS POLL OVERLAY ════════════════ */}
      {vsPoll && (
        <div style={{
          position: 'absolute', left: 10, right: 10,
          bottom: activePoll ? 228 : 74, zIndex: 53,
          background: 'rgba(9,7,14,.97)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14, overflow: 'hidden',
          animation: 'vsIn .3s ease',
          boxShadow: '0 8px 36px rgba(0,0,0,.65)',
        }}>
          {/* VS header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: GOLD, letterSpacing: 2 }}>VS POLL</span>
              {vsPoll.active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite' }} />}
              {!vsPoll.active && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>FINAL</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{vsPoll.totalVotes} vote{vsPoll.totalVotes !== 1 ? 's' : ''}</span>
              {role === 'host' && vsPoll.active && (
                <button onClick={function() { if (socket) socket.emit('vs-end', { roomId: roomId }); }}
                  style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 9, padding: '0 2px', letterSpacing: .5, fontFamily: "'DM Mono',monospace" }}>END</button>
              )}
            </div>
          </div>
          {/* Animated split bar */}
          <div style={{ margin: '0 14px 6px', height: 7, background: 'rgba(255,255,255,.07)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(90deg,#C9A84C,#2A6FFF)', width: (vsPoll.pctA || 50) + '%', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(270deg,' + RED + ',#C01230)', width: (vsPoll.pctB || 50) + '%', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          {/* Side cards */}
          <div style={{ display: 'flex', padding: '0 10px 10px', gap: 8 }}>
            <button onClick={function() {
              if (!socket || vsVoted || !vsPoll.active) return;
              socket.emit('vs-vote', { roomId: roomId, side: 'A' });
              setVsVoted('A');
            }} style={{
              flex: 1, background: vsVoted === 'A' ? 'rgba(212,133,74,.22)' : 'rgba(212,133,74,.07)',
              border: '1.5px solid ' + (vsVoted === 'A' ? '#C9A84C' : 'rgba(212,133,74,.28)'),
              borderRadius: 10, padding: '8px 6px',
              cursor: (vsPoll.active && !vsVoted) ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'background .2s, border-color .2s',
            }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, textAlign: 'center', lineHeight: 1.2 }}>{vsPoll.sideA}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#C9A84C', letterSpacing: 1, lineHeight: 1 }}>{vsPoll.pctA}%</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{vsPoll.votesA} vote{vsPoll.votesA !== 1 ? 's' : ''}</span>
              {vsVoted === 'A' && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', marginTop: 1 }}>✓ YOUR PICK</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, letterSpacing: 3 }}>VS</span>
            </div>
            <button onClick={function() {
              if (!socket || vsVoted || !vsPoll.active) return;
              socket.emit('vs-vote', { roomId: roomId, side: 'B' });
              setVsVoted('B');
            }} style={{
              flex: 1, background: vsVoted === 'B' ? 'rgba(255,26,60,.22)' : 'rgba(255,26,60,.07)',
              border: '1.5px solid ' + (vsVoted === 'B' ? RED : 'rgba(255,26,60,.28)'),
              borderRadius: 10, padding: '8px 6px',
              cursor: (vsPoll.active && !vsVoted) ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'background .2s, border-color .2s',
            }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, textAlign: 'center', lineHeight: 1.2 }}>{vsPoll.sideB}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: RED, letterSpacing: 1, lineHeight: 1 }}>{vsPoll.pctB}%</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{vsPoll.votesB} vote{vsPoll.votesB !== 1 ? 's' : ''}</span>
              {vsVoted === 'B' && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: RED, marginTop: 1 }}>✓ YOUR PICK</span>}
            </button>
          </div>
          {!vsVoted && vsPoll.active && (
            <div style={{ padding: '0 14px 8px', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>Tap a side to cast your vote</div>
          )}
        </div>
      )}

      {/* ════════════════ ACTIVE POLL ════════════════ */}
      {activePoll && (
        <div style={{
          position: 'absolute', left: 10, right: 10, bottom: 74, zIndex: 52,
          background: 'rgba(9,7,14,.96)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 14, padding: '14px 16px',
          animation: 'fadeSlideIn .25s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>{activePoll.q}</div>
            {role === 'host' && (
              <button onClick={function() { if (socket) socket.emit('poll-end', { roomId: roomId }); setActivePoll(null); }}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: '0 2px', flexShrink: 0 }}>END</button>
            )}
          </div>
          {(function() {
            var totalVotes = activePoll.opts.reduce(function(s, o) { return s + o.votes; }, 0);
            return activePoll.opts.map(function(opt, idx) {
              var pct = totalVotes > 0 ? Math.floor((opt.votes / totalVotes) * 100) : 0;
              var isWin = opt.votes > 0 && opt.votes === Math.max.apply(null, activePoll.opts.map(function(o) { return o.votes; }));
              return (
                <div key={idx} onClick={function() { if (!pollVoted) votePoll(idx); }}
                  style={{ marginBottom: 6, cursor: pollVoted ? 'default' : 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: isWin ? GOLD : TEXT }}>{opt.text}</span>
                    {pollVoted && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: isWin ? GOLD : MUTED }}>{pct}%</span>}
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden' }}>
                    {pollVoted && (
                      <div style={{
                        height: '100%', borderRadius: 999,
                        background: isWin ? GOLD : 'rgba(201,168,76,.6)',
                        width: pct + '%', transition: 'width .5s ease',
                      }} />
                    )}
                  </div>
                </div>
              );
            });
          })()}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 6 }}>
            {pollVoted ? (activePoll.opts.reduce(function(s, o) { return s + o.votes; }, 0) + ' votes') : 'Tap to vote'}
          </div>
        </div>
      )}

      {/* ════════════════ Q&A PANEL ════════════════ */}
      {/* ════════════════ NOW ANSWERING BANNER ════════════════ */}
      {answeringQ && (
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: showQa ? 'calc(60% + 70px)' : 74, zIndex: 51, animation: 'qaIn .25s ease' }}>
          <div style={{ background: 'rgba(9,7,14,.97)', border: '1.5px solid rgba(201,168,76,.45)', borderRadius: 14, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>🎤</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: gold, letterSpacing: 2 }}>NOW ANSWERING</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>from {answeringQ.username}</span>
              </div>
              {role === 'host' && (
                <button onClick={function() {
                  if (socket) socket.emit('qa-answering-clear', {});
                  setAnsweringQ(null);
                }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', padding: '1px 4px', fontFamily: "'DM Mono',monospace", letterSpacing: .5 }}>DONE</button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.45 }}>{answeringQ.text}</p>
          </div>
        </div>
      )}

      {showQa && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 62,
          height: '60%', background: 'rgba(9,7,14,.97)',
          borderTop: '1px solid ' + BORDER,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp .22s ease', zIndex: 49,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: TEXT }}>Q&A</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {role === 'host' && (
                <button onClick={function() { setShowPollCreate(function(v) { var next = !v; if (next) { setShowVsCreate(false); setShowJudges(false); } return next; }); }}
                  style={{ background: showPollCreate ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '5px 8px', color: GOLD, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  📊 POLL
                </button>
              )}
              {role === 'host' && (
                <button onClick={function() { setShowVsCreate(function(v) { var next = !v; if (next) { setShowPollCreate(false); setShowJudges(false); } return next; }); }}
                  style={{ background: showVsCreate ? 'rgba(255,26,60,.25)' : 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, padding: '5px 8px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  ⚔ VS
                </button>
              )}
              {(role === 'host' || judges.some(function(j) { return j.userId === userId; })) && (
                <button onClick={function() { setShowJudges(function(v) { var next = !v; if (next) { setShowPollCreate(false); setShowVsCreate(false); } return next; }); }}
                  style={{ background: showJudges ? 'rgba(201,168,76,.2)' : 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '5px 8px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>
                  ⚖{judges.length > 0 ? (' ' + judges.length) : ''}
                </button>
              )}
              <button onClick={function() { setShowQa(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
            </div>
          </div>

          {/* Poll creator (host only) */}
          {showPollCreate && role === 'host' && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: CARD, flexShrink: 0 }}>
              <input value={pollDraft.q} onChange={function(e) { setPollDraft(function(d) { return { q: e.target.value, opts: d.opts }; }); }}
                placeholder="Poll question..."
                style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                {pollDraft.opts.map(function(opt, i) {
                  return (
                    <input key={i} value={opt}
                      onChange={function(e) { var v = e.target.value; setPollDraft(function(d) { var o = d.opts.slice(); o[i] = v; return { q: d.q, opts: o }; }); }}
                      placeholder={'Option ' + (i + 1)}
                      style={{ background: CARD2, border: '1px solid ' + DIM, borderRadius: 6, padding: '7px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none' }} />
                  );
                })}
              </div>
              <button onClick={submitPoll} style={{ width: '100%', background: BURG, border: 'none', borderRadius: 8, padding: '9px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>LAUNCH POLL</button>
            </div>
          )}

          {/* VS Poll creator (host only) */}
          {showVsCreate && role === 'host' && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: CARD, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: RED, letterSpacing: 2, marginBottom: 8 }}>HEAD-TO-HEAD VS POLL</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={vsDraft.sideA}
                  onChange={function(e) { var v = e.target.value; setVsDraft(function(d) { return { sideA: v, sideB: d.sideB, duration: d.duration }; }); }}
                  placeholder="Side A (e.g. Player 1)"
                  style={{ flex: 1, background: 'rgba(212,133,74,.08)', border: '1px solid rgba(212,133,74,.35)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, padding: '0 2px' }}>VS</div>
                <input value={vsDraft.sideB}
                  onChange={function(e) { var v = e.target.value; setVsDraft(function(d) { return { sideA: d.sideA, sideB: v, duration: d.duration }; }); }}
                  placeholder="Side B (e.g. Player 2)"
                  style={{ flex: 1, background: 'rgba(255,26,60,.08)', border: '1px solid rgba(255,26,60,.35)', borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, flexShrink: 0 }}>DURATION (sec)</span>
                <input type="number" min="10" max="300" value={vsDraft.duration}
                  onChange={function(e) { var v = e.target.value; setVsDraft(function(d) { return { sideA: d.sideA, sideB: d.sideB, duration: v }; }); }}
                  style={{ width: 70, background: CARD2, border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 12, outline: 'none', textAlign: 'center' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>10–300s</span>
              </div>
              <button onClick={startVs} style={{ width: '100%', background: 'linear-gradient(90deg,rgba(212,133,74,.8),rgba(255,26,60,.8))', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, cursor: 'pointer', letterSpacing: 2 }}>LAUNCH VS POLL</button>
            </div>
          )}

          {/* Judges panel */}
          {showJudges && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + BORDER, background: CARD, flexShrink: 0, maxHeight: 240, overflowY: 'auto' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: TEAL, letterSpacing: 2, marginBottom: 8 }}>JUDGE PANEL</div>
              {role === 'host' && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input value={judgeAssignName}
                    onChange={function(e) { setJudgeAssignName(e.target.value); }}
                    placeholder="Username to assign as judge"
                    style={{ flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '7px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none' }} />
                  <button onClick={function() {
                    var name = judgeAssignName.trim();
                    if (!name) return;
                    var found = allParticipants.find(function(p) { return (p.username || '').toLowerCase() === name.toLowerCase(); });
                    var uid = found ? (found.guestId || found.userId) : name;
                    var uname = found ? (found.username || name) : name;
                    if (socket) socket.emit('judge-assign', { roomId: roomId, userId: uid, username: uname });
                    setJudgeAssignName('');
                    if (addToast) addToast(uname + ' assigned as judge', 'success');
                  }} style={{ background: TEAL, border: 'none', borderRadius: 8, padding: '7px 12px', color: BG, fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>ADD</button>
                </div>
              )}
              {judges.length === 0 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '8px 0' }}>No judges assigned yet</div>
              )}
              {judges.map(function(j) {
                return (
                  <div key={j.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, background: CARD2, borderRadius: 8, padding: '6px 10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.username}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{j.scoreCount} score{j.scoreCount !== 1 ? 's' : ''}</div>
                    </div>
                    {j.avgScore !== null && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD, lineHeight: 1, letterSpacing: 1 }}>{j.avgScore}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>AVG</div>
                      </div>
                    )}
                    {role === 'host' && (
                      <button onClick={function() { if (socket) socket.emit('judge-remove', { roomId: roomId, userId: j.userId }); }}
                        style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                );
              })}
              {judges.some(function(j) { return j.userId === userId; }) && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + BORDER }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1, marginBottom: 8 }}>YOUR SCORE</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(function(n) {
                      return (
                        <button key={n} onClick={function() { setJudgeScoreVal(String(n)); }}
                          style={{ width: 30, height: 30, borderRadius: 7, background: judgeScoreVal === String(n) ? TEAL : CARD2, border: '1px solid ' + (judgeScoreVal === String(n) ? TEAL : DIM), color: judgeScoreVal === String(n) ? BG : TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: 'pointer' }}>
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <input value={judgeScoreLabel}
                    onChange={function(e) { setJudgeScoreLabel(e.target.value); }}
                    placeholder="Optional label (e.g. Round 1)"
                    style={{ width: '100%', boxSizing: 'border-box', background: CARD2, border: '1px solid ' + DIM, borderRadius: 6, padding: '6px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, outline: 'none', marginBottom: 6 }} />
                  <button onClick={submitJudgeScore}
                    style={{ width: '100%', background: judgeScoreVal !== '' ? TEAL : CARD2, border: 'none', borderRadius: 8, padding: '8px', color: judgeScoreVal !== '' ? BG : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, cursor: judgeScoreVal !== '' ? 'pointer' : 'default', letterSpacing: 1 }}>
                    SUBMIT{judgeScoreVal !== '' ? ' (' + judgeScoreVal + '/10)' : ' SCORE'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Q list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch' }}>
            {qaQueue.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No questions yet — be the first!</div>
            )}
            {qaQueue.map(function(item) {
              return (
                <div key={item.id} style={{ marginBottom: 10, background: CARD, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'qaIn .2s ease' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: GOLD, marginBottom: 3 }}>{item.username}</div>
                    <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{item.text}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <button onClick={function() {
                      if (qaMyVotes[item.id]) return;
                      if (socket) socket.emit('qa-upvote', { roomId: roomId, id: item.id });
                      setQaMyVotes(function(v) { return Object.assign({}, v, { [item.id]: true }); });
                      setQaQueue(function(q) { return q.map(function(x) { return x.id === item.id ? { id: x.id, username: x.username, text: x.text, upvotes: x.upvotes + 1 } : x; }).sort(function(a, b) { return b.upvotes - a.upvotes; }); });
                    }} style={{ background: qaMyVotes[item.id] ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)', border: '1px solid ' + (qaMyVotes[item.id] ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '4px 8px', color: qaMyVotes[item.id] ? GOLD : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                      ▲ {item.upvotes}
                    </button>
                    {role === 'host' && (
                      <button onClick={function() {
                        var isActive = answeringQ && answeringQ.id === item.id;
                        if (isActive) {
                          if (socket) socket.emit('qa-answering-clear', {});
                          setAnsweringQ(null);
                        } else {
                          if (socket) socket.emit('qa-answering', { id: item.id, username: item.username, text: item.text });
                          setAnsweringQ({ id: item.id, username: item.username, text: item.text });
                        }
                      }} style={{ background: (answeringQ && answeringQ.id === item.id) ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)', border: '1px solid ' + ((answeringQ && answeringQ.id === item.id) ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.1)'), borderRadius: 6, padding: '4px 7px', color: (answeringQ && answeringQ.id === item.id) ? gold : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: .5 }}>
                        {(answeringQ && answeringQ.id === item.id) ? '🎤' : 'ANS'}
                      </button>
                    )}
                    {role === 'host' && (
                      <button onClick={function() { if (socket) socket.emit('qa-dismiss', { roomId: roomId, id: item.id }); setQaQueue(function(q) { return q.filter(function(x) { return x.id !== item.id; }); }); }}
                        style={{ background: 'none', border: 'none', color: MUTED, fontSize: 10, cursor: 'pointer', padding: '2px 4px' }}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit question input */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 8, flexShrink: 0 }}>
            <input value={qaInput} onChange={function(e) { setQaInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') submitQa(); }}
              placeholder="Ask a question..."
              style={{ flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 999, padding: '9px 16px', fontSize: 13, color: TEXT, outline: 'none', fontFamily: "'Barlow Condensed',sans-serif" }} />
            <button onClick={submitQa} style={{ background: gold, border: 'none', borderRadius: 999, padding: '9px 16px', fontWeight: 700, fontSize: 13, color: BG, cursor: 'pointer' }}>Ask</button>
          </div>
        </div>
      )}

      {/* ════════════════ DIRECT PAY SHEET ════════════════ */}
      {showPaySheet && (function() {
        var handles = (function() {
          try { return JSON.parse(localStorage.getItem('sw_directpay_handles') || '{}'); } catch(e) { return {}; }
        })();
        var platHandles = getPlatformHandles();
        var hasAnyCreator = DP_PLATFORMS.some(function(p) { return !!(handles[p.id] || '').trim(); });
        var hasAnyPlat    = DP_PLATFORMS.some(function(p) { return !!(platHandles[p.id] || '').trim(); });

        var renderPayRow = function(p, handle, accentColor) {
          var hasHandle = !!handle.trim();
          return (
            <button key={p.id} onClick={function() { openPayLink(p, handle); }}
              style={{
                background: hasHandle ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
                border: '1.5px solid ' + (hasHandle ? (accentColor + '55') : 'rgba(255,255,255,.07)'),
                borderRadius: 14, padding: '12px 16px', cursor: hasHandle ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                opacity: hasHandle ? 1 : .4, transition: 'background .2s',
              }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: hasHandle ? accentColor : MUTED, letterSpacing: .5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasHandle ? handle : 'Not set up'}
                </div>
              </div>
              {hasHandle && (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: accentColor, letterSpacing: 1, flexShrink: 0 }}>
                  {p.buildUrl ? 'OPEN →' : 'COPY'}
                </span>
              )}
            </button>
          );
        }

        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowPaySheet(false); }}>
            <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER, maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Support {hostName}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>90% creator &bull; 10% platform fee</div>
                </div>
                <button onClick={function() { setShowPaySheet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>

              {/* ── Creator 90% ── */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1.5, marginBottom: 8 }}>CREATOR — 90%</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DP_PLATFORMS.map(function(p) { return renderPayRow(p, handles[p.id] || '', p.color); })}
                </div>
              </div>

              {/* ── Platform 10% ── */}
              <div style={{ marginTop: 16, marginBottom: 4 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1.5, marginBottom: 8 }}>SEEWHY PLATFORM FEE — 10%</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DP_PLATFORMS.map(function(p) { return renderPayRow(p, platHandles[p.id] || '', GOLD); })}
                </div>
              </div>

              {role === 'host' && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: CARD, borderRadius: 12, border: '1px solid ' + BORDER }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 10 }}>SET UP YOUR PAY LINKS</div>
                  {DP_PLATFORMS.map(function(p) {
                    var handle = handles[p.id] || '';
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{p.emoji}</span>
                        <input
                          value={handle}
                          onChange={function(e) {
                            var v = e.target.value;
                            var next = Object.assign({}, handles);
                            next[p.id] = v;
                            localStorage.setItem('sw_directpay_handles', JSON.stringify(next));
                            if (addToast) addToast(p.name + ' handle saved', 'success');
                          }}
                          placeholder={p.name + ' handle / phone / email'}
                          style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ════════════════ VOICE SUPERCHAT (TTS) MODAL ════════════════ */}
      {showTTSSheet && (
        <TTSSuperChatModal
          socket={socket}
          roomId={roomId}
          userId={userId}
          username={username}
          onClose={function() { setShowTTSSheet(false); }}
          addToast={addToast}
        />
      )}

      {/* ════════════════ SUPER CHAT SHEET ════════════════ */}
      {showSuperChatSheet && (function() {
        var SC_TIERS = [
          { cents: 100,  label: '$1',  color: '#C9A84C' },
          { cents: 200,  label: '$2',  color: '#C9A84C' },
          { cents: 500,  label: '$5',  color: '#C9A84C' },
          { cents: 1000, label: '$10', color: '#FF8C42' },
          { cents: 2000, label: '$20', color: '#FF1A3C' },
          { cents: 5000, label: '$50', color: '#800020' },
        ];
        var selectedTier = SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0] || SC_TIERS[0];

        var sendSuperChat = function() {
          var msg = scMsg.trim();
          if (!msg) { if (addToast) addToast('Write a message first', 'error'); return; }
          if (!socket) return;
          socket.emit('super-chat', {
            roomId:      roomId,
            userId:      userId,
            username:    username,
            message:     msg,
            amountCents: scAmt,
          });
          setScMsg('');
          setShowSuperChatSheet(false);
          if (addToast) addToast('💬 Super Chat sent!', 'success');
        }

        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowSuperChatSheet(false); }}>
            <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Super Chat</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>Highlighted message · 90% to creator · 10% platform</div>
                </div>
                <button onClick={function() { setShowSuperChatSheet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Tier selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {SC_TIERS.map(function(t) {
                  var active = scAmt === t.cents;
                  return (
                    <button key={t.cents} onClick={function() { setScAmt(t.cents); }}
                      style={{ flexShrink: 0, background: active ? (t.color + '28') : 'rgba(255,255,255,.04)', border: '2px solid ' + (active ? t.color : 'rgba(255,255,255,.1)'), borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'border .15s' }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: active ? t.color : TEXT, letterSpacing: 1 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Message input */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <textarea
                  value={scMsg}
                  onChange={function(e) { setScMsg(e.target.value.slice(0, 200)); }}
                  placeholder="Your message (max 200 chars)..."
                  rows={3}
                  style={{ width: '100%', background: CARD2, border: '1.5px solid ' + selectedTier.color + '66', borderRadius: 12, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>{scMsg.length}/200</span>
              </div>

              {/* Preview */}
              <div style={{ background: selectedTier.color + '18', border: '1.5px solid ' + selectedTier.color + '55', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: selectedTier.color, letterSpacing: 1, marginBottom: 2 }}>
                  💬 {SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0] && SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0].label} SUPER CHAT · {username}
                </div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{scMsg || 'Your message here...'}</div>
              </div>

              <button onClick={sendSuperChat}
                style={{ width: '100%', background: selectedTier.color, border: 'none', borderRadius: 14, padding: '15px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 2 }}>
                SEND SUPER CHAT · {SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0] && SC_TIERS.filter(function(t) { return t.cents === scAmt; })[0].label}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ SOCIAL SHARE SHEET ════════════════ */}
      {showShareSheet && (function() {
        var roomUrl = window.location.origin + (roomId !== '6990f5f2-4823-453e-a1fc-dc9d00000000' ? ('?room=' + roomId) : '');
        var shareMsg = 'Watch live on SeeWhy LIVE! ' + (streamInfo && streamInfo.title ? streamInfo.title + ' — ' : '') + 'No app needed 🔴';
        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowShareSheet(false); }}>
            <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '20px 18px 34px', border: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Share This Live</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>Outsiders can watch without the app</div>
                </div>
                <button onClick={function() { setShowShareSheet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
              </div>
              {/* Link preview */}
              <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 12px', marginTop: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomUrl}</span>
                <button onClick={function() { navigator.clipboard.writeText(roomUrl).then(function() { if (addToast) addToast('Link copied!', 'success'); }); }}
                  style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 8, padding: '5px 10px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  COPY
                </button>
              </div>
              {/* Native share */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button onClick={function() { navigator.share({ title: 'SeeWhy LIVE', text: shareMsg, url: roomUrl }); setShowShareSheet(false); }}
                  style={{ width: '100%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 12, padding: '13px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', letterSpacing: 2, marginBottom: 12 }}>
                  📤 SHARE VIA PHONE
                </button>
              )}
              {/* Platform grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {SOC_PLATFORMS.map(function(p) {
                  return (
                    <button key={p.id} onClick={function() { openSocialShare(p, roomUrl, shareMsg); setShowShareSheet(false); }}
                      style={{ background: CARD2, border: '1.5px solid ' + BORDER, borderRadius: 14, padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'background .15s' }}>
                      <span style={{ fontSize: 26 }}>{p.emoji}</span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, textAlign: 'center' }}>{p.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5 }}>{p.open ? 'OPENS APP' : 'COPY LINK'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ EXPANDED CELL OVERLAY ════════════════ */}
      {expandedCell && (function() {
        var g = allGuestMap[expandedCell] || { guestId: expandedCell, username: expandedCell, role: 'guest' };
        var gid = expandedCell;
        var isOwn = gid === userId;
        var isSp  = !!speakingIds[gid];
        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 85, display: 'flex', flexDirection: 'column', animation: 'cellExpand .25s ease' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
              {audioOnly ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD + ')', border: '3px solid ' + (isSp ? TEAL : DIM), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isSp ? ('0 0 40px ' + TEAL + '55') : 'none' }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: GOLD, lineHeight: 1 }}>{(g.username || gid).charAt(0).toUpperCase()}</span>
                  </div>
                  {isSp && <WaveBars color={TEAL} />}
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, overflow: 'hidden', border: '2px solid ' + (isSp ? TEAL + '88' : BORDER), boxShadow: isSp ? ('0 0 40px ' + TEAL + '33') : 'none' }}>
                  <OctCell
                    guest={g}
                    sz={380}
                    isHost={role === 'host'}
                    fadesMode={false}
                    branding={branding}
                    onTap={null}
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    rtcManager={rtcReady ? rtcManager : null}
                    mediaConfig={isOwn ? medConf : null}
                    isMuted={isOwn ? isMuted : false}
                    isCamOff={isOwn ? isCamOff : false}
                    onMuteToggle={isOwn ? toggleMute : null}
                    onCamToggle={isOwn ? toggleCam : null}
                    giftTotal={guestGiftTotals[gid] || 0}
                    activeEffect={panelEffects[gid] || null}
                    onPowerPlay={!isOwn && role !== 'host' ? function(guest) { setShowPowerPlay(guest); } : null}
                    remoteQuality={isOwn ? null : (producerQuality[g.producerId] || null)}
                    mirrorOverride={isOwn ? mirrorSelf : undefined}
                    remoteVolume={isOwn ? undefined : (guestVolumes[gid] !== undefined ? guestVolumes[gid] : 1)}
                  />
                </div>
              )}
              <button onClick={function() { setExpandedCell(null); }}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TEXT, fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '14px 20px 28px', background: 'rgba(9,7,14,.97)', borderTop: '1px solid ' + BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, color: localGuestNames[gid] ? GOLD : TEXT }}>
                    {localGuestNames[gid] || g.username || gid}
                    {localGuestNames[gid] && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, marginLeft: 5, opacity: .7 }}>*</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                    <RolePill role={g.role || (isOwn ? role : 'guest')} />
                    {isSp && <SpeakBars color={TEAL} />}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                    {(function() {
                      var joinMs = stageJoinTimesRef.current[gid];
                      if (!joinMs) return null;
                      return React.createElement('span', {
                        style: { fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }
                      }, '⏱ On stage: ', React.createElement(StageTimer, { startMs: joinMs }));
                    })()}
                    {(function() {
                      var secs = speakingTimeRef.current[gid] || 0;
                      if (!secs) return null;
                      var m = Math.floor(secs / 60);
                      var s = secs % 60;
                      return React.createElement('span', {
                        style: { fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }
                      }, '🗣 Speaking: ' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);
                    })()}
                    {(function() {
                      var gifts = guestGiftTotals[gid] || 0;
                      if (!gifts) return null;
                      return React.createElement('span', {
                        style: { fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD }
                      }, '🎁 $' + (Math.floor(gifts) / 100).toFixed(2));
                    })()}
                    {(function() {
                      if (!isOwn && (role === 'host' || role === 'cohost') && g.producerId) {
                        var raw = consumerRawStats[g.producerId];
                        if (!raw) return null;
                        var br = raw.bitratekbps != null ? raw.bitratekbps + ' kbps' : null;
                        var jt = raw.jitter != null ? raw.jitter + 'ms jit' : null;
                        var pl = raw.packetsLost != null ? raw.packetsLost + ' lost' : null;
                        var parts = [br, jt, pl].filter(Boolean).join(' · ');
                        if (!parts) return null;
                        return React.createElement('span', {
                          style: { fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }
                        }, '📡 ' + parts);
                      }
                      return null;
                    })()}
                  </div>
                </div>
                {isOwn && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={toggleMute} style={{ background: isMuted ? 'rgba(255,26,60,.2)' : CARD2, border: '1px solid ' + (isMuted ? 'rgba(255,26,60,.5)' : BORDER), borderRadius: 12, padding: '10px 16px', color: isMuted ? RED : MUTED, cursor: 'pointer', fontSize: 18 }}>{isMuted ? '🔇' : '🎙'}</button>
                    <button onClick={toggleCam}  style={{ background: isCamOff ? 'rgba(255,26,60,.2)' : CARD2, border: '1px solid ' + (isCamOff ? 'rgba(255,26,60,.5)' : BORDER), borderRadius: 12, padding: '10px 16px', color: isCamOff ? RED : MUTED, cursor: 'pointer', fontSize: 18 }}>{isCamOff ? '📷' : '🎥'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ PRIVATE ROOM SETUP ════════════════ */}
      {showPrivateSet && role === 'host' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowPrivateSet(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER, maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1, marginBottom: 20 }}>Room Access Controls</div>

            {/* ── Private toggle ── */}
            <div style={{ background: CARD, borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid ' + (privateMode ? 'rgba(109,30,212,.4)' : BORDER) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: privateMode ? 0 : 12 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>🔒 Private Room</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{privateMode ? 'Only invited guests can join' : 'Anyone with the link can join'}</div>
                </div>
                <button onClick={function() {
                  var next = !privateMode;
                  setPrivateMode(next);
                  if (socket) socket.emit('room-private', { roomId: roomId, private: next, password: next ? (privatePwd.trim() || null) : null });
                  if (addToast) addToast(next ? '🔒 Room locked' : '🔓 Room opened', next ? 'success' : 'info');
                }} style={{ background: privateMode ? 'rgba(109,30,212,.7)' : 'rgba(255,255,255,.08)', border: '1px solid ' + (privateMode ? 'rgba(109,30,212,.5)' : BORDER), borderRadius: 8, padding: '6px 14px', color: privateMode ? '#fff' : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {privateMode ? 'LOCKED' : 'OPEN'}
                </button>
              </div>
              {!privateMode && (
                <input type="password" value={privatePwd} onChange={function(e) { setPrivatePwd(e.target.value); }}
                  placeholder="Optional password"
                  style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }} />
              )}
            </div>

            {/* ── Paywall toggle ── */}
            <div style={{ background: CARD, borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.4)' : BORDER) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: paywallOn ? 0 : 12 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT }}>💰 Paid Entry</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{paywallOn ? ('$' + (Math.floor((parseFloat(paywallPrice) || 0) * 100) / 100).toFixed(2) + ' entry — viewers pay before entering') : 'Free to watch'}</div>
                </div>
                <button onClick={function() {
                  var next = !paywallOn;
                  var cents = next ? Math.floor((parseFloat(paywallPrice) || 0) * 100) : 0;
                  setPaywallOn(next);
                  if (socket) socket.emit('room-paywall', { roomId: roomId, enabled: next, amountCents: cents });
                  if (addToast) addToast(next ? ('💰 Paywall on — $' + (cents / 100).toFixed(2)) : 'Paywall removed', next ? 'success' : 'info');
                }} style={{ background: paywallOn ? 'rgba(201,168,76,.6)' : 'rgba(255,255,255,.08)', border: '1px solid ' + (paywallOn ? 'rgba(201,168,76,.5)' : BORDER), borderRadius: 8, padding: '6px 14px', color: paywallOn ? BG : MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  {paywallOn ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              {!paywallOn && (
                <input type="number" min="0" step="0.01" value={paywallPrice} onChange={function(e) { setPaywallPrice(e.target.value); }}
                  placeholder="Entry price in $ (e.g. 5.00)"
                  style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, outline: 'none', letterSpacing: 1 }} />
              )}
              {!paywallOn && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginTop: 6, letterSpacing: .5 }}>
                  Make sure your DirectPay handles are set so viewers know where to send money
                </div>
              )}
            </div>

            {/* ── Audio-only toggle (panel system) ── */}
            <div style={{ background: CARD, borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid ' + BORDER }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: MUTED, marginBottom: 8, letterSpacing: .5, textTransform: 'uppercase' }}>Media Mode</div>
              <AudioOnlyToggle
                socket={socket}
                roomId={roomId}
                isAudioOnly={audioOnly}
                videoProducer={rtcManager && rtcManager.producers ? rtcManager.producers['video'] : null}
              />
            </div>

            <button onClick={function() { setShowPrivateSet(false); }} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: MUTED, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ VIDEO RECORDER PANEL ════════════════ */}
      {showRecorder && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'flex-end', zIndex: 76, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>Record Clip</div>
              <button onClick={function() {
                if (recState === 'recording') stopRecording();
                setShowRecorder(false);
                if (recState !== 'done') { setRecState('idle'); setRecSeconds(0); setRecUrl(null); }
              }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 20, letterSpacing: .5 }}>Max 10 minutes · saves to your device</div>
            {recState === 'idle' && (
              <button onClick={startRecording} style={{ width: '100%', background: RED, border: 'none', borderRadius: 12, padding: '15px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, cursor: 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} /> START RECORDING
              </button>
            )}
            {recState === 'recording' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', animation: 'recPulse 1s infinite' }} />
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, color: RED, letterSpacing: 2 }}>{fmtTime(recSeconds)}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>/ 10:00</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 999, marginBottom: 20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: RED, borderRadius: 999, width: (recSeconds / 600 * 100) + '%', transition: 'width 1s linear' }} />
                </div>
                <button onClick={stopRecording} style={{ width: '100%', background: 'rgba(255,26,60,.15)', border: '1.5px solid rgba(255,26,60,.4)', borderRadius: 12, padding: '13px', color: RED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, cursor: 'pointer', letterSpacing: 2 }}>
                  STOP RECORDING
                </button>
              </div>
            )}
            {recState === 'done' && recUrl && (
              <div>
                <div style={{ textAlign: 'center', padding: '12px 0 20px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEAL }}>
                  ✓ Recording ready — {fmtTime(recSeconds)}
                </div>
                <a href={recUrl} download={'seewhy-clip-' + Date.now() + '.webm'}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: TEAL, border: 'none', borderRadius: 12, padding: '14px', color: BG, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, cursor: 'pointer', letterSpacing: 2, textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
                  💾 SAVE VIDEO
                </a>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button onClick={function() {
                    fetch(recUrl).then(function(r) { return r.blob(); }).then(function(blob) {
                      var file = new File([blob], 'seewhy-clip.webm', { type: 'video/webm' });
                      navigator.share({ files: [file], title: 'SeeWhy LIVE Clip' }).catch(function() {});
                    });
                  }} style={{ width: '100%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 12, padding: '13px', color: GOLD, fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, cursor: 'pointer', letterSpacing: 2, marginBottom: 10 }}>
                    📤 SHARE CLIP
                  </button>
                )}
                <button onClick={function() { setRecState('idle'); setRecSeconds(0); setRecUrl(null); }} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED, cursor: 'pointer' }}>
                  Record another clip
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ SCORE REVEAL OVERLAY ════════════════ */}
      {scoreReveal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,.88)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: scoreReveal ? 'fadeSlideIn .2s ease' : 'scoreFade .4s ease forwards',
          pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL, letterSpacing: 3, marginBottom: 10, textTransform: 'uppercase' }}>JUDGE SCORE</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>{scoreReveal.username}</div>
            <div style={{
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 110, color: GOLD,
              lineHeight: .9, letterSpacing: -2,
              animation: 'scoreReveal .5s cubic-bezier(.175,.885,.32,1.275)',
              textShadow: '0 0 60px rgba(201,168,76,.6), 0 0 120px rgba(201,168,76,.3)',
            }}>
              {scoreReveal.score}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginTop: 4, letterSpacing: 2 }}>/ 10</div>
            {scoreReveal.label ? (
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: TEXT, marginTop: 12, letterSpacing: .5 }}>{scoreReveal.label}</div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════════════════ KEYBOARD SHORTCUT GUIDE ════════════════ */}
      {showKeyHelp && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeSlideIn .18s ease' }}
          onClick={function() { setShowKeyHelp(false); }}>
          <div style={{ background: SURF, borderRadius: 16, border: '1px solid ' + BORDER, padding: '22px 24px 24px', width: '92%', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 16px 60px rgba(0,0,0,.8)' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1, marginBottom: 14 }}>Keyboard Shortcuts</div>
            {[
              { key: 'M',       desc: 'Mute / unmute microphone' },
              { key: 'V',       desc: 'Toggle camera on / off' },
              { key: 'F',       desc: 'Enter / exit fullscreen' },
              { key: 'X',       desc: 'Mirror own camera view' },
              { key: '1',       desc: 'Grid layout' },
              { key: '2',       desc: 'Featured layout' },
              { key: '3',       desc: 'Split layout' },
              { key: '+ / =',   desc: 'More grid columns' },
              { key: '- / _',   desc: 'Fewer grid columns' },
              { key: '[ / ←',  desc: 'Previous guest (featured view)' },
              { key: '] / →',  desc: 'Next guest (featured view)' },
              { key: 'W',       desc: 'Toggle auto-layout (host/cohost)' },
              { key: '?',       desc: 'Show / hide this guide' },
              { key: 'Esc',     desc: 'Close modals / exit swap mode' },
            ].map(function(row) {
              return (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: '1px solid ' + DIM }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 5, padding: '3px 8px', color: GOLD, letterSpacing: 0.5, flexShrink: 0, minWidth: 56, textAlign: 'center' }}>{row.key}</div>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 500, fontSize: 13, color: TEXT, letterSpacing: 0.3 }}>{row.desc}</span>
                </div>
              );
            })}
            <button onClick={function() { setShowKeyHelp(false); }}
              style={{ marginTop: 14, width: '100%', padding: '9px 0', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer', letterSpacing: 0.5 }}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ STAGE STATS SHEET (host/cohost) ════════════════ */}
      {showStageStats && (role === 'host' || role === 'cohost') && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 92, display: 'flex', alignItems: 'flex-end', animation: 'fadeSlideIn .18s ease' }}
          onClick={function() { setShowStageStats(false); }}>
          <div style={{ width: '100%', maxHeight: '72vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: SURF, borderRadius: '16px 16px 0 0', border: '1px solid ' + BORDER, boxShadow: '0 -10px 40px rgba(0,0,0,.7)' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEXT, letterSpacing: 1 }}>Stage Stats</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={function() {
                  var now2 = Date.now();
                  var csvRows = onStage.map(function(g) {
                    var gid2 = g.guestId || g.userId || 'x';
                    var joinMs2 = stageJoinTimesRef.current[gid2] || now2;
                    return { name: localGuestNames[gid2] || g.username || gid2, guestRole: g.role || 'guest', speakSecs: speakingSnapshots[gid2] || 0, stageSecs: Math.floor((now2 - joinMs2) / 1000), q: producerQuality[g.producerId] || '', gifts: guestGiftTotals[gid2] || 0 };
                  });
                  exportStageStatsCsv(csvRows);
                  if (addToastRef.current) addToastRef.current('Stats exported', 'success');
                }} style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '4px 9px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, cursor: 'pointer', letterSpacing: .5 }}>
                  ↓ CSV
                </button>
                <button onClick={function() { setShowStageStats(false); }}
                  style={{ background: 'none', border: 'none', color: MUTED, fontSize: 16, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}>✕</button>
              </div>
            </div>
            {(function() {
              var now = Date.now();
              var rows = onStage.map(function(g) {
                var gid       = g.guestId || g.userId || 'x';
                var speakSecs = speakingSnapshots[gid] || 0;
                var joinMs    = stageJoinTimesRef.current[gid] || now;
                var stageSecs = Math.floor((now - joinMs) / 1000);
                var q         = producerQuality[g.producerId] || null;
                var gifts     = guestGiftTotals[gid] || 0;
                return { gid: gid, name: localGuestNames[gid] || g.username || gid, speakSecs: speakSecs, stageSecs: stageSecs, q: q, gifts: gifts, isOwn: gid === userId };
              });
              rows.sort(function(a, b) {
                if (statsSortCol === 'name')     return a.name.localeCompare(b.name);
                if (statsSortCol === 'speaking') return b.speakSecs - a.speakSecs;
                if (statsSortCol === 'stage')    return b.stageSecs - a.stageSecs;
                if (statsSortCol === 'gifts')    return b.gifts - a.gifts;
                var qRank = function(q) { return q === 'green' ? 0 : q === 'yellow' ? 1 : q === 'red' ? 2 : 3; };
                return qRank(a.q) - qRank(b.q);
              });
              var fmtS = function(s) { var m = Math.floor(s / 60); var sec = s % 60; return m + ':' + (sec < 10 ? '0' : '') + sec; };
              var qColor = function(q) { return q === 'green' ? '#6DBF7E' : q === 'yellow' ? '#F0A500' : q === 'red' ? RED : MUTED; };
              var ColHd = function(col, label) {
                return (
                  <th key={col}
                    onClick={function() { setStatsSortCol(col); }}
                    style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: statsSortCol === col ? GOLD : MUTED, letterSpacing: .5, textAlign: col === 'name' ? 'left' : 'right', padding: '6px 8px', cursor: 'pointer', borderBottom: '1px solid ' + (statsSortCol === col ? GOLD + '55' : BORDER), userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {label}{statsSortCol === col ? ' ↓' : ''}
                  </th>
                );
              };
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {ColHd('name',     'NAME')}
                      {ColHd('speaking', '🗣 TALK')}
                      {ColHd('stage',    '⏱ STAGE')}
                      {ColHd('quality',  '📶 SIG')}
                      {ColHd('gifts',    '🎁 GIFTS')}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(function(r) {
                      return (
                        <tr key={r.gid} style={{ borderBottom: '1px solid ' + DIM }}>
                          <td style={{ padding: '7px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.gid === topSpeakerId && <span style={{ marginRight: 4 }}>👑</span>}
                            {r.name}
                            {r.isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 4 }}>(you)</span>}
                          </td>
                          <td style={{ padding: '7px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: r.speakSecs >= 30 ? TEAL : TEXT, textAlign: 'right' }}>{fmtS(r.speakSecs)}</td>
                          <td style={{ padding: '7px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'right' }}>{fmtS(r.stageSecs)}</td>
                          <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                            {r.q ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: qColor(r.q), flexShrink: 0 }} />
                                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: qColor(r.q), letterSpacing: .3 }}>
                                  {r.q === 'green' ? 'GOOD' : r.q === 'yellow' ? 'FAIR' : 'POOR'}
                                </span>
                              </div>
                            ) : <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: DIM }}>—</span>}
                          </td>
                          <td style={{ padding: '7px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: r.gifts > 0 ? GOLD : MUTED, textAlign: 'right' }}>
                            {r.gifts > 0 ? '$' + (r.gifts / 100).toFixed(0) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
            <div style={{ padding: '10px 16px 16px', borderTop: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flex: 1, letterSpacing: .3 }}>Tap column header to sort · Speaking time updates every 5 s</span>
              <button onClick={function() { setShowStageStats(false); }}
                style={{ padding: '6px 14px', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 7, color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', letterSpacing: .5 }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MEDIA CONFIG PANEL ════════════════ */}
      {showMediaConf && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <MediaConfigPanel
              addToast={addToast}
              onClose={function() { setShowMediaConf(false); }}
              onApply={function(cfg) {
                setMedConf(cfg);
                setShowMediaConf(false);
                if (addToast) addToast('Camera settings applied', 'success');
              }}
            />
          </div>
        </div>
      )}

      {/* ════════════════ POLL OVERLAY ════════════════ */}
      <PollOverlay
        socket={socket}
        roomId={roomId}
        role={role}
        isLive={isLive}
        addToast={addToast}
      />

      {/* ════════════════ FLOATING MIC BUTTON ════════════════ */}
      {/* Visible for non-host/cohost panel participants with RTC active */}
      {rtcReady && role !== 'host' && role !== 'cohost' && (
        <GlobalMicButtonV49
          audioEnabled={!isMuted}
          toggleAudio={toggleMute}
          isSpeaking={!!(speakingIds && speakingIds[userId])}
          micLevel={micLevel}
          visible={true}
        />
      )}

      {/* ════════════════ CLIP LOG FAB (host/cohost) ════════════════ */}
      {(role === 'host' || role === 'cohost') && (
        <button
          onClick={function() { setShowClipLog(function(v) { return !v; }); }}
          title="Clip log"
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom,0px) + 144px)',
            left: 20,
            zIndex: 9999,
            width: 48, height: 48,
            borderRadius: '50%',
            background: showClipLog ? 'rgba(201,168,76,.18)' : 'rgba(255,255,255,0.07)',
            border: '1.5px solid ' + (clipLog.length > 0 ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.25)'),
            color: '#C9A84C',
            fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: clipLog.length > 0 ? '0 2px 12px rgba(201,168,76,.25)' : '0 2px 8px rgba(0,0,0,0.4)',
          }}>
          ✂️
          {clipLog.length > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, background: '#C9A84C', color: '#0E0C09', borderRadius: 999, fontSize: 8, fontWeight: 700, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{clipLog.length > 99 ? '99+' : clipLog.length}</span>
          )}
        </button>
      )}

      {/* ════════════════ PRESENTER NOTES OVERLAY ════════════════ */}
      {showNotes && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 200px)', right: 12, zIndex: 9998, width: 260, background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 14, boxShadow: '4px 4px 24px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ padding: '9px 14px 7px', borderBottom: '1px solid rgba(201,168,76,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>📝 NOTES</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>host-only · not broadcast</span>
          </div>
          <textarea
            value={noteText}
            onChange={function(e) {
              var v = e.target.value;
              setNoteText(v);
              try { localStorage.setItem('sw_notes', v); } catch(err) {}
            }}
            placeholder="Run-of-show notes, talking points, talking order…"
            style={{ flex: 1, minHeight: 180, resize: 'vertical', background: 'transparent', border: 'none', outline: 'none', padding: '10px 14px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, lineHeight: 1.5 }}
          />
        </div>
      )}

      {/* ════════════════ CLIP LOG OVERLAY ════════════════ */}
      {showClipLog && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 200px)', left: 12, zIndex: 9998, width: 270, maxHeight: 320, background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 14, boxShadow: '-4px 4px 24px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(201,168,76,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#C9A84C', letterSpacing: 2 }}>✂️ CLIP LOG</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#8A7A62' }}>{clipLog.length} clip{clipLog.length !== 1 ? 's' : ''}</span>
              {clipLog.length > 0 && (
                <button
                  onClick={function() {
                    var lines = clipLog.map(function(entry) {
                      var d = new Date(entry.ts * 1000);
                      var ts = d.toISOString().substring(11, 19);
                      return ts + '  ' + entry.label;
                    });
                    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url; a.download = 'clips.txt'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title="Export clip log as .txt"
                  style={{ background: 'none', border: '1px solid rgba(201,168,76,.3)', borderRadius: 5, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#C9A84C', cursor: 'pointer', letterSpacing: .3 }}>
                  ⬇ EXPORT
                </button>
              )}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {clipLog.length === 0 && (
              <div style={{ padding: '18px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8A7A62', textAlign: 'center' }}>No clips yet — viewers can type !clip to mark moments</div>
            )}
            {clipLog.map(function(entry) {
              var d = new Date(entry.ts * 1000);
              var hh = d.getHours();
              var mm = d.getMinutes();
              var ss = d.getSeconds();
              var timeStr = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
              return (
                <div key={entry.id} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#8A7A62', flexShrink: 0, marginTop: 1, letterSpacing: .5 }}>{timeStr}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#F0E8D4', lineHeight: 1.35, wordBreak: 'break-word' }}>{entry.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ ACTIVITY LOG OVERLAY ════════════════ */}
      {showActivityLog && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 200px)', left: 280, zIndex: 9998, width: 260, maxHeight: 340, background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 14, boxShadow: '4px 4px 24px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(201,168,76,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>📋 ACTIVITY</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activityLog.length > 0 && (
                <button
                  onClick={function() { setActivityLog([]); }}
                  title="Clear activity log"
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,.15)', borderRadius: 5, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer', letterSpacing: .3 }}>
                  CLEAR
                </button>
              )}
              <button
                onClick={function() { setShowActivityLog(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {activityLog.length === 0 && (
              <div style={{ padding: '18px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center' }}>No activity yet</div>
            )}
            {activityLog.map(function(entry) {
              var d = new Date(entry.ts);
              var hh = d.getHours();
              var mm = d.getMinutes();
              var ss = d.getSeconds();
              var timeStr = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
              return (
                <div key={entry.id} style={{ padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, flexShrink: 0, marginTop: 1, letterSpacing: .5 }}>{timeStr}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.35, wordBreak: 'break-word' }}>{entry.msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ FLOATING SHARE BUTTON ════════════════ */}
      <button
        onClick={function() { setShowShareSheet(true); }}
        title="Share room"
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom,0px) + 88px)',
          left: 20,
          zIndex: 9999,
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          border: '1.5px solid rgba(201,168,76,0.25)',
          color: '#C9A84C',
          fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
        📤
      </button>

      {/* ════════════════ SHARE SHEET ════════════════ */}
      {showShareSheet && (
        <ShareSheet
          shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
          title={'Join ' + ((streamInfo && streamInfo.title) || username + ' on SeeWhy LIVE')}
          onClose={function() { setShowShareSheet(false); }}
        />
      )}

      {/* ════════════════ TRIVIA OVERLAY ════════════════ */}
      {(activeTrivia || triviaResults) && !kicked && (
        <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 76px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, width: 'min(340px,calc(100vw - 32px))', background: 'rgba(26,21,16,.97)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 12, padding: '14px 14px 12px', boxShadow: '0 8px 32px rgba(0,0,0,.7)', animation: 'fadeSlideIn .3s ease', pointerEvents: 'all' }}>

          {activeTrivia && !triviaResults && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 2 }}>🎯 TRIVIA</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: triviaCountdown <= 5000 ? RED : GOLD, minWidth: 28, textAlign: 'right' }}>
                  {Math.ceil(triviaCountdown / 1000)}s
                </div>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: (activeTrivia.durationMs > 0 ? Math.round(triviaCountdown / activeTrivia.durationMs * 100) : 0) + '%', background: triviaCountdown <= 5000 ? RED : GOLD, borderRadius: 2, transition: 'width .1s linear, background .3s' }} />
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: TEXT, lineHeight: 1.25, marginBottom: 10, letterSpacing: 0.5 }}>
                {activeTrivia.question}
              </div>
              {activeTrivia.options.map(function(opt, i) {
                var selected = triviaMyAnswer === i;
                var answered = triviaMyAnswer !== -1;
                return (
                  <button key={i} disabled={answered}
                    onClick={function() {
                      if (answered) return;
                      setTriviaMyAnswer(i);
                      if (socket) socket.emit('trivia-answer', { answerIdx: i });
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: 5, background: selected ? 'rgba(201,168,76,.18)' : answered ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (selected ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.08)'), borderRadius: 7, cursor: answered ? 'default' : 'pointer', opacity: answered && !selected ? 0.45 : 1, color: TEXT }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: selected ? GOLD : MUTED, flexShrink: 0, width: 14 }}>{['A','B','C','D'][i]}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, flex: 1 }}>{opt.text}</span>
                    {selected && <span style={{ fontSize: 10, color: GOLD }}>✓</span>}
                  </button>
                );
              })}
              {triviaMyAnswer !== -1 && (
                <div style={{ textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 4 }}>
                  Locked in — waiting for results
                </div>
              )}
            </div>
          )}

          {triviaResults && (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 2, marginBottom: 7 }}>🎯 RESULTS</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: TEXT, lineHeight: 1.25, marginBottom: 10 }}>
                {triviaResults.question}
              </div>
              {triviaResults.options.map(function(opt, i) {
                var isCorrect  = i === triviaResults.correctIdx;
                var userPicked = i === triviaMyAnswer;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', marginBottom: 5, background: isCorrect ? 'rgba(92,184,92,.12)' : userPicked ? 'rgba(255,26,60,.08)' : 'rgba(255,255,255,.03)', border: '1px solid ' + (isCorrect ? 'rgba(92,184,92,.4)' : userPicked ? 'rgba(255,26,60,.3)' : 'rgba(255,255,255,.06)'), borderRadius: 7 }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: isCorrect ? '#5CB85C' : MUTED, flexShrink: 0, width: 14 }}>{['A','B','C','D'][i]}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, flex: 1, color: isCorrect ? TEXT : MUTED }}>{opt.text}</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: isCorrect ? '#5CB85C' : MUTED }}>{opt.votes}</span>
                    {isCorrect && <span style={{ fontSize: 9 }}>✓</span>}
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(201,168,76,.1)' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>{triviaResults.total} answered · {triviaResults.correct.length} correct</div>
                {triviaMyAnswer !== -1 && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: triviaMyAnswer === triviaResults.correctIdx ? '#5CB85C' : RED }}>
                    {triviaMyAnswer === triviaResults.correctIdx ? '🎉 Got it!' : '❌ Wrong'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ SESSION SUMMARY OVERLAY ════════════════ */}
      {showSessionSummary && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.86)', zIndex: 98, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeSlideIn .2s ease' }}
          onClick={function() { setShowSessionSummary(false); }}>
          <div style={{ background: SURF, borderRadius: 20, border: '1px solid ' + BORDER, padding: '28px 28px 32px', width: '90%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,.9)' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 1 }}>📈 Session Summary</span>
              <button onClick={function() { setShowSessionSummary(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            {(function() {
              var topSpeakerName = null;
              var bestSecs = 0;
              onStage.forEach(function(g) {
                var gid = g.guestId || g.userId;
                var s = speakingSnapshots[gid] || 0;
                if (s > bestSecs) { bestSecs = s; topSpeakerName = localGuestNames[gid] || g.username || gid; }
              });
              var totalGifts = Object.values(guestGiftTotals).reduce(function(sum, v) { return sum + (v || 0); }, 0);
              var durH = Math.floor(streamDuration / 3600);
              var durM = Math.floor((streamDuration % 3600) / 60);
              var durS = streamDuration % 60;
              var durStr = streamDuration > 0 ? ((durH > 0 ? (durH < 10 ? '0' : '') + durH + ':' : '') + (durM < 10 ? '0' : '') + durM + ':' + (durS < 10 ? '0' : '') + durS) : '—';
              var rows2 = [
                { label: '👥 Peak Viewers',  value: peakViewers || '—' },
                { label: '🎤 On Stage',      value: onStage.length },
                { label: '🗣 Top Speaker',   value: topSpeakerName || '—' },
                { label: '🎁 Total Gifts',   value: totalGifts ? ('$' + (Math.floor(totalGifts) / 100).toFixed(2)) : '—' },
                { label: '✂️ Clips',         value: clipLog.length || '0' },
                { label: '⏱ Stream Time',   value: durStr },
              ];
              return (
                <div>
                  {rows2.map(function(row) {
                    return (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + DIM }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: MUTED }}>{row.label}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: TEXT }}>{row.value}</span>
                      </div>
                    );
                  })}
                  <button onClick={function() {
                    var text = rows2.map(function(r) { return r.label + ' ' + r.value; }).join('\n');
                    navigator.clipboard.writeText(text).then(function() {
                      if (addToastRef.current) addToastRef.current('Summary copied!', 'success');
                    });
                  }} style={{ marginTop: 18, width: '100%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 10, padding: '10px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: GOLD, cursor: 'pointer', letterSpacing: .5 }}>
                    📋 COPY TO CLIPBOARD
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ════════════════ TELEPROMPTER OVERLAY (host-local) ════════════════ */}
      {showTeleprompter && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 95, background: 'rgba(9,7,14,.94)', borderBottom: '2px solid ' + TEAL + '44', animation: 'fadeSlideIn .2s ease' }}>
          {/* Controls bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: '1px solid ' + DIM }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: .5, flexShrink: 0 }}>📜 TELEPROMPTER</span>
            <button onClick={function() { setPrompterRunning(function(v) { return !v; }); }}
              style={{ background: prompterRunning ? 'rgba(0,195,255,.2)' : CARD, border: '1px solid ' + (prompterRunning ? TEAL : BORDER), borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: prompterRunning ? TEAL : MUTED, cursor: 'pointer', letterSpacing: .3 }}>
              {prompterRunning ? '⏸ PAUSE' : '▶ SCROLL'}
            </button>
            <button onClick={function() { if (prompterScrollRef.current) prompterScrollRef.current.scrollTop = 0; setPrompterRunning(false); }}
              style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer' }}>
              ↑ RESET
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>SPEED</span>
              <input type="range" min={10} max={120} value={prompterSpeed}
                onChange={function(e) { setPrompterSpeed(Number(e.target.value)); }}
                style={{ width: 60, accentColor: TEAL }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>{prompterSpeed}</span>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={function() { setShowTeleprompter(false); setPrompterRunning(false); }}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>✕</button>
          </div>
          {/* Scrollable script (when text is set) */}
          {prompterText ? (
            <div>
              <div ref={prompterScrollRef} style={{ maxHeight: 130, overflowY: 'auto', padding: '10px 14px', scrollbarWidth: 'none' }}>
                <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 20, color: TEXT, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', letterSpacing: .3 }}>{prompterText}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '4px 14px 8px' }}>
                <button onClick={function() { setPrompterRunning(false); setPrompterText(''); }}
                  style={{ background: 'none', border: '1px solid ' + BORDER, borderRadius: 5, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, cursor: 'pointer' }}>
                  ✏ EDIT SCRIPT
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 14px 10px' }}>
              <textarea
                value={prompterText}
                onChange={function(e) { setPrompterText(e.target.value); }}
                placeholder="Paste your script here, then press ▶ SCROLL…"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '8px 10px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, resize: 'none', outline: 'none' }}
              />
            </div>
          )}
        </div>
      )}

      {/* ════════════════ DEVICE PICKER SHEET ════════════════ */}
      {showDevicePicker && role !== 'viewer' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 93, display: 'flex', alignItems: 'flex-end', animation: 'fadeSlideIn .18s ease' }}
          onClick={function() { setShowDevicePicker(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '16px 16px 0 0', border: '1px solid ' + BORDER, maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 -10px 40px rgba(0,0,0,.7)' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid ' + DIM, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEXT, letterSpacing: 1 }}>🎛 Input Devices</span>
              <button onClick={function() { setShowDevicePicker(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>✕</button>
            </div>
            {avCameras.length > 0 && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 8 }}>📷 CAMERA</div>
                {avCameras.map(function(cam, idx) {
                  var isActive = idx === camDevIdx;
                  return (
                    <button key={cam.deviceId} onClick={function() { handleCamSelect(idx); }}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, background: isActive ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (isActive ? 'rgba(201,168,76,.4)' : BORDER), borderRadius: 8, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? GOLD : DIM, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: isActive ? TEXT : MUTED, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cam.label || 'Camera ' + (idx + 1)}
                      </span>
                      {isActive && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, flexShrink: 0 }}>ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {avMics.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: avCameras.length > 0 ? '1px solid ' + DIM : 'none' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 8 }}>🎙 MICROPHONE</div>
                {avMics.map(function(mic, idx) {
                  var isActive = idx === micDevIdx;
                  return (
                    <button key={mic.deviceId} onClick={function() { handleMicSelect(idx); }}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, background: isActive ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (isActive ? 'rgba(201,168,76,.4)' : BORDER), borderRadius: 8, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? GOLD : DIM, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: isActive ? TEXT : MUTED, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mic.label || 'Mic ' + (idx + 1)}
                      </span>
                      {isActive && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, flexShrink: 0 }}>ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ padding: '8px 16px 20px', borderTop: '1px solid ' + DIM }}>
              <button onClick={function() { setShowDevicePicker(false); }}
                style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '10px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ LAYOUT PRESETS PANEL (host/cohost) ════════════════ */}
      {showPresetsPanel && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 93, display: 'flex', alignItems: 'flex-end', animation: 'fadeSlideIn .18s ease' }}
          onClick={function() { setShowPresetsPanel(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '16px 16px 0 0', border: '1px solid ' + BORDER, maxHeight: '75vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 -10px 40px rgba(0,0,0,.7)' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid ' + DIM, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEXT, letterSpacing: 1 }}>📐 Layout Presets</span>
              <button onClick={function() { setShowPresetsPanel(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>✕</button>
            </div>
            {/* Save current layout */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + DIM }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 8 }}>SAVE CURRENT LAYOUT</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={presetNameInput}
                  onChange={function(e) { setPresetNameInput(e.target.value); }}
                  placeholder={'Layout ' + (layoutPresets.length + 1)}
                  style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 6, padding: '7px 10px', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, outline: 'none' }} />
                <button onClick={function() { saveLayoutPreset(presetNameInput || null); setPresetNameInput(''); }}
                  style={{ background: GOLD, border: 'none', borderRadius: 6, padding: '7px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: BG, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
                  SAVE
                </button>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 5, letterSpacing: .3 }}>
                Captures: {stageLayout} layout{stageOrderOverride ? ' · custom order (' + stageOrderOverride.length + ' guests)' : ''}
              </div>
            </div>
            {/* Saved presets list */}
            <div style={{ padding: '12px 16px' }}>
              {layoutPresets.length === 0 ? (
                <div style={{ padding: '16px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center' }}>No presets yet — save one above</div>
              ) : layoutPresets.map(function(p) {
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', marginBottom: 6, background: CARD, border: '1px solid ' + BORDER, borderRadius: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 1 }}>
                        {p.layout}{p.order ? ' · ' + p.order.length + ' guests' : ' · default order'}
                      </div>
                    </div>
                    <button onClick={function() { loadLayoutPreset(p); }}
                      style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 6, padding: '5px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, cursor: 'pointer', letterSpacing: .3, flexShrink: 0 }}>
                      LOAD
                    </button>
                    <button onClick={function() { deleteLayoutPreset(p.id); }}
                      style={{ background: 'none', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer', padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '8px 16px 20px', borderTop: '1px solid ' + DIM }}>
              <button onClick={function() { setShowPresetsPanel(false); }}
                style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '10px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ KICKED OVERLAY ════════════════ */}
      {kicked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,7,14,.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300, textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(255,26,60,.5))' }}>🚫</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 34, color: TEXT, letterSpacing: 5, marginBottom: 10 }}>YOU WERE REMOVED</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, letterSpacing: 1, lineHeight: 1.8, maxWidth: 260 }}>The host has removed you from this room.</div>
        </div>
      )}
    </div>
  );
}
