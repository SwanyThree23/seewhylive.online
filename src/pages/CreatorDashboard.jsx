import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Radio, Calendar, Scissors, Send, ArrowRight, DollarSign, Users, Bot, Zap, Mic2 } from 'lucide-react';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import EarningsBreakdown from '@/components/dashboard/EarningsBreakdown';
import AudienceInsights from '@/components/dashboard/AudienceInsights';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
import RewardShopEditor from '../components/loyalty/RewardShopEditor';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import TierSubscribeCard from '../components/subscriptions/TierSubscribeCard';
import TierEditor from '../components/subscriptions/TierEditor';
import QuickActionPanel from '../components/shared/QuickActionPanel';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
const G       = '#D4AF37';
const BG      = '#080B18';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const GREEN   = '#6DBF7E';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

function fmtDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: recentRooms = [] } = useQuery({
    queryKey: ['creatorRooms', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id }, '-created_date', 5),
    enabled: !!user?.id,
  });

  const { data: activeSubs = [] } = useQuery({
    queryKey: ['creatorActiveSubs', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ creator_id: user?.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const { data: recentTips = [] } = useQuery({
    queryKey: ['creatorTips', user?.id],
    queryFn: () => base44.entities.Tip.list('-created_date', 10),
    enabled: !!user?.id,
  });

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const tipsThisWeek = recentTips
    .filter(t => t.creator_id === user?.id && new Date(t.created_date).getTime() > oneWeekAgo)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const quickActions = [
    {
      icon: Radio,
      label: 'Go Live',
      href: createPageUrl('GoLive'),
      gradient: `linear-gradient(135deg, ${CRIMSON}40, ${CRIMSON}10)`,
      border: `${CRIMSON}50`,
      iconColor: '#ff6b8a',
    },
    {
      icon: Calendar,
      label: 'Schedule',
      href: createPageUrl('StreamScheduler'),
      gradient: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.06))',
      border: 'rgba(212,175,55,0.45)',
      iconColor: '#7B5DA6',
    },
    {
      icon: Send,
      label: 'Newsletter',
      href: createPageUrl('Newsletter'),
      gradient: 'linear-gradient(135deg, rgba(74,138,122,0.2), rgba(74,138,122,0.05))',
      border: 'rgba(74,138,122,0.4)',
      iconColor: '#4A8A7A',
    },
    {
      icon: Scissors,
      label: 'Clips',
      href: createPageUrl('ClipsLibrary'),
      gradient: `linear-gradient(135deg, ${G}25, ${G}06)`,
      border: `${G}45`,
      iconColor: G,
    },
    {
      icon: Bot,
      label: 'Joyce AI',
      href: createPageUrl('JoyceAI'),
      gradient: `linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))`,
      border: 'rgba(212,175,55,0.35)',
      iconColor: G,
    },
    {
      icon: Zap,
      label: 'INS Forge',
      href: createPageUrl('INSForge'),
      gradient: `linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))`,
      border: 'rgba(245,158,11,0.35)',
      iconColor: '#F59E0B',
    },
    {
      icon: Mic2,
      label: 'Podcast',
      href: createPageUrl('PodcastStudio'),
      gradient: `linear-gradient(135deg, rgba(74,138,122,0.15), rgba(74,138,122,0.04))`,
      border: 'rgba(74,138,122,0.3)',
      iconColor: '#4A8A7A',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" style={{ color: G }} />
              <h1 className="text-3xl font-black" style={{ color: G, ...T }}>
                Creator Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {user?.id && (
                <>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                    style={{ background: `${G}12`, border: `1px solid ${G}30`, color: G, ...T }}>
                    <Users className="w-3 h-3" />
                    {activeSubs.length} Subscribers
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                    style={{ background: `${GREEN}12`, border: `1px solid ${GREEN}30`, color: GREEN, ...T }}>
                    <DollarSign className="w-3 h-3" />
                    ${tipsThisWeek.toFixed(0)} Tips
                  </span>
                </>
              )}
              <div className="flex gap-1">
                {['7d', '30d', '365d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className="px-3 py-1.5 rounded text-xs font-black transition-all"
                    style={{
                      background: timeRange === range ? `${G}20` : 'rgba(255,255,255,0.03)',
                      color: timeRange === range ? G : 'rgba(255,255,255,0.5)',
                      border: timeRange === range ? `1px solid ${G}40` : '1px solid rgba(212,175,55,0.12)',
                      ...T,
                    }}>
                    {range === '7d' ? '7D' : range === '30d' ? '30D' : '1Y'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm" style={T}>Analytics, earnings, and audience insights</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] uppercase tracking-widest font-black mb-3"
            style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(({ icon: Icon, label, href, gradient, border, iconColor }) => (
              <Link key={href} to={href}>
                <div className="flex items-center gap-3 px-4 rounded-2xl transition-all hover:brightness-110 cursor-pointer"
                  style={{
                    height: 80,
                    background: gradient,
                    border: `1px solid ${border}`,
                    borderLeft: `4px solid ${border}`,
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <span className="font-black text-sm text-white flex-1" style={T}>{label}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {user?.id && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AnalyticsOverview creatorId={user.id} timeRange={timeRange} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <EarningsBreakdown creatorId={user.id} timeRange={timeRange} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.1)' }}>
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4" style={{ color: PINK }} />
                        <p className="font-black text-[11px] uppercase" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                          Recent Streams
                        </p>
                      </div>
                      <Link to={createPageUrl('GoLive')}>
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-all"
                          style={{ background: `${CRIMSON}18`, border: `1px solid ${CRIMSON}35`, color: '#ff9999', ...T }}>
                          + Go Live
                        </span>
                      </Link>
                    </div>
                    <div className="p-3">
                      {recentRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Radio className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.1)' }} />
                          <p className="text-xs font-black uppercase" style={{ color: 'rgba(255,255,255,0.2)', ...T }}>
                            No streams yet
                          </p>
                          <Link to={createPageUrl('GoLive')}>
                            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl cursor-pointer"
                              style={{ background: `${G}10`, border: `1px solid ${G}30`, color: G, ...T }}>
                              Go Live to start
                            </span>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {recentRooms.map(room => {
                            const isLive = room.status === 'live';
                            return (
                              <div key={room.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: isLive ? PINK : 'rgba(255,255,255,0.2)' }} />
                                <span className="flex-1 font-black text-[12px] text-white truncate" style={T}>
                                  {room.title || 'Untitled Stream'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-black uppercase shrink-0"
                                  style={{
                                    background: isLive ? `${PINK}18` : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${isLive ? `${PINK}35` : 'rgba(255,255,255,0.1)'}`,
                                    color: isLive ? PINK : 'rgba(255,255,255,0.4)',
                                    ...T,
                                  }}>
                                  {isLive ? 'LIVE' : room.status || 'ended'}
                                </span>
                                {room.viewer_count != null && (
                                  <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.35)', ...T }}>
                                    {room.viewer_count} viewers
                                  </span>
                                )}
                                {room.duration != null && (
                                  <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>
                                    {fmtDuration(room.duration)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <AudienceInsights creatorId={user.id} timeRange={timeRange} />
              </motion.div>
            </div>
          </>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to={createPageUrl('ContentCalendar')}>
            <div className="w-full flex items-center justify-between px-6 py-5 rounded-2xl cursor-pointer transition-all hover:brightness-110"
              style={{
                background: `${G}08`,
                border: `1px solid ${G}35`,
                borderLeft: `4px solid ${G}`,
              }}>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: G }} />
                <div>
                  <p className="font-black text-base text-white" style={T}>Plan your content</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', ...T }}>
                    Schedule streams, set themes, and manage your content calendar
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0" style={{ color: G }} />
            </div>
          </Link>
        </motion.div>

      </div>
      <SwanAIRecommendations roomId={null} currentLayout="creator" viewerCount={activeSubs.length} />
      <MilestoneAlerts userId={user?.id} roomId={null} />
      {user?.id && <AlertConfig creatorId={user.id} />}
      {user?.id && <ShopDashboard creatorId={user.id} />}
      {user?.id && <SubscriptionCard tier={'basic'} price={4.99} benefits={[]} communityId={null} creatorId={user?.id} isSubscribed={false} />}
      {user?.id && <TierSubscribeCard tier={null} currentSub={null} userId={user.id} creatorId={user?.id} isHighlighted={false} />}
      <TierEditor open={false} onClose={() => {}} creatorId={user?.id} existing={null} />
      <RewardShopEditor creatorId={user?.id} />
      <QuickActionPanel isOpen={false} onClose={() => {}} />
      <OnboardingFlow isOpen={false} onClose={() => {}} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={user || null} />
      <StreamGoals isHost={true} currentTips={Math.floor(tipsThisWeek)} currentSubs={activeSubs.length} currentViewers={activeSubs.length} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={user?.id} roomId={null} currentUser={user} />
      <HostAlertCenter />
      <ViewerCount count={activeSubs.length} peakViewers={activeSubs.length} />
      <BackgroundCustomizer />
    </div>
  );
}
