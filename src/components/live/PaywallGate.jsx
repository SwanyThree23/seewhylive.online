import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, DollarSign, Crown, Timer, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PREVIEW_SECONDS = 120;

const TIERS = [
  { label: 'Basic Access', price: 0.99,  icon: '🔓', desc: 'Full stream access' },
  { label: 'VIP Access',   price: 2.99,  icon: '👑', desc: 'Stream + private chat + replay' },
  { label: 'Backstage',    price: 4.99,  icon: '⭐', desc: 'All access + 1-on-1 time' },
];

const HOST_TIERS = [
  { label: 'Free Preview (2 min)', price: 0,    icon: '👁️', desc: 'Then paywall triggers' },
  ...TIERS,
];

function fmtSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function PaywallGate({ isHost, streamTitle, onUnlock, isUnlocked }) {
  const [secondsLeft, setSecondsLeft] = useState(PREVIEW_SECONDS);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Host-side state
  const [hostPaywallEnabled, setHostPaywallEnabled] = useState(false);
  const [customPrice, setCustomPrice] = useState('');

  // Countdown timer — only for non-host non-unlocked viewers
  useEffect(() => {
    if (isHost || isUnlocked) return;

    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id);
          setPreviewExpired(true);
          toast.error('Free preview ended — unlock to keep watching', {
            duration: 6000,
            icon: '🔒',
          });
          return 0;
        }
        if (s === 30) {
          toast.warning('30 seconds of free preview remaining', { duration: 4000 });
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isHost, isUnlocked]);

  // ── Host panel ───────────────────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="bg-[rgba(8,11,24,0.9)] border border-[#d4af37]/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#d4af37]" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Paywall Settings
            </span>
          </div>
          <button
            onClick={() => {
              setHostPaywallEnabled(v => !v);
              toast.success(hostPaywallEnabled ? 'Paywall disabled' : '120s free preview paywall enabled');
            }}
            className={`w-10 h-5 rounded-full transition-all relative ${hostPaywallEnabled ? 'bg-[#d4af37]' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hostPaywallEnabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        {hostPaywallEnabled && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Access Tiers</p>
            {HOST_TIERS.map((tier, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                <span>{tier.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{tier.label}</p>
                  <p className="text-[10px] text-white/40">{tier.desc}</p>
                </div>
                <span className="text-xs text-[#d4af37] font-mono">
                  {tier.price === 0 ? 'FREE' : `$${tier.price}`}
                </span>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="Custom price $"
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{
                  background: 'rgba(8,11,24,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}
              />
              <button
                className="px-3 py-2 rounded-lg text-xs font-black uppercase"
                style={{ background: '#d4af37', color: '#000', whiteSpace: 'nowrap' }}
              >
                Add Tier
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Unlocked badge ───────────────────────────────────────────────────────
  if (isUnlocked) {
    return (
      <div className="flex items-center gap-2 border border-green-700/30 rounded-lg px-3 py-2"
        style={{ background: 'rgba(109,191,126,0.15)' }}>
        <Unlock className="w-4 h-4 text-[#6DBF7E]" />
        <span className="text-xs text-[#6DBF7E] font-semibold">Full access unlocked</span>
      </div>
    );
  }

  // ── Floating countdown badge (preview in progress) ───────────────────────
  // Rendered via portal-style fixed positioning so it floats over the stream
  const urgentColor = secondsLeft <= 30 ? '#C0392B' : secondsLeft <= 60 ? '#D4AF37' : '#6DBF7E';

  return (
    <>
      {/* Countdown pip — visible during preview, disappears when expired */}
      <AnimatePresence>
        {!previewExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            className="fixed top-[70px] right-3 z-[150] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-lg"
            style={{
              background: 'rgba(8,11,24,0.92)',
              border: `1px solid ${urgentColor}55`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Timer className="w-3 h-3" style={{ color: urgentColor }} />
            <span className="text-[11px] font-mono font-bold" style={{ color: urgentColor }}>
              {fmtSeconds(secondsLeft)}
            </span>
            <span className="text-[10px] text-white/40">free</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen paywall overlay — appears when preview expires */}
      <AnimatePresence>
        {previewExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[180] flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(20px) brightness(0.35)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5 text-center"
              style={{
                background: 'rgba(8,11,24,0.98)',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow: '0 0 60px rgba(212,175,55,0.12)',
              }}
            >
              {/* Icon + title */}
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  <Crown className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h2 className="text-white font-black text-xl" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
                  {streamTitle || 'Premium Live'}
                </h2>
                <p className="text-white/50 text-xs leading-relaxed">
                  Your 2-minute free preview has ended.<br />Unlock instant full access below.
                </p>
              </div>

              {/* Tier cards */}
              <div className="space-y-2 text-left">
                {TIERS.map((tier, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTier(tier)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all"
                    style={{
                      background: selectedTier?.label === tier.label
                        ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedTier?.label === tier.label ? '#D4AF37' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{tier.label}</p>
                      <p className="text-[11px] text-white/40">{tier.desc}</p>
                    </div>
                    <span className="text-lg font-black text-[#D4AF37]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      ${tier.price}
                    </span>
                  </button>
                ))}
              </div>

              {/* CTA */}
              <button
                disabled={!selectedTier || processing}
                onClick={async () => {
                  if (!selectedTier) return;
                  setProcessing(true);
                  try {
                    await new Promise(r => setTimeout(r, 800)); // stub payment
                    toast.success(`${selectedTier.label} unlocked! Enjoy the stream 🎉`);
                    onUnlock?.();
                  } finally {
                    setProcessing(false);
                  }
                }}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  background: selectedTier ? '#D4AF37' : 'rgba(255,255,255,0.06)',
                  color: selectedTier ? '#000' : 'rgba(255,255,255,0.25)',
                  cursor: selectedTier ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.08em',
                }}
              >
                <Zap className="w-4 h-4" />
                {processing
                  ? 'Processing…'
                  : selectedTier
                    ? `Unlock for $${selectedTier.price}`
                    : 'Select a tier above'}
              </button>

              <p className="text-[10px] text-white/20">
                90% of every dollar goes directly to the creator · Powered by SeeWhy LIVE
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
