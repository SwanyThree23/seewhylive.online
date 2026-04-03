import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, ExternalLink, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeConnectButton({ creatorId }) {
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const { data: payout } = useQuery({
    queryKey: ['creator-payout', creatorId],
    queryFn: () => base44.entities.CreatorPayout.filter({ creator_id: creatorId }).then(r => r[0]),
    enabled: !!creatorId,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      setConnecting(true);
      // Simulate Stripe Connect Express onboarding URL generation
      // In production, call your backend to create a Stripe Connect account & return onboarding URL
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a mock Stripe Connect Express onboarding response for creator ID: ${creatorId}.
Return JSON: { account_id: "acct_xxx", onboarding_url: "https://connect.stripe.com/express/onboarding/xxx" }`,
        response_json_schema: {
          type: 'object',
          properties: {
            account_id: { type: 'string' },
            onboarding_url: { type: 'string' },
          },
        },
      });

      // Upsert payout record
      if (payout?.id) {
        await base44.entities.CreatorPayout.update(payout.id, {
          stripe_account_id: result.account_id,
          stripe_connected: true,
        });
      } else {
        await base44.entities.CreatorPayout.create({
          creator_id: creatorId,
          stripe_account_id: result.account_id,
          stripe_connected: true,
          pending_balance: 0,
          total_paid_out: 0,
          payout_schedule: 'weekly',
        });
      }

      return result.onboarding_url;
    },
    onSuccess: (url) => {
      qc.invalidateQueries(['creator-payout', creatorId]);
      setConnecting(false);
      toast.success('Stripe account connected! Redirecting to onboarding...');
      // In production: window.open(url, '_blank')
      toast.info("In production, you would be redirected to Stripe's onboarding flow.");
    },
    onError: () => setConnecting(false),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (payout?.id) {
        await base44.entities.CreatorPayout.update(payout.id, {
          stripe_connected: false,
          stripe_account_id: '',
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['creator-payout', creatorId]);
      toast.success('Stripe account disconnected');
    },
  });

  const isConnected = payout?.stripe_connected;

  return (
    <Card className="border-2" style={{ borderColor: isConnected ? '#22c55e' : '#e2e8f0' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="w-5 h-5" />
          Stripe Connect
          {isConnected
            ? <Badge className="bg-green-100 text-green-700 border-green-300 ml-auto">Connected</Badge>
            : <Badge variant="outline" className="text-orange-600 border-orange-300 ml-auto">Not Connected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">Payouts enabled</p>
                <p className="text-xs text-green-600">Account: {payout?.stripe_account_id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Pending Balance</p>
                <p className="font-bold text-lg">${(payout?.pending_balance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Total Paid Out</p>
                <p className="font-bold text-lg">${(payout?.total_paid_out || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-2" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                <ExternalLink className="w-4 h-4" /> Stripe Dashboard
              </Button>
              <Button size="sm" variant="outline" onClick={() => disconnectMutation.mutate()}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Connect Stripe to receive payouts</p>
                <p className="text-xs text-amber-600 mt-0.5">You earn 90% of all subscriptions and tips. Payouts via Stripe Express.</p>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2"><DollarSign className="w-3 h-3 text-green-500" /> Bronze: $1/mo · Silver: $5/mo · Gold: $15/mo</li>
              <li className="flex items-center gap-2"><DollarSign className="w-3 h-3 text-green-500" /> 90% creator revenue split on all transactions</li>
              <li className="flex items-center gap-2"><DollarSign className="w-3 h-3 text-green-500" /> Weekly automatic payouts to your bank</li>
            </ul>
            <Button
              className="w-full gap-2 bg-[#635bff] hover:bg-[#4f46e5] text-white"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || connecting}
            >
              {connectMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CreditCard className="w-4 h-4" />}
              Connect Stripe Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}