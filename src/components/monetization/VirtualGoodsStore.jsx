import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingBag, Sparkles } from 'lucide-react';

const rarityStyles = {
  common:    { background: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.3)' },
  rare:      { background: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' },
  epic:      { background: 'rgba(212,175,55,0.15)',  color: '#a78bfa', border: '1px solid rgba(212,175,55,0.3)' },
  legendary: { background: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
};

const TABS = ['all', 'badge', 'emoji', 'theme', 'effect', 'frame'];

export default function VirtualGoodsStore({ userId }) {
  const [selectedType, setSelectedType] = useState('all');
  const queryClient = useQueryClient();

  const { data: goods = [], isLoading } = useQuery({
    queryKey: ['virtualGoods', selectedType],
    queryFn: async () => {
      const allGoods = await base44.entities.VirtualGood.list();
      return selectedType === 'all'
        ? allGoods.filter(g => g.is_active)
        : allGoods.filter(g => g.is_active && g.type === selectedType);
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['userInventory', userId],
    queryFn: () => base44.entities.UserInventory.filter({ user_id: userId }),
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ good }) => {
      await base44.entities.Transaction.create({
        type: 'virtual_good',
        amount: good.price,
        from_user_id: userId,
        virtual_good_id: good.id,
        status: 'completed',
      });

      await base44.entities.UserInventory.create({
        user_id: userId,
        virtual_good_id: good.id,
        acquired_date: new Date().toISOString(),
      });

      if (good.is_limited && good.stock) {
        await base44.entities.VirtualGood.update(good.id, { stock: good.stock - 1 });
      }
    },
    onSuccess: () => {
      toast.success('Item purchased! ✨');
      queryClient.invalidateQueries(['virtualGoods']);
      queryClient.invalidateQueries(['userInventory']);
    },
    onError: () => {
      toast.error('Purchase failed');
    },
  });

  const isOwned = (goodId) => inventory.some(item => item.virtual_good_id === goodId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Barlow Condensed, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ShoppingBag style={{ width: 24, height: 24, color: '#fff' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Virtual Goods Store</h2>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedType(tab)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: selectedType === tab ? 'rgba(212,175,55,0.2)' : 'transparent',
              color: selectedType === tab ? '#D4AF37' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: selectedType === tab ? 700 : 400,
              fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'capitalize',
            }}
          >
            {tab === 'all' ? 'All Items' : tab.charAt(0).toUpperCase() + tab.slice(1) + 's'}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)' }}>Loading items...</div>
        ) : goods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)' }}>No items available</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {goods.map((good) => (
              <div key={good.id} style={{ borderRadius: 12, background: 'rgba(13,6,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 16px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{good.name}</span>
                        {good.is_limited && <Sparkles style={{ width: 16, height: 16, color: '#f59e0b' }} />}
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{good.description}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {good.rarity && (
                      <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize', ...(rarityStyles[good.rarity] || rarityStyles.common) }}>
                        {good.rarity}
                      </span>
                    )}
                    {good.is_limited && good.stock !== undefined && (
                      <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {good.stock} left
                      </span>
                    )}
                  </div>
                </div>

                {good.image_url && (
                  <div style={{ padding: '0 16px 8px' }}>
                    <img src={good.image_url} alt={good.name} style={{ width: '100%', height: 128, objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                )}

                <div style={{ padding: '8px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>${good.price}</span>
                  {isOwned(good.id) ? (
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                      Owned
                    </span>
                  ) : (
                    <button
                      onClick={() => purchaseMutation.mutate({ good })}
                      disabled={purchaseMutation.isPending || (good.is_limited && good.stock === 0)}
                      style={{ padding: '6px 14px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, color: '#D4AF37', fontSize: 13, fontWeight: 700, cursor: (purchaseMutation.isPending || (good.is_limited && good.stock === 0)) ? 'not-allowed' : 'pointer', opacity: (purchaseMutation.isPending || (good.is_limited && good.stock === 0)) ? 0.5 : 1, fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {purchaseMutation.isPending ? 'Buying...' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
