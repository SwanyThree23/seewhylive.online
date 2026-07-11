import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Star, AlertTriangle, Zap, Scissors } from 'lucide-react';

let alertIdCounter = 0;
const alertListeners = new Set();

export function fireAlert(alert) {
  alertListeners.forEach(fn => fn({ ...alert, id: ++alertIdCounter, ts: Date.now() }));
}

export default function HostAlertCenter() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const handler = (alert) => {
      setAlerts(prev => [...prev.slice(-3), alert]);
      if (!alert.persistent) {
        const duration = alert.duration || 5000;
        setTimeout(() => dismiss(alert.id), duration);
      }
    };
    alertListeners.add(handler);
    return () => alertListeners.delete(handler);
  }, []);

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const typeStyle = {
    tip: { bg: 'from-yellow-900/90 to-amber-900/70', border: 'border-[#d4af37]', icon: '💰', iconColor: '#d4af37' },
    sub: { bg: 'from-purple-900/90 to-violet-900/70', border: 'border-purple-400', icon: '⭐', iconColor: '#a78bfa' },
    stage: { bg: 'from-blue-900/90 to-cyan-900/70', border: 'border-[#00d4ff]', icon: '🎤', iconColor: '#00d4ff' },
    health: { bg: 'from-yellow-900/90 to-orange-900/70', border: 'border-yellow-500', icon: '⚠️', iconColor: '#f59e0b' },
    moderation: { bg: 'from-red-900/90 to-rose-900/70', border: 'border-red-500', icon: '🚫', iconColor: '#C0392B' },
    milestone: { bg: 'from-yellow-900/90 to-amber-900/70', border: 'border-[#d4af37]', icon: '🎉', iconColor: '#d4af37' },
    clip: { bg: 'from-cyan-900/90 to-teal-900/70', border: 'border-[#00d4ff]', icon: '✂️', iconColor: '#00d4ff' },
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      <AnimatePresence>
        {alerts.map(alert => {
          const style = typeStyle[alert.type] || typeStyle.tip;
          return (
            <motion.div
              key={alert.id}
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto bg-gradient-to-r ${style.bg} border ${style.border} rounded-xl px-4 py-3 shadow-2xl`}
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{alert.title}</p>
                  {alert.body && <p className="text-[10px] text-white/70 mt-0.5 line-clamp-2">{alert.body}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {alert.action && (
                    <button
                      onClick={() => { alert.action(); dismiss(alert.id); }}
                      className="text-[10px] px-2 py-1 rounded border border-white/20 hover:bg-white/10 text-white"
                    >
                      {alert.actionLabel || 'Act'}
                    </button>
                  )}
                  <button onClick={() => dismiss(alert.id)} className="text-white/40 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {alert.progress !== undefined && (
                <div className="mt-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: style.iconColor }}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: (alert.duration || 5000) / 1000, ease: 'linear' }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}