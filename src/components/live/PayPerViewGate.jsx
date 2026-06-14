import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

const G = '#d4af37';

export default function PayPerViewGate({ roomId, ppvPrice = 4.99, onPurchase }) {
  const [purchased, setPurchased] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate payment
      setPurchased(true);
      onPurchase?.();
    } catch (error) {
      console.error('PPV error:', error);
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