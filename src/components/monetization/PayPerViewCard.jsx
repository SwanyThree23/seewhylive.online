import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Users, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const PANEL   = 'rgba(13,6,24,0.95)';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const ACCESS_LABELS = {
  single_event:      'Single Event',
  early_access:      'Early Access',
  exclusive_content: 'Exclusive',
};

const STATUS_CONFIG = {
  upcoming: { bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)',   color: GOLD,    label: 'Upcoming'  },
  live:     { bg: 'rgba(255,21,100,0.12)',  border: 'rgba(255,21,100,0.4)',   color: '#C0392B', label: '🔴 LIVE' },
  ended:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)', label: 'Ended' },
};

export default function PayPerViewCard({ event }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: hasAccess } = useQuery({
    queryKey: ['ppv-access', event.id, user?.id],
    queryFn: async () => {
      const access = await base44.entities.PayPerViewAccess.filter({ event_id: event.id, user_id: user.id });
      return access.length > 0;
    },
    enabled: !!user,
  });

  const purchaseAccessMutation = useMutation({
    mutationFn: async () => {
      const transaction = await base44.entities.Transaction.create({
        type: 'subscription',
        amount: event.price,
        from_user_id: user.id,
        room_id: event.room_id,
        community_id: event.community_id,
      });
      await base44.entities.PayPerViewAccess.create({
        event_id: event.id,
        user_id: user.id,
        amount_paid: event.price,
        transaction_id: transaction.id,
      });
      await base44.entities.PayPerViewEvent.update(event.id, {
        current_participants: (event.current_participants || 0) + 1,
        revenue: (event.revenue || 0) + event.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppv-access'] });
      queryClient.invalidateQueries({ queryKey: ['ppv-events'] });
      toast.success('Access granted! Enjoy the event 🎉');
    },
    onError: () => toast.error('Purchase failed — please try again'),
  });

  const isSoldOut = event.max_participants && (event.current_participants || 0) >= event.max_participants;
  const sc        = STATUS_CONFIG[event.status] || STATUS_CONFIG.upcoming;
  const eventDate = event.event_date ? new Date(event.event_date) : null;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: PANEL, border: `1px solid rgba(212,175,55,0.12)` }}>

      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${CRIMSON}44, rgba(13,6,24,0.9))` }}>
        {event.thumbnail_url && (
          <img src={event.thumbnail_url} alt={event.title}
            className="w-full h-full object-cover absolute inset-0" />
        )}

        {/* Lock overlay when not purchased */}
        {!hasAccess && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(212,175,55,0.4)' }}>
              <Lock className="w-5 h-5" style={{ color: GOLD }} />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-black uppercase"
          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, ...T,
            animation: event.status === 'live' ? 'pulse 2s infinite' : 'none' }}>
          {sc.label}
        </div>

        {/* Access type chip */}
        {event.access_type && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', ...T }}>
            {ACCESS_LABELS[event.access_type] || event.access_type}
          </div>
        )}

        {/* Purchased badge */}
        {hasAccess && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}50`, ...T }}>
            <CheckCircle className="w-3 h-3" style={{ color: GREEN }} />
            <span className="text-[10px] font-black uppercase" style={{ color: GREEN }}>Purchased</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-sm text-white leading-snug flex-1" style={T}>{event.title}</h3>
          <div className="text-right shrink-0">
            <span className="text-xl font-black" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>
              ${event.price}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-[11px] line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
            {event.description}
          </p>
        )}

        {/* Meta row */}
        <div className="space-y-1.5">
          {eventDate && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
              <Calendar className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
              <span>{format(eventDate, 'MMM d, yyyy')}</span>
              <span>·</span>
              <Clock className="w-3 h-3 shrink-0" />
              <span>{format(eventDate, 'h:mm a')}</span>
              {event.duration_minutes && <span>· {event.duration_minutes}m</span>}
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
            <Users className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
            <span>{event.current_participants || 0} attending</span>
            {event.max_participants && (
              <>
                <span>/</span>
                <span>{event.max_participants} max</span>
              </>
            )}
          </div>
        </div>

        {/* CTA button */}
        <div className="mt-auto pt-1">
          {!hasAccess ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => purchaseAccessMutation.mutate()}
              disabled={isSoldOut || purchaseAccessMutation.isPending || event.status === 'ended'}
              className="w-full py-2.5 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-1.5"
              style={{
                ...T,
                background: isSoldOut || event.status === 'ended'
                  ? 'rgba(255,255,255,0.06)'
                  : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`,
                border: 'none',
                color: isSoldOut || event.status === 'ended' ? 'rgba(255,255,255,0.25)' : '#07050A',
                cursor: isSoldOut || event.status === 'ended' ? 'default' : 'pointer',
              }}>
              {purchaseAccessMutation.isPending ? (
                'Processing…'
              ) : isSoldOut ? (
                'Sold Out'
              ) : event.status === 'ended' ? (
                'Event Ended'
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5" />
                  Purchase Access — ${event.price}
                </>
              )}
            </motion.button>
          ) : (
            <div className="w-full py-2.5 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-1.5"
              style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}40`, color: GREEN, ...T }}>
              <CheckCircle className="w-3.5 h-3.5" />
              Join Event
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
