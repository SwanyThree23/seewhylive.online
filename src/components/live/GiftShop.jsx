import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const BG      = '#080B18';
const GREEN   = '#6DBF7E';

export const GIFTS = [
  { id: 'rose',     emoji: '🌹', name: 'Rose',      price: 0.99,   color: '#E8003D', particles: 12, rarity: 'common' },
  { id: 'confetti', emoji: '🎉', name: 'Confetti',  price: 1.99,   color: '#D4854A', particles: 20, rarity: 'common' },
  { id: 'rocket',   emoji: '🚀', name: 'Rocket',    price: 4.99,   color: '#C9A84C', particles: 24, rarity: 'rare' },
  { id: 'crown',    emoji: '👑', name: 'Crown',     price: 9.99,   color: GOLD,      particles: 30, rarity: 'rare' },
  { id: 'lion',     emoji: '🦁', name: 'Lion King', price: 19.99,  color: '#D4854A', particles: 36, rarity: 'epic' },
  { id: 'diamond',  emoji: '💎', name: 'Diamond',   price: 49.99,  color: '#C9A84C', particles: 48, rarity: 'legendary' },
  { id: 'tsunami',  emoji: '🌊', name: 'Tsunami',   price: 99.99,  color: '#0066FF', particles: 60, rarity: 'legendary' },
  { id: 'legend',   emoji: '🏆', name: 'Legend',    price: 199.99, color: GOLD,      particles: 80, rarity: 'legendary' },
  { id: 'star',     emoji: '⭐', name: 'Star',      price: 2.99,   color: '#FFD700', particles: 18, rarity: 'common' },
  { id: 'fire',     emoji: '🔥', name: 'Fire',      price: 7.99,   color: '#FF4500', particles: 28, rarity: 'rare' },
  { id: 'unicorn',  emoji: '🦄', name: 'Unicorn',   price: 29.99,  color: '#C084FC', particles: 40, rarity: 'epic' },
  { id: 'phoenix',  emoji: '🔮', name: 'Phoenix',   price: 149.99, color: '#A855F7', particles: 70, rarity: 'legendary', featured: true },
];

const BUNDLES = [
  { id: 'starter',  label: '💝 Starter Pack',  gifts: ['rose','star','confetti'],   price: 4.99,  savings: '20% off' },
  { id: 'supporter',label: '🌟 Supporter Pack', gifts: ['rocket','fire','crown'],    price: 19.99, savings: '15% off' },
  { id: 'vip',      label: '💎 VIP Pack',       gifts: ['lion','diamond','unicorn'], price: 79.99, savings: '25% off' },
];

const RARITY_COLORS = { common: 'rgba(255,255,255,0.4)', rare: GOLD, epic: '#D4854A', legendary: '#C084FC' };

function GiftCard({ gift, selected, onSelect }) {
  const isLegendary = gift.price >= 49.99;
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => onSelect(gift)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 6px 8px',
        borderRadius: 14,
        border: selected
          ? `2px solid ${gift.color}`
          : '1.5px solid rgba(255,255,255,0.08)',
        background: selected
          ? `${gift.color}18`
          : isLegendary
            ? 'rgba(212,175,55,0.04)'
            : 'rgba(255,255,255,0.03)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? `0 0 12px ${gift.color}44` : 'none',
      }}
    >
      {isLegendary && (
        <div style={{
          position: 'absolute',
          top: -1,
          right: -1,
          fontSize: 7,
          fontWeight: 900,
          fontFamily: 'Barlow Condensed, sans-serif',
          letterSpacing: '0.06em',
          color: GOLD,
          background: `${GOLD}22`,
          border: `1px solid ${GOLD}40`,
          borderRadius: '0 12px 0 6px',
          padding: '1px 5px',
        }}>
          HOT
        </div>
      )}
      <span style={{ fontSize: 28, lineHeight: 1 }}>{gift.emoji}</span>
      <span style={{
        fontSize: 11,
        fontWeight: 900,
        fontFamily: 'Barlow Condensed, sans-serif',
        color: selected ? gift.color : 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {gift.name}
      </span>
      <span style={{
        fontSize: 11,
        fontWeight: 900,
        fontFamily: 'Barlow Condensed, sans-serif',
        color: selected ? '#fff' : GOLD,
      }}>
        ${gift.price.toFixed(2)}
      </span>
    </motion.button>
  );
}

