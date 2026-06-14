import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, Check, X } from 'lucide-react';

const G = '#d4af37';

export default function AIModeration({ roomId, isHost = false }) {
  const [flags, setFlags] = useState([]);
  const [isActive, setIsActive] = useState(isHost);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const checkContent = async () => {
      setProcessing(true);
      try {
        const recentMessages = await base44.entities.Message.filter(
          { room_id: roomId, deleted: false },
          '-created_date',
          20
        );

        for (const msg of recentMessages) {
          const result = await base44.functions.invoke('validateStreamSecurity', {
            content: msg.content,
            message_id: msg.id,
            user_id: msg.user_id,
            room_id: roomId,
          });

          if (result?.data?.flagged) {
            setFlags(prev => {
              const exists = prev.find(f => f.message_id === msg.id);
              return exists ? prev : [...prev, {
                id: Date.now(),
                message_id: msg.id,
                user: msg.user_name,
                content: msg.content.slice(0, 50),
                severity: result.data.severity,
                reason: result.data.reason,
                timestamp: new Date(msg.created_date),
              }];
            });
          }
        }
      } catch (error) {
      }
      setProcessing(false);
    };

    checkContent();
    const interval = setInterval(checkContent, 15000);
    return () => clearInterval(interval);
  }, [roomId, isActive]);

  const handleAction = (flagId, action) => {
    setFlags(prev => prev.filter(f => f.id !== flagId));
    // Action: 'approve', 'remove', 'warn'
  };

  if (!isHost) return null;

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsActive(!isActive)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-sm transition-all"
        style={{
          background: isActive ? `linear-gradient(135deg, #D4AF37, ${G})` : 'rgba(255,255,255,0.05)',
          color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
          border: isActive ? `1px solid #D4AF37` : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Shield className="w-4 h-4" />
        AI Moderator {isActive ? '✓' : '○'}
      </motion.button>

      {/* Flags List */}
      <AnimatePresence>
        {flags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-lg"
            style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)' }}
          >
            <p className="text-xs font-bold text-red-300">⚠️ {flags.length} item(s) flagged</p>
            {flags.slice(0, 3).map((flag) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-2 rounded text-xs space-y-1"
                style={{ background: 'rgba(255,100,100,0.12)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white/80">{flag.user}</p>
                    <p className="text-white/50">{flag.content}...</p>
                    <p className="text-[11px] text-white/40 mt-1">Reason: {flag.reason}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleAction(flag.id, 'approve')}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Check className="w-3 h-3" style={{ color: '#6DBF7E' }} />
                    </button>
                    <button
                      onClick={() => handleAction(flag.id, 'remove')}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status */}
      {isActive && (
        <div className="text-[11px] text-white/30 text-center">
          {processing ? 'Scanning...' : 'Active · Real-time content scanning'}
        </div>
      )}
    </div>
  );
}