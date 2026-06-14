import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let pendingPoints = 0;
let notifTimer = null;
const listeners = new Set();

export function awardPoints(pts) {
  pendingPoints += pts;
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    if (pendingPoints > 0) {
      listeners.forEach(fn => fn(pendingPoints));
      pendingPoints = 0;
    }
  }, 800);
}

export default function PointsNotification({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const handler = (pts) => {
      const id = ++idRef.current;
      setNotifications(prev => [...prev.slice(-3), { id, pts }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 2500);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div className="absolute bottom-20 left-3 z-20 flex flex-col gap-1 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10, y: 0 }}
            animate={{ opacity: 1, x: 0, y: -5 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 bg-[#080B18]/90 border border-[#D4AF37]/40 rounded-full px-3 py-1.5"
          >
            <motion.span
              animate={{ rotate: [0, 20, -20, 0] }}
              transition={{ duration: 0.4 }}
              className="text-base"
            >🪙</motion.span>
            <span className="text-sm font-bold text-[#D4AF37]">+{n.pts} pts</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}