import { useEffect, useRef, useCallback, useState } from 'react';

const W = 1920;
const H = 1080;
const FONT = 'bold 18px "Barlow Condensed", Arial, sans-serif';
const GOLD = '#D4AF37';
const BG = '#080B18';

// Create or reuse a hidden video element for a MediaStream
function streamToVideo(stream, cache) {
  if (!stream) return null;
  const id = stream.id;
  if (cache.current[id]) return cache.current[id];
  const vid = document.createElement('video');
  vid.srcObject = stream;
  vid.autoplay = true;
  vid.muted = true;
  vid.playsInline = true;
  vid.play().catch(() => {});
  cache.current[id] = vid;
  return vid;
}

// Truncate text with ellipsis to fit within maxWidth px
function truncateText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxWidth) lo = mid; else hi = mid;
  }
  return text.slice(0, lo) + '…';
}

// Draw a single video slot; if videoEl is null draw a black placeholder
// speaking: true draws a gold ring around the tile
function drawSlot(ctx, videoEl, x, y, w, h, label, speaking = false) {
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, w, h);
  if (videoEl && videoEl.readyState >= 2) {
    try {
      ctx.drawImage(videoEl, x, y, w, h);
    } catch {
      // video not yet drawable — leave placeholder
    }
  }
  // Speaking ring
  if (speaking) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  }
  // Label bar
  ctx.font = FONT;
  const labelText = truncateText(ctx, label || '', w - 16);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(x, y + h - 28, w, 28);
  ctx.fillStyle = speaking ? GOLD : '#fff';
  ctx.fillText(labelText, x + 8, y + h - 9);
}

// Overlay: top-left logo + bottom-center title bar + top-right LIVE badge
function drawOverlay(ctx, { title, subtitle, showLive }) {
  // LIVE badge
  if (showLive) {
    ctx.fillStyle = 'rgba(192,57,43,0.85)';
    roundRect(ctx, W - 100, 20, 80, 32, 6);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('● LIVE', W - 60, 41);
    ctx.textAlign = 'left';
  }
  // Bottom title bar
  if (title) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, H - 56, W, 56);
    ctx.font = `bold 28px "Barlow Condensed", Arial`;
    ctx.fillStyle = GOLD;
    ctx.fillText(title, 20, H - 22);
    if (subtitle) {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(subtitle, 20, H - 6);
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Core 30fps canvas compositor.
 *
 * slots: Array<{ stream: MediaStream|null, label: string, speaking?: boolean }>
 * overlayConfig: { title, subtitle, showLive, layout, battleData, spotlightIndex }
 *   layout: 'panel' | 'battle' | 'watchparty' | 'spotlight'
 *   spotlightIndex: index of the featured slot in 'spotlight' layout (default 0)
 *   battleData: { leftScore, rightScore, timeLeft, leftName, rightName }
 *
 * Returns: { canvasRef, compositeStream, isRunning, startCompositor, stopCompositor }
 */
export function useCanvasCompositor({ slots = [], overlayConfig = {} }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const videoCache = useRef({});
  const isRunningRef = useRef(false); // ref for synchronous double-entry guard
  const [isRunning, setIsRunning] = useState(false);
  const compositeStreamRef = useRef(null);

  // Purge stale video elements when streams change
  useEffect(() => {
    const activeIds = new Set(slots.map(s => s.stream?.id).filter(Boolean));
    Object.keys(videoCache.current).forEach(id => {
      if (!activeIds.has(id)) {
        videoCache.current[id].srcObject = null;
        delete videoCache.current[id];
      }
    });
  }, [slots]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { layout = 'panel', battleData, title, subtitle, showLive } = overlayConfig;

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    if (layout === 'spotlight') {
      drawSpotlightLayout(ctx, slots, videoCache, overlayConfig.spotlightIndex ?? 0);
    } else if (layout === 'panel') {
      drawPanelLayout(ctx, slots, videoCache);
    } else if (layout === 'battle') {
      drawBattleLayout(ctx, slots, videoCache, battleData);
    } else if (layout === 'watchparty') {
      drawWatchPartyLayout(ctx, slots, videoCache, battleData);
    }

    drawOverlay(ctx, { title, subtitle, showLive });
  }, [slots, overlayConfig]);

  const startCompositor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRunningRef.current) return null;
    isRunningRef.current = true;

    // Cancel any stale RAF loop before starting a new one
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Draw one frame first so captureStream has content immediately
    drawFrame();

    const stream = canvas.captureStream(30);
    compositeStreamRef.current = stream;
    setIsRunning(true);

    const loop = () => {
      drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return stream;
  }, [drawFrame]);

  const stopCompositor = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    compositeStreamRef.current = null;
    isRunningRef.current = false;
    setIsRunning(false);
  }, []);

  useEffect(() => () => stopCompositor(), [stopCompositor]);

  return {
    canvasRef,
    compositeStream: compositeStreamRef.current,
    isRunning,
    startCompositor,
    stopCompositor,
    drawFrame,
  };
}

// ── Layout renderers ─────────────────────────────────────────────────────────

