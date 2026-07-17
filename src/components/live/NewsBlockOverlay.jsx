import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, Plus, X, Eye, EyeOff, ChevronDown, ChevronUp, Rss } from 'lucide-react';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const LAYER_STYLES = [
  { id: 'breaking',  label: 'Breaking News',  hint: 'Red badge + gold text bar' },
  { id: 'nametag',   label: 'Name Tag',        hint: 'Identity box (Name | Title)' },
  { id: 'ticker',    label: 'Scroll Ticker',   hint: 'Continuous bottom scroll' },
  { id: 'wave',      label: 'Wave Title',      hint: 'Evmux-style wave reveal' },
  { id: 'subtitle',  label: 'Subtitle',        hint: 'Centered caption bar' },
];

const PRESETS = [
  { label: 'Breaking Live',    style: 'breaking', text: '🔴 LIVE NOW — SeeWhyLIVE Broadcasting',                     color: '#d4af37' },
  { label: 'Guest Intro',      style: 'nametag',  text: 'Guest Name | Creator & Influencer',                         color: '#d4af37' },
  { label: 'News Ticker',      style: 'ticker',   text: '📢 Follow for more content • Join the community • Like & Share • Subscribe for exclusives', color: '#d4af37' },
  { label: 'Show Title',       style: 'wave',     text: 'SeeWhy LIVE',                                               color: '#068deb' },
  { label: 'Q&A Session',      style: 'subtitle', text: 'Drop your questions in the chat 👇',                        color: '#d4af37' },
];

let _layerId = 0;
const nextId = () => `layer_${++_layerId}_${Date.now()}`;

// ── Overlay renderers ────────────────────────────────────────────────────────

function BreakingNewsBanner({ text, color }) {
  return (
    <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, display: 'flex', alignItems: 'stretch' }}>
      <div style={{
        background: '#C0392B', color: '#fff', ...T,
        fontSize: 12, fontWeight: 900, padding: '6px 14px', flexShrink: 0,
        letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center',
      }}>BREAKING</div>
      <div style={{ flex: 1, background: 'rgba(8,11,24,0.88)', padding: '6px 14px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <p style={{ ...T, color, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function NameTagBanner({ text, color }) {
  const [name, title] = text.split('|').map(s => s.trim());
  return (
    <div style={{
      position: 'absolute', bottom: '12%', left: 28,
      background: 'rgba(8,11,24,0.88)', border: `2px solid ${color}`,
      borderRadius: 4, padding: '8px 18px', backdropFilter: 'blur(8px)',
    }}>
      <p style={{ ...T, color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: 0.5, margin: 0 }}>{name}</p>
      {title && <p style={{ ...T, color, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '3px 0 0' }}>{title}</p>}
    </div>
  );
}

function ScrollTicker({ text, color }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(8,11,24,0.9)', borderTop: `2px solid ${color}`,
      height: 32, overflow: 'hidden', display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        animation: 'newsblockTicker 22s linear infinite',
        whiteSpace: 'nowrap', ...T, fontSize: 13, fontWeight: 700, color,
        paddingLeft: '100%', display: 'inline-block',
      }}>
        {text}&nbsp;&nbsp;•&nbsp;&nbsp;{text}&nbsp;&nbsp;•&nbsp;&nbsp;{text}
      </div>
      <style>{`
        @keyframes newsblockTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-66.666%); }
        }
      `}</style>
    </div>
  );
}

function WaveTitleBanner({ text, color }) {
  return (
    <div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ position: 'relative', lineHeight: 1 }}>
        {/* Outline stroke layer */}
        <span style={{
          ...T, fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900,
          letterSpacing: 5, textTransform: 'uppercase',
          color: 'transparent', WebkitTextStroke: `2px ${color}`,
          position: 'absolute', top: 0, left: 0, whiteSpace: 'nowrap',
        }}>{text}</span>
        {/* Wave fill layer — evmux-style clip-path wave animation */}
        <span style={{
          ...T, fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900,
          letterSpacing: 5, textTransform: 'uppercase',
          color, display: 'inline-block', whiteSpace: 'nowrap',
          animation: 'newsblockWave 4s ease-in-out infinite',
        }}>{text}</span>
        <style>{`
          @keyframes newsblockWave {
            0%, 100% { clip-path: polygon(0% 45%, 16% 44%, 33% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%); }
            50%       { clip-path: polygon(0% 60%, 15% 65%, 34% 66%, 51% 62%, 67% 50%, 84% 45%, 100% 46%, 100% 100%, 0% 100%); }
          }
        `}</style>
      </div>
    </div>
  );
}

