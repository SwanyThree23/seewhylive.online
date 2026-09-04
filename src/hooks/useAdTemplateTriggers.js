import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Fires armed AdTemplates bound to a room when the broadcast clock
 * (video currentTime) crosses each template's trigger_offset_seconds.
 * Host-only: only the host's player drives the schedule + creates the poll.
 */
export function useAdTemplateTriggers(roomId, currentTime, isHost) {
  const firedRef = useRef(new Set());
  const templatesRef = useRef([]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await base44.entities.AdTemplate.filter({ room_id: roomId, status: 'active' }, '-trigger_offset_seconds', 50);
        if (!cancelled) templatesRef.current = list;
      } catch {}
    };
    load();
    let unsub;
    try { unsub = base44.entities.AdTemplate.subscribe(() => load()); } catch {}
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [roomId]);

  useEffect(() => {
    if (!isHost) return;
    for (const t of templatesRef.current) {
      const offset = t.trigger_offset_seconds ?? 0;
      if (currentTime >= offset && !firedRef.current.has(t.id)) {
        firedRef.current.add(t.id);
        (async () => {
          try {
            if (t.poll_question && t.poll_options && t.poll_options.length >= 2 && t.ad_clip_url) {
              const me = await base44.auth.me();
              await base44.entities.Poll.create({
                room_id: 'ad:' + t.ad_clip_url,
                host_id: me.id,
                question: t.poll_question,
                options: t.poll_options,
                status: 'active',
                created_at: new Date().toISOString(),
              });
            }
            await base44.entities.AdTemplate.update(t.id, { status: 'fired' });
            toast.success(`Ad "${t.template_name}" fired`, {
              description: t.ad_clip_url ? 'Play the saved ad clip to surface its poll.' : 'Poll attached.',
            });
          } catch {}
        })();
      }
    }
  }, [currentTime, isHost]);
}