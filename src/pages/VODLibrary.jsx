import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Film, Scissors, Sparkles, Eye, Play } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import VODLibraryComponent from '@/components/vod/VODLibrary';
import RecordingManager from '../components/content/RecordingManager';
import EmbedPlayer from '../components/streaming/EmbedPlayer';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import AutomatedClipGenerator from '../components/streaming/AutomatedClipGenerator';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import ShareToSocial from '../components/social/ShareToSocial';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const TABS = [
  { id: 'library', label: 'VOD Library', icon: Film, color: GOLD },
  { id: 'highlights', label: 'AI Highlights', icon: Sparkles, color: '#D4854A' },
  { id: 'recordings', label: 'Recordings', icon: Play, color: '#6DBF7E' },
  { id: 'embed', label: 'Embed Player', icon: Eye, color: GOLD },
];

export default function VODLibraryPage() {
  const [activeTab, setActiveTab] = useState('library');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  const { data: stats } = useQuery({
    queryKey: ['vodStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { vods: 0, clips: 0, totalViews: 0, highlights: 0 };
      const [vods, clips] = await Promise.all([
        base44.entities.VODVideo.filter({ creator_id: user.id }),
        base44.entities.StreamClip.filter({ creator_id: user.id }),
      ]);
      const highlights = [];
      const totalViews = (vods || []).reduce((s, v) => s + (v.views || 0), 0)
        + (clips || []).reduce((s, c) => s + (c.view_count || 0), 0);
      return { vods: vods?.length || 0, clips: clips?.length || 0, totalViews, highlights: highlights?.length || 0 };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b flex items-center gap-3"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <Film className="w-5 h-5" style={{ color: GOLD }} />
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>VOD Library</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Past streams, AI highlights, clips &amp; recordings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'VODs', value: stats?.vods || 0, color: GOLD },
            { label: 'Clips', value: stats?.clips || 0, color: '#D4854A' },
            { label: 'AI Highlights', value: stats?.highlights || 0, color: '#6DBF7E' },
            { label: 'Total Views', value: (stats?.totalViews || 0).toLocaleString(), color: GOLD },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <p className="text-2xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
              <p className="text-[10px] font-black uppercase mt-0.5" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
          ))}
        </div>

      {/* Tab nav */}
      <div className="flex gap-0 border-b sticky top-0 z-10 overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(212,175,55,0.1)', background: 'rgba(10,7,16,0.97)', backdropFilter: 'blur(12px)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 flex-1 min-w-[80px] py-3 text-[11px] font-black uppercase transition-all border-b-2"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              color: activeTab === t.id ? G : 'rgba(255,255,255,0.3)',
              borderBottomColor: activeTab === t.id ? G : 'transparent',
              background: activeTab === t.id ? 'rgba(212,175,55,0.05)' : 'transparent',
            }}>
            <span className="mx-auto flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

        {/* Tab picker cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <motion.button key={tab.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setActiveTab(tab.id)}
                className="p-3 rounded-2xl text-left transition-all"
                style={{ background: activeTab === tab.id ? `${tab.color}10` : 'rgba(8,11,24,0.9)', border: `1px solid ${activeTab === tab.id ? tab.color + '30' : 'rgba(212,175,55,0.08)'}`, cursor: 'pointer' }}>
                <Icon className="w-4 h-4 mb-1.5" style={{ color: tab.color }} />
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

        {/* Tab content */}
        {user?.id && (
          <AnimatePresence mode="wait">
            {activeTab === 'library' && (
              <motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-10">
                <VODLibraryComponent creatorId={user.id} />
              </motion.div>
            )}

            {activeTab === 'highlights' && (
              <motion.div key="highlights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 pb-10">
                <AutomatedHighlightReels />
                <AutomatedClipGenerator roomId={roomId} />
              </motion.div>
            )}

            {activeTab === 'recordings' && (
              <motion.div key="recordings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-10">
                <RecordingManager userId={user.id} />
              </motion.div>
            )}

            {activeTab === 'embed' && (
              <motion.div key="embed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-10">
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="font-black text-sm" style={{ ...T, color: GOLD }}>Embed Player Preview</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      PPV-aware embed with code generation for your website or blog
                    </p>
                  </div>
                  <div className="p-5">
                    <EmbedPlayer
                      roomId={user.id}
                      creatorName={user.full_name || user.email || 'Creator'}
                      streamTitle="VOD Preview"
                      isLive={false}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 28px' }}>
          {[
            { label: '✂️ Clips Library',    href: 'ClipsLibrary'    },
            { label: '📤 Post Video',       href: 'VideoPost'       },
            { label: '🎬 Broadcast Studio', href: 'BroadcastStudio' },
            { label: '👤 Creator Channel',  href: 'CreatorChannel'  },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <MilestoneAlerts userId={user?.id} roomId={roomId} />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
        <AutomatedHighlightReels streamSession={null} />
        <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
      </div>
    </div>
  );
}