import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Bell, Gavel, Zap, Info } from 'lucide-react';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SoundAlertsManager from '../components/monetization/SoundAlertsManager';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
const BG = '#080B18';
const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'goals', label: 'Goals', icon: Target, color: GOLD },
  { id: 'alerts', label: 'Sound Alerts', icon: Bell, color: '#22c55e' },
  { id: 'auctions', label: 'Auctions', icon: Gavel, color: '#a78bfa' },
];

export default function MonetizationWidgets() {
  const [activeTab, setActiveTab] = useState('goals');
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: myRooms = [] } = useQuery({
    queryKey: ['my-live-rooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }, '-created_date', 5),
    enabled: !!user,
  });

  const activeRoom = myRooms[0];

  return (
    <div className="min-h-screen pb-10 text-white" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <Zap className="w-5 h-5" style={{ color: GOLD }} />
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>Monetization Widgets</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Streamer Goals, Sound Alerts &amp; Live Auctions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-4">
        {/* Beta notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#00d4ff' }} />
          <div>
            <p className="text-sm font-black" style={{ ...T, color: '#00d4ff' }}>Beta Testing</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Goals update in real-time, sound alerts fire during streams, and auctions let viewers bid during live sessions.
              {activeRoom ? (
                <span> Using room: <strong className="text-white">{activeRoom.title}</strong></span>
              ) : (
                <span> <Link to={createPageUrl('CreateRoom')} className="underline" style={{ color: '#00d4ff' }}>Start a live room</Link> to enable auction bidding.</span>
              )}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {TABS.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <button onClick={() => setActiveTab(s.id)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all"
                style={{ background: activeTab === s.id ? `${s.color}10` : 'rgba(13,6,24,0.9)', border: `1px solid ${activeTab === s.id ? s.color + '30' : 'rgba(212,175,55,0.08)'}`, cursor: 'pointer' }}>
                <s.icon className="w-5 h-5 shrink-0" style={{ color: s.color }} />
                <p className="text-xs font-black" style={{ ...T, color: activeTab === s.id ? s.color : 'rgba(255,255,255,0.5)' }}>{s.label}</p>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all"
              style={{ ...T, color: activeTab === t.id ? t.color : 'rgba(255,255,255,0.35)', borderBottomColor: activeTab === t.id ? t.color : 'transparent', background: 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="font-black text-sm" style={{ ...T, color: GOLD }}>Streamer Goals — Real-Time</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Goals update live and celebrate when reached with confetti</p>
            </div>
            <div className="p-5">
              <StreamerGoalsWidget creatorId={user?.id} roomId={activeRoom?.id} isCreator={true} />
            </div>
          </div>
        )}

        {/* Sound Alerts */}
        {activeTab === 'alerts' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(34,197,94,0.1)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="font-black text-sm" style={{ ...T, color: '#22c55e' }}>Sound Alert Configuration</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Alerts trigger automatically when donation thresholds are met</p>
            </div>
            <div className="p-5">
              <SoundAlertsManager creatorId={user?.id} />
            </div>
          </div>
        )}

        {/* Auctions */}
        {activeTab === 'auctions' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(167,139,250,0.1)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="font-black text-sm" style={{ ...T, color: '#a78bfa' }}>Live Auctions</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Start real-time auctions — viewers bid live during your stream</p>
            </div>
            <div className="p-5">
              <LiveAuctionWidget creatorId={user?.id} roomId={activeRoom?.id} isCreator={true} currentUser={user} />
            </div>
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="monetize" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <BackgroundCustomizer />
    </div>
  );
}
