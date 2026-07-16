import React from 'react';
import { motion } from 'framer-motion';
import { Smile, MessageSquare, Video, Mic, MicOff, VideoOff } from 'lucide-react';

const RED = '#EF4444';

export default function FloatingControlBar({
  onReact,
  onChat,
  onToggleVideo,
  onToggleMic,
  chatBadge = 0,
  isVideoOn = false,
  isMicOn = false,
}) {
  const buttons = [
    { icon: Smile, label: 'React', onClick: onReact, color: '#FFD700' },
    { icon: MessageSquare, label: 'Chat', onClick: onChat, color: '#00FFFF', badge: chatBadge },
    { icon: isVideoOn ? Video : VideoOff, label: 'Video', onClick: onToggleVideo, color: isVideoOn ? '#6DBF7E' : 'rgba(255,255,255,0.4)' },
    { icon: isMicOn ? Mic : MicOff, label: 'Mic', onClick: onToggleMic, color: isMicOn ? '#6DBF7E' : RED },
  ];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="flex items-center gap-2 px-4 py-3 rounded-full"
        style={{
          background: 'rgba(30,30,35,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.88 }}
              onClick={btn.onClick}
              className="relative flex items-center justify-center rounded-full transition-all"
              style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)' }}
            >
              <Icon className="w-5 h-5" style={{ color: btn.color }} />
              {btn.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold"
                  style={{ background: RED, color: '#fff', fontSize: 14 }}>
                  {btn.badge > 99 ? '99+' : btn.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}