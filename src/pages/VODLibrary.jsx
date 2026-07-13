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
import NativeSelect from '@/components/shared/NativeSelect';
const G = '#D4AF37';
const BG = '#0A0710';

function VODPicker({ vods, selected, onSelect, placeholder = 'Select a video…' }) {
  return (
    <div className="mb-4">
      <NativeSelect
        value={selected?.id || ''}
        onChange={val => onSelect(vods.find(v => v.id === val) || null)}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}
        options={[{value:'',label:placeholder},...vods.map(v => ({value: v.id, label: v.title || 'Untitled'}))]}
      />
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