import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Monitor, Save, Copy, Eye, EyeOff, Plus, X, Settings, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const OB = '#0D0D0D';
const OB2 = '#1A1A1A';
const OB3 = '#2A1F1F';
const CREAM = '#F5E6D3';

const ELEMENT_TYPES = [
  { id: 'stream_info',    label: 'Stream Info',     icon: '📡', desc: 'Title + viewer count' },
  { id: 'goal_bar',       label: 'Goal Bar',         icon: '🎯', desc: 'Streamer goal progress' },
  { id: 'recent_events',  label: 'Recent Events',    icon: '🔔', desc: 'Tips / subs / gift feed' },
  { id: 'chat_overlay',   label: 'Chat Overlay',     icon: '💬', desc: 'Scrolling chat messages' },
  { id: 'branding',       label: 'Branding',         icon: '🏷️', desc: 'Logo + watermark' },
  { id: 'alert_box',      label: 'Alert Box',        icon: '⚡', desc: 'Sub / tip alerts' },
];

const PRESETS = {
  Gaming:     [{ type: 'stream_info', x: 2, y: 2, w: 30, h: 10 }, { type: 'chat_overlay', x: 78, y: 10, w: 20, h: 75 }, { type: 'alert_box', x: 35, y: 2, w: 30, h: 12 }],
  Podcast:    [{ type: 'branding', x: 2, y: 2, w: 20, h: 8 }, { type: 'stream_info', x: 25, y: 2, w: 40, h: 8 }, { type: 'recent_events', x: 2, y: 80, w: 96, h: 18 }],
  'Talk Show':  [{ type: 'branding', x: 40, y: 88, w: 20, h: 10 }, { type: 'goal_bar', x: 2, y: 88, w: 35, h: 10 }, { type: 'chat_overlay', x: 75, y: 5, w: 23, h: 80 }],
  Tournament: [{ type: 'stream_info', x: 35, y: 2, w: 30, h: 8 }, { type: 'goal_bar', x: 2, y: 88, w: 96, h: 10 }, { type: 'alert_box', x: 2, y: 2, w: 30, h: 12 }, { type: 'recent_events', x: 2, y: 15, w: 20, h: 60 }],
};

const DEFAULT_CONFIGS = {
  stream_info:   { font: 'Barlow Condensed', text_color: G, bg_opacity: 0.8, show_viewers: true, show_title: true },
  goal_bar:      { goal_id: '', fill_color: B, label: 'Goal Progress', height: 40 },
  recent_events: { max_items: 5, show_tips: true, show_subs: true, show_gifts: true, font_size: 14 },
  chat_overlay:  { max_messages: 8, font_size: 13, show_badges: true, bg_opacity: 0.7 },
  branding:      { logo_url: '', text: 'SeeWhy LIVE', font: 'Orbitron', color: G },
  alert_box:     { trigger_type: 'tip', animation: 'slide', sound: 'cash_register' },
};

