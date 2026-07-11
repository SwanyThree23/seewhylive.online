import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Film, Scissors, Archive, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import VODLibraryComponent from '@/components/vod/VODLibrary';
import VODCard from '../components/vod/VODCard';
import RecordingManager from '../components/content/RecordingManager';
import ChapterEditor from '../components/vod/ChapterEditor';
import VODTrimEditor from '../components/vod/VODTrimEditor';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const G = '#D4AF37';
const BG = '#0A0710';

function VODPicker({ vods, selected, onSelect, placeholder = 'Select a video…' }) {
  return (
    <div className="relative mb-4">
      <select
        value={selected?.id || ''}
        onChange={e => onSelect(vods.find(v => v.id === e.target.value) || null)}
        className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-sm text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <option value="">{placeholder}</option>
        {vods.map(v => (
          <option key={v.id} value={v.id}>{v.title || 'Untitled'}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: G }} />
    </div>
  );
}

export default function VODLibraryPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedForChapters, setSelectedForChapters] = useState(null);
  const [selectedForTrim, setSelectedForTrim] = useState(null);
  const [selectedForHighlights, setSelectedForHighlights] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: stats } = useQuery({
    queryKey: ['vodStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { vods: 0, clips: 0, totalViews: 0 };
      const vods = await base44.entities.VODVideo.filter({ creator_id: user.id });
      const clips = await base44.entities.StreamClip.filter({ creator_id: user.id });
      const totalViews = (vods || []).reduce((sum, v) => sum + (v.views || 0), 0) + (clips || []).reduce((sum, c) => sum + (c.view_count || 0), 0);
      return { vods: vods?.length || 0, clips: clips?.length || 0, totalViews };
    },
    enabled: !!user?.id,
  });

  const { data: myVODs = [] } = useQuery({
    queryKey: ['myVODs', user?.id],
    queryFn: () => base44.entities.VODVideo.filter({ creator_id: user.id }),
    enabled: !!user?.id,
  });

  const TABS = [
    { id: 'library',    icon: <Film className="w-3.5 h-3.5" />,     label: 'Library' },
    { id: 'recordings', icon: <Archive className="w-3.5 h-3.5" />,  label: 'Recordings' },
    { id: 'chapters',   icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Chapters' },
    { id: 'trim',       icon: <Scissors className="w-3.5 h-3.5" />, label: 'Trim' },
    { id: 'highlights', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI Clips' },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <div className="px-4 py-8 md:px-8 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Film className="w-6 h-6" style={{ color: G }} />
            <h1 className="text-3xl font-black" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
              VOD Library
            </h1>
          </div>
          <p className="text-white/60">Manage your past streams, clips, and highlights</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'VODs', value: stats?.vods || 0, icon: '📹' },
            { label: 'Clips', value: stats?.clips || 0, icon: '✂️' },
            { label: 'Total Views', value: stats?.totalViews || 0, icon: '👁️' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(212,175,55,0.12)` }}>
              <div className="text-lg mb-1">{stat.icon}</div>
              <p className="text-[10px] text-white/60">{stat.label}</p>
              <p className="text-lg font-black" style={{ color: G }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {activeTab === 'library' && user?.id && (
          <div className="space-y-4">
            <VODLibraryComponent creatorId={user.id} />
            {myVODs.map(v => (
              <VODCard key={v.id} vod={v} onEdit={() => {}} onTrim={() => setSelectedForTrim(v)} onChapters={() => setSelectedForChapters(v)} onPublish={() => {}} />
            ))}
          </div>
        )}

        {activeTab === 'recordings' && user?.id && <RecordingManager userId={user.id} />}

        {activeTab === 'chapters' && user?.id && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForChapters} onSelect={setSelectedForChapters} placeholder="Pick a VOD to edit chapters…" />
            {selectedForChapters
              ? <ChapterEditor video={selectedForChapters} onSave={() => setSelectedForChapters(null)} onCancel={() => setSelectedForChapters(null)} />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a video above to edit its chapters</p>
            }
          </div>
        )}

        {activeTab === 'trim' && user?.id && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForTrim} onSelect={setSelectedForTrim} placeholder="Pick a VOD to trim…" />
            {selectedForTrim
              ? <VODTrimEditor video={selectedForTrim} onSave={() => setSelectedForTrim(null)} onCancel={() => setSelectedForTrim(null)} />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a video above to trim it</p>
            }
          </div>
        )}

        {activeTab === 'highlights' && user?.id && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForHighlights} onSelect={setSelectedForHighlights} placeholder="Pick a recording to generate highlights…" />
            {selectedForHighlights
              ? <AIHighlightGenerator recording={selectedForHighlights} />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a video to generate AI highlights</p>
            }
          </div>
        )}
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="vod" viewerCount={0} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <BackgroundCustomizer />
    </div>
  );
}
