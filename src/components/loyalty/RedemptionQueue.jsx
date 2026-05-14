import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function RedemptionQueue({ creatorId, roomId }) {
  const qc = useQueryClient();

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions', creatorId, roomId],
    queryFn: () => base44.entities.RewardRedemption.filter({ creator_id: creatorId, status: 'pending' }),
    enabled: !!creatorId,
    refetchInterval: 5000,
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.RewardRedemption.update(id, { status, fulfilled_at: new Date().toISOString() }),
    onSuccess: () => {
      toast.success('Reward updated!');
      qc.invalidateQueries(['redemptions', creatorId, roomId]);
    },
  });

  if (redemptions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-[#d4af37]" />
        <span className="text-[10px] font-bold uppercase text-white/50" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Pending Redemptions
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
          {redemptions.length}
        </span>
      </div>

      <AnimatePresence>
        {redemptions.map(r => (
          <motion.div key={r.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black text-white">{r.user_name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>
                  {r.reward_name}
                </span>
              </div>
              {r.message && <p className="text-[10px] text-white/60 mt-0.5 italic">"{r.message}"</p>}
              <p className="text-[9px] text-white/30 mt-0.5">{r.points_spent} pts spent</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => fulfillMutation.mutate({ id: r.id, status: 'fulfilled' })}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Check className="w-3.5 h-3.5 text-green-400" />
              </button>
              <button onClick={() => fulfillMutation.mutate({ id: r.id, status: 'rejected' })}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}