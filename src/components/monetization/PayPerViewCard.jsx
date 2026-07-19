import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, DollarSign, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import moment from 'moment';

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
  live:     { bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.4)',   color: '#C0392B', label: '🔴 LIVE' },
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
      const access = await base44.entities.PayPerViewAccess.filter({
        event_id: event.id,
        user_id: user.id,
      });
      return access.length > 0;
    },
    enabled: !!user,
  });

  const purchaseAccessMutation = useMutation({
    mutationFn: async () => {
      // Create transaction
      const transaction = await base44.entities.Transaction.create({
        transaction_type: 'ppv',
        creator_payout: Math.floor(event.price * 90) / 100,
        platform_cut: event.price - Math.floor(event.price * 90) / 100,
        sender_id: user.id,
        room_id: event.room_id,
        community_id: event.community_id,
      });

      // Grant access
      await base44.entities.PayPerViewAccess.create({
        event_id: event.id,
        user_id: user.id,
        amount_paid: event.price,
        transaction_id: transaction.id,
      });

      // Update event stats
      await base44.entities.PayPerViewEvent.update(event.id, {
        current_participants: event.current_participants + 1,
        revenue: event.revenue + event.price,
      });

      // Log activity
      await base44.entities.Activity.create({
        user_id: user.id,
        type: 'ppv_purchase',
        title: `Purchased access: ${event.title || 'PPV Event'}`,
        amount: event.price,
      }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppv-access'] });
      queryClient.invalidateQueries({ queryKey: ['ppv-events'] });
      toast.success('Access granted! Enjoy the event 🎉');
    },
    onError: () => toast.error('Action failed.'),
  });

  const statusColors = {
    upcoming: 'bg-[#D4AF37]/12 text-[#800020]',
    live: 'bg-red-100 text-red-800 animate-pulse',
    ended: 'bg-gray-100 text-gray-800',
  };

  const accessTypeLabels = {
    single_event: 'Single Event',
    early_access: 'Early Access',
    exclusive_content: 'Exclusive Content',
  };

  const isSoldOut = event.max_participants && event.current_participants >= event.max_participants;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        {event.thumbnail_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.thumbnail_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {!hasAccess && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Lock className="w-12 h-12 text-white" />
              </div>
            )}
            <Badge className={`absolute top-3 right-3 ${statusColors[event.status]}`}>
              {event.status === 'live' ? '🔴 LIVE' : event.status.toUpperCase()}
            </Badge>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
              <Badge variant="outline">{accessTypeLabels[event.access_type]}</Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">${event.price}</p>
              {hasAccess && (
                <Badge className="mt-1 bg-[#6DBF7E]/15 text-[#6DBF7E]">
                  Purchased
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{moment(event.event_date).format('MMM D, YYYY')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{moment(event.event_date).format('h:mm A')}</span>
              {event.duration_minutes && (
                <span>• {event.duration_minutes} min</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {event.current_participants} attending
                {event.max_participants && ` / ${event.max_participants}`}
              </span>
            </div>
          </div>

          {!hasAccess ? (
            <Button
              onClick={() => purchaseAccessMutation.mutate()}
              disabled={isSoldOut || purchaseAccessMutation.isPending}
              className="w-full"
            >
              {isSoldOut ? (
                'Sold Out'
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Purchase Access
                </>
              )}
            </Button>
          ) : (
            <Button className="w-full" variant="secondary">
              Join Event
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}