import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicOff } from 'lucide-react';

export default function MuteNotificationToast({ notification }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[90%]"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'rgba(20,20,30,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(192,57,43,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
            <div className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 32, height: 32, background: 'rgba(192,57,43,0.2)' }}>
              <MicOff className="w-4 h-4" style={{ color: '#EF4444' }} />
            </div>
            <p className="text-white font-medium" style={{ fontSize: 14 }}>
              The host has muted <span className="font-bold" style={{ color: '#EF4444' }}>{notification.userName}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}