import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const REWARD_TYPES = [
  { value: 'soundboard',        label: '🔊 Sound Effect' },
  { value: 'song_request',      label: '🎵 Song Request' },
  { value: 'pin_message',       label: '📌 Pin Message' },
  { value: 'shoutout',          label: '📣 Shoutout' },
  { value: 'badge',             label: '🏅 Badge' },
  { value: 'custom_emote',      label: '✨ Custom Emote' },
  { value: 'discount_code',     label: '🎟️ Discount Code' },
  { value: 'exclusive_content', label: '🔒 Exclusive Content' },
];

const DEFAULT_FORM = { name: '', description: '', points_required: 200, reward_type: 'shoutout', icon: '', stock: '', reward_value: '' };

export default function RewardShopEditor({ creatorId }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const qc = useQueryClient();

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards', creatorId],
    queryFn: () => base44.entities.LoyaltyReward.filter({ creator_id: creatorId }),
    enabled: !!creatorId,
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.LoyaltyReward.create({
      ...form,
      creator_id: creatorId,
      points_required: Number(form.points_required),
      stock: form.stock ? Number(form.stock) : null,
      is_active: true,
      claimed_count: 0,
    }),
    onSuccess: () => {
      toast.success('Reward created!');
      setForm(DEFAULT_FORM);
      setShowForm(false);
      qc.invalidateQueries(['loyalty-rewards', creatorId]);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.LoyaltyReward.update(id, { is_active: !is_active }),
    onSuccess: () => qc.invalidateQueries(['loyalty-rewards', creatorId]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LoyaltyReward.delete(id),
    onSuccess: () => qc.invalidateQueries(['loyalty-rewards', creatorId]),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-white/40" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
          Reward Shop ({rewards.length})
        </span>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
          style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}>
          <Plus className="w-3 h-3" /> Add
          {showForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Reward name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="text-xs h-8 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            <select value={form.reward_type} onChange={e => setForm(f => ({ ...f, reward_type: e.target.value }))}
              className="h-8 rounded-md bg-[#0d0618] border border-white/10 text-white text-xs px-2">
              {REWARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="text-xs h-8 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" placeholder="Points cost" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: e.target.value }))}
              className="text-xs h-8 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            <Input type="number" placeholder="Stock (blank=∞)" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              className="text-xs h-8 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            <Input placeholder="Icon emoji" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="text-xs h-8 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <Button size="sm" className="w-full h-8 text-xs font-bold"
            style={{ background: '#d4af37', color: '#000' }}
            disabled={!form.name || !form.points_required || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            Create Reward
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        {rewards.map(reward => (
          <div key={reward.id} className="flex items-center gap-2 p-2 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', opacity: reward.is_active ? 1 : 0.5 }}>
            <span className="text-base w-6 text-center">{reward.icon || '🎁'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{reward.name}</p>
              <p className="text-[9px] text-white/40">{reward.points_required.toLocaleString()} pts · {reward.claimed_count || 0} claimed</p>
            </div>
            <button onClick={() => toggleMutation.mutate({ id: reward.id, is_active: reward.is_active })}
              className="text-white/40 hover:text-[#d4af37] transition-colors">
              {reward.is_active ? <ToggleRight className="w-4 h-4 text-[#d4af37]" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
            <button onClick={() => deleteMutation.mutate(reward.id)}
              className="text-white/20 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}