function SubtitleBanner({ text, color }) {
  return (
    <div style={{
      position: 'absolute', bottom: '8%', left: '8%', right: '8%',
      background: 'rgba(0,0,0,0.72)', borderRadius: 6,
      padding: '8px 24px', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ ...T, color, fontSize: 15, fontWeight: 700, textAlign: 'center', margin: 0 }}>{text}</p>
    </div>
  );
}

// Render the correct banner type
function LayerRenderer({ layer }) {
  const props = { text: layer.text, color: layer.color };
  return (
    <AnimatePresence>
      {layer.visible && (
        <motion.div
          key={layer.id}
          initial={{ opacity: 0, y: layer.style === 'ticker' ? 32 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: layer.style === 'ticker' ? 32 : 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {layer.style === 'breaking' && <BreakingNewsBanner {...props} />}
          {layer.style === 'nametag'  && <NameTagBanner {...props} />}
          {layer.style === 'ticker'   && <ScrollTicker {...props} />}
          {layer.style === 'wave'     && <WaveTitleBanner {...props} />}
          {layer.style === 'subtitle' && <SubtitleBanner {...props} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Mini preview (scaled 16:9 box) ──────────────────────────────────────────

function MiniPreview({ layers }) {
  const visible = layers.filter(l => l.visible);
  if (!visible.length) return null;
  return (
    <div style={{
      position: 'relative', width: '100%', paddingTop: '56.25%',
      background: 'rgba(0,0,0,0.6)', borderRadius: 6, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {visible.map(l => <LayerRenderer key={l.id} layer={l} />)}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.12)', ...T, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
          VIDEO PREVIEW
        </div>
      </div>
    </div>
  );
}

// ── Layer row in control panel ───────────────────────────────────────────────

function LayerRow({ layer, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const styleDef = LAYER_STYLES.find(s => s.id === layer.style);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${layer.visible ? `${layer.color}35` : 'rgba(255,255,255,0.07)'}`, background: 'rgba(8,11,24,0.7)' }}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0 transition-colors" style={{ background: layer.visible ? layer.color : 'rgba(255,255,255,0.2)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black truncate" style={{ ...T, color: layer.visible ? '#fff' : 'rgba(255,255,255,0.35)' }}>{styleDef?.label}</p>
          <p className="text-[9px] text-white/25 truncate" style={T}>{layer.text}</p>
        </div>
        <button onClick={() => setEditing(e => !e)}
          className="w-6 h-6 flex items-center justify-center rounded transition-all"
          style={{ background: editing ? `${G}15` : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: editing ? G : 'rgba(255,255,255,0.3)' }}>
          {editing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button onClick={() => onUpdate(layer.id, { visible: !layer.visible })}
          className="w-6 h-6 flex items-center justify-center rounded transition-all"
          style={{ background: layer.visible ? `${G}15` : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {layer.visible ? <Eye className="w-3 h-3" style={{ color: G }} /> : <EyeOff className="w-3 h-3 text-white/25" />}
        </button>
        <button onClick={() => onRemove(layer.id)} className="w-6 h-6 flex items-center justify-center rounded text-white/15 hover:text-red-400 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded editor */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-2.5 pb-3 space-y-2 border-t border-white/5 pt-2">
              {/* Style selector */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>Style</p>
                <div className="grid grid-cols-3 gap-1">
                  {LAYER_STYLES.map(s => (
                    <button key={s.id} onClick={() => onUpdate(layer.id, { style: s.id })}
                      className="text-[9px] py-1 rounded font-bold truncate transition-all"
                      style={{ ...T, background: layer.style === s.id ? `${G}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${layer.style === s.id ? `${G}50` : 'rgba(255,255,255,0.07)'}`, color: layer.style === s.id ? G : 'rgba(255,255,255,0.4)' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Text input */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1 font-bold" style={T}>Text</p>
                <input
                  value={layer.text}
                  onChange={e => onUpdate(layer.id, { text: e.target.value })}
                  placeholder="Enter overlay text…"
                  className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] text-white placeholder-white/20 outline-none focus:border-[#d4af37]/40"
                />
                {layer.style === 'nametag' && (
                  <p className="text-[9px] text-white/20 mt-1">Tip: use "Name | Title" for two lines</p>
                )}
              </div>
              {/* Color */}
              <div className="flex items-center gap-2">
                <p className="text-[9px] uppercase text-white/25 font-bold" style={T}>Color</p>
                <input type="color" value={layer.color} onChange={e => onUpdate(layer.id, { color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                <span className="text-[9px] font-mono text-white/30">{layer.color}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * NewsBlockOverlay — TV-style animated lower thirds and news banners.
 *
 * Props:
 *   containerStyle {object}  — inline style applied to the absolute overlay container
 *   onLayersChange {fn}      — callback(layers) called whenever layers change
 *
 * Usage:
 *   const [overlayLayers, setOverlayLayers] = useState([]);
 *
 *   // In the video wrapper (position: relative):
 *   <NewsBlockOverlay.Overlay layers={overlayLayers} />
 *
 *   // In the sidebar:
 *   <NewsBlockOverlay onLayersChange={setOverlayLayers} />
 */
function Overlay({ layers = [] }) {
  return (
    <>
      {layers.map(l => <LayerRenderer key={l.id} layer={l} />)}
    </>
  );
}

export default function NewsBlockOverlay({ onLayersChange, collapsed: initCollapsed = false }) {
  const [collapsed, setCollapsed]   = useState(initCollapsed);
  const [layers, setLayers]         = useState([]);
  const [showPresets, setShowPresets] = useState(false);

  const update = (id, patch) => {
    setLayers(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...patch } : l);
      onLayersChange?.(next);
      return next;
    });
  };

  const remove = (id) => {
    setLayers(prev => {
      const next = prev.filter(l => l.id !== id);
      onLayersChange?.(next);
      return next;
    });
  };

  const addFromPreset = (preset) => {
    if (layers.length >= 3) return;
    const layer = { id: nextId(), style: preset.style, text: preset.text, color: preset.color, visible: true };
    setLayers(prev => {
      const next = [...prev, layer];
      onLayersChange?.(next);
      return next;
    });
    setShowPresets(false);
  };

  const addBlank = () => {
    if (layers.length >= 3) return;
    const layer = { id: nextId(), style: 'nametag', text: 'Name | Title', color: G, visible: true };
    setLayers(prev => {
      const next = [...prev, layer];
      onLayersChange?.(next);
      return next;
    });
  };

  const visibleCount = layers.filter(l => l.visible).length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.18)', backdropFilter: 'blur(12px)' }}>
      {/* Header */}
      <button onClick={() => setCollapsed(c => !c)} className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-3 h-3" style={{ color: G }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: G }}>News Block</span>
          {visibleCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ ...T, background: 'rgba(192,57,43,0.25)', color: '#C0392B' }}>
              {visibleCount} on air
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronUp className="w-3 h-3 text-white/30" />}
      </button>

      {/* Body */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3">
              {/* Mini preview */}
              {layers.length > 0 && <MiniPreview layers={layers} />}

              {/* Add buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowPresets(s => !s)}
                  disabled={layers.length >= 3}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded transition-all disabled:opacity-40"
                  style={{ background: `${G}12`, border: `1px solid ${G}30`, color: G, ...T }}
                >
                  <Rss className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase">Presets</span>
                </button>
                <button
                  onClick={addBlank}
                  disabled={layers.length >= 3}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded transition-all disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', ...T }}
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase">Blank</span>
                </button>
              </div>

              {layers.length >= 3 && (
                <p className="text-[9px] text-center text-white/25">Maximum 3 layers active</p>
              )}

              {/* Preset picker */}
              <AnimatePresence>
                {showPresets && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-1 py-1">
                      {PRESETS.map(p => (
                        <button key={p.label} onClick={() => addFromPreset(p)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:bg-white/5"
                          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-white/80" style={T}>{p.label}</p>
                            <p className="text-[9px] text-white/30 truncate">{LAYER_STYLES.find(s => s.id === p.style)?.hint}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Layer list */}
              {layers.length > 0 ? (
                <div className="space-y-1.5">
                  {layers.map(l => (
                    <LayerRow key={l.id} layer={l} onUpdate={update} onRemove={remove} />
                  ))}
                </div>
              ) : !showPresets ? (
                <div className="py-4 text-center">
                  <AlignLeft className="w-6 h-6 mx-auto mb-1.5" style={{ color: 'rgba(212,175,55,0.2)' }} />
                  <p className="text-[10px] text-white/20" style={T}>No overlays active</p>
                  <p className="text-[9px] text-white/12">Add a preset or blank layer above</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Attach Overlay as a static property so callers can do <NewsBlockOverlay.Overlay />
NewsBlockOverlay.Overlay = Overlay;
