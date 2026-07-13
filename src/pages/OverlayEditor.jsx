import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Layers, Bell, Palette, Target, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AlertConfig from '@/components/live/AlertConfig';
import OverlayThemeBuilder from '@/components/live/OverlayThemeBuilder';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SoundboardWidget from '../components/live/SoundboardWidget';
import SceneSwitcher from '../components/live/SceneSwitcher';
import LowerThirdsBanner from '@/components/live/LowerThirdsBanner';
import RoomBrandingEditor from '../components/live/RoomBrandingEditor';
import StreamMetricsBar from '../components/live/StreamMetricsBar';
import ChatOverlay from '../components/live/ChatOverlay';
import AuraPanelDrawer from '../components/live/AuraPanelDrawer';
import InteractivePollWidget from '../components/streaming/InteractivePollWidget';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import ShareToSocial from '../components/social/ShareToSocial';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'theme', label: 'Theme & Overlays', icon: Palette, color: GOLD },
  { id: 'alerts', label: 'Stream Alerts', icon: Bell, color: '#D4854A' },
  { id: 'goals', label: 'Streamer Goals', icon: Target, color: '#6DBF7E' },
  { id: 'soundboard', label: 'Soundboard', icon: Bell, color: GOLD },
];

export default function OverlayEditorPage() {
  const [activeTab, setActiveTab] = useState('theme');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const roomId = new URLSearchParams(window.location.search).get('room_id');

  const { data: liveRoom } = useQuery({
    queryKey: ['my-live-room-overlay', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }, '-created_date', 1).then(r => r?.[0]),
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b flex items-center justify-between flex-wrap gap-3"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Overlay &amp; Branding</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {liveRoom ? `Active room: ${liveRoom.title}` : 'Customize alerts, themes, and stream goals'}
            </p>
          </div>
        </div>
        {liveRoom && (
          <span className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full uppercase animate-pulse"
            style={{ ...T, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#C0392B' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live Now
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-5">
        <div className="flex items-start gap-3 p-4 rounded-xl mb-5"
          style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Configure your stream overlays, alert animations, and streamer goals here.
            Changes apply to all active and future rooms. Goals update live for viewers in real-time.
          </p>
        </div>

        {/* Tab picker cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <motion.button key={tab.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setActiveTab(tab.id)}
                className="p-4 rounded-2xl text-left transition-all"
                style={{ background: activeTab === tab.id ? `${tab.color}10` : 'rgba(8,11,24,0.9)', border: `1px solid ${activeTab === tab.id ? tab.color + '30' : 'rgba(212,175,55,0.08)'}`, cursor: 'pointer' }}>
                <Icon className="w-5 h-5 mb-2" style={{ color: tab.color }} />
                <p className="font-black text-xs" style={{ ...T, color: activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.5)' }}>{tab.label}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Tab bar */}
        <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase border-b-2 transition-all shrink-0"
                style={{ ...T, color: active ? tab.color : 'rgba(255,255,255,0.35)', borderBottomColor: active ? tab.color : 'transparent', background: 'transparent' }}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {user?.id && (
          <AnimatePresence mode="wait">
            {activeTab === 'theme' && (
              <motion.div key="theme" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                <OverlayThemeBuilder creatorId={user.id} />
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="font-black text-sm text-white" style={T}>Overlay Tips</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { icon: '🎨', text: 'Use the theme builder to set your brand colors for all stream overlays' },
                      { icon: '📌', text: 'Overlay elements update live — changes appear instantly in your room' },
                      { icon: '🔲', text: 'Enable the Goals overlay to show subscriber/tip progress bars in OBS' },
                      { icon: '⚡', text: 'Alert animations trigger on tips, new subs, and donation milestones' },
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-base shrink-0">{tip.icon}</span>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-10">
                <AlertConfig creatorId={user.id} />
              </motion.div>
            )}

            {activeTab === 'goals' && (
              <motion.div key="goals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden pb-10" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(109,191,126,0.1)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="font-black text-sm" style={{ ...T, color: '#6DBF7E' }}>Streamer Goals — Real-Time</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Goals update live during streams and celebrate when reached with confetti
                  </p>
                </div>
                <div className="p-5">
                  <StreamerGoalsWidget creatorId={user.id} roomId={liveRoom?.id} isCreator={true} />
                </div>
              </motion.div>
            )}

            {activeTab === 'soundboard' && (
              <motion.div key="soundboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden pb-10" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="font-black text-sm" style={{ ...T, color: GOLD }}>Soundboard</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Trigger audio effects and sound clips during your live stream
                  </p>
                </div>
                <div className="p-5">
                  <SoundboardWidget roomId={liveRoom?.id} isHost={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {user?.id && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OverlayThemeBuilder creatorId={user.id} />
            <SceneSwitcher activeScene="main" onSceneChange={() => {}} />
            <RoomBrandingEditor roomData={null} onBrandingChange={() => {}} isHost={true} />
            <StreamMetricsBar startTime={null} memberCount={0} tipTotal={0} peakViewers={0} />
            <ChatOverlay roomId={liveRoom?.id || null} isVisible={true} />
            <AuraPanelDrawer roomId={liveRoom?.id || null} hostId={user?.id} onClose={() => {}} />
            <InteractivePollWidget roomId={liveRoom?.id || null} isHost={true} />
          </div>
        )}

        {/* Quick-links to related creator tools */}
        <div className="flex flex-wrap gap-3 mt-8">
          {[
            { label: '🎬 Broadcast Studio', href: 'BroadcastStudio' },
            { label: '🖼 Scene Templates',  href: 'SceneTemplates'  },
            { label: '🔔 Stream Alerts',    href: 'StreamAlerts'    },
            { label: '🏷 Lower Thirds',     href: 'OverlayBuilder'  },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span className="font-black uppercase text-[10px] px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', display: 'block', cursor: 'pointer' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 0 24px' }}>
          <OnlineUsersGrid compact maxVisible={8} />
          <ContentRecommendations />
          <StreamGoals isHost={true} />
          <ShareToSocial content={{ title: 'Overlay Editor', url: window.location.href }} />
        </div>
      </div>
    </div>
  );
}