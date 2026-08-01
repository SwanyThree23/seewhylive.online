import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, Minus, Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const FORMATS = [3, 5, 7, 10];

export default function PKBattleHostControls({ partyId, hostUser, hostName, isHost }) {
  const qc = useQueryClient();
  const [opponentName, setOpponentName] = useState('');
  const [format, setFormat] = useState(5);

  const { data: activeBattle } = useQuery({
    queryKey: ['pk-battle-active', partyId],
    queryFn: () => base44.entities.PKBattle.filter({ room_id: partyId, status: 'active' }).then(r => r[0] || null),
    enabled: !!partyId,
    refetchInterval: 3000,
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!hostUser?.id) throw new Error('auth');
      return base44.entities.PKBattle.create({
        room_id: partyId,
        challenger_id: hostUser.id,
        challenger_name: hostName || hostUser.full_name || 'Host',
        opponent_name: opponentName.trim() || 'Opponent',
        format,
        score_a: 0,
        score_b: 0,
        status: 'active',
        started_at: new Date().toISOString(),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pk-battle-active', partyId] }); toast.success('PK Battle started!'); setOpponentName(''); },
    onError: () => toast.error('Failed to start battle.'),
  });

  const endMutation = useMutation({
    mutationFn: async () => {
      if (!activeBattle) return;
      const winner_id = activeBattle.score_a > activeBattle.score_b
        ? activeBattle.challenger_id
        : activeBattle.score_b > activeBattle.score_a
          ? activeBattle.opponent_id
          : null;
      return base44.entities.PKBattle.update(activeBattle.id, {
        status: 'ended',
        ended_at: new Date().toISOString(),
        winner_id: winner_id || undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pk-battle-active', partyId] }); toast.success('PK Battle ended.'); },
    onError: () => toast.error('Failed to end battle.'),
  });

  const adjustScore = async (side, delta) => {
    if (!activeBattle) return;
    const field = side === 'a' ? 'score_a' : 'score_b';
    const next = Math.max(0, (activeBattle[field] || 0) + delta);
    try {
      await base44.entities.PKBattle.update(activeBattle.id, { [field]: next });
      qc.invalidateQueries({ queryKey: ['pk-battle-active', partyId] });
    } catch {}
  };

  if (!isHost) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.97)', border: '1px solid rgba(212,175,55,0.18)' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <Swords className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ ...T, color: GOLD }}>PK Battle</span>
        {activeBattle && (
          <span className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: 'rgba(192,57,43,0.2)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE
          </span>
        )}
      </div>

      <div className="p-3">
        <AnimatePresence mode="wait">
          {activeBattle ? (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  <p className="text-[9px] font-black uppercase truncate" style={{ ...T, color: GOLD }}>{activeBattle.challenger_name || 'You'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <button onClick={() => adjustScore('a', -1)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}><Minus className="w-3 h-3 text-white/70" /></button>
                    <span className="text-2xl font-black tabular-nums" style={{ ...T, color: '#fff' }}>{activeBattle.score_a || 0}</span>
                    <button onClick={() => adjustScore('a', 1)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)' }}><Plus className="w-3 h-3" style={{ color: GOLD }} /></button>
                  </div>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(128,0,32,0.12)', border: '1px solid rgba(128,0,32,0.3)' }}>
                  <p className="text-[9px] font-black uppercase truncate" style={{ ...T, color: '#ff6b6b' }}>{activeBattle.opponent_name || 'Opponent'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <button onClick={() => adjustScore('b', -1)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}><Minus className="w-3 h-3 text-white/70" /></button>
                    <span className="text-2xl font-black tabular-nums" style={{ ...T, color: '#fff' }}>{activeBattle.score_b || 0}</span>
                    <button onClick={() => adjustScore('b', 1)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(128,0,32,0.3)', border: '1px solid rgba(128,0,32,0.5)' }}><Plus className="w-3 h-3 text-[#ff6b6b]" /></button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>
                <span>Best of {activeBattle.format}</span>
                <span>First to {Math.ceil(activeBattle.format / 2)} wins</span>
              </div>
              <button onClick={() => endMutation.mutate()} disabled={endMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black uppercase"
                style={{ background: 'rgba(192,57,43,0.18)', border: '1px solid rgba(192,57,43,0.4)', color: '#ff6b6b', ...T, opacity: endMutation.isPending ? 0.6 : 1 }}>
                <Flag className="w-3 h-3" /> End Battle
              </button>
            </motion.div>
          ) : (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase mb-1" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>Opponent</p>
                <input value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder="Opponent name"
                  className="w-full rounded-lg px-2.5 py-2 text-[11px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase mb-1" style={{ ...T, color: 'rgba(255,255,255,0.4)' }}>Format</p>
                <div className="flex gap-1.5">
                  {FORMATS.map(n => (
                    <button key={n} onClick={() => setFormat(n)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all"
                      style={{ background: format === n ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${format === n ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`, color: format === n ? GOLD : 'rgba(255,255,255,0.4)', ...T }}>
                      Bo{n}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending || !hostUser}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black uppercase"
                style={{ background: GOLD, border: 'none', color: '#000', ...T, opacity: startMutation.isPending || !hostUser ? 0.5 : 1 }}>
                <Swords className="w-3 h-3" /> Start PK Battle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}