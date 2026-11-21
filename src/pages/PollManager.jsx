import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import WatchPartyPoll from '../components/watchparty/WatchPartyPoll';
import LivePoll from '../components/live/LivePoll';
import EnhancedPollingSystem from '../components/live/EnhancedPollingSystem';
import SpotlightBanner from '../components/community/SpotlightBanner';
import InteractivePollingSystem from '../components/live/InteractivePollingSystem';
import PollCard from '../components/community/PollCard';
import LivePollOverlay from '../components/live/LivePollOverlay';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import ShareToSocial from '../components/social/ShareToSocial';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import ShopDashboard from '../components/merch/ShopDashboard';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CreatorBridge from '../components/social/CreatorBridge';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import CollaborationMatcher from '../components/social/CollaborationMatcher';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
var lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

var categories = {
  quick: '⚡ Quick', engagement: '🎯 Engagement', decision: '🤔 Decision', feedback: '💬 Feedback', custom: '✨ Custom',
};

export default function PollManager() {
  var [showForm, setShowForm] = useState(false);
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [formData, setFormData] = useState({ name: '', question: '', options: ['', ''], timeout_seconds: 60, allow_re_vote: false, category: 'custom' });
  var queryClient = useQueryClient();

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (user && user.id) }).then(r => r[0] || null),
    enabled: !!(user && user.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  var { data: templates } = useQuery({
    queryKey: ['pollTemplates', (user && user.id)],
    queryFn: () => user ? base44.entities.PollTemplate.filter({ creator_id: user.id }) : Promise.resolve([]),
    enabled: !!user,
  });

  var createTemplateMutation = useMutation({
    mutationFn: (data) => {
      if (!(user && user.id)) throw new Error('Not authenticated');
      return base44.entities.PollTemplate.create({ ...data, creator_id: user.id });
    },
    onError: () => toast.error('Failed to create template.'),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['pollTemplates', (user && user.id)] });
      setFormData({ name: '', question: '', options: ['', ''], timeout_seconds: 60, allow_re_vote: false, category: 'custom' });
      setShowForm(false);
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: `Created poll template: ${(template && template.name) || (template && template.question) || 'Poll'}`,
        }).catch(() => {});
      }
    },
  });

  var deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.PollTemplate.delete(id),
    onError: () => toast.error('Failed to delete template.'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pollTemplates', (user && user.id)] }),
  });
  var handleAddOption = () => setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
  var handleRemoveOption = (idx) => setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  var handleOptionChange = (idx, value) => setFormData(prev => ({ ...prev, options: prev.options.map((opt, i) => i === idx ? value : opt) }));

  var handleSubmit = () => {
    if (!formData.name || !formData.question || formData.options.some(o => !o)) { toast.error('Please fill in all fields'); return; }
    createTemplateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>Poll Templates</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Create reusable poll templates for your streams</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* Create form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <h2 className="font-black text-sm text-white mb-2" style={T}>New Poll Template</h2>
            <label style={lbl}>Template Name</label>
            <input placeholder="e.g., Quick Yes/No" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inp} maxLength={60} />
            <label style={lbl}>Poll Question</label>
            <input placeholder="What would you like to ask?" value={formData.question} onChange={e => setFormData(p => ({ ...p, question: e.target.value }))} style={inp} maxLength={200} />
            <label style={lbl}>Options</label>
            <div className="space-y-2">
              {formData.options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input placeholder={`Option ${idx + 1}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} style={{ ...inp, flex: 1 }} maxLength={100} />
                  {formData.options.length > 2 && (
                    <button onClick={() => handleRemoveOption(idx)}
                      className="px-3 rounded-lg" style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', cursor: 'pointer' }}>
                      <Trash2 className="w-4 h-4" style={{ color: '#C0392B' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleAddOption}
              className="mt-2 flex items-center gap-1.5 text-xs font-black uppercase"
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 0' }}>
              <Plus className="w-3.5 h-3.5" /> Add Option
            </button>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label style={lbl}>Timeout (seconds)</label>
                <input type="number" min="0" max="3600" value={formData.timeout_seconds}
                  onChange={e => setFormData(p => ({ ...p, timeout_seconds: parseInt(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(categories).map(([key, label]) => (
                    <button key={key} onClick={() => setFormData(p => ({ ...p, category: key }))}
                      style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${formData.category === key ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: formData.category === key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.category === key ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-3">
              <input type="checkbox" checked={formData.allow_re_vote} onChange={e => setFormData(p => ({ ...p, allow_re_vote: e.target.checked }))} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Allow users to re-vote</span>
            </label>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg font-black uppercase text-xs"
                style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={createTemplateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
                style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: createTemplateMutation.isPending ? 'not-allowed' : 'pointer', opacity: createTemplateMutation.isPending ? 0.6 : 1 }}>
                <Save className="w-4 h-4" /> Save Template
              </button>
            </div>
          </motion.div>
        )}

        {/* Templates grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates && templates.map(template => (
            <motion.div key={template.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 rounded-2xl" style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-black text-sm text-white" style={T}>{template.name}</h3>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase mt-1 inline-block"
                    style={{ ...T, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#7B5DA6' }}>
                    {categories[template.category]}
                  </span>
                </div>
                <button onClick={() => deleteTemplateMutation.mutate(template.id)}
                  className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)', cursor: 'pointer' }}>
                  <Trash2 className="w-4 h-4" style={{ color: '#C0392B' }} />
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{template.question}</p>
              <div className="space-y-1 mb-3">
                {template.options.map((opt, idx) => (
                  <div key={idx} className="text-xs flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                    {opt}
                  </div>
                ))}
              </div>
              <div className="text-xs space-y-1 border-t pt-2" style={{ color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>⏱ {template.timeout_seconds}s timeout</div>
                {template.allow_re_vote && <div>🔄 Re-vote allowed</div>}
              </div>
            </motion.div>
          ))}
        </div>

        {(templates || []).length === 0 && !showForm && (
          <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <p className="text-sm mb-4" style={T}>No templates yet. Create your first one!</p>
          </div>
        )}

        {user && (
          <div className="mt-6 space-y-4">
            <LivePoll roomId={activeRoomId} isHost={true} />
            <WatchPartyPoll partyId={activeRoomId} roomId={activeRoomId} currentUser={user} isHost={true} />
          </div>
        )}

        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <EnhancedPollingSystem roomId={activeRoomId} hostId={(user && user.id)} isHost={true} />
          <InteractivePollingSystem roomId={activeRoomId} isHost={true} currentUser={user} />
          <PollCard poll={null} />
          <LivePollOverlay roomId={activeRoomId} currentUser={user} isHost={true} />
          <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0 24px' }}>
          {[
            { label: '🔴 Go Live',          href: 'GoLive'           },
            { label: '🎬 Broadcast Studio', href: 'BroadcastStudio'  },
            { label: '🎙️ Audio Room',       href: 'AudioRoom'        },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <StreamGoals isHost={true} />
        <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
      </div>
      <SwanAIRecommendations roomId={activeRoomId} currentLayout="default" viewerCount={(activeRoom && activeRoom.viewer_count) || 0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={activeRoomId} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={activeRoomId} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={(activeRoom && activeRoom.viewer_count) || 0} peakViewers={(activeRoom && activeRoom.peak_viewers) || 0} />
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
  );
}