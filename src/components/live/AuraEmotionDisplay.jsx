import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Heart, Zap, TrendingUp } from 'lucide-react';

const G = '#d4af37';

export default function AuraEmotionDisplay({ roomId, sessionId, auraPersona = 'hype' }) {
  const [emotion, setEmotion] = useState(null);
  const [energy, setEnergy] = useState(0.5);

  useEffect(() => {
    const detectEmotion = async () => {
      try {
        const msgs = await base44.entities.Message.filter(
          { room_id: roomId },
          '-created_date',
          20
        ).catch(() => []);
        if (!msgs.length) return;
        const msgText = msgs.map(m => m.content).join('\n');
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze the crowd energy of these live stream chat messages for a "${auraPersona}" persona. Return JSON: { "detected_emotion": "high" or "medium" or "low", "energy_level": 0.0-1.0 }\n\n${msgText}`,
          response_json_schema: {
            type: 'object',
            properties: {
              detected_emotion: { type: 'string' },
              energy_level: { type: 'number' },
            },
          },
        });
        if (result) {
          setEmotion(result.detected_emotion);
          setEnergy(result.energy_level ?? 0.5);
        }
      } catch {}
    };

    const interval = setInterval(detectEmotion, 30000);
    detectEmotion();
    return () => clearInterval(interval);
  }, [roomId, sessionId, auraPersona]);

  const emotionConfig = {
    high: { color: '#C0392B', icon: Heart, label: 'Peak Energy' },
    medium: { color: '#D4AF37', icon: Zap, label: 'Moderate' },
    low: { color: '#C9A84C', icon: TrendingUp, label: 'Growing' },
  };

  const config = emotionConfig[emotion] || emotionConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold"
      style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
      </motion.div>
      <span style={{ color: config.color }}>{config.label}</span>
      <motion.div
        className="w-6 h-1.5 bg-white/20 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${energy * 100}%` }}
          transition={{ duration: 1 }}
          style={{ background: config.color }}
        />
      </motion.div>
    </motion.div>
  );
}