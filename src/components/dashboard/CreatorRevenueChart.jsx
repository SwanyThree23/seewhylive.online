import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

const GOLD = '#FFB800';
const CYAN = '#00F5FF';
const GREEN = '#00FF88';
const WARN = '#FF8C00';
const COND = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'DM Mono, monospace' };

const DAYS = { '7d': 7, '30d': 30, '1y': 365 };
const SERIES = [
  { key: 'tips', label: 'Tips', color: GOLD },
  { key: 'subs', label: 'Subs', color: CYAN },
  { key: 'paywalls', label: 'Paywalls', color: GREEN },
  { key: 'gifts', label: 'Gifts', color: WARN },
];

const TYPE_MAP = { tip: 'tips', subscription: 'subs', sub: 'subs', ppv: 'paywalls', paywall: 'paywalls', gift: 'gifts' };

function dayKey(d) { return new Date(d).toISOString().slice(0, 10); }

function buildBuckets(timeRange, txRows, giftRows) {
  const days = DAYS[timeRange] || 30;
  const monthly = days > 90;
  const buckets = [];
  const index = new Map();
  const now = new Date();

  const count = monthly ? 12 : days;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (monthly) {
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      index.set(key, buckets.length);
      buckets.push({ key, label: d.toLocaleDateString(undefined, { month: 'short' }), tips: 0, subs: 0, paywalls: 0, gifts: 0 });
    } else {
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      index.set(key, buckets.length);
      buckets.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, tips: 0, subs: 0, paywalls: 0, gifts: 0 });
    }
  }

  const add = (dateValue, type, amount) => {
    if (!dateValue || !amount) return;
    const d = new Date(dateValue);
    const key = monthly
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : dayKey(d);
    const i = index.get(key);
    if (i === undefined) return;
    buckets[i][type] += amount;
  };

  txRows.forEach(t => {
    add(t.processed_at || t.created_date, TYPE_MAP[t.transaction_type] || null, (t.creator_payout || t.amount || 0));
  });
  giftRows.forEach(g => add(g.created_date, 'gifts', g.creator_cut || g.usd_value || 0));

  return buckets.map(b => ({
    ...b,
    tips: Math.round(b.tips * 100) / 100,
    subs: Math.round(b.subs * 100) / 100,
    paywalls: Math.round(b.paywalls * 100) / 100,
    gifts: Math.round(b.gifts * 100) / 100,
  }));
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="px-2.5 py-2 rounded-lg" style={{ background: 'var(--cd)', border: '1px solid var(--bd)' }}>
      <p style={{ ...MONO, fontSize: 11, color: 'var(--mu)' }}>{label}</p>
      {payload.filter(p => p.value > 0).map(p => (
        <p key={p.dataKey} style={{ ...COND, fontSize: 12, color: p.fill, fontWeight: 700 }}>
          {p.name}: ${p.value.toFixed(2)}
        </p>
      ))}
      <p style={{ ...COND, fontSize: 12, color: 'var(--tx)', fontWeight: 900 }}>Total: ${total.toFixed(2)}</p>
    </div>
  );
}

export default function CreatorRevenueChart({ creatorId, timeRange = '30d' }) {
  const { data: txRows = [], isLoading: txLoading } = useQuery({
    queryKey: ['rev-transactions', creatorId, timeRange],
    queryFn: async () => {
      const res = await base44.entities.Transaction.filter(
        { recipient_id: creatorId },
        { sort: '-created_date', limit: 400 }
      );
      return res.items || [];
    },
    enabled: !!creatorId,
  });

  const { data: giftRows = [], isLoading: giftLoading } = useQuery({
    queryKey: ['rev-gifts', creatorId, timeRange],
    queryFn: async () => {
      const res = await base44.entities.GemTransaction.filter(
        { recipient_id: creatorId },
        { sort: '-created_date', limit: 300 }
      );
      return res.items || [];
    },
    enabled: !!creatorId,
  });

  const buckets = React.useMemo(
    () => buildBuckets(timeRange, txRows, giftRows),
    [timeRange, txRows, giftRows]
  );

  const totals = SERIES.reduce((acc, s) => {
    acc[s.key] = buckets.reduce((sum, b) => sum + b[s.key], 0);
    return acc;
  }, {});
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const isLoading = txLoading || giftLoading;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
          <p className="font-black uppercase" style={{ ...COND, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}>
            Revenue Over Time
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span style={{ ...COND, fontSize: 15, fontWeight: 900, color: GOLD }}>
            ${grand.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="px-2 pt-3 pb-1" style={{ height: 190 }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>Loading revenue…</p>
          </div>
        ) : grand === 0 ? (
          <div className="h-full flex items-center justify-center px-6 text-center">
            <p style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>
              No earnings recorded in this period yet.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#5A5A7A', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#5A5A7A', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              {SERIES.map(s => (
                <Bar key={s.key} dataKey={s.key} name={s.label} stackId="rev" fill={s.color} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3" style={{ borderTop: '1px solid var(--bd)' }}>
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="rounded-full" style={{ width: 7, height: 7, background: s.color }} />
            <span style={{ ...COND, fontSize: 11, color: 'var(--mu)' }}>
              {s.label} <span style={{ color: 'var(--tx)', fontWeight: 700 }}>${totals[s.key].toFixed(2)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}