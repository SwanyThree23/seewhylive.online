import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Clock, Plus, X, Check, Trophy, Flame, Crown, ArrowUp,
  Package, Users, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const GOLD = '#D4AF37';
const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif',
};

const AUCTION_TYPES = [
  { id: 'item', label: '📦 Physical Item', desc: 'Signed merch, equipment, etc.' },
  { id: 'one_on_one', label: '🎙 1-on-1 Time', desc: 'Private session with creator' },
  { id: 'shoutout', label: '📣 Shoutout', desc: 'Personalized shoutout on stream' },
  { id: 'custom_art', label: '🎨 Custom Art', desc: 'Creator-made artwork' },
  { id: 'coaching', label: '🏆 Coaching', desc: 'Game/skill coaching session' },
  { id: 'experience', label: '✨ Experience', desc: 'Unique creator experience' },
];

function CountdownTimer({ endsAt, onExpire }) {
  const [time, setTime] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) { setTime('ENDED'); onExpire?.(); return; }
      setUrgent(diff < 60000);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);

  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: urgent ? '#FF4444' : '#D4AF37' }}>
      <Clock className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: 4 }} />{time}
    </span>
  );
}

function BidRow({ bid, isWinning, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
        background: isWinning ? 'rgba(212,175,55,0.1)' : 'transparent',
        border: isWinning ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
      }}
    >
      {isWinning && <Crown className="w-3.5 h-3.5" style={{ color: GOLD, flexShrink: 0 }} />}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', width: 20, flexShrink: 0 }}>{isWinning ? '' : `#${index + 1}`}</span>
      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isWinning ? GOLD : 'rgba(255,255,255,0.7)' }}>{bid.bidder_name}</span>
      <span style={{ fontWeight: 700, fontSize: 13, color: isWinning ? GOLD : 'rgba(255,255,255,0.5)' }}>${bid.amount.toLocaleString()}</span>
    </motion.div>
  );
}

function AuctionCard({ auction, currentUser, onBid, isCreator, onEnd }) {
  const [bidAmount, setBidAmount] = useState(Math.ceil((auction.current_bid || auction.starting_bid) + (auction.bid_increment || 1)));
  const [showBids, setShowBids] = useState(false);
  const [optimisticBid, setOptimisticBid] = useState(null); // { amount, winnerId }
  const [bidPending, setBidPending] = useState(false);
  const isWinning = (optimisticBid?.winnerId ?? auction.current_winner_id) === currentUser?.id;
  const isEnded = auction.status === 'ended';
  const displayBid = optimisticBid?.amount ?? (auction.current_bid || auction.starting_bid);
  const displayBidCount = optimisticBid ? (auction.bid_count || 0) + 1 : (auction.bid_count || 0);
  const displayWinnerName = optimisticBid ? (currentUser?.full_name || currentUser?.email) : auction.current_winner_name;

  const { data: bids = [] } = useQuery({
    queryKey: ['auction-bids', auction.id],
    queryFn: () => base44.entities.AuctionBid.filter({ auction_id: auction.id }, '-amount', 20),
    refetchInterval: 3000,
  });

  const minBid = Math.ceil(displayBid + (auction.bid_increment || 1));

  const cardBorder =
    auction.status === 'ending_soon' ? '1px solid rgba(192,57,43,0.5)' :
    auction.status === 'active' ? '1px solid rgba(212,175,55,0.2)' :
    isEnded ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.1)';

  const statusBadge = () => {
    if (auction.status === 'active') return { bg: 'rgba(21,128,61,0.4)', color: '#6DBF7E', text: '🟢 LIVE' };
    if (auction.status === 'ending_soon') return { bg: 'rgba(153,27,27,0.4)', color: '#FF4444', text: '🔴 ENDING' };
    if (auction.status === 'ended') return { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', text: '✓ ENDED' };
    return { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', text: '⏳ SOON' };
  };
  const sb = statusBadge();

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: cardBorder, borderRadius: 12, opacity: isEnded ? 0.6 : 1, transition: 'all 0.2s' }}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: sb.bg, color: sb.color, fontFamily: 'Barlow Condensed, sans-serif' }}>
                {sb.text}
              </span>
              <p style={{ fontWeight: 700, color: '#fff', margin: 0 }}>{auction.title}</p>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{AUCTION_TYPES.find(t => t.id === auction.auction_type)?.label}</p>
          </div>
          {!isEnded && auction.ends_at && (
            <CountdownTimer endsAt={auction.ends_at} onExpire={() => {}} />
          )}
        </div>

        {auction.description && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 8, margin: 0 }}>{auction.description}</p>
        )}

        {/* Current bid */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(212,175,55,0.05)', borderRadius: 12, border: '1px solid rgba(212,175,55,0.1)' }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{isEnded ? 'Winning Bid' : 'Current Bid'}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: GOLD, margin: '2px 0' }}>${displayBid.toLocaleString()}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{displayBidCount} bids</p>
          </div>
          {(displayWinnerName || auction.current_winner_name) && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{isEnded ? '🏆 Winner' : '👑 Leading'}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '2px 0' }}>{displayWinnerName}</p>
              {isWinning && (
                <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,175,55,0.2)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  That's you!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bid input (active only, non-creator) */}
        {auction.status === 'active' && !isCreator && currentUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>$</span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(Number(e.target.value))}
                  min={minBid}
                  style={{ ...inputStyle, paddingLeft: 28, height: 36 }}
                />
              </div>
              <button
                disabled={bidPending}
                onClick={() => {
                  if (bidAmount < minBid) return toast.error(`Minimum bid: $${minBid}`);
                  // Optimistic update
                  setOptimisticBid({ amount: bidAmount, winnerId: currentUser?.id });
                  setBidPending(true);
                  const nextBid = Math.ceil(bidAmount + (auction.bid_increment || 1));
                  Promise.resolve(onBid(auction, bidAmount)).finally(() => {
                    setBidPending(false);
                  });
                  setBidAmount(nextBid);
                }}
                style={{ background: bidPending ? 'rgba(212,175,55,0.5)' : GOLD, color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '0 16px', height: 36, cursor: bidPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: 'Barlow Condensed, sans-serif', opacity: bidPending ? 0.7 : 1 }}
              >
                <Gavel className="w-4 h-4" /> {bidPending ? '…' : 'Bid'}
              </button>
            </div>
            {/* Quick bid buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[minBid, minBid + 5, minBid + 10, minBid + 25].map(amt => (
                <button key={amt} onClick={() => setBidAmount(amt)}
                  style={{ flex: 1, fontSize: 10, padding: '4px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  ${amt}
                </button>
              ))}
            </div>
            {/* Buyout */}
            {auction.buyout_price && (
              <button
                onClick={() => { onBid(auction, auction.buyout_price, true); }}
                style={{ width: '100%', border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#D4AF37', borderRadius: 8, padding: '6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                <Zap className="w-3.5 h-3.5" /> Buy Now for ${auction.buyout_price}
              </button>
            )}
          </div>
        )}

        {/* Bid history toggle */}
        <button onClick={() => setShowBids(!showBids)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, cursor: 'pointer' }}>
          <span>Bid History ({bids.length})</span>
          {showBids ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <AnimatePresence>
          {showBids && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bids.map((bid, i) => <BidRow key={bid.id} bid={bid} isWinning={i === 0} index={i} />)}
              {bids.length === 0 && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '8px 0', margin: 0 }}>No bids yet — be first!</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Creator controls */}
        {isCreator && auction.status !== 'ended' && (
          <button onClick={() => onEnd(auction.id)}
            style={{ width: '100%', border: '1px solid rgba(153,27,27,0.3)', background: 'transparent', color: '#FF4444', borderRadius: 8, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}>
            End Auction
          </button>
        )}
      </div>
    </div>
  );
}

