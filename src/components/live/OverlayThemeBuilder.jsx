import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Save, Trash2 } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0F0B1A';
const BORDER = 'rgba(212,175,55,0.18)';

const PRESETS = [
  { name: 'Gold Empire', colors: { primary: G, secondary: '#FF8C00', bg: '#0A0710' } },
  { name: 'Cyber Neon', colors: { primary: '#00F5FF', secondary: '#FF1564', bg: '#0A0710' } },
  { name: 'Forest Chill', colors: { primary: '#00FF88', secondary: '#00F5FF', bg: '#0A1510' } },
  { name: 'Purple Haze', colors: { primary: '#8B5CF6', secondary: '#00F5FF', bg: '#0A0710' } },
];

export default function OverlayThemeBuilder({ creatorId }) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [colors, setColors] = useState(PRESETS[0].colors);
  const queryClient = useQueryClient();

  const { data: layouts } = useQuery({
    queryKey: ['overlayLayouts', creatorId],
    queryFn: () =>
      base44.entities.OverlayLayout.filter(
        { creator_id: creatorId },
        '-created_date'
      ),
    enabled: !!creatorId,
  });

  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.OverlayLayout.create({
        creator_id: creatorId,
        name: `Theme ${new Date().toLocaleDateString()}`,
        preset_used: PRESETS[selectedPreset].name,
        elements: [{ type: 'colors', data: colors }],
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overlayLayouts', creatorId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Channel Theme
        </h3>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset, idx) => (
          <motion.button
            key={preset.name}
            onClick={() => {
              setSelectedPreset(idx);
              setColors(preset.colors);
            }}
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: selectedPreset === idx ? `2px solid ${preset.colors.primary}` : `1px solid ${BORDER}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                {[preset.colors.primary, preset.colors.secondary, preset.colors.bg].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded" style={{ background: c, border: `1px solid ${BORDER}` }} />
                ))}
              </div>
            </div>
            <p className="text-xs font-bold text-white">{preset.name}</p>
          </motion.button>
        ))}
      </div>

      {/* Color Customization */}
      <div className="space-y-2">
        {Object.entries(colors).map(([key, value]) => (
          <div key={key}>
            <label className="text-xs font-bold text-white/60 uppercase">{key}</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={value}
                onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={value}
                readOnly
                className="flex-1 px-2 py-1.5 rounded text-xs bg-black/50 text-white/70"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => saveThemeMutation.mutate()}
        className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
        style={{ background: G, color: '#000' }}
      >
        <Save className="w-4 h-4" />
        Save Theme
      </motion.button>

      {/* Saved Layouts */}
      {layouts && layouts.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
          <p className="text-xs font-bold text-white/60 mb-2">Saved Themes</p>
          <div className="space-y-1.5">
            {layouts.slice(0, 3).map((layout) => (
              <motion.div
                key={layout.id}
                className="p-2.5 rounded text-xs flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}
              >
                <span className="text-white/70">{layout.name}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  className="text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}