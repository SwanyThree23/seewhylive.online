import React, { useState } from 'react';
import { Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, Radio, Swords, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GuestRTMPPanel from '@/components/streaming/GuestRTMPPanel';
import BattleMode from '@/components/streaming/BattleMode';
import GreenroomQueue from '@/components/streaming/GreenroomQueue';

export default function MultiGuestPanel({ participants = [], spotlightId, onSpotlight, maxGuests = 20, roomId, isHost }) {
  const [layout, setLayout] = useState('grid'); // 'grid' | 'spotlight' | 'battle'
  const [tab, setTab] = useState('stage'); // 'stage' | 'greenroom'

  const speakers = participants
    .filter(p => ['host', 'co-host', 'speaker', 'guest'].includes(p.role))
    .slice(0, maxGuests);

  const getGridCols = () => {
    const count = speakers.length;
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="h-full bg-[#2A1F1F] rounded-xl border-2 border-[#800020]/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#800020', color:'#D4AF37', border:'1px solid #D4AF37', display:'inline-flex', alignItems:'center', gap:4 }}>
            <Radio className="w-3 h-3" />
            {speakers.length}/{maxGuests} GUESTS LIVE
          </span>
        </div>
        
        <div className="flex gap-1">
          {['grid', 'spotlight', 'battle'].map(l => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              style={{ fontSize:10, height:24, padding:'0 8px', background:layout===l?'#800020':'transparent', color:layout===l?'#D4AF37':'rgba(255,255,255,0.5)', border:layout===l?'1px solid #D4AF37':'1px solid rgba(255,255,255,0.2)', borderRadius:6, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}
            >
              {l === 'battle' ? <Swords className="w-3 h-3" /> : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: Stage vs Greenroom */}
      <div className="flex gap-1 mb-3">
        {[{ id: 'stage', icon: Radio, label: 'Stage' }, { id: 'greenroom', icon: Users, label: 'Queue' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-all ${
              tab === t.id ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <t.icon className="w-2.5 h-2.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'greenroom' ? (
        <GreenroomQueue roomId={roomId} isHost={isHost} />
      ) : layout === 'battle' ? (
        <BattleMode roomId={roomId} isHost={isHost} participants={participants} />
      ) : layout === 'grid' ? (
        <div className={`grid ${getGridCols()} gap-3 auto-rows-fr`}>
          <AnimatePresence>
            {speakers.map((participant) => (
              <GuestTile
                key={participant.id}
                participant={participant}
                isSpotlight={false}
                onSpotlight={onSpotlight}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="h-full flex flex-col gap-3">
          {spotlightId && (
            <div className="flex-1">
              <GuestTile
                participant={speakers.find(p => p.id === spotlightId)}
                isSpotlight={true}
                onSpotlight={onSpotlight}
              />
            </div>
          )}
          
          <div className="grid grid-cols-6 gap-2 h-24">
            {speakers
              .filter(p => p.id !== spotlightId)
              .map((participant) => (
                <GuestTile
                  key={participant.id}
                  participant={participant}
                  isSpotlight={false}
                  onSpotlight={onSpotlight}
                  compact
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}  // closes tab === 'greenroom' ternary

function GuestTile({ participant, isSpotlight, onSpotlight, compact = false }) {
  const [showRTMP, setShowRTMP] = useState(false);
  if (!participant) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative group ${compact ? 'h-full' : ''}`}
    >
      <div style={{
        background:'#3C2F2F',
        border: `2px solid ${participant.is_streaming ? '#D4AF37' : 'rgba(128,0,32,0.3)'}`,
        boxShadow: participant.is_streaming ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
        borderRadius:8,
        overflow:'hidden',
        position:'relative',
        height: isSpotlight ? '100%' : compact ? '100%' : undefined,
        aspectRatio: (!isSpotlight && !compact) ? '16/9' : undefined,
      }}>
          {/* Video/Avatar Display */}
          <div className="relative w-full h-full bg-gradient-to-br from-[#3C2F2F] to-[#2A1F1F] flex items-center justify-center">
            <div style={{
              width: isSpotlight?128 : compact?48 : 80,
              height: isSpotlight?128 : compact?48 : 80,
              borderRadius:'50%', overflow:'hidden',
              background:'rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:isSpotlight?32:12, color:'#D4AF37'
            }}>
              {participant.user_avatar
                ? <img src={participant.user_avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : participant.user_name?.charAt(0).toUpperCase()}
            </div>

            {/* Streaming Indicator */}
            {participant.is_streaming && (
              <span style={{ position:'absolute', top:8, right:8, fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'#dc2626', color:'#fff', display:'inline-flex', alignItems:'center', gap:4 }}>
                <Radio className="w-2 h-2" />
                LIVE
              </span>
            )}

            {/* Name & Status Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-[#F5E6D3] font-semibold truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                    {participant.user_name}
                  </p>
                  {!compact && (
                    <div className="flex items-center gap-1 mt-1">
                      <span style={{ fontSize:10, fontWeight:900, padding:'2px 6px', borderRadius:99, border:'1px solid #D4AF37', color:'#D4AF37', background:'transparent' }}>
                        {participant.role}
                      </span>
                    </div>
                  )}
                </div>

                {!compact && (
                  <div className="flex items-center gap-1">
                    {participant.is_audio_enabled ? (
                      <Mic className="w-3 h-3 text-green-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                    {participant.is_video_enabled && (
                      <Video className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Expand Button */}
            {!compact && (
              <button
                onClick={() => onSpotlight?.(participant.id)}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ width:32, height:32, background:'rgba(0,0,0,0.5)', border:'none', borderRadius:6, cursor:'pointer', color:'#D4AF37', display:'flex', alignItems:'center', justifyContent:'center' }}
              >
                {isSpotlight ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* RTMP Toggle Button */}
            {!compact && (
              <button
                onClick={() => setShowRTMP(v => !v)}
                title="Configure RTMP destinations"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all"
                style={{ width:32, height:32, background: showRTMP ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.5)', border:'none', borderRadius:6, cursor:'pointer', color: showRTMP ? '#D4AF37' : 'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', opacity: showRTMP ? 1 : undefined }}
              >
                <Radio className="w-4 h-4" />
              </button>
            )}
          </div>
      </div>

      {/* Collapsible RTMP Panel */}
      <AnimatePresence>
        {showRTMP && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-1"
          >
            <GuestRTMPPanel
              participantId={participant.id}
              userId={participant.user_id || participant.id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}