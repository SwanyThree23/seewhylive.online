/**
 * useHighlightDetector
 * Monitors hype level + chat sentiment. When a "viral moment" is detected
 * (hype >= threshold AND chat sentiment >= threshold), it automatically calls
 * the createVideoShort backend function to save a 30-second clip.
 *
 * Accepts optional `getClipBlobUrl(seconds)` — when provided, extracts the
 * last N seconds from a live recording buffer and offers a local download.
 *
 * Cooldown: 3 minutes between auto-clips to prevent spam.
 */
import { useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const HYPE_THRESHOLD = 75;         // % hype needed to trigger
const SENTIMENT_THRESHOLD = 0.65;  // 0-1 positive ratio
const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const CHECK_INTERVAL_MS = 10_000;  // check every 10 seconds
const CLIP_DURATION = 30;          // seconds

/**
 * Computes a simple positive-sentiment ratio from recent chat messages.
 * Returns a value 0-1. Uses emoji/keyword heuristics — no LLM call needed here.
 */
function computeSentiment(messages) {
  if (!messages.length) return 0;
  const POSITIVE = /🔥|❤️|🚀|💎|👑|💯|😍|🤩|🥳|hype|lit|fire|go|lets go|lfg|amazing|great|love|yes|wow|incredible|🎉|⚡|🏆|💪|🙌/i;
  const NEGATIVE = /trash|garbage|boring|bad|hate|awful|stop|toxic|spam|dead|🤮|💀|😴|👎/i;
  let pos = 0, neg = 0;
  messages.slice(-30).forEach(m => {
    if (POSITIVE.test(m.content)) pos++;
    else if (NEGATIVE.test(m.content)) neg++;
  });
  const total = Math.max(1, pos + neg);
  return pos / total;
}

export function useHighlightDetector({ partyId, roomId, isHost, user, messages, hypeLevel, elapsedSeconds, getClipBlobUrl }) {
  const lastClipRef = useRef(0);
  const savingRef = useRef(false);
  // Holds the most recently extracted local clip blob URL so callers can offer a download
  const latestClipUrlRef = useRef(null);

  const triggerHighlightClip = useCallback(async (sentiment) => {
    if (!isHost || !user || !roomId) return;
    if (savingRef.current) return;
    const now = Date.now();
    if (now - lastClipRef.current < COOLDOWN_MS) return;

    savingRef.current = true;
    lastClipRef.current = now;

    const title = `🔥 Auto-Highlight · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Extract local clip from rolling buffer if a recorder is running
    const localBlobUrl = typeof getClipBlobUrl === 'function' ? getClipBlobUrl(CLIP_DURATION) : null;
    if (localBlobUrl) {
      latestClipUrlRef.current = localBlobUrl;
    }

    toast('✂️ High-engagement moment detected — saving clip…', { duration: 4000 });

    // Offer immediate local download when we have actual video data
    if (localBlobUrl) {
      toast(`🎬 Clip ready — click to download`, {
        duration: 15000,
        action: {
          label: 'Download',
          onClick: () => {
            const a = document.createElement('a');
            a.href = localBlobUrl;
            a.download = `highlight-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          },
        },
      });
    }

    try {
      await base44.functions.invoke('createVideoShort', {
        room_id: roomId,
        title,
        description: `Auto-captured highlight. Hype: ${hypeLevel}% · Sentiment: ${Math.round(sentiment * 100)}%`,
        video_url: '',
        thumbnail_url: '',
        duration_seconds: CLIP_DURATION,
        paywall_enabled: false,
        paywall_price: 0,
      });

      // Log a StreamHighlight record for the library
      await base44.entities.StreamHighlight.create({
        room_id: roomId,
        creator_id: user.id,
        title,
        start_timestamp: Math.max(0, elapsedSeconds - CLIP_DURATION),
        end_timestamp: elapsedSeconds,
        duration_seconds: CLIP_DURATION,
        trigger_type: 'auto',
        hype_score: hypeLevel,
        sentiment_score: Math.round(sentiment * 100),
        is_published: true,
        created_at: new Date().toISOString(),
      });

      toast.success(`🎬 Highlight clip saved to library!`);
    } catch (err) {
      console.warn('[HighlightDetector] clip save failed:', err?.message);
      toast.error('Auto-clip failed');
    } finally {
      savingRef.current = false;
    }
  }, [isHost, user, roomId, hypeLevel, elapsedSeconds, getClipBlobUrl]);

  useEffect(() => {
    if (!isHost || !partyId) return;
    const interval = setInterval(() => {
      const sentiment = computeSentiment(messages);
      if (hypeLevel >= HYPE_THRESHOLD && sentiment >= SENTIMENT_THRESHOLD) {
        triggerHighlightClip(sentiment);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isHost, partyId, messages, hypeLevel, triggerHighlightClip]);

  return { triggerHighlightClip, latestClipUrlRef };
}