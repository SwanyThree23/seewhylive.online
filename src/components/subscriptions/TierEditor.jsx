import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

const ICON_OPTIONS = ['star', 'crown', 'flame', 'heart', 'zap', 'bronze', 'silver', 'gold', 'diamond'];
const PRESET_COLORS = ['#cd7f32', '#aaa9ad', '#d4af37', '#D4854A', '#C9A84C', '#C0392B', '#6DBF7E', '#D4AF37'];

const TOGGLE_BENEFITS = [
  { key: 'has_early_access', label: 'Early Access to Streams' },
  { key: 'has_exclusive_rooms', label: 'Exclusive Room Entry' },
  { key: 'has_custom_badge', label: 'Custom Tier Badge in Chat' },
  { key: 'has_custom_emotes', label: 'Custom Emotes' },
  { key: 'is_ad_free', label: 'Ad-Free Viewing' },
  { key: 'priority_support', label: 'Priority Support' },
];

const defaultForm = {
  name: '',
  description: '',
  price: '',
  color: '#d4af37',
  icon: 'star',
  sort_order: 0,
  benefits: [],
  has_early_access: false,
  has_exclusive_rooms: false,
  has_custom_badge: true,
  has_custom_emotes: false,
  is_ad_free: false,
  priority_support: false,
  max_subscribers: '',
  is_active: true,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(8,11,24,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Barlow Condensed, sans-serif',
};

export default function TierEditor({ open, onClose, creatorId, existing }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (open) {
      setForm(existing ? {
        ...defaultForm,
        ...existing,
        price: existing.price?.toString() || '',
        max_subscribers: existing.max_subscribers?.toString() || '',
        benefits: existing.benefits || [],
      } : defaultForm);
      setNewBenefit('');
    }
  }, [open, existing]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        creator_id: creatorId,
        price: parseFloat(form.price) || 0,
        max_subscribers: form.max_subscribers ? parseInt(form.max_subscribers) : null,
        sort_order: parseInt(form.sort_order) || 0,
      };
      if (existing?.id) {
        return base44.entities.SubscriptionTier.update(existing.id, payload);
      }
      return base44.entities.SubscriptionTier.create(payload);
    },
    onSuccess: (tier) => {
      toast.success(existing ? 'Tier updated!' : 'Tier created!');
      qc.invalidateQueries({ queryKey: ['creatorTiers', creatorId] });
      onClose();
      if (!existing && creatorId) {
        base44.entities.Activity.create({
          user_id: creatorId,
          type: 'milestone',
          title: `Created subscription tier: ${tier?.name || form.name}`,
        }).catch(() => {});
      }
    },
  });

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    set('benefits', [...form.benefits, newBenefit.trim()]);
    setNewBenefit('');
  };

  const removeBenefit = (i) => set('benefits', form.benefits.filter((_, idx) => idx !== i));

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontWeight: 900, fontSize: 14, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{existing ? 'Edit Tier' : 'Create Membership Tier'}</p>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
          {/* Name & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Tier Name *</label>
              <input placeholder="e.g. Gold" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Price ($/month) *</label>
              <input type="number" min="0" step="0.01" placeholder="9.99" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Description</label>
            <textarea placeholder="What makes this tier special?" value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none', minHeight: 60 }} />
          </div>

          {/* Icon & Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Icon</label>
              <select value={form.icon} onChange={e => set('icon', e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                {ICON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Badge Color</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', transform: form.color === c ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.1s' }}
                  />
                ))}
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: 0, background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* Display order & max subs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Display Order</label>
              <input type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>Max Subscribers (blank = ∞)</label>
              <input type="number" min="1" placeholder="Unlimited" value={form.max_subscribers} onChange={e => set('max_subscribers', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Feature toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>Included Benefits</label>
            {TOGGLE_BENEFITS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                <div
                  onClick={() => set(key, !form[key])}
                  style={{ width: 40, height: 22, borderRadius: 99, background: form[key] ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 3, left: form[key] ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Custom benefit list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>Custom Benefit Lines</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="e.g. Monthly 1-on-1 call"
                value={newBenefit}
                onChange={e => setNewBenefit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={addBenefit}
                style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}
              >
                <Plus style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {form.benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 12px', fontSize: 14 }}>
                  <span style={{ flex: 1, color: '#fff' }}>{b}</span>
                  <button type="button" onClick={() => removeBenefit(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                onClick={() => set('is_active', !form.is_active)}
                style={{ width: 40, height: 22, borderRadius: 99, background: form.is_active ? '#800020' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 3, left: form.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>Active (visible to subscribers)</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name || !form.price}
              style={{ flex: 1, padding: '10px 0', background: '#D4AF37', border: 'none', borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700, cursor: (saveMutation.isPending || !form.name || !form.price) ? 'not-allowed' : 'pointer', opacity: (saveMutation.isPending || !form.name || !form.price) ? 0.7 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {saveMutation.isPending ? 'Saving...' : existing ? 'Save Changes' : 'Create Tier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
