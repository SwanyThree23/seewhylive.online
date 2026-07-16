import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Maximize2, Minimize2, Volume2, VolumeX, GripHorizontal, Globe, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const PRESETS = [
  { label: 'VDO.Ninja Guest', url: 'https://vdo.ninja/?view=', hint: 'Paste push ID after "view="' },
  { label: 'OBS VirtualCam', url: '', hint: 'Local browser source URL' },
  { label: 'Stream Overlay', url: '', hint: 'Custom overlay URL' },
];

function OverlayWindow({ source, onClose, zIndex, onFocus }) {
  const [pos, setPos] = useState({ x: source.x || 40, y: source.y || 40 });
  const [size, setSize] = useState({ w: source.w || 320, h: source.h || 200 });
  const [muted, setMuted] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    onFocus();
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };

    const onMove = (ev) => {
      if (!isDragging.current) return;
      setPos({ x: dragStart.current.ox + ev.clientX - dragStart.current.mx, y: dragStart.current.oy + ev.clientY - dragStart.current.my });
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos, onFocus]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{ position: 'absolute', left: pos.x, top: pos.y, width: size.w, zIndex, userSelect: 'none' }}
      onMouseDown={onFocus}
    >
      <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: `1px solid rgba(212,175,55,0.25)`, background: '#000' }}>
        {/* Title bar */}
        <div
          ref={dragRef}
          onMouseDown={onMouseDown}
          className="flex items-center gap-2 px-2.5 py-1.5 cursor-grab active:cursor-grabbing"
          style={{ background: 'rgba(8,11,24,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <GripHorizontal className="w-3 h-3 text-white/20 flex-shrink-0" />
          <Globe className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
          <p className="text-[10px] font-bold text-white truncate flex-1" style={T}>{source.label || 'Web Source'}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setMuted(m => !m)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
              {muted ? <VolumeX className="w-2.5 h-2.5 text-white/40" /> : <Volume2 className="w-2.5 h-2.5 text-[#6DBF7E]" />}
            </button>
            <button onClick={() => setMinimized(m => !m)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
              {minimized ? <Maximize2 className="w-2.5 h-2.5 text-white/40" /> : <Minimize2 className="w-2.5 h-2.5 text-white/40" />}
            </button>
            <button onClick={onClose} className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors">
              <X className="w-2.5 h-2.5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!minimized && (
            <motion.div initial={{ height: 0 }} animate={{ height: size.h }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
              <iframe
                src={source.url}
                allow="camera; microphone; autoplay; display-capture; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                style={{ width: '100%', height: size.h, border: 'none', display: 'block', background: '#000' }}
                title={source.label || 'web-source'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function WebSourceOverlay({ containerRef }) {
  const [sources, setSources] = useState([]);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [focusId, setFocusId] = useState(null);

  const addSource = () => {
    if (!url.trim()) { toast.error('Enter a URL'); return; }
    try { new URL(url); } catch { toast.error('Invalid URL'); return; }
    const id = Date.now().toString();
    setSources(s => [...s, { id, url: url.trim(), label: label.trim() || 'Web Source', x: 40 + s.length * 20, y: 40 + s.length * 20 }]);
    setUrl('');
    setLabel('');
    setAdding(false);
    setFocusId(id);
    toast.success('Web source added');
  };

  const removeSource = (id) => setSources(s => s.filter(src => src.id !== id));

  const getZ = (id) => id === focusId ? 100 : 50;

  return (
    <>
      {/* Floating overlay windows — render absolutely inside parent */}
      <AnimatePresence>
        {sources.map(src => (
          <OverlayWindow
            key={src.id}
            source={src}
            zIndex={getZ(src.id)}
            onClose={() => removeSource(src.id)}
            onFocus={() => setFocusId(src.id)}
          />
        ))}
      </AnimatePresence>

      {/* Control panel (non-overlay) */}
      <div className="rounded-xl border" style={{ background: 'rgba(8,11,24,0.95)', borderColor: 'rgba(212,175,55,0.15)' }}>
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: GOLD, ...T }}>Web Sources</span>
            {sources.length > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">{sources.length}</span>
            )}
          </div>
          <button
            onClick={() => setAdding(a => !a)}
            style={{ ...T, height: 24, padding: '0 8px', fontSize: 10, fontWeight: 900, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: adding ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.15)', color: adding ? 'rgba(255,255,255,0.4)' : GOLD }}
          >
            {adding ? <X className="w-3 h-3 inline" /> : <><Plus className="w-3 h-3 inline mr-1" />Add</>}
          </button>
        </div>

        <div className="p-3 space-y-2">
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="rounded-lg p-2.5 space-y-2" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSource()}
                  placeholder="https://vdo.ninja/?view=..."
                  style={{ width: '100%', padding: '7px 10px', background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', ...T }}
                />
                <input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Label (optional)"
                  style={{ width: '100%', padding: '7px 10px', background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', ...T }}
                />
                <div className="flex gap-1">
                  {PRESETS.map(p => (
                    <button key={p.label}
                      onClick={() => setUrl(p.url)}
                      style={{ ...T, height: 22, padding: '0 8px', fontSize: 9, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
                    >{p.label}</button>
                  ))}
                </div>
                <button onClick={addSource}
                  style={{ ...T, width: '100%', height: 28, fontSize: 11, fontWeight: 900, borderRadius: 8, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${GOLD}, #b8962e)`, color: '#000' }}>
                  <Link2 className="w-3 h-3 inline mr-1" />Open Web Source
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {sources.length === 0 && !adding && (
            <div className="text-center py-4">
              <Globe className="w-5 h-5 text-white/20 mx-auto mb-1" />
              <p className="text-[10px] text-white/30">No web sources open</p>
              <p className="text-[10px] text-white/20">Add VDO.Ninja links, overlays, or any web URL</p>
            </div>
          )}

          {sources.map(src => (
            <div key={src.id} className="flex items-center gap-2 p-2 rounded-lg"
              style={{ background: focusId === src.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Globe className="w-3 h-3 text-white/30 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{src.label}</p>
                <p className="text-[9px] text-white/30 truncate">{src.url}</p>
              </div>
              <button onClick={() => setFocusId(src.id)} style={{ ...T, height: 20, padding: '0 6px', fontSize: 9, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(212,175,55,0.1)', color: GOLD }}>Focus</button>
              <button onClick={() => removeSource(src.id)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/10 transition-colors flex-shrink-0">
                <X className="w-2.5 h-2.5 text-red-400/60" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
