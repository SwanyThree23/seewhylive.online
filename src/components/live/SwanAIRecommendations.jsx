import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Lightbulb, CheckCircle } from 'lucide-react';

const G = '#d4af37';

export default function SwanAIRecommendations({ roomId, currentLayout, viewerCount }) {
  const [recommendation, setRecommendation] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const getRecommendation = async () => {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an AI stream layout advisor. Given ${viewerCount} viewers, current layout "${currentLayout}", and 30 minutes of streaming, suggest the optimal layout. Return JSON: { "recommended_layout": string, "reason": string, "confidence": 0.0-1.0 }`,
          response_json_schema: {
            type: 'object',
            properties: {
              recommended_layout: { type: 'string' },
              reason: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        });
        if (result?.recommended_layout && result.recommended_layout !== currentLayout) {
          setRecommendation(result);
          setDismissed(false);
        }
      } catch {}
    };

    const interval = setInterval(getRecommendation, 60000);
    getRecommendation();
    return () => clearInterval(interval);
  }, [roomId, currentLayout, viewerCount]);

  const handleApply = async () => {
    setApplying(true);
    // In actual implementation, call scene change function
    setTimeout(() => {
      setApplying(false);
      setDismissed(true);
    }, 1000);
  };

  if (!recommendation || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="p-3 rounded-lg space-y-2"
        style={{ background: `${G}12`, border: `1px solid ${G}30` }}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" style={{ color: G }} />
          <p className="text-xs font-bold" style={{ color: G }}>SwanAI Suggestion</p>
        </div>

        <div className="text-xs text-white/70">
          <p><strong>Recommended:</strong> {recommendation.recommended_layout} layout</p>
          <p className="text-[10px] text-white/50 mt-1">{recommendation.reason}</p>
          <p className="text-[10px] text-white/40 mt-1">Confidence: {Math.round(recommendation.confidence * 100)}%</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1"
            style={{ background: G, color: '#000' }}
          >
            <CheckCircle className="w-3 h-3" />
            Apply
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 px-2 py-1 rounded text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
          >
            Later
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}