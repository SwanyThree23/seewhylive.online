/* SeeWhy LIVE — design tokens. Single source of truth for the frontend/ app. */
export var T = {
  /* ── Color ── */
  bg:      '#0E0C09',
  surf:    '#1A1510',
  card:    '#241C12',
  card2:   '#2E2318',
  line:    'rgba(201,168,76,.12)',
  lineHi:  'rgba(201,168,76,.30)',

  gold:    '#C9A84C',
  goldDim: '#7A6428',
  cream:   '#F0E8D4',
  muted:   '#8A7A62',
  dim:     '#3D3020',

  red:     '#FF1A3C',
  burg:    '#800020',
  teal:    '#D4854A',
  green:   '#00C264',
  cyan:    '#00C2D4',

  /* ── Typography ── */
  fontHead: "'Barlow Condensed', sans-serif",
  fontMono: "'DM Mono', monospace",
  fontBody: "'Inter', 'DM Sans', sans-serif",

  /* ── Radius ── */
  r4:  4,
  r8:  8,
  r12: 12,
  r16: 16,
  r24: 24,
  rFull: 9999,

  /* ── Spacing ── */
  gap4:  4,
  gap8:  8,
  gap12: 12,
  gap16: 16,
  gap24: 24,

  /* ── Touch targets ── */
  tap: 44,
};

/* ── Animation keyframes — inject once into <head> ── */
var _injected = false;
var MOTION_CSS = [
  '@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes scaleIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}',
  '@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}',
  '@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}',
  '@keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,26,60,.5)}70%{box-shadow:0 0 0 8px rgba(255,26,60,0)}}',
  '@keyframes speakBar{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}',
  '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}',
  '@keyframes drawerIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}',
  '@keyframes toast{0%{opacity:0;transform:translateY(-10px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}',
  '@keyframes countdownBar{from{width:100%}to{width:0}}',
].join('\n');

export function injectMotion() {
  if (_injected || typeof document === 'undefined') return;
  var el = document.createElement('style');
  el.id = 'sw-motion';
  el.textContent = MOTION_CSS;
  document.head.appendChild(el);
  _injected = true;
}
