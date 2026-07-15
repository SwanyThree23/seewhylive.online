import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Send } from 'lucide-react';

const G = '#d4af37';

export default function ModerationAppealPanel({ flagId, messageId, roomId, onClose }) {
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmitAppeal = async () => {
    setSubmitting(true);
    try {
      const msgs = await base44.entities.Message.filter({ room_id: roomId }, '-created_date', 100).catch(() => []);
      const msgContent = msgs.find(m => m.id === messageId)?.content || '';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A live stream chat message was flagged as "${flagId || 'inappropriate'}". The user appeals with: "${appealReason}"${msgContent ? `\nMessage: "${msgContent}"` : ''}. Should this appeal be approved? Return JSON: { "appeal_approved": true or false, "reason": "brief explanation", "confidence": 0.0-1.0 }`,
        response_json_schema: {
          type: 'object',
          properties: {
            appeal_approved: { type: 'boolean' },
            reason: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
      });
      if (res) {
        setResult(res);
      }
    } catch (error) {
    }
    setSubmitting(false);
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-lg"
        style={{ background: result.appeal_approved ? 'rgba(109,191,126,0.1)' : 'rgba(255,100,100,0.1)' }}
      >
        <p className="text-xs font-bold mb-2" style={{ color: result.appeal_approved ? '#6DBF7E' : '#C0392B' }}>
          {result.appeal_approved ? '✓ Appeal Approved' : '✗ Appeal Denied'}
        </p>
        <p className="text-[10px] text-white/70">{result.reason}</p>
        <p className="text-[11px] text-white/40 mt-2">Confidence: {Math.round(result.confidence * 100)}%</p>
        <button
          onClick={onClose}
          className="mt-3 w-full px-2 py-1.5 rounded text-xs font-bold"
          style={{ background: G, color: '#000' }}
        >
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg space-y-3"
      style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${G}20` }}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4" style={{ color: G }} />
        <p className="text-xs font-bold" style={{ color: G }}>Appeal Moderation Decision</p>
      </div>

      <textarea
        value={appealReason}
        onChange={(e) => setAppealReason(e.target.value)}
        placeholder="Explain why you think this was flagged incorrectly..."
        className="w-full px-2.5 py-2 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none resize-none"
        rows={3}
      />

      <button
        onClick={handleSubmitAppeal}
        disabled={!appealReason.trim() || submitting}
        className="w-full px-3 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{ background: G, color: '#000' }}
      >
        <Send className="w-3 h-3" />
        {submitting ? 'Reviewing...' : 'Submit Appeal'}
      </button>
    </motion.div>
  );
}