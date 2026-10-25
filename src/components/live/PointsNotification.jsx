import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let pendingPoints = 0;
let notifTimer = null;
const listeners = new Set();

let pendingReason = null;

export function awardPoints(pts, reason) {
  pendingPoints += pts;
  if (reason && !pendingReason) pendingReason = reason;
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    if (pendingPoints > 0) {
      listeners.forEach(fn => fn(pendingPoints, pendingReason));
      pendingPoints = 0;
      pendingReason = null;
    }
  }, 800);
}

const MILESTONE_THRESHOLDS = [100, 500];

function ptsTier(pts) {
  if (pts >= 50) return { border: 'rgba(192,57,43,0.6)', text: '#C0392B', bg: 'rgba(192,57,43,0.15)' };
  if (pts >= 10) return { border: 'rgba(212,133,74,0.6)', text: '#D4854A', bg: 'rgba(212,133,74,0.15)' };
  return { border: 'rgba(212,175,55,0.4)', text: '#D4AF37', bg: 'rgba(212,175,55,0.08)' };
}

export default function PointsNotification({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [sessionPts, setSessionPts] = useState(0);
  const [milestone, setMilestone] = useState(null);
  const idRef = useRef(0);
  const sessionRef = useRef(0);

  useEffect(() => {
    const handler = (pts, reason) => {
      const id = ++idRef.current;
      setNotifications(prev => [...prev.slice(-3), { id, pts, reason }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 2500);

      // Milestone check
      const prev = sessionRef.current;
      sessionRef.current += pts;
      setSessionPts(sessionRef.current);
      const crossed = MILESTONE_THRESHOLDS.find(m => prev < m && sessionRef.current >= m);
      if (crossed) {
        setMilestone(crossed);
        setTimeout(() => setMilestone(null), 3000);
      }
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div className="absolute bottom-20 left-3 z-20 flex flex-col gap-1 pointer-events-none">
      <AnimatePresence>
        {milestone && (
          <motion.div
            key={`milestone-${milestone}`}
            initial={{ opacity: 0, scale: 0.7, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.6)' }}
          >
            <span className="text-base">🏆</span>
            <span className="text-sm font-black" style={{ color: '#D4AF37' }}>{milestone} pts milestone!</span>
          </motion.div>
        )}
        {notifications.map(n => {
          const tier = ptsTier(n.pts);
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10, y: 0 }}
              animate={{ opacity: 1, x: 0, y: -5 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
            >
              <motion.span
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 0.4 }}
                className="text-base"
              >🪙</motion.span>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold" style={{ color: tier.text }}>+{n.pts} pts</span>
                {n.reason && <span className="text-[9px] opacity-60" style={{ color: tier.text }}>{n.reason}</span>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}