import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Timer, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const BG = '#0E1120';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const PINK = '#C0392B';

const DURATION_OPTIONS = [
  { label: '60s', value: 60 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
  { label: '5min', value: 300 },
  { label: '10min', value: 600 },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PKBattleModal({ isOpen, onClose, roomId, isHost, currentUser, hostName }) {
  const [phase, setPhase] = useState('setup');
  const [challengerHandle, setChallengerHandle] = useState('');
  const [duration, setDuration] = useState(180);
  const [timeLeft, setTimeLeft] = useState(180);
  const [hostScore, setHostScore] = useState(0);
  const [challengerScore, setChallengerScore] = useState(0);
  const [surrendered, setSurrendered] = useState(false);

  // Reset all state when modal opens
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setPhase('setup');
      setChallengerHandle('');
      setDuration(180);
      setTimeLeft(180);
      setHostScore(0);
      setChallengerScore(0);
      setSurrendered(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Countdown timer in active phase
  useEffect(() => {
    if (phase !== 'active') return;
    if (timeLeft <= 0) {
      setPhase('result');
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  // Simulate opponent score in active phase
  useEffect(() => {
    if (phase !== 'active') return;
    const id = setInterval(() => {
      setChallengerScore((s) => s + Math.floor(Math.random() * 80));
    }, 7000);
    return () => clearInterval(id);
  }, [phase]);

  const handleSendChallenge = async () => {
    if (!challengerHandle.trim()) {
      toast.error('Enter a challenger handle');
      return;
    }
    try {
      await base44.entities.PKBattle.create({
        room_id: roomId,
        host_id: currentUser?.id,
        host_name: hostName,
        challenger_handle: challengerHandle,
        duration_seconds: duration,
        status: 'pending',
        host_score: 0,
        challenger_score: 0,
      });
      setTimeLeft(duration);
      setHostScore(0);
      setChallengerScore(0);
      setSurrendered(false);
      setPhase('active');
    } catch (err) {
      toast.error('Failed to send challenge. Try again.');
    }
  };

  const handleSurrender = () => {
    setSurrendered(true);
    setPhase('result');
  };

  const handleRematch = () => {
    setPhase('setup');
    setHostScore(0);
    setChallengerScore(0);
    setTimeLeft(duration);
    setSurrendered(false);
  };

  const totalScore = hostScore + challengerScore;
  const hostPct = totalScore === 0 ? 50 : Math.round((hostScore / totalScore) * 100);
  const challengerPct = 100 - hostPct;

  let winner = null;
  if (phase === 'result') {
    if (hostScore > challengerScore) winner = 'host';
    else if (challengerScore > hostScore) winner = 'challenger';
    else winner = 'draw';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pk-backdrop"
            className="fixed inset-0 z-[89] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="pk-sheet"
            className="fixed bottom-0 inset-x-0 z-[90] rounded-t-3xl overflow-hidden"
            style={{ background: BG, maxHeight: '90vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: '90vh' }}>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="px-5 pb-8 pt-2">
                {/* ── PHASE: SETUP ────────────────────────────────── */}
                {phase === 'setup' && (
                  <div className="flex flex-col gap-5">
                    {/* Header */}
                    <div className="text-center">
                      <h2
                        className="text-3xl font-black tracking-wide"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                      >
                        ⚔️ PK Battle
                      </h2>
                      <p className="text-white/50 text-sm mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Challenge another creator
                      </p>
                    </div>

                    {/* Challenger handle input */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1 uppercase tracking-widest"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Challenger Handle
                      </label>
                      <input
                        type="text"
                        value={challengerHandle}
                        onChange={(e) => setChallengerHandle(e.target.value)}
                        placeholder="@challenger_handle"
                        className="w-full rounded-xl px-4 py-3 text-white text-base outline-none focus:ring-2 transition-all"
                        style={{
                          background: '#161929',
                          border: `1px solid ${GOLD}44`,
                          fontFamily: 'Barlow Condensed, sans-serif',
                          caretColor: GOLD,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = GOLD; }}
                        onBlur={(e) => { e.target.style.borderColor = `${GOLD}44`; }}
                      />
                    </div>

                    {/* Duration selector */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-widest"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Duration
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setDuration(opt.value)}
                            className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
                            style={{
                              fontFamily: 'Barlow Condensed, sans-serif',
                              background: duration === opt.value ? GOLD : '#161929',
                              color: duration === opt.value ? '#080B18' : 'rgba(255,255,255,0.6)',
                              border: `1px solid ${duration === opt.value ? GOLD : 'rgba(255,255,255,0.12)'}`,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rules */}
                    <div
                      className="rounded-xl p-4 text-sm space-y-1"
                      style={{ background: '#161929', border: '1px solid rgba(212,175,55,0.15)' }}
                    >
                      <p className="text-white/80" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>• Most supporter tips win</p>
                      <p className="text-white/80" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>• 1 USD = 10 battle points</p>
                      <p className="text-white/80" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>• Host ends the battle or timer runs out</p>
                    </div>

                    {/* Send Challenge button */}
                    <button
                      onClick={handleSendChallenge}
                      className="w-full py-4 rounded-2xl text-white font-black text-xl tracking-widest uppercase transition-opacity active:opacity-80 flex items-center justify-center gap-2"
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        background: `linear-gradient(135deg, ${CRIMSON}, ${PINK})`,
                      }}
                    >
                      <Swords size={20} />
                      Send Challenge
                    </button>
                  </div>
                )}

                {/* ── PHASE: ACTIVE ───────────────────────────────── */}
                {phase === 'active' && (
                  <div className="flex flex-col gap-5">
                    {/* Timer */}
                    <div className="text-center">
                      <div
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
                        style={{ background: '#161929', border: `1px solid ${GOLD}44` }}
                      >
                        <Timer size={16} color={GOLD} />
                        <span
                          className="text-3xl font-black tracking-widest"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: timeLeft <= 10 ? PINK : GOLD }}
                        >
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="flex items-center gap-3">
                      {/* Host side */}
                      <div className="flex-1 text-center">
                        <p
                          className="text-xs uppercase tracking-widest font-semibold mb-1"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: CRIMSON }}
                        >
                          {hostName || 'You'}
                        </p>
                        <p
                          className="text-4xl font-black"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: CRIMSON }}
                        >
                          {hostScore.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>pts</p>
                      </div>

                      {/* VS */}
                      <div
                        className="text-2xl font-black px-3"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                      >
                        VS
                      </div>

                      {/* Challenger side */}
                      <div className="flex-1 text-center">
                        <p
                          className="text-xs uppercase tracking-widest font-semibold mb-1"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                        >
                          {challengerHandle || 'Challenger'}
                        </p>
                        <p
                          className="text-4xl font-black"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                        >
                          {challengerScore.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>pts</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: '#161929' }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${hostPct}%`, background: CRIMSON }}
                      />
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${challengerPct}%`, background: GOLD }}
                      />
                    </div>
                    <div className="flex justify-between -mt-3">
                      <span className="text-xs font-semibold" style={{ color: CRIMSON, fontFamily: 'Barlow Condensed, sans-serif' }}>{hostPct}%</span>
                      <span className="text-xs font-semibold" style={{ color: GOLD, fontFamily: 'Barlow Condensed, sans-serif' }}>{challengerPct}%</span>
                    </div>

                    {/* Boost button */}
                    <button
                      onClick={() => setHostScore((s) => s + 100)}
                      className="w-full py-3 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity active:opacity-70"
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        background: `linear-gradient(135deg, ${CRIMSON}, ${PINK})`,
                        color: '#fff',
                      }}
                    >
                      <Zap size={18} />
                      + 100 pts  BOOST
                    </button>

                    {/* Tip support row */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50 mb-2 text-center"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        +Tip Support
                      </p>
                      <div className="flex gap-2">
                        {[{ label: '$1', pts: 10 }, { label: '$5', pts: 50 }, { label: '$10', pts: 100 }].map((tip) => (
                          <button
                            key={tip.label}
                            onClick={() => setHostScore((s) => s + tip.pts)}
                            className="flex-1 py-2.5 rounded-xl font-black text-base uppercase tracking-wide transition-opacity active:opacity-70"
                            style={{
                              fontFamily: 'Barlow Condensed, sans-serif',
                              background: '#161929',
                              border: `1px solid ${GOLD}55`,
                              color: GOLD,
                            }}
                          >
                            {tip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Surrender button */}
                    <button
                      onClick={handleSurrender}
                      className="w-full py-2.5 rounded-xl font-bold text-base uppercase tracking-widest transition-opacity active:opacity-70"
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        background: 'transparent',
                        border: `1px solid ${PINK}`,
                        color: PINK,
                      }}
                    >
                      Surrender
                    </button>
                  </div>
                )}

                {/* ── PHASE: RESULT ───────────────────────────────── */}
                {phase === 'result' && (
                  <div className="flex flex-col gap-5 items-center text-center">
                    {/* Header */}
                    <div>
                      <h2
                        className="text-3xl font-black tracking-wide"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                      >
                        {surrendered ? '😔 Battle Ended' : '🏆 Battle Complete!'}
                      </h2>
                    </div>

                    {/* Trophy animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                    >
                      <Trophy size={56} color={GOLD} />
                    </motion.div>

                    {/* Winner card */}
                    <div
                      className="w-full rounded-2xl p-5 flex flex-col gap-3"
                      style={{ background: '#161929', border: `1px solid ${GOLD}33` }}
                    >
                      {/* Scores row */}
                      <div className="flex items-center justify-around">
                        <div className={winner === 'challenger' ? 'opacity-40' : ''}>
                          <p
                            className="text-sm uppercase tracking-widest font-semibold"
                            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: CRIMSON }}
                          >
                            {hostName || 'You'}
                          </p>
                          <p
                            className="text-4xl font-black"
                            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: winner === 'host' ? GOLD : 'rgba(255,255,255,0.5)' }}
                          >
                            {hostScore.toLocaleString()}
                          </p>
                        </div>

                        <span
                          className="text-lg font-black"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.3)' }}
                        >
                          VS
                        </span>

                        <div className={winner === 'host' ? 'opacity-40' : ''}>
                          <p
                            className="text-sm uppercase tracking-widest font-semibold"
                            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                          >
                            {challengerHandle || 'Challenger'}
                          </p>
                          <p
                            className="text-4xl font-black"
                            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: winner === 'challenger' ? GOLD : 'rgba(255,255,255,0.5)' }}
                          >
                            {challengerScore.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Winner declaration */}
                      <div
                        className="pt-3 border-t"
                        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                      >
                        {winner === 'draw' ? (
                          <p
                            className="text-2xl font-black tracking-widest"
                            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                          >
                            Draw!
                          </p>
                        ) : (
                          <>
                            <p className="text-xs uppercase tracking-widest text-white/40 mb-1"
                              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                              Winner
                            </p>
                            <p
                              className="text-2xl font-black tracking-wide"
                              style={{ fontFamily: 'Barlow Condensed, sans-serif', color: GOLD }}
                            >
                              {winner === 'host' ? (hostName || 'You') : (challengerHandle || 'Challenger')}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Rematch / Close buttons */}
                    <div className="w-full flex gap-3">
                      <button
                        onClick={handleRematch}
                        className="flex-1 py-3 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity active:opacity-70"
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          background: `linear-gradient(135deg, ${CRIMSON}, ${PINK})`,
                          color: '#fff',
                        }}
                      >
                        <Swords size={18} />
                        Rematch
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl font-black text-lg uppercase tracking-widest transition-opacity active:opacity-70"
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          background: '#161929',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
