import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const INPUT_STYLE = { width:'100%', padding:'7px 10px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif', height:32 };
const SELECT_STYLE = { ...INPUT_STYLE };

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
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'rgba(255,255,255,0.4)', fontFamily:'Barlow Condensed, sans-serif', letterSpacing:'0.1em' }}>
          Reward Shop ({rewards.length})
        </span>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:8, fontSize:10, fontWeight:700, background:'rgba(212,175,55,0.12)', color:'#d4af37', border:'1px solid rgba(212,175,55,0.2)', cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif' }}>
          <Plus style={{ width:12, height:12 }} /> Add
          {showForm ? <ChevronUp style={{ width:12, height:12 }} /> : <ChevronDown style={{ width:12, height:12 }} />}
        </button>
      </div>

      {showForm && (
        <div style={{ borderRadius:12, padding:12, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input style={INPUT_STYLE} placeholder="Reward name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select style={SELECT_STYLE} value={form.reward_type} onChange={e => setForm(f => ({ ...f, reward_type: e.target.value }))}>
              {REWARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <input style={INPUT_STYLE} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <input type="number" style={INPUT_STYLE} placeholder="Points cost" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: e.target.value }))} />
            <input type="number" style={INPUT_STYLE} placeholder="Stock (blank=∞)" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            <input style={INPUT_STYLE} placeholder="Icon emoji" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          </div>
          <button
            style={{ width:'100%', height:32, fontSize:12, fontWeight:700, background:'#d4af37', color:'#000', border:'none', borderRadius:8, cursor: (!form.name || !form.points_required || createMutation.isPending) ? 'not-allowed' : 'pointer', opacity: (!form.name || !form.points_required || createMutation.isPending) ? 0.6 : 1, fontFamily:'Barlow Condensed, sans-serif' }}
            disabled={!form.name || !form.points_required || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            Create Reward
          </button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {rewards.map(reward => (
          <div key={reward.id} style={{ display:'flex', alignItems:'center', gap:8, padding:8, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', opacity: reward.is_active ? 1 : 0.5, transition:'opacity 0.15s' }}>
            <span style={{ fontSize:16, width:24, textAlign:'center' }}>{reward.icon || '🎁'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reward.name}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>{reward.points_required.toLocaleString()} pts · {reward.claimed_count || 0} claimed</p>
            </div>
            <button onClick={() => toggleMutation.mutate({ id: reward.id, is_active: reward.is_active })}
              style={{ background:'none', border:'none', cursor:'pointer', color: reward.is_active ? '#d4af37' : 'rgba(255,255,255,0.4)', padding:2 }}>
              {reward.is_active ? <ToggleRight style={{ width:16, height:16 }} /> : <ToggleLeft style={{ width:16, height:16 }} />}
            </button>
            <button onClick={() => deleteMutation.mutate(reward.id)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', padding:2 }}
              onMouseEnter={e => e.currentTarget.style.color='#f87171'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
              <Trash2 style={{ width:14, height:14 }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
