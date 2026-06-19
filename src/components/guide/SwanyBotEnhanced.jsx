import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Zap } from 'lucide-react';

const G = '#d4af37';

export default function SwanyBotContextEnhancer({ userId, conversationId, onContextReady }) {
  const [contextState, setContextState] = useState(null);
  const [personalizationLevel, setPersonalizationLevel] = useState(0);

  useEffect(() => {
    const enhanceContext = async () => {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate AI assistant context for a live streaming conversation. Return JSON: { "personalization_level": 0.8, "suggested_topics": ["streaming", "community", "tips"], "communication_style": "friendly" }`,
          response_json_schema: {
            type: 'object',
            properties: {
              personalization_level: { type: 'number' },
              suggested_topics: { type: 'array', items: { type: 'string' } },
              communication_style: { type: 'string' },
            },
          },
        });
        if (result) {
          setContextState(result);
          setPersonalizationLevel(result.personalization_level ?? 0.8);
          onContextReady?.(result);
        }
      } catch {}
    };

    if (conversationId) {
      enhanceContext();
    }
  }, [conversationId, userId, onContextReady]);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Brain className="w-3 h-3" style={{ color: G }} />
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
        Context: <strong style={{ color: G }}>{Math.round(personalizationLevel * 100)}%</strong>
      </span>
    </div>
  );
}