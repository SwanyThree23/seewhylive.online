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
  const [historyLog, setHistoryLog] = useState([]);
  const [showHistory, setShowHistory] = useState(() => { try { return localStorage.getItem('alert_history_open') === 'true'; } catch { return false; } });

  useEffect(() => {
    const handler = (alert) => {
      setAlerts(prev => [...prev.slice(-3), alert]);
      setHistoryLog(prev => [alert, ...prev].slice(0, 50));
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
    sub: { bg: 'from-[#7B5DA6]/90 to-[#7B5DA6]/70', border: 'border-[#7B5DA6]', icon: '⭐', iconColor: '#7B5DA6' },
    stage: { bg: 'from-blue-900/90 to-[#4A8A7A]/70', border: 'border-[#4A8A7A]', icon: '🎤', iconColor: '#4A8A7A' },
    health: { bg: 'from-yellow-900/90 to-orange-900/70', border: 'border-yellow-500', icon: '⚠️', iconColor: '#C9A84C' },
    moderation: { bg: 'from-red-900/90 to-rose-900/70', border: 'border-red-500', icon: '🚫', iconColor: '#C0392B' },
    milestone: { bg: 'from-yellow-900/90 to-amber-900/70', border: 'border-[#d4af37]', icon: '🎉', iconColor: '#d4af37' },
    clip:      { bg: 'from-[#4A8A7A]/90 to-[#4A8A7A]/70',  border: 'border-[#4A8A7A]', icon: '✂️', iconColor: '#4A8A7A' },
    gift:      { bg: 'from-yellow-900/90 to-amber-900/70',  border: 'border-[#d4af37]', icon: '🎁', iconColor: '#D4AF37' },
    handraise: { bg: 'from-[#0D1022]/90 to-[#1A1422]/70',  border: 'border-[#C9A84C]', icon: '🖐', iconColor: '#C9A84C' },
    poll:      { bg: 'from-[#4A3A8A]/90 to-[#3A2A7A]/70',  border: 'border-[#7B5DA6]', icon: '📊', iconColor: '#7B5DA6' },
    battle:    { bg: 'from-red-900/90 to-[#800020]/70',    border: 'border-[#C0392B]', icon: '⚔️', iconColor: '#C0392B' },
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      {/* History toggle button */}
      {historyLog.length > 0 && (
        <div className="pointer-events-auto flex justify-end">
          <button
            onClick={() => setShowHistory(v => { const n = !v; try { localStorage.setItem('alert_history_open', String(n)); } catch {} return n; })}
            className="text-[9px] px-2 py-1 rounded border border-white/10 hover:bg-white/10 text-white/30 hover:text-white/60"
          >
            {showHistory ? 'Hide' : `History (${historyLog.length})`}
          </button>
        </div>
      )}

      {/* History log drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-auto rounded-xl overflow-hidden"
            style={{ background: 'rgba(8,11,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', maxHeight: 220, overflowY: 'auto' }}
          >
            {historyLog.map(a => {
              const s = typeStyle[a.type] || typeStyle.tip;
              return (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-b-0">
                  <span className="text-sm">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{a.title}</p>
                    {a.body && <p className="text-[9px] text-white/40 truncate">{a.body}</p>}
                  </div>
                  <span className="text-[8px] text-white/20 shrink-0">{new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

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
              {!alert.persistent && (
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
