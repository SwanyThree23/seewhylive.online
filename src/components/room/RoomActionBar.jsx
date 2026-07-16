import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Megaphone, Bot, DollarSign, Swords, Shield } from 'lucide-react';

const GOLD = '#d4af37';
const BG = 'rgba(20,20,28,0.9)';

const ACTIONS = [
  { key: 'auction', label: 'Auction', icon: Trophy, color: GOLD },
  { key: 'invite', label: 'Invite', icon: Megaphone, color: '#6DBF7E' },
  { key: 'ai', label: 'AI Trip', icon: Bot, color: '#7B5DA6' },
  { key: 'pay', label: 'Pay', icon: DollarSign, color: '#6DBF7E' },
  { key: 'battle', label: 'Battle', icon: Swords, color: '#C0392B' },
  { key: 'panel', label: 'Host', icon: Shield, color: GOLD },
];

export default function RoomActionBar({ onAction, visible = true }) {
  if (!visible) return null;

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-6 gap-2">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAction?.(action.key)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 44, height: 44,
                  background: BG,
                  border: `1px solid ${action.color}33`,
                }}>
                <Icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <span className="font-bold" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}