import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Swords, Trophy, X, Zap, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const BATTLE_DURATION = 120; // seconds

export default function PKBattle({ roomId, isHost, hostName, viewerCount }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [opponentUrl, setOpponentUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [myScore, setMyScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const timerRef = useRef(null);
  const qc = useQueryClient();

  const startBattle = () => {
    if (!opponentName) { toast.error('Enter opponent name'); return; }
    setActive(true);
    setMyScore(0);
    setTheirScore(0);
    setTimeLeft(BATTLE_DURATION);
    setOpen(false);
    // Post battle start message
    base44.entities.Message.create({
      room_id: roomId,
      user_id: 'bot',
      user_name: '🤖 SeeWhyBot',
      content: `⚔️ PK BATTLE STARTED! ${hostName} vs ${opponentName}! Send gifts to support your favorite! Battle ends in ${BATTLE_DURATION / 60} minutes!`,
      message_type: 'cohost',
    });
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endBattle();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const endBattle = () => {
    setActive(false);
    setTimeLeft(BATTLE_DURATION);
    const winner = myScore >= theirScore ? hostName : opponentName;
    base44.entities.Message.create({
      room_id: roomId,
      user_id: 'bot',
      user_name: '🤖 SeeWhyBot',
      content: `🏆 PK BATTLE ENDED! Winner: ${winner}! Thanks everyone for participating!`,
      message_type: 'cohost',
    });
    toast.success(`Battle over! Winner: ${winner}`);
  };

  // Simulate incoming score from opponent (in real impl, sync via entity)
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      // Random opponent score trickle (simulate)
      setTheirScore(s => s + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, [active]);

  const addPoint = (pts = 1) => setMyScore(s => s + pts);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const total = myScore + theirScore || 1;
  const myPct = Math.round((myScore / total) * 100);
  const theirPct = 100 - myPct;

  if (!isHost && !active) return null;

  return (
    <>
      {/* Host launcher button */}
      {isHost && !active && (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-[rgba(212,175,55,0.05)] border border-[#d4af37]/20 rounded-xl hover:bg-[#d4af37]/10 transition-colors"
        >
          <Swords className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-white/70">PK Battle</span>
        </button>
      )}

      {/* Active battle overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-b from-red-900/40 to-[rgba(13,6,24,0.9)] border border-red-700/40 rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-red-700/20">
              <div className="flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-300 uppercase tracking-wide">PK Battle</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#d4af37]">{formatTime(timeLeft)}</span>
                {isHost && (
                  <button onClick={endBattle} className="text-white/30 hover:text-white/60">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scores */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="text-center">
                  <p className="font-bold text-white truncate max-w-[80px]">{hostName}</p>
                  <p className="text-2xl font-black text-[#d4af37] font-mono">{myScore.toLocaleString()}</p>
                </div>
                <div className="text-[#d4af37]/60 font-black text-lg">VS</div>
                <div className="text-center">
                  <p className="font-bold text-white truncate max-w-[80px]">{opponentName}</p>
                  <p className="text-2xl font-black text-red-400 font-mono">{theirScore.toLocaleString()}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 rounded-full overflow-hidden flex bg-white/10">
                <motion.div
                  className="bg-[#d4af37] transition-all duration-500"
                  style={{ width: `${myPct}%` }}
                />
                <motion.div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${theirPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[11px] text-[#d4af37]/60">{myPct}%</span>
                <span className="text-[11px] text-red-400/60">{theirPct}%</span>
              </div>

              {/* Gift buttons (host) */}
              {isHost && (
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {[
                    { label: '+1', pts: 1, emoji: '🌹' },
                    { label: '+5', pts: 5, emoji: '💎' },
                    { label: '+10', pts: 10, emoji: '🔥' },
                  ].map(btn => (
                    <button
                      key={btn.pts}
                      onClick={() => addPoint(btn.pts)}
                      className="py-1.5 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 text-[10px] text-[#d4af37] font-bold hover:bg-[#d4af37]/20 transition-all flex items-center justify-center gap-1"
                    >
                      {btn.emoji} {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={e => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#080B18] border border-[#d4af37]/30 rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Swords className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-lg font-bold text-white">Start PK Battle</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-white/50 mb-1 block">Opponent Name</label>
                  <input
                    placeholder="e.g. StreamerX"
                    value={opponentName}
                    onChange={e => setOpponentName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/50 mb-1 block">Opponent Stream URL (optional)</label>
                  <input
                    placeholder="https://..."
                    value={opponentUrl}
                    onChange={e => setOpponentUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40"
                  />
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[11px] text-white/50">⏱ Duration: <strong className="text-white">{BATTLE_DURATION / 60} minutes</strong></p>
                  <p className="text-[11px] text-white/50 mt-1">🎁 Viewers gift points to their favourite streamer</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setOpen(false)} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12 }}>Cancel</button>
                <button
                  style={{ flex:1, padding:'6px 14px', borderRadius:8, border:'none', background: opponentName ? '#d4af37' : 'rgba(212,175,55,0.4)', color:'#000', fontWeight:700, cursor: opponentName ? 'pointer' : 'not-allowed', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                  onClick={startBattle}
                  disabled={!opponentName}
                >
                  <Swords className="w-3.5 h-3.5" /> Start Battle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}