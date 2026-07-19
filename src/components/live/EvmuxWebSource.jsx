import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Link, ChevronDown, Globe, Plus, Trash2 } from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';

// Built-in animated presets (inline — no external fetch needed)
const BUILTIN_SOURCES = [
  {
    id: 'wave-text',
    label: '🌊 Wave Text',
    desc: 'Animated wave clip-path text overlay',
    html: `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:transparent;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.content{position:relative;width:100%;flex:1;display:flex;align-items:center;justify-content:center}
h2{color:#fff;font-size:min(12vw,110px);position:absolute;text-transform:uppercase;font-family:Roboto,sans-serif;font-weight:900;letter-spacing:0.04em}
h2:nth-child(1){color:transparent;-webkit-text-stroke:2px #068deb}
h2:nth-child(2){color:#068deb;animation:wave 4s ease-in-out infinite}
@keyframes wave{0%,100%{clip-path:polygon(0% 45%,16% 44%,33% 50%,54% 60%,70% 61%,84% 59%,100% 52%,100% 100%,0% 100%)}50%{clip-path:polygon(0% 60%,15% 65%,34% 66%,51% 62%,67% 50%,84% 45%,100% 46%,100% 100%,0% 100%)}}
p{font-size:min(5vw,56px);padding:16px 24px;text-align:center;color:#fff;font-family:Roboto,sans-serif;text-shadow:1px 1px black;margin:0}
</style></head><body>
<section style="flex:1;overflow:hidden"><div class="content"><h2>SEE WHY LIVE</h2><h2>SEE WHY LIVE</h2></div></section>
<p>This is a web source. Add and display web sources in your stream to improve visual presentation.</p>
</body></html>`,
  },
  {
    id: 'lower-third',
    label: '📺 Lower Third',
    desc: 'Gold animated lower-third ticker',
    html: `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:transparent;display:flex;align-items:flex-end;height:100vh;overflow:hidden}
.bar{width:100%;background:linear-gradient(90deg,#D4AF37,#8A6F2E);padding:10px 24px;display:flex;align-items:center;gap:16px}
.live{background:#C0392B;color:#fff;font-family:Barlow Condensed,sans-serif;font-size:14px;font-weight:900;padding:3px 10px;border-radius:4px;letter-spacing:0.08em;flex-shrink:0}
.name{font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;color:#000;letter-spacing:0.04em}
.title{font-family:Barlow Condensed,sans-serif;font-size:13px;color:rgba(0,0,0,0.6);letter-spacing:0.06em;font-weight:700}
.ticker{flex:1;overflow:hidden;position:relative;height:40px;display:flex;align-items:center}
.tick-inner{white-space:nowrap;font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#000;animation:scroll 20s linear infinite}
@keyframes scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
</style></head><body>
<div class="bar">
  <div class="live">● LIVE</div>
  <div><div class="name">SeeWhy LIVE</div><div class="title">BROADCAST STUDIO</div></div>
  <div class="ticker"><div class="tick-inner">✦ Watch Party · 20-Person Panel · Multi-Platform Streaming · Real-Time Collaboration ✦ Watch Party · 20-Person Panel ✦</div></div>
</div>
</body></html>`,
  },
  {
    id: 'evmux-demo',
    label: '⚡ Evmux Demo',
    desc: 'Official evmux animated web source demo',
    url: 'https://publicfiles.evmux.com/static/websources/websource-demo.v7.html',
  },
];

function SourcePresetButton({ src, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px', borderRadius: 9, textAlign: 'left', cursor: 'pointer', width: '100%',
        background: active ? `${GOLD}18` : 'rgba(255,255,255,0.04)',
        border: active ? `1px solid ${GOLD}60` : '1px solid rgba(255,255,255,0.1)',
        color: active ? GOLD : 'rgba(255,255,255,0.75)',
        fontFamily: 'Barlow Condensed, sans-serif',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800 }}>{src.label}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{src.desc}</div>
    </button>
  );
}

export default function EvmuxWebSource({ isActive, onClose }) {
  const [isMuted, setIsMuted] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [customUrl, setCustomUrl]   = useState('');
  const [activeSource, setActiveSource] = useState(BUILTIN_SOURCES[0]);
  const iframeRef = useRef(null);

  // Build the iframe src or srcdoc
  function getIframeProps() {
    if (activeSource?.url) return { src: activeSource.url };
    if (activeSource?.html) return { srcDoc: activeSource.html };
    if (customUrl) return { src: customUrl };
    return { src: BUILTIN_SOURCES[2].url }; // fallback to evmux demo
  }

  function selectBuiltin(src) {
    setActiveSource(src);
    setCustomUrl('');
    setShowPicker(false);
  }

  function applyCustomUrl() {
    if (!customUrl.trim()) return;
    setActiveSource(null);
    setShowPicker(false);
  }

  if (!isActive) return null;

  const iframeProps = getIframeProps();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'absolute', inset: 0, zIndex: 40, borderRadius: 12, overflow: 'hidden', background: '#000' }}
      >
        {/* Web source iframe */}
        <iframe
          ref={iframeRef}
          {...iframeProps}
          key={iframeProps.src || iframeProps.srcDoc}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay"
          title="Web Source"
        />

        {/* Top-right controls */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 50 }}>
          {/* Source switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPicker(v => !v)}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: `1px solid ${GOLD}40`, color: GOLD, cursor: 'pointer' }}
              title="Change web source"
            >
              <Globe size={14} />
            </button>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  style={{ position: 'absolute', top: 38, right: 0, width: 240, background: '#0d0618', border: `1px solid ${GOLD}30`, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100 }}
                  onClick={e => e.stopPropagation()}
                >
                  <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', margin: 0 }}>BUILT-IN PRESETS</p>
                  {BUILTIN_SOURCES.map(src => (
                    <SourcePresetButton
                      key={src.id}
                      src={src}
                      active={activeSource?.id === src.id}
                      onClick={() => selectBuiltin(src)}
                    />
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', marginBottom: 6 }}>CUSTOM URL</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyCustomUrl()}
                        placeholder="https://…"
                        style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#fff', fontSize: 11, padding: '6px 10px', fontFamily: 'Barlow Condensed, sans-serif', outline: 'none' }}
                      />
                      <button
                        onClick={applyCustomUrl}
                        style={{ padding: '6px 10px', borderRadius: 7, background: GOLD, color: '#000', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif' }}
                      >
                        Go
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(v => !v)}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            title="Close web source"
          >
            <X size={14} />
          </button>
        </div>

        {/* Source label badge */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', border: `1px solid ${GOLD}30`, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 900, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
          WEB SOURCE {activeSource ? `· ${activeSource.label}` : customUrl ? `· ${customUrl.slice(0, 30)}…` : ''}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
