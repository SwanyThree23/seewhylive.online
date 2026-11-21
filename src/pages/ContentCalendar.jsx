import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Radio, Bell, Users, Mail, Trophy, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, addDays, isSameDay, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import StreamGoals from '../components/live/StreamGoals';
import { useStreamGoalMetrics } from '../hooks/useStreamGoalMetrics';
import AIHighlightGenerator from '../components/content/AIHighlightGenerator';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import SpotlightBanner from '../components/community/SpotlightBanner';
import AutomatedHighlightReels from '../components/streaming/AutomatedHighlightReels';
import ShareToSocial from '../components/social/ShareToSocial';
import ContentRecommendations from '../components/social/ContentRecommendations';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import StreamAnalyticsDashboard from '../components/streaming/StreamAnalyticsDashboard';
import PreStreamCountdown from '../components/live/PreStreamCountdown';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';

var BG = '#080B18';
var GOLD = '#D4AF37';
var CRIMSON = '#800020';
var T = { fontFamily: 'Barlow Condensed, sans-serif' };
var inp = { width: '100%', padding: '10px 14px', background: 'rgba(8,11,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
var lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

var STATUS_STYLE = {
  draft:      { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' },
  scheduled:  { bg: 'rgba(74,138,122,0.1)',    border: 'rgba(74,138,122,0.3)',    color: '#4A8A7A' },
  published:  { bg: 'rgba(109,191,126,0.1)',    border: 'rgba(109,191,126,0.3)',    color: '#6DBF7E' },
  cancelled:  { bg: 'rgba(192,57,43,0.1)',   border: 'rgba(192,57,43,0.3)',   color: '#C0392B' },
};

function getTypeIcon(type) {
  switch (type) {
    case 'room': return <Radio className="w-4 h-4" />;
    case 'event': return <Users className="w-4 h-4" />;
    case 'announcement': return <Bell className="w-4 h-4" />;
    case 'newsletter': return <Mail className="w-4 h-4" />;
    case 'challenge': return <Trophy className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
}

var FILTERS = ['all', 'today', 'week', 'month'];

export default function ContentCalendarPage() {
  var [dateFilter, setDateFilter] = useState('all');
  var [showCreate, setShowCreate] = useState(false);
  var [formData, setFormData] = useState({ content_type: 'room', title: '', description: '', scheduled_for: new Date().toISOString(), recurrence: 'none' });
  var queryClient = useQueryClient();

  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  var { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', (user && user.id)],
    queryFn: () => base44.entities.Room.filter({ host_id: (user && user.id), status: 'live' }).then(r => r[0] || null),
    enabled: !!(user && user.id),
    refetchInterval: 30000,
  });
  var activeRoomId = (activeRoom && activeRoom.id) || null;
  var goalMetrics = useStreamGoalMetrics((user && user.id) || null, activeRoomId);
  var { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', (user && user.id)],
    queryFn: () => base44.entities.Community.filter({ owner_id: (user && user.id) }).then(r => r[0] || null),
    enabled: !!(user && user.id),
  });
  var userCommunityId = (userCommunity && userCommunity.id) || null;

  var { data: scheduledContent = [] } = useQuery({
    queryKey: ['scheduled-content', (user && user.id)],
    queryFn: () => base44.entities.ScheduledContent.filter({ creator_id: (user && user.id) }, 'scheduled_for'),
    enabled: !!user,
  });

  var createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledContent.create({ ...data, creator_id: user.id, status: 'scheduled' }),
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content'] });
      setShowCreate(false);
      setFormData({ content_type: 'room', title: '', description: '', scheduled_for: new Date().toISOString(), recurrence: 'none' });
      toast.success('Content scheduled!');
      if ((user && user.id)) {
        base44.entities.Activity.create({
          user_id: user.id,
          type: 'stream_scheduled',
          title: `Scheduled content: ${(content && content.title) || 'Content'}`,
        }).catch(() => {});
      }
    },
    onError: () => toast.error('Action failed.'),
  });

  var updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ScheduledContent.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-content'] }),
    onError: () => toast.error('Action failed.'),
  });

  var filteredContent = scheduledContent.filter(item => {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var d = new Date(item.scheduled_for);
    if (dateFilter === 'today') return isSameDay(d, today);
    if (dateFilter === 'week') return d >= today && d <= addDays(today, 7);
    if (dateFilter === 'month') return d >= startOfMonth(now) && d <= endOfMonth(now);
    return true;
  });

  var set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl font-black text-white leading-none" style={T}>Content Calendar</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Schedule and manage your content</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
          style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setDateFilter(f)}
              className="px-3 py-1.5 rounded-lg font-black uppercase text-[10px] transition-all capitalize"
              style={{ ...T, background: dateFilter === f ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dateFilter === f ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`, color: dateFilter === f ? GOLD : 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-black uppercase text-sm mb-4" style={T}>No content scheduled for this period</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-xs mx-auto"
              style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer', ...T }}>
              <Plus className="w-3.5 h-3.5" /> Schedule Your First Content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item) => {
              var scheduledDate = new Date(item.scheduled_for);
              var isUpcoming = scheduledDate > new Date();
              var ss = STATUS_STYLE[item.status] || STATUS_STYLE.draft;
              var todayHighlight = isToday(scheduledDate);
              return (
                <div key={item.id} className="rounded-2xl p-4 space-y-3"
                  style={{ background: 'rgba(8,11,24,0.9)', border: `1px solid ${todayHighlight ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.08)'}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {getTypeIcon(item.content_type)}
                      <span className="text-[10px] font-black uppercase" style={T}>{item.content_type}</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ ...T, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-white" style={T}>{item.title}</h3>
                    {item.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Calendar className="w-3 h-3" />
                    <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
                    <span>·</span>
                    <span>{format(scheduledDate, 'h:mm a')}</span>
                  </div>

                  {item.recurrence !== 'none' && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ ...T, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD }}>
                      Repeats {item.recurrence}
                    </span>
                  )}

                  {item.status === 'scheduled' && isUpcoming && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'published' })}
                        className="flex-1 py-1.5 rounded-lg font-black uppercase text-[10px]"
                        style={{ ...T, background: 'rgba(109,191,126,0.1)', border: '1px solid rgba(109,191,126,0.25)', color: '#6DBF7E', cursor: 'pointer' }}>
                        Publish
                      </button>
                      <button onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'cancelled' })}
                        className="flex-1 py-1.5 rounded-lg font-black uppercase text-[10px]"
                        style={{ ...T, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', color: '#C0392B', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'rgba(8,11,24,0.98)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="font-black text-sm text-white" style={T}>Schedule Content</span>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-1">
              <label style={lbl}>Content Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['room','event','announcement','newsletter','challenge'].map(t => (
                  <button key={t} onClick={() => set('content_type', t)}
                    style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${formData.content_type === t ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: formData.content_type === t ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.content_type === t ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>

              <label style={lbl}>Title</label>
              <input style={inp} value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Enter title" maxLength={100} />

              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, height: 72, resize: 'none' }} value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Enter description" maxLength={500} />

              <label style={lbl}>Schedule For</label>
              <input type="datetime-local" style={inp}
                value={format(new Date(formData.scheduled_for), "yyyy-MM-dd'T'HH:mm")}
                onChange={e => set('scheduled_for', new Date(e.target.value).toISOString())} />

              <label style={lbl}>Recurrence</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['none','daily','weekly','monthly'].map(r => (
                  <button key={r} onClick={() => set('recurrence', r)}
                    style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${formData.recurrence === r ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: formData.recurrence === r ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.recurrence === r ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    {r.charAt(0).toUpperCase()+r.slice(1)}
                  </button>
                ))}
              </div>

              <button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.title}
                className="w-full py-3 rounded-xl font-black uppercase text-sm mt-4"
                style={{ background: !formData.title || createMutation.isPending ? 'rgba(128,0,32,0.3)' : `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: !formData.title || createMutation.isPending ? 'rgba(255,255,255,0.3)' : '#000', cursor: !formData.title || createMutation.isPending ? 'default' : 'pointer', ...T }}>
                {createMutation.isPending ? 'Scheduling…' : 'Schedule Content'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(user && user.id) && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StreamGoals isHost={true} currentTips={goalMetrics.tipTotal} currentSubs={goalMetrics.subCount} currentViewers={(activeRoom && activeRoom.viewer_count) || 0} />
          <AIHighlightGenerator creatorId={user.id} />
        </div>
      )}

      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AutomatedHighlightReels streamSession={activeRoom || null} />
        <ShareToSocial content={{ url: window.location.href, title: 'Content Calendar — SeeWhy LIVE' }} />
        <ContentRecommendations />
        <SwanAIRecommendations roomId={activeRoomId} currentLayout="default" viewerCount={0} />
        {(user && user.id) && <MilestoneAlerts creatorId={user.id} />}
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <CollaborationMatcher />
        <StreamAnalyticsDashboard roomId={activeRoomId} isHost={true} isLive={!!activeRoomId} />
        {user && <PreStreamCountdown room={activeRoom || null} currentUser={user} onGoLive={() => {}} />}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        <OnlineUsersGrid compact maxVisible={10} />
        <CollaborationMatcher />
        <StreamAnalyticsDashboard roomId={activeRoomId} isHost={true} isLive={!!activeRoomId} />
        {user && <PreStreamCountdown room={activeRoom || null} currentUser={user} onGoLive={() => {}} />}
      </div>

      {/* Studio Quick-Start */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ borderRadius: 14, border: '1px solid rgba(201,168,76,0.18)', background: 'rgba(8,11,24,0.95)' }}>
          <div style={{ padding: '12px 14px 6px' }}>
            <p style={{ fontSize: 10, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(212,175,55,0.6)', marginBottom: 10 }}>📽 Studio Content</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, paddingBottom: 12 }}>
              {[
                { emoji: '🎬', label: 'Micro Drama', sub: 'Episode planner', color: '#7B2D8B', page: 'EpisodeCreatorStudio' },
                { emoji: '🎵', label: 'AI Music', sub: 'Generate & schedule', color: '#C9A84C', page: 'AIMusic' },
                { emoji: '🎙', label: 'Podcast', sub: 'Record & release', color: '#00A8E8', page: 'PodcastStudio' },
              ].map(function(s) {
                return (
                  <Link key={s.page} to={createPageUrl(s.page)} style={{ textDecoration: 'none' }}>
                    <div style={{ borderRadius: 10, padding: '10px 8px', background: s.color + '0f', border: '1px solid ' + s.color + '28', textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                      <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: '#fff', lineHeight: 1.1 }}>{s.label}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'Barlow Condensed, sans-serif' }}>{s.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 28px' }}>
        {[
          { label: '📅 Stream Scheduler', href: 'StreamScheduler' },
          { label: '📰 Newsletter Hub',   href: 'NewsletterHub'   },
          { label: '📊 Analytics',        href: 'Analytics'       },
          { label: '🎬 Micro Drama',      href: 'EpisodeCreatorStudio' },
          { label: '🔴 Go Live',          href: 'GoLive'          },
        ].map(item => (
          <Link key={item.href} to={createPageUrl(item.href)} style={{ textDecoration: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: GOLD, cursor: 'pointer' }}>{item.label}</span>
          </Link>
        ))}
      </div>
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
    </div>
  );
}
