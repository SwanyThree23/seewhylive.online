import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const G = '#D4AF37';
const B = '#800020';
const BG = '#0C0806';
const CREAM = '#F5F5DC';
const OB = '#1A1209';

const QUICK_AMOUNTS = [1, 5, 15];

function TipAnimation({ senderName, amount, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.2, y: 50 }}
        animate={{ scale: 1.3, y: 0 }}
        transition={{ type: 'spring', bounce: 0.65 }}
        className="text-9xl mb-6 select-none"
      >
        💸
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-2xl font-black uppercase tracking-wider"
        style={{
          color: G,
          fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
          textShadow: '0 0 24px rgba(212,175,55,0.7)'
        }}
      >
        {senderName} tipped ${amount}!
      </motion.p>
    </motion.div>
  );
}

export default function TipWidget({ roomId, hostId, currentUser }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(5);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [animating, setAnimating] = useState(null);

  const rawAmount = useCustom ? parseFloat(custom) : selected;
  const validAmount = rawAmount > 0 && !isNaN(rawAmount);
  const creatorReceives = validAmount ? Math.floor(rawAmount * 90) / 100 : 0;
  const platformFee = validAmount ? Math.floor(rawAmount * 10) / 100 : 0;

  const sendTip = useMutation({
    mutationFn: async () => {
      const amt = rawAmount;
      await base44.entities.Transaction.create({
        room_id: roomId,
        type: 'tip',
        amount: amt,
        creator_amount: Math.floor(amt * 90) / 100,
        platform_fee: Math.floor(amt * 10) / 100,
        from_user_id: currentUser.id,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || currentUser.email,
        to_user_id: hostId,
        status: 'completed',
        message: message,
      });
    },
    onSuccess: () => {
      const name = (currentUser.full_name || currentUser.email || 'Viewer').split(' ')[0];
      setAnimating({ name, amount: rawAmount });
      setOpen(false);
      setMessage('');
      setCustom('');
      setUseCustom(false);
      setSelected(5);
    },
    onError: () => toast.error('Could not send tip'),
  });

  return (
    <>
      <AnimatePresence>
        {animating && (
          <TipAnimation
            senderName={animating.name}
            amount={animating.amount}
            onDone={() => setAnimating(null)}
          />
        )}
      </AnimatePresence>

      {/* Tip Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase text-[10px]"
        title="Send a tip"
        style={{
          background: `${B}20`,
          color: CREAM,
          border: `1px solid ${B}50`,
          fontFamily: 'Barlow Condensed, sans-serif'
        }}
      >
        💸 Tip
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.65)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl flex flex-col"
              style={{ background: BG, border: `1px solid ${G}18`, maxHeight: '80vh', overflowY: 'auto' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💸</span>
                  <span
                    className="font-black uppercase tracking-widest text-base"
                    style={{ color: G, fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif', textShadow: '0 0 16px rgba(212,175,55,0.5)' }}
                  >
                    Send a Tip
                  </span>
                </div>
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">

                {/* Quick Amount Chips */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold mb-2.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace' }}>
                    Select Amount
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => { setSelected(amt); setUseCustom(false); }}
                        className="px-5 py-2 rounded-xl text-sm font-black uppercase transition-all active:scale-95"
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          background: (!useCustom && selected === amt) ? B : 'rgba(255,255,255,0.05)',
                          color: (!useCustom && selected === amt) ? CREAM : 'rgba(255,255,255,0.5)',
                          border: (!useCustom && selected === amt) ? `1px solid ${B}` : '1px solid rgba(255,255,255,0.1)',
                          boxShadow: (!useCustom && selected === amt) ? `0 0 14px ${B}60` : 'none'
                        }}
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setUseCustom(true)}
                      className="px-5 py-2 rounded-xl text-sm font-black uppercase transition-all active:scale-95"
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        background: useCustom ? B : 'rgba(255,255,255,0.05)',
                        color: useCustom ? CREAM : 'rgba(255,255,255,0.5)',
                        border: useCustom ? `1px solid ${B}` : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: useCustom ? `0 0 14px ${B}60` : 'none'
                      }}
                    >
                      Custom
                    </button>
                  </div>

                  {useCustom && (
                    <div className="mt-2.5 relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm" style={{ color: G, fontFamily: 'DM Mono, monospace' }}>$</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={custom}
                        onChange={e => setCustom(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm font-bold outline-none"
                        style={{
                          background: OB,
                          border: `1px solid ${G}30`,
                          color: CREAM,
                          fontFamily: 'DM Mono, monospace'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Split Breakdown */}
                {validAmount && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 space-y-1"
                    style={{ background: 'rgba(212,175,55,0.05)', border: `1px solid ${G}15` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace' }}>
                        Creator receives (90%)
                      </span>
                      <span className="font-black text-sm" style={{ color: G, fontFamily: 'DM Mono, monospace' }}>
                        ${creatorReceives.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono, monospace' }}>
                        Platform fee (10%)
                      </span>
                      <span className="font-black text-sm" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace' }}>
                        ${platformFee.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Message Field */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace' }}>
                    Gift Message <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                  </p>
                  <textarea
                    maxLength={140}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Say something nice..."
                    rows={2}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                    style={{
                      background: OB,
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: CREAM,
                      fontFamily: 'DM Mono, monospace'
                    }}
                  />
                  <p className="text-right text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Mono, monospace' }}>
                    {message.length}/140
                  </p>
                </div>

                {/* Send Button */}
                <button
                  disabled={!validAmount || sendTip.isPending}
                  onClick={() => sendTip.mutate()}
                  className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: validAmount ? B : 'rgba(128,0,32,0.3)',
                    color: CREAM,
                    fontFamily: 'Bebas Neue, Barlow Condensed, sans-serif',
                    letterSpacing: '0.12em',
                    boxShadow: validAmount ? `0 0 20px ${B}70` : 'none'
                  }}
                >
                  {sendTip.isPending ? 'Sending…' : `Send Tip${validAmount ? ` — $${rawAmount}` : ''}`}
                </button>

                <div className="pb-2" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}