import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Flame, Trophy, Users, TrendingUp } from 'lucide-react';

const TIP_AMOUNTS_CENTS = [99, 199, 499];

const G = '#D4AF37';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

export default function PKBattleProgress({ battleId, currentUserId }) {
  const qc = useQueryClient();
  const [battle, setBattle] = useState(null);
  const [winner, setWinner] = useState(null);
  const [tipTarget, setTipTarget] = useState(null); // 'creator' | 'challenger'

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // Fetch initial battle data
  const { data: initialBattle } = useQuery({
    queryKey: ['pkBattle', battleId],
    queryFn: () => base44.entities.PKBattle.get(battleId),
  });

  const tipMutation = useMutation({
    mutationFn: ({ side, amountCents }) => {
      const pts = Math.floor(amountCents / 10);
      const field = side === 'creator'
        ? { creator_score: (battle?.creator_score || 0) + pts, creator_tips: +((battle?.creator_tips || 0) + amountCents / 100).toFixed(2) }
        : { challenger_score: (battle?.challenger_score || 0) + pts, challenger_tips: +((battle?.challenger_tips || 0) + amountCents / 100).toFixed(2) };
      return base44.entities.PKBattle.update(battleId, field);
    },
    onSuccess: (_, { side, amountCents }) => {
      toast.success(`Tipped $${(amountCents / 100).toFixed(2)} to ${side}!`);
      qc.invalidateQueries(['pkBattle', battleId]);
      if (currentUser?.id) {
        base44.entities.Activity.create({
          user_id: currentUser.id,
          type: 'tip_sent',
          title: `Tipped $${(amountCents / 100).toFixed(2)} in PK Battle`,
          amount: amountCents,
        }).catch(() => {});
      }
      setTipTarget(null);
    },
    onError: (err) => toast.error('Tip failed: ' + err.message),
  });

  // Real-time subscription to battle updates
  useEffect(() => {
    if (!initialBattle) return;
    setBattle(initialBattle);

    const unsubscribe = base44.entities.PKBattle.subscribe((event) => {
      if (event.id === battleId) {
        setBattle(event.data);
        if (event.data.status === 'ended' && event.data.winner_id) {
          setWinner(event.data.winner_id);
        }
      }
    });

    return unsubscribe;
  }, [initialBattle, battleId]);

  if (!battle) return null;

  const creatorTotal = (battle.creator_tips || 0) + (battle.creator_subs || 0) * 10;
  const challengerTotal = (battle.challenger_tips || 0) + (battle.challenger_subs || 0) * 10;
  const totalScore = creatorTotal + challengerTotal || 1;
  const creatorPercent = (creatorTotal / totalScore) * 100;
  const challengerPercent = (challengerTotal / totalScore) * 100;

  const isEnded = battle.status === 'ended';
  const isActive = battle.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: PANEL, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5" style={{ color: '#C0392B' }} />
          <h3 className="font-black text-sm" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            PK BATTLE
          </h3>
        </div>
        <div className="text-xs px-2 py-1 rounded-full"
          style={{
            background: isActive ? 'rgba(109,191,126,0.15)' : isEnded ? 'rgba(192,57,43,0.15)' : 'rgba(212,175,55,0.15)',
            color: isActive ? '#6DBF7E' : isEnded ? '#C0392B' : G,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 'bold',
          }}>
          {isActive ? '🟢 LIVE' : isEnded ? '🏁 ENDED' : '⏱️ PENDING'}
        </div>
      </div>

      {/* Battleground */}
      <div className="p-4 space-y-4">
        {/* Creator side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <img
                src={battle.creator_avatar || undefined}
                onError={e => { e.target.style.display = 'none'; }}
                alt={battle.creator_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate" style={{ color: '#fff' }}>
                  {battle.creator_name}
                </p>
                <p className="text-[10px] text-white/50">
                  {battle.creator_subs || 0} subs • {battle.creator_tips || 0} tips
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black" style={{ color: G }}>
                {creatorTotal}
              </p>
              <p className="text-[10px] text-white/50">points</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creatorPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #C0392B, #D4AF37)',
              }}
            />
          </div>
        </div>

        {/* VS Badge */}
        <div className="flex items-center justify-center py-2">
          <div className="text-xs font-black px-3 py-1 rounded-full"
            style={{ background: 'rgba(212,175,55,0.12)', color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            VS
          </div>
        </div>

        {/* Challenger side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <img
                src={battle.challenger_avatar || undefined}
                onError={e => { e.target.style.display = 'none'; }}
                alt={battle.challenger_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate" style={{ color: '#fff' }}>
                  {battle.challenger_name}
                </p>
                <p className="text-[10px] text-white/50">
                  {battle.challenger_subs || 0} subs • {battle.challenger_tips || 0} tips
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black" style={{ color: G }}>
                {challengerTotal}
              </p>
              <p className="text-[10px] text-white/50">points</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${challengerPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #D4AF37, #C9A84C)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Winner announcement */}
      {isEnded && winner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 text-center"
          style={{
            background: 'rgba(109,191,126,0.1)',
            borderTop: '1px solid rgba(109,191,126,0.2)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-4 h-4" style={{ color: '#6DBF7E' }} />
            <p className="text-xs font-black" style={{ color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>
              {winner === battle.creator_id ? battle.creator_name : battle.challenger_name} WINS
            </p>
          </div>
          <p className="text-[10px] text-white/60">
            Earned {battle.reward_points || 500} points
          </p>
        </motion.div>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className="px-4 py-3 space-y-2" style={{ background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipTarget(tipTarget === 'creator' ? null : 'creator')}
              style={{
                fontSize: 12, fontWeight: 900, height: 32, borderRadius: 6, cursor: 'pointer',
                background: tipTarget === 'creator' ? 'rgba(192,57,43,0.35)' : 'rgba(192,57,43,0.2)',
                color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)',
              }}
            >
              💰 Tip Creator
            </button>
            <button
              onClick={() => setTipTarget(tipTarget === 'challenger' ? null : 'challenger')}
              style={{
                fontSize: 12, fontWeight: 900, height: 32, borderRadius: 6, cursor: 'pointer',
                background: tipTarget === 'challenger' ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.2)',
                color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)',
              }}
            >
              💛 Tip Challenger
            </button>
          </div>
          {tipTarget && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-1.5"
            >
              {TIP_AMOUNTS_CENTS.map(cents => (
                <button
                  key={cents}
                  onClick={() => tipMutation.mutate({ side: tipTarget, amountCents: cents })}
                  disabled={tipMutation.isPending}
                  style={{
                    height: 28, fontSize: 11, fontWeight: 900, borderRadius: 6, cursor: 'pointer',
                    background: tipTarget === 'creator' ? 'rgba(192,57,43,0.25)' : 'rgba(212,175,55,0.2)',
                    color: tipTarget === 'creator' ? '#C0392B' : '#D4AF37',
                    border: `1px solid ${tipTarget === 'creator' ? 'rgba(192,57,43,0.35)' : 'rgba(212,175,55,0.3)'}`,
                    opacity: tipMutation.isPending ? 0.6 : 1,
                  }}
                >
                  ${(cents / 100).toFixed(2)}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
