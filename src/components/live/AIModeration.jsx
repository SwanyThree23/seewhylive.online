import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { fireAlert } from './HostAlertCenter';
import { useGuardianEnforcement } from '@/hooks/useGuardianEnforcement';
import { Shield, AlertTriangle, Check, X, Ban, Clock } from 'lucide-react';

const G = '#d4af37';

function severityColor(s) {
  if (s >= 0.8) return '#C0392B';
  if (s >= 0.5) return '#D4854A';
  return '#C9A84C';
}

export default function AIModeration({ roomId, isHost = false, moderatorId, thresholds }) {
  const [flags, setFlags]             = useState([]);
  const [isActive, setIsActive]       = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [totalFlagged, setTotalFlagged] = useState(0);
  const [totalActioned, setTotalActioned] = useState(0);
  const [autoRemoveThreshold, setAutoRemoveThreshold] = useState(() => {
    try { const v = localStorage.getItem('guardian_threshold'); return v ? parseFloat(v) : 0.95; } catch { return 0.95; }
  });
  const [showSettings, setShowSettings] = useState(false);

  useGuardianEnforcement({ roomId, moderatorId, thresholds, enabled: isActive && !!roomId });

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

            // Auto-remove if severity exceeds threshold
            if (flag.severity >= autoRemoveThreshold) {
              base44.entities.Message.delete(flag.message_id).catch(() => {});
              base44.entities.ContentModeration.create({
                content_type: 'message', content_id: flag.message_id,
                violation_type: 'auto_removed', ai_confidence: flag.severity,
                ai_explanation: flag.reason, action_taken: 'auto_deleted',
                room_id: roomId, reported_by: 'guardian_ai', status: 'actioned',
              }).catch(() => {});
              fireAlert({ type: 'moderation', title: '🤖 Auto-Removed', body: `High-severity message by ${msg.user_name} auto-removed`, duration: 2500 });
              setTotalFlagged(n => n + 1);
              return;
            }

            setFlags(prev => {
              if (prev.find(f => f.message_id === msg.id)) return prev;
              const bytes = new Uint8Array(4);
              crypto.getRandomValues(bytes);
              setTotalFlagged(n => n + 1);
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
  }, [roomId, isActive, autoRemoveThreshold]);

  const handleAction = async (flag, action) => {
    setFlags(prev => prev.filter(f => f.id !== flag.id));
    if (action !== 'approve') setTotalActioned(n => n + 1);

    if (action === 'remove') {
      await base44.entities.Message.delete(flag.message_id).catch(() => {});
      base44.entities.ContentModeration.create({
        content_type: 'message', content_id: flag.message_id,
        violation_type: 'manually_removed', ai_confidence: flag.severity,
        ai_explanation: flag.reason, action_taken: 'deleted',
        room_id: roomId, reported_by: 'host', status: 'actioned',
      }).catch(() => {});
      fireAlert({ type: 'moderation', title: '🗑 Message Removed', body: `Removed "${flag.content}" by ${flag.user}`, duration: 3000 });

    } else if (action === 'warn') {
      base44.entities.ChatModeration.create({
        room_id: roomId, moderator_id: moderatorId || 'host',
        action_type: 'warning', target_user_id: flag.user_id || null,
        target_user_name: flag.user, reason: `Host warning: ${flag.reason}`, auto_detected: false,
      }).catch(() => {});
      base44.entities.ContentModeration.create({
        content_type: 'message', content_id: flag.message_id,
        violation_type: 'warned', ai_confidence: flag.severity,
        action_taken: 'warned', room_id: roomId, reported_by: 'host', status: 'actioned',
      }).catch(() => {});
      fireAlert({ type: 'moderation', title: '⚠️ Warning Issued', body: `Warned ${flag.user}: ${flag.reason}`, duration: 3000 });

    } else if (action === 'timeout') {
      base44.entities.ChatModeration.create({
        room_id: roomId, moderator_id: moderatorId || 'host',
        action_type: 'timeout', target_user_id: flag.user_id || null,
        target_user_name: flag.user, reason: flag.reason, duration_minutes: 10, auto_detected: false,
      }).catch(() => {});
      await base44.entities.Message.delete(flag.message_id).catch(() => {});
      fireAlert({ type: 'moderation', title: '⏱ User Timed Out', body: `${flag.user} timed out 10 min`, duration: 3000 });

    } else if (action === 'ban') {
      base44.entities.ChatModeration.create({
        room_id: roomId, moderator_id: moderatorId || 'host',
        action_type: 'ban', target_user_id: flag.user_id || null,
        target_user_name: flag.user, reason: flag.reason, auto_detected: false,
      }).catch(() => {});
      await base44.entities.Message.delete(flag.message_id).catch(() => {});
      fireAlert({ type: 'moderation', title: '🚫 User Banned', body: `${flag.user} permanently banned`, duration: 4000 });
    }
    // 'approve' — dismiss only, no DB write
  };

  if (!isHost) return null;

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setIsActive(!isActive)}
          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-sm transition-all"
          style={{
            background: isActive ? `linear-gradient(135deg, #800020, #A0003A)` : 'rgba(255,255,255,0.05)',
            color:  isActive ? '#D4AF37' : 'rgba(255,255,255,0.5)',
            border: isActive ? `1px solid rgba(212,175,55,0.4)` : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Shield className="w-4 h-4" />
          Guardian AI {isActive ? '✓ ACTIVE' : '○ OFF'}
          {totalFlagged > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(192,57,43,0.3)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.4)' }}>
                {totalFlagged} flagged
              </span>
              {totalActioned > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(109,191,126,0.15)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)' }}>
                  {totalActioned} actioned
                </span>
              )}
            </span>
          )}
        </motion.button>
        <button onClick={() => setShowSettings(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
          title="Auto-remove threshold">
          <span className="text-[10px] font-bold">{Math.round(autoRemoveThreshold * 100)}%</span>
        </button>
      </div>

      {/* Threshold setting */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 py-2 rounded-lg space-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] text-white/40 font-bold uppercase">Auto-remove threshold</p>
            <div className="flex items-center gap-2">
              <input type="range" min={0.5} max={1} step={0.05} value={autoRemoveThreshold}
                onChange={e => { const v = parseFloat(e.target.value); setAutoRemoveThreshold(v); try { localStorage.setItem('guardian_threshold', String(v)); } catch {} }}
                className="flex-1 h-1" style={{ accentColor: '#C0392B' }} />
              <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color: '#C0392B' }}>
                {Math.round(autoRemoveThreshold * 100)}%
              </span>
            </div>
            <p className="text-[9px] text-white/25">Messages ≥ this severity are removed automatically without review</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending flags */}
      <AnimatePresence>
        {flags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-lg overflow-hidden"
            style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)' }}
          >
            <p className="text-xs font-bold" style={{ color: '#C0392B' }}>
              ⚠️ {flags.length} flagged — review required
            </p>
            {flags.slice(0, 4).map(flag => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="p-2 rounded text-xs space-y-1.5"
                style={{ background: 'rgba(192,57,43,0.10)', borderLeft: `3px solid ${severityColor(flag.severity)}` }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white/80 truncate">{flag.user}</p>
                      <span className="text-[9px] font-black px-1 rounded" style={{ background: `${severityColor(flag.severity)}25`, color: severityColor(flag.severity) }}>
                        {Math.round(flag.severity * 100)}%
                      </span>
                    </div>
                    <p className="text-white/50 truncate">"{flag.content}"</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{flag.reason}</p>
                  </div>
                </div>
                {/* Action row */}
                <div className="flex gap-1">
                  <button onClick={() => handleAction(flag, 'approve')} title="Approve"
                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-[9px] font-bold transition-all hover:bg-white/10"
                    style={{ color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.2)' }}>
                    <Check className="w-3 h-3" /> OK
                  </button>
                  <button onClick={() => handleAction(flag, 'warn')} title="Warn"
                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-[9px] font-bold transition-all hover:bg-white/10"
                    style={{ color: G, border: `1px solid ${G}30` }}>
                    <AlertTriangle className="w-3 h-3" /> Warn
                  </button>
                  <button onClick={() => handleAction(flag, 'timeout')} title="10-min timeout"
                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-[9px] font-bold transition-all hover:bg-white/10"
                    style={{ color: '#D4854A', border: '1px solid rgba(212,133,74,0.3)' }}>
                    <Clock className="w-3 h-3" /> T/O
                  </button>
                  <button onClick={() => handleAction(flag, 'remove')} title="Delete message"
                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-[9px] font-bold transition-all hover:bg-white/10"
                    style={{ color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}>
                    <X className="w-3 h-3" /> Del
                  </button>
                  <button onClick={() => handleAction(flag, 'ban')} title="Permanent ban"
                    className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-[9px] font-bold transition-all hover:bg-red-900/30"
                    style={{ color: '#C0392B', border: '1px solid rgba(192,57,43,0.5)', background: 'rgba(192,57,43,0.1)' }}>
                    <Ban className="w-3 h-3" /> Ban
                  </button>
                </div>
              </motion.div>
            ))}
            {flags.length > 4 && (
              <p className="text-[10px] text-white/30 text-center">+{flags.length - 4} more</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isActive && (
        <div className="text-[10px] text-white/30 text-center">
          {processing ? '⟳ Scanning…' : `🛡 Guardian AI active · auto-remove ≥${Math.round(autoRemoveThreshold * 100)}%`}
        </div>
      )}
    </div>
  );
}