function ElementRect({ element, selected, onClick }) {
  const etype = ELEMENT_TYPES.find(e => e.id === element.type);
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${element.x}%`, top: `${element.y}%`,
        width: `${element.w}%`, height: `${element.h}%`,
        border: selected ? `2px solid ${G}` : `1px dashed ${G}50`,
        background: selected ? `${G}10` : 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: selected ? `0 0 12px ${G}30` : undefined,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}>
      <div className="flex flex-col items-center gap-0.5 pointer-events-none">
        <span style={{ fontSize: Math.min(element.w * 0.3, element.h * 0.5) + 'px', lineHeight: 1 }}>{etype?.icon}</span>
        <span style={{ fontSize: '7px', color: selected ? G : 'rgba(212,175,55,0.5)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {etype?.label}
        </span>
      </div>
    </motion.div>
  );
}

function ConfigPanel({ element, goals, onUpdate, onRemove }) {
  if (!element) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <p className="text-[10px] text-center" style={{ color: 'rgba(245,230,211,0.2)', fontFamily: 'IBM Plex Mono, monospace' }}>
        Click an element on the canvas to configure it
      </p>
    </div>
  );

  const cfg = element.config || {};
  const set = (key, val) => onUpdate({ ...element, config: { ...cfg, [key]: val } });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: G, fontFamily: 'IBM Plex Mono, monospace' }}>
          {ELEMENT_TYPES.find(e => e.id === element.type)?.label}
        </span>
        <button onClick={onRemove} className="text-[8px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)' }}>Remove</button>
      </div>

      {element.type === 'stream_info' && (
        <>
          <Field label="Text Color" value={cfg.text_color || G} onChange={v => set('text_color', v)} type="color" />
          <Field label="BG Opacity" value={cfg.bg_opacity || 0.8} onChange={v => set('bg_opacity', parseFloat(v))} type="range" min="0" max="1" step="0.1" />
          <Toggle label="Show Title" value={cfg.show_title !== false} onChange={v => set('show_title', v)} />
          <Toggle label="Show Viewers" value={cfg.show_viewers !== false} onChange={v => set('show_viewers', v)} />
        </>
      )}
      {element.type === 'goal_bar' && (
        <>
          <div>
            <label className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Linked Goal</label>
            <select value={cfg.goal_id || ''} onChange={e => set('goal_id', e.target.value)}
              className="mt-0.5 w-full h-7 px-2 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM }}>
              <option value="">Select goal…</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <Field label="Fill Color" value={cfg.fill_color || B} onChange={v => set('fill_color', v)} type="color" />
          <Field label="Label" value={cfg.label || ''} onChange={v => set('label', v)} />
        </>
      )}
      {element.type === 'recent_events' && (
        <>
          <Field label="Max Items" value={cfg.max_items || 5} onChange={v => set('max_items', parseInt(v))} type="number" />
          <Field label="Font Size" value={cfg.font_size || 14} onChange={v => set('font_size', parseInt(v))} type="number" />
          <Toggle label="Show Tips" value={cfg.show_tips !== false} onChange={v => set('show_tips', v)} />
          <Toggle label="Show Subs" value={cfg.show_subs !== false} onChange={v => set('show_subs', v)} />
          <Toggle label="Show Gifts" value={cfg.show_gifts !== false} onChange={v => set('show_gifts', v)} />
        </>
      )}
      {element.type === 'chat_overlay' && (
        <>
          <Field label="Max Messages" value={cfg.max_messages || 8} onChange={v => set('max_messages', parseInt(v))} type="number" />
          <Field label="Font Size" value={cfg.font_size || 13} onChange={v => set('font_size', parseInt(v))} type="number" />
          <Field label="BG Opacity" value={cfg.bg_opacity || 0.7} onChange={v => set('bg_opacity', parseFloat(v))} type="range" min="0" max="1" step="0.1" />
          <Toggle label="Show Badges" value={cfg.show_badges !== false} onChange={v => set('show_badges', v)} />
        </>
      )}
      {element.type === 'branding' && (
        <>
          <Field label="Logo URL" value={cfg.logo_url || ''} onChange={v => set('logo_url', v)} />
          <Field label="Text" value={cfg.text || ''} onChange={v => set('text', v)} />
          <Field label="Color" value={cfg.color || G} onChange={v => set('color', v)} type="color" />
        </>
      )}
      {element.type === 'alert_box' && (
        <>
          <div>
            <label className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Trigger</label>
            <select value={cfg.trigger_type || 'tip'} onChange={e => set('trigger_type', e.target.value)}
              className="mt-0.5 w-full h-7 px-2 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM }}>
              {['tip','subscription','gift','first_donation'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Animation</label>
            <select value={cfg.animation || 'slide'} onChange={e => set('animation', e.target.value)}
              className="mt-0.5 w-full h-7 px-2 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM }}>
              {['slide','bounce','fade','zoom'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </>
      )}

      {/* Position controls */}
      <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[8px] uppercase tracking-wide mb-2" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Position & Size (%)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[['x','X'],['y','Y'],['w','W'],['h','H']].map(([k,l]) => (
            <div key={k}>
              <label className="text-[7px]" style={{ color: 'rgba(245,230,211,0.3)' }}>{l}</label>
              <input type="number" value={element[k]} min="0" max="100"
                onChange={e => onUpdate({ ...element, [k]: parseFloat(e.target.value) || 0 })}
                className="w-full h-6 px-1 rounded text-[9px] mt-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: CREAM, outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} {...rest}
        className="mt-0.5 w-full h-7 px-2 rounded text-[9px]"
        style={{ background: type === 'color' ? 'transparent' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM, outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }} />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px]" style={{ color: CREAM }}>{label}</span>
      <button onClick={() => onChange(!value)}
        className="w-8 h-4 rounded-full relative"
        style={{ background: value ? G : 'rgba(255,255,255,0.1)' }}>
        <motion.div animate={{ x: value ? 16 : 2 }} className="absolute top-0.5 w-3 h-3 rounded-full"
          style={{ background: value ? OB : 'rgba(255,255,255,0.4)' }} />
      </button>
    </div>
  );
}

export default function OverlayBuilderPage() {
  const params = new URLSearchParams(window.location.search);
  const [elements, setElements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [layoutName, setLayoutName] = useState('My Overlay');
  const [activeLayoutId, setActiveLayoutId] = useState(null);
  const [showObsUrl, setShowObsUrl] = useState(false);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: layouts = [] } = useQuery({
    queryKey: ['overlay-layouts', user?.id],
    queryFn: () => base44.entities.OverlayLayout.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });
  const { data: goals = [] } = useQuery({
    queryKey: ['overlay-goals', user?.id],
    queryFn: () => base44.entities.StreamerGoal.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });

  const activeLayout = layouts.find(l => l.is_active);

  const saveLayout = useMutation({
    mutationFn: async () => {
      const data = { creator_id: user.id, name: layoutName, elements, is_active: false };
      if (activeLayoutId) return base44.entities.OverlayLayout.update(activeLayoutId, data);
      return base44.entities.OverlayLayout.create(data);
    },
    onSuccess: (layout) => {
      qc.invalidateQueries(['overlay-layouts', user?.id]);
      if (layout?.id && !activeLayoutId) setActiveLayoutId(layout.id);
      toast.success('Layout saved!');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (layoutId) => {
      await Promise.all(layouts.map(l => base44.entities.OverlayLayout.update(l.id, { is_active: l.id === layoutId })));
    },
    onSuccess: () => { qc.invalidateQueries(['overlay-layouts', user?.id]); toast.success('Active overlay updated!'); },
  });

  const addElement = (type) => {
    const newEl = { id: Date.now().toString(), type, x: 10, y: 10, w: 25, h: 20, config: { ...DEFAULT_CONFIGS[type] } };
    setElements(els => [...els, newEl]);
    setSelected(newEl.id);
  };

  const updateElement = (updated) => {
    setElements(els => els.map(e => e.id === updated.id ? updated : e));
  };

  const removeElement = (id) => {
    setElements(els => els.filter(e => e.id !== id));
    setSelected(null);
  };

  const applyPreset = (presetName) => {
    const preset = PRESETS[presetName] || [];
    setElements(preset.map((el, i) => ({ id: `preset-${i}`, ...el, config: { ...DEFAULT_CONFIGS[el.type] } })));
    setSelected(null);
  };

  const loadLayout = (layout) => {
    setElements(layout.elements || []);
    setLayoutName(layout.name);
    setActiveLayoutId(layout.id);
  };

  const selectedEl = elements.find(e => e.id === selected);
  const obsUrl = `https://seewhylive.online/overlay/live?creator_id=${user?.id || 'X'}&layout_id=${activeLayoutId || 'Y'}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: OB }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: OB2, borderBottom: `1px solid ${G}18` }}>
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4" style={{ color: G }} />
          <span className="font-black uppercase text-sm" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Overlay Builder</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Preset selector */}
          <select onChange={e => { if (e.target.value) applyPreset(e.target.value); e.target.value = ''; }}
            className="h-7 px-2 rounded text-[9px]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM }}>
            <option value="">Presets…</option>
            {Object.keys(PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {/* Load layout */}
          {layouts.length > 0 && (
            <select onChange={e => { const l = layouts.find(x => x.id === e.target.value); if (l) loadLayout(l); e.target.value = ''; }}
              className="h-7 px-2 rounded text-[9px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM }}>
              <option value="">Load layout…</option>
              {layouts.map(l => <option key={l.id} value={l.id}>{l.name}{l.is_active ? ' ✓' : ''}</option>)}
            </select>
          )}
          <button onClick={() => saveLayout.mutate()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[9px]"
            style={{ background: B, color: G, border: `1px solid ${G}40`, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Element palette */}
        <div className="w-44 shrink-0 overflow-y-auto p-2 space-y-1.5"
          style={{ background: OB2, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[7px] uppercase tracking-widest px-2 pt-1 font-bold" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Elements</p>
          {ELEMENT_TYPES.map(et => (
            <button key={et.id} onClick={() => addElement(et.id)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-base">{et.icon}</span>
              <div>
                <p className="text-[9px] font-bold" style={{ color: CREAM, fontFamily: 'Barlow Condensed, sans-serif' }}>{et.label}</p>
                <p className="text-[7px]" style={{ color: 'rgba(245,230,211,0.3)' }}>{et.desc}</p>
              </div>
            </button>
          ))}

          <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[7px] uppercase tracking-widest px-2 font-bold mb-1.5" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Active Overlay</p>
            {activeLayoutId && (
              <button onClick={() => toggleActive.mutate(activeLayoutId)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase"
                style={{ background: `${G}12`, color: G, border: `1px solid ${G}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                <ToggleRight className="w-3.5 h-3.5" /> Set Active
              </button>
            )}
            <button onClick={() => setShowObsUrl(s => !s)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase mt-1"
              style={{ background: 'rgba(0,245,255,0.08)', color: '#00F5FF', border: '1px solid rgba(0,245,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              <Copy className="w-3 h-3" /> OBS URL
            </button>
            {showObsUrl && (
              <div className="mt-1 p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[7px] break-all" style={{ color: 'rgba(245,230,211,0.5)', fontFamily: 'IBM Plex Mono, monospace' }}>{obsUrl}</p>
                <button onClick={() => { navigator.clipboard.writeText(obsUrl); toast.success('Copied!'); }}
                  className="text-[7px] mt-1" style={{ color: G }}>Copy</button>
              </div>
            )}
          </div>

          {/* Layout name */}
          <div className="pt-1">
            <label className="text-[7px] uppercase px-2" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>Layout Name</label>
            <input value={layoutName} onChange={e => setLayoutName(e.target.value)}
              className="mt-0.5 w-full h-7 px-2 rounded text-[9px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: CREAM, outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }} />
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden" style={{ background: OB }}>
          <div className="relative w-full" style={{ maxWidth: '720px', aspectRatio: '16/9', background: '#0a0a0a', border: `1px solid ${G}25`, borderRadius: 8, overflow: 'hidden' }}
            onClick={() => setSelected(null)}>
            {/* Canvas grid */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)',
              backgroundSize: '10% 10%',
            }} />
            <div className="absolute top-2 left-2 text-[8px]" style={{ color: 'rgba(212,175,55,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>1920×1080</div>

            {elements.map(el => (
              <ElementRect key={el.id} element={el} selected={selected === el.id}
                onClick={e => { e.stopPropagation(); setSelected(el.id); }} />
            ))}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[11px] text-center" style={{ color: 'rgba(245,230,211,0.15)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Add elements from the palette<br />or choose a preset
                </p>
              </div>
            )}
          </div>
          <p className="mt-2 text-[8px]" style={{ color: 'rgba(245,230,211,0.2)', fontFamily: 'IBM Plex Mono, monospace' }}>
            Click elements to configure · Use X/Y/W/H to position precisely
          </p>
        </div>

        {/* Right: Config panel */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden"
          style={{ background: OB2, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-[8px] uppercase tracking-widest font-bold" style={{ color: 'rgba(245,230,211,0.3)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {selectedEl ? 'Configure' : 'Properties'}
            </span>
          </div>
          <ConfigPanel
            element={selectedEl}
            goals={goals}
            onUpdate={updateElement}
            onRemove={() => selectedEl && removeElement(selectedEl.id)}
          />
        </div>
      </div>
    </div>
  );
}