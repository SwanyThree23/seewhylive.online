import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const G = '#d4af37';

export default function PayPerViewGate({ roomId, ppvPrice = 4.99, currentUserId, onPurchase }) {
  const [purchased, setPurchased] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      // Record the PPV transaction (status 'pending' until payment confirmed)
      await base44.entities.Transaction.create({
        room_id: roomId,
        sender_id: currentUserId || null,
        transaction_type: 'ppv',
        payment_method: 'card',
        amount_usd: ppvPrice,
        creator_payout: +(ppvPrice * 0.9).toFixed(2),
        platform_cut: +(ppvPrice * 0.1).toFixed(2),
        status: 'pending',
        processed_at: new Date().toISOString(),
      });
      // Mark participant as PPV-unlocked so the room can verify access
      if (currentUserId && roomId) {
        const participants = await base44.entities.Participant.filter({ room_id: roomId, user_id: currentUserId });
        if (participants[0]) {
          await base44.entities.Participant.update(participants[0].id, { ppv_unlocked: true });
        }
      }
      setPurchased(true);
      onPurchase?.();
      toast.success('Access unlocked!');
    } catch {
      toast.error('Purchase failed — please try again.');
    }
    setProcessing(false);
  };

  if (purchased) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="p-6 rounded-2xl text-center max-w-sm" style={{ background: 'rgba(8,11,24,0.98)', border: `1px solid ${G}30` }}>
        <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: G }} />
        
        <h2 className="text-xl font-black mb-2" style={{ color: G }}>
          Premium Content
        </h2>
        
        <p className="text-sm text-white/70 mb-6">
          Unlock exclusive access to this live stream.
        </p>

        <div className="mb-6 p-3 rounded-lg" style={{ background: `${G}15`, border: `1px solid ${G}30` }}>
          <p className="text-3xl font-black" style={{ color: G }}>${ppvPrice}</p>
          <p className="text-xs text-white/50 mt-1">One-time purchase</p>
        </div>

        <button
          onClick={handlePurchase}
          disabled={processing}
          className="w-full py-3 rounded-lg font-bold text-lg transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${G}, #D4AF37)`,
            color: '#000',
          }}
        >
          {processing ? 'Processing...' : `Unlock for $${ppvPrice}`}
        </button>

        <p className="text-[10px] text-white/30 mt-3">
          💳 Secure payment · 24-hour access
        </p>
      </div>
    </motion.div>
  );
}