function TopGifters({ roomId }) {
  const { data: tips = [] } = useQuery({
    queryKey: ['gift-tips', roomId],
    queryFn: () => base44.entities.TipAlert.filter({ room_id: roomId }),
    enabled: !!roomId,
    refetchInterval: 8000,
  });

  const totals = {};
  tips.forEach(t => {
    const key = t.sender_name || t.sender_id || 'Guest';
    totals[key] = (totals[key] || 0) + (t.amount_usd || 0);
  });
  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) return null;

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <p style={{
        fontSize: 11,
        fontWeight: 900,
        fontFamily: 'Barlow Condensed, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: 6,
      }}>
        Top Gifters
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sorted.map(([name, total], i) => (
          <div key={name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 999,
            background: i === 0 ? `${GOLD}18` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${i === 0 ? GOLD + '40' : 'rgba(255,255,255,0.08)'}`,
          }}>
            <span style={{ fontSize: 10 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'Barlow Condensed, sans-serif',
              color: i === 0 ? GOLD : 'rgba(255,255,255,0.6)',
              maxWidth: 70,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {name.split(' ')[0]}
            </span>
            <span style={{ fontSize: 11, color: GREEN, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900 }}>
              ${total.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GiftShop({ isOpen, onClose, roomId, user, creatorId, creatorName, onGiftSent }) {
  const [selected,   setSelected]   = useState(null);
  const [sending,    setSending]    = useState(false);
  const [qty,        setQty]        = useState(1);
  const [activeTab,  setActiveTab]  = useState('gifts'); // 'gifts' | 'bundles'
  const [recentSent, setRecentSent] = useState([]);

  const featuredGift = GIFTS.find(g => g.featured);
  const totalPrice   = selected ? (selected.price * qty).toFixed(2) : null;

  async function handleSend() {
    if (!selected || sending) return;
    if (!user?.id) {
      toast.error('Sign in to send gifts');
      return;
    }
    setSending(true);
    try {
      const gemTypeMap = { diamond: 'diamond', crown: 'gold', lightning: 'diamond', fire: 'ruby', heart: 'ruby', rose: 'gold', crystal: 'purple', skull: 'bone' };
      await Promise.all([
        base44.entities.TipAlert.create({
          room_id:     roomId,
          sender_id:   user.id,
          sender_name: user.full_name || user.email || 'Guest',
          creator_id:  creatorId,
          amount_usd:  selected.price,
          message:     `${selected.emoji} ${selected.name}`,
        }),
        base44.entities.GemTransaction?.create({
          sender_id:    user.id,
          recipient_id: creatorId,
          stream_id:    roomId,
          gem_type:     gemTypeMap[selected.id] || 'gold',
          quantity:     1,
          usd_value:    selected.price,
        }).catch(() => {}),
      ]);
      toast.success(`${selected.emoji} ${qty > 1 ? `x${qty} ` : ''}${selected.name} sent to ${creatorName}!`);
      onGiftSent?.(selected, user);
      const entry = { ...selected, qty, sentAt: Date.now() };
      setRecentSent(prev => [entry, ...prev].slice(0, 4));
      setTimeout(() => setRecentSent(prev => prev.filter(r => r.sentAt !== entry.sentAt)), 30000);
      onClose();
      setSelected(null);
      setQty(1);
    } catch {
      toast.error('Failed to send gift');
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #100820 0%, #080B18 100%)',
              border: '1px solid rgba(212,175,55,0.18)',
              borderBottom: 'none',
              maxHeight: '75vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gift style={{ width: 16, height: 16, color: GOLD }} />
                <span style={{
                  fontSize: 16,
                  fontWeight: 900,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Gift Shop
                </span>
                {creatorName && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    → {creatorName}
                  </span>
                )}
              </div>
              <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <TopGifters roomId={roomId} />

              {/* Featured gift banner */}
              {featuredGift && activeTab === 'gifts' && (
                <div style={{ margin: '10px 16px 0', padding: '8px 12px', borderRadius: 12,
                  background: `linear-gradient(135deg, ${featuredGift.color}22, rgba(168,85,247,0.12))`,
                  border: `1px solid ${featuredGift.color}44`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{featuredGift.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif',
                      color: featuredGift.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      ✨ Featured Gift
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: '#fff' }}>
                      {featuredGift.name} — ${featuredGift.price.toFixed(2)}
                    </div>
                  </div>
                  <button onClick={() => setSelected(featuredGift)}
                    style={{ padding: '5px 12px', borderRadius: 8, fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: featuredGift.color, color: '#000', border: 'none', cursor: 'pointer' }}>
                    Pick
                  </button>
                </div>
              )}

              {/* Tab bar: Gifts / Bundles */}
              <div style={{ display: 'flex', gap: 4, padding: '10px 16px 0' }}>
                {[{ id: 'gifts', label: '🎁 Gifts' }, { id: 'bundles', label: '📦 Bundles' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', border: 'none',
                      cursor: 'pointer', background: activeTab === tab.id ? `${GOLD}22` : 'rgba(255,255,255,0.05)',
                      color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)',
                      borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'gifts' && (
                <>
                  {/* Quantity selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif',
                      color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Qty</span>
                    {[1, 3, 5, 10].map(n => (
                      <button key={n} onClick={() => setQty(n)}
                        style={{ padding: '4px 10px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif',
                          fontSize: 11, fontWeight: 900, border: 'none', cursor: 'pointer',
                          background: qty === n ? `${GOLD}22` : 'rgba(255,255,255,0.06)',
                          color: qty === n ? GOLD : 'rgba(255,255,255,0.4)',
                          outline: qty === n ? `1px solid ${GOLD}50` : 'none' }}>
                        {n === 1 ? '×1' : `×${n}`}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 16 }}>
                    {GIFTS.map(gift => (
                      <GiftCard key={gift.id} gift={gift} selected={selected?.id === gift.id} onSelect={setSelected} />
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'bundles' && (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BUNDLES.map(bundle => (
                    <div key={bundle.id} style={{ padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(212,175,55,0.06)', border: `1px solid ${GOLD}25`,
                      display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: '#fff' }}>
                          {bundle.label}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {bundle.gifts.map(gid => {
                            const g = GIFTS.find(x => x.id === gid);
                            return g ? <span key={gid} style={{ fontSize: 18 }}>{g.emoji}</span> : null;
                          })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}>
                          ${bundle.price.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif',
                          color: GREEN, letterSpacing: '0.04em' }}>
                          {bundle.savings}
                        </div>
                      </div>
                      <button
                        onClick={() => { toast.info(`${bundle.label} — coming soon!`); }}
                        style={{ padding: '7px 12px', borderRadius: 8, fontFamily: 'Barlow Condensed, sans-serif',
                          fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}40`, cursor: 'pointer' }}>
                        Buy
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent sent history */}
              {recentSent.length > 0 && (
                <div style={{ padding: '0 16px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif',
                    color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Recently Sent
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {recentSent.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: 14 }}>{r.emoji}</span>
                        <span style={{ fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                          {r.qty > 1 ? `×${r.qty} ` : ''}{r.name}
                        </span>
                        <span style={{ fontSize: 9, color: GREEN, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>✓ sent</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              <motion.button
                whileTap={{ scale: selected ? 0.97 : 1 }}
                onClick={handleSend}
                disabled={!selected || sending}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 14,
                  border: 'none',
                  cursor: selected ? 'pointer' : 'default',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: selected
                    ? `linear-gradient(135deg, ${selected.color}, ${GOLD})`
                    : 'rgba(255,255,255,0.06)',
                  color: selected ? '#000' : 'rgba(255,255,255,0.25)',
                  boxShadow: selected ? `0 4px 20px ${selected.color}44` : 'none',
                  transition: 'all 0.2s',
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {selected
                  ? (sending ? 'Sending…' : `${selected.emoji} Send ${qty > 1 ? `×${qty} ` : ''}${selected.name} — $${totalPrice}`)
                  : 'Select a gift'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
