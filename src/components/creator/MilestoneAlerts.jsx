import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Users, DollarSign, Radio, Zap } from 'lucide-react';

const MILESTONES = [
  { type: 'subscribers', thresholds: [1, 5, 10, 25, 50, 100, 250, 500, 1000], icon: Users, label: 'subscribers', color: 'from-[#800020] to-[#C0392B]' },
  { type: 'rooms', thresholds: [1, 5, 10, 25, 50], icon: Radio, label: 'streams', color: 'from-[#C0392B] to-[#D4854A]' },
  { type: 'revenue', thresholds: [10, 50, 100, 500, 1000, 5000], icon: DollarSign, label: 'earned', color: 'from-[#4A9B5E] to-[#6DBF7E]' },
];

function MilestoneToast({ milestone, onDismiss }) {
  const Icon = milestone.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.9 }}
      className={`relative flex items-center gap-4 p-4 pr-10 rounded-2xl bg-gradient-to-r ${milestone.color} text-white shadow-2xl max-w-sm w-full`}
    >
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
        <Trophy className="w-6 h-6" />
      </div>
      <div>
        <p className="font-bold text-sm">🎉 Milestone Reached!</p>
        <p className="text-white/90 text-sm font-medium">
          {milestone.value} {milestone.label}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-white/80 text-white/80" />)}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export default function MilestoneAlerts({ creatorId }) {
  const [shown, setShown] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shownMilestones') || '[]'); } catch { return []; }
  });
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['milestone-subs', creatorId],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: creatorId, status: 'active' }),
    enabled: !!creatorId,
    refetchInterval: 60000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['milestone-rooms', creatorId],
    queryFn: () => base44.entities.Room.filter({ host_id: creatorId }),
    enabled: !!creatorId,
    refetchInterval: 60000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['milestone-txns', creatorId],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: creatorId }),
    enabled: !!creatorId,
    refetchInterval: 60000,
  });

  useEffect(() => {
    const counts = {
      subscribers: subscriptions.length,
      rooms: rooms.length,
      revenue: transactions.reduce((s, t) => s + (t.amount || 0), 0),
    };

    const newMilestones = [];
    MILESTONES.forEach(({ type, thresholds, icon, label, color }) => {
      thresholds.forEach(threshold => {
        const key = `${type}_${threshold}`;
        if (counts[type] >= threshold && !shown.includes(key)) {
          newMilestones.push({ key, value: type === 'revenue' ? `$${threshold}` : threshold, icon, label, color });
        }
      });
    });

    if (newMilestones.length > 0) {
      const newKeys = newMilestones.map(m => m.key);
      const updatedShown = [...shown, ...newKeys];
      setShown(updatedShown);
      localStorage.setItem('shownMilestones', JSON.stringify(updatedShown));
      setQueue(prev => [...prev, ...newMilestones]);
    }
  }, [subscriptions, rooms, transactions]);

  // Process queue one at a time
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setTimeout(() => setCurrent(null), 6000);
    }
  }, [queue, current]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
      <AnimatePresence>
        {current && (
          <div className="pointer-events-auto">
            <MilestoneToast
              key={current.key}
              milestone={current}
              onDismiss={() => setCurrent(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}