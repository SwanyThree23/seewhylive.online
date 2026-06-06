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
        const result = await base44.functions.invoke('auraEmotionDetection', {
          room_id: roomId,
          session_id: sessionId,
          aura_persona: auraPersona,
        });

        if (result?.data) {
          setEmotion(result.data.detected_emotion);
          setEnergy(result.data.energy_level);
        }
      } catch (error) {
        console.error('Emotion detection error:', error);
      }
    };

    const interval = setInterval(detectEmotion, 30000);
    detectEmotion();
    return () => clearInterval(interval);
  }, [roomId, sessionId, auraPersona]);

  const emotionConfig = {
    high: { color: '#C0392B', icon: Heart, label: 'Peak Energy' },
    medium: { color: '#FFB800', icon: Zap, label: 'Moderate' },
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