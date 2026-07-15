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
}
