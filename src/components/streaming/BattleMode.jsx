import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Zap, Trophy, DollarSign, Users, Crown, Timer, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

/**
 * BattleMode — two creators co-stream side-by-side with a real-time tip vote bar.
 * Uses the PKBattle entity to store state; subscribes to real-time tip transactions.
 */
export default function BattleMode({ roomId, isHost, hostName, participants = [] }) {
  const [showSetup, setShowSetup] = useState(false);
  const [durationMin, setDurationMin] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const qc = useQueryClient();

  const guests = participants.filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role));

  const { data: battles = [] } = useQuery({
    queryKey: ['pk_battles', roomId],
    queryFn: () => base44.entities.PKBattle
      ? base44.entities.PKBattle.filter({ room_id: roomId, status: 'active' })
      : Promise.resolve([]),
    refetchInterval: 5000,
    enabled: !!roomId,
  });

  const activeBattle = battles[0] || null;

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;
    if (!base44.entities.PKBattle) return;
    const unsub = base44.entities.PKBattle.subscribe((event) => {
      if (event.data?.room_id === roomId) {
        qc.invalidateQueries(['pk_battles', roomId]);
      }
    });
    return unsub;
  }, [roomId, qc]);

  // Elapsed timer
  useEffect(() => {
    if (activeBattle) {
      const start = new Date(activeBattle.started_at).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
  }, [activeBattle?.id]);

  // Auto-end when time runs out
  useEffect(() => {
    if (activeBattle && elapsed >= (activeBattle.duration_seconds || 300)) {
      endBattleMutation.mutate(activeBattle);
    }
  }, [elapsed]);

  const startBattleMutation = useMutation({
    mutationFn: async ({ creator1, creator2 }) => {
      if (!base44.entities.PKBattle) throw new Error('PKBattle entity not available');
      return base44.entities.PKBattle.create({
        room_id: roomId,
        host_id: creator1.user_id || creator1.id,
        host_name: creator1.user_name,
        challenger_id: creator2.user_id || creator2.id,
        challenger_name: creator2.user_name,
        host_score: 0,
        challenger_score: 0,
        status: 'active',
        started_at: new Date().toISOString(),
        duration_seconds: durationMin * 60,
      });
    },
    onSuccess: () => {
      setShowSetup(false);
      toast.success('⚔️ Battle started!');
      qc.invalidateQueries(['pk_battles', roomId]);
    },
    onError: () => toast.error('Could not start battle'),
  });

  const voteMutation = useMutation({
    mutationFn: async ({ battleId, side }) => {
      if (!base44.entities.PKBattle) return;
      const battle = battles.find(b => b.id === battleId);
      if (!battle) return;
      const update = side === 'host'
        ? { host_score: (battle.host_score || 0) + 1 }
        : { challenger_score: (battle.challenger_score || 0) + 1 };
      return base44.entities.PKBattle.update(battleId, update);
    },
    onSuccess: () => qc.invalidateQueries(['pk_battles', roomId]),
  });

  const endBattleMutation = useMutation({
    mutationFn: async (battle) => {
      if (!base44.entities.PKBattle) return;
      const winner = (battle.host_score || 0) >= (battle.challenger_score || 0)
        ? battle.host_name : battle.challenger_name;
      return base44.entities.PKBattle.update(battle.id, {
        status: 'ended',
        ended_at: new Date().toISOString(),
        winner_name: winner,
      });
    },
    onSuccess: () => {
      toast.success('Battle ended!');
      qc.invalidateQueries(['pk_battles', roomId]);
    },
  });

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const totalScore = (activeBattle?.host_score || 0) + (activeBattle?.challenger_score || 0);
  const hostPct = totalScore === 0 ? 50 : Math.round(((activeBattle?.host_score || 0) / totalScore) * 100);
  const challengerPct = 100 - hostPct;
  const timeLeft = activeBattle
    ? Math.max(0, (activeBattle.duration_seconds || 300) - elapsed)
    : 0;

  return (
    <div className="border border-[#d4af37]/20 rounded-xl bg-[#1a0d2e]/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#d4af37]/10">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">Battle Mode</span>
          {activeBattle && (
            <Badge className="bg-red-600 text-white text-[9px] animate-pulse border-0">LIVE</Badge>
          )}
        </div>
        {isHost && !activeBattle && (
          <Button
            size="sm"
            onClick={() => setShowSetup(v => !v)}
            className="h-6 text-[10px] bg-[#800020] hover:bg-[#9a0025] text-white border-0 px-2"
          >
            <Plus className="w-3 h-3 mr-1" /> Start Battle
          </Button>
        )}
        {isHost && activeBattle && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => endBattleMutation.mutate(activeBattle)}
            className="h-6 text-[10px] px-2"
          >
            <X className="w-3 h-3 mr-1" /> End
          </Button>
        )}
      </div>

      {/* Setup Form */}
      <AnimatePresence>
        {showSetup && !activeBattle && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <BattleSetupForm
              guests={guests}
              durationMin={durationMin}
              setDurationMin={setDurationMin}
              onStart={(c1, c2) => startBattleMutation.mutate({ creator1: c1, creator2: c2 })}
              isLoading={startBattleMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Battle UI */}
      {activeBattle && (
        <div className="p-3 space-y-3">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-3.5 h-3.5 text-white/50" />
            <span className={`font-mono text-sm font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Side-by-side creator cards */}
          <div className="grid grid-cols-2 gap-2">
            <CreatorBattleCard
              name={activeBattle.host_name}
              score={activeBattle.host_score || 0}
              pct={hostPct}
              side="left"
              isLeading={hostPct >= challengerPct}
              onVote={() => voteMutation.mutate({ battleId: activeBattle.id, side: 'host' })}
            />
            <CreatorBattleCard
              name={activeBattle.challenger_name}
              score={activeBattle.challenger_score || 0}
              pct={challengerPct}
              side="right"
              isLeading={challengerPct > hostPct}
              onVote={() => voteMutation.mutate({ battleId: activeBattle.id, side: 'challenger' })}
            />
          </div>

          {/* Vote bar */}
          <div className="relative h-4 rounded-full overflow-hidden bg-[#800020]/30 border border-[#800020]/20">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#d4af37] to-[#f5a623]"
              animate={{ width: `${hostPct}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span className="text-[9px] font-bold text-white drop-shadow">{hostPct}%</span>
              <span className="text-[9px] font-bold text-white drop-shadow">{challengerPct}%</span>
            </div>
          </div>

          {/* Total tips */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
            <DollarSign className="w-3 h-3" />
            <span>{totalScore} total votes</span>
          </div>
        </div>
      )}

      {/* Ended battle result */}
      {!activeBattle && battles.some(b => b.status === 'ended') && (
        <LastBattleResult battles={battles} />
      )}
    </div>
  );
}

function CreatorBattleCard({ name, score, pct, side, isLeading, onVote }) {
  return (
    <div className={`relative rounded-lg p-2 border transition-all ${
      isLeading
        ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
        : 'border-white/10 bg-white/5'
    }`}>
      {isLeading && (
        <Crown className="absolute top-1 right-1 w-3 h-3 text-[#d4af37]" />
      )}
      <div className="text-center space-y-1.5">
        <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-xs font-bold text-white">
          {name?.charAt(0)?.toUpperCase()}
        </div>
        <p className="text-[10px] font-semibold text-white truncate">{name}</p>
        <p className="text-lg font-bold font-mono text-[#d4af37]">{score}</p>
        <Button
          size="sm"
          onClick={onVote}
          className="w-full h-6 text-[9px] bg-[#800020] hover:bg-[#9a0025] text-white border-0"
        >
          <Zap className="w-2.5 h-2.5 mr-1" /> Vote
        </Button>
      </div>
    </div>
  );
}

function BattleSetupForm({ guests, durationMin, setDurationMin, onStart, isLoading }) {
  const [creator1, setCreator1] = useState('');
  const [creator2, setCreator2] = useState('');

  const c1 = guests.find(g => g.id === creator1);
  const c2 = guests.find(g => g.id === creator2);

  return (
    <div className="p-3 space-y-3 border-b border-[#d4af37]/10">
      <p className="text-[10px] text-white/50 uppercase tracking-wider">Select 2 creators</p>
      <div className="grid grid-cols-2 gap-2">
        {['Creator 1', 'Creator 2'].map((label, idx) => {
          const val = idx === 0 ? creator1 : creator2;
          const setVal = idx === 0 ? setCreator1 : setCreator2;
          return (
            <div key={label} className="space-y-1">
              <p className="text-[9px] text-white/40">{label}</p>
              <select
                value={val}
                onChange={e => setVal(e.target.value)}
                className="w-full bg-[#1a0d2e] border border-white/10 rounded px-2 py-1 text-[10px] text-white"
              >
                <option value="">Select…</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id} disabled={(idx === 0 ? creator2 : creator1) === g.id}>
                    {g.user_name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-[9px] text-white/40 shrink-0">Duration</p>
        {[2, 5, 10].map(m => (
          <button
            key={m}
            onClick={() => setDurationMin(m)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-all ${
              durationMin === m ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 text-white/40'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
      <Button
        size="sm"
        disabled={!creator1 || !creator2 || creator1 === creator2 || isLoading}
        onClick={() => onStart(c1, c2)}
        className="w-full h-7 text-[10px] bg-[#d4af37] hover:bg-[#f5e6a3] text-black font-bold"
      >
        <Swords className="w-3 h-3 mr-1" />
        {isLoading ? 'Starting…' : '⚔️ Start Battle'}
      </Button>
    </div>
  );
}

function LastBattleResult({ battles }) {
  const last = [...battles].filter(b => b.status === 'ended').sort((a, b) =>
    new Date(b.ended_at) - new Date(a.ended_at)
  )[0];
  if (!last) return null;

  return (
    <div className="p-3 text-center space-y-1">
      <Trophy className="w-5 h-5 text-[#d4af37] mx-auto" />
      <p className="text-[10px] text-white/50">Last Battle Winner</p>
      <p className="text-sm font-bold text-[#d4af37]">{last.winner_name}</p>
      <p className="text-[9px] text-white/30">
        {last.host_name} {last.host_score} — {last.challenger_score} {last.challenger_name}
      </p>
    </div>
  );
}