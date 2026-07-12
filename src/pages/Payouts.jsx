import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, CreditCard, Zap, Clock, CheckCircle, AlertCircle,
  ArrowDownToLine, Link as LinkIcon, Banknote, TrendingUp, TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const GREEN   = '#6DBF7E';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
const card = {
  background: 'rgba(13,6,24,0.9)',
  border: `1px solid rgba(212,175,55,0.1)`,
  borderRadius: 16,
  padding: '20px 20px',
};

const inputStyle = {
  ...T,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  ...T,
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
};

/* ─── custom recharts tooltip ──────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      ...T,
      background: '#0d0618',
      border: `1px solid ${GOLD}44`,
      borderRadius: 8,
      padding: '8px 14px',
      fontSize: 13,
      color: '#fff',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: GREEN, fontWeight: 700 }}>${(payload[0].value || 0).toFixed(2)}</div>
    </div>
  );
}

export default function PayoutsPage() {
  const qc = useQueryClient();
  const [stripeId, setStripeId]     = useState('');
  const [bank4, setBank4]           = useState('');
  const [connecting, setConnecting] = useState(false);

  /* ─── queries ──────────────────────────────────────────────────────── */
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn:  () => base44.auth.me(),
  });

  const { data: payoutRecord, isLoading } = useQuery({
    queryKey: ['payout-record', user?.id],
    queryFn:  () => base44.entities.CreatorPayout.filter({ creator_id: user.id }).then(r => r[0] || null),
    enabled:  !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['payout-transactions', user?.id],
    queryFn:  () => base44.entities.Transaction.filter({ recipient_id: user.id }, '-created_date', 20),
    enabled:  !!user,
  });

  /* ─── derived ──────────────────────────────────────────────────────── */
  const pendingTips = transactions
    .filter(t => t.type === 'tip' && t.status !== 'paid_out')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance     = payoutRecord?.pending_balance ?? pendingTips;
  const isConnected = payoutRecord?.stripe_connected;

  /* ─── 30-day revenue chart data ────────────────────────────────────── */
  const chartData = useMemo(() => {
    const days   = 30;
    const result = [];
    const now    = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - i * 86400000;
      const dayEnd   = dayStart + 86400000;
      const label    = new Date(dayStart).toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const earned   = transactions
        .filter(t => {
          const d = new Date(t.created_date).getTime();
          return d >= dayStart && d < dayEnd;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      result.push({ label, earned });
    }
    return result;
  }, [transactions]);

  /* ─── mutations ────────────────────────────────────────────────────── */
  const connectMutation = useMutation({
    mutationFn: async () => {
      setConnecting(true);
      if (payoutRecord) {
        return await base44.entities.CreatorPayout.update(payoutRecord.id, {
          stripe_account_id: stripeId,
          stripe_connected:  true,
          bank_last4:        bank4,
          pending_balance:   pendingTips,
        });
      } else {
        return await base44.entities.CreatorPayout.create({
          creator_id:        user.id,
          stripe_account_id: stripeId,
          stripe_connected:  true,
          bank_last4:        bank4,
          pending_balance:   pendingTips,
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
    onError: () => { setConnecting(false); toast.error('Failed to connect Stripe. Please try again.'); },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.CreatorPayout.update(payoutRecord.id, {
        stripe_connected:  false,
        stripe_account_id: '',
        bank_last4:        '',
      });
    },
    onSuccess: () => {
      toast.success('Stripe account disconnected');
      qc.invalidateQueries(['payout-record', user?.id]);
    },
    onError: () => { toast.error('Failed to disconnect Stripe. Please try again.'); },
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const amount = payoutRecord?.pending_balance || pendingTips;
      if (amount <= 0) throw new Error('No balance to pay out');
      await base44.entities.CreatorPayout.update(payoutRecord.id, {
        pending_balance:     0,
        total_paid_out:      (payoutRecord.total_paid_out || 0) + amount,
        last_payout_at:      new Date().toISOString(),
        last_payout_amount:  amount,
      });
      return amount;
    },
    onSuccess: (amount) => {
      toast.success(`$${amount.toFixed(2)} payout initiated! Arrives in 2-5 business days.`);
      qc.invalidateQueries(['payout-record', user?.id]);
    },
    onError: () => { toast.error('Failed to process payout. Please try again.'); },
  });

  /* ─── loading ──────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: `3px solid rgba(212,175,55,0.2)`,
          borderTopColor: GOLD,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─── render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: BG, ...T }}>
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '20px 16px 32px' }}>

        {/* ── Sticky Header ─────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: BG,
          borderBottom: '1px solid rgba(212,175,55,0.08)',
          paddingBottom: 14, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={22} color={GOLD} />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              Payouts
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2, paddingLeft: 32 }}>
            Creator Revenue &amp; Payout Management
          </div>
        </div>

        {/* ── Balance Summary Cards ─────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}>
          {/* Pending Balance */}
          <div style={{ ...card, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Pending
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: balance > 0 ? GREEN : GOLD, lineHeight: 1 }}>
              ${balance.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>available</div>
          </div>

          {/* Total Paid Out */}
          <div style={{ ...card, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Total Paid
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
              ${(payoutRecord?.total_paid_out || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>all time</div>
          </div>

          {/* Stripe Status */}
          <div style={{ ...card, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Stripe
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 700,
              color: isConnected ? GREEN : '#FF9900',
              background: isConnected ? 'rgba(109,191,126,0.1)' : 'rgba(255,153,0,0.1)',
              border: `1px solid ${isConnected ? 'rgba(109,191,126,0.25)' : 'rgba(255,153,0,0.25)'}`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {isConnected
                ? <><CheckCircle size={12} /> Connected</>
                : <><AlertCircle size={12} /> Not Connected</>}
            </div>
          </div>
        </div>

        {/* ── Revenue Chart ─────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color={GOLD} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>30-Day Revenue</span>
          </div>

          {transactions.length === 0 ? (
            <div style={{
              height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.25)', fontSize: 13,
            }}>
              No transaction data yet
            </div>
          ) : (
            <>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif' }}
                    axisLine={false} tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(212,175,55,0.2)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#goldGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: GOLD, stroke: BG, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* ── Stripe Connection Card ────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 16 }}>
          {/* header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(212,175,55,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CreditCard size={16} color={GOLD} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Payment Account</span>
            </div>

            {/* status badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isConnected ? GREEN : '#FF9900',
              background: isConnected ? 'rgba(109,191,126,0.1)' : 'rgba(255,153,0,0.08)',
              border: `1px solid ${isConnected ? 'rgba(109,191,126,0.3)' : 'rgba(255,153,0,0.3)'}`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {isConnected ? <><CheckCircle size={10} /> Connected</> : <><AlertCircle size={10} /> Not Connected</>}
            </span>
          </div>

          {isConnected ? (
            /* connected state */
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '12px 14px',
                marginBottom: 12,
              }}>
                <Banknote size={18} color={GOLD} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    Bank account ending in {payoutRecord.bank_last4 || '****'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    Stripe ID: {payoutRecord.stripe_account_id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                style={{
                  ...T,
                  background: 'transparent',
                  border: '1px solid rgba(255,60,60,0.4)',
                  borderRadius: 8,
                  color: '#ff6060',
                  fontSize: 13, fontWeight: 600,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  opacity: disconnectMutation.isPending ? 0.5 : 1,
                }}
              >
                {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect Account'}
              </button>
            </div>
          ) : (
            /* not connected state */
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.5 }}>
                Enter your Stripe Connect account ID to link your bank account. Find it in your{' '}
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: GOLD, textDecoration: 'underline' }}
                >
                  Stripe Dashboard
                </a>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Stripe Account ID</label>
                  <input
                    style={inputStyle}
                    placeholder="acct_1..."
                    value={stripeId}
                    onChange={e => setStripeId(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bank Last 4</label>
                  <input
                    style={inputStyle}
                    placeholder="1234"
                    maxLength={4}
                    value={bank4}
                    onChange={e => setBank4(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button
                onClick={() => connectMutation.mutate()}
                disabled={!stripeId || connectMutation.isPending || connecting}
                style={{
                  ...T,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: CRIMSON,
                  border: 'none',
                  borderRadius: 8,
                  color: GOLD,
                  fontSize: 14, fontWeight: 900,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '10px 20px',
                  cursor: (!stripeId || connectMutation.isPending || connecting) ? 'not-allowed' : 'pointer',
                  opacity: (!stripeId || connectMutation.isPending || connecting) ? 0.5 : 1,
                }}
              >
                <LinkIcon size={15} />
                {connectMutation.isPending ? 'Connecting…' : 'Connect Stripe Account'}
              </button>
            </div>
          )}
        </div>

        {/* ── Payout Request Card ───────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ArrowDownToLine size={16} color={GREEN} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Request Payout</span>
          </div>

          {!isConnected ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,153,0,0.08)',
              border: '1px solid rgba(255,153,0,0.25)',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 13, color: '#FF9900',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              Connect Stripe account first before requesting a payout.
            </div>
          ) : balance <= 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 13, color: 'rgba(255,255,255,0.4)',
            }}>
              <Zap size={16} style={{ flexShrink: 0 }} />
              No pending balance. Keep streaming!
            </div>
          ) : (
            <div>
              <div style={{
                background: 'rgba(109,191,126,0.05)',
                border: '1px solid rgba(109,191,126,0.2)',
                borderRadius: 10, padding: '14px 16px',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 12, color: 'rgba(109,191,126,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                  Available to Pay Out
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: GREEN, lineHeight: 1 }}>
                  ${balance.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                  Arrives in 2–5 business days
                  {payoutRecord?.bank_last4 ? ` · bank ending in ${payoutRecord.bank_last4}` : ''}
                </div>
              </div>

              <button
                onClick={() => payoutMutation.mutate()}
                disabled={payoutMutation.isPending}
                style={{
                  ...T,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: GREEN,
                  border: 'none',
                  borderRadius: 8,
                  color: '#000',
                  fontSize: 14, fontWeight: 800,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  padding: '11px 22px',
                  cursor: payoutMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: payoutMutation.isPending ? 0.6 : 1,
                }}
              >
                <ArrowDownToLine size={15} />
                {payoutMutation.isPending ? 'Processing…' : `Pay Out $${balance.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        {/* ── Recent Transactions Card ──────────────────────────────── */}
        {transactions.length > 0 && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={16} color={GOLD} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Recent Tips</span>
            </div>

            <div>
              {transactions.slice(0, 10).map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < Math.min(transactions.length, 10) - 1
                      ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                      {t.sender_name || 'Anonymous'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {new Date(t.created_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: GREEN, marginBottom: 4 }}>
                      +${(t.amount || 0).toFixed(2)}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      borderRadius: 20, padding: '2px 8px',
                      color: t.status === 'paid_out' ? GREEN : GOLD,
                      background: t.status === 'paid_out' ? 'rgba(109,191,126,0.1)' : 'rgba(212,175,55,0.1)',
                      border: `1px solid ${t.status === 'paid_out' ? 'rgba(109,191,126,0.3)' : 'rgba(212,175,55,0.3)'}`,
                    }}>
                      {t.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
