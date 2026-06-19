import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp } from 'lucide-react';

const G = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function EarningsBreakdown({ creatorId }) {
  const { data: transactions } = useQuery({
    queryKey: ['creatorTransactions', creatorId],
    queryFn: () =>
      base44.entities.Transaction.filter(
        { creator_id: creatorId },
        '-created_date',
        100
      ),
    enabled: !!creatorId,
  });

  const breakdown = {
    tips: transactions?.filter(t => t.type === 'tip').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    subscriptions: transactions?.filter(t => t.type === 'subscription').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    ppv: transactions?.filter(t => t.type === 'ppv').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    total: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
  };

  const categories = [
    { label: 'Tips', value: breakdown.tips, icon: '💎', color: G },
    { label: 'Subscriptions', value: breakdown.subscriptions, icon: '👑', color: '#C9A84C' },
    { label: 'PPV Events', value: breakdown.ppv, icon: '🎫', color: '#6DBF7E' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5" style={{ color: G }} />
        <h3 className="text-lg font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
          Earnings Breakdown
        </h3>
      </div>

      {/* Total */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: `${G}15`, border: `1px solid ${G}30` }}>
        <p className="text-xs text-white/60 mb-1">Total Revenue</p>
        <p className="text-3xl font-black" style={{ color: G }}>
          ${breakdown.total.toFixed(2)}
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((cat, idx) => {
          const percentage = breakdown.total > 0 ? Math.round((cat.value / breakdown.total) * 100) : 0;
          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-bold text-white/70">{cat.label}</span>
                <span className="ml-auto text-xs font-bold" style={{ color: cat.color }}>
                  ${cat.value.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                  className="h-full"
                  style={{ background: cat.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}