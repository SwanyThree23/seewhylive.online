import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Plus, Trash2, Eye, EyeOff, ExternalLink, X, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const PRESETS = [
  { name: 'Countdown Timer', url: 'https://www.timeanddate.com/countdown/generic?iso=20261231T000000&p0=0&msg=New+Year&font=slab' },
  { name: 'Lower Third Graphics', url: 'https://publicfiles.evmux.com/static/websources/websource-demo.v7.html' },
  { name: 'Chat Overlay', url: '' },
  { name: 'Scoreboard', url: '' },
];

function WebSourceTile({ source, onRemove, onToggle }) {
  const [loading, setLoading] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${source.active ? `${G}40` : 'rgba(255,255,255,0.08)'}`, background: 'rgba(8,11,24,0.8)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Globe className="w-3 h-3 shrink-0" style={{ color: source.active ? G : 'rgba(255,255,255,0.3)' }} />
        <p className="flex-1 text-[11px] font-bold text-white truncate">{source.name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggle(source.id)}
            title={source.active ? 'Deactivate' : 'Activate'}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ background: source.active ? `${G}20` : 'rgba(255,255,255,0.05)' }}
          >
            {source.active
              ? <Eye className="w-3 h-3" style={{ color: G }} />
              : <EyeOff className="w-3 h-3 text-white/30" />}
          </button>
          <button
            onClick={() => onRemove(source.id)}
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <p className="px-3 pb-2 text-[10px] font-mono text-white/25 truncate">{source.url}</p>
    </motion.div>
  );
}

export default function StreamWebSourceManager({ isStreamActive = false }) {
  const [sources, setSources] = useState([]);
  const [activeSourceId, setActiveSourceId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const activeSource = sources.find(s => s.id === activeSourceId && s.active);

  const addSource = () => {
    const url = newUrl.trim();
    const name = newName.trim() || 'Web Source';
    if (!url) { toast.error('Enter a URL'); return; }
    if (!url.startsWith('http')) { toast.error('URL must start with http:// or https://'); return; }
    const id = `ws_${Date.now()}`;
    setSources(prev => [...prev, { id, name, url, active: false }]);
    setNewName('');
    setNewUrl('');
    setAdding(false);
    toast.success('Web source added');
  };

  const toggleSource = (id) => {
    setSources(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextActive = !s.active;
      if (nextActive) setActiveSourceId(id);
      else if (activeSourceId === id) setActiveSourceId(null);
      return { ...s, active: nextActive };
    }));
  };

  const removeSource = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
    if (activeSourceId === id) setActiveSourceId(null);
  };

  const applyPreset = (preset) => {
    if (!preset.url) { toast.error('Preset URL not configured'); return; }
    const id = `ws_${Date.now()}`;
    setSources(prev => [...prev, { id, name: preset.name, url: preset.url, active: false }]);
    toast.success(`${preset.name} added`);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" style={{ color: G }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ ...T, color: G }}>
            Web Sources
          </span>
          {sources.filter(s => s.active).length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: `${G}22`, color: G, ...T }}>
              {sources.filter(s => s.active).length} active
            </span>
          )}
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1 px-2 py-1 rounded transition-all"
          style={{ background: adding ? `${G}15` : 'rgba(255,255,255,0.05)', border: `1px solid ${adding ? `${G}40` : 'rgba(255,255,255,0.1)'}`, color: adding ? G : 'rgba(255,255,255,0.4)' }}
        >
          {adding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span className="text-[10px] font-bold uppercase" style={T}>{adding ? 'Cancel' : 'Add'}</span>
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(212,175,55,0.04)', border: `1px solid ${G}20` }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Source name (e.g. Scoreboard)"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder-white/30 outline-none focus:border-[#d4af37]/40"
              />
              <input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://example.com/overlay"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] font-mono text-white placeholder-white/30 outline-none focus:border-[#d4af37]/40"
              />
              <button
                onClick={addSource}
                className="w-full py-1.5 rounded text-[11px] font-black uppercase transition-all"
                style={{ background: G, color: '#000', ...T }}
              >
                Add Source
              </button>

              {/* Presets */}
              <div>
                <p className="text-[9px] uppercase text-white/25 mb-1.5" style={T}>Quick Presets</p>
                <div className="grid grid-cols-2 gap-1">
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      disabled={!p.url}
                      className="px-2 py-1 rounded text-[10px] text-left transition-all disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', ...T }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source list */}
      {sources.length > 0 ? (
        <AnimatePresence>
          <div className="space-y-1.5">
            {sources.map(s => (
              <WebSourceTile key={s.id} source={s} onRemove={removeSource} onToggle={toggleSource} />
            ))}
          </div>
        </AnimatePresence>
      ) : !adding && (
        <div className="py-4 text-center">
          <Globe className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p className="text-[11px] text-white/20" style={T}>No web sources added</p>
          <p className="text-[10px] text-white/15 mt-0.5">Add countdown timers, overlays, or scoreboards</p>
        </div>
      )}

      {/* Active source preview overlay trigger */}
      {activeSource && isStreamActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-lg overflow-hidden"
          style={{ border: `1px solid ${G}40`, aspectRatio: '16/9' }}
        >
          <iframe
            src={activeSource.url}
            className="w-full h-full border-0"
            allow="autoplay; camera; microphone"
            title={activeSource.name}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', ...T }}>
              {activeSource.name}
            </span>
            <button
              onClick={() => toggleSource(activeSource.id)}
              className="w-5 h-5 rounded flex items-center justify-center bg-black/70"
            >
              <X className="w-3 h-3 text-white/70" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
