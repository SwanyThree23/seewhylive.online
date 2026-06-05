import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Gift, DollarSign } from 'lucide-react';

const G = '#d4af37';

const TIP_TIERS = [
  { amount: 5, label: '$5', emoji: '🍕' },
  { amount: 10, label: '$10', emoji: '🎁' },
  { amount: 25, label: '$25', emoji: '🌟' },
  { amount: 50, label: '$50', emoji: '🔥' },
  { amount: 100, label: '$100', emoji: '👑' },
];

export default function TippingOverlay({ roomId, creatorId, isVisible = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleTip = async (amount) => {
    setProcessing(true);
    try {
      await base44.functions.invoke('processTip', {
        room_id: roomId,
        creator_id: creatorId,
        amount,
        message: 'Support tip',
      });
      
      // Show celebration
      setSelectedAmount(amount);
      setTimeout(() => {
        setIsOpen(false);
        setSelectedAmount(null);
      }, 2000);
    } catch (error) {
      console.error('Tip error:', error);
    }
    setProcessing(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-32 right-4 z-40">
      {/* Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-sm transition-all"
        style={{
          background: isOpen ? `linear-gradient(135deg, ${G}, #FFB700)` : G,
          color: '#000',
        }}
      >
        <Gift className="w-4 h-4" />
        Tip Creator
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-12 right-0 w-64 p-4 rounded-lg"
            style={{ background: 'rgba(7,7,15,0.95)', border: `1px solid ${G}30` }}
          >
            {/* Header */}
            <p className="text-xs font-bold uppercase mb-3" style={{ color: G }}>Support this creator</p>

            {/* Quick Tips */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {TIP_TIERS.map((tier) => (
                <motion.button
                  key={tier.amount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTip(tier.amount)}
                  disabled={processing}
                  className="p-2 rounded transition-all text-xs font-bold"
                  style={{
                    background: selectedAmount === tier.amount ? `${G}30` : 'rgba(255,255,255,0.05)',
                    border: selectedAmount === tier.amount ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.1)',
                    color: selectedAmount === tier.amount ? G : 'white',
                  }}
                >
                  <span className="text-lg block">{tier.emoji}</span>
                  {tier.label}
                </motion.button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-2 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none"
              />
              <button
                onClick={() => customAmount && handleTip(parseFloat(customAmount))}
                disabled={!customAmount || processing}
                className="w-full px-3 py-1.5 rounded text-xs font-bold transition-all"
                style={{
                  background: customAmount ? G : 'rgba(212,175,55,0.2)',
                  color: customAmount ? '#000' : 'rgba(255,255,255,0.3)',
                }}
              >
                Send ${customAmount || '0'}
              </button>
            </div>

            {/* Info */}
            <p className="text-[11px] text-white/30 mt-2 text-center">
              💳 Secure payment · Creator receives 90%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}