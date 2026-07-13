import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Package, Plus, X, Check, Tag, BarChart2, Truck } from 'lucide-react';
import ShopDashboard from '../components/merch/ShopDashboard';
import { toast } from 'sonner';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

const BG      = '#080B18';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const GREEN   = '#6DBF7E';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const STATUS_COLOR = {
  pending:   { bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)',   color: GOLD    },
  confirmed: { bg: 'rgba(74,138,122,0.1)',     border: 'rgba(74,138,122,0.3)',    color: '#4A8A7A' },
  shipped:   { bg: 'rgba(123,93,166,0.1)',   border: 'rgba(123,93,166,0.3)', color: '#7B5DA6' },
  delivered: { bg: 'rgba(109,191,126,0.1)',   border: 'rgba(109,191,126,0.3)', color: GREEN   },
  cancelled: { bg: 'rgba(255,30,80,0.1)',     border: 'rgba(255,30,80,0.3)',    color: '#ff1e50' },
};

/* ── Fan: Product Sheet ───────────────────────────────────── */
function ProductSheet({ item, onClose, user }) {
  const [size, setSize]     = useState('');
  const [qty, setQty]       = useState(1);
  const [success, setSuccess] = useState(false);
  const queryClient         = useQueryClient();

  const total       = (item.price_usd * qty).toFixed(2);
  const creatorGets = (item.price_usd * qty * 0.9).toFixed(2);

  const orderMutation = useMutation({
    mutationFn: () => base44.entities.MerchandiseOrder.create({
      buyer_id: user?.id,
      buyer_name: user?.full_name || user?.email || 'Fan',
      creator_id: item.creator_id,
      item_id: item.id,
      item_name: item.name,
      size, quantity: qty,
      total_usd: parseFloat(total),
      creator_payout: parseFloat(creatorGets),
      platform_cut: parseFloat((item.price_usd * qty * 0.1).toFixed(2)),
      status: 'pending',
    }),
    onSuccess: () => { setSuccess(true); queryClient.invalidateQueries(['merch-items']); },
    onError: () => toast.error('Order failed — please try again'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="w-full max-w-lg rounded-t-2xl overflow-hidden"
        style={{ background: 'rgba(13,6,24,0.99)', border: `1px solid rgba(212,175,55,0.2)` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="font-black text-sm text-white" style={T}>{item.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-black text-xl mb-1" style={{ color: GOLD, ...T }}>Order Placed!</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Pending confirmation from creator</p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 rounded-xl font-black uppercase text-xs"
              style={{ background: CRIMSON, border: `1px solid ${GOLD}30`, color: GOLD, cursor: 'pointer', ...T }}>
              Close
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Product image */}
            <div className="h-44 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: item.image_url ? undefined : `linear-gradient(135deg, ${CRIMSON}44, rgba(13,6,24,0.8))` }}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                : <span className="text-6xl">👕</span>}
            </div>

            {/* Title + Price */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-black text-lg text-white" style={T}>{item.name}</p>
                {item.description && <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>}
              </div>
              <p className="font-black text-2xl" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${item.price_usd}</p>
            </div>

            {/* Sizes */}
            {item.sizes_available?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Size</p>
                <div className="flex gap-2 flex-wrap">
                  {item.sizes_available.map(s => (
                    <button key={s} onClick={() => setSize(s)}
                      className="px-3 py-1.5 rounded-lg font-black text-xs transition-all"
                      style={{ background: size === s ? `${GOLD}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${size === s ? GOLD : 'rgba(255,255,255,0.1)'}`, color: size === s ? GOLD : 'rgba(255,255,255,0.5)', cursor: 'pointer', ...T }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Qty</p>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                −
              </button>
              <span className="font-black text-xl w-6 text-center" style={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                +
              </button>
            </div>

            {/* 90/10 split note */}
            <div className="p-3 rounded-xl flex items-center justify-between"
              style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                Creator keeps 90% · Total: <strong style={{ color: GOLD }}>${total}</strong>
              </span>
            </div>

            {/* Buy CTA */}
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={() => orderMutation.mutate()}
              disabled={orderMutation.isPending}
              className="w-full py-3.5 rounded-xl font-black uppercase text-sm"
              style={{ background: orderMutation.isPending ? 'rgba(128,0,32,0.4)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: orderMutation.isPending ? 'rgba(255,255,255,0.3)' : '#07050A', cursor: orderMutation.isPending ? 'default' : 'pointer', ...T }}>
              {orderMutation.isPending ? 'Placing Order…' : `Buy Now — $${total}`}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Creator: Add Item Form ───────────────────────────────── */
function AddItemModal({ creatorId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', price_usd: '', description: '', sizes_available: [] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSize = (s) => setForm(f => ({
    ...f,
    sizes_available: f.sizes_available.includes(s)
      ? f.sizes_available.filter(x => x !== s)
      : [...f.sizes_available, s],
  }));

  const addMutation = useMutation({
    mutationFn: () => base44.entities.MerchandiseItem.create({
      ...form,
      creator_id: creatorId,
      price_usd: parseFloat(form.price_usd) || 0,
      is_active: true,
      times_sold: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['merch-items', creatorId]);
      toast.success('Item added!');
      onClose();
    },
    onError: () => toast.error('Failed to add item'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,6,24,0.99)', border: `1px solid rgba(212,175,55,0.2)` }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" style={{ color: GOLD }} />
            <span className="font-black text-sm text-white" style={T}>Add Merch Item</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {[
            { key: 'name',        label: 'Item Name',   ph: 'e.g. Vintage Hoodie' },
            { key: 'price_usd',   label: 'Price (USD)', ph: '29.99' },
            { key: 'description', label: 'Description', ph: 'Optional description…' },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <p className="text-[10px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>{label}</p>
              <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}
              />
            </div>
          ))}

          {/* Sizes */}
          <div>
            <p className="text-[10px] font-black uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>Available Sizes</p>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(s => (
                <button key={s} onClick={() => toggleSize(s)}
                  className="px-3 py-1 rounded-lg font-black text-xs transition-all"
                  style={{ background: form.sizes_available.includes(s) ? `${GOLD}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${form.sizes_available.includes(s) ? GOLD : 'rgba(255,255,255,0.1)'}`, color: form.sizes_available.includes(s) ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer', ...T }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => form.name && addMutation.mutate()}
            disabled={!form.name || addMutation.isPending}
            className="w-full py-3 rounded-xl font-black uppercase text-xs mt-2"
            style={{ background: !form.name || addMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: !form.name || addMutation.isPending ? 'rgba(255,255,255,0.3)' : '#07050A', cursor: !form.name || addMutation.isPending ? 'default' : 'pointer', ...T }}>
            {addMutation.isPending ? 'Adding…' : 'Add to Store'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function MerchStorePage() {
  const urlParams     = new URLSearchParams(window.location.search);
  const creatorParam  = urlParams.get('id');
  const [activeTab, setActiveTab] = useState('store');
  const [selected, setSelected]   = useState(null);
  const [showAdd, setShowAdd]     = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const targetCreatorId = creatorParam || user?.id;
  const isOwnStore      = !creatorParam || creatorParam === user?.id;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['merch-items', targetCreatorId],
    queryFn: () => base44.entities.MerchandiseItem.filter({ creator_id: targetCreatorId, is_active: true }),
    enabled: !!targetCreatorId,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['merch-all-items', targetCreatorId],
    queryFn: () => base44.entities.MerchandiseItem.filter({ creator_id: targetCreatorId }),
    enabled: !!targetCreatorId && isOwnStore,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['merch-orders', targetCreatorId],
    queryFn: () => base44.entities.MerchandiseOrder.filter({ creator_id: targetCreatorId }, '-created_date', 50),
    enabled: !!targetCreatorId && isOwnStore,
  });

  const queryClient = useQueryClient();

  const toggleItemMutation = useMutation({
    mutationFn: ({ id, field, val }) => base44.entities.MerchandiseItem.update(id, { [field]: val }),
    onSuccess: () => queryClient.invalidateQueries(['merch-all-items', targetCreatorId]),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MerchandiseOrder.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['merch-orders', targetCreatorId]),
  });

  const totalRevenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((s, o) => s + (o.creator_payout || 0), 0);
  const totalSold    = allItems.reduce((s, i) => s + (i.times_sold || 0), 0);

  const TABS = isOwnStore
    ? [
        { id: 'store',     label: 'Public Store', icon: ShoppingBag },
        { id: 'manage',    label: 'Manage Items', icon: Package },
        { id: 'orders',    label: `Orders (${orders.length})`, icon: Truck },
        { id: 'dashboard', label: 'Dashboard',    icon: BarChart2 },
      ]
    : [{ id: 'store', label: 'Store', icon: ShoppingBag }];

  return (
    <div className="min-h-screen pb-12" style={{ background: BG }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${GOLD})` }}>
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>
              {isOwnStore ? 'My Merch Store' : 'Merch Store'}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isOwnStore ? 'Manage your merchandise & orders' : `${items.length} items available`}
            </p>
          </div>
        </div>
        {isOwnStore && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs"
            style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#07050A', cursor: 'pointer', ...T }}>
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-5">

        {/* Creator stats (own store only) */}
        {isOwnStore && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Items',    value: allItems.length,             color: '#4A8A7A' },
              { label: 'Sold',     value: totalSold,                   color: GOLD      },
              { label: 'Revenue',  value: `$${totalRevenue.toFixed(0)}`, color: GREEN   },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl p-4 text-center"
                style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <p className="text-2xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
                <p className="text-[10px] font-black uppercase mt-1" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {TABS.length > 1 && (
          <div className="flex border-b mb-5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 font-black uppercase text-[10px] border-b-2 transition-all"
                style={{ ...T, color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === tab.id ? GOLD : 'transparent', background: 'transparent', cursor: 'pointer' }}>
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── STORE TAB ─────────────────────────────────── */}
        {activeTab === 'store' && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse h-56" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-24">
                <ShoppingBag className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No items yet</p>
                {isOwnStore && (
                  <button onClick={() => setShowAdd(true)}
                    className="mt-4 px-5 py-2 rounded-xl font-black uppercase text-xs"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: GOLD, cursor: 'pointer', ...T }}>
                    + Add Your First Item
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => setSelected(item)}
                    className="rounded-2xl overflow-hidden cursor-pointer"
                    style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>

                    {/* Image */}
                    <div className="h-40 flex items-center justify-center overflow-hidden relative"
                      style={{ background: item.image_url ? undefined : `linear-gradient(135deg, ${CRIMSON}44, rgba(13,6,24,0.8))` }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-5xl">👕</span>}
                      {item.is_live_exclusive && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase"
                          style={{ background: CRIMSON, color: GOLD, ...T }}>Live Only</div>
                      )}
                      {item.stock != null && item.stock < 10 && item.stock > 0 && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase"
                          style={{ background: '#FF9500', color: '#000', ...T }}>Low Stock</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="font-black text-sm text-white truncate" style={T}>{item.name}</p>
                      {item.description && <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.description}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-base" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${item.price_usd}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(255,255,255,0.35)', ...T }}>
                          {item.times_sold || 0} sold
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MANAGE TAB ────────────────────────────────── */}
        {activeTab === 'manage' && isOwnStore && (
          <div className="space-y-3">
            {allItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No items yet</p>
              </div>
            ) : allItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl overflow-hidden shrink-0"
                  style={{ background: item.image_url ? undefined : `${CRIMSON}20`, border: '1px solid rgba(255,255,255,0.08)' }}>
                  {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} /> : '👕'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-white truncate" style={T}>{item.name}</p>
                  <p className="text-[11px]" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${item.price_usd}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>{item.times_sold || 0} sold</span>
                  <button onClick={() => toggleItemMutation.mutate({ id: item.id, field: 'is_live_exclusive', val: !item.is_live_exclusive })}
                    className="px-2 py-1 rounded text-[9px] font-black uppercase transition-all"
                    style={{ background: item.is_live_exclusive ? `${GOLD}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${item.is_live_exclusive ? GOLD : 'rgba(255,255,255,0.1)'}`, color: item.is_live_exclusive ? GOLD : 'rgba(255,255,255,0.35)', cursor: 'pointer', ...T }}>
                    Live
                  </button>
                  <button onClick={() => toggleItemMutation.mutate({ id: item.id, field: 'is_active', val: !item.is_active })}
                    className="px-2 py-1 rounded text-[9px] font-black uppercase transition-all"
                    style={{ background: item.is_active ? `${GREEN}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${item.is_active ? GREEN : 'rgba(255,255,255,0.1)'}`, color: item.is_active ? GREEN : 'rgba(255,255,255,0.35)', cursor: 'pointer', ...T }}>
                    {item.is_active ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ORDERS TAB ────────────────────────────────── */}
        {activeTab === 'orders' && isOwnStore && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="font-black text-sm uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>No orders yet</p>
              </div>
            ) : orders.map(order => {
              const sc = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
              return (
                <div key={order.id} className="p-4 rounded-xl"
                  style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-sm text-white" style={T}>{order.item_name}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                        {order.buyer_name} {order.size ? `· ${order.size}` : ''} · Qty {order.quantity || 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-base" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>${order.total_usd?.toFixed(2)}</p>
                      <p className="text-[10px]" style={{ color: GREEN, ...T }}>+${order.creator_payout?.toFixed(2)} yours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                      style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, ...T }}>
                      {order.status}
                    </span>
                    {order.ordered_during_stream && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase"
                        style={{ background: CRIMSON, color: GOLD, ...T }}>Live Order</span>
                    )}
                    <select value={order.status}
                      onChange={e => updateOrderMutation.mutate({ id: order.id, status: e.target.value })}
                      className="ml-auto text-[11px] rounded-lg px-2 py-1 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', cursor: 'pointer' }}>
                      {['pending','confirmed','shipped','delivered','cancelled'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DASHBOARD TAB ─────────────────────────────── */}
        {activeTab === 'dashboard' && isOwnStore && targetCreatorId && (
          <ShopDashboard creatorId={targetCreatorId} />
        )}

      </div>

      {/* Product Sheet */}
      <AnimatePresence>
        {selected && (
          <ProductSheet item={selected} user={user} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAdd && isOwnStore && (
          <AddItemModal creatorId={targetCreatorId} onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>
      <SwanyBotWidget />
      <NotificationBell />
      <RewardShop creatorId={user?.id || null} roomId={null} currentUser={user || null} />
      <StreamerMonetizationCenter />
      <SwanAIRecommendations roomId={null} currentLayout='merch' viewerCount={0} />
    </div>
  );
}
