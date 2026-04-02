import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign, CreditCard, Zap, Clock, CheckCircle, AlertCircle,
  ArrowDownToLine, Link as LinkIcon, Banknote, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function PayoutsPage() {
  const qc = useQueryClient();
  const [stripeId, setStripeId] = useState('');
  const [bank4, setBank4] = useState('');
  const [connecting, setConnecting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payoutRecord, isLoading } = useQuery({
    queryKey: ['payout-record', user?.id],
    queryFn: () => base44.entities.CreatorPayout.filter({ creator_id: user.id }).then(r => r[0] || null),
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['payout-transactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ recipient_id: user.id }, '-created_date', 20),
    enabled: !!user,
  });

  const pendingTips = transactions
    .filter(t => t.type === 'tip' && t.status !== 'paid_out')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const connectMutation = useMutation({
    mutationFn: async () => {
      setConnecting(true);
      if (payoutRecord) {
        return await base44.entities.CreatorPayout.update(payoutRecord.id, {
          stripe_account_id: stripeId,
          stripe_connected: true,
          bank_last4: bank4,
          pending_balance: pendingTips,
        });
      } else {
        return await base44.entities.CreatorPayout.create({
          creator_id: user.id,
          stripe_account_id: stripeId,
          stripe_connected: true,
          bank_last4: bank4,
          pending_balance: pendingTips,
        });
      }
    },
    onSuccess: () => {
      toast.success('Stripe account connected!');
      qc.invalidateQueries(['payout-record', user?.id]);
      setConnecting(false);
      setStripeId('');
      setBank4('');
    },
    onError: () => setConnecting(false),
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const amount = payoutRecord?.pending_balance || pendingTips;
      if (amount <= 0) throw new Error('No balance to pay out');
      await base44.entities.CreatorPayout.update(payoutRecord.id, {
        pending_balance: 0,
        total_paid_out: (payoutRecord.total_paid_out || 0) + amount,
        last_payout_at: new Date().toISOString(),
        last_payout_amount: amount,
      });
      return amount;
    },
    onSuccess: (amount) => {
      toast.success(`$${amount.toFixed(2)} payout initiated! Arrives in 2-5 business days.`);
      qc.invalidateQueries(['payout-record', user?.id]);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.CreatorPayout.update(payoutRecord.id, {
        stripe_connected: false,
        stripe_account_id: '',
        bank_last4: '',
      });
    },
    onSuccess: () => {
      toast.success('Stripe account disconnected');
      qc.invalidateQueries(['payout-record', user?.id]);
    },
  });

  const balance = payoutRecord?.pending_balance ?? pendingTips;
  const isConnected = payoutRecord?.stripe_connected;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Banknote className="w-8 h-8 text-green-600" />
            Payouts
          </h1>
          <p className="text-muted-foreground mt-1">Manage your earnings and connect your bank account</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">Pending Balance</p>
                  <p className="text-2xl font-bold text-green-800">${balance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Paid Out</p>
                  <p className="text-2xl font-bold">${(payoutRecord?.total_paid_out || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Last Payout</p>
                  <p className="text-sm font-semibold">
                    {payoutRecord?.last_payout_at
                      ? new Date(payoutRecord.last_payout_at).toLocaleDateString()
                      : '—'}
                  </p>
                  {payoutRecord?.last_payout_amount > 0 && (
                    <p className="text-xs text-muted-foreground">${payoutRecord.last_payout_amount.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-violet-700" />
                </div>
                <div>
                  <CardTitle>Stripe Account</CardTitle>
                  <CardDescription>Connect your Stripe account to receive payouts</CardDescription>
                </div>
              </div>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1">
                  <AlertCircle className="w-3 h-3" /> Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <Banknote className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium">Bank account ending in {payoutRecord.bank_last4 || '****'}</p>
                    <p className="text-xs text-muted-foreground">Stripe ID: {payoutRecord.stripe_account_id}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  Disconnect Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your Stripe Connect account ID to link your bank account. You can find this in your{' '}
                  <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">
                    Stripe Dashboard
                  </a>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stripe-id">Stripe Account ID</Label>
                    <Input
                      id="stripe-id"
                      placeholder="acct_1..."
                      value={stripeId}
                      onChange={e => setStripeId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bank4">Bank Account Last 4</Label>
                    <Input
                      id="bank4"
                      placeholder="1234"
                      maxLength={4}
                      value={bank4}
                      onChange={e => setBank4(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={!stripeId || connectMutation.isPending || connecting}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <LinkIcon className="w-4 h-4" />
                  {connectMutation.isPending ? 'Connecting...' : 'Connect Stripe Account'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Payout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-green-600" />
              Request Payout
            </CardTitle>
            <CardDescription>Transfer your pending balance to your connected bank account</CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                Connect your Stripe account above before requesting a payout.
              </div>
            ) : balance <= 0 ? (
              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                <Zap className="w-5 h-5 shrink-0" />
                No pending balance. Keep streaming to earn tips!
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 mb-1">Available to pay out</p>
                  <p className="text-3xl font-bold text-green-800">${balance.toFixed(2)}</p>
                  <p className="text-xs text-green-600 mt-1">Arrives in 2–5 business days to bank ending in {payoutRecord?.bank_last4}</p>
                </div>
                <Button
                  onClick={() => payoutMutation.mutate()}
                  disabled={payoutMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {payoutMutation.isPending ? 'Processing...' : `Pay Out $${balance.toFixed(2)}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent tip transactions */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{t.sender_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">+${(t.amount || 0).toFixed(2)}</p>
                      <Badge variant="outline" className="text-[10px]">{t.status || 'pending'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}