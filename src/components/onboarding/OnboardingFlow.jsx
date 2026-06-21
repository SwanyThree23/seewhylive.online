import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Radio, Users, TrendingUp, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'music',         label: 'Music',         icon: '🎵' },
  { id: 'gaming',        label: 'Gaming',         icon: '🎮' },
  { id: 'tech',          label: 'Technology',     icon: '💻' },
  { id: 'education',     label: 'Education',      icon: '📚' },
  { id: 'business',      label: 'Business',       icon: '💼' },
  { id: 'entertainment', label: 'Entertainment',  icon: '🎬' },
  { id: 'sports',        label: 'Sports',         icon: '⚽' },
  { id: 'lifestyle',     label: 'Lifestyle',      icon: '✨' },
];

export default function OnboardingFlow({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const saveMutation = useMutation({
    mutationFn: async (prefs) => {
      const existing = await base44.entities.UserPreference.filter({ user_id: user.id });
      if (existing.length > 0) {
        await base44.entities.UserPreference.update(existing[0].id, prefs);
      } else {
        await base44.entities.UserPreference.create({ user_id: user.id, ...prefs });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPreferences'] }),
    onError: () => toast.error('Action failed.'),
  });

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Auto-advance on step 1 when 3+ selected
  const handleCategoryTap = async (id) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    setSelected(next);
    if (next.length >= 3 && step === 1) {
      await saveMutation.mutateAsync({ categories: next, onboarding_step: 1 });
      setStep(2);
    }
  };

  const finish = async () => {
    await saveMutation.mutateAsync({ categories: selected, onboarding_completed: true });
    toast.success('Welcome to SeeWhy LIVE! 🎉');
    if (user?.id) {
      base44.entities.Activity.create({
        user_id: user.id,
        type: 'milestone',
        title: 'Completed onboarding and selected content preferences',
      }).catch(() => {});
    }
    onClose();
  };

  const skip = async () => {
    await saveMutation.mutateAsync({ onboarding_completed: true, onboarding_step: 0 });
    onClose();
  };

  const progress = ((step + 1) / 4) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-0"
        style={{ background: '#0B0B18', border: '1px solid rgba(212,175,55,0.2)' }}>

        {/* Close */}
        <button onClick={skip} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4 text-white/50" />
        </button>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
            style={{ background: 'linear-gradient(90deg, #6B4423, #d4af37)' }} />
        </div>

        <div className="px-6 pb-8 pt-6">
          <AnimatePresence mode="wait">

            {/* STEP 0 — Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center space-y-6">
                <div className="text-5xl mb-2">📡</div>
                <div>
                  <h2 className="text-2xl font-black" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Welcome to SeeWhy LIVE
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Your live streaming community platform
                  </p>
                </div>
                <div className="space-y-3 text-left">
                  {[
                    { Ic: Radio, label: 'Go Live', desc: 'Stream to the world in one tap' },
                    { Ic: Users, label: 'Communities', desc: 'Find your people, build your tribe' },
                    { Ic: TrendingUp, label: 'Earn', desc: 'Tips, subs & virtual gifts — you keep 90%' },
                  ].map(({ Ic, label, desc }) => (
                    <div key={label} className="flex items-center gap-4 p-3 rounded-2xl"
                      style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.12)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(212,175,55,0.12)' }}>
                        <Ic className="w-5 h-5" style={{ color: '#d4af37' }} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{label}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep(1)}
                  className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                  Let's Go →
                </motion.button>
              </motion.div>
            )}

            {/* STEP 1 — Interests (tap-only, auto-advance at 3) */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-black" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    What interests you?
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Tap 3+ topics to continue automatically
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1 justify-center">
                  {[1,2,3].map(n => (
                    <div key={n} className="w-2 h-2 rounded-full transition-all"
                      style={{ background: selected.length >= n ? '#d4af37' : 'rgba(255,255,255,0.15)' }} />
                  ))}
                  <span className="text-[10px] ml-2" style={{ color: selected.length >= 3 ? '#d4af37' : 'rgba(255,255,255,0.3)' }}>
                    {selected.length >= 3 ? '✓ Continuing…' : `${3 - selected.length} more`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = selected.includes(cat.id);
                    return (
                      <motion.button key={cat.id} whileTap={{ scale: 0.94 }} onClick={() => handleCategoryTap(cat.id)}
                        className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
                        style={{
                          background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                          border: active ? '2px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.08)',
                        }}>
                        <span className="text-3xl">{cat.icon}</span>
                        <span className="text-xs font-bold" style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.6)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {cat.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Communities */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-black" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Your Communities
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Recommended based on your interests</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selected.map((catId) => {
                    const cat = CATEGORIES.find(c => c.id === catId);
                    if (!cat) return null;
                    return (
                      <div key={catId} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.12)' }}>
                        <span className="text-2xl">{cat.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{cat.label} Community</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Connect with {cat.label.toLowerCase()} enthusiasts</p>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full font-bold"
                          style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                          JOINED
                        </span>
                      </div>
                    );
                  })}
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep(3)}
                  className="w-full py-4 rounded-2xl font-black text-base uppercase"
                  style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                  Continue →
                </motion.button>
              </motion.div>
            )}

            {/* STEP 3 — Done */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6">
                <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-6xl">🎉</motion.div>
                <div>
                  <h2 className="text-2xl font-black" style={{ color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    You're All Set!
                  </h2>
                  <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Start streaming, join rooms, and build your audience
                  </p>
                </div>
                <div className="p-4 rounded-2xl text-sm" style={{ background: 'rgba(107,68,35,0.15)', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(196,168,130,0.8)' }}>
                  💡 Creators keep <strong style={{ color: '#d4af37' }}>90%</strong> of all earnings — tips, subscriptions, and gifts.
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={finish}
                  className="w-full py-4 rounded-2xl font-black text-base uppercase"
                  style={{ background: 'linear-gradient(135deg, #6B4423, #d4af37)', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                  Start Exploring →
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}