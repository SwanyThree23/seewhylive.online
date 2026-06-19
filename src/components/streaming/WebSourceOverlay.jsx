import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, X, Volume2, VolumeX, Maximize2, Minimize2, Globe, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const MIN_W = 240;
const MIN_H = 135;

function DraggableOverlay({ source, onRemove, onUpdate, containerRef }) {
  const [pos, setPos] = useState(source.pos || { x: 40, y: 40 });
  const [size, setSize] = useState(source.size || { w: 360, h: 200 });
  const [muted, setMuted] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [key, setKey] = useState(0); // force iframe reload
  const dragging = useRef(false);
  const resizing = useRef(false);
  const startRef = useRef({});

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    startRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const onMove = (mv) => {
      if (!dragging.current) return;
      const dx = mv.clientX - startRef.current.mx;
      const dy = mv.clientY - startRef.current.my;
      setPos({ x: startRef.current.px + dx, y: startRef.current.py + dy });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]);

  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startRef.current = { mx: e.clientX, my: e.clientY, sw: size.w, sh: size.h };
    const onMove = (mv) => {
      if (!resizing.current) return;
      const dw = mv.clientX - startRef.current.mx;
      const dh = mv.clientY - startRef.current.my;
      setSize({ w: Math.max(MIN_W, startRef.current.sw + dw), h: Math.max(MIN_H, startRef.current.sh + dh) });
    };
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: minimized ? 200 : size.w,
        height: minimized ? 32 : size.h,
        zIndex: 300,
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${G}40`,
        boxShadow: `0 0 20px rgba(0,0,0,0.6), 0 0 0 1px ${G}20`,
        background: '#000',
        userSelect: 'none',
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={onDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          background: 'rgba(8,11,24,0.95)',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.08)',
          cursor: 'grab',
          height: 32,
          flexShrink: 0,
        }}
      >
        <GripVertical style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: source.active ? '#C0392B' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
        <p style={{ flex: 1, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {source.name}
        </p>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => setKey(k => k + 1)}
            style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <RefreshCw style={{ width: 10, height: 10 }} />
          </button>
          <button onClick={() => setMuted(m => !m)}
            style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted ? '#C0392B' : '#6DBF7E' }}>
            {muted ? <VolumeX style={{ width: 10, height: 10 }} /> : <Volume2 style={{ width: 10, height: 10 }} />}
          </button>
          <button onClick={() => setMinimized(m => !m)}
            style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
            {minimized ? <Maximize2 style={{ width: 10, height: 10 }} /> : <Minimize2 style={{ width: 10, height: 10 }} />}
          </button>
          <button onClick={() => onRemove(source.id)}
            style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(192,57,43,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B' }}>
            <X style={{ width: 10, height: 10 }} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div style={{ position: 'relative', width: '100%', height: size.h - 32 }}>
          <iframe
            key={key}
            src={source.url}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allow="autoplay; camera; microphone"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={source.name}
          />
          {/* Resize handle */}
          <div
            onMouseDown={onResizeStart}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 16, height: 16,
              cursor: 'se-resize',
              background: 'linear-gradient(135deg, transparent 50%, rgba(212,175,55,0.3) 50%)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function WebSourceOverlay({ isStreamActive = false }) {
  const [sources, setSources] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const containerRef = useRef(null);

  const QUICK_SOURCES = [
    { name: 'Lower Thirds Demo', url: 'https://publicfiles.evmux.com/static/websources/websource-demo.v7.html' },
  ];

  const addSource = () => {
    const url = newUrl.trim();
    const name = newName.trim() || 'Web Source';
    if (!url) { toast.error('Enter a URL'); return; }
    if (!url.startsWith('http')) { toast.error('URL must start with http:// or https://'); return; }
    setSources(prev => [...prev, {
      id: `wso_${Date.now()}`,
      name,
      url,
      active: true,
      pos: { x: 60 + prev.length * 20, y: 80 + prev.length * 20 },
      size: { w: 400, h: 225 },
    }]);
    setNewName('');
    setNewUrl('');
    setShowAdd(false);
    toast.success(`${name} added to stream`);
  };

  const removeSource = useCallback((id) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const activeSources = sources.filter(s => s.active);

  return (
    <>
      {/* Floating overlays rendered to document body via portal-style absolute positioning */}
      <AnimatePresence>
        {activeSources.map(source => (
          <DraggableOverlay
            key={source.id}
            source={source}
            onRemove={removeSource}
            onUpdate={(id, upd) => setSources(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s))}
            containerRef={containerRef}
          />
        ))}
      </AnimatePresence>

      {/* Control panel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" style={{ color: G }} />
            <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: G }}>
              Web Overlays
            </span>
            {activeSources.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: 'rgba(192,57,43,0.25)', color: '#C0392B', ...T }}>
                {activeSources.length} live
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-1 px-2 py-1 rounded transition-all"
            style={{
              background: showAdd ? `${G}15` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showAdd ? `${G}40` : 'rgba(255,255,255,0.1)'}`,
              color: showAdd ? G : 'rgba(255,255,255,0.4)',
            }}
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase" style={T}>Add</span>
          </button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2 rounded-lg" style={{ background: `${G}06`, border: `1px solid ${G}20` }}>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Overlay name"
                  className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] text-white placeholder-white/25 outline-none focus:border-[#d4af37]/40"
                />
                <input
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSource()}
                  placeholder="https://example.com/overlay"
                  className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-white placeholder-white/25 outline-none focus:border-[#d4af37]/40"
                />
                <button
                  onClick={addSource}
                  className="w-full py-1.5 rounded text-[11px] font-black uppercase transition-all"
                  style={{ background: G, color: '#000', ...T }}
                >
                  Add Overlay
                </button>
                {/* Quick presets */}
                {QUICK_SOURCES.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase text-white/25 font-bold" style={T}>Quick Add</p>
                    {QUICK_SOURCES.map(qs => (
                      <button
                        key={qs.name}
                        onClick={() => { setNewName(qs.name); setNewUrl(qs.url); }}
                        className="w-full px-2 py-1 rounded text-[10px] text-left transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', ...T, fontWeight: 600 }}
                      >
                        {qs.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active overlays list */}
        {sources.length > 0 && (
          <div className="space-y-1.5">
            {sources.map(s => (
              <motion.div
                key={s.id}
                layout
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.active ? `${G}25` : 'rgba(255,255,255,0.06)'}` }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.active ? '#C0392B' : 'rgba(255,255,255,0.2)' }} />
                <Globe className="w-3 h-3 flex-shrink-0" style={{ color: s.active ? G : 'rgba(255,255,255,0.2)' }} />
                <p className="flex-1 text-[10px] font-bold text-white truncate">{s.name}</p>
                <button
                  onClick={() => setSources(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x))}
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-all"
                  style={{
                    background: s.active ? 'rgba(192,57,43,0.15)' : `${G}15`,
                    color: s.active ? '#C0392B' : G,
                    border: `1px solid ${s.active ? 'rgba(192,57,43,0.3)' : `${G}30`}`,
                    ...T,
                  }}
                >
                  {s.active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => removeSource(s.id)}
                  className="text-white/20 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {sources.length === 0 && !showAdd && (
          <div className="py-4 text-center">
            <Globe className="w-6 h-6 mx-auto mb-1.5" style={{ color: 'rgba(212,175,55,0.2)' }} />
            <p className="text-[11px] text-white/20" style={T}>No overlays active</p>
            <p className="text-[10px] text-white/12">Add browser sources, timers, or graphics</p>
          </div>
        )}
      </div>
    </>
  );
}
