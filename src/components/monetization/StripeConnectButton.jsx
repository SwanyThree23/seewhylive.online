import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle, ExternalLink, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { isSafeUrl } from '@/lib/security';

const GOLD = '#D4AF37';

export default function StripeConnectButton({ creatorId }) {
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: payout } = useQuery({
    queryKey: ['creator-payout', creatorId],
    queryFn: () => base44.entities.CreatorPayout.filter({ creator_id: creatorId }).then(r => r[0]),
    enabled: !!creatorId,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      setConnecting(true);
      if (!currentUser?.email) throw new Error('User email required');
      const res = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to connect Stripe');
      }
      const result = await res.json();

      if (payout?.id) {
        await base44.entities.CreatorPayout.update(payout.id, {
          stripe_account_id: result.accountId,
          stripe_connected: true,
        });
      } else {
        await base44.entities.CreatorPayout.create({
          creator_id: creatorId,
          stripe_account_id: result.accountId,
          stripe_connected: true,
          pending_balance: 0,
          total_paid_out: 0,
          payout_schedule: 'weekly',
        });
      }

      return result.onboardingUrl;
    },
    onSuccess: (url) => {
      qc.invalidateQueries({ queryKey: ['creator-payout', creatorId] });
      setConnecting(false);
      toast.success('Stripe account connected! Redirecting to onboarding...');
      if (creatorId) {
        base44.entities.Activity.create({
          user_id: creatorId,
          type: 'milestone',
          title: 'Connected Stripe payout account',
        }).catch(() => {});
      }
      if (url && isSafeUrl(url)) window.location.href = url;
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
      qc.invalidateQueries({ queryKey: ['creator-payout', creatorId] });
      toast.success('Stripe account disconnected');
    },
    onError: () => toast.error('Failed to disconnect Stripe.'),
  });

  const isConnected = payout?.stripe_connected;

  const cardStyle = {
    border: `2px solid ${isConnected ? '#6DBF7E' : 'rgba(212,175,55,0.25)'}`,
    borderRadius: 12,
    background: 'rgba(8,11,24,0.95)',
    color: '#fff',
    fontFamily: 'Barlow Condensed, sans-serif',
    overflow: 'hidden',
  };

  return (
    <div style={cardStyle}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard style={{ width: 20, height: 20 }} />
          <span style={{ fontWeight: 900, fontSize: 16 }}>Stripe Connect</span>
          {isConnected
            ? <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(109,191,126,0.15)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.3)', marginLeft: 'auto' }}>Connected</span>
            : <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.1)', color: '#D4854A', border: '1px solid rgba(212,133,74,0.3)', marginLeft: 'auto' }}>Not Connected</span>}
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#4A9B5E', background: 'rgba(109,191,126,0.08)', borderRadius: 8, padding: 12 }}>
              <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600 }}>Payouts enabled</p>
                <p style={{ fontSize: 12, color: '#4A9B5E' }}>Account: {payout?.stripe_account_id}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Pending Balance</p>
                <p style={{ fontWeight: 700, fontSize: 18 }}>${(payout?.pending_balance || 0).toFixed(2)}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Total Paid Out</p>
                <p style={{ fontWeight: 700, fontSize: 18 }}>${(payout?.total_paid_out || 0).toFixed(2)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                onClick={() => window.open('https://dashboard.stripe.com', '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink style={{ width: 16, height: 16 }} /> Stripe Dashboard
              </button>
              <button
                style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
                onClick={() => disconnectMutation.mutate()}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#C9A84C', background: 'rgba(212,175,55,0.08)', borderRadius: 8, padding: 12 }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600 }}>Connect Stripe to receive payouts</p>
                <p style={{ fontSize: 12, color: '#D4854A', marginTop: 2 }}>You earn 90% of all subscriptions and tips. Payouts via Stripe Express.</p>
              </div>
            </div>
            <ul style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign style={{ width: 12, height: 12, color: '#6DBF7E' }} /> Bronze: $1/mo · Silver: $5/mo · Gold: $15/mo</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign style={{ width: 12, height: 12, color: '#6DBF7E' }} /> 90% creator revenue split on all transactions</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign style={{ width: 12, height: 12, color: '#6DBF7E' }} /> Weekly automatic payouts to your bank</li>
            </ul>
            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', background: '#635bff', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', opacity: (connectMutation.isPending || connecting) ? 0.7 : 1 }}
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || connecting}
            >
              {connectMutation.isPending
                ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                : <CreditCard style={{ width: 16, height: 16 }} />}
              Connect Stripe Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
