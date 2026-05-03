import React, { useState, useEffect, useRef, useCallback } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, ArrowLeft, Plus, Users, Zap, Clock, Share2, Gift, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const BATTLE_DURATION = 180;
const GIFTS = [
  { emoji: '🌹', label: 'Rose', pts: 1 },
  { emoji: '🍰', label: 'Cake', pts: 5 },
  { emoji: '💎', label: 'Diamond', pts: 10 },
  { emoji: '🔥', label: 'Fire', pts: 20 },
  { emoji: '🚀', label: 'Rocket', pts: 50 },
];

function FlyingGift({ emoji, side }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 1, x: side === 'left' ? 20 : -20 }}
      animate={{ y: -150, opacity: 0, scale: 1.5 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="absolute bottom-20 text-3xl pointer-events-none z-30"
      style={{ [side === 'left' ? 'left' : 'right']: '40px' }}
    >
      {emoji}
    </motion.div>
  );
}

function ScoreBar({ leftVotes, rightVotes, leftName, rightName }) {
  const total = leftVotes + rightVotes || 1;
  const leftPct = Math.round((leftVotes / total) * 100);
  return (
    <div className="w-full px-4">
      <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
        <span>{leftPct}%</span>
        <span>{100 - leftPct}%</span>
      </div>
      <div className="h-3 rounded-full flex overflow-hidden bg-white/10">
        <motion.div
          className="bg-blue-500 transition-all duration-700"
          style={{ width: `${leftPct}%` }}
        />
        <motion.div
          className="bg-red-500 transition-all duration-700"
          style={{ width: `${100 - leftPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-bold mt-1">
        <span className="text-blue-400">{leftVotes.toLocaleString()} pts</span>
        <span className="text-red-400">{rightVotes.toLocaleString()} pts</span>
      </div>
    </div>
  );
}

function WinnerOverlay({ winner, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="text-center px-8 py-10"
      >
        <div className="text-7xl mb-4">🏆</div>
        <Crown className="w-10 h-10 text-[#d4af37] mx-auto mb-3" />
        <p className="text-white/60 text-lg uppercase tracking-widest mb-2">Winner</p>
        <h2 className="text-5xl font-black text-[#d4af37] mb-6">{winner}</h2>
        <Button onClick={onClose} className="bg-[#d4af37] text-black font-bold px-8">
          Close
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function PKBattlePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const battleId = urlParams.get('id');
  const qc = useQueryClient();

  const [leftName, setLeftName] = useState('');
  const [rightName, setRightName] = useState('');
  const [leftStream, setLeftStream] = useState('');
  const [rightStream, setRightStream] = useState('');
  const [duration, setDuration] = useState(BATTLE_DURATION);

  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [leftVotes, setLeftVotes] = useState(0);
  const [rightVotes, setRightVotes] = useState(0);
  const [flyingGifts, setFlyingGifts] = useState([]);
  const [winner, setWinner] = useState(null);
  const timerRef = useRef(null);
  const giftIdRef = useRef(0);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // Poll battle state from entity
  const { data: battle } = useQuery({
    queryKey: ['pk-battle', battleId],
    queryFn: () => base44.entities.LiveAuction.filter({ id: battleId }).then(r => r[0]),
    enabled: !!battleId,
    refetchInterval: 3000,
  });

  // Sync battle scores from entity
  useEffect(() => {
    if (!battleId) return;
    const unsub = base44.entities.LiveAuction.subscribe((event) => {
      if (event.id !== battleId) return;
      if (event.data) {
        setLeftVotes(event.data.current_bid || 0);
        setRightVotes(event.data.bid_count || 0);
      }
    });
    return unsub;
  }, [battleId]);

  const createBattle = useMutation({
    mutationFn: () => base44.entities.LiveAuction.create({
      creator_id: user?.id,
      title: `${leftName} vs ${rightName}`,
      auction_type: 'experience',
      starting_bid: 0,
      current_bid: 0,
      bid_count: 0,
      ends_at: new Date(Date.now() + duration * 1000).toISOString(),
      status: 'active',
    }),
    onSuccess: (b) => {
      window.location.href = `${window.location.pathname}?id=${b.id}`;
    },
  });

  const addVote = async (side, pts) => {
    const emoji = GIFTS.find(g => g.pts === pts)?.emoji || '🎁';
    // Fly the gift
    const id = ++giftIdRef.current;
    setFlyingGifts(p => [...p, { id, emoji, side }]);
    setTimeout(() => setFlyingGifts(p => p.filter(g => g.id !== id)), 1600);

    if (side === 'left') {
      const newVal = leftVotes + pts;
      setLeftVotes(newVal);
      if (battleId) await base44.entities.LiveAuction.update(battleId, { current_bid: newVal });
    } else {
      const newVal = rightVotes + pts;
      setRightVotes(newVal);
      if (battleId) await base44.entities.LiveAuction.update(battleId, { bid_count: newVal });
    }
  };

  // Timer
  useEffect(() => {
    if (!battleId || !battle || battle.status !== 'active') return;
    const endsAt = battle ? new Date(battle.ends_at).getTime() : Date.now() + duration * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        const w = leftVotes >= rightVotes ? (battle?.title?.split(' vs ')[0] || 'Left') : (battle?.title?.split(' vs ')[1] || 'Right');
        setWinner(w);
        base44.entities.LiveAuction.update(battleId, { status: 'ended' });
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [battleId, battle?.status]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success('Battle link copied!'); };

  // ── Create screen ──────────────────────────────────────────────────────────
  if (!battleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0618] via-[#1a0030] to-[#0d0618] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white gap-1.5 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="bg-white/5 border border-[#d4af37]/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-[#d4af37] flex items-center justify-center">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">PK Battle</h1>
                <p className="text-sm text-white/40">Head-to-head streamer showdown</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider mb-1 block">Left Creator</label>
                <input
                  placeholder="Name"
                  value={leftName}
                  onChange={e => setLeftName(e.target.value)}
                  className="w-full bg-blue-900/20 border border-blue-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/60"
                />
                <input
                  placeholder="Stream URL (optional)"
                  value={leftStream}
                  onChange={e => setLeftStream(e.target.value)}
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-red-400 font-semibold uppercase tracking-wider mb-1 block">Right Creator</label>
                <input
                  placeholder="Name"
                  value={rightName}
                  onChange={e => setRightName(e.target.value)}
                  className="w-full bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-red-500/60"
                />
                <input
                  placeholder="Stream URL (optional)"
                  value={rightStream}
                  onChange={e => setRightStream(e.target.value)}
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Duration</label>
              <div className="flex gap-2">
                {[60, 120, 180, 300].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      duration === d
                        ? 'bg-[#d4af37] border-[#d4af37] text-black font-bold'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {d / 60}min
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold py-3 text-base hover:opacity-90"
              disabled={!leftName || !rightName || createBattle.isPending}
              onClick={() => createBattle.mutate()}
            >
              <Swords className="w-4 h-4 mr-2" /> Start Battle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const names = battle?.title?.split(' vs ') || [leftName || 'Left', rightName || 'Right'];
  const [bLeftName, bRightName] = names;
  const bLeftStream = leftStream;
  const bRightStream = rightStream;

  return (
    <div className="min-h-screen bg-[#050010] text-white flex flex-col overflow-hidden relative">
      {/* Winner overlay */}
      <AnimatePresence>
        {winner && <WinnerOverlay winner={winner} onClose={() => setWinner(null)} />}
      </AnimatePresence>

      {/* Flying gifts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {flyingGifts.map(g => <FlyingGift key={g.id} emoji={g.emoji} side={g.side} />)}
        </AnimatePresence>
      </div>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/60 border-b border-white/10 z-10 shrink-0">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Swords className="w-4 h-4 text-[#d4af37]" />
          <span className="font-bold text-sm text-white truncate">{battle?.title || 'PK Battle'}</span>
          {battle?.status === 'active' && (
            <Badge className="bg-red-600 text-white border-0 text-[10px] animate-pulse">LIVE</Badge>
          )}
          {battle?.status === 'ended' && (
            <Badge className="bg-gray-600 text-white border-0 text-[10px]">ENDED</Badge>
          )}
        </div>
        <div className="font-mono text-xl font-black text-[#d4af37] tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white" onClick={copyLink}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Main split-screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <div className="flex-1 relative flex flex-col bg-gradient-to-br from-blue-950 to-black border-r-2 border-[#d4af37]/30">
          {/* Stream embed or placeholder */}
          <div className="flex-1 relative overflow-hidden">
            {bLeftStream ? (
              <iframe src={bLeftStream} className="w-full h-full" allowFullScreen allow="autoplay" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-blue-700/40 border-2 border-blue-500/60 flex items-center justify-center text-4xl font-black text-blue-300">
                  {bLeftName?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-2xl font-black text-white">{bLeftName}</p>
                <Badge className="bg-blue-700/50 text-blue-200 border-blue-600/40">Left Creator</Badge>
              </div>
            )}
            {/* Score overlay */}
            <div className="absolute top-3 left-3 bg-black/70 rounded-xl px-4 py-2 flex flex-col items-center">
              <p className="text-3xl font-black text-blue-400 font-mono">{leftVotes.toLocaleString()}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">points</p>
            </div>
          </div>
          {/* Gift buttons */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-black/60 justify-center flex-wrap">
            {GIFTS.map(g => (
              <button
                key={g.pts}
                onClick={() => addVote('left', g.pts)}
                className="flex items-center gap-1 px-2 py-1.5 bg-blue-900/40 border border-blue-700/40 rounded-lg text-[11px] text-blue-300 font-bold hover:bg-blue-700/50 transition-all"
              >
                {g.emoji} +{g.pts}
              </button>
            ))}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center w-10 bg-black z-10 shrink-0">
          <div className="flex-1 w-px bg-gradient-to-b from-transparent via-[#d4af37]/60 to-transparent" />
          <div className="w-9 h-9 rounded-full bg-[#d4af37] flex items-center justify-center my-2">
            <span className="text-black font-black text-[10px]">VS</span>
          </div>
          <div className="flex-1 w-px bg-gradient-to-b from-transparent via-[#d4af37]/60 to-transparent" />
        </div>

        {/* RIGHT */}
        <div className="flex-1 relative flex flex-col bg-gradient-to-bl from-red-950 to-black">
          <div className="flex-1 relative overflow-hidden">
            {bRightStream ? (
              <iframe src={bRightStream} className="w-full h-full" allowFullScreen allow="autoplay" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-red-700/40 border-2 border-red-500/60 flex items-center justify-center text-4xl font-black text-red-300">
                  {bRightName?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-2xl font-black text-white">{bRightName}</p>
                <Badge className="bg-red-700/50 text-red-200 border-red-600/40">Right Creator</Badge>
              </div>
            )}
            {/* Score overlay */}
            <div className="absolute top-3 right-3 bg-black/70 rounded-xl px-4 py-2 flex flex-col items-center">
              <p className="text-3xl font-black text-red-400 font-mono">{rightVotes.toLocaleString()}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">points</p>
            </div>
          </div>
          {/* Gift buttons */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-black/60 justify-center flex-wrap">
            {GIFTS.map(g => (
              <button
                key={g.pts}
                onClick={() => addVote('right', g.pts)}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-900/40 border border-red-700/40 rounded-lg text-[11px] text-red-300 font-bold hover:bg-red-700/50 transition-all"
              >
                {g.emoji} +{g.pts}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom score bar */}
      <div className="bg-black/80 border-t border-white/10 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-blue-400 truncate flex-1 text-right">{bLeftName}</span>
          <Swords className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span className="text-sm font-bold text-red-400 truncate flex-1">{bRightName}</span>
        </div>
        <ScoreBar leftVotes={leftVotes} rightVotes={rightVotes} leftName={bLeftName} rightName={bRightName} />
      </div>
    </div>
  );
}