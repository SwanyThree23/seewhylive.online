import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Swords, Trophy, X, Zap, Users, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const BATTLE_DURATION = 120; // seconds
const GOLD = '#D4AF37';
const BURG = '#800020';
const RED  = '#C0392B';
const BLUE = '#1A73E8';
const FONT = 'Barlow Condensed, sans-serif';

// Format large numbers: 4710 → "4.7K", 1200000 → "1.2M"
function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function PKBattle({ roomId, isHost, hostName, viewerCount }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [opponentUrl, setOpponentUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [myScore, setMyScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const startBattle = () => {
    if (!opponentName) { toast.error('Enter opponent name'); return; }
    setActive(true);
    setMyScore(0);
    setTheirScore(0);
    setTimeLeft(BATTLE_DURATION);
    setOpen(false);
    base44.entities.Message.create({
      room_id: roomId,
      user_id: 'bot',
      user_name: '🤖 SeeWhyBot',
      content: `⚔️ PK BATTLE STARTED! ${hostName} vs ${opponentName}! Send gifts to support your favorite! Battle ends in ${BATTLE_DURATION / 60} minutes!`,
      message_type: 'cohost',
    });
    if (currentUser?.id) {
      base44.entities.Activity.create({
        user_id: currentUser.id,
        type: 'milestone',
        title: `Started PK Battle vs ${opponentName}`,
      }).catch(() => {});
    }
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

  const addPoint = (pts = 1) => setMyScore(s => s + pts);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const total  = myScore + theirScore || 1;
  const myPct  = Math.round((myScore / total) * 100);
  const theirPct = 100 - myPct;

  // Urgency pulse when <30s remain
  const urgent = active && timeLeft <= 30;

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

      {/* Active battle overlay — BIGO-style hero scores */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', fontFamily: FONT }}
          >
            {/* ── BIGO-style split score hero ── */}
            <div className="relative flex" style={{ minHeight: 84 }}>
              {/* Host side — gold */}
              <div
                className="flex-1 flex flex-col items-center justify-center py-2 px-3"
                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(8,11,24,0.9) 100%)' }}
              >
                <motion.p
                  key={myScore}
                  initial={{ scale: 1.25, color: '#fff' }}
                  animate={{ scale: 1, color: GOLD }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="font-black leading-none"
                  style={{ fontSize: 28, fontFamily: FONT }}
                >
                  {formatK(myScore)}
                </motion.p>
                <p className="text-[10px] font-bold truncate max-w-[80px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {hostName}
                </p>
              </div>

              {/* Center: PK timer + VS */}
              <div
                className="flex flex-col items-center justify-center px-3 shrink-0 z-10"
                style={{ minWidth: 64 }}
              >
                {/* Crossed swords icon */}
                <Swords
                  className="w-4 h-4 mb-0.5"
                  style={{ color: urgent ? RED : 'rgba(255,255,255,0.55)' }}
                />
                {/* Countdown */}
                <motion.p
                  animate={urgent ? { scale: [1, 1.1, 1] } : {}}
                  transition={urgent ? { repeat: Infinity, duration: 0.8 } : {}}
                  className="font-black font-mono"
                  style={{
                    fontSize: 15,
                    color: urgent ? RED : 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {formatTime(timeLeft)}
                </motion.p>
                <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  PK
                </p>
              </div>

              {/* Opponent side — red */}
              <div
                className="flex-1 flex flex-col items-center justify-center py-2 px-3"
                style={{ background: 'linear-gradient(225deg, rgba(192,57,43,0.22) 0%, rgba(8,11,24,0.9) 100%)' }}
              >
                <motion.p
                  key={theirScore}
                  initial={{ scale: 1.25, color: '#fff' }}
                  animate={{ scale: 1, color: RED }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="font-black leading-none"
                  style={{ fontSize: 28, fontFamily: FONT }}
                >
                  {formatK(theirScore)}
                </motion.p>
                <p className="text-[10px] font-bold truncate max-w-[80px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {opponentName}
                </p>
              </div>

              {/* Host end-battle X */}
              {isHost && (
                <button
                  onClick={endBattle}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
              )}
            </div>

            {/* ── Team progress bar ── */}
            <div className="flex h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full transition-all duration-500"
                style={{ width: `${myPct}%`, background: `linear-gradient(90deg, ${GOLD}cc, ${GOLD})` }}
              />
              <motion.div
                className="h-full transition-all duration-500"
                style={{ width: `${theirPct}%`, background: `linear-gradient(90deg, ${RED}, ${RED}cc)` }}
              />
            </div>
            <div className="flex justify-between px-2 py-0.5">
              <span className="text-[9px] font-bold" style={{ color: `${GOLD}99` }}>{myPct}%</span>
              <span className="text-[9px] font-bold" style={{ color: `${RED}99` }}>{theirPct}%</span>
            </div>

            {/* ── Gift buttons (host only) ── */}
            {isHost && (
              <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
                {[
                  { label: '+1',  pts: 1,  emoji: '🌹', sub: 'Rose' },
                  { label: '+5',  pts: 5,  emoji: '💎', sub: 'Diamond' },
                  { label: '+10', pts: 10, emoji: '🔥', sub: 'Fire' },
                ].map(btn => (
                  <button
                    key={btn.pts}
                    onClick={() => addPoint(btn.pts)}
                    className="flex flex-col items-center py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'rgba(212,175,55,0.08)',
                      border: '1px solid rgba(212,175,55,0.22)',
                    }}
                  >
                    <span className="text-base leading-none">{btn.emoji}</span>
                    <span className="text-[9px] font-black mt-0.5" style={{ color: GOLD }}>{btn.label}</span>
                    <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{btn.sub}</span>
                  </button>
                ))}
              </div>
            )}
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
              style={{ fontFamily: FONT }}
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
                <div className="bg-white/5 rounded-xl p-3 space-y-1">
                  <p className="text-[11px] text-white/50">⏱ Duration: <strong className="text-white">{BATTLE_DURATION / 60} minutes</strong></p>
                  <p className="text-[11px] text-white/50">🎁 Viewers gift points to their favourite streamer</p>
                  <p className="text-[11px] text-white/50">🏆 Highest score at the end wins!</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setOpen(false)}
                  style={{ padding:'8px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12, fontFamily: FONT }}
                >
                  Cancel
                </button>
                <button
                  style={{
                    flex:1, padding:'8px 16px', borderRadius:10, border:'none',
                    background: opponentName ? GOLD : 'rgba(212,175,55,0.35)',
                    color:'#000', fontWeight:800, cursor: opponentName ? 'pointer' : 'not-allowed',
                    fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    fontFamily: FONT, letterSpacing:'0.04em',
                  }}
                  onClick={startBattle}
                  disabled={!opponentName}
                >
                  <Swords className="w-3.5 h-3.5" /> START BATTLE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
