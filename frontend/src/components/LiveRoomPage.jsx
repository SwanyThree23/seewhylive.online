import React, { useState, useEffect, useRef } from 'react';
import OctCell from './OctCell.jsx';
import rtcManager from '../webrtc.js';
import MediaConfigPanel from './MediaConfigPanel.jsx';
import { saveClip, listClips, deleteClip } from '../clipStore.js';
import ClipGalleryPage from './ClipGalleryPage.jsx';
import { creatorCents, platformCents, getPlatformHandles } from '../platformConfig.js';
import HostHUD from './HostHUD.jsx';
import ChyronOverlay from './ChyronOverlay.jsx';
import PollOverlay from './PollOverlay.jsx';
import AudioOnlyToggle from './panel/AudioOnlyToggle.jsx';
import JoinRequestQueue from './panel/JoinRequestQueue.jsx';
import GiftLayer from './GiftLayer.jsx';
import GoldenWallPanel from './GoldenWallPanel.jsx';
import GlobalMicButtonV49 from './streaming/GlobalMicButtonV49.jsx';
import ShareSheet from './share/ShareSheet.jsx';
import PanelReactionBar from './panel/PanelReactionBar.jsx';
import panelService from '../services/panelService.js';

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
  '@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:0}}',
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
  '@keyframes shopBurst{0%{opacity:0;transform:scale(.7) translateY(10px)}60%{transform:scale(1.06)}100%{opacity:1;transform:scale(1) translateY(0)}}',
  '@keyframes goalFill{from{width:0}to{width:var(--goal-pct)}}',
  '@keyframes challengeIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}',
  '@keyframes statsFadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}',
  '@keyframes spotlightIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}',
  '@keyframes thumbBarIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}',
  '@keyframes starPop{0%{transform:scale(0.5)}60%{transform:scale(1.25)}100%{transform:scale(1)}}',
  '@keyframes voteBarGrow{from{width:0}to{width:var(--vote-pct)}}',
  '@keyframes pointFlash{0%{opacity:0;transform:translateY(8px) scale(.8)}40%{opacity:1;transform:translateY(-4px) scale(1.1)}100%{opacity:0;transform:translateY(-18px) scale(.9)}}',
  '@keyframes shoutoutIn{0%{opacity:0;transform:scale(.85) translateY(14px)}60%{transform:scale(1.04)}100%{opacity:1;transform:scale(1) translateY(0)}}',
  '@keyframes shoutoutOut{from{opacity:1}to{opacity:0;transform:translateY(-12px)}}',
  '@keyframes countdownTick{0%{transform:scale(1.06)}100%{transform:scale(1)}}',
  '@keyframes milestoneIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}60%{transform:translate(-50%,-50%) scale(1.06)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}',
  '@keyframes milestoneOut{from{opacity:1}to{opacity:0;transform:translate(-50%,-50%) translateY(-18px)}}',
  '@keyframes teamBarGrow{from{width:0}to{width:var(--tb-pct)}}',
  '@keyframes battleWin{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}',
  '@keyframes heatPop{0%{transform:translate(-50%,-50%) scale(.6);opacity:1}100%{transform:translate(-50%,-50%) scale(2.4);opacity:0}}',
  '@keyframes goalFill{from{width:0}to{width:var(--goal-pct)}}',
  '@keyframes goalComplete{0%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.05);filter:brightness(1.3)}100%{transform:scale(1);filter:brightness(1)}}',
  '@keyframes moodPulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}',
  '@keyframes comboFlash{0%{transform:scale(.5);opacity:0}40%{transform:scale(1.2);opacity:1}70%{transform:scale(1)}100%{opacity:0}}',
  '@keyframes spotlightGlow{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}50%{box-shadow:0 0 0 8px rgba(201,168,76,.3)}}',
  '@keyframes entranceSlide{0%{transform:translateY(40px);opacity:0}30%{transform:translateY(-4px);opacity:1}85%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}',
  '@keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}',
].join('\n');

// ─── Room ambiance themes ─────────────────────────────────────────────────────
var ROOM_THEMES = {
  default: { label: 'Default',  emoji: '◉', bg: null },
  cosmic:  { label: 'Cosmic',   emoji: '🌌', bg: 'radial-gradient(ellipse at 20% 30%, #1a0a3a 0%, #0e0c09 70%)' },
  forest:  { label: 'Forest',   emoji: '🌿', bg: 'radial-gradient(ellipse at 50% 0%, #0a1f0a 0%, #0e0c09 70%)' },
  sunset:  { label: 'Sunset',   emoji: '🌅', bg: 'radial-gradient(ellipse at 50% 0%, #2a0e00 0%, #0e0c09 65%)' },
  ocean:   { label: 'Ocean',    emoji: '🌊', bg: 'radial-gradient(ellipse at 50% 0%, #001a2a 0%, #0e0c09 65%)' },
  neon:    { label: 'Neon',     emoji: '💡', bg: 'radial-gradient(ellipse at 50% 10%, #001a10 0%, #0e0c09 70%)' },
  rose:    { label: 'Rose',     emoji: '🌹', bg: 'radial-gradient(ellipse at 50% 0%, #2a0010 0%, #0e0c09 70%)' },
  gold:    { label: 'Gold',     emoji: '✨', bg: 'radial-gradient(ellipse at 50% 0%, #1a1000 0%, #0e0c09 70%)' },
};

// ─── AI visual filter CSS presets ────────────────────────────────────────────
var AI_FILTERS = {
  vivid:   'saturate(1.8) contrast(1.1)',
  warm:    'sepia(.35) saturate(1.3)',
  cool:    'hue-rotate(195deg) saturate(.85)',
  bw:      'grayscale(1)',
  vintage: 'sepia(.55) brightness(.92) contrast(1.05)',
  neon:    'saturate(2.2) hue-rotate(30deg) brightness(1.1)',
  soft:    'brightness(1.05) contrast(.9)',
};
var AI_FILTER_META = [
  { key: 'none',    label: 'None',    emoji: '○'  },
  { key: 'vivid',   label: 'Vivid',   emoji: '🎨' },
  { key: 'warm',    label: 'Warm',    emoji: '🌅' },
  { key: 'cool',    label: 'Cool',    emoji: '❄️' },
  { key: 'bw',      label: 'B&W',     emoji: '⬛' },
  { key: 'vintage', label: 'Vintage', emoji: '📷' },
  { key: 'neon',    label: 'Neon',    emoji: '💡' },
  { key: 'soft',    label: 'Soft',    emoji: '☁️' },
];

// ─── Batch 45: Stage filters (broadcast-wide CSS filters) ────────────────────
var STAGE_FILTERS = {
  warm:   'sepia(.4) saturate(1.4)',
  cool:   'hue-rotate(190deg) saturate(.8)',
  bw:     'grayscale(1)',
  vivid:  'saturate(1.9) contrast(1.08)',
  soft:   'brightness(1.06) contrast(.88)',
  golden: 'sepia(.5) saturate(1.5) brightness(1.05)',
  neon:   'saturate(2.3) hue-rotate(25deg) brightness(1.08)',
};
var STAGE_FILTER_META = [
  { key: 'normal', label: 'Normal',  emoji: '○'  },
  { key: 'warm',   label: 'Warm',    emoji: '🌅' },
  { key: 'cool',   label: 'Cool',    emoji: '❄️' },
  { key: 'bw',     label: 'B&W',     emoji: '⬛' },
  { key: 'vivid',  label: 'Vivid',   emoji: '🎨' },
  { key: 'soft',   label: 'Soft',    emoji: '☁️' },
  { key: 'golden', label: 'Golden',  emoji: '✨' },
  { key: 'neon',   label: 'Neon',    emoji: '💡' },
];

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

function AudienceCircle({ g, speaking, handRaised, onInvite, engScore }) {
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
        {engScore > 0 && (
          <div style={{ position: 'absolute', top: -4, left: -4, background: 'rgba(212,133,74,.9)', borderRadius: 999, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: BG, border: '1px solid ' + BG, fontWeight: 700 }}>{engScore}</div>
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
    function tick() { setRem(Math.max(0, countdown.targetTs - Math.floor(Date.now() / 1000))); }
    tick();
    var t = setInterval(tick, 1000);
    return function() { clearInterval(t); };
  }, [countdown && countdown.targetTs, countdown && countdown.visible]);
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
  socket, guests, chat, setChat, isLive, setIsLive,
  userId, username, role, roomId, branding,
  addToast, overlayConfig, viewerCount, mediaConfig,
  streamInfo, streamGoal, setStreamGoal, sessionEarningsCents, onLeave,
}) {
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
  var [stageLayout,    setStageLayout]    = useState('grid');   // 'grid' | 'featured'
  var [featuredId,     setFeaturedId]     = useState(userId);
  var [showLiveModal,  setShowLiveModal]  = useState(false);
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
  var [panelMode,      setPanelMode]      = useState('grid'); // grid | list — for 20-person layout hint
  var [raisedHands,    setRaisedHands]    = useState({});    // { [guestId]: true } — persistent raised-hand indicators
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
  var [showShareSheet, setShowShareSheet] = useState(false);
  var [audioOnly,      setAudioOnly]      = useState(false);
  var [privateMode,    setPrivateMode]    = useState(false);
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
  var recTimerRef   = useRef(null);
  var mediaRecRef   = useRef(null);
  var recChunksRef  = useRef([]);
  var [scoreReveal,    setScoreReveal]    = useState(null); // { username, score, label } | null
  var [showSuperChatSheet, setShowSuperChatSheet] = useState(false);
  var [scMsg,              setScMsg]              = useState('');
  var [scAmt,              setScAmt]              = useState(100);
  var [giftCount,          setGiftCount]          = useState(0);
  var [superChatCount,     setSuperChatCount]     = useState(0);
  var [guestGiftTotals,    setGuestGiftTotals]    = useState({});  // { [guestId]: totalCents }
  var [joinRequested,      setJoinRequested]      = useState(false); // viewer stage-join request pending
  var [streamStats,        setStreamStats]        = useState(null); // { bitratekbps, rttMs, lossPct }
  var [theaterMode,        setTheaterMode]        = useState(false);
  var [theaterChatVisible, setTheaterChatVisible] = useState(true);
  var [isScreenSharing,    setIsScreenSharing]    = useState(false);
  var [screenShareHost,    setScreenShareHost]    = useState(null);  // { username } when remote host is sharing
  var [pinnedMsg,          setPinnedMsg]          = useState(null);  // { id, username, message, ts } | null
  var [spotlightItem,      setSpotlightItem]      = useState(null);  // { name, emoji, price, url, endsAt } | null
  var [showSpotlightPick,  setShowSpotlightPick]  = useState(false); // host product-picker modal
  var [spName,             setSpName]             = useState('');
  var [spEmoji,            setSpEmoji]            = useState('🛍️');
  var [spPrice,            setSpPrice]            = useState('');
  var [spUrl,              setSpUrl]              = useState('');
  var [followAlerts,       setFollowAlerts]       = useState([]); // [{id,username,ts}]
  var [showAnnounce,       setShowAnnounce]       = useState(false); // host scheduler modal
  var [announceMsg,        setAnnounceMsg]        = useState('');
  var [announceDelay,      setAnnounceDelay]      = useState('1'); // minutes
  var [pending,            setPending]            = useState([]);  // [{announceId,message,firesAt}]
  var [pinnedQa,           setPinnedQa]           = useState(null); // {id,username,text,upvotes}|null
  var [liveElapsed,        setLiveElapsed]        = useState(0);   // seconds since going live
  var [liveStartedAt,      setLiveStartedAt]      = useState(null);// unix ts
  var [crowdWildBanner,    setCrowdWildBanner]    = useState(false);
  var [hotMomentFlash,     setHotMomentFlash]     = useState(null);// { count } | null
  var [watchSeconds,       setWatchSeconds]       = useState(0);   // this viewer's watch time
  var [hotPressed,         setHotPressed]         = useState(false);// debounce hot-moment button
  var milestoneRef = useRef(new Set()); // viewer count milestones already celebrated
  var [topFans,            setTopFans]            = useState([]);
  var [bannedWords,        setBannedWords]        = useState([]);
  var [showBannedWords,    setShowBannedWords]    = useState(false);
  var [newBanWord,         setNewBanWord]         = useState('');
  var [localStreamTitle,   setLocalStreamTitle]   = useState('');
  var [showTitleEdit,      setShowTitleEdit]      = useState(false);
  var [titleInput,         setTitleInput]         = useState('');
  var [chatBannedIds,      setChatBannedIds]      = useState({});   // { [userId]: true }
  var [isSubOnly,          setIsSubOnly]          = useState(false);
  var [highlights,         setHighlights]         = useState([]);   // [{ts, count, windowKey}]
  var [showHighlights,     setShowHighlights]     = useState(false);
  var [slowMode,           setSlowMode]           = useState(0);    // seconds (0 = off)
  var [handQueue,          setHandQueue]          = useState([]);   // [{guestId,userId,username,ts}]
  var [milestoneOverlay,   setMilestoneOverlay]   = useState(null); // { count } | null
  var [showSlowMode,       setShowSlowMode]       = useState(false);
  var [shoutout,           setShoutout]           = useState(null); // { shoutoutTo, message } | null
  var [emojiTally,         setEmojiTally]         = useState([]);   // [{emoji, count}]
  var [showShoutout,       setShowShoutout]       = useState(false);
  var [shoutoutTarget,     setShoutoutTarget]     = useState('');
  var [roomTags,           setRoomTags]           = useState([]);   // string[]
  var [pinnedLink,         setPinnedLink]         = useState(null); // { url, label, emoji } | null
  var [confettiPieces,     setConfettiPieces]     = useState([]);   // [{ id, x, color, delay, dur }]
  var [mentionAlert,       setMentionAlert]       = useState(null); // { by } | null
  var [spotlightRequests,  setSpotlightRequests]  = useState([]);   // [{guestId,username,ts}] — host only
  var [watchMilestones,    setWatchMilestones]    = useState(new Set()); // milestones already shown
  var [pinnedAnnouncement, setPinnedAnnouncement] = useState(null); // { text } | null
  var [showPinAnnounce,    setShowPinAnnounce]    = useState(false);
  var [pinAnnounceInput,   setPinAnnounceInput]   = useState('');
  var [showCaptions,       setShowCaptions]       = useState(false);
  var [latestCaption,      setLatestCaption]      = useState('');   // latest transcript text
  var [myEngagement,       setMyEngagement]       = useState({ chat: 0, react: 0, gift: 0 });
  var lastTapRef = useRef(0); // for double-tap detection
  var [showMuteAllConfirm, setShowMuteAllConfirm] = useState(false);
  var [revenueOverlay,     setRevenueOverlay]     = useState(null); // { dollars } | null
  var [endScreen,          setEndScreen]          = useState(null); // { duration, peak } | null
  var peakViewersRef = useRef(0);
  var [showDmModal,        setShowDmModal]        = useState(false);
  var [dmTarget,           setDmTarget]           = useState(null); // { guestId, username } | null
  var [dmInput,            setDmInput]            = useState('');
  var [giftChain,          setGiftChain]          = useState(null); // { count } | null
  var [emojiMode,          setEmojiMode]          = useState(false); // emoji-burst vs text chat
  var [isSuperFan,         setIsSuperFan]         = useState(false); // earned superfan status
  var [chatKeyword,        setChatKeyword]        = useState('');   // host highlight keyword
  var [showKeywordSet,     setShowKeywordSet]     = useState(false);
  var [keywordInput,       setKeywordInput]       = useState('');
  // ── Batch 17: Live Shopping, Challenges, Creator Goal, Live Stats ────────
  var [pinnedShopItem,     setPinnedShopItem]     = useState(null);     // { id, name, price, image, url }
  var [shopCartConfirm,    setShopCartConfirm]    = useState(null);     // itemId confirmed
  var [shopPurchaseBurst,  setShopPurchaseBurst]  = useState(null);     // { username }
  var [showShopPin,        setShowShopPin]        = useState(false);    // host shop pin modal
  var [shopItemInput,      setShopItemInput]      = useState({ name: '', price: '', image: '', url: '' });
  var [activeChallenge,    setActiveChallenge]    = useState(null);     // { title, goal, progress, unit, reward, active }
  var [challengeComplete,  setChallengeComplete]  = useState(null);     // { title, reward }
  var [showChallengeSet,   setShowChallengeSet]   = useState(false);    // host set challenge modal
  var [challengeInput,     setChallengeInput]     = useState({ title: '', goal: 10, unit: 'reactions', reward: '' });
  var [creatorGoal,        setCreatorGoal]        = useState(null);     // { title, targetCents, currentCents, active }
  var [goalReached,        setGoalReached]        = useState(null);     // { title }
  var [showGoalSet,        setShowGoalSet]        = useState(false);    // host set goal modal
  var [goalInput,          setGoalInput]          = useState({ title: 'Stream Goal', targetCents: 1000 });
  var [showLiveStats,      setShowLiveStats]      = useState(false);    // host live stats panel
  var [liveStats,          setLiveStats]          = useState(null);     // { viewers, revenueCents, topGifter, topEmoji }
  // ── Batch 18: Channel Points, Top-Fans Wall, Shoutout Queue, Schedule ───
  var [pointBalance,       setPointBalance]       = useState(0);        // viewer's SeeWhy Points balance
  var [pointFlash,         setPointFlash]         = useState(null);     // { amount, reason } transient flash
  // ── Batch 19: Stream Rating, Audience Vote, Clip Pin, Layout Sync ───────
  var [myRating,           setMyRating]           = useState(0);        // 0 = not yet rated
  var [ratingAvg,          setRatingAvg]          = useState(null);     // { avg, count } from host perspective
  var [showRateStream,     setShowRateStream]     = useState(false);    // viewer rate-stream sheet
  var [audienceVote,       setAudienceVote]       = useState(null);     // { id, question, optA, optB, countA, countB, endsAt }
  var [myVoteSide,         setMyVoteSide]         = useState(null);     // 'A' | 'B' | null
  var [audienceVoteResult, setAudienceVoteResult] = useState(null);     // { countA, countB, optA, optB }
  var [showVoteCreate,     setShowVoteCreate]     = useState(false);    // host vote creation modal
  var [voteInput,          setVoteInput]          = useState({ question: '', optA: 'YES', optB: 'NO', durationSec: 30 });
  var [pinnedClip,         setPinnedClip]         = useState(null);     // { label, url, ts }
  // ── Batch 20: Guest Spotlight mode, AI filters, polls, PK leaderboard ───
  var [spotlightGuestId,   setSpotlightGuestId]   = useState(null);     // guestId enlarged to 70%
  var [aiFilter,           setAiFilter]           = useState('none');   // visual filter applied to own stream
  var [showFilterPanel,    setShowFilterPanel]     = useState(false);   // host/guest filter picker
  var [pkLeaderboard,      setPkLeaderboard]       = useState(function() {
    try { return JSON.parse(localStorage.getItem('sw_pk_leaderboard') || '[]'); } catch(e) { return []; }
  });
  var [showPkLeaderboard,  setShowPkLeaderboard]  = useState(false);
  var [pkCurrentBattle,    setPkCurrentBattle]    = useState(null);     // { challenger, defender } for leaderboard tracking
  var [showClipGallery,   setShowClipGallery]    = useState(false);    // clip gallery overlay
  // ── Batch 21: Watch Together, Sound Alerts, Stream Milestones ────────────
  var [watchTogether,     setWatchTogether]      = useState(null);     // { url, currentTime, playing, by }
  var [showWatchInput,    setShowWatchInput]      = useState(false);   // host URL input
  var [watchUrl,          setWatchUrl]           = useState('');
  var [streamMilestone,   setStreamMilestone]    = useState(null);     // { count, label } for celebration
  var [soundAlertPanel,   setSoundAlertPanel]    = useState(false);    // host sound-alert picker
  // ── Batch 22: Room Theme, Shop Carousel, Q&A Answers, Engagement Scores ──
  var [roomTheme,         setRoomTheme]          = useState('default'); // stage ambiance preset
  var [showThemePicker,   setShowThemePicker]    = useState(false);
  var [shopCarousel,      setShopCarousel]       = useState([]);        // [{id,name,price,image,url}]
  var [showCarouselEdit,  setShowCarouselEdit]   = useState(false);
  var [carouselDraft,     setCarouselDraft]      = useState({ name: '', price: '', image: '', url: '' });
  var [qaAnswers,         setQaAnswers]          = useState({});        // { [qaId]: { answer, by, ts } }
  var [qaAnswerTarget,    setQaAnswerTarget]     = useState(null);      // qaId being answered
  var [qaAnswerDraft,     setQaAnswerDraft]      = useState('');
  var [engagementScores,  setEngagementScores]   = useState({});        // userId → score
  // ── Batch 23: Live Captions, Points Redemption, Hotkeys, Next Stream ─────
  var [captionsEnabled,   setCaptionsEnabled]    = useState(false);     // Web Speech API live captions
  var [captionText,       setCaptionText]        = useState('');        // current caption line
  var [captionsRef]                              = useState(function() { return { rec: null }; });
  var [showRedeemPanel,   setShowRedeemPanel]    = useState(false);     // points redemption panel
  var [chatColor,         setChatColor]          = useState(null);      // viewer's custom chat color
  var [nextStreamTs,      setNextStreamTs]       = useState(null);      // { datetime, label } host schedule
  var [showNextStream,    setShowNextStream]      = useState(false);
  var [nextStreamInput,   setNextStreamInput]    = useState({ datetime: '', label: 'Next stream' });
  var [hotkeysEnabled,    setHotkeysEnabled]     = useState(false);     // host hotkey shortcuts active
  var [showTopFans,        setShowTopFans]        = useState(false);    // public top-fans leaderboard panel
  var [shoutoutQueue,      setShoutoutQueue]      = useState([]);       // [{ username, reason, ts }]
  var [activeShoutout,     setActiveShoutout]     = useState(null);     // currently displayed shoutout
  var [streamCountdown,    setStreamCountdown]    = useState(null);     // { endsAt, label } pre-show countdown
  var [countdownSecs,      setCountdownSecs]      = useState(0);        // live ticking seconds
  var [showScheduleSet,    setShowScheduleSet]    = useState(false);    // host schedule modal
  var [scheduleInput,      setScheduleInput]      = useState({ label: 'Stream starts in', minutes: 15 });
  var [showTagEdit,        setShowTagEdit]        = useState(false);
  var [tagInput,           setTagInput]           = useState('');
  var [showLinkPin,        setShowLinkPin]        = useState(false);
  var [linkUrl,            setLinkUrl]            = useState('');
  var [linkLabel,          setLinkLabel]          = useState('');
  var [linkEmoji,          setLinkEmoji]          = useState('🔗');
  // ── Batch 24: Team Battle Arena, Multi-Camera, Reaction Heatmap ─────────
  var [teamBattle,         setTeamBattle]         = useState(null);    // { redLabel, blueLabel, redScore, blueScore, active, endsAt, winner }
  var [showTeamBattle,     setShowTeamBattle]     = useState(false);   // battle setup panel
  var [battleConfig,       setBattleConfig]       = useState({ redLabel: 'RED TEAM', blueLabel: 'BLUE TEAM', duration: 60 });
  var [multiCamDevices,    setMultiCamDevices]    = useState([]);      // list of camera MediaDeviceInfo
  var [activeCamId,        setActiveCamId]        = useState(null);    // currently active camera deviceId
  var [showCamPicker,      setShowCamPicker]      = useState(false);
  var [heatPoints,         setHeatPoints]         = useState([]);      // [{ x, y, emoji, id }]
  var [showHeatmap,        setShowHeatmap]        = useState(false);
  // ── Batch 25: Collaborative Whiteboard, Stream Health, Revenue Split ──────
  var [showWhiteboard,     setShowWhiteboard]     = useState(false);   // whiteboard overlay
  var [wbColor,            setWbColor]            = useState('#C9A84C');
  var [wbSize,             setWbSize]             = useState(3);
  var [showHealthBar,      setShowHealthBar]      = useState(false);   // stream health compact HUD
  var [showRevSplit,       setShowRevSplit]       = useState(false);   // revenue split breakdown
  // ── Batch 26: Karaoke, Lucky Draw, Stream Chapters ───────────────────────
  var [karaokeText,        setKaraokeText]        = useState('');      // live lyrics text
  var [karaokeActive,      setKaraokeActive]      = useState(false);
  var [showKaraokeEdit,    setShowKaraokeEdit]    = useState(false);   // host edit modal
  var [karaokeInput,       setKaraokeInput]       = useState('');
  var [luckyWinner,        setLuckyWinner]        = useState(null);    // { winner, prize, ts }
  var [showLuckyDraw,      setShowLuckyDraw]      = useState(false);   // lucky draw panel
  var [luckyPrize,         setLuckyPrize]         = useState('');
  var [streamChapters,     setStreamChapters]     = useState([]);      // [{ label, ts, elapsed }]
  var [showChapters,       setShowChapters]       = useState(false);   // chapters panel
  // ── Batch 27: Sentiment Meter, Screen Annotations, Guest Intro Cards ─────
  var [sentiment,          setSentiment]          = useState({ up: 0, down: 0 });
  var [myVote,             setMyVote]             = useState(null);    // 'up' | 'down' | null
  var [showSentiment,      setShowSentiment]      = useState(false);   // sentiment bar overlay
  var [screenAnnotDots,    setScreenAnnotDots]    = useState([]);      // [{ x, y, color, id }]
  var [guestIntroCard,     setGuestIntroCard]     = useState(null);    // { username, bio, emoji } current card
  // ── Batch 28: Now Playing, Tip Ticker, Watch-Time Badges ─────────────────
  var [nowPlaying,         setNowPlaying]         = useState(null);    // { title, artist, emoji } | null
  var [showNowPlayingEdit, setShowNowPlayingEdit] = useState(false);
  var [nowPlayingInput,    setNowPlayingInput]    = useState({ title: '', artist: '', emoji: '🎵' });
  var [tipTickerItems,     setTipTickerItems]     = useState([]);      // [{ text, id }]
  var [tipTickerIdx,       setTipTickerIdx]       = useState(0);       // current rotating index
  var [showTipEdit,        setShowTipEdit]        = useState(false);
  var [tipEditInput,       setTipEditInput]       = useState('');      // newline-separated
  var [myWatchSecs,        setMyWatchSecs]        = useState(0);       // seconds I've been watching
  // ── Batch 29: Teleprompter, Connection Quality, Post-Stream Summary ───────
  var [showTeleprompter,   setShowTeleprompter]   = useState(false);   // host-only local overlay
  var [prompterText,       setPrompterText]       = useState('');      // script text
  var [prompterFontSize,   setPrompterFontSize]   = useState(22);      // px
  var [connQuality,        setConnQuality]        = useState(null);    // 'good'|'fair'|'poor'|null
  var [showSummaryCard,    setShowSummaryCard]    = useState(false);   // post-stream summary overlay
  // ── Batch 30: Word Cloud, Compare Panel, Highlights Timeline ─────────────
  var [showWordCloud,      setShowWordCloud]      = useState(false);
  var [showCompare,        setShowCompare]        = useState(false);
  var [compareUrl,         setCompareUrl]         = useState('');
  var [compareInput,       setCompareInput]       = useState('');
  var [showHighlightLine,  setShowHighlightLine]  = useState(false);
  var [giftGoal,           setGiftGoal]           = useState(null);   // { target, current, label, active, pct }
  var [showGiftGoal,       setShowGiftGoal]       = useState(false);
  var [goalInput,          setGoalInput]          = useState({ target: 5000, label: 'Stream Goal' });
  var [goalComplete,       setGoalComplete]       = useState(false);
  var [streamMood,         setStreamMood]         = useState(null);   // { emoji, label, key, counts }
  var [showMoodPanel,      setShowMoodPanel]      = useState(false);
  var [myMoodVote,         setMyMoodVote]         = useState(null);
  var [clipVotes,          setClipVotes]          = useState({});     // clipId → { up, down, myVote }
  var [cohostQueue,        setCohostQueue]        = useState([]);     // [{ userId, username, ts }]
  var [showCohostQueue,    setShowCohostQueue]    = useState(false);
  var [myBadges,           setMyBadges]           = useState([]);     // badges earned this session
  var [userBadges,         setUserBadges]         = useState({});     // userId → [badge, ...]
  var [cohostRequested,    setCohostRequested]    = useState(false);
  var [reactCombo,         setReactCombo]         = useState(null);   // { emoji, count } — flashes on milestone
  var [viewerSpotlight,    setViewerSpotlight]    = useState(null);   // { userId, username, endsAt }
  var [ttsEnabled,         setTtsEnabled]         = useState(false);  // local: TTS gift alerts
  var [showTtsPanel,       setShowTtsPanel]       = useState(false);
  var [starredMsgs,        setStarredMsgs]        = useState([]);     // [{ id, username, message, starCount }]
  var [showStarred,        setShowStarred]        = useState(false);
  var [guestEntrance,      setGuestEntrance]      = useState(null);   // { username, emoji } for 3s
  var [chatRaffle,         setChatRaffle]         = useState(null);   // { keyword, count, active } | null
  var [showRafflePanel,    setShowRafflePanel]    = useState(false);
  var [raffleInput,        setRaffleInput]        = useState({ keyword: '!join', prize: '' });
  var [raffleWinner,       setRaffleWinner]       = useState(null);   // { winner, prize, count }
  // Batch 35 — Stream Energy, Fan Wall, PiP
  var [streamEnergy,       setStreamEnergy]       = useState(0);       // 0–100
  var [fanWall,            setFanWall]            = useState([]);      // [{userId, username, points}]
  var [showFanWall,        setShowFanWall]        = useState(false);
  var [pipActive,          setPipActive]          = useState(false);
  // Batch 39 — Song Request, Hype Train, Marquee, Shoutout Queue
  // Batch 44 — Schedule, React Wall, Spotlight Pick, Host Bio
  var [schedule,           setSchedule]           = useState([]);      // [{id, label, done}]
  var [showSchedule,       setShowSchedule]       = useState(false);
  var [scheduleDraft,      setScheduleDraft]      = useState('');
  var [reactWall,          setReactWall]          = useState([]);      // [{username, emoji, ts}]
  var [showReactWall,      setShowReactWall]      = useState(false);
  var [hostBio,            setHostBio]            = useState(null);    // { bio, links }
  var [showBioPanel,       setShowBioPanel]       = useState(false);
  var [showBioEdit,        setShowBioEdit]        = useState(false);
  var [bioDraft,           setBioDraft]           = useState({ bio: '', links: [{ label: '', url: '' }] });
  var [spotlightPick,      setSpotlightPick]      = useState(null);    // { userId, username, duration }
  // Batch 45 — Stage Filter, Dramatic Countdown, Gifter Rank Badges, Session Stats
  var [stageFilter,        setStageFilter]        = useState(null);    // string or null
  var [showFilterPicker,   setShowFilterPicker]   = useState(false);
  var [dramaticCountdown,  setDramaticCountdown]  = useState(null);    // { count, from, label, done }
  var [showDramaticSet,    setShowDramaticSet]    = useState(false);
  var [dramaticCdFrom,     setDramaticCdFrom]     = useState('5');
  var [dramaticCdLabel,    setDramaticCdLabel]    = useState('');
  var [showSessionStats,   setShowSessionStats]   = useState(false);
  // Batch 46 — Pinned Emoji, Color Tier, Audio Level, Tip Milestone
  var [pinnedEmoji,        setPinnedEmoji]        = useState(null);    // { emoji } or null
  var [showEmojiPin,       setShowEmojiPin]       = useState(false);
  var [myColorTier,        setMyColorTier]        = useState(null);    // 'bronze'|'silver'|'gold'|'platinum'
  var [colorTiers,         setColorTiers]         = useState({});      // userId → tier
  var [audioLevelPct,      setAudioLevelPct]      = useState(null);    // 0-100 or null
  var [showAudioMeter,     setShowAudioMeter]     = useState(false);
  var [tipMilestoneFlash,  setTipMilestoneFlash]  = useState(null);    // { pct, label }
  // Batch 47 — Viewer Q Queue, Mood Ring, Trivia Drop, Name Tag
  var [viewerQueue,        setViewerQueue]        = useState([]);      // [{ id, username, text, votes }]
  var [showViewerQueue,    setShowViewerQueue]    = useState(false);
  var [queueDraft,         setQueueDraft]         = useState('');
  var [myQueueId,          setMyQueueId]          = useState(null);
  var [moodRingScore,      setMoodRingScore]      = useState(50);      // 0-100
  var [triviaDrop,         setTriviaDrop]         = useState(null);    // { q, opts, endsAt }
  var [triviaVote,         setTriviaVote]         = useState(null);    // 'A'|'B'|'C'|'D'
  var [triviaResults,      setTriviaResults]      = useState(null);    // { votes, answer }
  var [showTriviaSet,      setShowTriviaSet]      = useState(false);
  var [triviaDraft,        setTriviaDraft]        = useState({ q: '', opts: ['', '', '', ''], answer: 'A', secs: '30' });
  var [showTriviaPanel,    setShowTriviaPanel]    = useState(false);
  var [nameTag,            setNameTag]            = useState('');      // own name tag
  var [nameTags,           setNameTags]           = useState({});      // userId → tag
  var [showNameTagEdit,    setShowNameTagEdit]    = useState(false);
  var [nameTagDraft,       setNameTagDraft]       = useState('');
  var [showQueuePanel,     setShowQueuePanel]     = useState(false);
  var [questionAnswered,   setQuestionAnswered]   = useState(null);    // { username, text }
  // Batch 48 — Viewer Location, Highlight Vote, Donation Match, Watch Time Leaders
  var [locationShoutouts, setLocationShoutouts]  = useState([]);      // [{ userId, username, location, ts }]
  var [showLocationPanel, setShowLocationPanel]  = useState(false);
  var [locationDraft,     setLocationDraft]      = useState('');
  var [myLocation,        setMyLocation]         = useState(null);
  var [highlightVote,     setHighlightVote]      = useState(null);    // { label, yes, no, endsAt }
  var [myHighlightVote,   setMyHighlightVote]    = useState(null);    // 'yes'|'no'
  var [donationMatch,     setDonationMatch]      = useState(null);    // { label, limitCents, matchedCents }
  var [showMatchSet,      setShowMatchSet]        = useState(false);
  var [matchDraft,        setMatchDraft]          = useState({ limitDollars: '50', label: 'DONATION MATCH' });
  var [matchCompleteFlash,setMatchCompleteFlash]  = useState(null);
  var [watchLeaders,      setWatchLeaders]        = useState([]);
  var [showWatchLeaders,  setShowWatchLeaders]   = useState(false);
  // Batch 43 — Prize Wheel, Gift Combo, Sign-In Log, Outro Countdown
  var [prizeWheel,         setPrizeWheel]         = useState(null);    // { segments, active, lastWinner }
  var [showWheelSet,       setShowWheelSet]       = useState(false);
  var [wheelDraft,         setWheelDraft]         = useState('');      // newline-separated segment labels
  var [wheelSpinning,      setWheelSpinning]      = useState(false);
  var [wheelWinner,        setWheelWinner]        = useState(null);    // { label, color, idx }
  var [signInLog,          setSignInLog]          = useState([]);      // [{ userId, username, ts }]
  var [signedIn,           setSignedIn]           = useState(false);
  var [signInFlash,        setSignInFlash]        = useState(null);    // { username, count }
  var [outroCountdown,     setOutroCountdown]     = useState(null);    // { endsAt, label }
  var [outroSecs,          setOutroSecs]          = useState(0);
  var [showOutroSet,       setShowOutroSet]       = useState(false);
  var [outroDraft,         setOutroDraft]         = useState({ minutes: '5', label: 'GOING OFFLINE IN' });
  var [giftComboFlash,     setGiftComboFlash]     = useState(null);    // { username, count, emoji }
  // Batch 42 — Word Cloud, Viewer Status, Moment Log, Room Capacity
  var [wordCloud,          setWordCloud]          = useState([]);      // [{word, count}]
  var [showWordCloud,      setShowWordCloud]      = useState(false);
  var [viewerStatuses,     setViewerStatuses]     = useState({});      // userId → { emoji, text }
  var [myStatus,           setMyStatus]           = useState(null);    // { emoji, text }
  var [showStatusPicker,   setShowStatusPicker]   = useState(false);
  var [momentLog,          setMomentLog]          = useState([]);      // [{id, label, ts, by}]
  var [showMomentLog,      setShowMomentLog]      = useState(false);
  var [momentFlash,        setMomentFlash]        = useState(null);    // { label }
  var [momentLabelDraft,   setMomentLabelDraft]   = useState('');
  var [roomCapacity,       setRoomCapacity]       = useState(null);    // { max } | null
  var [showCapacitySet,    setShowCapacitySet]    = useState(false);
  var [capacityDraft,      setCapacityDraft]      = useState('');
  // Batch 41 — Fan Club, Watch Streak, Host Note, Collab Banner
  var [fanClub,            setFanClub]            = useState([]);      // [userId, ...]
  var [inFanClub,          setInFanClub]          = useState(false);
  var [watchStreak,        setWatchStreak]        = useState(0);       // consecutive days
  var [hostNote,           setHostNote]           = useState(null);    // { text, ts }
  var [showHostNoteSet,    setShowHostNoteSet]    = useState(false);
  var [hostNoteDraft,      setHostNoteDraft]      = useState('');
  var [collabBanner,       setCollabBanner]       = useState(null);    // { name, platform }
  var [showCollabSet,      setShowCollabSet]      = useState(false);
  var [collabDraft,        setCollabDraft]        = useState({ name: '', platform: '' });
  // Batch 40 — Check-in, Stream Title, Room Vibe, Simple Poll
  var [streamTitle,        setStreamTitle]        = useState(null);    // live-edited title string
  var [showTitleEdit,      setShowTitleEdit]      = useState(false);
  var [titleDraft,         setTitleDraft]         = useState('');
  var [roomVibe,           setRoomVibe]           = useState(null);    // 'hype'|'chill'|'gaming'|'music'|'party'|'educational'|'news'
  var [showVibePicker,     setShowVibePicker]     = useState(false);
  var [simplePoll,         setSimplePoll]         = useState(null);    // { q, yes, no, active, startTs }
  var [myPollVote,         setMyPollVote]         = useState(null);    // 'yes'|'no'|null
  var [showPollSet,        setShowPollSet]        = useState(false);
  var [pollDraft,          setPollDraft]          = useState('');
  var [checkinFlash,       setCheckinFlash]       = useState(null);    // { username, pts }
  var [songRequests,       setSongRequests]       = useState([]);      // [{id, userId, username, song, ts}]
  var [showSongQueue,      setShowSongQueue]      = useState(false);
  var [hypeTrain,          setHypeTrain]          = useState(null);    // { level, pts, target }
  var [hypeLevel,          setHypeLevel]          = useState(null);    // level for flash
  var [marquee,            setMarquee]            = useState(null);    // { text }
  var [showMarqueeSet,     setShowMarqueeSet]     = useState(false);
  var [marqueeDraft,       setMarqueeDraft]       = useState('');
  var [shoutoutQueue,      setShoutoutQueue]      = useState([]);      // [{id, username, message, ts}]
  var [showShoutoutQueue,  setShowShoutoutQueue]  = useState(false);
  var [shoutoutQueueAck,   setShoutoutQueueAck]   = useState(null);   // { queued, position }
  var [shoutoutMsgDraft,   setShoutoutMsgDraft]   = useState('');
  // Batch 38 — Scoreboard, Auction, Timer Widget, Quick Quiz
  var [scoreboard,         setScoreboard]         = useState(null);   // { title, teamA:{name,score,color}, teamB:{name,score,color} }
  var [showScoreboardSet,  setShowScoreboardSet]  = useState(false);
  var [scoreboardDraft,    setScoreboardDraft]    = useState({ title: 'Live Score', teamAName: 'Team A', teamBName: 'Team B', teamAColor: '#FF1A3C', teamBColor: '#00BFFF' });
  var [auction,            setAuction]            = useState(null);   // { item, desc, startBid, currentBid, bidder, active }
  var [showAuctionSet,     setShowAuctionSet]     = useState(false);
  var [auctionDraft,       setAuctionDraft]       = useState({ item: '', desc: '', startBid: 1 });
  var [myBid,              setMyBid]              = useState('');
  var [auctionEnded,       setAuctionEnded]       = useState(null);   // { item, winner, winningBid }
  var [timerWidget,        setTimerWidget]        = useState(null);   // { label, type, startTs, durationSecs }
  var [showTimerSet,       setShowTimerSet]       = useState(false);
  var [timerDraft,         setTimerDraft]         = useState({ label: '', type: 'countdown', durationSecs: 60 });
  var [timerDisplay,       setTimerDisplay]       = useState('');
  var [quickQuiz,          setQuickQuiz]          = useState(null);   // { q, opts:[{text,votes,pct}] }
  var [quickQuizMyAnswer,  setQuickQuizMyAnswer]  = useState(null);
  var [quickQuizFinal,     setQuickQuizFinal]     = useState(null);   // { q, results, winner, winnerIdx, totalVotes }
  var [showQuizSet,        setShowQuizSet]        = useState(false);
  var [quizDraft,          setQuizDraft]          = useState({ q: '', opts: ['', '', '', ''] });
  // Batch 37 — Chat Colors, Lower Third, Emoji Shower, Shoutout Card, Chat Theme
  var [chatColors,         setChatColors]         = useState({});      // { [userId]: hexColor }
  var [myChatColor,        setMyChatColor]        = useState(null);
  var [showColorPicker,    setShowColorPicker]    = useState(false);
  var [lowerThird,         setLowerThird]         = useState(null);    // { title, subtitle, endsAt } | null
  var [showLowerThirdSet,  setShowLowerThirdSet]  = useState(false);
  var [lowerThirdDraft,    setLowerThirdDraft]    = useState({ title: '', subtitle: '', durationSecs: 10 });
  var [emojiShower,        setEmojiShower]        = useState(null);    // { emoji, ts } → clears after 3s
  var [showEmojiPicker37,  setShowEmojiPicker37]  = useState(false);
  var [shoutoutCard,       setShoutoutCard]       = useState(null);    // { username, message }
  var [showShoutoutSet,    setShowShoutoutSet]    = useState(false);
  var [shoutoutDraft,      setShoutoutDraft]      = useState({ username: '', message: '' });
  var [chatTheme,          setChatTheme]          = useState(null);    // 'party'|'chill'|'sports'|'gaming'|'news'|null
  var [showThemePicker,    setShowThemePicker]    = useState(false);
  // Batch 36 — Audience Challenge, BRB, Flash Drop, Applause, VIP
  var [audienceChallenge,  setAudienceChallenge]  = useState(null);    // { text, durationSecs, startTs, responseCount }
  var [showChallengeSet,   setShowChallengeSet]   = useState(false);
  var [challengeDraft,     setChallengeDraft]     = useState({ text: '', durationSecs: 60 });
  var [challengeResponded, setChallengeResponded] = useState(false);
  var [brbMode,            setBrbMode]            = useState(null);    // { active, message, returnEta, startTs }
  var [showBrbSet,         setShowBrbSet]         = useState(false);
  var [brbDraft,           setBrbDraft]           = useState({ message: 'Be Right Back…', returnEta: 120 });
  var [flashDrop,          setFlashDrop]          = useState(null);    // { name, price, url, endsAt }
  var [showFlashDropSet,   setShowFlashDropSet]   = useState(false);
  var [flashDraft,         setFlashDraft]         = useState({ name: '', price: '', url: '', durationSecs: 60 });
  var [applauseCount,      setApplauseCount]      = useState(0);
  var [applauseBurst,      setApplauseBurst]      = useState(null);   // { count } for flash
  var [vips,               setVips]               = useState([]);     // [userId]

  var chatEndRef      = useRef(null);
  var cameraTrackRef  = useRef(null);
  var screenStreamRef = useRef(null);
  var wbCanvasRef     = useRef(null);
  var wbDrawing       = useRef(false);
  var wbLastPos       = useRef({ x: 0, y: 0 });
  var gold            = (branding && branding.gold) ? branding.gold : GOLD;

  // ── Camera warm-up ──
  useEffect(function() {
    if (role === 'viewer') return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(s) { s.getTracks().forEach(function(t) { t.stop(); }); })
      .catch(function() {});
  }, []);

  // ── Multi-camera enumeration (host/cohost only) ──
  useEffect(function() {
    if (role !== 'host' && role !== 'cohost') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function(devices) {
      var cams = devices.filter(function(d) { return d.kind === 'videoinput'; });
      setMultiCamDevices(cams);
    }).catch(function() {});
  }, [role]);

  // ── Watch time ping every 60 seconds ──
  useEffect(function() {
    if (!socket || !roomId) return;
    socket.emit('viewer-ping', { roomId: roomId });
    var interval = setInterval(function() {
      setMyWatchSecs(function(s) { return s + 60; });
      socket.emit('viewer-ping', { roomId: roomId });
    }, 60000);
    return function() { clearInterval(interval); };
  }, [socket, roomId]);

  // ── Tip ticker rotation ──
  useEffect(function() {
    if (tipTickerItems.length < 2) return;
    var interval = setInterval(function() {
      setTipTickerIdx(function(i) { return (i + 1) % tipTickerItems.length; });
    }, 5000);
    return function() { clearInterval(interval); };
  }, [tipTickerItems]);

  // ── Connection quality from streamStats ──
  useEffect(function() {
    if (!streamStats) return;
    var rtt = streamStats.rttMs || 0;
    var bps = streamStats.bitrateKbps || 0;
    if (rtt < 100 && bps >= 800)  setConnQuality('good');
    else if (rtt < 300 && bps >= 300) setConnQuality('fair');
    else setConnQuality('poor');
  }, [streamStats]);

  // ── RTC + socket events ──
  useEffect(function() {
    if (!socket) return;

    socket.on('join-room-ack', async function(data) {
      if (!data || data.error) {
        if (addToast) addToast('Room connect failed', 'error');
        return;
      }
      // Pre-load chat history and room state
      if (Array.isArray(data.chatHistory) && data.chatHistory.length > 0) {
        setChat(function(prev) { return prev.length > 0 ? prev : data.chatHistory; });
      }
      if (data.activePoll) {
        setActivePoll(data.activePoll);
        setShowQa(true);
      }
      if (data.activeVsPoll) {
        setVsPoll(data.activeVsPoll);
        setShowQa(true);
      }
      if (Array.isArray(data.judges) && data.judges.length > 0) {
        setJudges(data.judges);
      }
      if (data.pinnedChat) setPinnedMsg(data.pinnedChat);
      if (data.spotlight && data.spotlight.endsAt > Math.floor(Date.now() / 1000)) setSpotlightItem(data.spotlight);
      if (data.liveStartedAt) setLiveStartedAt(data.liveStartedAt);
      if (Array.isArray(data.roomTags)) setRoomTags(data.roomTags);
      if (data.pinnedLink) setPinnedLink(data.pinnedLink);
      if (data.slowMode) setSlowMode(data.slowMode);
      if (data.watchTogether) setWatchTogether(data.watchTogether);
      if (data.teamBattle && data.teamBattle.active) setTeamBattle(data.teamBattle);
      if (data.karaoke && data.karaoke.active) { setKaraokeText(data.karaoke.text || ''); setKaraokeActive(true); }
      if (Array.isArray(data.chapters) && data.chapters.length > 0) setStreamChapters(data.chapters);
      if (data.sentiment) setSentiment(data.sentiment);
      if (data.nowPlaying) setNowPlaying(data.nowPlaying);
      if (Array.isArray(data.tipTicker) && data.tipTicker.length > 0) setTipTickerItems(data.tipTicker);
      if (data.giftGoal) setGiftGoal(data.giftGoal);
      if (data.mood) setStreamMood(data.mood);
      if (Array.isArray(data.cohostQueue) && data.cohostQueue.length > 0) setCohostQueue(data.cohostQueue);
      if (data.energy) setStreamEnergy(data.energy.score || 0);
      if (Array.isArray(data.fanWall) && data.fanWall.length > 0) setFanWall(data.fanWall);
      if (data.audienceChallenge) setAudienceChallenge(data.audienceChallenge);
      if (data.intermission && data.intermission.active) setBrbMode(data.intermission);
      if (data.flashDrop && data.flashDrop.endsAt > Date.now()) setFlashDrop(data.flashDrop);
      if (Array.isArray(data.vips) && data.vips.length > 0) setVips(data.vips);
      if (data.lowerThird) setLowerThird(data.lowerThird);
      if (data.chatTheme) setChatTheme(data.chatTheme);
      if (Array.isArray(data.songRequests) && data.songRequests.length > 0) setSongRequests(data.songRequests);
      if (data.hypeTrain) setHypeTrain(data.hypeTrain);
      if (data.marquee) setMarquee(data.marquee);
      if (Array.isArray(data.shoutoutQueue) && data.shoutoutQueue.length > 0) setShoutoutQueue(data.shoutoutQueue);
      if (data.streamTitle) setStreamTitle(data.streamTitle);
      if (data.roomVibe) setRoomVibe(data.roomVibe.vibe || null);
      if (data.simplePoll && data.simplePoll.active) setSimplePoll(data.simplePoll);
      if (Array.isArray(data.fanClub)) { setFanClub(data.fanClub); setInFanClub(data.fanClub.indexOf(userId) !== -1); }
      if (data.hostNote) setHostNote(data.hostNote);
      if (data.collabBanner) setCollabBanner(data.collabBanner);
      if (data.watchStreak && data.watchStreak > 1) setWatchStreak(data.watchStreak);
      if (Array.isArray(data.wordCloud) && data.wordCloud.length > 0) setWordCloud(data.wordCloud);
      if (Array.isArray(data.momentLog) && data.momentLog.length > 0) setMomentLog(data.momentLog);
      if (data.roomCapacity) setRoomCapacity(data.roomCapacity);
      if (data.prizeWheel) setPrizeWheel(data.prizeWheel);
      if (Array.isArray(data.signInLog)) { setSignInLog(data.signInLog); if (data.signInLog.some(function(e) { return e.userId === userId; })) setSignedIn(true); }
      if (data.outroCountdown && data.outroCountdown.endsAt > Date.now()) setOutroCountdown(data.outroCountdown);
      if (Array.isArray(data.schedule) && data.schedule.length > 0) setSchedule(data.schedule);
      if (Array.isArray(data.reactWall) && data.reactWall.length > 0) setReactWall(data.reactWall);
      if (data.hostBio) setHostBio(data.hostBio);
      if (data.spotlightPick) setSpotlightPick(data.spotlightPick);
      if (data.stageFilter) setStageFilter(data.stageFilter);
      if (data.pinnedEmoji) setPinnedEmoji(data.pinnedEmoji);
      if (typeof data.audioLevel === 'number') setAudioLevelPct(data.audioLevel);
      if (Array.isArray(data.viewerQueue) && data.viewerQueue.length > 0) setViewerQueue(data.viewerQueue);
      if (data.moodRing && typeof data.moodRing.score === 'number') setMoodRingScore(data.moodRing.score);
      if (data.triviaDrop && data.triviaDrop.endsAt > Date.now()) setTriviaDrop(data.triviaDrop);
      if (Array.isArray(data.locationShoutouts) && data.locationShoutouts.length > 0) setLocationShoutouts(data.locationShoutouts);
      if (data.highlightVote && data.highlightVote.endsAt > Date.now()) setHighlightVote(data.highlightVote);
      if (data.donationMatch) setDonationMatch(data.donationMatch);
      if (data.scoreboard) setScoreboard(data.scoreboard);
      if (data.auction && data.auction.active) setAuction(data.auction);
      if (data.timerWidget && data.timerWidget.active) setTimerWidget(data.timerWidget);
      if (data.quickQuiz) setQuickQuiz(data.quickQuiz);
      if (Array.isArray(data.whiteboardStrokes) && data.whiteboardStrokes.length > 0) {
        setTimeout(function() {
          var canvas = wbCanvasRef.current;
          if (!canvas) return;
          var ctx = canvas.getContext('2d');
          var w = canvas.width; var h = canvas.height;
          data.whiteboardStrokes.forEach(function(seg) {
            ctx.beginPath();
            ctx.strokeStyle = seg.color || '#C9A84C';
            ctx.lineWidth   = seg.size  || 3;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.moveTo(seg.x1 / 100 * w, seg.y1 / 100 * h);
            ctx.lineTo(seg.x2 / 100 * w, seg.y2 / 100 * h);
            ctx.stroke();
          });
        }, 300);
      }
      try {
        await rtcManager.connect(socket, roomId, userId, role);
        setRtcReady(true);
        // Wire up stream health stats (only meaningful for hosts/cohosts sending media)
        rtcManager.on('stats', function(s) { setStreamStats(s); });
      } catch(e) {
        if (addToast) addToast('WebRTC: ' + e.message, 'error');
      }
    });

    socket.on('speaking', function(data) {
      if (!data || !data.guestId) return;
      setSpeakingIds(function(prev) {
        var next = Object.assign({}, prev);
        next[data.guestId] = !!data.speaking;
        return next;
      });
    });

    socket.on('super-chat', function(sc) {
      if (!sc) return;
      // Inject into chat stream as a super-chat type message
      var scEntry = Object.assign({ type: 'super' }, sc);
      setChat(function(prev) { return [...prev.slice(-200), scEntry]; });
      setSuperChatCount(function(c) { return c + 1; });
      if (addToast && role !== 'host') addToast('💬 ' + sc.username + ' sent a $' + (Math.floor(sc.amountCents) / 100).toFixed(2) + ' Super Chat!', 'success');
    });

    socket.on('gift-received', function(gift) {
      if (!gift) return;
      setGiftCount(function(c) { return c + 1; });
      // Populate tip feed so GiftLayer animations fire and tip feed panel shows
      var entry = { id: gift.id || Date.now(), from: gift.fromUser || 'Fan', amount: gift.valueCents || 0, emoji: gift.emoji || '🎁', toGuestId: gift.toGuestId || null, ts: gift.ts || Math.floor(Date.now() / 1000) };
      setTipFeed(function(prev) { return [entry].concat(prev).slice(0, 20); });
      // TTS gift alert (host/cohost only, if enabled)
      setTtsEnabled(function(enabled) {
        if (enabled && (role === 'host' || role === 'cohost') && window.speechSynthesis) {
          var dollars = ((gift.valueCents || 0) / 100).toFixed(2);
          var msg = new window.SpeechSynthesisUtterance((gift.fromUser || 'Someone') + ' sent ' + (gift.name || 'a gift') + ' for dollar ' + dollars);
          msg.rate = 1.1; msg.pitch = 1.05; msg.volume = 0.8;
          window.speechSynthesis.speak(msg);
        }
        return enabled;
      });
      // Merge per-guest gift totals from server snapshot (guestTotals) or compute locally
      if (gift.guestTotals) {
        setGuestGiftTotals(function(prev) { return Object.assign({}, prev, gift.guestTotals); });
      } else if (gift.toGuestId && gift.valueCents) {
        setGuestGiftTotals(function(prev) {
          var n = Object.assign({}, prev);
          n[gift.toGuestId] = (n[gift.toGuestId] || 0) + gift.valueCents;
          return n;
        });
      }
    });

    socket.on('merch-sale', function(sale) {
      if (!sale || !addToast) return;
      addToast('🛍️ ' + (sale.fromUser || 'Fan') + ' bought merch — +$' + ((sale.creatorCents || 0) / 100).toFixed(2) + ' for you!', 'success');
    });

    socket.on('chat-pinned', function(data) {
      if (!data) return;
      setPinnedMsg(data.msg || null);
    });

    socket.on('chat-deleted', function(data) {
      if (!data || !data.msgId) return;
      setChat(function(prev) { return prev.filter(function(m) { return m.id !== data.msgId; }); });
      setPinnedMsg(function(p) { return (p && p.id === data.msgId) ? null : p; });
    });

    socket.on('product-spotlight', function(data) {
      if (!data) return;
      var item = data.item;
      if (item && item.endsAt > Math.floor(Date.now() / 1000)) {
        setSpotlightItem(item);
        var msLeft = (item.endsAt - Math.floor(Date.now() / 1000)) * 1000;
        setTimeout(function() { setSpotlightItem(null); }, msLeft);
      } else {
        setSpotlightItem(null);
      }
    });

    socket.on('follow-alert', function(data) {
      if (!data || !data.username) return;
      var fid = Date.now() + Math.random();
      setFollowAlerts(function(prev) { return prev.concat([{ id: fid, username: data.username, ts: data.ts }]); });
      setTimeout(function() {
        setFollowAlerts(function(prev) { return prev.filter(function(f) { return f.id !== fid; }); });
      }, 4500);
    });

    socket.on('go-live-confirmed', function(data) {
      if (!data || !data.ts) return;
      setLiveStartedAt(data.ts);
    });

    socket.on('crowd-wild', function() {
      setCrowdWildBanner(true);
      setTimeout(function() { setCrowdWildBanner(false); }, 4000);
    });

    socket.on('hot-moment-burst', function(data) {
      if (!data) return;
      setHotMomentFlash({ count: data.count });
      setTimeout(function() { setHotMomentFlash(null); }, 3500);
    });

    socket.on('top-fans', function(data) {
      if (!data || !Array.isArray(data.fans)) return;
      setTopFans(data.fans);
    });

    socket.on('stream-info', function(data) {
      if (!data) return;
      if (data.title) setLocalStreamTitle(data.title);
    });

    socket.on('banned-words-updated', function(data) {
      if (!data || !Array.isArray(data.words)) return;
      setBannedWords(data.words);
    });

    socket.on('slow-mode-changed', function(data) {
      if (!data) return;
      setSlowMode(data.seconds || 0);
      if (addToast) addToast(data.seconds > 0 ? ('🐢 Slow mode: ' + data.seconds + 's between messages') : '💬 Slow mode off', 'info');
    });

    socket.on('hand-queue', function(data) {
      if (!data || !Array.isArray(data.queue)) return;
      setHandQueue(data.queue);
    });

    socket.on('gift-leaderboard', function(data) {
      if (!data || !Array.isArray(data.leaders)) return;
      setTipLeader(data.leaders);
    });

    socket.on('viewer-shoutout', function(data) {
      if (!data || !data.shoutoutTo) return;
      setShoutout({ shoutoutTo: data.shoutoutTo, message: data.message || ('🎉 ' + data.shoutoutTo + '!') });
      setTimeout(function() { setShoutout(null); }, 5000);
    });

    socket.on('emoji-tally', function(data) {
      if (!data || !Array.isArray(data.tally)) return;
      setEmojiTally(data.tally);
    });

    socket.on('celebrate', function(data) {
      if (!data) return;
      var colors = ['#C9A84C','#FF1A3C','#800020','#D4854A','#F0E8D4','#fff'];
      var pieces = Array.from({ length: 32 }, function(_, i) {
        return {
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 1.2,
          dur: 2 + Math.random() * 1.5,
        };
      });
      setConfettiPieces(pieces);
      if (addToast) addToast('🎊 ' + (data.from || 'Host') + ' is celebrating!', 'success');
      setTimeout(function() { setConfettiPieces([]); }, 4000);
    });

    socket.on('chat-mention', function(data) {
      if (!data || !data.by) return;
      setMentionAlert({ by: data.by });
      setTimeout(function() { setMentionAlert(null); }, 3000);
    });

    socket.on('spotlight-request', function(data) {
      if (!data || !data.username) return;
      setSpotlightRequests(function(prev) {
        var deduped = prev.filter(function(r) { return r.guestId !== data.guestId; });
        return deduped.concat([data]).slice(-5);
      });
      if (addToast) addToast('✨ ' + data.username + ' wants to be spotlighted', 'info');
    });

    socket.on('pin-announcement', function(data) {
      if (!data) return;
      setPinnedAnnouncement(data.text ? { text: data.text } : null);
    });

    socket.on('gift-notification', function(data) {
      if (!data || !data.from) return;
      var dollars = (data.valueCents / 100).toFixed(2);
      if (addToast) addToast(data.emoji + ' ' + data.from + ' sent you ' + data.name + ' ($' + dollars + ')!', 'success');
    });

    socket.on('gift-chain', function(data) {
      if (!data || !data.count) return;
      setGiftChain({ count: data.count, emoji: data.emoji || '🎁' });
      setTimeout(function() { setGiftChain(null); }, 3000);
    });

    socket.on('chat-keyword', function(data) {
      if (!data) return;
      setChatKeyword(data.keyword || '');
      if (data.keyword && addToast) addToast('🔑 Host highlighted keyword: "' + data.keyword + '"', 'info');
    });

    socket.on('host-alert', function(data) {
      if (!data || data.type !== 'revenue_milestone') return;
      var dollars = data.cents ? Math.floor(data.cents / 100) : 0;
      setRevenueOverlay({ dollars: dollars });
      setTimeout(function() { setRevenueOverlay(null); }, 4000);
    });

    socket.on('private-dm', function(data) {
      if (!data || !data.from || !data.message) return;
      if (addToast) addToast('💌 ' + data.from + ': ' + data.message, 'info');
    });

    // ── Batch 17 listeners ────────────────────────────────────────────────
    socket.on('shop-item-pin', function(data) {
      setPinnedShopItem(data && data.item ? data.item : null);
      if (data && data.item && addToast) addToast('🛍️ Shop: ' + (data.item.name || 'Item') + ' — $' + ((data.item.price || 0) / 100).toFixed(2), 'info');
    });

    socket.on('shop-cart-confirm', function(data) {
      if (!data || !data.itemId) return;
      setShopCartConfirm(data.itemId);
      if (addToast) addToast('✅ Added to cart!', 'success');
      setTimeout(function() { setShopCartConfirm(null); }, 2500);
    });

    socket.on('shop-purchase-burst', function(data) {
      if (!data || !data.username) return;
      setShopPurchaseBurst(data);
      setTimeout(function() { setShopPurchaseBurst(null); }, 3000);
    });

    socket.on('challenge-update', function(data) {
      if (!data) return;
      setActiveChallenge(data);
    });

    socket.on('challenge-complete', function(data) {
      if (!data) return;
      setChallengeComplete(data);
      if (addToast) addToast('🏆 Challenge complete: ' + data.title + (data.reward ? ' — ' + data.reward : ''), 'success');
      setTimeout(function() { setChallengeComplete(null); }, 5000);
    });

    socket.on('creator-goal', function(data) {
      if (!data) return;
      setCreatorGoal(data);
    });

    socket.on('creator-goal-reached', function(data) {
      if (!data) return;
      setGoalReached(data);
      if (addToast) addToast('🎯 Goal reached: ' + (data.title || 'Stream Goal') + '!', 'success');
      setTimeout(function() { setGoalReached(null); }, 5000);
    });

    socket.on('live-stats', function(data) {
      if (!data) return;
      setLiveStats(data);
    });

    // ── Batch 18 listeners ────────────────────────────────────────────────
    socket.on('points-earned', function(data) {
      if (!data || !data.amount) return;
      setPointBalance(function(b) { return b + data.amount; });
      setPointFlash(data);
      setTimeout(function() { setPointFlash(null); }, 1800);
    });

    socket.on('shoutout', function(data) {
      if (!data || !data.username) return;
      setShoutoutQueue(function(q) { return q.concat([data]); });
    });

    socket.on('stream-countdown', function(data) {
      setStreamCountdown(data || null);
    });

    // ── Batch 19 listeners ────────────────────────────────────────────────
    socket.on('stream-rating-ack', function(data) {
      if (!data) return;
      if (data.rating) setMyRating(data.rating);
    });

    socket.on('stream-rating-update', function(data) {
      if (!data) return;
      setRatingAvg({ avg: data.avg, count: data.count });
    });

    socket.on('audience-vote', function(data) {
      if (!data) return;
      setAudienceVote(data);
      setMyVoteSide(null);
      setAudienceVoteResult(null);
    });

    socket.on('audience-vote-update', function(data) {
      if (!data) return;
      setAudienceVote(function(v) { return v ? Object.assign({}, v, { countA: data.countA, countB: data.countB }) : v; });
    });

    socket.on('audience-vote-end', function(data) {
      if (!data) return;
      setAudienceVoteResult(data);
      setAudienceVote(null);
      setTimeout(function() { setAudienceVoteResult(null); }, 8000);
    });

    socket.on('clip-pinned', function(data) {
      if (!data) return;
      setPinnedClip(data);
      if (addToast) addToast('🎬 Clip pinned: ' + (data.label || 'Highlight'), 'info');
      setTimeout(function() { setPinnedClip(null); }, 12000);
      // Auto-save clip metadata to gallery (no blob — URL or label only)
      var clipId = 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      saveClip(clipId, new Blob([''], { type: 'text/plain' }), { label: data.label || 'Highlight', url: data.url || '', ts: Date.now(), roomId: roomId, emoji: '🎬' }).catch(function() {});
    });

    socket.on('layout-sync', function(data) {
      if (!data || !data.layout) return;
      setStageLayout(data.layout);
    });

    // ── PK leaderboard tracking ───────────────────────────────────────────────
    socket.on('pk-start', function(data) {
      if (!data) return;
      setPkCurrentBattle({ challenger: data.challenger || '', defender: data.defender || '' });
    });
    socket.on('pk-end', function(data) {
      if (!data || !data.winner) return;
      var winnerName = data.winner;
      setPkLeaderboard(function(prev) {
        var updated = prev.slice();
        var idx     = updated.findIndex(function(e) { return e.username === winnerName; });
        var score   = Math.max(data.challengerScore || 0, data.defenderScore || 0);
        if (idx >= 0) {
          updated[idx] = Object.assign({}, updated[idx], { wins: updated[idx].wins + 1, totalScore: updated[idx].totalScore + score, lastBattle: Date.now() });
        } else {
          updated.push({ username: winnerName, wins: 1, totalScore: score, lastBattle: Date.now() });
        }
        updated.sort(function(a, b) { return b.wins !== a.wins ? b.wins - a.wins : b.totalScore - a.totalScore; });
        try { localStorage.setItem('sw_pk_leaderboard', JSON.stringify(updated.slice(0, 50))); } catch(e) {}
        return updated.slice(0, 50);
      });
      setPkCurrentBattle(null);
    });

    // ── Batch 21: Watch Together, Sound Alerts, Stream Milestones ──────────
    socket.on('watch-together', function(data) {
      if (!data) return;
      setWatchTogether(data);
    });
    socket.on('watch-together-sync', function(data) {
      if (!data) return;
      setWatchTogether(function(prev) {
        if (!prev) return prev;
        return Object.assign({}, prev, { currentTime: data.currentTime, playing: data.playing });
      });
    });
    socket.on('watch-together-end', function() {
      setWatchTogether(null);
    });

    socket.on('stream-milestone', function(data) {
      if (!data) return;
      setStreamMilestone(data);
      setTimeout(function() { setStreamMilestone(null); }, 8000);
      if (addToast) addToast('🎉 ' + data.label + ' reached!', 'success');
    });

    // ── Batch 22 socket events ─────────────────────────────────────────────
    socket.on('qa-answered', function(data) {
      if (!data || !data.id) return;
      setQaAnswers(function(prev) {
        var next = Object.assign({}, prev);
        next[data.id] = { answer: data.answer, by: data.by, ts: data.ts };
        return next;
      });
    });
    socket.on('room-theme', function(data) {
      if (!data || !data.theme) return;
      setRoomTheme(data.theme);
    });
    socket.on('shop-carousel', function(data) {
      if (!data || !Array.isArray(data.items)) return;
      setShopCarousel(data.items);
    });
    socket.on('top-fans', function(data) {
      if (!data || !Array.isArray(data.fans)) return;
      var scores = {};
      data.fans.forEach(function(f) { if (f.userId) scores[f.userId] = f.score; });
      setEngagementScores(scores);
    });

    // ── Batch 23 events ─────────────────────────────────────────────────────
    socket.on('redeem-ack', function(data) {
      if (!data) return;
      if (data.perk === 'chatcolor') {
        var colors = ['#FF6B35','#FFD700','#00CED1','#FF69B4','#7B68EE','#32CD32'];
        setChatColor(colors[Math.floor(Math.random() * colors.length)]);
        if (addToast) addToast('🎨 Chat color unlocked!', 'success');
      } else if (data.perk === 'badge') {
        if (addToast) addToast('⭐ Badge unlocked!', 'success');
      } else if (data.perk === 'name_highlight') {
        if (addToast) addToast('✨ Name highlight active!', 'success');
      }
      setPointBalance(function(p) { return Math.max(0, p - (data.cost || 0)); });
    });
    socket.on('next-stream', function(data) {
      if (!data) return;
      setNextStreamTs(data);
    });

    // ── Batch 24: Team Battle, Reaction Heatmap ─────────────────────────────
    socket.on('team-battle-update', function(data) {
      if (!data) return;
      setTeamBattle(data.active === false && !data.winner ? null : data);
      if (data.active === false && data.winner) {
        var winLabel = data.winner === 'red' ? data.redLabel : data.blueLabel;
        if (addToast) addToast('⚔️ Battle over! ' + winLabel + ' wins!', 'success');
        setTimeout(function() { setTeamBattle(null); }, 6000);
      }
    });

    socket.on('reaction-heat', function(data) {
      if (!data) return;
      var pid = Date.now() + Math.random();
      setHeatPoints(function(prev) {
        return [{ x: data.x, y: data.y, emoji: data.emoji, id: pid }].concat(prev.slice(0, 199));
      });
      setTimeout(function() {
        setHeatPoints(function(prev) { return prev.filter(function(p) { return p.id !== pid; }); });
      }, 2500);
    });

    // ── Batch 25: Whiteboard ───────────────────────────────────────────────
    socket.on('canvas-draw', function(seg) {
      if (!seg || !wbCanvasRef.current) return;
      var canvas = wbCanvasRef.current;
      var ctx    = canvas.getContext('2d');
      var w = canvas.width; var h = canvas.height;
      ctx.beginPath();
      ctx.strokeStyle = seg.color || '#C9A84C';
      ctx.lineWidth   = seg.size  || 3;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.moveTo(seg.x1 / 100 * w, seg.y1 / 100 * h);
      ctx.lineTo(seg.x2 / 100 * w, seg.y2 / 100 * h);
      ctx.stroke();
    });

    socket.on('canvas-clear', function() {
      if (!wbCanvasRef.current) return;
      var canvas = wbCanvasRef.current;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    });

    // ── Batch 26: Karaoke, Lucky Draw, Chapters ────────────────────────────
    socket.on('karaoke-update', function(data) {
      if (!data) return;
      setKaraokeText(data.text || '');
      setKaraokeActive(!!data.active && !!data.text);
    });

    socket.on('lucky-draw-result', function(data) {
      if (!data) return;
      setLuckyWinner(data);
      setTimeout(function() { setLuckyWinner(null); }, 8000);
    });

    socket.on('chapter-mark', function(data) {
      if (!data) return;
      setStreamChapters(function(prev) { return prev.concat([data]).slice(-50); });
      if (addToast) addToast('📍 Chapter: ' + (data.label || 'Moment marked'), 'info');
    });

    // ── Batch 27: Sentiment, Annotations, Guest Intros ────────────────────
    socket.on('sentiment-update', function(data) {
      if (!data) return;
      setSentiment({ up: data.up || 0, down: data.down || 0 });
    });

    socket.on('screen-annotate', function(data) {
      if (!data) return;
      var aid = Date.now() + Math.random();
      setScreenAnnotDots(function(prev) { return [{ x: data.x, y: data.y, color: data.color || '#C9A84C', id: aid }].concat(prev.slice(0, 49)); });
      setTimeout(function() { setScreenAnnotDots(function(prev) { return prev.filter(function(d) { return d.id !== aid; }); }); }, 4000);
    });

    socket.on('guest-intro', function(data) {
      if (!data || !data.username) return;
      setGuestIntroCard(data);
      setTimeout(function() { setGuestIntroCard(null); }, 6000);
    });

    // ── Batch 28: Now Playing, Tip Ticker, Watch Time ─────────────────────
    socket.on('now-playing', function(data) {
      setNowPlaying(data || null);
    });

    socket.on('tip-ticker', function(data) {
      if (!data || !Array.isArray(data.items)) return;
      setTipTickerItems(data.items);
      setTipTickerIdx(0);
    });

    socket.on('watch-time', function(data) {
      if (!data) return;
      setMyWatchSecs(data.elapsed || 0);
    });

    socket.on('sound-alert', function(data) {
      if (!data) return;
      // Play a synthesized beep/tone using Web Audio API
      try {
        var ALERT_TONES = {
          goal:      { freq: [880, 1100, 1320], dur: 0.12, type: 'sine'   },
          hype:      { freq: [440, 660, 880],   dur: 0.08, type: 'square' },
          sub:       { freq: [523, 659, 784],   dur: 0.14, type: 'sine'   },
          win:       { freq: [784, 1047, 1319], dur: 0.1,  type: 'sine'   },
          alarm:     { freq: [880, 440],         dur: 0.15, type: 'sawtooth' },
          fanfare:   { freq: [523, 659, 784, 1047], dur: 0.12, type: 'sine' },
          applause:  { freq: [300],             dur: 0.05, type: 'triangle' },
        };
        var tone = ALERT_TONES[data.type] || ALERT_TONES['hype'];
        var ctx  = new (window.AudioContext || window.webkitAudioContext)();
        var t    = ctx.currentTime;
        tone.freq.forEach(function(freq, i) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type      = tone.type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, t + i * tone.dur);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * tone.dur + tone.dur * 2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + i * tone.dur);
          osc.stop(t + i * tone.dur + tone.dur * 2);
        });
        setTimeout(function() { ctx.close(); }, 3000);
      } catch(e) {}
      if (addToast) addToast('🔔 Sound alert: ' + data.type, 'info');
    });

    socket.on('room-tags', function(data) {
      if (!data || !Array.isArray(data.tags)) return;
      setRoomTags(data.tags);
    });

    socket.on('link-pinned', function(data) {
      if (!data) return;
      setPinnedLink(data.link || null);
      if (data.link && addToast) addToast('🔗 Link pinned: ' + (data.link.label || data.link.url), 'info');
    });

    socket.on('role-changed', function(data) {
      if (!data || !data.role) return;
      if (addToast) addToast(data.role === 'cohost' ? '👑 You are now co-host!' : '✅ Role updated', 'success');
    });

    socket.on('guest-role-changed', function(data) {
      if (!data) return;
      if (addToast && (role === 'host' || role === 'cohost')) {
        addToast((data.role === 'cohost' ? '👑 ' : '👤 ') + (data.guestId) + ' is now ' + data.role, 'info');
      }
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

    socket.on('clip-vote-update', function(data) {
      if (!data || !data.clipId) return;
      setClipVotes(function(prev) {
        var n = Object.assign({}, prev);
        n[data.clipId] = Object.assign({}, n[data.clipId] || {}, { up: data.up, down: data.down });
        return n;
      });
    });

    socket.on('cohost-queue-update', function(data) {
      if (!data || !Array.isArray(data.queue)) return;
      setCohostQueue(data.queue);
    });

    socket.on('cohost-request-ack', function(data) {
      if (data && data.status === 'queued' && addToast) addToast('✋ Co-host request sent — position #' + data.position, 'info');
    });

    socket.on('badge-awarded', function(data) {
      if (!data || !data.badge) return;
      setUserBadges(function(prev) {
        var n = Object.assign({}, prev);
        n[data.userId] = (n[data.userId] || []).concat([data.badge]);
        return n;
      });
      if (data.userId === userId) {
        setMyBadges(function(b) { return b.indexOf(data.badge) >= 0 ? b : b.concat([data.badge]); });
        if (addToast) addToast('🏆 You earned a badge: ' + data.badge, 'success');
      }
    });

    socket.on('chat-star-update', function(data) {
      if (!data || !data.id) return;
      setStarredMsgs(function(prev) {
        var exists = prev.findIndex(function(m) { return m.id === data.id; });
        if (exists >= 0) {
          var n = prev.slice(); n[exists] = data; return n;
        }
        return [data].concat(prev).slice(0, 20);
      });
    });

    socket.on('guest-entrance', function(data) {
      if (!data || !data.username) return;
      setGuestEntrance(data);
      setTimeout(function() { setGuestEntrance(null); }, 3500);
    });

    socket.on('chat-raffle-update', function(data) {
      if (!data) { setChatRaffle(null); return; }
      setChatRaffle(data);
    });

    socket.on('chat-raffle-result', function(data) {
      if (!data) return;
      setRaffleWinner(data);
      setChatRaffle(null);
      setTimeout(function() { setRaffleWinner(null); }, 8000);
    });

    socket.on('react-combo-hit', function(data) {
      if (!data) return;
      setReactCombo({ emoji: data.emoji, count: data.count });
      setTimeout(function() { setReactCombo(null); }, 1800);
    });

    socket.on('viewer-spotlight', function(data) {
      setViewerSpotlight(data || null);
    });

    socket.on('gift-goal-update', function(data) {
      setGiftGoal(data);
    });

    socket.on('gift-goal-complete', function(data) {
      setGoalComplete(true);
      setTimeout(function() { setGoalComplete(false); }, 4000);
    });

    socket.on('energy-update', function(data) {
      if (!data) return;
      setStreamEnergy(data.score || 0);
    });

    socket.on('fan-wall-update', function(data) {
      if (!data || !Array.isArray(data.fans)) return;
      setFanWall(data.fans);
    });

    socket.on('audience-challenge', function(data) {
      if (!data) return;
      setChallengeResponded(false);
      setAudienceChallenge({ text: data.text, durationSecs: data.durationSecs, startTs: data.startTs, responseCount: 0 });
    });

    socket.on('audience-challenge-update', function(data) {
      if (!data) return;
      setAudienceChallenge(function(c) { return c ? Object.assign({}, c, { responseCount: data.responseCount }) : c; });
    });

    socket.on('audience-challenge-ended', function(data) {
      setTimeout(function() { setAudienceChallenge(null); }, 3000);
    });

    socket.on('brb-update', function(data) {
      if (!data) return;
      setBrbMode(data.active ? data : null);
    });

    socket.on('flash-drop', function(data) {
      if (!data) return;
      setFlashDrop(data);
    });

    socket.on('flash-drop-ended', function() {
      setFlashDrop(null);
    });

    socket.on('applause-update', function(data) {
      if (!data) return;
      setApplauseCount(data.count || 0);
    });

    socket.on('applause-burst', function(data) {
      if (!data) return;
      setApplauseBurst(data);
      setTimeout(function() { setApplauseBurst(null); }, 1800);
    });

    socket.on('vip-update', function(data) {
      if (!data || !Array.isArray(data.vips)) return;
      setVips(data.vips);
    });

    socket.on('chat-color-set', function(data) {
      if (!data || !data.userId) return;
      setChatColors(function(c) { var n = Object.assign({}, c); n[data.userId] = data.color; return n; });
    });

    socket.on('chat-color-ack', function(data) {
      if (!data) return;
      setMyChatColor(data.color);
    });

    socket.on('lower-third', function(data) {
      setLowerThird(data || null);
    });

    socket.on('emoji-shower', function(data) {
      if (!data) return;
      setEmojiShower(data);
      setTimeout(function() { setEmojiShower(null); }, 3200);
    });

    socket.on('shoutout-card', function(data) {
      if (!data) return;
      setShoutoutCard(data);
      setTimeout(function() { setShoutoutCard(null); }, 5000);
    });

    socket.on('chat-theme-update', function(data) {
      if (!data) return;
      setChatTheme(data.theme || null);
    });

    socket.on('scoreboard-update', function(data) {
      setScoreboard(data || null);
    });

    socket.on('auction-update', function(data) {
      if (!data || !data.active) { setAuction(null); return; }
      setAuction(data);
    });

    socket.on('auction-ended', function(data) {
      setAuction(null);
      if (data) { setAuctionEnded(data); setTimeout(function() { setAuctionEnded(null); }, 6000); }
    });

    socket.on('timer-widget-update', function(data) {
      setTimerWidget(data || null);
    });

    socket.on('quick-quiz', function(data) {
      if (!data) return;
      setQuickQuizMyAnswer(null);
      setQuickQuizFinal(null);
      setQuickQuiz(data);
    });

    socket.on('quick-quiz-results', function(data) {
      if (!data) return;
      setQuickQuiz(function(q) { return q ? Object.assign({}, q, { opts: data.results }) : q; });
    });

    socket.on('quick-quiz-final', function(data) {
      if (!data) return;
      setQuickQuizFinal(data);
      setTimeout(function() { setQuickQuiz(null); setQuickQuizFinal(null); }, 12000);
    });

    socket.on('song-request-update', function(data) {
      if (!data) return;
      setSongRequests(Array.isArray(data.requests) ? data.requests : []);
    });

    socket.on('hype-train-update', function(data) {
      if (!data) return;
      setHypeTrain(data);
    });

    socket.on('hype-train-level', function(data) {
      if (!data) return;
      setHypeLevel(data.level);
      setTimeout(function() { setHypeLevel(null); }, 3500);
    });

    socket.on('hype-train-ended', function(data) {
      setHypeTrain(null);
    });

    socket.on('marquee-update', function(data) {
      setMarquee(data || null);
    });

    socket.on('shoutout-queue-update', function(data) {
      if (!data) return;
      setShoutoutQueue(Array.isArray(data.queue) ? data.queue : []);
    });

    socket.on('shoutout-queue-ack', function(data) {
      if (!data) return;
      setShoutoutQueueAck(data);
      setTimeout(function() { setShoutoutQueueAck(null); }, 4000);
    });

    // Batch 40 listeners
    socket.on('stream-title-updated', function(data) {
      if (!data || !data.title) return;
      setStreamTitle(data.title);
    });

    socket.on('room-vibe-update', function(data) {
      setRoomVibe(data ? (data.vibe || null) : null);
    });

    socket.on('simple-poll-update', function(data) {
      if (!data) { setSimplePoll(null); return; }
      setSimplePoll(data);
      if (!data.active) {
        setMyPollVote(null);
        setTimeout(function() { setSimplePoll(null); }, 6000);
      }
    });

    socket.on('viewer-checkin-event', function(data) {
      if (!data || !data.username) return;
      setCheckinFlash({ username: data.username });
      setTimeout(function() { setCheckinFlash(null); }, 3000);
    });

    // Batch 44 listeners
    socket.on('schedule-update', function(data) {
      if (!data) return;
      setSchedule(Array.isArray(data.items) ? data.items : []);
    });

    socket.on('react-wall-update', function(data) {
      if (!data || !data.entry) return;
      setReactWall(function(w) { return w.concat([data.entry]).slice(-30); });
    });

    socket.on('host-bio-update', function(data) {
      setHostBio(data || null);
    });

    socket.on('spotlight-pick-update', function(data) {
      setSpotlightPick(data || null);
    });

    // Batch 45 listeners
    socket.on('stage-filter-update', function(data) {
      setStageFilter((data && data.filter) ? data.filter : null);
    });

    socket.on('dramatic-countdown-tick', function(data) {
      if (!data) return;
      setDramaticCountdown({ count: data.count, from: data.from, label: data.label || '', done: !!data.done });
      if (data.done || data.count === 0) {
        setTimeout(function() { setDramaticCountdown(null); }, 1800);
      }
    });

    // Batch 46 listeners
    socket.on('pinned-emoji-update', function(data) {
      setPinnedEmoji(data || null);
    });

    socket.on('viewer-color-tier', function(data) {
      if (!data) return;
      setColorTiers(function(prev) { var n = Object.assign({}, prev); n[data.userId] = data.tier; return n; });
      if (data.ownTier) {
        setMyColorTier(data.tier);
        var tierLabels = { bronze: '🥉 Bronze Gifter', silver: '🥈 Silver Gifter', gold: '🥇 Gold Gifter', platinum: '💎 Platinum Gifter' };
        if (addToast) addToast(tierLabels[data.tier] + ' tier unlocked!', 'success');
      }
    });

    socket.on('audio-level-update', function(data) {
      if (!data || typeof data.level !== 'number') return;
      setAudioLevelPct(data.level);
    });

    socket.on('tip-milestone', function(data) {
      if (!data) return;
      setTipMilestoneFlash(data);
      setTimeout(function() { setTipMilestoneFlash(null); }, 5000);
    });

    // Batch 47 listeners
    socket.on('viewer-queue-update', function(data) {
      if (!data || !Array.isArray(data.queue)) return;
      setViewerQueue(data.queue);
    });

    socket.on('question-answered', function(data) {
      if (!data) return;
      setQuestionAnswered(data);
      setTimeout(function() { setQuestionAnswered(null); }, 5000);
    });

    socket.on('mood-ring-update', function(data) {
      if (!data || typeof data.score !== 'number') return;
      setMoodRingScore(data.score);
    });

    socket.on('trivia-drop', function(data) {
      if (!data) return;
      setTriviaDrop(data);
      setTriviaVote(null);
      setTriviaResults(null);
      setShowTriviaPanel(true);
    });

    socket.on('trivia-vote-update', function(data) {
      if (!data) return;
      setTriviaResults(function(r) { return r ? Object.assign({}, r, { votes: data.votes, total: data.total }) : { votes: data.votes, total: data.total }; });
    });

    socket.on('trivia-results', function(data) {
      if (!data) return;
      setTriviaResults({ votes: data.votes, answer: data.answer, total: null });
      setTriviaDrop(function(t) { return t ? Object.assign({}, t, { revealed: true }) : null; });
    });

    socket.on('trivia-ended', function() {
      setTriviaDrop(null);
      setTimeout(function() { setTriviaResults(null); setShowTriviaPanel(false); }, 3000);
    });

    socket.on('name-tag-update', function(data) {
      if (!data) return;
      setNameTags(function(prev) { var n = Object.assign({}, prev); if (data.tag) n[data.userId] = data.tag; else delete n[data.userId]; return n; });
    });

    // Batch 48 listeners
    socket.on('location-update', function(data) {
      if (!data || !data.entry) return;
      setLocationShoutouts(function(l) {
        var existing = l.findIndex(function(e) { return e.userId === data.entry.userId; });
        var next = l.slice();
        if (existing >= 0) next[existing] = data.entry; else next = next.concat([data.entry]);
        return next.slice(-20);
      });
    });

    socket.on('highlight-vote-start', function(data) {
      if (!data) return;
      setHighlightVote({ label: data.label, yes: 0, no: 0, endsAt: data.endsAt });
      setMyHighlightVote(null);
    });

    socket.on('highlight-vote-update', function(data) {
      if (!data) return;
      setHighlightVote(function(h) { return h ? Object.assign({}, h, { yes: data.yes, no: data.no }) : null; });
    });

    socket.on('highlight-vote-result', function(data) {
      if (!data) return;
      setHighlightVote(null);
      if (addToast) addToast((data.clip ? '✂️ Clip it! ' : '👎 Not that one — ') + data.yes + ' vs ' + data.no, data.clip ? 'success' : 'info');
    });

    socket.on('donation-match-update', function(data) {
      setDonationMatch(data || null);
    });

    socket.on('donation-match-complete', function(data) {
      if (!data) return;
      setMatchCompleteFlash(data);
      setTimeout(function() { setMatchCompleteFlash(null); }, 6000);
    });

    // Batch 43 listeners
    socket.on('prize-wheel-update', function(data) {
      setPrizeWheel(data || null);
      if (!data) { setWheelSpinning(false); setWheelWinner(null); }
    });

    socket.on('prize-wheel-spin', function(data) {
      if (!data) return;
      setWheelSpinning(true);
      setTimeout(function() {
        setWheelSpinning(false);
        setWheelWinner({ label: data.winner, idx: data.winIdx });
      }, 3000);
    });

    socket.on('stream-sign-in', function(data) {
      if (!data) return;
      setSignInLog(function(l) { return l.concat([data]).slice(-50); });
      setSignInFlash({ username: data.username, count: data.count });
      setTimeout(function() { setSignInFlash(null); }, 3000);
    });

    socket.on('outro-countdown-update', function(data) {
      setOutroCountdown(data || null);
    });

    socket.on('gift-combo', function(data) {
      if (!data) return;
      setGiftComboFlash(data);
      setTimeout(function() { setGiftComboFlash(null); }, 3500);
    });

    // Batch 42 listeners
    socket.on('word-cloud-update', function(data) {
      if (!data || !Array.isArray(data.words)) return;
      setWordCloud(data.words);
    });

    socket.on('viewer-status-update', function(data) {
      if (!data) return;
      setViewerStatuses(function(s) { var n = Object.assign({}, s); if (data.status) n[data.userId] = data.status; else delete n[data.userId]; return n; });
    });

    socket.on('moment-logged', function(data) {
      if (!data) return;
      setMomentLog(function(l) { return l.concat([data]).slice(-30); });
    });

    socket.on('moment-flash', function(data) {
      if (!data || !data.label) return;
      setMomentFlash(data);
      setTimeout(function() { setMomentFlash(null); }, 4000);
    });

    socket.on('moment-log-update', function(data) {
      if (!data) return;
      setMomentLog(Array.isArray(data.log) ? data.log : []);
    });

    socket.on('room-capacity-update', function(data) {
      setRoomCapacity(data || null);
    });

    // Batch 41 listeners
    socket.on('fanclub-update', function(data) {
      if (!data || !Array.isArray(data.members)) return;
      setFanClub(data.members);
      setInFanClub(data.members.indexOf(userId) !== -1);
    });

    socket.on('host-note-update', function(data) {
      setHostNote(data || null);
    });

    socket.on('collab-banner-update', function(data) {
      setCollabBanner(data || null);
    });

    socket.on('mood-update', function(data) {
      if (!data) return;
      setStreamMood(data);
    });

    socket.on('react-burst', function(data) {
      if (!data || !data.emoji) return;
      var fid = Date.now() + Math.random();
      setFloatReacts(function(r) { return r.concat([{ emoji: data.emoji, fid: fid }]); });
      setTimeout(function() { setFloatReacts(function(r) { return r.filter(function(x) { return x.fid !== fid; }); }); }, 2200);
    });

    socket.on('hand-raise', function(data) {
      if (!data) return;
      if (role === 'host' && addToast) addToast('✋ ' + (data.username || data.guestId) + ' wants on stage', 'info');
      setRaisedHands(function(h) { var n = Object.assign({}, h); n[data.guestId] = true; return n; });
    });

    socket.on('hand-lower', function(data) {
      if (!data) return;
      setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[data.guestId]; return n; });
    });

    socket.on('mute-all', function() {
      setIsMuted(true);
      if (addToast) addToast('🔇 Host muted all participants', 'info');
    });

    socket.on('stage-invite', function(data) {
      if (!data || !data.guestId) return;
      setRaisedHands(function(h) { var n = Object.assign({}, h); delete n[data.guestId]; return n; });
      setStageGuests(function(s) {
        if (s.indexOf(data.guestId) >= 0) return s;
        if (s.length >= MAX_STAGE) return s;
        return s.concat([data.guestId]);
      });
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
      setPinnedQa(function(p) { return (p && p.id === data.id) ? null : p; });
    });

    socket.on('music-shared', function(data) {
      if (!data || !data.title) return;
      setMusicBanner({ title: data.title, style: data.style || '', emoji: data.emoji || '🎵', sharedBy: data.sharedBy || '' });
      setTimeout(function() { setMusicBanner(null); }, 6000);
    });

    socket.on('vs-update', function(data) {
      if (!data) { setVsPoll(null); setVsVoted(null); return; }
      setVsPoll(data);
      if (!data.active) {
        setTimeout(function() { setVsPoll(null); setVsVoted(null); }, 8000);
      }
    });

    socket.on('judges-update', function(data) {
      if (!data) return;
      setJudges(data);
    });

    socket.on('judge-scored', function(data) {
      if (!data) return;
      setScoreReveal({ username: data.username || 'Judge', score: data.score, label: data.label || '' });
      setTimeout(function() { setScoreReveal(null); }, 3200);
    });

    socket.on('screen-share-active', function(data) {
      if (!data) return;
      if (data.userId !== userId) setScreenShareHost({ username: data.username || 'Host' });
    });

    socket.on('screen-share-ended', function() {
      setScreenShareHost(null);
    });

    socket.on('room-audio-only', function(data) {
      if (!data) return;
      setAudioOnly(Boolean(data.enabled));
      if (addToast) addToast(data.enabled ? '🎤 Host switched to audio-only mode' : '📹 Video mode re-enabled', 'info');
    });

    socket.on('panel:audio_only_changed', function(data) {
      if (!data || data.roomId !== roomId) return;
      setAudioOnly(Boolean(data.isAudioOnly));
    });

    socket.on('subscriber-only-changed', function(data) {
      if (!data) return;
      setIsSubOnly(Boolean(data.enabled));
      if (addToast) addToast(data.enabled ? '⭐ Chat is now subscriber-only' : '💬 Chat is open to all viewers', 'info');
    });

    socket.on('chat-banned', function(data) {
      if (!data || !data.userId) return;
      setChatBannedIds(function(prev) { var n = Object.assign({}, prev); n[data.userId] = true; return n; });
      if ((role === 'host' || role === 'cohost') && addToast) addToast('🚫 ' + (data.username || data.userId) + ' banned from chat', 'info');
    });

    socket.on('chat-unbanned', function(data) {
      if (!data || !data.userId) return;
      setChatBannedIds(function(prev) { var n = Object.assign({}, prev); delete n[data.userId]; return n; });
    });

    socket.on('highlight-reel', function(data) {
      if (!data || !Array.isArray(data.highlights)) return;
      setHighlights(data.highlights);
      setShowHighlights(true);
    });

    socket.on('user-banned', function(data) {
      if (!data) return;
      if (data.userId === userId) {
        if (addToast) addToast('🚫 You have been removed from this room', 'error');
      }
    });

    socket.on('user-unbanned', function(data) {
      if (!data) return;
      if (data.username && username && data.username === username) {
        if (addToast) addToast('✅ Your ban has been lifted — welcome back!', 'success');
      }
    });

    return function() {
      socket.off('join-room-ack');
      socket.off('speaking');
      socket.off('hand-raise');
      socket.off('hand-lower');
      socket.off('stage-invite');
      socket.off('poll-update');
      socket.off('qa-question');
      socket.off('qa-upvote');
      socket.off('qa-dismissed');
      socket.off('music-shared');
      socket.off('vs-update');
      socket.off('judges-update');
      socket.off('judge-scored');
      socket.off('super-chat');
      socket.off('react-burst');
      socket.off('gift-received');
      socket.off('merch-order-received');
      socket.off('gift-goal-update');
      socket.off('gift-goal-complete');
      socket.off('mood-update');
      socket.off('clip-vote-update');
      socket.off('cohost-queue-update');
      socket.off('cohost-request-ack');
      socket.off('badge-awarded');
      socket.off('react-combo-hit');
      socket.off('viewer-spotlight');
      socket.off('chat-star-update');
      socket.off('guest-entrance');
      socket.off('chat-raffle-update');
      socket.off('chat-raffle-result');
      socket.off('energy-update');
      socket.off('fan-wall-update');
      socket.off('audience-challenge');
      socket.off('audience-challenge-update');
      socket.off('audience-challenge-ended');
      socket.off('brb-update');
      socket.off('flash-drop');
      socket.off('flash-drop-ended');
      socket.off('applause-update');
      socket.off('applause-burst');
      socket.off('vip-update');
      socket.off('chat-color-set');
      socket.off('chat-color-ack');
      socket.off('lower-third');
      socket.off('emoji-shower');
      socket.off('shoutout-card');
      socket.off('chat-theme-update');
      socket.off('song-request-update');
      socket.off('hype-train-update');
      socket.off('hype-train-level');
      socket.off('hype-train-ended');
      socket.off('marquee-update');
      socket.off('shoutout-queue-update');
      socket.off('shoutout-queue-ack');
      socket.off('stream-title-updated');
      socket.off('room-vibe-update');
      socket.off('simple-poll-update');
      socket.off('viewer-checkin-event');
      socket.off('fanclub-update');
      socket.off('host-note-update');
      socket.off('collab-banner-update');
      socket.off('word-cloud-update');
      socket.off('viewer-status-update');
      socket.off('moment-logged');
      socket.off('moment-flash');
      socket.off('moment-log-update');
      socket.off('room-capacity-update');
      socket.off('prize-wheel-update');
      socket.off('prize-wheel-spin');
      socket.off('stream-sign-in');
      socket.off('outro-countdown-update');
      socket.off('gift-combo');
      socket.off('schedule-update');
      socket.off('react-wall-update');
      socket.off('host-bio-update');
      socket.off('spotlight-pick-update');
      socket.off('stage-filter-update');
      socket.off('dramatic-countdown-tick');
      socket.off('pinned-emoji-update');
      socket.off('viewer-color-tier');
      socket.off('audio-level-update');
      socket.off('tip-milestone');
      socket.off('viewer-queue-update');
      socket.off('question-answered');
      socket.off('mood-ring-update');
      socket.off('trivia-drop');
      socket.off('trivia-vote-update');
      socket.off('trivia-results');
      socket.off('trivia-ended');
      socket.off('name-tag-update');
      socket.off('location-update');
      socket.off('highlight-vote-start');
      socket.off('highlight-vote-update');
      socket.off('highlight-vote-result');
      socket.off('donation-match-update');
      socket.off('donation-match-complete');
      socket.off('scoreboard-update');
      socket.off('auction-update');
      socket.off('auction-ended');
      socket.off('timer-widget-update');
      socket.off('quick-quiz');
      socket.off('quick-quiz-results');
      socket.off('quick-quiz-final');
      socket.off('screen-share-active');
      socket.off('screen-share-ended');
      socket.off('mute-all');
      socket.off('room-audio-only');
      socket.off('subscriber-only-changed');
      socket.off('user-banned');
      socket.off('user-unbanned');
      socket.off('chat-pinned');
      socket.off('chat-deleted');
      socket.off('product-spotlight');
      socket.off('follow-alert');
      socket.off('go-live-confirmed');
      socket.off('crowd-wild');
      socket.off('hot-moment-burst');
      socket.off('top-fans');
      socket.off('stream-info');
      socket.off('banned-words-updated');
      socket.off('chat-banned');
      socket.off('chat-unbanned');
      socket.off('highlight-reel');
      socket.off('slow-mode-changed');
      socket.off('hand-queue');
      socket.off('gift-leaderboard');
      socket.off('viewer-shoutout');
      socket.off('emoji-tally');
      socket.off('celebrate');
      socket.off('chat-mention');
      socket.off('spotlight-request');
      socket.off('pin-announcement');
      socket.off('gift-notification');
      socket.off('gift-chain');
      socket.off('chat-keyword');
      socket.off('host-alert');
      socket.off('private-dm');
      socket.off('room-tags');
      socket.off('link-pinned');
      socket.off('role-changed');
      socket.off('guest-role-changed');
      socket.off('shop-item-pin');
      socket.off('shop-cart-confirm');
      socket.off('shop-purchase-burst');
      socket.off('challenge-update');
      socket.off('challenge-complete');
      socket.off('creator-goal');
      socket.off('creator-goal-reached');
      socket.off('live-stats');
      socket.off('points-earned');
      socket.off('shoutout');
      socket.off('stream-countdown');
      socket.off('stream-rating-ack');
      socket.off('stream-rating-update');
      socket.off('audience-vote');
      socket.off('audience-vote-update');
      socket.off('audience-vote-end');
      socket.off('clip-pinned');
      socket.off('layout-sync');
      socket.off('pk-start');
      socket.off('pk-end');
      socket.off('watch-together');
      socket.off('watch-together-sync');
      socket.off('watch-together-end');
      socket.off('stream-milestone');
      socket.off('sound-alert');
      socket.off('qa-answered');
      socket.off('room-theme');
      socket.off('shop-carousel');
      socket.off('top-fans');
      socket.off('redeem-ack');
      socket.off('next-stream');
    };
  }, [socket]);

  // ── Scroll chat to bottom ──
  useEffect(function() {
    if (chatEndRef.current && chatOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, chatOpen]);

  // ── Update medConf when mediaConfig prop changes ──
  useEffect(function() { setMedConf(mediaConfig || null); }, [mediaConfig]);

  // ── Batch 23: Host keyboard shortcuts ─────────────────────────────────────
  useEffect(function() {
    if (!hotkeysEnabled || (role !== 'host' && role !== 'cohost')) return;
    function onKey(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      switch (e.key) {
        case 'm': case 'M': e.preventDefault(); toggleMute(); break;
        case 'v': case 'V': e.preventDefault(); toggleCam(); break;
        case 'c': case 'C': e.preventDefault(); setChatOpen(function(s) { return !s; }); break;
        case 'h': case 'H': e.preventDefault(); if (socket) socket.emit('celebrate', { roomId: roomId }); break;
        case 'r': e.preventDefault(); setShowRateStream(function(s) { return !s; }); break;
        case 'Escape': e.preventDefault(); setSpotlightGuestId(null); setCellMenuId(null); setShowFilterPanel(false); break;
        default: break;
      }
    }
    window.addEventListener('keydown', onKey);
    return function() { window.removeEventListener('keydown', onKey); };
  }, [hotkeysEnabled, role, socket, roomId, toggleMute, toggleCam]);

  // ── Batch 46: Host audio level meter ──────────────────────────────────────
  useEffect(function() {
    if (!showAudioMeter || (role !== 'host' && role !== 'cohost') || !socket) return;
    var audioCtx = null;
    var source = null;
    var analyser = null;
    var intervalId = null;
    var stream = null;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(s) {
      stream = s;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      source = audioCtx.createMediaStreamSource(s);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      var buf = new Uint8Array(analyser.frequencyBinCount);
      intervalId = setInterval(function() {
        analyser.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i];
        var avg = Math.floor((sum / buf.length / 255) * 100);
        setAudioLevelPct(avg);
        socket.emit('audio-level', { roomId: roomId, level: avg });
      }, 2000);
    }).catch(function() {});
    return function() {
      clearInterval(intervalId);
      if (source) { try { source.disconnect(); } catch(e) {} }
      if (audioCtx) { try { audioCtx.close(); } catch(e) {} }
      if (stream) { stream.getTracks().forEach(function(t) { t.stop(); }); }
    };
  }, [showAudioMeter, role, socket, roomId]);

  // ── Batch 23: Live captions via Web Speech API ────────────────────────────
  useEffect(function() {
    if (!captionsEnabled) {
      if (captionsRef.rec) { try { captionsRef.rec.stop(); } catch(e) {} captionsRef.rec = null; }
      setCaptionText('');
      return;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (addToast) addToast('Live captions not supported in this browser', 'error'); setCaptionsEnabled(false); return; }
    var rec = new SR();
    rec.continuous   = true;
    rec.interimResults = true;
    rec.lang         = 'en-US';
    rec.onresult = function(e) {
      var transcript = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setCaptionText(transcript.slice(-200));
    };
    rec.onerror = function() { setCaptionsEnabled(false); };
    rec.start();
    captionsRef.rec = rec;
    return function() { try { rec.stop(); } catch(e) {} captionsRef.rec = null; };
  }, [captionsEnabled]);

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

  function toggleMute() { setIsMuted(function(v) { return !v; }); }
  function toggleCam()  { setIsCamOff(function(v) { return !v; }); }

  function switchCamera(deviceId) {
    if (!deviceId) return;
    setActiveCamId(deviceId);
    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
      .then(function(stream) {
        var track = stream.getVideoTracks()[0];
        if (!track) return;
        cameraTrackRef.current = track;
        if (rtcManager && rtcManager.replaceVideoTrack) rtcManager.replaceVideoTrack(track);
      })
      .catch(function() { if (addToast) addToast('Camera switch failed', 'error'); });
  }

  function sendChat() {
    var msg = chatInput.trim();
    if (!msg || !socket) return;
    var msgId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    socket.emit('chat-message', { roomId: roomId, userId: userId, username: username, message: msg, id: msgId, isSuperFan: isSuperFan, color: chatColor || undefined });
    setMyEngagement(function(e) { return { chat: e.chat + 1, react: e.react, gift: e.gift }; });
    var mentions = msg.match(/@(\S+)/g);
    if (mentions) {
      mentions.forEach(function(m) {
        var mentionedUsername = m.slice(1);
        socket.emit('chat-mention', { roomId: roomId, mentionedUsername: mentionedUsername, msgId: msgId });
      });
    }
    setChatInput('');
    if (activeChallenge && activeChallenge.active && activeChallenge.unit === 'chat messages') {
      socket.emit('challenge-progress', { roomId: roomId, amount: 1 });
    }
  }

  function raiseHand() {
    var next = !handRaised;
    setHandRaised(next);
    if (socket && next)  socket.emit('hand-raise', { roomId: roomId, guestId: userId, username: username });
    if (socket && !next) socket.emit('hand-lower', { roomId: roomId, guestId: userId });
    if (addToast) addToast(next ? '✋ Hand raised — waiting for host' : 'Hand lowered', 'info');
  }

  function requestJoinStage() {
    if (!socket || joinRequested) return;
    panelService.requestJoin(socket, roomId)
      .then(function() {
        setJoinRequested(true);
        setHandRaised(true);
        if (addToast) addToast('🎤 Stage request sent — waiting for host approval', 'info');
      })
      .catch(function(e) {
        if (addToast) addToast('Request failed: ' + e.message, 'error');
      });
  }

  // Listen for host approval/denial of join request
  useEffect(function() {
    if (!socket) return;
    function onResolved(data) {
      if (!data) return;
      setJoinRequested(false);
      if (data.approved) {
        setHandRaised(false);
        if (addToast) addToast('✅ Host approved! You\'re on stage.', 'success');
        // stage-invite is broadcast separately to the room — LiveRoomPage handles it already
      } else {
        setHandRaised(false);
        if (addToast) addToast('Stage request declined', 'info');
      }
    }
    socket.on('panel:join_request_resolved', onResolved);
    return function() { socket.off('panel:join_request_resolved', onResolved); };
  }, [socket]);

  function scheduleAnnounce() {
    var delayMs = Math.max(5000, Math.floor(parseFloat(announceDelay) * 60000));
    if (!announceMsg.trim() || !socket) { if (addToast) addToast('Enter a message', 'error'); return; }
    socket.emit('schedule-announce', { roomId: roomId, message: announceMsg.trim(), delayMs: delayMs }, function(res) {
      if (res && res.ok) {
        setPending(function(p) { return p.concat([{ announceId: res.announceId, message: announceMsg.trim(), firesAt: res.firesAt }]); });
        setAnnounceMsg('');
        setShowAnnounce(false);
        if (addToast) addToast('📢 Announcement scheduled in ' + announceDelay + ' min', 'success');
      }
    });
  }

  function cancelAnnounce(announceId) {
    if (!socket) return;
    socket.emit('cancel-announce', { announceId: announceId }, function(res) {
      if (res && res.ok) setPending(function(p) { return p.filter(function(x) { return x.announceId !== announceId; }); });
    });
    // Also remove from local state optimistically
    setPending(function(p) { return p.filter(function(x) { return x.announceId !== announceId; }); });
  }

  // Viewer milestone celebrations
  useEffect(function() {
    if (!viewerCount) return;
    var MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    MILESTONES.forEach(function(m) {
      if (viewerCount >= m && !milestoneRef.current.has(m)) {
        milestoneRef.current.add(m);
        var emojis = m >= 1000 ? '🔥🔥🔥' : m >= 500 ? '🎉🔥' : '🎉';
        if (addToast) addToast(emojis + ' ' + m.toLocaleString() + ' viewers watching live!', 'success');
        setMilestoneOverlay({ count: m });
        setTimeout(function() { setMilestoneOverlay(null); }, 3500);
      }
    });
  }, [viewerCount]);

  // Stream elapsed clock — ticks every second while live
  useEffect(function() {
    if (!isLive || !liveStartedAt) return;
    var id = setInterval(function() {
      setLiveElapsed(Math.floor(Date.now() / 1000) - liveStartedAt);
    }, 1000);
    setLiveElapsed(Math.floor(Date.now() / 1000) - liveStartedAt);
    return function() { clearInterval(id); };
  }, [isLive, liveStartedAt]);

  // Personal watch timer — awards loyalty badge at 5 and 15 min
  useEffect(function() {
    var id = setInterval(function() {
      setWatchSeconds(function(s) {
        var next = s + 1;
        if (next === 300  && addToast) addToast('🔥 5 minutes — Loyal Viewer badge earned!', 'success');
        if (next === 900  && addToast) addToast('⭐ 15 minutes — Super Viewer!', 'success');
        if (next === 1800 && addToast) addToast('💎 30 minutes — Diamond Viewer!', 'success');
        if (next === 3600 && addToast) addToast('👑 1 hour watched — Legendary Viewer!', 'success');
        return next;
      });
    }, 1000);
    return function() { clearInterval(id); };
  }, []);

  // Award superfan status when engagement threshold is reached
  useEffect(function() {
    if (!isSuperFan && (myEngagement.chat >= 50 || myEngagement.react >= 30)) {
      setIsSuperFan(true);
      if (addToast) addToast('🏆 You earned Superfan status! Your messages now show a special badge.', 'success');
    }
  }, [myEngagement.chat, myEngagement.react]);

  // Timer widget tick
  useEffect(function() {
    if (!timerWidget) { setTimerDisplay(''); return; }
    function tickTimer() {
      var now = Date.now();
      var elapsed = Math.floor((now - timerWidget.startTs) / 1000);
      var secs;
      if (timerWidget.type === 'countup') {
        secs = elapsed;
      } else {
        secs = Math.max(0, timerWidget.durationSecs - elapsed);
      }
      var h = Math.floor(secs / 3600);
      var m = Math.floor((secs % 3600) / 60);
      var s = secs % 60;
      setTimerDisplay((h > 0 ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'));
    }
    tickTimer();
    var tid = setInterval(tickTimer, 1000);
    return function() { clearInterval(tid); };
  }, [timerWidget]);

  // Batch 43: outro countdown tick
  useEffect(function() {
    if (!outroCountdown) { setOutroSecs(0); return; }
    function tickOutro() { setOutroSecs(Math.max(0, Math.floor((outroCountdown.endsAt - Date.now()) / 1000))); }
    tickOutro();
    var oid = setInterval(tickOutro, 1000);
    return function() { clearInterval(oid); };
  }, [outroCountdown]);

  // Track peak viewer count
  useEffect(function() {
    var cur = viewerCount || 0;
    if (cur > peakViewersRef.current) peakViewersRef.current = cur;
  }, [viewerCount]);

  // End screen when stream goes from live → offline
  var wasLiveRef = useRef(false);
  useEffect(function() {
    if (wasLiveRef.current && !isLive && role === 'host') {
      setEndScreen({ duration: liveElapsed, peak: peakViewersRef.current });
    }
    wasLiveRef.current = isLive;
  }, [isLive]);

  // Live captions — update when a transcript message arrives
  useEffect(function() {
    if (!chat || chat.length === 0) return;
    var last = chat[chat.length - 1];
    if (last && last.isTranscript && last.message) {
      setLatestCaption(last.message);
    }
  }, [chat]);

  // Shoutout dequeue — show one at a time, auto-advance every 4 seconds
  useEffect(function() {
    if (shoutoutQueue.length === 0) { setActiveShoutout(null); return; }
    if (activeShoutout) return;
    var next = shoutoutQueue[0];
    setActiveShoutout(next);
    setShoutoutQueue(function(q) { return q.slice(1); });
    var t = setTimeout(function() { setActiveShoutout(null); }, 4000);
    return function() { clearTimeout(t); };
  }, [shoutoutQueue, activeShoutout]);

  // Countdown ticker
  useEffect(function() {
    if (!streamCountdown) { setCountdownSecs(0); return; }
    var interval = setInterval(function() {
      var remaining = Math.max(0, streamCountdown.endsAt - Math.floor(Date.now() / 1000));
      setCountdownSecs(remaining);
      if (remaining === 0) {
        setStreamCountdown(null);
        clearInterval(interval);
      }
    }, 1000);
    setCountdownSecs(Math.max(0, streamCountdown.endsAt - Math.floor(Date.now() / 1000)));
    return function() { clearInterval(interval); };
  }, [streamCountdown]);

  function fmtElapsed(s) {
    if (!s || s < 0) return '0:00';
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function sendHotMoment() {
    if (hotPressed || !socket) return;
    setHotPressed(true);
    socket.emit('hot-moment', { roomId: roomId });
    setTimeout(function() { setHotPressed(false); }, 3000);
    if (addToast) addToast('⚡ You marked this as a hot moment!', 'info');
  }

  function sendReact(emoji) {
    var fid = Date.now() + Math.random();
    setFloatReacts(function(r) { return r.concat([{ emoji: emoji, fid: fid }]); });
    setTimeout(function() { setFloatReacts(function(r) { return r.filter(function(x) { return x.fid !== fid; }); }); }, 2200);
    if (socket) {
      socket.emit('viewer-react', { roomId: roomId, userId: userId, emoji: emoji });
      socket.emit('react-combo', { roomId: roomId, emoji: emoji });
    }
    setMyEngagement(function(e) { return { chat: e.chat, react: e.react + 1, gift: e.gift }; });
    setReactsOpen(false);
    // Contribute to active challenge if unit is 'reactions'
    if (socket && activeChallenge && activeChallenge.active && activeChallenge.unit === 'reactions') {
      socket.emit('challenge-progress', { roomId: roomId, amount: 1 });
    }
  }

  function stopScreenShare() {
    setIsScreenSharing(false);
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(function(t) { t.stop(); });
      screenStreamRef.current = null;
    }
    if (cameraTrackRef.current) {
      rtcManager.replaceTrack('video', cameraTrackRef.current);
    }
    if (socket) socket.emit('screen-share-stop', { roomId: roomId });
    if (addToast) addToast('Screen share ended — camera restored', 'info');
  }

  async function startScreenShare() {
    if (!rtcManager || !rtcManager.producers || !rtcManager.producers['video']) {
      if (addToast) addToast('Go live first to share your screen', 'error');
      return;
    }
    try {
      var displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
      var videoTrack = displayStream.getVideoTracks()[0];
      if (!videoTrack) { displayStream.getTracks().forEach(function(t) { t.stop(); }); return; }
      videoTrack.addEventListener('ended', stopScreenShare);
      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);
      rtcManager.replaceTrack('video', videoTrack);
      if (socket) socket.emit('screen-share-start', { roomId: roomId, userId: userId, username: username });
      if (addToast) addToast('Screen share active — viewers now see your screen', 'success');
    } catch(e) {
      if (e.name !== 'NotAllowedError') {
        if (addToast) addToast('Screen share failed: ' + e.message, 'error');
      }
    }
  }

  function submitPoll() {
    if (!socket || !pollDraft.q.trim()) return;
    var opts = pollDraft.opts.filter(function(o) { return o.trim(); });
    if (opts.length < 2) { if (addToast) addToast('Need at least 2 options', 'error'); return; }
    socket.emit('poll-start', { roomId: roomId, question: pollDraft.q.trim(), options: opts });
    setShowPollCreate(false);
    setPollDraft({ q: '', opts: ['', '', '', ''] });
    if (addToast) addToast('Poll launched!', 'success');
  }

  function votePoll(idx) {
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

  function submitQa() {
    var text = qaInput.trim();
    if (!text || !socket) return;
    var qid = Date.now() + '-' + userId;
    socket.emit('qa-question', { roomId: roomId, id: qid, username: username, text: text });
    setQaInput('');
    if (addToast) addToast('Question sent!', 'success');
  }

  function startVs() {
    if (!socket || !vsDraft.sideA.trim() || !vsDraft.sideB.trim()) return;
    var dur = Math.min(300, Math.max(10, parseInt(vsDraft.duration) || 60));
    socket.emit('vs-start', { roomId: roomId, sideA: vsDraft.sideA.trim(), sideB: vsDraft.sideB.trim(), durationSec: dur });
    setShowVsCreate(false);
    setVsDraft({ sideA: '', sideB: '', duration: '60' });
    if (addToast) addToast('VS Poll launched!', 'success');
  }

  function submitJudgeScore() {
    var s = parseInt(judgeScoreVal);
    if (!socket || isNaN(s) || s < 0 || s > 10) { if (addToast) addToast('Score must be 0–10', 'error'); return; }
    socket.emit('judge-score', { roomId: roomId, score: s, label: judgeScoreLabel.trim() });
    setJudgeScoreVal('');
    setJudgeScoreLabel('');
    if (addToast) addToast('Score submitted!', 'success');
  }

  function shareRoom() {
    var url = window.location.origin + (roomId !== '6990f5f24823b53e21fcdc9d' ? ('?room=' + roomId) : '');
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

  function openPayLink(platform, handle) {
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

  function openSocialShare(platform, roomUrl, msg) {
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

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function(stream) {
      recChunksRef.current = [];
      var opts = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? { mimeType: 'video/webm;codecs=vp9' } : {};
      var mr = new MediaRecorder(stream, opts);
      mr.ondataavailable = function(e) { if (e.data && e.data.size > 0) recChunksRef.current.push(e.data); };
      mr.onstop = function() {
        var blob = new Blob(recChunksRef.current, { type: 'video/webm' });
        var url  = URL.createObjectURL(blob);
        setRecUrl(url);
        setRecState('done');
        stream.getTracks().forEach(function(t) { t.stop(); });
        clearInterval(recTimerRef.current);
        // Persist to IndexedDB so VOD Library can access it
        var clipId = 'clip-' + Date.now();
        var dur    = recSeconds;
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
      setRecSeconds(0);
      recTimerRef.current = setInterval(function() {
        setRecSeconds(function(s) {
          var next = s + 1;
          if (next >= 600) { mr.stop(); }
          return next;
        });
      }, 1000);
    }).catch(function() {
      if (addToast) addToast('Camera access required to record', 'error');
    });
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    clearInterval(recTimerRef.current);
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function goLive() {
    if (!socket) return;
    socket.emit('go-live', { roomId: roomId, destinations: { seewhy: true } });
    setShowLiveModal(false);
    if (addToast) addToast('🔴 Going LIVE...', 'success');
  }

  function endStream() {
    if (!socket) return;
    if (isScreenSharing) stopScreenShare();
    socket.emit('end-broadcast', { roomId: roomId });
    if (setIsLive) setIsLive(false);
    if (addToast) addToast('Stream ended', 'info');
  }

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

  // Grid sizing
  var n    = onStage.length;
  var cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, overflow: 'hidden', position: 'relative', fontFamily: "'Barlow Condensed',sans-serif" }}
      onClick={function() {
        var now = Date.now();
        if (now - lastTapRef.current < 320) {
          sendReact('❤️');
        }
        lastTapRef.current = now;
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      <HostHUD
        sessionEarningsCents={sessionEarningsCents}
        viewerCount={viewerCount}
        superChatCount={superChatCount}
        giftCount={giftCount}
        addToast={addToast}
        isVisible={role === 'host' || role === 'cohost'}
        streamStats={streamStats}
      />

      {(role === 'host' || role === 'cohost') && (
        <JoinRequestQueue socket={socket} roomId={roomId} />
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
            {isSubOnly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.35)', borderRadius: 999, padding: '3px 8px' }}>
                <span style={{ fontSize: 9 }}>⭐</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#22C55E', letterSpacing: 1 }}>SUB ONLY</span>
              </div>
            )}
            {isLive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={endStream} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, animation: 'livePulse 1.2s infinite' }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: RED, letterSpacing: 1 }}>LIVE</span>
                </button>
                {liveElapsed > 0 && (
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>
                    {fmtElapsed(liveElapsed)}
                  </span>
                )}
                {connQuality && (role === 'host' || role === 'cohost') && (
                  <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <div style={{ width: 3, height: connQuality !== 'poor' ? 6 : 2, background: connQuality === 'good' ? '#00CC66' : connQuality === 'fair' ? TEAL : RED, borderRadius: 1 }} />
                    <div style={{ width: 3, height: connQuality !== 'poor' ? 9 : 2, background: connQuality === 'good' ? '#00CC66' : connQuality === 'fair' ? TEAL : BORDER, borderRadius: 1 }} />
                    <div style={{ width: 3, height: connQuality === 'good' ? 12 : 2, background: connQuality === 'good' ? '#00CC66' : BORDER, borderRadius: 1 }} />
                  </div>
                )}
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

        {/* Room tags */}
        {roomTags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            {roomTags.map(function(t) {
              return (
                <span key={t} style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.22)', borderRadius: 999, padding: '2px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: .5 }}>
                  #{t}
                </span>
              );
            })}
          </div>
        )}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>{hostName}</span>
              {streamTitle && (
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: MUTED, letterSpacing: .3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{streamTitle}</span>
              )}
            </div>
            <RolePill role={hostEntry ? hostEntry.role : role} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
                👥 {viewerCount || allParticipants.length}
              </span>
              {(viewerCount || 0) > 0 && (
                <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.min(100, ((viewerCount || 0) / 5000) * 100) + '%', background: (viewerCount || 0) > 4500 ? RED : TEAL, borderRadius: 3, transition: 'width .6s ease' }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: streamEnergy > 80 ? '#FF1A3C' : streamEnergy > 50 ? GOLD : MUTED }}>⚡</span>
                <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: streamEnergy + '%', background: streamEnergy > 80 ? '#FF1A3C' : streamEnergy > 50 ? GOLD : TEAL, borderRadius: 3, transition: 'width .8s ease' }} />
                </div>
              </div>
              {roomCapacity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: (viewerCount || 0) / roomCapacity.max > 0.8 ? RED : MUTED }}>🏟</span>
                  <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, ((viewerCount || 0) / roomCapacity.max) * 100) + '%', background: (viewerCount || 0) / roomCapacity.max > 0.8 ? RED : GOLD, borderRadius: 3, transition: 'width .6s ease' }} />
                  </div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: MUTED }}>{Math.round(((viewerCount || 0) / roomCapacity.max) * 100)}%</span>
                </div>
              )}
            </div>
            {watchSeconds >= 3600 && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>👑 LEGEND</span>
            )}
            {watchSeconds >= 1800 && watchSeconds < 3600 && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#88CCFF', background: 'rgba(136,204,255,.1)', border: '1px solid rgba(136,204,255,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>💎 DIAMOND</span>
            )}
            {watchSeconds >= 900 && watchSeconds < 1800 && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>⭐ SUPER</span>
            )}
            {watchSeconds >= 300 && watchSeconds < 900 && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, background: 'rgba(212,133,74,.12)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>🔥 LOYAL</span>
            )}
            {roomVibe && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#A78BFA', background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>
                {{ hype: '🔥 HYPE', chill: '🌊 CHILL', gaming: '🎮 GAMING', music: '🎵 MUSIC', party: '🎉 PARTY', educational: '📚 EDU', news: '📰 NEWS' }[roomVibe] || roomVibe.toUpperCase()}
              </span>
            )}
            {watchStreak >= 2 && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#FF8C00', background: 'rgba(255,140,0,.12)', border: '1px solid rgba(255,140,0,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>🔁 {watchStreak}D STREAK</span>
            )}
            {inFanClub && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#F472B6', background: 'rgba(244,114,182,.12)', border: '1px solid rgba(244,114,182,.3)', borderRadius: 4, padding: '1px 5px', letterSpacing: .5 }}>❤️ FAN</span>
            )}
          </div>
        </div>

        {/* Batch 43: Outro countdown bar */}
        {outroCountdown && outroSecs > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, paddingTop: 7, borderTop: '1px solid ' + BORDER }}>
            <span style={{ fontSize: 14 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: outroSecs < 60 ? RED : GOLD, letterSpacing: .5 }}>{outroCountdown.label || 'GOING OFFLINE IN'}</span>
                <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: outroSecs < 60 ? RED : TEXT, letterSpacing: 1 }}>
                  {Math.floor(outroSecs / 60)}:{String(outroSecs % 60).padStart(2,'0')}
                </span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: ((outroSecs / ((outroCountdown.endsAt - Date.now()) / 1000 + outroSecs)) * 100).toFixed(1) + '%', background: outroSecs < 60 ? RED : GOLD, borderRadius: 3, transition: 'width 1s linear' }} />
              </div>
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
            {role === 'host' && <button onClick={function() { if (setStreamGoal) setStreamGoal(null); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 9, padding: 0, lineHeight: 1 }}>✕</button>}
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

      {/* ════════════════ BATCH 48: DONATION MATCH BAR ════════════════ */}
      {donationMatch && (
        <div style={{ background: 'rgba(14,12,9,.9)', borderBottom: '1px solid ' + BORDER, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#A855F7', letterSpacing: 1, flexShrink: 0 }}>🤝 MATCH</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: TEXT, flexShrink: 0, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{donationMatch.label}</span>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.07)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: '#A855F7', width: Math.min(100, Math.floor((donationMatch.matchedCents / donationMatch.limitCents) * 100)) + '%', transition: 'width .6s ease' }} />
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#A855F7', flexShrink: 0 }}>${Math.floor(donationMatch.matchedCents / 100)}/${Math.floor(donationMatch.limitCents / 100)}</span>
        </div>
      )}

      {/* ════════════════ BATCH 48: HIGHLIGHT VOTE BAR ════════════════ */}
      {highlightVote && (
        <div style={{ background: 'rgba(14,12,9,.9)', borderBottom: '1px solid ' + BORDER, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1, flexShrink: 0 }}>✂️ CLIP?</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, flex: 1 }}>{highlightVote.label}</span>
          {!myHighlightVote && (
            <>
              <button onClick={function() { setMyHighlightVote('yes'); if (socket) socket.emit('highlight-cast', { roomId: roomId, choice: 'yes' }); }} style={{ background: 'rgba(0,204,102,.15)', border: '1px solid rgba(0,204,102,.4)', borderRadius: 8, padding: '4px 12px', color: '#00CC66', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>👍 {highlightVote.yes}</button>
              <button onClick={function() { setMyHighlightVote('no'); if (socket) socket.emit('highlight-cast', { roomId: roomId, choice: 'no' }); }} style={{ background: 'rgba(255,26,60,.1)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, padding: '4px 12px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>👎 {highlightVote.no}</button>
            </>
          )}
          {myHighlightVote && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>👍 {highlightVote.yes} · 👎 {highlightVote.no}</span>
          )}
        </div>
      )}

      {/* ════════════════ SCROLLABLE BODY ════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ── Stage Section ── */}
        <div style={{ padding: '12px 14px 6px', position: 'relative', overflow: 'hidden', background: (ROOM_THEMES[roomTheme] && ROOM_THEMES[roomTheme].bg) || undefined, transition: 'background .5s ease, filter .4s ease', filter: stageFilter && STAGE_FILTERS[stageFilter] ? STAGE_FILTERS[stageFilter] : undefined }}
          onClick={showHeatmap ? function(e) {
            var rect = e.currentTarget.getBoundingClientRect();
            var x    = Math.round(((e.clientX - rect.left) / rect.width)  * 100);
            var y    = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
            var EMOJIS = ['❤️','🔥','⭐','💜','👏','🎉','💥','✨'];
            var emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            if (socket) socket.emit('reaction-heat', { roomId: roomId, x: x, y: y, emoji: emoji });
          } : undefined}
        >
          {/* Heatmap reaction dots overlay */}
          {showHeatmap && heatPoints.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
              {heatPoints.map(function(p) {
                return (
                  <div key={p.id} style={{
                    position: 'absolute',
                    left: p.x + '%', top: p.y + '%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 22,
                    animation: 'heatPop 2.5s ease-out forwards',
                    lineHeight: 1,
                  }}>{p.emoji}</div>
                );
              })}
            </div>
          )}

          {/* Stage header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 20, color: TEXT, letterSpacing: .3 }}>Stage</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: MUTED, letterSpacing: 1 }}>{onStage.length}/{MAX_STAGE}</span>
              <div title={'Mood: ' + moodRingScore + '%'} style={{ width: 10, height: 10, borderRadius: '50%', background: moodRingScore >= 75 ? '#FF1A3C' : moodRingScore >= 50 ? '#C9A84C' : moodRingScore >= 25 ? '#D4854A' : '#8A7A62', boxShadow: '0 0 6px ' + (moodRingScore >= 75 ? '#FF1A3C' : moodRingScore >= 50 ? '#C9A84C' : '#D4854A') + '88', flexShrink: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
              {/* Stage layout (single focus) */}
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
            </div>
          </div>

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
                        {(g.username || gid).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Name + role + hand */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.username || gid}
                          {isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 3 }}>(YOU)</span>}
                        </span>
                        {isHand && <span style={{ fontSize: 13, animation: 'handBadgePulse 1.2s ease-in-out infinite' }} title="Hand raised">✋</span>}
                        {isSp && <SpeakBars color={TEAL} small />}
                      </div>
                      <RolePill role={g.role || (isOwn ? role : 'guest')} />
                    </div>
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
                    {/* Host controls */}
                    {role === 'host' && !isOwn && (
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

          {/* ── SPOTLIGHT MODE ── active guest at 70%, rest in side thumbnail bar */}
          {stageLayout === 'grid' && panelMode !== 'list' && !!spotlightGuestId && onStage.some(function(g) { return (g.guestId || g.userId) === spotlightGuestId; }) && (function() {
            var sg   = onStage.find(function(x) { return (x.guestId || x.userId) === spotlightGuestId; });
            var sgid = sg.guestId || sg.userId;
            var sgOwn = sgid === userId;
            var sgSp  = !!speakingIds[sgid];
            return (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, animation: 'spotlightIn .3s ease' }}>
                {/* Main 70% */}
                <div style={{ flex: '0 0 70%', position: 'relative', background: CARD, borderRadius: 12, overflow: 'hidden', border: '2px solid ' + (sgSp ? TEAL + 'BB' : GOLD + '66'), boxShadow: sgSp ? ('0 0 22px ' + TEAL + '33') : '0 0 14px ' + GOLD + '22', transition: 'border-color .2s' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                    <div style={{ position: 'absolute', inset: 0, filter: sgOwn && aiFilter !== 'none' && AI_FILTERS[aiFilter] ? AI_FILTERS[aiFilter] : undefined }}>
                      {audioOnly ? (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,' + CARD2 + ',' + BG + ')', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,' + BURG + '55,' + CARD + ')', border: '2px solid ' + GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: GOLD }}>{(sg.username || sgid).charAt(0).toUpperCase()}</span>
                          </div>
                          {sgSp && <WaveBars color={TEAL} />}
                        </div>
                      ) : (
                        <OctCell guest={sg} fill={true} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null} mediaConfig={sgOwn ? medConf : null} isMuted={sgOwn ? isMuted : false} isCamOff={sgOwn ? isCamOff : false} onMuteToggle={sgOwn ? toggleMute : null} onCamToggle={sgOwn ? toggleCam : null} onCameraTrack={sgOwn ? function(t) { cameraTrackRef.current = t; } : null} handRaised={!!raisedHands[sgid]} giftTotal={guestGiftTotals[sgid] || 0} />
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '6px 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{sg.username || sgid}</span>
                      {sgSp && <SpeakBars color={TEAL} small />}
                      <span style={{ background: 'rgba(201,168,76,.15)', border: '1px solid ' + GOLD + '44', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD }}>✦ SPOTLIGHT</span>
                    </div>
                    <button onClick={function() { setSpotlightGuestId(null); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 4 }}>✕</button>
                  </div>
                </div>
                {/* Thumbnail sidebar — 30% */}
                {onStage.filter(function(g) { return (g.guestId || g.userId) !== spotlightGuestId; }).length > 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 380, animation: 'thumbBarIn .3s ease' }}>
                    {onStage.filter(function(g) { return (g.guestId || g.userId) !== spotlightGuestId; }).map(function(tg) {
                      var tgid  = tg.guestId || tg.userId;
                      var tgOwn = tgid === userId;
                      var tgSp  = !!speakingIds[tgid];
                      return (
                        <div key={tgid} onClick={function() { setSpotlightGuestId(tgid); }}
                          style={{ position: 'relative', background: CARD2, borderRadius: 8, overflow: 'hidden', border: '1.5px solid ' + (tgSp ? TEAL + '66' : BORDER), cursor: 'pointer', flexShrink: 0, transition: 'border-color .2s' }}>
                          <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                            <div style={{ position: 'absolute', inset: 0 }}>
                              {audioOnly ? (
                                <div style={{ width: '100%', height: '100%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD }}>{(tg.username || tgid).charAt(0).toUpperCase()}</span>
                                </div>
                              ) : (
                                <OctCell guest={tg} fill={true} isHost={role === 'host'} fadesMode={false} branding={branding} onTap={null} socket={socket} roomId={roomId} userId={userId} rtcManager={rtcReady ? rtcManager : null} mediaConfig={tgOwn ? medConf : null} isMuted={tgOwn ? isMuted : false} isCamOff={tgOwn ? isCamOff : false} onMuteToggle={null} onCamToggle={null} handRaised={!!raisedHands[tgid]} giftTotal={guestGiftTotals[tgid] || 0} />
                              )}
                            </div>
                          </div>
                          <div style={{ padding: '2px 6px 4px', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {tgSp && <SpeakBars color={TEAL} small />}
                            <span style={{ fontSize: 9, color: tgSp ? TEXT : MUTED, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tg.username || tgid}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── GRID MODE ── CSS Grid, 16:9 cells, speaking animation, host actions */}
          {stageLayout === 'grid' && panelMode !== 'list' && !spotlightGuestId && (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ',1fr)', gap: 4 }}
              onClick={function() { if (cellMenuId) setCellMenuId(null); }}>
              {onStage.map(function(g) {
                var gid      = g.guestId || g.userId || 'x';
                var isOwn    = gid === userId;
                var isSp     = !!speakingIds[gid];
                var isHand   = !!raisedHands[gid];
                var isPinned = gid === pinnedId;
                var showMenu = cellMenuId === gid;
                return (
                  <div key={gid}
                    style={{
                      gridColumn: isPinned && cols > 1 ? 'span 2' : 'span 1',
                      position: 'relative',
                      background: CARD,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '2px solid ' + (isSp ? TEAL + 'BB' : isPinned ? GOLD + '66' : isHand ? 'rgba(255,140,0,.65)' : BORDER),
                      animation: isSp ? 'speakPulseGrid 1.4s ease-in-out infinite' : 'fadeSlideIn .22s ease',
                      transition: 'border-color .2s',
                    }}>
                    {/* 16:9 video wrapper */}
                    <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                      <div style={{ position: 'absolute', inset: 0, filter: isOwn && aiFilter !== 'none' && AI_FILTERS[aiFilter] ? AI_FILTERS[aiFilter] : undefined }}>
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
                            onCameraTrack={isOwn ? function(t) { cameraTrackRef.current = t; } : null}
                            handRaised={isHand}
                            giftTotal={guestGiftTotals[gid] || 0}
                          />
                        )}
                      </div>
                    </div>

                    <OverlayCustomLT lowerThirds={overlayConfig && overlayConfig.lowerThirds} guestId={gid} />

                    {/* Overlay badges (top-left) */}
                    <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', gap: 3, zIndex: 10, pointerEvents: 'none' }}>
                      {isHand && (
                        <div style={{ background: 'rgba(255,140,0,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>✋</div>
                      )}
                      {isPinned && (
                        <div style={{ background: 'rgba(201,168,76,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#0E0C09' }}>📌</div>
                      )}
                      {isSp && (
                        <div style={{ background: 'rgba(212,133,74,.85)', borderRadius: 999, padding: '1px 5px', display: 'flex', alignItems: 'center' }}>
                          <SpeakBars color='#fff' small />
                        </div>
                      )}
                    </div>

                    {/* Top-right buttons: spotlight + expand + host ⋮ menu */}
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3, zIndex: 10 }}>
                      <button onClick={function(e) { e.stopPropagation(); setSpotlightGuestId(function(s) { return s === gid ? null : gid; }); }}
                        title={spotlightGuestId === gid ? 'Exit spotlight' : 'Spotlight (70%)'}
                        style={{ width: 20, height: 20, background: spotlightGuestId === gid ? 'rgba(201,168,76,.7)' : 'rgba(0,0,0,.6)', border: '1px solid ' + (spotlightGuestId === gid ? GOLD : 'rgba(255,255,255,.18)'), borderRadius: 4, color: spotlightGuestId === gid ? BG : TEXT, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✦
                      </button>
                      <button onClick={function(e) { e.stopPropagation(); setExpandedCell(gid); }}
                        style={{ width: 20, height: 20, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4, color: TEXT, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ⤢
                      </button>
                      {role === 'host' && !isOwn && (
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
                          { label: isPinned ? '📌 Unpin' : '📌 Spotlight', action: 'pin' },
                          { label: g.remoteMuted ? '🎙 Unmute' : '🔇 Mute', action: 'mute' },
                          { label: isHand ? '✋ Invite to Stage' : null, action: 'invite', hide: !isHand },
                          { label: g.role === 'cohost' ? '👤 Remove Co-Host' : '👑 Make Co-Host', action: 'cohost' },
                          { label: !isOwn ? '💌 Message' : null, action: 'dm', hide: isOwn },
                          { label: '🚫 Remove from Stage', action: 'remove' },
                        ].filter(function(item) { return !item.hide; }).map(function(item) {
                          return (
                            <button key={item.action}
                              onClick={function(e) {
                                e.stopPropagation();
                                setCellMenuId(null);
                                if (item.action === 'pin') {
                                  setPinnedId(function(p) { return p === gid ? null : gid; });
                                } else if (item.action === 'mute') {
                                  if (socket) socket.emit(g.remoteMuted ? 'unmute-guest' : 'mute-guest', { roomId: roomId, guestId: gid });
                                } else if (item.action === 'invite') {
                                  if (socket) socket.emit('stage-invite', { roomId: roomId, guestId: gid });
                                } else if (item.action === 'cohost') {
                                  var nextRole = g.role === 'cohost' ? 'guest' : 'cohost';
                                  if (socket) socket.emit('set-guest-role', { roomId: roomId, guestId: gid, role: nextRole });
                                } else if (item.action === 'dm') {
                                  setDmTarget({ guestId: gid, username: g.username || gid });
                                  setDmInput('');
                                  setShowDmModal(true);
                                } else if (item.action === 'remove') {
                                  if (socket) socket.emit('stage-remove', { roomId: roomId, guestId: gid });
                                }
                              }}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 13px', background: 'none', border: 'none', borderBottom: '1px solid ' + DIM, color: item.action === 'remove' ? RED : TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer', letterSpacing: .3 }}>
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Cell footer */}
                    <div style={{ padding: '4px 8px 6px', background: CARD, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.username || gid}
                        {isOwn && <span style={{ color: MUTED, fontWeight: 400, fontSize: 9, marginLeft: 3 }}>(YOU)</span>}
                      </span>
                      <RolePill role={g.role || (isOwn ? role : 'guest')} />
                      {(isOwn ? isMuted : g.remoteMuted) && <span style={{ fontSize: 9 }}>🔇</span>}
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
                                onCameraTrack={isOwn ? function(t) { cameraTrackRef.current = t; } : null}
                                handRaised={isHand}
                                giftTotal={guestGiftTotals[gid] || 0}
                              />
                            )}
                          </div>
                        </div>
                        <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', gap: 3, zIndex: 10, pointerEvents: 'none' }}>
                          {isHand && <div style={{ background: 'rgba(255,140,0,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#fff', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>✋</div>}
                          {isPinned && <div style={{ background: 'rgba(201,168,76,.92)', borderRadius: 999, padding: '2px 6px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#0E0C09' }}>📌</div>}
                          {isSp && <div style={{ background: 'rgba(212,133,74,.85)', borderRadius: 999, padding: '1px 5px', display: 'flex', alignItems: 'center' }}><SpeakBars color='#fff' small /></div>}
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
          {stageLayout === 'featured' && (
            <div>
              {/* Big featured cell */}
              <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden', border: '1.5px solid ' + (speakingIds[featuredGuest.guestId || featuredGuest.userId] ? TEAL + '88' : BORDER), boxShadow: speakingIds[featuredGuest.guestId || featuredGuest.userId] ? ('0 0 24px ' + TEAL + '33') : 'none', marginBottom: 10 }}>
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
                    mediaConfig={(featuredGuest.guestId || featuredGuest.userId) === userId ? medConf : null}
                    isMuted={(featuredGuest.guestId || featuredGuest.userId) === userId ? isMuted : false}
                    isCamOff={(featuredGuest.guestId || featuredGuest.userId) === userId ? isCamOff : false}
                    onMuteToggle={(featuredGuest.guestId || featuredGuest.userId) === userId ? toggleMute : null}
                    onCamToggle={(featuredGuest.guestId || featuredGuest.userId) === userId ? toggleCam : null}
                    giftTotal={guestGiftTotals[featuredGuest.guestId || featuredGuest.userId] || 0}
                  />
                  <OverlayCustomLT lowerThirds={overlayConfig && overlayConfig.lowerThirds} guestId={featuredGuest.guestId || featuredGuest.userId} />
                </div>
                <div style={{ padding: '8px 12px 10px', background: CARD }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>
                      {featuredGuest.username || featuredGuest.guestId}
                    </span>
                    <RolePill role={featuredGuest.role || role} />
                    {speakingIds[featuredGuest.guestId || featuredGuest.userId] && <SpeakBars color={TEAL} small />}
                  </div>
                </div>
              </div>
              {/* Thumbnail strip */}
              {onStage.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                  {onStage.filter(function(g) {
                    return (g.guestId || g.userId) !== (featuredGuest.guestId || featuredGuest.userId);
                  }).map(function(g) {
                    var gid  = g.guestId || g.userId || 'x';
                    var isOwn = gid === userId;
                    var isSp  = !!speakingIds[gid];
                    return (
                      <div key={gid} onClick={function() { setFeaturedId(gid); }}
                        style={{
                          flexShrink: 0, width: 90,
                          background: CARD2, borderRadius: 10, overflow: 'hidden',
                          border: '1.5px solid ' + (isSp ? TEAL + '66' : BORDER),
                          cursor: 'pointer',
                        }}>
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
          )}
          <OverlayBanner banner={overlayConfig && overlayConfig.banner} />
          <OverlayCountdown countdown={overlayConfig && overlayConfig.countdown} />
          <OverlayScoreBug scoreBug={overlayConfig && overlayConfig.scoreBug} />
          <ChyronOverlay socket={socket} roomId={roomId} role={role} isLive={isLive} />
        </div>

        {/* ── Audience Section ── */}
        {(audienceList.length > 0 || (role !== 'host' && onStage.every(function(g) { return (g.guestId || g.userId) !== userId; }))) && (
          <div style={{ padding: '10px 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: MUTED, letterSpacing: .3 }}>
                  In the Room
                </span>
                {Object.keys(raisedHands).length > 0 && (
                  <span style={{ background: 'rgba(255,140,0,.18)', border: '1px solid rgba(255,140,0,.4)', borderRadius: 999, padding: '1px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#D4854A', animation: 'handBadgePulse 1.2s ease-in-out infinite' }}>
                    ✋ {Object.keys(raisedHands).length} raised
                  </span>
                )}
              </div>
              {audienceList.length > 8 && (
                <button onClick={function() { setShowAllAud(function(v) { return !v; }); }}
                  style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: .5 }}>
                  {showAllAud ? 'COLLAPSE' : 'SEE ALL (' + audienceList.length + ')'}
                </button>
              )}
            </div>
            {showAllAud ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {audienceList.map(function(g) {
                  var gid = g.guestId || g.userId || 'x';
                  var isHand = !!raisedHands[gid];
                  return (
                    <AudienceCircle key={gid} g={g} speaking={!!speakingIds[gid]}
                      handRaised={isHand}
                      engScore={engagementScores[(g.userId || gid)] || 0}
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
                      engScore={engagementScores[(g.userId || gid)] || 0}
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
            { emoji: '🔗', label: 'Share',    active: false, onTap: function() { setShowShareSheet(true); } },
            { emoji: '🎤', label: audioOnly ? 'Video ON' : 'Audio', active: audioOnly, onTap: function() { setAudioOnly(function(v) { return !v; }); if (addToast) addToast(audioOnly ? 'Video mode on' : '🎤 Audio-only mode', 'info'); } },
            { emoji: privateMode ? '🔒' : '🔓', label: 'Private', active: privateMode, onTap: function() { if (role === 'host') { setShowPrivateSet(true); } else { if (addToast) addToast(privateMode ? 'Room is private — invite only' : 'Room is open', 'info'); } } },
            { emoji: '📹', label: 'Record',   active: recState === 'recording', onTap: function() { setShowRecorder(true); } },
            { emoji: '📊', label: 'Poll',     active: false, onTap: function() { setShowQa(true); setShowPollCreate(true); setShowVsCreate(false); setShowJudges(false); setChatOpen(false); } },
            { emoji: '⚔',  label: 'VS',      active: false, onTap: function() { setShowQa(true); setShowVsCreate(true); setShowPollCreate(false); setShowJudges(false); setChatOpen(false); } },
            { emoji: '⚖',  label: 'Judges',  active: false, onTap: function() { setShowQa(true); setShowJudges(true); setShowPollCreate(false); setShowVsCreate(false); setChatOpen(false); } },
            { emoji: '⚙',  label: 'Camera',  active: false, onTap: function() { setShowMediaConf(true); } },
            ...(role === 'host' || role === 'cohost' ? [
              { emoji: '🛒', label: 'Spotlight', active: !!spotlightItem, onTap: function() { setShowSpotlightPick(true); } },
              { emoji: '📢', label: 'Announce',  active: pending.length > 0, onTap: function() { setShowAnnounce(true); } },
              { emoji: '🎉', label: 'New Follow', active: false, onTap: function() { if (socket) socket.emit('follow-trigger', { roomId: roomId, username: 'Fan' }); if (addToast) addToast('Follow alert triggered!', 'success'); } },
              { emoji: '✏️', label: 'Title', active: !!localStreamTitle, onTap: function() { setTitleInput(localStreamTitle); setShowTitleEdit(true); } },
              { emoji: '🚫', label: 'Filter', active: bannedWords.length > 0, onTap: function() { setShowBannedWords(true); } },
              { emoji: '⭐', label: 'Sub Only', active: isSubOnly, onTap: function() { var next = !isSubOnly; setIsSubOnly(next); if (socket) socket.emit('subscriber-only-changed', { roomId: roomId, enabled: next }); if (addToast) addToast(next ? '⭐ Subscriber-only chat ON' : '💬 Subscriber-only chat OFF', 'success'); } },
              { emoji: '🎞️', label: 'Clips', active: highlights.length > 0, onTap: function() { if (socket) socket.emit('request-highlights', { roomId: roomId }); } },
              { emoji: '🐢', label: 'Slow', active: slowMode > 0, onTap: function() { setShowSlowMode(true); } },
              { emoji: '📣', label: 'Shoutout', active: false, onTap: function() { setShoutoutTarget(''); setShowShoutout(true); } },
              { emoji: '🏷️', label: 'Tags', active: roomTags.length > 0, onTap: function() { setTagInput(roomTags.join(', ')); setShowTagEdit(true); } },
              { emoji: '🔗', label: 'Pin Link', active: !!pinnedLink, onTap: function() { setLinkUrl(pinnedLink ? pinnedLink.url : ''); setLinkLabel(pinnedLink ? pinnedLink.label : ''); setLinkEmoji(pinnedLink ? pinnedLink.emoji : '🔗'); setShowLinkPin(true); } },
              { emoji: '🎊', label: 'Celebrate', active: false, onTap: function() { if (socket) socket.emit('celebrate', { roomId: roomId, type: 'confetti' }); } },
              { emoji: '📌', label: 'Banner', active: !!pinnedAnnouncement, onTap: function() { setPinAnnounceInput(pinnedAnnouncement ? pinnedAnnouncement.text : ''); setShowPinAnnounce(true); } },
              { emoji: '🔇', label: 'Mute All', active: false, onTap: function() { setShowMuteAllConfirm(true); } },
              { emoji: '🔑', label: 'Keyword', active: !!chatKeyword, onTap: function() { setKeywordInput(chatKeyword); setShowKeywordSet(true); } },
              { emoji: '🛍️', label: 'Shop', active: !!pinnedShopItem, onTap: function() { setShopItemInput(pinnedShopItem ? { name: pinnedShopItem.name, price: String((pinnedShopItem.price || 0) / 100), image: pinnedShopItem.image || '', url: pinnedShopItem.url || '' } : { name: '', price: '', image: '', url: '' }); setShowShopPin(true); } },
              { emoji: '🏆', label: 'Challenge', active: !!(activeChallenge && activeChallenge.active), onTap: function() { setShowChallengeSet(true); } },
              { emoji: '🎯', label: 'Goal', active: !!(creatorGoal && creatorGoal.active), onTap: function() { setShowGoalSet(true); } },
              { emoji: '📊', label: 'Stats', active: showLiveStats, onTap: function() { if (socket) socket.emit('live-stats-request', { roomId: roomId }); setShowLiveStats(function(s) { return !s; }); } },
              { emoji: '📣', label: 'Shoutout', active: false, onTap: function() {
                var name = window.prompt('Shoutout to (username):');
                if (!name || !name.trim()) return;
                var reason = window.prompt('Reason (optional, e.g. "top gifter"):') || '';
                if (socket) socket.emit('shoutout', { roomId: roomId, username: name.trim(), reason: reason.trim() });
              }},
              { emoji: '⏱️', label: 'Countdown', active: !!streamCountdown, onTap: function() {
                if (streamCountdown) { if (socket) socket.emit('countdown-cancel', { roomId: roomId }); }
                else { setShowScheduleSet(true); }
              }},
              { emoji: '👑', label: 'Top Fans', active: showTopFans, onTap: function() { setShowTopFans(function(s) { return !s; }); } },
              { emoji: '🗳️', label: 'Vote', active: !!audienceVote, onTap: function() { setShowVoteCreate(true); } },
              { emoji: '🎬', label: 'Clip Pin', active: !!pinnedClip, onTap: function() {
                var label = window.prompt('Clip label:'); if (!label || !label.trim()) return;
                var url = window.prompt('Clip URL (optional):') || '';
                if (socket) socket.emit('clip-pin', { roomId: roomId, label: label.trim(), url: url.trim() });
              }},
              { emoji: '⭐', label: 'Ratings', active: !!ratingAvg, onTap: function() {
                if (ratingAvg) { if (addToast) addToast('⭐ Avg: ' + ratingAvg.avg + '/5 from ' + ratingAvg.count + ' viewers', 'info'); }
              }},
              { emoji: '🎨', label: 'AI Filter', active: aiFilter !== 'none', onTap: function() { setShowFilterPanel(function(s) { return !s; }); } },
              { emoji: '🏆', label: 'PK Board', active: showPkLeaderboard, onTap: function() { setShowPkLeaderboard(function(s) { return !s; }); } },
              { emoji: '📂', label: 'Gallery', active: showClipGallery, onTap: function() { setShowClipGallery(function(s) { return !s; }); } },
              { emoji: '📺', label: 'Co-Watch', active: !!watchTogether, onTap: function() {
                if (watchTogether) { if (socket) socket.emit('watch-together-end', { roomId: roomId }); }
                else { setShowWatchInput(true); }
              }},
              { emoji: '🔔', label: 'Sound', active: soundAlertPanel, onTap: function() { setSoundAlertPanel(function(s) { return !s; }); } },
              { emoji: '🎭', label: 'Theme', active: roomTheme !== 'default', onTap: function() { setShowThemePicker(function(s) { return !s; }); } },
              { emoji: '🛒', label: 'Carousel', active: shopCarousel.length > 0, onTap: function() { setShowCarouselEdit(function(s) { return !s; }); } },
              { emoji: '⌨️', label: 'Hotkeys', active: hotkeysEnabled, onTap: function() { setHotkeysEnabled(function(s) { return !s; }); if (!hotkeysEnabled && addToast) addToast('⌨️ Host hotkeys enabled (M=mute, V=cam, C=chat, H=hype, Esc=clear)', 'info'); } },
              { emoji: '📅', label: 'Schedule', active: !!nextStreamTs, onTap: function() { setShowNextStream(function(s) { return !s; }); } },
              { emoji: '⚔️', label: 'Battle', active: !!(teamBattle && teamBattle.active), onTap: function() { setShowTeamBattle(function(s) { return !s; }); } },
              { emoji: '🖊️', label: 'Board', active: showWhiteboard, onTap: function() { setShowWhiteboard(function(s) { return !s; }); } },
              { emoji: '📡', label: 'Health', active: showHealthBar, onTap: function() { setShowHealthBar(function(s) { return !s; }); } },
              { emoji: '💰', label: 'Rev Split', active: showRevSplit, onTap: function() { setShowRevSplit(function(s) { return !s; }); } },
              { emoji: '🎤', label: 'Karaoke', active: karaokeActive, onTap: function() { setKaraokeInput(karaokeText); setShowKaraokeEdit(function(s) { return !s; }); } },
              { emoji: '🎰', label: 'Lucky Draw', active: showLuckyDraw, onTap: function() { setShowLuckyDraw(function(s) { return !s; }); } },
              { emoji: '📍', label: 'Chapters', active: streamChapters.length > 0, onTap: function() { setShowChapters(function(s) { return !s; }); } },
              { emoji: '👋', label: 'Intro Card', active: false, onTap: function() {
                var name = window.prompt('Guest name:'); if (!name || !name.trim()) return;
                var bio  = window.prompt('Bio / role (optional):') || '';
                if (socket) socket.emit('guest-intro', { roomId: roomId, username: name.trim(), bio: bio.trim(), emoji: '🎤' });
              }},
              { emoji: '🎵', label: 'Now Playing', active: !!nowPlaying, onTap: function() {
                setNowPlayingInput(nowPlaying ? { title: nowPlaying.title, artist: nowPlaying.artist || '', emoji: nowPlaying.emoji || '🎵' } : { title: '', artist: '', emoji: '🎵' });
                setShowNowPlayingEdit(function(s) { return !s; });
              }},
              { emoji: '📝', label: 'Tip Ticker', active: tipTickerItems.length > 0, onTap: function() {
                setTipEditInput(tipTickerItems.map(function(t) { return t.text; }).join('\n'));
                setShowTipEdit(function(s) { return !s; });
              }},
              { emoji: '📜', label: 'Prompter', active: showTeleprompter, onTap: function() { setShowTeleprompter(function(s) { return !s; }); } },
              { emoji: '📋', label: 'Summary', active: false, onTap: function() { setShowSummaryCard(function(s) { return !s; }); } },
              { emoji: '☁️', label: 'Word Cloud', active: showWordCloud, onTap: function() { setShowWordCloud(function(s) { return !s; }); } },
              { emoji: '⚡', label: 'Highlights', active: showHighlightLine, onTap: function() {
                if (socket) socket.emit('request-highlights', { roomId: roomId });
                setShowHighlightLine(function(s) { return !s; });
              }},
            ].concat(multiCamDevices.length > 1 ? [
              { emoji: '📷', label: 'Camera', active: showCamPicker, onTap: function() { setShowCamPicker(function(s) { return !s; }); } },
            ] : [])
            : []),
            { emoji: '🌡', label: 'Heatmap', active: showHeatmap, onTap: function() { setShowHeatmap(function(s) { return !s; }); } },
            { emoji: '📊', label: 'Vibe', active: showSentiment, onTap: function() { setShowSentiment(function(s) { return !s; }); } },
            { emoji: '🔀', label: 'Compare', active: showCompare, onTap: function() { setShowCompare(function(s) { return !s; }); } },
            { emoji: '🎯', label: 'Gift Goal', active: !!giftGoal, onTap: function() { setShowGiftGoal(function(s) { return !s; }); } },
            { emoji: '🎭', label: 'Mood', active: showMoodPanel, onTap: function() { setShowMoodPanel(function(s) { return !s; }); } },
            { emoji: '⭐', label: 'Starred', active: showStarred, onTap: function() { setShowStarred(function(s) { return !s; }); } },
            ...(role === 'host' ? [
              { emoji: '👥', label: 'Co-Queue', active: showCohostQueue, onTap: function() { setShowCohostQueue(function(s) { return !s; }); } },
              { emoji: '🔊', label: 'TTS Gifts', active: ttsEnabled, onTap: function() {
                setTtsEnabled(function(s) { return !s; });
                if (addToast) addToast(ttsEnabled ? '🔇 TTS alerts off' : '🔊 TTS gift alerts on', 'info');
              }},
              { emoji: '🎲', label: 'Spotlight', active: !!viewerSpotlight, onTap: function() {
                if (!viewerSpotlight && socket) socket.emit('viewer-spotlight-spin', { roomId: roomId, duration: 30 });
                else if (viewerSpotlight && socket) socket.emit('viewer-spotlight-spin', { roomId: roomId, duration: 0 });
              }},
              { emoji: '🎰', label: 'Raffle', active: !!chatRaffle, onTap: function() { setShowRafflePanel(function(s) { return !s; }); } },
            ] : role === 'viewer' ? [
              { emoji: '✋', label: 'Co-Host', active: cohostRequested, onTap: function() {
                if (!cohostRequested && socket) { socket.emit('cohost-request', { roomId: roomId }); setCohostRequested(true); }
              }},
            ] : []).concat([
              { emoji: '🏆', label: 'Fan Wall', active: showFanWall, onTap: function() { setShowFanWall(function(s) { return !s; }); } },
              { emoji: '📱', label: 'PiP', active: pipActive, onTap: function() {
                if (!document.pictureInPictureElement) {
                  var vid = document.querySelector('video[autoplay]');
                  if (vid && vid.requestPictureInPicture) {
                    vid.requestPictureInPicture().then(function() { setPipActive(true); }).catch(function() {});
                  }
                } else {
                  document.exitPictureInPicture().then(function() { setPipActive(false); }).catch(function() {});
                }
              }},
              { emoji: '👏', label: 'Applause', active: false, onTap: function() {
                if (socket) socket.emit('applause-tap', { roomId: roomId });
              }},
            ].concat(role === 'host' ? [
              { emoji: '⏸', label: 'BRB', active: !!(brbMode && brbMode.active), onTap: function() {
                if (brbMode && brbMode.active) {
                  if (socket) socket.emit('brb-toggle', { roomId: roomId, active: false });
                } else {
                  setShowBrbSet(function(s) { return !s; });
                }
              }},
              { emoji: '⚡', label: 'Challenge', active: !!(audienceChallenge && audienceChallenge.active !== false), onTap: function() { setShowChallengeSet(function(s) { return !s; }); } },
              { emoji: '🛒', label: 'Flash Drop', active: !!flashDrop, onTap: function() {
                if (flashDrop) {
                  if (socket) socket.emit('flash-drop-ended', { roomId: roomId });
                  setFlashDrop(null);
                } else {
                  setShowFlashDropSet(function(s) { return !s; });
                }
              }},
            ] : []).concat([
              { emoji: '🎨', label: 'My Color', active: !!myChatColor, onTap: function() { setShowColorPicker(function(s) { return !s; }); } },
            ]).concat(role === 'host' ? [
              { emoji: '📺', label: 'Lower 3rd', active: !!lowerThird, onTap: function() {
                if (lowerThird) { if (socket) socket.emit('lower-third-clear', { roomId: roomId }); }
                else { setShowLowerThirdSet(function(s) { return !s; }); }
              }},
              { emoji: '🌊', label: 'Emoji Rain', active: false, onTap: function() { setShowEmojiPicker37(function(s) { return !s; }); } },
              { emoji: '📣', label: 'Shoutout', active: false, onTap: function() { setShowShoutoutSet(function(s) { return !s; }); } },
              { emoji: '🎨', label: 'Chat Vibe', active: !!chatTheme, onTap: function() { setShowThemePicker(function(s) { return !s; }); } },
              { emoji: '🏅', label: 'Scoreboard', active: !!scoreboard, onTap: function() {
                if (scoreboard) { if (socket) socket.emit('scoreboard-clear', { roomId: roomId }); }
                else { setShowScoreboardSet(function(s) { return !s; }); }
              }},
              { emoji: '🔨', label: 'Auction', active: !!auction, onTap: function() {
                if (auction) { if (socket) socket.emit('auction-end', { roomId: roomId }); }
                else { setShowAuctionSet(function(s) { return !s; }); }
              }},
              { emoji: '⏱', label: 'Timer', active: !!timerWidget, onTap: function() {
                if (timerWidget) { if (socket) socket.emit('timer-widget-stop', { roomId: roomId }); }
                else { setShowTimerSet(function(s) { return !s; }); }
              }},
              { emoji: '🧠', label: 'Quick Quiz', active: !!quickQuiz, onTap: function() {
                if (quickQuiz) { if (socket) socket.emit('quick-quiz-end', { roomId: roomId }); }
                else { setShowQuizSet(function(s) { return !s; }); }
              }},
              { emoji: '🎵', label: 'Song Queue', active: showSongQueue, onTap: function() { setShowSongQueue(function(s) { return !s; }); } },
              { emoji: '📜', label: 'Marquee', active: !!marquee, onTap: function() {
                if (marquee) { if (socket) socket.emit('marquee-clear', { roomId: roomId }); }
                else { setShowMarqueeSet(function(s) { return !s; }); }
              }},
              { emoji: '📣', label: 'So. Queue', active: showShoutoutQueue || shoutoutQueue.length > 0, onTap: function() { setShowShoutoutQueue(function(s) { return !s; }); } },
              { emoji: '✏️', label: 'Title', active: showTitleEdit, onTap: function() { setTitleDraft(streamTitle || ''); setShowTitleEdit(function(s) { return !s; }); } },
              { emoji: '🌈', label: 'Vibe', active: !!roomVibe || showVibePicker, onTap: function() { setShowVibePicker(function(s) { return !s; }); } },
              { emoji: '🗳️', label: 'Poll', active: !!simplePoll || showPollSet, onTap: function() {
                if (simplePoll && simplePoll.active) { if (socket) socket.emit('simple-poll-end', { roomId: roomId }); }
                else { setShowPollSet(function(s) { return !s; }); }
              }},
              { emoji: '📝', label: 'Host Note', active: !!hostNote || showHostNoteSet, onTap: function() {
                if (hostNote) { if (socket) socket.emit('host-note-clear', { roomId: roomId }); }
                else { setHostNoteDraft(''); setShowHostNoteSet(function(s) { return !s; }); }
              }},
              { emoji: '🤝', label: 'Collab', active: !!collabBanner || showCollabSet, onTap: function() {
                if (collabBanner) { if (socket) socket.emit('collab-banner-clear', { roomId: roomId }); }
                else { setCollabDraft({ name: '', platform: '' }); setShowCollabSet(function(s) { return !s; }); }
              }},
              { emoji: '🎬', label: 'Moment', active: showMomentLog, onTap: function() { setShowMomentLog(function(s) { return !s; }); } },
              { emoji: '☁️', label: 'Word Cloud', active: showWordCloud, onTap: function() { setShowWordCloud(function(s) { return !s; }); } },
              { emoji: '📊', label: 'Capacity', active: !!roomCapacity || showCapacitySet, onTap: function() { setShowCapacitySet(function(s) { return !s; }); } },
              { emoji: '🎡', label: 'Prize Wheel', active: !!prizeWheel || showWheelSet, onTap: function() {
                if (prizeWheel) { setShowWheelSet(false); }
                else { setWheelDraft('Grand Prize\nRunner Up\nConsolation\nTry Again'); setShowWheelSet(function(s) { return !s; }); }
              }},
              { emoji: '⏳', label: 'Outro', active: !!outroCountdown || showOutroSet, onTap: function() {
                if (outroCountdown) { if (socket) socket.emit('outro-countdown-cancel', { roomId: roomId }); }
                else { setShowOutroSet(function(s) { return !s; }); }
              }},
              { emoji: '📅', label: 'Schedule', active: schedule.length > 0 || showSchedule, onTap: function() { setShowSchedule(function(s) { return !s; }); } },
              { emoji: '🎯', label: 'Spotlight', active: !!spotlightPick, onTap: function() {
                if (socket) socket.emit('spotlight-random-pick', { roomId: roomId }, function(res) {
                  if (res && res.error) { if (addToast) addToast(res.error, 'error'); }
                  else if (res) { if (addToast) addToast('🎯 Spotlighting ' + res.picked + '!', 'success'); }
                });
              }},
              { emoji: 'ℹ️', label: 'About Me', active: !!hostBio || showBioEdit, onTap: function() { setBioDraft(hostBio ? { bio: hostBio.bio || '', links: hostBio.links && hostBio.links.length ? hostBio.links : [{ label: '', url: '' }] } : { bio: '', links: [{ label: '', url: '' }] }); setShowBioEdit(function(s) { return !s; }); } },
              { emoji: '🎞️', label: 'Stage Filter', active: !!stageFilter || showFilterPicker, onTap: function() { setShowFilterPicker(function(s) { return !s; }); } },
              { emoji: '🔢', label: 'Countdown', active: !!dramaticCountdown || showDramaticSet, onTap: function() { setShowDramaticSet(function(s) { return !s; }); } },
              { emoji: '📊', label: 'Sesh Stats', active: showSessionStats, onTap: function() { setShowSessionStats(function(s) { return !s; }); } },
              { emoji: '📍', label: pinnedEmoji ? 'Emoji ✓' : 'Pin Emoji', active: !!pinnedEmoji || showEmojiPin, onTap: function() { setShowEmojiPin(function(s) { return !s; }); } },
              { emoji: '🎙️', label: 'Audio Meter', active: showAudioMeter, onTap: function() { setShowAudioMeter(function(s) { return !s; }); } },
              { emoji: '🧠', label: 'Trivia', active: !!triviaDrop || showTriviaSet, onTap: function() { setShowTriviaSet(function(s) { return !s; }); } },
              { emoji: '📋', label: 'Q Queue', active: showQueuePanel || viewerQueue.length > 0, onTap: function() { setShowQueuePanel(function(s) { return !s; }); } },
              { emoji: '✂️', label: 'Clip Vote', active: !!highlightVote, onTap: function() {
                if (highlightVote) return;
                if (socket) socket.emit('highlight-vote', { roomId: roomId, label: 'Should we clip this moment?', secs: 30 }, function(res) {
                  if (res && res.ok) { if (addToast) addToast('✂️ Clip vote started!', 'success'); }
                  else if (res && res.error) { if (addToast) addToast(res.error, 'error'); }
                });
              }},
              { emoji: '🤝', label: donationMatch ? 'Match ✓' : 'Don. Match', active: !!donationMatch || showMatchSet, onTap: function() {
                if (donationMatch) {
                  if (socket) socket.emit('set-donation-match', { roomId: roomId }, function() { setDonationMatch(null); });
                } else { setShowMatchSet(function(s) { return !s; }); }
              }},
              { emoji: '⏱️', label: 'Watch Time', active: showWatchLeaders, onTap: function() {
                if (socket) socket.emit('watch-time-leaders', { roomId: roomId }, function(res) {
                  if (res && Array.isArray(res.leaders)) setWatchLeaders(res.leaders);
                });
                setShowWatchLeaders(function(s) { return !s; });
              }},
            ] : []).concat(role === 'viewer' ? [
              { emoji: '🎵', label: 'Request SR', active: false, onTap: function() { setShowSongQueue(function(s) { return !s; }); } },
              { emoji: '📍', label: 'Check In', active: false, onTap: function() {
                if (socket) socket.emit('viewer-checkin', { roomId: roomId, username: username }, function(res) {
                  if (res && res.ok) { if (addToast) addToast('📍 Checked in! +' + res.pts + ' pts', 'success'); }
                  else if (res && res.minutesLeft) { if (addToast) addToast('Check in again in ' + res.minutesLeft + ' min', 'info'); }
                });
              }},
              { emoji: '❤️', label: inFanClub ? 'Fan ✓' : 'Fan Club', active: inFanClub, onTap: function() {
                if (inFanClub) {
                  if (socket) socket.emit('fanclub-leave', { roomId: roomId }, function(res) {
                    if (res && res.ok) { if (addToast) addToast('Left the fan club', 'info'); }
                  });
                } else {
                  if (socket) socket.emit('fanclub-join', { roomId: roomId, username: username }, function(res) {
                    if (res && res.ok) { if (addToast) addToast('❤️ Joined the fan club! Count: ' + res.count, 'success'); }
                    else if (res && res.already) { if (addToast) addToast('You\'re already in the fan club!', 'info'); }
                  });
                }
              }},
              { emoji: myStatus ? myStatus.emoji : '😊', label: myStatus ? 'Status ✓' : 'My Status', active: !!myStatus, onTap: function() { setShowStatusPicker(function(s) { return !s; }); } },
              { emoji: '☁️', label: 'Word Cloud', active: showWordCloud, onTap: function() { setShowWordCloud(function(s) { return !s; }); } },
              { emoji: '🎬', label: 'Moments', active: showMomentLog, onTap: function() { setShowMomentLog(function(s) { return !s; }); } },
              { emoji: signedIn ? '✅' : '✍️', label: signedIn ? 'Signed In' : 'Sign In', active: signedIn, onTap: function() {
                if (!signedIn) {
                  if (socket) socket.emit('stream-sign-in', { roomId: roomId, username: username }, function(res) {
                    if (res && res.ok) { setSignedIn(true); if (addToast) addToast('✍️ Signed in! ' + res.count + ' here', 'success'); }
                    else if (res && res.already) { setSignedIn(true); if (addToast) addToast('Already signed in!', 'info'); }
                  });
                }
              }},
              { emoji: '💫', label: 'React Wall', active: showReactWall, onTap: function() { setShowReactWall(function(s) { return !s; }); } },
              { emoji: '📅', label: 'Schedule', active: schedule.length > 0, onTap: function() { setShowSchedule(function(s) { return !s; }); } },
              { emoji: 'ℹ️', label: 'About', active: showBioPanel, onTap: function() { setShowBioPanel(function(s) { return !s; }); } },
              { emoji: '📊', label: 'Sesh Stats', active: showSessionStats, onTap: function() { setShowSessionStats(function(s) { return !s; }); } },
              { emoji: '❓', label: 'Ask Host', active: !!myQueueId || showViewerQueue, onTap: function() { setShowViewerQueue(function(s) { return !s; }); } },
              { emoji: '🏷️', label: nameTag ? 'Tag ✓' : 'Name Tag', active: !!nameTag || showNameTagEdit, onTap: function() { setNameTagDraft(nameTag); setShowNameTagEdit(function(s) { return !s; }); } },
              { emoji: '🌍', label: myLocation ? 'Loc ✓' : 'Where From', active: !!myLocation || showLocationPanel, onTap: function() { setShowLocationPanel(function(s) { return !s; }); } },
              { emoji: '✂️', label: highlightVote ? (myHighlightVote ? 'Voted ✓' : 'Clip Vote') : 'Clip Vote', active: !!highlightVote, onTap: function() {
                if (highlightVote && !myHighlightVote) {
                  setMyHighlightVote('yes');
                  if (socket) socket.emit('highlight-cast', { roomId: roomId, choice: 'yes' });
                }
              }},
            ] : [])),
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

      {/* ════════════════ PRODUCT SPOTLIGHT OVERLAY ════════════════ */}
      {spotlightItem && (
        <div style={{
          position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,12,9,.97)', border: '2px solid rgba(201,168,76,.7)',
          borderRadius: 16, padding: '12px 18px', zIndex: 46,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 0 30px rgba(201,168,76,.3)',
          animation: 'fadeSlideIn .35s ease',
          pointerEvents: 'all',
          maxWidth: 280,
        }}>
          <span style={{ fontSize: 36, flexShrink: 0 }}>{spotlightItem.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 2, marginBottom: 2 }}>🛒 FEATURED PRODUCT</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, lineHeight: 1.2 }}>{spotlightItem.name}</div>
            {spotlightItem.price && <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, letterSpacing: 1 }}>{spotlightItem.price}</div>}
          </div>
          {spotlightItem.url ? (
            <a href={spotlightItem.url} target="_blank" rel="noopener noreferrer"
              style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: BG, cursor: 'pointer', letterSpacing: 1, textDecoration: 'none', flexShrink: 0 }}>
              BUY NOW
            </a>
          ) : (
            <button onClick={function() { if (addToast) addToast('Check with the host for purchase details!', 'info'); }}
              style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: BG, cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
              TAP TO BUY
            </button>
          )}
          <button onClick={function() { setSpotlightItem(null); }} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* ════════════════ FOLLOW ALERTS ════════════════ */}
      <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 55, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', pointerEvents: 'none', minWidth: 0 }}>
        {followAlerts.map(function(fa) {
          return (
            <div key={fa.id} style={{
              background: 'linear-gradient(135deg,rgba(128,0,32,.95),rgba(36,28,18,.95))',
              border: '1.5px solid rgba(201,168,76,.7)',
              borderRadius: 999, padding: '8px 20px',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeSlideIn .4s ease',
              boxShadow: '0 0 24px rgba(201,168,76,.3)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 18 }}>🎉</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 2 }}>
                {fa.username}
              </span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEXT, letterSpacing: 1 }}>
                just followed!
              </span>
              <span style={{ fontSize: 18 }}>🎉</span>
            </div>
          );
        })}
      </div>

      {/* ════════════════ CROWD GOING WILD ════════════════ */}
      {crowdWildBanner && (
        <div style={{
          position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,rgba(128,0,32,.97),rgba(36,28,18,.95))',
          border: '2px solid rgba(201,168,76,.8)', borderRadius: 999,
          padding: '10px 28px', zIndex: 56, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'legendBurst .4s ease',
          boxShadow: '0 0 40px rgba(201,168,76,.4)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: GOLD, letterSpacing: 4 }}>THE CROWD IS WILD!</span>
          <span style={{ fontSize: 22 }}>🔥</span>
        </div>
      )}

      {/* ════════════════ HOT MOMENT FLASH ════════════════ */}
      {hotMomentFlash && (
        <div style={{
          position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,12,9,.96)', border: '1.5px solid rgba(255,160,0,.8)',
          borderRadius: 999, padding: '7px 20px', zIndex: 56, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'comboPop .3s ease',
          boxShadow: '0 0 24px rgba(255,160,0,.3)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#FFA500', letterSpacing: 3 }}>
            HOT MOMENT  ×{hotMomentFlash.count}
          </span>
          <span style={{ fontSize: 18 }}>⚡</span>
        </div>
      )}

      {/* ════════════════ PANEL REACTION BAR ════════════════ */}
      <div style={{ position: 'absolute', bottom: 82, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <PanelReactionBar socket={socket} roomId={roomId} userId={userId} />
      </div>

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
          {['❤️','🔥','👏','😂','💯','🎉','👑','💰'].map(function(e) {
            return (
              <button key={e} onClick={function() { sendReact(e); }}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '2px 3px', borderRadius: 8, transition: 'transform .1s' }}>
                {e}
              </button>
            );
          })}
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
          {/* Chat theme accent */}
          {chatTheme && (
            <div style={{ height: 3, background: chatTheme === 'party' ? 'linear-gradient(90deg,#FF1A3C,#FF8C00,#FFD700,#00CC66,#00BFFF,#A855F7)' : chatTheme === 'chill' ? '#00BFFF' : chatTheme === 'sports' ? '#22C55E' : chatTheme === 'gaming' ? '#A855F7' : '#C9A84C', flexShrink: 0 }} />
          )}
          {/* Chat header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: TEXT, letterSpacing: .3 }}>
              Chat{chatTheme && <span style={{ marginLeft: 6, fontSize: 12 }}>{chatTheme === 'party' ? '🎉' : chatTheme === 'chill' ? '☁️' : chatTheme === 'sports' ? '🏆' : chatTheme === 'gaming' ? '🎮' : '📰'}</span>}
            </span>
            <button onClick={function() { setChatOpen(false); }}
              style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
          </div>
          {/* Pinned announcement banner */}
          {pinnedAnnouncement && (
            <div style={{ padding: '7px 14px', borderBottom: '1px solid ' + BORDER, background: 'linear-gradient(90deg,rgba(128,0,32,.35),rgba(201,168,76,.08))', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📢</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 13, color: TEXT, flex: 1, lineHeight: 1.3 }}>{pinnedAnnouncement.text}</span>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() {
                  setPinnedAnnouncement(null);
                  if (socket) socket.emit('pin-announcement', { roomId: roomId, text: null });
                }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', flexShrink: 0, padding: 0 }}>✕</button>
              )}
            </div>
          )}
          {/* Pinned message */}
          {pinnedMsg && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid ' + BORDER, background: 'rgba(201,168,76,.07)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📌</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1 }}>PINNED</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: gold }}>{pinnedMsg.username}</span>
                </div>
                <p style={{ fontSize: 12, color: TEXT, margin: '2px 0 0', lineHeight: 1.4 }}>{pinnedMsg.message}</p>
              </div>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() { if (socket) socket.emit('chat-unpin', { roomId: roomId }); }}
                  style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, flexShrink: 0, padding: 0 }}>✕</button>
              )}
            </div>
          )}
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {(!chat || chat.length === 0) && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No messages yet</div>
            )}
            {chat && chat.map(function(m, i) {
              var canMod = (role === 'host' || role === 'cohost') && m.id;
              if (m.type === 'super') {
                var scColor = m.tierColor || '#C9A84C';
                var scDollars = '$' + (Math.floor(m.amountCents || 0) / 100).toFixed(2);
                return (
                  <div key={m.id || i} style={{ marginBottom: 12, background: scColor + '18', border: '1.5px solid ' + scColor + '66', borderRadius: 12, padding: '10px 12px', animation: 'fadeSlideIn .2s ease', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>💬</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: scColor, letterSpacing: 1 }}>{scDollars} SUPER CHAT</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: scColor, opacity: .8 }}>from {m.username}</span>
                    </div>
                    <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45, fontWeight: 600 }}>{m.message}</p>
                    {canMod && <button onClick={function() { if (socket) socket.emit('chat-delete', { roomId: roomId, msgId: m.id }); }} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 11, opacity: .6 }} title="Delete message">🗑</button>}
                  </div>
                );
              }
              var roleBadge = m.role === 'host'   ? { label: '👑 HOST',    color: GOLD } :
                              m.role === 'cohost' ? { label: '🎯 CO-HOST', color: TEAL } :
                              m.role === 'mod'    ? { label: '🛡 MOD',     color: '#60A5FA' } :
                              m.role === 'vip'    ? { label: '💎 VIP',     color: '#A855F7' } :
                              m.role === 'sub'    ? { label: '⭐ SUB',     color: '#22C55E' } :
                              m.role === 'guest'  ? { label: '🎤 GUEST',   color: TEAL } :
                              m.role === 'system' ? { label: '📢',         color: GOLD } : null;
              var userColor = m.role === 'host' ? GOLD : m.role === 'cohost' ? TEAL : m.role === 'vip' ? '#A855F7' : m.role === 'sub' ? '#22C55E' : (chatColors[m.userId] || m.nameColor || gold);
              return (
                <div key={m.id || i} style={{ marginBottom: 12, animation: 'fadeSlideIn .2s ease', position: 'relative', paddingRight: canMod ? 38 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                    {roleBadge && (
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: roleBadge.color, background: roleBadge.color + '18', border: '1px solid ' + roleBadge.color + '44', borderRadius: 3, padding: '1px 4px', letterSpacing: .5, flexShrink: 0 }}>
                        {roleBadge.label}
                      </span>
                    )}
                    {m.isSuperFan && (
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#F59E0B', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.35)', borderRadius: 3, padding: '1px 4px', letterSpacing: .5, flexShrink: 0 }}>🏆 SUPERFAN</span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 13, color: userColor }}>{m.username || 'Guest'}</span>
                    {m.ts && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED }}>
                      {new Date(m.ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>}
                  </div>
                  <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.45, background: chatKeyword && m.message && m.message.toLowerCase().includes(chatKeyword.toLowerCase()) ? 'rgba(201,168,76,.12)' : 'transparent', borderRadius: chatKeyword && m.message && m.message.toLowerCase().includes(chatKeyword.toLowerCase()) ? 4 : 0, padding: chatKeyword && m.message && m.message.toLowerCase().includes(chatKeyword.toLowerCase()) ? '1px 4px' : 0 }}>
                    {(function() {
                      var parts = m.message ? m.message.split(/(@\S+)/g) : [m.message || ''];
                      return parts.map(function(part, pi) {
                        return /^@\S+/.test(part)
                          ? <span key={pi} style={{ color: GOLD, fontWeight: 700 }}>{part}</span>
                          : part;
                      });
                    })()}
                  </p>
                  {m.translated && m.translated !== m.message && (
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, margin: '2px 0 0', fontStyle: 'italic' }}>
                      {m.lang && m.lang !== 'EN' && (
                        <span style={{ display: 'inline-block', background: TEAL + '33', border: '1px solid ' + TEAL + '66', borderRadius: 3, padding: '0 4px', fontSize: 7, color: TEAL, marginRight: 4, verticalAlign: 'middle', letterSpacing: .5 }}>
                          {m.lang}
                        </span>
                      )}
                      {m.translated}
                    </p>
                  )}
                  {canMod && m.role !== 'system' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={function() { if (socket) socket.emit('chat-pin', { roomId: roomId, msg: m }); setChatOpen(true); }}
                        style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 11, opacity: .7, lineHeight: 1 }} title="Pin message">📌</button>
                      <button onClick={function() { if (socket) socket.emit('chat-delete', { roomId: roomId, msgId: m.id }); }}
                        style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 11, opacity: .6, lineHeight: 1 }} title="Delete message">🗑</button>
                      {m.role !== 'host' && m.role !== 'cohost' && m.userId && (
                        <button onClick={function() {
                          var isBanned = chatBannedIds[m.userId];
                          if (isBanned) {
                            if (socket) socket.emit('chat-unban', { roomId: roomId, userId: m.userId, username: m.username });
                          } else {
                            if (socket) socket.emit('chat-ban', { roomId: roomId, userId: m.userId, username: m.username });
                          }
                        }} style={{ background: 'none', border: 'none', color: chatBannedIds[m.userId] ? TEAL : RED, cursor: 'pointer', fontSize: 11, opacity: .7, lineHeight: 1 }} title={chatBannedIds[m.userId] ? 'Unban from chat' : 'Ban from chat'}>
                          {chatBannedIds[m.userId] ? '✅' : '🚫'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          {/* Slow mode indicator */}
          {slowMode > 0 && (
            <div style={{ padding: '3px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11 }}>🐢</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>SLOW MODE · {slowMode}s</span>
            </div>
          )}
          {/* Quick gift presets for viewers */}
          {role !== 'host' && role !== 'cohost' && (
            <div style={{ padding: '3px 12px 2px', display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <button onClick={function() {
                if (!socket) return;
                socket.emit('follow-trigger', { roomId: roomId, username: username });
                if (addToast) addToast('❤️ You followed this stream!', 'success');
              }} style={{
                background: 'linear-gradient(135deg,rgba(128,0,32,.85),rgba(80,0,18,.85))', border: '1px solid rgba(201,168,76,.4)', borderRadius: 999, padding: '3px 9px',
                fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: GOLD, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              }}>
                ❤️ Follow
              </button>
              {tipLeader.length > 0 && (
                <button onClick={function() { setShowTopFans(function(s) { return !s; }); }} style={{
                  background: showTopFans ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid rgba(201,168,76,' + (showTopFans ? '.5' : '.2)'), borderRadius: 999, padding: '3px 9px',
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: showTopFans ? GOLD : MUTED, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  👑 Top Fans
                </button>
              )}
              {!myRating && isLive && (
                <button onClick={function() { setShowRateStream(true); }} style={{
                  background: CARD2, border: '1px solid rgba(201,168,76,.2)', borderRadius: 999, padding: '3px 9px',
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: MUTED, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  ⭐ Rate
                </button>
              )}
              {pointBalance > 0 && (
                <button onClick={function() { setShowRedeemPanel(true); }} style={{
                  background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 999, padding: '3px 9px',
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: GOLD, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  🎁 {pointBalance} pts
                </button>
              )}
              {[{l:'💛 $1',c:100},{l:'🧡 $5',c:500},{l:'❤️ $10',c:1000},{l:'💜 $25',c:2500}].map(function(p) {
                return (
                  <button key={p.l} onClick={function() {
                    if (!socket) return;
                    socket.emit('super-chat', { roomId: roomId, userId: userId, username: username, message: '💝', amountCents: p.c });
                    if (addToast) addToast(p.l + ' Super Chat sent!', 'success');
                  }} style={{
                    background: CARD2, border: '1px solid ' + BORDER, borderRadius: 999, padding: '3px 9px',
                    fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, color: GOLD, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                  }}>
                    {p.l}
                  </button>
                );
              })}
            </div>
          )}
          {/* Input */}
          {emojiMode ? (
            <div style={{ padding: '6px 12px 8px', borderTop: '1px solid ' + BORDER, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 1 }}>⚡ EMOJI BURST MODE</span>
                <button onClick={function() { setEmojiMode(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 11, cursor: 'pointer' }}>✕ Text</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['❤️','🔥','😂','😮','👏','💯','🙌','✨','😍','🎉','💪','👀','🤯','🥹','😭','💀'].map(function(em) {
                  return (
                    <button key={em} onClick={function() { sendReact(em); }} style={{
                      background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '5px 8px',
                      fontSize: 18, cursor: 'pointer', lineHeight: 1,
                    }}>
                      {em}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 12px', borderTop: '1px solid ' + BORDER, display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={function() { setEmojiMode(true); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: 0 }} title="Emoji burst mode">⚡</button>
              <input
                value={chatInput}
                onChange={function(e) { setChatInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
                placeholder="Say something..."
                style={{
                  flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 999,
                  padding: '9px 16px', fontSize: 13, color: TEXT, outline: 'none',
                  fontFamily: "'Barlow Condensed',sans-serif",
                }}
              />
              <button onClick={sendChat} style={{
                background: gold, border: 'none', borderRadius: 999,
                padding: '9px 18px', fontWeight: 700, fontSize: 13, color: BG, cursor: 'pointer',
              }}>
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ GO-LIVE MODAL ════════════════ */}
      {showLiveModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 70, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: TEXT, marginBottom: 6 }}>Go Live</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 20 }}>Start broadcasting to your audience</div>
            <button onClick={goLive} style={{ width: '100%', background: RED, border: 'none', borderRadius: 12, padding: '14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#fff', cursor: 'pointer', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>▶</span> START BROADCAST
            </button>
            <button onClick={function() { setShowLiveModal(false); }} style={{ width: '100%', background: 'transparent', border: 'none', marginTop: 12, padding: '12px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, color: MUTED, cursor: 'pointer' }}>
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
              if (setStreamGoal) setStreamGoal({ label: goalDraft.label.trim(), goalCents: Math.floor(amt * 100) });
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

      {/* ════════════════ PRODUCT SPOTLIGHT PICKER (host) ════════════════ */}
      {showSpotlightPick && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER, maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🛒 Product Spotlight</div>
              <button onClick={function() { setShowSpotlightPick(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 16 }}>Pin a product card for 30 seconds — all viewers see a "Buy Now" overlay.</div>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={spEmoji} onChange={function(e) { setSpEmoji(e.target.value); }} maxLength={2}
                  style={{ width: 50, background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, textAlign: 'center', outline: 'none' }} />
                <input value={spName} onChange={function(e) { setSpName(e.target.value); }} maxLength={40} placeholder="Product name"
                  style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 16, outline: 'none' }} />
              </div>
              <input value={spPrice} onChange={function(e) { setSpPrice(e.target.value); }} maxLength={20} placeholder="Price (e.g. $29.99) — optional"
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, outline: 'none', marginBottom: 10, letterSpacing: 1 }} />
              <input value={spUrl} onChange={function(e) { setSpUrl(e.target.value); }} maxLength={200} placeholder="Buy link URL — optional"
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 11, outline: 'none', marginBottom: 16 }} />
              {spotlightItem && (
                <button onClick={function() { if (socket) socket.emit('product-spotlight', { roomId: roomId, item: null }); setShowSpotlightPick(false); }}
                  style={{ width: '100%', background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 12, padding: '11px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: RED, cursor: 'pointer', letterSpacing: 1, marginBottom: 8 }}>
                  CLEAR CURRENT SPOTLIGHT
                </button>
              )}
              <button onClick={function() {
                if (!spName.trim()) { if (addToast) addToast('Enter a product name', 'error'); return; }
                if (socket) socket.emit('product-spotlight', { roomId: roomId, item: { name: spName.trim(), emoji: spEmoji, price: spPrice.trim(), url: spUrl.trim() } });
                setShowSpotlightPick(false);
                if (addToast) addToast('🛒 Product spotlight active for 30 seconds!', 'success');
              }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                🛒 SPOTLIGHT FOR 30s
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SCHEDULED ANNOUNCEMENT MODAL (host) ════════════ */}
      {showAnnounce && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 72, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>📢 Scheduled Announcement</div>
              <button onClick={function() { setShowAnnounce(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 16 }}>Fires as a system chat message after the delay. Viewers see it as "📢 Announcement".</div>
            <textarea
              value={announceMsg}
              onChange={function(e) { setAnnounceMsg(e.target.value); }}
              maxLength={300}
              placeholder="Type your announcement..."
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, outline: 'none', marginBottom: 10, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, flexShrink: 0 }}>Delay (min):</span>
              <input type="number" min="0.1" max="60" step="0.5" value={announceDelay} onChange={function(e) { setAnnounceDelay(e.target.value); }}
                style={{ width: 80, background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '8px 12px', color: TEXT, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, outline: 'none', letterSpacing: 1, textAlign: 'center' }} />
            </div>
            <button onClick={scheduleAnnounce}
              style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2, marginBottom: pending.length > 0 ? 16 : 0 }}>
              SCHEDULE ANNOUNCEMENT
            </button>
            {pending.length > 0 && (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 8 }}>PENDING ({pending.length})</div>
                {pending.map(function(p) {
                  var mins = Math.max(0, Math.round((p.firesAt - Date.now()) / 60000));
                  return (
                    <div key={p.announceId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '8px 12px', marginBottom: 6 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, flexShrink: 0 }}>~{mins}m</span>
                      <span style={{ flex: 1, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.message}</span>
                      <button onClick={function() { cancelAnnounce(p.announceId); }}
                        style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 6, padding: '3px 8px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 7, cursor: 'pointer' }}>
                        CANCEL
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: isSuper ? '#C9A84C' : (chatColors[msg.userId] || msg.nameColor || '#8A7A62') }}>
                        {msg.username}
                        {isSuper && <span style={{ color: '#C9A84C', marginLeft: 4 }}>💛 ${(Math.floor(msg.amountCents || 0) / 100).toFixed(2)}</span>}
                        {vips.indexOf(msg.userId) !== -1 && <span style={{ marginLeft: 4, fontSize: 8, color: '#A855F7', fontWeight: 700 }}>💎VIP</span>}
                        {fanClub.indexOf(msg.userId) !== -1 && <span style={{ marginLeft: 4, fontSize: 8, color: '#F472B6', fontWeight: 700 }}>❤️FAN</span>}
                        {(function() {
                          var tl = tipLeader.find(function(e) { return e.username === msg.username; });
                          if (!tl) return null;
                          var cents = tl.totalCents || 0;
                          var rank = cents >= 10000 ? { label: '💎', color: '#00BFFF' } : cents >= 5000 ? { label: '🥇', color: '#FFD700' } : cents >= 1000 ? { label: '🥈', color: '#C0C0C0' } : cents >= 200 ? { label: '🥉', color: '#CD7F32' } : null;
                          return rank ? <span style={{ marginLeft: 4, fontSize: 8, color: rank.color, fontWeight: 700 }}>{rank.label}GIFTER</span> : null;
                        })()}
                        {(function() {
                          var tier = colorTiers[msg.userId];
                          var tierMeta = { bronze: { emoji: '🥉', color: '#CD7F32' }, silver: { emoji: '🥈', color: '#C0C0C0' }, gold: { emoji: '🥇', color: '#FFD700' }, platinum: { emoji: '💎', color: '#00BFFF' } };
                          return tier && tierMeta[tier] ? <span style={{ marginLeft: 3, fontSize: 8 }}>{tierMeta[tier].emoji}</span> : null;
                        })()}
                        {(function() {
                          var badges = userBadges[msg.userId] || (msg.userId === userId ? myBadges : []);
                          return badges.length > 0 ? (
                            <span style={{ marginLeft: 4, display: 'inline-flex', gap: 1 }}>
                              {badges.slice(0, 4).map(function(b, bi) { return <span key={bi} style={{ fontSize: 9 }}>{b}</span>; })}
                            </span>
                          ) : null;
                        })()}
                      </span>
                      {nameTags[msg.userId] && (
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: MUTED, marginBottom: 1, fontStyle: 'italic', letterSpacing: .2 }}>{nameTags[msg.userId]}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#F0E8D4', lineHeight: 1.3, flex: 1 }}>{msg.message}</span>
                        <button onClick={function() {
                          if (socket && msg.id) socket.emit('chat-star', { roomId: roomId, msgId: msg.id, message: msg.message, username: msg.username });
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A7A62', fontSize: 10, padding: '0 2px', flexShrink: 0, lineHeight: 1.3 }}>
                          ⭐
                        </button>
                      </div>
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
          <IconBtn
            icon={hotPressed ? '✅' : '⚡'}
            label="Hot!"
            active={hotPressed}
            onPress={sendHotMoment}
          />
          {role === 'viewer' && (
            <IconBtn
              icon={joinRequested ? '⏳' : '🎤'}
              label={joinRequested ? 'Pending' : 'Join Stage'}
              active={joinRequested}
              activeColor={gold}
              onPress={requestJoinStage}
            />
          )}
          {role !== 'viewer' && (
            <IconBtn
              icon="✋"
              label="Hand"
              active={handRaised}
              activeColor={gold}
              onPress={raiseHand}
            />
          )}
          {role === 'guest' && (
            <IconBtn
              icon="✨"
              label="Spotlight"
              active={false}
              onPress={function() {
                if (socket) socket.emit('spotlight-request', { roomId: roomId, guestId: userId, username: username });
                if (addToast) addToast('✨ Spotlight request sent to host!', 'info');
              }}
            />
          )}
          <IconBtn
            icon={isMuted ? '🔇' : '🎙'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            danger={true}
            onPress={toggleMute}
          />
          <IconBtn
            icon="❓"
            label="Q&A"
            active={showQa}
            badge={qaQueue.length > 0 && !showQa ? qaQueue.length : 0}
            onPress={function() { setShowQa(function(v) { return !v; }); setChatOpen(false); }}
          />
          <IconBtn
            icon="⚙"
            label="Camera"
            active={showMediaConf}
            onPress={function() { setShowMediaConf(function(v) { return !v; }); }}
          />
          {(role === 'host' || role === 'cohost') && (
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
            icon="CC"
            label="Captions"
            active={showCaptions || captionsEnabled}
            activeColor={TEAL}
            onPress={function() {
              setShowCaptions(function(v) { return !v; });
              if (role === 'host' || role === 'cohost') setCaptionsEnabled(function(v) { return !v; });
            }}
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

      {showLeader && tipLeader.length > 0 && (
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

          {/* Pinned Q&A question */}
          {pinnedQa && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid ' + BORDER, background: 'rgba(201,168,76,.06)', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>📌</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1, marginBottom: 2 }}>PINNED QUESTION</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: GOLD }}>{pinnedQa.username}</div>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{pinnedQa.text}</div>
              </div>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() { setPinnedQa(null); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 13, flexShrink: 0, padding: 0 }}>✕</button>
              )}
            </div>
          )}
          {/* Q list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch' }}>
            {qaQueue.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No questions yet — be the first!</div>
            )}
            {qaQueue.map(function(item) {
              var isPinned   = pinnedQa && pinnedQa.id === item.id;
              var qAnswer    = qaAnswers[item.id];
              var isAnswering = qaAnswerTarget === item.id;
              return (
                <div key={item.id} style={{ marginBottom: 10, background: isPinned ? 'rgba(201,168,76,.1)' : CARD, border: isPinned ? '1px solid rgba(201,168,76,.35)' : '1px solid transparent', borderRadius: 10, padding: '10px 12px', animation: 'qaIn .2s ease' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
                        <button onClick={function() { setPinnedQa(isPinned ? null : item); }}
                          style={{ background: 'none', border: 'none', color: isPinned ? GOLD : MUTED, fontSize: 10, cursor: 'pointer', padding: '2px 4px' }} title="Pin question">📌</button>
                      )}
                      {role === 'host' && (
                        <button onClick={function() { setQaAnswerTarget(isAnswering ? null : item.id); setQaAnswerDraft(''); }}
                          style={{ background: isAnswering ? 'rgba(201,168,76,.2)' : 'none', border: isAnswering ? '1px solid rgba(201,168,76,.4)' : 'none', color: isAnswering ? GOLD : TEAL, fontSize: 10, cursor: 'pointer', borderRadius: 4, padding: '2px 4px' }} title="Answer">💬</button>
                      )}
                      {role === 'host' && (
                        <button onClick={function() { if (socket) socket.emit('qa-dismiss', { roomId: roomId, id: item.id }); setQaQueue(function(q) { return q.filter(function(x) { return x.id !== item.id; }); }); if (isPinned) setPinnedQa(null); }}
                          style={{ background: 'none', border: 'none', color: MUTED, fontSize: 10, cursor: 'pointer', padding: '2px 4px' }}>✕</button>
                      )}
                    </div>
                  </div>
                  {/* Host answer input */}
                  {isAnswering && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <input value={qaAnswerDraft} onChange={function(e) { setQaAnswerDraft(e.target.value.slice(0, 300)); }}
                        placeholder="Type your answer…"
                        style={{ flex: 1, background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px 11px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
                      <button onClick={function() {
                        var ans = qaAnswerDraft.trim();
                        if (!ans) return;
                        if (socket) socket.emit('qa-answer', { roomId: roomId, id: item.id, answer: ans });
                        setQaAnswerTarget(null); setQaAnswerDraft('');
                      }} style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '7px 12px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: BG, cursor: 'pointer', letterSpacing: 1 }}>POST</button>
                    </div>
                  )}
                  {/* Pinned answer display */}
                  {qAnswer && (
                    <div style={{ marginTop: 8, background: 'rgba(212,133,74,.1)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 8, padding: '7px 10px' }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, marginBottom: 3 }}>💬 {qAnswer.by}</div>
                      <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{qAnswer.answer}</div>
                    </div>
                  )}
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

        function renderPayRow(p, handle, accentColor) {
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

        function sendSuperChat() {
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
        var roomUrl = window.location.origin + (roomId !== '6990f5f24823b53e21fcdc9d' ? ('?room=' + roomId) : '');
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
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, color: TEXT }}>{g.username || gid}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                    <RolePill role={g.role || (isOwn ? role : 'guest')} />
                    {isSp && <SpeakBars color={TEAL} />}
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
                  if (socket) socket.emit('room-paywall', { roomId: roomId, enabled: next, priceCents: cents });
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

      {/* ════════════════ TOP FANS LEADERBOARD (overlay) ════════════════ */}
      {topFans.length > 0 && (
        <div style={{ position: 'absolute', left: 8, bottom: 92, zIndex: 55, width: 158, background: 'rgba(14,12,9,.88)', border: '1px solid rgba(201,168,76,.22)', borderRadius: 10, padding: '8px 10px', backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 2, marginBottom: 6 }}>🏆 TOP FANS</div>
          {topFans.slice(0, 5).map(function(f, i) {
            return (
              <div key={f.userId || i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: i < topFans.length - 1 ? 3 : 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: i === 0 ? GOLD : MUTED, width: 10, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.username}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, flexShrink: 0 }}>{f.score}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ STREAM TITLE EDIT MODAL (host) ════════════════ */}
      {showTitleEdit && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowTitleEdit(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>✏️ Stream Title</div>
              <button onClick={function() { setShowTitleEdit(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <input
              value={titleInput}
              onChange={function(e) { setTitleInput(e.target.value.slice(0, 120)); }}
              onKeyDown={function(e) {
                if (e.key === 'Enter' && titleInput.trim()) {
                  if (socket) socket.emit('stream-info', { roomId: roomId, title: titleInput.trim() });
                  setLocalStreamTitle(titleInput.trim());
                  setShowTitleEdit(false);
                  if (addToast) addToast('✏️ Title updated!', 'success');
                }
              }}
              placeholder="Stream title (max 120 chars)..."
              maxLength={120}
              style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 6, marginBottom: 14 }}>{titleInput.length}/120 — broadcasts to all viewers in real time</div>
            <button onClick={function() {
              if (!titleInput.trim()) return;
              if (socket) socket.emit('stream-info', { roomId: roomId, title: titleInput.trim() });
              setLocalStreamTitle(titleInput.trim());
              setShowTitleEdit(false);
              if (addToast) addToast('✏️ Title updated!', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
              UPDATE TITLE
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ BANNED WORDS MODAL (host) ════════════════ */}
      {showBannedWords && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowBannedWords(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🚫 Chat Word Filter</div>
              <button onClick={function() { setShowBannedWords(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14 }}>Messages containing these words are blocked before they appear. Case-insensitive.</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={newBanWord}
                onChange={function(e) { setNewBanWord(e.target.value.toLowerCase()); }}
                onKeyDown={function(e) {
                  if (e.key === 'Enter') {
                    var w = newBanWord.trim();
                    if (!w || bannedWords.includes(w)) { setNewBanWord(''); return; }
                    var updated = bannedWords.concat([w]);
                    setBannedWords(updated);
                    if (socket) socket.emit('set-banned-words', { roomId: roomId, words: updated });
                    setNewBanWord('');
                  }
                }}
                placeholder="Add word or phrase..."
                style={{ flex: 1, background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
              />
              <button onClick={function() {
                var w = newBanWord.trim();
                if (!w || bannedWords.includes(w)) { setNewBanWord(''); return; }
                var updated = bannedWords.concat([w]);
                setBannedWords(updated);
                if (socket) socket.emit('set-banned-words', { roomId: roomId, words: updated });
                setNewBanWord('');
              }} style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: BG, cursor: 'pointer', flexShrink: 0 }}>
                ADD
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {bannedWords.map(function(w) {
                return (
                  <div key={w} style={{ background: CARD2, border: '1px solid rgba(255,26,60,.3)', borderRadius: 999, padding: '3px 10px 3px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEXT }}>{w}</span>
                    <button onClick={function() {
                      var updated = bannedWords.filter(function(x) { return x !== w; });
                      setBannedWords(updated);
                      if (socket) socket.emit('set-banned-words', { roomId: roomId, words: updated });
                    }} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                  </div>
                );
              })}
              {bannedWords.length === 0 && (
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>No words filtered yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MILESTONE CELEBRATION OVERLAY ════════════════ */}
      {milestoneOverlay && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', animation: 'fadeSlideIn .3s ease' }}>
          <div style={{ textAlign: 'center', background: 'rgba(14,12,9,.82)', border: '2px solid ' + GOLD, borderRadius: 20, padding: '28px 40px', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>{milestoneOverlay.count >= 1000 ? '🔥' : '🎉'}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: GOLD, letterSpacing: 4, lineHeight: 1 }}>{milestoneOverlay.count.toLocaleString()}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEXT, letterSpacing: 2, marginTop: 4 }}>VIEWERS</div>
          </div>
        </div>
      )}

      {/* ════════════════ SLOW MODE SETTER MODAL (host) ════════════════ */}
      {showSlowMode && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowSlowMode(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🐢 Slow Mode</div>
              <button onClick={function() { setShowSlowMode(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 18 }}>Viewers must wait the set number of seconds between chat messages.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
              {[0, 3, 5, 10, 15, 30, 60, 120].map(function(s) {
                return (
                  <button key={s} onClick={function() {
                    setSlowMode(s);
                    if (socket) socket.emit('set-slow-mode', { roomId: roomId, seconds: s });
                    setShowSlowMode(false);
                    if (addToast) addToast(s > 0 ? ('🐢 Slow mode: ' + s + 's') : '💬 Slow mode off', 'success');
                  }} style={{
                    background: slowMode === s ? 'rgba(201,168,76,.2)' : CARD2,
                    border: '1px solid ' + (slowMode === s ? GOLD : BORDER),
                    borderRadius: 10, padding: '10px 4px',
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: slowMode === s ? GOLD : TEXT, cursor: 'pointer', letterSpacing: 1,
                  }}>
                    {s === 0 ? 'OFF' : s + 's'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SPEAKER QUEUE (host overlay) ════════════════ */}
      {(role === 'host' || role === 'cohost') && handQueue.length > 0 && (
        <div style={{ position: 'absolute', right: 8, top: 200, zIndex: 56, width: 170, background: 'rgba(14,12,9,.88)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 10, padding: '8px 10px', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, letterSpacing: 2, marginBottom: 6 }}>✋ SPEAKER QUEUE</div>
          {handQueue.slice(0, 8).map(function(h, i) {
            return (
              <div key={h.guestId} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, width: 10, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.username}</span>
                <button onClick={function() {
                  if (socket) {
                    socket.emit('stage-invite', { roomId: roomId, guestId: h.guestId });
                    socket.emit('hand-lower', { roomId: roomId, guestId: h.guestId });
                  }
                }} style={{ background: 'rgba(212,133,74,.2)', border: '1px solid rgba(212,133,74,.4)', borderRadius: 4, padding: '2px 5px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, cursor: 'pointer', flexShrink: 0 }}>
                  ADD
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ SPOTLIGHT REQUEST QUEUE (host) ════════════════ */}
      {(role === 'host' || role === 'cohost') && spotlightRequests.length > 0 && (
        <div style={{ position: 'absolute', right: 8, top: 310, zIndex: 56, width: 170, background: 'rgba(14,12,9,.88)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '8px 10px', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 2, marginBottom: 6 }}>✨ SPOTLIGHT REQUESTS</div>
          {spotlightRequests.slice(0, 5).map(function(req) {
            return (
              <div key={req.guestId} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.username}</span>
                <button onClick={function() {
                  if (socket) socket.emit('set-spotlight', { roomId: roomId, guestId: req.guestId });
                  setSpotlightRequests(function(prev) { return prev.filter(function(r) { return r.guestId !== req.guestId; }); });
                }} style={{ background: GOLD, border: 'none', borderRadius: 5, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                  SPOT
                </button>
                <button onClick={function() {
                  setSpotlightRequests(function(prev) { return prev.filter(function(r) { return r.guestId !== req.guestId; }); });
                }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 11, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ PINNED LINK CTA ════════════════ */}
      {pinnedLink && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 66, zIndex: 58, animation: 'fadeSlideIn .3s ease' }}>
          <a href={pinnedLink.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(135deg,rgba(128,0,32,.9),rgba(80,0,18,.9))',
            border: '1.5px solid ' + GOLD, borderRadius: 999, padding: '7px 16px',
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.5)',
          }}>
            <span style={{ fontSize: 16 }}>{pinnedLink.emoji || '🔗'}</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: GOLD, letterSpacing: .5, whiteSpace: 'nowrap' }}>{pinnedLink.label || 'Visit Link'}</span>
          </a>
          {(role === 'host' || role === 'cohost') && (
            <button onClick={function() { if (socket) socket.emit('pin-link', { roomId: roomId, url: null }); setPinnedLink(null); }}
              style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: CARD, border: '1px solid ' + BORDER, color: MUTED, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
          )}
        </div>
      )}

      {/* ════════════════ VIEWER SHOUTOUT OVERLAY ════════════════ */}
      {shoutout && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 90, zIndex: 80, display: 'flex', justifyContent: 'center', pointerEvents: 'none', animation: 'slideUp .4s ease' }}>
          <div style={{ background: 'linear-gradient(135deg,' + BURG + ',' + '#4A0010)', border: '2px solid ' + GOLD, borderRadius: 16, padding: '14px 24px', maxWidth: 280, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 3, marginBottom: 5 }}>📣 SHOUTOUT</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: TEXT, letterSpacing: 2, lineHeight: 1.1 }}>{shoutout.shoutoutTo}</div>
            {shoutout.message && shoutout.message !== '🎉 ' + shoutout.shoutoutTo + '!' && (
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: GOLD, marginTop: 4, lineHeight: 1.3 }}>{shoutout.message}</div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ GIFT CHAIN BANNER ════════════════ */}
      {giftChain && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 94, zIndex: 82, pointerEvents: 'none', animation: 'fadeSlideIn .25s ease' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.92),rgba(201,168,76,.18))', border: '2px solid ' + GOLD, borderRadius: 999, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(201,168,76,.3)' }}>
            <span style={{ fontSize: 22 }}>{giftChain.emoji}</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: GOLD, letterSpacing: 3 }}>CHAIN x{giftChain.count}!</span>
            <span style={{ fontSize: 18 }}>🔥</span>
          </div>
        </div>
      )}

      {/* ════════════════ PINNED SHOP CARD ════════════════ */}
      {pinnedShopItem && (
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 130, zIndex: 64, animation: 'shopBurst .35s ease' }}>
          <div style={{ background: 'rgba(14,12,9,.9)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,.5)' }}>
            {pinnedShopItem.image ? (
              <img src={pinnedShopItem.image} alt={pinnedShopItem.name} style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(201,168,76,.2)' }} />
            ) : (
              <div style={{ width: 54, height: 54, borderRadius: 10, background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🛍️</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEXT, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pinnedShopItem.name}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, letterSpacing: 1 }}>${((pinnedShopItem.price || 0) / 100).toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button onClick={function() {
                if (!socket) return;
                socket.emit('shop-add-to-cart', { roomId: roomId, itemId: pinnedShopItem.id });
              }} style={{ background: shopCartConfirm === pinnedShopItem.id ? '#22C55E' : 'linear-gradient(135deg,' + GOLD + ',' + TEAL + ')', border: 'none', borderRadius: 10, padding: '7px 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: BG, cursor: 'pointer', letterSpacing: 1, transition: 'background .2s' }}>
                {shopCartConfirm === pinnedShopItem.id ? '✓ ADDED' : 'BUY NOW'}
              </button>
              {pinnedShopItem.url && (
                <a href={pinnedShopItem.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>VIEW DETAILS →</a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ CREATOR GOAL BAR ════════════════ */}
      {creatorGoal && creatorGoal.active && (
        <div style={{ position: 'absolute', left: 10, right: 10, top: 58, zIndex: 55, pointerEvents: 'none', animation: 'fadeSlideIn .25s ease' }}>
          <div style={{ background: 'rgba(14,12,9,.82)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: '8px 12px', backdropFilter: 'blur(6px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, fontWeight: 600 }}>🎯 {creatorGoal.title}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>${((creatorGoal.currentCents || 0) / 100).toFixed(2)} / ${((creatorGoal.targetCents || 0) / 100).toFixed(2)}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,' + BURG + ',' + GOLD + ')', width: Math.min(100, Math.round(((creatorGoal.currentCents || 0) / (creatorGoal.targetCents || 1)) * 100)) + '%', transition: 'width .6s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ GOAL REACHED BANNER ════════════════ */}
      {goalReached && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 80, zIndex: 90, pointerEvents: 'none', animation: 'shopBurst .35s ease' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.92),rgba(201,168,76,.25))', border: '2px solid ' + GOLD, borderRadius: 999, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 28px rgba(201,168,76,.4)', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD, letterSpacing: 3 }}>GOAL REACHED!</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT }}>{goalReached.title}</span>
          </div>
        </div>
      )}

      {/* ════════════════ ACTIVE CHALLENGE BAR ════════════════ */}
      {activeChallenge && activeChallenge.active && (
        <div style={{ position: 'absolute', right: 8, bottom: 175, zIndex: 62, minWidth: 150, maxWidth: 190, animation: 'challengeIn .3s ease', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 14, padding: '10px 13px', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>🏆 CHALLENGE</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, fontWeight: 600, lineHeight: 1.2, marginBottom: 7 }}>{activeChallenge.title}</div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,' + TEAL + ',' + GOLD + ')', width: Math.min(100, Math.round(((activeChallenge.progress || 0) / (activeChallenge.goal || 1)) * 100)) + '%', transition: 'width .4s ease' }} />
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{activeChallenge.progress || 0}/{activeChallenge.goal} {activeChallenge.unit}</div>
            {activeChallenge.reward && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, marginTop: 3 }}>🎁 {activeChallenge.reward}</div>}
          </div>
        </div>
      )}

      {/* ════════════════ CHALLENGE COMPLETE BANNER ════════════════ */}
      {challengeComplete && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 100, zIndex: 92, pointerEvents: 'none', animation: 'shopBurst .35s ease', whiteSpace: 'nowrap' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.95),rgba(201,168,76,.3))', border: '2px solid ' + GOLD, borderRadius: 999, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 36px rgba(201,168,76,.5)' }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: GOLD, letterSpacing: 4 }}>CHALLENGE COMPLETE!</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT }}>{challengeComplete.title}</div>
              {challengeComplete.reward && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEAL }}>🎁 {challengeComplete.reward}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SHOP PURCHASE BURST ════════════════ */}
      {shopPurchaseBurst && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 165, zIndex: 63, pointerEvents: 'none', animation: 'shopBurst .3s ease', whiteSpace: 'nowrap' }}>
          <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 999, padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🛍️</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT }}><strong style={{ color: GOLD }}>{shopPurchaseBurst.username}</strong> just bought!</span>
          </div>
        </div>
      )}

      {/* ════════════════ SCHEDULE COUNTDOWN MODAL (host) ════════════════ */}
      {showScheduleSet && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 81, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowScheduleSet(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>⏱️ Pre-Stream Countdown</div>
              <button onClick={function() { setShowScheduleSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <input value={scheduleInput.label} onChange={function(e) { var v = e.target.value.slice(0, 40); setScheduleInput(function(s) { return Object.assign({}, s, { label: v }); }); }} placeholder="Label (e.g. 'Stream starts in')" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <input type="number" min="1" max="60" value={scheduleInput.minutes} onChange={function(e) { var v = Math.min(60, Math.max(1, parseInt(e.target.value) || 1)); setScheduleInput(function(s) { return Object.assign({}, s, { minutes: v }); }); }} placeholder="Minutes" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <button onClick={function() {
              if (socket) socket.emit('stream-countdown', { roomId: roomId, label: scheduleInput.label, minutes: scheduleInput.minutes });
              setShowScheduleSet(false);
              if (addToast) addToast('⏱️ Countdown started: ' + scheduleInput.minutes + ' min', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: 13, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>START COUNTDOWN</button>
          </div>
        </div>
      )}

      {/* ════════════════ STREAM COUNTDOWN OVERLAY ════════════════ */}
      {streamCountdown && countdownSecs > 0 && !isLive && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 70, pointerEvents: 'none', background: 'rgba(14,12,9,.65)', backdropFilter: 'blur(4px)' }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, letterSpacing: 3, marginBottom: 12 }}>{(streamCountdown && streamCountdown.label) || 'STREAM STARTS IN'}</div>
            <div key={countdownSecs} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, color: GOLD, letterSpacing: 6, lineHeight: 1, animation: 'countdownTick .1s ease' }}>
              {Math.floor(countdownSecs / 60)}:{String(countdownSecs % 60).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, marginTop: 12, opacity: .7 }}>Get ready — stream incoming 🔥</div>
          </div>
        </div>
      )}

      {/* ════════════════ SHOUTOUT CARD ════════════════ */}
      {activeShoutout && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 72, zIndex: 88, pointerEvents: 'none', animation: 'shoutoutIn .35s ease', whiteSpace: 'nowrap' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(212,133,74,.18),rgba(14,12,9,.92))', border: '2px solid ' + TEAL, borderRadius: 20, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 36px rgba(212,133,74,.35)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,' + TEAL + ',' + GOLD + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📣</div>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 2, marginBottom: 2 }}>SHOUTOUT</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: TEXT, letterSpacing: 2 }}>@{activeShoutout.username}</div>
              {activeShoutout.reason && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: MUTED }}>{activeShoutout.reason}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ POINTS FLASH ════════════════ */}
      {pointFlash && (
        <div key={pointFlash.ts} style={{ position: 'absolute', right: 14, top: 130, zIndex: 88, pointerEvents: 'none', animation: 'pointFlash 1.8s ease forwards' }}>
          <div style={{ background: 'rgba(14,12,9,.82)', border: '1px solid rgba(201,168,76,.5)', borderRadius: 999, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD }}>+{pointFlash.amount}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>PTS</span>
          </div>
        </div>
      )}

      {/* ════════════════ POINTS BALANCE BADGE ════════════════ */}
      {pointBalance > 0 && role !== 'host' && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 54, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(14,12,9,.82)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10 }}>⭐</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1 }}>{pointBalance.toLocaleString()} PTS</span>
          </div>
        </div>
      )}

      {/* ════════════════ TOP FANS PANEL (visible to all) ════════════════ */}
      {showTopFans && tipLeader.length > 0 && (
        <div style={{ position: 'absolute', left: 8, bottom: 180, zIndex: 64, minWidth: 160, maxWidth: 190, animation: 'statsFadeIn .2s ease' }}>
          <div style={{ background: 'rgba(14,12,9,.92)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 16, padding: '12px 14px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: GOLD, letterSpacing: 2 }}>👑 TOP FANS</span>
              <button onClick={function() { setShowTopFans(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>✕</button>
            </div>
            {tipLeader.slice(0, 5).map(function(e, i) {
              var medals = ['🥇', '🥈', '🥉'];
              var topColors = [GOLD, '#C0C0C0', '#CD7F32'];
              return (
                <div key={e.username} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{medals[i] || (i + 1) + '.'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: topColors[i] || TEXT, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>${((e.totalCents || 0) / 100).toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ RATE STREAM SHEET (viewer) ════════════════ */}
      {showRateStream && !myRating && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'flex-end', zIndex: 84, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowRateStream(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '28px 20px 40px', border: '1px solid ' + BORDER, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: TEXT, letterSpacing: 3, marginBottom: 4 }}>RATE THIS STREAM</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 20 }}>Tap a star to rate the quality</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(function(star) {
                return (
                  <button key={star} onClick={function() {
                    setMyRating(star);
                    if (socket) socket.emit('stream-rating', { roomId: roomId, rating: star });
                    setShowRateStream(false);
                    if (addToast) addToast('⭐ Thanks for rating ' + star + '/5!', 'success');
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, lineHeight: 1, animation: 'starPop .2s ease', color: '#F59E0B' }}>
                    ★
                  </button>
                );
              })}
            </div>
            <button onClick={function() { setShowRateStream(false); }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '10px 28px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: 1 }}>SKIP</button>
          </div>
        </div>
      )}

      {/* ════════════════ AUDIENCE VOTE CARD ════════════════ */}
      {audienceVote && (
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 180, zIndex: 65, animation: 'fadeSlideIn .3s ease' }}>
          <div style={{ background: 'rgba(14,12,9,.9)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 18, padding: '14px 16px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 11, color: GOLD, letterSpacing: 2, marginBottom: 6 }}>🗳️ AUDIENCE VOTE</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEXT, fontWeight: 600, marginBottom: 12 }}>{audienceVote.question}</div>
            {(function() {
              var total = (audienceVote.countA || 0) + (audienceVote.countB || 0);
              var pctA  = total > 0 ? Math.round((audienceVote.countA || 0) / total * 100) : 50;
              var pctB  = 100 - pctA;
              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ side: 'A', label: audienceVote.optA, pct: pctA, count: audienceVote.countA || 0, color: TEAL },
                    { side: 'B', label: audienceVote.optB, pct: pctB, count: audienceVote.countB || 0, color: BURG }].map(function(opt) {
                    var isVoted = myVoteSide === opt.side;
                    return (
                      <button key={opt.side} onClick={function() {
                        if (myVoteSide) return;
                        setMyVoteSide(opt.side);
                        if (socket) socket.emit('audience-vote-cast', { roomId: roomId, side: opt.side });
                      }} style={{ flex: 1, background: isVoted ? opt.color + '33' : CARD2, border: '2px solid ' + (isVoted ? opt.color : BORDER), borderRadius: 14, padding: '10px 8px', cursor: myVoteSide ? 'default' : 'pointer', transition: 'all .15s' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: isVoted ? opt.color : TEXT, letterSpacing: 1, marginBottom: 4 }}>{opt.label}</div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ height: '100%', borderRadius: 999, background: opt.color, width: opt.pct + '%', transition: 'width .4s ease' }} />
                        </div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{opt.pct}% · {opt.count}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ════════════════ AUDIENCE VOTE RESULT ════════════════ */}
      {audienceVoteResult && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 200, zIndex: 66, pointerEvents: 'none', animation: 'shopBurst .35s ease', whiteSpace: 'nowrap' }}>
          <div style={{ background: 'rgba(14,12,9,.9)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 18, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>VOTE RESULTS</div>
              {(function() {
                var total = (audienceVoteResult.countA || 0) + (audienceVoteResult.countB || 0);
                var winnerLabel = (audienceVoteResult.countA || 0) >= (audienceVoteResult.countB || 0) ? audienceVoteResult.optA : audienceVoteResult.optB;
                var pctA = total > 0 ? Math.round((audienceVoteResult.countA || 0) / total * 100) : 50;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: TEAL }}>{audienceVoteResult.optA}: {pctA}%</span>
                    <span style={{ color: MUTED }}>vs</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: BURG }}>{audienceVoteResult.optB}: {100 - pctA}%</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>🏆 {winnerLabel}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ PINNED CLIP CARD ════════════════ */}
      {pinnedClip && (
        <div style={{ position: 'absolute', left: 10, right: 10, top: 64, zIndex: 63, animation: 'fadeSlideIn .25s ease' }}>
          <div style={{ background: 'rgba(14,12,9,.88)', border: '1px solid rgba(212,133,74,.4)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🎬</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pinnedClip.label}</div>
              {pinnedClip.url && <a href={pinnedClip.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, textDecoration: 'none', letterSpacing: 1 }}>WATCH CLIP →</a>}
            </div>
            <button onClick={function() { setPinnedClip(null); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        </div>
      )}

      {/* ════════════════ VOTE CREATE MODAL (host) ════════════════ */}
      {showVoteCreate && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 85, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowVoteCreate(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🗳️ Audience Vote</div>
              <button onClick={function() { setShowVoteCreate(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <input value={voteInput.question} onChange={function(e) { var v = e.target.value.slice(0, 100); setVoteInput(function(s) { return Object.assign({}, s, { question: v }); }); }} placeholder="Question (e.g. 'Should I go longer?')" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={voteInput.optA} onChange={function(e) { var v = e.target.value.slice(0, 30); setVoteInput(function(s) { return Object.assign({}, s, { optA: v }); }); }} placeholder="Option A" style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(212,133,74,.35)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              <input value={voteInput.optB} onChange={function(e) { var v = e.target.value.slice(0, 30); setVoteInput(function(s) { return Object.assign({}, s, { optB: v }); }); }} placeholder="Option B" style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(128,0,32,.5)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <input type="number" min="10" max="300" value={voteInput.durationSec} onChange={function(e) { var v = Math.min(300, Math.max(10, parseInt(e.target.value) || 30)); setVoteInput(function(s) { return Object.assign({}, s, { durationSec: v }); }); }} placeholder="Duration (seconds)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <button onClick={function() {
              var q = voteInput.question.trim();
              if (!q) return;
              if (socket) socket.emit('audience-vote-start', { roomId: roomId, question: q, optA: voteInput.optA || 'YES', optB: voteInput.optB || 'NO', durationSec: voteInput.durationSec });
              setShowVoteCreate(false);
              if (addToast) addToast('🗳️ Audience vote started!', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: 13, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>START VOTE</button>
          </div>
        </div>
      )}

      {/* ════════════════ EMOJI TALLY BAR ════════════════ */}
      {emojiTally.length > 0 && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 78, zIndex: 50, display: 'flex', gap: 8, background: 'rgba(14,12,9,.72)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 999, padding: '4px 12px', backdropFilter: 'blur(6px)', pointerEvents: 'none' }}>
          {emojiTally.slice(0, 5).map(function(e) {
            return (
              <div key={e.emoji} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 14 }}>{e.emoji}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{e.count >= 1000 ? (Math.floor(e.count / 100) / 10) + 'k' : e.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ GIFT LEADERBOARD (visible to all) ════════════════ */}
      {tipLeader.length > 0 && isLive && (
        <div style={{ position: 'absolute', left: 8, top: 78, zIndex: 52, background: 'rgba(14,12,9,.85)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '7px 10px', width: 150, backdropFilter: 'blur(6px)', pointerEvents: 'none' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 2, marginBottom: 5 }}>💰 TOP GIFTERS</div>
          {tipLeader.slice(0, 3).map(function(e, i) {
            var medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={e.username} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: i < 2 ? 3 : 0 }}>
                <span style={{ fontSize: 11, flexShrink: 0 }}>{medals[i]}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, flexShrink: 0 }}>${(Math.floor(e.totalCents) / 100).toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ ROOM TAGS EDITOR (host) ════════════════ */}
      {showTagEdit && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowTagEdit(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🏷️ Room Tags</div>
              <button onClick={function() { setShowTagEdit(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14 }}>Tags help viewers find your stream by topic. Comma-separated, up to 8 tags.</div>
            <input
              value={tagInput}
              onChange={function(e) { setTagInput(e.target.value); }}
              placeholder="music, gaming, talk show, ..."
              style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() {
                var tags = tagInput.split(',').map(function(t) { return t.trim().toLowerCase(); }).filter(function(t) { return t.length > 0; }).slice(0, 8);
                setRoomTags(tags);
                if (socket) socket.emit('set-room-tags', { roomId: roomId, tags: tags });
                setShowTagEdit(false);
                if (addToast) addToast('🏷️ Tags updated!', 'success');
              }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                SAVE TAGS
              </button>
              {roomTags.length > 0 && (
                <button onClick={function() {
                  setRoomTags([]); setTagInput('');
                  if (socket) socket.emit('set-room-tags', { roomId: roomId, tags: [] });
                  setShowTagEdit(false);
                }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '13px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: MUTED, cursor: 'pointer', letterSpacing: 1 }}>
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ PIN LINK MODAL (host) ════════════════ */}
      {showLinkPin && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowLinkPin(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🔗 Pin a Link</div>
              <button onClick={function() { setShowLinkPin(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14 }}>Pins a clickable CTA button on the live stream for all viewers.</div>
            <input value={linkEmoji} onChange={function(e) { setLinkEmoji(e.target.value.slice(0, 4)); }} placeholder="Emoji" style={{ width: 48, background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '9px', color: TEXT, fontFamily: 'sans-serif', fontSize: 18, outline: 'none', textAlign: 'center', marginBottom: 10 }} />
            <input value={linkLabel} onChange={function(e) { setLinkLabel(e.target.value.slice(0, 40)); }} placeholder="Button label (e.g. Shop Now)" style={{ width: '100%', background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
            <input value={linkUrl} onChange={function(e) { setLinkUrl(e.target.value.slice(0, 300)); }} placeholder="https://..." style={{ width: '100%', background: CARD2, border: '1px solid ' + DIM, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() {
                if (!linkUrl.trim()) return;
                var link = { url: linkUrl.trim(), label: linkLabel.trim() || 'Visit Link', emoji: linkEmoji || '🔗' };
                if (socket) socket.emit('pin-link', { roomId: roomId, url: link.url, label: link.label, emoji: link.emoji });
                setPinnedLink(link);
                setShowLinkPin(false);
                if (addToast) addToast('🔗 Link pinned!', 'success');
              }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                PIN LINK
              </button>
              {pinnedLink && (
                <button onClick={function() {
                  if (socket) socket.emit('pin-link', { roomId: roomId, url: null });
                  setPinnedLink(null); setShowLinkPin(false);
                  if (addToast) addToast('Link unpinned', 'info');
                }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '13px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: MUTED, cursor: 'pointer', letterSpacing: 1 }}>
                  UNPIN
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SHOUTOUT MODAL (host) ════════════════ */}
      {showShoutout && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowShoutout(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>📣 Viewer Shoutout</div>
              <button onClick={function() { setShowShoutout(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14 }}>Call out a viewer — their name pops up on screen for everyone for 5 seconds.</div>
            <input
              value={shoutoutTarget}
              onChange={function(e) { setShoutoutTarget(e.target.value.slice(0, 60)); }}
              onKeyDown={function(e) {
                if (e.key === 'Enter' && shoutoutTarget.trim()) {
                  if (socket) socket.emit('viewer-shoutout', { roomId: roomId, shoutoutTo: shoutoutTarget.trim() });
                  setShowShoutout(false);
                  if (addToast) addToast('📣 Shoutout sent!', 'success');
                }
              }}
              placeholder="Viewer username..."
              style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
            />
            <button onClick={function() {
              if (!shoutoutTarget.trim()) return;
              if (socket) socket.emit('viewer-shoutout', { roomId: roomId, shoutoutTo: shoutoutTarget.trim() });
              setShowShoutout(false);
              if (addToast) addToast('📣 Shoutout sent!', 'success');
            }} style={{ width: '100%', background: BURG, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: GOLD, cursor: 'pointer', letterSpacing: 2 }}>
              📣 SHOUTOUT!
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ HIGHLIGHT REEL MODAL (host) ════════════════ */}
      {showHighlights && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowHighlights(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER, maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🎞️ Highlight Reel</div>
              <button onClick={function() { setShowHighlights(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14 }}>Moments where viewers tagged 5+ hot moments in 10 seconds.</div>
            {highlights.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '20px 0' }}>No hot moments recorded yet. Viewers tap ⚡ to tag a moment.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {highlights.map(function(h, i) {
                  var elapsed = liveStartedAt ? Math.floor((h.ts / 1000) - liveStartedAt) : null;
                  var timeStr = elapsed !== null ? fmtElapsed(elapsed) : new Date(h.ts).toLocaleTimeString();
                  return (
                    <div key={h.windowKey || i} style={{ background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: GOLD, letterSpacing: 1, minWidth: 60 }}>{timeStr}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT }}>🔥 {h.count}+ reactions</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>10-second window · clip here</div>
                      </div>
                      <span style={{ fontSize: 20 }}>⚡</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ KEYWORD HIGHLIGHT MODAL (host) ════════════════ */}
      {showKeywordSet && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 76, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowKeywordSet(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🔑 Chat Keyword</div>
              <button onClick={function() { setShowKeywordSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 12 }}>Messages containing this word glow in chat for everyone.</div>
            <input
              value={keywordInput}
              onChange={function(e) { setKeywordInput(e.target.value.slice(0, 30)); }}
              placeholder="e.g. 'giveaway' or 'winner'..."
              style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 10, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() {
                var kw = keywordInput.trim();
                setChatKeyword(kw);
                if (socket) socket.emit('chat-keyword', { roomId: roomId, keyword: kw });
                setShowKeywordSet(false);
                if (addToast) addToast(kw ? '🔑 Keyword "' + kw + '" set!' : '🔑 Keyword cleared', 'success');
              }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                SET KEYWORD
              </button>
              {chatKeyword && (
                <button onClick={function() {
                  setChatKeyword('');
                  if (socket) socket.emit('chat-keyword', { roomId: roomId, keyword: '' });
                  setShowKeywordSet(false);
                  if (addToast) addToast('🔑 Keyword cleared', 'info');
                }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: MUTED, cursor: 'pointer', letterSpacing: 2 }}>
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SHOP PIN MODAL (host) ════════════════ */}
      {showShopPin && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 78, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowShopPin(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🛍️ Pin Shop Item</div>
              <button onClick={function() { setShowShopPin(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {['name', 'price', 'image', 'url'].map(function(field) {
              return (
                <input key={field}
                  value={shopItemInput[field]}
                  onChange={function(e) { var v = e.target.value; setShopItemInput(function(s) { var n = Object.assign({}, s); n[field] = v; return n; }); }}
                  placeholder={field === 'name' ? 'Product name' : field === 'price' ? 'Price (e.g. 19.99)' : field === 'image' ? 'Image URL' : 'Buy link URL'}
                  style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                />
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={function() {
                var name = shopItemInput.name.trim();
                if (!name) return;
                var item = { id: Date.now().toString(36), name: name, price: Math.round(parseFloat(shopItemInput.price || '0') * 100), image: shopItemInput.image.trim(), url: shopItemInput.url.trim(), stock: 999 };
                if (socket) socket.emit('shop-item-pin', { roomId: roomId, item: item });
                setShowShopPin(false);
                if (addToast) addToast('🛍️ "' + name + '" pinned to stream!', 'success');
              }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 12, padding: 13, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>PIN ITEM</button>
              {pinnedShopItem && (
                <button onClick={function() {
                  if (socket) socket.emit('shop-item-pin', { roomId: roomId, item: null });
                  setPinnedShopItem(null); setShowShopPin(false);
                  if (addToast) addToast('🛍️ Shop item unpinned', 'info');
                }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: 13, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: MUTED, cursor: 'pointer', letterSpacing: 2 }}>UNPIN</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ CHALLENGE SET MODAL (host) ════════════════ */}
      {showChallengeSet && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 79, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowChallengeSet(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🏆 Viewer Challenge</div>
              <button onClick={function() { setShowChallengeSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <input value={challengeInput.title} onChange={function(e) { var v = e.target.value.slice(0, 80); setChallengeInput(function(s) { return Object.assign({}, s, { title: v }); }); }} placeholder="Challenge title (e.g. Get 100 reactions!)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="number" value={challengeInput.goal} onChange={function(e) { var v = Math.max(1, parseInt(e.target.value) || 1); setChallengeInput(function(s) { return Object.assign({}, s, { goal: v }); }); }} placeholder="Goal (e.g. 100)" style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              <select value={challengeInput.unit} onChange={function(e) { var v = e.target.value; setChallengeInput(function(s) { return Object.assign({}, s, { unit: v }); }); }} style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }}>
                {['reactions', 'gifts', 'chat messages', 'follows', 'subscriptions'].map(function(u) { return <option key={u} value={u}>{u}</option>; })}
              </select>
            </div>
            <input value={challengeInput.reward} onChange={function(e) { var v = e.target.value.slice(0, 100); setChallengeInput(function(s) { return Object.assign({}, s, { reward: v }); }); }} placeholder="Reward for completion (optional)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <button onClick={function() {
              var title = challengeInput.title.trim();
              if (!title) return;
              if (socket) socket.emit('challenge-set', { roomId: roomId, title: title, goal: challengeInput.goal, unit: challengeInput.unit, reward: challengeInput.reward.trim() });
              setShowChallengeSet(false);
              if (addToast) addToast('🏆 Challenge started!', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: 13, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>START CHALLENGE</button>
          </div>
        </div>
      )}

      {/* ════════════════ GOAL SET MODAL (host) ════════════════ */}
      {showGoalSet && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', zIndex: 80, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowGoalSet(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>🎯 Stream Goal</div>
              <button onClick={function() { setShowGoalSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <input value={goalInput.title} onChange={function(e) { var v = e.target.value.slice(0, 60); setGoalInput(function(s) { return Object.assign({}, s, { title: v }); }); }} placeholder="Goal title (e.g. New Microphone)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <input type="number" value={goalInput.targetCents / 100} onChange={function(e) { var v = Math.max(1, parseFloat(e.target.value) || 1) * 100; setGoalInput(function(s) { return Object.assign({}, s, { targetCents: Math.round(v) }); }); }} placeholder="Target $ amount" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <button onClick={function() {
              var title = goalInput.title.trim() || 'Stream Goal';
              if (socket) socket.emit('creator-goal', { roomId: roomId, title: title, targetCents: goalInput.targetCents });
              setShowGoalSet(false);
              if (addToast) addToast('🎯 Goal set: ' + title + ' ($' + (goalInput.targetCents / 100).toFixed(2) + ')', 'success');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: 13, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>SET GOAL</button>
          </div>
        </div>
      )}

      {/* ════════════════ LIVE STATS PANEL (host) ════════════════ */}
      {showLiveStats && liveStats && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', right: 8, top: 360, zIndex: 65, background: 'rgba(14,12,9,.92)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 16, padding: '16px 18px', minWidth: 170, animation: 'statsFadeIn .2s ease', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>LIVE STATS</span>
            <button onClick={function() { setShowLiveStats(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
          {[
            { label: 'VIEWERS', value: liveStats.viewers || 0, icon: '👁' },
            { label: 'PEAK', value: liveStats.peakViewers || 0, icon: '📈' },
            { label: 'REVENUE', value: '$' + ((liveStats.revenueCents || 0) / 100).toFixed(2), icon: '💰' },
            { label: 'CHAT', value: liveStats.chatCount || 0, icon: '💬' },
            { label: 'TOP EMOJI', value: liveStats.topEmoji || '—', icon: '' },
            { label: 'TOP GIFTER', value: liveStats.topGifter ? liveStats.topGifter.username : '—', icon: '🎁' },
          ].map(function(row) {
            return (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>{row.icon} {row.label}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, fontWeight: 600 }}>{row.value}</span>
              </div>
            );
          })}
          <button onClick={function() { if (socket) socket.emit('live-stats-request', { roomId: roomId }); }} style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: 1, marginTop: 4 }}>REFRESH</button>
        </div>
      )}

      {/* ════════════════ REVENUE MILESTONE OVERLAY ════════════════ */}
      {revenueOverlay && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 91, pointerEvents: 'none', animation: 'fadeSlideIn .3s ease' }}>
          <div style={{ textAlign: 'center', background: 'rgba(14,12,9,.88)', border: '2px solid ' + GOLD, borderRadius: 20, padding: '28px 36px', boxShadow: '0 0 40px rgba(201,168,76,.4)' }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>💰</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: GOLD, letterSpacing: 4, lineHeight: 1 }}>${revenueOverlay.dollars}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 3, marginTop: 8 }}>SESSION MILESTONE</div>
          </div>
        </div>
      )}

      {/* ════════════════ END SCREEN (host only) ════════════════ */}
      {endScreen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,9,.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 95, animation: 'fadeSlideIn .4s ease' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: TEXT, letterSpacing: 3, marginBottom: 4 }}>STREAM ENDED</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 24 }}>THANKS FOR GOING LIVE ON SEEWHY!</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: GOLD, letterSpacing: 2 }}>{fmtElapsed(endScreen.duration || 0)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2 }}>DURATION</div>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: TEAL, letterSpacing: 2 }}>{(endScreen.peak || 0).toLocaleString()}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2 }}>PEAK VIEWERS</div>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: GOLD, letterSpacing: 2 }}>${((sessionEarningsCents || 0) / 100).toFixed(2)}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 2 }}>EARNED</div>
            </div>
          </div>
          <button onClick={function() { setEndScreen(null); }} style={{ background: BURG, border: 'none', borderRadius: 12, padding: '12px 32px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, cursor: 'pointer', letterSpacing: 3 }}>
            CLOSE
          </button>
        </div>
      )}

      {/* ════════════════ PRIVATE DM MODAL (host) ════════════════ */}
      {showDmModal && dmTarget && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 78, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowDmModal(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>💌 Message {dmTarget.username}</div>
              <button onClick={function() { setShowDmModal(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 12 }}>Only {dmTarget.username} will see this message.</div>
            <textarea
              value={dmInput}
              onChange={function(e) { setDmInput(e.target.value.slice(0, 300)); }}
              placeholder="Type a private message..."
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, outline: 'none', marginBottom: 12, resize: 'none' }}
            />
            <button onClick={function() {
              var msg = dmInput.trim();
              if (!msg || !socket) return;
              socket.emit('private-dm', { roomId: roomId, toGuestId: dmTarget.guestId, message: msg });
              setShowDmModal(false);
              setDmInput('');
              if (addToast) addToast('💌 Message sent to ' + dmTarget.username, 'success');
            }} style={{ width: '100%', background: BURG, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: GOLD, cursor: 'pointer', letterSpacing: 2 }}>
              SEND MESSAGE
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ MUTE ALL CONFIRM ════════════════ */}
      {showMuteAllConfirm && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 16, padding: '24px 28px', textAlign: 'center', maxWidth: 300 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔇</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: TEXT, marginBottom: 6 }}>Mute Everyone?</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>This will silence all guests immediately. They can unmute themselves.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={function() { setShowMuteAllConfirm(false); }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: MUTED, cursor: 'pointer', letterSpacing: 1 }}>
                CANCEL
              </button>
              <button onClick={function() {
                if (socket) socket.emit('mute-all', { roomId: roomId });
                setShowMuteAllConfirm(false);
                if (addToast) addToast('🔇 All guests muted', 'info');
              }} style={{ flex: 1, background: RED, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: '#fff', cursor: 'pointer', letterSpacing: 1 }}>
                MUTE ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ LIVE CAPTIONS OVERLAY ════════════════ */}
      {showCaptions && (latestCaption || (captionsEnabled && captionText)) && (
        <div style={{
          position: 'absolute', bottom: 74, left: 10, right: 10, zIndex: 60,
          background: 'rgba(0,0,0,.82)', borderRadius: 8, padding: '6px 12px',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          {captionsEnabled && captionText && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, lineHeight: 1.4, letterSpacing: .3, marginBottom: latestCaption ? 4 : 0 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, marginRight: 6 }}>LIVE</span>{captionText}
            </div>
          )}
          {latestCaption && (
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: '#ddd', lineHeight: 1.4, letterSpacing: .3 }}>
              {latestCaption}
            </span>
          )}
        </div>
      )}

      {/* ════════════════ PERSONAL ENGAGEMENT BADGE ════════════════ */}
      {(myEngagement.chat > 0 || myEngagement.react > 0) && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 52,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(14,12,9,.7)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 999,
          padding: '3px 8px', pointerEvents: 'none',
        }}>
          {myEngagement.chat > 0 && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>💬{myEngagement.chat}</span>
          )}
          {myEngagement.react > 0 && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>⚡{myEngagement.react}</span>
          )}
        </div>
      )}

      {/* ════════════════ PIN ANNOUNCEMENT MODAL (host) ════════════════ */}
      {showPinAnnounce && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 75, animation: 'fadeSlideIn .2s ease' }} onClick={function(e) { if (e.target === e.currentTarget) setShowPinAnnounce(false); }}>
          <div style={{ width: '100%', background: SURF, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', border: '1px solid ' + BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: TEXT }}>📌 Pin Announcement</div>
              <button onClick={function() { setShowPinAnnounce(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 12 }}>Shows a persistent banner at the top of chat for all viewers.</div>
            <textarea
              value={pinAnnounceInput}
              onChange={function(e) { setPinAnnounceInput(e.target.value.slice(0, 200)); }}
              placeholder="Type your announcement..."
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 9, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 15, outline: 'none', marginBottom: 10, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() {
                var text = pinAnnounceInput.trim();
                if (!text) return;
                setPinnedAnnouncement({ text: text });
                if (socket) socket.emit('pin-announcement', { roomId: roomId, text: text });
                setShowPinAnnounce(false);
                if (addToast) addToast('📌 Announcement pinned!', 'success');
              }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                PIN BANNER
              </button>
              {pinnedAnnouncement && (
                <button onClick={function() {
                  setPinnedAnnouncement(null);
                  if (socket) socket.emit('pin-announcement', { roomId: roomId, text: null });
                  setShowPinAnnounce(false);
                  if (addToast) addToast('📌 Announcement cleared', 'info');
                }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: MUTED, cursor: 'pointer', letterSpacing: 2 }}>
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ CLIP GALLERY OVERLAY ════════════════ */}
      {showClipGallery && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 78, background: BG }}>
          <ClipGalleryPage
            onBack={function() { setShowClipGallery(false); }}
            addToast={addToast}
          />
        </div>
      )}

      {/* ════════════════ AI FILTER PANEL ════════════════ */}
      {showFilterPanel && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 75, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowFilterPanel(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 330, boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1.5 }}>🎨 AI VISUAL FILTERS</div>
              <button onClick={function() { setShowFilterPanel(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14, letterSpacing: .3 }}>APPLY REAL-TIME VISUAL FILTER TO YOUR BROADCAST</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {AI_FILTER_META.map(function(f) {
                var isActive = aiFilter === f.key;
                return (
                  <button key={f.key} onClick={function() { setAiFilter(f.key); }}
                    style={{ background: isActive ? 'rgba(201,168,76,.18)' : CARD2, border: '1.5px solid ' + (isActive ? GOLD : BORDER), borderRadius: 10, padding: '10px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'background .15s, border-color .15s' }}>
                    <span style={{ fontSize: 18 }}>{f.emoji}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: isActive ? GOLD : MUTED, letterSpacing: .5 }}>{f.label}</span>
                    {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD }} />}
                  </button>
                );
              })}
            </div>
            {aiFilter !== 'none' && (
              <div style={{ background: CARD2, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>👁</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: MUTED }}>Filter active: <b style={{ color: TEXT }}>{(AI_FILTER_META.find(function(f) { return f.key === aiFilter; }) || {}).label}</b></span>
                <button onClick={function() { setAiFilter('none'); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12 }}>✕ Clear</button>
              </div>
            )}
            <button onClick={function() { setShowFilterPanel(false); }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '12px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
              APPLY FILTER
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ PK BATTLE LEADERBOARD ════════════════ */}
      {showPkLeaderboard && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 75, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowPkLeaderboard(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 340, maxHeight: 500, overflowY: 'auto', boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD, letterSpacing: 1.5 }}>⚔️ PK BATTLE LEADERBOARD</div>
              <button onClick={function() { setShowPkLeaderboard(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14, letterSpacing: .3 }}>RANKED BY TOTAL WINS · ALL-TIME SCORES</div>
            {pkLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
                No PK battle results yet.<br />Win a battle to appear here!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pkLeaderboard.slice(0, 20).map(function(entry, idx) {
                  var medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1);
                  return (
                    <div key={entry.username + idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: idx < 3 ? 'rgba(201,168,76,.06)' : CARD2, border: '1px solid ' + (idx < 3 ? GOLD + '33' : BORDER), borderRadius: 10, padding: '9px 12px' }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: idx === 0 ? GOLD : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : MUTED, minWidth: 28, textAlign: 'center' }}>{medal}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.username}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 1 }}>Score: {entry.totalScore.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, lineHeight: 1 }}>{entry.wins}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED }}>WIN{entry.wins !== 1 ? 'S' : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {pkLeaderboard.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button onClick={function() {
                  if (!window.confirm('Clear PK leaderboard?')) return;
                  setPkLeaderboard([]);
                  try { localStorage.removeItem('sw_pk_leaderboard'); } catch(e) {}
                }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                  CLEAR ALL
                </button>
                <button onClick={function() { setShowPkLeaderboard(false); }} style={{ flex: 2, background: GOLD, border: 'none', borderRadius: 10, padding: '10px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                  CLOSE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ POINTS REDEMPTION PANEL ════════════════ */}
      {showRedeemPanel && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 74, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowRedeemPanel(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 320, boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1.5 }}>🎁 REDEEM POINTS</div>
              <button onClick={function() { setShowRedeemPanel(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: GOLD, letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>{pointBalance} pts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { perk: 'chatcolor',      label: 'Random Chat Color',   emoji: '🎨', cost: 50  },
                { perk: 'badge',          label: 'Supporter Badge',     emoji: '⭐', cost: 100 },
                { perk: 'name_highlight', label: 'Name Highlight',      emoji: '✨', cost: 150 },
                { perk: 'shoutout',       label: 'Shoutout from Host',  emoji: '📣', cost: 200 },
              ].map(function(r) {
                var canAfford = pointBalance >= r.cost;
                return (
                  <button key={r.perk} onClick={function() {
                    if (!canAfford) { if (addToast) addToast('Not enough points (need ' + r.cost + ')', 'error'); return; }
                    if (socket) socket.emit('redeem-points', { roomId: roomId, perk: r.perk });
                    setShowRedeemPanel(false);
                  }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: canAfford ? CARD2 : 'rgba(255,255,255,.03)', border: '1px solid ' + (canAfford ? BORDER : 'rgba(255,255,255,.05)'), borderRadius: 10, padding: '11px 14px', cursor: canAfford ? 'pointer' : 'not-allowed', transition: 'background .15s', opacity: canAfford ? 1 : .5 }}>
                    <span style={{ fontSize: 20 }}>{r.emoji}</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{r.label}</div>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: canAfford ? GOLD : MUTED }}>{r.cost} pts</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ NEXT STREAM SCHEDULE ════════════════ */}
      {showNextStream && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 74, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowNextStream(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 320, boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1.5 }}>📅 NEXT STREAM</div>
              <button onClick={function() { setShowNextStream(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>DATE & TIME</div>
              <input type="datetime-local" value={nextStreamInput.datetime} onChange={function(e) { setNextStreamInput(function(d) { return Object.assign({}, d, { datetime: e.target.value }); }); }}
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', marginBottom: 8 }} />
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>LABEL (optional)</div>
              <input value={nextStreamInput.label} onChange={function(e) { setNextStreamInput(function(d) { return Object.assign({}, d, { label: e.target.value.slice(0, 60) }); }); }}
                placeholder="Next stream"
                style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() {
                var dt = nextStreamInput.datetime;
                if (!dt) { if (addToast) addToast('Select a date and time', 'error'); return; }
                var ts = new Date(dt).getTime();
                if (isNaN(ts)) { if (addToast) addToast('Invalid date', 'error'); return; }
                var label = nextStreamInput.label.trim() || 'Next Stream';
                if (socket) socket.emit('next-stream', { roomId: roomId, ts: ts, label: label });
                setNextStreamTs({ ts: ts, label: label });
                setShowNextStream(false);
                if (addToast) addToast('📅 Next stream scheduled!', 'success');
              }} style={{ flex: 2, background: GOLD, border: 'none', borderRadius: 12, padding: '12px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
                SET SCHEDULE
              </button>
              {nextStreamTs && (
                <button onClick={function() {
                  setNextStreamTs(null);
                  setShowNextStream(false);
                }} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ NEXT STREAM BANNER (viewer-facing) ════════════════ */}
      {nextStreamTs && (
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 53, background: 'rgba(14,12,9,.88)', border: '1px solid ' + GOLD + '44', borderRadius: 20, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}>
          <span style={{ fontSize: 12 }}>📅</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: .5 }}>{nextStreamTs.label}:</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: GOLD, letterSpacing: 1 }}>{new Date(nextStreamTs.ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* ════════════════ SHOP CAROUSEL ════════════════ */}
      {shopCarousel.length > 0 && (
        <div style={{ position: 'absolute', bottom: watchTogether ? 230 : 80, left: 0, right: 0, zIndex: 52, background: CARD, borderTop: '1px solid ' + BORDER, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, letterSpacing: 1 }}>🛒 SHOP</span>
            {(role === 'host' || role === 'cohost') && (
              <button onClick={function() { if (socket) socket.emit('shop-carousel-set', { roomId: roomId, items: [] }); setShopCarousel([]); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: .5 }}>CLOSE ✕</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {shopCarousel.map(function(item) {
              return (
                <div key={item.id} style={{ flexShrink: 0, width: 120, background: CARD2, borderRadius: 12, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg,' + BURG + '44,' + CARD + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛒</div>
                  )}
                  <div style={{ padding: '6px 8px 8px' }}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD }}>${((item.price || 0) / 100).toFixed(2)}</div>
                    <button onClick={function() {
                      if (socket) socket.emit('shop-add-to-cart', { roomId: roomId, itemId: item.id });
                      if (addToast) addToast('🛒 Added to cart!', 'success');
                    }} style={{ width: '100%', marginTop: 4, background: GOLD, border: 'none', borderRadius: 8, padding: '5px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 10, color: BG, cursor: 'pointer', letterSpacing: 1 }}>
                      BUY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ ROOM THEME PICKER ════════════════ */}
      {showThemePicker && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowThemePicker(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 320, boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1.5 }}>🎭 ROOM AMBIANCE</div>
              <button onClick={function() { setShowThemePicker(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {Object.keys(ROOM_THEMES).map(function(key) {
                var t = ROOM_THEMES[key];
                var isActive = roomTheme === key;
                return (
                  <button key={key} onClick={function() {
                    setRoomTheme(key);
                    if (socket) socket.emit('room-theme', { roomId: roomId, theme: key });
                    setShowThemePicker(false);
                    if (addToast) addToast('🎭 Theme: ' + t.label, 'success');
                  }} style={{ background: t.bg ? t.bg.replace('ellipse at 20% 30%', 'ellipse at 50% 50%').replace('ellipse at 50% 0%', 'ellipse at 50% 50%') : CARD2, border: '2px solid ' + (isActive ? GOLD : BORDER), borderRadius: 10, padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'border-color .15s' }}>
                    <span style={{ fontSize: 18 }}>{t.emoji}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: isActive ? GOLD : MUTED, letterSpacing: .5 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SHOP CAROUSEL EDITOR ════════════════ */}
      {showCarouselEdit && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 77, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowCarouselEdit(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 340, maxHeight: 560, overflowY: 'auto', boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1.5 }}>🛒 SHOP CAROUSEL</div>
              <button onClick={function() { setShowCarouselEdit(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              {[
                { key: 'name',  placeholder: 'Product name', label: 'Name' },
                { key: 'price', placeholder: 'Price in USD (e.g. 19.99)', label: 'Price' },
                { key: 'image', placeholder: 'Image URL (optional)', label: 'Image URL' },
                { key: 'url',   placeholder: 'Buy link (optional)', label: 'Buy URL' },
              ].map(function(field) {
                return (
                  <div key={field.key} style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>{field.label}</div>
                    <input value={carouselDraft[field.key]} onChange={function(e) { setCarouselDraft(function(d) { var n = Object.assign({}, d); n[field.key] = e.target.value; return n; }); }}
                      placeholder={field.placeholder}
                      style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 8, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }} />
                  </div>
                );
              })}
              <button onClick={function() {
                var name = carouselDraft.name.trim();
                if (!name) { if (addToast) addToast('Product name is required', 'error'); return; }
                var priceVal = Math.round(parseFloat(carouselDraft.price || '0') * 100) || 0;
                var newItem = { id: 'ci_' + Date.now(), name: name, price: priceVal, image: carouselDraft.image.trim(), url: carouselDraft.url.trim() };
                var updated = shopCarousel.concat([newItem]);
                setShopCarousel(updated);
                if (socket) socket.emit('shop-carousel-set', { roomId: roomId, items: updated });
                setCarouselDraft({ name: '', price: '', image: '', url: '' });
                if (addToast) addToast('🛒 Product added to carousel!', 'success');
              }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 10, padding: '12px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: BG, cursor: 'pointer', letterSpacing: 2, marginTop: 4 }}>
                + ADD PRODUCT
              </button>
            </div>
            {shopCarousel.length > 0 && (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 8, letterSpacing: .5 }}>CURRENT CAROUSEL ({shopCarousel.length} ITEMS)</div>
                {shopCarousel.map(function(item) {
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD2, borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{item.image ? '🖼' : '📦'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>${((item.price || 0) / 100).toFixed(2)}</div>
                      </div>
                      <button onClick={function() {
                        var updated = shopCarousel.filter(function(i) { return i.id !== item.id; });
                        setShopCarousel(updated);
                        if (socket) socket.emit('shop-carousel-set', { roomId: roomId, items: updated });
                      }} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ WATCH TOGETHER URL INPUT ════════════════ */}
      {showWatchInput && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={function() { setShowWatchInput(false); }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 24px', width: 340, boxShadow: '0 12px 48px rgba(0,0,0,.75)', animation: 'statsFadeIn .2s ease' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1.5 }}>📺 CO-WATCH TOGETHER</div>
              <button onClick={function() { setShowWatchInput(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 14, lineHeight: 1.6 }}>SHARE A VIDEO URL WITH YOUR AUDIENCE. ALL VIEWERS WILL SEE THE VIDEO EMBEDDED BELOW THE STAGE.</div>
            <input
              value={watchUrl}
              onChange={function(e) { setWatchUrl(e.target.value); }}
              placeholder="Paste YouTube, Vimeo, or direct video URL…"
              style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + BORDER, borderRadius: 10, padding: '11px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', marginBottom: 12 }}
            />
            <button onClick={function() {
              var url = watchUrl.trim();
              if (!url) return;
              if (socket) socket.emit('watch-together-start', { roomId: roomId, url: url });
              setShowWatchInput(false);
              setWatchUrl('');
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: BG, cursor: 'pointer', letterSpacing: 2 }}>
              START CO-WATCH
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ WATCH TOGETHER PLAYER ════════════════ */}
      {watchTogether && watchTogether.url && (
        <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, zIndex: 55, background: CARD, borderTop: '2px solid ' + GOLD + '44', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📺</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 1 }}>CO-WATCH</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>started by {watchTogether.by || 'host'}</span>
            </div>
            {(role === 'host' || role === 'cohost') && (
              <button onClick={function() { if (socket) socket.emit('watch-together-end', { roomId: roomId }); }}
                style={{ background: 'rgba(255,26,60,.12)', border: '1px solid rgba(255,26,60,.3)', borderRadius: 8, padding: '4px 10px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: RED, cursor: 'pointer', letterSpacing: .5 }}>
                END
              </button>
            )}
          </div>
          <div style={{ position: 'relative', paddingBottom: '35%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
            <iframe
              src={(function() {
                var url = watchTogether.url;
                var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]{11})/);
                if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=1&start=' + Math.floor(watchTogether.currentTime || 0);
                var vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                if (vimeoMatch) return 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?autoplay=1#t=' + Math.floor(watchTogether.currentTime || 0) + 's';
                return url;
              })()}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Co-Watch"
            />
          </div>
        </div>
      )}

      {/* ════════════════ SOUND ALERT PANEL ════════════════ */}
      {soundAlertPanel && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', bottom: 190, right: 12, zIndex: 70, background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 14, padding: '14px 16px', width: 220, boxShadow: '0 8px 32px rgba(0,0,0,.7)', animation: 'fadeSlideIn .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: TEXT, letterSpacing: 1 }}>🔔 SOUND ALERTS</div>
            <button onClick={function() { setSoundAlertPanel(false); }} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { type: 'hype',     label: 'Hype',     emoji: '🔥' },
              { type: 'goal',     label: 'Goal',     emoji: '🎯' },
              { type: 'sub',      label: 'New Sub',  emoji: '⭐' },
              { type: 'win',      label: 'Winner',   emoji: '🏆' },
              { type: 'fanfare',  label: 'Fanfare',  emoji: '🎺' },
              { type: 'applause', label: 'Applause', emoji: '👏' },
            ].map(function(a) {
              return (
                <button key={a.type} onClick={function() {
                  if (socket) socket.emit('sound-alert', { roomId: roomId, type: a.type });
                }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'background .15s' }}>
                  <span style={{ fontSize: 16 }}>{a.emoji}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ STREAM MILESTONE OVERLAY ════════════════ */}
      {streamMilestone && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 90, pointerEvents: 'none', textAlign: 'center', animation: 'milestoneIn .5s cubic-bezier(.17,.67,.39,1.3) forwards' }}>
          <div style={{ background: 'linear-gradient(135deg,' + BURG + ',' + '#5A0018' + ')', border: '2.5px solid ' + GOLD, borderRadius: 20, padding: '18px 32px', boxShadow: '0 12px 48px rgba(0,0,0,.8), 0 0 60px ' + GOLD + '44' }}>
            <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: GOLD, letterSpacing: 3, lineHeight: 1 }}>{streamMilestone.label}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEXT, marginTop: 4, letterSpacing: 1, opacity: .8 }}>MILESTONE REACHED!</div>
          </div>
        </div>
      )}

      {/* ════════════════ CONFETTI OVERLAY ════════════════ */}
      {confettiPieces.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 95 }}>
          {confettiPieces.map(function(p) {
            return (
              <div key={p.id} style={{
                position: 'absolute',
                top: 0,
                left: p.x + '%',
                width: 8 + (p.id % 5) * 2,
                height: 8 + (p.id % 4) * 2,
                background: p.color,
                borderRadius: p.id % 3 === 0 ? '50%' : 2,
                animation: 'confettiFall ' + p.dur + 's ease-in ' + p.delay + 's forwards',
              }} />
            );
          })}
        </div>
      )}

      {/* ════════════════ MENTION ALERT ════════════════ */}
      {mentionAlert && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: CARD, border: '1.5px solid ' + GOLD, borderRadius: 12,
          padding: '8px 18px', zIndex: 90, animation: 'fadeSlideIn .25s ease',
          display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
          boxShadow: '0 4px 18px rgba(0,0,0,.5)',
        }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, letterSpacing: .5 }}>
            <b style={{ color: GOLD }}>{mentionAlert.by}</b> mentioned you
          </span>
        </div>
      )}

      {/* ════════════════ SHARE SHEET ════════════════ */}
      {showShareSheet && (
        <ShareSheet
          shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
          title={'Join ' + ((streamInfo && streamInfo.title) || username + ' on SeeWhy LIVE')}
          onClose={function() { setShowShareSheet(false); }}
        />
      )}

      {/* ════════════════ BATCH 24: TEAM BATTLE OVERLAY ════════════════ */}
      {teamBattle && (
        <div style={{
          position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: 88, minWidth: 340, maxWidth: 480, width: '92%',
          background: 'rgba(14,12,9,.92)', border: '1.5px solid rgba(201,168,76,.22)',
          borderRadius: 16, padding: '14px 18px', backdropFilter: 'blur(8px)',
          animation: 'fadeSlideIn .25s ease',
          boxShadow: teamBattle.active ? '0 0 24px rgba(128,0,32,.35), 0 4px 20px rgba(0,0,0,.6)' : '0 4px 20px rgba(0,0,0,.6)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 2 }}>
              ⚔️ {teamBattle.active ? 'TEAM BATTLE LIVE' : 'BATTLE ENDED'}
            </div>
            {teamBattle.active && teamBattle.endsAt && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED }}>
                {Math.max(0, teamBattle.endsAt - Math.floor(Date.now() / 1000))}s
              </div>
            )}
          </div>

          {/* Score bars */}
          {(function() {
            var total = (teamBattle.redScore || 0) + (teamBattle.blueScore || 0) || 1;
            var redPct  = Math.round(((teamBattle.redScore  || 0) / total) * 100);
            var bluePct = Math.round(((teamBattle.blueScore || 0) / total) * 100);
            var isWinner = !teamBattle.active && teamBattle.winner;
            return (
              <div>
                {/* Red team */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: isWinner && teamBattle.winner === 'red' ? '#FF6B6B' : RED, animation: isWinner && teamBattle.winner === 'red' ? 'battleWin 1s ease infinite' : 'none' }}>
                      {isWinner && teamBattle.winner === 'red' ? '👑 ' : ''}{teamBattle.redLabel}
                    </span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: RED }}>{teamBattle.redScore || 0}</span>
                  </div>
                  <div style={{ height: 10, background: 'rgba(255,26,60,.15)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: redPct + '%', background: 'linear-gradient(90deg,' + RED + ',' + BURG + ')', borderRadius: 99, transition: 'width .4s ease', '--tb-pct': redPct + '%' }} />
                  </div>
                </div>
                {/* Blue team */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: isWinner && teamBattle.winner === 'blue' ? '#7EC8FF' : '#4A90D9', animation: isWinner && teamBattle.winner === 'blue' ? 'battleWin 1s ease infinite' : 'none' }}>
                      {isWinner && teamBattle.winner === 'blue' ? '👑 ' : ''}{teamBattle.blueLabel}
                    </span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#4A90D9' }}>{teamBattle.blueScore || 0}</span>
                  </div>
                  <div style={{ height: 10, background: 'rgba(74,144,217,.15)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: bluePct + '%', background: 'linear-gradient(90deg,#4A90D9,#1A4A7A)', borderRadius: 99, transition: 'width .4s ease' }} />
                  </div>
                </div>

                {/* Gift buttons (active battle) */}
                {teamBattle.active && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={function() { if (socket) socket.emit('team-battle-gift', { roomId: roomId, team: 'red', amount: 1 }); }}
                      style={{ flex: 1, background: 'linear-gradient(135deg,' + BURG + ',' + RED + '44)', border: '1px solid ' + RED + '66', borderRadius: 10, padding: '8px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#FFB3B3', cursor: 'pointer', letterSpacing: 1.5 }}>
                      🔴 CHEER RED
                    </button>
                    <button onClick={function() { if (socket) socket.emit('team-battle-gift', { roomId: roomId, team: 'blue', amount: 1 }); }}
                      style={{ flex: 1, background: 'linear-gradient(135deg,#1A3A5A,#4A90D944)', border: '1px solid #4A90D966', borderRadius: 10, padding: '8px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#B3D9FF', cursor: 'pointer', letterSpacing: 1.5 }}>
                      🔵 CHEER BLUE
                    </button>
                  </div>
                )}

                {/* Host end button */}
                {teamBattle.active && (role === 'host' || role === 'cohost') && (
                  <button onClick={function() { if (socket) socket.emit('team-battle-end', { roomId: roomId }); }}
                    style={{ marginTop: 8, width: '100%', background: 'rgba(255,26,60,.08)', border: '1px solid ' + RED + '33', borderRadius: 8, padding: '6px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                    END BATTLE EARLY
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════ BATCH 24: TEAM BATTLE SETUP PANEL ════════════════ */}
      {showTeamBattle && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '24px 28px', width: 340, animation: 'fadeSlideIn .2s ease' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: GOLD, letterSpacing: 2, marginBottom: 18 }}>⚔️ LAUNCH TEAM BATTLE</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 5, letterSpacing: .5 }}>RED TEAM NAME</div>
              <input value={battleConfig.redLabel}
                onChange={function(e) { setBattleConfig(function(s) { return Object.assign({}, s, { redLabel: e.target.value }); }); }}
                style={{ width: '100%', background: CARD2, border: '1px solid ' + RED + '44', borderRadius: 8, padding: '8px 12px', color: '#FFB3B3', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 5, letterSpacing: .5 }}>BLUE TEAM NAME</div>
              <input value={battleConfig.blueLabel}
                onChange={function(e) { setBattleConfig(function(s) { return Object.assign({}, s, { blueLabel: e.target.value }); }); }}
                style={{ width: '100%', background: CARD2, border: '1px solid #4A90D944', borderRadius: 8, padding: '8px 12px', color: '#B3D9FF', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 5, letterSpacing: .5 }}>DURATION (SECONDS)</div>
              <input type="number" min="10" max="300" value={battleConfig.duration}
                onChange={function(e) { setBattleConfig(function(s) { return Object.assign({}, s, { duration: Number(e.target.value) || 60 }); }); }}
                style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={function() { setShowTeamBattle(false); }}
                style={{ flex: 1, background: 'none', border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: MUTED, cursor: 'pointer', letterSpacing: 1.5 }}>
                CANCEL
              </button>
              <button onClick={function() {
                if (socket) socket.emit('team-battle-start', { roomId: roomId, redLabel: battleConfig.redLabel || 'RED TEAM', blueLabel: battleConfig.blueLabel || 'BLUE TEAM', duration: battleConfig.duration || 60 });
                setShowTeamBattle(false);
              }}
                style={{ flex: 2, background: 'linear-gradient(135deg,' + BURG + ',' + RED + ')', border: 'none', borderRadius: 10, padding: '10px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: TEXT, cursor: 'pointer', letterSpacing: 1.5 }}>
                ⚔️ START BATTLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 24: MULTI-CAMERA PICKER ════════════════ */}
      {showCamPicker && multiCamDevices.length > 1 && (
        <div style={{ position: 'absolute', bottom: 90, right: 16, zIndex: 200, background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 14, padding: '14px 16px', minWidth: 240, animation: 'fadeSlideIn .2s ease', boxShadow: '0 8px 24px rgba(0,0,0,.6)' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📷 CAMERA</span>
            <button onClick={function() { setShowCamPicker(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {multiCamDevices.map(function(d, i) {
            var isActive = activeCamId ? d.deviceId === activeCamId : i === 0;
            return (
              <div key={d.deviceId} onClick={function() { switchCamera(d.deviceId); setShowCamPicker(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: isActive ? 'rgba(201,168,76,.12)' : 'transparent', border: '1px solid ' + (isActive ? GOLD + '55' : 'transparent'), cursor: 'pointer', transition: 'background .15s' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? GOLD : MUTED, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: isActive ? TEXT : MUTED }}>
                  {d.label || ('Camera ' + (i + 1))}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ BATCH 24: REACTION HEATMAP HINT ════════════════ */}
      {showHeatmap && heatPoints.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 62, pointerEvents: 'none', textAlign: 'center', color: MUTED }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, opacity: .7 }}>Tap on the stage to drop reactions</div>
        </div>
      )}

      {/* ════════════════ BATCH 25: COLLABORATIVE WHITEBOARD ════════════════ */}
      {showWhiteboard && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 220, background: 'rgba(14,12,9,.92)', display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{ background: CARD, borderBottom: '1px solid ' + BORDER, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: GOLD, letterSpacing: 2 }}>🖊️ WHITEBOARD</div>
            {/* Pen size */}
            {[1, 3, 7, 14].map(function(sz) {
              return (
                <button key={sz} onClick={function() { setWbSize(sz); }}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: wbSize === sz ? GOLD + '33' : CARD2, border: '1px solid ' + (wbSize === sz ? GOLD + '88' : BORDER), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: Math.max(2, sz * 1.6), height: Math.max(2, sz * 1.6), borderRadius: '50%', background: wbColor }} />
                </button>
              );
            })}
            {/* Color swatches */}
            {['#C9A84C','#FF1A3C','#4A90D9','#00CC66','#FF8C00','#CC44FF','#F0E8D4','#000000'].map(function(col) {
              return (
                <button key={col} onClick={function() { setWbColor(col); }}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: col, border: '2px solid ' + (wbColor === col ? TEXT : 'transparent'), cursor: 'pointer', flexShrink: 0 }} />
              );
            })}
            <div style={{ flex: 1 }} />
            {(role === 'host' || role === 'cohost') && (
              <button onClick={function() { if (socket) socket.emit('canvas-clear', { roomId: roomId }); }}
                style={{ background: 'rgba(255,26,60,.12)', border: '1px solid ' + RED + '44', borderRadius: 8, padding: '6px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: RED, cursor: 'pointer', letterSpacing: .5 }}>
                CLEAR
              </button>
            )}
            <button onClick={function() { setShowWhiteboard(false); }}
              style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '6px 12px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>

          {/* Canvas area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <canvas ref={wbCanvasRef}
              width={1200} height={700}
              style={{ width: '100%', height: '100%', background: '#1A1510', cursor: 'crosshair', display: 'block' }}
              onPointerDown={function(e) {
                e.currentTarget.setPointerCapture(e.pointerId);
                wbDrawing.current = true;
                var rect = e.currentTarget.getBoundingClientRect();
                var scaleX = 1200 / rect.width; var scaleY = 700 / rect.height;
                wbLastPos.current = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
              }}
              onPointerMove={function(e) {
                if (!wbDrawing.current) return;
                var rect  = e.currentTarget.getBoundingClientRect();
                var scaleX = 1200 / rect.width; var scaleY = 700 / rect.height;
                var nx = (e.clientX - rect.left) * scaleX;
                var ny = (e.clientY - rect.top)  * scaleY;
                var prev = wbLastPos.current;
                // Draw locally
                var ctx = wbCanvasRef.current.getContext('2d');
                ctx.beginPath(); ctx.strokeStyle = wbColor; ctx.lineWidth = wbSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.moveTo(prev.x, prev.y); ctx.lineTo(nx, ny); ctx.stroke();
                // Broadcast as percentage coords
                if (socket) socket.emit('canvas-draw', { roomId: roomId, x1: prev.x / 12, y1: prev.y / 7, x2: nx / 12, y2: ny / 7, color: wbColor, size: wbSize });
                wbLastPos.current = { x: nx, y: ny };
              }}
              onPointerUp={function() { wbDrawing.current = false; }}
              onPointerLeave={function() { wbDrawing.current = false; }}
            />
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 25: STREAM HEALTH BAR ════════════════ */}
      {showHealthBar && (role === 'host' || role === 'cohost') && (
        <div style={{
          position: 'absolute', top: 56, right: 12, zIndex: 85,
          background: 'rgba(14,12,9,.88)', border: '1px solid ' + BORDER,
          borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(6px)',
          display: 'flex', gap: 14, alignItems: 'center',
          fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED,
          animation: 'fadeSlideIn .2s ease',
        }}>
          <span style={{ color: GOLD, letterSpacing: 1 }}>📡 HEALTH</span>
          {streamStats ? (
            <>
              <span style={{ color: streamStats.bitrateKbps >= 1500 ? '#00CC66' : streamStats.bitrateKbps >= 500 ? TEAL : RED }}>
                {streamStats.bitrateKbps || 0} kbps
              </span>
              <span style={{ color: streamStats.rttMs < 80 ? '#00CC66' : streamStats.rttMs < 200 ? TEAL : RED }}>
                RTT {streamStats.rttMs || 0}ms
              </span>
              {streamStats.lossPct > 0 && (
                <span style={{ color: streamStats.lossPct > 5 ? RED : TEAL }}>
                  loss {streamStats.lossPct.toFixed(1)}%
                </span>
              )}
              <span style={{ color: streamStats.bitrateKbps >= 1000 ? '#00CC66' : RED }}>
                {streamStats.bitrateKbps >= 2000 ? '●●●' : streamStats.bitrateKbps >= 800 ? '●●○' : '●○○'}
              </span>
            </>
          ) : (
            <span style={{ color: MUTED, opacity: .6 }}>waiting for stats…</span>
          )}
          <button onClick={function() { setShowHealthBar(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 10, marginLeft: 4 }}>✕</button>
        </div>
      )}

      {/* ════════════════ BATCH 25: REVENUE SPLIT PANEL ════════════════ */}
      {showRevSplit && (role === 'host' || role === 'cohost') && (
        <div style={{
          position: 'absolute', bottom: 90, right: 12, zIndex: 200,
          background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 16,
          padding: '16px 20px', minWidth: 240, animation: 'fadeSlideIn .2s ease',
          boxShadow: '0 8px 28px rgba(0,0,0,.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, letterSpacing: 2 }}>💰 REVENUE SPLIT</div>
            <button onClick={function() { setShowRevSplit(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

          {(function() {
            var total   = sessionEarningsCents || 0;
            var creator = Math.round(total * 0.70);
            var platform = Math.round(total * 0.30);
            var perCohost = 0;
            var cohostCount = 0;
            if (onStage) {
              onStage.forEach(function(g) { if (g.role === 'cohost') cohostCount++; });
            }
            if (role === 'cohost' && cohostCount > 0) {
              perCohost = Math.round((creator * 0.20) / cohostCount);
            }
            var rows = [
              { label: 'Host (70%)', value: creator, color: GOLD },
              { label: 'Platform (30%)', value: platform, color: MUTED },
            ];
            if (cohostCount > 0) {
              rows.splice(1, 0, { label: cohostCount + ' Co-host' + (cohostCount > 1 ? 's' : '') + ' (20% of host)', value: Math.round(creator * 0.20), color: TEAL });
              rows[0] = { label: 'Host (net 56%)', value: Math.round(total * 0.56), color: GOLD };
            }
            return (
              <div>
                {rows.map(function(r) {
                  return (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: .3 }}>{r.label}</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: r.color, letterSpacing: 1 }}>
                        ${(r.value / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <div style={{ height: 1, background: BORDER, margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: .3 }}>SESSION TOTAL</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1 }}>
                    ${(total / 100).toFixed(2)}
                  </span>
                </div>
                {perCohost > 0 && (
                  <div style={{ marginTop: 6, fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, textAlign: 'right' }}>
                    Your share: ${(perCohost / 100).toFixed(2)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════ BATCH 26: KARAOKE LYRICS OVERLAY ════════════════ */}
      {karaokeActive && karaokeText && (
        <div style={{
          position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)',
          zIndex: 86, maxWidth: '88%', textAlign: 'center', pointerEvents: 'none',
          animation: 'fadeSlideIn .3s ease',
        }}>
          <div style={{
            background: 'rgba(0,0,0,.78)', borderRadius: 14,
            padding: '12px 24px',
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 3,
            color: GOLD, textShadow: '0 2px 12px rgba(0,0,0,.8)',
            lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {karaokeText}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 26: KARAOKE EDIT MODAL (host) ════════════════ */}
      {showKaraokeEdit && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 215, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '24px 28px', width: 380, animation: 'fadeSlideIn .2s ease' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, letterSpacing: 2, marginBottom: 14 }}>🎤 LIVE LYRICS</div>
            <textarea value={karaokeInput} onChange={function(e) { setKaraokeInput(e.target.value); }}
              rows={4} maxLength={300}
              placeholder="Type lyrics or text to display on stream…"
              style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, textAlign: 'right', marginTop: 4 }}>{karaokeInput.length}/300</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={function() { if (socket) socket.emit('karaoke-clear', { roomId: roomId }); setShowKaraokeEdit(false); }}
                style={{ flex: 1, background: 'rgba(255,26,60,.1)', border: '1px solid ' + RED + '44', borderRadius: 10, padding: '10px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: RED, cursor: 'pointer' }}>
                CLEAR
              </button>
              <button onClick={function() { setShowKaraokeEdit(false); }}
                style={{ background: 'none', border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 16px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={function() {
                if (!karaokeInput.trim()) return;
                if (socket) socket.emit('karaoke-set', { roomId: roomId, text: karaokeInput.trim() });
                setShowKaraokeEdit(false);
              }}
                style={{ flex: 2, background: BURG, border: 'none', borderRadius: 10, padding: '10px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: TEXT, cursor: 'pointer', letterSpacing: 1.5 }}>
                🎤 SHOW LYRICS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 26: LUCKY DRAW PANEL ════════════════ */}
      {showLuckyDraw && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, zIndex: 200, background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 16, padding: '16px 20px', minWidth: 260, animation: 'fadeSlideIn .2s ease', boxShadow: '0 8px 28px rgba(0,0,0,.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, letterSpacing: 2 }}>🎰 LUCKY DRAW</div>
            <button onClick={function() { setShowLuckyDraw(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 6, letterSpacing: .5 }}>PRIZE (OPTIONAL)</div>
            <input value={luckyPrize} onChange={function(e) { setLuckyPrize(e.target.value); }}
              placeholder="e.g. 500 coins, shoutout, gift card…"
              style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={function() {
            if (socket) socket.emit('lucky-draw', { roomId: roomId, prize: luckyPrize });
          }}
            style={{ width: '100%', background: 'linear-gradient(135deg,' + BURG + ',' + GOLD + '66)', border: 'none', borderRadius: 10, padding: '12px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: TEXT, cursor: 'pointer', letterSpacing: 2 }}>
            🎰 SPIN &amp; PICK WINNER
          </button>
        </div>
      )}

      {/* ════════════════ BATCH 26: LUCKY DRAW WINNER BANNER ════════════════ */}
      {luckyWinner && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 230, textAlign: 'center', animation: 'milestoneIn .4s ease',
          pointerEvents: 'none',
        }}>
          <div style={{ background: 'linear-gradient(135deg,' + BURG + '88,' + CARD + 'EE)', border: '2px solid ' + GOLD, borderRadius: 20, padding: '28px 40px', backdropFilter: 'blur(12px)', boxShadow: '0 0 40px ' + GOLD + '44, 0 8px 40px rgba(0,0,0,.8)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎰</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>LUCKY WINNER</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: GOLD, letterSpacing: 4, lineHeight: 1 }}>{luckyWinner.winner}</div>
            {luckyWinner.prize && (
              <div style={{ marginTop: 10, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: TEXT }}>🎁 {luckyWinner.prize}</div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 26: STREAM CHAPTERS PANEL ════════════════ */}
      {showChapters && (
        <div style={{ position: 'absolute', top: 56, left: 16, zIndex: 200, background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 14, padding: '14px 16px', minWidth: 260, maxHeight: 360, overflowY: 'auto', animation: 'fadeSlideIn .2s ease', boxShadow: '0 8px 28px rgba(0,0,0,.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: GOLD, letterSpacing: 2 }}>📍 CHAPTERS</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {(role === 'host' || role === 'cohost') && (
                <button onClick={function() {
                  var label = window.prompt('Chapter name:');
                  if (!label || !label.trim()) return;
                  if (socket) socket.emit('chapter-mark', { roomId: roomId, label: label.trim() });
                }}
                  style={{ background: GOLD + '22', border: '1px solid ' + GOLD + '44', borderRadius: 6, padding: '4px 10px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, cursor: 'pointer' }}>
                  + MARK
                </button>
              )}
              <button onClick={function() { setShowChapters(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          </div>
          {streamChapters.length === 0 ? (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '16px 0' }}>No chapters marked yet</div>
          ) : (
            streamChapters.map(function(ch, i) {
              var mins  = Math.floor((ch.elapsed || 0) / 60);
              var secs  = (ch.elapsed || 0) % 60;
              var stamp = mins + ':' + (secs < 10 ? '0' : '') + secs;
              return (
                <div key={ch.ts || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: i < streamChapters.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEAL, flexShrink: 0, minWidth: 36 }}>{stamp}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT }}>{ch.label}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ════════════════ BATCH 27: SENTIMENT METER ════════════════ */}
      {showSentiment && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          zIndex: 92, minWidth: 300, animation: 'fadeSlideIn .2s ease',
          background: 'rgba(14,12,9,.9)', border: '1px solid ' + BORDER,
          borderRadius: 14, padding: '12px 18px', backdropFilter: 'blur(8px)',
        }}>
          {/* Tally numbers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#00CC66', letterSpacing: 2 }}>
              👍 {sentiment.up}
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
              VIEWER VIBE
            </span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: RED, letterSpacing: 2 }}>
              {sentiment.down} 👎
            </span>
          </div>
          {/* Sentiment bar */}
          {(function() {
            var total = (sentiment.up + sentiment.down) || 1;
            var upPct = Math.round((sentiment.up / total) * 100);
            return (
              <div style={{ height: 8, borderRadius: 99, background: RED + '44', overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: upPct + '%', background: 'linear-gradient(90deg,#00CC66,#44DD88)', borderRadius: 99, transition: 'width .5s ease' }} />
              </div>
            );
          })()}
          {/* Vote buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() {
              if (socket) socket.emit('sentiment-vote', { roomId: roomId, vote: 'up' });
              setMyVote('up');
            }}
              style={{ flex: 1, background: myVote === 'up' ? '#00CC6633' : CARD2, border: '1px solid ' + (myVote === 'up' ? '#00CC66' : BORDER), borderRadius: 10, padding: '8px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: myVote === 'up' ? '#00CC66' : MUTED, cursor: 'pointer' }}>
              👍 GOOD VIBES
            </button>
            <button onClick={function() {
              if (socket) socket.emit('sentiment-vote', { roomId: roomId, vote: 'down' });
              setMyVote('down');
            }}
              style={{ flex: 1, background: myVote === 'down' ? RED + '22' : CARD2, border: '1px solid ' + (myVote === 'down' ? RED : BORDER), borderRadius: 10, padding: '8px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: myVote === 'down' ? RED : MUTED, cursor: 'pointer' }}>
              👎 MEH
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 27: GUEST INTRO CARD ════════════════ */}
      {guestIntroCard && (
        <div style={{
          position: 'absolute', bottom: 140, left: 16, zIndex: 89,
          animation: 'fadeSlideIn .35s ease',
          maxWidth: 260,
        }}>
          <div style={{ background: 'linear-gradient(135deg,' + BURG + '88,' + CARD + 'EE)', border: '1.5px solid ' + GOLD + '66', borderRadius: 16, padding: '14px 18px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(201,168,76,.18)', border: '2px solid ' + GOLD + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {guestIntroCard.emoji || '🎤'}
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: GOLD, letterSpacing: 1.5, lineHeight: 1 }}>{guestIntroCard.username}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2, letterSpacing: .3 }}>JOINED THE STAGE</div>
              </div>
            </div>
            {guestIntroCard.bio && (
              <div style={{ marginTop: 8, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{guestIntroCard.bio}</div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 27: SCREEN ANNOTATE DOTS ════════════════ */}
      {screenAnnotDots.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 59, overflow: 'hidden' }}>
          {screenAnnotDots.map(function(dot) {
            return (
              <div key={dot.id} style={{
                position: 'absolute',
                left: dot.x + '%', top: dot.y + '%',
                transform: 'translate(-50%, -50%)',
                width: 18, height: 18, borderRadius: '50%',
                background: dot.color,
                animation: 'heatPop 4s ease-out forwards',
                boxShadow: '0 0 8px ' + dot.color + '88',
              }} />
            );
          })}
        </div>
      )}

      {/* ════════════════ BATCH 28: NOW PLAYING TICKER ════════════════ */}
      {nowPlaying && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 84,
          background: 'linear-gradient(90deg,' + BURG + 'CC,' + CARD + 'CC)',
          borderBottom: '1px solid ' + BORDER, padding: '5px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          backdropFilter: 'blur(6px)', overflow: 'hidden',
        }}>
          <span style={{ fontSize: 15, flexShrink: 0, animation: 'goldPulse 2s ease-in-out infinite' }}>{nowPlaying.emoji || '🎵'}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden', flex: 1 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, color: GOLD, letterSpacing: 2, flexShrink: 0 }}>NOW PLAYING</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nowPlaying.title}{nowPlaying.artist ? ' — ' + nowPlaying.artist : ''}
            </span>
          </div>
          {(role === 'host' || role === 'cohost') && (
            <button onClick={function() { if (socket) socket.emit('now-playing-set', { roomId: roomId, title: '' }); }}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>✕</button>
          )}
        </div>
      )}

      {/* ════════════════ BATCH 28: TIP TICKER ════════════════ */}
      {tipTickerItems.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 74, left: 0, right: 0, zIndex: 83,
          background: 'rgba(14,12,9,.88)', borderTop: '1px solid ' + BORDER,
          padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 10,
          backdropFilter: 'blur(4px)',
        }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1.5, flexShrink: 0 }}>💡 TIP</span>
          <span key={tipTickerIdx} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, animation: 'fadeSlideIn .3s ease', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {tipTickerItems[tipTickerIdx] && tipTickerItems[tipTickerIdx].text}
          </span>
          {tipTickerItems.length > 1 && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, flexShrink: 0 }}>{tipTickerIdx + 1}/{tipTickerItems.length}</span>
          )}
        </div>
      )}

      {/* ════════════════ BATCH 28: WATCH TIME BADGE (my own) ════════════════ */}
      {myWatchSecs >= 300 && (
        <div style={{
          position: 'absolute', top: nowPlaying ? 30 : 6, right: 60, zIndex: 85,
          background: 'rgba(14,12,9,.85)', border: '1px solid ' + (myWatchSecs >= 1800 ? GOLD : myWatchSecs >= 900 ? TEAL : BORDER),
          borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5,
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 11 }}>{myWatchSecs >= 1800 ? '👑' : myWatchSecs >= 900 ? '⭐' : '🕐'}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: myWatchSecs >= 1800 ? GOLD : myWatchSecs >= 900 ? TEAL : MUTED }}>
            {myWatchSecs >= 1800 ? '30m' : myWatchSecs >= 900 ? '15m' : '5m'} VIEWER
          </span>
        </div>
      )}

      {/* ════════════════ BATCH 28: NOW PLAYING EDIT MODAL ════════════════ */}
      {showNowPlayingEdit && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 218, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 26px', width: 360, animation: 'fadeSlideIn .2s ease' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: GOLD, letterSpacing: 2, marginBottom: 16 }}>🎵 NOW PLAYING</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>SONG TITLE *</div>
              <input value={nowPlayingInput.title} onChange={function(e) { setNowPlayingInput(function(s) { return Object.assign({}, s, { title: e.target.value }); }); }}
                placeholder="Song title…"
                style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: .5 }}>ARTIST (OPTIONAL)</div>
              <input value={nowPlayingInput.artist} onChange={function(e) { setNowPlayingInput(function(s) { return Object.assign({}, s, { artist: e.target.value }); }); }}
                placeholder="Artist name…"
                style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['🎵','🎸','🎹','🎷','🥁','🎺','🎻','🎤'].map(function(em) {
                return (
                  <button key={em} onClick={function() { setNowPlayingInput(function(s) { return Object.assign({}, s, { emoji: em }); }); }}
                    style={{ fontSize: 18, background: nowPlayingInput.emoji === em ? GOLD + '22' : 'none', border: '1px solid ' + (nowPlayingInput.emoji === em ? GOLD + '88' : 'transparent'), borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>
                    {em}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {nowPlaying && (
                <button onClick={function() { if (socket) socket.emit('now-playing-set', { roomId: roomId, title: '' }); setShowNowPlayingEdit(false); }}
                  style={{ flex: 1, background: 'rgba(255,26,60,.1)', border: '1px solid ' + RED + '44', borderRadius: 10, padding: '10px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: RED, cursor: 'pointer' }}>
                  CLEAR
                </button>
              )}
              <button onClick={function() { setShowNowPlayingEdit(false); }}
                style={{ background: 'none', border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={function() {
                if (!nowPlayingInput.title.trim()) return;
                if (socket) socket.emit('now-playing-set', { roomId: roomId, title: nowPlayingInput.title.trim(), artist: nowPlayingInput.artist.trim(), emoji: nowPlayingInput.emoji });
                setShowNowPlayingEdit(false);
              }}
                style={{ flex: 2, background: BURG, border: 'none', borderRadius: 10, padding: '10px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: TEXT, cursor: 'pointer', letterSpacing: 1.5 }}>
                🎵 SET TRACK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 28: TIP TICKER EDIT MODAL ════════════════ */}
      {showTipEdit && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 218, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 18, padding: '22px 26px', width: 380, animation: 'fadeSlideIn .2s ease' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: GOLD, letterSpacing: 2, marginBottom: 12 }}>📝 TIP TICKER</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 8 }}>Enter one tip per line (max 10 tips, 120 chars each)</div>
            <textarea value={tipEditInput} onChange={function(e) { setTipEditInput(e.target.value); }}
              rows={8} placeholder={'Tip 1: Use the reaction buttons to engage...\nTip 2: Subscribe for exclusive content...\nTip 3: Follow for notifications...'}
              style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={function() {
                if (socket) socket.emit('tip-ticker-set', { roomId: roomId, items: [] });
                setTipTickerItems([]);
                setShowTipEdit(false);
              }}
                style={{ flex: 1, background: 'rgba(255,26,60,.1)', border: '1px solid ' + RED + '44', borderRadius: 10, padding: '10px 0', fontFamily: "'DM Mono',monospace", fontSize: 9, color: RED, cursor: 'pointer' }}>
                CLEAR
              </button>
              <button onClick={function() { setShowTipEdit(false); }}
                style={{ background: 'none', border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={function() {
                var lines = tipEditInput.split('\n').map(function(l) { return l.trim(); }).filter(Boolean).slice(0, 10);
                var items = lines.map(function(t, i) { return { text: t.slice(0, 120), id: i }; });
                if (socket) socket.emit('tip-ticker-set', { roomId: roomId, items: items });
                setShowTipEdit(false);
              }}
                style={{ flex: 2, background: BURG, border: 'none', borderRadius: 10, padding: '10px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: TEXT, cursor: 'pointer', letterSpacing: 1.5 }}>
                📝 ACTIVATE TICKER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 29: TELEPROMPTER (HOST ONLY, LOCAL) ════════════════ */}
      {showTeleprompter && (role === 'host' || role === 'cohost') && (
        <div style={{
          position: 'absolute', top: 60, right: 16, zIndex: 225, width: 320,
          background: 'rgba(0,0,0,.92)', border: '1.5px solid ' + GOLD + '44',
          borderRadius: 14, overflow: 'hidden', animation: 'fadeSlideIn .2s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,.8)',
        }}>
          {/* Prompter header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(201,168,76,.08)', borderBottom: '1px solid ' + BORDER }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: GOLD, letterSpacing: 2 }}>📜 TELEPROMPTER</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={function() { setPrompterFontSize(function(s) { return Math.max(12, s - 2); }); }}
                style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 4, padding: '2px 7px', color: MUTED, cursor: 'pointer', fontSize: 11 }}>A-</button>
              <button onClick={function() { setPrompterFontSize(function(s) { return Math.min(40, s + 2); }); }}
                style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 4, padding: '2px 7px', color: MUTED, cursor: 'pointer', fontSize: 11 }}>A+</button>
              <button onClick={function() { setShowTeleprompter(false); }}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          </div>
          {/* Script display (scrollable) */}
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '14px 16px' }}>
            {prompterText ? (
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: prompterFontSize, color: TEXT, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {prompterText}
              </div>
            ) : (
              <textarea placeholder="Type your script / notes here…&#10;Only you can see this." rows={6}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: prompterFontSize, lineHeight: 1.5, resize: 'none', boxSizing: 'border-box' }}
                onChange={function(e) { setPrompterText(e.target.value); }} />
            )}
          </div>
          {prompterText && (
            <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
              <button onClick={function() { setPrompterText(''); }}
                style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '6px 0', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer' }}>
                EDIT
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ BATCH 29: POST-STREAM SUMMARY CARD ════════════════ */}
      {showSummaryCard && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 226, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 20, padding: '28px 32px', minWidth: 340, maxWidth: 420, animation: 'fadeSlideIn .25s ease', boxShadow: '0 12px 40px rgba(0,0,0,.7)' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: GOLD, letterSpacing: 3 }}>📋 STREAM SUMMARY</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4 }}>
                {streamInfo && streamInfo.title ? streamInfo.title : 'Live Session'}
              </div>
            </div>

            {/* Stats grid */}
            {(function() {
              var dur = liveElapsed || 0;
              var durMins = Math.floor(dur / 60);
              var durSecs = dur % 60;
              var statsRows = [
                { icon: '👥', label: 'Peak Viewers',   value: viewerCount || 0 },
                { icon: '⏱️', label: 'Duration',       value: durMins + 'm ' + durSecs + 's' },
                { icon: '💰', label: 'Total Earned',   value: '$' + ((sessionEarningsCents || 0) / 100).toFixed(2) },
                { icon: '🎁', label: 'Gifts Received', value: giftCount || 0 },
                { icon: '💬', label: 'Messages',       value: chat.length || 0 },
                { icon: '👑', label: 'Top Gifter',     value: (topFans && topFans[0]) ? topFans[0].username : '—' },
              ];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
                  {statsRows.map(function(row) {
                    return (
                      <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5 }}>{row.icon} {row.label}</span>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: TEXT, letterSpacing: 1 }}>{row.value}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Top reactions */}
            {Array.isArray(emojiTally) && emojiTally.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 6, letterSpacing: .5 }}>TOP REACTIONS</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {emojiTally.slice(0, 6).map(function(e) {
                    return (
                      <div key={e.emoji} style={{ display: 'flex', alignItems: 'center', gap: 4, background: CARD2, borderRadius: 20, padding: '4px 10px' }}>
                        <span style={{ fontSize: 15 }}>{e.emoji}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>{e.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={function() { setShowSummaryCard(false); }}
              style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 0', fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: MUTED, cursor: 'pointer', letterSpacing: 1.5 }}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 30: LIVE WORD CLOUD ════════════════ */}
      {showWordCloud && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 227, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: CARD, border: '1.5px solid ' + BORDER, borderRadius: 20, padding: '22px 28px', width: '90%', maxWidth: 480, animation: 'fadeSlideIn .25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, letterSpacing: 2 }}>☁️ WORD CLOUD</div>
              <button onClick={function() { setShowWordCloud(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 120 }}>
              {(function() {
                var STOP = new Set(['the','a','an','and','or','in','is','it','to','of','for','on','at','we','be','so','but','as','if','by','up','do','go','my','me','you','he','she','they','are','was','not','this','that','with','from','have','has','will','can','get','all','just','im','its','its','i','its','i\'m','lol','oh','ok','yeah','yes','no']);
                var words = {};
                chat.slice(-100).forEach(function(msg) {
                  if (!msg.message) return;
                  msg.message.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).forEach(function(w) {
                    if (w.length < 2 || STOP.has(w)) return;
                    words[w] = (words[w] || 0) + 1;
                  });
                });
                var sorted = Object.entries(words).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 40);
                var max = sorted[0] ? sorted[0][1] : 1;
                var COLORS = [GOLD, TEAL, RED, '#4A90D9', '#00CC66', TEXT, '#CC44FF', '#FF8C00'];
                if (sorted.length === 0) {
                  return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, textAlign: 'center', width: '100%', padding: '20px 0' }}>No chat messages yet</div>;
                }
                return sorted.map(function(entry, i) {
                  var size = Math.max(11, Math.round(12 + (entry[1] / max) * 22));
                  var color = COLORS[i % COLORS.length];
                  return (
                    <span key={entry[0]} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: size, color: color, letterSpacing: Math.max(0.5, size * 0.05), opacity: 0.7 + (entry[1] / max) * 0.3, cursor: 'default' }}>
                      {entry[0]}
                    </span>
                  );
                });
              })()}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, textAlign: 'center', marginTop: 12 }}>Based on last 100 chat messages</div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 30: COMPARE PANEL ════════════════ */}
      {showCompare && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 228, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: CARD, borderBottom: '1px solid ' + BORDER, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, color: GOLD, letterSpacing: 2 }}>🔀 COMPARE</span>
            {!compareUrl && (
              <input value={compareInput} onChange={function(e) { setCompareInput(e.target.value); }}
                placeholder="Paste YouTube or video URL to compare…"
                style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
                onKeyDown={function(e) { if (e.key === 'Enter' && compareInput.trim()) setCompareUrl(compareInput.trim()); }} />
            )}
            {!compareUrl && (
              <button onClick={function() { if (compareInput.trim()) setCompareUrl(compareInput.trim()); }}
                style={{ background: BURG, border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color: TEXT, cursor: 'pointer', letterSpacing: 1 }}>
                LOAD
              </button>
            )}
            {compareUrl && (
              <button onClick={function() { setCompareUrl(''); setCompareInput(''); }}
                style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px 12px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer' }}>
                CHANGE URL
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={function() { setShowCompare(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          {compareUrl ? (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid ' + GOLD + '44', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, left: 12, fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, background: 'rgba(0,0,0,.7)', borderRadius: 4, padding: '2px 8px' }}>THIS STREAM</div>
                <div style={{ color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10 }}>Your live video</div>
              </div>
              <div style={{ flex: 1, background: '#000', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, left: 12, zIndex: 2, fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, letterSpacing: 1, background: 'rgba(0,0,0,.7)', borderRadius: 4, padding: '2px 8px' }}>COMPARISON</div>
                <iframe src={compareUrl.includes('youtube.com/watch') ? compareUrl.replace('watch?v=', 'embed/') : compareUrl}
                  allow="autoplay; fullscreen"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="comparison" />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 40 }}>🔀</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10 }}>Enter a URL above to load the comparison panel</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ BATCH 30: HIGHLIGHTS TIMELINE ════════════════ */}
      {showHighlightLine && highlights.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 74, left: 0, right: 0, zIndex: 82,
          background: 'rgba(14,12,9,.94)', borderTop: '1px solid ' + BORDER,
          padding: '8px 16px', backdropFilter: 'blur(6px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1.5 }}>⚡ HOT MOMENTS</span>
            <button onClick={function() { setShowHighlightLine(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 11, marginLeft: 'auto' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {highlights.slice(0, 20).map(function(h, i) {
              var elapsed = liveElapsed || 0;
              var pct = elapsed > 0 ? Math.round(((h.windowStart || 0) / elapsed) * 100) : i * 5;
              return (
                <div key={h.windowKey || i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 6, height: 24, background: 'linear-gradient(to top,' + RED + ',' + GOLD + ')', borderRadius: 3 }} />
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: TEAL, whiteSpace: 'nowrap' }}>{h.count || h.msgCount || '?'}msg</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 31: GIFT GOAL METER ════════════════ */}
      {giftGoal && (
        <div style={{
          position: 'absolute', bottom: showHighlightLine && highlights.length > 0 ? 120 : 74, left: 10, right: 10, zIndex: 83,
          background: 'rgba(14,12,9,.92)', border: '1px solid ' + (goalComplete ? GOLD : BORDER),
          borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(6px)',
          animation: goalComplete ? 'goalComplete 0.6s ease 3' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>🎯</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, flex: 1 }}>{giftGoal.label}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: GOLD }}>
              ${((giftGoal.current || 0) / 100).toFixed(2)} / ${((giftGoal.target || 1) / 100).toFixed(2)}
            </span>
            <button onClick={function() { setGiftGoal(null); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
          {(function() {
            var pct = Math.min(100, Math.round(((giftGoal.current || 0) / (giftGoal.target || 1)) * 100));
            return (
              <div style={{ height: 8, background: CARD2, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: 'linear-gradient(90deg,' + BURG + ',' + GOLD + ')',
                  borderRadius: 4, width: pct + '%', transition: 'width .5s ease',
                }} />
              </div>
            );
          })()}
          {goalComplete && (
            <div style={{ textAlign: 'center', marginTop: 6, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: GOLD }}>
              🎉 GOAL REACHED!
            </div>
          )}
        </div>
      )}

      {/* ════════════════ BATCH 31: GIFT GOAL SETUP PANEL (host only) ════════════════ */}
      {showGiftGoal && (role === 'host' || role === 'cohost') && (
        <div style={{
          position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)',
          zIndex: 95, background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
          padding: 18, width: 280, backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: GOLD, letterSpacing: 1 }}>🎯 GIFT GOAL</span>
            <button onClick={function() { setShowGiftGoal(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 4, letterSpacing: 1 }}>LABEL</div>
            <input
              value={goalInput.label}
              onChange={function(e) { setGoalInput(function(p) { return Object.assign({}, p, { label: e.target.value }); }); }}
              placeholder="Stream Goal"
              style={{ width: '100%', background: SURF, border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 4, letterSpacing: 1 }}>TARGET ($)</div>
            <input
              type="number"
              value={(goalInput.target / 100).toFixed(0)}
              onChange={function(e) { setGoalInput(function(p) { return Object.assign({}, p, { target: Math.max(1, (parseInt(e.target.value) || 1) * 100) }); }); }}
              style={{ width: '100%', background: SURF, border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() {
              if (socket) socket.emit('gift-goal-set', { roomId: roomId, target: goalInput.target, label: goalInput.label });
              setShowGiftGoal(false);
            }} style={{ flex: 1, background: GOLD, color: BG, border: 'none', borderRadius: 8, padding: '8px 0', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              SET GOAL
            </button>
            {giftGoal && (
              <button onClick={function() {
                if (socket) socket.emit('gift-goal-set', { roomId: roomId, target: 0 });
                setGiftGoal(null); setShowGiftGoal(false);
              }} style={{ background: CARD2, color: MUTED, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>
                CLEAR
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 31: STREAM MOOD RING ════════════════ */}
      {showMoodPanel && (
        <div style={{
          position: 'absolute', bottom: 64, right: 10, zIndex: 95,
          background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
          padding: 14, width: 220, backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: GOLD, letterSpacing: 1 }}>🎭 STREAM MOOD</span>
            <button onClick={function() { setShowMoodPanel(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
          {streamMood && (
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 36, animation: 'moodPulse 1.5s ease infinite', display: 'inline-block' }}>{streamMood.emoji}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, marginTop: 4 }}>{streamMood.label.toUpperCase()}</div>
            </div>
          )}
          {!streamMood && (
            <div style={{ textAlign: 'center', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, marginBottom: 12 }}>No votes yet</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { key: 'fire', emoji: '🔥', label: 'Hot' },
              { key: 'party', emoji: '🎉', label: 'Party' },
              { key: 'chill', emoji: '💜', label: 'Chill' },
              { key: 'love', emoji: '❤️', label: 'Love' },
              { key: 'wow', emoji: '😮', label: 'Wow' },
            ].map(function(m) {
              var cnt = streamMood && streamMood.counts ? (streamMood.counts[m.key] || 0) : 0;
              var isActive = myMoodVote === m.key;
              var isDominant = streamMood && streamMood.key === m.key;
              return (
                <button key={m.key} onClick={function() {
                  if (socket) socket.emit('mood-vote', { roomId: roomId, key: m.key });
                  setMyMoodVote(m.key);
                }} style={{
                  background: isDominant ? 'rgba(201,168,76,.15)' : CARD2,
                  border: '1px solid ' + (isActive ? GOLD : (isDominant ? 'rgba(201,168,76,.4)' : BORDER)),
                  borderRadius: 8, padding: '6px 4px', cursor: 'pointer', color: TEXT,
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13,
                }}>
                  <span style={{ fontSize: 16 }}>{m.emoji}</span>
                  <span>{m.label}</span>
                  {cnt > 0 && <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>{cnt}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {streamMood && !showMoodPanel && (
        <div onClick={function() { setShowMoodPanel(true); }} style={{
          position: 'absolute', top: 50, right: 10, zIndex: 70,
          background: 'rgba(14,12,9,.85)', border: '1px solid rgba(201,168,76,.25)',
          borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          animation: 'moodPulse 2s ease infinite',
        }}>
          <span style={{ fontSize: 16 }}>{streamMood.emoji}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, letterSpacing: 1 }}>{streamMood.label.toUpperCase()}</span>
        </div>
      )}

      {/* ════════════════ BATCH 32: CO-HOST QUEUE PANEL (host only) ════════════════ */}
      {showCohostQueue && role === 'host' && (
        <div style={{
          position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: 96, background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
          padding: 16, width: 280, backdropFilter: 'blur(8px)', maxHeight: 360, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: GOLD, letterSpacing: 1 }}>👥 CO-HOST QUEUE</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginLeft: 4 }}>{cohostQueue.length} waiting</span>
            <button onClick={function() { setShowCohostQueue(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {cohostQueue.length === 0 && (
            <div style={{ textAlign: 'center', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, padding: '20px 0' }}>No requests yet</div>
          )}
          {cohostQueue.map(function(entry, i) {
            return (
              <div key={entry.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < cohostQueue.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, width: 14 }}>{i + 1}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, flex: 1 }}>{entry.username}</span>
                <button onClick={function() {
                  if (socket) socket.emit('cohost-queue-approve', { roomId: roomId, userId: entry.userId });
                }} style={{ background: GOLD, color: BG, border: 'none', borderRadius: 6, padding: '4px 10px', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer', fontWeight: 700 }}>
                  APPROVE
                </button>
                <button onClick={function() {
                  if (socket) socket.emit('cohost-queue-dismiss', { roomId: roomId, userId: entry.userId });
                }} style={{ background: 'none', color: MUTED, border: '1px solid ' + BORDER, borderRadius: 6, padding: '4px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Co-host queue notification badge for host */}
      {role === 'host' && cohostQueue.length > 0 && !showCohostQueue && (
        <div onClick={function() { setShowCohostQueue(true); }} style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 75, background: BURG, border: '1px solid rgba(255,26,60,.4)',
          borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ fontSize: 14 }}>✋</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEXT, letterSpacing: 0.5 }}>{cohostQueue.length} CO-HOST REQUEST{cohostQueue.length !== 1 ? 'S' : ''}</span>
        </div>
      )}

      {/* ════════════════ BATCH 32: MY BADGES STRIP ════════════════ */}
      {myBadges.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)',
          zIndex: 72, background: 'rgba(14,12,9,.88)', border: '1px solid rgba(201,168,76,.2)',
          borderRadius: 20, padding: '4px 14px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>BADGES</span>
          {myBadges.map(function(b, i) { return <span key={i} style={{ fontSize: 18 }}>{b}</span>; })}
        </div>
      )}

      {/* ════════════════ BATCH 33: REACTION COMBO OVERLAY ════════════════ */}
      {reactCombo && (
        <div style={{
          position: 'absolute', right: 14, bottom: 200, zIndex: 88, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          animation: 'comboFlash 1.8s ease forwards',
        }}>
          <span style={{ fontSize: 36 }}>{reactCombo.emoji}</span>
          <div style={{
            fontFamily: "'Bebas Neue',cursive", fontSize: 22, letterSpacing: 2,
            color: reactCombo.count >= 50 ? RED : reactCombo.count >= 10 ? GOLD : TEAL,
            textShadow: '0 0 12px currentColor',
          }}>×{reactCombo.count}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1 }}>COMBO</div>
        </div>
      )}

      {/* ════════════════ BATCH 33: VIEWER SPOTLIGHT BANNER ════════════════ */}
      {viewerSpotlight && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 87, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            background: 'rgba(14,12,9,.9)', border: '2px solid ' + GOLD, borderRadius: 16,
            padding: '16px 28px', textAlign: 'center',
            animation: 'spotlightGlow 1.5s ease infinite',
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎲</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: GOLD, letterSpacing: 2 }}>VIEWER SPOTLIGHT</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 24, color: TEXT, marginTop: 4 }}>
              {viewerSpotlight.username}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4, letterSpacing: 1 }}>
              YOU'RE IN THE SPOTLIGHT!
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 34: GUEST ENTRANCE STINGER ════════════════ */}
      {guestEntrance && (
        <div style={{
          position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
          zIndex: 88, pointerEvents: 'none', whiteSpace: 'nowrap',
          animation: 'entranceSlide 3.5s ease forwards',
        }}>
          <div style={{
            background: 'linear-gradient(135deg,' + BURG + ',' + CARD + ')',
            border: '1.5px solid ' + GOLD, borderRadius: 12,
            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 24 }}>{guestEntrance.emoji || '🎤'}</span>
            <div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 10, color: GOLD, letterSpacing: 2, marginBottom: 2 }}>JUST JOINED THE STAGE</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEXT }}>{guestEntrance.username}</div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 34: STARRED MESSAGES PANEL ════════════════ */}
      {showStarred && (
        <div style={{
          position: 'absolute', top: 60, right: 10, zIndex: 94,
          background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
          padding: 14, width: 260, backdropFilter: 'blur(8px)', maxHeight: 340, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: GOLD, letterSpacing: 1 }}>⭐ TOP MESSAGES</span>
            <button onClick={function() { setShowStarred(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
          {starredMsgs.length === 0 && (
            <div style={{ textAlign: 'center', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, padding: '16px 0' }}>Star chat messages to highlight them</div>
          )}
          {starredMsgs.slice(0, 10).map(function(m) {
            return (
              <div key={m.id} style={{ marginBottom: 8, padding: '6px 8px', background: CARD2, borderRadius: 8, borderLeft: '2px solid ' + GOLD }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{m.username}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>⭐ {m.starCount}</span>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, lineHeight: 1.3 }}>{m.message}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ BATCH 34: CHAT RAFFLE PANEL (host only) ════════════════ */}
      {showRafflePanel && (role === 'host' || role === 'cohost') && (
        <div style={{
          position: 'absolute', bottom: 64, left: 10, zIndex: 95,
          background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
          padding: 16, width: 260, backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: GOLD, letterSpacing: 1 }}>🎰 CHAT RAFFLE</span>
            <button onClick={function() { setShowRafflePanel(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {!chatRaffle ? (
            <div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 4, letterSpacing: 1 }}>KEYWORD (viewers type to enter)</div>
                <input value={raffleInput.keyword} onChange={function(e) { setRaffleInput(function(p) { return Object.assign({}, p, { keyword: e.target.value }); }); }}
                  style={{ width: '100%', background: SURF, border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 4, letterSpacing: 1 }}>PRIZE (optional)</div>
                <input value={raffleInput.prize} onChange={function(e) { setRaffleInput(function(p) { return Object.assign({}, p, { prize: e.target.value }); }); }}
                  style={{ width: '100%', background: SURF, border: '1px solid ' + BORDER, borderRadius: 6, padding: '6px 8px', color: TEXT, fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <button onClick={function() {
                if (socket) socket.emit('chat-raffle-start', { roomId: roomId, keyword: raffleInput.keyword.toLowerCase().trim() });
              }} style={{ width: '100%', background: GOLD, color: BG, border: 'none', borderRadius: 8, padding: '8px 0', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                START RAFFLE
              </button>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>TYPE <span style={{ color: GOLD }}>{chatRaffle.keyword}</span> TO ENTER</div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: TEAL }}>{chatRaffle.count || 0}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>entries</div>
              </div>
              <button onClick={function() {
                if (socket) socket.emit('chat-raffle-draw', { roomId: roomId, prize: raffleInput.prize });
              }} style={{ width: '100%', background: BURG, color: TEXT, border: 'none', borderRadius: 8, padding: '10px 0', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
                🎲 DRAW WINNER
              </button>
            </div>
          )}
        </div>
      )}

      {/* Raffle winner announcement */}
      {raffleWinner && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 99, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'comboFlash 1s ease',
        }}>
          <div style={{
            background: 'rgba(14,12,9,.96)', border: '2px solid ' + GOLD, borderRadius: 16,
            padding: '20px 32px', textAlign: 'center',
            boxShadow: '0 0 32px rgba(201,168,76,.4)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎰</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: MUTED, letterSpacing: 2 }}>RAFFLE WINNER</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 28, color: GOLD, marginTop: 4 }}>{raffleWinner.winner}</div>
            {raffleWinner.prize && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL, marginTop: 6 }}>Prize: {raffleWinner.prize}</div>}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4 }}>from {raffleWinner.count} entries</div>
          </div>
        </div>
      )}

      {/* ── Fan Wall overlay ─────────────────────────────────────────── */}
      {showFanWall && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8,11,18,.92)', zIndex: 180, display: 'flex', flexDirection: 'column',
          padding: '16px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: GOLD, letterSpacing: 2 }}>🏆 FAN WALL</span>
            <div onClick={function() { setShowFanWall(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {fanWall.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15 }}>
              Be the first to appear here — react, chat, or send a gift!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {fanWall.slice(0, 9).map(function(fan, idx) {
                var medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1);
                return (
                  <div key={fan.userId} style={{
                    background: idx === 0 ? 'rgba(201,168,76,.12)' : CARD,
                    border: '1px solid ' + (idx === 0 ? 'rgba(201,168,76,.35)' : BORDER),
                    borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: CARD2, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: GOLD, border: '2px solid ' + (idx < 3 ? GOLD : BORDER) }}>
                      {fan.username ? fan.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fan.username || 'Fan'}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD }}>{medal}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: TEAL, marginTop: 2 }}>{fan.points} pts</div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 16, padding: '10px 12px', background: CARD, borderRadius: 10, border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: 1 }}>ENERGY SCORE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: streamEnergy + '%', background: streamEnergy > 80 ? RED : streamEnergy > 50 ? GOLD : TEAL, borderRadius: 3, transition: 'width 1s ease' }} />
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: streamEnergy > 80 ? RED : GOLD, minWidth: 28 }}>{streamEnergy}%</span>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: MUTED, marginTop: 6 }}>
              {streamEnergy < 20 ? 'Warm it up — react, chat, and gift!' : streamEnergy < 50 ? "Chat's warming up " : streamEnergy < 80 ? 'Stream is 🔥 — keep going!' : 'PEAK ENERGY — crowd is going wild!'}
            </div>
          </div>
        </div>
      )}

      {/* ── Audience Challenge banner ────────────────────────────────── */}
      {audienceChallenge && (
        <div style={{
          position: 'absolute', bottom: 130, left: 10, right: 10, zIndex: 190,
          background: 'rgba(14,12,9,.95)', border: '1.5px solid ' + GOLD, borderRadius: 14,
          padding: '12px 16px', boxShadow: '0 0 24px rgba(201,168,76,.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: GOLD, letterSpacing: 2 }}>⚡ HOST CHALLENGE</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{audienceChallenge.responseCount || 0} responses</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 16, color: TEXT, marginBottom: 10 }}>{audienceChallenge.text}</div>
          {!challengeResponded && (
            <button onClick={function() {
              if (socket) { socket.emit('audience-challenge-respond', { roomId: roomId }); setChallengeResponded(true); }
            }} style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '7px 18px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: '#0E0C09', cursor: 'pointer' }}>
              ✓ I Did It!
            </button>
          )}
          {challengeResponded && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL }}>✓ Responded!</span>
          )}
        </div>
      )}

      {/* ── Audience Challenge setup panel ──────────────────────────── */}
      {showChallengeSet && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>⚡ AUDIENCE CHALLENGE</span>
            <div onClick={function() { setShowChallengeSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <textarea value={challengeDraft.text} onChange={function(e) { var v = e.target.value.slice(0, 120); setChallengeDraft(function(s) { return Object.assign({}, s, { text: v }); }); }} placeholder="e.g. Say hello in your native language!" rows={3} style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>DURATION (sec)</span>
            {[30, 60, 120].map(function(s) {
              return <button key={s} onClick={function() { setChallengeDraft(function(d) { return Object.assign({}, d, { durationSecs: s }); }); }} style={{ background: challengeDraft.durationSecs === s ? GOLD : CARD2, border: '1px solid ' + (challengeDraft.durationSecs === s ? GOLD : BORDER), borderRadius: 8, padding: '4px 12px', color: challengeDraft.durationSecs === s ? '#0E0C09' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>{s}s</button>;
            })}
          </div>
          <button onClick={function() {
            if (!challengeDraft.text.trim()) return;
            if (socket) socket.emit('audience-challenge-set', { roomId: roomId, text: challengeDraft.text.trim(), durationSecs: challengeDraft.durationSecs });
            setShowChallengeSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>LAUNCH CHALLENGE</button>
        </div>
      )}

      {/* ── BRB / Intermission screen ───────────────────────────────── */}
      {brbMode && brbMode.active && role !== 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.97)', zIndex: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⏸</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: GOLD, letterSpacing: 3 }}>BE RIGHT BACK</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 18, color: TEXT, textAlign: 'center', maxWidth: 260 }}>{brbMode.message || 'Hang tight…'}</div>
          {brbMode.returnEta && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: MUTED }}>Back in ~{Math.ceil(brbMode.returnEta / 60)} min</div>
          )}
        </div>
      )}

      {/* ── BRB setup panel (host) ──────────────────────────────────── */}
      {showBrbSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>⏸ BRB MODE</span>
            <div onClick={function() { setShowBrbSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={brbDraft.message} onChange={function(e) { setBrbDraft(function(s) { return Object.assign({}, s, { message: e.target.value.slice(0, 100) }); }); }} placeholder="Be Right Back…" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>EST. RETURN (s)</span>
            {[60, 120, 300].map(function(s) {
              return <button key={s} onClick={function() { setBrbDraft(function(d) { return Object.assign({}, d, { returnEta: s }); }); }} style={{ background: brbDraft.returnEta === s ? GOLD : CARD2, border: '1px solid ' + (brbDraft.returnEta === s ? GOLD : BORDER), borderRadius: 8, padding: '4px 10px', color: brbDraft.returnEta === s ? '#0E0C09' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>{s / 60}m</button>;
            })}
          </div>
          <button onClick={function() {
            if (socket) socket.emit('brb-toggle', { roomId: roomId, active: true, message: brbDraft.message, returnEta: brbDraft.returnEta });
            setShowBrbSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>ACTIVATE BRB</button>
        </div>
      )}

      {/* ── Flash Drop banner ───────────────────────────────────────── */}
      {flashDrop && (
        <div style={{
          position: 'absolute', bottom: 170, left: 10, right: 10, zIndex: 190,
          background: 'linear-gradient(135deg, rgba(14,12,9,.97) 0%, rgba(36,28,18,.97) 100%)',
          border: '2px solid ' + GOLD, borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 0 32px rgba(201,168,76,.4)',
          animation: 'entranceSlide .4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: RED, letterSpacing: 2 }}>🛒 FLASH DROP</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>LIMITED TIME</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEXT }}>{flashDrop.name}</div>
          {flashDrop.price && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: GOLD, marginTop: 2 }}>{flashDrop.price}</div>}
          {flashDrop.url && (
            <a href={flashDrop.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, background: GOLD, color: '#0E0C09', borderRadius: 8, padding: '6px 16px', fontFamily: "'Bebas Neue',cursive", fontSize: 14, textDecoration: 'none', letterSpacing: 1 }}>GET IT NOW</a>
          )}
        </div>
      )}

      {/* ── Flash Drop setup panel (host) ───────────────────────────── */}
      {showFlashDropSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>🛒 FLASH DROP</span>
            <div onClick={function() { setShowFlashDropSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={flashDraft.name} onChange={function(e) { setFlashDraft(function(s) { return Object.assign({}, s, { name: e.target.value.slice(0, 60) }); }); }} placeholder="Product name" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <input value={flashDraft.price} onChange={function(e) { setFlashDraft(function(s) { return Object.assign({}, s, { price: e.target.value.slice(0, 20) }); }); }} placeholder="Price (e.g. $24.99)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <input value={flashDraft.url} onChange={function(e) { setFlashDraft(function(s) { return Object.assign({}, s, { url: e.target.value.slice(0, 300) }); }); }} placeholder="Buy link (optional)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>TIMER</span>
            {[30, 60, 120].map(function(s) {
              return <button key={s} onClick={function() { setFlashDraft(function(d) { return Object.assign({}, d, { durationSecs: s }); }); }} style={{ background: flashDraft.durationSecs === s ? GOLD : CARD2, border: '1px solid ' + (flashDraft.durationSecs === s ? GOLD : BORDER), borderRadius: 8, padding: '4px 10px', color: flashDraft.durationSecs === s ? '#0E0C09' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>{s}s</button>;
            })}
          </div>
          <button onClick={function() {
            if (!flashDraft.name.trim()) return;
            if (socket) socket.emit('flash-drop-start', { roomId: roomId, name: flashDraft.name.trim(), price: flashDraft.price.trim(), url: flashDraft.url.trim(), durationSecs: flashDraft.durationSecs });
            setShowFlashDropSet(false);
          }} style={{ background: RED, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#fff', cursor: 'pointer', letterSpacing: 1 }}>DROP IT NOW</button>
        </div>
      )}

      {/* ── Applause burst overlay ──────────────────────────────────── */}
      {applauseBurst && (
        <div style={{
          position: 'absolute', top: '30%', left: 0, right: 0, zIndex: 300,
          pointerEvents: 'none', textAlign: 'center',
          animation: 'comboFlash 1.8s ease forwards',
        }}>
          <div style={{ fontSize: 52 }}>👏</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: GOLD, letterSpacing: 3 }}>{applauseBurst.count} CLAPS!</div>
        </div>
      )}

      {/* ── Chat color picker ──────────────────────────────────────── */}
      {showColorPicker && (
        <div style={{ position: 'absolute', bottom: 120, right: 10, zIndex: 210, background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 14px', boxShadow: '0 4px 24px rgba(0,0,0,.6)' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 10, letterSpacing: 1 }}>PICK YOUR CHAT COLOR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 160 }}>
            {['#FF4444','#FF8C00','#FFD700','#00CC66','#00BFFF','#A855F7','#FF69B4','#FF1A3C','#C9A84C','#D4854A'].map(function(c) {
              return (
                <div key={c} onClick={function() {
                  if (socket) socket.emit('set-chat-color', { roomId: roomId, color: c });
                  setShowColorPicker(false);
                }} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: myChatColor === c ? '2px solid #fff' : '2px solid transparent', boxSizing: 'border-box' }} />
              );
            })}
          </div>
          <div onClick={function() { setShowColorPicker(false); }} style={{ marginTop: 10, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer' }}>CLOSE</div>
        </div>
      )}

      {/* ── Lower Third overlay ─────────────────────────────────────── */}
      {lowerThird && (
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 160,
          background: 'linear-gradient(90deg, rgba(14,12,9,.97) 0%, rgba(26,21,16,.97) 60%, rgba(14,12,9,.0) 100%)',
          padding: '10px 18px', borderLeft: '4px solid ' + GOLD,
          animation: 'entranceSlide .3s ease',
        }}>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2, lineHeight: 1 }}>{lowerThird.title}</div>
          {lowerThird.subtitle && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, marginTop: 2 }}>{lowerThird.subtitle}</div>}
        </div>
      )}

      {/* ── Lower Third setup panel ─────────────────────────────────── */}
      {showLowerThirdSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>📺 LOWER THIRD</span>
            <div onClick={function() { setShowLowerThirdSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={lowerThirdDraft.title} onChange={function(e) { setLowerThirdDraft(function(s) { return Object.assign({}, s, { title: e.target.value.slice(0, 80) }); }); }} placeholder="Title (e.g. Hosted by @username)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <input value={lowerThirdDraft.subtitle} onChange={function(e) { setLowerThirdDraft(function(s) { return Object.assign({}, s, { subtitle: e.target.value.slice(0, 120) }); }); }} placeholder="Subtitle (optional)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED }}>DURATION</span>
            {[5, 10, 20, 30].map(function(s) {
              return <button key={s} onClick={function() { setLowerThirdDraft(function(d) { return Object.assign({}, d, { durationSecs: s }); }); }} style={{ background: lowerThirdDraft.durationSecs === s ? GOLD : CARD2, border: '1px solid ' + (lowerThirdDraft.durationSecs === s ? GOLD : BORDER), borderRadius: 8, padding: '4px 10px', color: lowerThirdDraft.durationSecs === s ? '#0E0C09' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>{s}s</button>;
            })}
          </div>
          <button onClick={function() {
            if (!lowerThirdDraft.title.trim()) return;
            if (socket) socket.emit('lower-third-set', { roomId: roomId, title: lowerThirdDraft.title.trim(), subtitle: lowerThirdDraft.subtitle.trim(), durationSecs: lowerThirdDraft.durationSecs });
            setShowLowerThirdSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>PUSH LOWER THIRD</button>
        </div>
      )}

      {/* ── Emoji shower particle rain ──────────────────────────────── */}
      {showEmojiPicker37 && role === 'host' && (
        <div style={{ position: 'absolute', bottom: 120, right: 10, zIndex: 210, background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 14px', boxShadow: '0 4px 24px rgba(0,0,0,.6)' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 10, letterSpacing: 1 }}>EMOJI RAIN</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 150 }}>
            {['🎉','🔥','💜','❤️','💰','⭐','🎊','🌊','🎈','💎','🚀','🏆'].map(function(e) {
              return (
                <div key={e} onClick={function() {
                  if (socket) socket.emit('emoji-shower', { roomId: roomId, emoji: e });
                  setShowEmojiPicker37(false);
                }} style={{ fontSize: 22, cursor: 'pointer', padding: 2, borderRadius: 6, background: CARD2, width: 34, textAlign: 'center' }}>{e}</div>
              );
            })}
          </div>
          <div onClick={function() { setShowEmojiPicker37(false); }} style={{ marginTop: 10, textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer' }}>CLOSE</div>
        </div>
      )}

      {/* ── Emoji shower animation ──────────────────────────────────── */}
      {emojiShower && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 290, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 18 }).map(function(_, i) {
            var left = (5 + (i * 5.5) % 90) + '%';
            var delay = (i * 0.08) + 's';
            var dur = (1.4 + (i % 3) * 0.3) + 's';
            return (
              <div key={i} style={{ position: 'absolute', top: '-50px', left: left, fontSize: 28 + (i % 4) * 4, animation: 'entranceSlide ' + dur + ' ease ' + delay + ' forwards', opacity: 0.9 }}>
                {emojiShower.emoji}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Shoutout card ───────────────────────────────────────────── */}
      {shoutoutCard && (
        <div style={{
          position: 'absolute', top: '20%', left: '5%', right: '5%', zIndex: 280,
          background: 'rgba(14,12,9,.97)', border: '2px solid ' + GOLD, borderRadius: 18,
          padding: '24px 20px', textAlign: 'center',
          boxShadow: '0 0 48px rgba(201,168,76,.5)',
          animation: 'spotlightGlow 1s ease',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📣</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, letterSpacing: 2, marginBottom: 6 }}>SHOUTOUT TO</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: TEXT, letterSpacing: 2 }}>{shoutoutCard.username}</div>
          {shoutoutCard.message && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>{shoutoutCard.message}</div>
          )}
        </div>
      )}

      {/* ── Shoutout setup panel ────────────────────────────────────── */}
      {showShoutoutSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>📣 SHOUTOUT</span>
            <div onClick={function() { setShowShoutoutSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={shoutoutDraft.username} onChange={function(e) { setShoutoutDraft(function(s) { return Object.assign({}, s, { username: e.target.value.slice(0, 40) }); }); }} placeholder="Username to shoutout" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <textarea value={shoutoutDraft.message} onChange={function(e) { setShoutoutDraft(function(s) { return Object.assign({}, s, { message: e.target.value.slice(0, 120) }); }); }} placeholder="Add a message (optional)" rows={2} style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
          <button onClick={function() {
            if (!shoutoutDraft.username.trim()) return;
            if (socket) socket.emit('shoutout-card', { roomId: roomId, username: shoutoutDraft.username.trim(), message: shoutoutDraft.message.trim() });
            setShowShoutoutSet(false);
            setShoutoutDraft({ username: '', message: '' });
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>SEND SHOUTOUT</button>
        </div>
      )}

      {/* ── Chat Theme picker ─────────────────────────────────────────── */}
      {showThemePicker && role === 'host' && (
        <div style={{ position: 'absolute', bottom: 120, right: 10, zIndex: 210, background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, padding: '12px 14px', boxShadow: '0 4px 24px rgba(0,0,0,.6)', minWidth: 160 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 10, letterSpacing: 1 }}>CHAT VIBE</div>
          {[
            { key: 'party',  emoji: '🎉', label: 'Party' },
            { key: 'chill',  emoji: '☁️', label: 'Chill' },
            { key: 'sports', emoji: '🏆', label: 'Sports' },
            { key: 'gaming', emoji: '🎮', label: 'Gaming' },
            { key: 'news',   emoji: '📰', label: 'News' },
          ].map(function(t) {
            return (
              <div key={t.key} onClick={function() {
                if (socket) socket.emit('chat-theme-set', { roomId: roomId, theme: chatTheme === t.key ? 'off' : t.key });
                setShowThemePicker(false);
              }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, background: chatTheme === t.key ? 'rgba(201,168,76,.15)' : 'transparent', cursor: 'pointer', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: chatTheme === t.key ? GOLD : TEXT }}>{t.label}</span>
                {chatTheme === t.key && <span style={{ fontSize: 10, color: GOLD, marginLeft: 'auto' }}>✓</span>}
              </div>
            );
          })}
          {chatTheme && <div onClick={function() { if (socket) socket.emit('chat-theme-set', { roomId: roomId, theme: 'off' }); setShowThemePicker(false); }} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 6, cursor: 'pointer', padding: '4px' }}>CLEAR THEME</div>}
          <div onClick={function() { setShowThemePicker(false); }} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 4, cursor: 'pointer', padding: '4px' }}>CLOSE</div>
        </div>
      )}

      {/* ── Live Scoreboard overlay ──────────────────────────────────── */}
      {scoreboard && (
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10, zIndex: 155,
          background: 'rgba(9,7,14,.94)', border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 12,
          padding: '10px 14px',
        }}>
          {scoreboard.title && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 2, textAlign: 'center', marginBottom: 6 }}>{scoreboard.title.toUpperCase()}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: scoreboard.teamA.color || RED, letterSpacing: 1, marginBottom: 2 }}>{scoreboard.teamA.name}</div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: scoreboard.teamA.color || RED, lineHeight: 1 }}>{scoreboard.teamA.score}</div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: MUTED }}>VS</div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: scoreboard.teamB.color || '#00BFFF', letterSpacing: 1, marginBottom: 2 }}>{scoreboard.teamB.name}</div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: scoreboard.teamB.color || '#00BFFF', lineHeight: 1 }}>{scoreboard.teamB.score}</div>
            </div>
          </div>
          {(role === 'host' || role === 'cohost') && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
              {[{t:'A',d:1},{t:'A',d:-1},{t:'B',d:1},{t:'B',d:-1}].map(function(b, i) {
                return <button key={i} onClick={function() { if (socket) socket.emit('scoreboard-score', { roomId: roomId, team: b.t, delta: b.d }); }} style={{ background: b.d > 0 ? (b.t === 'A' ? scoreboard.teamA.color : scoreboard.teamB.color) + '33' : CARD2, border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>{b.t} {b.d > 0 ? '+1' : '-1'}</button>;
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Scoreboard setup panel ──────────────────────────────────── */}
      {showScoreboardSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>🏅 SCOREBOARD</span>
            <div onClick={function() { setShowScoreboardSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={scoreboardDraft.title} onChange={function(e) { setScoreboardDraft(function(s) { return Object.assign({}, s, { title: e.target.value.slice(0, 60) }); }); }} placeholder="Match title" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input value={scoreboardDraft.teamAName} onChange={function(e) { setScoreboardDraft(function(s) { return Object.assign({}, s, { teamAName: e.target.value.slice(0, 30) }); }); }} placeholder="Team A name" style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(255,26,60,.3)', borderRadius: 10, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            <input value={scoreboardDraft.teamBName} onChange={function(e) { setScoreboardDraft(function(s) { return Object.assign({}, s, { teamBName: e.target.value.slice(0, 30) }); }); }} placeholder="Team B name" style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(0,191,255,.3)', borderRadius: 10, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={function() {
            if (socket) socket.emit('scoreboard-set', { roomId: roomId, title: scoreboardDraft.title, teamAName: scoreboardDraft.teamAName || 'Team A', teamBName: scoreboardDraft.teamBName || 'Team B', teamAColor: '#FF1A3C', teamBColor: '#00BFFF' });
            setShowScoreboardSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>START SCOREBOARD</button>
        </div>
      )}

      {/* ── Live Auction widget ─────────────────────────────────────── */}
      {auction && (
        <div style={{
          position: 'absolute', bottom: 170, left: 10, right: 10, zIndex: 185,
          background: 'rgba(9,7,14,.95)', border: '1.5px solid ' + GOLD, borderRadius: 14,
          padding: '12px 16px', animation: 'entranceSlide .4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: GOLD, letterSpacing: 2 }}>🔨 LIVE AUCTION</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginLeft: 'auto' }}>{auction.bidder ? 'Leading: ' + auction.bidder : 'No bids yet'}</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, marginBottom: 2 }}>{auction.item}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: GOLD, marginBottom: 8 }}>Current Bid: ${auction.currentBid}</div>
          {role === 'viewer' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={myBid} onChange={function(e) { setMyBid(e.target.value); }} type="number" placeholder={'>' + auction.currentBid} style={{ flex: 1, background: CARD2, border: '1px solid rgba(201,168,76,.3)', borderRadius: 8, padding: '7px 10px', color: TEXT, fontFamily: "'DM Mono',monospace", fontSize: 12, outline: 'none' }} />
              <button onClick={function() {
                var b = parseInt(myBid, 10);
                if (!isNaN(b) && b > auction.currentBid && socket) { socket.emit('auction-bid', { roomId: roomId, bid: b }); setMyBid(''); }
              }} style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: '#0E0C09', cursor: 'pointer' }}>BID</button>
            </div>
          )}
        </div>
      )}

      {/* ── Auction setup panel ─────────────────────────────────────── */}
      {showAuctionSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>🔨 LIVE AUCTION</span>
            <div onClick={function() { setShowAuctionSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={auctionDraft.item} onChange={function(e) { setAuctionDraft(function(s) { return Object.assign({}, s, { item: e.target.value.slice(0, 80) }); }); }} placeholder="Item name" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <textarea value={auctionDraft.desc} onChange={function(e) { setAuctionDraft(function(s) { return Object.assign({}, s, { desc: e.target.value.slice(0, 200) }); }); }} placeholder="Description (optional)" rows={2} style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <input type="number" value={auctionDraft.startBid} onChange={function(e) { setAuctionDraft(function(s) { return Object.assign({}, s, { startBid: Math.max(1, parseInt(e.target.value, 10) || 1) }); }); }} placeholder="Starting bid ($)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
          <button onClick={function() {
            if (!auctionDraft.item.trim()) return;
            if (socket) socket.emit('auction-start', { roomId: roomId, item: auctionDraft.item.trim(), desc: auctionDraft.desc.trim(), startBid: auctionDraft.startBid });
            setShowAuctionSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>START AUCTION</button>
        </div>
      )}

      {/* ── Auction ended card ──────────────────────────────────────── */}
      {auctionEnded && (
        <div style={{
          position: 'absolute', top: '20%', left: '5%', right: '5%', zIndex: 280,
          background: 'rgba(14,12,9,.97)', border: '2px solid ' + GOLD, borderRadius: 18,
          padding: '24px 20px', textAlign: 'center',
          boxShadow: '0 0 48px rgba(201,168,76,.5)',
          animation: 'spotlightGlow 1s ease',
        }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🔨</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: GOLD, letterSpacing: 2 }}>SOLD!</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: TEXT, marginTop: 4 }}>{auctionEnded.item}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: GOLD, marginTop: 6 }}>${auctionEnded.winningBid}</div>
          {auctionEnded.winner && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: MUTED, marginTop: 4 }}>Won by {auctionEnded.winner}</div>}
        </div>
      )}

      {/* ── Timer Widget ────────────────────────────────────────────── */}
      {timerWidget && (
        <div style={{
          position: 'absolute', top: 60, right: 12, zIndex: 155,
          background: 'rgba(9,7,14,.92)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10,
          padding: '8px 12px', textAlign: 'center', minWidth: 90,
        }}>
          {timerWidget.label && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 3 }}>{timerWidget.label.toUpperCase()}</div>}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, color: timerDisplay === '00:00' ? RED : GOLD, letterSpacing: 2 }}>{timerDisplay}</div>
          {timerWidget.type === 'countdown' && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2 }}>⏷ COUNTDOWN</div>}
          {timerWidget.type === 'countup' && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, marginTop: 2 }}>⏶ ELAPSED</div>}
        </div>
      )}

      {/* ── Timer setup panel ───────────────────────────────────────── */}
      {showTimerSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>⏱ TIMER</span>
            <div onClick={function() { setShowTimerSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={timerDraft.label} onChange={function(e) { setTimerDraft(function(s) { return Object.assign({}, s, { label: e.target.value.slice(0, 40) }); }); }} placeholder="Label (e.g. Voting closes in…)" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {['countdown', 'countup'].map(function(t) {
              return <button key={t} onClick={function() { setTimerDraft(function(s) { return Object.assign({}, s, { type: t }); }); }} style={{ flex: 1, background: timerDraft.type === t ? GOLD : CARD2, border: '1px solid ' + (timerDraft.type === t ? GOLD : BORDER), borderRadius: 8, padding: '7px', color: timerDraft.type === t ? '#0E0C09' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>{t.toUpperCase()}</button>;
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, flexShrink: 0 }}>DURATION</span>
            {[60, 300, 600, 1800].map(function(s) {
              return <button key={s} onClick={function() { setTimerDraft(function(d) { return Object.assign({}, d, { durationSecs: s }); }); }} style={{ background: timerDraft.durationSecs === s ? GOLD : CARD2, border: '1px solid ' + (timerDraft.durationSecs === s ? GOLD : BORDER), borderRadius: 8, padding: '4px 8px', color: timerDraft.durationSecs === s ? '#0E0C09' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 9, cursor: 'pointer' }}>{s < 60 ? s + 's' : Math.floor(s / 60) + 'm'}</button>;
            })}
          </div>
          <button onClick={function() {
            if (socket) socket.emit('timer-widget-start', { roomId: roomId, label: timerDraft.label.trim(), type: timerDraft.type, durationSecs: timerDraft.durationSecs });
            setShowTimerSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>START TIMER</button>
        </div>
      )}

      {/* ── Quick Quiz viewer panel ─────────────────────────────────── */}
      {quickQuiz && !quickQuizFinal && (
        <div style={{
          position: 'absolute', bottom: 120, left: 10, right: 10, zIndex: 190,
          background: 'rgba(9,7,14,.97)', border: '1.5px solid ' + GOLD, borderRadius: 14,
          padding: '14px 16px', animation: 'entranceSlide .4s ease',
        }}>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>🧠 QUICK QUIZ</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: TEXT, marginBottom: 10, lineHeight: 1.3 }}>{quickQuiz.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {quickQuiz.opts.map(function(opt, i) {
              var total = (quickQuiz.opts || []).reduce(function(sum, o) { return sum + (o.votes || 0); }, 0);
              var pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
              var picked = quickQuizMyAnswer === i;
              return (
                <div key={i} onClick={function() {
                  if (quickQuizMyAnswer === null && socket) {
                    socket.emit('quick-quiz-answer', { roomId: roomId, idx: i });
                    setQuickQuizMyAnswer(i);
                  }
                }} style={{ background: picked ? 'rgba(201,168,76,.18)' : CARD2, border: '1px solid ' + (picked ? GOLD : BORDER), borderRadius: 8, padding: '8px 12px', cursor: quickQuizMyAnswer === null ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}>
                  {quickQuizMyAnswer !== null && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', background: 'rgba(201,168,76,.12)', transition: 'width .5s ease' }} />}
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT }}>{String.fromCharCode(65 + i)}. {opt.text}</span>
                    {quickQuizMyAnswer !== null && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD }}>{pct}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Quiz final result ─────────────────────────────────── */}
      {quickQuizFinal && (
        <div style={{
          position: 'absolute', bottom: 120, left: 10, right: 10, zIndex: 190,
          background: 'rgba(9,7,14,.97)', border: '2px solid ' + GOLD, borderRadius: 14,
          padding: '14px 16px', animation: 'entranceSlide .3s ease',
          boxShadow: '0 0 24px rgba(201,168,76,.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: GOLD, letterSpacing: 2 }}>🧠 QUIZ RESULTS</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{quickQuizFinal.totalVotes} votes</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 10 }}>{quickQuizFinal.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {quickQuizFinal.results.map(function(r, i) {
              var isWinner = i === quickQuizFinal.winnerIdx;
              return (
                <div key={i} style={{ background: isWinner ? 'rgba(201,168,76,.15)' : CARD2, border: '1px solid ' + (isWinner ? GOLD : BORDER), borderRadius: 8, padding: '6px 10px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: r.pct + '%', background: isWinner ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)' }} />
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: isWinner ? GOLD : TEXT }}>{isWinner ? '✓ ' : ''}{String.fromCharCode(65 + i)}. {r.text}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: isWinner ? GOLD : MUTED }}>{r.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Quiz setup panel ──────────────────────────────────── */}
      {showQuizSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>🧠 QUICK QUIZ</span>
            <div onClick={function() { setShowQuizSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <textarea value={quizDraft.q} onChange={function(e) { setQuizDraft(function(s) { return Object.assign({}, s, { q: e.target.value.slice(0, 200) }); }); }} placeholder="Question" rows={3} style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          {quizDraft.opts.map(function(opt, i) {
            return (
              <input key={i} value={opt} onChange={function(e) {
                var v = e.target.value.slice(0, 60);
                setQuizDraft(function(s) { var newOpts = s.opts.slice(); newOpts[i] = v; return Object.assign({}, s, { opts: newOpts }); });
              }} placeholder={'Option ' + String.fromCharCode(65 + i)} style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            );
          })}
          <button onClick={function() {
            var validOpts = quizDraft.opts.filter(function(o) { return o.trim(); });
            if (!quizDraft.q.trim() || validOpts.length < 2) return;
            if (socket) socket.emit('quick-quiz-launch', { roomId: roomId, q: quizDraft.q.trim(), opts: validOpts });
            setShowQuizSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1, marginTop: 4 }}>LAUNCH QUIZ</button>
        </div>
      )}

      {/* ── Hype Train flash overlay ────────────────────────────────── */}
      {hypeLevel !== null && (
        <div style={{ position: 'absolute', top: '22%', left: 0, right: 0, zIndex: 300, textAlign: 'center', pointerEvents: 'none', animation: 'comboFlash 3.5s ease forwards' }}>
          <div style={{ fontSize: 36 }}>🚂🔥</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: GOLD, letterSpacing: 3 }}>HYPE TRAIN LEVEL {hypeLevel}!</div>
        </div>
      )}

      {/* ── Hype Train progress bar ─────────────────────────────────── */}
      {hypeTrain && hypeLevel === null && (
        <div style={{ position: 'absolute', top: 52, left: 10, right: 10, zIndex: 155 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD }}>🚂 HYPE LVL {hypeTrain.level}</span>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.min(100, Math.round((hypeTrain.pts / (hypeTrain.target || 1)) * 100)) + '%', background: 'linear-gradient(90deg,' + RED + ',' + GOLD + ')', borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Marquee scrolling text ──────────────────────────────────── */}
      {marquee && (
        <div style={{ position: 'absolute', bottom: 57, left: 0, right: 0, zIndex: 150, background: 'rgba(9,7,14,.9)', overflow: 'hidden', height: 22, display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(201,168,76,.15)' }}>
          <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'marqueeScroll 18s linear infinite', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: GOLD, paddingLeft: '100%' }}>
            {marquee.text}
          </div>
        </div>
      )}

      {/* ── Song Request panel ──────────────────────────────────────── */}
      {showSongQueue && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>🎵 SONG QUEUE</span>
            <div onClick={function() { setShowSongQueue(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {role === 'viewer' && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: CARD, borderRadius: 10, border: '1px solid ' + BORDER }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 6, letterSpacing: 1 }}>TYPE !sr + SONG NAME IN CHAT TO REQUEST</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT }}>e.g. <span style={{ color: GOLD }}>!sr Blinding Lights</span></div>
            </div>
          )}
          {songRequests.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>No requests yet — type !sr in chat</div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {songRequests.map(function(r, i) {
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: i < songRequests.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.song}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>by {r.username}</div>
                  </div>
                  {(role === 'host' || role === 'cohost') && (
                    <button onClick={function() { if (socket) socket.emit('song-request-mark-played', { roomId: roomId, id: r.id }); }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 6, padding: '4px 10px', color: TEAL, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>✓ PLAYED</button>
                  )}
                </div>
              );
            })}
          </div>
          {(role === 'host' || role === 'cohost') && songRequests.length > 0 && (
            <button onClick={function() { if (socket) socket.emit('song-request-clear', { roomId: roomId }); setShowSongQueue(false); }} style={{ marginTop: 10, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, padding: '8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>CLEAR ALL</button>
          )}
        </div>
      )}

      {/* ── Marquee setup panel ─────────────────────────────────────── */}
      {showMarqueeSet && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>📜 MARQUEE TEXT</span>
            <div onClick={function() { setShowMarqueeSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <input value={marqueeDraft} onChange={function(e) { setMarqueeDraft(e.target.value.slice(0, 200)); }} placeholder="Scrolling text for viewers…" style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
          <button onClick={function() {
            if (!marqueeDraft.trim()) return;
            if (socket) socket.emit('marquee-set', { roomId: roomId, text: marqueeDraft.trim() });
            setShowMarqueeSet(false);
          }} style={{ background: GOLD, border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>START MARQUEE</button>
        </div>
      )}

      {/* ── Viewer Shoutout Queue ────────────────────────────────────── */}
      {showShoutoutQueue && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>📣 SHOUTOUT QUEUE</span>
            <div onClick={function() { setShowShoutoutQueue(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {role === 'viewer' && !shoutoutQueueAck && (
            <div style={{ marginBottom: 12 }}>
              <textarea value={shoutoutMsgDraft} onChange={function(e) { setShoutoutMsgDraft(e.target.value.slice(0, 80)); }} placeholder="Add a message for your shoutout (optional)" rows={2} style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <button onClick={function() {
                if (socket) socket.emit('shoutout-queue-add', { roomId: roomId, message: shoutoutMsgDraft.trim() });
              }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 10, padding: '10px', fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}>REQUEST SHOUTOUT</button>
            </div>
          )}
          {shoutoutQueueAck && (
            <div style={{ background: 'rgba(212,133,74,.15)', border: '1px solid rgba(212,133,74,.4)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEAL }}>
              ✓ You're #{shoutoutQueueAck.position} in the queue!
            </div>
          )}
          {shoutoutQueue.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>No pending shoutouts</div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {shoutoutQueue.map(function(e, i) {
              return (
                <div key={e.id} style={{ padding: '10px 0', borderBottom: i < shoutoutQueue.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: TEXT }}>{e.username}</div>
                      {e.message && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: MUTED, marginTop: 2 }}>{e.message}</div>}
                    </div>
                    {role === 'host' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={function() { if (socket) socket.emit('shoutout-queue-approve', { roomId: roomId, id: e.id }); }} style={{ background: GOLD, border: 'none', borderRadius: 6, padding: '4px 10px', color: '#0E0C09', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>FIRE</button>
                        <button onClick={function() { if (socket) socket.emit('shoutout-queue-dismiss', { roomId: roomId, id: e.id }); }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 6, padding: '4px 10px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>SKIP</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Batch 40: Simple poll — viewer panel ─────────────────────────── */}
      {simplePoll && (
        <div style={{ position: 'absolute', bottom: 70, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 120, boxShadow: '0 4px 24px rgba(0,0,0,.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: GOLD, letterSpacing: 1.5 }}>🗳️ INSTANT POLL</span>
            {role === 'host' && simplePoll.active && (
              <button onClick={function() { if (socket) socket.emit('simple-poll-end', { roomId: roomId }); }} style={{ background: 'rgba(255,26,60,.15)', border: '1px solid rgba(255,26,60,.4)', borderRadius: 6, padding: '3px 8px', color: RED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: .5 }}>END</button>
            )}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, marginBottom: 12, lineHeight: 1.4 }}>{simplePoll.q}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              onClick={function() {
                if (!simplePoll.active) return;
                setMyPollVote('yes');
                if (socket) socket.emit('simple-poll-vote', { roomId: roomId, vote: 'yes', username: username });
              }}
              style={{ flex: 1, padding: '10px', background: myPollVote === 'yes' ? 'rgba(0,200,100,.25)' : CARD2, border: '1.5px solid ' + (myPollVote === 'yes' ? '#00C864' : BORDER), borderRadius: 10, color: myPollVote === 'yes' ? '#00C864' : TEXT, fontFamily: "'Bebas Neue',cursive", fontSize: 16, cursor: 'pointer', letterSpacing: 1, transition: 'all .15s' }}
            >👍 YES {simplePoll.active ? '(' + (simplePoll.yes || 0) + ')' : ''}</button>
            <button
              onClick={function() {
                if (!simplePoll.active) return;
                setMyPollVote('no');
                if (socket) socket.emit('simple-poll-vote', { roomId: roomId, vote: 'no', username: username });
              }}
              style={{ flex: 1, padding: '10px', background: myPollVote === 'no' ? 'rgba(255,26,60,.25)' : CARD2, border: '1.5px solid ' + (myPollVote === 'no' ? RED : BORDER), borderRadius: 10, color: myPollVote === 'no' ? RED : TEXT, fontFamily: "'Bebas Neue',cursive", fontSize: 16, cursor: 'pointer', letterSpacing: 1, transition: 'all .15s' }}
            >👎 NO {simplePoll.active ? '(' + (simplePoll.no || 0) + ')' : ''}</button>
          </div>
          {!simplePoll.active && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', letterSpacing: .5 }}>
              FINAL: YES {simplePoll.yes || 0} · NO {simplePoll.no || 0}
              {(simplePoll.yes + simplePoll.no) > 0 && (
                <span style={{ marginLeft: 8, color: (simplePoll.yes || 0) >= (simplePoll.no || 0) ? '#00C864' : RED }}>
                  — {(simplePoll.yes || 0) >= (simplePoll.no || 0) ? 'YES WINS' : 'NO WINS'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Batch 40: Poll setup — host only ─────────────────────────────── */}
      {showPollSet && role === 'host' && !simplePoll && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: GOLD, letterSpacing: 2 }}>🗳️ LAUNCH POLL</span>
            <div onClick={function() { setShowPollSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: .8 }}>QUESTION</div>
          <textarea
            value={pollDraft}
            onChange={function(e) { setPollDraft(e.target.value.slice(0, 140)); }}
            placeholder="Ask viewers a yes/no question..."
            rows={3}
            style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '10px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '10px', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, textAlign: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#00C864' }}>👍 YES</div>
            <div style={{ flex: 1, padding: '10px', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, textAlign: 'center', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: RED }}>👎 NO</div>
          </div>
          <button
            onClick={function() {
              if (!pollDraft.trim()) return;
              if (socket) socket.emit('simple-poll-start', { roomId: roomId, q: pollDraft.trim() });
              setShowPollSet(false); setPollDraft('');
            }}
            style={{ marginTop: 16, background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}
          >LAUNCH POLL</button>
        </div>
      )}

      {/* ── Batch 40: Vibe picker — host only ────────────────────────────── */}
      {showVibePicker && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(167,139,250,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: '#A78BFA', letterSpacing: 1.5 }}>🌈 SET ROOM VIBE</span>
            <div onClick={function() { setShowVibePicker(false); }} style={{ cursor: 'pointer', fontSize: 16, color: MUTED }}>✕</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { key: 'hype', emoji: '🔥', label: 'HYPE' },
              { key: 'chill', emoji: '🌊', label: 'CHILL' },
              { key: 'gaming', emoji: '🎮', label: 'GAMING' },
              { key: 'music', emoji: '🎵', label: 'MUSIC' },
              { key: 'party', emoji: '🎉', label: 'PARTY' },
              { key: 'educational', emoji: '📚', label: 'EDU' },
              { key: 'news', emoji: '📰', label: 'NEWS' },
            ].map(function(v) {
              return (
                <button
                  key={v.key}
                  onClick={function() {
                    if (socket) socket.emit('room-vibe-set', { roomId: roomId, vibe: v.key });
                    setShowVibePicker(false);
                  }}
                  style={{ padding: '8px 4px', background: roomVibe === v.key ? 'rgba(167,139,250,.22)' : CARD2, border: '1px solid ' + (roomVibe === v.key ? '#A78BFA' : BORDER), borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
                >
                  <span style={{ fontSize: 18 }}>{v.emoji}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: roomVibe === v.key ? '#A78BFA' : MUTED, letterSpacing: .5 }}>{v.label}</span>
                </button>
              );
            })}
            {roomVibe && (
              <button
                onClick={function() {
                  if (socket) socket.emit('room-vibe-clear', { roomId: roomId });
                  setShowVibePicker(false);
                }}
                style={{ padding: '8px 4px', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <span style={{ fontSize: 18 }}>✕</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: .5 }}>CLEAR</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Batch 40: Title edit — host only ─────────────────────────────── */}
      {showTitleEdit && role === 'host' && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: .8 }}>STREAM TITLE</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={titleDraft}
              onChange={function(e) { setTitleDraft(e.target.value.slice(0, 100)); }}
              placeholder="Enter stream title..."
              style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={function() {
                if (!titleDraft.trim()) return;
                if (socket) socket.emit('update-stream-title', { roomId: roomId, title: titleDraft.trim() });
                setShowTitleEdit(false);
              }}
              style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}
            >SET</button>
            <div onClick={function() { setShowTitleEdit(false); }} style={{ cursor: 'pointer', width: 36, height: 36, borderRadius: 8, background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 14 }}>✕</div>
          </div>
        </div>
      )}

      {/* ── Batch 40: Check-in flash ─────────────────────────────────────── */}
      {checkinFlash && (
        <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(14,12,9,.95)', border: '1.5px solid rgba(201,168,76,.4)', borderRadius: 14, padding: '12px 20px', zIndex: 300, textAlign: 'center', animation: 'entranceSlide .35s ease', pointerEvents: 'none' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📍</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: GOLD, letterSpacing: 1.5 }}>{checkinFlash.username} CHECKED IN!</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginTop: 2 }}>+25 LOYALTY PTS</div>
        </div>
      )}

      {/* ── Batch 41: Collab banner ───────────────────────────────────────── */}
      {collabBanner && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(90deg,rgba(201,168,76,.25),rgba(244,114,182,.2),rgba(201,168,76,.25))', borderBottom: '1px solid rgba(244,114,182,.3)', padding: '6px 16px', zIndex: 80, pointerEvents: 'none' }}>
          <span style={{ fontSize: 16 }}>🤝</span>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: TEXT, letterSpacing: 1.5 }}>LIVE WITH</span>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: GOLD, letterSpacing: 1 }}>@{collabBanner.name}</span>
          {collabBanner.platform && (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#F472B6', background: 'rgba(244,114,182,.15)', border: '1px solid rgba(244,114,182,.3)', borderRadius: 4, padding: '1px 6px', letterSpacing: .5 }}>{collabBanner.platform.toUpperCase()}</span>
          )}
        </div>
      )}

      {/* ── Batch 41: Host note card ──────────────────────────────────────── */}
      {hostNote && (
        <div style={{ position: 'absolute', bottom: collabBanner ? 116 : 76, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(201,168,76,.35)', borderRadius: 12, padding: '10px 14px', zIndex: 90, boxShadow: '0 2px 16px rgba(0,0,0,.5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📝</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 4 }}>HOST NOTE</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{hostNote.text}</div>
            </div>
            {role === 'host' && (
              <button onClick={function() { if (socket) socket.emit('host-note-clear', { roomId: roomId }); }} style={{ background: 'transparent', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer', flexShrink: 0, padding: 0 }}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* ── Batch 41: Host note setup ─────────────────────────────────────── */}
      {showHostNoteSet && role === 'host' && !hostNote && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: .8 }}>HOST NOTE (shows to all viewers)</div>
          <textarea
            value={hostNoteDraft}
            onChange={function(e) { setHostNoteDraft(e.target.value.slice(0, 280)); }}
            placeholder="Share a note with your audience..."
            rows={3}
            style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '10px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={function() {
                if (!hostNoteDraft.trim()) return;
                if (socket) socket.emit('host-note-set', { roomId: roomId, text: hostNoteDraft.trim() });
                setShowHostNoteSet(false); setHostNoteDraft('');
              }}
              style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 10, padding: '10px', fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}
            >POST NOTE</button>
            <button onClick={function() { setShowHostNoteSet(false); }} style={{ padding: '10px 16px', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
          </div>
        </div>
      )}

      {/* ── Batch 41: Collab banner setup ─────────────────────────────────── */}
      {showCollabSet && role === 'host' && !collabBanner && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(244,114,182,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#F472B6', letterSpacing: 1.5 }}>🤝 COLLAB BANNER</span>
            <div onClick={function() { setShowCollabSet(false); }} style={{ cursor: 'pointer', fontSize: 16, color: MUTED }}>✕</div>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 5, letterSpacing: .8 }}>CREATOR NAME</div>
          <input
            value={collabDraft.name}
            onChange={function(e) { setCollabDraft(function(d) { return Object.assign({}, d, { name: e.target.value.slice(0, 60) }); }); }}
            placeholder="username or display name"
            style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(244,114,182,.25)', borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
          />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 5, letterSpacing: .8 }}>PLATFORM (optional)</div>
          <input
            value={collabDraft.platform}
            onChange={function(e) { setCollabDraft(function(d) { return Object.assign({}, d, { platform: e.target.value.slice(0, 30) }); }); }}
            placeholder="TikTok, YouTube, Instagram..."
            style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(244,114,182,.25)', borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}
          />
          <button
            onClick={function() {
              if (!collabDraft.name.trim()) return;
              if (socket) socket.emit('collab-banner-set', { roomId: roomId, name: collabDraft.name.trim(), platform: collabDraft.platform.trim() });
              setShowCollabSet(false);
            }}
            style={{ width: '100%', background: '#F472B6', border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}
          >SHOW COLLAB BANNER</button>
        </div>
      )}

      {/* ── Batch 41: Fan club join flash ─────────────────────────────────── */}
      {collabBanner && (
        <div style={{ position: 'absolute', bottom: 56, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(14,12,9,.92)', border: '1px solid rgba(244,114,182,.3)', borderRadius: 10, padding: '6px 12px', zIndex: 70 }}>
          <span style={{ fontSize: 12 }}>❤️</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEXT, flex: 1 }}>Fan club: <span style={{ color: GOLD, fontWeight: 700 }}>{fanClub.length}</span> member{fanClub.length !== 1 ? 's' : ''}</span>
          {!inFanClub && role === 'viewer' && (
            <button
              onClick={function() {
                if (socket) socket.emit('fanclub-join', { roomId: roomId, username: username }, function(res) {
                  if (res && res.ok) { if (addToast) addToast('❤️ Joined the fan club!', 'success'); }
                });
              }}
              style={{ background: '#F472B6', border: 'none', borderRadius: 6, padding: '3px 10px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#0E0C09', cursor: 'pointer', letterSpacing: .5 }}
            >JOIN</button>
          )}
        </div>
      )}

      {/* ── Batch 42: Moment flash ────────────────────────────────────────── */}
      {momentFlash && (
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(14,12,9,.97)', border: '2px solid rgba(201,168,76,.5)', borderRadius: 16, padding: '14px 24px', zIndex: 320, textAlign: 'center', animation: 'entranceSlide .3s ease', pointerEvents: 'none', boxShadow: '0 0 30px rgba(201,168,76,.3)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🎬</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>CLIP MOMENT</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, marginTop: 4 }}>{momentFlash.label}</div>
        </div>
      )}

      {/* ── Batch 42: Word cloud overlay ─────────────────────────────────── */}
      {showWordCloud && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>☁️ LIVE WORD CLOUD</span>
            <div onClick={function() { setShowWordCloud(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {wordCloud.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>Chat to build the word cloud!</div>
          )}
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 10, padding: '10px' }}>
            {(function() {
              var max = wordCloud.length > 0 ? wordCloud[0].count : 1;
              return wordCloud.slice(0, 20).map(function(w, i) {
                var size = Math.max(12, Math.min(36, 12 + Math.round((w.count / max) * 24)));
                var opacity = 0.5 + (w.count / max) * 0.5;
                var hue = (i * 37) % 360;
                return (
                  <span key={w.word} style={{ fontFamily: "'Bebas Neue',cursive", fontSize: size, color: 'hsl(' + hue + ',70%,65%)', opacity: opacity, letterSpacing: 1, transition: 'all .5s ease' }}>{w.word}</span>
                );
              });
            })()}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, textAlign: 'center', letterSpacing: .5, marginTop: 8 }}>Updates every 10 messages · {wordCloud.length} words tracked</div>
        </div>
      )}

      {/* ── Batch 42: Moment log panel ────────────────────────────────────── */}
      {showMomentLog && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>🎬 STREAM MOMENTS</span>
            <div onClick={function() { setShowMomentLog(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {role === 'host' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                value={momentLabelDraft}
                onChange={function(e) { setMomentLabelDraft(e.target.value.slice(0, 60)); }}
                placeholder="Label this moment..."
                style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={function() {
                  var label = momentLabelDraft.trim() || 'Highlight';
                  if (socket) socket.emit('mark-moment', { roomId: roomId, label: label });
                  setMomentLabelDraft('');
                }}
                style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}
              >🎬 MARK</button>
            </div>
          )}
          {momentLog.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>No moments marked yet</div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {momentLog.slice().reverse().map(function(m, i) {
              var elapsed = Math.floor((Date.now() - m.ts) / 1000);
              var timeStr = elapsed < 60 ? elapsed + 's ago' : elapsed < 3600 ? Math.floor(elapsed/60) + 'm ago' : Math.floor(elapsed/3600) + 'h ago';
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < momentLog.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎬</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: TEXT }}>{m.label}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 2 }}>{timeStr} · by {m.by}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Batch 42: Viewer status picker ────────────────────────────────── */}
      {showStatusPicker && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, color: GOLD, letterSpacing: 1.5 }}>😊 SET MY STATUS</span>
            <div onClick={function() { setShowStatusPicker(false); }} style={{ cursor: 'pointer', fontSize: 16, color: MUTED }}>✕</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
            {['🎉','💤','❓','🔥','👍','❤️','😂','😮','😢','🙏','👏','🎮','🎵','💪','✋'].map(function(e) {
              return (
                <button
                  key={e}
                  onClick={function() { setMyStatus(function(s) { return s && s.emoji === e ? null : { emoji: e, text: myStatus ? myStatus.text : '' }; }); }}
                  style={{ padding: '8px', background: myStatus && myStatus.emoji === e ? 'rgba(201,168,76,.2)' : CARD2, border: '1px solid ' + (myStatus && myStatus.emoji === e ? GOLD : BORDER), borderRadius: 8, cursor: 'pointer', fontSize: 20 }}
                >{e}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={myStatus ? (myStatus.text || '') : ''}
              onChange={function(e) { setMyStatus(function(s) { return s ? Object.assign({}, s, { text: e.target.value.slice(0, 24) }) : { emoji: '😊', text: e.target.value.slice(0, 24) }; }); }}
              placeholder="Short status text... (optional)"
              style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
            />
            <button
              onClick={function() {
                if (socket) socket.emit('set-viewer-status', { roomId: roomId, emoji: myStatus ? myStatus.emoji : null, text: myStatus ? (myStatus.text || '') : '' });
                setShowStatusPicker(false);
              }}
              style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}
            >SET</button>
          </div>
          {myStatus && (
            <button
              onClick={function() {
                setMyStatus(null);
                if (socket) socket.emit('set-viewer-status', { roomId: roomId, emoji: null });
                setShowStatusPicker(false);
              }}
              style={{ marginTop: 8, width: '100%', background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 8, padding: '7px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}
            >CLEAR STATUS</button>
          )}
        </div>
      )}

      {/* ── Batch 42: Room capacity setup ─────────────────────────────────── */}
      {showCapacitySet && role === 'host' && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(201,168,76,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: .8 }}>ROOM CAPACITY (max viewers for FOMO meter)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={capacityDraft}
              onChange={function(e) { setCapacityDraft(e.target.value.replace(/[^0-9]/g, '')); }}
              placeholder="e.g. 500"
              style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '8px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={function() {
                var max = parseInt(capacityDraft, 10);
                if (!max || max < 1) return;
                if (socket) socket.emit('set-room-capacity', { roomId: roomId, max: max });
                setShowCapacitySet(false); setCapacityDraft('');
              }}
              style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}
            >SET</button>
            {roomCapacity && (
              <button
                onClick={function() {
                  if (socket) socket.emit('set-room-capacity', { roomId: roomId, max: 0 });
                  setShowCapacitySet(false);
                }}
                style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 12px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}
              >CLEAR</button>
            )}
          </div>
          {roomCapacity && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: TEAL, marginTop: 8 }}>Current max: {roomCapacity.max.toLocaleString()} · {viewerCount || 0} watching</div>
          )}
        </div>
      )}

      {/* ── Batch 43: Gift combo flash ────────────────────────────────────── */}
      {giftComboFlash && (
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 320, textAlign: 'center', animation: 'comboFlash .4s ease', pointerEvents: 'none' }}>
          <div style={{ fontSize: 36 }}>{giftComboFlash.emoji || '🎁'}</div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: GOLD, letterSpacing: 3, textShadow: '0 0 20px rgba(201,168,76,.8)' }}>COMBO x{giftComboFlash.count}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEXT }}>{giftComboFlash.username}</div>
        </div>
      )}

      {/* ── Batch 43: Sign-in flash ───────────────────────────────────────── */}
      {signInFlash && (
        <div style={{ position: 'absolute', bottom: 80, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(14,12,9,.92)', border: '1px solid rgba(212,133,74,.3)', borderRadius: 10, padding: '7px 12px', zIndex: 100, animation: 'entranceSlide .3s ease' }}>
          <span style={{ fontSize: 16 }}>✍️</span>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, flex: 1 }}><span style={{ color: TEAL, fontWeight: 700 }}>{signInFlash.username}</span> signed in · {signInFlash.count} here</span>
        </div>
      )}

      {/* ── Batch 43: Outro countdown setup ──────────────────────────────── */}
      {showOutroSet && role === 'host' && !outroCountdown && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, background: 'rgba(14,12,9,.97)', border: '1.5px solid rgba(255,140,0,.3)', borderRadius: 14, padding: '14px 16px', zIndex: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#FF8C00', letterSpacing: 1.5 }}>⏳ GOING OFFLINE IN...</span>
            <div onClick={function() { setShowOutroSet(false); }} style={{ cursor: 'pointer', fontSize: 16, color: MUTED }}>✕</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {[1,3,5,10,15,30].map(function(m) {
              return (
                <button
                  key={m}
                  onClick={function() { setOutroDraft(function(d) { return Object.assign({}, d, { minutes: String(m) }); }); }}
                  style={{ padding: '6px 12px', background: outroDraft.minutes === String(m) ? 'rgba(255,140,0,.2)' : CARD2, border: '1px solid ' + (outroDraft.minutes === String(m) ? '#FF8C00' : BORDER), borderRadius: 8, color: outroDraft.minutes === String(m) ? '#FF8C00' : TEXT, fontFamily: "'DM Mono',monospace", fontSize: 10, cursor: 'pointer' }}
                >{m}m</button>
              );
            })}
          </div>
          <button
            onClick={function() {
              var mins = parseInt(outroDraft.minutes, 10);
              if (!mins || mins < 1) return;
              if (socket) socket.emit('outro-countdown-set', { roomId: roomId, minutes: mins, label: outroDraft.label });
              setShowOutroSet(false);
            }}
            style={{ width: '100%', background: '#FF8C00', border: 'none', borderRadius: 10, padding: '11px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}
          >START COUNTDOWN</button>
        </div>
      )}

      {/* ── Batch 43: Prize wheel setup ───────────────────────────────────── */}
      {showWheelSet && role === 'host' && !prizeWheel && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: GOLD, letterSpacing: 2 }}>🎡 PRIZE WHEEL SETUP</span>
            <div onClick={function() { setShowWheelSet(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 6, letterSpacing: .8 }}>SEGMENT LABELS (one per line, 2–8 segments)</div>
          <textarea
            value={wheelDraft}
            onChange={function(e) { setWheelDraft(e.target.value); }}
            rows={8}
            style={{ flex: 1, background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '10px 13px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', marginBottom: 14 }}
          />
          <button
            onClick={function() {
              var segs = wheelDraft.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; }).slice(0, 8);
              if (segs.length < 2) { if (addToast) addToast('Add at least 2 segments', 'error'); return; }
              if (socket) socket.emit('prize-wheel-set', { roomId: roomId, segments: segs.map(function(l) { return { label: l }; }) });
              setShowWheelSet(false);
            }}
            style={{ background: GOLD, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}
          >SAVE WHEEL</button>
        </div>
      )}

      {/* ── Batch 43: Prize wheel display ─────────────────────────────────── */}
      {prizeWheel && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.97)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: GOLD, letterSpacing: 2 }}>🎡 PRIZE WHEEL</span>
            <div onClick={function() { if (socket) socket.emit('prize-wheel-clear', { roomId: roomId }); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <div style={{ width: '100%', maxWidth: 300, position: 'relative', margin: '0 auto 20px' }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', animation: wheelSpinning ? 'goalFill 3s cubic-bezier(.15,.5,.3,1) forwards' : 'none', transformOrigin: '100px 100px' }}>
              {(function() {
                var segs = prizeWheel.segments;
                var n = segs.length;
                var arc = (2 * Math.PI) / n;
                return segs.map(function(seg, i) {
                  var startAngle = i * arc - Math.PI / 2;
                  var endAngle   = startAngle + arc;
                  var x1 = 100 + 90 * Math.cos(startAngle);
                  var y1 = 100 + 90 * Math.sin(startAngle);
                  var x2 = 100 + 90 * Math.cos(endAngle);
                  var y2 = 100 + 90 * Math.sin(endAngle);
                  var la = arc > Math.PI ? 1 : 0;
                  var d = 'M100,100 L' + x1 + ',' + y1 + ' A90,90,0,' + la + ',1,' + x2 + ',' + y2 + ' Z';
                  var midAngle = startAngle + arc / 2;
                  var tx = 100 + 58 * Math.cos(midAngle);
                  var ty = 100 + 58 * Math.sin(midAngle);
                  return (
                    <g key={i}>
                      <path d={d} fill={seg.color} stroke="rgba(0,0,0,.3)" strokeWidth="1" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(7, 14 - segs.length)} fill="#fff" fontFamily="'DM Mono',monospace" transform={'rotate(' + (((startAngle + arc/2) * 180 / Math.PI) + 90) + ',' + tx + ',' + ty + ')'} style={{ pointerEvents: 'none' }}>{seg.label.slice(0,12)}</text>
                    </g>
                  );
                });
              })()}
              <circle cx="100" cy="100" r="10" fill="#0E0C09" stroke={GOLD} strokeWidth="2" />
              <polygon points="100,2 96,18 104,18" fill={GOLD} />
            </svg>
          </div>
          {wheelWinner && !wheelSpinning && (
            <div style={{ background: 'rgba(201,168,76,.18)', border: '2px solid rgba(201,168,76,.5)', borderRadius: 12, padding: '10px 20px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 4 }}>WINNER</div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: GOLD, letterSpacing: 2 }}>{wheelWinner.label}</div>
            </div>
          )}
          {role === 'host' && (
            <button
              onClick={function() {
                if (wheelSpinning) return;
                if (socket) socket.emit('prize-wheel-spin', { roomId: roomId });
              }}
              disabled={wheelSpinning}
              style={{ background: wheelSpinning ? CARD2 : GOLD, border: 'none', borderRadius: 12, padding: '14px 40px', fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: '#0E0C09', cursor: wheelSpinning ? 'default' : 'pointer', letterSpacing: 2, opacity: wheelSpinning ? .6 : 1 }}
            >{wheelSpinning ? 'SPINNING...' : '🎡 SPIN!'}</button>
          )}
        </div>
      )}

      {/* ── Batch 44: Spotlight pick overlay ─────────────────────────────── */}
      {spotlightPick && (
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 310, textAlign: 'center', animation: 'spotlightGlow 2s ease infinite', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(201,168,76,.2)', border: '2px solid rgba(201,168,76,.6)', borderRadius: 20, padding: '16px 28px', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎯</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1.5, marginBottom: 4 }}>VIEWER SPOTLIGHT</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 26, color: GOLD, letterSpacing: 2 }}>{spotlightPick.username}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4, letterSpacing: .5 }}>YOU'RE IN THE SPOTLIGHT!</div>
          </div>
        </div>
      )}

      {/* ── Batch 44: Schedule panel ──────────────────────────────────────── */}
      {showSchedule && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>📅 STREAM SCHEDULE</span>
            <div onClick={function() { setShowSchedule(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {role === 'host' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 6, letterSpacing: .8 }}>SEGMENTS (one per line, up to 8)</div>
              <textarea
                value={scheduleDraft}
                onChange={function(e) { setScheduleDraft(e.target.value); }}
                rows={5}
                placeholder={'Intro & Greetings\nQ&A Session\nGift Unboxing\nGiveaway'}
                style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
              />
              <button
                onClick={function() {
                  var items = scheduleDraft.split('\n').map(function(l) { return { label: l.trim(), done: false }; }).filter(function(i) { return i.label; }).slice(0, 8);
                  if (!items.length) return;
                  if (socket) socket.emit('schedule-set', { roomId: roomId, items: items });
                  setScheduleDraft('');
                }}
                style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 8, padding: '9px', fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1 }}
              >UPDATE SCHEDULE</button>
            </div>
          )}
          {schedule.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>No schedule set yet</div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {schedule.map(function(item, i) {
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < schedule.length - 1 ? '1px solid ' + BORDER : 'none', opacity: item.done ? .5 : 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: item.done ? 'rgba(0,200,100,.2)' : 'rgba(201,168,76,.15)', border: '1px solid ' + (item.done ? '#00C864' : 'rgba(201,168,76,.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: item.done ? '#00C864' : GOLD }}>{item.done ? '✓' : (i+1)}</div>
                  <span style={{ flex: 1, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEXT, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                  {role === 'host' && (
                    <button onClick={function() { if (socket) socket.emit('schedule-mark-done', { roomId: roomId, id: item.id }); }} style={{ background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 8px', color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer' }}>{item.done ? 'UNDO' : 'DONE'}</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Batch 44: React wall panel ────────────────────────────────────── */}
      {showReactWall && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>💫 LIVE REACTIONS</span>
            <div onClick={function() { setShowReactWall(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {reactWall.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14 }}>Send reactions to see them here!</div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
            {reactWall.slice().reverse().map(function(entry, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid ' + BORDER }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{entry.emoji}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, flex: 1 }}>{entry.username}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>
                    {(function() { var s = Math.floor((Date.now() - entry.ts) / 1000); return s < 60 ? s + 's' : Math.floor(s/60) + 'm'; })()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Batch 44: Host bio panel (viewer) ─────────────────────────────── */}
      {showBioPanel && hostBio && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>ℹ️ ABOUT {hostName.toUpperCase()}</span>
            <div onClick={function() { setShowBioPanel(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          {hostBio.bio && (
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEXT, lineHeight: 1.6, marginBottom: 16 }}>{hostBio.bio}</p>
          )}
          {hostBio.links && hostBio.links.length > 0 && (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8 }}>LINKS</div>
              {hostBio.links.map(function(link, i) {
                return (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEAL, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid ' + BORDER }}>
                    🔗 {link.label || link.url}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Batch 44: Host bio edit (host only) ───────────────────────────── */}
      {showBioEdit && role === 'host' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(8,11,18,.96)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '18px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 2 }}>ℹ️ ABOUT ME</span>
            <div onClick={function() { setShowBioEdit(false); }} style={{ cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontSize: 14 }}>✕</div>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 5, letterSpacing: .8 }}>BIO</div>
          <textarea
            value={bioDraft.bio}
            onChange={function(e) { setBioDraft(function(d) { return Object.assign({}, d, { bio: e.target.value.slice(0, 300) }); }); }}
            placeholder="Tell viewers about yourself..."
            rows={4}
            style={{ width: '100%', background: CARD2, border: '1.5px solid rgba(201,168,76,.25)', borderRadius: 10, padding: '9px 12px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
          />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, marginBottom: 8, letterSpacing: .8 }}>LINKS (up to 4)</div>
          {bioDraft.links.map(function(link, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  value={link.label}
                  onChange={function(e) { setBioDraft(function(d) { var ls = d.links.slice(); ls[i] = Object.assign({}, ls[i], { label: e.target.value.slice(0, 30) }); return Object.assign({}, d, { links: ls }); }); }}
                  placeholder="Label"
                  style={{ width: 90, background: CARD2, border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', flexShrink: 0 }}
                />
                <input
                  value={link.url}
                  onChange={function(e) { setBioDraft(function(d) { var ls = d.links.slice(); ls[i] = Object.assign({}, ls[i], { url: e.target.value }); return Object.assign({}, d, { links: ls }); }); }}
                  placeholder="https://..."
                  style={{ flex: 1, background: CARD2, border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '6px 8px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none' }}
                />
              </div>
            );
          })}
          {bioDraft.links.length < 4 && (
            <button onClick={function() { setBioDraft(function(d) { return Object.assign({}, d, { links: d.links.concat([{ label: '', url: '' }]) }); }); }} style={{ background: 'transparent', border: '1px dashed ' + BORDER, borderRadius: 8, padding: '6px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', marginBottom: 14 }}>+ ADD LINK</button>
          )}
          <button
            onClick={function() {
              var links = bioDraft.links.filter(function(l) { return l.url.trim(); });
              if (socket) socket.emit('set-host-bio', { roomId: roomId, bio: bioDraft.bio, links: links });
              setShowBioEdit(false);
            }}
            style={{ background: GOLD, border: 'none', borderRadius: 12, padding: '12px', fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}
          >SAVE BIO</button>
        </div>
      )}

      {/* ════════════════ BATCH 45: DRAMATIC COUNTDOWN OVERLAY ════════════════ */}
      {dramaticCountdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: 'rgba(0,0,0,.55)' }}>
          {dramaticCountdown.label ? (
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, letterSpacing: 3, marginBottom: 10, textTransform: 'uppercase', textShadow: '0 0 20px ' + GOLD + '88' }}>{dramaticCountdown.label}</div>
          ) : null}
          <div style={{
            fontFamily: "'Bebas Neue',cursive",
            fontSize: dramaticCountdown.done ? 88 : 140,
            color: dramaticCountdown.done ? GOLD : RED,
            lineHeight: 1,
            textShadow: '0 0 60px ' + (dramaticCountdown.done ? GOLD : RED) + 'BB, 0 0 120px ' + (dramaticCountdown.done ? GOLD : RED) + '44',
            transition: 'font-size .15s ease, color .15s ease',
            letterSpacing: 4,
          }}>
            {dramaticCountdown.done ? '🎉' : dramaticCountdown.count}
          </div>
          {dramaticCountdown.done && (
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: TEXT, letterSpacing: 4, marginTop: 12, textShadow: '0 0 20px ' + GOLD + '66' }}>LET'S GO!</div>
          )}
        </div>
      )}

      {/* ════════════════ BATCH 45: STAGE FILTER PICKER ════════════════ */}
      {showFilterPicker && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🎞️ STAGE FILTER</span>
              <button onClick={function() { setShowFilterPicker(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 12, letterSpacing: .3 }}>APPLIES TO ALL VIEWERS IN REAL TIME</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {STAGE_FILTER_META.map(function(f) {
                var active = (stageFilter === f.key) || (f.key === 'normal' && !stageFilter);
                return (
                  <button key={f.key} onClick={function() {
                    if (socket) socket.emit('set-stage-filter', { roomId: roomId, filter: f.key });
                    setShowFilterPicker(false);
                  }} style={{ background: active ? 'rgba(201,168,76,.18)' : CARD2, border: '1.5px solid ' + (active ? GOLD : BORDER), borderRadius: 10, padding: '10px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20 }}>{f.emoji}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: active ? GOLD : MUTED, letterSpacing: .3 }}>{f.label.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
            {stageFilter && (
              <button onClick={function() {
                if (socket) socket.emit('set-stage-filter', { roomId: roomId, filter: 'normal' });
                setShowFilterPicker(false);
              }} style={{ marginTop: 12, width: '100%', background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                CLEAR FILTER
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 45: DRAMATIC COUNTDOWN SETUP ════════════════ */}
      {showDramaticSet && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🔢 DRAMATIC COUNTDOWN</span>
              <button onClick={function() { setShowDramaticSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5, marginBottom: 6 }}>LABEL (OPTIONAL)</div>
              <input
                value={dramaticCdLabel}
                onChange={function(e) { setDramaticCdLabel(e.target.value.slice(0, 40)); }}
                placeholder="e.g. SPECIAL REVEAL IN..."

                style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .5, marginBottom: 8 }}>COUNT FROM</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['3','5','7','10'].map(function(n) {
                  return (
                    <button key={n} onClick={function() { setDramaticCdFrom(n); }} style={{ flex: 1, background: dramaticCdFrom === n ? 'rgba(201,168,76,.18)' : CARD2, border: '1.5px solid ' + (dramaticCdFrom === n ? GOLD : BORDER), borderRadius: 8, padding: '8px', fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: dramaticCdFrom === n ? GOLD : MUTED, cursor: 'pointer' }}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={function() {
                var from = Math.max(3, Math.min(10, parseInt(dramaticCdFrom, 10) || 5));
                if (socket) socket.emit('dramatic-countdown', { roomId: roomId, from: from, label: dramaticCdLabel.trim() });
                setShowDramaticSet(false);
              }}
              style={{ width: '100%', background: RED, border: 'none', borderRadius: 12, padding: '13px', fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: '#fff', cursor: 'pointer', letterSpacing: 2 }}
            >START COUNTDOWN</button>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 45: SESSION STATS PANEL ════════════════ */}
      {showSessionStats && (
        <div style={{ position: 'fixed', bottom: 90, right: 12, left: 12, zIndex: 700 }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 360, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>📊 SESSION STATS</span>
              <button onClick={function() { setShowSessionStats(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '💫', label: 'Reactions', value: reactWall.length },
                { icon: '❤️', label: 'Fan Club', value: fanClub.length },
                { icon: '✍️', label: 'Sign-Ins', value: signInLog.length },
                { icon: '☁️', label: 'Top Word', value: wordCloud.length > 0 ? wordCloud[0].word : '—' },
                { icon: '🎡', label: 'Last Winner', value: (prizeWheel && prizeWheel.lastWinner) ? prizeWheel.lastWinner : '—' },
                { icon: '👁', label: 'Viewers', value: viewerCount || 0 },
                { icon: '💬', label: 'Chat Msgs', value: (chat || []).length },
                { icon: '🎯', label: 'Spotlight', value: spotlightPick ? spotlightPick.username : '—' },
              ].map(function(stat) {
                return (
                  <div key={stat.label} style={{ background: CARD2, borderRadius: 10, padding: '10px 12px', border: '1px solid ' + BORDER }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: .3, marginBottom: 2 }}>{stat.label.toUpperCase()}</div>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: GOLD, letterSpacing: .5 }}>{stat.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 46: TIP MILESTONE FLASH ════════════════ */}
      {tipMilestoneFlash && (
        <div style={{ position: 'fixed', top: '20%', left: 0, right: 0, zIndex: 8500, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1000, ' + CARD + ')', border: '2px solid ' + GOLD, borderRadius: 20, padding: '18px 32px', textAlign: 'center', boxShadow: '0 0 40px ' + GOLD + '55' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{tipMilestoneFlash.pct >= 100 ? '🎉' : tipMilestoneFlash.pct >= 75 ? '🔥' : tipMilestoneFlash.pct >= 50 ? '⚡' : '✨'}</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: GOLD, letterSpacing: 3, lineHeight: 1 }}>{tipMilestoneFlash.pct}% GOAL</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, marginTop: 4, letterSpacing: .5 }}>{tipMilestoneFlash.label || 'REACHED!'}</div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 46: PINNED EMOJI OVERLAY ════════════════ */}
      {pinnedEmoji && (
        <div style={{ position: 'fixed', bottom: 160, right: 20, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none', animation: 'spotlightIn .3s ease' }}>
          <div style={{ fontSize: 52, filter: 'drop-shadow(0 0 12px rgba(255,255,255,.4))', lineHeight: 1 }}>{pinnedEmoji.emoji}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: 1 }}>PINNED</div>
        </div>
      )}

      {/* ════════════════ BATCH 46: PIN EMOJI PICKER ════════════════ */}
      {showEmojiPin && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>📍 PIN EMOJI (30s)</span>
              <button onClick={function() { setShowEmojiPin(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14 }}>
              {['🔥','❤️','💎','⭐','🎉','👑','💜','🚀','🎯','💰','🌟','✨'].map(function(e) {
                return (
                  <button key={e} onClick={function() {
                    if (socket) socket.emit('pin-emoji', { roomId: roomId, emoji: e });
                    setShowEmojiPin(false);
                  }} style={{ background: CARD2, border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e}
                  </button>
                );
              })}
            </div>
            {pinnedEmoji && (
              <button onClick={function() {
                if (socket) socket.emit('unpin-emoji', { roomId: roomId });
                setShowEmojiPin(false);
              }} style={{ width: '100%', background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer', letterSpacing: .5 }}>
                UNPIN
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 46: AUDIO LEVEL METER ════════════════ */}
      {showAudioMeter && (
        <div style={{ position: 'fixed', top: 80, right: 16, zIndex: 600, background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '12px 14px', minWidth: 120 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>🎙️ AUDIO LEVEL</div>
          <div style={{ height: 80, width: 20, background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden', margin: '0 auto', position: 'relative' }}>
            <div style={{
              position: 'absolute', bottom: 0, width: '100%',
              height: ((audioLevelPct !== null ? audioLevelPct : 0)) + '%',
              background: (audioLevelPct || 0) > 70 ? RED : (audioLevelPct || 0) > 40 ? GOLD : TEAL,
              borderRadius: 10,
              transition: 'height .3s ease, background .3s ease',
            }} />
          </div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: GOLD, textAlign: 'center', marginTop: 6, letterSpacing: 1 }}>{audioLevelPct !== null ? audioLevelPct : '—'}%</div>
          {(role !== 'host' && role !== 'cohost') && audioLevelPct === null && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: MUTED, textAlign: 'center', marginTop: 4 }}>WAITING...</div>
          )}
          <button onClick={function() { setShowAudioMeter(false); }} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 10 }}>✕ close</button>
        </div>
      )}

      {/* ════════════════ BATCH 47: QUESTION ANSWERED BANNER ════════════════ */}
      {questionAnswered && (
        <div style={{ position: 'fixed', top: 80, left: 0, right: 0, zIndex: 8000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: CARD, border: '1px solid ' + GOLD, borderRadius: 16, padding: '12px 20px', maxWidth: 320, textAlign: 'center', boxShadow: '0 0 30px ' + GOLD + '44' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, letterSpacing: 1, marginBottom: 4 }}>🎤 NOW ANSWERING</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: MUTED, marginBottom: 4 }}>{questionAnswered.username}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEXT, lineHeight: 1.4 }}>{questionAnswered.text}</div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 47: TRIVIA PANEL ════════════════ */}
      {showTriviaPanel && triviaDrop && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🧠 TRIVIA</span>
              <button onClick={function() { setShowTriviaPanel(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: TEXT, marginBottom: 14, lineHeight: 1.4 }}>{triviaDrop.q}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(triviaDrop.opts || []).map(function(opt, oi) {
                var letter = ['A','B','C','D'][oi] || String(oi);
                var voted = triviaVote === letter;
                var isAnswer = triviaResults && triviaResults.answer === letter;
                var voteCount = triviaResults && triviaResults.votes ? (triviaResults.votes[letter] || 0) : 0;
                var totalVotes = triviaResults && triviaResults.total ? triviaResults.total : 0;
                var pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                return (
                  <button key={letter} onClick={function() {
                    if (triviaVote || (triviaDrop.revealed)) return;
                    setTriviaVote(letter);
                    if (socket) socket.emit('trivia-vote', { roomId: roomId, choice: letter });
                  }} style={{ background: isAnswer ? 'rgba(201,168,76,.2)' : voted ? 'rgba(212,133,74,.15)' : CARD2, border: '1.5px solid ' + (isAnswer ? GOLD : voted ? TEAL : BORDER), borderRadius: 10, padding: '10px 12px', cursor: (triviaVote || triviaDrop.revealed) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', overflow: 'hidden', transition: 'border-color .2s' }}>
                    {triviaResults && (
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', background: isAnswer ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.04)', transition: 'width .5s ease', borderRadius: 10 }} />
                    )}
                    <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: isAnswer ? GOLD : voted ? TEAL : MUTED, letterSpacing: 1, zIndex: 1, flexShrink: 0 }}>{letter}</span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, flex: 1, textAlign: 'left', zIndex: 1 }}>{opt}</span>
                    {triviaResults && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: isAnswer ? GOLD : MUTED, zIndex: 1 }}>{pct}%</span>}
                  </button>
                );
              })}
            </div>
            {triviaDrop.revealed && triviaResults && (
              <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, textAlign: 'center', letterSpacing: .5 }}>✓ ANSWER: {triviaResults.answer}</div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 47: TRIVIA SETUP (HOST) ════════════════ */}
      {showTriviaSet && (role === 'host' || role === 'cohost') && !triviaDrop && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 710, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🧠 DROP TRIVIA</span>
              <button onClick={function() { setShowTriviaSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <input value={triviaDraft.q} onChange={function(e) { setTriviaDraft(function(d) { return Object.assign({}, d, { q: e.target.value }); }); }} placeholder="Question..." style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
            {['A','B','C','D'].map(function(letter, i) {
              return (
                <div key={letter} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <button onClick={function() { setTriviaDraft(function(d) { return Object.assign({}, d, { answer: letter }); }); }} style={{ width: 28, height: 28, borderRadius: '50%', background: triviaDraft.answer === letter ? GOLD : CARD2, border: '1.5px solid ' + (triviaDraft.answer === letter ? GOLD : BORDER), color: triviaDraft.answer === letter ? '#0E0C09' : MUTED, fontFamily: "'Bebas Neue',cursive", fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>{letter}</button>
                  <input value={triviaDraft.opts[i] || ''} onChange={function(e) { var v = e.target.value; setTriviaDraft(function(d) { var opts = d.opts.slice(); opts[i] = v; return Object.assign({}, d, { opts: opts }); }); }} placeholder={'Option ' + letter} style={{ flex: 1, background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '6px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13 }} />
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, marginTop: 6 }}>
              {['20','30','45','60'].map(function(s) {
                return <button key={s} onClick={function() { setTriviaDraft(function(d) { return Object.assign({}, d, { secs: s }); }); }} style={{ flex: 1, background: triviaDraft.secs === s ? 'rgba(201,168,76,.18)' : CARD2, border: '1.5px solid ' + (triviaDraft.secs === s ? GOLD : BORDER), borderRadius: 8, padding: '6px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: triviaDraft.secs === s ? GOLD : MUTED, cursor: 'pointer' }}>{s}s</button>;
              })}
            </div>
            <button onClick={function() {
              var opts = triviaDraft.opts.filter(function(o) { return o.trim(); });
              if (!triviaDraft.q.trim() || opts.length < 2) { if (addToast) addToast('Need question + ≥2 options', 'error'); return; }
              if (socket) socket.emit('trivia-drop', { roomId: roomId, q: triviaDraft.q.trim(), opts: opts, answer: triviaDraft.answer, secs: parseInt(triviaDraft.secs, 10) || 30 }, function(res) {
                if (res && res.ok) { setShowTriviaSet(false); if (addToast) addToast('🧠 Trivia dropped!', 'success'); }
                else if (res && res.error) { if (addToast) addToast(res.error, 'error'); }
              });
            }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 12, padding: '12px', fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}>DROP TRIVIA</button>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 47: VIEWER Q QUEUE PANEL ════════════════ */}
      {showViewerQueue && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>❓ ASK THE HOST</span>
              <button onClick={function() { setShowViewerQueue(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            {!myQueueId && (
              <div style={{ marginBottom: 12 }}>
                <textarea value={queueDraft} onChange={function(e) { setQueueDraft(e.target.value.slice(0, 200)); }} placeholder="Your question..." rows={2} style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
                <button onClick={function() {
                  if (!queueDraft.trim()) return;
                  if (socket) socket.emit('viewer-question', { roomId: roomId, text: queueDraft.trim() }, function(res) {
                    if (res && res.ok) { setMyQueueId(res.id); setQueueDraft(''); if (addToast) addToast('❓ Question submitted!', 'success'); }
                    else if (res && res.error) { if (addToast) addToast(res.error, 'error'); }
                  });
                }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 10, padding: '10px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}>SUBMIT</button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {viewerQueue.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '16px 0' }}>NO QUESTIONS YET</div>}
              {viewerQueue.map(function(q) {
                var isOwn = q.id === myQueueId;
                return (
                  <div key={q.id} style={{ background: CARD2, borderRadius: 10, padding: '10px 12px', marginBottom: 6, border: '1px solid ' + (isOwn ? GOLD + '66' : BORDER) }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: isOwn ? GOLD : MUTED, marginBottom: 3 }}>{q.username}{isOwn ? ' (you)' : ''}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, marginBottom: 6 }}>{q.text}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={function() { if (socket) socket.emit('upvote-question', { roomId: roomId, id: q.id }); }} style={{ background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>▲ {q.votes || 0}</button>
                      {(role === 'host' || role === 'cohost') && (
                        <>
                          <button onClick={function() { if (socket) socket.emit('answer-question', { roomId: roomId, id: q.id }); }} style={{ background: 'rgba(201,168,76,.15)', border: '1px solid ' + GOLD + '66', borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: GOLD, cursor: 'pointer' }}>✓ Answer</button>
                          <button onClick={function() { if (socket) socket.emit('dismiss-question', { roomId: roomId, id: q.id }); }} style={{ background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>✕</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 47: HOST Q QUEUE PANEL ════════════════ */}
      {showQueuePanel && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 90, right: 12, zIndex: 700, width: 320 }}>
          <div style={{ background: CARD, border: '1px solid ' + GOLD + '55', borderRadius: 16, padding: '14px', maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: GOLD, letterSpacing: 1.5 }}>📋 Q QUEUE ({viewerQueue.length})</span>
              <button onClick={function() { setShowQueuePanel(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {viewerQueue.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '12px 0' }}>NONE YET</div>}
              {viewerQueue.map(function(q) {
                return (
                  <div key={q.id} style={{ background: CARD2, borderRadius: 8, padding: '8px 10px', marginBottom: 6, border: '1px solid ' + BORDER }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, marginBottom: 2 }}>{q.username} · ▲{q.votes || 0}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, marginBottom: 6 }}>{q.text}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={function() { if (socket) socket.emit('answer-question', { roomId: roomId, id: q.id }); }} style={{ background: 'rgba(201,168,76,.15)', border: '1px solid ' + GOLD + '55', borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: GOLD, cursor: 'pointer' }}>✓ Answer</button>
                      <button onClick={function() { if (socket) socket.emit('dismiss-question', { roomId: roomId, id: q.id }); }} style={{ background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 6, padding: '3px 8px', fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 47: NAME TAG EDITOR ════════════════ */}
      {showNameTagEdit && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🏷️ NAME TAG</span>
              <button onClick={function() { setShowNameTagEdit(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 8 }}>ADD A TAGLINE SHOWN UNDER YOUR NAME IN CHAT</div>
            <input value={nameTagDraft} onChange={function(e) { setNameTagDraft(e.target.value.slice(0, 50)); }} placeholder="e.g. Music producer from LA..." maxLength={50} style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() {
                if (socket) socket.emit('set-name-tag', { roomId: roomId, tag: nameTagDraft.trim() }, function(res) {
                  if (res && res.ok) { setNameTag(nameTagDraft.trim()); setNameTags(function(prev) { var n = Object.assign({}, prev); if (nameTagDraft.trim()) n[userId] = nameTagDraft.trim(); else delete n[userId]; return n; }); setShowNameTagEdit(false); if (addToast) addToast('🏷️ Name tag set!', 'success'); }
                });
              }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 10, padding: '10px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}>SAVE</button>
              {nameTag && (
                <button onClick={function() {
                  if (socket) socket.emit('set-name-tag', { roomId: roomId, tag: '' }, function(res) {
                    if (res && res.ok) { setNameTag(''); setNameTags(function(prev) { var n = Object.assign({}, prev); delete n[userId]; return n; }); setShowNameTagEdit(false); }
                  });
                }} style={{ background: 'transparent', border: '1px solid ' + BORDER, borderRadius: 10, padding: '10px 14px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, cursor: 'pointer' }}>CLEAR</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 48: DONATION MATCH COMPLETE FLASH ════════════════ */}
      {matchCompleteFlash && (
        <div style={{ position: 'fixed', top: '22%', left: 0, right: 0, zIndex: 8800, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #0d0026, ' + CARD + ')', border: '2px solid #A855F7', borderRadius: 20, padding: '18px 32px', textAlign: 'center', boxShadow: '0 0 40px #A855F755' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🤝</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: '#A855F7', letterSpacing: 3, lineHeight: 1 }}>MATCH COMPLETE!</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: TEXT, marginTop: 6 }}>{matchCompleteFlash.label} — ${Math.floor((matchCompleteFlash.totalCents || 0) / 100)} matched!</div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 48: VIEWER LOCATION PANEL ════════════════ */}
      {showLocationPanel && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🌍 WHERE ARE YOU WATCHING FROM?</span>
              <button onClick={function() { setShowLocationPanel(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            {!myLocation && (
              <div style={{ marginBottom: 14 }}>
                <input value={locationDraft} onChange={function(e) { setLocationDraft(e.target.value.slice(0, 60)); }} placeholder="City, Country — e.g. Atlanta, USA" style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
                <button onClick={function() {
                  if (!locationDraft.trim()) return;
                  if (socket) socket.emit('viewer-location', { roomId: roomId, location: locationDraft.trim() }, function(res) {
                    if (res && res.ok) { setMyLocation(locationDraft.trim()); if (addToast) addToast('🌍 Location shared!', 'success'); }
                  });
                }} style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 10, padding: '10px', fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: '#0E0C09', cursor: 'pointer', letterSpacing: 1.5 }}>SHARE</button>
              </div>
            )}
            {myLocation && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEAL, marginBottom: 12 }}>✓ You shared: {myLocation}</div>}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 8, letterSpacing: .5 }}>VIEWERS ({locationShoutouts.length})</div>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {locationShoutouts.length === 0 && <div style={{ color: MUTED, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: 'center', padding: '8px 0' }}>NONE YET</div>}
              {locationShoutouts.slice().reverse().map(function(entry) {
                return (
                  <div key={entry.userId} style={{ background: CARD2, borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>📍</span>
                    <div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED }}>{entry.username}</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT }}>{entry.location}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 48: DONATION MATCH SETUP ════════════════ */}
      {showMatchSet && (role === 'host' || role === 'cohost') && !donationMatch && (
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 700, padding: '0 12px' }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: TEXT, letterSpacing: 1.5 }}>🤝 DONATION MATCH</span>
              <button onClick={function() { setShowMatchSet(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 8 }}>LABEL</div>
            <input value={matchDraft.label} onChange={function(e) { setMatchDraft(function(d) { return Object.assign({}, d, { label: e.target.value }); }); }} style={{ width: '100%', background: CARD2, border: '1px solid ' + BORDER, borderRadius: 8, padding: '8px 10px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginBottom: 8 }}>MATCH UP TO (USD)</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {['25','50','100','250'].map(function(d) {
                return <button key={d} onClick={function() { setMatchDraft(function(m) { return Object.assign({}, m, { limitDollars: d }); }); }} style={{ flex: 1, background: matchDraft.limitDollars === d ? 'rgba(168,85,247,.18)' : CARD2, border: '1.5px solid ' + (matchDraft.limitDollars === d ? '#A855F7' : BORDER), borderRadius: 8, padding: '8px', fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: matchDraft.limitDollars === d ? '#A855F7' : MUTED, cursor: 'pointer' }}>${d}</button>;
              })}
            </div>
            <button onClick={function() {
              var limitCents = Math.floor(parseFloat(matchDraft.limitDollars) * 100) || 0;
              if (!limitCents) { if (addToast) addToast('Invalid amount', 'error'); return; }
              if (socket) socket.emit('set-donation-match', { roomId: roomId, limitCents: limitCents, label: matchDraft.label.trim() || 'DONATION MATCH' }, function(res) {
                if (res && res.ok) { setShowMatchSet(false); if (addToast) addToast('🤝 Donation match active!', 'success'); }
                else if (res && res.error) { if (addToast) addToast(res.error, 'error'); }
              });
            }} style={{ width: '100%', background: '#A855F7', border: 'none', borderRadius: 12, padding: '12px', fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: '#fff', cursor: 'pointer', letterSpacing: 2 }}>START MATCH</button>
          </div>
        </div>
      )}

      {/* ════════════════ BATCH 48: WATCH TIME LEADERBOARD ════════════════ */}
      {showWatchLeaders && (role === 'host' || role === 'cohost') && (
        <div style={{ position: 'fixed', bottom: 90, right: 12, zIndex: 700, width: 300 }}>
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: GOLD, letterSpacing: 1.5 }}>⏱️ TOP WATCH TIME</span>
              <button onClick={function() { setShowWatchLeaders(false); }} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            {watchLeaders.length === 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, textAlign: 'center', padding: '10px 0' }}>NO DATA YET</div>}
            {watchLeaders.map(function(e, i) {
              var mins = Math.floor((e.totalMs || 0) / 60000);
              return (
                <div key={e.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < watchLeaders.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: i === 0 ? GOLD : MUTED, width: 16 }}>#{i + 1}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, color: TEXT, flex: 1 }}>{e.userId}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: TEAL }}>{mins}m</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
