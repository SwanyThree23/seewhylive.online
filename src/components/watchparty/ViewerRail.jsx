import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users } from 'lucide-react';

export default function ViewerRail({ members, hostId, maxVisible = 20 }) {
  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-black/50 border-b border-white/10 overflow-x-auto scrollbar-hide shrink-0">
      <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
      <span className="text-[10px] text-white/40 shrink-0 mr-1">{members.length} watching</span>
      <AnimatePresence>
        {visible.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: i * 0.03 }}
            className="relative shrink-0 group"
            title={m.user_name}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 transition-all ${
              m.user_id === hostId
                ? 'bg-gradient-to-br from-[#d4af37] to-orange-600 border-[#d4af37]'
                : 'bg-gradient-to-br from-purple-700 to-blue-700 border-white/20'
            }`}>
              {m.user_name?.charAt(0)?.toUpperCase()}
            </div>
            {m.user_id === hostId && (
              <Crown className="w-2.5 h-2.5 text-[#d4af37] absolute -top-1 -right-0.5" />
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black/90 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {m.user_name}{m.user_id === hostId ? ' (Host)' : ''}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-[9px] text-white/60 font-bold shrink-0">
          +{overflow}
        </div>
      )}
    </div>
  );
}