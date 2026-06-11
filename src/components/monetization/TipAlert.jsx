import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Heart, Star, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

const tipIcons = {
  5: Heart,
  10: Star,
  25: Award,
};

export default function TipAlert({ roomId, recipientId }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!roomId || !recipientId) return;

    // Subscribe to real-time tip transactions
    const unsubscribe = base44.entities.Transaction.subscribe((event) => {
      if (
        event.type === 'create' &&
        event.data.type === 'tip' &&
        event.data.room_id === roomId &&
        event.data.to_user_id === recipientId
      ) {
        const newAlert = {
          id: event.data.id,
          amount: event.data.amount,
          from: event.data.from_user_id,
          message: event.data.message,
          timestamp: Date.now(),
        };

        setAlerts((prev) => [...prev, newAlert]);

        // Trigger confetti for large tips
        if (event.data.amount >= 25) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== newAlert.id));
        }, 5000);
      }
    });

    return () => unsubscribe();
  }, [roomId, recipientId]);

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => {
          const Icon = Object.entries(tipIcons).reverse().find(([amount]) => alert.amount >= parseInt(amount))?.[1] || DollarSign;
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="bg-gradient-to-r from-[#800020] to-[#C0392B] text-white rounded-lg shadow-2xl p-4 min-w-[300px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold">${alert.amount}</span>
                    <span className="text-[#C9A84C]">Tip Received!</span>
                  </div>
                  <p className="text-sm text-[#C9A84C]">
                    From User {alert.from.slice(0, 8)}
                  </p>
                  {alert.message && (
                    <p className="text-sm text-white/90 mt-1 italic">
                      "{alert.message}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}