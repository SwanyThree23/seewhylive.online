import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw } from 'lucide-react';

const statusColors = {
  active:    { background: 'rgba(34,197,94,0.15)',  color: '#22c55e',           border: '1px solid rgba(34,197,94,0.3)' },
  cancelled: { background: 'rgba(239,68,68,0.15)',  color: '#ef4444',           border: '1px solid rgba(239,68,68,0.3)' },
  expired:   { background: 'rgba(107,114,128,0.15)',color: '#9ca3af',           border: '1px solid rgba(107,114,128,0.3)' },
  paused:    { background: 'rgba(234,179,8,0.15)',  color: '#eab308',           border: '1px solid rgba(234,179,8,0.3)' },
};

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

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(3)].map((_, i) => <div key={i} style={{ height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
    </div>
  );

  if (subs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
      <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
      <p>You haven't subscribed to any creator yet.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {subs.map((sub, idx) => (
        <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
          <div style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{sub.tier_name}</span>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, ...(statusColors[sub.status] || { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }) }}>
                  {sub.status}
                </span>
                {sub.auto_renew && sub.status === 'active' && (
                  <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw style={{ width: 10, height: 10 }} /> Auto-renew
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: sub.benefits_snapshot?.length > 0 ? 6 : 0 }}>
                <Calendar style={{ width: 14, height: 14 }} />
                {sub.end_date ? `Renews ${new Date(sub.end_date).toLocaleDateString()}` : 'Active'}
                {' · '}${sub.price}/mo
              </div>
              {sub.benefits_snapshot?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {sub.benefits_snapshot.slice(0, 3).map((b, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}>{b}</span>
                  ))}
                  {sub.benefits_snapshot.length > 3 && (
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}>+{sub.benefits_snapshot.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            {sub.status === 'active' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button
                  style={{ fontSize: 12, height: 28, padding: '0 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                  onClick={() => toggleRenewMutation.mutate({ id: sub.id, auto_renew: !sub.auto_renew })}
                >
                  {sub.auto_renew ? 'Disable Renew' : 'Enable Renew'}
                </button>
                <button
                  style={{ fontSize: 12, height: 28, padding: '0 10px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: cancelMutation.isPending ? 'not-allowed' : 'pointer', opacity: cancelMutation.isPending ? 0.6 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
                  onClick={() => cancelMutation.mutate(sub.id)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
