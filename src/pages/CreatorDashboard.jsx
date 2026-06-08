import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate as fmAnimate } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Radio, Calendar, Scissors, Send, ArrowRight, DollarSign, Users, Bot, Zap, Mic2, Flame, Target } from 'lucide-react';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import EarningsBreakdown from '@/components/dashboard/EarningsBreakdown';
import AudienceInsights from '@/components/dashboard/AudienceInsights';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const G       = '#D4AF37';
const BG      = '#080B18';
const CRIMSON = '#800020';
const PINK    = '#C0392B';
const GREEN   = '#6DBF7E';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

// Counts up from 0 to `value` on mount
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, v => prefix + v.toFixed(decimals) + suffix);
  useEffect(() => {
    const ctrl = fmAnimate(mv, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => ctrl.stop();
  }, [value]);
  return <motion.span>{rounded}</motion.span>;
}

const QUICK_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const QUICK_ITEM = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } },
};

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

  // Streak: count consecutive days with at least one stream
  const streakDays = useMemo(() => {
    if (!recentRooms.length) return 0;
    const days = new Set(recentRooms.map(r => new Date(r.created_date).toDateString()));
    let streak = 0;
    const d = new Date();
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }, [recentRooms]);

  // Today's earnings: tips from today
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const earningsToday = recentTips
    .filter(t => t.creator_id === user?.id && new Date(t.created_date) >= todayStart)
    .reduce((s, t) => s + (t.amount || 0), 0);

  // Monthly goal: percentage toward $500/month
  const MONTHLY_GOAL = 500;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const earningsThisMonth = recentTips
    .filter(t => t.creator_id === user?.id && new Date(t.created_date) >= monthStart)
    .reduce((s, t) => s + (t.amount || 0), 0);
  const goalPct = Math.min(100, Math.round((earningsThisMonth / MONTHLY_GOAL) * 100));

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
      iconColor: '#a78bfa',
    },
    {
      icon: Send,
      label: 'Newsletter',
      href: createPageUrl('Newsletter'),
      gradient: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
      border: 'rgba(212,175,55,0.4)',
      iconColor: '#D4AF37',
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
      gradient: `linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.04))`,
      border: 'rgba(212,175,55,0.3)',
      iconColor: '#D4AF37',
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
                    <AnimatedNumber value={activeSubs.length} /> Subscribers
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                    style={{ background: `${GREEN}12`, border: `1px solid ${GREEN}30`, color: GREEN, ...T }}>
                    <DollarSign className="w-3 h-3" />
                    $<AnimatedNumber value={tipsThisWeek} decimals={0} /> Tips
                  </span>
                </>
              )}
              <div className="flex gap-1">
                {['7d', '30d', '365d'].map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className="px-3 py-1.5 rounded text-xs font-black"
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.06 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    style={{
                      background: timeRange === range ? `${G}20` : 'rgba(255,255,255,0.03)',
                      color: timeRange === range ? G : 'rgba(255,255,255,0.5)',
                      border: timeRange === range ? `1px solid ${G}40` : '1px solid rgba(212,175,55,0.12)',
                      cursor: 'pointer',
                      ...T,
                    }}>
                    {range === '7d' ? '7D' : range === '30d' ? '30D' : '1Y'}
                  </motion.button>
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
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
            variants={QUICK_VARIANTS} initial="hidden" animate="show">
            {quickActions.map(({ icon: Icon, label, href, gradient, border, iconColor }) => (
              <motion.div key={href} variants={QUICK_ITEM}
                whileHover={{ scale: 1.03, brightness: 1.1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
                <Link to={href}>
                  <div className="flex items-center gap-3 px-4 rounded-2xl cursor-pointer"
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
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {user?.id && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-3 gap-3">
              {/* Streak */}
              <div className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ background: streakDays >= 3 ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)', border: streakDays >= 3 ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
                <Flame className="w-4 h-4 mb-1" style={{ color: streakDays >= 3 ? '#FF4500' : 'rgba(255,255,255,0.2)' }} />
                <span className="text-2xl font-black" style={{ color: streakDays >= 3 ? G : 'rgba(255,255,255,0.5)', ...T }}>
                  {streakDays}d
                </span>
                <span className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Streak</span>
                {streakDays >= 3 && <span className="text-[9px]" style={{ color: '#FF4500' }}>🔥 On a roll!</span>}
              </div>

              {/* Today's earnings */}
              <div className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ background: earningsToday > 0 ? 'rgba(109,191,126,0.07)' : 'rgba(255,255,255,0.03)', border: earningsToday > 0 ? '1px solid rgba(109,191,126,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
                <DollarSign className="w-4 h-4 mb-1" style={{ color: earningsToday > 0 ? GREEN : 'rgba(255,255,255,0.2)' }} />
                <span className="text-2xl font-black" style={{ color: earningsToday > 0 ? GREEN : 'rgba(255,255,255,0.5)', ...T }}>
                  $<AnimatedNumber value={earningsToday} decimals={0} />
                </span>
                <span className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Today</span>
              </div>

              {/* Monthly goal */}
              <div className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Target className="w-4 h-4 mb-1" style={{ color: goalPct >= 100 ? G : 'rgba(255,255,255,0.3)' }} />
                <span className="text-2xl font-black" style={{ color: goalPct >= 100 ? G : 'rgba(255,255,255,0.5)', ...T }}>
                  {goalPct}%
                </span>
                <span className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.3)', ...T }}>Monthly Goal</span>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: goalPct + '%', background: goalPct >= 100 ? G : 'rgba(212,175,55,0.5)', borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {user?.id && (
          <>
            {/* Milestone alerts — celebrates hitting follower/revenue/stream goals */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <MilestoneAlerts creatorId={user.id} />
            </motion.div>

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
                        <motion.div className="space-y-1"
                          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                          initial="hidden" animate="show">
                          {recentRooms.map(room => {
                            const isLive = room.status === 'live';
                            return (
                              <motion.div key={room.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: 'spring', damping: 22, stiffness: 280 } } }}
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
                              </motion.div>
                            );
                          })}
                        </motion.div>
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
    </div>
  );
}
