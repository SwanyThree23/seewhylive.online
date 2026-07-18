import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Play, Pause, RefreshCw } from 'lucide-react';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

// Canvas dimensions
const LS_W = 1280, LS_H = 720;   // 16:9 landscape
const PT_W = 405,  PT_H = 720;   // 9:16 portrait

function useAnimationFrame(callback, active) {
  const rafRef = useRef(null);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const loop = () => { cbRef.current(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);
}

/**
 * DualStreamManager — outputs 16:9 landscape AND 9:16 portrait simultaneously
 * from a single input MediaStream, using canvas recomposition.
 *
 * Props:
 *   localStream        {MediaStream|null}
 *   isActive           {boolean}          — start/stop canvas capture
 *   onStreamsReady     {fn({ landscape: MediaStream, portrait: MediaStream })}
 */
export default function DualStreamManager({ localStream, isActive = false, onStreamsReady }) {
  const [running, setRunning] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  const videoRef    = useRef(null);
  const lsCanvasRef = useRef(null);  // 16:9
  const ptCanvasRef = useRef(null);  // 9:16
  const lsPreviewRef = useRef(null); // small preview canvas 16:9
  const ptPreviewRef = useRef(null); // small preview canvas 9:16
  const streamsRef  = useRef({ landscape: null, portrait: null });
  const tickRef     = useRef(0);

  // Wire localStream → hidden video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (localStream) {
      v.srcObject = localStream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
  }, [localStream]);

  // Start canvas capture
  const startCapture = useCallback(() => {
    const lsCanvas = lsCanvasRef.current;
    const ptCanvas = ptCanvasRef.current;
    if (!lsCanvas || !ptCanvas) return;

    const lsStream = lsCanvas.captureStream(30);
    const ptStream = ptCanvas.captureStream(30);
    streamsRef.current = { landscape: lsStream, portrait: ptStream };
    setRunning(true);
    onStreamsReady?.({ landscape: lsStream, portrait: ptStream });
  }, [onStreamsReady]);

  const stopCapture = useCallback(() => {
    const { landscape, portrait } = streamsRef.current;
    landscape?.getTracks().forEach(t => t.stop());
    portrait?.getTracks().forEach(t => t.stop());
    streamsRef.current = { landscape: null, portrait: null };
    setRunning(false);
    onStreamsReady?.(null);
  }, [onStreamsReady]);

  const toggle = () => { running ? stopCapture() : startCapture(); };

  // Draw loop: copies video frames to both canvases
  useAnimationFrame(() => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;

    const vw = v.videoWidth  || LS_W;
    const vh = v.videoHeight || LS_H;

    // ── Landscape 16:9: scale-to-fill ──
    const lsCtx = lsCanvasRef.current?.getContext('2d');
    if (lsCtx) lsCtx.drawImage(v, 0, 0, LS_W, LS_H);

    // ── Portrait 9:16: center-crop from source ──
    const cropW  = Math.round(vh * (9 / 16));
    const cropX  = Math.round((vw - cropW) / 2);
    const ptCtx  = ptCanvasRef.current?.getContext('2d');
    if (ptCtx) ptCtx.drawImage(v, cropX, 0, cropW, vh, 0, 0, PT_W, PT_H);

    // ── Small previews ──
    const lsPrvCtx = lsPreviewRef.current?.getContext('2d');
    if (lsPrvCtx) lsPrvCtx.drawImage(lsCanvasRef.current, 0, 0, lsPreviewRef.current.width, lsPreviewRef.current.height);

    const ptPrvCtx = ptPreviewRef.current?.getContext('2d');
    if (ptPrvCtx) ptPrvCtx.drawImage(ptCanvasRef.current, 0, 0, ptPreviewRef.current.width, ptPreviewRef.current.height);

    tickRef.current++;
    if (tickRef.current % 30 === 0) setFrameCount(c => c + 1); // force re-render once/sec for FPS indicator
  }, running && !!localStream);

  // Auto-start when isActive changes
  useEffect(() => {
    if (isActive && !running && localStream) startCapture();
    if (!isActive && running) stopCapture();
  }, [isActive, localStream]);

  const hasStream = !!localStream;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Monitor className="w-3.5 h-3.5" style={{ color: G }} />
            <span className="text-white/30 text-[10px]">+</span>
            <Smartphone className="w-3 h-3" style={{ color: G }} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: G }}>Dual Stream</span>
          {running && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse" style={{ ...T, background: 'rgba(192,57,43,0.25)', color: '#C0392B' }}>
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={!hasStream}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded font-black text-[10px] uppercase transition-all disabled:opacity-30"
          style={{
            background: running ? 'rgba(192,57,43,0.2)' : `${G}20`,
            border: `1px solid ${running ? 'rgba(192,57,43,0.5)' : `${G}50`}`,
            color: running ? '#C0392B' : G, ...T,
          }}
        >
          {running ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start</>}
        </button>
      </div>

      {!hasStream && (
        <div className="rounded-lg px-3 py-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[11px] text-white/25" style={T}>Connect a camera first</p>
        </div>
      )}

      {/* Side-by-side previews */}
      {hasStream && (
        <div className="grid grid-cols-2 gap-2">
          {/* 16:9 landscape */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Monitor className="w-3 h-3" style={{ color: G }} />
              <span className="text-[10px] font-bold text-white/60" style={T}>16:9 Landscape</span>
            </div>
            <div className="relative rounded-lg overflow-hidden" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
              <canvas ref={lsPreviewRef} width={240} height={135} style={{ width: '100%', display: 'block' }} />
              {!running && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <p className="text-[9px] text-white/30" style={T}>PAUSED</p>
                </div>
              )}
              {running && (
                <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] font-black" style={{ background: 'rgba(192,57,43,0.8)', color: '#fff', ...T }}>
                  1280×720
                </div>
              )}
            </div>
          </div>

          {/* 9:16 portrait */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" style={{ color: G }} />
              <span className="text-[10px] font-bold text-white/60" style={T}>9:16 Portrait</span>
            </div>
            <div className="relative rounded-lg overflow-hidden" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Portrait canvas rendered in a 9:16 aspect-ratio box */}
              <div style={{ paddingTop: `${(16 / 9) * 100}%`, position: 'relative' }}>
                <canvas ref={ptPreviewRef} width={135} height={240} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                {!running && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <p className="text-[9px] text-white/30" style={T}>PAUSED</p>
                  </div>
                )}
                {running && (
                  <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] font-black" style={{ background: 'rgba(192,57,43,0.8)', color: '#fff', ...T }}>
                    405×720
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How-to note */}
      {running && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-lg p-3 space-y-1" style={{ background: `${G}08`, border: `1px solid ${G}20` }}>
          <p className="text-[10px] font-black text-white/70" style={T}>Both streams are now active</p>
          <p className="text-[10px] text-white/35">
            Add a separate RTMP destination below for each orientation — landscape for YouTube/Twitch, portrait for TikTok/Reels.
          </p>
        </motion.div>
      )}

      {/* Hidden canvases (full resolution — not shown in DOM) */}
      <canvas ref={lsCanvasRef} width={LS_W} height={LS_H} style={{ display: 'none' }} />
      <canvas ref={ptCanvasRef} width={PT_W} height={PT_H} style={{ display: 'none' }} />
      {/* Hidden video to drive the canvas draws */}
      <video ref={videoRef} muted playsInline autoPlay style={{ display: 'none' }} />
    </div>
  );
}
