import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Save, Trash2, Copy, Check, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const G     = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const PRESETS = [
  { name: 'Gold Empire',    colors: { primary: '#D4AF37', secondary: '#D4854A', accent: '#C9A84C', bg: '#080B18' } },
  { name: 'Dark Crimson',   colors: { primary: '#C0392B', secondary: '#D4AF37', accent: '#D4854A', bg: '#0F0808' } },
  { name: 'Arctic Blue',    colors: { primary: '#5BA4D4', secondary: '#6DBF7E', accent: '#C9A84C', bg: '#06101A' } },
  { name: 'Forest Chill',   colors: { primary: '#6DBF7E', secondary: '#C9A84C', accent: '#D4AF37', bg: '#0A1510' } },
  { name: 'Sunset Blaze',   colors: { primary: '#D4854A', secondary: '#C0392B', accent: '#D4AF37', bg: '#110A06' } },
  { name: 'Purple Haze',    colors: { primary: '#9B5DA6', secondary: '#D4AF37', accent: '#C9A84C', bg: '#0C0818' } },
  { name: 'Midnight Gold',  colors: { primary: '#D4AF37', secondary: '#C9A84C', accent: '#6DBF7E', bg: '#05050F' } },
  { name: 'Cyber Neon',     colors: { primary: '#C9A84C', secondary: '#C0392B', accent: '#6DBF7E', bg: '#080B18' } },
];

const COLOR_SLOTS = [
  { key: 'primary',   label: 'Primary'   },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent',    label: 'Accent'    },
  { key: 'bg',        label: 'Background'},
];

function MiniPreview({ colors }) {
  return (
    <div className="w-full h-16 rounded-lg overflow-hidden border flex items-stretch"
      style={{ background: colors.bg, borderColor: `${colors.primary}30` }}>
      {/* Left sidebar bar */}
      <div className="w-2 flex-shrink-0" style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }} />
      <div className="flex-1 p-2 flex flex-col justify-between">
        {/* Viewer count */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C0392B' }} />
          <div className="h-2 rounded w-8" style={{ background: `${colors.primary}60` }} />
          <div className="h-2 rounded w-10 ml-auto" style={{ background: `${colors.secondary}40` }} />
        </div>
        {/* Chat message strip */}
        <div className="h-2 rounded" style={{ background: `${colors.accent}25` }} />
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full w-3/5 rounded-full" style={{ background: `linear-gradient(90deg, ${colors.primary}80, ${colors.primary})` }} />
        </div>
      </div>
    </div>
  );
}

