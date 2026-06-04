import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PINK    = '#FF1564';
const BG      = '#080B18';
const GREEN   = '#6DBF7E';

export const GIFTS = [
  { id: 'rose',     emoji: '🌹', name: 'Rose',      price: 0.99,   color: '#E8003D', particles: 12 },
  { id: 'confetti', emoji: '🎉', name: 'Confetti',  price: 1.99,   color: '#FF9500', particles: 20 },
  { id: 'rocket',   emoji: '🚀', name: 'Rocket',    price: 4.99,   color: '#00B4FF', particles: 24 },
  { id: 'crown',    emoji: '👑', name: 'Crown',     price: 9.99,   color: GOLD,      particles: 30 },
  { id: 'lion',     emoji: '🦁', name: 'Lion King', price: 19.99,  color: '#FF8C00', particles: 36 },
  { id: 'diamond',  emoji: '💎', name: 'Diamond',   price: 49.99,  color: '#C9A84C', particles: 48 },
  { id: 'tsunami',  emoji: '🌊', name: 'Tsunami',   price: 99.99,  color: '#0066FF', particles: 60 },
  { id: 'legend',   emoji: '🏆', name: 'Legend',    price: 199.99, color: GOLD,      particles: 80 },
];

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
    queryFn: () => base44.entities.Tip.filter({ room_id: roomId, type: 'gift' }),
    enabled: !!roomId,
    refetchInterval: 8000,
  });

  const totals = {};
  tips.forEach(t => {
    const key = t.sender_name || t.user_id || 'Guest';
    totals[key] = (totals[key] || 0) + (t.amount || 0);
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
  const [selected, setSelected] = useState(null);
  const [sending,  setSending]  = useState(false);

  async function handleSend() {
    if (!selected || sending) return;
    if (!user?.id) {
      toast.error('Sign in to send gifts');
      return;
    }
    setSending(true);
    try {
      await base44.entities.Tip.create({
        room_id:     roomId,
        user_id:     user.id,
        sender_name: user.full_name || user.email || 'Guest',
        creator_id:  creatorId,
        amount:      selected.price,
        currency:    'usd',
        type:        'gift',
        gift_id:     selected.id,
        gift_name:   selected.name,
        gift_emoji:  selected.emoji,
        gift_color:  selected.color,
      });
      toast.success(`${selected.emoji} ${selected.name} sent to ${creatorName}!`);
      onGiftSent?.(selected, user);
      onClose();
      setSelected(null);
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

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                padding: 16,
              }}>
                {GIFTS.map(gift => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    selected={selected?.id === gift.id}
                    onSelect={setSelected}
                  />
                ))}
              </div>
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
                  ? (sending ? 'Sending…' : `${selected.emoji} Send ${selected.name} — $${selected.price.toFixed(2)}`)
                  : 'Select a gift'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
