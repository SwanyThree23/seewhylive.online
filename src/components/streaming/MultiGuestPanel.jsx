import React, { useState } from 'react';
import { Radio, Swords, Users, LayoutGrid, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OctagonalVideoGrid from './OctagonalVideoGrid';
import GuestRTMPPanel from '@/components/streaming/GuestRTMPPanel';
import BattleMode from '@/components/streaming/BattleMode';
import GreenroomQueue from '@/components/streaming/GreenroomQueue';

const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const GOLD = '#D4AF37';
const CRIMSON = '#800020';

export default function MultiGuestPanel({
  participants = [],
  spotlightId,
  onSpotlight,
  maxGuests = 20,
  roomId,
  isHost,
  currentUser,
  onStreamOut,
}) {
  const [layout, setLayout] = useState('grid');   // 'grid' | 'spotlight' | 'battle'
  const [tab, setTab] = useState('stage');         // 'stage' | 'greenroom' | 'rtmp'
  const [showRTMP, setShowRTMP] = useState(false);

  const speakers = participants.filter(p =>
    ['host', 'co-host', 'speaker', 'guest'].includes(p.role)
  ).slice(0, maxGuests);
  const viewers = participants.filter(p => p.role === 'viewer');

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{ background: '#080B18', border: '2px solid rgba(128,0,32,0.3)' }}>

      {/* ── header bar ── */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: 'rgba(8,11,24,0.98)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: CRIMSON, color: GOLD, border: `1px solid ${GOLD}`, ...T }}>
            <Radio className="w-2.5 h-2.5" />
            {speakers.length}/{maxGuests} ON STAGE
          </span>
          {viewers.length > 0 && (
            <span className="text-[10px] font-black" style={{ ...T, color: 'rgba(255,255,255,0.35)' }}>
              · {viewers.length} viewers
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Layout toggles */}
          {[
            { id: 'grid', icon: LayoutGrid, label: 'Grid' },
            { id: 'spotlight', icon: Maximize2, label: 'Spotlight' },
            { id: 'battle', icon: Swords, label: 'Battle' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setLayout(id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase transition-all"
              style={{
                ...T,
                background: layout === id ? CRIMSON : 'transparent',
                color: layout === id ? GOLD : 'rgba(255,255,255,0.4)',
                border: `1px solid ${layout === id ? GOLD : 'rgba(255,255,255,0.12)'}`,
                cursor: 'pointer',
              }}>
              <Icon className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── tab strip ── */}
      <div className="flex gap-0 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,11,24,0.8)' }}>
        {[
          { id: 'stage', icon: Radio, label: 'Live Stage' },
          { id: 'greenroom', icon: Users, label: 'Queue' },
          { id: 'rtmp', icon: Radio, label: 'Stream Out' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase border-b-2 transition-all"
            style={{
              ...T,
              color: tab === t.id ? GOLD : 'rgba(255,255,255,0.3)',
              borderBottomColor: tab === t.id ? GOLD : 'transparent',
              background: 'transparent',
              cursor: 'pointer',
            }}>
            <t.icon className="w-2.5 h-2.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── content area ── */}
      <div className="flex-1 min-h-0">
        {tab === 'greenroom' ? (
          <GreenroomQueue roomId={roomId} isHost={isHost} />
        ) : tab === 'rtmp' ? (
          <div className="p-3 overflow-y-auto h-full">
            <p className="text-[10px] font-black uppercase mb-3" style={{ ...T, color: GOLD }}>
              Stream-Out Destinations
            </p>
            <GuestRTMPPanel
              participantId={participants.find(p => p.user_id === currentUser?.id)?.id}
              userId={currentUser?.id}
            />
          </div>
        ) : layout === 'battle' ? (
          <BattleMode roomId={roomId} isHost={isHost} participants={participants} />
        ) : (
          <OctagonalVideoGrid
            roomId={roomId}
            participants={participants}
            currentUser={currentUser}
            isHost={isHost}
            onStreamOut={onStreamOut}
            compactMode={layout === 'spotlight'}
          />
        )}
      </div>
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
                      <Mic className="w-3 h-3 text-[#6DBF7E]" />
                    ) : (
                      <MicOff className="w-3 h-3 text-[#C0392B]" />
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