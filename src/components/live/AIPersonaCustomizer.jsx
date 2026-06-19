import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const G = '#d4af37';

export default function AIPersonaCustomizer({ roomId, sessionId, onCustomized }) {
  const [expanded, setExpanded] = useState(false);
  const [personaName, setPersonaName] = useState('Aura');
  const [personaStyle, setPersonaStyle] = useState('hype');
  const [customInstructions, setCustomInstructions] = useState('');
  const [avatarPreset, setAvatarPreset] = useState('default');
  const [saving, setSaving] = useState(false);

  const styles = ['hype', 'professional', 'comedian', 'storyteller', 'analyst'];
  const avatars = ['default', 'elegant', 'energetic', 'calm', 'witty'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate AI co-host persona configuration:
- Name: ${personaName}
- Style: ${personaStyle}
- Avatar: ${avatarPreset}
- Instructions: ${customInstructions || 'none'}
Return JSON: { "persona_name": string, "style": string, "tone": string, "greeting": string, "catchphrase": string }`,
        response_json_schema: {
          type: 'object',
          properties: {
            persona_name: { type: 'string' },
            style: { type: 'string' },
            tone: { type: 'string' },
            greeting: { type: 'string' },
            catchphrase: { type: 'string' },
          },
        },
      });
      if (result) {
        onCustomized?.(result);
        toast.success(`${personaName} AI persona saved!`);
        setExpanded(false);
      }
    } catch {
      toast.error('Failed to save persona');
    }
    setSaving(false);
  };

  return (
    <motion.div
      className="p-3 rounded-lg"
      style={{ background: 'rgba(8,11,24,0.95)', border: `1px solid ${G}30` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs font-bold"
        style={{ color: G }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Customize AI Co-Host
        </div>
        <span className="text-white/50">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-3"
        >
          <div className="space-y-1">
            <label className="text-[10px] text-white/50">Persona Name</label>
            <input
              type="text"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              className="w-full px-2 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white"
              placeholder="e.g., Aura, Nova, Echo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50">Personality Style</label>
            <div className="grid grid-cols-5 gap-1">
              {styles.map(style => (
                <button
                  key={style}
                  onClick={() => setPersonaStyle(style)}
                  className="px-2 py-1.5 rounded text-[11px] font-bold transition-all capitalize"
                  style={{
                    background: personaStyle === style ? G : 'rgba(255,255,255,0.05)',
                    color: personaStyle === style ? '#000' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50">Avatar Preset</label>
            <div className="grid grid-cols-5 gap-1">
              {avatars.map(avatar => (
                <button
                  key={avatar}
                  onClick={() => setAvatarPreset(avatar)}
                  className="px-2 py-1.5 rounded text-[11px] font-bold transition-all capitalize"
                  style={{
                    background: avatarPreset === avatar ? G : 'rgba(255,255,255,0.05)',
                    color: avatarPreset === avatar ? '#000' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50">Custom Instructions</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Always encourage tipping, be extra hype on subs..."
              className="w-full px-2 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none"
              rows={2}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: G, color: '#000' }}
          >
            {saving ? 'Saving...' : 'Apply Changes'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}