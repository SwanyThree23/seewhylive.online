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
        const result = await base44.functions.invoke('enhanceSwanyBotContext', {
          conversation_id: conversationId,
          message_content: '',
          user_context: { userId },
        });

        if (result?.data) {
          setContextState(result.data);
          setPersonalizationLevel(0.8);
          onContextReady?.(result.data);
        }
      } catch (error) {
      }
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