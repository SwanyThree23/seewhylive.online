import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, Radio, Wallet } from 'lucide-react';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

/**
 * PayoutSummary — admin view of total platform cuts and pending creator
 * balances, computed from recent merchandise sales and live-stream activity.
 *
 * Platform cut = MerchandiseOrder.platform_cut + Transaction.platform_cut
 *                + GemTransaction.platform_fee
 * Creator earned (per creator) = MerchandiseOrder.creator_payout (non-refunded)
 *                              + Transaction.creator_payout (completed)
 *                              + GemTransaction.creator_cut
 * Paid out (per creator) = PayoutRecord.creator_amount where status=paid
 * Pending balance (per creator) = max(0, earned − paidOut)
 */
export default function PayoutSummary() {
  const admin = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const isAdmin = admin.data?.role === 'admin';

  const orders = useQuery({
    queryKey: ['payoutSummary-orders'],
    queryFn: () => base44.entities.MerchandiseOrder.list('-created_date', 200),
    enabled: isAdmin,
  });
  const txns = useQuery({
    queryKey: ['payoutSummary-txns'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
    enabled: isAdmin,
  });
  const gems = useQuery({
    queryKey: ['payoutSummary-gems'],
    queryFn: () => base44.entities.GemTransaction.list('-created_date', 200),
    enabled: isAdmin,
  });
  const payouts = useQuery({
    queryKey: ['payoutSummary-payouts'],
    queryFn: () => base44.entities.PayoutRecord.list('-created_date', 200),
    enabled: isAdmin,
  });
  const users = useQuery({
    queryKey: ['payoutSummary-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20 }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin access required.</p>
      </div>
    );
  }

  const loading = orders.isLoading || txns.isLoading || gems.isLoading || payouts.isLoading;
  if (loading) {
    return (
      <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20 }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading payout summary…</p>
      </div>
    );
  }

  const oList = orders.data || [];
  const tList = txns.data || [];
  const gList = gems.data || [];
  const pList = payouts.data || [];
  const uList = users.data || [];
  const nameFor = (id) => {
    const u = uList.find((x) => x.id === id);
    return u ? (u.full_name || u.email || id) : (id ? id.slice(0, 8) : '—');
  };

  // ── Platform cuts (total, all-time recent window) ───────────────────────
  const merchPlatformCut = oList.reduce((s, o) => s + (o.platform_cut || 0), 0);
  const streamPlatformCut = tList.reduce((s, t) => s + (t.platform_cut || 0), 0)
                          + gList.reduce((s, g) => s + (g.platform_fee || 0), 0);
  const totalPlatformCut = merchPlatformCut + streamPlatformCut;

  // ── Per-creator earned + paid ──────────────────────────────────────────
  const earned = {}; // creatorId -> number
  const add = (id, amt) => { if (!id || !amt) return; earned[id] = (earned[id] || 0) + amt; };

  oList.forEach((o) => {
    if (o.status === 'cancelled' || o.status === 'refunded') return;
    add(o.creator_id, o.creator_payout);
  });
  tList.forEach((t) => {
    if (t.status !== 'completed') return;
    add(t.recipient_id, t.creator_payout);
  });
  gList.forEach((g) => add(g.recipient_id, g.creator_cut));

  const paidOut = {};
  pList.forEach((p) => {
    if (p.status !== 'paid') return;
    paidOut[p.creator_id] = (paidOut[p.creator_id] || 0) + (p.creator_amount || 0);
  });

  const totalEarned = Object.values(earned).reduce((s, v) => s + v, 0);
  const totalPaid = Object.values(paidOut).reduce((s, v) => s + v, 0);
  const totalPending = Math.max(0, totalEarned - totalPaid);

  const rows = Object.keys(earned)
    .map((id) => {
      const e = earned[id] || 0;
      const p = paidOut[id] || 0;
      return { id, name: nameFor(id), earned: e, paid: p, pending: Math.max(0, e - p) };
    })
    .filter((r) => r.earned > 0)
    .sort((a, b) => b.pending - a.pending);

  function Stat({ label, value, sub, icon: Icon, color }) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{label}</span>
          <Icon className="w-3.5 h-3.5" style={{ color: color || GOLD }} />
        </div>
        <p className="text-xl font-black" style={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>${value.toFixed(2)}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4" style={{ color: GOLD }} />
        <p className="font-black text-sm text-white" style={T}>PAYOUT SUMMARY</p>
        <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>recent 200 records each</span>
      </div>

      {/* Totals grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Platform Cut (Total)" value={totalPlatformCut} icon={DollarSign} color="#6DBF7E" sub="10% across all activity" />
        <Stat label="  · Merch Sales" value={merchPlatformCut} icon={Package} color="#D4854A" />
        <Stat label="  · Live Stream" value={streamPlatformCut} icon={Radio} color="#C0392B" />
        <Stat label="Pending Creator Balances" value={totalPending} icon={Wallet} color={GOLD} sub={`of $${totalEarned.toFixed(2)} earned`} />
      </div>

      {/* Per-creator pending balances */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>Per-Creator Pending Balances</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, ...T }}>{rows.length} creators</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No creator earnings in the recent window yet.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="min-w-0">
                  <p className="font-black text-xs text-white truncate" style={T}>{r.name}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>earned ${r.earned.toFixed(2)} · paid ${r.paid.toFixed(2)}</p>
                </div>
                <span className="font-black text-sm shrink-0" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${r.pending.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}