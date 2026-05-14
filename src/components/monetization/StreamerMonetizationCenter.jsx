import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Zap, Heart, Gift, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RevenueCard = ({ icon: IconComponent, label, amount, growth, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 border border-white/10 rounded-lg p-4"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] text-white/60 uppercase font-semibold">{label}</p>
      <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
        <IconComponent className="w-4 h-4" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-black text-white mb-1">${amount.toLocaleString()}</p>
    <p className="text-[9px] text-green-400 font-semibold">↑ {growth}% this month</p>
  </motion.div>
);

const StreamerMonetizationCenter = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const revenueBreakdown = [
    { label: 'Tips', amount: 1250, growth: 35, color: '#FF1564' },
    { label: 'Subscriptions', amount: 3420, growth: 22, color: '#00F5FF' },
    { label: 'Virtual Goods', amount: 890, growth: 15, color: '#d4af37' },
    { label: 'Sponsorships', amount: 2100, growth: 48, color: '#8B5CF6' }
  ];

  const subscriptionTiers = [
    { name: 'Bronze', price: 4.99, members: 145, revenue: 724 },
    { name: 'Silver', price: 9.99, members: 82, revenue: 819 },
    { name: 'Gold', price: 19.99, members: 34, revenue: 680 }
  ];

  const topSupporters = [
    { name: 'xXProGamerXx', tips: 850, subs: 3 },
    { name: 'SilverStar92', tips: 650, subs: 1 },
    { name: 'LoyalFanatic', tips: 420, subs: 2 }
  ];

  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4 space-y-4"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-[#d4af37]" />
          Monetization Center
        </h2>
        <p className="text-[10px] text-white/60">Manage your streaming revenue & supporter relationships</p>
      </div>

      {/* Total Revenue Banner */}
      <div className="bg-gradient-to-r from-[#d4af37]/20 to-[#8B5CF6]/20 border border-[#d4af37]/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/60 uppercase font-semibold mb-1">Total This Month</p>
            <p className="text-3xl font-black text-white">${totalRevenue.toLocaleString()}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-400" />
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {revenueBreakdown.map((item, idx) => (
          <RevenueCard
            key={idx}
            icon={item.label === 'Tips' ? Zap : item.label === 'Subscriptions' ? Users : item.label === 'Virtual Goods' ? Gift : Heart}
            label={item.label}
            amount={item.amount}
            growth={item.growth}
            color={item.color}
          />
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="w-full bg-white/10 border border-white/10 grid grid-cols-3">
          <TabsTrigger value="subscriptions" className="text-[9px]">Subs</TabsTrigger>
          <TabsTrigger value="supporters" className="text-[9px]">Top Fans</TabsTrigger>
          <TabsTrigger value="analytics" className="text-[9px]">Analytics</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-2 mt-3">
          {subscriptionTiers.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] font-bold text-white">{tier.name} Tier</p>
                  <p className="text-[9px] text-white/60">${tier.price}/month</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white">{tier.members}</p>
                  <p className="text-[8px] text-white/50">members</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-white/60">Monthly Revenue:</span>
                <span className="font-bold text-[#d4af37]">${tier.revenue}</span>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* Top Supporters Tab */}
        <TabsContent value="supporters" className="space-y-2 mt-3">
          {topSupporters.map((supporter, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">#{idx + 1}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white">{supporter.name}</p>
                  <p className="text-[8px] text-white/50">{supporter.subs} active subs</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#d4af37]">${supporter.tips}</p>
                <p className="text-[8px] text-white/50">tips</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-2 mt-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-[10px] font-bold text-white mb-3">Key Metrics</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[9px]">
                <span className="text-white/60">Conversion Rate:</span>
                <span className="font-bold text-white">8.2%</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-white/60">Avg. Tip Value:</span>
                <span className="font-bold text-white">$12.50</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-white/60">Churn Rate:</span>
                <span className="font-bold text-white">3.1%</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-white/60">Lifetime Value:</span>
                <span className="font-bold text-white">$285</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payout Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-[10px] text-blue-300 font-semibold mb-1">Next Payout</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-blue-200">$3,847 on May 31, 2026</span>
          <span className="text-[9px] bg-blue-500/30 text-blue-300 px-2 py-1 rounded">Ready to withdraw</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StreamerMonetizationCenter;