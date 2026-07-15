import React from 'react';
import { motion } from 'framer-motion';
import { X, MoreVertical, Share2, Users, Radio } from 'lucide-react';

const GOLD = '#d4af37';
const RED = '#C0392B';
const GREEN = '#6DBF7E';

export default function RoomStatusHeader({
  title,
  subtitle,
  viewerCount = 0,
  hereNow = 0,
  speakingName = null,
  isLive = false,
  onClose,
  onShare,
  onMenu,
}) {
  return (
    <div className="sticky top-0 z-40" style={{ background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top, 0px))' }}>
        <button onClick={onClose} className="flex items-center justify-center rounded-lg active:scale-90 transition-transform"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)' }}>
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex-1 text-center px-2 min-w-0">
          <p className="font-black text-white truncate" style={{ fontSize: 16 }}>{title}</p>
          {subtitle && <p className="truncate" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={onMenu} className="flex items-center justify-center rounded-lg active:scale-90 transition-transform"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)' }}>
            <MoreVertical className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={onShare} className="flex items-center justify-center rounded-lg active:scale-90 transition-transform"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)' }}>
            <Share2 className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-2.5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)' }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full" style={{ background: RED }} />
              <span className="font-black uppercase" style={{ color: RED, fontSize: 14, letterSpacing: '0.05em' }}>LIVE</span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Users className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="font-bold" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              {viewerCount.toLocaleString()}
            </span>
          </div>

          {hereNow > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>·</span>
              <span className="font-medium" style={{ color: GREEN, fontSize: 14 }}>{hereNow} here now</span>
            </div>
          )}

          {speakingName && (
            <div className="flex items-center gap-1 min-w-0">
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>·</span>
              <Radio className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
              <span className="font-medium truncate" style={{ color: GOLD, fontSize: 14 }}>{speakingName} is speaking</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}