function drawPanelLayout(ctx, slots, videoCache) {
  const n = Math.max(1, slots.length);
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  const tileW = Math.floor(W / cols);
  const tileH = Math.floor((H - 60) / rows);

  slots.forEach((slot, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * tileW;
    const y = row * tileH;
    const vid = streamToVideo(slot.stream, videoCache);
    drawSlot(ctx, vid, x, y, tileW - 2, tileH - 2, slot.label || `Guest ${i + 1}`, !!slot.speaking);
  });
}

// Spotlight: one large featured slot (72% width) + vertical strip of thumbnails (28%)
function drawSpotlightLayout(ctx, slots, videoCache, spotlightIndex = 0) {
  if (!slots.length) return;
  const SIDEBAR_W = Math.floor(W * 0.28);
  const MAIN_W = W - SIDEBAR_W - 2;
  const MAIN_H = H - 60;
  const featured = slots[spotlightIndex] || slots[0];
  const rest = slots.filter((_, i) => i !== spotlightIndex);

  // Main slot
  const mainVid = streamToVideo(featured.stream, videoCache);
  drawSlot(ctx, mainVid, 0, 0, MAIN_W, MAIN_H, featured.label || 'Host', !!featured.speaking);

  // Sidebar thumbnails
  const thumbCount = Math.max(1, rest.length);
  const thumbH = Math.floor(MAIN_H / thumbCount);
  rest.forEach((slot, i) => {
    const vid = streamToVideo(slot.stream, videoCache);
    drawSlot(ctx, vid, MAIN_W + 2, i * thumbH, SIDEBAR_W, thumbH - 2, slot.label || `Guest ${i + 1}`, !!slot.speaking);
  });
  // Placeholder thumbs if no guests yet
  if (!rest.length) {
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(MAIN_W + 2, 0, SIDEBAR_W, MAIN_H);
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'center';
    ctx.fillText('Guests appear here', MAIN_W + 2 + SIDEBAR_W / 2, MAIN_H / 2);
    ctx.textAlign = 'left';
  }
}

function drawBattleLayout(ctx, slots, videoCache, battleData = {}) {
  const { leftScore = 0, rightScore = 0, timeLeft = 180, leftName = 'Creator 1', rightName = 'Creator 2' } = battleData;
  const half = Math.floor(W / 2);
  const videoH = H - 120;

  // Left
  const leftVid = streamToVideo(slots[0]?.stream, videoCache);
  drawSlot(ctx, leftVid, 0, 0, half - 2, videoH, leftName);

  // Right
  const rightVid = streamToVideo(slots[1]?.stream, videoCache);
  drawSlot(ctx, rightVid, half + 2, 0, half - 2, videoH, rightName);

  // Center divider
  ctx.fillStyle = GOLD;
  ctx.fillRect(half - 2, 0, 4, videoH);

  // Score bar
  const barY = videoH;
  ctx.fillStyle = '#0A0A1A';
  ctx.fillRect(0, barY, W, 120);

  // Left score
  ctx.font = `bold 64px "Barlow Condensed", Arial`;
  ctx.fillStyle = leftScore >= rightScore ? GOLD : 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText(leftScore.toLocaleString(), half / 2, barY + 80);

  // Right score
  ctx.fillStyle = rightScore >= leftScore ? GOLD : 'rgba(255,255,255,0.6)';
  ctx.fillText(rightScore.toLocaleString(), half + half / 2, barY + 80);

  // Timer
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, '0');
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = timeLeft <= 30 ? '#C0392B' : 'rgba(255,255,255,0.8)';
  ctx.fillText(`${mins}:${secs}`, half, barY + 50);

  // Progress bar
  const total = battleData.totalTime || 180;
  const progress = (leftScore + rightScore) > 0 ? leftScore / (leftScore + rightScore) : 0.5;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(40, barY + 95, W - 80, 12);
  ctx.fillStyle = GOLD;
  ctx.fillRect(40, barY + 95, Math.floor((W - 80) * progress), 12);

  ctx.textAlign = 'left';
}

function drawWatchPartyLayout(ctx, slots, videoCache, extra = {}) {
  const { chatLines = [] } = extra;
  const screenH = Math.floor(H * 0.82);

  // Screen capture slot (first slot = getDisplayMedia stream)
  const screenVid = streamToVideo(slots[0]?.stream, videoCache);
  if (screenVid) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, screenH);
    try {
      if (screenVid.readyState >= 2) ctx.drawImage(screenVid, 0, 0, W, screenH);
    } catch { /* not yet drawable */ }
  } else {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, screenH);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('Click "Select Tab" to share your screen', W / 2, screenH / 2);
    ctx.textAlign = 'left';
  }

  // Chat ticker (bottom-right)
  if (chatLines.length > 0) {
    const lineH = 26;
    const boxH = Math.min(chatLines.length, 3) * lineH + 16;
    const boxW = 360;
    const boxX = W - boxW - 20;
    const boxY = screenH - boxH - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.font = '14px Arial';
    chatLines.slice(-3).forEach((line, i) => {
      ctx.fillStyle = GOLD;
      ctx.fillText(line.user || '', boxX + 8, boxY + 18 + i * lineH);
      ctx.fillStyle = '#fff';
      const msg = (line.text || '').substring(0, 32);
      ctx.fillText(`: ${msg}`, boxX + 8 + ctx.measureText(line.user || '').width, boxY + 18 + i * lineH);
    });
  }
}
