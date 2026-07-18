import { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { fireAlert } from '@/components/live/HostAlertCenter';

const TOXIC_RE = /\b(nigger|nigga|faggot|kys|kill yourself|rape\b|nazi\b|cunt\b)\b/i;
const SPAM_RE  = /(.)\1{8,}|https?:\/\/\S+\s*https?:\/\/\S+/i;

const DEFAULT_THRESHOLDS = { flagT: 0.50, muteT: 0.75, banT: 0.95 };

export function useGuardianEnforcement({ roomId, moderatorId, thresholds = DEFAULT_THRESHOLDS, enabled = true }) {
  const checkedRef = useRef(new Set());

  const enforce = useCallback(async (msg) => {
    if (!enabled || !roomId) return;
    if (checkedRef.current.has(msg.id)) return;
    checkedRef.current.add(msg.id);

    const text = (msg.content || '').trim();
    if (!text) return;

    let violationType = 'safe';
    let confidence = 0;
    let explanation = null;

    // Tier 1 — instant heuristic (no LLM cost)
    if (TOXIC_RE.test(text)) {
      violationType = 'hate_speech';
      confidence = 0.92;
      explanation = 'Matched hate speech keyword';
    } else if (SPAM_RE.test(text)) {
      violationType = 'spam';
      confidence = 0.80;
      explanation = 'Repeated characters or duplicate links';
    } else if (text.length < 4) {
      return; // too short to classify
    } else {
      // Tier 2 — LLM (only for messages that pass heuristic)
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a real-time chat moderator for a live streaming platform. Classify this message strictly — only flag genuine toxicity, harassment, or explicit content. Mild language, slang, and hype are fine.\n\nMessage: "${text.slice(0, 300)}"\n\nReturn JSON only.`,
          response_json_schema: {
            type: 'object',
            properties: {
              status:      { type: 'string' },  // 'safe'|'spam'|'harassment'|'hate_speech'|'inappropriate'
              severity:    { type: 'number' },  // 0.0–1.0
              explanation: { type: 'string' },
            },
            required: ['status', 'severity'],
          },
        });
        if (result && result.status !== 'safe') {
          violationType = result.status;
          confidence = result.severity ?? 0;
          explanation = result.explanation || null;
        }
      } catch {
        return; // LLM failure — never block messages on error
      }
    }

    const { flagT, muteT, banT } = thresholds;
    if (violationType === 'safe' || confidence < flagT) return;

    const action = confidence >= banT  ? 'banned'
                 : confidence >= muteT ? 'muted'
                 : 'flagged';

    // Persist to ContentModeration log
    base44.entities.ContentModeration.create({
      content_type:  'message',
      content_id:    msg.id,
      content_text:  text.slice(0, 500),
      violation_type: violationType,
      ai_confidence:  confidence,
      ai_explanation: explanation,
      action_taken:   action,
      room_id:        roomId,
      reported_by:    'guardian_ai',
      status:         action === 'flagged' ? 'pending' : 'actioned',
    }).catch(() => {});

    if (action === 'muted' || action === 'banned') {
      // Delete the offending message from the room feed
      base44.entities.Message.delete(msg.id).catch(() => {});

      // Create ChatModeration record — ChatPanel reads these to block future sends
      base44.entities.ChatModeration.create({
        room_id:          roomId,
        moderator_id:     moderatorId || 'guardian_ai',
        action_type:      action === 'banned' ? 'ban' : 'mute',
        target_user_id:   msg.user_id   || null,
        target_user_name: msg.user_name || 'Unknown',
        reason:           `Guardian AI: ${violationType} (${Math.round(confidence * 100)}% confidence)`,
        auto_detected:    true,
        duration_minutes: action === 'muted' ? 10 : null,
        expires_at:       action === 'muted'
          ? new Date(Date.now() + 10 * 60 * 1000).toISOString()
          : null,
      }).catch(() => {});

      fireAlert({
        type:     'moderation',
        title:    action === 'banned' ? '🚫 GUARDIAN: AUTO-BANNED' : '🔇 GUARDIAN: AUTO-MUTED',
        body:     `${msg.user_name || 'User'}: "${text.slice(0, 60)}" — ${violationType}`,
        duration: 6000,
      });
    } else {
      // Flagged only — host reviews, message stays visible
      fireAlert({
        type:     'moderation',
        title:    '⚠️ GUARDIAN: Message Flagged',
        body:     `${msg.user_name || 'User'}: "${text.slice(0, 60)}" — ${violationType}`,
        duration: 5000,
      });
    }
  }, [roomId, moderatorId, enabled, thresholds]);

  useEffect(() => {
    if (!roomId || !enabled) return;
    // Clear checked set when room changes so we don't skip new messages
    checkedRef.current.clear();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.room_id === roomId) {
        enforce(event.data);
      }
    });
    return unsub;
  }, [roomId, enabled, enforce]);
}
