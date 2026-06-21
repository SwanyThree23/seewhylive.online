import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Radio } from 'lucide-react';
import { toast } from 'sonner';

function FlipUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-20 md:w-24 md:h-28">
        {/* Back */}
        <div className="absolute inset-0 bg-[rgba(255,255,255,0.06)] rounded-xl border border-[rgba(212,175,55,0.2)] flex items-center justify-center">
          <span className="text-3xl md:text-5xl font-bold font-mono text-[#d4af37]">{String(value).padStart(2, '0')}</span>
        </div>
        {/* Center divider */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-black/60 z-10" />
      </div>
      <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// CSS particles background
function Particles() {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, delay: Math.random() * 4,
    duration: Math.random() * 6 + 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          className="absolute rounded-full bg-[#d4af37]"
          animate={{ opacity: [0, 0.6, 0], y: [0, -40] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default function PreStreamCountdown({ room, currentUser, onGoLive }) {
  const qc = useQueryClient();
  const [timeLeft, setTimeLeft] = useState(null);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    if (!room?.scheduled_start) return;
    const tick = () => {
      const diff = new Date(room.scheduled_start) - new Date();
      if (diff <= 0) { setTimeLeft(null); onGoLive?.(); return; }
      setTimeLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room?.scheduled_start]);

  const reminderMutation = useMutation({
    mutationFn: () => base44.entities.Notification.create({
      user_id: currentUser?.id,
      type: 'room_invite',
      title: `${room?.title} starts soon!`,
      message: `Your stream reminder for "${room?.title}" is set.`,
    }),
    onSuccess: () => setReminderSet(true),
    onError: () => toast.error('Failed to set reminder.'),
  });

  if (!timeLeft && timeLeft !== 0) return null;

  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="absolute inset-0 z-20 bg-[#0d0618] flex flex-col items-center justify-center overflow-hidden">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
      >
        {/* Pulsing badge */}
        <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(212,175,55,0.2)', color:'#d4af37', border:'1px solid rgba(212,175,55,0.4)', display:'inline-flex', alignItems:'center', gap:6, animation:'pulse 2s infinite' }}>
          <Radio className="w-3 h-3" /> Going Live Soon
        </span>

        {/* Creator info */}
        <div>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800020] to-[#d4af37] flex items-center justify-center text-3xl font-bold text-white mx-auto mb-3 shadow-[0_0_40px_rgba(212,175,55,0.4)]">
            {room?.title?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{room?.title}</h2>
          {room?.description && <p className="text-white/50 text-sm max-w-md mx-auto">{room.description}</p>}
        </div>

        {/* Countdown */}
        <div className="flex items-start gap-3 md:gap-5">
          {days > 0 && <FlipUnit value={days} label="days" />}
          <FlipUnit value={hours} label="hours" />
          <span className="text-[#d4af37] text-3xl md:text-5xl font-bold mt-2">:</span>
          <FlipUnit value={minutes} label="min" />
          <span className="text-[#d4af37] text-3xl md:text-5xl font-bold mt-2">:</span>
          <FlipUnit value={seconds} label="sec" />
        </div>

        {/* CTA */}
        {currentUser && (
          <button
            onClick={() => !reminderSet && reminderMutation.mutate()}
            disabled={reminderSet}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:8, border:'none', background: reminderSet ? '#15803d' : '#d4af37', color: reminderSet ? '#fff' : '#000', fontWeight:700, cursor: reminderSet ? 'default' : 'pointer', fontSize:14, fontFamily:'Barlow Condensed, sans-serif' }}
          >
            <Bell className="w-4 h-4" />
            {reminderSet ? 'Reminder Set ✓' : 'Set Reminder'}
          </button>
        )}

        <p className="text-xs text-white/30">Chat is active while you wait 👇</p>
      </motion.div>
    </div>
  );
}