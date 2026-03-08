import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Save, Download, Copy, Layers, Plus, Trash2, Eye, EyeOff, Move, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const ELEMENT_TYPES = [
  { type: 'alertbox', label: '🔔 Alert Box', defaultW: 300, defaultH: 60 },
  { type: 'viewercount', label: '👁 Viewer Count', defaultW: 120, defaultH: 50 },
  { type: 'chatoverlay', label: '💬 Chat Overlay', defaultW: 280, defaultH: 200 },
  { type: 'nowplaying', label: '🎵 Now Playing', defaultW: 240, defaultH: 50 },
  { type: 'goalbar', label: '🎯 Goal Bar', defaultW: 300, defaultH: 40 },
  { type: 'leaderboard', label: '🏆 Leaderboard', defaultW: 180, defaultH: 200 },
  { type: 'lowerthird', label: '📝 Lower Third', defaultW: 360, defaultH: 50 },
  { type: 'timer', label: '⏱ Timer', defaultW: 140, defaultH: 50 },
  { type: 'image', label: '🖼 Image/Logo', defaultW: 100, defaultH: 100 },
  { type: 'text', label: '✏️ Text Label', defaultW: 200, defaultH: 40 },
];

const PRESETS = {
  gaming: [
    { id: '1', type: 'alertbox', x: 20, y: 20, w: 300, h: 60, label: 'Alert Box', opacity: 100, animation: 'slide', visible: true },
    { id: '2', type: 'viewercount', x: 800, y: 20, w: 120, h: 50, label: 'Viewers', opacity: 100, animation: 'fade', visible: true },
    { id: '3', type: 'chatoverlay', x: 660, y: 300, w: 280, h: 200, label: 'Chat', opacity: 80, animation: 'none', visible: true },
    { id: '4', type: 'goalbar', x: 20, y: 460, w: 300, h: 40, label: 'Goal', opacity: 100, animation: 'none', visible: true },
  ],
  minimal: [
    { id: '1', type: 'lowerthird', x: 20, y: 460, w: 400, h: 50, label: 'Lower Third', opacity: 100, animation: 'slide', visible: true },
    { id: '2', type: 'viewercount', x: 800, y: 20, w: 120, h: 50, label: 'Viewers', opacity: 90, animation: 'fade', visible: true },
  ],
  talkshow: [
    { id: '1', type: 'lowerthird', x: 20, y: 460, w: 500, h: 60, label: 'Host Name', opacity: 100, animation: 'slide', visible: true },
    { id: '2', type: 'chatoverlay', x: 660, y: 50, w: 280, h: 400, label: 'Chat', opacity: 75, animation: 'none', visible: true },
    { id: '3', type: 'viewercount', x: 810, y: 470, w: 120, h: 40, label: 'Viewers', opacity: 90, animation: 'fade', visible: true },
  ],
};

const ANIMATIONS = ['none', 'fade', 'slide', 'bounce', 'pulse'];

function ElementRenderer({ el, selected, onSelect }) {
  const bgMap = {
    alertbox: 'bg-yellow-500/20 border-yellow-500/50', viewercount: 'bg-[#00d4ff]/20 border-[#00d4ff]/50',
    chatoverlay: 'bg-white/5 border-white/20', nowplaying: 'bg-purple-500/20 border-purple-500/50',
    goalbar: 'bg-green-500/20 border-green-500/50', leaderboard: 'bg-[#d4af37]/20 border-[#d4af37]/50',
    lowerthird: 'bg-[#800020]/30 border-[#800020]/60', timer: 'bg-[#00d4ff]/10 border-[#00d4ff]/30',
    image: 'bg-white/5 border-white/20', text: 'bg-white/3 border-white/10',
  };
  return (
    <div
      className={`absolute cursor-move border rounded overflow-hidden flex items-center justify-center ${bgMap[el.type] || 'bg-white/10 border-white/20'} ${selected ? 'ring-2 ring-[#d4af37]' : ''}`}
      style={{ left: el.x, top: el.y, width: el.w, height: el.h, opacity: el.opacity / 100, display: el.visible ? 'flex' : 'none' }}
      onClick={e => { e.stopPropagation(); onSelect(el.id); }}
    >
      <span className="text-[10px] text-white/70 font-semibold px-2 text-center truncate">{el.label || el.type}</span>
    </div>
  );
}

