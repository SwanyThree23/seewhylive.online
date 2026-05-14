import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { DollarSign, Heart } from 'lucide-react';

const G = '#d4af37';

export default function PaymentMethodSelector({ creatorId, roomId, onPaymentComplete }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState(5);
  const [processing, setProcessing] = useState(false);

  const methods = [
    { id: 'paypal', name: 'PayPal', icon: '₽' },
    { id: 'cashapp', name: 'CashApp', icon: '$' },
    { id: 'venmo', name: 'Venmo', icon: '💳' },
    { id: 'zelle', name: 'Zelle', icon: '🏦' },
    { id: 'chime', name: 'Chime', icon: '💰' },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const result = await base44.functions.invoke('processPaymentWithPlatformCut', {
        recipient_id: creatorId,
        amount,
        payment_method: selectedMethod,
        room_id: roomId,
        transaction_type: 'direct_support',
      });

      if (result?.data?.status === 'success') {
        onPaymentComplete?.(result.data);
        setAmount(5);
        setSelectedMethod(null);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
    setProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg space-y-3"
      style={{ background: 'rgba(7,7,15,0.95)', border: `1px solid ${G}30` }}
    >
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4" style={{ color: G }} />
        <p className="text-xs font-bold" style={{ color: G }}>Support Creator</p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-white/50">Select payment method:</p>
        <div className="grid grid-cols-5 gap-2">
          {methods.map(method => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className="p-2 rounded-lg text-center text-xs font-bold transition-all"
              style={{
                background: selectedMethod === method.id ? G : 'rgba(255,255,255,0.05)',
                color: selectedMethod === method.id ? '#000' : 'rgba(255,255,255,0.5)',
                border: selectedMethod === method.id ? `2px solid ${G}` : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="text-lg">{method.icon}</div>
              <div className="text-[8px]">{method.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-white/50">Amount USD:</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="1000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1 px-2 py-1.5 rounded text-xs bg-white/5 border border-white/10 text-white"
          />
          <span className="text-[10px] text-white/50">
            Platform cut: ${(amount * 0.1).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={!selectedMethod || processing}
        className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
        style={{ background: G, color: '#000' }}
      >
        {processing ? 'Processing...' : `Send $${amount}`}
      </button>
    </motion.div>
  );
}