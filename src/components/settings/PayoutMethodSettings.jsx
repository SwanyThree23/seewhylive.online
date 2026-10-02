import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

const G = '#d4af37';

const METHODS = [
  { id: 'cashapp', label: 'CashApp', hint: '$cashtag' },
  { id: 'paypal', label: 'PayPal', hint: 'paypal.me link or email' },
  { id: 'venmo', label: 'Venmo', hint: '@venmo-username' },
  { id: 'zelle', label: 'Zelle', hint: 'phone or email' },
  { id: 'chime', label: 'Chime', hint: '$chimesign' },
  { id: 'bank_transfer', label: 'Bank', hint: 'account details' },
];

export default function PayoutMethodSettings({ user }) {
  const [method, setMethod] = useState('');
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: profiles = [], refetch } = useQuery({
    queryKey: ['my-creator-profile', user?.id],
    queryFn: () => base44.entities.CreatorProfile.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const profile = profiles[0];

  useEffect(() => {
    if (!profile) return;
    setMethod(profile.payout_method || '');
    setHandle(profile.payout_handle || '');
  }, [profile?.id, profile?.payout_method, profile?.payout_handle]);

  const save = async () => {
    setSaving(true);
    const payload = { payout_method: method || undefined, payout_handle: handle.trim() };
    try {
      if (profile) {
        await base44.entities.CreatorProfile.update(profile.id, payload);
      } else {
        await base44.entities.CreatorProfile.create({
          user_id: user.id,
          display_name: user.full_name || user.email,
          ...payload,
        });
      }
      await refetch();
      toast.success('Tip destination saved');
    } catch {
      toast.error("Couldn't save — try again.");
    }
    setSaving(false);
  };

  const activeHint = METHODS.find((m) => m.id === method)?.hint || 'where viewers send tips';

  return (
    <section className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(13,16,34,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}>
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4" style={{ color: G }} />
        <h2 className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: G }}>
          Tip Destination
        </h2>
      </div>
      <p className="text-xs text-white/45 leading-relaxed">
        Where viewers send support when they tap Tip during your stream.
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        {METHODS.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={method === m.id}
            className="px-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{
              background: method === m.id ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${method === m.id ? G : 'rgba(255,255,255,0.08)'}`,
              color: method === m.id ? G : 'rgba(255,255,255,0.6)',
              fontFamily: 'Barlow Condensed, sans-serif',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder={activeHint}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none"
      />

      <button onClick={save} disabled={saving}
        className="w-full px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        style={{ background: G, color: '#000', fontFamily: 'Barlow Condensed, sans-serif' }}>
        {saving ? 'Saving…' : 'Save Tip Destination'}
      </button>
    </section>
  );
}