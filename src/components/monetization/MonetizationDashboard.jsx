import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { TrendingUp, DollarSign, Zap } from 'lucide-react';

const G = '#d4af37';

export default function MonetizationDashboard({ roomId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [transactions, tips] = await Promise.all([
          base44.entities.Transaction.filter({ room_id: roomId }, '-created_date', 200).catch(() => []),
          base44.entities.TipAlert.filter({ room_id: roomId }, '-created_date', 200).catch(() => []),
        ]);
        const grossCents = [...transactions, ...tips].reduce((s, t) => s + (t.amount || 0), 0);
        const creatorCents = Math.floor(grossCents * 0.90);
        const platformCents = grossCents - creatorCents;
        setAnalytics({
          total_revenue: grossCents / 100,
          platform_cut: platformCents / 100,
          creator_earnings: creatorCents / 100,
          total_transactions: transactions.length,
          total_paywall_conversions: 0,
          net_creator_payout: creatorCents / 100,
        });
      } catch {}
      setLoading(false);
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [roomId]);

  if (loading) return <div className="text-xs text-white/50">Loading analytics...</div>;
  if (!analytics) return null;

  const metrics = [
    { label: 'Total Revenue', value: `$${analytics.total_revenue.toFixed(2)}`, icon: DollarSign, color: '#6DBF7E' },
    { label: 'Platform Cut (10%)', value: `$${analytics.platform_cut.toFixed(2)}`, icon: Zap, color: '#D4854A' },
    { label: 'Your Earnings', value: `$${analytics.creator_earnings.toFixed(2)}`, icon: TrendingUp, color: G },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg space-y-3"
      style={{ background: 'rgba(8,11,24,0.95)', border: `1px solid ${G}30` }}
    >
      <p className="text-xs font-bold" style={{ color: G }}>Monetization Analytics (24h)</p>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-2 rounded-lg"
              style={{ background: `${metric.color}15` }}
            >
              <Icon className="w-3 h-3 mb-1" style={{ color: metric.color }} />
              <p className="text-[11px] text-white/50">{metric.label}</p>
              <p className="text-xs font-bold" style={{ color: metric.color }}>{metric.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="text-[11px] text-white/40 space-y-1">
        <p>Transactions: <strong style={{ color: G }}>{analytics.total_transactions}</strong></p>
        <p>Paywall conversions: <strong style={{ color: G }}>{analytics.total_paywall_conversions}</strong></p>
        <p>Net payout: <strong style={{ color: '#6DBF7E' }}>${analytics.net_creator_payout.toFixed(2)}</strong></p>
      </div>
    </motion.div>
  );
}