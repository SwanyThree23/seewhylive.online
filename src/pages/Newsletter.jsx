import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Sparkles, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import ShareToSocial from '../components/social/ShareToSocial';
import SpotlightBanner from '../components/community/SpotlightBanner';
import EarningsBreakdown from '../components/dashboard/EarningsBreakdown';
import AudienceInsights from '../components/dashboard/AudienceInsights';
import ContentRecommendations from '../components/social/ContentRecommendations';
import FollowButton from '../components/shared/FollowButton';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ChallengeLeaderboard from '../components/community/ChallengeLeaderboard';
import AnnouncementPanel from '../components/community/AnnouncementPanel';
import 'react-quill/dist/quill.snow.css';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import AlertConfig from '../components/live/AlertConfig';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import CreatorBridge from '../components/social/CreatorBridge';
import HostAlertCenter from '../components/live/HostAlertCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import ShopDashboard from '../components/merch/ShopDashboard';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import ViewerCount from '../components/live/ViewerCount';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
var lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

function DarkCard({ title, desc, children, style = {} }) {
  return (
    <div style={{ background: 'rgba(8,11,24,0.9)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 20, ...style }}>
      {(title || desc) && (
        <div className="mb-4">
          {title && <p className="font-black text-sm text-white" style={T}>{title}</p>}
          {desc && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export default function NewsletterPage() {
  var queryClient = useQueryClient();
  var [title, setTitle] = useState('');
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);

  var [content, setContent] = useState('');
  var [previewText, setPreviewText] = useState('');
  var [generating, setGenerating] = useState(false);
  var [selectedCommunity, setSelectedCommunity] = useState('');

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

  var { data: communities = [] } = useQuery({
    queryKey: ['userCommunities', (user && user.id)],
    queryFn: async () => {
      var memberships = await base44.entities.CommunityMember.filter({ user_id: (user && user.id), role: { $in: ['owner', 'admin'] } });
      var ids = memberships.map(m => m.community_id);
      if (ids.length === 0) return [];
      return await base44.entities.Community.filter({ id: { $in: ids } });
    },
    enabled: !!user,
  });

  var { data: newsletters = [] } = useQuery({
    queryKey: ['newsletters', selectedCommunity],
    queryFn: () => base44.entities.Newsletter.filter({ community_id: selectedCommunity }, '-created_date'),
    enabled: !!selectedCommunity,
  });

  var createMutation = useMutation({
    mutationFn: (data) => base44.entities.Newsletter.create(data),
    onSuccess: (newsletter) => {
      toast.success('Newsletter created!');
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      setTitle(''); setContent(''); setPreviewText('');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'milestone',
          title: `Published newsletter: ${(newsletter && newsletter.title) || 'Newsletter'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  var generateWithAI = async () => {
    if (!selectedCommunity) { toast.error('Please select a community first'); return; }
    setGenerating(true);
    try {
      var rooms = await base44.entities.Room.filter({ community_id: selectedCommunity, status: 'ended' }, '-ended_at', 5);
      var result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging newsletter for a streaming community. Include:\n1. A catchy subject line\n2. Summary of recent live streams (${rooms.length} streams)\n3. Community highlights\n4. Call-to-action to join upcoming streams\n\nKeep it professional, engaging, and under 500 words.`,
        response_json_schema: { type: 'object', properties: { subject: { type: 'string' }, preview: { type: 'string' }, content: { type: 'string' } } }
      });
      setTitle(result.subject);
      setPreviewText(result.preview);
      setContent(result.content);
      toast.success('Newsletter generated!');
    } catch {
      toast.error('Failed to generate newsletter');
    } finally {
      setGenerating(false);
    }
  };

  var handleSave = () => {
    if (!selectedCommunity) { toast.error('Please select a community'); return; }
    if (!title || !content) { toast.error('Title and content are required'); return; }
    createMutation.mutate({ community_id: selectedCommunity, title, content, preview_text: previewText, status: 'draft', source_type: generating ? 'ai_generated' : 'manual' });
  };

  var sentCount = newsletters.filter(n => n.status === 'sent').length;
  var draftCount = newsletters.filter(n => n.status === 'draft').length;
  var avgOpenRate = newsletters.length > 0 ? (newsletters.reduce((a, n) => a + (n.open_rate || 0), 0) / newsletters.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between flex-wrap gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5" style={{ color: GOLD }} />
          <h1 className="text-xl font-black text-white leading-none" style={T}>Newsletter Manager</h1>
        </div>
        <button onClick={generateWithAI} disabled={generating || !selectedCommunity}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
          style={{ background: generating || !selectedCommunity ? 'rgba(212,175,55,0.04)' : 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: generating || !selectedCommunity ? 'default' : 'pointer', opacity: generating || !selectedCommunity ? 0.5 : 1, ...T }}>
          <Sparkles className="w-3.5 h-3.5" />
          {generating ? 'Generating…' : 'AI Generate'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <DarkCard title="Create Newsletter" desc="Engage your community with email updates">
              <label style={lbl}>Community</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button onClick={() => setSelectedCommunity('')}
                  style={{ padding: '6px 14px', borderRadius: 99, fontSize: 11, border: `1px solid ${!selectedCommunity ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: !selectedCommunity ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: !selectedCommunity ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                  None
                </button>
                {communities.map(c => (
                  <button key={c.id} onClick={() => setSelectedCommunity(c.id)}
                    style={{ padding: '6px 14px', borderRadius: 99, fontSize: 11, border: `1px solid ${selectedCommunity === c.id ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: selectedCommunity === c.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: selectedCommunity === c.id ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    {c.name}
                  </button>
                ))}
              </div>

              <label style={lbl}>Subject Line</label>
              <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Your weekly community update…" />

              <label style={lbl}>Preview Text</label>
              <input style={inp} value={previewText} onChange={e => setPreviewText(e.target.value)} placeholder="What subscribers see before opening…" />

              <label style={lbl}>Content</label>
              {/* Quill editor with dark wrapper */}
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <style>{`.ql-toolbar{background:rgba(8,11,24,0.9)!important;border-color:rgba(255,255,255,0.1)!important}.ql-container{background:rgba(8,11,24,0.85)!important;border-color:rgba(255,255,255,0.1)!important;color:#fff!important;font-family:'Barlow Condensed',sans-serif}.ql-editor{min-height:240px;color:#fff}.ql-stroke{stroke:rgba(255,255,255,0.5)!important}.ql-fill{fill:rgba(255,255,255,0.5)!important}.ql-picker-label{color:rgba(255,255,255,0.5)!important}`}</style>
                <ReactQuill value={content} onChange={setContent} />
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={handleSave} disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-xs"
                  style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
                  <Send className="w-3.5 h-3.5" />
                  {createMutation.isPending ? 'Saving…' : 'Save Draft'}
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-xs"
                  style={{ background: 'rgba(74,138,122,0.08)', border: '1px solid rgba(74,138,122,0.2)', color: '#4A8A7A', cursor: 'pointer', ...T }}>
                  <Calendar className="w-3.5 h-3.5" /> Schedule
                </button>
              </div>
            </DarkCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <DarkCard title="Newsletter Stats">
              {[
                { label: 'Total Sent', value: sentCount },
                { label: 'Drafts', value: draftCount },
                { label: 'Avg Open Rate', value: `${avgOpenRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>{label}</span>
                  <span className="font-black text-sm" style={{ color: GOLD, fontFamily: 'Orbitron, monospace' }}>{value}</span>
                </div>
              ))}
            </DarkCard>

            <DarkCard title="Recent Newsletters">
              {newsletters.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.25)', ...T }}>No newsletters yet</p>
              ) : (
                <div className="space-y-2">
                  {newsletters.slice(0, 5).map(nl => (
                    <div key={nl.id} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-black text-xs text-white truncate" style={T}>{nl.title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(nl.created_date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase"
                        style={{ ...T, background: nl.status === 'sent' ? 'rgba(109,191,126,0.1)' : 'rgba(212,175,55,0.1)', border: `1px solid ${nl.status === 'sent' ? 'rgba(109,191,126,0.25)' : 'rgba(212,175,55,0.2)'}`, color: nl.status === 'sent' ? '#6DBF7E' : GOLD }}>
                        {nl.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DarkCard>
          </div>
        </div>

        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        <ShareToSocial content={{ url: window.location.href, title: 'Newsletter — SeeWhy LIVE' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <EarningsBreakdown creatorId={(user && user.id)} />
          <AudienceInsights creatorId={(user && user.id)} />
          <ContentRecommendations />
          <FollowButton targetUserId={null} targetUserName="" />
          <MilestoneAlerts creatorId={(user && user.id)} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0 28px' }}>
          {[
            { label: '📰 Newsletter Hub',   href: 'NewsletterHub'   },
            { label: '📅 Content Calendar', href: 'ContentCalendar' },
            { label: '👥 Communities',      href: 'Communities'     },
            { label: '📊 Dashboard',        href: 'Dashboard'       },
          ].map(item => (
            <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
              <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', cursor: 'pointer' }}>{item.label}</span>
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <OnlineUsersGrid compact maxVisible={10} />
          <CollaborationMatcher />
          <ChallengeLeaderboard challengeId={null} />
          <AnnouncementPanel communityId={userCommunityId} userId={(user && user.id)} />
        </div>
      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={(user && user.id)} roomId={null} />
      {(user && user.id) && <AlertConfig creatorId={user.id} />}
      {(user && user.id) && <ShopDashboard creatorId={user.id} />}
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={(user && user.id) || null} roomId={null} currentUser={user || null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
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