export default function OverlayEditor() {
  const qc = useQueryClient();
  const canvasRef = useRef(null);
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const [elements, setElements] = useState(PRESETS.gaming);
  const [selectedId, setSelectedId] = useState(null);
  const [layoutName, setLayoutName] = useState('My Overlay');
  const [dragging, setDragging] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  const { data: savedLayouts = [] } = useQuery({
    queryKey: ['overlay-layouts', user?.id],
    queryFn: () => base44.entities.OverlayLayout.filter({ creator_id: user?.id }),
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.OverlayLayout.create(data),
    onSuccess: () => { qc.invalidateQueries(['overlay-layouts']); toast.success('Layout saved!'); },
  });

  const selectedEl = elements.find(e => e.id === selectedId);

  const addElement = (type) => {
    const def = ELEMENT_TYPES.find(e => e.type === type);
    setElements(prev => [...prev, {
      id: Date.now().toString(), type,
      x: 100, y: 100, w: def?.defaultW || 200, h: def?.defaultH || 50,
      label: def?.label || type, opacity: 100, animation: 'none', visible: true,
    }]);
  };

  const updateSelected = (key, value) => {
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, [key]: value } : e));
  };

  const deleteSelected = () => {
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const handleMouseDown = useCallback((e, id) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const el = elements.find(el => el.id === id);
    if (!rect || !el) return;
    const startX = e.clientX - (rect.left + el.x);
    const startY = e.clientY - (rect.top + el.y);

    const onMove = (mv) => {
      const nx = Math.max(0, mv.clientX - rect.left - startX);
      const ny = Math.max(0, mv.clientY - rect.top - startY);
      setElements(prev => prev.map(el => el.id === id ? { ...el, x: nx, y: ny } : el));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [elements]);

  const copyOBSUrl = () => {
    const url = `${window.location.origin}/overlay-source?layout=${btoa(JSON.stringify(elements))}`;
    navigator.clipboard.writeText(url);
    toast.success('OBS browser source URL copied!');
  };

  return (
    <div className="min-h-screen bg-[#0d0618] text-white flex flex-col">
      {/* Toolbar */}
      <div className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-[rgba(212,175,55,0.15)] bg-[rgba(13,6,24,0.95)]">
        <Layers className="w-4 h-4 text-[#d4af37]" />
        <Input value={layoutName} onChange={e => setLayoutName(e.target.value)}
          className="h-7 w-40 bg-white/5 border-white/20 text-white text-xs" />
        <div className="flex-1" />
        <div className="relative">
          <Button size="sm" variant="ghost" onClick={() => setShowPresets(!showPresets)}
            className="text-white/60 text-xs gap-1 h-7">
            Presets <ChevronDown className="w-3 h-3" />
          </Button>
          <AnimatePresence>
            {showPresets && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-8 right-0 bg-[#0d0618] border border-[#d4af37]/20 rounded-xl shadow-2xl z-20 overflow-hidden w-40"
              >
                {Object.keys(PRESETS).map(p => (
                  <button key={p} onClick={() => { setElements(PRESETS[p]); setShowPresets(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 capitalize">
                    {p === 'talkshow' ? 'Talk Show' : p}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button size="sm" variant="ghost" onClick={copyOBSUrl} className="text-xs gap-1 h-7 text-[#00d4ff]">
          <Copy className="w-3 h-3" /> OBS URL
        </Button>
        <Button size="sm" onClick={() => saveMutation.mutate({ creator_id: user?.id, name: layoutName, elements })}
          className="bg-[#d4af37] text-black font-bold h-7 text-xs gap-1 hover:bg-[#f5e6a3]">
          <Save className="w-3 h-3" /> Save
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Elements panel */}
        <div className="w-48 shrink-0 border-r border-white/5 bg-[rgba(13,6,24,0.7)] overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] text-white/30 uppercase mb-2">Elements</p>
            <div className="space-y-1">
              {ELEMENT_TYPES.map(et => (
                <button key={et.type} onClick={() => addElement(et.type)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white flex items-center gap-2 transition-all">
                  <Plus className="w-3 h-3 shrink-0" />
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layers list */}
          <div className="p-3 border-t border-white/5">
            <p className="text-[10px] text-white/30 uppercase mb-2">Layers ({elements.length})</p>
            <div className="space-y-1">
              {[...elements].reverse().map(el => (
                <div key={el.id} onClick={() => setSelectedId(el.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all ${selectedId === el.id ? 'bg-[#d4af37]/15 text-white' : 'text-white/50 hover:bg-white/5'}`}>
                  <span className="truncate flex-1">{el.label}</span>
                  <button onClick={e => { e.stopPropagation(); updateSelected('visible', !el.visible); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100">
                    {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-40" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex items-center justify-center bg-[#050208] overflow-hidden p-4">
          <div
            ref={canvasRef}
            className="relative bg-gradient-to-br from-[#1a0a30] to-[#0d0618] rounded-lg overflow-hidden select-none"
            style={{ width: 960, height: 540, maxWidth: '100%', aspectRatio: '16/9', border: '1px solid rgba(212,175,55,0.15)' }}
            onClick={() => setSelectedId(null)}
          >
            {/* 16:9 guide */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
            </div>

            {elements.map(el => (
              <div key={el.id} onMouseDown={e => { setSelectedId(el.id); handleMouseDown(e, el.id); }}>
                <ElementRenderer el={el} selected={selectedId === el.id} onSelect={setSelectedId} />
              </div>
            ))}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/20 text-sm">Add elements from the left panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-56 shrink-0 border-l border-white/5 bg-[rgba(13,6,24,0.7)] overflow-y-auto">
          <div className="p-3 space-y-4">
            <p className="text-[10px] text-white/30 uppercase">Properties</p>

            {selectedEl ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40">Label</label>
                  <Input value={selectedEl.label || ''} onChange={e => updateSelected('label', e.target.value)}
                    className="h-7 text-xs bg-white/5 border-white/20 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[['x', 'X'], ['y', 'Y'], ['w', 'W'], ['h', 'H']].map(([k, l]) => (
                    <div key={k} className="space-y-0.5">
                      <label className="text-[10px] text-white/30">{l}</label>
                      <Input type="number" value={selectedEl[k] || 0} onChange={e => updateSelected(k, Number(e.target.value))}
                        className="h-6 text-[10px] bg-white/5 border-white/20 text-white p-1" />
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-white/40">Opacity</label>
                    <span className="text-[10px] text-[#d4af37]">{selectedEl.opacity}%</span>
                  </div>
                  <Slider value={[selectedEl.opacity || 100]} onValueChange={([v]) => updateSelected('opacity', v)}
                    min={0} max={100}
                    className="[&_[role=slider]]:bg-[#d4af37] [&_[role=slider]]:border-[#d4af37]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40">Animation</label>
                  <select value={selectedEl.animation || 'none'} onChange={e => updateSelected('animation', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none capitalize">
                    {ANIMATIONS.map(a => <option key={a} value={a} className="bg-[#0d0618] capitalize">{a}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">Visible</span>
                  <button onClick={() => updateSelected('visible', !selectedEl.visible)}
                    className={`text-xs px-2 py-1 rounded border transition-all ${selectedEl.visible ? 'border-green-600/40 text-green-400 bg-green-900/20' : 'border-white/10 text-white/30'}`}>
                    {selectedEl.visible ? 'Shown' : 'Hidden'}
                  </button>
                </div>
                <button onClick={deleteSelected} className="w-full py-1.5 rounded-lg border border-red-700/40 text-red-400 text-xs hover:bg-red-900/20 flex items-center justify-center gap-1.5">
                  <Trash2 className="w-3 h-3" /> Remove Element
                </button>
              </>
            ) : (
              <p className="text-[10px] text-white/20 text-center py-4">Click an element to edit</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}