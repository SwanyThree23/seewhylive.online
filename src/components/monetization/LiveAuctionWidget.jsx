import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Gavel, Clock, Plus, X, Check, Trophy, Flame, Crown, ArrowUp,
  Package, Users, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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
    <span className={`font-mono font-bold text-sm ${urgent ? 'text-red-400 animate-pulse' : 'text-[#00d4ff]'}`}>
      <Clock className="w-3.5 h-3.5 inline mr-1" />{time}
    </span>
  );
}

function BidRow({ bid, isWinning, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${isWinning ? 'bg-[#d4af37]/10 border border-[#d4af37]/20' : ''}`}
    >
      {isWinning && <Crown className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
      <span className="text-xs text-white/60 w-5 shrink-0">{isWinning ? '' : `#${index + 1}`}</span>
      <span className={`text-sm font-semibold flex-1 truncate ${isWinning ? 'text-[#d4af37]' : 'text-white/70'}`}>{bid.bidder_name}</span>
      <span className={`font-bold text-sm ${isWinning ? 'text-[#d4af37]' : 'text-white/50'}`}>${bid.amount.toLocaleString()}</span>
    </motion.div>
  );
}

function AuctionCard({ auction, currentUser, onBid, isCreator, onEnd }) {
  const [bidAmount, setBidAmount] = useState(Math.ceil((auction.current_bid || auction.starting_bid) + (auction.bid_increment || 1)));
  const [showBids, setShowBids] = useState(false);
  const isWinning = auction.current_winner_id === currentUser?.id;
  const isEnded = auction.status === 'ended';

  const { data: bids = [] } = useQuery({
    queryKey: ['auction-bids', auction.id],
    queryFn: () => base44.entities.AuctionBid.filter({ auction_id: auction.id }, '-amount', 20),
    refetchInterval: 3000,
  });

  const minBid = Math.ceil((auction.current_bid || auction.starting_bid) + (auction.bid_increment || 1));

  return (
    <Card className={`bg-[rgba(255,255,255,0.04)] transition-all ${
      auction.status === 'ending_soon' ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
      auction.status === 'active' ? 'border-[#d4af37]/20' :
      isEnded ? 'border-white/5 opacity-60' : 'border-white/10'
    }`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[9px] px-2 ${
                auction.status === 'active' ? 'bg-green-900/40 text-green-400 border-green-700/30' :
                auction.status === 'ending_soon' ? 'bg-red-900/40 text-red-400 border-red-700/30 animate-pulse' :
                auction.status === 'ended' ? 'bg-white/10 text-white/30' : 'bg-white/5 text-white/20'
              }`}>
                {auction.status === 'active' ? '🟢 LIVE' : auction.status === 'ending_soon' ? '🔴 ENDING' : auction.status === 'ended' ? '✓ ENDED' : '⏳ SOON'}
              </Badge>
              <p className="font-bold text-white">{auction.title}</p>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">{AUCTION_TYPES.find(t => t.id === auction.auction_type)?.label}</p>
          </div>
          {!isEnded && auction.ends_at && (
            <CountdownTimer endsAt={auction.ends_at} onExpire={() => {}} />
          )}
        </div>

        {auction.description && (
          <p className="text-xs text-white/60 bg-white/3 rounded-lg p-2">{auction.description}</p>
        )}

        {/* Current bid */}
        <div className="flex items-center justify-between p-3 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
          <div>
            <p className="text-[10px] text-white/40">{isEnded ? 'Winning Bid' : 'Current Bid'}</p>
            <p className="text-2xl font-bold text-[#d4af37]">${(auction.current_bid || auction.starting_bid).toLocaleString()}</p>
            <p className="text-[10px] text-white/40">{auction.bid_count || 0} bids</p>
          </div>
          {auction.current_winner_name && (
            <div className="text-right">
              <p className="text-[10px] text-white/40">{isEnded ? '🏆 Winner' : '👑 Leading'}</p>
              <p className="text-sm font-semibold text-white">{auction.current_winner_name}</p>
              {isWinning && <Badge className="text-[9px] bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30">That's you!</Badge>}
            </div>
          )}
        </div>

        {/* Bid input (active only, non-creator) */}
        {auction.status === 'active' && !isCreator && currentUser && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(Number(e.target.value))}
                  min={minBid}
                  className="pl-7 bg-white/5 border-white/20 text-white h-9"
                />
              </div>
              <Button
                onClick={() => {
                  if (bidAmount < minBid) return toast.error(`Minimum bid: $${minBid}`);
                  onBid(auction, bidAmount);
                  setBidAmount(Math.ceil(bidAmount + (auction.bid_increment || 1)));
                }}
                className="bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold gap-1.5 h-9 shrink-0"
              >
                <Gavel className="w-4 h-4" /> Bid
              </Button>
            </div>
            {/* Quick bid buttons */}
            <div className="flex gap-1.5">
              {[minBid, minBid + 5, minBid + 10, minBid + 25].map(amt => (
                <button key={amt} onClick={() => setBidAmount(amt)}
                  className="flex-1 text-[10px] py-1 rounded-lg border border-white/10 text-white/50 hover:border-[#d4af37]/30 hover:text-[#d4af37] transition-all">
                  ${amt}
                </button>
              ))}
            </div>
            {/* Buyout */}
            {auction.buyout_price && (
              <Button
                onClick={() => { onBid(auction, auction.buyout_price, true); }}
                variant="outline"
                className="w-full border-[#a78bfa]/30 text-[#a78bfa] hover:bg-[#a78bfa]/10 gap-1.5 h-8 text-xs"
              >
                <Zap className="w-3.5 h-3.5" /> Buy Now for ${auction.buyout_price}
              </Button>
            )}
          </div>
        )}

        {/* Bid history toggle */}
        <button onClick={() => setShowBids(!showBids)}
          className="w-full flex items-center justify-between text-[10px] text-white/30 hover:text-white/50 transition-all pt-1 border-t border-white/5">
          <span>Bid History ({bids.length})</span>
          {showBids ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <AnimatePresence>
          {showBids && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-0.5">
              {bids.map((bid, i) => <BidRow key={bid.id} bid={bid} isWinning={i === 0} index={i} />)}
              {bids.length === 0 && <p className="text-[10px] text-white/20 text-center py-2">No bids yet — be first!</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Creator controls */}
        {isCreator && auction.status !== 'ended' && (
          <Button onClick={() => onEnd(auction.id)} variant="outline" size="sm"
            className="w-full border-red-700/30 text-red-400 hover:bg-red-900/20 text-xs h-7">
            End Auction
          </Button>
        )}
      </CardContent>
    </Card>
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
        qc.invalidateQueries(['live-auctions', creatorId, roomId]);
        if (event.type === 'update' && event.data?.status === 'ended') {
          toast.success(`Auction "${event.data.title}" ended — winner: ${event.data.winner_name || 'N/A'}`);
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 }, colors: ['#d4af37', '#fff', '#a78bfa'] });
        }
      }
    });
    return unsub;
  }, [creatorId, roomId]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveAuction.create(data),
    onSuccess: () => { qc.invalidateQueries(['live-auctions']); setShowCreate(false); toast.success('Auction started!'); },
  });

  const bidMutation = useMutation({
    mutationFn: async ({ auction, amount, isBuyout }) => {
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
    onSuccess: (_, { auction, amount }) => {
      qc.invalidateQueries(['live-auctions']);
      qc.invalidateQueries(['auction-bids']);
      toast.success(`Bid of $${amount} placed!`);
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
    onSuccess: () => qc.invalidateQueries(['live-auctions']),
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Gavel className="w-4 h-4 text-[#d4af37]" /> Live Auctions
          {activeAuctions.length > 0 && (
            <Badge className="text-[9px] bg-red-900/40 text-red-400 border-red-700/30 animate-pulse">{activeAuctions.length} LIVE</Badge>
          )}
        </h3>
        {isCreator && (
          <Button onClick={() => setShowCreate(!showCreate)} size="sm"
            className="bg-[#d4af37] text-black font-bold hover:bg-[#f5e6a3] gap-1.5 h-7 text-xs">
            <Plus className="w-3 h-3" /> New Auction
          </Button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-[rgba(212,175,55,0.05)] border border-[#d4af37]/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#d4af37]">Start New Auction</p>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What are you auctioning?" className="bg-white/5 border-white/20 text-white placeholder:text-white/25" />

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-1.5">
              {AUCTION_TYPES.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, auction_type: t.id }))}
                  className={`text-left p-2 rounded-xl border text-xs transition-all ${form.auction_type === t.id ? 'border-[#d4af37] bg-[#d4af37]/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  <span className="font-semibold">{t.label}</span>
                  <p className="text-[10px] opacity-60 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>

            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what the winner gets..." rows={2}
              className="w-full bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]/40 placeholder:text-white/25 resize-none" />

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">Starting $</label>
                <Input type="number" value={form.starting_bid} onChange={e => setForm(f => ({ ...f, starting_bid: Number(e.target.value) }))}
                  className="bg-white/5 border-white/20 text-white h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">Min Increment</label>
                <Input type="number" value={form.bid_increment} onChange={e => setForm(f => ({ ...f, bid_increment: Number(e.target.value) }))}
                  className="bg-white/5 border-white/20 text-white h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">Buy Now $</label>
                <Input type="number" value={form.buyout_price} onChange={e => setForm(f => ({ ...f, buyout_price: e.target.value }))}
                  placeholder="Optional" className="bg-white/5 border-white/20 text-white h-8 text-sm placeholder:text-white/20" />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-[10px] text-white/40">Duration</label>
              <div className="flex gap-1.5 flex-wrap">
                {[5, 10, 15, 30, 60].map(min => (
                  <button key={min} onClick={() => setForm(f => ({ ...f, duration_minutes: min }))}
                    className={`px-3 py-1 rounded-lg border text-xs transition-all ${form.duration_minutes === min ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]' : 'border-white/10 text-white/40'}`}>
                    {min}min
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={createMutation.isPending}
              className="w-full bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold gap-2">
              <Gavel className="w-4 h-4" /> Start Auction
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active auctions */}
      {activeAuctions.length === 0 && endedAuctions.length === 0 ? (
        <div className="text-center py-8 text-white/30">
          <Gavel className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isCreator ? 'Start an auction to engage your viewers!' : 'No active auctions'}</p>
        </div>
      ) : (
        <div className="space-y-3">
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