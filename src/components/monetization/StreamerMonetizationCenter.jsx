import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Zap, Heart, Gift, Users, TrendingUp, DollarSign } from 'lucide-react';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const RevenueCard = ({ icon: IconComponent, label, amount, growth, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 16 }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 600, margin: 0, ...T }}>{label}</p>
      <div style={{ padding: 8, borderRadius: 8, background: `${color}20` }}>
        <IconComponent className="w-4 h-4" style={{ color }} />
      </div>
    </div>
    <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', ...T }}>${amount.toLocaleString()}</p>
    <p style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, margin: 0, ...T }}>↑ {growth}% this month</p>
  </motion.div>
);

const TABS = ['subscriptions', 'supporters', 'analytics'];
const TAB_LABELS = { subscriptions: 'Subs', supporters: 'Top Fans', analytics: 'Analytics' };

const StreamerMonetizationCenter = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('subscriptions');

  const revenueBreakdown = [
    { label: 'Tips', amount: 1250, growth: 35, color: '#C0392B' },
    { label: 'Subscriptions', amount: 3420, growth: 22, color: '#C9A84C' },
    { label: 'Virtual Goods', amount: 890, growth: 15, color: GOLD },
    { label: 'Sponsorships', amount: 2100, growth: 48, color: '#D4AF37' }
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
      style={{ background: 'rgba(26,10,46,0.5)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, ...T }}>
          <DollarSign className="w-5 h-5" style={{ color: GOLD }} />
          Monetization Center
        </h2>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0, ...T }}>Manage your streaming revenue & supporter relationships</p>
      </div>

      {/* Total Revenue Banner */}
      <div style={{ background: 'linear-gradient(to right, rgba(212,175,55,0.2), rgba(212,175,55,0.2))', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px', ...T }}>Total This Month</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, ...T }}>${totalRevenue.toLocaleString()}</p>
          </div>
          <TrendingUp className="w-8 h-8" style={{ color: '#4ade80' }} />
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
      <div style={{ width: '100%' }}>
        {/* Tab List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 2, gap: 2 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 11, padding: '6px 4px', borderRadius: 6, border: 'none', cursor: 'pointer', ...T,
                background: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: activeTab === tab ? 700 : 400,
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeTab === 'subscriptions' && subscriptionTiers.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', margin: 0, ...T }}>{tier.name} Tier</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, ...T }}>${tier.price}/month</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', margin: 0, ...T }}>{tier.members}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, ...T }}>members</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', ...T }}>Monthly Revenue:</span>
                <span style={{ fontWeight: 700, color: GOLD, ...T }}>${tier.revenue}</span>
              </div>
            </motion.div>
          ))}

          {activeTab === 'supporters' && topSupporters.map((supporter, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(to bottom right, #800020, #D4854A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', ...T }}>#{idx + 1}</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', margin: 0, ...T }}>{supporter.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, ...T }}>{supporter.subs} active subs</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, margin: 0, ...T }}>${supporter.tips}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, ...T }}>tips</p>
              </div>
            </motion.div>
          ))}

          {activeTab === 'analytics' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', margin: '0 0 12px', ...T }}>Key Metrics</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Conversion Rate:', value: '8.2%' },
                  { label: 'Avg. Tip Value:', value: '$12.50' },
                  { label: 'Churn Rate:', value: '3.1%' },
                  { label: 'Lifetime Value:', value: '$285' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', ...T }}>{label}</span>
                    <span style={{ fontWeight: 700, color: '#fff', ...T }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payout Info */}
      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: 12 }}>
        <p style={{ fontSize: 10, color: '#C9A84C', fontWeight: 600, margin: '0 0 4px', ...T }}>Next Payout</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#bfdbfe', ...T }}>$3,847 on May 31, 2026</span>
          <span style={{ fontSize: 11, background: 'rgba(201,168,76,0.2)', color: '#C9A84C', padding: '4px 8px', borderRadius: 4, ...T }}>Ready to withdraw</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StreamerMonetizationCenter;
