import React from 'react';
import { motion } from 'framer-motion';
import { MicOff, Volume2 } from 'lucide-react';

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
const GOLD = '#d4af37';
const CYAN = '#00FFFF';
const MAROON = '#5c2035';
const RED = '#EF4444';

function Waveform({ color }) {
  return (
    <div className="flex items-end justify-center gap-[2px] h-4">
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          animate={{ height: [3, 12, 6, 10, 3] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
          style={{ width: 2, background: color, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

function HexTile({ participant, isHost, isSpeaking }) {
  const name = participant?.name || participant?.full_name || 'Guest';
  const avatarUrl = participant?.avatar_url || participant?.thumbnail_url;
  const isMuted = participant?.is_muted ?? false;
  const role = participant?.role || (isHost ? 'Host' : 'Member');
  const borderColor = isHost ? GOLD : isSpeaking ? CYAN : MAROON;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 72, height: 80 }}>
        <div className="absolute inset-0" style={{ clipPath: HEX, background: borderColor }} />
        <div className="absolute inset-[2.5px] overflow-hidden flex items-center justify-center"
          style={{ clipPath: HEX, background: 'linear-gradient(145deg, #1a0a12, #0a0a0f)' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center"
              style={{ width: '100%', height: '100%', background: `radial-gradient(circle, ${borderColor}22, transparent 70%)` }}>
              <span className="text-xl font-black text-white/80">{initial}</span>
            </div>
          )}
        </div>

        {isSpeaking && !isMuted && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.85)', border: `1px solid ${CYAN}` }}>
            <Waveform color={CYAN} />
          </div>
        )}

        {isMuted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: RED, border: '2px solid #0a0a0f' }}>
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {isHost && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-sm">👑</div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[14px] font-bold text-white truncate" style={{ maxWidth: 80, lineHeight: 1.1 }}>{name}</p>
        <p className="text-[14px]" style={{ color: isHost ? GOLD : 'rgba(255,255,255,0.35)' }}>{role}</p>
      </div>
    </div>
  );
}

export default function HexagonalStageGrid({ participants = [], speakingId = null, hostId = null, maxParticipants = 20 }) {
  const stageCount = participants.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" style={{ color: GOLD }} />
          <span className="font-black uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Stage
          </span>
          <span className="font-bold" style={{ color: GOLD, fontSize: 14 }}>
            {stageCount}/{maxParticipants}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-2">
        {participants.map((p, i) => (
          <HexTile
            key={p.id || p.user_id || i}
            participant={p}
            isHost={p.user_id === hostId || p.is_host}
            isSpeaking={p.user_id === speakingId || p.id === speakingId || p.is_speaking}
          />
        ))}
      </div>
    </div>
  );
}