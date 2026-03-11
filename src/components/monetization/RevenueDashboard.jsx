import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, CreditCard, Users, ArrowUpRight, Download } from 'lucide-react';
import { toast } from 'sonner';

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
  const processingFee = transactions.length * 0.30 + (grossEarnings * 0.029); // Stripe-like fees
  const netEarnings = grossEarnings - platformFee - processingFee;

  // Subscription breakdown
  const tierCounts = subscriptions.reduce((acc, sub) => {
    acc[sub.tier] = (acc[sub.tier] || 0) + 1;
    return acc;
  }, {});

  const tierData = [
    { name: 'Bronze', price: 1, count: tierCounts.bronze || 0, color: 'bg-orange-600' },
    { name: 'Silver', price: 5, count: tierCounts.premium || 0, color: 'bg-gray-400' },
    { name: 'Gold', price: 15, count: tierCounts.elite || 0, color: 'bg-[#D4AF37]' },
  ];

  const monthlyRecurring = tierData.reduce((sum, tier) => sum + (tier.price * tier.count), 0);

  return (
    <div className="space-y-6 p-6 bg-[#3C2F2F] rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#D4AF37]">Revenue Dashboard</h2>
          <p className="text-[#F5E6D3] text-sm mt-1">Your creator earnings breakdown</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#800020] to-[#D4AF37] text-white"
          onClick={() => { exportCSV(transactions, subscriptions); toast.success('Revenue report exported!'); }}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Earnings Card */}
        <Card className="bg-[#2A1F1F] border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#F5E6D3]">Your Cut (90%)</CardDescription>
            <CardTitle className="text-4xl font-bold text-[#D4AF37] flex items-baseline gap-2">
              ${netEarnings.toFixed(2)}
              <TrendingUp className="w-6 h-6 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Available for payout</span>
              <Badge className="bg-green-600">Ready</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Gross Revenue */}
        <Card className="bg-[#2A1F1F] border border-[#800020]/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#F5E6D3]">Gross Revenue</CardDescription>
            <CardTitle className="text-3xl text-[#F5E6D3]">
              ${grossEarnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-400">
              {transactions.length} transactions
            </div>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card className="bg-[#2A1F1F] border border-[#800020]/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#F5E6D3]">Monthly Recurring</CardDescription>
            <CardTitle className="text-3xl text-[#F5E6D3]">
              ${monthlyRecurring.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-gray-400">{subscriptions.length} subscribers</span>
            </div>
          </CardContent>
        </Card>

        {/* Platform Fee */}
        <Card className="bg-[#2A1F1F] border border-[#800020]/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#F5E6D3]">Platform Fee (10%)</CardDescription>
            <CardTitle className="text-3xl text-[#F5E6D3]">
              ${platformFee.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-400">
              + ${processingFee.toFixed(2)} processing
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Tiers Breakdown */}
      <Card className="bg-[#2A1F1F] border border-[#800020]/50">
        <CardHeader>
          <CardTitle className="text-[#D4AF37] flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Breakdown
          </CardTitle>
          <CardDescription className="text-[#F5E6D3]">
            Active subscriber counts by tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tierData.map((tier) => (
              <Card key={tier.name} className="bg-[#3C2F2F] border border-[#800020]/30 hover:border-[#D4AF37] transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${tier.color} rounded-full flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-xl">
                        {tier.name.charAt(0)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[#D4AF37] border-[#D4AF37]">
                      ${tier.price}/mo
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-[#F5E6D3] mb-1">{tier.name} Tier</h3>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-[#D4AF37]">{tier.count}</span>
                    <span className="text-sm text-gray-400">subscribers</span>
                  </div>

                  <div className="text-sm text-[#F5E6D3] mt-3 pt-3 border-t border-[#800020]/30">
                    Monthly Revenue: <span className="font-bold text-[#D4AF37]">${(tier.price * tier.count * 0.9).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Split Visualization */}
      <Card className="bg-[#2A1F1F] border border-[#800020]/50">
        <CardHeader>
          <CardTitle className="text-[#D4AF37]">90/10 Split Breakdown</CardTitle>
          <CardDescription className="text-[#F5E6D3]">
            How your earnings are distributed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visual Split Bar */}
            <div className="h-16 bg-[#3C2F2F] rounded-lg overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-[#D4AF37] to-[#800020] flex items-center justify-center text-white font-bold"
                style={{ width: '90%' }}
              >
                90% TO YOU
              </div>
              <div
                className="bg-gray-700 flex items-center justify-center text-white text-xs"
                style={{ width: '10%' }}
              >
                10%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-[#3C2F2F] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#F5E6D3]">Your Earnings</span>
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-[#D4AF37]">${netEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">90% of gross</p>
              </div>

              <div className="p-4 bg-[#3C2F2F] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#F5E6D3]">Platform Share</span>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-[#F5E6D3]">${(platformFee + processingFee).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">10% + processing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}