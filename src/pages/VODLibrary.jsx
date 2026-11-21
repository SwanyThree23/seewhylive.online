import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Film, Scissors, Archive, BookOpen, Sparkles, Play, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import VODLibraryComponent from '@/components/vod/VODLibrary';
import RecordingManager from '../components/content/RecordingManager';
import ChapterEditor from '../components/vod/ChapterEditor';
import VODTrimEditor from '../components/vod/VODTrimEditor';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';
import ClipCreatorVOD from '../components/vod/ClipCreator';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import CreatorBridge from '../components/social/CreatorBridge';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import VODCard from '../components/vod/VODCard';
import VODPicker from '../components/vod/VODPicker';

var BG = '#080B18';
var GOLD = '#D4AF37';
var G = GOLD;
var CRIMSON = '#800020';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };

var TABS = [
  { id: 'library', label: 'VOD Library', icon: Film, color: GOLD },
  { id: 'highlights', label: 'AI Highlights', icon: Sparkles, color: '#D4854A' },
  { id: 'recordings', label: 'Recordings', icon: Play, color: '#6DBF7E' },
  { id: 'embed', label: 'Embed Player', icon: Eye, color: GOLD },
];

export default function VODLibraryPage() {
  var [activeTab, setActiveTab] = useState('library');
  var [selectedForChapters, setSelectedForChapters] = useState(null);
  var [selectedForTrim, setSelectedForTrim] = useState(null);
  var [selectedForHighlights, setSelectedForHighlights] = useState(null);
  var [selectedForClips, setSelectedForClips] = useState(null);
  var [selectedForEdit, setSelectedForEdit] = useState(null);
  var [editTitle, setEditTitle] = useState('');
  var [editDesc, setEditDesc] = useState('');
  var [editSaving, setEditSaving] = useState(false);
  var queryClient = useQueryClient();

  var userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: function() { return base44.auth.me(); },
  });
  var user = userQuery.data || null;

  var roomQuery = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: function() {
      return base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(function(r) { return r[0] || null; });
    },
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoom = roomQuery.data || null;
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var roomId = activeRoomId;

  var statsQuery = useQuery({
    queryKey: ['vodStats', (user && user.id)],
    queryFn: async function() {
      if (!(user && user.id)) return { vods: 0, clips: 0, totalViews: 0, highlights: 0 };
      var results = await Promise.all([
        base44.entities.VODVideo.filter({ creator_id: user.id }),
        base44.entities.StreamClip.filter({ creator_id: user.id }),
      ]);
      var vods = results[0];
      var clips = results[1];
      var highlights = [];
      var totalViews = (vods || []).reduce(function(s, v) { return s + (v.views || 0); }, 0)
        + (clips || []).reduce(function(s, c) { return s + (c.view_count || 0); }, 0);
      return { vods: (vods && vods.length) || 0, clips: (clips && clips.length) || 0, totalViews: totalViews, highlights: (highlights && highlights.length) || 0 };
    },
    enabled: !!(user && user.id),
  });
  var stats = statsQuery.data || null;

  var myVODsQuery = useQuery({
    queryKey: ['myVODs', (user && user.id)],
    queryFn: function() { return base44.entities.VODVideo.filter({ creator_id: user.id }); },
    enabled: !!(user && user.id),
  });
  var myVODs = myVODsQuery.data || [];

  var TABS = [
    { id: 'library',    icon: <Film className="w-3.5 h-3.5" />,     label: 'Library' },
    { id: 'recordings', icon: <Archive className="w-3.5 h-3.5" />,  label: 'Recordings' },
    { id: 'chapters',   icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Chapters' },
    { id: 'trim',       icon: <Scissors className="w-3.5 h-3.5" />, label: 'Trim' },
    { id: 'clips',      icon: <Scissors className="w-3.5 h-3.5" />, label: 'Clip' },
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
            { label: 'VODs', value: (stats && stats.vods) || 0, color: GOLD },
            { label: 'Clips', value: (stats && stats.clips) || 0, color: '#D4854A' },
            { label: 'AI Highlights', value: (stats && stats.highlights) || 0, color: '#6DBF7E' },
            { label: 'Total Views', value: ((stats && stats.totalViews) || 0).toLocaleString(), color: GOLD },
          ].map(function(stat) {
            var label = stat.label; var value = stat.value; var color = stat.color;
            return (
            <div key={label} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.08)' }}>
              <p className="text-2xl font-black" style={{ color, fontFamily: 'Orbitron, monospace' }}>{value}</p>
              <p className="text-[10px] font-black uppercase mt-0.5" style={{ ...T, color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
            );
          })}
        </div>

      {/* Tab nav */}
      <div className="flex gap-0 border-b sticky top-0 z-10 overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(212,175,55,0.1)', background: 'rgba(10,7,16,0.97)', backdropFilter: 'blur(12px)' }}>
        {TABS.map(function(t) { return (
          <button key={t.id} onClick={function() { setActiveTab(t.id); }}
            className="flex items-center gap-1.5 flex-1 min-w-[80px] py-3 text-[11px] font-black uppercase transition-all border-b-2"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              color: activeTab === t.id ? G : 'rgba(255,255,255,0.3)',
              borderBottomColor: activeTab === t.id ? G : 'transparent',
              background: activeTab === t.id ? 'rgba(212,175,55,0.05)' : 'transparent',
            }}>
            <span className="mx-auto flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        ); })}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {activeTab === 'library' && (user && user.id) && (
          <div className="space-y-4">
            <VODLibraryComponent creatorId={user.id} />
            {myVODs.map(v => (
              <VODCard
                key={v.id}
                vod={v}
                onEdit={function() { setSelectedForEdit(v); setEditTitle(v.title || ''); setEditDesc(v.description || ''); }}
                onTrim={function() { setSelectedForTrim(v); }}
                onChapters={function() { setSelectedForChapters(v); }}
                onPublish={function() {
                  base44.entities.VODVideo.update(v.id, { status: 'published' })
                    .then(function() { queryClient.invalidateQueries({ queryKey: ['myVODs', (user && user.id)] }); })
                    .catch(function() {});
                }}
              />
            ))}
            {selectedForEdit && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 14, padding: 20, marginTop: 8 }}>
                <p className="text-sm font-black mb-4" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>Edit VOD</p>
                <input
                  value={editTitle}
                  onChange={function(e) { setEditTitle(e.target.value); }}
                  placeholder="Title"
                  className="w-full mb-3 px-3 py-2 rounded-lg text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
                  maxLength={150}
                />
                <textarea
                  value={editDesc}
                  onChange={function(e) { setEditDesc(e.target.value); }}
                  placeholder="Description"
                  rows={3}
                  className="w-full mb-4 px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
                  maxLength={1000}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={function() { setSelectedForEdit(null); }} style={{ padding: '6px 16px', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  <button
                    disabled={editSaving}
                    onClick={function() {
                      setEditSaving(true);
                      base44.entities.VODVideo.update(selectedForEdit.id, { title: editTitle, description: editDesc })
                        .then(function() { queryClient.invalidateQueries({ queryKey: ['myVODs', (user && user.id)] }); setSelectedForEdit(null); })
                        .catch(function() {})
                        .finally(function() { setEditSaving(false); });
                    }}
                    style={{ padding: '6px 16px', borderRadius: 8, background: G, color: '#000', fontSize: 12, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.6 : 1, border: 'none' }}
                  >{editSaving ? 'Saving…' : 'Save'}</button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'recordings' && (user && user.id) && <RecordingManager userId={user.id} />}

        {activeTab === 'chapters' && (user && user.id) && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForChapters} onSelect={setSelectedForChapters} placeholder="Pick a VOD to edit chapters…" />
            {selectedForChapters
              ? <ChapterEditor video={selectedForChapters} onSave={function() { setSelectedForChapters(null); }} onCancel={function() { setSelectedForChapters(null); }} />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a video above to edit its chapters</p>
            }
          </div>
        )}

        {activeTab === 'trim' && (user && user.id) && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForTrim} onSelect={setSelectedForTrim} placeholder="Pick a VOD to trim…" />
            {selectedForTrim
              ? <VODTrimEditor video={selectedForTrim} onSave={function() { setSelectedForTrim(null); }} onCancel={function() { setSelectedForTrim(null); }} />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a video above to trim it</p>
            }
          </div>
        )}

        {activeTab === 'clips' && (user && user.id) && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForClips} onSelect={setSelectedForClips} placeholder="Pick a recording to clip…" />
            {selectedForClips
              ? <ClipCreatorVOD
                  streamSessionId={selectedForClips.id}
                  roomId={selectedForClips.room_id || selectedForClips.id}
                  creatorId={user.id}
                  onClipCreated={function() {}}
                />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a recording above to create a clip</p>
            }
          </div>
        )}

        {activeTab === 'highlights' && (user && user.id) && (
          <div>
            <VODPicker vods={myVODs} selected={selectedForHighlights} onSelect={setSelectedForHighlights} placeholder="Pick a recording to generate highlights…" />
            {selectedForHighlights
              ? <AIHighlightGenerator recording={selectedForHighlights} />
              : <p className="text-white/40 text-sm text-center py-16" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Select a video to generate AI highlights</p>
            }
          </div>
        )}
      </div>
      {/* Studio VODs */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ borderRadius: 14, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(8,11,24,0.95)', padding: '12px 14px' }}>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(176,102,204,0.7)', marginBottom: 10 }}>🎬 Studio VODs</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { emoji: '🎬', label: 'Micro Drama', sub: 'Episode archive', color: '#7B2D8B', page: 'EpisodeSeries' },
              { emoji: '🎵', label: 'AI Music', sub: 'Session recordings', color: '#C9A84C', page: 'AIMusic' },
              { emoji: '🎙', label: 'Podcast', sub: 'Full episodes', color: '#00A8E8', page: 'PodcastStudio' },
            ].map(function(s) {
              return (
                <Link key={s.page} to={createPageUrl(s.page)} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: 10, padding: '10px 8px', background: s.color + '0f', border: '1px solid ' + s.color + '28', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{s.label}</p>
                    <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.65)' }}>🎥 Create your own drama series</p>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, color: '#B066CC' }}>Creator Studio →</span>
            </div>
          </Link>
        </div>
      </div>

      <SwanAIRecommendations roomId={activeRoomId} currentLayout="vod" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      {/* Creator Studios */}
      <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
        <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
            { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
            { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
          ].map(function(s) {
            return (
              <Link key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
            🎬 Launch Episode Creator Studio →
          </div>
        </Link>
      </div>
      <BackgroundCustomizer />
    </div>
  </div>
  );
}