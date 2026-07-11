import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gavel, Clock, Crown, ChevronUp, X, Plus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const BURGUNDY = '#800020';

const TYPE_COLORS = {
  item:       { color: GOLD,     label: 'ITEM' },
  one_on_one: { color: '#C9A84C', label: '1:1' },
  shoutout:   { color: '#D4AF37', label: 'SHOUTOUT' },
  custom_art: { color: '#FF6B00', label: 'ART' },
  coaching:   { color: '#6DBF7E', label: 'COACHING' },
  experience: { color: '#C0392B', label: 'EXPERIENCE' },
};

function Countdown({ endsAt, onExpired }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0 && onExpired) onExpired();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const isUrgent = remaining < 60 && remaining > 0;
  const fmt = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;

  return (
    <span className="font-mono text-[11px] font-black" style={{ color: isUrgent ? '#C0392B' : GOLD }}>
      {remaining === 0 ? 'ENDED' : fmt}
    </span>
  );
}

function BidHistoryDrawer({ auctionId, open, onClose }) {
  const { data: bids = [] } = useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: () => base44.entities.AuctionBid.filter({ auction_id: auctionId }, '-created_date', 30),
    enabled: open && !!auctionId,
    refetchInterval: 3000,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[60vh] overflow-y-auto"
            style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.2)` }}>
            <div className="flex items-center justify-between p-4 sticky top-0" style={{ background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="font-black uppercase text-[11px]" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>Bid History ({bids.length})</h3>
              <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <div className="p-3 space-y-1">
              {bids.map((bid, i) => (
                <div key={bid.id || i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: i === 0 ? `rgba(212,175,55,0.08)` : 'rgba(255,255,255,0.03)', border: i === 0 ? `1px solid rgba(212,175,55,0.2)` : '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span className="text-[10px] font-bold text-white">{bid.bidder_name}</span>
                    {bid.is_buyout && <span className="ml-1 text-[11px] px-1 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: GOLD }}>BUY NOW</span>}
                    {bid.message && <p className="text-[11px] text-white/40">"{bid.message}"</p>}
                  </div>
                  <span className="font-black text-[13px]" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>${bid.amount}</span>
                </div>
              ))}
              {bids.length === 0 && <p className="text-center py-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No bids yet</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AuctionCard({ auction, currentUser, isHost, onEnd }) {
  const [bidAmount, setBidAmount] = useState('');
  const [showBids, setShowBids] = useState(false);
  const qc = useQueryClient();
  const minBid = (auction.current_bid || auction.starting_bid || 0) + (auction.bid_increment || 1);
  const typeCfg = TYPE_COLORS[auction.auction_type] || { color: GOLD, label: auction.auction_type?.toUpperCase() };
  const isEndingSoon = auction.status === 'ending_soon';

  const bidMut = useMutation({
    mutationFn: async (amount) => {
      await base44.entities.AuctionBid.create({
        auction_id: auction.id,
        bidder_id: currentUser.id,
        bidder_name: currentUser.full_name || currentUser.email,
        amount,
        is_buyout: false,
      });
      await base44.entities.LiveAuction.update(auction.id, {
        current_bid: amount,
        current_winner_id: currentUser.id,
        current_winner_name: currentUser.full_name || currentUser.email,
        bid_count: (auction.bid_count || 0) + 1,
      });
    },
    onSuccess: () => { qc.invalidateQueries(['auctions', auction.room_id]); setBidAmount(''); toast.success('Bid placed!'); },
    onError: () => toast.error('Could not place bid'),
  });

  const buyoutMut = useMutation({
    mutationFn: async () => {
      await base44.entities.AuctionBid.create({
        auction_id: auction.id,
        bidder_id: currentUser.id,
        bidder_name: currentUser.full_name || currentUser.email,
        amount: auction.buyout_price,
        is_buyout: true,
      });
      await base44.entities.LiveAuction.update(auction.id, {
        current_bid: auction.buyout_price,
        final_amount: auction.buyout_price,
        current_winner_id: currentUser.id,
        current_winner_name: currentUser.full_name || currentUser.email,
        winner_id: currentUser.id,
        winner_name: currentUser.full_name || currentUser.email,
        status: 'ended',
        bid_count: (auction.bid_count || 0) + 1,
      });
    },
    onSuccess: () => { qc.invalidateQueries(['auctions', auction.room_id]); toast.success('You won the auction!'); },
  });

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: '#1A1A1A',
        border: isEndingSoon ? `2px solid rgba(255,68,68,0.6)` : `1px solid rgba(212,175,55,0.2)`,
        boxShadow: isEndingSoon ? '0 0 20px rgba(255,68,68,0.15)' : undefined,
        animation: isEndingSoon ? 'pulse 1.5s ease-in-out infinite' : undefined,
      }}>
      <div className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded"
                style={{ background: `${typeCfg.color}15`, color: typeCfg.color, border: `1px solid ${typeCfg.color}25`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                {typeCfg.label}
              </span>
              {isEndingSoon && (
                <span className="text-[11px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse"
                  style={{ background: 'rgba(255,68,68,0.15)', color: '#C0392B', border: '1px solid rgba(255,68,68,0.3)' }}>
                  🔥 ENDING SOON
                </span>
              )}
            </div>
            <h4 className="text-[12px] font-bold text-white leading-snug">{auction.title}</h4>
            {auction.description && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{auction.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Current Bid</div>
            <div className="font-black text-xl" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              ${auction.current_bid || auction.starting_bid || 0}
            </div>
          </div>
        </div>

        {/* Winner + timer */}
        <div className="flex items-center justify-between">
          <div>
            {auction.current_winner_name && (
              <div className="flex items-center gap-1">
                <Crown className="w-3 h-3" style={{ color: GOLD }} />
                <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Leading: {auction.current_winner_name}
                </span>
              </div>
            )}
            <button onClick={() => setShowBids(true)}
              className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'underline' }}>
              {auction.bid_count || 0} bids
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <Countdown endsAt={auction.ends_at} onExpired={() => qc.invalidateQueries(['auctions', auction.room_id])} />
          </div>
        </div>

        {/* Bid input */}
        {currentUser && auction.status !== 'ended' && (
          <div className="flex gap-1.5">
            <input
              type="number"
              placeholder={`Min $${minBid}`}
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              style={{ width: '100%', padding: '0 8px', height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif', flex: 1 }}
            />
            <button
              onClick={() => {
                const amt = parseFloat(bidAmount);
                if (isNaN(amt) || amt < minBid) { toast.error(`Minimum bid is $${minBid}`); return; }
                bidMut.mutate(amt);
              }}
              disabled={bidMut.isPending}
              className="px-3 h-8 rounded-lg font-black uppercase text-[11px] shrink-0"
              style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
              BID
            </button>
          </div>
        )}
        {auction.buyout_price && auction.status !== 'ended' && (
          <button onClick={() => buyoutMut.mutate()} disabled={buyoutMut.isPending}
            className="w-full py-1.5 rounded-lg font-black uppercase text-[10px]"
            style={{ background: 'rgba(212,175,55,0.08)', border: `1px solid rgba(212,175,55,0.3)`, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
            BUY NOW ${auction.buyout_price}
          </button>
        )}
        {/* Host controls */}
        {isHost && auction.status === 'active' && (
          <div className="flex gap-1.5">
            <button onClick={async () => {
              const newEnd = new Date(new Date(auction.ends_at).getTime() + 5 * 60 * 1000);
              await base44.entities.LiveAuction.update(auction.id, { ends_at: newEnd.toISOString() });
              qc.invalidateQueries(['auctions', auction.room_id]);
              toast.success('+5 min added');
            }}
              className="flex-1 py-1 rounded text-[11px] font-black uppercase"
              style={{ background: 'rgba(109,191,126,0.08)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              +5 min
            </button>
            <button onClick={() => onEnd(auction)}
              className="flex-1 py-1 rounded text-[11px] font-black uppercase"
              style={{ background: 'rgba(255,68,68,0.08)', color: '#C0392B', border: '1px solid rgba(255,68,68,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
      <BidHistoryDrawer auctionId={auction.id} open={showBids} onClose={() => setShowBids(false)} />
    </div>
  );
}

function CreateAuctionForm({ roomId, creatorId, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', auction_type: 'item', starting_bid: '', bid_increment: '1', buyout_price: '', duration_mins: '10' });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const endsAt = new Date(Date.now() + parseInt(form.duration_mins) * 60 * 1000);
      await base44.entities.LiveAuction.create({
        room_id: roomId,
        creator_id: creatorId,
        title: form.title,
        description: form.description,
        auction_type: form.auction_type,
        starting_bid: parseFloat(form.starting_bid) || 1,
        bid_increment: parseFloat(form.bid_increment) || 1,
        buyout_price: form.buyout_price ? parseFloat(form.buyout_price) : null,
        current_bid: 0,
        bid_count: 0,
        ends_at: endsAt.toISOString(),
        status: 'active',
      });
    },
    onSuccess: () => { qc.invalidateQueries(['auctions', roomId]); onClose(); toast.success('Auction launched!'); },
  });

  const types = ['item','one_on_one','shoutout','custom_art','coaching','experience'];

  return (
    <div className="space-y-3 p-4 rounded-xl" style={{ background: '#1A1A1A', border: `1px solid rgba(212,175,55,0.2)` }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>New Auction</span>
        <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
      </div>
      <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        style={{ width: '100%', padding: '0 8px', height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }} />
      <select value={form.auction_type} onChange={e => setForm(f => ({ ...f, auction_type: e.target.value }))}
        style={{ width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
        {types.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
      </select>
      <div className="flex gap-2">
        <input type="number" placeholder="Starting bid $" value={form.starting_bid} onChange={e => setForm(f => ({ ...f, starting_bid: e.target.value }))}
          style={{ width: '100%', padding: '0 8px', height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }} />
        <input type="number" placeholder="Increment $" value={form.bid_increment} onChange={e => setForm(f => ({ ...f, bid_increment: e.target.value }))}
          style={{ width: '100%', padding: '0 8px', height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }} />
      </div>
      <div className="flex gap-2">
        <input type="number" placeholder="Buyout (optional) $" value={form.buyout_price} onChange={e => setForm(f => ({ ...f, buyout_price: e.target.value }))}
          style={{ width: '100%', padding: '0 8px', height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }} />
        <input type="number" placeholder="Duration (min)" value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))}
          style={{ width: '100%', padding: '0 8px', height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' }} />
      </div>
      <button onClick={() => mut.mutate()} disabled={!form.title || !form.starting_bid || mut.isPending}
        className="w-full py-2 rounded-xl font-black uppercase text-[11px]"
        style={{ background: BURGUNDY, color: GOLD, border: `1px solid rgba(212,175,55,0.3)`, fontFamily: 'Barlow Condensed, sans-serif' }}>
        {mut.isPending ? 'Launching…' : '⚡ Launch Auction'}
      </button>
    </div>
  );
}

// Winner banner
function AuctionWinnerBanner({ auction, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
      className="fixed top-16 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3"
      style={{ background: '#1A1A1A', border: `2px solid ${GOLD}`, boxShadow: `0 0 40px rgba(212,175,55,0.3)` }}>
      <span className="text-3xl">🎉</span>
      <div className="flex-1">
        <p className="font-black text-sm uppercase" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>Auction Won!</p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <strong>{auction.winner_name}</strong> won <strong>{auction.title}</strong> with a bid of <strong style={{ color: GOLD }}>${auction.final_amount}</strong>!
        </p>
      </div>
      <button onClick={onDismiss}><X className="w-4 h-4 text-white/40" /></button>
    </motion.div>
  );
}

export default function LiveAuctionWidget({ roomId, currentUser, isHost }) {
  const [showCreate, setShowCreate] = useState(false);
  const [winner, setWinner] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const qc = useQueryClient();

  const { data: auctions = [] } = useQuery({
    queryKey: ['auctions', roomId],
    queryFn: () => base44.entities.LiveAuction.filter({ room_id: roomId }),
    enabled: !!roomId,
    refetchInterval: 4000,
  });

  // Detect newly ended auctions
  useEffect(() => {
    const ended = auctions.find(a => a.status === 'ended' && a.winner_name && !winner);
    if (ended) setWinner(ended);
  }, [auctions]);

  const active = auctions.filter(a => ['active', 'ending_soon'].includes(a.status));
  const endAuction = async (auction) => {
    await base44.entities.LiveAuction.update(auction.id, { status: 'ended', final_amount: auction.current_bid || 0, winner_id: auction.current_winner_id, winner_name: auction.current_winner_name });
    qc.invalidateQueries(['auctions', roomId]);
  };

  if (active.length === 0 && !isHost) return null;

  return (
    <>
      <AnimatePresence>
        {winner && <AuctionWinnerBanner auction={winner} onDismiss={() => setWinner(null)} />}
      </AnimatePresence>

      <div className="rounded-xl overflow-hidden" style={{ background: '#161616', border: `1px solid rgba(212,175,55,0.15)` }}>
        <button className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4" style={{ color: GOLD }} />
            <span className="font-black uppercase text-[11px]" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
              Live Auctions
            </span>
            {active.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-black"
                style={{ background: BURGUNDY, color: GOLD }}>{active.length}</span>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {isHost && (
                  <div className="pt-2">
                    {showCreate
                      ? <CreateAuctionForm roomId={roomId} creatorId={currentUser?.id} onClose={() => setShowCreate(false)} />
                      : <button onClick={() => setShowCreate(true)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase mt-1"
                          style={{ background: `rgba(212,175,55,0.08)`, border: `1px solid rgba(212,175,55,0.2)`, color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>
                          <Plus className="w-3 h-3" /> Start Auction
                        </button>
                    }
                  </div>
                )}
                {active.length === 0 && !showCreate && (
                  <p className="text-center py-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No active auctions</p>
                )}
                {active.map(a => (
                  <AuctionCard key={a.id} auction={a} currentUser={currentUser} isHost={isHost} onEnd={endAuction} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}