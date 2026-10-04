import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Radio, Play, Square, Clock, Loader2, Vote } from 'lucide-react';
import { toast } from 'sonner';
import { useLiveSync } from '@/hooks/useLiveSync';

const G = '#D4AF37';
const EM = '#6DBF7E';
const OR = '#D4854A';
const BORDER = 'rgba(212,175,55,0.15)';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function fmtOffset(sec) {
  const m = Math.floor((sec || 0) / 60);
  const s = Math.floor((sec || 0) % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseOffset(str) {
  const parts = String(str || '').split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Pick a pre-saved ad template and put it on air. Arming binds the template to
 * the broadcast the host is running right now, so the player fires it at the
 * chosen offset and its poll launches to the room automatically.
 *
 * The armed choice is mirrored across devices through useLiveSync, so the phone
 * shows exactly what the desktop just did.
 */
export default function LiveAdTemplates({ user }) {
  const qc = useQueryClient();
  const [offset, setOffset] = useState('0:00');
  const [busy, setBusy] = useState(false);

  const { data: parties = [] } = useQuery({
    queryKey: ['ad-live-parties', user?.id],
    queryFn: () => base44.entities.WatchParty.filter({ host_id: user.id }, '-created_date', 5),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  const liveParty =
    parties.find((p) => p.status === 'live') ||
    parties.find((p) => p.status === 'active') ||
    null;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['ad-live-templates', user?.id],
    queryFn: () => base44.entities.AdTemplate.filter({ creator_id: user.id }, '-created_date', 20),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  const { value: armed, push } = useLiveSync('ad_armed_template', { roomId: liveParty?.id, user });
  const armedTemplate = armed?.template_id ? templates.find((t) => t.id === armed.template_id) : null;

  const launch = async (tpl) => {
    if (!liveParty) {
      toast.error('No live broadcast running', { description: 'Start a broadcast first, then arm the ad.' });
      return;
    }
    setBusy(true);
    try {
      const seconds = parseOffset(offset);
      await base44.entities.AdTemplate.update(tpl.id, {
        room_id: liveParty.id,
        trigger_offset_seconds: seconds,
        status: 'active',
      });
      await push({
        template_id: tpl.id,
        name: tpl.template_name,
        offset_seconds: seconds,
        at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ['ad-live-templates'] });
      toast.success(`"${tpl.template_name}" is on air`, {
        description: tpl.poll_question
          ? `Poll launches at ${fmtOffset(seconds)}.`
          : `Fires at ${fmtOffset(seconds)}. Add a poll to the template to launch votes.`,
      });
    } catch {
      toast.error('Could not arm that ad');
    } finally {
      setBusy(false);
    }
  };

  const standDown = async () => {
    if (!armedTemplate) return;
    setBusy(true);
    try {
      await base44.entities.AdTemplate.update(armedTemplate.id, { status: 'draft', room_id: '' });
      await push(null);
      qc.invalidateQueries({ queryKey: ['ad-live-templates'] });
      toast.info('Ad taken off air');
    } catch {
      toast.error('Could not take that ad off air');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl p-4"
      style={{ background: 'rgba(13,16,34,0.95)', border: `1px solid ${BORDER}` }}>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4" style={{ color: G }} />
          <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: G, ...T }}>
            Live Ad Polls
          </h2>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black"
          style={{
            background: liveParty ? `${EM}14` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${liveParty ? `${EM}35` : 'rgba(255,255,255,0.08)'}`,
            color: liveParty ? EM : 'rgba(255,255,255,0.4)',
            ...T,
          }}>
          <Radio className="w-3 h-3" />
          {liveParty ? `ON AIR · ${liveParty.title || 'Untitled broadcast'}` : 'NO LIVE BROADCAST'}
        </span>
      </div>

      {armedTemplate && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-3"
          style={{ background: `${G}10`, border: `1px solid ${G}40` }}>
          <Vote className="w-4 h-4 shrink-0" style={{ color: G }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-white truncate" style={T}>
              Armed: {armedTemplate.template_name}
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
              {armedTemplate.status === 'fired'
                ? 'Fired — poll is live in the room'
                : `Poll launches at ${fmtOffset(armed?.offset_seconds)}`}
            </p>
          </div>
          {armedTemplate.status !== 'fired' && (
            <button onClick={standDown} disabled={busy}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black uppercase shrink-0 disabled:opacity-40"
              style={{ background: 'rgba(192,57,43,0.14)', border: '1px solid rgba(192,57,43,0.4)', color: '#ef4444', ...T }}>
              <Square className="w-3 h-3" /> Off air
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: OR }} />
        <span className="text-[11px] font-black uppercase shrink-0" style={{ color: 'rgba(255,255,255,0.45)', ...T }}>
          Fire at
        </span>
        <input
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          placeholder="0:00"
          aria-label="Ad trigger offset in minutes and seconds"
          className="w-20 rounded-lg px-2 py-2 text-[12px] text-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: OR, fontFamily: 'Share Tech Mono, monospace' }}
        />
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
          min:sec into the broadcast
        </span>
      </div>

      {isLoading && <p className="text-xs text-white/40 py-4 text-center">Loading…</p>}

      {!isLoading && templates.length === 0 && (
        <p className="text-xs text-white/40 py-4 text-center">
          No saved ad templates yet — build one in the Product Ad Studio.
        </p>
      )}

      <div className="space-y-1.5">
        {templates.map((tpl) => {
          const isArmed = armedTemplate?.id === tpl.id;
          return (
            <div key={tpl.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: isArmed ? `${G}0D` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isArmed ? `${G}40` : 'transparent'}`,
              }}>
              {tpl.product_image ? (
                <img src={tpl.product_image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.12)' }}>
                  <Megaphone className="w-4 h-4" style={{ color: G }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/85 leading-tight truncate" style={T}>{tpl.template_name}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                  {tpl.poll_question ? `Poll: ${tpl.poll_question}` : 'No poll attached'}
                </p>
              </div>
              <button
                onClick={() => launch(tpl)}
                disabled={busy || isArmed}
                aria-label={`Put ${tpl.template_name} on air`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black uppercase shrink-0 disabled:opacity-40"
                style={{ background: `${G}18`, border: `1px solid ${G}45`, color: G, ...T }}>
                {busy && isArmed ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isArmed ? 'On air' : 'Put on air'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}