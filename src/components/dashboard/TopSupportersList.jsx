import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Crown, Gift } from 'lucide-react';

const GOLD = '#FFB800';
const COND = { fontFamily: 'Barlow Condensed, sans-serif' };
const MONO = { fontFamily: 'DM Mono, monospace' };

export default function TopSupportersList({ creatorId, limit = 5 }) {
  const { data: tips = [], isLoading: tipsLoading } = useQuery({
    queryKey: ['supporters-tips', creatorId],
    queryFn: async () => {
      const res = await base44.entities.TipAlert.filter(
        { creator_id: creatorId },
        { sort: '-created_date', limit: 300 }
      );
      return res.items || [];
    },
    enabled: !!creatorId,
  });

  const { data: gifts = [], isLoading: giftsLoading } = useQuery({
    queryKey: ['supporters-gifts', creatorId],
    queryFn: async () => {
      const res = await base44.entities.GemTransaction.filter(
        { recipient_id: creatorId },
        { sort: '-created_date', limit: 300 }
      );
      return res.items || [];
    },
    enabled: !!creatorId,
  });

  const supporters = React.useMemo(() => {
    const map = new Map();
    const bump = (id, name, amount) => {
      if (!id || !amount) return;
      const prev = map.get(id) || { id, name: name || null, total: 0, count: 0 };
      map.set(id, {
        id,
        name: prev.name || name || null,
        total: prev.total + amount,
        count: prev.count + 1,
      });
    };
    tips.forEach(t => bump(t.sender_id, t.sender_name, Number(t.amount_usd) || 0));
    gifts.forEach(g => bump(g.sender_id, null, g.usd_value || 0));
    return [...map.values()]
      .map(s => ({ ...s, name: s.name || `Supporter ${s.id.slice(-4)}` }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [tips, gifts, limit]);

  const topTotal = supporters.reduce((s, x) => s + x.total, 0);
  const isLoading = tipsLoading || giftsLoading;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4" style={{ color: GOLD }} />
          <p className="font-black uppercase" style={{ ...COND, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}>
            Top Supporters
          </p>
        </div>
        <span style={{ ...MONO, fontSize: 11, color: 'var(--mu)' }}>lifetime</span>
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-center" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>Loading supporters…</p>
      ) : supporters.length === 0 ? (
        <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
          <Gift className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.12)' }} />
          <p style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>No tips or gifts received yet.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--bd)' }}>
          {supporters.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5"
              style={{ background: i === 0 ? 'rgba(255,184,0,0.05)' : 'transparent' }}>
              <div className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 28, height: 28,
                  background: i === 0 ? 'rgba(255,184,0,0.18)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i === 0 ? 'rgba(255,184,0,0.5)' : 'var(--bd)'}`,
                  ...MONO, fontSize: 11, color: i === 0 ? GOLD : 'var(--mu)',
                }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ ...COND, fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>
                  {s.name}
                </p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--mu)' }}>
                  {s.count} payment{s.count === 1 ? '' : 's'} · {Math.round((s.total / (topTotal || 1)) * 100)}%
                </p>
              </div>
              <span style={{ ...COND, fontSize: 14, fontWeight: 900, color: GOLD }}>
                ${s.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}