export default function OverlayThemeBuilder({ creatorId }) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [colors, setColors]                 = useState(PRESETS[0].colors);
  const [themeName, setThemeName]           = useState('');
  const [editingName, setEditingName]       = useState(false);
  const [copiedKey, setCopiedKey]           = useState(null);
  const queryClient = useQueryClient();

  const { data: layouts = [] } = useQuery({
    queryKey: ['overlayLayouts', creatorId],
    queryFn: () => base44.entities.OverlayLayout.filter({ creator_id: creatorId }, '-created_date'),
    enabled: !!creatorId,
  });

  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      const name = themeName.trim() || `${PRESETS[selectedPreset]?.name || 'Custom'} ${new Date().toLocaleDateString()}`;
      return base44.entities.OverlayLayout.create({
        creator_id:  creatorId,
        name,
        preset_used: PRESETS[selectedPreset]?.name || 'Custom',
        elements:    [{ type: 'colors', data: colors }],
        is_active:   false,
      });
    },
    onSuccess: (layout) => {
      queryClient.invalidateQueries({ queryKey: ['overlayLayouts', creatorId] });
      setThemeName('');
      toast.success(`Theme "${layout?.name}" saved!`);
      if (creatorId) {
        base44.entities.Activity.create({ user_id: creatorId, type: 'milestone', title: `Saved overlay theme: ${layout?.name}` }).catch(() => {});
      }
    },
    onError: () => toast.error('Failed to save theme.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OverlayLayout.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overlayLayouts', creatorId] });
      toast.success('Theme deleted.');
    },
    onError: () => toast.error('Failed to delete theme.'),
  });

  const applyLayout = (layout) => {
    const saved = layout.elements?.find(e => e.type === 'colors')?.data;
    if (saved) setColors({ ...PRESETS[0].colors, ...saved });
    toast.success(`Applied "${layout.name}"`);
  };

  const copyHex = (key, value) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-lg font-black flex-1" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Channel Theme
        </h3>
      </div>

      {/* Live preview */}
      <MiniPreview colors={colors} />

      {/* Presets grid */}
      <div>
        <p className="text-[10px] text-white/40 uppercase font-bold mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map((preset, idx) => (
            <motion.button
              key={preset.name}
              onClick={() => { setSelectedPreset(idx); setColors(preset.colors); }}
              whileHover={{ scale: 1.04 }}
              className="p-2 rounded-lg transition-all text-left"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: selectedPreset === idx ? `2px solid ${preset.colors.primary}` : `1px solid ${BORDER}`,
              }}
            >
              <div className="flex gap-0.5 mb-1">
                {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.bg].map((c, i) => (
                  <div key={i} className="flex-1 h-2 rounded-sm" style={{ background: c, border: i === 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }} />
                ))}
              </div>
              <p className="text-[9px] font-bold text-white/70 leading-tight truncate">{preset.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Color customization */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/40 uppercase font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Customize</p>
        {COLOR_SLOTS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label className="text-[11px] font-bold text-white/50 uppercase w-20 shrink-0">{label}</label>
            <input
              type="color"
              value={colors[key]}
              onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              style={{ padding: 0 }}
            />
            <span className="flex-1 font-mono text-xs px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', color: colors[key], border: `1px solid ${colors[key]}30` }}>
              {colors[key].toUpperCase()}
            </span>
            <button onClick={() => copyHex(key, colors[key])}
              className="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-white/10"
              style={{ color: copiedKey === key ? '#6DBF7E' : 'rgba(255,255,255,0.3)' }}
              title="Copy hex">
              {copiedKey === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>

      {/* Theme name + save */}
      <div className="flex gap-2">
        <input
          value={themeName}
          onChange={e => setThemeName(e.target.value)}
          placeholder={`${PRESETS[selectedPreset]?.name || 'Custom'} theme…`}
          style={{ flex: 1, padding: '6px 12px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none' }}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => saveThemeMutation.mutate()}
          disabled={saveThemeMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
          style={{ background: G, color: '#000' }}
        >
          <Save className="w-3.5 h-3.5" /> Save
        </motion.button>
      </div>

      {/* Saved layouts */}
      <AnimatePresence>
        {layouts.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2 border-t space-y-1.5" style={{ borderColor: BORDER }}>
            <p className="text-[10px] font-bold text-white/40 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Saved Themes ({layouts.length})
            </p>
            {layouts.slice(0, 5).map(layout => (
              <motion.div key={layout.id}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}
              >
                {/* Color swatch */}
                <div className="flex gap-0.5 shrink-0">
                  {(layout.elements?.[0]?.data
                    ? [layout.elements[0].data.primary, layout.elements[0].data.secondary, layout.elements[0].data.accent]
                    : [G, '#D4854A', '#C9A84C']
                  ).map((c, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                  ))}
                </div>
                <span className="flex-1 text-xs text-white/70 truncate">{layout.name}</span>
                <button onClick={() => applyLayout(layout)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded transition-all hover:opacity-80"
                  style={{ background: `${G}18`, color: G, border: `1px solid ${G}30` }}>
                  Apply
                </button>
                <button onClick={() => deleteMutation.mutate(layout.id)}
                  className="text-white/20 hover:text-[#C0392B] transition-colors"
                  disabled={deleteMutation.isPending}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
