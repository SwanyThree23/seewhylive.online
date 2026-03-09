import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw } from 'lucide-react';

export default function MySubscriptions({ userId }) {
  const qc = useQueryClient();

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['allUserSubs', userId],
    queryFn: () => base44.entities.Subscription.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.Subscription.update(id, { status: 'cancelled', auto_renew: false }),
    onSuccess: () => {
      toast.info('Subscription cancelled');
      qc.invalidateQueries(['allUserSubs', userId]);
    },
  });

  const toggleRenewMutation = useMutation({
    mutationFn: ({ id, auto_renew }) => base44.entities.Subscription.update(id, { auto_renew }),
    onSuccess: () => qc.invalidateQueries(['allUserSubs', userId]),
  });

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-800',
  };

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>;

  if (subs.length === 0) return (
    <div className="text-center py-10 text-muted-foreground">
      <p className="text-3xl mb-2">📭</p>
      <p>You haven't subscribed to any creator yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {subs.map((sub, idx) => (
        <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
          <Card>
            <CardContent className="py-4 px-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{sub.tier_name}</span>
                  <Badge className={statusColors[sub.status] || 'bg-gray-100'} variant="secondary">
                    {sub.status}
                  </Badge>
                  {sub.auto_renew && sub.status === 'active' && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <RefreshCw className="w-2.5 h-2.5" /> Auto-renew
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {sub.end_date ? `Renews ${new Date(sub.end_date).toLocaleDateString()}` : 'Active'}
                  {' · '}${sub.price}/mo
                </div>
                {sub.benefits_snapshot?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {sub.benefits_snapshot.slice(0, 3).map((b, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{b}</Badge>
                    ))}
                    {sub.benefits_snapshot.length > 3 && <Badge variant="outline" className="text-xs">+{sub.benefits_snapshot.length - 3}</Badge>}
                  </div>
                )}
              </div>
              {sub.status === 'active' && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => toggleRenewMutation.mutate({ id: sub.id, auto_renew: !sub.auto_renew })}
                  >
                    {sub.auto_renew ? 'Disable Renew' : 'Enable Renew'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-destructive hover:text-destructive"
                    onClick={() => cancelMutation.mutate(sub.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}