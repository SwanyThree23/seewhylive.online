import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { fireAlert } from './HostAlertCenter';
import { useGuardianEnforcement } from '@/hooks/useGuardianEnforcement';
import { Shield, AlertTriangle, Check, X, MessageSquareWarning } from 'lucide-react';

const G = '#d4af37';

export default function AIModeration({ roomId, isHost = false, moderatorId, thresholds }) {
  const [flags, setFlags]       = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Real-time enforcement engine — runs while toggle is on
  useGuardianEnforcement({ roomId, moderatorId, thresholds, enabled: isActive && !!roomId });

  // Batch scan: poll every 15s and surface flags for host review
  useEffect(() => {
    if (!isActive || !roomId) return;

    const checkContent = async () => {
      setProcessing(true);
      try {
        const recentMessages = await base44.entities.Message.filter(
          { room_id: roomId, deleted: false },
          '-created_date',
          20
        );
        if (!recentMessages.length) { setProcessing(false); return; }

        const msgLines = recentMessages
          .map(m => `[${m.id}|${m.user_name}] ${m.content}`)
          .join('\n');

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Review these chat messages for toxicity, harassment, hate speech, or spam. Only flag genuinely problematic messages — mild language is fine.\n\nMessages:\n${msgLines}\n\nReturn JSON.`,
          response_json_schema: {
            type: 'object',
            properties: {
              flags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message_id: { type: 'string' },
                    severity:   { type: 'number' },
                    reason:     { type: 'string' },
                  },
                },
              },
            },
          },
        });

        if (result?.flags?.length) {
          result.flags.forEach(flag => {
            const msg = recentMessages.find(m => m.id === flag.message_id);
            if (!msg) return;
            setFlags(prev => {
              if (prev.find(f => f.message_id === msg.id)) return prev;
              const bytes = new Uint8Array(4);
              crypto.getRandomValues(bytes);
              return [...prev, {
                id:         Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''),
                message_id: msg.id,
                user_id:    msg.user_id,
                user:       msg.user_name,
                content:    msg.content.slice(0, 60),
                severity:   flag.severity,
                reason:     flag.reason,
                timestamp:  new Date(msg.created_date),
              }];
            });
          });
        }
      } catch {}
      setProcessing(false);
    };

    checkContent();
    const interval = setInterval(checkContent, 15000);
    return () => clearInterval(interval);
  }, [roomId, isActive]);

  const handleAction = async (flag, action) => {
    setFlags(prev => prev.filter(f => f.id !== flag.id));

    if (action === 'remove') {
      await base44.entities.Message.delete(flag.message_id).catch(() => {});
      base44.entities.ContentModeration.create({
        content_type:  'message',
        content_id:    flag.message_id,
        violation_type: 'manually_removed',
        ai_confidence:  flag.severity,
        ai_explanation: flag.reason,
        action_taken:   'deleted',
        room_id:        roomId,
        reported_by:    'host',
        status:         'actioned',
      }).catch(() => {});
      fireAlert({
        type:     'moderation',
        title:    '🗑 Message Removed',
        body:     `Removed "${flag.content}" by ${flag.user}`,
        duration: 3000,
      });

    } else if (action === 'warn') {
      base44.entities.ChatModeration.create({
        room_id:          roomId,
        moderator_id:     moderatorId || 'host',
        action_type:      'warning',
        target_user_id:   flag.user_id   || null,
        target_user_name: flag.user,
        reason:           `Host warning: ${flag.reason}`,
        auto_detected:    false,
      }).catch(() => {});
      base44.entities.ContentModeration.create({
        content_type:  'message',
        content_id:    flag.message_id,
        violation_type: 'warned',
        ai_confidence:  flag.severity,
        action_taken:   'warned',
        room_id:        roomId,
        reported_by:    'host',
        status:         'actioned',
      }).catch(() => {});
      fireAlert({
        type:     'moderation',
        title:    '⚠️ Warning Issued',
        body:     `Warned ${flag.user}: ${flag.reason}`,
        duration: 3000,
      });

    }
    // 'approve' — dismiss from local list only; no DB write needed
  };

  if (!isHost) return null;

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsActive(!isActive)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-sm transition-all"
        style={{
          background: isActive ? `linear-gradient(135deg, #800020, #A0003A)` : 'rgba(255,255,255,0.05)',
          color:  isActive ? '#D4AF37' : 'rgba(255,255,255,0.5)',
          border: isActive ? `1px solid rgba(212,175,55,0.4)` : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Shield className="w-4 h-4" />
        Guardian AI {isActive ? '✓ ACTIVE' : '○ OFF'}
      </motion.button>

      {/* Pending flags for host review */}
      <AnimatePresence>
        {flags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-lg overflow-hidden"
            style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)' }}
          >
            <p className="text-xs font-bold" style={{ color: '#C0392B' }}>
              ⚠️ {flags.length} flagged — review required
            </p>
            {flags.slice(0, 4).map(flag => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-2 rounded text-xs space-y-1"
                style={{ background: 'rgba(192,57,43,0.10)' }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white/80 truncate">{flag.user}</p>
                    <p className="text-white/50 truncate">"{flag.content}"</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{flag.reason} · {Math.round(flag.severity * 100)}%</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {/* Approve (dismiss) */}
                    <button
                      onClick={() => handleAction(flag, 'approve')}
                      title="Approve — message is fine"
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <Check className="w-3 h-3" style={{ color: '#6DBF7E' }} />
                    </button>
                    {/* Warn user */}
                    <button
                      onClick={() => handleAction(flag, 'warn')}
                      title="Issue warning to user"
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <AlertTriangle className="w-3 h-3" style={{ color: '#D4AF37' }} />
                    </button>
                    {/* Remove message */}
                    <button
                      onClick={() => handleAction(flag, 'remove')}
                      title="Delete message"
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <X className="w-3 h-3" style={{ color: '#C0392B' }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {flags.length > 4 && (
              <p className="text-[10px] text-white/30 text-center">+{flags.length - 4} more</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status line */}
      {isActive && (
        <div className="text-[10px] text-white/30 text-center">
          {processing ? '⟳ Scanning…' : '🛡 Guardian AI active · real-time enforcement on'}
        </div>
      )}
    </div>
  );
}