export default function LiveAuctionWidget({ creatorId, roomId, isCreator, currentUser }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', auction_type: 'item',
    starting_bid: 1, bid_increment: 1, buyout_price: '',
    duration_minutes: 10,
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ['live-auctions', creatorId, roomId],
    queryFn: () => base44.entities.LiveAuction.filter(
      roomId ? { creator_id: creatorId, room_id: roomId } : { creator_id: creatorId },
      '-created_date', 20
    ),
    enabled: !!creatorId,
    refetchInterval: 4000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.LiveAuction.subscribe((event) => {
      if (event.data?.creator_id === creatorId) {
        qc.invalidateQueries({ queryKey: ['live-auctions', creatorId, roomId] });
        if (event.type === 'update' && event.data?.status === 'ended') {
          toast.success(`Auction "${event.data.title}" ended — winner: ${event.data.winner_name || 'N/A'}`);
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 }, colors: ['#d4af37', '#fff', '#D4AF37'] });
        }
      }
    });
    return unsub;
  }, [creatorId, roomId]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveAuction.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['live-auctions'] }); setShowCreate(false); toast.success('Auction started!'); },
  });

  const bidMutation = useMutation({
    mutationFn: async ({ auction, amount, isBuyout }) => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      // Create bid record
      await base44.entities.AuctionBid.create({
        auction_id: auction.id,
        bidder_id: currentUser.id,
        bidder_name: currentUser.full_name || currentUser.email,
        amount,
        is_winning: true,
        is_buyout: isBuyout || false,
      });
      // Update auction
      await base44.entities.LiveAuction.update(auction.id, {
        current_bid: amount,
        current_winner_id: currentUser.id,
        current_winner_name: currentUser.full_name || currentUser.email,
        bid_count: (auction.bid_count || 0) + 1,
        status: isBuyout ? 'ended' : (new Date(auction.ends_at) - new Date() < 60000 ? 'ending_soon' : 'active'),
        ...(isBuyout ? { winner_id: currentUser.id, winner_name: currentUser.full_name || currentUser.email, final_amount: amount } : {}),
      });
    },
    onSuccess: (_, { auction, amount, isBuyout }) => {
      qc.invalidateQueries({ queryKey: ['live-auctions'] });
      qc.invalidateQueries({ queryKey: ['auction-bids'] });
      toast.success(`Bid of $${amount} placed!`);
      if (currentUser?.id) {
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: isBuyout ? 'ppv_purchase' : 'tip_sent',
          title: isBuyout ? `Won auction: ${auction?.title || 'Auction'}` : `Bid $${amount} on: ${auction?.title || 'Auction'}`,
          amount,
          recipient_id: auction?.creator_id,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Failed to place bid'),
  });

  const endMutation = useMutation({
    mutationFn: async (id) => {
      const auction = auctions.find(a => a.id === id);
      await base44.entities.LiveAuction.update(id, {
        status: 'ended',
        winner_id: auction?.current_winner_id,
        winner_name: auction?.current_winner_name,
        final_amount: auction?.current_bid,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-auctions'] }),
  });

  const handleCreate = () => {
    if (!form.title) return toast.error('Title required');
    const endsAt = new Date(Date.now() + form.duration_minutes * 60000).toISOString();
    createMutation.mutate({
      ...form,
      creator_id: creatorId,
      room_id: roomId || null,
      buyout_price: form.buyout_price ? Number(form.buyout_price) : null,
      ends_at: endsAt,
      status: 'active',
      current_bid: 0,
      bid_count: 0,
    });
  };

  const activeAuctions = auctions.filter(a => a.status !== 'ended' && a.status !== 'cancelled');
  const endedAuctions = auctions.filter(a => a.status === 'ended');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <Gavel className="w-4 h-4" style={{ color: GOLD }} /> Live Auctions
          {activeAuctions.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(153,27,27,0.4)', color: '#FF4444', border: '1px solid rgba(153,27,27,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {activeAuctions.length} LIVE
            </span>
          )}
        </h3>
        {isCreator && (
          <button onClick={() => setShowCreate(!showCreate)}
            style={{ background: GOLD, color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, height: 28, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <Plus className="w-3 h-3" /> New Auction
          </button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0 }}>Start New Auction</p>
              <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
            </div>

            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What are you auctioning?" style={inputStyle} />

            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {AUCTION_TYPES.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, auction_type: t.id }))}
                  style={{ textAlign: 'left', padding: 8, borderRadius: 12, border: `1px solid ${form.auction_type === t.id ? GOLD : 'rgba(255,255,255,0.1)'}`, background: form.auction_type === t.id ? 'rgba(212,175,55,0.1)' : 'transparent', color: form.auction_type === t.id ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s', fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                  <p style={{ fontSize: 10, opacity: 0.6, marginTop: 2, marginBottom: 0 }}>{t.desc}</p>
                </button>
              ))}
            </div>

            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what the winner gets..." rows={2}
              style={{ ...inputStyle, resize: 'none', minHeight: 60 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Starting $</label>
                <input type="number" value={form.starting_bid} onChange={e => setForm(f => ({ ...f, starting_bid: Number(e.target.value) }))}
                  style={{ ...inputStyle, height: 32, fontSize: 12 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Min Increment</label>
                <input type="number" value={form.bid_increment} onChange={e => setForm(f => ({ ...f, bid_increment: Number(e.target.value) }))}
                  style={{ ...inputStyle, height: 32, fontSize: 12 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Buy Now $</label>
                <input type="number" value={form.buyout_price} onChange={e => setForm(f => ({ ...f, buyout_price: e.target.value }))}
                  placeholder="Optional" style={{ ...inputStyle, height: 32, fontSize: 12 }} />
              </div>
            </div>

            {/* Duration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>Duration</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[5, 10, 15, 30, 60].map(min => (
                  <button key={min} onClick={() => setForm(f => ({ ...f, duration_minutes: min }))}
                    style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${form.duration_minutes === min ? GOLD : 'rgba(255,255,255,0.1)'}`, background: form.duration_minutes === min ? 'rgba(212,175,55,0.1)' : 'transparent', color: form.duration_minutes === min ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {min}min
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCreate} disabled={createMutation.isPending}
              style={{ width: '100%', background: GOLD, color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: createMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, opacity: createMutation.isPending ? 0.7 : 1 }}>
              <Gavel className="w-4 h-4" /> Start Auction
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active auctions */}
      {activeAuctions.length === 0 && endedAuctions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)' }}>
          <Gavel className="w-10 h-10" style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontSize: 13, margin: 0 }}>{isCreator ? 'Start an auction to engage your viewers!' : 'No active auctions'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...activeAuctions, ...endedAuctions.slice(0, 3)].map(auction => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              currentUser={currentUser}
              isCreator={isCreator}
              onBid={(a, amount, isBuyout) => bidMutation.mutate({ auction: a, amount, isBuyout })}
              onEnd={(id) => endMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}