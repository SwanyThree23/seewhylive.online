import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

const ICON_OPTIONS = ['star', 'crown', 'flame', 'heart', 'zap', 'bronze', 'silver', 'gold', 'diamond'];
const PRESET_COLORS = ['#cd7f32', '#aaa9ad', '#d4af37', '#e8c4e8', '#7ec8e3', '#ff6b6b', '#51cf66', '#339af0'];

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

export default function TierEditor({ open, onClose, creatorId, existing }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(existing ? {
    ...defaultForm,
    ...existing,
    price: existing.price?.toString() || '',
    max_subscribers: existing.max_subscribers?.toString() || '',
    benefits: existing.benefits || [],
  } : defaultForm);
  const [newBenefit, setNewBenefit] = useState('');

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
    onSuccess: () => {
      toast.success(existing ? 'Tier updated!' : 'Tier created!');
      qc.invalidateQueries(['creatorTiers', creatorId]);
      onClose();
    },
  });

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    set('benefits', [...form.benefits, newBenefit.trim()]);
    setNewBenefit('');
  };

  const removeBenefit = (i) => set('benefits', form.benefits.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Tier' : 'Create Membership Tier'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tier Name *</Label>
              <Input placeholder="e.g. Gold" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Price ($/month) *</Label>
              <Input type="number" min="0" step="0.01" placeholder="9.99" value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea placeholder="What makes this tier special?" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Icon</Label>
              <Select value={form.icon} onValueChange={v => set('icon', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Badge Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color === c ? 'border-black scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
              </div>
            </div>
          </div>

          {/* Display order & max subs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Display Order</Label>
              <Input type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Max Subscribers (blank = ∞)</Label>
              <Input type="number" min="1" placeholder="Unlimited" value={form.max_subscribers} onChange={e => set('max_subscribers', e.target.value)} />
            </div>
          </div>

          {/* Feature toggles */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Included Benefits</Label>
            {TOGGLE_BENEFITS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm">{label}</span>
                <Switch checked={!!form[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>

          {/* Custom benefit list */}
          <div className="space-y-2">
            <Label>Custom Benefit Lines</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Monthly 1-on-1 call"
                value={newBenefit}
                onChange={e => setNewBenefit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              />
              <Button type="button" size="icon" onClick={addBenefit} variant="outline"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-1">
              {form.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded px-3 py-1.5 text-sm">
                  <span className="flex-1">{b}</span>
                  <button type="button" onClick={() => removeBenefit(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
              <Label>Active (visible to subscribers)</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name || !form.price}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
              {saveMutation.isPending ? 'Saving...' : existing ? 'Save Changes' : 'Create Tier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}