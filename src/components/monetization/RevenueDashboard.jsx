import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, CreditCard, Users, ArrowUpRight, Download } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function exportCSV(transactions, subscriptions) {
  const rows = [
    ['Type', 'Amount', 'Date', 'Description'],
    ...transactions.map(t => [t.type || 'transaction', `$${t.amount || 0}`, new Date(t.created_date).toLocaleDateString(), t.description || '']),
    ...subscriptions.map(s => ['subscription', `$${s.price || 0}/mo`, new Date(s.created_date).toLocaleDateString(), s.tier_name || '']),
  ];
  const csv = rows.map(r => r.map(v => JSON.stringify(v)).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `revenue_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function RevenueDashboard({ userId }) {
  const { data: transactions = [] } = useQuery({
    queryKey: ['userEarnings', userId],
    queryFn: () => base44.entities.Transaction.filter({ to_user_id: userId }),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['activeSubscribers', userId],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: userId, status: 'active' }),
  });

  // Calculate earnings with 90/10 split
  const grossEarnings = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const platformFee = grossEarnings * 0.10;
  const processingFee = transactions.length * 0.30 + (grossEarnings * 0.029);
  const netEarnings = grossEarnings - platformFee - processingFee;

  // Subscription breakdown
  const tierCounts = subscriptions.reduce((acc, sub) => {
    acc[sub.tier] = (acc[sub.tier] || 0) + 1;
    return acc;
  }, {});

  const tierData = [
    { name: 'Bronze', price: 1, count: tierCounts.bronze || 0, color: '#ea580c' },
    { name: 'Silver', price: 5, count: tierCounts.premium || 0, color: '#9ca3af' },
    { name: 'Gold', price: 15, count: tierCounts.elite || 0, color: GOLD },
  ];

  const monthlyRecurring = tierData.reduce((sum, tier) => sum + (tier.price * tier.count), 0);

  const statCardStyle = (border) => ({
    background: '#2A1F1F',
    border: border || `1px solid ${CRIMSON}80`,
    borderRadius: 12,
    padding: 16,
    ...T,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, background: '#3C2F2F', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: GOLD, margin: '0 0 4px', ...T }}>Revenue Dashboard</h2>
          <p style={{ color: '#F5E6D3', fontSize: 13, margin: 0, ...T }}>Your creator earnings breakdown</p>
        </div>
        <button
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, background: `linear-gradient(to right, ${CRIMSON}, ${GOLD})`, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13, ...T }}
          onClick={() => { exportCSV(transactions, subscriptions); toast.success('Revenue report exported!'); }}
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Net Earnings */}
        <div style={{ ...statCardStyle(`2px solid ${GOLD}`), boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
          <p style={{ color: '#F5E6D3', fontSize: 12, margin: '0 0 4px', ...T }}>Your Cut (90%)</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: GOLD, ...T }}>${netEarnings.toFixed(2)}</span>
            <TrendingUp className="w-6 h-6" style={{ color: '#6DBF7E' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#9ca3af' }}>Available for payout</span>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: '#16a34a', color: '#fff', ...T }}>Ready</span>
          </div>
        </div>

        {/* Gross Revenue */}
        <div style={statCardStyle()}>
          <p style={{ color: '#F5E6D3', fontSize: 12, margin: '0 0 4px', ...T }}>Gross Revenue</p>
          <p style={{ fontSize: 28, color: '#F5E6D3', fontWeight: 700, margin: '0 0 8px', ...T }}>${grossEarnings.toFixed(2)}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{transactions.length} transactions</p>
        </div>

        {/* MRR */}
        <div style={statCardStyle()}>
          <p style={{ color: '#F5E6D3', fontSize: 12, margin: '0 0 4px', ...T }}>Monthly Recurring</p>
          <p style={{ fontSize: 28, color: '#F5E6D3', fontWeight: 700, margin: '0 0 8px', ...T }}>${monthlyRecurring.toFixed(2)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <Users className="w-3 h-3" style={{ color: GOLD }} />
            <span style={{ color: '#9ca3af' }}>{subscriptions.length} subscribers</span>
          </div>
        </div>

        {/* Platform Fee */}
        <div style={statCardStyle()}>
          <p style={{ color: '#F5E6D3', fontSize: 12, margin: '0 0 4px', ...T }}>Platform Fee (10%)</p>
          <p style={{ fontSize: 28, color: '#F5E6D3', fontWeight: 700, margin: '0 0 8px', ...T }}>${platformFee.toFixed(2)}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>+ ${processingFee.toFixed(2)} processing</p>
        </div>
      </div>

      {/* Subscription Tiers Breakdown */}
      <div style={{ ...statCardStyle(), padding: 0 }}>
        <div style={{ padding: '16px 20px 0' }}>
          <h3 style={{ color: GOLD, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px', ...T }}>
            <CreditCard className="w-5 h-5" />
            Subscription Breakdown
          </h3>
          <p style={{ color: '#F5E6D3', fontSize: 12, margin: '0 0 16px', ...T }}>Active subscriber counts by tier</p>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {tierData.map((tier) => (
            <div key={tier.name} style={{ background: '#3C2F2F', border: `1px solid ${CRIMSON}4D`, borderRadius: 12, padding: 24, cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: tier.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{tier.name.charAt(0)}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, border: `1px solid ${GOLD}`, color: GOLD, ...T }}>
                  ${tier.price}/mo
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F5E6D3', margin: '0 0 4px', ...T }}>{tier.name} Tier</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: GOLD, ...T }}>{tier.count}</span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>subscribers</span>
              </div>
              <div style={{ fontSize: 13, color: '#F5E6D3', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${CRIMSON}4D`, ...T }}>
                Monthly Revenue: <span style={{ fontWeight: 700, color: GOLD }}>${(tier.price * tier.count * 0.9).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Split Visualization */}
      <div style={{ ...statCardStyle(), padding: 0 }}>
        <div style={{ padding: '16px 20px 0' }}>
          <h3 style={{ color: GOLD, fontWeight: 700, fontSize: 16, margin: '0 0 4px', ...T }}>90/10 Split Breakdown</h3>
          <p style={{ color: '#F5E6D3', fontSize: 12, margin: '0 0 16px', ...T }}>How your earnings are distributed</p>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Visual Split Bar */}
          <div style={{ height: 64, background: '#3C2F2F', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '90%', background: `linear-gradient(to right, ${GOLD}, ${CRIMSON})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              90% TO YOU
            </div>
            <div style={{ width: '10%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}>
              10%
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <div style={{ padding: 16, background: '#3C2F2F', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#F5E6D3', ...T }}>Your Earnings</span>
                <ArrowUpRight className="w-4 h-4" style={{ color: '#6DBF7E' }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: GOLD, margin: '0 0 4px', ...T }}>${netEarnings.toFixed(2)}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>90% of gross</p>
            </div>

            <div style={{ padding: 16, background: '#3C2F2F', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#F5E6D3', ...T }}>Platform Share</span>
                <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#F5E6D3', margin: '0 0 4px', ...T }}>${(platformFee + processingFee).toFixed(2)}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>10% + processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
